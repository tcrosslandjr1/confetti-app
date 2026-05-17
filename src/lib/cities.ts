// City registry + selected-city storage. Lets users pick the metro area
// that drives Quick Picks and the Build/Plan My Night wizard.

import { getStoredLocation, type UserLocation } from "@/lib/location";

export type City = {
  slug: string;
  name: string; // Short name shown in chips/buttons
  region: string; // e.g. "DC · MD · VA"
  emoji: string;
  lat: number;
  lng: number;
};

export const CITIES: City[] = [
  {
    slug: "dmv",
    name: "Washington DC",
    region: "DC · MD · VA",
    emoji: "🏛️",
    lat: 38.9072,
    lng: -77.0369,
  },
  {
    slug: "nyc",
    name: "New York",
    region: "Manhattan · BK",
    emoji: "🗽",
    lat: 40.7589,
    lng: -73.9851,
  },
  {
    slug: "la",
    name: "Los Angeles",
    region: "LA County",
    emoji: "🌴",
    lat: 34.0522,
    lng: -118.2437,
  },
  { slug: "chi", name: "Chicago", region: "Cook County", emoji: "🌭", lat: 41.8781, lng: -87.6298 },
  { slug: "mia", name: "Miami", region: "Miami-Dade", emoji: "🌊", lat: 25.7617, lng: -80.1918 },
  {
    slug: "sf",
    name: "San Francisco",
    region: "Bay Area",
    emoji: "🌉",
    lat: 37.7749,
    lng: -122.4194,
  },
  {
    slug: "bos",
    name: "Boston",
    region: "Greater Boston",
    emoji: "⚓",
    lat: 42.3601,
    lng: -71.0589,
  },
  { slug: "atl", name: "Atlanta", region: "Metro ATL", emoji: "🍑", lat: 33.749, lng: -84.388 },
  {
    slug: "sea",
    name: "Seattle",
    region: "Puget Sound",
    emoji: "☕",
    lat: 47.6062,
    lng: -122.3321,
  },
  {
    slug: "phl",
    name: "Philadelphia",
    region: "Greater Philly",
    emoji: "🔔",
    lat: 39.9526,
    lng: -75.1652,
  },
  {
    slug: "nash",
    name: "Nashville",
    region: "Music City",
    emoji: "🎸",
    lat: 36.1627,
    lng: -86.7816,
  },
  { slug: "aus", name: "Austin", region: "Hill Country", emoji: "🤘", lat: 30.2672, lng: -97.7431 },
  { slug: "den", name: "Denver", region: "Front Range", emoji: "🏔️", lat: 39.7392, lng: -104.9903 },
  { slug: "no", name: "New Orleans", region: "NOLA", emoji: "🎷", lat: 29.9511, lng: -90.0715 },
  { slug: "tor", name: "Toronto", region: "GTA", emoji: "🍁", lat: 43.6532, lng: -79.3832 },
];

export const DEFAULT_CITY: City = CITIES[0];

const KEY = "concierge:selected-city";
const EVENT = "concierge:selected-city:changed";

export function getSelectedCity(): City | null {
  if (typeof window === "undefined") return null;
  try {
    const slug = localStorage.getItem(KEY);
    if (!slug) return null;
    return CITIES.find((c) => c.slug === slug) ?? null;
  } catch {
    return null;
  }
}

export function setSelectedCity(slug: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (slug) localStorage.setItem(KEY, slug);
    else localStorage.removeItem(KEY);
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch {
    /* ignore quota */
  }
}

export function subscribeSelectedCity(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

/**
 * Returns the lat/lng to use when querying live venue results.
 * Selected city wins over GPS so Quick Picks/Wizard reflect the user's choice.
 */
export function getActiveLocation(): UserLocation | null {
  const city = getSelectedCity();
  if (city) {
    return { lat: city.lat, lng: city.lng, capturedAt: Date.now() };
  }
  return getStoredLocation();
}
