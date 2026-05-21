/**
 * Venue Discovery Agent
 *
 * Location-aware venue search using Google Places + Foursquare.
 * Supports radius-based search, trip corridor discovery,
 * multi-state route scanning, and venue deduplication.
 *
 * When user location is on, silently searches everything within
 * a configurable radius — especially for trip planning.
 */

export interface GeoLocation {
  lat: number;
  lng: number;
  city?: string;
  state?: string;
  country?: string;
}

export interface VenueSearchParams {
  location: GeoLocation;
  radiusMiles?: number; // default 10, up to 100 for trip planning
  query?: string; // natural language: "rooftop bars", "family dinner"
  cuisines?: string[];
  vibes?: string[];
  priceLevel?: string; // $, $$, $$$, $$$$
  occasion?: string;
  limit?: number;
  openNow?: boolean;
}

export interface TripCorridorParams {
  origin: GeoLocation;
  destination: GeoLocation;
  corridorWidthMiles?: number; // how far off-route to search (default 15)
  stopTypes?: string[]; // "dining", "experience", "ev_charge", etc.
  waypointIntervalMiles?: number; // search every N miles (default 60)
  maxStops?: number;
}

export interface DiscoveredVenue {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  lat: number;
  lng: number;
  location?: { lat: number; lng: number };
  priceLevel?: string | number;
  rating?: number;
  ratingCount?: number;
  phone?: string;
  website?: string;
  hours?: Record<string, string>;
  photoUrls: string[];
  photos?: string[];
  cuisineTags: string[];
  vibeTags: string[];
  occasionTags: string[];
  source: "google" | "foursquare" | "merged";
  googlePlaceId?: string;
  foursquareId?: string;
  distanceMiles?: number;
  matchScore?: number; // 0-100 based on user taste profile
  vibeMatch?: number;
}

// ─── Config ─────────────────────────────────────────────────

