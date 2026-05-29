// venue-intel.server.ts
// Queries the `venue_intel` Supabase table, which is populated by the
// Confetti Fetcher cron job running on the Synology NAS.
//
// Data flow:
//   NAS cron (Python) → venue_intel table → this module → generate-plan prompt
//
// NOTE: venue_intel is not yet in the auto-generated Database types, so we
// use the any-typed .from() call and validate shape at runtime.
// Regenerate types with `supabase gen types` after the migration propagates.

import { supabaseAdmin } from "@/integrations/supabase/client.server";

// ── Internal row type (matches venue_intel DDL) ──────────────────────────────

type VenueIntelRow = {
  place_id: string;
  name: string;
  category: string | null;
  city: string | null;
  neighborhood: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  google_rating: number | null;
  google_review_count: number | null;
  yelp_rating: number | null;
  yelp_review_count: number | null;
  tiktok_mention_count: number | null;
  tiktok_video_urls: unknown;
  tags: string[] | null;
  trending_score: number | null;
  is_trending: boolean | null;
  description: string | null;
  curator_notes: string | null;
  manually_added: boolean | null;
  phone: string | null;
  website: string | null;
  image_url: string | null;
};

// ── CandidateVenue shape (mirrors generate-plan.functions.ts) ────────────────

export type VenueIntelCandidate = {
  id: string;
  name: string;
  category: string;
  neighborhood: string | null;
  rating: number | null;
  trendScore: number | null;
  mentionCount: number | null;
  tags: string[];
  summary: string | null;
  placeId: string | null;
  lat: number | null;
  lng: number | null;
  isTrending: boolean;
  tiktokCount: number;
  source: "venue_intel";
};

// ── City name normalizer ─────────────────────────────────────────────────────
// venue_intel stores city as "DC", "Washington", "Maryland", "Virginia", etc.
// generate-plan uses cityCtx.city which is the full name. We search broadly.

function cityAliases(city: string): string[] {
  const lc = city.toLowerCase();
  if (lc.includes("washington") || lc === "dc" || lc.includes("district")) {
    return ["dc", "washington", "washington dc", "washington, dc", "district of columbia"];
  }
  if (lc.includes("maryland") || lc === "md") {
    return ["maryland", "md", "bethesda", "silver spring", "college park", "annapolis"];
  }
  if (lc.includes("virginia") || lc === "va") {
    return ["virginia", "va", "arlington", "alexandria", "tysons", "reston"];
  }
  // For specific suburb cities (Arlington, etc.) return just that name
  return [lc];
}

// Maps confetti occasion/vibe IDs to venue_intel category values
const OCCASION_TO_CATEGORY: Record<string, string[]> = {
  date: ["date night", "restaurants", "rooftop"],
  nightlife: ["nightlife"],
  brunch: ["brunch"],
  guys: ["guys night out", "nightlife"],
  girls: ["girls night out", "brunch", "nightlife"],
  family: ["family activities", "kids educational", "theme parks"],
  adventure: ["adventure", "theme parks"],
  culture: ["restaurants", "coffee"],
  happy_hour: ["happy hour"],
  coffee: ["coffee"],
  trending: ["trending"],
};

// ── Main query function ──────────────────────────────────────────────────────

