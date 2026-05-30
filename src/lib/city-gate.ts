// City gate — DMV-first launch gating.
// Users within the DMV metro area get the full app.
// Everyone else sees a "Coming Soon" splash with waitlist signup.

import { getStoredLocation, requestUserLocationDetailed, type UserLocation } from "@/lib/location";
import { getSelectedCity, type City, CITIES } from "@/lib/cities";

// ─── DMV bounding ────────────────────────────────────────────────
// Center of DC + ~80 km radius covers DC, most of MD suburbs, and NOVA.
const DMV_CENTER = { lat: 38.9072, lng: -77.0369 };
const DMV_RADIUS_KM = 80;

// City slugs that count as "DMV"
const DMV_SLUGS = new Set(["dmv"]);

// Cities shown on the Coming Soon splash for voting
export const COMING_SOON_CITIES = CITIES.filter((c) =>
  ["nyc", "la", "mia", "atl", "chi", "hou"].includes(c.slug),
);

// ─── Helpers ─────────────────────────────────────────────────────

/** Haversine distance in km between two lat/lng points. */
function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function isLocationInDMV(loc: { lat: number; lng: number }): boolean {
  return haversineKm(loc, DMV_CENTER) <= DMV_RADIUS_KM;
}

// ─── Gate decision ───────────────────────────────────────────────

export type GateStatus =
  | { allowed: true }
  | { allowed: false; reason: "outside_dmv" | "no_location" };

const OVERRIDE_KEY = "concierge:city-gate-override";

/**
 * Check if the user should be allowed into the app.
 *
 * Priority order:
 * 1. URL param `?city=dmv` → always allow (dev/testing override, persisted)
 * 2. Manually selected city is DMV → allow
 * 3. Browser geolocation within DMV radius → allow
 * 4. No location available → block (show splash)
 * 5. Location outside DMV → block (show splash)
 */
export function checkCityGateSync(): GateStatus {
  if (typeof window === "undefined") return { allowed: true };

  // 1. Check persistent override (set via URL param)
  try {
    if (localStorage.getItem(OVERRIDE_KEY) === "dmv") {
      return { allowed: true };
    }
  } catch {
    /* ignore */
  }

  // 2. Check URL param override (first visit from a link)
  try {
    const params = new URLSearchParams(window.location.search);
    const cityParam = params.get("city");
    if (cityParam && DMV_SLUGS.has(cityParam.toLowerCase())) {
      localStorage.setItem(OVERRIDE_KEY, "dmv");
      return { allowed: true };
    }
  } catch {
    /* ignore */
  }

  // 3. Check selected city
  const selectedCity = getSelectedCity();
  if (selectedCity && DMV_SLUGS.has(selectedCity.slug)) {
    return { allowed: true };
  }

  // 4. Check stored geolocation
  const storedLoc = getStoredLocation();
  if (storedLoc && isLocationInDMV(storedLoc)) {
    return { allowed: true };
  }

  // 5. If we have a location but it's outside DMV
  if (storedLoc) {
    return { allowed: false, reason: "outside_dmv" };
  }

  // 6. No location yet — we'll need to request it async
  return { allowed: false, reason: "no_location" };
}

/**
 * Async version that attempts geolocation if not already stored.
 * Used on first load to try to resolve location before gating.
 */
export async function checkCityGateAsync(): Promise<GateStatus> {
  const sync = checkCityGateSync();
  if (sync.allowed) return sync;

  // Try to get location from browser
  const result = await requestUserLocationDetailed({
    enableHighAccuracy: false,
    timeout: 8000,
    maximumAge: 300_000, // 5 min cache
  });

  if (result.ok && isLocationInDMV(result.location)) {
    return { allowed: true };
  }

  if (result.ok) {
    return { allowed: false, reason: "outside_dmv" };
  }

  return { allowed: false, reason: "no_location" };
}

/** Let a user bypass the gate (e.g. they picked DMV from the splash). */
export function overrideCityGate() {
  try {
    localStorage.setItem(OVERRIDE_KEY, "dmv");
  } catch {
    /* ignore */
  }
}

/** Clear the gate override (for testing). */
export function clearCityGateOverride() {
  try {
    localStorage.removeItem(OVERRIDE_KEY);
  } catch {
    /* ignore */
  }
}