interface VenueDiscoveryConfig {
  foursquareKey?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

function getConfig(): VenueDiscoveryConfig {
  return {
    foursquareKey: import.meta.env.VITE_FOURSQUARE_KEY,
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  };
}

// ─── Google Places (via Supabase edge proxy) ────────────────

async function searchGooglePlaces(
  params: VenueSearchParams,
  supabaseUrl: string,
  supabaseAnonKey: string
): Promise<DiscoveredVenue[]> {
  const radiusMeters = Math.round((params.radiusMiles ?? 10) * 1609.34);
  const query = params.query ?? buildSearchQuery(params);

  const res = await fetch(`${supabaseUrl}/functions/v1/places-search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${supabaseAnonKey}`,
      apikey: supabaseAnonKey,
    },
    body: JSON.stringify({
      textQuery: query,
      lat: params.location.lat,
      lng: params.location.lng,
      radiusMeters,
      maxResultCount: params.limit ?? 20,
      openNow: params.openNow,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "");
    console.error(
      `[Confetti] places-search proxy error ${res.status}: ${errorBody.slice(0, 500)}`
    );
    return [];
  }
  const data = await res.json();

  return (data.places ?? []).map((place: Record<string, unknown>): DiscoveredVenue => {
    const loc = place.location as { latitude: number; longitude: number } | undefined;
    const name = (place.displayName as { text: string } | undefined)?.text ?? "";
    const types = (place.types as string[]) ?? [];
    const photoPaths = (place.photoProxyPaths as string[] | undefined) ?? [];

    return {
      id: `g_${place.id}`,
      name,
      category: mapGoogleCategory(types),
      subcategory: place.primaryType as string | undefined,
      address: (place.formattedAddress as string) ?? "",
      city: params.location.city ?? "",
      state: params.location.state,
      country: params.location.country ?? "US",
      lat: loc?.latitude ?? 0,
      lng: loc?.longitude ?? 0,
      priceLevel: mapGooglePrice(place.priceLevel as string | undefined),
      rating: place.rating as number | undefined,
      ratingCount: place.userRatingCount as number | undefined,
      phone: place.nationalPhoneNumber as string | undefined,
      website: place.websiteUri as string | undefined,
      photoUrls: photoPaths.map(
        (p) => `${supabaseUrl}/functions/v1/places-photo?path=${encodeURIComponent(p)}&w=600`
      ),
      cuisineTags: extractCuisineTags(types, name),
      vibeTags: extractVibeTags(types, name),
      occasionTags: [],
      source: "google",
      googlePlaceId: place.id as string,
    };
  });
}

// ─── Foursquare ─────────────────────────────────────────────

async function searchFoursquare(
  params: VenueSearchParams,
  apiKey: string
): Promise<DiscoveredVenue[]> {
  const radiusMeters = Math.round((params.radiusMiles ?? 10) * 1609.34);
  const query = params.query ?? buildSearchQuery(params);

  const url = new URL("https://api.foursquare.com/v3/places/search");
  url.searchParams.set("query", query);
  url.searchParams.set("ll", `${params.location.lat},${params.location.lng}`);
  url.searchParams.set("radius", String(Math.min(radiusMeters, 100000)));
  url.searchParams.set("limit", String(params.limit ?? 20));
  if (params.openNow) url.searchParams.set("open_now", "true");

  const res = await fetch(url, {
    headers: { Authorization: apiKey, Accept: "application/json" },
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "");
    console.error(
      `[Confetti] Foursquare API error ${res.status}: ${errorBody.slice(0, 500)}`
    );
    return [];
  }
  const data = await res.json();

  return (data.results ?? []).map((place: Record<string, unknown>): DiscoveredVenue => {
    const geo = place.geocodes as { main?: { latitude: number; longitude: number } } | undefined;
    const loc = place.location as Record<string, string> | undefined;
    const cats = (place.categories as Array<{ name: string; short_name: string }>) ?? [];

    return {
      id: `f_${place.fsq_id}`,
      name: (place.name as string) ?? "",
      category: cats[0]?.name ?? "Venue",
      subcategory: cats[1]?.name,
      address: loc?.formatted_address ?? loc?.address ?? "",
      city: loc?.locality ?? params.location.city ?? "",
      state: loc?.region,
      country: loc?.country ?? "US",
      lat: geo?.main?.latitude ?? 0,
      lng: geo?.main?.longitude ?? 0,
      priceLevel: mapFoursquarePrice(place.price as number | undefined),
      rating: place.rating ? Number(place.rating) / 2 : undefined, // Foursquare is 0-10
      phone: (place.tel as string) ?? undefined,
      website: (place.website as string) ?? undefined,
      photoUrls: [],
      cuisineTags: cats.map((c) => c.name),
      vibeTags: extractVibeTags(cats.map((c) => c.name), (place.name as string) ?? ""),
      occasionTags: [],
      source: "foursquare",
      foursquareId: place.fsq_id as string,
      distanceMiles: place.distance ? Number(place.distance) / 1609.34 : undefined,
    };
  });
}

// ─── Mock venue discovery (development) ─────────────────────

function getMockVenues(params: VenueSearchParams): DiscoveredVenue[] {
  const city = params.location.city ?? "Washington";
  const state = params.location.state ?? "DC";

  const mockVenues: DiscoveredVenue[] = [
    {
      id: "mock_1", name: "The Crimson Lantern", category: "Speakeasy",
      address: "1423 U St NW", city, state, country: "US",
      lat: params.location.lat + 0.003, lng: params.location.lng - 0.002,
      priceLevel: "$$", rating: 4.7, ratingCount: 342,
      photoUrls: ["https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=400"],
      cuisineTags: ["Cocktails", "Small Plates"], vibeTags: ["Speakeasy", "Intimate", "Hidden"],
      occasionTags: ["Date Night", "Anniversary"], source: "google", matchScore: 96,
    },
    {
      id: "mock_2", name: "Skyline Social", category: "Rooftop Bar",
      address: "800 Maine Ave SW", city, state, country: "US",
      lat: params.location.lat - 0.005, lng: params.location.lng + 0.003,
      priceLevel: "$$", rating: 4.5, ratingCount: 528,
      photoUrls: ["https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400"],
      cuisineTags: ["American", "Cocktails"], vibeTags: ["Rooftop", "Views", "Trendy"],
      occasionTags: ["Group", "Celebration"], source: "foursquare", matchScore: 94,
    },
    {
      id: "mock_3", name: "Taquería del Sol", category: "Mexican",
      address: "2018 14th St NW", city, state, country: "US",
      lat: params.location.lat + 0.008, lng: params.location.lng - 0.001,
      priceLevel: "$", rating: 4.8, ratingCount: 891,
      photoUrls: ["https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400"],
      cuisineTags: ["Mexican", "Street Food", "Tacos"], vibeTags: ["Casual", "Viral", "Quick"],
      occasionTags: ["Casual", "Family"], source: "merged", matchScore: 92,
    },
    {
      id: "mock_4", name: "Maison Noir", category: "French",
      address: "3205 Grace St NW", city, state, country: "US",
      lat: params.location.lat - 0.002, lng: params.location.lng - 0.007,
      priceLevel: "$$$", rating: 4.9, ratingCount: 203,
      photoUrls: ["https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400"],
      cuisineTags: ["French", "Fine Dining", "Wine"], vibeTags: ["Upscale", "Romantic", "Elegant"],
      occasionTags: ["Date Night", "Anniversary", "Special"], source: "google", matchScore: 91,
    },
    {
      id: "mock_5", name: "Ember & Rye", category: "Steakhouse",
      address: "1100 Pennsylvania Ave NW", city, state, country: "US",
      lat: params.location.lat + 0.001, lng: params.location.lng + 0.005,
      priceLevel: "$$$", rating: 4.6, ratingCount: 417,
      photoUrls: ["https://images.unsplash.com/photo-1544025162-d76694265947?w=400"],
      cuisineTags: ["Steakhouse", "American", "Grill"], vibeTags: ["Upscale", "Bold", "Power Dinner"],
      occasionTags: ["Business", "Celebration"], source: "foursquare", matchScore: 88,
    },
    {
      id: "mock_6", name: "Blossom Tea Garden", category: "Cafe",
      address: "615 H St NE", city, state, country: "US",
      lat: params.location.lat + 0.006, lng: params.location.lng + 0.008,
      priceLevel: "$", rating: 4.4, ratingCount: 267,
      photoUrls: ["https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400"],
      cuisineTags: ["Tea", "Pastries", "Brunch"], vibeTags: ["Cozy", "Artsy", "Calm"],
      occasionTags: ["Solo", "Work", "Casual"], source: "google", matchScore: 85,
    },
  ];

  // Filter by query if provided
  if (params.query) {
    const q = params.query.toLowerCase();
    return mockVenues.filter((v) =>
      v.name.toLowerCase().includes(q) ||
      v.cuisineTags.some((t) => t.toLowerCase().includes(q)) ||
      v.vibeTags.some((t) => t.toLowerCase().includes(q)) ||
      v.category.toLowerCase().includes(q)
    );
  }

  return mockVenues;
}

export function discoverVenuesMock(): DiscoveredVenue[] {
  return getMockVenues({
    location: {
      lat: 38.9072,
      lng: -77.0369,
      city: "Washington",
      state: "DC",
      country: "US",
    },
  });
}

function getMockTripStops(params: TripCorridorParams): DiscoveredVenue[] {
  const midLat = (params.origin.lat + params.destination.lat) / 2;
  const midLng = (params.origin.lng + params.destination.lng) / 2;

  return [
    {
      id: "trip_1", name: "Highway Smokehouse", category: "BBQ",
      address: "Off I-95 Exit 42", city: "Fredericksburg", state: "VA", country: "US",
      lat: midLat - 0.3, lng: midLng + 0.1,
      priceLevel: "$", rating: 4.6, ratingCount: 523,
      photoUrls: ["https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400"],
      cuisineTags: ["BBQ", "Southern", "Smokehouse"], vibeTags: ["Casual", "Road Trip", "Hearty"],
      occasionTags: ["Road Trip"], source: "google", distanceMiles: 55, matchScore: 90,
    },
    {
      id: "trip_2", name: "Charge & Chill EV Lounge", category: "EV Charging",
      address: "Rest Area Mile 78", city: "Richmond", state: "VA", country: "US",
      lat: midLat, lng: midLng,
      priceLevel: "$", rating: 4.2, ratingCount: 89,
      photoUrls: [],
      cuisineTags: ["Coffee", "Snacks"], vibeTags: ["Quick", "EV Friendly", "Rest Stop"],
      occasionTags: ["Road Trip"], source: "foursquare", distanceMiles: 110, matchScore: 82,
    },
    {
      id: "trip_3", name: "Blue Ridge Brewery", category: "Brewery",
      address: "312 Main St", city: "Charlottesville", state: "VA", country: "US",
      lat: midLat + 0.2, lng: midLng - 0.3,
      priceLevel: "$$", rating: 4.7, ratingCount: 312,
      photoUrls: ["https://images.unsplash.com/photo-1559526324-593bc073d938?w=400"],
      cuisineTags: ["Craft Beer", "Pub Food", "American"], vibeTags: ["Chill", "Local", "Scenic"],
      occasionTags: ["Road Trip", "Group"], source: "merged", distanceMiles: 130, matchScore: 88,
    },
  ];
}

// ─── Deduplication ──────────────────────────────────────────

function deduplicateVenues(venues: DiscoveredVenue[]): DiscoveredVenue[] {
  const seen = new Map<string, DiscoveredVenue>();

  for (const venue of venues) {
    // Normalize name for comparison
    const key = normalizeVenueName(venue.name) + "|" + venue.city.toLowerCase();

    if (seen.has(key)) {
      // Merge: prefer Google for photos/details, Foursquare for categories
      const existing = seen.get(key)!;
      seen.set(key, mergeVenues(existing, venue));
    } else {
      seen.set(key, venue);
    }
  }

  return Array.from(seen.values());
}

function normalizeVenueName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .replace(/^the/, "");
}

