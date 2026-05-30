/**
 * Unified Idea Provider — merges seed ideas with AI-generated ideas.
 *
 * Priority order:
 *   1. AI-generated ideas from Supabase (highest quality_score first)
 *   2. Seed ideas from occasions.ts (always available as fallback)
 *
 * Client-side only. Calls server functions to fetch from DB.
 * Falls back gracefully to seeds if the server is unreachable.
 */

import { getSeedIdeas, type Idea } from "./occasions";
import { fetchAIIdeas } from "./idea-generation.functions";

// ─── In-memory cache (per session) ──────────────────────────

const ideaCache = new Map<string, { ideas: Idea[]; fetchedAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function cacheKey(occasionSlug: string, citySlug?: string | null): string {
  return `${occasionSlug}::${citySlug ?? "universal"}`;
}

// ─── Public API ─────────────────────────────────────────────

/**
 * Get all ideas for an occasion, merging seeds + AI-generated.
 * AI ideas come first (sorted by quality), seeds fill the tail.
 * Returns immediately from cache if fresh; fetches in background otherwise.
 */
export async function getIdeasForOccasion(
  occasionSlug: string,
  citySlug?: string | null,
  options?: {
    /** Max total ideas to return (default: 20) */
    limit?: number;
    /** Skip the server call and return seeds only */
    seedsOnly?: boolean;
  },
): Promise<Idea[]> {
  const limit = options?.limit ?? 20;
  const seeds = getSeedIdeas(occasionSlug);

  if (options?.seedsOnly) {
    return seeds.slice(0, limit);
  }

  // Check cache
  const key = cacheKey(occasionSlug, citySlug);
  const cached = ideaCache.get(key);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.ideas.slice(0, limit);
  }

  // Fetch AI ideas from server
  try {
    const aiIdeas = await fetchAIIdeas({
      data: {
        occasionSlug,
        citySlug: citySlug ?? null,
        limit: Math.min(limit, 30),
      },
    });

    // Merge: AI ideas first (already sorted by quality_score desc), then seeds
    // Deduplicate by title similarity
    const aiTitles = new Set(aiIdeas.map((i) => i.title.toLowerCase()));
    const uniqueSeeds = seeds.filter((s) => !aiTitles.has(s.title.toLowerCase()));
    const merged = [...aiIdeas, ...uniqueSeeds];

    // Cache the merged result
    ideaCache.set(key, { ideas: merged, fetchedAt: Date.now() });

    return merged.slice(0, limit);
  } catch (err) {
    console.warn("[unified-ideas] AI fetch failed, using seeds:", err);
    return seeds.slice(0, limit);
  }
}

/**
 * Get the count of available ideas for an occasion (seeds + cached AI).
 * Non-blocking — returns seed count if no cache is available.
 */
export function getIdeaCount(occasionSlug: string, citySlug?: string | null): number {
  const key = cacheKey(occasionSlug, citySlug);
  const cached = ideaCache.get(key);
  if (cached) return cached.ideas.length;

  // Fallback to seed count
  return getSeedIdeas(occasionSlug).length;
}

/**
 * Prefetch ideas for multiple occasions (e.g., on page load).
 * Fires fetches in parallel, populates cache silently.
 */
export function prefetchIdeas(occasionSlugs: string[], citySlug?: string | null): void {
  for (const slug of occasionSlugs) {
    // Fire and forget
    getIdeasForOccasion(slug, citySlug).catch(() => {});
  }
}

/**
 * Invalidate cached ideas for an occasion (e.g., after on-demand generation).
 */
export function invalidateIdeaCache(occasionSlug?: string, citySlug?: string | null): void {
  if (occasionSlug) {
    ideaCache.delete(cacheKey(occasionSlug, citySlug));
  } else {
    ideaCache.clear();
  }
}
