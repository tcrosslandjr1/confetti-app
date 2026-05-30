// ============================================================
// Event Discovery Client — On-demand local event enrichment.
//
// Follows the on-demand enrichment pattern:
//   1. Check cache (already fetched for this city+date?)
//   2. Call event-discovery edge function (Claude + web search)
//   3. Merge into loop store for persistence
//
// Called by UI components when user asks "what's popping tonight"
// or taps the Discover tab.
// ============================================================

import { supabase } from "@/integrations/supabase/client";

// ─── Types ───────────────────────────────────────────────────

export interface DiscoveredEvent {
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

export interface EventDiscoveryResult {
  city: string;
  date: string;
  events: DiscoveredEvent[];
  vibes_summary: string;
  search_context: string;
  cached_at?: string;
  meta?: {
    events_found: number;
    high_confidence: number;
    model: string;
    tool: string;
  };
}

export interface EventDiscoveryRequest {
  city: string;
  date?: string;
  time_of_day?: string;
  vibe?: string[];
  occasion?: string;
  group_size?: number;
  budget?: string;
  query?: string;
  categories?: string[];
}

export type DiscoveryStatus = "idle" | "loading" | "success" | "not-found" | "error";

// ─── Cache ───────────────────────────────────────────────────

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes — events are time-sensitive

interface CacheEntry {
  result: EventDiscoveryResult;
  timestamp: number;
}

const discoveryCache = new Map<string, CacheEntry>();

function cacheKey(req: EventDiscoveryRequest): string {
  return `${req.city.toLowerCase()}|${req.date || "tonight"}|${(req.vibe || []).sort().join(",")}`;
}

function getCached(req: EventDiscoveryRequest): EventDiscoveryResult | null {
  const key = cacheKey(req);
  const entry = discoveryCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    discoveryCache.delete(key);
    return null;
  }
  return entry.result;
}

function setCache(req: EventDiscoveryRequest, result: EventDiscoveryResult): void {
  const key = cacheKey(req);
  discoveryCache.set(key, { result, timestamp: Date.now() });
  // Evict old entries if cache grows too large
  if (discoveryCache.size > 20) {
    const oldest = [...discoveryCache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
    if (oldest) discoveryCache.delete(oldest[0]);
  }
}

// ─── Edge Function Caller ────────────────────────────────────

async function callEventDiscovery(req: EventDiscoveryRequest): Promise<EventDiscoveryResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const res = await supabase.functions.invoke("event-discovery", {
    body: req,
    headers: session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : undefined,
  });

  if (res.error) {
    throw new Error(res.error.message || "Event discovery failed");
  }

  return res.data as EventDiscoveryResult;
}

// ─── Public API ──────────────────────────────────────────────

/**
 * Discover events for a city. Checks cache first, then calls the
 * edge function which uses Claude + web search for real-time data.
 *
 * Usage:
 *   const result = await discoverEvents({ city: "Washington DC", date: "tonight" });
 *   // result.events → DiscoveredEvent[]
 */
export async function discoverEvents(req: EventDiscoveryRequest): Promise<EventDiscoveryResult> {
  // 1. Check in-memory cache
  const cached = getCached(req);
  if (cached) return cached;

  // 2. Call edge function (Claude + web search)
  const result = await callEventDiscovery(req);

  // 3. Cache the result
  if (result.events.length > 0) {
    setCache(req, result);
  }

  return result;
}

/**
 * Quick helper: discover events and filter by category.
 */
export async function discoverByCategory(
  city: string,
  category: string,
  date?: string,
): Promise<DiscoveredEvent[]> {
  const result = await discoverEvents({ city, date, categories: [category] });
  return result.events.filter((e) => e.category === category || e.vibe_tags.includes(category));
}

/**
 * Quick helper: discover events matching a vibe.
 */
export async function discoverByVibe(
  city: string,
  vibes: string[],
  date?: string,
): Promise<DiscoveredEvent[]> {
  const result = await discoverEvents({ city, date, vibe: vibes });
  return result.events.filter((e) => e.vibe_tags.some((tag) => vibes.includes(tag)));
}

/**
 * Invalidate cache for a city (e.g., when user changes date).
 */
export function invalidateDiscoveryCache(city?: string): void {
  if (!city) {
    discoveryCache.clear();
    return;
  }
  const prefix = city.toLowerCase();
  for (const key of discoveryCache.keys()) {
    if (key.startsWith(prefix)) discoveryCache.delete(key);
  }
}
