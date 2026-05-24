// ============================================================
// venue-discovery-agent — public entry point for Claude-powered
// venue bootstrap. Delegates the actual discovery + persist +
// verify pipeline to _shared/venue-discovery.ts so the
// ai-recommend / wizard-itinerary / build-itinerary path uses
// the same prompt and verification rules.
//
// POST { city, minThreshold?, requestCount?, force?, nicheHint? }
// ============================================================

import { serve } from "../_shared/server.ts";
import { jsonResponse, errorResponse, supabaseAdmin } from "../_shared/supabase-client.ts";
import { consumeRateLimit, callerIdentity } from "../_shared/ratelimit.ts";
import { backfillVerifyVenues, ensureCityVenues } from "../_shared/venue-discovery.ts";

interface Body {
  /** Action. Default "discover". */
  mode?: "discover" | "verify_existing";
  /** Required for "discover". */
  city?: string;
  /** If existing rows < this, run discovery. Default 20. */
  minThreshold?: number;
  /** How many venues to ask Claude to generate. Default 30. */
  requestCount?: number;
  /** Always run discovery even if threshold met. */
  force?: boolean;
  /** Free-text niche, e.g. "hookah lounges and Mediterranean". */
  nicheHint?: string;
  /** For verify_existing: batch size per call. Default 25. */
  batchSize?: number;
}

interface VenueRow {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string | null;
  neighborhood: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  cuisine: string | null;
  cuisine_tags: string[] | null;
  vibe_tags: string[] | null;
  occasion_tags: string[] | null;
  price: string | null;
  price_level: number | null;
  rating: number | null;
  rating_count: number | null;
  photo_url: string | null;
  vibe_notes: string | null;
  popularity_score: number | null;
  website: string | null;
  is_verified: boolean | null;
  source_credit: string | null;
}

async function getVenues(city: string): Promise<VenueRow[]> {
  const { data, error } = await supabaseAdmin
    .from("venues")
    .select(
      "id,name,slug,city,state,neighborhood,address,lat,lng,cuisine,cuisine_tags,vibe_tags,occasion_tags,price,price_level,rating,rating_count,photo_url,vibe_notes,popularity_score,website,is_verified,source_credit",
    )
    .ilike("city", city)
    .order("is_verified", { ascending: false, nullsFirst: false })
    .order("popularity_score", { ascending: false, nullsFirst: false })
    .limit(200);
  if (error) {
    console.warn("[venue-discovery] read error:", error.message);
    return [];
  }
  return (data as VenueRow[]) ?? [];
}

serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") return jsonResponse({ ok: true });
    if (req.method !== "POST") return errorResponse("Method not allowed", 405);

    const allowed = await consumeRateLimit({
      scope: "venue-discovery-agent",
      identity: callerIdentity(req),
      burst: 10,
      refillPerSec: 10 / 60,
    });
    if (!allowed) return errorResponse("Rate limit exceeded", 429);

    let body: Body;
    try {
      body = (await req.json()) as Body;
    } catch {
      return errorResponse("Invalid JSON body");
    }

    // verify_existing mode: backfill verification on existing rows.
    if (body.mode === "verify_existing") {
      const result = await backfillVerifyVenues(
        Math.max(1, Math.min(body.batchSize ?? 25, 50)),
      );
      return jsonResponse({ mode: "verify_existing", ...result });
    }

    if (!body.city || body.city.trim().length === 0) {
      return errorResponse("city required");
    }

    const city = body.city.trim();
    const minThreshold = body.force ? 999_999 : Math.max(1, body.minThreshold ?? 20);
    const requestCount = Math.max(5, Math.min(body.requestCount ?? 30, 50));

    const before = (await getVenues(city)).length;
    const discovered = await ensureCityVenues(
      city,
      minThreshold,
      requestCount,
      body.nicheHint ?? null,
    );
    const venues = await getVenues(city);
    const mode: "cached" | "augmented" | "bootstrapped" =
      discovered === 0 ? "cached" : before === 0 ? "bootstrapped" : "augmented";

    return jsonResponse({
      city,
      mode,
      discovered,
      total: venues.length,
      venues,
    });
  } catch (err) {
    console.error("[venue-discovery-agent] uncaught:", (err as Error).stack ?? err);
    return errorResponse(
      `Unhandled: ${(err as Error).message ?? String(err)}`,
      500,
    );
  }
});
