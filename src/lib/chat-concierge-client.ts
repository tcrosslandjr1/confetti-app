// Confetti AI Concierge â client bridge
// Routes messages through /api/concierge (Vercel serverless function)
// which calls Anthropic Claude directly. Same-origin = no CORS issues.

import {
  type ActiveLoop,
  type LoopStop,
  getActiveLoop,
  replaceStop,
  addStop,
  removeStop,
  reorderStops,
} from "./loop-store";

// âââ Types ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

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

// âââ Endpoint âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// Same-origin Vercel serverless function â no CORS, no Supabase dependency.

const ENDPOINT = "/api/concierge";

// âââ Send message âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

/**
 * Send a user message to the Confetti Concierge via the Vercel API route,
 * which proxies to Anthropic Claude. The concierge system prompt is built
 * server-side from the itinerary context we send.
 */
export async function sendConciergeMessage(
  message: string,
  loop: ActiveLoop,
  history: ChatMessage[] = [],
  autoApply = true,
): Promise<ConciergeResponse> {
  const city = loop.city ?? loop.toName ?? "Washington DC";
  const occasion = loop.occasion ?? loop.experienceName ?? "a night out";
  const vibe = loop.vibe ?? loop.vibes?.[0] ?? "fun";
  const budget = budgetLabel(loop.planParams?.budget);

  const historyMsgs = history.slice(-10).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const body = {
    message,
    stops: loop.stops.map(minimalStop),
    city,
    occasion,
    vibe,
    budget,
    history: historyMsgs,
  };

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `Concierge error ${res.status}`);
  }

  const data: ConciergeResponse = await res.json();

  // Auto-apply edits to the active loop in localStorage
  if (autoApply && data.edits?.length) {
    applyEdits(data.edits);
  }

  return data;
}

// âââ Apply edits to loop-store ââââââââââââââââââââââââââââââââââââââââââââââ

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

// âââ Helpers ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

/** Trim a LoopStop to only the fields the API route needs. */
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
