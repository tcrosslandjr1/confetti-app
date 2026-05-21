// ============================================================
// Plan Generator Agent — Layer 4
// Takes ranked venues → builds a themed itinerary with
// boarding pass format, twist moments, and timing
// ============================================================

import { chatCompletion } from "../../_shared/openai.ts";

export async function planGeneratorAgent(
  rankedVenues: any[],
  context: any,
  request: any,
): Promise<{ result: any; tokens: number }> {
  if (!rankedVenues.length) {
    return {
      result: {
        title: "No venues found",
        stops: [],
        theme: "none",
        twist: null,
      },
      tokens: 0,
    };
  }

  // Build venue summaries for GPT
  const venueSummaries = rankedVenues.slice(0, 12).map((v, i) => ({
    rank: i + 1,
    name: v.name,
    category: v.category,
    neighborhood: v.neighborhood,
    price: v.price_tier,
    vibes: v.vibe_tags.join(", "),
    cuisines: v.cuisine_tags.join(", "),
    rating: v.average_rating,
    is_boosted: v.is_boosted,
    has_coupon: !!v.coupon,
    coupon_title: v.coupon?.title || null,
  }));

  const { content, usage } = await chatCompletion([
    {
      role: "system",
      content: `You are the Plan Generator for Confetti, a premium AI dining and nightlife concierge.

Build a themed itinerary in Confetti's signature "boarding pass" format.

RULES:
1. Select 2-4 stops from the ranked venues
2. Give the plan a creative, evocative title (e.g., "Midnight Velvet", "Golden Hour Drift")
3. Assign a theme that ties the stops together
4. Include a "twist moment" — one unexpected element:
   - A hidden speakeasy entrance
   - A chef's off-menu dish to request
   - A scenic walk between stops
   - A rooftop with a secret view
   - A dessert spot locals swear by
5. Add timing for each stop (arrival, duration)
6. If a venue has a coupon, mention it as a "Confetti Perk"
7. Keep the tone aspirational but warm — like a stylish friend who knows the city

Return JSON:
{
  "title": "...",
  "theme": "...",
  "mood_emoji": "...",
  "total_duration_hours": number,
  "stops": [
    {
      "order": 1,
      "venue_rank": number (from input),
      "venue_name": "...",
      "role": "opener|main|nightcap|twist",
      "arrival_time": "7:30 PM",
      "duration_minutes": 90,
      "why": "one-line reason this stop fits",
      "insider_tip": "...",
      "confetti_perk": "..." or null
    }
  ],
  "twist": {
    "description": "...",
    "between_stops": [1, 2] or null,
    "type": "speakeasy|off_menu|scenic_walk|secret_view|local_gem"
  },
  "vibe_summary": "One sentence capturing the night's energy"
}`,
    },
    {
      role: "user",
      content: `User query: "${request.query}"
Occasion: ${context.query_intent.occasion}
Mood: ${context.query_intent.mood}
Party size: ${context.query_intent.party_size}
Budget: ${context.query_intent.budget}
Time: ${context.time_context.time_of_day} on ${context.time_context.day_of_week}
City: ${context.location.city}

Ranked venues:
${JSON.stringify(venueSummaries, null, 2)}`,
    },
  ], {
    temperature: 0.8,
    max_tokens: 1500,
    response_format: { type: "json_object" },
  });

  const plan = JSON.parse(content);

  // Enrich plan with full venue data
  plan.stops = plan.stops.map((stop: any) => {
    const venue = rankedVenues.find((v) => v.name === stop.venue_name)
      || rankedVenues[stop.venue_rank - 1];
    return {
      ...stop,
      venue_id: venue?.id,
      venue_data: venue ? {
        address: venue.address,
        neighborhood: venue.neighborhood,
        price_tier: venue.price_tier,
        rating: venue.average_rating,
        vibe_tags: venue.vibe_tags,
        is_boosted: venue.is_boosted,
      } : null,
    };
  });

  return { result: plan, tokens: usage.total_tokens };
}
