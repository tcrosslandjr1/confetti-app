// Confetti Concierge â Vercel serverless API route
// Calls Anthropic Claude directly with the concierge system prompt.
// Same-origin with the frontend = no CORS headaches.

import type { VercelRequest, VercelResponse } from "@vercel/node";

// âââ Types ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

interface LoopStop {
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
}

interface ConciergeRequest {
  message: string;
  stops: LoopStop[];
  city?: string;
  occasion?: string;
  vibe?: string;
  budget?: string;
  history?: { role: "user" | "assistant"; content: string }[];
}

interface StopEdit {
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
}

// âââ System Prompt ââââââââââââââââââââââââââââââââââââââââââââââââââ

function buildConciergePrompt(req: ConciergeRequest): string {
  const stopsBlock = req.stops
    .map(
      (s, i) =>
        `  ${i + 1}. [${s.id}] ${s.name} (${s.type}) at ${s.time}${s.area ? `, ${s.area}` : ""}${s.priceLevel ? ` â ${s.priceLevel}` : ""}${s.signature ? ` â Try: ${s.signature}` : ""}`
    )
    .join("\n");

  return `You are the Confetti Concierge â a warm, knowledgeable nightlife & dining assistant powered by Claude. You're chatting with someone who already has a plan for their night, and you're helping them tweak it, get tips, or swap venues.

## CURRENT PLAN:
- City: ${req.city ?? "Washington DC"}
- Occasion: ${req.occasion ?? "Night out"}
- Vibe: ${req.vibe ?? "flexible"}
- Budget: ${req.budget ?? "$$"}

## CURRENT STOPS:
${stopsBlock}

## YOUR CAPABILITIES:
You can do TWO things:

1. **ANSWER QUESTIONS** â dress code, what to order, parking, vibes, timing advice, neighborhood tips. Just reply conversationally. Be specific, opinionated, and fun. You know ${req.city ?? "Washington DC"} like a local.

2. **EDIT THE PLAN** â if the user wants to change, swap, add, or remove a stop, use the edit_plan tool. You can:
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
- Be concise â 2-3 sentences for tips, 1 sentence + the edit for plan changes
- Sound like a cool friend who knows every spot, not a travel guide
- Use the user's energy â if they're hyped, match it. If they're chill, stay mellow.
- If they ask something you genuinely don't know, say so rather than making it up

## TONE:
Warm, confident, specific. Like texting a friend who bartended in every neighborhood.
"Oh you want something quieter? Drop Flash and hit Bar Charley instead â same vibe but you can actually hear each other. Grab the Paper Plane."`;
}

// âââ Tool Definition (Anthropic format) âââââââââââââââââââââââââââââ

const editPlanTool = {
  name: "edit_plan",
  description:
    "Edit the user's current plan â replace, add, remove, or reorder stops. Only call this when the user wants to change their actual itinerary.",
  input_schema: {
    type: "object" as const,
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
                type: { type: "string" },
                time: { type: "string" },
                area: { type: "string" },
                rationale: { type: "string" },
                category: { type: "string" },
                priceLevel: { type: "string" },
                signature: { type: "string" },
                crowd: { type: "string" },
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
};

// âââ Handler ââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });
  }

  const body = req.body as ConciergeRequest;

  if (!body?.message?.trim()) {
    return res.status(400).json({ error: "message is required" });
  }
  if (!body?.stops?.length) {
    return res.status(400).json({ error: "stops are required" });
  }

  const systemPrompt = buildConciergePrompt(body);

  // Build Anthropic messages (system is separate, not in messages array)
  const messages: { role: "user" | "assistant"; content: string }[] = [];

  // Include history (last 10 messages)
  if (body.history?.length) {
    const recent = body.history.slice(-10);
    for (const msg of recent) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  messages.push({ role: "user", content: body.message });

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        system: systemPrompt,
        messages,
        tools: [editPlanTool],
        max_tokens: 1024,
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error("Anthropic API error:", anthropicRes.status, errText);

      if (anthropicRes.status === 429) {
        return res.status(429).json({ error: "Rate limit â try again in a moment." });
      }
      return res
        .status(502)
        .json({ error: `AI error ${anthropicRes.status}` });
    }

    const data = await anthropicRes.json();

    // Parse Anthropic response â could be text, tool_use, or both
    let replyText = "";
    let edits: StopEdit[] | null = null;

    for (const block of data.content ?? []) {
      if (block.type === "text") {
        replyText += block.text;
      } else if (block.type === "tool_use" && block.name === "edit_plan") {
        const input = block.input as {
          explanation: string;
          edits: StopEdit[];
        };
        // Use the tool's explanation as the reply if we don't have text yet
        if (!replyText) replyText = input.explanation;
        edits = input.edits;
      }
    }

    if (!replyText) {
      replyText = "I'm not sure about that â can you ask another way?";
    }

    return res.status(200).json({
      reply: replyText,
      edits,
      type: edits ? "edit" : "chat",
    });
  } catch (err) {
    console.error("Concierge handler error:", err);
    return res
      .status(500)
      .json({ error: "Something went wrong. Try again?" });
  }
}
