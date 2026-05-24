// ============================================================
// ai-recommend — Claude-powered personalized feed recommendations.
// Powers: Trending venues, Starting soon, Personalized picks.
// Pulls candidates from the curated `venues` table (1,074 entries
// seeded from venue-knowledge.ts), then asks Claude to rank +
// add personalized reasons. No Google Places dependency.
// ============================================================

import { serve } from "../_shared/server.ts";
import { jsonResponse, errorResponse, supabaseAdmin } from "../_shared/supabase-client.ts";
import { consumeRateLimit, callerIdentity } from "../_shared/ratelimit.ts";

// ─── Types ────────────────────────────────────────────────────

interface TasteProfile {
  age_range?: string;
  life_stage?: string;
  energy?: string;
  music_taste?: string[];
  scene_keywords?: string[];
  loves?: string[];
  avoid?: string[];
  cities?: string[];
  identity_context?: {
    lgbtq_safe_mode?: boolean;
    preferred_spaces?: string[];
    avoid_spaces?: string[];
  };
}

interface RequestBody {
  lat?: number | null;
  lng?: number | null;
  city?: string | null;
  sections?: ("trending" | "events" | "picks" | "surprise")[];
  taste_profile?: TasteProfile;
  user_id?: string;
  limit?: number;
  time_of_day?: "morning" | "afternoon" | "evening" | "night";
}

interface VenueRecommendation {
  id: string;
  venue: string;
  category: string;
  vibe: string;
  reason: string;
  address?: string;
  neighborhood?: string;
  rating?: number;
  priceLevel?: number | null;
  photo?: string | null;
  lat?: number;
  lng?: number;
  tone: string;
}

interface EventRecommendation {
  title: string;
  venue: string;
  time: string;
  category: string;
  reason: string;
  vibe: string;
}

interface FeedResponse {
  trending?: VenueRecommendation[];
  events?: EventRecommendation[];
  picks?: VenueRecommendation[];
  surprise?: VenueRecommendation[];
  generated_at: string;
  model: string;
}

// Shape of a row read from the `venues` table.
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
  occasion_tags: string[] | null;
  price: string | null;
  price_level: number | null;
  rating: number | null;
  rating_count: number | null;
  photo_url: string | null;
  vibe_notes: string | null;
  popularity_score: number | null;
}

// ─── Auth ─────────────────────────────────────────────────────

