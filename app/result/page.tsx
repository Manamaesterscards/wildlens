"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { STATUS_SCALE, capitalize, findStatus, loadCurrent, type AnimalResult } from "@/lib/wildlens";

const RangeMap = dynamic(() => import("@/components/RangeMap"), { ssr: false });

function Fact({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="fact">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function ConservationStatus({ status }: { status: string }) {
  const current = findStatus(status);
  return (
    <section className="entry-section" aria-labelledby="status-heading">
      <h2 id="status-heading" className="section-heading">
        Conservation status
      </h2>
      <p className="status-name">{status || "Not evaluated"}</p>
      <p className="status-meaning">
        {current ? current.meaning : "Not assessed for the Red List, which is usual for pets and domestic breeds."}
      </p>
      <ol className="status-scale" aria-hidden="true">
        {STATUS_SCALE.map((s) => (
          <li
            key={s.code}
            className="status-step"
            data-current={current?.code === s.code ? "true" : undefined}
            style={{ "--step": s.color, "--on-step": s.onColor } as React.CSSProperties}
          >
            {s.code}
          </li>
        ))}
      </ol>
      <p className="status-ends" aria-hidden="true">
        <span>Lower risk</span>
        <span>Extinct</span>
      </p>
    </section>
  );
}

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<AnimalResult | null>(null);

  useEffect(() => {
    const current = loadCurrent();
    if (current) setResult(current);
    else router.replace("/");
  }, [router]);

  if (!result) return null;

  return (
    <main className="entry">
      <nav className="entry-nav">
        <button type="button" className="back" onClick={() => router.push("/")}>
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M10 3 5 8l5 5" />
          </svg>
          Identify another
        </button>
        <span className="wordmark">WildLens</span>
      </nav>

      <figure className="plate">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={result.image} alt={`Your photo of a ${result.commonName}`} />
      </figure>

      <article className="entry-body">
        <header className="entry-header">
          <h1 className="entry-title">{result.commonName}</h1>
          <p className="entry-sci">{result.scientificName}</p>
        </header>

        <p className="entry-description">{result.description}</p>

        <dl className="facts">
          <Fact label="Group" value={capitalize(result.category)} />
          <Fact label="Size" value={result.size} />
          <Fact label="Weight" value={result.weight} />
          <Fact label="Lifespan" value={result.lifespan} />
          <Fact label="Habitat" value={result.habitat} />
          <Fact label="Diet" value={result.diet} />
          <Fact label="Behavior" value={result.behavior} />
          <Fact label="Voice" value={result.voiceDescription} />
        </dl>

        {result.funFact && (
          <section className="entry-section" aria-labelledby="fact-heading">
            <h2 id="fact-heading" className="section-heading">
              Worth knowing
            </h2>
            <p className="worth-knowing">{result.funFact}</p>
          </section>
        )}

        <ConservationStatus status={result.conservationStatus} />

        <section className="entry-section" aria-labelledby="range-heading">
          <h2 id="range-heading" className="section-heading">
            Where it has been seen
          </h2>
          {result.inatTaxonId ? (
            <>
              <RangeMap taxonId={result.inatTaxonId} />
              <p className="map-caption">
                Shaded areas are sightings logged on iNaturalist.{" "}
                <a
                  href={`https://www.inaturalist.org/taxa/${result.inatTaxonId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  See the {result.commonName} on iNaturalist
                </a>
              </p>
            </>
          ) : (
            <p className="map-empty">No range map is available for this animal.</p>
          )}
        </section>

        <button type="button" className="btn btn-primary entry-again" onClick={() => router.push("/")}>
          Identify another animal
        </button>
      </article>
    </main>
  );
}
