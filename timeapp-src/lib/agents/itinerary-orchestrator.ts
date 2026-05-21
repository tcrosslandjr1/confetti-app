/**
 * Confetti Itinerary Orchestrator
 *
 * Multi-agent pipeline that builds themed itineraries:
 *   Phase 1 (parallel): Taste Agent + Venue Data Agent + Context Agent
 *   Phase 2 (sequential): Recommendation Agent → Naming Agent → QC Agent
 *
 * Each agent = one AI call with its own system prompt.
 * Uses existing venue-discovery.ts for real venue data.
 * Uses existing ai-provider.ts chat() for all AI calls.
 */

import { chat, getAIConfig } from "./ai-provider";
import type { AIMessage, AIResponse, AIProviderConfig } from "./ai-provider";
import { discoverVenues, discoverVenuesMock, geocodeCity } from "./venue-discovery";
import type { DiscoveredVenue, VenueSearchParams, GeoLocation } from "./venue-discovery";
import {
  TASTE_AGENT_PROMPT,
  VENUE_DATA_AGENT_PROMPT,
  CONTEXT_AGENT_PROMPT,
  RECOMMENDATION_AGENT_PROMPT,
  NAMING_AGENT_PROMPT,
  QC_AGENT_PROMPT,
} from "./agent-prompts";

// ─── Types ────────────────────────────────────────────────────────

export interface ItineraryRequest {
  userId: string;
  message: string; // The user's natural language request
  city: string;
  date: string; // YYYY-MM-DD
  occasion?: string;
  groupSize?: number;
  budget?: string; // "$", "$$", "$$$", "$$$$"
  vibes?: string[];
  timeWindow?: string; // "7pm – 1am"
  location?: GeoLocation;
  // Optional pre-fetched data
  userHistory?: string; // Past preferences, favorites
  weatherData?: string; // If we have real weather API data
  eventData?: string; // If we have real event data
}

export interface AgentResult {
  agent: string;
  content: string;
  provider: string;
  model: string;
  latencyMs: number;
  success: boolean;
  error?: string;
}

export interface OrchestratorResult {
  success: boolean;
  itinerary?: string; // Final formatted itinerary (boarding pass)
  theme?: string; // Parsed theme name
  score?: number; // QC score
  verdict?: string; // QC verdict
  agentResults: AgentResult[];
  totalLatencyMs: number;
  venues?: DiscoveredVenue[]; // Raw venues used
  // If QC failed, these help with retry
  qcFeedback?: string;
  needsRevision?: boolean;
}

// ─── Config ───────────────────────────────────────────────────────

const ORCHESTRATOR_CONFIG = {
  maxRetries: 1, // Retry once if QC fails
  venueSearchLimit: 15, // Max venues to fetch
  maxTokens: 2048, // Allow longer responses for itineraries
  agentTimeout: 25_000, // 25s per agent call (longer than default)
};

// ─── Agent Call Helper ────────────────────────────────────────────

