/**
 * Ticketmaster Discovery Provider
 * Docs: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
 *
 * Handles: Concerts, shows, comedy, festivals, sports — anything ticketed.
 * Used to enhance itineraries with live events happening tonight/this weekend.
 *
 * Auth: API Key (query param)
 * Cost: Free tier — 5,000 calls/day, 5 req/sec
 *
 * Setup: Get key at https://developer.ticketmaster.com/
 *        Add TICKETMASTER_API_KEY to .env
 *
 * DEV MODE: Returns mock event data so the app works without signup.
 */

// ─── Types ──────────────────────────────────────────────────────────

export interface EventSearchRequest {
  keyword?: string;
  city?: string;
  stateCode?: string;
  latlong?: string;        // "38.9,-77.03"
  radius?: number;         // miles
  startDateTime?: string;  // ISO with Z — "2026-05-17T18:00:00Z"
  endDateTime?: string;
  classificationName?: string; // "music", "comedy", "sports", "arts"
  size?: number;           // results per page, max 200
  sort?: "date,asc" | "date,desc" | "relevance,asc" | "relevance,desc";
}

export interface TicketmasterEvent {
  id: string;
  name: string;
  type: string;            // "event"
  url: string;             // ticketmaster.com link
  imageUrl?: string;
  startDate: string;       // ISO date
  startTime?: string;      // "19:00:00"
  timezone?: string;
  status: "onsale" | "offsale" | "canceled" | "postponed" | "rescheduled";
  priceRange?: { min: number; max: number; currency: string };
  venue: {
    id: string;
    name: string;
    address?: string;
    city: string;
    state: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
  };
  classifications: { genre: string; subGenre?: string; segment: string }[];
  seatmap?: string;        // seatmap image URL
  ticketLimit?: number;
  promoter?: string;
}

export interface EventSearchResult {
  events: TicketmasterEvent[];
  total: number;
  page: number;
  pageSize: number;
}

// ─── Configuration ──────────────────────────────────────────────────

let apiKey: string | null = null;

export function configure(key: string) {
  apiKey = key;
}

function isConfigured(): boolean {
  return !!apiKey;
}

// ─── Mock Data ──────────────────────────────────────────────────────

const MOCK_EVENTS: TicketmasterEvent[] = [
  {
    id: "mock-evt-1",
    name: "Jazz Under the Stars",
    type: "event",
    url: "https://ticketmaster.com/mock-evt-1",
    imageUrl: "https://picsum.photos/seed/jazz/600/300",
    startDate: "2026-05-17",
    startTime: "20:00:00",
    timezone: "America/New_York",
    status: "onsale",
    priceRange: { min: 35, max: 85, currency: "USD" },
    venue: {
      id: "v1",
      name: "The Anthem",
      address: "901 Wharf St SW",
      city: "Washington",
      state: "DC",
      postalCode: "20024",
      latitude: 38.8782,
      longitude: -77.0232,
    },
    classifications: [{ genre: "Jazz", subGenre: "Contemporary Jazz", segment: "Music" }],
  },
  {
    id: "mock-evt-2",
    name: "Late Night Comedy Showcase",
    type: "event",
    url: "https://ticketmaster.com/mock-evt-2",
    imageUrl: "https://picsum.photos/seed/comedy/600/300",
    startDate: "2026-05-17",
    startTime: "22:00:00",
    timezone: "America/New_York",
    status: "onsale",
    priceRange: { min: 20, max: 45, currency: "USD" },
    venue: {
      id: "v2",
      name: "DC Improv",
      address: "1140 Connecticut Ave NW",
      city: "Washington",
      state: "DC",
      postalCode: "20036",
      latitude: 38.9068,
      longitude: -77.0407,
    },
    classifications: [{ genre: "Comedy", segment: "Arts & Theatre" }],
  },
  {
    id: "mock-evt-3",
    name: "Rooftop DJ Set — Summer Kickoff",
    type: "event",
    url: "https://ticketmaster.com/mock-evt-3",
    imageUrl: "https://picsum.photos/seed/dj/600/300",
    startDate: "2026-05-17",
    startTime: "21:00:00",
    timezone: "America/New_York",
    status: "onsale",
    priceRange: { min: 15, max: 15, currency: "USD" },
    venue: {
      id: "v3",
      name: "The Graham Rooftop",
      address: "1075 Thomas Jefferson St NW",
      city: "Washington",
      state: "DC",
      postalCode: "20007",
      latitude: 38.9035,
      longitude: -77.0605,
    },
    classifications: [{ genre: "Electronic/Dance", subGenre: "House", segment: "Music" }],
  },
];

function mockSearch(req: EventSearchRequest): EventSearchResult {
  console.log(`[Ticketmaster Mock] Search: "${req.keyword || "events"}" in ${req.city || req.latlong || "DC"}`);
  let events = [...MOCK_EVENTS];

  if (req.classificationName) {
    const filter = req.classificationName.toLowerCase();
    events = events.filter((e) =>
      e.classifications.some((c) => c.segment.toLowerCase().includes(filter) || c.genre.toLowerCase().includes(filter))
    );
  }

  return { events, total: events.length, page: 0, pageSize: req.size || 20 };
}

// ─── API Calls ──────────────────────────────────────────────────────

const BASE_URL = "https://app.ticketmaster.com/discovery/v2";

/**
 * Search for events.
 */
