"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addSighting,
  loadSightings,
  preparePhoto,
  saveCurrent,
  type AnimalResult,
  type Sighting,
} from "@/lib/wildlens";

type Phase =
  | { kind: "idle" }
  | { kind: "working"; photo: string | null }
  | { kind: "error"; photo: string | null; message: string };

const STEPS = [
  "Looking at shape and markings",
  "Comparing against known species",
  "Writing the field guide entry",
];

export default function Home() {
  const router = useRouter();
  const libraryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef<AbortController | null>(null);

  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [step, setStep] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [sightings, setSightings] = useState<Sighting[]>([]);

  useEffect(() => {
    setSightings(loadSightings());
  }, []);

  // Walk through the progress messages while a photo is being identified.
  const working = phase.kind === "working";
  useEffect(() => {
    if (!working) return;
    setStep(0);
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 2400);
    return () => clearInterval(timer);
  }, [working]);

  const identify = useCallback(
    async (file: File) => {
      requestRef.current?.abort();
      const controller = new AbortController();
      requestRef.current = controller;
      setPhase({ kind: "working", photo: null });

      let photo: { full: string; thumbnail: string };
      try {
        photo = await preparePhoto(file);
      } catch {
        if (controller.signal.aborted) return;
        setPhase({
          kind: "error",
          photo: null,
          message: "This browser can't open that file. Try a JPEG or PNG photo.",
        });
        return;
      }
      if (controller.signal.aborted) return;
      setPhase({ kind: "working", photo: photo.full });

      try {
        const res = await fetch("/api/identify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: photo.full }),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`Identify request failed: ${res.status}`);
        const data = await res.json();
        if (controller.signal.aborted) return;

        if (!data?.found || !data.commonName) {
          setPhase({
            kind: "error",
            photo: photo.full,
            message: "No animal found in this photo. Get closer, or try one where the animal is in focus.",
          });
          return;
        }

        const result: AnimalResult = { ...data, image: photo.full };
        saveCurrent(result);
        addSighting(result, photo.thumbnail);
        router.push("/result");
      } catch {
        if (controller.signal.aborted) return;
        setPhase({
          kind: "error",
          photo: photo.full,
          message: "The photo couldn't be identified. Check your connection and try again.",
        });
      }
    },
    [router]
  );

  const cancel = () => {
    requestRef.current?.abort();
    setPhase({ kind: "idle" });
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow choosing the same photo again
    if (file) identify(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (working) return;
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (file.type.startsWith("image/")) identify(file);
    else setPhase({ kind: "error", photo: null, message: "That file isn't a photo. Drop a JPEG or PNG image." });
  };

  const openSighting = (sighting: Sighting) => {
    saveCurrent(sighting);
    router.push("/result");
  };

  const photo = phase.kind === "idle" ? null : phase.photo;
  const retrying = phase.kind === "error";

  return (
    <main className="home">
      <p className="wordmark">WildLens</p>

      <div className="home-intro">
        <h1 className="home-title">What animal is that?</h1>
        <p className="lede">
          Take or choose a photo and get its field guide entry: name, size, habitat, and where in the world it lives.
        </p>
      </div>

      <div
        className="viewfinder"
        data-state={phase.kind}
        data-dragging={dragging ? "true" : undefined}
        onDrop={onDrop}
        onDragOver={(e) => {
          e.preventDefault();
          if (!working) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
      >
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="viewfinder-photo" src={photo} alt="Your photo" />
        )}

        {!photo && !working && (
          <button type="button" className="viewfinder-target" onClick={() => libraryInputRef.current?.click()}>
            <svg className="viewfinder-icon" viewBox="0 0 48 48" aria-hidden="true">
              <circle cx="24" cy="24" r="15" />
              <circle cx="24" cy="24" r="2.5" className="viewfinder-icon-dot" />
              <path d="M24 3v8M24 37v8M3 24h8M37 24h8" />
            </svg>
            <span className="viewfinder-label">Choose a photo</span>
            <span className="viewfinder-hint">or drop one here</span>
          </button>
        )}

        {working && (
          <>
            <span className="scanline" aria-hidden="true" />
            <p className="viewfinder-status" role="status">
              {photo ? STEPS[step] : "Opening photo"}…
            </p>
          </>
        )}

        <span className="corner corner-tl" aria-hidden="true" />
        <span className="corner corner-tr" aria-hidden="true" />
        <span className="corner corner-bl" aria-hidden="true" />
        <span className="corner corner-br" aria-hidden="true" />
      </div>

      <div className="home-actions">
        {phase.kind === "error" && (
          <p className="notice" role="alert">
            {phase.message}
          </p>
        )}

        {working ? (
          <button type="button" className="btn btn-secondary" onClick={cancel}>
            Cancel
          </button>
        ) : (
          <>
            <button type="button" className="btn btn-primary btn-camera" onClick={() => cameraInputRef.current?.click()}>
              {retrying ? "Take another photo" : "Take a photo"}
            </button>
            <button type="button" className="btn btn-secondary btn-library" onClick={() => libraryInputRef.current?.click()}>
              {retrying ? "Choose another photo" : "Choose from library"}
            </button>
          </>
        )}

        <p className="fineprint">Works with birds, mammals, reptiles, amphibians, fish, insects, and pets.</p>
      </div>

      {sightings.length > 0 && (
        <section className="sightings" aria-labelledby="sightings-heading">
          <h2 id="sightings-heading" className="section-heading">
            Recent sightings
          </h2>
          <ul className="sighting-list">
            {sightings.map((sighting) => (
              <li key={sighting.id}>
                <button type="button" className="sighting" onClick={() => openSighting(sighting)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={sighting.image} alt="" />
                  <span className="sighting-name">{sighting.commonName}</span>
                  <span className="sighting-sci">{sighting.scientificName}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <input ref={libraryInputRef} type="file" accept="image/*" hidden onChange={onFileChange} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" hidden onChange={onFileChange} />
    </main>
  );
}