function isAuthorized(req: Request): boolean {
  const expected = Deno.env.get("SUPABASE_ANON_KEY");
  if (!expected) return false;
  const apiKey = req.headers.get("apikey");
  const auth = req.headers.get("Authorization") ?? "";
  return apiKey === expected || auth === `Bearer ${expected}`;
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

// ─── Taste Profile Fetcher ────────────────────────────────────

async function fetchTasteProfile(userId: string): Promise<TasteProfile | null> {
  try {
    const { data } = await supabaseAdmin
      .from("taste_profiles")
      .select("profile")
      .eq("user_id", userId)
      .single();
    return (data as { profile?: TasteProfile } | null)?.profile ?? null;
  } catch {
    return null;
  }
}

// ─── Venue candidate fetcher (replaces Google Places) ─────────

const SECTION_BIAS: Record<string, { tagAny?: string[]; cuisineLike?: string[]; tone: string }> = {
  trending:   { tone: "bg-coral" },
  picks:      { tone: "bg-purple" },
  surprise:   { tone: "bg-gold" },
  cocktails:  { tagAny: ["cocktail", "speakeasy", "lounge", "bar"], cuisineLike: ["bar", "cocktail", "lounge"], tone: "bg-gold" },
  dining:     { cuisineLike: ["restaurant"], tone: "bg-emerald-400" },
  brunch:     { tagAny: ["brunch"], cuisineLike: ["brunch", "cafe"], tone: "bg-amber-300" },
  live_music: { tagAny: ["live", "music", "concert"], tone: "bg-pink-300" },
  nightlife:  { tagAny: ["nightclub", "club", "dance", "nightlife"], tone: "bg-purple" },
  outdoor:    { tagAny: ["outdoor", "rooftop", "patio", "garden"], tone: "bg-sky-300" },
  lgbtq:      { tagAny: ["lgbtq", "queer", "drag", "pride"], tone: "bg-rainbow" },
  family:     { tagAny: ["family", "kid-friendly"], cuisineLike: ["family"], tone: "bg-green-300" },
  coffee:     { tagAny: ["coffee", "cafe"], cuisineLike: ["coffee", "cafe"], tone: "bg-brown-300" },
};

function popScore(v: VenueRow): number {
  const r = v.rating ?? 0;
  const n = v.rating_count ?? 0;
  // Rating weighted by review-volume log to avoid 5-star one-review noise.
  return r * Math.log10(n + 10);
}

/**
 * Pull candidate venues from Supabase. Filter by city (loose match) and an
 * optional section bias (tag overlap or cuisine substring).
 */
async function fetchCandidates(
  city: string | null | undefined,
  sectionKey: string,
  limit: number,
  exclude: Set<string>,
): Promise<VenueRow[]> {
  const bias = SECTION_BIAS[sectionKey] ?? SECTION_BIAS.trending;

  // City filter is best-effort (loose match). The venues table stores the
  // city as a single word like "Washington" while user input might be
  // "Washington DC" — handle both.
  let query = supabaseAdmin
    .from("venues")
    .select(
      "id,name,city,neighborhood,address,lat,lng,cuisine,cuisine_tags,vibe_tags,occasion_tags,price,price_level,rating,rating_count,photo_url,vibe_notes,popularity_score",
    )
    .order("popularity_score", { ascending: false, nullsFirst: false })
    .order("rating", { ascending: false, nullsFirst: false })
    .limit(Math.max(limit * 4, 20));

  if (city) {
    const firstWord = city.split(/[\s,]+/)[0];
    query = query.ilike("city", `%${firstWord}%`);
  }
  if (bias.tagAny && bias.tagAny.length > 0) {
    query = query.overlaps("vibe_tags", bias.tagAny);
  } else if (bias.cuisineLike && bias.cuisineLike.length > 0) {
    // OR across cuisine substrings.
    const ors = bias.cuisineLike.map((t) => `cuisine.ilike.%${t}%`).join(",");
    query = query.or(ors);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[ai-recommend] venues query error:", error.message);
    return [];
  }
  return ((data as VenueRow[]) ?? []).filter((v) => !exclude.has(v.id));
}

/**
 * If the first city-biased query returns too few rows (sparse coverage),
 * fall back to top-rated nationwide for the same section bias.
 */
async function fetchCandidatesWithFallback(
  city: string | null | undefined,
  sectionKey: string,
  limit: number,
  exclude: Set<string>,
): Promise<VenueRow[]> {
  const primary = await fetchCandidates(city, sectionKey, limit, exclude);
  if (primary.length >= Math.max(3, Math.floor(limit / 2))) return primary;
  const wide = await fetchCandidates(null, sectionKey, limit, exclude);
  // Prefer in-city even if sparse.
  const merged: VenueRow[] = [...primary];
  for (const v of wide) {
    if (!merged.some((m) => m.id === v.id)) merged.push(v);
    if (merged.length >= limit) break;
  }
  return merged;
}

function simplifyForClaude(v: VenueRow) {
  return {
    id: v.id,
    name: v.name,
    cuisine: v.cuisine ?? "",
    neighborhood: v.neighborhood ?? "",
    price: v.price ?? "",
    rating: v.rating ?? null,
    vibe_tags: (v.vibe_tags ?? []).slice(0, 6),
    notes: v.vibe_notes ? v.vibe_notes.slice(0, 140) : null,
  };
}

// ─── Claude call ──────────────────────────────────────────────

async function callClaude(
  systemPrompt: string,
  userMessage: string,
  apiKey: string,
): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Claude API ${res.status}: ${errText.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

function extractJson(text: string): string {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) return fence[1].trim();
  const i = text.indexOf("{");
  const j = text.lastIndexOf("}");
  return i >= 0 && j > i ? text.slice(i, j + 1) : text.trim();
}

function buildSystemPrompt(profile: TasteProfile | null, timeOfDay: string): string {
  const profileBlock = profile
    ? `User taste profile:
- Age: ${profile.age_range ?? "unknown"}
- Life stage: ${profile.life_stage ?? "unknown"}
- Energy: ${profile.energy ?? "balanced"}
- Music: ${(profile.music_taste ?? []).join(", ") || "any"}
- Scene keywords: ${(profile.scene_keywords ?? []).join(", ") || "—"}
- Loves: ${(profile.loves ?? []).join(", ") || "—"}
- Avoid: ${(profile.avoid ?? []).join(", ") || "—"}
- LGBTQ+ safe mode: ${profile.identity_context?.lgbtq_safe_mode ? "yes — prioritize safe spaces" : "no preference"}`
    : "No user profile provided — pick broadly appealing, well-reviewed spots.";

  return `You are Confetti's venue ranker. Given a candidate list of venues, pick the best ones for THIS user at THIS time of day and explain why in one sentence each.

Time of day: ${timeOfDay}

${profileBlock}

Return ONLY valid JSON in this exact shape (no markdown, no explanation):
{
  "recommendations": [
    {
      "place_id": "string (must match a candidate id exactly)",
      "venue": "string (canonical venue name)",
      "category": "string (short: cocktail bar / italian restaurant / etc)",
      "vibe": "string (3-5 word vibe summary)",
      "reason": "string (one warm sentence on why THIS user would love THIS spot tonight)"
    }
  ]
}

Pick from the provided candidates only — never invent venues. Skip any in the user's "avoid" list. If multiple candidates fit equally well, prefer higher rating + more reviews. Aim for variety in category if you return more than 3.`;
}

// ─── Section runners ──────────────────────────────────────────

async function rankSection(
  section: "trending" | "picks" | "surprise",
  candidates: VenueRow[],
  systemPrompt: string,
  anthropicKey: string,
  limit: number,
): Promise<VenueRecommendation[]> {
  if (candidates.length === 0) return [];
  const tone = SECTION_BIAS[section].tone;
  const sectionHeader = section === "trending"
    ? `Pick the top ${limit} BUZZIEST venues. Trending means popular + currently talked-about.`
    : section === "picks"
    ? `Pick the top ${limit} PERSONALIZED matches for the user's taste. Lean into their loves / scene keywords / energy.`
    : `Pick ${limit} SURPRISE venues — outside the user's usual pattern but ones they'd unexpectedly love. Be creative.`;

  const userMsg = `${sectionHeader}\n\nCandidates (${candidates.length}):\n${JSON.stringify(candidates.map(simplifyForClaude))}`;

  try {
    const raw = await callClaude(systemPrompt, userMsg, anthropicKey);
    const parsed = JSON.parse(extractJson(raw)) as {
      recommendations?: Array<{
        place_id: string;
        venue: string;
        category: string;
        vibe: string;
        reason: string;
      }>;
    };
    const byId = new Map(candidates.map((c) => [c.id, c]));
    const out: VenueRecommendation[] = [];
    for (const r of parsed.recommendations ?? []) {
      const v = byId.get(r.place_id);
      if (!v) continue;
      out.push({
        id: v.id,
        venue: r.venue || v.name,
        category: r.category,
        vibe: r.vibe,
        reason: r.reason,
        address: v.address ?? undefined,
        neighborhood: v.neighborhood ?? undefined,
        rating: v.rating ?? undefined,
        priceLevel: v.price_level ?? null,
        photo: v.photo_url ?? null,
        lat: v.lat ?? undefined,
        lng: v.lng ?? undefined,
        tone,
      });
      if (out.length >= limit) break;
    }
    return out;
  } catch (e) {
    console.warn(`[ai-recommend] Claude ${section} failed:`, (e as Error).message);
    // Fallback: top-N by popularity score with a generic reason.
    return candidates.slice(0, limit).map((v) => ({
      id: v.id,
      venue: v.name,
      category: v.cuisine ?? "venue",
      vibe: v.vibe_notes?.slice(0, 60) ?? "Popular spot",
      reason: "Highly rated and popular in your area",
      address: v.address ?? undefined,
      neighborhood: v.neighborhood ?? undefined,
      rating: v.rating ?? undefined,
      priceLevel: v.price_level ?? null,
      photo: v.photo_url ?? null,
      lat: v.lat ?? undefined,
      lng: v.lng ?? undefined,
      tone,
    }));
  }
}

// ─── Events (placeholder until SeatGeek/PredictHQ keys land) ──

async function fetchEvents(
  _body: RequestBody,
  _profile: TasteProfile | null,
  _timeOfDay: string,
): Promise<EventRecommendation[]> {
  // Real event provider integration is out of scope for this rewrite.
  // Return a couple of evergreen placeholders so the section renders.
  return [
    {
      title: "Live Music Night",
      venue: "Local venue in your area",
      time: "Tonight, 8:00 PM",
      category: "live_music",
      reason: "Popular event happening near you tonight",
      vibe: "Live energy",
    },
    {
      title: "Weekend Brunch Series",
      venue: "Neighborhood favorites",
      time: "This weekend",
      category: "brunch",
      reason: "Bottomless mimosas and a queue worth the wait",
      vibe: "Easy daytime",
    },
  ];
}

// ─── Helpers ──────────────────────────────────────────────────

function inferTimeOfDay(): "morning" | "afternoon" | "evening" | "night" {
  const hour = new Date().getUTCHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

function pickSectionKeys(
  profile: TasteProfile | null,
  timeOfDay: string,
  section: "trending" | "picks" | "surprise",
): string[] {
  const keys: string[] = [];
  const energy = profile?.energy ?? "balanced";
  const kw = profile?.scene_keywords ?? [];
  const lgbtq = profile?.identity_context?.lgbtq_safe_mode;

  if (lgbtq) keys.push("lgbtq");
  if (timeOfDay === "morning") {
    keys.push("coffee", "brunch");
  } else if (timeOfDay === "afternoon") {
    keys.push("dining");
    if (kw.includes("outdoorsy")) keys.push("outdoor");
  } else if (timeOfDay === "evening") {
    keys.push("dining");
    keys.push(energy === "high_energy" ? "nightlife" : "cocktails");
    if (kw.includes("live") || (profile?.music_taste?.length ?? 0) > 0) keys.push("live_music");
  } else {
    if (energy === "high_energy") keys.push("nightlife");
    keys.push("cocktails");
    if (kw.includes("loud") || energy === "high_energy") keys.push("nightlife");
    else keys.push("live_music");
  }

  if (section === "surprise") {
    const used = new Set(keys);
    const alts = Object.keys(SECTION_BIAS).filter((k) => !used.has(k) && !["trending", "picks", "surprise"].includes(k));
    return alts.slice(0, 3);
  }
  return [...new Set(keys)].slice(0, 3);
}

// ─── Main Handler ─────────────────────────────────────────────

serve(async (req: Request) => {
  try {
  if (req.method === "OPTIONS") return jsonResponse({ ok: true });

  if (!isAuthorized(req)) return errorResponse("Unauthorized", 401);

  const allowed = await consumeRateLimit({
    scope: "ai-recommend",
    identity: callerIdentity(req),
    burst: 10,
    refillPerSec: 10 / 60,
  });
  if (!allowed) return errorResponse("Rate limit exceeded — try again in a moment", 429);

  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!anthropicKey) return errorResponse("ANTHROPIC_API_KEY not configured", 500);

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  const userId = body.user_id ?? (await getUserIdFromAuth(req));
  let profile: TasteProfile | null = body.taste_profile ?? null;
  if (!profile && userId) {
    profile = await fetchTasteProfile(userId);
  }

  const sections = body.sections ?? ["trending", "picks", "events"];
  const limit = Math.max(1, Math.min(body.limit ?? 4, 8));
  const timeOfDay = body.time_of_day ?? inferTimeOfDay();

  // Build a global exclusion set from the taste profile's "avoid" list
  // and from any per-section already-picked ids.
  const seen = new Set<string>();
  const avoidNames = new Set(
    (profile?.avoid ?? []).map((n) => n.toLowerCase().trim()).filter(Boolean),
  );

  const systemPrompt = buildSystemPrompt(profile, timeOfDay);
  const result: FeedResponse = {
    generated_at: new Date().toISOString(),
    model: "claude-sonnet-4-20250514",
  };

  async function candidatesFor(section: "trending" | "picks" | "surprise"): Promise<VenueRow[]> {
    const keys = pickSectionKeys(profile, timeOfDay, section);
    const all: VenueRow[] = [];
    for (const key of keys) {
      const rows = await fetchCandidatesWithFallback(body.city, key, limit + 2, seen);
      for (const v of rows) {
        if (avoidNames.size > 0 && avoidNames.has(v.name.toLowerCase())) continue;
        if (!all.some((x) => x.id === v.id)) all.push(v);
      }
    }
    return all.slice(0, Math.max(limit * 2, 8));
  }

  if (sections.includes("trending")) {
    const cands = await candidatesFor("trending");
    const ranked = await rankSection("trending", cands, systemPrompt, anthropicKey, limit);
    for (const r of ranked) seen.add(r.id);
    result.trending = ranked;
  }
  if (sections.includes("picks")) {
    const cands = await candidatesFor("picks");
    const ranked = await rankSection("picks", cands, systemPrompt, anthropicKey, limit);
    for (const r of ranked) seen.add(r.id);
    result.picks = ranked;
  }
  if (sections.includes("surprise")) {
    const cands = await candidatesFor("surprise");
    const ranked = await rankSection("surprise", cands, systemPrompt, anthropicKey, limit);
    for (const r of ranked) seen.add(r.id);
    result.surprise = ranked;
  }
  if (sections.includes("events")) {
    result.events = await fetchEvents(body, profile, timeOfDay);
  }

  return jsonResponse(result);
  } catch (err) {
    console.error("[ai-recommend] uncaught:", (err as Error).stack ?? err);
    return errorResponse(
      `Unhandled: ${(err as Error).message ?? String(err)}`,
      500,
    );
  }
});
