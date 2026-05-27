/**
 * Yelp Fusion Provider
 * Docs: https://docs.developer.yelp.com/docs/fusion-intro
 *
 * Handles: Nightlife/bar discovery, ratings, reviews, photos, hours.
 * Used by Venue Discovery Agent as a data source alongside Google Places.
 *
 * Auth: API Key (Bearer token)
 * Cost: Free tier — 5,000 API calls/day
 *
 * Setup: Get key at https://www.yelp.com/developers/v3/manage_app
 *        Add YELP_API_KEY to .env
 *
 * DEV MODE: When no key is configured, returns curated mock data
 * so the app works end-to-end without a Yelp account.
 */

// ─── Types ──────────────────────────────────────────────────────────

export interface YelpSearchRequest {
  term?: string;           // "cocktail bars", "rooftop lounge"
  location?: string;       // "Washington DC"
  latitude?: number;
  longitude?: number;
  radius?: number;         // meters, max 40000
  categories?: string[];   // "bars", "cocktailbars", "lounges", "danceclubs"
  price?: (1 | 2 | 3 | 4)[];  // 1=$, 4=$$$$
  openNow?: boolean;
  sortBy?: "best_match" | "rating" | "review_count" | "distance";
  limit?: number;          // max 50, default 20
  offset?: number;
}

export interface YelpBusiness {
  id: string;
  name: string;
  imageUrl: string;
  url: string;             // Yelp page
  rating: number;          // 1-5
  reviewCount: number;
  categories: { alias: string; title: string }[];
  coordinates: { latitude: number; longitude: number };
  location: {
    address1: string;
    city: string;
    state: string;
    zipCode: string;
    displayAddress: string[];
  };
  phone: string;
  displayPhone: string;
  distance?: number;       // meters from search point
  price?: string;          // "$", "$$", "$$$", "$$$$"
  hours?: {
    isOpenNow: boolean;
    open: { start: string; end: string; day: number }[];
  }[];
  photos?: string[];
  isClosed: boolean;
}

export interface YelpSearchResult {
  businesses: YelpBusiness[];
  total: number;
  region?: { center: { latitude: number; longitude: number } };
}

export interface YelpReview {
  id: string;
  rating: number;
  text: string;
  timeCreated: string;
  user: { name: string; imageUrl?: string };
}

// ─── Configuration ──────────────────────────────────────────────────

let apiKey: string | null = null;

export function configure(key: string) {
  apiKey = key;
}

function isConfigured(): boolean {
  return !!apiKey;
}

function getHeaders() {
  if (!apiKey) throw new Error("Yelp not configured.");
  return {
    Authorization: `Bearer ${apiKey}`,
    Accept: "application/json",
  };
}

// ─── Mock Data ──────────────────────────────────────────────────────

const MOCK_BUSINESSES: YelpBusiness[] = [
  {
    id: "mock-bar-1",
    name: "The Velvet Lounge",
    imageUrl: "https://picsum.photos/seed/velvet/400/300",
    url: "https://yelp.com/biz/mock-bar-1",
    rating: 4.5,
    reviewCount: 342,
    categories: [{ alias: "cocktailbars", title: "Cocktail Bars" }, { alias: "lounges", title: "Lounges" }],
    coordinates: { latitude: 38.9072, longitude: -77.0369 },
    location: {
      address1: "915 U St NW",
      city: "Washington",
      state: "DC",
      zipCode: "20001",
      displayAddress: ["915 U St NW", "Washington, DC 20001"],
    },
    phone: "+12025551234",
    displayPhone: "(202) 555-1234",
    distance: 450,
    price: "$$$",
    isClosed: false,
    photos: ["https://picsum.photos/seed/v1/400/300", "https://picsum.photos/seed/v2/400/300"],
  },
  {
    id: "mock-bar-2",
    name: "Skyline Rooftop",
    imageUrl: "https://picsum.photos/seed/skyline/400/300",
    url: "https://yelp.com/biz/mock-bar-2",
    rating: 4.2,
    reviewCount: 218,
    categories: [{ alias: "bars", title: "Bars" }, { alias: "rooftopbars", title: "Rooftop Bars" }],
    coordinates: { latitude: 38.9005, longitude: -77.0310 },
    location: {
      address1: "1201 K St NW",
      city: "Washington",
      state: "DC",
      zipCode: "20005",
      displayAddress: ["1201 K St NW", "Washington, DC 20005"],
    },
    phone: "+12025555678",
    displayPhone: "(202) 555-5678",
    distance: 1200,
    price: "$$$$",
    isClosed: false,
    photos: ["https://picsum.photos/seed/s1/400/300"],
  },
  {
    id: "mock-bar-3",
    name: "Neon Nights",
    imageUrl: "https://picsum.photos/seed/neon/400/300",
    url: "https://yelp.com/biz/mock-bar-3",
    rating: 4.0,
    reviewCount: 156,
    categories: [{ alias: "danceclubs", title: "Dance Clubs" }, { alias: "bars", title: "Bars" }],
    coordinates: { latitude: 38.9120, longitude: -77.0420 },
    location: {
      address1: "2003 14th St NW",
      city: "Washington",
      state: "DC",
      zipCode: "20009",
      displayAddress: ["2003 14th St NW", "Washington, DC 20009"],
    },
    phone: "+12025559012",
    displayPhone: "(202) 555-9012",
    distance: 800,
    price: "$$",
    isClosed: false,
  },
];

