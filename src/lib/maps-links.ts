/**
 * Unified deep-link helpers for Apple Maps + Google Maps.
 *
 * Strategy: detect iOS/macOS (Apple devices) and prefer Apple Maps; fall back
 * to Google Maps everywhere else. Always returns https URLs that work cross-
 * platform — Apple Maps universal links open the app on iOS/macOS and the
 * web fallback elsewhere; Google Maps URLs open the app via intent on Android.
 */

export type TravelMode = "walking" | "driving" | "transit" | "bicycling";

type LatLng = { lat: number; lng: number };
type Place = { name?: string; address?: string } & Partial<LatLng>;

/* ----------------------------- device detection ---------------------------- */

export function isAppleDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const platform = navigator.platform || "";
  if (/iPhone|iPad|iPod/.test(ua)) return true;
  if (platform === "MacIntel" && (navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints! > 1) return true;
  if (/Macintosh/.test(ua)) return true;
  return false;
}

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/.test(ua)) return true;
  // iPadOS 13+ masquerades as Mac with touch
  if (
    (navigator.platform || "") === "MacIntel" &&
    (navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints! > 1
  )
    return true;
  return false;
}

export function isAndroid(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent || "");
}

export function isMobile(): boolean {
  return isIOS() || isAndroid();
}

/* ------------------------------ apple flags -------------------------------- */

function appleDirFlag(mode: TravelMode): string {
  switch (mode) {
    case "walking":
      return "w";
    case "transit":
      return "r";
    case "bicycling":
      // Apple Maps cycling is iOS 14+; falls back to walking on older
      return "w";
    default:
      return "d";
  }
}

function googleMode(mode: TravelMode): string {
  return mode; // already matches Google's enum
}

/* ------------------------------- formatting -------------------------------- */

function fmt(p: Place): string {
  if (p.lat != null && p.lng != null) return `${p.lat},${p.lng}`;
  return p.address || p.name || "";
}

/* --------------------------- Apple Maps builders --------------------------- */

export function buildAppleMapsSearchUrl(p: Place): string {
  const q = fmt(p);
  if (!q) return "https://maps.apple.com/";
  // ?q= for name, ll= for coords — use both when available for best result
  const params = new URLSearchParams({ q });
  if (p.lat != null && p.lng != null) params.set("ll", `${p.lat},${p.lng}`);
  return `https://maps.apple.com/?${params.toString()}`;
}

export function buildAppleMapsDirectionsUrl(points: Place[], mode: TravelMode = "driving"): string {
  if (points.length === 0) return "https://maps.apple.com/";
  const dirflg = appleDirFlag(mode);
  if (points.length === 1) return buildAppleMapsSearchUrl(points[0]);
  // Apple supports multi-stop via "A to:B to:C" in daddr
  const saddr = fmt(points[0]);
  const daddr = points
    .slice(1)
    .map(fmt)
    .filter(Boolean)
    .join(" to:");
  const params = new URLSearchParams({ saddr, daddr, dirflg });
  return `https://maps.apple.com/?${params.toString()}`;
}

/* -------------------------- Google Maps builders --------------------------- */

export function buildGoogleMapsSearchUrl(p: Place): string {
  const q = fmt(p);
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function buildGoogleMapsDirectionsUrl(points: Place[], mode: TravelMode = "driving"): string {
  if (points.length === 0) return "https://www.google.com/maps";
  if (points.length === 1) return buildGoogleMapsSearchUrl(points[0]);
  const origin = fmt(points[0]);
  const destination = fmt(points[points.length - 1]);
  const waypoints = points.slice(1, -1).map(fmt).filter(Boolean).join("|");
  const params = new URLSearchParams({
    api: "1",
    origin,
    destination,
    travelmode: googleMode(mode),
  });
  if (waypoints) params.set("waypoints", waypoints);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/* ------------------------------ smart pickers ------------------------------ */

/** Picks Apple Maps on iOS/macOS, Google Maps elsewhere. */
export function buildSmartSearchUrl(p: Place): string {
  return isAppleDevice() ? buildAppleMapsSearchUrl(p) : buildGoogleMapsSearchUrl(p);
}

export function buildSmartDirectionsUrl(points: Place[], mode: TravelMode = "driving"): string {
  return isAppleDevice()
    ? buildAppleMapsDirectionsUrl(points, mode)
    : buildGoogleMapsDirectionsUrl(points, mode);
}

/** Returns both URLs so callers can render side-by-side buttons if desired. */
export function bothDirectionsUrls(points: Place[], mode: TravelMode = "driving") {
  return {
    apple: buildAppleMapsDirectionsUrl(points, mode),
    google: buildGoogleMapsDirectionsUrl(points, mode),
    preferred: buildSmartDirectionsUrl(points, mode),
    isApple: isAppleDevice(),
  };
}
