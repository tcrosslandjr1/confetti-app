// ============================================================
// event-discovery — Claude-powered real-time local event & nightlife
// discovery using web search tool use.
//
// Replaces expensive third-party event APIs (PredictHQ, Ticketmaster,
// Eventbrite) with Claude as the data fetching layer.
//
// Architecture:
//   1. Client sends city, date, vibe/mood, group info
//   2. Check discovered_events DB cache (2-hour TTL)
//   3. On cache miss → call Claude with web_search tool enabled
//   4. Claude searches for real-time events, curates results
//   5. Persist to DB cache for subsequent requests
//   6. Returns structured discovery data matching Confetti's format
//   7. Client also caches in-memory (30-min TTL)
//
// Follows the on-demand enrichment pattern:
//   skills/on-demand-enrichment/SKILL.md
// ============================================================

import { serve } from "../_shared/server.ts";
import { corsHeaders, jsonResponse, errorResponse } from "../_shared/supabase-client.ts";
import { consumeRateLimit, callerIdentity } from "../_shared/ratelimit.ts";
import { getCachedDiscovery, setCachedDiscovery, purgeExpiredEvents } from "../_shared/event-cache.ts";

// ─── Types ───────────────────────────────────────────────────

interface RequestBody {
  city: string;
  date?: string;          // ISO date or "tonight", "this weekend", etc.
  time_of_day?: string;   // "evening", "afternoon", "late-night"
  vibe?: string[];        // ["high-energy", "rooftop", "live-music"]
  occasion?: string;      // "birthday", "date-night", "girls-night"
  group_size?: number;
  budget?: string;        // "$", "$$", "$$$", "$$$$"
  query?: string;         // Freeform: "what's popping tonight"
  categories?: string[];  // ["concerts", "comedy", "food-festivals"]
}

interface DiscoveredEvent {
  name: string;
  venue: string;
  address?: string;
  neighborhood?: string;
  date: string;
  time?: string;
  category: string;
  vibe_tags: string[];
  price_range?: string;
  description: string;
  url?: string;
  source: string;
  confidence: "high" | "medium" | "low";
}

interface DiscoveryResponse {
  city: string;
  date: string;
  events: DiscoveredEvent[];
  vibes_summary: string;
  search_context: string;
  cached_at?: string;
}

// ─── Auth ────────────────────────────────────────────────────

function isAuthorized(req: Request): boolean {
  const expected = Deno.env.get("SUPABASE_ANON_KEY");
  if (!expected) return false;
  const apiKey = req.headers.get("apikey");
  const auth = req.headers.get("Authorization") ?? "";
  return apiKey === expected || auth === `Bearer ${expected}`;
}

// ─── System Prompt ───────────────────────────────────────────

