/// <reference types="google.maps" />
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { useEffect, useMemo, useState } from "react";
import { buildSmartDirectionsUrl } from "./maps-links";

export type GeocodeInput = { id: string; query: string; lat?: number; lng?: number };
export type GeocodeResult = { id: string; lat: number; lng: number };

// ─── Persistent + in-memory cache ──────────────────────────────────────
const CACHE_KEY = "confetti:geocode-cache:v1";
const CACHE_MAX = 500; // keep small to avoid localStorage bloat

type CacheValue = { lat: number; lng: number };

function loadCache(): Map<string, CacheValue> {
  if (typeof window === "undefined") return new Map();
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return new Map();
    const obj = JSON.parse(raw) as Record<string, CacheValue>;
    return new Map(Object.entries(obj));
  } catch {
    return new Map();
  }
}

const cache = loadCache();

function persist() {
  if (typeof window === "undefined") return;
  try {
    // Trim to the most-recent CACHE_MAX entries (Map preserves insertion order)
    const entries = Array.from(cache.entries());
    const trimmed = entries.slice(Math.max(0, entries.length - CACHE_MAX));
    localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(trimmed)));
  } catch {
    /* quota / disabled */
  }
}

function setCache(query: string, value: CacheValue) {
  cache.set(query.toLowerCase().trim(), value);
  persist();
}

function getCache(query: string): CacheValue | undefined {
  return cache.get(query.toLowerCase().trim());
}

/**
 * Batched geocoder with persistent localStorage cache.
 * - Uses provided lat/lng directly when present (no network call).
 * - Otherwise consults the persistent cache.
 * - Only calls the Google Geocoder for genuinely-new queries.
 */
export function useGeocodedPoints(inputs: GeocodeInput[]) {
  const geocoding = useMapsLibrary("geocoding");

  // Synchronously seed from cache + provided coords so the map can render
  // immediately on first paint instead of waiting for the effect to run.
  const seeded = useMemo<GeocodeResult[]>(() => {
    const out: GeocodeResult[] = [];
    for (const i of inputs) {
      if (typeof i.lat === "number" && typeof i.lng === "number") {
        out.push({ id: i.id, lat: i.lat, lng: i.lng });
        continue;
      }
      const hit = getCache(i.query);
      if (hit) out.push({ id: i.id, ...hit });
    }
    return out;
  }, [inputs]);

  const [points, setPoints] = useState<GeocodeResult[]>(seeded);

  const key = useMemo(
    () => inputs.map((i) => `${i.id}|${i.query}|${i.lat ?? ""}|${i.lng ?? ""}`).join("::"),
    [inputs]
  );

  useEffect(() => {
    setPoints(seeded);
    if (!geocoding || inputs.length === 0) return;

    // Skip network entirely if every input already resolved synchronously.
    const needsLookup = inputs.some(
      (i) => !(typeof i.lat === "number" && typeof i.lng === "number") && !getCache(i.query)
    );
    if (!needsLookup) return;

    let cancelled = false;
    const geocoder = new geocoding.Geocoder();

    (async () => {
      const results: GeocodeResult[] = [];
      for (const i of inputs) {
        if (typeof i.lat === "number" && typeof i.lng === "number") {
          results.push({ id: i.id, lat: i.lat, lng: i.lng });
          continue;
        }
        const cached = getCache(i.query);
        if (cached) {
          results.push({ id: i.id, ...cached });
          continue;
        }
        try {
          const r = await geocoder.geocode({ address: i.query });
          const loc = r.results[0]?.geometry.location;
          if (loc) {
            const value = { lat: loc.lat(), lng: loc.lng() };
            setCache(i.query, value);
            results.push({ id: i.id, ...value });
          }
        } catch {
          /* skip failed geocode */
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


/**
 * Build a directions URL for desktop/native handoff.
 * Picks Apple Maps on iOS/macOS, Google Maps elsewhere.
 */
export function buildDirectionsUrl(
  points: { lat: number; lng: number }[],
  travelMode: "walking" | "driving" | "transit" | "bicycling" = "walking",
) {
  // re-export through smart picker so all callers benefit from device detection
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { buildSmartDirectionsUrl } = require("./maps-links") as typeof import("./maps-links");
  return buildSmartDirectionsUrl(points, travelMode);
}
