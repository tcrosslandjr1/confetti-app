// ============================================================
// places-search — Server-side proxy for venue search
// Provider: Google Places API v1 (only — OpenStreetMap/Overpass
// fallback removed; Google is more accurate for ratings, photos,
// price levels, and opening hours).
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

// ─── Google Places ──────────────────────────────────────────

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

// ─── Handler ────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders() });

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

  // Google Places — the only provider.
  const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
  if (!apiKey) {
    console.error("[places-search] GOOGLE_PLACES_API_KEY is not set");
    return errorResponse("Venue search is unavailable: GOOGLE_PLACES_API_KEY not configured", 500);
  }

  try {
    const places = await searchGoogle(body, apiKey);
    return jsonResponse({ places, _provider: "google" });
  } catch (err) {
    console.error("[places-search] Google Places failed:", (err as Error).message);
    return errorResponse(`Google Places failed: ${(err as Error).message}`, 502);
  }
});