export async function searchEvents(req: EventSearchRequest): Promise<EventSearchResult> {
  if (!isConfigured()) return mockSearch(req);

  const params = new URLSearchParams({ apikey: apiKey! });
  if (req.keyword) params.set("keyword", req.keyword);
  if (req.city) params.set("city", req.city);
  if (req.stateCode) params.set("stateCode", req.stateCode);
  if (req.latlong) params.set("latlong", req.latlong);
  if (req.radius) params.set("radius", req.radius.toString());
  if (req.startDateTime) params.set("startDateTime", req.startDateTime);
  if (req.endDateTime) params.set("endDateTime", req.endDateTime);
  if (req.classificationName) params.set("classificationName", req.classificationName);
  if (req.sort) params.set("sort", req.sort);
  params.set("size", (req.size || 20).toString());

  const res = await fetch(`${BASE_URL}/events.json?${params}`);
  if (!res.ok) throw new Error(`Ticketmaster search failed: ${res.status}`);
  const data = await res.json();

  const embedded = data._embedded?.events || [];
  return {
    events: embedded.map(mapEvent),
    total: data.page?.totalElements || embedded.length,
    page: data.page?.number || 0,
    pageSize: data.page?.size || 20,
  };
}

/**
 * Get event details by ID.
 */
export async function getEventDetail(eventId: string): Promise<TicketmasterEvent | null> {
  if (!isConfigured()) return MOCK_EVENTS.find((e) => e.id === eventId) || null;

  const params = new URLSearchParams({ apikey: apiKey! });
  const res = await fetch(`${BASE_URL}/events/${eventId}.json?${params}`);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Ticketmaster detail failed: ${res.status}`);
  }
  return mapEvent(await res.json());
}

// ─── Convenience ────────────────────────────────────────────────────

/**
 * Find events happening tonight near a location.
 */
export async function searchTonight(
  lat: number,
  lng: number,
  options?: { genre?: string; radius?: number }
): Promise<EventSearchResult> {
  const now = new Date();
  const endOfNight = new Date(now);
  endOfNight.setHours(28, 0, 0, 0); // 4am next day

  return searchEvents({
    latlong: `${lat},${lng}`,
    radius: options?.radius || 15,
    startDateTime: now.toISOString().replace(/\.\d+Z$/, "Z"),
    endDateTime: endOfNight.toISOString().replace(/\.\d+Z$/, "Z"),
    classificationName: options?.genre,
    sort: "date,asc",
    size: 20,
  });
}

/**
 * Find events this weekend near a location.
 */
export async function searchThisWeekend(
  lat: number,
  lng: number,
  options?: { genre?: string; radius?: number }
): Promise<EventSearchResult> {
  const now = new Date();
  const friday = new Date(now);
  friday.setDate(now.getDate() + ((5 - now.getDay() + 7) % 7));
  friday.setHours(17, 0, 0, 0);

  const sunday = new Date(friday);
  sunday.setDate(friday.getDate() + 2);
  sunday.setHours(23, 59, 0, 0);

  return searchEvents({
    latlong: `${lat},${lng}`,
    radius: options?.radius || 25,
    startDateTime: friday.toISOString().replace(/\.\d+Z$/, "Z"),
    endDateTime: sunday.toISOString().replace(/\.\d+Z$/, "Z"),
    classificationName: options?.genre,
    sort: "date,asc",
    size: 50,
  });
}

// ─── Helpers ────────────────────────────────────────────────────────

function mapEvent(raw: any): TicketmasterEvent {
  const venue = raw._embedded?.venues?.[0] || {};
  const classification = raw.classifications?.[0] || {};
  const priceRanges = raw.priceRanges?.[0];

  return {
    id: raw.id,
    name: raw.name,
    type: raw.type || "event",
    url: raw.url || "",
    imageUrl: raw.images?.find((img: any) => img.ratio === "16_9" && img.width > 500)?.url || raw.images?.[0]?.url,
    startDate: raw.dates?.start?.localDate || "",
    startTime: raw.dates?.start?.localTime,
    timezone: raw.dates?.timezone,
    status: mapStatus(raw.dates?.status?.code),
    priceRange: priceRanges
      ? { min: priceRanges.min, max: priceRanges.max, currency: priceRanges.currency }
      : undefined,
    venue: {
      id: venue.id || "",
      name: venue.name || "TBA",
      address: venue.address?.line1,
      city: venue.city?.name || "",
      state: venue.state?.stateCode || "",
      postalCode: venue.postalCode,
      latitude: venue.location?.latitude ? parseFloat(venue.location.latitude) : undefined,
      longitude: venue.location?.longitude ? parseFloat(venue.location.longitude) : undefined,
    },
    classifications: [
      {
        genre: classification.genre?.name || "Other",
        subGenre: classification.subGenre?.name,
        segment: classification.segment?.name || "Other",
      },
    ],
    seatmap: raw.seatmap?.staticUrl,
    ticketLimit: raw.ticketLimit?.info ? parseInt(raw.ticketLimit.info) : undefined,
    promoter: raw.promoter?.name,
  };
}

function mapStatus(code?: string): TicketmasterEvent["status"] {
  switch (code) {
    case "onsale": return "onsale";
    case "offsale": return "offsale";
    case "canceled": case "cancelled": return "canceled";
    case "postponed": return "postponed";
    case "rescheduled": return "rescheduled";
    default: return "onsale";
  }
}