async function callAgent(
  agentName: string,
  systemPrompt: string,
  userPrompt: string,
  config?: AIProviderConfig
): Promise<AgentResult> {
  const start = performance.now();

  const messages: AIMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  try {
    const response = await chat(messages, config);
    return {
      agent: agentName,
      content: response.content,
      provider: response.provider,
      model: response.model,
      latencyMs: response.latencyMs,
      success: true,
    };
  } catch (err) {
    return {
      agent: agentName,
      content: "",
      provider: "none",
      model: "none",
      latencyMs: Math.round(performance.now() - start),
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─── Phase 1: Parallel Data Gathering ─────────────────────────────

async function gatherVenues(
  request: ItineraryRequest
): Promise<DiscoveredVenue[]> {
  // If no geocoded location, try to geocode the city name
  let location = request.location;
  if (!location && request.city) {
    console.log(`[Confetti] No coordinates — geocoding city: ${request.city}`);
    location = await geocodeCity(request.city);
  }
  if (!location) {
    // Still nothing — fall back to DC coordinates so the API is at least called
    console.warn("[Confetti] Geocoding failed — defaulting to Washington DC coordinates");
    location = { lat: 38.9072, lng: -77.0369, city: "Washington", state: "DC", country: "US" };
  }

  const searchParams: VenueSearchParams = {
    location,
    radiusMiles: 10,
    query: buildVenueQuery(request),
    vibes: request.vibes,
    priceLevel: request.budget,
    occasion: request.occasion,
    limit: ORCHESTRATOR_CONFIG.venueSearchLimit,
  };

  try {
    const venues = await discoverVenues(searchParams);
    return venues.length > 0 ? venues : discoverVenuesMock();
  } catch {
    return discoverVenuesMock();
  }
}

function buildVenueQuery(request: ItineraryRequest): string {
  const parts: string[] = [];
  if (request.occasion) parts.push(request.occasion);
  if (request.vibes?.length) parts.push(request.vibes.join(" "));
  if (request.budget) {
    const priceMap: Record<string, string> = {
      $: "casual affordable",
      $$: "mid-range",
      $$$: "upscale",
      $$$$: "fine dining luxury",
    };
    parts.push(priceMap[request.budget] ?? "");
  }
  parts.push("restaurants bars lounges");
  return parts.filter(Boolean).join(" ");
}

function formatVenuesForAgent(venues: DiscoveredVenue[]): string {
  return venues
    .map(
      (v, i) =>
        `${i + 1}. ${v.name}
   Category: ${v.category}
   Address: ${v.address}, ${v.city}
   Rating: ${v.rating ?? "N/A"} (${v.ratingCount ?? 0} reviews)
   Price: ${v.priceLevel ?? "N/A"}
   Vibes: ${v.vibeTags?.join(", ") ?? "N/A"}
   Cuisines: ${v.cuisineTags?.join(", ") ?? "N/A"}
   Source: ${v.source}
   ${v.hours ? `Hours: ${JSON.stringify(v.hours)}` : "Hours: Not verified"}`
    )
    .join("\n\n");
}

async function runPhaseOne(request: ItineraryRequest): Promise<{
  tasteResult: AgentResult;
  venueDataResult: AgentResult;
  contextResult: AgentResult;
  rawVenues: DiscoveredVenue[];
}> {
  // Fetch real venue data first
  const rawVenues = await gatherVenues(request);
  const venueList = formatVenuesForAgent(rawVenues);

  // Build prompts for each agent
  const tastePrompt = `User request: "${request.message}"
City: ${request.city}
Occasion: ${request.occasion ?? "general night out"}
Group size: ${request.groupSize ?? 2}
Budget: ${request.budget ?? "$$"}
Stated vibes: ${request.vibes?.join(", ") ?? "not specified"}
Time window: ${request.timeWindow ?? "evening"}
${request.userHistory ? `\nUser history:\n${request.userHistory}` : ""}

Generate the taste profile.`;

  const venueDataPrompt = `Request: "${request.message}"
City: ${request.city}
Occasion: ${request.occasion ?? "general night out"}
Group size: ${request.groupSize ?? 2}
Budget preference: ${request.budget ?? "$$"}
Vibes wanted: ${request.vibes?.join(", ") ?? "not specified"}

Here are the real venues found via Google Places and Foursquare. Enrich them into Venue Intelligence Cards:

${venueList}`;

  const contextPrompt = `City: ${request.city}
Date: ${request.date}
Time window: ${request.timeWindow ?? "7:00 PM – 12:00 AM"}
Occasion: ${request.occasion ?? "general night out"}
Group size: ${request.groupSize ?? 2}
${request.weatherData ? `\nReal weather data:\n${request.weatherData}` : ""}
${request.eventData ? `\nKnown events:\n${request.eventData}` : ""}

Generate the Context Brief. If no real weather data provided, infer from city + date + season.`;

  // Run all three in parallel
  const [tasteResult, venueDataResult, contextResult] = await Promise.allSettled([
    callAgent("taste_agent", TASTE_AGENT_PROMPT, tastePrompt),
    callAgent("venue_data_agent", VENUE_DATA_AGENT_PROMPT, venueDataPrompt),
    callAgent("context_agent", CONTEXT_AGENT_PROMPT, contextPrompt),
  ]);

  return {
    tasteResult: tasteResult.status === "fulfilled" ? tasteResult.value : failedResult("taste_agent"),
    venueDataResult: venueDataResult.status === "fulfilled" ? venueDataResult.value : failedResult("venue_data_agent"),
    contextResult: contextResult.status === "fulfilled" ? contextResult.value : failedResult("context_agent"),
    rawVenues,
  };
}

function failedResult(agent: string): AgentResult {
  return {
    agent,
    content: "",
    provider: "none",
    model: "none",
    latencyMs: 0,
    success: false,
    error: "Promise rejected",
  };
}

// ─── Phase 2: Sequential Assembly ─────────────────────────────────

async function runRecommendationAgent(
  request: ItineraryRequest,
  tasteProfile: string,
  venueCards: string,
  contextBrief: string
): Promise<AgentResult> {
  const prompt = `## User Request
"${request.message}"

## Taste Profile (from Taste Agent)
${tasteProfile}

## Venue Intelligence Cards (from Venue Data Agent)
${venueCards}

## Context Brief (from Context/Weather Agent)
${contextBrief}

## Parameters
- City: ${request.city}
- Date: ${request.date}
- Occasion: ${request.occasion ?? "general night out"}
- Group size: ${request.groupSize ?? 2}
- Budget: ${request.budget ?? "$$"}
- Time window: ${request.timeWindow ?? "7:00 PM – 12:00 AM"}

Build the itinerary. Use ONLY venues from the Venue Intelligence Cards above.`;

  return callAgent("recommendation_agent", RECOMMENDATION_AGENT_PROMPT, prompt);
}

async function runNamingAgent(
  request: ItineraryRequest,
  itinerary: string
): Promise<AgentResult> {
  const prompt = `## Completed Itinerary
${itinerary}

## Context
- City: ${request.city}
- Occasion: ${request.occasion ?? "general night out"}
- Group size: ${request.groupSize ?? 2}
- Vibes: ${request.vibes?.join(", ") ?? "not specified"}
- Time window: ${request.timeWindow ?? "evening"}

Generate 3-5 theme name options with taglines and boarding pass flavor.`;

  return callAgent("naming_agent", NAMING_AGENT_PROMPT, prompt);
}

async function runQCAgent(
  request: ItineraryRequest,
  itinerary: string,
  tasteProfile: string,
  contextBrief: string,
  themePackage: string
): Promise<AgentResult> {
  const prompt = `## Full Itinerary to Validate
${itinerary}

## Theme Package
${themePackage}

## Taste Profile (for personalization check)
${tasteProfile}

## Context Brief (for weather/event check)
${contextBrief}

## Original Request
"${request.message}"
City: ${request.city} | Date: ${request.date} | Group: ${request.groupSize ?? 2} | Budget: ${request.budget ?? "$$"}

Run all 7 validation checks. Score and deliver your verdict.`;

  return callAgent("qc_agent", QC_AGENT_PROMPT, prompt);
}

// ─── Main Orchestrator ────────────────────────────────────────────

export async function buildItinerary(
  request: ItineraryRequest
): Promise<OrchestratorResult> {
  const orchestratorStart = performance.now();
  const allResults: AgentResult[] = [];

  // ═══ PHASE 1: Parallel data gathering ═══
  console.log("[Confetti Orchestrator] Phase 1: Gathering data (parallel)...");

  const { tasteResult, venueDataResult, contextResult, rawVenues } =
    await runPhaseOne(request);

  allResults.push(tasteResult, venueDataResult, contextResult);

  // Check if we have enough to proceed
  if (!venueDataResult.success) {
    return {
      success: false,
      agentResults: allResults,
      totalLatencyMs: Math.round(performance.now() - orchestratorStart),
      venues: rawVenues,
      qcFeedback: "Venue Data Agent failed — cannot build itinerary without venue data.",
      needsRevision: false,
    };
  }

  // ═══ PHASE 2: Sequential assembly ═══
  console.log("[Confetti Orchestrator] Phase 2: Building itinerary...");

  // Step 1: Recommendation Agent assembles the itinerary
  const recResult = await runRecommendationAgent(
    request,
    tasteResult.content || "No taste profile available — use defaults for the occasion.",
    venueDataResult.content,
    contextResult.content || "No context data — assume good weather, no events."
  );
  allResults.push(recResult);

  if (!recResult.success) {
    return {
      success: false,
      agentResults: allResults,
      totalLatencyMs: Math.round(performance.now() - orchestratorStart),
      venues: rawVenues,
      qcFeedback: "Recommendation Agent failed to build itinerary.",
      needsRevision: false,
    };
  }

  // Step 2: Naming Agent themes the itinerary
  console.log("[Confetti Orchestrator] Phase 2: Naming...");
  const namingResult = await runNamingAgent(request, recResult.content);
  allResults.push(namingResult);

  // Step 3: QC Agent validates everything
  console.log("[Confetti Orchestrator] Phase 2: Quality check...");
  const qcResult = await runQCAgent(
    request,
    recResult.content,
    tasteResult.content || "",
    contextResult.content || "",
    namingResult.content || "No theme — naming agent failed."
  );
  allResults.push(qcResult);

  // ═══ Parse QC verdict ═══
  const score = parseScore(qcResult.content);
  const verdict = parseVerdict(qcResult.content);

  // ═══ Handle QC outcome ═══
  if (verdict === "REJECTED" || verdict === "REVISION_REQUIRED") {
    // If we haven't retried yet, try once more
    if (ORCHESTRATOR_CONFIG.maxRetries > 0) {
      console.log("[Confetti Orchestrator] QC failed — attempting revision...");
      const revisedResult = await runRecommendationAgent(
        request,
        tasteResult.content || "",
        venueDataResult.content,
        contextResult.content + `\n\n## QC FEEDBACK (fix these issues):\n${qcResult.content}`
      );
      allResults.push(revisedResult);

      if (revisedResult.success) {
        // Re-run naming and QC on revised version
        const revisedNaming = await runNamingAgent(request, revisedResult.content);
        allResults.push(revisedNaming);

        return {
          success: true,
          itinerary: formatBoardingPass(revisedResult.content, revisedNaming.content),
          theme: parseThemeName(revisedNaming.content),
          score: score,
          verdict: "APPROVED_WITH_EDITS",
          agentResults: allResults,
          totalLatencyMs: Math.round(performance.now() - orchestratorStart),
          venues: rawVenues,
        };
      }
    }

    return {
      success: false,
      agentResults: allResults,
      totalLatencyMs: Math.round(performance.now() - orchestratorStart),
      venues: rawVenues,
      qcFeedback: qcResult.content,
      needsRevision: true,
    };
  }

  // ═══ SUCCESS ═══
  console.log(`[Confetti Orchestrator] Done! Score: ${score}/100 | Verdict: ${verdict}`);

  return {
    success: true,
    itinerary: formatBoardingPass(recResult.content, namingResult.content),
    theme: parseThemeName(namingResult.content),
    score,
    verdict,
    agentResults: allResults,
    totalLatencyMs: Math.round(performance.now() - orchestratorStart),
    venues: rawVenues,
  };
}

// ─── Parsing Helpers ──────────────────────────────────────────────

function parseScore(qcOutput: string): number {
  const match = qcOutput.match(/overall_score:\s*(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function parseVerdict(qcOutput: string): string {
  const match = qcOutput.match(/verdict:\s*"?([A-Z_]+)"?/);
  return match ? match[1] : "UNKNOWN";
}

function parseThemeName(namingOutput: string): string {
  // Look for top_pick or first name
  const topPick = namingOutput.match(/top_pick:\s*"([^"]+)"/);
  if (topPick) return topPick[1];

  const firstName = namingOutput.match(/name:\s*"([^"]+)"/);
  return firstName ? firstName[1] : "Untitled Experience";
}

// ─── Boarding Pass Formatter ──────────────────────────────────────

function formatBoardingPass(itinerary: string, naming: string): string {
  const theme = parseThemeName(naming);
  const taglineMatch = naming.match(/tagline:\s*"([^"]+)"/);
  const tagline = taglineMatch ? taglineMatch[1] : "";
  const flightMatch = naming.match(/flight_number:\s*"([^"]+)"/);
  const flight = flightMatch ? flightMatch[1] : "CF-001";
  const gateMatch = naming.match(/departure_gate:\s*"([^"]+)"/);
  const gate = gateMatch ? gateMatch[1] : "Gate 1";
  const destMatch = naming.match(/destination:\s*"([^"]+)"/);
  const dest = destMatch ? destMatch[1] : "A Night to Remember";
  const captainMatch = naming.match(/captain_note:\s*"([^"]+)"/);
  const captainNote = captainMatch ? captainMatch[1] : "";

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✈️  CONFETTI BOARDING PASS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎫 ${theme.toUpperCase()}
${tagline ? `   "${tagline}"` : ""}

