/**
 * Confetti AI Chat Agent
 * The main conversational orchestrator that ties together:
 *   - Multi-provider AI engine (OpenAI → Anthropic → Supabase → Mock)
 *   - User intelligence (taste profiles, behavior tracking)
 *   - Venue discovery (Google Places + Foursquare)
 *   - Trip planning (multi-state corridor search)
 *
 * Maintains conversation context and session state.
 * Detects intent from user messages and routes to the right sub-agent.
 */

import { chat, getAIConfig, getAvailableProviders } from "./ai-provider";
import type { AIMessage, AIResponse } from "./ai-provider";
import {
  getUserContext,
  getUserContextLocal,
  generateProfilePrompt,
  trackBehavior,
  trackBehaviorLocal,
} from "./user-intelligence";
import type { UserContext } from "./user-intelligence";
import {
  discoverVenues,
  discoverVenuesMock,
  getUserLocation,
  geocodeCity,
} from "./venue-discovery";
import type { DiscoveredVenue, GeoLocation } from "./venue-discovery";
import { queryLocalVenues, hasLocalKnowledge } from "./venue-knowledge";
import { buildItinerary, parseItineraryRequest } from "./itinerary-orchestrator";
import type { OrchestratorResult } from "./itinerary-orchestrator";
import { trackInteraction } from "./interaction-tracker";
import { supabase } from "../supabase";

// ─── Types ─────────────────────────────────────────────────────

export type ChatIntent =
  | "greeting"
  | "venue_search"
  | "trip_planning"
  | "confetti_create"
  | "recommendation"
  | "venue_detail"
  | "booking"
  | "preference_update"
  | "general_chat";

export interface ChatSession {
  id: string;
  userId: string;
  messages: ChatMessage[];
  context: ChatContext;
  status: "active" | "completed";
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  intent?: ChatIntent;
  venues?: DiscoveredVenue[];
  metadata?: Record<string, unknown>;
}

export interface ChatContext {
  location?: GeoLocation;
  occasion?: string;
  partySize?: number;
  budget?: string;
  mood?: string;
  cuisineFilter?: string[];
  vibeFilter?: string[];
  timeSlot?: string;
  discoveredVenues?: DiscoveredVenue[];
  selectedVenue?: DiscoveredVenue;
  tripMode?: boolean;
  destination?: string;
}

export interface ChatResponse {
  message: string;
  intent: ChatIntent;
  venues?: DiscoveredVenue[];
  provider: string;
  model: string;
  latencyMs: number;
  suggestedChips?: string[];
}

// ─── System prompt ─────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Confetti AI — a personal concierge for dining, nightlife, and unforgettable experiences. You help users discover restaurants, bars, clubs, rooftops, speakeasies, cultural experiences, and plan multi-stop outings called "Confetti plans."

Your personality:
- Warm, confident, slightly playful — like a well-connected friend who always knows the best spots
- You speak in a conversational tone, never robotic or formal
- You use tasteful emoji sparingly (1-2 per message max)
- You're decisive — you make recommendations, not just list options
- You understand vibes: "intimate date night" vs "wild night out" vs "chill Sunday brunch"

Your capabilities:
- Find restaurants, bars, and experiences based on mood, cuisine, vibe, occasion
- Build "Confetti plans" — curated multi-stop itineraries with flow and timing
- Plan road trips with dining and experience stops along the route
- Learn user preferences over time and get better at recommendations
- Know about parking, dress codes, reservations, and logistics

Rules:
- Always recommend specific venues when possible, not generic advice
- When suggesting venues, include brief descriptions that sell the vibe
- If the user seems undecided, offer 2-3 curated options, not a long list
- Match the energy of the occasion — date night gets different recs than a birthday bar crawl
- If you don't know their location, ask once and remember it
- Keep responses concise — 2-3 short paragraphs max unless building a full Confetti plan
- When building a Confetti plan, structure it as a progression (pre-game → main event → nightcap)

