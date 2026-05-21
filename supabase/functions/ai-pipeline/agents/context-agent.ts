// ============================================================
// Context Agent — Layer 1 of the Confetti AI Pipeline
// Gathers: user taste profile, location, time context,
//          recent behavior, group preferences, weather
// ============================================================

import { chatCompletion } from "../../_shared/openai.ts";

interface ContextResult {
  user_profile: {
    cuisine_scores: Record<string, number>;
    vibe_scores: Record<string, number>;
    price_preference: string;
    time_patterns: Record<string, number>;
    neighborhood_scores: Record<string, number>;
    occasion_scores: Record<string, number>;
    adventure_score: number;
    social_score: number;
  } | null;
  location: { lat: number; lng: number; city: string };
  time_context: {
    day_of_week: string;
    time_of_day: string;
    meal_period: string;
    is_weekend: boolean;
  };
  recent_venues: string[];
  query_intent: {
    occasion: string;
    mood: string;
    party_size: number;
    budget: string;
    specific_requests: string[];
  };
}

export async function contextAgent(
  userId: string,
  request: {
    query: string;
    location?: { lat: number; lng: number; city?: string };
    occasion?: string;
    party_size?: number;
    budget?: string;
    mood?: string;
  },
  supabase: any,
): Promise<{ result: ContextResult; tokens: number }> {
  // 1. Fetch taste profile
  const { data: taste } = await supabase
    .from("taste_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  // 2. Fetch recent behavior (last 50 events)
  const { data: recentBehavior } = await supabase
    .from("user_behavior_events")
    .select("event_type, venue_id, metadata, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  // 3. Compute time context
  const now = new Date();
  const hour = now.getHours();
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const dayOfWeek = dayNames[now.getDay()];
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;

  let mealPeriod = "late_night";
  if (hour >= 6 && hour < 11) mealPeriod = "breakfast";
  else if (hour >= 11 && hour < 14) mealPeriod = "lunch";
  else if (hour >= 14 && hour < 17) mealPeriod = "afternoon";
  else if (hour >= 17 && hour < 21) mealPeriod = "dinner";
  else if (hour >= 21 && hour < 24) mealPeriod = "late_night";

  let timeOfDay = "night";
  if (hour >= 6 && hour < 12) timeOfDay = "morning";
  else if (hour >= 12 && hour < 17) timeOfDay = "afternoon";
  else if (hour >= 17 && hour < 21) timeOfDay = "evening";

  // 4. Use GPT to parse query intent
  const { content, usage } = await chatCompletion([
    {
      role: "system",
      content: `You are the Context Agent for Confetti, an AI dining/nightlife concierge.
Parse the user's query and extract structured intent. Return JSON only.
{
  "occasion": "date_night|group_outing|solo|family|celebration|business|casual",
  "mood": "adventurous|chill|romantic|energetic|sophisticated|fun|cozy",
  "party_size": number,
  "budget": "$|$$|$$$|$$$$",
  "specific_requests": ["array of specific things mentioned"]
}`,
    },
    {
      role: "user",
      content: `Query: "${request.query}"
Additional context: occasion=${request.occasion || "not specified"}, party_size=${request.party_size || "not specified"}, budget=${request.budget || "not specified"}, mood=${request.mood || "not specified"}`,
    },
  ], { temperature: 0.3, response_format: { type: "json_object" } });

  const queryIntent = JSON.parse(content);

  // 5. Get recently visited venue IDs to avoid repeats
  const recentVenueIds = (recentBehavior || [])
    .filter((e: any) => e.venue_id && ["venue_book", "venue_complete"].includes(e.event_type))
    .map((e: any) => e.venue_id)
    .slice(0, 10);

  const result: ContextResult = {
    user_profile: taste || null,
    location: {
      lat: request.location?.lat || 38.9072,
      lng: request.location?.lng || -77.0369,
      city: request.location?.city || "Washington DC",
    },
    time_context: {
      day_of_week: dayOfWeek,
      time_of_day: timeOfDay,
      meal_period: mealPeriod,
      is_weekend: isWeekend,
    },
    recent_venues: recentVenueIds,
    query_intent: {
      occasion: queryIntent.occasion || request.occasion || "casual",
      mood: queryIntent.mood || request.mood || "fun",
      party_size: queryIntent.party_size || request.party_size || 2,
      budget: queryIntent.budget || request.budget || "$$",
      specific_requests: queryIntent.specific_requests || [],
    },
  };

  return { result, tokens: usage.total_tokens };
}
