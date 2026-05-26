// ============================================================
// Event Cache — Server-side cache for discovered events.
//
// Uses the discovered_events table to persist event discovery
// results so subsequent requests for the same city+date don't
// re-trigger Claude web search.
//
// Cache TTL: 2 hours (events are time-sensitive but not second-by-second)
// ============================================================

import { supabaseAdmin } from "./supabase-client.ts";

interface CachedDiscovery {
  city: string;
  date_key: string;
  events: unknown[];
  vibes_summary: string;
  search_context: string;
  cached_at: string;
}

const CACHE_TTL_HOURS = 2;

/**
 * Normalize the cache key: lowercase city + date string.
 */
function normalizeKey(city: string, dateKey: string): { city: string; date_key: string } {
  return {
    city: city.trim().toLowerCase(),
    date_key: dateKey.trim().toLowerCase(),
  };
}

/**
 * Check if we have a fresh cached discovery for this city+date.
 * Returns the cached result or null if expired/missing.
 */
export async function getCachedDiscovery(
  city: string,
  dateKey: string,
): Promise<CachedDiscovery | null> {
  const key = normalizeKey(city, dateKey);
  const cutoff = new Date(Date.now() - CACHE_TTL_HOURS * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabaseAdmin
    .from("discovered_events")
    .select("*")
    .eq("city", key.city)
    .eq("date_key", key.date_key)
    .gte("cached_at", cutoff)
    .order("cached_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as CachedDiscovery;
}

/**
 * Store a discovery result in the cache. Upserts by city+date_key.
 */
export async function setCachedDiscovery(
  city: string,
  dateKey: string,
  events: unknown[],
  vibesSummary: string,
  searchContext: string,
): Promise<void> {
  const key = normalizeKey(city, dateKey);

  const { error } = await supabaseAdmin
    .from("discovered_events")
    .upsert(
      {
        city: key.city,
        date_key: key.date_key,
        events: JSON.stringify(events),
        vibes_summary: vibesSummary,
        search_context: searchContext,
        cached_at: new Date().toISOString(),
      },
      { onConflict: "city,date_key" },
    );

  if (error) {
    console.warn("[event-cache] upsert error:", error.message);
  }
}

/**
 * Purge expired entries. Called opportunistically or via cron.
 */
export async function purgeExpiredEvents(): Promise<number> {
  const cutoff = new Date(Date.now() - CACHE_TTL_HOURS * 2 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabaseAdmin
    .from("discovered_events")
    .delete()
    .lt("cached_at", cutoff)
    .select("id");

  if (error) {
    console.warn("[event-cache] purge error:", error.message);
    return 0;
  }
  return (data ?? []).length;
}
