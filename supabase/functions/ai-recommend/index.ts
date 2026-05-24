// ============================================================
// ai-recommend — Claude-powered personalized feed recommendations.
// Powers: Trending venues, Starting soon, Personalized picks.
// Calls Anthropic Claude API server-side with user taste profile +
// Google Places venue candidates → returns structured JSON for the feed.
// ============================================================

import { serve } from "../_shared/server.ts";
import { corsHeaders, jsonResponse, errorResponse } from "../_shared/supabase-client.ts";
import { supabaseAdmin } from "../_shared/supabase-client.ts";
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
  limit?: number; // per section, default 4
  time_of_day?: "morning" | "afternoon" | "evening" | "night";
}

interface VenueRecommendation {
  id: string;
  venue: string;
  category: string;
  vibe: string;
  reason: string; // why Claude picked this for the user
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
    return data?.profile ?? null;
  } catch {
    return null;
  }
}

// ─── Google Places Search (reused from wizard-itinerary) ──────

const SEARCH_QUERIES: Record<string, { query: string; type: string; tone: string }> = {
  trending: { query: "popular restaurant bar", type: "restaurant", tone: "bg-coral" },
  nightlife: { query: "nightclub bar lounge", type: "night_club", tone: "bg-purple" },
  cocktails: { query: "cocktail bar speakeasy", type: "bar", tone: "bg-gold" },
  dining: { query: "fine dining restaurant", type: "restaurant", tone: "bg-emerald-400" },
  brunch: { query: "brunch restaurant cafe", type: "restaurant", tone: "bg-amber-300" },
  live_music: { query: "live music venue concert", type: "bar", tone: "bg-pink-300" },
  outdoor: { query: "rooftop bar patio restaurant", type: "bar", tone: "bg-sky-300" },
  lgbtq: { query: "lgbtq bar gay friendly", type: "bar", tone: "bg-rainbow" },
  family: { query: "family restaurant kid friendly", type: "restaurant", tone: "bg-green-300" },
  coffee: { query: "specialty coffee shop cafe", type: "cafe", tone: "bg-brown-300" },
};

async function searchPlaces(
  queryKey: string,
  body: RequestBody,
  exclude: Set<string>,
  key: string,
  limit = 6,
): Promise<Array<Record<string, unknown>>> {
  const recipe = SEARCH_QUERIES[queryKey] ?? SEARCH_QUERIES.trending;
  const textQuery = body.city ? `${recipe.query} in ${body.city}` : recipe.query;

  const reqBody: Record<string, unknown> = {
    textQuery,
    pageSize: Math.min(limit + 4, 12),
    includedType: recipe.type,
  };
  if (typeof body.lat === "number" && typeof body.lng === "number") {
    reqBody.locationBias = {
      circle: {
        center: { latitude: body.lat, longitude: body.lng },
        radius: 20000,
      },
    };
  }

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.businessStatus,places.shortFormattedAddress,places.photos",
    },
    body: JSON.stringify(reqBody),
  });

  if (!res.ok) return [];
  const data = await res.json();
  const places = (data.places ?? []) as Array<Record<string, unknown>>;
  return places
    .filter((p: any) => !exclude.has(p.id))
    .filter((p: any) => !p.businessStatus || p.businessStatus === "OPERATIONAL")
    .slice(0, limit);
}

