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

export async function requestUserLocation(
  options: PositionOptions = { enableHighAccuracy: false, timeout: 10000, maximumAge: 60_000 },
): Promise<UserLocation | null> {
  if (typeof window === "undefined" || !("geolocation" in navigator)) return null;
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
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
        resolve(loc);
      },
      () => resolve(null),
      options,
    );
  });
}
