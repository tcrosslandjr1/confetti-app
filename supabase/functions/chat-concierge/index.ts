// Confetti AI Concierge — Claude-powered conversational itinerary editor
// Sits on top of a generated plan and lets users tweak it via natural language.
// "Make stop 2 quieter" / "Add a dessert spot" / "What should I wear?"

import { getCorsHeaders } from "../_shared/cors.ts";

// Reassigned per-request inside the handler so CORS echoes the caller's origin
// (works on both confettiplan.com and the vercel.app production domain).
let corsHeaders = getCorsHeaders();

// ─── Types ──────────────────────────────────────────────────────────

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type LoopStop = {
  id: string;
  name: string;
  type: string;
  time: string;
  area?: string;
  rationale?: string;
  category?: string;
  priceLevel?: string;
  signature?: string;
  crowd?: string;
  dressCode?: string;
  bestFor?: string;
};

type ConciergeRequest = {
  message: string;
  stops: LoopStop[];
  city?: string;
  occasion?: string;
  vibe?: string;
  budget?: string;
  history?: ChatMessage[];
};

type StopEdit = {
  action: "replace" | "add" | "remove" | "reorder";
  stop_id?: string;
  position?: number;
  stop?: {
    name: string;
    type: string;
    time: string;
    area?: string;
    rationale?: string;
    category?: string;
    priceLevel?: string;
    signature?: string;
    crowd?: string;
    dressCode?: string;
    bestFor?: string;
  };
  ordered_ids?: string[];
};

// ─── System Prompt ──────────────────────────────────────────────────

function buildConciergePrompt(req: ConciergeRequest): string {
  const stopsBlock = req.stops
    .map(
      (s, i) =>
        `  ${i + 1}. [${s.id}] ${s.name} (${s.type}) at ${s.time}${s.area ? `, ${s.area}` : ""}${s.priceLevel ? ` — ${s.priceLevel}` : ""}${s.signature ? ` — Try: ${s.signature}` : ""}`
    )
    .join("\n");

  return `You are the Confetti Concierge — a warm, knowledgeable nightlife & dining assistant powered by Claude. You're chatting with someone who already has a plan for their night, and you're helping them tweak it, get tips, or swap venues.

## CURRENT PLAN:
- City: ${req.city ?? "Washington DC"}
- Occasion: ${req.occasion ?? "Night out"}
- Vibe: ${req.vibe ?? "flexible"}
- Budget: ${req.budget ?? "$$"}

## CURRENT STOPS:
${stopsBlock}

## YOUR CAPABILITIES:
You can do TWO things:

1. **ANSWER QUESTIONS** — dress code, what to order, parking, vibes, timing advice, neighborhood tips. Just reply conversationally. Be specific, opinionated, and fun. You know ${req.city ?? "Washington DC"} like a local.

2. **EDIT THE PLAN** — if the user wants to change, swap, add, or remove a stop, use the edit_plan tool. You can:
   - **replace**: Swap one stop for a different venue (provide the stop_id to replace and new stop details)
   - **add**: Insert a new stop at a specific position
   - **remove**: Drop a stop by its id
   - **reorder**: Change the sequence of stops

## RULES:
- ONLY suggest REAL venues that currently exist in ${req.city ?? "Washington DC"}
- NEVER fabricate venue names
- When replacing a stop, explain WHY the new pick is better for what they asked
- Keep the overall flow/arc of the night logical (don't put dinner after late-night drinks)
- Match the existing budget tier unless they ask to go up/down
- Be concise — 2-3 sentences for tips, 1 sentence + the edit for plan changes
- Sound like a cool friend who knows every spot, not a travel guide
- Use the user's energy — if they're hyped, match it. If they're chill, stay mellow.
- If they ask something you genuinely don't know, say so rather than making it up

## TONE:
Warm, confident, specific. Like texting a friend who bartended in every neighborhood.
"Oh you want something quieter? Drop Flash and hit Bar Charley instead — same vibe but you can actually hear each other. Grab the Paper Plane."`;
}