async function resolvePhoto(name: string, key: string): Promise<string | null> {
  try {
    const url = `https://places.googleapis.com/v1/${name}/media?maxHeightPx=400&skipHttpRedirect=true&key=${key}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    return json.photoUri ?? null;
  } catch {
    return null;
  }
}

// ─── Claude API Call ──────────────────────────────────────────

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
  const content = data.content?.[0]?.text ?? "";
  return content;
}

// ─── Recommendation System Prompt ─────────────────────────────

function buildSystemPrompt(profile: TasteProfile | null, timeOfDay: string): string {
  return `You are Confetti's AI recommendation engine. You curate personalized dining, nightlife, and experience recommendations.

CONTEXT:
- Time of day: ${timeOfDay}
- User taste profile: ${profile ? JSON.stringify(profile) : "New user (no profile yet — give broadly appealing, popular picks)"}

YOUR TASK:
Given a list of venue candidates from Google Places, select and rank the BEST ones for this specific user. For each pick, explain in 1 short sentence WHY it fits them.

RULES:
1. Pick venues that match the user's energy, scene_keywords, and music_taste.
2. Respect their "avoid" list — never recommend anything matching those.
3. If identity_context.lgbtq_safe_mode is true, prioritize known LGBTQ+-friendly spaces and avoid venues with reported safety concerns.
4. For "surprise" picks, choose something outside their usual pattern that they might love based on adjacent interests.
5. Diversify — don't recommend the same type of venue twice in one section.
6. Consider time_of_day: morning → coffee/brunch, afternoon → lunch/activities, evening → dinner/cocktails, night → bars/clubs.

OUTPUT FORMAT:
Return ONLY valid JSON (no markdown, no code fences). Use this exact structure:
{
  "recommendations": [
    {
      "place_id": "the Google place ID",
      "venue": "Venue Name",
      "category": "cocktail bar|restaurant|nightclub|cafe|etc",
      "vibe": "Short 2-3 word vibe description",
      "reason": "One sentence why this fits the user"
    }
  ]
}`;
}

// ─── Main Handler ─────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders() });

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

  const placesKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
  if (!placesKey) return errorResponse("GOOGLE_PLACES_API_KEY not configured", 500);

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  // Resolve user and taste profile
  const userId = body.user_id ?? (await getUserIdFromAuth(req));
  let profile: TasteProfile | null = body.taste_profile ?? null;
  if (!profile && userId) {
    profile = await fetchTasteProfile(userId);
  }

  const sections = body.sections ?? ["trending", "picks", "events"];
  const limit = Math.max(1, Math.min(body.limit ?? 4, 8));
  const timeOfDay = body.time_of_day ?? inferTimeOfDay();
  const seen = new Set<string>();

  const result: FeedResponse = {
    generated_at: new Date().toISOString(),
    model: "claude-sonnet-4-20250514",
  };

  // ── Trending Venues ──
  if (sections.includes("trending")) {
    const queryKeys = selectQueriesForProfile(profile, timeOfDay, "trending");
    const candidates = await gatherCandidates(queryKeys, body, seen, placesKey, limit + 2);

    if (candidates.length > 0) {
      const systemPrompt = buildSystemPrompt(profile, timeOfDay);
      const userMsg = `Here are ${candidates.length} trending venue candidates near the user. Pick the best ${limit} and rank them:\n\n${JSON.stringify(candidates.map(simplifyPlace))}`;

      try {
        const raw = await callClaude(systemPrompt, userMsg, anthropicKey);
        const parsed = JSON.parse(extractJson(raw));
        result.trending = await enrichRecommendations(
          parsed.recommendations ?? [],
          candidates,
          placesKey,
          seen,
          "bg-coral",
        );
      } catch (e) {
        console.warn("[ai-recommend] Claude trending failed:", (e as Error).message);
        // Fallback: return top-rated candidates without AI ranking
        result.trending = await fallbackRecommendations(candidates, placesKey, seen, limit, "bg-coral");
      }
    }
  }

  // ── Personalized Picks ──
  if (sections.includes("picks")) {
    const queryKeys = selectQueriesForProfile(profile, timeOfDay, "picks");
    const candidates = await gatherCandidates(queryKeys, body, seen, placesKey, limit + 2);

    if (candidates.length > 0) {
      const systemPrompt = buildSystemPrompt(profile, timeOfDay);
      const userMsg = `Here are ${candidates.length} venue candidates. Pick the ${limit} BEST personalized matches for this user's taste profile:\n\n${JSON.stringify(candidates.map(simplifyPlace))}`;

      try {
        const raw = await callClaude(systemPrompt, userMsg, anthropicKey);
        const parsed = JSON.parse(extractJson(raw));
        result.picks = await enrichRecommendations(
          parsed.recommendations ?? [],
          candidates,
          placesKey,
          seen,
          "bg-purple",
        );
      } catch (e) {
        console.warn("[ai-recommend] Claude picks failed:", (e as Error).message);
        result.picks = await fallbackRecommendations(candidates, placesKey, seen, limit, "bg-purple");
      }
    }
  }

  // ── Surprise Picks ──
  if (sections.includes("surprise")) {
    const queryKeys = selectQueriesForProfile(profile, timeOfDay, "surprise");
    const candidates = await gatherCandidates(queryKeys, body, seen, placesKey, limit + 2);

    if (candidates.length > 0) {
      const systemPrompt = buildSystemPrompt(profile, timeOfDay);
      const userMsg = `Here are ${candidates.length} venue candidates. Pick ${limit} SURPRISE recommendations — things outside this user's usual pattern that they'd unexpectedly love. Be creative:\n\n${JSON.stringify(candidates.map(simplifyPlace))}`;

      try {
        const raw = await callClaude(systemPrompt, userMsg, anthropicKey);
        const parsed = JSON.parse(extractJson(raw));
        result.surprise = await enrichRecommendations(
          parsed.recommendations ?? [],
          candidates,
          placesKey,
          seen,
          "bg-gold",
        );
      } catch (e) {
        console.warn("[ai-recommend] Claude surprise failed:", (e as Error).message);
        result.surprise = await fallbackRecommendations(candidates, placesKey, seen, limit, "bg-gold");
      }
    }
  }

  // ── Events (placeholder until SeatGeek/PredictHQ keys are added) ──
  if (sections.includes("events")) {
    result.events = await fetchEvents(body, profile, timeOfDay);
  }

  return jsonResponse(result);
});