Format for venue recommendations:
When recommending venues, include: name, one-line vibe description, and why it fits. Example:
"**Officina** — Waterfront Italian with a rooftop and amaro bar. Perfect for starting the night with sunset views before heading somewhere more intimate."`;

// ─── Intent detection ──────────────────────────────────────────

const INTENT_PATTERNS: Record<ChatIntent, RegExp> = {
  greeting: /^(hey|hi|hello|what's up|sup|yo|good (morning|evening|afternoon))/i,
  venue_search: /(find|search|show|recommend|suggest|where|looking for|any good|know a).*(restaurant|bar|club|spot|place|food|eat|drink|rooftop|speakeasy|brunch|dinner|lunch|happy hour)/i,
  trip_planning: /(road trip|drive to|trip to|travel|multi.?state|highway|route|stops along|drive from)/i,
  confetti_create: /(build|create|make|plan|craft|put together).*(confetti|loop|itinerary|night|evening|outing|experience)/i,
  recommendation: /(what should|where should|any ideas|surprise me|you pick|dealer'?s choice|feeling adventurous|what do you suggest|hook me up)/i,
  venue_detail: /(tell me (more )?about|details|hours|menu|parking|reservation|dress code|valet|what's .* like)/i,
  booking: /(book|reserve|reservation|table for|get us in|hold a spot)/i,
  preference_update: /(i (love|hate|prefer|like|don't like|always|never)|my favorite|i'm (vegan|vegetarian|gluten)|allergic|no .*(dairy|nuts|seafood|meat))/i,
  general_chat: /./,
};

function detectIntent(message: string): ChatIntent {
  for (const [intent, pattern] of Object.entries(INTENT_PATTERNS)) {
    if (pattern.test(message)) {
      return intent as ChatIntent;
    }
  }
  return "general_chat";
}

// ─── Suggested quick action chips based on intent ──────────────

function getSuggestedChips(intent: ChatIntent, context: ChatContext): string[] {
  switch (intent) {
    case "greeting":
      return [
        "🍽️ Find dinner spots",
        "🌃 Plan a night out",
        "🚗 Plan a road trip",
        "🎲 Surprise me",
      ];
    case "venue_search":
      return [
        "Show me more options",
        "Something more upscale",
        "Something more casual",
        "Build a Confetti plan around this",
      ];
    case "confetti_create":
      return [
        "Add another stop",
        "Swap a venue",
        "Show parking info",
        "Lock it in 🔒",
      ];
    case "recommendation":
      return [
        "Date night vibes",
        "Friends night out",
        "Solo adventure",
        "Family friendly",
      ];
    case "trip_planning":
      return [
        "Add a food stop",
        "Find EV charging",
        "Show the full route",
        "What's along the way?",
      ];
    default:
      return [
        "🍽️ Find restaurants",
        "🍸 Find bars",
        "🌃 Build a Confetti plan",
        "🚗 Plan a trip",
      ];
  }
}

// ─── Main chat function ────────────────────────────────────────

export async function sendMessage(
  userId: string,
  userMessage: string,
  sessionId?: string,
  context?: Partial<ChatContext>
): Promise<ChatResponse> {
  // Detect intent
  const intent = detectIntent(userMessage);

  // Get or create session
  const session = sessionId
    ? await loadSession(sessionId)
    : createLocalSession(userId);

  // Merge any provided context
  if (context) {
    Object.assign(session.context, context);
  }

  // Get user intelligence context
  let userContext: UserContext;
  try {
    userContext = await getUserContext(userId);
  } catch {
    userContext = getUserContextLocal();
  }

  // Track the chat query (dual-track: legacy + new interaction tracker)
  trackBehavior(userId, {
    eventType: "chat_query",
    metadata: { query: userMessage, intent },
  }).catch(() => {}); // fire and forget

  trackInteraction({
    userId,
    eventType: "chat_query",
    metadata: { query: userMessage, intent, sessionId: session.id },
  });

  // Build messages array for AI
  const messages: AIMessage[] = buildMessages(
    session,
    userMessage,
    intent,
    userContext,
    session.context
  );

  // If confetti_create intent, use the multi-agent orchestrator pipeline
  let venues: DiscoveredVenue[] | undefined;

  if (intent === "confetti_create") {
    // Route to multi-agent itinerary pipeline
    const itineraryRequest = parseItineraryRequest(userId, userMessage, {
      location: session.context.location,
      occasion: session.context.occasion,
      groupSize: session.context.partySize,
      budget: session.context.budget,
      vibes: session.context.vibeFilter,
    });

    const orchestratorResult = await buildItinerary(itineraryRequest);
    venues = orchestratorResult.venues;

    // Track confetti creation + all venues shown in the itinerary
    trackInteraction({
      userId,
      eventType: "confetti_create",
      metadata: {
        occasion: session.context.occasion,
        theme: orchestratorResult.theme,
        score: orchestratorResult.score,
        venueCount: venues?.length ?? 0,
      },
    });
    if (venues) {
      for (const v of venues) {
        trackInteraction({
          userId,
          eventType: "venue_view",
          venueId: v.id,
          metadata: { source: "confetti_plan", theme: orchestratorResult.theme },
        });
      }
    }

    const aiResponse: AIResponse = {
      content: orchestratorResult.success
        ? orchestratorResult.itinerary!
        : `I ran into a snag building your Confetti plan — let me try a different angle. ${orchestratorResult.qcFeedback ?? "What if we adjust the vibe or area?"}\n\nWhat would you like to tweak?`,
      provider: (orchestratorResult.agentResults[0]?.provider ?? "mock") as AIResponse["provider"],
      model: orchestratorResult.agentResults[0]?.model ?? "multi-agent",
      latencyMs: orchestratorResult.totalLatencyMs,
    };

    // Add messages to session
    session.messages.push({
      role: "user",
      content: userMessage,
      timestamp: new Date().toISOString(),
      intent,
    });
    session.messages.push({
      role: "assistant",
      content: aiResponse.content,
      timestamp: new Date().toISOString(),
      intent,
      venues,
      metadata: {
        orchestrator: true,
        score: orchestratorResult.score,
        verdict: orchestratorResult.verdict,
        theme: orchestratorResult.theme,
        agentCount: orchestratorResult.agentResults.length,
      },
    });

    saveSession(session).catch(() => {});

    return {
      message: aiResponse.content,
      intent,
      venues,
      provider: aiResponse.provider,
      model: aiResponse.model,
      latencyMs: aiResponse.latencyMs,
      suggestedChips: [
        "🔄 Swap a venue",
        "➕ Add another stop",
        "🎲 Different twist",
        "🔒 Lock it in",
      ],
    };
  }

  // For venue_search and recommendation intents, discover venues first
  if (intent === "venue_search" || intent === "recommendation") {
    venues = await searchVenuesForChat(userMessage, session.context, userContext);
    if (venues && venues.length > 0) {
      session.context.discoveredVenues = venues;

      // Track that user was shown these venues (implicit signal for learning)
      for (const v of venues) {
        trackInteraction({
          userId,
          eventType: "venue_view",
          venueId: v.id,
          metadata: { source: "chat_recommendation", intent, query: userMessage },
        });
      }

      // Add venue context to the AI messages
      const venueContext = formatVenueContext(venues);
      messages.push({
        role: "system",
        content: `Here are real venues I found nearby. Use these in your response:\n\n${venueContext}`,
      });
    }
  }

  // Call AI (single-agent path for non-itinerary intents)
  let aiResponse: AIResponse;
  try {
    aiResponse = await chat(messages);
  } catch {
    aiResponse = {
      content:
        "I'm having a moment — let me try that again. What kind of vibe are you feeling tonight?",
      provider: "mock",
      model: "fallback",
      latencyMs: 0,
    };
  }

  // Add messages to session
  session.messages.push({
    role: "user",
    content: userMessage,
    timestamp: new Date().toISOString(),
    intent,
  });
  session.messages.push({
    role: "assistant",
    content: aiResponse.content,
    timestamp: new Date().toISOString(),
    intent,
    venues,
  });

  // Save session (fire and forget)
  saveSession(session).catch(() => {});

  return {
    message: aiResponse.content,
    intent,
    venues,
    provider: aiResponse.provider,
    model: aiResponse.model,
    latencyMs: aiResponse.latencyMs,
    suggestedChips: getSuggestedChips(intent, session.context),
  };
}

// ─── Mock mode chat ────────────────────────────────────────────

let mockSession: ChatSession | null = null;

export async function sendMessageLocal(
  userMessage: string,
  context?: Partial<ChatContext>
): Promise<ChatResponse> {
  const intent = detectIntent(userMessage);

  if (!mockSession) {
    mockSession = createLocalSession("mock-user");
  }

  if (context) {
    Object.assign(mockSession.context, context);
  }

  const userContext = getUserContextLocal();

  trackBehaviorLocal({
    eventType: "chat_query",
    metadata: { query: userMessage, intent },
  });

  const messages: AIMessage[] = buildMessages(
    mockSession,
    userMessage,
    intent,
    userContext,
    mockSession.context
  );

  // Try venue search
  let venues: DiscoveredVenue[] | undefined;
  if (
    intent === "venue_search" ||
    intent === "recommendation" ||
    intent === "confetti_create"
  ) {
    try {
      venues = await searchVenuesForChat(
        userMessage,
        mockSession.context,
        userContext
      );
    } catch {
      venues = discoverVenuesMock();
    }

    if (venues && venues.length > 0) {
      mockSession.context.discoveredVenues = venues;
      const venueContext = formatVenueContext(venues);
      messages.push({
        role: "system",
        content: `Here are real venues I found nearby. Use these in your response:\n\n${venueContext}`,
      });
    }
  }

  let aiResponse: AIResponse;
  try {
    aiResponse = await chat(messages);
  } catch {
    aiResponse = {
      content:
        "I found some great spots for you! Check out the venue cards below — I picked these based on your vibe. Want me to build a Confetti plan around any of these? 🎯",
      provider: "mock",
      model: "confetti-mock-v1",
      latencyMs: 200,
    };
  }

  mockSession.messages.push({
    role: "user",
    content: userMessage,
    timestamp: new Date().toISOString(),
    intent,
  });
  mockSession.messages.push({
    role: "assistant",
    content: aiResponse.content,
    timestamp: new Date().toISOString(),
    intent,
    venues,
  });

  return {
    message: aiResponse.content,
    intent,
    venues,
    provider: aiResponse.provider,
    model: aiResponse.model,
    latencyMs: aiResponse.latencyMs,
    suggestedChips: getSuggestedChips(intent, mockSession.context),
  };
}

// ─── Build AI message array ────────────────────────────────────

function buildMessages(
  session: ChatSession,
  userMessage: string,
  intent: ChatIntent,
  userContext: UserContext,
  chatContext: ChatContext
): AIMessage[] {
  const messages: AIMessage[] = [];

  // System prompt with user profile
  const profilePrompt = generateProfilePrompt(userContext);
  let systemContent = SYSTEM_PROMPT + "\n\n" + profilePrompt;

  // Add context awareness
  if (chatContext.location) {
    systemContent += `\n\nUser's current location: ${chatContext.location.city ?? "Unknown"}, ${chatContext.location.state ?? ""}`;
  }
  if (chatContext.occasion) {
    systemContent += `\nOccasion: ${chatContext.occasion}`;
  }
  if (chatContext.partySize) {
    systemContent += `\nParty size: ${chatContext.partySize}`;
  }
  if (chatContext.budget) {
    systemContent += `\nBudget: ${chatContext.budget}`;
  }
  if (chatContext.mood) {
    systemContent += `\nMood: ${chatContext.mood}`;
  }

  messages.push({ role: "system", content: systemContent });

  // Add conversation history (last 10 messages for context window)
  const history = session.messages.slice(-10);
  for (const msg of history) {
    if (msg.role === "user" || msg.role === "assistant") {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  // Add current user message
  messages.push({ role: "user", content: userMessage });

  return messages;
}

// ─── Venue search integration ──────────────────────────────────

async function searchVenuesForChat(
  query: string,
  context: ChatContext,
  userContext: UserContext
): Promise<DiscoveredVenue[]> {
  // Extract search parameters from query + context
  const params = extractSearchParams(query, context, userContext);

  try {
    // Try to get user location if we don't have it
    if (!context.location) {
      try {
        context.location = await getUserLocation();
      } catch {
        // Try geocoding the city from context or query before falling back to DC
        const cityHint = context.destination ?? query.match(/\bin\s+([A-Z][a-zA-Z\s]+)/)?.[1]?.trim();
        if (cityHint) {
          context.location = await geocodeCity(cityHint) ?? undefined;
        }
        if (!context.location) {
          // Final fallback to DC
          context.location = {
            lat: 38.9072,
            lng: -77.0369,
            city: "Washington",
            state: "DC",
            country: "US",
          };
        }
      }
    }

    const venues = await discoverVenues({
      location: context.location!,
      query: params.searchQuery,
      vibes: params.category ? [params.category] : undefined,
      radiusMiles: params.radius,
      priceLevel: params.priceLevel,
      limit: 5,
    });

    // If discoverVenues returned results, use them (it already checks local knowledge first).
    // If few results and we have local data, supplement with curated venues.
    if (venues.length < 3 && context.location?.city) {
      const cityName = context.location.city;
      if (hasLocalKnowledge(cityName)) {
        const localVenues = queryLocalVenues({
          city: cityName,
          vibes: params.category ? [params.category] : context.vibeFilter,
          occasion: context.occasion ?? undefined,
          limit: 5,
        });
        // Convert local venues to DiscoveredVenue format and merge
        const existing = new Set(venues.map(v => v.name.toLowerCase()));
        for (const lv of localVenues) {
          if (!existing.has(lv.name.toLowerCase()) && venues.length < 5) {
            venues.push({
              id: `local:${lv.slug}`,
              name: lv.name,
              category: lv.cuisine || "venue",
              address: lv.address || "",
              city: lv.city,
              state: lv.state,
              country: "US",
              lat: lv.lat ?? 0,
              lng: lv.lng ?? 0,
              priceLevel: lv.priceLevel ?? 2,
              rating: 4.3,
              photoUrls: [],
              cuisineTags: lv.cuisineTags || [],
              vibeTags: lv.vibeTags || [],
              occasionTags: lv.occasionTags || [],
              source: "merged",
              matchScore: 85,
            });
          }
        }
      }
    }

    return venues;
  } catch {
    // If main discovery fails but we have local knowledge, use that
    if (context.location?.city && hasLocalKnowledge(context.location.city)) {
      const localVenues = queryLocalVenues({
        city: context.location.city,
        vibes: params.category ? [params.category] : context.vibeFilter,
        occasion: context.occasion ?? undefined,
        limit: 5,
      });
      return localVenues.map(lv => ({
        id: `local:${lv.slug}`,
        name: lv.name,
        category: lv.cuisine || "venue",
        address: lv.address || "",
        city: lv.city,
        state: lv.state,
        country: "US",
        lat: lv.lat ?? 0,
        lng: lv.lng ?? 0,
        priceLevel: lv.priceLevel ?? 2,
        rating: 4.3,
        photoUrls: [],
        cuisineTags: lv.cuisineTags || [],
        vibeTags: lv.vibeTags || [],
        occasionTags: lv.occasionTags || [],
        source: "merged",
        matchScore: 85,
      }));
    }
    return discoverVenuesMock();
  }
}

function extractSearchParams(
  query: string,
  context: ChatContext,
  userContext: UserContext
): {
  searchQuery: string;
  category?: string;
  radius: number;
  priceLevel?: string;
} {
  const lowerQuery = query.toLowerCase();

  // Category detection
  let category: string | undefined;
  if (/bar|cocktail|drink|speakeasy|pub/.test(lowerQuery)) category = "bar";
  else if (/club|dance|nightlife|dj/.test(lowerQuery)) category = "nightclub";
  else if (/restaurant|eat|food|dining|dinner|lunch|brunch/.test(lowerQuery))
    category = "restaurant";
  else if (/rooftop|view|outdoor|patio/.test(lowerQuery)) category = "rooftop";
  else if (/coffee|cafe|tea/.test(lowerQuery)) category = "cafe";

  // Radius: default 5 miles, wider for trip mode
  let radius = 8000; // ~5 miles
  if (context.tripMode) radius = 40000;

  // Price level from context or user profile
  let priceLevel = context.budget ?? userContext.preferredPrice;

  // Build search query
  let searchQuery = query;
  if (context.occasion) searchQuery += ` ${context.occasion}`;
  if (context.mood) searchQuery += ` ${context.mood}`;

  return { searchQuery, category, radius, priceLevel };
}

function formatVenueContext(venues: DiscoveredVenue[]): string {
  return venues
    .map(
      (v, i) =>
        `${i + 1}. **${v.name}** (${v.category}${v.priceLevel ? `, ${v.priceLevel}` : ""})
   ${v.address ?? v.city}
   Rating: ${v.rating ?? "N/A"} | Cuisines: ${v.cuisineTags.join(", ") || "N/A"} | Vibes: ${v.vibeTags.join(", ") || "N/A"}`
    )
    .join("\n\n");
}

// ─── Session management ────────────────────────────────────────

function createLocalSession(userId: string): ChatSession {
  return {
    id: crypto.randomUUID?.() ?? `session-${Date.now()}`,
    userId,
    messages: [],
    context: {},
    status: "active",
  };
}

async function loadSession(sessionId: string): Promise<ChatSession> {
  const { data, error } = await supabase
    .from("agent_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (error || !data) {
    return createLocalSession(data?.user_id ?? "unknown");
  }

  return {
    id: data.id,
    userId: data.user_id,
    messages: (data.messages ?? []) as ChatMessage[],
    context: (data.context ?? {}) as ChatContext,
    status: data.status as "active" | "completed",
  };
}

async function saveSession(session: ChatSession): Promise<void> {
  await supabase.from("agent_sessions").upsert({
    id: session.id,
    user_id: session.userId,
    agent_type: "chat",
    context: session.context,
    messages: session.messages.slice(-50), // Keep last 50 messages
    status: session.status,
    updated_at: new Date().toISOString(),
  });
}

// ─── Utility: get provider status ──────────────────────────────

export function getChatStatus() {
  const providers = getAvailableProviders();
  return {
    ...providers,
    systemPromptLength: SYSTEM_PROMPT.length,
  };
}