// ─── Tool Definition ────────────────────────────────────────────────

const editPlanTool = {
  type: "function",
  function: {
    name: "edit_plan",
    description:
      "Edit the user's current plan — replace, add, remove, or reorder stops. Only call this when the user wants to change their actual itinerary.",
    parameters: {
      type: "object",
      properties: {
        explanation: {
          type: "string",
          description: "Brief explanation of the change for the user (1-2 sentences)",
        },
        edits: {
          type: "array",
          description: "List of edits to apply in order",
          items: {
            type: "object",
            properties: {
              action: {
                type: "string",
                enum: ["replace", "add", "remove", "reorder"],
              },
              stop_id: {
                type: "string",
                description: "ID of the stop to replace or remove",
              },
              position: {
                type: "number",
                description: "Position to insert a new stop (0-indexed)",
              },
              stop: {
                type: "object",
                description: "New stop details (for replace/add)",
                properties: {
                  name: { type: "string" },
                  type: { type: "string", description: "e.g. 'Cocktail bar', 'Small plates'" },
                  time: { type: "string", description: "e.g. '8:30 PM'" },
                  area: { type: "string", description: "Neighborhood" },
                  rationale: { type: "string", description: "Why this pick" },
                  category: {
                    type: "string",
                    enum: [
                      "restaurant", "cocktail_bar", "wine_bar", "rooftop", "lounge",
                      "nightclub", "speakeasy", "cafe", "experience", "live_music",
                      "sports_bar", "brewery", "food_hall",
                    ],
                  },
                  priceLevel: { type: "string", enum: ["$", "$$", "$$$", "$$$$"] },
                  signature: { type: "string", description: "House specialty to try" },
                  crowd: { type: "string", description: "Typical crowd vibe" },
                  dressCode: { type: "string" },
                  bestFor: { type: "string" },
                },
                required: ["name", "type", "time"],
              },
              ordered_ids: {
                type: "array",
                items: { type: "string" },
                description: "New order of stop IDs (for reorder action)",
              },
            },
            required: ["action"],
          },
        },
      },
      required: ["explanation", "edits"],
    },
  },
};

// ─── Main Handler ───────────────────────────────────────────────────

Deno.serve(async (req) => {
  corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return json(null, 204);

  try {
    const body = (await req.json()) as ConciergeRequest;
    const { message, stops } = body;

    if (!message?.trim()) return json({ error: "message is required" }, 400);
    if (!stops?.length) return json({ error: "stops are required" }, 400);

    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) return json({ error: "missing OPENROUTER_API_KEY" }, 500);

    const systemPrompt = buildConciergePrompt(body);

    // Build conversation messages
    const messages: { role: string; content: string }[] = [
      { role: "system", content: systemPrompt },
    ];

    // Include history (last 10 messages max to stay within context)
    if (body.history?.length) {
      const recent = body.history.slice(-10);
      for (const msg of recent) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    messages.push({ role: "user", content: message });

    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4",
        messages,
        tools: [editPlanTool],
        max_tokens: 1024,
      }),
    });

    if (resp.status === 429) return json({ error: "Rate limit — try again in a moment." }, 429);
    if (resp.status === 402) return json({ error: "AI credits exhausted." }, 402);
    if (!resp.ok) return json({ error: `AI error ${resp.status}: ${await resp.text()}` }, 500);

    const data = await resp.json();
    const choice = data.choices?.[0]?.message;

    if (!choice) return json({ error: "No response from AI" }, 500);

    // Check if Claude used the edit_plan tool
    const toolCall = choice.tool_calls?.[0];
    if (toolCall?.function?.name === "edit_plan") {
      const args = JSON.parse(toolCall.function.arguments) as {
        explanation: string;
        edits: StopEdit[];
      };
      return json({
        reply: args.explanation,
        edits: args.edits,
        type: "edit",
      });
    }

    // Plain text response (question/tip/advice)
    return json({
      reply: choice.content ?? "I'm not sure about that — can you ask another way?",
      edits: null,
      type: "chat",
    });
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
