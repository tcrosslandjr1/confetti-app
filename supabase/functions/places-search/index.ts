// ============================================================
// places-search — Server-side proxy for venue search
// Primary: Google Places API v1 | Fallback: OpenStreetMap Overpass
// Keeps GOOGLE_PLACES_API_KEY off the client bundle.
// ============================================================

import { serve } from "../_shared/server.ts";
import { corsHeaders, jsonResponse, errorResponse } from "../_shared/supabase-client.ts";
import { consumeRateLimit, callerIdentity } from "../_shared/ratelimit.ts";

interface SearchBody {
  textQuery: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  maxResultCount?: number;
  openNow?: boolean;
}

const FIELD_MASK = [
  "places.id", "places.displayName", "places.formattedAddress",
  "places.location", "places.rating", "places.userRatingCount",
  "places.priceLevel", "places.types", "places.primaryType",
  "places.websiteUri", "places.nationalPhoneNumber",
  "places.regularOpeningHours", "places.photos",
].join(",");

// ─── Google Places (primary) ────────────────────────────────

async function searchGoogle(body: SearchBody, apiKey: string) {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery: body.textQuery,
      locationBias: {
        circle: {
          center: { latitude: body.lat, longitude: body.lng },
          radius: body.radiusMeters,
        },
      },
      maxResultCount: body.maxResultCount ?? 20,
      ...(body.openNow ? { openNow: true } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Google Places ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  return (data.places ?? []).map((p: Record<string, unknown>) => {
    const photos = p.photos as Array<{ name: string }> | undefined;
    return { ...p, photoProxyPaths: photos?.slice(0, 4).map((ph) => ph.name) ?? [] };
  });
}

// ─── OpenStreetMap Overpass (fallback) ───────────────────────

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

/** Extract cuisine keyword from text query */
function extractCuisineHint(textQuery: string): string {
  return textQuery.toLowerCase()
    .replace(/restaurants?|bars?|food|places?|best|top|good|near|me|in|the|and|or|nightlife|clubs?/gi, "")
    .trim();
}

/** Build Overpass query — always fetches broad set, client-side filtering narrows by cuisine */
function buildOverpassQuery(body: SearchBody): string {
  const r = Math.max(body.radiusMeters || 3000, 3000);
  // Fetch extra results so post-filter still has enough
  const fetchLimit = Math.min((body.maxResultCount ?? 20) * 4, 80);
  const q = body.textQuery.toLowerCase();

  const amenities: string[] = [];
  if (/bar|cocktail|lounge|speakeasy|pub|drink/i.test(q)) amenities.push("bar", "pub");
  if (/club|nightclub|dance/i.test(q)) amenities.push("nightclub");
  if (/cafe|coffee/i.test(q)) amenities.push("cafe");
  if (amenities.length === 0) amenities.push("restaurant", "bar", "cafe", "nightclub", "fast_food");

  const amenityRegex = amenities.join("|");
  const area = `around:${r},${body.lat},${body.lng}`;

  // Always use the broad amenity query (proven reliable from cloud IPs)
  const filters = `nw["amenity"~"${amenityRegex}"](${area});`;
  return `[out:json][timeout:15];(${filters});out center ${fetchLimit};`;
}

/** Score an OSM element against a cuisine keyword (higher = better match) */
function cuisineRelevanceScore(el: Record<string, unknown>, cuisineHint: string): number {
  if (!cuisineHint) return 1; // no filter → all equal
  const tags = (el.tags ?? {}) as Record<string, string>;
  const name = (tags.name ?? "").toLowerCase();
  const cuisine = (tags.cuisine ?? "").toLowerCase();
  const hint = cuisineHint.toLowerCase();

  if (cuisine.includes(hint)) return 10; // direct cuisine match
  if (name.includes(hint)) return 8;     // name contains keyword
  return 0; // no match
}

/** Map an Overpass OSM element → Google Places–shaped object */
function osmToGoogleFormat(el: Record<string, unknown>) {
  const tags = (el.tags ?? {}) as Record<string, string>;
  const amenity = tags.amenity ?? "restaurant";

  // Build a formatted address
  const addrParts = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ");
  const cityState = [tags["addr:city"], tags["addr:state"]].filter(Boolean).join(", ");
  const address = [addrParts, cityState, tags["addr:postcode"]].filter(Boolean).join(", ");

  // Map amenity → Google-style types
  const typeMap: Record<string, string[]> = {
    restaurant: ["restaurant", "food", "point_of_interest", "establishment"],
    bar: ["bar", "point_of_interest", "establishment"],
    pub: ["bar", "point_of_interest", "establishment"],
    nightclub: ["night_club", "point_of_interest", "establishment"],
    cafe: ["cafe", "food", "point_of_interest", "establishment"],
  };
  const types = typeMap[amenity] ?? typeMap.restaurant;

  // Parse cuisine into tags
  const cuisineTags = tags.cuisine?.split(/[;,]/).map((c: string) => c.trim()) ?? [];

  // Ways use center coords from `out center`; nodes use lat/lon directly
  const center = el.center as { lat: number; lon: number } | undefined;
  const lat = (center?.lat ?? el.lat) as number;
  const lon = (center?.lon ?? el.lon) as number;

  return {
    id: `osm_${el.id}`,
    displayName: { text: tags.name ?? "Unknown Venue", languageCode: "en" },
    formattedAddress: address || "Address unavailable",
    location: { latitude: lat, longitude: lon },
    types: [...types, ...cuisineTags],
    primaryType: amenity,
    websiteUri: tags.website ?? tags["contact:website"] ?? undefined,
    nationalPhoneNumber: tags.phone ?? tags["contact:phone"] ?? undefined,
    regularOpeningHours: tags.opening_hours
      ? { weekdayDescriptions: [tags.opening_hours] }
      : undefined,
    // No ratings/photos from OSM — frontend handles undefined gracefully
    rating: undefined,
    userRatingCount: undefined,
    priceLevel: undefined,
    photoProxyPaths: [],
    _source: "openstreetmap",
  };
}

async function searchOverpass(body: SearchBody) {
  const query = buildOverpassQuery(body);
  console.log("[places-search] Overpass query:", query);

  let lastError = "";
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      console.log(`[places-search] Trying Overpass endpoint: ${endpoint}`);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "ConfettiApp/1.0 (concierge venue search)",
        },
        body: `data=${encodeURIComponent(query)}`,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.warn(`[places-search] ${endpoint} returned ${res.status}: ${text.slice(0, 200)}`);
        lastError = `${endpoint} ${res.status}: ${text.slice(0, 200)}`;
        continue;
      }

      const data = await res.json();
      const elements = (data.elements ?? []) as Array<Record<string, unknown>>;
      console.log(`[places-search] ${endpoint} returned ${elements.length} raw elements`);

      // Filter to named venues, then rank by cuisine relevance
      const cuisineHint = extractCuisineHint(body.textQuery);
      const named = elements.filter((el) => (el.tags as Record<string, string>)?.name);
      console.log(`[places-search] ${named.length} named venues from ${elements.length} raw`);

      let results = named;
      if (cuisineHint.length > 2) {
        // Score and sort by cuisine match, keep matches + some generic fill
        const scored = named.map((el) => ({ el, score: cuisineRelevanceScore(el, cuisineHint) }));
        scored.sort((a, b) => b.score - a.score);
        // Keep cuisine matches; if fewer than requested, pad with generic
        const matches = scored.filter((s) => s.score > 0);
        const limit = body.maxResultCount ?? 20;
        if (matches.length >= limit) {
          results = matches.slice(0, limit).map((s) => s.el);
        } else {
          results = scored.slice(0, limit).map((s) => s.el);
        }
        console.log(`[places-search] Cuisine "${cuisineHint}": ${matches.length} matches, returning ${results.length}`);
      } else {
        results = named.slice(0, body.maxResultCount ?? 20);
      }

      return results.map(osmToGoogleFormat);
    } catch (err) {
      console.warn(`[places-search] ${endpoint} error:`, (err as Error).message);
      lastError = `${endpoint}: ${(err as Error).message}`;
    }
  }
  throw new Error(`All Overpass endpoints failed. Last: ${lastError}`);
}