function mockSearch(req: YelpSearchRequest): YelpSearchResult {
  console.log(`[Yelp Mock] Search: "${req.term}" near ${req.location || `${req.latitude},${req.longitude}`}`);
  let results = [...MOCK_BUSINESSES];

  if (req.openNow) results = results.filter((b) => !b.isClosed);
  if (req.price) results = results.filter((b) => b.price && req.price!.includes(b.price.length as 1 | 2 | 3 | 4));

  const limit = req.limit || 20;
  return {
    businesses: results.slice(0, limit),
    total: results.length,
    region: { center: { latitude: 38.9072, longitude: -77.0369 } },
  };
}

function mockBusinessDetail(id: string): YelpBusiness | null {
  return MOCK_BUSINESSES.find((b) => b.id === id) || null;
}

function mockReviews(_id: string): YelpReview[] {
  return [
    {
      id: "rev-1",
      rating: 5,
      text: "Incredible vibe. The cocktails were artistically crafted and the DJ had the perfect playlist.",
      timeCreated: "2026-05-10T20:30:00Z",
      user: { name: "Jordan M." },
    },
    {
      id: "rev-2",
      rating: 4,
      text: "Great atmosphere and friendly staff. A bit pricey but worth it for a special night out.",
      timeCreated: "2026-05-08T22:15:00Z",
      user: { name: "Alex T." },
    },
  ];
}

// ─── API Calls ──────────────────────────────────────────────────────

const BASE_URL = "https://api.yelp.com/v3";

/**
 * Search for nightlife venues.
 */
export async function searchBusinesses(req: YelpSearchRequest): Promise<YelpSearchResult> {
  if (!isConfigured()) return mockSearch(req);

  const params = new URLSearchParams();
  if (req.term) params.set("term", req.term);
  if (req.location) params.set("location", req.location);
  if (req.latitude) params.set("latitude", req.latitude.toString());
  if (req.longitude) params.set("longitude", req.longitude.toString());
  if (req.radius) params.set("radius", Math.min(req.radius, 40000).toString());
  if (req.categories?.length) params.set("categories", req.categories.join(","));
  if (req.price?.length) params.set("price", req.price.join(","));
  if (req.openNow) params.set("open_now", "true");
  if (req.sortBy) params.set("sort_by", req.sortBy);
  params.set("limit", (req.limit || 20).toString());
  if (req.offset) params.set("offset", req.offset.toString());

  const res = await fetch(`${BASE_URL}/businesses/search?${params}`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Yelp search failed: ${res.status}`);
  const data = await res.json();

  return {
    businesses: data.businesses.map(mapBusiness),
    total: data.total,
    region: data.region,
  };
}

/**
 * Get full business details by ID.
 */
export async function getBusinessDetail(businessId: string): Promise<YelpBusiness | null> {
  if (!isConfigured()) return mockBusinessDetail(businessId);

  const res = await fetch(`${BASE_URL}/businesses/${businessId}`, { headers: getHeaders() });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Yelp detail failed: ${res.status}`);
  }
  return mapBusiness(await res.json());
}

/**
 * Get reviews for a business.
 */
export async function getReviews(businessId: string): Promise<YelpReview[]> {
  if (!isConfigured()) return mockReviews(businessId);

  const res = await fetch(`${BASE_URL}/businesses/${businessId}/reviews?sort_by=yelp_sort`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`Yelp reviews failed: ${res.status}`);
  const data = await res.json();

  return data.reviews.map((r: any) => ({
    id: r.id,
    rating: r.rating,
    text: r.text,
    timeCreated: r.time_created,
    user: { name: r.user.name, imageUrl: r.user.image_url },
  }));
}

// ─── Convenience: Nightlife Search ─────────────────────────────────

/**
 * Search specifically for nightlife venues near a location.
 * Pre-configures categories for bars, clubs, and lounges.
 */
export async function searchNightlife(
  lat: number,
  lng: number,
  options?: { radius?: number; priceRange?: (1 | 2 | 3 | 4)[]; openNow?: boolean; limit?: number }
): Promise<YelpSearchResult> {
  return searchBusinesses({
    latitude: lat,
    longitude: lng,
    categories: ["bars", "cocktailbars", "lounges", "danceclubs", "wine_bars", "speakeasies"],
    radius: options?.radius || 5000,
    price: options?.priceRange,
    openNow: options?.openNow ?? true,
    sortBy: "best_match",
    limit: options?.limit || 20,
  });
}

/**
 * Search for restaurants/dining near a location.
 */
export async function searchDining(
  lat: number,
  lng: number,
  options?: { cuisine?: string; priceRange?: (1 | 2 | 3 | 4)[]; openNow?: boolean; limit?: number }
): Promise<YelpSearchResult> {
  return searchBusinesses({
    term: options?.cuisine || "restaurants",
    latitude: lat,
    longitude: lng,
    categories: ["restaurants"],
    radius: 5000,
    price: options?.priceRange,
    openNow: options?.openNow,
    sortBy: "best_match",
    limit: options?.limit || 20,
  });
}

// ─── Helpers ────────────────────────────────────────────────────────

function mapBusiness(raw: any): YelpBusiness {
  return {
    id: raw.id,
    name: raw.name,
    imageUrl: raw.image_url || "",
    url: raw.url,
    rating: raw.rating,
    reviewCount: raw.review_count,
    categories: raw.categories || [],
    coordinates: raw.coordinates,
    location: {
      address1: raw.location?.address1 || "",
      city: raw.location?.city || "",
      state: raw.location?.state || "",
      zipCode: raw.location?.zip_code || "",
      displayAddress: raw.location?.display_address || [],
    },
    phone: raw.phone || "",
    displayPhone: raw.display_phone || "",
    distance: raw.distance,
    price: raw.price,
    hours: raw.hours?.map((h: any) => ({
      isOpenNow: h.is_open_now,
      open: h.open,
    })),
    photos: raw.photos,
    isClosed: raw.is_closed || false,
  };
}
