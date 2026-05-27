/**
 * User Intelligence Agent
 * Learns user preferences through implicit behavior tracking and explicit signals.
 * Builds and evolves taste profiles used by venue discovery and chat agents.
 *
 * Implicit signals: venue views, skips, favorites, bookings, completions,
 *   revisits, swipe patterns, dwell time, search queries, filter usage
 * Explicit signals: onboarding preferences, ratings, manual favorites
 */

import { supabase } from "../supabase";

// ─── Types ─────────────────────────────────────────────────────

export type BehaviorEventType =
  | "venue_view"
  | "venue_skip"
  | "venue_favorite"
  | "venue_unfavorite"
  | "venue_book"
  | "venue_complete"
  | "venue_rate"
  | "venue_revisit"
  | "confetti_create"
  | "confetti_complete"
  | "confetti_abandon"
  | "chat_query"
  | "chip_tap"
  | "category_browse"
  | "search_query"
  | "filter_apply"
  | "card_swipe_right"
  | "card_swipe_left";

export interface BehaviorEvent {
  eventType: BehaviorEventType;
  venueId?: string;
  itineraryId?: string;
  metadata?: Record<string, unknown>;
}

export interface TasteProfile {
  userId: string;
  cuisineScores: Record<string, number>;
  vibeScores: Record<string, number>;
  pricePreference: string;
  timePatterns: Record<string, number>;
  neighborhoodScores: Record<string, number>;
  occasionScores: Record<string, number>;
  adventureScore: number;
  socialScore: number;
  eventCount: number;
  lastComputedAt: string;
}

export interface UserContext {
  tasteProfile: TasteProfile;
  recentBehavior: BehaviorEvent[];
  topCuisines: string[];
  topVibes: string[];
  preferredPrice: string;
  adventureLevel: "comfort" | "balanced" | "adventurous";
  socialStyle: "solo" | "balanced" | "social";
  activeTimeSlots: string[];
}

// ─── Signal weights (how much each event affects preferences) ──

const SIGNAL_WEIGHTS: Record<BehaviorEventType, number> = {
  venue_view: 0.05,
  venue_skip: -0.08,
  venue_favorite: 0.25,
  venue_unfavorite: -0.20,
  venue_book: 0.35,
  venue_complete: 0.40,
  venue_rate: 0.30,     // weight modified by actual rating
  venue_revisit: 0.50,  // strongest positive signal
  confetti_create: 0.10,
  confetti_complete: 0.20,
  confetti_abandon: -0.05,
  chat_query: 0.02,
  chip_tap: 0.08,
  category_browse: 0.06,
  search_query: 0.03,
  filter_apply: 0.10,
  card_swipe_right: 0.15,
  card_swipe_left: -0.10,
};

// Decay factor: older events matter less (per day)
const DECAY_RATE = 0.97;

// ─── Track behavior event ──────────────────────────────────────

export async function trackBehavior(
  userId: string,
  event: BehaviorEvent
): Promise<void> {
  const { error } = await supabase.from("user_behavior_events").insert({
    user_id: userId,
    event_type: event.eventType,
    venue_id: event.venueId ?? null,
    itinerary_id: event.itineraryId ?? null,
    metadata: event.metadata ?? {},
  });

  if (error) {
    console.warn("[User Intelligence] Failed to track event:", error.message);
    return;
  }

  // Trigger incremental profile update for high-signal events
  const highSignalEvents: BehaviorEventType[] = [
    "venue_favorite",
    "venue_book",
    "venue_complete",
    "venue_rate",
    "venue_revisit",
    "card_swipe_right",
    "card_swipe_left",
  ];

  if (highSignalEvents.includes(event.eventType)) {
    await updateTasteProfileIncremental(userId, event);
  }
}

// ─── Track behavior (mock mode — no Supabase) ──────────────────

const mockEvents: BehaviorEvent[] = [];
let mockProfile: TasteProfile | null = null;

export function trackBehaviorLocal(event: BehaviorEvent): void {
  mockEvents.push(event);
}

// ─── Get or initialize taste profile ───────────────────────────