function buildSystemPrompt(body: RequestBody): string {
  const dateStr = body.date || "tonight";
  const vibeStr = body.vibe?.join(", ") || "any vibe";
  const occasionStr = body.occasion ? `Occasion: ${body.occasion}.` : "";
  const groupStr = body.group_size ? `Group size: ${body.group_size}.` : "";
  const budgetStr = body.budget ? `Budget: ${body.budget}.` : "";
  const catStr = body.categories?.length ? `Focus on: ${body.categories.join(", ")}.` : "";

  return `You are Confetti's Event Discovery Agent — a real-time local events and nightlife scout.

Your job: Use web search to find REAL events, pop-ups, shows, parties, and happenings in ${body.city} for ${dateStr}. You are the data layer that replaces expensive event API subscriptions.

## SEARCH STRATEGY

Search for events using multiple queries to cover the full picture:
1. "${body.city} events ${dateStr}" — broad event search
2. "${body.city} nightlife ${dateStr}" — bars, clubs, DJ sets
3. "${body.city} live music concerts ${dateStr}" — music events
4. "${body.city} food pop-up festival ${dateStr}" — food/drink events
5. "${body.city} comedy shows ${dateStr}" — entertainment
6. Any category-specific searches based on user preferences

## USER CONTEXT

City: ${body.city}
Date/Time: ${dateStr}${body.time_of_day ? ` (${body.time_of_day})` : ""}
Vibes: ${vibeStr}
${occasionStr}
${groupStr}
${budgetStr}
${catStr}
${body.query ? `User said: "${body.query}"` : ""}

## DISCOVERY RULES

1. ONLY include events you find evidence for via web search. Never invent events.
2. Prioritize events that match the user's vibe and occasion.
3. Include a MIX: concerts, DJ nights, comedy, food events, art openings, sports viewing parties, pop-ups, themed bar nights, festivals, etc.
4. For each event, extract: name, venue, address, time, category, vibe, price if available, and the source URL.
5. Assign confidence: "high" if found on official event page or major listing site, "medium" if mentioned in a blog/social post, "low" if inferred from venue schedule.
6. If you can't find enough specific events, include recurring venue happenings (e.g., "Jazz Wednesdays at Blue Note" or "Industry Night at Club X").
7. Aim for 8-15 events minimum. More is better.
8. vibe_tags should use lowercase keywords from: "high-energy", "chill", "romantic", "artsy", "trendy", "bougie", "outdoor", "rooftop", "live-music", "dj", "dance", "comedy", "sports", "food-festival", "pop-up", "speakeasy", "karaoke", "late-night", "brunch", "day-party", "underground", "queer-friendly", "family-friendly".

## OUTPUT FORMAT

Return ONLY valid JSON (no markdown fences, no explanation):

{
  "city": "${body.city}",
  "date": "${dateStr}",
  "events": [
    {
      "name": "Event Name",
      "venue": "Venue Name",
      "address": "123 Main St, ${body.city}",
      "neighborhood": "Downtown",
      "date": "${dateStr}",
      "time": "9:00 PM",
      "category": "concert|comedy|dj-night|food-festival|pop-up|art|sports|themed-night|party|brunch|day-party|other",
      "vibe_tags": ["high-energy", "live-music"],
      "price_range": "$20-40 | Free | $$",
      "description": "Brief 1-2 sentence description of the event",
      "url": "https://source-url-where-found",
      "source": "eventbrite|venue-website|timeout|eater|instagram|other",
      "confidence": "high|medium|low"
    }
  ],
  "vibes_summary": "One sentence summarizing the overall scene for this night",
  "search_context": "Brief note on what you searched and found"
}`;
}

// ─── Claude API Call with Web Search ─────────────────────────

