/**
 * Navigation Deep Link Service
 * No API key required — generates universal links for all map apps.
 *
 * Supports: Google Maps, Apple Maps, Waze
 * Each link opens the native app with turn-by-turn directions.
 */

// ─── Types ──────────────────────────────────────────────────────────

export type TravelMode = "driving" | "walking" | "transit" | "bicycling";
export type MapProvider = "google" | "apple" | "waze";

export interface NavigationRequest {
  origin?: { lat: number; lng: number; address?: string }; // omit = current location
  destination: { lat: number; lng: number; address?: string; name?: string };
  mode?: TravelMode;
  avoidTolls?: boolean;
  avoidHighways?: boolean;
  departureTime?: Date; // for transit timing
}

export interface NavigationLink {
  provider: MapProvider;
  url: string;
  label: string; // "Open in Google Maps"
}

// ─── Google Maps ────────────────────────────────────────────────────

/**
 * Google Maps Universal Link
 * Docs: https://developers.google.com/maps/documentation/urls/get-started
 * Works on iOS, Android, and web — no API key needed.
 */
export function buildGoogleMapsLink(req: NavigationRequest): NavigationLink {
  const params = new URLSearchParams();
  params.set("api", "1");

  // Destination
  if (req.destination.address) {
    params.set("destination", req.destination.address);
  } else {
    params.set("destination", `${req.destination.lat},${req.destination.lng}`);
  }

  // Origin (omit for current location)
  if (req.origin) {
    if (req.origin.address) {
      params.set("origin", req.origin.address);
    } else {
      params.set("origin", `${req.origin.lat},${req.origin.lng}`);
    }
  }

  // Travel mode
  if (req.mode) {
    params.set("travelmode", req.mode);
  }

  // Avoidances
  const avoid: string[] = [];
  if (req.avoidTolls) avoid.push("tolls");
  if (req.avoidHighways) avoid.push("highways");
  if (avoid.length) params.set("avoid", avoid.join(","));

  const url = `https://www.google.com/maps/dir/?${params.toString()}`;
  return { provider: "google", url, label: "Open in Google Maps" };
}

// ─── Apple Maps ─────────────────────────────────────────────────────

/**
 * Apple Maps Universal Link
 * Docs: https://developer.apple.com/library/archive/featuredarticles/iPhoneURLScheme_Reference/MapLinks/MapLinks.html
 * Opens Maps on iOS/macOS, falls back to maps.apple.com on other platforms.
 */
export function buildAppleMapsLink(req: NavigationRequest): NavigationLink {
  const params = new URLSearchParams();

  // Destination
  params.set("daddr", req.destination.address || `${req.destination.lat},${req.destination.lng}`);

  // Origin
  if (req.origin) {
    params.set("saddr", req.origin.address || `${req.origin.lat},${req.origin.lng}`);
  }

  // Travel mode: d=driving, w=walking, r=transit
  const modeMap: Record<TravelMode, string> = {
    driving: "d",
    walking: "w",
    transit: "r",
    bicycling: "w", // Apple Maps doesn't support cycling directions natively
  };
  if (req.mode) {
    params.set("dirflg", modeMap[req.mode]);
  }

  const url = `https://maps.apple.com/?${params.toString()}`;
  return { provider: "apple", url, label: "Open in Apple Maps" };
}

// ─── Waze ───────────────────────────────────────────────────────────

/**
 * Waze Deep Link
 * Docs: https://developers.google.com/waze/deeplinks
 * Great for driving with real-time traffic — popular with nightlife users.
 */
export function buildWazeLink(req: NavigationRequest): NavigationLink {
  const params = new URLSearchParams();
  params.set("ll", `${req.destination.lat},${req.destination.lng}`);
  params.set("navigate", "yes");

  if (req.destination.name) {
    params.set("q", req.destination.name);
  }

  const url = `https://waze.com/ul?${params.toString()}`;
  return { provider: "waze", url, label: "Open in Waze" };
}

// ─── Unified Navigation ─────────────────────────────────────────────

/**
 * Returns navigation links for all providers.
 * The app can show platform-appropriate default or let user choose.
 */
export function getNavigationOptions(req: NavigationRequest): NavigationLink[] {
  return [
    buildGoogleMapsLink(req),
    buildAppleMapsLink(req),
    buildWazeLink(req),
  ];
}

/**
 * Smart default: Apple Maps on iOS, Google Maps elsewhere.
 * Detects platform from user agent.
 */
export function getDefaultNavigation(
  req: NavigationRequest,
  userAgent?: string
): NavigationLink {
  const isIOS = userAgent?.match(/iPhone|iPad|iPod/i);
  return isIOS ? buildAppleMapsLink(req) : buildGoogleMapsLink(req);
}

/**
 * Navigate between two Confetti itinerary stops.
 * Convenience wrapper for the trip planner.
 */
export function navigateBetweenStops(
  from: { name: string; lat: number; lng: number; address?: string },
  to: { name: string; lat: number; lng: number; address?: string },
  mode: TravelMode = "driving"
): NavigationLink[] {
  return getNavigationOptions({
    origin: { lat: from.lat, lng: from.lng, address: from.address },
    destination: { lat: to.lat, lng: to.lng, address: to.address, name: to.name },
    mode,
  });
}