function mergeVenues(a: DiscoveredVenue, b: DiscoveredVenue): DiscoveredVenue {
  return {
    ...a,
    source: "merged",
    googlePlaceId: a.googlePlaceId ?? b.googlePlaceId,
    foursquareId: a.foursquareId ?? b.foursquareId,
    rating: a.rating ?? b.rating,
    ratingCount: Math.max(a.ratingCount ?? 0, b.ratingCount ?? 0),
    phone: a.phone ?? b.phone,
    website: a.website ?? b.website,
    photoUrls: [...new Set([...a.photoUrls, ...b.photoUrls])],
    cuisineTags: [...new Set([...a.cuisineTags, ...b.cuisineTags])],
    vibeTags: [...new Set([...a.vibeTags, ...b.vibeTags])],
    occasionTags: [...new Set([...a.occasionTags, ...b.occasionTags])],
    matchScore: Math.max(a.matchScore ?? 0, b.matchScore ?? 0),
  };
}

// ─── Helpers ────────────────────────────────────────────────

function buildSearchQuery(params: VenueSearchParams): string {
  const parts: string[] = [];
  if (params.cuisines?.length) parts.push(params.cuisines.join(" "));
  if (params.vibes?.length) parts.push(params.vibes.join(" "));
  if (params.occasion) parts.push(params.occasion);
  if (params.priceLevel === "$$$$") parts.push("fine dining");
  if (params.priceLevel === "$") parts.push("casual");
  return parts.length > 0 ? parts.join(" ") + " restaurant" : "popular restaurants and bars";
}