// ─── Helpers ──────────────────────────────────────────────────

function inferTimeOfDay(): "morning" | "afternoon" | "evening" | "night" {
  const hour = new Date().getUTCHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

function selectQueriesForProfile(
  profile: TasteProfile | null,
  timeOfDay: string,
  section: string,
): string[] {
  // Smart query selection based on profile + time
  if (!profile) {
    // New user defaults
    if (timeOfDay === "morning") return ["coffee", "brunch"];
    if (timeOfDay === "afternoon") return ["dining", "outdoor"];
    if (timeOfDay === "evening") return ["dining", "cocktails", "live_music"];
    return ["nightlife", "cocktails", "live_music"];
  }

  const queries: string[] = [];
  const keywords = profile.scene_keywords ?? [];
  const energy = profile.energy ?? "balanced";
  const isLgbtq = profile.identity_context?.lgbtq_safe_mode;

  // Priority: LGBTQ+ safe spaces
  if (isLgbtq) queries.push("lgbtq");

  // Match by time of day
  if (timeOfDay === "morning") {
    queries.push("coffee", "brunch");
  } else if (timeOfDay === "afternoon") {
    queries.push("dining");
    if (keywords.includes("outdoorsy")) queries.push("outdoor");
  } else if (timeOfDay === "evening") {
    queries.push("dining");
    if (energy === "high_energy") queries.push("nightlife");
    else queries.push("cocktails");
    if (keywords.includes("live") || profile.music_taste?.length) queries.push("live_music");
  } else {
    // Night
    if (energy === "high_energy") queries.push("nightlife");
    queries.push("cocktails");
    if (keywords.includes("loud") || energy === "high_energy") queries.push("nightlife");
    else queries.push("live_music");
  }

  // Surprise section = pick DIFFERENT categories than their usual
  if (section === "surprise") {
    const usual = new Set(queries);
    const alternatives = Object.keys(SEARCH_QUERIES).filter((k) => !usual.has(k));
    return alternatives.slice(0, 3);
  }

  return [...new Set(queries)].slice(0, 3);
}

async function gatherCandidates(
  queryKeys: string[],
  body: RequestBody,
  seen: Set<string>,
  placesKey: string,
  limit: number,
): Promise<Array<Record<string, unknown>>> {
  const all: Array<Record<string, unknown>> = [];
  for (const qk of queryKeys) {
    const results = await searchPlaces(qk, body, seen, placesKey, Math.ceil(limit / queryKeys.length) + 2);
    all.push(...results);
  }
  // Deduplicate
  const unique: Array<Record<string, unknown>> = [];
  const ids = new Set<string>();
  for (const p of all) {
    const id = (p as any).id;
    if (!ids.has(id) && !seen.has(id)) {
      ids.add(id);
      unique.push(p);
    }
  }
  return unique.slice(0, limit);
}

function simplifyPlace(p: Record<string, unknown>) {
  return {
    id: (p as any).id,
    name: (p as any).displayName?.text ?? "Unknown",
    address: (p as any).shortFormattedAddress ?? (p as any).formattedAddress ?? "",
    rating: (p as any).rating ?? null,
    reviews: (p as any).userRatingCount ?? 0,
    price: (p as any).priceLevel ?? null,
  };
}

async function enrichRecommendations(
  recs: Array<{ place_id: string; venue: string; category: string; vibe: string; reason: string }>,
  candidates: Array<Record<string, unknown>>,
  placesKey: string,
  seen: Set<string>,
  defaultTone: string,
): Promise<VenueRecommendation[]> {
  const candidateMap = new Map<string, Record<string, unknown>>();
  for (const c of candidates) candidateMap.set((c as any).id, c);

  const results: VenueRecommendation[] = [];
  for (const rec of recs) {
    const place = candidateMap.get(rec.place_id);
    if (!place) continue;
    seen.add(rec.place_id);

    const photoName = ((place as any).photos as any[])?.[0]?.name;
    const photo = photoName ? await resolvePhoto(photoName, placesKey) : null;
    const addr = (place as any).shortFormattedAddress ?? (place as any).formattedAddress ?? "";
    const parts = addr.split(",").map((s: string) => s.trim()).filter(Boolean);
    const neighborhood = parts.length >= 2 ? parts[parts.length - 2] : undefined;

    results.push({
      id: rec.place_id,
      venue: rec.venue || (place as any).displayName?.text || "Unknown",
      category: rec.category,
      vibe: rec.vibe,
      reason: rec.reason,
      address: (place as any).formattedAddress,
      neighborhood,
      rating: (place as any).rating,
      priceLevel: (place as any).priceLevel ? priceLevelToNum((place as any).priceLevel) : null,
      photo,
      lat: (place as any).location?.latitude,
      lng: (place as any).location?.longitude,
      tone: defaultTone,
    });
  }
  return results;
}

async function fallbackRecommendations(
  candidates: Array<Record<string, unknown>>,
  placesKey: string,
  seen: Set<string>,
  limit: number,
  tone: string,
): Promise<VenueRecommendation[]> {
  // Sort by rating * log(reviews) and take top N
  const sorted = [...candidates].sort((a: any, b: any) => {
    const sa = (a.rating ?? 0) * Math.log10((a.userRatingCount ?? 0) + 10);
    const sb = (b.rating ?? 0) * Math.log10((b.userRatingCount ?? 0) + 10);
    return sb - sa;
  });

  const results: VenueRecommendation[] = [];
  for (const place of sorted.slice(0, limit)) {
    const id = (place as any).id;
    seen.add(id);
    const photoName = ((place as any).photos as any[])?.[0]?.name;
    const photo = photoName ? await resolvePhoto(photoName, placesKey) : null;

    results.push({
      id,
      venue: (place as any).displayName?.text ?? "Unknown",
      category: "venue",
      vibe: "Popular spot",
      reason: "Highly rated and popular in your area",
      address: (place as any).formattedAddress,
      neighborhood: undefined,
      rating: (place as any).rating,
      priceLevel: (place as any).priceLevel ? priceLevelToNum((place as any).priceLevel) : null,
      photo,
      lat: (place as any).location?.latitude,
      lng: (place as any).location?.longitude,
      tone,
    });
  }
  return results;
}

function priceLevelToNum(level: string): number {
  const map: Record<string, number> = {
    PRICE_LEVEL_FREE: 0,
    PRICE_LEVEL_INEXPENSIVE: 1,
    PRICE_LEVEL_MODERATE: 2,
    PRICE_LEVEL_EXPENSIVE: 3,
    PRICE_LEVEL_VERY_EXPENSIVE: 4,
  };
  return map[level] ?? 2;
}

async function fetchEvents(
  body: RequestBody,
  _profile: TasteProfile | null,
  _timeOfDay: string,
): Promise<EventRecommendation[]> {
  // TODO: Wire SeatGeek / PredictHQ once API keys are added.
  // For now return placeholder events based on city.
  const city = body.city ?? "your area";
  return [
    {
      title: `Live Music Night`,
      venue: `Local venue in ${city}`,
      time: "Tonight, 8:00 PM",
      category: "live_music",
      reason: "Popular event happening near you tonight",
      vibe: "Live energy",
    },
    {
      title: `Weekend Brunch Popup`,
      venue: `Cafe in ${city}`,
      time: "Saturday, 11:00 AM",
      category: "food_event",
      reason: "Trending food event this weekend",
      vibe: "Chill vibes",
    },
  ];
}

function extractJson(text: string): string {
  // Claude might wrap in markdown code fences — strip them
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  // Try to find JSON object directly
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1) return text.slice(start, end + 1);
  return text;
}