// ─── Handler ────────────────────────────────────────────────

// Lightweight friction barrier: require the project anon/publishable key.
// Stops opportunistic bots scanning Supabase function URLs from running up
// our Google Places bill. Not a full auth check — that's done by Supabase
// platform JWT verification on other functions.
function isAuthorized(req: Request): boolean {
  const expected = Deno.env.get("SUPABASE_ANON_KEY");
  if (!expected) return true; // fail-open if secret not set (don't lock ourselves out)
  const apiKey = req.headers.get("apikey");
  const auth = req.headers.get("Authorization") ?? "";
  return apiKey === expected || auth === `Bearer ${expected}`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders() });

  if (!isAuthorized(req)) {
    return errorResponse("Unauthorized", 401);
  }

  // 60 requests/min/IP — protects Google Places billing from runaway loops.
  const allowed = await consumeRateLimit({
    scope: "places-search",
    identity: callerIdentity(req),
    burst: 60,
    refillPerSec: 1,
  });
  if (!allowed) return errorResponse("Rate limit exceeded", 429);

  let body: SearchBody;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  if (!body.textQuery || typeof body.lat !== "number" || typeof body.lng !== "number") {
    return errorResponse("textQuery, lat, lng required");
  }
  if (body.textQuery.length > 200) {
    return errorResponse("textQuery must be <= 200 chars");
  }
  if (Math.abs(body.lat) > 90 || Math.abs(body.lng) > 180) {
    return errorResponse("lat/lng out of range");
  }
  if (typeof body.radiusMeters === "number" && (body.radiusMeters < 1 || body.radiusMeters > 50000)) {
    return errorResponse("radiusMeters must be 1-50000");
  }
  if (typeof body.maxResultCount === "number" && (body.maxResultCount < 1 || body.maxResultCount > 20)) {
    return errorResponse("maxResultCount must be 1-20");
  }

  // 1️⃣  Try Google Places first
  const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
  if (apiKey) {
    try {
      const places = await searchGoogle(body, apiKey);
      if (places.length > 0) {
        return jsonResponse({ places, _provider: "google" });
      }
    } catch (err) {
      console.warn("[places-search] Google failed, falling back to Overpass:", (err as Error).message);
    }
  }

  // 2️⃣  Fallback: OpenStreetMap Overpass (free, no key)
  try {
    const places = await searchOverpass(body);
    return jsonResponse({ places, _provider: "openstreetmap" });
  } catch (err) {
    return errorResponse(`All providers failed. Overpass: ${(err as Error).message}`, 502);
  }
});