export async function getTasteProfile(userId: string): Promise<TasteProfile> {
  const { data, error } = await supabase
    .from("taste_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    // Create default profile
    const defaultProfile = createDefaultProfile(userId);
    await supabase.from("taste_profiles").upsert({
      user_id: userId,
      cuisine_scores: defaultProfile.cuisineScores,
      vibe_scores: defaultProfile.vibeScores,
      price_preference: defaultProfile.pricePreference,
      time_patterns: defaultProfile.timePatterns,
      neighborhood_scores: defaultProfile.neighborhoodScores,
      occasion_scores: defaultProfile.occasionScores,
      adventure_score: defaultProfile.adventureScore,
      social_score: defaultProfile.socialScore,
      event_count: 0,
    });
    return defaultProfile;
  }

  return {
    userId,
    cuisineScores: data.cuisine_scores ?? {},
    vibeScores: data.vibe_scores ?? {},
    pricePreference: data.price_preference ?? "$$",
    timePatterns: data.time_patterns ?? {},
    neighborhoodScores: data.neighborhood_scores ?? {},
    occasionScores: data.occasion_scores ?? {},
    adventureScore: data.adventure_score ?? 0.5,
    socialScore: data.social_score ?? 0.5,
    eventCount: data.event_count ?? 0,
    lastComputedAt: data.last_computed_at,
  };
}

// ─── Get taste profile (mock mode) ─────────────────────────────

export function getTasteProfileLocal(): TasteProfile {
  if (mockProfile) return mockProfile;

  mockProfile = createDefaultProfile("mock-user");

  // Simulate a user who has some preferences built up
  mockProfile.cuisineScores = {
    Japanese: 0.88,
    Italian: 0.82,
    Mexican: 0.75,
    American: 0.70,
    Thai: 0.65,
    Ethiopian: 0.60,
    French: 0.55,
    Korean: 0.72,
  };
  mockProfile.vibeScores = {
    Rooftop: 0.92,
    Speakeasy: 0.85,
    "Live Music": 0.78,
    Cozy: 0.70,
    Upscale: 0.65,
    Casual: 0.60,
    "Late Night": 0.80,
    "Family Friendly": 0.45,
  };
  mockProfile.pricePreference = "$$$";
  mockProfile.timePatterns = {
    brunch: 0.55,
    lunch: 0.40,
    dinner: 0.92,
    late_night: 0.80,
    happy_hour: 0.75,
  };
  mockProfile.occasionScores = {
    date_night: 0.90,
    friends: 0.85,
    solo: 0.50,
    family: 0.40,
    celebration: 0.70,
    business: 0.35,
  };
  mockProfile.adventureScore = 0.72;
  mockProfile.socialScore = 0.68;
  mockProfile.eventCount = 47;

  return mockProfile;
}

// ─── Build full user context for other agents ──────────────────

export async function getUserContext(userId: string): Promise<UserContext> {
  const profile = await getTasteProfile(userId);
  const recentBehavior = await getRecentBehavior(userId, 50);

  return buildUserContext(profile, recentBehavior);
}

export function getUserContextLocal(): UserContext {
  const profile = getTasteProfileLocal();
  return buildUserContext(profile, mockEvents.slice(-50));
}

function buildUserContext(
  profile: TasteProfile,
  recentBehavior: BehaviorEvent[]
): UserContext {
  // Extract top cuisines (sorted by score, top 5)
  const topCuisines = Object.entries(profile.cuisineScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([cuisine]) => cuisine);

  // Extract top vibes
  const topVibes = Object.entries(profile.vibeScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([vibe]) => vibe);

  // Determine adventure level
  const adventureLevel: UserContext["adventureLevel"] =
    profile.adventureScore > 0.66
      ? "adventurous"
      : profile.adventureScore > 0.33
      ? "balanced"
      : "comfort";

  // Determine social style
  const socialStyle: UserContext["socialStyle"] =
    profile.socialScore > 0.66
      ? "social"
      : profile.socialScore > 0.33
      ? "balanced"
      : "solo";

  // Active time slots
  const activeTimeSlots = Object.entries(profile.timePatterns)
    .filter(([, score]) => score > 0.5)
    .sort(([, a], [, b]) => b - a)
    .map(([slot]) => slot);

  return {
    tasteProfile: profile,
    recentBehavior,
    topCuisines,
    topVibes,
    preferredPrice: profile.pricePreference,
    adventureLevel,
    socialStyle,
    activeTimeSlots,
  };
}

// ─── Get recent behavior events ────────────────────────────────

