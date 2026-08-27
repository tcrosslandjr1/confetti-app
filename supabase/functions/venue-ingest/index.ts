// ============================================================
// venue-ingest — Batch ingest venues from Google Places → venue_cache
//
// Called on-demand when a city is first requested, or by cron
// to refresh stale entries. Writes to venue_cache so the app
// never needs to hit Google Places at request time.
//
// POST { city, lat, lng, queries?: string[], maxPerQuery?: number }
// ============================================================

import { serve } from "../_shared/server.ts";
import { getCallerUserId, isInternalCaller, rateLimitOr429 } from "../_shared/guard.ts";
import {
  supabaseAdmin,
  corsHeaders,
  jsonResponse,
  errorResponse,
} from "../_shared/supabase-client.ts";

interface IngestBody {
  city: string;
  state?: string;
  country?: string;
  lat: number;
  lng: number;
  queries?: string[];       // default set of queries if not provided
  maxPerQuery?: number;     // default 20
  forceRefresh?: boolean;   // skip cache-freshness check
}

const DEFAULT_QUERIES = [
  "popular restaurants",
  "best bars and cocktail lounges",
  "nightlife and clubs",
  "rooftop bars",
  "brunch spots",
  "late night dining",
  "speakeasy bars",
  "fine dining restaurants",
  "casual dining",
  "live music venues",
  "coffee shops and cafes",
  "dessert and bakeries",
];

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.priceLevel",
  "places.types",
  "places.primaryType",
  "places.websiteUri",
  "places.nationalPhoneNumber",
  "places.regularOpeningHours",
  "places.photos",
].join(",");

serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders() });

  // Pipeline tool: 12 Enterprise-tier Google Text Searches per call, and
  // forceRefresh bypasses the cache. Internal callers pass; humans must be
  // signed in and are tightly limited.
  if (!isInternalCaller(req)) {
    const userId = await getCallerUserId(req);
    if (!userId) return errorResponse("Unauthorized", 401);
    const limited = await rateLimitOr429(
      req,
      { scope: "venue-ingest", burst: 3, refillPerSec: 1 / 300 },
      corsHeaders(),
      userId,
    );
    if (limited) return limited;
  }

  const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
  if (!apiKey) return errorResponse("GOOGLE_PLACES_API_KEY not configured", 500);

  let body: IngestBody;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  if (!body.city || typeof body.lat !== "number" || typeof body.lng !== "number") {
    return errorResponse("city, lat, lng required");
  }

  const city = body.city;
  const state = body.state ?? null;
  const country = body.country ?? "US";

  // ── Check if city already has fresh data ─────────────────
  if (!body.forceRefresh) {
    const { count } = await supabaseAdmin
      .from("venue_cache")
      .select("id", { count: "exact", head: true })
      .ilike("city", `%${city}%`)
      .gte("expires_at", new Date().toISOString());

    if ((count ?? 0) >= 20) {
      return jsonResponse({
        status: "cached",
        message: `${city} already has ${count} fresh venues`,
        ingested: 0,
      });
    }
  }

  // ── Fetch from Google Places for each query ──────────────
  const queries = body.queries ?? DEFAULT_QUERIES;
  const maxPerQuery = body.maxPerQuery ?? 20;
  const radiusMeters = 5000; // 5km from city center

  let totalIngested = 0;
  let totalSkipped = 0;
  const errors: string[] = [];

  for (const query of queries) {
    try {
      const res = await fetch(
        "https://places.googleapis.com/v1/places:searchText",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": FIELD_MASK,
          },
          body: JSON.stringify({
            textQuery: `${query} in ${city}`,
            locationBias: {
              circle: {
                center: { latitude: body.lat, longitude: body.lng },
                radius: radiusMeters,
              },
            },
            maxResultCount: maxPerQuery,
          }),
        }
      );

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        errors.push(`Query "${query}": ${res.status} ${text.slice(0, 200)}`);
        continue;
      }

      const data = await res.json();
      const places = data.places ?? [];

      for (const place of places) {
        const loc = place.location as
          | { latitude: number; longitude: number }
          | undefined;
        const displayName =
          (place.displayName as { text: string } | undefined)?.text ?? "";
        const types = (place.types as string[]) ?? [];
        const photos = (place.photos as Array<{ name: string }>) ?? [];

        const record = {
          google_place_id: place.id as string,
          name: displayName,
          category: mapCategory(types),
          subcategory: (place.primaryType as string) ?? null,
          address: (place.formattedAddress as string) ?? null,
          city,
          state,
          country,
          latitude: loc?.latitude ?? null,
          longitude: loc?.longitude ?? null,
          price_level: mapPrice(place.priceLevel as string | undefined),
          rating: (place.rating as number) ?? null,
          rating_count: (place.userRatingCount as number) ?? null,
          phone: (place.nationalPhoneNumber as string) ?? null,
          website: (place.websiteUri as string) ?? null,
          hours: place.regularOpeningHours ?? null,
          photo_urls: photos.slice(0, 4).map((p) => p.name),
          cuisine_tags: extractCuisine(types, displayName),
          vibe_tags: extractVibes(types, displayName),
          occasion_tags: [] as string[],
          source: "google",
          raw_data: place,
          fetched_at: new Date().toISOString(),
          expires_at: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(), // 7 days
        };

        // Upsert by google_place_id — update if exists, insert if new
        const { error: upsertError } = await supabaseAdmin
          .from("venue_cache")
          .upsert(record, { onConflict: "google_place_id" });

        if (upsertError) {
          totalSkipped++;
        } else {
          totalIngested++;
        }
      }

      // Rate-limit: pause 200ms between queries to be respectful
      await new Promise((r) => setTimeout(r, 200));
    } catch (err) {
      errors.push(`Query "${query}": ${(err as Error).message}`);
    }
  }

  return jsonResponse({
    status: "completed",
    city,
    ingested: totalIngested,
    skipped: totalSkipped,
    errors: errors.length > 0 ? errors : undefined,
  });
});