function mapGooglePrice(level: string | undefined): string {
  const map: Record<string, string> = {
    PRICE_LEVEL_FREE: "$",
    PRICE_LEVEL_INEXPENSIVE: "$",
    PRICE_LEVEL_MODERATE: "$$",
    PRICE_LEVEL_EXPENSIVE: "$$$",
    PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
  };
  return map[level ?? ""] ?? "$$";
}

function mapFoursquarePrice(level: number | undefined): string {
  if (!level) return "$$";
  return ["$", "$$", "$$$", "$$$$"][level - 1] ?? "$$";
}

function mapGoogleCategory(types: string[]): string {
  if (types.includes("bar")) return "Bar";
  if (types.includes("night_club")) return "Nightclub";
  if (types.includes("cafe")) return "Cafe";
  if (types.includes("bakery")) return "Bakery";
  if (types.includes("meal_delivery")) return "Delivery";
  if (types.includes("restaurant")) return "Restaurant";
  return "Venue";
}

function extractCuisineTags(types: string[], name: string): string[] {
  const tags: string[] = [];
  const combined = [...types, ...name.toLowerCase().split(/\s+/)].join(" ");
  const cuisineMap: Record<string, string> = {
    japanese: "Japanese", sushi: "Japanese", ramen: "Japanese",
    italian: "Italian", pizza: "Italian", pasta: "Italian",
    mexican: "Mexican", taco: "Mexican", burrito: "Mexican",
    chinese: "Chinese", thai: "Thai", indian: "Indian",
    french: "French", korean: "Korean", vietnamese: "Vietnamese",
    american: "American", burger: "American", bbq: "BBQ",
    seafood: "Seafood", steak: "Steakhouse", vegan: "Vegan",
    mediterranean: "Mediterranean",
  };
  for (const [keyword, tag] of Object.entries(cuisineMap)) {
    if (combined.includes(keyword)) tags.push(tag);
  }
  return [...new Set(tags)];
}

