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
  /** True when this venue was injected from an active boost_campaign. */
  sponsored?: boolean;
  /** Customer-facing label, e.g. "Partner Pick · Matches your vibe". */
  partnerLabel?: string;
  /** Which campaign drove the placement — used for click/booking attribution. */
  boostCampaignId?: string;
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

interface SponsoredCampaign {
  id: string;
  venue_id: string;
  business_id: string;
  boost_strength: number;
  target_cities: string[] | null;
  target_vibes: string[] | null;
  target_categories: string[] | null;
  target_occasions: string[] | null;
  target_price_range: string | null;
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

/**
 * Pull active boost_campaigns relevant to this request. Matches on:
 *   • city loose (case-insensitive substring)
 *   • vibe overlap with section bias or user keywords
 *   • budget ceiling (if user provided one)
 *   • active status + within start/end window
 *   • daily budget not exhausted
 * Returns campaigns paired with their venue row so we can inject directly.
 */
async function fetchSponsoredCampaigns(
  city: string | null | undefined,
  sectionTagAny: string[] | undefined,
  budgetCap: string | null | undefined,
  limit: number,
): Promise<Array<{ campaign: SponsoredCampaign; venue: VenueRow }>> {
  let query = supabaseAdmin
    .from("boost_campaigns")
    .select(
      "id,venue_id,business_id,boost_strength,target_cities,target_vibes,target_categories,target_occasions,target_price_range,daily_credit_budget,total_credits_spent,start_date,end_date,status",
    )
    .eq("status", "active")
    .lte("start_date", new Date().toISOString())
    .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`)
    .order("boost_strength", { ascending: false })
    .limit(limit * 3);

  const { data: campaigns, error } = await query;
  if (error) {
    console.warn("[ai-recommend] boost_campaigns query error:", error.message);
    return [];
  }
  if (!campaigns || campaigns.length === 0) return [];

  const cityLower = (city ?? "").toLowerCase();
  const matches = (campaigns as Array<SponsoredCampaign & {
    daily_credit_budget: number;
    total_credits_spent: number;
  }>).filter((c) => {
    // Budget exhaustion check (loose — daily reset isn't tracked here).
    if (c.daily_credit_budget > 0 && c.total_credits_spent >= c.daily_credit_budget * 7) {
      return false;
    }
    // City filter
    if (city && c.target_cities && c.target_cities.length > 0) {
      const hit = c.target_cities.some((tc) =>
        tc.toLowerCase().includes(cityLower) || cityLower.includes(tc.toLowerCase()),
      );
      if (!hit) return false;
    }
    // Vibe overlap with section bias
    if (
      sectionTagAny &&
      sectionTagAny.length > 0 &&
      c.target_vibes &&
      c.target_vibes.length > 0
    ) {
      const hit = c.target_vibes.some((tv) =>
        sectionTagAny.some((s) => tv.toLowerCase().includes(s.toLowerCase())),
      );
      if (!hit) return false;
    }
    // Budget ceiling — user $$ shouldn't see $$$$ partners
    if (budgetCap && c.target_price_range) {
      const userTier = budgetCap.length; // "$" → 1, "$$" → 2…
      const partnerTier = c.target_price_range.length;
      if (partnerTier > userTier + 1) return false; // tolerate 1 step over
    }
    return true;
  });

  if (matches.length === 0) return [];

  // Look up venue rows for the matched campaigns.
  const venueIds = matches.map((m) => m.venue_id);
  const { data: venues } = await supabaseAdmin
    .from("venues")
    .select(
      "id,name,city,neighborhood,address,lat,lng,cuisine,cuisine_tags,vibe_tags,occasion_tags,price,price_level,rating,rating_count,photo_url,vibe_notes,popularity_score",
    )
    .in("id", venueIds);

  const byId = new Map<string, VenueRow>(((venues as VenueRow[]) ?? []).map((v) => [v.id, v]));
  const paired: Array<{ campaign: SponsoredCampaign; venue: VenueRow }> = [];
  for (const c of matches) {
    const v = byId.get(c.venue_id);
    if (v) paired.push({ campaign: c, venue: v });
  }
  return paired.slice(0, limit);
}

/**
 * Increment per-campaign impression counters. Best-effort — failures here
 * don't surface to the caller. Uses simple read-modify-write (acceptable
 * for low concurrency; swap to an RPC if we hit contention).
 */
async function trackImpressions(campaignIds: string[]): Promise<void> {
  if (campaignIds.length === 0) return;
  // Fetch current counts, increment, write back. Done in parallel.
  const { data, error } = await supabaseAdmin
    .from("boost_campaigns")
    .select("id,impressions")
    .in("id", campaignIds);
  if (error || !data) return;
  await Promise.all(
    (data as Array<{ id: string; impressions: number }>).map((row) =>
      supabaseAdmin
        .from("boost_campaigns")
        .update({ impressions: (row.impressions ?? 0) + 1 })
        .eq("id", row.id),
    ),
  );
}

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
  sponsoredPairs: Array<{ campaign: SponsoredCampaign; venue: VenueRow }>,
  systemPrompt: string,
  anthropicKey: string,
  limit: number,
): Promise<VenueRecommendation[]> {
  if (candidates.length === 0 && sponsoredPairs.length === 0) return [];
  const tone = SECTION_BIAS[section].tone;
  const sectionHeader = section === "trending"
    ? `Pick the top ${limit} BUZZIEST venues. Trending means popular + currently talked-about.`
    : section === "picks"
    ? `Pick the top ${limit} PERSONALIZED matches for the user's taste. Lean into their loves / scene keywords / energy.`
    : `Pick ${limit} SURPRISE venues — outside the user's usual pattern but ones they'd unexpectedly love. Be creative.`;

  // Merge sponsored venues into the candidate pool (deduped). Sponsored
  // get a +1 visibility bump in Claude's prompt by listing them first.
  const sponsoredById = new Map(sponsoredPairs.map((p) => [p.venue.id, p.campaign]));
  const seenIds = new Set<string>();
  const merged: VenueRow[] = [];
  for (const p of sponsoredPairs) {
    if (!seenIds.has(p.venue.id)) {
      merged.push(p.venue);
      seenIds.add(p.venue.id);
    }
  }
  for (const v of candidates) {
    if (!seenIds.has(v.id)) {
      merged.push(v);
      seenIds.add(v.id);
    }
  }

  const sponsoredNote = sponsoredPairs.length > 0
    ? `\n\nNOTE: The first ${sponsoredPairs.length} candidates are Confetti partner venues. Only include them in your picks IF they're a genuine fit — never force a sponsored pick into a list where it doesn't match the user. Sponsorship affects placement order, never relevance.`
    : "";
  const userMsg = `${sectionHeader}${sponsoredNote}\n\nCandidates (${merged.length}):\n${JSON.stringify(merged.map(simplifyForClaude))}`;

  function shapeRec(v: VenueRow, override: { venue: string; category: string; vibe: string; reason: string }): VenueRecommendation {
    const campaign = sponsoredById.get(v.id);
    return {
      id: v.id,
      venue: override.venue || v.name,
      category: override.category,
      vibe: override.vibe,
      reason: override.reason,
      address: v.address ?? undefined,
      neighborhood: v.neighborhood ?? undefined,
      rating: v.rating ?? undefined,
      priceLevel: v.price_level ?? null,
      photo: v.photo_url ?? null,
      lat: v.lat ?? undefined,
      lng: v.lng ?? undefined,
      tone,
      ...(campaign
        ? {
            sponsored: true,
            partnerLabel: "Partner Pick · Matches your vibe",
            boostCampaignId: campaign.id,
          }
        : {}),
    };
  }

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
    const byId = new Map(merged.map((c) => [c.id, c]));
    const out: VenueRecommendation[] = [];
    for (const r of parsed.recommendations ?? []) {
      const v = byId.get(r.place_id);
      if (!v) continue;
      out.push(shapeRec(v, r));
      if (out.length >= limit) break;
    }
    // Track impressions for sponsored venues that actually surfaced.
    const surfacedCampaigns = out
      .filter((r) => r.sponsored && r.boostCampaignId)
      .map((r) => r.boostCampaignId as string);
    void trackImpressions(surfacedCampaigns);
    return out;
  } catch (e) {
    console.warn(`[ai-recommend] Claude ${section} failed:`, (e as Error).message);
    // Fallback: top-N by popularity score with a generic reason.
    const fallback = merged.slice(0, limit).map((v) => shapeRec(v, {
      venue: v.name,
      category: v.cuisine ?? "venue",
      vibe: v.vibe_notes?.slice(0, 60) ?? "Popular spot",
      reason: "Highly rated and popular in your area",
    }));
    void trackImpressions(
      fallback.filter((r) => r.sponsored && r.boostCampaignId).map((r) => r.boostCampaignId!),
    );
    return fallback;
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

  // Helper: pick the dominant vibe tag for the section so we can match
  // boost_campaigns.target_vibes against something concrete.
  function sectionVibes(section: "trending" | "picks" | "surprise"): string[] {
    const keys = pickSectionKeys(profile, timeOfDay, section);
    const vibes: string[] = [];
    for (const k of keys) {
      const bias = SECTION_BIAS[k];
      if (bias?.tagAny) vibes.push(...bias.tagAny);
    }
    return [...new Set(vibes)];
  }

  // Sponsored campaigns are gathered ONCE up front and partitioned by
  // section based on their target_vibes overlap so a single budget isn't
  // double-spent across trending / picks / surprise in the same response.
  const allSponsored = await fetchSponsoredCampaigns(
    body.city,
    undefined, // section filter applied below
    body.taste_profile ? undefined : null, // budget cap from profile if available
    Math.max(limit, 4),
  );
  const sponsoredAssigned = new Set<string>();

  function sponsoredFor(section: "trending" | "picks" | "surprise"): Array<{ campaign: SponsoredCampaign; venue: VenueRow }> {
    const wantVibes = sectionVibes(section).map((v) => v.toLowerCase());
    const out: Array<{ campaign: SponsoredCampaign; venue: VenueRow }> = [];
    for (const pair of allSponsored) {
      if (sponsoredAssigned.has(pair.campaign.id)) continue;
      const tv = (pair.campaign.target_vibes ?? []).map((s) => s.toLowerCase());
      if (wantVibes.length === 0 || tv.length === 0 || tv.some((v) => wantVibes.some((w) => v.includes(w) || w.includes(v)))) {
        out.push(pair);
        sponsoredAssigned.add(pair.campaign.id);
      }
      if (out.length >= 2) break; // cap at 2 sponsored per section
    }
    return out;
  }

  if (sections.includes("trending")) {
    const cands = await candidatesFor("trending");
    const sponsored = sponsoredFor("trending");
    const ranked = await rankSection("trending", cands, sponsored, systemPrompt, anthropicKey, limit);
    for (const r of ranked) seen.add(r.id);
    result.trending = ranked;
  }
  if (sections.includes("picks")) {
    const cands = await candidatesFor("picks");
    const sponsored = sponsoredFor("picks");
    const ranked = await rankSection("picks", cands, sponsored, systemPrompt, anthropicKey, limit);
    for (const r of ranked) seen.add(r.id);
    result.picks = ranked;
  }
  if (sections.includes("surprise")) {
    const cands = await candidatesFor("surprise");
    const sponsored = sponsoredFor("surprise");
    const ranked = await rankSection("surprise", cands, sponsored, systemPrompt, anthropicKey, limit);
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
