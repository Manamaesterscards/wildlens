"use client";

import { useEffect, useRef } from "react";

interface RangeMapProps {
  taxonId: number;
}

export default function RangeMap({ taxonId }: RangeMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<unknown>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Leaflet must be loaded client-side only
    import("leaflet").then((L) => {
      if (!mapRef.current || mapInstance.current) return;

      const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const base = dark ? "dark" : "light";
      const heat = dark ? "f4b81c" : "1f6f43";

      const map = L.default.map(mapRef.current, {
        center: [25, 0],
        zoom: 1,
        minZoom: 1,
        zoomControl: true,
        scrollWheelZoom: false,
        // On touch screens, leave one-finger drags for scrolling the page.
        dragging: !L.default.Browser.mobile,
      });

      mapInstance.current = map;

      L.default.tileLayer(
        `https://{s}.basemaps.cartocdn.com/${base}_nolabels/{z}/{x}/{y}{r}.png`,
        { attribution: "© OpenStreetMap © CARTO", subdomains: "abcd", maxZoom: 10 }
      ).addTo(map);

      // iNaturalist observation heatmap tiles
      L.default.tileLayer(
        `https://api.inaturalist.org/v1/colored_heatmap/{z}/{x}/{y}.png?taxon_id=${taxonId}&color=%23${heat}`,
        { attribution: "© iNaturalist", opacity: 0.85, maxZoom: 10 }
      ).addTo(map);

      // Country/border labels on top
      L.default.tileLayer(
        `https://{s}.basemaps.cartocdn.com/${base}_only_labels/{z}/{x}/{y}{r}.png`,
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

  return <div ref={mapRef} className="range-map" />;
}
