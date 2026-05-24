// wizard-itinerary — Confetti's "Build My Night" backend.
// Two modes:
//   • itinerary    → returns 3 stops chosen by vibe key
//   • alternatives → returns up to N candidates for a single vibe / free-text query
// Pulls candidates from the curated `venues` table (1,074 entries) — no Google Places.

import { serve } from "../_shared/server.ts";
import { jsonResponse, errorResponse, supabaseAdmin } from "../_shared/supabase-client.ts";
import { consumeRateLimit, callerIdentity } from "../_shared/ratelimit.ts";

interface Body {
  vibes?: string[];
  budget?: string | null;
  lat?: number | null;
  lng?: number | null;
  city?: string | null;
  count?: number;
  mode?: "itinerary" | "alternatives";
  vibe?: string | null;
  query?: string | null;
  excludeIds?: string[];
  limit?: number;
}

interface VenueRow {
  id: string;
  name: string;
  city: string;
  neighborhood: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  cuisine: string | null;
  cuisine_tags: string[] | null;
  vibe_tags: string[] | null;
  price: string | null;
  price_level: number | null;
  rating: number | null;
  rating_count: number | null;
  photo_url: string | null;
  vibe_notes: string | null;
  popularity_score: number | null;
}

interface VibeRecipe {
  /** Vibe tags any-of */
  vibeAny?: string[];
  /** Cuisine substring(s) */
  cuisineLike?: string[];
  /** Min/max price level filter */
  minPrice?: number;
  maxPrice?: number;
  time: string;
  vibeLabel: string;
  tone: string;
}

const VIBE_RECIPES: Record<string, VibeRecipe> = {
  rooftop: { vibeAny: ["rooftop", "outdoor", "skyline"], time: "7:00 PM", vibeLabel: "Rooftop views", tone: "bg-coral" },
  dance: { vibeAny: ["dance", "nightclub", "club"], time: "10:30 PM", vibeLabel: "Dance floor", tone: "bg-purple" },
  speakeasy: { vibeAny: ["speakeasy", "hidden-gem", "cocktails"], cuisineLike: ["speakeasy", "cocktail"], time: "8:30 PM", vibeLabel: "Speakeasy", tone: "bg-gold" },
  live: { vibeAny: ["live", "music", "concert"], time: "8:00 PM", vibeLabel: "Live music", tone: "bg-pink-300" },
  bougie: { vibeAny: ["upscale", "fine-dining", "instagrammable"], cuisineLike: ["fine dining", "tasting"], minPrice: 3, time: "6:30 PM", vibeLabel: "Bougie dinner", tone: "bg-emerald-400" },
  dive: { vibeAny: ["dive", "casual"], cuisineLike: ["dive"], time: "9:00 PM", vibeLabel: "Dive bar", tone: "bg-amber-300" },
  late: { vibeAny: ["late-night"], time: "11:30 PM", vibeLabel: "Late night eats", tone: "bg-sky-300" },
};

const DEFAULT_VIBES = ["bougie", "speakeasy", "rooftop"];

function budgetToMaxLevel(b?: string | null): number {
  if (!b) return 4;
  return Math.min(4, Math.max(1, b.length));
}

function popScore(v: VenueRow): number {
  const r = v.rating ?? 0;
  const n = v.rating_count ?? 0;
  return r * Math.log10(n + 10);
}

async function getUserIdFromAuth(req: Request): Promise<string | null> {
  try {
    const auth = req.headers.get("Authorization") || req.headers.get("authorization");
    if (!auth) return null;
    const token = auth.replace(/^Bearer\s+/i, "");
    const url = Deno.env.get("SUPABASE_URL");
    const anon = Deno.env.get("SUPABASE_ANON_KEY");
    if (!url || !anon) return null;
    const r = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: anon, Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return null;
    const j = await r.json();
    return j?.id ?? null;
  } catch {
    return null;
  }
}

async function fetchBlockedPlaceIds(
  userId: string | null,
  _city: string | null,
): Promise<string[]> {
  if (!userId) return [];
  try {
    const { data } = await supabaseAdmin
      .from("blocked_places")
      .select("place_id")
      .eq("user_id", userId);
    return ((data as { place_id: string }[]) ?? []).map((r) => r.place_id);
  } catch {
    return [];
  }
}

async function fetchCandidates(
  recipe: VibeRecipe,
  body: Body,
  exclude: Set<string>,
  pageSize = 12,
): Promise<VenueRow[]> {
  let q = supabaseAdmin
    .from("venues")
    .select(
      "id,name,city,neighborhood,address,lat,lng,cuisine,cuisine_tags,vibe_tags,price,price_level,rating,rating_count,photo_url,vibe_notes,popularity_score",
    )
    .order("popularity_score", { ascending: false, nullsFirst: false })
    .order("rating", { ascending: false, nullsFirst: false })
    .limit(pageSize * 3);

  if (body.city) {
    const firstWord = body.city.split(/[\s,]+/)[0];
    q = q.ilike("city", `%${firstWord}%`);
  }

  // Apply recipe filter (any of vibe_tags OR cuisine substring).
  if (recipe.vibeAny && recipe.vibeAny.length > 0) {
    q = q.overlaps("vibe_tags", recipe.vibeAny);
  } else if (recipe.cuisineLike && recipe.cuisineLike.length > 0) {
    const ors = recipe.cuisineLike.map((t) => `cuisine.ilike.%${t}%`).join(",");
    q = q.or(ors);
  }

  // Budget cap.
  const maxLevel = budgetToMaxLevel(body.budget);
  if (recipe.minPrice) q = q.gte("price_level", recipe.minPrice);
  q = q.lte("price_level", maxLevel);

  const { data, error } = await q;
  if (error) {
    console.warn("[wizard-itinerary] venues error:", error.message);
    return [];
  }
  return ((data as VenueRow[]) ?? []).filter((v) => !exclude.has(v.id));
}