function extractVibeTags(types: string[] | string, name: string): string[] {
  const tags: string[] = [];
  const combined = (Array.isArray(types) ? types.join(" ") : types) + " " + name;
  const lower = combined.toLowerCase();
  if (/rooftop|skyline|terrace/.test(lower)) tags.push("Rooftop");
  if (/speakeasy|hidden|secret|underground/.test(lower)) tags.push("Speakeasy");
  if (/lounge|chill|calm/.test(lower)) tags.push("Chill");
  if (/club|dance|dj/.test(lower)) tags.push("Nightlife");
  if (/garden|patio|outdoor/.test(lower)) tags.push("Outdoor");
  if (/fine.dining|upscale|elegant/.test(lower)) tags.push("Upscale");
  if (/casual|quick|fast/.test(lower)) tags.push("Casual");
  if (/family|kid/.test(lower)) tags.push("Family");
  if (/craft|artisan|local/.test(lower)) tags.push("Artisan");
  if (/live.music|jazz|blues/.test(lower)) tags.push("Live Music");
  return tags;
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function generateWaypoints(origin: GeoLocation, destination: GeoLocation, intervalMiles: number): GeoLocation[] {
  const totalDist = calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng);
  const numPoints = Math.max(1, Math.floor(totalDist / intervalMiles));
  const waypoints: GeoLocation[] = [];

  for (let i = 1; i <= numPoints; i++) {
    const fraction = i / (numPoints + 1);
    waypoints.push({
      lat: origin.lat + (destination.lat - origin.lat) * fraction,
      lng: origin.lng + (destination.lng - origin.lng) * fraction,
    });
  }

  return waypoints;
}

// ─── Cache-first venue query (reads from venue_cache) ──────

/**
 * Query venue_cache in Supabase for venues matching the search params.
 * Returns cached venues if available; empty array if none found.
 */
async function queryVenueCache(
  params: VenueSearchParams,
  supabaseUrl: string,
  supabaseAnonKey: string
): Promise<DiscoveredVenue[]> {
  const city = params.location.city;
  if (!city) return [];

  // Build the query body for venue-service/search
  const searchBody: Record<string, unknown> = {
    city,
    limit: params.limit ?? 30,
  };
  if (params.query) searchBody.q = params.query;
  if (params.priceLevel) {
    const priceMap: Record<string, string[]> = {
      "$": ["$"], "$$": ["$$"], "$$$": ["$$$"], "$$$$": ["$$$$"],
    };
    searchBody.price_tiers = priceMap[params.priceLevel] ?? ["$$"];
  }

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/venue_cache?city=ilike.%25${encodeURIComponent(city)}%25&expires_at=gte.${new Date().toISOString()}&limit=${params.limit ?? 30}&order=rating.desc.nullslast`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseAnonKey}`,
        apikey: supabaseAnonKey,
      },
    });

    if (!res.ok) return [];
    const rows = await res.json();

    if (!Array.isArray(rows) || rows.length === 0) return [];

    return rows.map((row: Record<string, unknown>): DiscoveredVenue => ({
      id: `vc_${row.id}`,
      name: (row.name as string) ?? "",
      category: (row.category as string) ?? "Venue",
      subcategory: row.subcategory as string | undefined,
      address: (row.address as string) ?? "",
      city: (row.city as string) ?? "",
      state: row.state as string | undefined,
      country: (row.country as string) ?? "US",
      lat: Number(row.latitude) || 0,
      lng: Number(row.longitude) || 0,
      priceLevel: (row.price_level as string) ?? "$$",
      rating: row.rating as number | undefined,
      ratingCount: row.rating_count as number | undefined,
      phone: row.phone as string | undefined,
      website: row.website as string | undefined,
      photoUrls: ((row.photo_urls as string[]) ?? []).map(
        (p) => `${supabaseUrl}/functions/v1/places-photo?path=${encodeURIComponent(p)}&w=600`
      ),
      cuisineTags: (row.cuisine_tags as string[]) ?? [],
      vibeTags: (row.vibe_tags as string[]) ?? [],
      occasionTags: (row.occasion_tags as string[]) ?? [],
      source: (row.source as "google" | "foursquare") ?? "google",
      googlePlaceId: row.google_place_id as string | undefined,
      foursquareId: row.foursquare_id as string | undefined,
    }));
  } catch (err) {
    console.warn("[Confetti] venue_cache query failed:", err);
    return [];
  }
}