// ── Helpers ──────────────────────────────────────────────────

function mapPrice(level: string | undefined): string {
  const map: Record<string, string> = {
    PRICE_LEVEL_FREE: "$",
    PRICE_LEVEL_INEXPENSIVE: "$",
    PRICE_LEVEL_MODERATE: "$$",
    PRICE_LEVEL_EXPENSIVE: "$$$",
    PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
  };
  return map[level ?? ""] ?? "$$";
}

function mapCategory(types: string[]): string {
  if (types.includes("night_club")) return "Nightclub";
  if (types.includes("bar")) return "Bar";
  if (types.includes("cafe")) return "Cafe";
  if (types.includes("bakery")) return "Bakery";
  if (types.includes("restaurant")) return "Restaurant";
  if (types.includes("tourist_attraction")) return "Attraction";
  return "Venue";
}

function extractCuisine(types: string[], name: string): string[] {
  const tags: string[] = [];
  const combined = [...types, ...name.toLowerCase().split(/\s+/)].join(" ");
  const map: Record<string, string> = {
    japanese: "Japanese", sushi: "Japanese", ramen: "Japanese",
    italian: "Italian", pizza: "Italian", pasta: "Italian",
    mexican: "Mexican", taco: "Mexican",
    chinese: "Chinese", thai: "Thai", indian: "Indian",
    french: "French", korean: "Korean", vietnamese: "Vietnamese",
    american: "American", burger: "American", bbq: "BBQ",
    seafood: "Seafood", steak: "Steakhouse", vegan: "Vegan",
    mediterranean: "Mediterranean",
  };
  for (const [kw, tag] of Object.entries(map)) {
    if (combined.includes(kw)) tags.push(tag);
  }
  return [...new Set(tags)];
}

function extractVibes(types: string[], name: string): string[] {
  const tags: string[] = [];
  const lower = [...types, name].join(" ").toLowerCase();
  if (/rooftop|skyline|terrace/.test(lower)) tags.push("Rooftop");
  if (/speakeasy|hidden|secret/.test(lower)) tags.push("Speakeasy");
  if (/lounge|chill/.test(lower)) tags.push("Chill");
  if (/club|dance|dj/.test(lower)) tags.push("Nightlife");
  if (/garden|patio|outdoor/.test(lower)) tags.push("Outdoor");
  if (/fine.dining|upscale|elegant/.test(lower)) tags.push("Upscale");
  if (/casual|quick|fast/.test(lower)) tags.push("Casual");
  if (/live.music|jazz|blues/.test(lower)) tags.push("Live Music");
  return tags;
}
