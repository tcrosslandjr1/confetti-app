// Travel-mode intelligence + deep-link helpers for the Boarding Pass / Confirmation.
// All pure utilities — no DOM access at module scope so they're SSR-safe.

export type LatLng = { lat: number; lng: number };

export type LegEstimate = {
  /** Approx walking minutes (5 km/h). */
  walkMin: number;
  /** Approx rideshare minutes (incl. ~2-3 min wait). */
  uberMin: number;
  /** Cheap heuristic fare range, USD. */
  uberCost: { low: number; high: number };
  /** Straight-line km. */
  km: number;
  /** Recommended mode given city travel intel + distance. */
  recommended: "walk" | "rideshare" | "transit";
};

const R = 6371; // km

function toRad(d: number) {
  return (d * Math.PI) / 180;
}

export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function estimateLeg(
  from: LatLng,
  to: LatLng,
  opts: { walkability?: "low" | "medium" | "high"; transit?: "low" | "medium" | "high" } = {},
): LegEstimate {
  const km = haversineKm(from, to);
  // Walking ~5 km/h, but real-world routes are ~1.3x straight line.
  const walkMin = Math.max(1, Math.round(((km * 1.3) / 5) * 60));
  // Urban driving ~22 km/h + 3 min wait.
  const uberMin = Math.max(3, Math.round(((km * 1.2) / 22) * 60) + 3);
  // Rough US rideshare: $4 base + $1.6/km, +25% surge band.
  const base = 4 + km * 1.6;
  const uberCost = { low: Math.max(7, Math.round(base)), high: Math.max(11, Math.round(base * 1.45)) };

  const walkCap = opts.walkability === "high" ? 18 : opts.walkability === "low" ? 8 : 12;
  let recommended: LegEstimate["recommended"] = "rideshare";
  if (walkMin <= walkCap) recommended = "walk";
  else if (opts.transit === "high" && km > 2) recommended = "transit";
  return { walkMin, uberMin, uberCost, km, recommended };
}

// ── Deep links ────────────────────────────────────────────────────

function fmtCoord(n: number) {
  return n.toFixed(6);
}

export function uberDeepLink(to: LatLng, label?: string): string {
  // Universal link works on iOS/Android/web. Falls back to uber.com if app not installed.
  const params = new URLSearchParams({
    action: "setPickup",
    "pickup": "my_location",
    "dropoff[latitude]": fmtCoord(to.lat),
    "dropoff[longitude]": fmtCoord(to.lng),
  });
  if (label) params.set("dropoff[nickname]", label);
  return `https://m.uber.com/ul/?${params.toString()}`;
}

export function uberXLDeepLink(to: LatLng, label?: string): string {
  return uberDeepLink(to, label) + "&product_id=uberxl";
}

export function lyftDeepLink(to: LatLng, label?: string): string {
  const params = new URLSearchParams({
    id: "lyft",
    pickup: "my_location",
    "destination[latitude]": fmtCoord(to.lat),
    "destination[longitude]": fmtCoord(to.lng),
  });
  if (label) params.set("destination[name]", label);
  return `https://lyft.com/ride?${params.toString()}`;
}

export function appleMapsDirections(to: LatLng, label?: string): string {
  const daddr = label ? `${label}@${fmtCoord(to.lat)},${fmtCoord(to.lng)}` : `${fmtCoord(to.lat)},${fmtCoord(to.lng)}`;
  return `https://maps.apple.com/?daddr=${encodeURIComponent(daddr)}&dirflg=d`;
}

export function googleMapsDirections(to: LatLng, label?: string): string {
  const dest = label ? `${label}` : `${fmtCoord(to.lat)},${fmtCoord(to.lng)}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}&destination_place_id=`;
}

/** Pick the right maps app based on user pref + UA fallback. */
export function preferredMapsLink(
  to: LatLng,
  label: string | undefined,
  pref: "apple" | "google" | "auto",
): string {
  let app: "apple" | "google" = pref === "google" ? "google" : "apple";
  if (pref === "auto") {
    if (typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent)) app = "google";
  }
  return app === "apple" ? appleMapsDirections(to, label) : googleMapsDirections(to, label);
}
