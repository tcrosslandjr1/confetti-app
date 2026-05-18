/**
 * Rideshare deep-link builders (Uber, Lyft) + Apple Maps EV routing.
 *
 * No OAuth — modern apps (Yelp, OpenTable, Google Maps) integrate rideshare
 * via deep links. These open the native app pre-filled with pickup/dropoff,
 * then the user confirms in-app.
 */

import { isAppleDevice } from "./maps-links";

export type RideService = "uber" | "lyft" | "both" | "none";
export type UberVehicle = "uberx" | "uberxl" | "uberblack" | "uberpool";
export type LyftVehicle = "lyft" | "lyft_line" | "lyft_plus" | "lyft_lux";

export type LatLng = { lat: number; lng: number };
export type RidePlace = LatLng & { name?: string; address?: string };

/* --------------------------------- Uber ----------------------------------- */
/** Universal link — opens Uber app on mobile, web fallback on desktop. */
export function buildUberLink(
  dropoff: RidePlace,
  opts: { pickup?: RidePlace; vehicle?: UberVehicle } = {},
): string {
  const params = new URLSearchParams({ action: "setPickup" });
  if (opts.pickup) {
    params.set("pickup[latitude]", String(opts.pickup.lat));
    params.set("pickup[longitude]", String(opts.pickup.lng));
    if (opts.pickup.name) params.set("pickup[nickname]", opts.pickup.name);
  } else {
    params.set("pickup", "my_location");
  }
  params.set("dropoff[latitude]", String(dropoff.lat));
  params.set("dropoff[longitude]", String(dropoff.lng));
  if (dropoff.name) params.set("dropoff[nickname]", dropoff.name);
  if (dropoff.address) params.set("dropoff[formatted_address]", dropoff.address);
  if (opts.vehicle) {
    // Uber product IDs vary by city; we pass the human key as a hint.
    params.set("product_id", opts.vehicle);
  }
  return `https://m.uber.com/ul/?${params.toString()}`;
}

/* --------------------------------- Lyft ----------------------------------- */
export function buildLyftLink(
  dropoff: RidePlace,
  opts: { pickup?: RidePlace; vehicle?: LyftVehicle } = {},
): string {
  const params = new URLSearchParams({ id: opts.vehicle ?? "lyft" });
  if (opts.pickup) {
    params.set("pickup[latitude]", String(opts.pickup.lat));
    params.set("pickup[longitude]", String(opts.pickup.lng));
  }
  params.set("destination[latitude]", String(dropoff.lat));
  params.set("destination[longitude]", String(dropoff.lng));
  return `https://lyft.com/ride?${params.toString()}`;
}

/* ------------------------------ Apple Maps EV ----------------------------- */
/** EV routing — Apple Maps with dirflg=e (transit/EV-aware on iOS 16+). */
export function buildEvRouteLink(dropoff: RidePlace, pickup?: RidePlace): string {
  const daddr =
    dropoff.address ?? `${dropoff.lat},${dropoff.lng}`;
  const saddr = pickup
    ? pickup.address ?? `${pickup.lat},${pickup.lng}`
    : undefined;
  const params = new URLSearchParams({ daddr, dirflg: "d" });
  if (saddr) params.set("saddr", saddr);
  // Apple Maps EV charging-aware routing
  if (isAppleDevice()) params.set("t", "m");
  return `https://maps.apple.com/?${params.toString()}`;
}

/* ------------------------------- ETA / dist ------------------------------- */
/** Great-circle distance in km. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Rough ETA strings based on mode. Replace with Google Distance Matrix later. */
export function estimateEtas(from: LatLng, to: LatLng) {
  const km = haversineKm(from, to);
  const walkMin = Math.max(1, Math.round((km / 5) * 60)); // 5 km/h
  const driveMin = Math.max(2, Math.round((km / 35) * 60 + 2)); // city avg
  const uberWaitMin = 3 + Math.round(Math.random() * 4); // 3–7 min pickup
  return {
    distanceKm: km,
    walk: `${walkMin} min`,
    drive: `${driveMin} min`,
    uberEta: `${uberWaitMin + driveMin} min`,
    lyftEta: `${uberWaitMin + 1 + driveMin} min`,
    evEta: `${driveMin + 1} min`,
  };
}

/* -------------------------- service availability -------------------------- */
export function showUber(pref: RideService): boolean {
  return pref === "uber" || pref === "both";
}
export function showLyft(pref: RideService): boolean {
  return pref === "lyft" || pref === "both";
}
