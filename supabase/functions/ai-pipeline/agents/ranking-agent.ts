// ============================================================
// Ranking Agent — Layer 3
// Queries venues from DB using filters, then scores & ranks
// using taste affinity + boost strength + trending factor
// ============================================================

import { chatCompletion } from "../../_shared/openai.ts";

interface RankedVenue {
  id: string;
  name: string;
  category: string;
  neighborhood: string;
  price_tier: string;
  vibe_tags: string[];
  cuisine_tags: string[];
  average_rating: number;
  city: string;
  address: string;
  score: number;
  score_breakdown: {
    taste_affinity: number;
    rating_score: number;
    boost_score: number;
    trending_score: number;
    recency_penalty: number;
  };
  is_boosted: boolean;
  boost_campaign_id?: string;
  coupon?: { id: string; title: string; type: string } | null;
}

export async function rankingAgent(
  filters: any,
  context: any,
  supabase: any,
): Promise<{ result: RankedVenue[]; tokens: number }> {
  // 1. Query venues matching filters
  let query = supabase
    .from("venues")
    .select("*")
    .gte("average_rating", filters.min_rating)
    .limit(100);

  if (filters.city) {
    query = query.or(`city.eq.${filters.city},neighborhood.eq.${filters.city}`);
  }

  if (filters.price_tiers?.length) {
    query = query.in("price_tier", filters.price_tiers);
  }

  if (filters.corporate_friendly) {
    query = query.eq("corporate_friendly", true);
  }

  if (filters.exclude_venue_ids?.length) {
    query = query.not("id", "in", `(${filters.exclude_venue_ids.join(",")})`);
  }

  const { data: venues, error } = await query;

  if (error || !venues?.length) {
    return { result: [], tokens: 0 };
  }

  // 2. Fetch active boosts for these venues
  const venueIds = venues.map((v: any) => v.id);
  const { data: activeBoosts } = await supabase
    .from("boost_campaigns")
    .select("venue_id, boost_strength, id")
    .eq("status", "active")
    .in("venue_id", venueIds.map(String));

  const boostMap = new Map(
    (activeBoosts || []).map((b: any) => [b.venue_id, b]),
  );

  // 3. Fetch trending scores
  const { data: trending } = await supabase
    .from("trending_venues")
    .select("venue_id, trend_score")
    .in("venue_id", venueIds)
    .gte("expires_at", new Date().toISOString());

  const trendMap = new Map(
    (trending || []).map((t: any) => [t.venue_id, t.trend_score]),
  );

  // 4. Fetch available coupons
  const { data: coupons } = await supabase
    .from("coupons")
    .select("id, venue_id, title, type")
    .eq("is_active", true)
    .in("venue_id", venueIds.map(String));

  const couponMap = new Map(
    (coupons || []).map((c: any) => [c.venue_id, c]),
  );

  // 5. Score each venue
  const userProfile = context.user_profile;
  const scored: RankedVenue[] = venues.map((v: any) => {
    // Taste affinity (0-40 points)
    let tasteAffinity = 0;
    if (userProfile) {
      const cuisineScores = userProfile.cuisine_scores || {};
      const vibeScores = userProfile.vibe_scores || {};
      const neighborhoodScores = userProfile.neighborhood_scores || {};

      // Cuisine match
      for (const tag of v.cuisine_tags || []) {
        tasteAffinity += (cuisineScores[tag] || 0) * 10;
      }
      // Vibe match
      for (const tag of v.vibe_tags || []) {
        tasteAffinity += (vibeScores[tag] || 0) * 8;
      }
      // Neighborhood match
      tasteAffinity += (neighborhoodScores[v.neighborhood] || 0) * 5;

      tasteAffinity = Math.min(tasteAffinity, 40);
    }

    // Rating score (0-25 points)
    const ratingScore = (v.average_rating / 5) * 25;

    // Boost score (0-20 points)
    const boost = boostMap.get(String(v.id));
    const boostScore = boost ? (boost as any).boost_strength * 2 : 0;

    // Trending score (0-15 points)
    const trendScore = Math.min((trendMap.get(v.id) || 0) / 10, 15);

    // Recency penalty for recently visited
    const recencyPenalty = context.recent_venues?.includes(v.id) ? -15 : 0;

    const totalScore = tasteAffinity + ratingScore + boostScore + trendScore + recencyPenalty;

    const coupon = couponMap.get(String(v.id));

    return {
      id: v.id,
      name: v.name,
      category: v.category,
      neighborhood: v.neighborhood,
      price_tier: v.price_tier,
      vibe_tags: v.vibe_tags || [],
      cuisine_tags: v.cuisine_tags || [],
      average_rating: v.average_rating,
      city: v.city || "",
      address: v.address || "",
      score: totalScore,
      score_breakdown: {
        taste_affinity: tasteAffinity,
        rating_score: ratingScore,
        boost_score: boostScore,
        trending_score: trendScore,
        recency_penalty: recencyPenalty,
      },
      is_boosted: !!boost,
      boost_campaign_id: boost ? (boost as any).id : undefined,
      coupon: coupon ? { id: (coupon as any).id, title: (coupon as any).title, type: (coupon as any).type } : null,
    };
  });

  // 6. Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Return top 20
  return { result: scored.slice(0, 20), tokens: 0 };
}
