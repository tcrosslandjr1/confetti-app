/**
 * Feed Recommendations Client — calls the ai-recommend Edge Function
 * to power Trending venues, Starting soon, and Personalized picks sections.
 *
 * Usage:
 *   import { fetchFeedRecommendations } from "@/lib/agents/feed-recommendations";
 *   const feed = await fetchFeedRecommendations({ city: "Washington DC", lat: 38.9, lng: -77.0 });
 *   // feed.trending, feed.picks, feed.events, feed.surprise
 */

export interface FeedVenue {
  id: string;
  venue: string;
  category: string;
  vibe: string;
  reason: string;
  address?: string;
  neighborhood?: string;
  rating?: number;
  priceLevel?: number | null;
  photo?: string | null;
  lat?: number;
  lng?: number;
  tone: string;
  /** True when this venue was injected from an active boost_campaign. */
  sponsored?: boolean;
  /** Customer-facing label, e.g. "Partner Pick · Matches your vibe". */
  partnerLabel?: string;
  /** Which campaign drove the placement — used for click attribution. */
  boostCampaignId?: string;
}

export interface FeedEvent {
  title: string;
  venue: string;
  time: string;
  category: string;
  reason: string;
  vibe: string;
}

export interface FeedResponse {
  trending?: FeedVenue[];
  events?: FeedEvent[];
  picks?: FeedVenue[];
  surprise?: FeedVenue[];
  generated_at: string;
  model: string;
}

export interface FeedRequestOptions {
  lat?: number | null;
  lng?: number | null;
  city?: string | null;
  sections?: ("trending" | "events" | "picks" | "surprise")[];
  limit?: number;
  timeOfDay?: "morning" | "afternoon" | "evening" | "night";
}

const TIMEOUT_MS = 25_000;

/**
 * Fetch AI-powered feed recommendations from the Supabase Edge Function.
 * Falls back to empty sections on failure (the UI should handle empty state gracefully).
 */
export async function fetchFeedRecommendations(
  options: FeedRequestOptions = {},
): Promise<FeedResponse> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("your-project-ref")) {
    console.warn("[feed-recommendations] Supabase not configured, returning mock feed");
    return getMockFeed();
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/ai-recommend`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        lat: options.lat,
        lng: options.lng,
        city: options.city,
        sections: options.sections ?? ["trending", "picks", "events"],
        limit: options.limit ?? 4,
        time_of_day: options.timeOfDay ?? inferTimeOfDay(),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn(`[feed-recommendations] ${res.status}: ${body.slice(0, 200)}`);
      return getMockFeed();
    }

    return await res.json();
  } catch (err) {
    clearTimeout(timeout);
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("[feed-recommendations] failed, using mock:", msg);
    return getMockFeed();
  }
}

/**
 * Get the user's current location (or null if denied/unavailable).
 */
export function getUserLocation(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 5000, maximumAge: 300_000 },
    );
  });
}

// ─── Helpers ──────────────────────────────────────────────────

function inferTimeOfDay(): "morning" | "afternoon" | "evening" | "night" {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

function getMockFeed(): FeedResponse {
  return {
    trending: [
      {
        id: "mock-1",
        venue: "The Rooftop at Congress",
        category: "cocktail bar",
        vibe: "Sunset views",
        reason: "Trending this week — perfect for an evening vibe",
        neighborhood: "Capitol Hill",
        rating: 4.6,
        priceLevel: 3,
        photo: null,
        tone: "bg-coral",
      },
      {
        id: "mock-2",
        venue: "Dauphine's",
        category: "restaurant",
        vibe: "Southern charm",
        reason: "New opening everyone's talking about",
        neighborhood: "Shaw",
        rating: 4.5,
        priceLevel: 3,
        photo: null,
        tone: "bg-coral",
      },
      {
        id: "mock-3",
        venue: "The Mirror Room",
        category: "speakeasy",
        vibe: "Hidden gem",
        reason: "Underground cocktail spot with live jazz",
        neighborhood: "Dupont Circle",
        rating: 4.7,
        priceLevel: 3,
        photo: null,
        tone: "bg-coral",
      },
    ],
    picks: [
      {
        id: "mock-4",
        venue: "Discover your perfect spots",
        category: "onboarding",
        vibe: "Personalized",
        reason: "Complete your taste profile to get AI-powered picks just for you",
        tone: "bg-purple",
      },
    ],
    events: [
      {
        title: "Live Jazz Night",
        venue: "Blues Alley",
        time: "Tonight, 8:00 PM",
        category: "live_music",
        reason: "Top-rated live music venue near you",
        vibe: "Smooth vibes",
      },
      {
        title: "Weekend Food Market",
        venue: "Union Market",
        time: "Saturday, 10:00 AM",
        category: "food_event",
        reason: "Popular weekend experience",
        vibe: "Foodie heaven",
      },
    ],
    generated_at: new Date().toISOString(),
    model: "mock",
  };
}