Flight: ${flight}
Gate: ${gate}
Destination: ${dest}
${captainNote ? `Captain's Note: ${captainNote}` : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 YOUR ITINERARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${itinerary}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎊 Powered by Confetti AI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();
}

// ─── Convenience: Quick itinerary from chat message ───────────────

/**
 * Parse a natural language message into an ItineraryRequest.
 * Used by chat-agent.ts when intent is "confetti_create".
 */
export function parseItineraryRequest(
  userId: string,
  message: string,
  context?: {
    location?: GeoLocation;
    occasion?: string;
    groupSize?: number;
    budget?: string;
    vibes?: string[];
  }
): ItineraryRequest {
  // Extract city from message or context
  const cityMatch = message.match(/\bin\s+([A-Z][a-zA-Z\s]+?)(?:\s+for|\s+with|\s+on|\s*[,.]|\s*$)/);
  const city = cityMatch?.[1]?.trim() ?? context?.location?.city ?? "Washington, DC";

  // Extract group size
  const groupMatch = message.match(/(\d+)\s*(?:people|friends|of us|guests|ppl)/i);
  const groupSize = groupMatch ? parseInt(groupMatch[1], 10) : context?.groupSize ?? 2;

  // Extract budget
  const budgetMatch = message.match(/\$(\$*)/);
  const budget = budgetMatch ? "$" + budgetMatch[1] : context?.budget ?? "$$";

  // Extract occasion
  const occasions = ["birthday", "date", "anniversary", "bachelorette", "bachelor", "graduation", "celebration", "girls night", "guys night", "work event"];
  const occasion = occasions.find((o) => message.toLowerCase().includes(o)) ?? context?.occasion ?? "night out";

  // Extract vibes
  const vibeKeywords = ["bougie", "chill", "wild", "romantic", "classy", "adventurous", "loud", "intimate", "upscale", "casual", "trendy", "dive", "hidden gem"];
  const vibes = vibeKeywords.filter((v) => message.toLowerCase().includes(v));
  if (vibes.length === 0 && context?.vibes) vibes.push(...context.vibes);

  const today = new Date().toISOString().split("T")[0];

  return {
    userId,
    message,
    city,
    date: today,
    occasion,
    groupSize,
    budget,
    vibes: vibes.length > 0 ? vibes : undefined,
    timeWindow: "7:00 PM – 12:00 AM",
    location: context?.location,
  };
}