/**
 * Trigger venue-ingest to populate venue_cache for a city.
 * Runs in the background — returns immediately.
 */
async function triggerIngest(
  city: string,
  lat: number,
  lng: number,
  state: string | undefined,
  supabaseUrl: string,
  supabaseAnonKey: string
): Promise<void> {
  try {
    await fetch(`${supabaseUrl}/functions/v1/venue-ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseAnonKey}`,
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify({ city, lat, lng, state }),
    });
  } catch (err) {
    console.warn("[Confetti] venue-ingest trigger failed:", err);
  }
}

// ─── Public API ─────────────────────────────────────────────

/**
 * Search for venues near a location.
 *
 * Strategy (cache-first):
 *   1. Query venue_cache in Supabase for fresh cached venues
 *   2. If cache has results → return them (zero API cost)
 *   3. If cache is empty → trigger venue-ingest to populate,
 *      then fall back to live Google Places while cache builds
 *   4. If everything fails → return mock venues
 *
 * This means Google Places is only called when a city is seen
 * for the first time. Every subsequent request is free.
 */
export async function discoverVenues(params: VenueSearchParams): Promise<DiscoveredVenue[]> {
  const config = getConfig();
  const hasSupabase = Boolean(config.supabaseUrl && config.supabaseAnonKey);

  if (!hasSupabase) {
    return getMockVenues(params);
  }

  // ── Step 1: Try cache first ────────────────────────────
  const cached = await queryVenueCache(
    params,
    config.supabaseUrl!,
    config.supabaseAnonKey!
  );

  if (cached.length > 0) {
    console.log(`[Confetti] Serving ${cached.length} venues from cache for ${params.location.city}`);

    // Filter by query if provided
    let results = cached;
    if (params.query) {
      const q = params.query.toLowerCase();
      results = cached.filter((v) =>
        v.name.toLowerCase().includes(q) ||
        v.cuisineTags.some((t) => t.toLowerCase().includes(q)) ||
        v.vibeTags.some((t) => t.toLowerCase().includes(q)) ||
        v.category.toLowerCase().includes(q)
      );
      // If filter narrows too much, return all cached
      if (results.length < 3) results = cached;
    }

    return results.map((v) => ({
      ...v,
      distanceMiles: calculateDistance(params.location.lat, params.location.lng, v.lat, v.lng),
    })).sort((a, b) => (b.matchScore ?? b.rating ?? 0) - (a.matchScore ?? a.rating ?? 0));
  }

  // ── Step 2: Cache miss — trigger ingest in background ──
  console.log(`[Confetti] Cache miss for ${params.location.city} — triggering ingest`);
  triggerIngest(
    params.location.city ?? "Unknown",
    params.location.lat,
    params.location.lng,
    params.location.state,
    config.supabaseUrl!,
    config.supabaseAnonKey!
  );

  // ── Step 3: Meanwhile, do a live search for immediate results
  const hasGoogle = Boolean(config.supabaseUrl && config.supabaseAnonKey);
  const hasFoursquare = Boolean(config.foursquareKey);

  const results = await Promise.allSettled([
    hasGoogle
      ? searchGooglePlaces(params, config.supabaseUrl!, config.supabaseAnonKey!)
      : Promise.resolve([]),
    hasFoursquare ? searchFoursquare(params, config.foursquareKey!) : Promise.resolve([]),
  ]);

  const venues: DiscoveredVenue[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") venues.push(...result.value);
  }

  const deduped = deduplicateVenues(venues);

  // ── Step 4: Last resort — mock venues ──────────────────
  if (deduped.length === 0) {
    console.warn("[Confetti] All sources returned 0 venues — falling back to curated picks");
    return getMockVenues(params);
  }

  return deduped.map((v) => ({
    ...v,
    distanceMiles: calculateDistance(params.location.lat, params.location.lng, v.lat, v.lng),
  })).sort((a, b) => (b.matchScore ?? b.rating ?? 0) - (a.matchScore ?? a.rating ?? 0));
}

