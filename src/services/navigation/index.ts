/**
 * Navigation Service — Deep Links
 * Generates native map links for Google Maps, Apple Maps, and Waze.
 * No API keys needed — uses URL schemes directly.
 */

export interface NavigationLink {
  provider: "google" | "apple" | "waze";
  label: string;
  url: string;
  icon: string;
}

export interface Location {
  name: string;
  address: string;
  lat?: number;
  lng?: number;
}

export function buildGoogleMapsLink(destination: Location, origin?: Location): string {
  const dest =
    destination.lat && destination.lng
      ? `${destination.lat},${destination.lng}`
      : encodeURIComponent(destination.address);
  const base = `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
  if (origin) {
    const orig =
      origin.lat && origin.lng ? `${origin.lat},${origin.lng}` : encodeURIComponent(origin.address);
    return `${base}&origin=${orig}`;
  }
  return base;
}

export function buildAppleMapsLink(destination: Location, origin?: Location): string {
  const dest =
    destination.lat && destination.lng
      ? `${destination.lat},${destination.lng}`
      : encodeURIComponent(destination.address);
  let url = `https://maps.apple.com/?daddr=${dest}&dirflg=d`;
  if (origin) {
    const orig =
      origin.lat && origin.lng ? `${origin.lat},${origin.lng}` : encodeURIComponent(origin.address);
    url += `&saddr=${orig}`;
  }
  return url;
}

export function buildWazeLink(destination: Location): string {
  if (destination.lat && destination.lng) {
    return `https://waze.com/ul?ll=${destination.lat},${destination.lng}&navigate=yes`;
  }
  return `https://waze.com/ul?q=${encodeURIComponent(destination.address)}&navigate=yes`;
}

export function getNavigationOptions(destination: Location, origin?: Location): NavigationLink[] {
  return [
    {
      provider: "google",
      label: "Google Maps",
      url: buildGoogleMapsLink(destination, origin),
      icon: "🗺️",
    },
    {
      provider: "apple",
      label: "Apple Maps",
      url: buildAppleMapsLink(destination, origin),
      icon: "🍎",
    },
    { provider: "waze", label: "Waze", url: buildWazeLink(destination), icon: "👻" },
  ];
}

export function getDefaultNavigation(destination: Location, origin?: Location): NavigationLink {
  const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const options = getNavigationOptions(destination, origin);
  return isIOS ? options[1] : options[0];
}

export function navigateBetweenStops(
  stops: Location[],
): { from: string; to: string; links: NavigationLink[] }[] {
  const legs: { from: string; to: string; links: NavigationLink[] }[] = [];
  for (let i = 0; i < stops.length - 1; i++) {
    legs.push({
      from: stops[i].name,
      to: stops[i + 1].name,
      links: getNavigationOptions(stops[i + 1], stops[i]),
    });
  }
  return legs;
}
