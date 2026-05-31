// Confetti AI Plan Generator — Multi-Agent Itinerary Orchestrator
// Combines Taste Agent + Context Agent + Recommendation Agent + Naming Agent
// into a 2-call pipeline for speed while preserving agent specialization.

import { getCorsHeaders } from "../_shared/cors.ts";

// Reassigned per-request inside the handler so CORS echoes the caller's origin
// (works on both confettiplan.com and the vercel.app production domain).
let corsHeaders = getCorsHeaders();

type PlanRequest = {
  occasion: string;
  vibe?: string;
  budget?: string;
  timeOfDay?: string;
  city?: string;
  groupSize?: number;
  tasteSummary?: string;
  planType?: string;
  surpriseMode?: boolean;
  notes?: string;
};

type ItineraryStop = {
  order: number;
  venue_name: string;
  neighborhood: string;
  category: string;
  arrival: string;
  duration: string;
  purpose: string;
  vibe: string;
  logistics: string;
  pro_tip: string;
  insider_tip?: string;
};

type PlanResult = {
  title: string;
  theme: string;
  mood_emoji: string;
  tagline: string;
  narrative_arc: string;
  route_logic: string;
  city: string;
  occasion: string;
  group_size: number;
  total_budget_estimate: string;
  time_window: string;
  stops: ItineraryStop[];
  twist: {
    stop_number: number;
    type: string;
    description: string;
  };
  boarding_pass: {
    flight_number: string;
    departure_gate: string;
    destination: string;
    captain_note: string;
  };
};

// ─── Combined System Prompt ──────────────────────────────────────────
// Merges all agent layers into a single comprehensive orchestrator prompt
// to minimize latency while preserving the multi-agent intelligence.

function buildSystemPrompt(req: PlanRequest): string {
  const tasteBlock = req.tasteSummary
    ? `\n## USER TASTE PROFILE:\n${req.tasteSummary}\nHonor this profile strictly: match vibes, avoid dislikes, respect budget comfort.\n`
    : "";

  return `You are the Confetti Plan Orchestrator — a multi-agent AI system that builds personalized nightlife and outing itineraries. You internally run 5 specialist roles:

1. TASTE AGENT: Analyze the user's preferences to understand their ideal night
2. CONTEXT AGENT: Assess timing, weather, crowd patterns for ${req.city ?? "the city"}
3. VENUE CURATOR: Select and sequence the perfect venues
4. NARRATIVE ARCHITECT: Build a story arc with a twist moment
5. NAMING AGENT: Create a memorable theme and boarding pass

## REQUEST PARAMETERS:
- Occasion: ${req.occasion}
- Vibe: ${req.vibe ?? "dealer's choice"}
- Budget: ${req.budget ?? "$$"} per person
- Time: ${req.timeOfDay ?? "Tonight"}
- City: ${req.city ?? "Washington DC"}
- Group size: ${req.groupSize ?? 2}
- Plan type: ${req.planType ?? "go-out"}
${req.surpriseMode ? "- MODE: SURPRISE ME — pick something unexpected and adventurous they'd never find on their own\n" : ""}${req.notes ? `- Notes: ${req.notes}\n` : ""}${tasteBlock}

## YOUR PROCESS (run internally, output only the final result):

### Step 1 — Taste Assessment
Infer vibe preferences, energy level, price comfort, adventurousness from the inputs above.

### Step 2 — Context Assessment
Consider: Is it a weekday or weekend? What time are they going out? What's typical crowd/vibe for ${req.city ?? "Washington DC"} at that time? Are rooftops viable (season/weather)? Any major events to leverage or avoid?

### Step 3 — Venue Curation & Sequencing
Select 3-5 REAL venues in ${req.city ?? "Washington DC"} that match the occasion, vibe, and budget. Requirements:
- ALL venues must be REAL, currently operating establishments
- NEVER invent or fabricate venue names
- Sequence with a narrative arc: warm-up → build → peak → wind-down
- Include one "twist" stop — something unexpected that delights
- Keep travel between stops under 15 minutes
- Minimum 45 min per stop, maximum 2 hours
- Match the budget tier across all stops

### Step 4 — Narrative & Theme
Create an emotional journey. The night should FEEL like a story:
- Opening: Set the tone, ease in
- Rising: Energy builds, connections deepen
- Peak: The highlight moment
- Resolution: Graceful wind-down, memorable ending
- Twist: One stop that breaks pattern in a delightful way

### Step 5 — Naming & Boarding Pass
Create a 2-4 word theme name that:
- Sounds good spoken aloud
- Is screenshot-worthy (Instagram story test)
- Actually matches the energy
- Never corny, never generic
Techniques: juxtaposition, sensory, location+energy, action verbs

## OCCASION INTELLIGENCE:

• Date night: romantic low-light venues, wine bars, jazz, intimate tables, walkable transitions, end somewhere with a view
• Friends / Turn-up: energy-forward, group-friendly tables, bottle service or large-party spaces, dancing, late-night food
• Birthday: make them feel special — VIP treatment, surprise element, Instagram moments, cake/champagne stop
• Solo: bar seats at interesting spots, chef's counter, jazz club, speakeasy — places that reward the solo diner
• Chill: neighborhood gems, quiet patios, vinyl bars, bookstore cafes, wine shops with seating
• Classy: upscale without pretense — tasting menus, rooftop lounges, members clubs, craft cocktail dens
• Live music: actual live performance venues — jazz, blues, indie, DJ sets — check what's actually playing
• Rooftop: prioritize outdoor elevated spaces, sunset timing, weather-appropriate

## CRITICAL RULES:
- ONLY recommend REAL venues that currently exist in ${req.city ?? "Washington DC"}
- NEVER fabricate venue names, menus, or details
- If you're uncertain a venue exists, pick one you're confident about instead
- Include the actual neighborhood for each venue
- Make logistics realistic (walking times, Uber estimates)
- Budget estimates should be honest and specific
- Pro tips should be genuinely useful (what to order, where to sit, when to arrive)
- The twist must feel intentional, not random

## BOARDING PASS FORMAT:
- flight_number: "CF-" + 4 random uppercase letters + "-" + 3 random digits (e.g. CF-VIBE-042)
- departure_gate: "Gate " + the first stop's neighborhood
- destination: An evocative 2-3 word destination (not a real place — a feeling, like "Midnight Gold" or "Velvet District")
- captain_note: One fun, confident line from the AI (the "captain" of this flight)`;
}

