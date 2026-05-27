// Confetti AI Concierge — client bridge
// Routes messages through the deployed ai-chat edge function on the
// Confetti Supabase project, with the concierge system prompt injected.

import {
  type ActiveLoop,
  type LoopStop,
  getActiveLoop,
  replaceStop,
  addStop,
  removeStop,
  reorderStops,
} from "./loop-store";

// ─── Types ──────────────────────────────────────────────────────────

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Non-null when the assistant modified the plan. */
  edits?: StopEdit[] | null;
  timestamp: number;
};

export type StopEdit = {
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

export type ConciergeResponse = {
  reply: string;
  edits: StopEdit[] | null;
  type: "edit" | "chat";
};

// ─── Endpoint ───────────────────────────────────────────────────────
// Hardcode the canonical Confetti project — the .env file currently
// points to the wrong project and Vercel has no env overrides set.
// This mirrors the same defensive pattern used in client.ts.

const CONFETTI_SUPABASE_URL = "https://zfeckvxkulreyapadanf.supabase.co";
const CONFETTI_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmZWNrdnhrdWxyZXlhcGFkYW5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NzU1MDgsImV4cCI6MjA5NDA1MTUwOH0.KPYif0ntCEVwqOIUWX8r3ZYGI2xGmYIU3oKgnI8aYM0";

const ENDPOINT = `${CONFETTI_SUPABASE_URL}/functions/v1/ai-chat`;

// ─── System prompt ──────────────────────────────────────────────────

function buildSystemPrompt(loop: ActiveLoop): string {
  const city = loop.city ?? loop.toName ?? "Washington DC";
  const occasion = loop.occasion ?? loop.experienceName ?? "a night out";
  const vibe = loop.vibe ?? loop.vibes?.[0] ?? "fun";
  const budget = budgetLabel(loop.planParams?.budget);
  const stopsJSON = JSON.stringify(loop.stops.map(minimalStop), null, 2);

  return `You are the Confetti Concierge — a warm, witty AI guide that helps people have the best nights out. You speak like a trusted friend who knows every great spot in town.

CONTEXT:
- City: ${city}
- Occasion: ${occasion}
- Vibe: ${vibe}
- Budget: ${budget}
- Current itinerary (JSON):
${stopsJSON}

CAPABILITIES:
You can chat naturally AND modify the user's itinerary. When the user wants changes, respond with a JSON block wrapped in \`\`\`json ... \`\`\` containing an "edits" array. Each edit has:
- action: "replace" | "add" | "remove" | "reorder"
- For "replace": stop_id + stop object with updated fields
- For "add": stop object + optional position (0-indexed)
- For "remove": stop_id
- For "reorder": ordered_ids array

Example response with edits:
"I swapped Cafe Luna for Miso — better cocktail program and it fits the date-night vibe."
\`\`\`json
{"edits":[{"action":"replace","stop_id":"s1","stop":{"name":"Miso","type":"bar","time":"9:00 PM","area":"Logan Circle","rationale":"Elevated cocktails in an intimate setting"}}]}
\`\`\`

RULES:
- Keep responses concise and fun — max 2-3 sentences for chat, plus edits if needed
- Always explain WHY you're suggesting a change
- Respect the budget level
- If you don't know a venue, say so honestly — never make up a fake place
- When no edit is needed, just chat naturally without any JSON block`;
}

// ─── Send message ───────────────────────────────────────────────────

/**
 * Send a user message to the Confetti Concierge via the ai-chat edge
 * function, which proxies to OpenAI. The concierge personality is
 * injected as a system prompt with the current itinerary context.
 */
export async function sendConciergeMessage(
  message: string,
  loop: ActiveLoop,
  history: ChatMessage[] = [],
  autoApply = true,
): Promise<ConciergeResponse> {
  // Build OpenAI-format messages array
  const systemMsg = { role: "system" as const, content: buildSystemPrompt(loop) };

  const historyMsgs = history.slice(-10).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const userMsg = { role: "user" as const, content: message };

  const messages = [systemMsg, ...historyMsgs, userMsg];

  // ai-chat expects: { messages, model?, temperature?, max_tokens? }
  const body = {
    messages,
    model: "gpt-4o-mini",
    temperature: 0.8,
    max_tokens: 1024,
  };

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CONFETTI_ANON_KEY}`,
      apikey: CONFETTI_ANON_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `Concierge error ${res.status}`);
  }

  const raw = await res.json();

  // ai-chat returns OpenAI-format: { choices: [{ message: { content } }] }
  const content: string =
    raw?.choices?.[0]?.message?.content ??
    raw?.reply ??
    raw?.content ??
    "Sorry, I couldn't process that. Try again?";

  // Parse edits from the response if present
  const parsed = parseEditsFromContent(content);

  const data: ConciergeResponse = {
    reply: parsed.reply,
    edits: parsed.edits,
    type: parsed.edits ? "edit" : "chat",
  };

  // Auto-apply edits to the active loop in localStorage
  if (autoApply && data.edits?.length) {
    applyEdits(data.edits);
  }

  return data;
}

// ─── Parse edits from assistant content ─────────────────────────────

/**
 * Extract a JSON edits block from the assistant's response content.
 * The concierge is prompted to wrap edits in ```json ... ```.
 */
function parseEditsFromContent(content: string): {
  reply: string;
  edits: StopEdit[] | null;
} {
  const jsonBlockRegex = /```json\s*([\s\S]*?)```/;
  const match = content.match(jsonBlockRegex);

  if (!match) {
    return { reply: content.trim(), edits: null };
  }

  try {
    const parsed = JSON.parse(match[1]);
    const edits: StopEdit[] = Array.isArray(parsed.edits)
      ? parsed.edits
      : Array.isArray(parsed)
        ? parsed
        : null;

    // Strip the JSON block from the display reply
    const reply = content.replace(jsonBlockRegex, "").trim();

    return { reply: reply || "Done! I updated your plan.", edits };
  } catch {
    // JSON parse failed — treat the whole thing as a chat reply
    return { reply: content.trim(), edits: null };
  }
}

// ─── Apply edits to loop-store ──────────────────────────────────────

/**
 * Apply an array of StopEdits from the concierge to the active loop.
 * Each edit maps directly to a loop-store mutation function.
 */
export function applyEdits(edits: StopEdit[]): ActiveLoop | null {
  let loop = getActiveLoop();
  if (!loop) return null;

  for (const edit of edits) {
    switch (edit.action) {
      case "replace": {
        if (!edit.stop_id || !edit.stop) break;
        replaceStop(edit.stop_id, {
          name: edit.stop.name,
          type: edit.stop.type,
          time: edit.stop.time,
          area: edit.stop.area,
          rationale: edit.stop.rationale,
          category: edit.stop.category,
          priceLevel: edit.stop.priceLevel,
          signature: edit.stop.signature,
          crowd: edit.stop.crowd,
          dressCode: edit.stop.dressCode,
          bestFor: edit.stop.bestFor,
        });
        break;
      }

      case "add": {
        if (!edit.stop) break;
        const newStop: LoopStop = {
          id: `s${Date.now().toString(36)}`,
          name: edit.stop.name,
          type: edit.stop.type,
          time: edit.stop.time,
          area: edit.stop.area,
          rationale: edit.stop.rationale,
          category: edit.stop.category,
          priceLevel: edit.stop.priceLevel,
          signature: edit.stop.signature,
          crowd: edit.stop.crowd,
          dressCode: edit.stop.dressCode,
          bestFor: edit.stop.bestFor,
        };
        addStop(newStop, edit.position);
        break;
      }

      case "remove": {
        if (!edit.stop_id) break;
        removeStop(edit.stop_id);
        break;
      }

      case "reorder": {
        if (!edit.ordered_ids?.length) break;
        reorderStops(edit.ordered_ids);
        break;
      }
    }

    // Re-read after each mutation so subsequent edits see the latest state
    loop = getActiveLoop();
    if (!loop) return null;
  }

  return loop;
}

// ─── Helpers ────────────────────────────────────────────────────────

/** Trim a LoopStop to only the fields the edge function needs. */
function minimalStop(s: LoopStop) {
  return {
    id: s.id,
    name: s.name,
    type: s.type,
    time: s.time,
    area: s.area,
    rationale: s.rationale,
    category: s.category,
    priceLevel: s.priceLevel,
    signature: s.signature,
    crowd: s.crowd,
    dressCode: s.dressCode,
    bestFor: s.bestFor,
  };
}

/** Convert numeric budget tier to display label. */
function budgetLabel(tier?: number): string {
  if (!tier) return "$$";
  return ["$", "$$", "$$$", "$$$$"][tier - 1] ?? "$$";
}

/** Generate a unique message id. */
export function msgId(): string {
  return `msg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}
