// ============================================================
// Filter Rules Agent — Layer 2
// Translates context into hard database filters:
//   city, price_tier, cuisine, vibes, categories, hours
// ============================================================

export interface FilterSet {
  city: string;
  price_tiers: string[];
  cuisine_tags: string[];
  vibe_tags: string[];
  categories: string[];
  exclude_venue_ids: string[];
  min_rating: number;
  open_now: boolean;
  corporate_friendly: boolean;
  max_distance_miles: number;
  location: { lat: number; lng: number };
}

export async function filterRulesAgent(
  context: any,
  request: any,
): Promise<{ result: FilterSet; tokens: number }> {
  const { query_intent, user_profile, location, time_context, recent_venues } = context;

  // Price tier mapping
  const budgetMap: Record<string, string[]> = {
    $: ["$"],
    $$: ["$", "$$"],
    $$$: ["$", "$$", "$$$"],
    $$$$: ["$", "$$", "$$$", "$$$$"],
  };

  // Extract top cuisines from taste profile
  const topCuisines = user_profile?.cuisine_scores
    ? Object.entries(user_profile.cuisine_scores as Record<string, number>)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([k]) => k)
    : [];

  // Extract top vibes
  const topVibes = user_profile?.vibe_scores
    ? Object.entries(user_profile.vibe_scores as Record<string, number>)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([k]) => k)
    : [];

  // Map occasion to categories
  const occasionCategoryMap: Record<string, string[]> = {
    date_night: ["restaurant", "lounge", "rooftop", "wine_bar"],
    group_outing: ["restaurant", "bar", "bowling", "karaoke", "arcade"],
    solo: ["cafe", "restaurant", "bar", "bookstore_cafe"],
    family: ["restaurant", "family_dining", "pizza", "ice_cream"],
    celebration: ["restaurant", "lounge", "club", "rooftop", "private_dining"],
    business: ["restaurant", "steakhouse", "private_dining", "wine_bar"],
    casual: ["restaurant", "cafe", "fast_casual", "food_hall"],
  };

  // Min rating based on budget
  const minRating = query_intent.budget === "$$$$" ? 4.0
    : query_intent.budget === "$$$" ? 3.5
    : 3.0;

  const filters: FilterSet = {
    city: location.city,
    price_tiers: budgetMap[query_intent.budget] || ["$", "$$"],
    cuisine_tags: topCuisines,
    vibe_tags: topVibes,
    categories: occasionCategoryMap[query_intent.occasion] || ["restaurant"],
    exclude_venue_ids: recent_venues || [],
    min_rating: minRating,
    open_now: true,
    corporate_friendly: !!request.corporate,
    max_distance_miles: query_intent.occasion === "casual" ? 3 : 10,
    location: { lat: location.lat, lng: location.lng },
  };

  // No LLM call needed — pure rules engine
  return { result: filters, tokens: 0 };
}
