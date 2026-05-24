// ============================================================
// venue-discovery-agent — Claude-powered venue bootstrap.
//
// Given a city, returns its venues from the `venues` table. If the
// city has fewer than `minThreshold` rows, asks Claude to generate
// a fresh batch of well-known venues for that city, persists them,
// then returns the combined set.
//
// POST { city, minThreshold?: number, requestCount?: number, force?: boolean }
// ============================================================

import { serve } from "../_shared/server.ts";
import { jsonResponse, errorResponse, supabaseAdmin } from "../_shared/supabase-client.ts";
import { consumeRateLimit, callerIdentity } from "../_shared/ratelimit.ts";

interface Body {
  city: string;
  /** If existing rows < this, run discovery. Default 20. */
  minThreshold?: number;
  /** How many venues to ask Claude to generate. Default 30. */
  requestCount?: number;
  /** Always run discovery even if threshold met. */
  force?: boolean;
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
}

interface ClaudeVenue {
  name: string;
  cuisine: string;
  neighborhood: string;
  address: string;
  price: "$" | "$$" | "$$$" | "$$$$";
  price_level: number;
  vibe_notes: string;
  vibe_tags: string[];
  cuisine_tags: string[];
  occasion_tags: string[];
  approximate_rating?: number;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function getExistingVenues(city: string): Promise<VenueRow[]> {
  const firstWord = city.split(/[\s,]+/)[0];
  const { data, error } = await supabaseAdmin
    .from("venues")
    .select(
      "id,name,slug,city,state,neighborhood,address,lat,lng,cuisine,cuisine_tags,vibe_tags,occasion_tags,price,price_level,rating,rating_count,photo_url,vibe_notes,popularity_score",
    )
    .ilike("city", `%${firstWord}%`)
    .order("popularity_score", { ascending: false, nullsFirst: false })
    .limit(200);
  if (error) {
    console.warn("[venue-discovery] read error:", error.message);
    return [];
  }
  return (data as VenueRow[]) ?? [];
}

async function discoverFromClaude(
  city: string,
  count: number,
  anthropicKey: string,
  existing: VenueRow[],
): Promise<ClaudeVenue[]> {
  const known = existing.slice(0, 50).map((v) => v.name).join(", ");

  const systemPrompt = `You are Confetti's local venue scout. You produce structured lists of REAL, well-known venues that ACTUALLY EXIST in a specific city. Restaurants, bars, cocktail lounges, speakeasies, nightclubs, rooftops, breweries, coffee shops, brunch spots, live music, beach clubs, lounges, gaming lounges — the full nightlife/dining mix.

Rules:
- Only return venues you are CONFIDENT exist today (e.g. operating businesses, not historical or closed).
- Never invent names. If unsure, skip.
- price_level must be 1 ($), 2 ($$), 3 ($$$), or 4 ($$$$).
- vibe_tags should be short lowercase keywords like: "rooftop", "speakeasy", "cocktails", "live music", "outdoor", "intimate", "lively", "upscale", "casual", "dance", "queer-friendly", "instagrammable".
- cuisine_tags should describe food/drink type: "Italian", "Steakhouse", "Cocktail Bar", "Brewery", "Coffee", "Brunch", "Wine Bar", etc.
- occasion_tags from this set: "date-night", "girls-night", "guys-night", "bachelor", "bachelorette", "anniversary", "family", "birthday", "in-laws".
- vibe_notes: one warm sentence, 20–35 words, describing the spot.
- Skip these venues if listed (already in our DB): ${known || "none yet"}
- Return ONLY valid JSON in the exact shape below — no markdown, no explanation.`;

  const userPrompt = `Generate ${count} REAL, well-known venues in ${city} covering a mix of: cocktail bars, restaurants (various cuisines), rooftops, brunch spots, nightlife/clubs, speakeasies, breweries, and at least one of {coffee, live music, lounge}.

Return:
{
  "venues": [
    {
      "name": "exact business name as it appears today",
      "cuisine": "primary category",
      "neighborhood": "neighborhood / district",
      "address": "street address with city",
      "price": "$ | $$ | $$$ | $$$$",
      "price_level": 1-4,
      "vibe_notes": "one sentence",
      "vibe_tags": ["..."],
      "cuisine_tags": ["..."],
      "occasion_tags": ["..."]
    }
  ]
}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Claude ${res.status}: ${text.slice(0, 240)}`);
  }
  const data = await res.json();
  const raw = data?.content?.[0]?.text ?? "";
  // Strip code fences if present.
  const stripped = raw
    .replace(/^```json?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const parsed = JSON.parse(stripped) as { venues?: ClaudeVenue[] };
  return parsed.venues ?? [];
}

async function persistVenues(
  city: string,
  state: string | null,
  fresh: ClaudeVenue[],
): Promise<number> {
  if (fresh.length === 0) return 0;

  // Look up existing slugs in this city so we can skip duplicates without
  // relying on a DB unique constraint that may not exist.
  const { data: existingRows } = await supabaseAdmin
    .from("venues")
    .select("slug")
    .ilike("city", `%${city}%`);
  const existingSlugs = new Set(
    ((existingRows as Array<{ slug: string }>) ?? []).map((r) => r.slug),
  );

  const rows = fresh
    .filter((v) => v.name && v.name.trim().length > 0)
    .map((v) => ({
      id: crypto.randomUUID(),
      name: v.name.trim(),
      slug: slugify(v.name),
      city,
      state,
      neighborhood: v.neighborhood || null,
      address: v.address || null,
      lat: null,
      lng: null,
      cuisine: v.cuisine || null,
      cuisine_tags: v.cuisine_tags ?? [],
      vibe_tags: v.vibe_tags ?? [],
      occasion_tags: v.occasion_tags ?? [],
      price: v.price || null,
      price_level: typeof v.price_level === "number" ? v.price_level : null,
      rating: typeof v.approximate_rating === "number" ? v.approximate_rating : null,
      rating_count: 0,
      photo_url: null,
      vibe_notes: v.vibe_notes || null,
      popularity_score: 5,
      source_credit: "ai-discovery",
    }))
    .filter((r) => !existingSlugs.has(r.slug));

  if (rows.length === 0) return 0;

  const { data, error } = await supabaseAdmin
    .from("venues")
    .insert(rows)
    .select("id");
  if (error) {
    console.warn("[venue-discovery] persist error:", error.message);
    return 0;
  }
  return (data ?? []).length;
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
    if (!body.city || body.city.trim().length === 0) {
      return errorResponse("city required");
    }

    const minThreshold = Math.max(1, body.minThreshold ?? 20);
    const requestCount = Math.max(5, Math.min(body.requestCount ?? 30, 50));

    let existing = await getExistingVenues(body.city);
    let discoveredCount = 0;
    let mode: "cached" | "augmented" | "bootstrapped" = "cached";

    if (body.force || existing.length < minThreshold) {
      const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
      if (!anthropicKey) return errorResponse("ANTHROPIC_API_KEY not configured", 500);
      try {
        const fresh = await discoverFromClaude(
          body.city.trim(),
          requestCount,
          anthropicKey,
          existing,
        );
        discoveredCount = await persistVenues(body.city.trim(), null, fresh);
        mode = existing.length === 0 ? "bootstrapped" : "augmented";
        // Re-read so the response reflects what's now persisted.
        existing = await getExistingVenues(body.city);
      } catch (e) {
        console.warn("[venue-discovery] Claude failed:", (e as Error).message);
        // Fall through and return whatever existing we have.
      }
    }

    return jsonResponse({
      city: body.city,
      mode,
      discovered: discoveredCount,
      total: existing.length,
      venues: existing,
    });
  } catch (err) {
    console.error("[venue-discovery-agent] uncaught:", (err as Error).stack ?? err);
    return errorResponse(
      `Unhandled: ${(err as Error).message ?? String(err)}`,
      500,
    );
  }
});