async function getRecentBehavior(
  userId: string,
  limit: number
): Promise<BehaviorEvent[]> {
  const { data, error } = await supabase
    .from("user_behavior_events")
    .select("event_type, venue_id, itinerary_id, metadata")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((row: {
    event_type: string;
    venue_id?: string | null;
    itinerary_id?: string | null;
    metadata?: Record<string, unknown> | null;
  }) => ({
    eventType: row.event_type as BehaviorEventType,
    venueId: row.venue_id ?? undefined,
    itineraryId: row.itinerary_id ?? undefined,
    metadata: row.metadata ?? {},
  }));
}

// ─── Incremental profile update ────────────────────────────────

async function updateTasteProfileIncremental(
  userId: string,
  event: BehaviorEvent
): Promise<void> {
  const profile = await getTasteProfile(userId);
  const weight = SIGNAL_WEIGHTS[event.eventType];

  // If rating event, adjust weight by rating value (1-5 scale normalized)
  let adjustedWeight = weight;
  if (event.eventType === "venue_rate" && event.metadata?.rating) {
    const rating = Number(event.metadata.rating);
    // Rating 3 = neutral, 5 = strong positive, 1 = strong negative
    adjustedWeight = weight * ((rating - 3) / 2);
  }

  // Get venue details to know which attributes to update
  const venueAttributes = await getVenueAttributes(event.venueId);

  if (venueAttributes) {
    // Update cuisine scores
    for (const cuisine of venueAttributes.cuisineTags) {
      const current = profile.cuisineScores[cuisine] ?? 0.5;
      profile.cuisineScores[cuisine] = clamp(current + adjustedWeight, 0, 1);
    }

    // Update vibe scores
    for (const vibe of venueAttributes.vibeTags) {
      const current = profile.vibeScores[vibe] ?? 0.5;
      profile.vibeScores[vibe] = clamp(current + adjustedWeight, 0, 1);
    }

    // Update price preference from venue price level
    if (venueAttributes.priceLevel && adjustedWeight > 0) {
      profile.pricePreference = venueAttributes.priceLevel;
    }

    // Update neighborhood scores
    if (venueAttributes.neighborhood) {
      const current = profile.neighborhoodScores[venueAttributes.neighborhood] ?? 0.5;
      profile.neighborhoodScores[venueAttributes.neighborhood] = clamp(
        current + adjustedWeight,
        0,
        1
      );
    }
  }

  // Update occasion scores from event metadata
  if (event.metadata?.occasion) {
    const occasion = String(event.metadata.occasion);
    const current = profile.occasionScores[occasion] ?? 0.5;
    profile.occasionScores[occasion] = clamp(current + adjustedWeight * 0.5, 0, 1);
  }

  // Update time patterns from event metadata
  if (event.metadata?.timeSlot) {
    const slot = String(event.metadata.timeSlot);
    const current = profile.timePatterns[slot] ?? 0.5;
    profile.timePatterns[slot] = clamp(current + adjustedWeight * 0.3, 0, 1);
  }

  // Update adventure score: revisits decrease it, new venues increase it
  if (event.eventType === "venue_revisit") {
    profile.adventureScore = clamp(profile.adventureScore - 0.02, 0, 1);
  } else if (
    event.eventType === "venue_book" ||
    event.eventType === "venue_complete"
  ) {
    // Check if this is a new venue for the user
    const isNew = event.metadata?.isFirstVisit !== false;
    if (isNew) {
      profile.adventureScore = clamp(profile.adventureScore + 0.01, 0, 1);
    }
  }

  // Update social score from party size
  if (event.metadata?.partySize) {
    const size = Number(event.metadata.partySize);
    if (size === 1) {
      profile.socialScore = clamp(profile.socialScore - 0.02, 0, 1);
    } else if (size >= 4) {
      profile.socialScore = clamp(profile.socialScore + 0.02, 0, 1);
    }
  }

  // Save updated profile
  await supabase
    .from("taste_profiles")
    .upsert({
      user_id: userId,
      cuisine_scores: profile.cuisineScores,
      vibe_scores: profile.vibeScores,
      price_preference: profile.pricePreference,
      time_patterns: profile.timePatterns,
      neighborhood_scores: profile.neighborhoodScores,
      occasion_scores: profile.occasionScores,
      adventure_score: profile.adventureScore,
      social_score: profile.socialScore,
      event_count: profile.eventCount + 1,
      last_computed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
}

// ─── Full profile recomputation ────────────────────────────────

export async function recomputeTasteProfile(userId: string): Promise<TasteProfile> {
  // Get all behavior events for this user
  const { data: events, error } = await supabase
    .from("user_behavior_events")
    .select("event_type, venue_id, metadata, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error || !events || events.length === 0) {
    return createDefaultProfile(userId);
  }

  const profile = createDefaultProfile(userId);
  const now = Date.now();

  for (const event of events) {
    const eventAge = (now - new Date(event.created_at).getTime()) / (1000 * 60 * 60 * 24);
    const decayFactor = Math.pow(DECAY_RATE, eventAge);
    const baseWeight = SIGNAL_WEIGHTS[event.event_type as BehaviorEventType] ?? 0;

    let weight = baseWeight * decayFactor;

    if (event.event_type === "venue_rate" && event.metadata?.rating) {
      const rating = Number(event.metadata.rating);
      weight = baseWeight * ((rating - 3) / 2) * decayFactor;
    }

    const venueAttributes = await getVenueAttributes(event.venue_id);

    if (venueAttributes) {
      for (const cuisine of venueAttributes.cuisineTags) {
        const current = profile.cuisineScores[cuisine] ?? 0.5;
        profile.cuisineScores[cuisine] = clamp(current + weight, 0, 1);
      }
      for (const vibe of venueAttributes.vibeTags) {
        const current = profile.vibeScores[vibe] ?? 0.5;
        profile.vibeScores[vibe] = clamp(current + weight, 0, 1);
      }
      if (venueAttributes.priceLevel && weight > 0) {
        profile.pricePreference = venueAttributes.priceLevel;
      }
      if (venueAttributes.neighborhood) {
        const current = profile.neighborhoodScores[venueAttributes.neighborhood] ?? 0.5;
        profile.neighborhoodScores[venueAttributes.neighborhood] = clamp(current + weight, 0, 1);
      }
    }

    if (event.metadata?.occasion) {
      const occasion = String(event.metadata.occasion);
      const current = profile.occasionScores[occasion] ?? 0.5;
      profile.occasionScores[occasion] = clamp(current + weight * 0.5, 0, 1);
    }

    if (event.metadata?.timeSlot) {
      const slot = String(event.metadata.timeSlot);
      const current = profile.timePatterns[slot] ?? 0.5;
      profile.timePatterns[slot] = clamp(current + weight * 0.3, 0, 1);
    }
  }

  profile.eventCount = events.length;
  profile.lastComputedAt = new Date().toISOString();

  // Save recomputed profile
  await supabase.from("taste_profiles").upsert({
    user_id: userId,
    cuisine_scores: profile.cuisineScores,
    vibe_scores: profile.vibeScores,
    price_preference: profile.pricePreference,
    time_patterns: profile.timePatterns,
    neighborhood_scores: profile.neighborhoodScores,
    occasion_scores: profile.occasionScores,
    adventure_score: profile.adventureScore,
    social_score: profile.socialScore,
    event_count: profile.eventCount,
    last_computed_at: profile.lastComputedAt,
    updated_at: new Date().toISOString(),
  });

  return profile;
}

// ─── Apply onboarding preferences (explicit signal) ────────────

export async function applyOnboardingPreferences(
  userId: string,
  preferences: {
    cuisines?: string[];
    vibes?: string[];
    priceLevel?: string;
    occasions?: string[];
    adventureLevel?: "low" | "medium" | "high";
    diningStyle?: "solo" | "social" | "mixed";
  }
): Promise<TasteProfile> {
  const profile = await getTasteProfile(userId);

  // Apply explicit cuisine preferences with strong weight
  if (preferences.cuisines) {
    for (const cuisine of preferences.cuisines) {
      profile.cuisineScores[cuisine] = clamp(
        (profile.cuisineScores[cuisine] ?? 0.5) + 0.30,
        0,
        1
      );
    }
  }

  // Apply explicit vibe preferences
  if (preferences.vibes) {
    for (const vibe of preferences.vibes) {
      profile.vibeScores[vibe] = clamp(
        (profile.vibeScores[vibe] ?? 0.5) + 0.30,
        0,
        1
      );
    }
  }

  // Set price preference
  if (preferences.priceLevel) {
    profile.pricePreference = preferences.priceLevel;
  }

  // Apply occasion preferences
  if (preferences.occasions) {
    for (const occasion of preferences.occasions) {
      profile.occasionScores[occasion] = clamp(
        (profile.occasionScores[occasion] ?? 0.5) + 0.30,
        0,
        1
      );
    }
  }

  // Set adventure score
  if (preferences.adventureLevel) {
    profile.adventureScore =
      preferences.adventureLevel === "high"
        ? 0.80
        : preferences.adventureLevel === "medium"
        ? 0.50
        : 0.20;
  }

  // Set social score
  if (preferences.diningStyle) {
    profile.socialScore =
      preferences.diningStyle === "social"
        ? 0.80
        : preferences.diningStyle === "mixed"
        ? 0.50
        : 0.20;
  }

  // Save
  await supabase.from("taste_profiles").upsert({
    user_id: userId,
    cuisine_scores: profile.cuisineScores,
    vibe_scores: profile.vibeScores,
    price_preference: profile.pricePreference,
    time_patterns: profile.timePatterns,
    neighborhood_scores: profile.neighborhoodScores,
    occasion_scores: profile.occasionScores,
    adventure_score: profile.adventureScore,
    social_score: profile.socialScore,
    event_count: profile.eventCount,
    last_computed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  return profile;
}

// ─── Generate AI prompt context from taste profile ─────────────

export function generateProfilePrompt(context: UserContext): string {
  const lines: string[] = [
    "## User Taste Profile",
    "",
  ];

  if (context.topCuisines.length > 0) {
    lines.push(`Favorite cuisines: ${context.topCuisines.join(", ")}`);
  }
  if (context.topVibes.length > 0) {
    lines.push(`Favorite vibes: ${context.topVibes.join(", ")}`);
  }
  lines.push(`Price comfort zone: ${context.preferredPrice}`);
  lines.push(`Adventure level: ${context.adventureLevel}`);
  lines.push(`Social style: ${context.socialStyle}`);

  if (context.activeTimeSlots.length > 0) {
    lines.push(`Active times: ${context.activeTimeSlots.join(", ")}`);
  }

  const profileStrength = context.tasteProfile.eventCount;
  if (profileStrength < 5) {
    lines.push("");
    lines.push(
      "Note: This user is new — ask about preferences and offer diverse options to learn their taste."
    );
  } else if (profileStrength < 20) {
    lines.push("");
    lines.push(
      "Note: This user has some history — blend familiar favorites with new discoveries."
    );
  } else {
    lines.push("");
    lines.push(
      "Note: This is an experienced user — you know their taste well. Surprise them occasionally with aligned discoveries."
    );
  }

  return lines.join("\n");
}

// ─── Helpers ───────────────────────────────────────────────────

function createDefaultProfile(userId: string): TasteProfile {
  return {
    userId,
    cuisineScores: {},
    vibeScores: {},
    pricePreference: "$$",
    timePatterns: {},
    neighborhoodScores: {},
    occasionScores: {},
    adventureScore: 0.5,
    socialScore: 0.5,
    eventCount: 0,
    lastComputedAt: new Date().toISOString(),
  };
}

async function getVenueAttributes(
  venueId: string | null | undefined
): Promise<{
  cuisineTags: string[];
  vibeTags: string[];
  priceLevel: string | null;
  neighborhood: string | null;
} | null> {
  if (!venueId) return null;

  // Try venue_cache first (new table)
  const { data: cached } = await supabase
    .from("venue_cache")
    .select("cuisine_tags, vibe_tags, price_level, city")
    .eq("id", venueId)
    .single();

  if (cached) {
    return {
      cuisineTags: cached.cuisine_tags ?? [],
      vibeTags: cached.vibe_tags ?? [],
      priceLevel: cached.price_level,
      neighborhood: cached.city,
    };
  }

  // Fall back to venues table (original schema)
  const { data: venue } = await supabase
    .from("venues")
    .select("category, vibe, price_level, neighborhood")
    .eq("id", venueId)
    .single();

  if (venue) {
    return {
      cuisineTags: venue.category ? [venue.category] : [],
      vibeTags: venue.vibe ? [venue.vibe] : [],
      priceLevel: venue.price_level,
      neighborhood: venue.neighborhood,
    };
  }

  return null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
