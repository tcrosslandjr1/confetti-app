// Lightweight client-side location helper.
// We ask for browser geolocation (with consent) right after signup so the
// personalized experience can recommend nearby venues from the start.

const KEY = "concierge:user-location";

export type UserLocation = {
  lat: number;
  lng: number;
  accuracy?: number;
  capturedAt: number;
};

export function getStoredLocation(): UserLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as UserLocation) : null;
  } catch {
    return null;
  }
}

export function clearStoredLocation() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

export type LocationError =
  | "unsupported"
  | "permission_denied"
  | "unavailable"
  | "timeout"
  | "iframe_blocked"
  | "unknown";

export type LocationResult =
  | { ok: true; location: UserLocation }
  | { ok: false; error: LocationError; message: string };

export async function requestUserLocationDetailed(
  options: PositionOptions = { enableHighAccuracy: false, timeout: 10000, maximumAge: 60_000 },
): Promise<LocationResult> {
  if (typeof window === "undefined" || !("geolocation" in navigator)) {
    return {
      ok: false,
      error: "unsupported",
      message: "Geolocation isn't supported in this browser.",
    };
  }

  // Iframes (e.g. preview environments) often block geolocation via Permissions-Policy.
  const inIframe = typeof window !== "undefined" && window.self !== window.top;

  return new Promise((resolve) => {
    let settled = false;
    const guard = window.setTimeout(
      () => {
        if (settled) return;
        settled = true;
        resolve({
          ok: false,
          error: inIframe ? "iframe_blocked" : "timeout",
          message: inIframe
            ? "Location is blocked inside this preview frame. Open the app in a new tab, or pick a city below."
            : "Location request timed out. Pick a city below.",
        });
      },
      (options.timeout ?? 10000) + 500,
    );

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(guard);
        const loc: UserLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          capturedAt: Date.now(),
        };
        try {
          localStorage.setItem(KEY, JSON.stringify(loc));
        } catch {
          /* ignore quota errors */
        }
        resolve({ ok: true, location: loc });
      },
      (err) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(guard);
        let error: LocationError = "unknown";
        let message = err.message || "Couldn't get your location.";
        if (err.code === err.PERMISSION_DENIED) {
          error = inIframe ? "iframe_blocked" : "permission_denied";
          message = inIframe
            ? "Location is blocked inside this preview frame. Open the app in a new tab, or pick a city below."
            : "Location permission denied. Enable it in your browser settings, or pick a city below.";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          error = "unavailable";
          message = "Your location is unavailable right now. Pick a city below.";
        } else if (err.code === err.TIMEOUT) {
          error = "timeout";
          message = "Location request timed out. Pick a city below.";
        }
        resolve({ ok: false, error, message });
      },
      options,
    );
  });
}

export async function requestUserLocation(options?: PositionOptions): Promise<UserLocation | null> {
  const result = await requestUserLocationDetailed(options);
  return result.ok ? result.location : null;
}
