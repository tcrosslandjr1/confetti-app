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
  /** Official venue website (e.g. https://thegibsondc.com) — used for HEAD-verify. */
  website?: string | null;
  /** Instagram handle (no @, no URL) — e.g. "thegibsondc". Fallback verify. */
  instagram_handle?: string | null;
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
  nicheHint?: string | null,
): Promise<ClaudeVenue[]> {
  const known = knownNames.slice(0, 60).join(", ");
  const nicheBlock = nicheHint && nicheHint.trim()
    ? `\n\nNICHE REQUEST: the user is specifically looking for ${nicheHint.trim()}. INCLUDE at least 6 venues that match this niche (hookah lounges, dive bars, comedy clubs, gaming lounges, axe throwing, paint-and-sip studios, kid-friendly arcades, queer bars, halal/kosher kitchens, vegan kitchens — whatever the niche is). Use accurate vibe_tags so they're findable downstream (e.g. for hookah: ["hookah", "lounge", "shisha", "mediterranean", "late-night"]).`
    : "";
  const systemPrompt = `You are Confetti's local venue scout. Produce a list of REAL, operating venues in a specific city. Restaurants, bars, cocktail lounges, speakeasies, nightclubs, rooftops, breweries, coffee shops, brunch spots, live music, lounges — the full nightlife/dining mix.

Rules:
- Only include venues you are CONFIDENT exist today. Skip if unsure.
- Never invent names.
- price_level must be 1 ($), 2 ($$), 3 ($$$), or 4 ($$$$).
- vibe_tags lowercase keywords: "rooftop", "speakeasy", "cocktails", "live music", "outdoor", "intimate", "lively", "upscale", "casual", "dance", "queer-friendly", "instagrammable", "hookah", "shisha", "dive", "sports", "comedy", "karaoke", "arcade", "axe-throwing", "kid-friendly", "halal", "kosher", "vegan".
- cuisine_tags describe food/drink type: "Italian", "Steakhouse", "Cocktail Bar", "Brewery", "Coffee", "Brunch", "Wine Bar", "Hookah Lounge", "Comedy Club", "Gaming Lounge", etc.
- occasion_tags from: "date-night", "girls-night", "guys-night", "bachelor", "bachelorette", "anniversary", "family", "birthday", "in-laws".
- vibe_notes: one warm sentence, 20–35 words.
- website: ALWAYS provide your best-guess official website URL with full https:// prefix (e.g. "https://thegibsondc.com"). For a famous venue use the URL you'd type into a browser. We HEAD-check it server-side — wrong guesses fail harmlessly, blanks mean we can't verify at all. So GUESS even when uncertain. Examples: "https://pizzeriabianco.com", "https://www.shake-shack.com", "https://omniaclubs.com".
- instagram_handle: ALWAYS provide your best-guess Instagram handle (no @ or URL — just the handle, e.g. "thegibsondc", "pizzeriabianco"). Same rule: guess freely, we verify.
- These two fields are used for web-presence verification — better to guess wrong than leave blank.
- DO NOT repeat any of these (already in our DB): ${known || "none"}
- Return ONLY valid JSON in the exact shape below — no markdown, no explanation.${nicheBlock}`;

  const userPrompt = `Generate ${count} REAL, well-known venues in ${city}.${nicheHint ? ` Lean into: ${nicheHint}.` : " Mix categories: cocktail bars, restaurants (varied cuisines), rooftops, brunch, nightlife/clubs, speakeasies, breweries, plus at least one of {coffee, live music, lounge}."}

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
      "occasion_tags": ["..."],
      "website": "https://... or empty if unsure",
      "instagram_handle": "handle without @ or empty if unsure"
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

/**
 * Confirm a URL is live by issuing a quick GET with a short timeout.
 * HEAD often returns 405 from web stacks; GET with a tiny range is robust.
 * Returns true on 2xx or 3xx (real businesses often redirect www → bare).
 */
async function urlIsLive(url: string, timeoutMs = 4000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Confetti-VenueVerify/1.0; +https://confetti.app)",
        "Accept": "text/html,application/xhtml+xml",
        // Tiny range so we don't actually download the page.
        "Range": "bytes=0-1024",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.status >= 200 && res.status < 400;
  } catch {
    return false;
  }
}

/**
 * Instagram presence check. Public profiles render at instagram.com/{handle}/.
 * Instagram redirects unauthenticated viewers but the public URL itself
 * resolves with 200; nonexistent handles return 404.
 */
async function instagramIsLive(handle: string): Promise<boolean> {
  const cleaned = handle.replace(/^@/, "").replace(/[^\w._]/g, "");
  if (!cleaned) return false;
  return urlIsLive(`https://www.instagram.com/${cleaned}/`);
}

