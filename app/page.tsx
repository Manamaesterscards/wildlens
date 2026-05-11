"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        setPreview(dataUrl);
        setLoading(true);
        try {
          const res = await fetch("/api/identify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: dataUrl }),
          });
          if (!res.ok) throw new Error("Identification failed");
          const data = await res.json();
          sessionStorage.setItem("wildlens_result", JSON.stringify({ ...data, image: dataUrl }));
          router.push("/result");
        } catch {
          setError("Could not identify the animal. Please try a clearer photo.");
          setLoading(false);
          setPreview(null);
        }
      };
      reader.readAsDataURL(file);
    },
    [router]
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  };

  return (
    <main className="flex flex-col flex-1 items-center justify-center px-4 py-12 gap-8">
      {/* Header */}
      <div className="text-center">
        <div className="text-5xl mb-3">🦅</div>
        <h1 className="text-4xl font-bold tracking-tight" style={{ color: "var(--accent-light)" }}>
          WildLens
        </h1>
        <p className="mt-2 text-sm" style={{ color: "#a5d6a7" }}>
          Point at any animal for instant field guide details
        </p>
      </div>

      {/* Upload area */}
      <div
        className="w-full max-w-sm rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-4 p-10 transition-colors cursor-pointer"
        style={{ borderColor: "#2e4d2e", background: "var(--card)" }}
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
      >
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-green-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm" style={{ color: "#a5d6a7" }}>Identifying animal…</p>
          </div>
        ) : preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Preview" className="rounded-xl w-full object-cover max-h-64" />
        ) : (
          <>
            <div className="text-5xl">📷</div>
            <p className="text-center text-sm font-medium" style={{ color: "#a5d6a7" }}>
              Tap to upload a photo
              <br />
              <span className="text-xs opacity-60">or drag &amp; drop</span>
            </p>
          </>
        )}
      </div>

      {/* Buttons */}
      {!loading && (
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <button
            className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90 active:scale-95"
            style={{ background: "var(--accent)", color: "#0f1a0f" }}
            onClick={() => cameraInputRef.current?.click()}
          >
            Open Camera
          </button>
          <button
            className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90 active:scale-95"
            style={{ background: "#1a2e1a", color: "var(--accent-light)", border: "1px solid #2e4d2e" }}
            onClick={() => fileInputRef.current?.click()}
          >
            Choose from Library
          </button>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400 text-center max-w-xs">{error}</p>
      )}

      {/* Hidden inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />

      <p className="text-xs opacity-40 text-center max-w-xs">
        Birds · Mammals · Reptiles · Amphibians · Fish · Insects · Pets & more
      </p>
    </main>
  );
}