async function fetchCandidatesWithCuisineFallback(
  recipe: VibeRecipe,
  body: Body,
  exclude: Set<string>,
  pageSize: number,
): Promise<VenueRow[]> {
  const primary = await fetchCandidates(recipe, body, exclude, pageSize);
  if (primary.length >= 1) return primary;
  // If recipe used vibe_tags first, retry with cuisine substring (or vice versa).
  if (recipe.vibeAny && recipe.cuisineLike) {
    const alt: VibeRecipe = { ...recipe, vibeAny: undefined };
    const second = await fetchCandidates(alt, body, exclude, pageSize);
    if (second.length > 0) return second;
  }
  // Last resort: drop recipe constraints, keep city + budget only.
  const broad: VibeRecipe = {
    time: recipe.time,
    vibeLabel: recipe.vibeLabel,
    tone: recipe.tone,
    minPrice: recipe.minPrice,
    maxPrice: recipe.maxPrice,
  };
  return fetchCandidates(broad, body, exclude, pageSize);
}

function shapeStop(v: VenueRow, recipe: VibeRecipe, vibeKey: string) {
  return {
    time: recipe.time,
    venue: v.name,
    vibe: recipe.vibeLabel,
    vibeLabel: recipe.vibeLabel,
    vibeKey,
    tone: recipe.tone,
    address: v.address ?? "",
    neighborhood: v.neighborhood ?? "",
    rating: v.rating ?? null,
    userRatingCount: v.rating_count ?? null,
    priceLevel: v.price_level ?? null,
    photo: v.photo_url ?? null,
    lat: v.lat ?? null,
    lng: v.lng ?? null,
    placeId: v.id,
  };
}

serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") return jsonResponse({ ok: true });
    if (req.method !== "POST") return errorResponse("Method not allowed", 405);

    const allowed = await consumeRateLimit({
      scope: "wizard-itinerary",
      identity: callerIdentity(req),
      burst: 20,
      refillPerSec: 20 / 60,
    });
    if (!allowed) return errorResponse("Rate limit exceeded — try again in a moment", 429);

    let body: Body;
    try {
      body = (await req.json()) as Body;
    } catch {
      return errorResponse("Invalid JSON body");
    }

    const userId = await getUserIdFromAuth(req);
    const blocked = await fetchBlockedPlaceIds(userId, body.city ?? null);

    // ── Alternatives mode ──
    if (body.mode === "alternatives") {
      const exclude = new Set<string>([...(body.excludeIds ?? []), ...blocked]);
      const limit = Math.max(1, Math.min(body.limit ?? 6, 10));
      const recipe: VibeRecipe =
        body.vibe && VIBE_RECIPES[body.vibe]
          ? VIBE_RECIPES[body.vibe]
          : {
              vibeAny: body.query
                ? body.query.toLowerCase().split(/\s+/).filter(Boolean)
                : undefined,
              time: "8:00 PM",
              vibeLabel: body.query || "Pick",
              tone: "bg-coral",
            };
      const rows = await fetchCandidatesWithCuisineFallback(recipe, body, exclude, limit + 2);
      const candidates = rows.slice(0, limit).map((v) => ({
        ...shapeStop(v, recipe, body.vibe ?? "free"),
        userRatingCount: v.rating_count ?? null,
      }));
      return jsonResponse({ candidates });
    }

    // ── Default itinerary mode ──
    const requestedVibes = (body.vibes ?? []).filter((v) => VIBE_RECIPES[v]);
    const vibeKeys = (requestedVibes.length ? requestedVibes : DEFAULT_VIBES).slice(0, 3);
    const count = Math.max(1, Math.min(body.count ?? 3, 4));
    while (vibeKeys.length < count) {
      const fill = DEFAULT_VIBES.find((v) => !vibeKeys.includes(v));
      if (!fill) break;
      vibeKeys.push(fill);
    }

    const seen = new Set<string>(blocked);
    const stops: ReturnType<typeof shapeStop>[] = [];
    for (const vibeKey of vibeKeys) {
      const recipe = VIBE_RECIPES[vibeKey];
      const rows = await fetchCandidatesWithCuisineFallback(recipe, body, seen, 8);
      const pick = rows[0];
      if (!pick) continue;
      seen.add(pick.id);
      stops.push(shapeStop(pick, recipe, vibeKey));
    }

    return jsonResponse({ stops });
  } catch (err) {
    console.error("[wizard-itinerary] uncaught:", (err as Error).stack ?? err);
    return errorResponse(
      `Unhandled: ${(err as Error).message ?? String(err)}`,
      500,
    );
  }
});