export async function fetchVenueIntelCandidates(
  city: string,
  options?: {
    occasionId?: string;
    vibeLabel?: string;
    limit?: number;
    minTrendingScore?: number;
  },
): Promise<VenueIntelCandidate[]> {
  const limit = options?.limit ?? 40;
  const minScore = options?.minTrendingScore ?? 20;

  // Build city filter: check city column against all known aliases
  const aliases = cityAliases(city);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabaseAdmin as any;

  // Category hint from occasion
  const categoryHints = options?.occasionId
    ? OCCASION_TO_CATEGORY[options.occasionId] ?? []
    : [];

  let rows: VenueIntelRow[] = [];

  // First pass: try with category filter if we have hints
  if (categoryHints.length > 0) {
    const cityFilter = aliases.map((a) => `city.ilike.%${a}%`).join(",");
    const catFilter = categoryHints.map((c) => `category.ilike.%${c}%`).join(",");

    const { data, error } = await db
      .from("venue_intel")
      .select(
        "place_id, name, category, city, neighborhood, address, latitude, longitude, " +
          "google_rating, google_review_count, yelp_rating, yelp_review_count, " +
          "tiktok_mention_count, tiktok_video_urls, tags, trending_score, is_trending, " +
          "description, curator_notes, manually_added, phone, website, image_url",
      )
      .or(cityFilter)
      .or(catFilter)
      .gte("trending_score", minScore)
      .order("trending_score", { ascending: false })
      .limit(limit);

    if (!error && data?.length >= 8) {
      rows = data;
    }
  }

  // Fallback / top-up: broad city query if category filter gave too few
  if (rows.length < 8) {
    const cityFilter = aliases.map((a) => `city.ilike.%${a}%`).join(",");

    const { data, error } = await db
      .from("venue_intel")
      .select(
        "place_id, name, category, city, neighborhood, address, latitude, longitude, " +
          "google_rating, google_review_count, yelp_rating, yelp_review_count, " +
          "tiktok_mention_count, tiktok_video_urls, tags, trending_score, is_trending, " +
          "description, curator_notes, manually_added, phone, website, image_url",
      )
      .or(cityFilter)
      .gte("trending_score", minScore)
      .order("trending_score", { ascending: false })
      .limit(limit);

    if (!error && data?.length) {
      // Merge without duplicates
      const existingIds = new Set(rows.map((r) => r.place_id));
      const topUp = (data as VenueIntelRow[]).filter((r) => !existingIds.has(r.place_id));
      rows = [...rows, ...topUp].slice(0, limit);
    }
  }

  if (!rows.length) {
    console.info("[venue-intel] no results for city=%s", city);
    return [];
  }

  return rows.map(rowToCandidate);
}

// ── Trending venues for the /discover page ───────────────────────────────────

export async function fetchTrendingVenueIntel(
  city: string,
  limit = 12,
): Promise<VenueIntelCandidate[]> {
  const aliases = cityAliases(city);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabaseAdmin as any;
  const cityFilter = aliases.map((a) => `city.ilike.%${a}%`).join(",");

  const { data, error } = await db
    .from("venue_intel")
    .select(
      "place_id, name, category, city, neighborhood, address, latitude, longitude, " +
        "google_rating, yelp_rating, tiktok_mention_count, tags, trending_score, is_trending, " +
        "description, image_url, curator_notes, manually_added, phone, website, " +
        "google_review_count, yelp_review_count, tiktok_video_urls",
    )
    .or(cityFilter)
    .eq("is_trending", true)
    .order("trending_score", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[venue-intel] fetchTrendingVenueIntel error", error);
    return [];
  }

  return (data ?? []).map(rowToCandidate);
}

// ── Manually-curated venues (Tyrone's Excel additions) ───────────────────────

export async function fetchManualVenueIntel(
  city: string,
  limit = 20,
): Promise<VenueIntelCandidate[]> {
  const aliases = cityAliases(city);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabaseAdmin as any;
  const cityFilter = aliases.map((a) => `city.ilike.%${a}%`).join(",");

  const { data, error } = await db
    .from("venue_intel")
    .select(
      "place_id, name, category, city, neighborhood, address, latitude, longitude, " +
        "google_rating, yelp_rating, tiktok_mention_count, tags, trending_score, is_trending, " +
        "description, image_url, curator_notes, manually_added, phone, website, " +
        "google_review_count, yelp_review_count, tiktok_video_urls",
    )
    .or(cityFilter)
    .eq("manually_added", true)
    .order("trending_score", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[venue-intel] fetchManualVenueIntel error", error);
    return [];
  }

  return (data ?? []).map(rowToCandidate);
}

// ── Row → CandidateVenue mapper ───────────────────────────────────────────────

function rowToCandidate(r: VenueIntelRow): VenueIntelCandidate {
  // trending_score is 0–100; normalize to 0–1 for consistency with viral_venues.trendScore
  const trendScore = r.trending_score !== null ? r.trending_score / 100 : null;

  // Best available rating: prefer Google (more reviews), fall back to Yelp
  const rating =
    r.google_rating !== null
      ? r.google_rating
      : r.yelp_rating !== null
        ? r.yelp_rating
        : null;

  // Composite summary: curator notes take priority, then description
  const summary = r.curator_notes?.trim() || r.description?.trim() || null;

  return {
    id: `intel:${r.place_id}`,
    name: r.name,
    category: r.category ?? "venue",
    neighborhood: r.neighborhood,
    rating,
    trendScore,
    mentionCount: r.tiktok_mention_count,
    tags: Array.isArray(r.tags) ? r.tags : [],
    summary,
    placeId: r.place_id,
    lat: r.latitude,
    lng: r.longitude,
    isTrending: r.is_trending ?? false,
    tiktokCount: r.tiktok_mention_count ?? 0,
    source: "venue_intel",
  };
}