/** Verify a single venue by web/social presence. Picks the strongest signal. */
async function verifyVenue(
  v: { name: string; website?: string | null; instagram_handle?: string | null },
): Promise<{ verified: boolean; source: "website" | "instagram" | "none" }> {
  if (v.website && /^https?:\/\//i.test(v.website)) {
    if (await urlIsLive(v.website)) return { verified: true, source: "website" };
  }
  if (v.instagram_handle) {
    if (await instagramIsLive(v.instagram_handle)) {
      return { verified: true, source: "instagram" };
    }
  }
  return { verified: false, source: "none" };
}

/** Run web-presence verification across many venues with bounded concurrency. */
async function verifyBatch(
  rows: Array<{
    name: string;
    website?: string | null;
    instagram_handle?: string | null;
    is_verified?: boolean;
    source_credit?: string;
  }>,
  concurrency = 6,
): Promise<void> {
  const queue = [...rows];
  async function worker() {
    while (queue.length > 0) {
      const r = queue.shift();
      if (!r) return;
      const { verified, source } = await verifyVenue(r);
      r.is_verified = verified;
      if (verified) {
        r.source_credit = `ai-discovery+${source}`;
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
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
      lat: null as number | null,
      lng: null as number | null,
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
      is_verified: false,
      website: v.website || null,
      // We don't have a column for IG yet, but we keep it on the row so
      // the verifier can use it. It's stripped before insert if the
      // schema doesn't include it.
      instagram_handle: v.instagram_handle || null,
    }))
    .filter((r) => !knownSlugs.has(r.slug));
  if (rows.length === 0) return 0;

  // Web/social presence verification: HEAD-check website, fall back to
  // Instagram handle. Real operating businesses respond; ghosts don't.
  await verifyBatch(rows, 6);

  // Drop instagram_handle before insert (no DB column for it yet).
  const cleaned = rows.map((r) => {
    const copy = { ...r };
    delete (copy as { instagram_handle?: unknown }).instagram_handle;
    return copy;
  });

  const { data, error } = await supabaseAdmin.from("venues").insert(cleaned).select("id");
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
/**
 * Make sure the given city has at least `minThreshold` venues in the
 * venues table. When `nicheHint` is set (e.g. "hookah lounges and
 * Mediterranean small plates"), discovery prioritizes seeding venues
 * that match the niche so downstream ranking has something to pick.
 *
 * If a nicheHint is passed and the city is already populated for the
 * generic case but the niche isn't represented, discovery still runs
 * a niche-only round so build-itinerary can find what it needs.
 */
export async function ensureCityVenues(
  city: string | null | undefined,
  minThreshold = 15,
  requestCount = 25,
  nicheHint?: string | null,
): Promise<number> {
  if (!city) return 0;
  const trimmed = city.trim();
  if (!trimmed) return 0;

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return 0;

  const existingCount = await countCityVenues(trimmed);
  const needsBaseline = existingCount < minThreshold;
  const needsNiche = !!nicheHint && nicheHint.trim() && !(await nicheRepresented(trimmed, nicheHint));

  if (!needsBaseline && !needsNiche) return 0;

  try {
    const knownSlugs = await fetchKnownSlugs(trimmed);
    const knownNames = [...knownSlugs].map((s) => s.replace(/-/g, " "));
    const fresh = await askClaudeForVenues(
      trimmed,
      requestCount,
      apiKey,
      knownNames,
      nicheHint ?? null,
    );
    const inserted = await persist(trimmed, fresh, knownSlugs);
    return inserted;
  } catch (e) {
    console.warn("[ensureCityVenues] failed:", (e as Error).message);
    return 0;
  }
}

/**
 * Backfill verification on existing unverified venues. Pulls up to `batchSize`
 * rows where is_verified is not true, asks Claude for website + Instagram
 * handle per venue in a single call, runs the same HEAD-check pipeline,
 * and updates each row. Returns counts so the caller can loop until done.
 */
export async function backfillVerifyVenues(
  batchSize = 25,
): Promise<{ processed: number; verified: number; remaining: number }> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return { processed: 0, verified: 0, remaining: 0 };

  // Pull a batch of unverified venues. Filter to recognisable names only.
  const { data: rows, error } = await supabaseAdmin
    .from("venues")
    .select("id,name,city,address,website")
    .or("is_verified.is.null,is_verified.eq.false")
    .order("popularity_score", { ascending: false, nullsFirst: false })
    .limit(batchSize);
  if (error || !rows || rows.length === 0) {
    return { processed: 0, verified: 0, remaining: 0 };
  }

  const items = rows as Array<{
    id: string;
    name: string;
    city: string;
    address: string | null;
    website: string | null;
  }>;

  // Ask Claude for website + IG handle for each venue in one call.
  const venueList = items
    .map((r, i) => `${i + 1}. ${r.name} — ${r.city}${r.address ? ` (${r.address})` : ""}`)
    .join("\n");
  const sys = `You are Confetti's verification helper. Given a list of venues, return your best-guess official website URL and Instagram handle for each. We HEAD-check them afterwards, so guessing freely is GOOD — only outright bad guesses fail. Match by index. Return ONLY valid JSON: {"items":[{"index":1,"website":"https://...","instagram_handle":"handle"}, ...]}`;
  const userMsg = `Provide website + instagram_handle for each:\n\n${venueList}`;

  let guesses: Array<{ index: number; website?: string | null; instagram_handle?: string | null }> = [];
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        system: sys,
        messages: [{ role: "user", content: userMsg }],
      }),
    });
    if (!res.ok) throw new Error(`Claude ${res.status}`);
    const data = await res.json();
    const raw = data?.content?.[0]?.text ?? "";
    const stripped = raw.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(stripped) as { items?: typeof guesses };
    guesses = parsed.items ?? [];
  } catch (e) {
    console.warn("[backfillVerify] Claude failed:", (e as Error).message);
    return { processed: 0, verified: 0, remaining: items.length };
  }

  // Pair guesses with items by index, verify in parallel.
  const byIndex = new Map(guesses.map((g) => [g.index, g]));
  const toVerify = items.map((it, i) => {
    const g = byIndex.get(i + 1);
    return {
      id: it.id,
      name: it.name,
      website: g?.website ?? null,
      instagram_handle: g?.instagram_handle ?? null,
      is_verified: false,
      source_credit: "ai-discovery",
    };
  });
  await verifyBatch(toVerify, 6);

  // Bulk-update.
  let verifiedCount = 0;
  await Promise.all(
    toVerify.map(async (t) => {
      const patch: Record<string, unknown> = {
        is_verified: t.is_verified ?? false,
      };
      if (t.website) patch.website = t.website;
      if (t.is_verified) {
        verifiedCount++;
        patch.source_credit = t.source_credit;
      }
      await supabaseAdmin.from("venues").update(patch).eq("id", t.id);
    }),
  );

  const { count: remaining } = await supabaseAdmin
    .from("venues")
    .select("id", { count: "exact", head: true })
    .or("is_verified.is.null,is_verified.eq.false");

  return {
    processed: items.length,
    verified: verifiedCount,
    remaining: remaining ?? 0,
  };
}

/** Quick check: does the city have any venues whose name/cuisine/vibe_tags hit the niche tokens? */
async function nicheRepresented(city: string, nicheHint: string): Promise<boolean> {
  const tokens = nicheHint
    .toLowerCase()
    .split(/[\s,]+/)
    .map((t) => t.replace(/[^a-z0-9]/g, ""))
    .filter((t) => t.length > 3);
  if (tokens.length === 0) return true;
  const orParts: string[] = [];
  for (const t of tokens.slice(0, 4)) {
    orParts.push(`name.ilike.%${t}%`, `cuisine.ilike.%${t}%`, `vibe_notes.ilike.%${t}%`);
  }
  const { count } = await supabaseAdmin
    .from("venues")
    .select("id", { count: "exact", head: true })
    .ilike("city", city)
    .or(orParts.join(","));
  return (count ?? 0) >= 2;
}
