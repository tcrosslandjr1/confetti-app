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

export function buildAppleMapsDirectionsUrl(
  points: Place[],
  mode: TravelMode = "driving",
  opts: { native?: boolean } = {},
): string {
  const scheme = opts.native ? "maps://" : "https://maps.apple.com/";
  if (points.length === 0) return scheme;
  const dirflg = appleDirFlag(mode);
  if (points.length === 1) {
    const p = points[0];
    const q = fmt(p);
    if (!q) return scheme;
    const params = new URLSearchParams({ q });
    if (p.lat != null && p.lng != null) params.set("ll", `${p.lat},${p.lng}`);
    return `${scheme}?${params.toString()}`;
  }
  const saddr = fmt(points[0]);
  const daddr = points.slice(1).map(fmt).filter(Boolean).join(" to:");
  const params = new URLSearchParams({ saddr, daddr, dirflg });
  return `${scheme}?${params.toString()}`;
}

/* -------------------------- Google Maps builders --------------------------- */

export function buildGoogleMapsSearchUrl(p: Place): string {
  const q = fmt(p);
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function buildGoogleMapsDirectionsUrl(
  points: Place[],
  mode: TravelMode = "driving",
  opts: { native?: boolean } = {},
): string {
  if (points.length === 0) {
    return opts.native ? "comgooglemaps://" : "https://www.google.com/maps";
  }
  const origin = fmt(points[0]);
  const destination = fmt(points[points.length - 1]);
  const waypoints = points.slice(1, -1).map(fmt).filter(Boolean).join("|");

  if (opts.native) {
    // comgooglemaps:// opens the Google Maps app directly on iOS/Android when installed.
    const params = new URLSearchParams({
      saddr: points.length > 1 ? origin : "",
      daddr: destination,
      directionsmode: googleMode(mode),
    });
    if (waypoints) params.set("waypoints", waypoints);
    return `comgooglemaps://?${params.toString()}`;
  }

  if (points.length === 1) return buildGoogleMapsSearchUrl(points[0]);
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
  if (isIOS()) return buildAppleMapsDirectionsUrl(points, mode, { native: true });
  if (isAndroid()) return buildGoogleMapsDirectionsUrl(points, mode, { native: true });
  return isAppleDevice()
    ? buildAppleMapsDirectionsUrl(points, mode)
    : buildGoogleMapsDirectionsUrl(points, mode);
}

/**
 * Returns both URLs so callers can render side-by-side buttons.
 * On mobile, the matching platform's URL uses a native app scheme
 * (maps:// on iOS, comgooglemaps:// on Android) so the OS opens the app
 * directly without browser disambiguation. The other stays as a web URL
 * for cross-app fallback.
 */
export function bothDirectionsUrls(points: Place[], mode: TravelMode = "driving") {
  const ios = isIOS();
  const android = isAndroid();
  return {
    apple: buildAppleMapsDirectionsUrl(points, mode, { native: ios }),
    google: buildGoogleMapsDirectionsUrl(points, mode, { native: android }),
    preferred: buildSmartDirectionsUrl(points, mode),
    isApple: isAppleDevice(),
    isIOS: ios,
    isAndroid: android,
  };
}
