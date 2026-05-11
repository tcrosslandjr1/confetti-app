/// <reference types="google.maps" />
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { useEffect, useMemo, useState } from "react";

export type GeocodeInput = { id: string; query: string; lat?: number; lng?: number };
export type GeocodeResult = { id: string; lat: number; lng: number };

const cache = new Map<string, { lat: number; lng: number }>();

/**
 * Batched, in-memory cached geocoder. Skips entries that already carry lat/lng.
 * Re-runs only when the query identity actually changes.
 */
export function useGeocodedPoints(inputs: GeocodeInput[]) {
  const geocoding = useMapsLibrary("geocoding");
  const [points, setPoints] = useState<GeocodeResult[]>([]);

  const key = useMemo(
    () => inputs.map((i) => `${i.id}|${i.query}|${i.lat ?? ""}|${i.lng ?? ""}`).join("::"),
    [inputs]
  );

  useEffect(() => {
    if (!geocoding || inputs.length === 0) {
      setPoints([]);
      return;
    }
    let cancelled = false;
    const geocoder = new geocoding.Geocoder();

    (async () => {
      const results: GeocodeResult[] = [];
      for (const i of inputs) {
        if (typeof i.lat === "number" && typeof i.lng === "number") {
          results.push({ id: i.id, lat: i.lat, lng: i.lng });
          continue;
        }
        const cached = cache.get(i.query);
        if (cached) {
          results.push({ id: i.id, ...cached });
          continue;
        }
        try {
          const r = await geocoder.geocode({ address: i.query });
          const loc = r.results[0]?.geometry.location;
          if (loc) {
            const value = { lat: loc.lat(), lng: loc.lng() };
            cache.set(i.query, value);
            results.push({ id: i.id, ...value });
          }
        } catch {
          // skip failed geocode
        }
      }
      if (!cancelled) setPoints(results);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, geocoding]);

  return points;
}

/** Build a Google Maps directions URL for desktop/native handoff. */
export function buildDirectionsUrl(points: { lat: number; lng: number }[], travelMode: "walking" | "driving" | "transit" = "walking") {
  if (points.length === 0) return "https://www.google.com/maps";
  if (points.length === 1) {
    return `https://www.google.com/maps/search/?api=1&query=${points[0].lat},${points[0].lng}`;
  }
  const origin = `${points[0].lat},${points[0].lng}`;
  const destination = `${points[points.length - 1].lat},${points[points.length - 1].lng}`;
  const waypoints = points.slice(1, -1).map((p) => `${p.lat},${p.lng}`).join("|");
  const params = new URLSearchParams({
    api: "1",
    origin,
    destination,
    travelmode: travelMode,
  });
  if (waypoints) params.set("waypoints", waypoints);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
