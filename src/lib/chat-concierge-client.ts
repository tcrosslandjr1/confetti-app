// Confetti AI Concierge — client bridge
// Sends messages to the chat-concierge edge function and applies
// plan edits to the active loop via loop-store mutations.

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

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ??
  "https://zfeckvxkulreyapadanf.supabase.co";

const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

const ENDPOINT = `${SUPABASE_URL}/functions/v1/chat-concierge`;

// ─── Send message ───────────────────────────────────────────────────

/**
 * Send a user message to the Confetti Concierge and optionally apply
 * any returned plan edits to the active loop.
 *
 * @param message      The user's natural-language message
 * @param loop         The current ActiveLoop (stops + metadata)
 * @param history      Previous chat messages (trimmed to last 10 internally)
 * @param autoApply    If true (default), edits are applied to localStorage immediately
 * @returns            The assistant reply + any edits
 */
export async function sendConciergeMessage(
  message: string,
  loop: ActiveLoop,
  history: ChatMessage[] = [],
  autoApply = true,
): Promise<ConciergeResponse> {
  // Build the conversation history the edge function expects
  const trimmedHistory = history.slice(-10).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const body = {
    message,
    stops: loop.stops.map(minimalStop),
    city: loop.city ?? loop.toName ?? "Washington DC",
    occasion: loop.occasion ?? loop.experienceName,
    vibe: loop.vibe ?? loop.vibes?.[0],
    budget: budgetLabel(loop.planParams?.budget),
    history: trimmedHistory,
  };

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `Concierge error ${res.status}`);
  }

  const data = (await res.json()) as ConciergeResponse;

  // Auto-apply edits to the active loop in localStorage
  if (autoApply && data.edits?.length) {
    applyEdits(data.edits);
  }

  return data;
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
