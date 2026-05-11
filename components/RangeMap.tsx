"use client";

import { useEffect, useRef } from "react";

interface RangeMapProps {
  taxonId: number;
  commonName: string;
}

export default function RangeMap({ taxonId, commonName }: RangeMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<unknown>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Leaflet must be loaded client-side only
    import("leaflet").then((L) => {
      if (!mapRef.current || mapInstance.current) return;

      const map = L.default.map(mapRef.current, {
        center: [30, -20],
        zoom: 2,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      mapInstance.current = map;

      // Dark base tiles
      L.default.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
        { attribution: "© OpenStreetMap © CARTO", subdomains: "abcd", maxZoom: 10 }
      ).addTo(map);

      // iNaturalist observation heatmap tiles
      L.default.tileLayer(
        `https://api.inaturalist.org/v1/colored_heatmap/{z}/{x}/{y}.png?taxon_id=${taxonId}&color=%234caf50`,
        { attribution: "© iNaturalist", opacity: 0.8, maxZoom: 10 }
      ).addTo(map);

      // Country/border labels on top
      L.default.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png",
        { attribution: "", subdomains: "abcd", maxZoom: 10 }
      ).addTo(map);
    });

    return () => {
      if (mapInstance.current) {
        (mapInstance.current as { remove: () => void }).remove();
        mapInstance.current = null;
      }
    };
  }, [taxonId]);

  return (
    <div className="w-full rounded-xl overflow-hidden" style={{ height: 240, background: "#1a2a1a" }}>
      <div ref={mapRef} style={{ height: "100%", width: "100%" }} />
      <p className="text-xs text-center mt-1 opacity-40">
        Observation range · {commonName} · iNaturalist
      </p>
    </div>
  );
}
