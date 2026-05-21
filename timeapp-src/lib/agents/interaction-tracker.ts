/**
 * Interaction Tracker
 *
 * Records user behavior events to user_behavior_events table.
 * These signals feed the Taste Agent — the AI learns what users
 * like and dislike over time based on their actual choices.
 *
 * Every view, skip, favorite, booking, and rating gets tracked
 * so the recommendation engine gets smarter with every interaction.
 */

export type InteractionEvent =
  | "venue_view"        // user opened a venue card / detail page
  | "venue_skip"        // user swiped away / scrolled past
  | "venue_favorite"    // user saved to favorites
  | "venue_unfavorite"  // user removed from favorites
  | "venue_book"        // user made a reservation
  | "venue_complete"    // user visited the venue (check-in / stamp)
  | "venue_rate"        // user left a rating/review
  | "venue_revisit"     // user booked a place they've been before
  | "confetti_create"   // user created an itinerary
  | "confetti_complete" // user completed an itinerary
  | "confetti_abandon"  // user abandoned an itinerary
  | "chat_query"        // user sent a message to the AI
  | "chip_tap"          // user tapped a suggestion chip
  | "category_browse"   // user browsed a category (e.g., "Rooftop Bars")
  | "search_query"      // user typed a search
  | "filter_apply"      // user applied filters
  | "card_swipe_right"  // positive signal (Tinder-style)
  | "card_swipe_left";  // negative signal

export interface TrackInteractionParams {
  userId: string;
  eventType: InteractionEvent;
  venueId?: string;         // venue_cache ID or venues ID
  itineraryId?: string;
  metadata?: Record<string, unknown>; // extra context: query text, dwell time, etc.
}

interface TrackerConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

function getTrackerConfig(): TrackerConfig | null {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return { supabaseUrl: url, supabaseAnonKey: key };
}

/**
 * Track a user interaction event.
 * Fire-and-forget — never blocks the UI. Errors are swallowed.
 */
export function trackInteraction(params: TrackInteractionParams): void {
  const config = getTrackerConfig();
  if (!config) return;

  const body = {
    user_id: params.userId,
    event_type: params.eventType,
    venue_id: params.venueId ?? null,
    itinerary_id: params.itineraryId ?? null,
    metadata: params.metadata ?? {},
  };

  // Fire-and-forget POST to Supabase REST API
  fetch(`${config.supabaseUrl}/rest/v1/user_behavior_events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.supabaseAnonKey}`,
      apikey: config.supabaseAnonKey,
      Prefer: "return=minimal",
    },
    body: JSON.stringify(body),
  }).catch((err) => {
    console.warn("[Confetti] Failed to track interaction:", err);
  });
}

/**
 * Track venue view with dwell time.
 * Call startViewTimer() when user opens a card,
 * call the returned function when they close it.
 */
export function startViewTimer(
  userId: string,
  venueId: string
): () => void {
  const startedAt = Date.now();

  return () => {
    const dwellMs = Date.now() - startedAt;
    trackInteraction({
      userId,
      eventType: "venue_view",
      venueId,
      metadata: { dwell_time_ms: dwellMs },
    });
  };
}

/**
 * Batch track: when user sees a list of venues,
 * track which ones they DON'T interact with as implicit skips.
 */
export function trackImplicitSkips(
  userId: string,
  shownVenueIds: string[],
  interactedVenueIds: string[]
): void {
  const skipped = shownVenueIds.filter(
    (id) => !interactedVenueIds.includes(id)
  );
  for (const venueId of skipped) {
    trackInteraction({
      userId,
      eventType: "venue_skip",
      venueId,
    });
  }
}