/**
 * Discover venues along a trip corridor (for road trips / multi-state travel).
 * Generates waypoints along the route and searches around each one.
 */
export async function discoverTripCorridorVenues(params: TripCorridorParams): Promise<DiscoveredVenue[]> {
  const config = getConfig();
  const hasProvider = Boolean(
    (config.supabaseUrl && config.supabaseAnonKey) || config.foursquareKey
  );

  if (!hasProvider) {
    return getMockTripStops(params);
  }

  const waypoints = generateWaypoints(
    params.origin,
    params.destination,
    params.waypointIntervalMiles ?? 60
  );

  const allVenues: DiscoveredVenue[] = [];

  // Search around each waypoint
  for (const waypoint of waypoints) {
    const venues = await discoverVenues({
      location: waypoint,
      radiusMiles: params.corridorWidthMiles ?? 15,
      query: (params.stopTypes ?? ["dining", "experience"]).join(" "),
      limit: 5,
    });
    allVenues.push(...venues);
  }

  // Deduplicate and sort by distance along route
  const deduped = deduplicateVenues(allVenues);

  return deduped
    .map((v) => ({
      ...v,
      distanceMiles: calculateDistance(params.origin.lat, params.origin.lng, v.lat, v.lng),
    }))
    .sort((a, b) => (a.distanceMiles ?? 0) - (b.distanceMiles ?? 0))
    .slice(0, params.maxStops ?? 10);
}

/**
 * Forward-geocode a city name to lat/lng using Nominatim (OSM).
 * Returns undefined if the city cannot be resolved.
 */
export async function geocodeCity(cityName: string): Promise<GeoLocation | undefined> {
  try {
    const q = encodeURIComponent(cityName);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=jsonv2&limit=1&addressdetails=1`,
      { headers: { "User-Agent": "Confetti App" } }
    );
    if (!res.ok) return undefined;
    const results = await res.json();
    if (!results.length) return undefined;
    const top = results[0];
    return {
      lat: parseFloat(top.lat),
      lng: parseFloat(top.lon),
      city: top.address?.city ?? top.address?.town ?? top.name ?? cityName,
      state: top.address?.state,
      country: top.address?.country_code?.toUpperCase() ?? "US",
    };
  } catch {
    return undefined;
  }
}

/**
 * Get the user's current location (browser geolocation API).
 */
export function getUserLocation(): Promise<GeoLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc: GeoLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        // Reverse geocode to get city/state
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${loc.lat}&lon=${loc.lng}&format=jsonv2`,
            { headers: { "User-Agent": "Confetti App" } }
          );
          if (res.ok) {
            const data = await res.json();
            loc.city = data.address?.city ?? data.address?.town ?? data.address?.village;
            loc.state = data.address?.state;
            loc.country = data.address?.country_code?.toUpperCase() ?? "US";
          }
        } catch {
          // Reverse geocode failed, location still usable
        }
        resolve(loc);
      },
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

export function isVenueDiscoveryConfigured(): boolean {
  const config = getConfig();
  return Boolean(
    (config.supabaseUrl && config.supabaseAnonKey) || config.foursquareKey
  );
}
