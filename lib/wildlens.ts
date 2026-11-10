export interface AnimalResult {
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

export interface Sighting extends AnimalResult {
  id: string;
  savedAt: number;
}

const CURRENT_KEY = "wildlens_result";
const SIGHTINGS_KEY = "wildlens_sightings";
const MAX_SIGHTINGS = 12;

/* ---------- Storage (every call is safe if storage is blocked or full) ---------- */

export function saveCurrent(result: AnimalResult) {
  try {
    sessionStorage.setItem(CURRENT_KEY, JSON.stringify(result));
  } catch {
    /* storage unavailable */
  }
}

export function loadCurrent(): AnimalResult | null {
  try {
    const raw = sessionStorage.getItem(CURRENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AnimalResult;
    return parsed && parsed.found && parsed.commonName ? parsed : null;
  } catch {
    return null;
  }
}

export function loadSightings(): Sighting[] {
  try {
    const raw = localStorage.getItem(SIGHTINGS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as Sighting[]) : [];
  } catch {
    return [];
  }
}

export function addSighting(result: AnimalResult, thumbnail: string) {
  const sighting: Sighting = {
    ...result,
    image: thumbnail,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    savedAt: Date.now(),
  };
  let list = [sighting, ...loadSightings()].slice(0, MAX_SIGHTINGS);
  // If storage is full, drop the oldest sightings until it fits.
  while (list.length > 0) {
    try {
      localStorage.setItem(SIGHTINGS_KEY, JSON.stringify(list));
      return;
    } catch {
      list = list.slice(0, -1);
    }
  }
}

/* ---------- Photo preparation ---------- */

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("unreadable image"));
    };
    img.src = url;
  });
}

function toJpeg(img: HTMLImageElement, maxEdge: number, quality: number): string {
  const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

/**
 * Phone photos are often 5–12 MB, which is too large to upload and store.
 * Resize to a JPEG that is still plenty for identification, plus a small
 * copy for the recent sightings list.
 */
export async function preparePhoto(file: File): Promise<{ full: string; thumbnail: string }> {
  const img = await loadImage(file);
  return {
    full: toJpeg(img, 1568, 0.85),
    thumbnail: toJpeg(img, 720, 0.72),
  };
}

/* ---------- Conservation status (IUCN Red List scale) ---------- */

export interface StatusStep {
  code: string;
  name: string;
  color: string;
  onColor: string;
  meaning: string;
}

/** Ordered from least to most at risk, in the Red List's own colors. */
export const STATUS_SCALE: StatusStep[] = [
  { code: "LC", name: "Least Concern", color: "#60C659", onColor: "#10210f", meaning: "Widespread and not currently at risk." },
  { code: "NT", name: "Near Threatened", color: "#CCE226", onColor: "#1f2405", meaning: "Close to qualifying as threatened in the near future." },
  { code: "VU", name: "Vulnerable", color: "#F9E814", onColor: "#262300", meaning: "Faces a high risk of extinction in the wild." },
  { code: "EN", name: "Endangered", color: "#FC7F3F", onColor: "#2b1002", meaning: "Faces a very high risk of extinction in the wild." },
  { code: "CR", name: "Critically Endangered", color: "#D81E05", onColor: "#ffffff", meaning: "Faces an extremely high risk of extinction in the wild." },
  { code: "EW", name: "Extinct in the Wild", color: "#542344", onColor: "#ffffff", meaning: "Survives only in captivity or cultivation." },
  { code: "EX", name: "Extinct", color: "#000000", onColor: "#ffffff", meaning: "No individuals are known to survive." },
];

export function findStatus(status: string): StatusStep | null {
  const wanted = (status ?? "").trim().toLowerCase();
  return STATUS_SCALE.find((s) => s.name.toLowerCase() === wanted) ?? null;
}

export function capitalize(text: string): string {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}
