import musicImg from "@/assets/event-music.jpg";
import techImg from "@/assets/event-tech.jpg";
import foodImg from "@/assets/event-food.jpg";
import artImg from "@/assets/event-art.jpg";
import wellnessImg from "@/assets/event-wellness.jpg";
import sportsImg from "@/assets/event-sports.jpg";

export type EventCategory = "Music" | "Tech" | "Food" | "Arts" | "Wellness" | "Sports";

export const CATEGORIES: EventCategory[] = ["Music", "Tech", "Food", "Arts", "Wellness", "Sports"];

export type EventItem = {
  id: string;
  title: string;
  category: EventCategory;
  date: string; // ISO
  city: string;
  venue: string;
  price: number; // 0 = Free
  image: string;
  blurb: string;
  organizer: string;
  ticketUrl?: string;
  lat: number;
  lng: number;
};

export const CITIES: { name: string; lat: number; lng: number }[] = [
  { name: "Brooklyn, NY", lat: 40.6782, lng: -73.9442 },
  { name: "San Francisco, CA", lat: 37.7749, lng: -122.4194 },
  { name: "Austin, TX", lat: 30.2672, lng: -97.7431 },
  { name: "Chicago, IL", lat: 41.8781, lng: -87.6298 },
  { name: "Boulder, CO", lat: 40.015, lng: -105.2705 },
  { name: "Los Angeles, CA", lat: 34.0522, lng: -118.2437 },
];

const CITY_COORDS: Record<string, { lat: number; lng: number }> = Object.fromEntries(
  CITIES.map((c) => [c.name, { lat: c.lat, lng: c.lng }]),
);

function coords(city: string) {
  return CITY_COORDS[city] ?? { lat: 0, lng: 0 };
}

export const EVENTS: EventItem[] = (
  [
    {
      id: "neon-nights",
      title: "Neon Nights: Indie Pop Festival",
      category: "Music" as const,
      date: "2026-06-12T20:00:00",
      city: "Brooklyn, NY",
      venue: "Warehouse 9",
      price: 49,
      image: musicImg,
      organizer: "Riff Collective",
      blurb: "An electric night of rising indie pop acts under one roof, with rooftop afterparty.",
    },
    {
      id: "founder-summit",
      title: "Founder Summit 2026",
      category: "Tech" as const,
      date: "2026-05-22T09:00:00",
      city: "San Francisco, CA",
      venue: "Pier 27",
      price: 199,
      image: techImg,
      organizer: "Build Forward",
      blurb:
        "A full day of talks, workshops, and unfiltered Q&As with founders building the next wave of AI products.",
    },
    {
      id: "night-market",
      title: "Sunset Night Market",
      category: "Food" as const,
      date: "2026-05-30T17:30:00",
      city: "Austin, TX",
      venue: "Zilker Park",
      price: 0,
      image: foodImg,
      organizer: "Hungry City",
      blurb:
        "60+ local vendors, live DJs, and string lights as the sun goes down. Free entry, eat your way through.",
    },
    {
      id: "modern-canvas",
      title: "Modern Canvas: Gallery Opening",
      category: "Arts" as const,
      date: "2026-06-05T19:00:00",
      city: "Chicago, IL",
      venue: "Loft 41 Gallery",
      price: 25,
      image: artImg,
      organizer: "Loft 41",
      blurb:
        "Opening night for ten emerging painters, with curator-led walkthrough and complimentary drinks.",
    },
    {
      id: "sunrise-flow",
      title: "Sunrise Flow Mountain Retreat",
      category: "Wellness" as const,
      date: "2026-07-04T06:30:00",
      city: "Boulder, CO",
      venue: "Flagstaff Summit",
      price: 65,
      image: wellnessImg,
      organizer: "Still Mind Co.",
      blurb:
        "Greet the day with 90 minutes of vinyasa, breathwork, and a hot herbal tea ceremony at the summit.",
    },
    {
      id: "court-clash",
      title: "Court Clash: Championship Finals",
      category: "Sports" as const,
      date: "2026-06-18T19:30:00",
      city: "Los Angeles, CA",
      venue: "Crypto Arena",
      price: 89,
      image: sportsImg,
      organizer: "West League",
      blurb:
        "The two best teams of the season face off for the title. Halftime show by surprise headliner.",
    },
  ] as Omit<EventItem, "lat" | "lng">[]
).map((e) => ({ ...e, ...coords(e.city) }));

export function distanceMiles(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const toRad = (n: number) => (n * Math.PI) / 180;
  const R = 3958.8; // miles
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function getEvent(id: string) {
  return EVENTS.find((e) => e.id === id);
}

export function formatEventDate(iso: string) {
  const d = new Date(iso);
  return {
    weekday: d.toLocaleDateString("en-US", { weekday: "short" }),
    month: d.toLocaleDateString("en-US", { month: "short" }),
    day: d.getDate(),
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    full: d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
  };
}

// Stable hash from a string id — used to seed deterministic "live" numbers.
function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * "Live" seats-remaining number that decays through each hour and resets
 * at the top of the next hour. Deterministic for a given event + minute,
 * which keeps SSR + client renders aligned and avoids hydration mismatch
 * while still feeling alive when polled on an interval.
 */
export function liveSeatsRemaining(eventId: string, now: Date = new Date()): number {
  const base = 4 + (hashId(eventId) % 16); // 4..19
  const decay = Math.floor(now.getMinutes() / 6); // 0..9
  return Math.max(1, base - decay);
}

/**
 * Pick a "tonight's pick" event for the auth/teaser preview.
 * Prefers an upcoming event in the preferred city, then any upcoming event,
 * then deterministically cycles past events by day-of-year so the preview
 * never looks empty.
 */
export function getTonightsPick(
  preferredCity?: string | null,
  now: Date = new Date(),
): EventItem {
  const future = EVENTS
    .filter((e) => new Date(e.date).getTime() >= now.getTime())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const cityMatch =
    preferredCity &&
    future.find((e) =>
      e.city.toLowerCase().includes(preferredCity.toLowerCase()),
    );
  if (cityMatch) return cityMatch;
  if (future.length > 0) return future[0];

  // All static events are in the past — cycle deterministically by day-of-year.
  const start = Date.UTC(now.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start) / 86400000);
  return EVENTS[dayOfYear % EVENTS.length];
}
