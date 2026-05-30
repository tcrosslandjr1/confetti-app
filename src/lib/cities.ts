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
  // --- US ---
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
    slug: "nash",
    name: "Nashville",
    region: "Music City",
    emoji: "🎸",
    lat: 36.1627,
    lng: -86.7816,
  },
  {
    slug: "vegas",
    name: "Las Vegas",
    region: "Clark County",
    emoji: "🎰",
    lat: 36.1699,
    lng: -115.1398,
  },
  {
    slug: "hou",
    name: "Houston",
    region: "Harris County",
    emoji: "🤠",
    lat: 29.7604,
    lng: -95.3698,
  },
  {
    slug: "mem",
    name: "Memphis",
    region: "Shelby County",
    emoji: "🎵",
    lat: 35.1495,
    lng: -90.049,
  },
  { slug: "knox", name: "Knoxville", region: "East TN", emoji: "🏔️", lat: 35.9606, lng: -83.9207 },
  {
    slug: "chatt",
    name: "Chattanooga",
    region: "Hamilton County",
    emoji: "🚂",
    lat: 35.0456,
    lng: -85.3097,
  },
  {
    slug: "gat",
    name: "Gatlinburg",
    region: "Great Smokies",
    emoji: "🐻",
    lat: 35.7143,
    lng: -83.5102,
  },
  {
    slug: "phx",
    name: "Phoenix",
    region: "Maricopa County",
    emoji: "🌵",
    lat: 33.4484,
    lng: -112.074,
  },
  {
    slug: "scotts",
    name: "Scottsdale",
    region: "Maricopa County",
    emoji: "🌞",
    lat: 33.4942,
    lng: -111.9261,
  },
  {
    slug: "aus",
    name: "Austin",
    region: "Travis County",
    emoji: "🎶",
    lat: 30.2672,
    lng: -97.7431,
  },
  { slug: "den", name: "Denver", region: "Mile High", emoji: "⛰️", lat: 39.7392, lng: -104.9903 },
  {
    slug: "bos",
    name: "Boston",
    region: "Suffolk County",
    emoji: "🦞",
    lat: 42.3601,
    lng: -71.0589,
  },
  {
    slug: "phl",
    name: "Philadelphia",
    region: "Delaware Valley",
    emoji: "🔔",
    lat: 39.9526,
    lng: -75.1652,
  },
  {
    slug: "nola",
    name: "New Orleans",
    region: "Orleans Parish",
    emoji: "🎷",
    lat: 29.9511,
    lng: -90.0715,
  },
  { slug: "sd", name: "San Diego", region: "SoCal", emoji: "🏖️", lat: 32.7157, lng: -117.1611 },
  {
    slug: "pdx",
    name: "Portland",
    region: "Multnomah County",
    emoji: "🌲",
    lat: 45.5152,
    lng: -122.6784,
  },
  {
    slug: "chs",
    name: "Charleston",
    region: "Lowcountry",
    emoji: "🦐",
    lat: 32.7765,
    lng: -79.9311,
  },
  // --- International ---
  { slug: "lon", name: "London", region: "England", emoji: "🇬🇧", lat: 51.5074, lng: -0.1278 },
  { slug: "par", name: "Paris", region: "France", emoji: "🗼", lat: 48.8566, lng: 2.3522 },
  { slug: "tyo", name: "Tokyo", region: "Japan", emoji: "🗾", lat: 35.6762, lng: 139.6503 },
  { slug: "dxb", name: "Dubai", region: "UAE", emoji: "🏜️", lat: 25.2048, lng: 55.2708 },
  { slug: "yto", name: "Toronto", region: "Canada", emoji: "🍁", lat: 43.6532, lng: -79.3832 },
  { slug: "mex", name: "Mexico City", region: "Mexico", emoji: "🌮", lat: 19.4326, lng: -99.1332 },
  { slug: "bcn", name: "Barcelona", region: "Spain", emoji: "🥘", lat: 41.3851, lng: 2.1734 },
  { slug: "ber", name: "Berlin", region: "Germany", emoji: "🍺", lat: 52.52, lng: 13.405 },
  { slug: "ams", name: "Amsterdam", region: "Netherlands", emoji: "🚲", lat: 52.3676, lng: 4.9041 },
  { slug: "syd", name: "Sydney", region: "Australia", emoji: "🦘", lat: -33.8688, lng: 151.2093 },
  { slug: "ath", name: "Athens", region: "Greece", emoji: "🏛️", lat: 37.9838, lng: 23.7275 },
  { slug: "bali", name: "Bali", region: "Indonesia", emoji: "🌺", lat: -8.3405, lng: 115.092 },
  { slug: "bkk", name: "Bangkok", region: "Thailand", emoji: "🛕", lat: 13.7563, lng: 100.5018 },
  {
    slug: "bue",
    name: "Buenos Aires",
    region: "Argentina",
    emoji: "💃",
    lat: -34.6037,
    lng: -58.3816,
  },
  {
    slug: "cpt",
    name: "Cape Town",
    region: "South Africa",
    emoji: "🏔️",
    lat: -33.9249,
    lng: 18.4241,
  },
  { slug: "hkg", name: "Hong Kong", region: "China", emoji: "🏙️", lat: 22.3193, lng: 114.1694 },
  { slug: "ist", name: "Istanbul", region: "Türkiye", emoji: "🕌", lat: 41.0082, lng: 28.9784 },
  { slug: "lis", name: "Lisbon", region: "Portugal", emoji: "🛳️", lat: 38.7223, lng: -9.1393 },
  { slug: "mad", name: "Madrid", region: "Spain", emoji: "🇪🇸", lat: 40.4168, lng: -3.7038 },
  {
    slug: "mel",
    name: "Melbourne",
    region: "Australia",
    emoji: "☕",
    lat: -37.8136,
    lng: 144.9631,
  },
  { slug: "mil", name: "Milan", region: "Italy", emoji: "👜", lat: 45.4642, lng: 9.19 },
  { slug: "bom", name: "Mumbai", region: "India", emoji: "🇮🇳", lat: 19.076, lng: 72.8777 },
  {
    slug: "rio",
    name: "Rio de Janeiro",
    region: "Brazil",
    emoji: "🏝️",
    lat: -22.9068,
    lng: -43.1729,
  },
  { slug: "rom", name: "Rome", region: "Italy", emoji: "🏛️", lat: 41.9028, lng: 12.4964 },
  { slug: "sao", name: "Sao Paulo", region: "Brazil", emoji: "🇧🇷", lat: -23.5505, lng: -46.6333 },
  { slug: "icn", name: "Seoul", region: "South Korea", emoji: "🇰🇷", lat: 37.5665, lng: 126.978 },
  { slug: "sin", name: "Singapore", region: "Singapore", emoji: "🦁", lat: 1.3521, lng: 103.8198 },
  { slug: "tlv", name: "Tel Aviv", region: "Israel", emoji: "🌊", lat: 32.0853, lng: 34.7818 },
  { slug: "tul", name: "Tulum", region: "Mexico", emoji: "🌴", lat: 20.2114, lng: -87.4654 },
  { slug: "yvr", name: "Vancouver", region: "Canada", emoji: "🌧️", lat: 49.2827, lng: -123.1207 },
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
