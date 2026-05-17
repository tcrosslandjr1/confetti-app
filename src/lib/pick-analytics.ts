// Lightweight client-side analytics for "Why this pick" signals.
// Mirrors share-analytics: persists to localStorage and console.info so we can
// inspect which signals (trending, most-booked, most-saved, …) drive trust
// without a backend dependency.

import type { PickSignalKind } from "@/components/WhyThisPick";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "confetti:pick-analytics:session";
const ENDPOINT = "/api/public/pick-events";

function getSessionId(): string {
  if (typeof localStorage === "undefined") return "ssr";
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `s_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

type PendingEvent = {
  name: PickEventName;
  pickId: string;
  context?: string;
  signals: PickSignalKind[];
  meta?: Record<string, unknown>;
  clientAt: string;
  sessionId: string;
};

let pending: PendingEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

async function flush() {
  flushTimer = null;
  if (pending.length === 0) return;
  const batch = pending;
  pending = [];
  try {
    let userId: string | undefined;
    try {
      const { data } = await supabase.auth.getSession();
      userId = data.session?.user?.id;
    } catch {
      /* anon */
    }
    const events = batch.map((e) => ({ ...e, userId }));
    await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events }),
      keepalive: true,
    });
  } catch (err) {
    if (typeof console !== "undefined") {
      console.warn("[pick-analytics] flush failed", err);
    }
  }
}

function scheduleFlush() {
  if (typeof window === "undefined") return;
  if (flushTimer) return;
  flushTimer = setTimeout(flush, 1500);
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => {
    if (pending.length > 0) void flush();
  });
}

export type PickEventName =
  | "pick_impression"
  | "pick_click"
  | "pick_feedback_up"
  | "pick_feedback_down";

export type PickEvent = {
  name: PickEventName;
  at: string;
  pickId: string;
  context?: string;
  signals: PickSignalKind[];
  meta?: Record<string, unknown>;
};

const STORAGE_KEY = "confetti:pick-analytics:v1";
const CONSENT_KEY = "confetti:pick-analytics:consent";
const CONSENT_EVENT = "confetti:pick-analytics:consent-changed";
const MAX_EVENTS = 500;

export type PickAnalyticsConsent = "granted" | "denied";

/** Default = granted (back-compat with existing tracking). */
export function getPickAnalyticsConsent(): PickAnalyticsConsent {
  if (typeof localStorage === "undefined") return "granted";
  try {
    return localStorage.getItem(CONSENT_KEY) === "denied" ? "denied" : "granted";
  } catch {
    return "granted";
  }
}

export function setPickAnalyticsConsent(value: PickAnalyticsConsent) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    /* quota — ignore */
  }
  if (value === "denied") {
    // Wipe any previously persisted events so opt-out is meaningful.
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
  }
}

export function subscribePickAnalyticsConsent(cb: (v: PickAnalyticsConsent) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (e: Event) => cb((e as CustomEvent<PickAnalyticsConsent>).detail);
  const onStorage = (e: StorageEvent) => {
    if (e.key === CONSENT_KEY) cb(getPickAnalyticsConsent());
  };
  window.addEventListener(CONSENT_EVENT, handler);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CONSENT_EVENT, handler);
    window.removeEventListener("storage", onStorage);
  };
}

function read(): PickEvent[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PickEvent[]) : [];
  } catch {
    return [];
  }
}

function write(events: PickEvent[]) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
  } catch {
    /* quota — ignore */
  }
}

export function trackPickEvent(
  name: PickEventName,
  opts: {
    pickId: string;
    context?: string;
    signals: PickSignalKind[];
    meta?: Record<string, unknown>;
  },
) {
  // Honor user privacy choice — opt-out short-circuits the whole pipeline,
  // including the localStorage write and the console.info breadcrumb.
  if (getPickAnalyticsConsent() === "denied") return;
  const clientAt = new Date().toISOString();
  const evt: PickEvent = {
    name,
    at: clientAt,
    pickId: opts.pickId,
    context: opts.context,
    signals: opts.signals,
    meta: opts.meta,
  };
  write([...read(), evt]);
  pending.push({
    name,
    pickId: opts.pickId,
    context: opts.context,
    signals: opts.signals,
    meta: opts.meta,
    clientAt,
    sessionId: getSessionId(),
  });
  scheduleFlush();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("confetti:pick-analytics", { detail: evt }));
  }
  if (typeof console !== "undefined") {
    console.info("[pick-analytics]", evt);
  }
}

export function getPickEvents(): PickEvent[] {
  return read();
}

export function clearPickEvents() {
  write([]);
}

/** Aggregate counts per signal kind, useful for a future trust dashboard. */
export function summarizePickEvents(events: PickEvent[] = read()) {
  const tally: Record<string, { impressions: number; clicks: number; up: number; down: number }> =
    {};
  const bump = (kind: string, key: keyof (typeof tally)[string]) => {
    tally[kind] ??= { impressions: 0, clicks: 0, up: 0, down: 0 };
    tally[kind][key] += 1;
  };
  for (const e of events) {
    for (const k of e.signals) {
      if (e.name === "pick_impression") bump(k, "impressions");
      else if (e.name === "pick_click") bump(k, "clicks");
      else if (e.name === "pick_feedback_up") bump(k, "up");
      else if (e.name === "pick_feedback_down") bump(k, "down");
    }
  }
  return tally;
}
