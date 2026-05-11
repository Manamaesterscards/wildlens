"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const RangeMap = dynamic(() => import("@/components/RangeMap"), { ssr: false });

interface AnimalResult {
  found: boolean;
  commonName: string;
  scientificName: string;
  category: string;
  conservationStatus: string;
  size: string;
  weight: string;
  lifespan: string;
  habitat: string;
  diet: string;
  behavior: string;
  description: string;
  funFact: string;
  inatTaxonId: number | null;
  voiceDescription?: string;
  image: string;
}

const statusColor: Record<string, string> = {
  "Least Concern": "#4caf50",
  "Near Threatened": "#ffeb3b",
  "Vulnerable": "#ff9800",
  "Endangered": "#f44336",
  "Critically Endangered": "#b71c1c",
  "Extinct in the Wild": "#7b1fa2",
  "Extinct": "#212121",
};

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl p-3 flex flex-col gap-1" style={{ background: "#1a2e1a" }}>
      <span className="text-xs opacity-50 uppercase tracking-wider">{label}</span>
      <span className="text-sm font-semibold" style={{ color: "#e8f5e9" }}>{value}</span>
    </div>
  );
}

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<AnimalResult | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("wildlens_result");
    if (!raw) { router.replace("/"); return; }
    try { setResult(JSON.parse(raw)); } catch { router.replace("/"); }
  }, [router]);

  if (!result) return null;

  const statusCol = statusColor[result.conservationStatus] ?? "#a5d6a7";
  const categoryIcons: Record<string, string> = {
    bird: "🐦", mammal: "🦁", reptile: "🦎", amphibian: "🐸",
    fish: "🐟", insect: "🐛", arachnid: "🕷️", crustacean: "🦀",
    mollusk: "🐚", pet: "🐾", other: "🐾",
  };
  const categoryIcon = categoryIcons[result.category] ?? "🐾";

  return (
    <main className="flex flex-col flex-1 max-w-lg mx-auto w-full px-4 py-6 gap-5">
      {/* Back */}
      <button
        onClick={() => router.push("/")}
        className="self-start text-sm flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity"
      >
        ← New scan
      </button>

      {/* Photo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={result.image}
        alt={result.commonName}
        className="w-full rounded-2xl object-cover"
        style={{ maxHeight: 280 }}
      />

      {/* Name + category */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{categoryIcon}</span>
            <h1 className="text-2xl font-bold" style={{ color: "#e8f5e9" }}>{result.commonName}</h1>
          </div>
          <p className="text-sm italic opacity-60 mt-0.5">{result.scientificName}</p>
        </div>
        <span
          className="text-xs font-semibold px-2 py-1 rounded-full shrink-0 mt-1"
          style={{ background: statusCol + "22", color: statusCol, border: `1px solid ${statusCol}44` }}
        >
          {result.conservationStatus}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm leading-relaxed opacity-80">{result.description}</p>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Size" value={result.size} />
        <StatCard label="Weight" value={result.weight} />
        <StatCard label="Lifespan" value={result.lifespan} />
        <StatCard label="Category" value={result.category.charAt(0).toUpperCase() + result.category.slice(1)} />
      </div>

      {/* Habitat & Diet */}
      <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: "#1a2e1a" }}>
        <div>
          <p className="text-xs opacity-50 uppercase tracking-wider mb-1">Habitat</p>
          <p className="text-sm">{result.habitat}</p>
        </div>
        <div>
          <p className="text-xs opacity-50 uppercase tracking-wider mb-1">Diet</p>
          <p className="text-sm">{result.diet}</p>
        </div>
        <div>
          <p className="text-xs opacity-50 uppercase tracking-wider mb-1">Behavior</p>
          <p className="text-sm">{result.behavior}</p>
        </div>
        {result.voiceDescription && (
          <div>
            <p className="text-xs opacity-50 uppercase tracking-wider mb-1">Voice</p>
            <p className="text-sm">{result.voiceDescription}</p>
          </div>
        )}
      </div>

      {/* Fun fact */}
      <div
        className="rounded-xl p-4 flex gap-3 items-start"
        style={{ background: "#1b3a1b", border: "1px solid #2e5a2e" }}
      >
        <span className="text-xl shrink-0">💡</span>
        <p className="text-sm leading-relaxed">{result.funFact}</p>
      </div>

      {/* Range map */}
      <div>
        <h2 className="text-sm font-semibold mb-2 uppercase tracking-wider opacity-60">Range Map</h2>
        {result.inatTaxonId ? (
          <RangeMap taxonId={result.inatTaxonId} commonName={result.commonName} />
        ) : (
          <div
            className="rounded-xl flex items-center justify-center text-sm opacity-40"
            style={{ height: 160, background: "#1a2e1a" }}
          >
            Range map unavailable for this species
          </div>
        )}
      </div>

      {/* iNaturalist link */}
      {result.inatTaxonId && (
        <a
          href={`https://www.inaturalist.org/taxa/${result.inatTaxonId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-center text-xs py-3 rounded-xl font-medium transition-opacity hover:opacity-80"
          style={{ background: "#1a2e1a", color: "#81c784", border: "1px solid #2e4d2e" }}
        >
          View on iNaturalist →
        </a>
      )}

      <div className="pb-8" />
    </main>
  );
}