// ─── Main Handler ────────────────────────────────────────────────────

Deno.serve(async (req) => {
  corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as PlanRequest;
    const { occasion, city = "Washington DC", groupSize = 2 } = body;

    if (!occasion) return json({ error: "occasion is required" }, 400);

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) return json({ error: "missing ANTHROPIC_API_KEY" }, 500);

    const systemPrompt = buildSystemPrompt(body);

    // Define the structured output tool
    const planTool = {
      name: "return_itinerary",
      description: "Return a complete Confetti itinerary with boarding pass",
      input_schema: {
          type: "object",
          properties: {
            title: { type: "string", description: "2-4 word theme name" },
            theme: { type: "string", description: "One sentence theme description" },
            mood_emoji: { type: "string", description: "Single emoji capturing the mood" },
            tagline: { type: "string", description: "One-line tagline that sells the energy" },
            narrative_arc: { type: "string", description: "One sentence describing the emotional journey" },
            route_logic: { type: "string", description: "Why stops are in this order geographically" },
            city: { type: "string" },
            occasion: { type: "string" },
            group_size: { type: "number" },
            total_budget_estimate: { type: "string", description: "e.g. '$40-80 per person'" },
            time_window: { type: "string", description: "e.g. '7:00 PM – 1:00 AM'" },
            stops: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  order: { type: "number" },
                  venue_name: { type: "string", description: "Real venue name" },
                  neighborhood: { type: "string" },
                  category: {
                    type: "string",
                    enum: ["restaurant", "cocktail_bar", "wine_bar", "rooftop", "lounge", "nightclub", "speakeasy", "cafe", "experience", "live_music", "sports_bar", "brewery", "food_hall"],
                  },
                  arrival: { type: "string", description: "e.g. '8:30 PM'" },
                  duration: { type: "string", description: "e.g. '75 min'" },
                  purpose: { type: "string", description: "Why this stop exists in the arc" },
                  vibe: { type: "string", description: "One-line energy description" },
                  logistics: { type: "string", description: "How to get here from previous stop" },
                  pro_tip: { type: "string", description: "Insider recommendation" },
                },
                required: ["order", "venue_name", "neighborhood", "category", "arrival", "duration", "purpose", "vibe", "logistics", "pro_tip"],
              },
            },
            twist: {
              type: "object",
              properties: {
                stop_number: { type: "number" },
                type: {
                  type: "string",
                  enum: ["secret_menu", "hidden_room", "unexpected_detour", "challenge", "surprise_upgrade", "local_secret", "timing_magic"],
                },
                description: { type: "string", description: "What makes this moment special" },
              },
              required: ["stop_number", "type", "description"],
            },
            boarding_pass: {
              type: "object",
              properties: {
                flight_number: { type: "string", description: "CF-XXXX-### format" },
                departure_gate: { type: "string", description: "Gate [Neighborhood]" },
                destination: { type: "string", description: "Evocative 2-3 word destination" },
                captain_note: { type: "string", description: "One fun confident line" },
              },
              required: ["flight_number", "departure_gate", "destination", "captain_note"],
            },
          },
          required: [
            "title", "theme", "mood_emoji", "tagline", "narrative_arc",
            "route_logic", "city", "occasion", "group_size",
            "total_budget_estimate", "time_window", "stops", "twist", "boarding_pass",
          ],
        },
    };

    // Single orchestrated AI call with all agent intelligence embedded
    const userMessage = body.surpriseMode
      ? `Generate a SURPRISE itinerary. The user wants something unexpected — skip the obvious choices. Find hidden gems, unusual combos, or venues with a story. Make it feel like an adventure they'd never plan themselves. City: ${city}, group of ${groupSize}, budget ${body.budget ?? "$$"}, time: ${body.timeOfDay ?? "Tonight"}.`
      : `Generate an itinerary for: ${occasion} night${body.vibe ? ` with a ${body.vibe} vibe` : ""} in ${city}. Group of ${groupSize}, budget ${body.budget ?? "$$"} per person, time: ${body.timeOfDay ?? "Tonight"}.${body.notes ? ` Additional notes: ${body.notes}` : ""}`;

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
        tools: [planTool],
        tool_choice: { type: "tool", name: "return_itinerary" },
      }),
    });

    if (resp.status === 429) return json({ error: "Rate limit — try again in a moment." }, 429);
    if (!resp.ok) return json({ error: `AI error ${resp.status}: ${await resp.text()}` }, 500);

    const data = await resp.json();
    const call = data.content?.find((b: { type: string }) => b.type === "tool_use");
    if (!call) return json({ error: "No tool call returned from AI" }, 500);

    const itinerary: PlanResult = call.input as PlanResult;

    // Basic validation
    if (!itinerary.stops?.length) return json({ error: "AI returned empty itinerary" }, 500);
    if (itinerary.stops.length < 2) return json({ error: "Itinerary too short" }, 500);

    return json({ itinerary });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}