async function callClaudeWithSearch(
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
      max_tokens: 16000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
      tools: [
        {
          type: "web_search",
          name: "web_search",
          max_uses: 10,
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude API error ${res.status}: ${errText}`);
  }

  const data = await res.json();

  // Extract the final text block from the response content.
  // With tool use, the response may contain multiple content blocks
  // (tool_use, tool_result, text). We want the last text block.
  const textBlocks = (data.content ?? []).filter(
    (block: { type: string }) => block.type === "text",
  );
  if (textBlocks.length === 0) {
    throw new Error("No text response from Claude");
  }
  return textBlocks[textBlocks.length - 1].text ?? "";
}

// ─── Parse & Validate ────────────────────────────────────────

function parseDiscoveryResponse(raw: string): DiscoveryResponse {
  // Strip markdown fences if present
  const stripped = raw
    .replace(/^```json?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const parsed = JSON.parse(stripped) as DiscoveryResponse;

  // Validate required fields
  if (!parsed.city || !Array.isArray(parsed.events)) {
    throw new Error("Invalid response structure");
  }

  // Sanitize events
  parsed.events = parsed.events
    .filter((e) => e.name && e.venue)
    .map((e) => ({
      name: e.name.trim(),
      venue: e.venue.trim(),
      address: e.address?.trim() || undefined,
      neighborhood: e.neighborhood?.trim() || undefined,
      date: e.date || parsed.date,
      time: e.time?.trim() || undefined,
      category: e.category || "other",
      vibe_tags: Array.isArray(e.vibe_tags) ? e.vibe_tags : [],
      price_range: e.price_range?.trim() || undefined,
      description: e.description?.trim() || "",
      url: e.url?.trim() || undefined,
      source: e.source || "web-search",
      confidence: (["high", "medium", "low"].includes(e.confidence) ? e.confidence : "medium") as "high" | "medium" | "low",
    }));

  parsed.cached_at = new Date().toISOString();
  return parsed;
}

// ─── Handler ─────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (!isAuthorized(req)) return errorResponse("Unauthorized", 401);

  // Rate limit: 10 requests/min/IP (heavier than ai-chat due to web search)
  const allowed = await consumeRateLimit({
    scope: "event-discovery",
    identity: callerIdentity(req),
    burst: 10,
    refillPerSec: 10 / 60,
  });
  if (!allowed) return errorResponse("Rate limit exceeded", 429);

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return errorResponse("ANTHROPIC_API_KEY not configured", 500);
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  // Validate required field
  if (!body.city || typeof body.city !== "string" || body.city.trim().length < 2) {
    return errorResponse("city is required (min 2 chars)");
  }
  body.city = body.city.trim();

  const dateKey = body.date || "tonight";

  // ── 1. Check server-side DB cache (2-hour TTL) ──────────────
  try {
    const cached = await getCachedDiscovery(body.city, dateKey);
    if (cached) {
      console.log(`[event-discovery] cache HIT for ${body.city}/${dateKey}`);
      return jsonResponse({
        city: cached.city,
        date: cached.date_key,
        events: typeof cached.events === "string" ? JSON.parse(cached.events) : cached.events,
        vibes_summary: cached.vibes_summary,
        search_context: cached.search_context,
        cached_at: cached.cached_at,
        meta: {
          events_found: (typeof cached.events === "string" ? JSON.parse(cached.events) : cached.events).length,
          high_confidence: 0, // not tracked in cache
          model: "cache",
          tool: "db-cache",
        },
      });
    }
  } catch (cacheErr) {
    // Cache read failure is non-fatal — fall through to Claude
    console.warn("[event-discovery] cache read error:", cacheErr);
  }

  console.log(`[event-discovery] cache MISS for ${body.city}/${dateKey} — calling Claude`);

  // ── 2. Build prompt and call Claude with web search ──────────
  const systemPrompt = buildSystemPrompt(body);
  const userMessage = body.query
    ? `Find events matching: "${body.query}" in ${body.city} for ${body.date || "tonight"}.`
    : `Find the best events, nightlife, and happenings in ${body.city} for ${body.date || "tonight"}. Match vibes: ${body.vibe?.join(", ") || "any"}.`;

  try {
    const raw = await callClaudeWithSearch(systemPrompt, userMessage, apiKey);
    const result = parseDiscoveryResponse(raw);

    // ── 3. Persist to server-side cache ─────────────────────────
    if (result.events.length > 0) {
      setCachedDiscovery(
        body.city,
        dateKey,
        result.events,
        result.vibes_summary || "",
        result.search_context || "",
      ).catch((e) => console.warn("[event-discovery] cache write error:", e));
    }

    // ── 4. Opportunistic purge (~5% of requests) ────────────────
    if (Math.random() < 0.05) {
      purgeExpiredEvents().catch((e) =>
        console.warn("[event-discovery] purge error:", e),
      );
    }

    return jsonResponse({
      ...result,
      meta: {
        events_found: result.events.length,
        high_confidence: result.events.filter((e) => e.confidence === "high").length,
        model: "claude-sonnet-4-20250514",
        tool: "web_search",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[event-discovery] failed:", message);
    return errorResponse(`Discovery failed: ${message}`, 502);
  }
});
