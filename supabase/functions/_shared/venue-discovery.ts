// Shared helper for lazy city-discovery. Called from ai-recommend,
// wizard-itinerary, and build-itinerary so any city without enough
// venues is auto-bootstrapped via Claude before the host function
// does its real work.
//
// Strategy:
//   1. Count existing venues for the city (city ilike "<first-word>%").
//   2. If count >= minThreshold, no-op.
//   3. Otherwise, ask Claude for `requestCount` REAL venues, dedupe
//      by slug against existing rows, insert what's new.
//   4. Failures (Claude error, RLS rejection) are swallowed — the
//      caller continues with whatever venues are already present.

import { supabaseAdmin } from "./supabase-client.ts";

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
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Match the WHOLE city string (case-insensitive) so "San Diego" doesn't
 * accidentally match "San Francisco" via a shared first word. */
async function countCityVenues(city: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from("venues")
    .select("id", { count: "exact", head: true })
    .ilike("city", city);
  if (error) return 0;
  return count ?? 0;
}

async function fetchKnownSlugs(city: string): Promise<Set<string>> {
  const { data } = await supabaseAdmin
    .from("venues")
    .select("slug,name")
    .ilike("city", city);
  return new Set(
    ((data as Array<{ slug: string; name: string }>) ?? []).map((r) => r.slug),
  );
}

async function askClaudeForVenues(
  city: string,
  count: number,
  apiKey: string,
  knownNames: string[],
): Promise<ClaudeVenue[]> {
  const known = knownNames.slice(0, 60).join(", ");
  const systemPrompt = `You are Confetti's local venue scout. Produce a list of REAL, operating venues in a specific city. Restaurants, bars, cocktail lounges, speakeasies, nightclubs, rooftops, breweries, coffee shops, brunch spots, live music, lounges — the full nightlife/dining mix.

Rules:
- Only include venues you are CONFIDENT exist today. Skip if unsure.
- Never invent names.
- price_level must be 1 ($), 2 ($$), 3 ($$$), or 4 ($$$$).
- vibe_tags lowercase keywords: "rooftop", "speakeasy", "cocktails", "live music", "outdoor", "intimate", "lively", "upscale", "casual", "dance", "queer-friendly", "instagrammable".
- cuisine_tags describe food/drink type: "Italian", "Steakhouse", "Cocktail Bar", "Brewery", "Coffee", "Brunch", "Wine Bar", etc.
- occasion_tags from: "date-night", "girls-night", "guys-night", "bachelor", "bachelorette", "anniversary", "family", "birthday", "in-laws".
- vibe_notes: one warm sentence, 20–35 words.
- DO NOT repeat any of these (already in our DB): ${known || "none"}
- Return ONLY valid JSON in the exact shape below — no markdown, no explanation.`;

  const userPrompt = `Generate ${count} REAL, well-known venues in ${city}. Mix categories: cocktail bars, restaurants (varied cuisines), rooftops, brunch, nightlife/clubs, speakeasies, breweries, plus at least one of {coffee, live music, lounge}.

Return:
{
  "venues": [
    {
      "name": "exact business name",
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
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  if (!res.ok) throw new Error(`Claude ${res.status}`);
  const data = await res.json();
  const raw = data?.content?.[0]?.text ?? "";
  const stripped = raw.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();
  const parsed = JSON.parse(stripped) as { venues?: ClaudeVenue[] };
  return parsed.venues ?? [];
}

async function persist(
  city: string,
  fresh: ClaudeVenue[],
  knownSlugs: Set<string>,
): Promise<number> {
  const rows = fresh
    .filter((v) => v.name && v.name.trim().length > 0)
    .map((v) => ({
      id: crypto.randomUUID(),
      name: v.name.trim(),
      slug: slugify(v.name),
      city,
      state: null,
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
      rating: null,
      rating_count: 0,
      photo_url: null,
      vibe_notes: v.vibe_notes || null,
      popularity_score: 5,
      source_credit: "ai-discovery",
    }))
    .filter((r) => !knownSlugs.has(r.slug));
  if (rows.length === 0) return 0;
  const { data, error } = await supabaseAdmin.from("venues").insert(rows).select("id");
  if (error) {
    console.warn("[ensureCityVenues] insert error:", error.message);
    return 0;
  }
  return (data ?? []).length;
}

/**
 * Make sure the given city has at least `minThreshold` venues in the
 * venues table. Returns the number of newly-discovered rows (0 if the
 * threshold was already met or if Claude is unavailable).
 *
 * Designed to be called at the top of edge handlers BEFORE they query
 * venues, so subsequent reads see a populated set.
 */
export async function ensureCityVenues(
  city: string | null | undefined,
  minThreshold = 15,
  requestCount = 25,
): Promise<number> {
  if (!city) return 0;
  const trimmed = city.trim();
  if (!trimmed) return 0;

  const existingCount = await countCityVenues(trimmed);
  if (existingCount >= minThreshold) return 0;

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return 0;

  try {
    const knownSlugs = await fetchKnownSlugs(trimmed);
    const fresh = await askClaudeForVenues(
      trimmed,
      requestCount,
      apiKey,
      [...knownSlugs].map((s) => s.replace(/-/g, " ")),
    );
    const inserted = await persist(trimmed, fresh, knownSlugs);
    return inserted;
  } catch (e) {
    console.warn("[ensureCityVenues] failed:", (e as Error).message);
    return 0;
  }
}
