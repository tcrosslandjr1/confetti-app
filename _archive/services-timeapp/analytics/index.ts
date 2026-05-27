/**
 * Confetti Analytics Service — Supabase-Powered
 * No external signup needed — uses your existing Supabase project.
 *
 * Tracks: page views, feature usage, booking funnels, AI interactions,
 * user engagement, and conversion events.
 *
 * Replaces PostHog/Mixpanel/Amplitude for development phase.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────���─────────────────────────

export type EventCategory =
  | "navigation"    // page/screen views
  | "engagement"    // taps, scrolls, time spent
  | "discovery"     // venue searches, filter usage
  | "booking"       // reservation funnel steps
  | "social"        // shares, group creation, community
  | "monetization"  // boost purchases, subscription events
  | "ai"           // chat interactions, recommendation quality
  | "system";       // errors, performance, push notification opens

export interface AnalyticsEvent {
  event: string;                    // e.g. "venue_search", "booking_started"
  category: EventCategory;
  properties?: Record<string, unknown>; // arbitrary event data
  userId?: string;
  sessionId?: string;
  timestamp?: string;               // ISO — defaults to now
}

export interface UserIdentity {
  userId: string;
  traits?: Record<string, unknown>; // name, email, tier, city, etc.
}

export interface FunnelStep {
  funnel: string;        // "booking", "onboarding", "group_creation"
  step: string;          // "started", "selected_venue", "confirmed"
  stepNumber: number;
  userId: string;
  metadata?: Record<string, unknown>;
}

// ─── Configuration ──────────────────────────────────────────────────

let supabase: SupabaseClient | null = null;
let sessionId: string | null = null;
let currentUserId: string | null = null;

// Local queue for offline/batching
const eventQueue: AnalyticsEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const FLUSH_INTERVAL = 5000; // batch every 5 seconds
const MAX_QUEUE_SIZE = 50;

export function initAnalytics(supabaseUrl: string, supabaseKey: string) {
  supabase = createClient(supabaseUrl, supabaseKey);
  sessionId = generateSessionId();
  startAutoFlush();
}

function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Core Tracking ────────────────────────────────���─────────────────

/**
 * Track any event. Queues locally and flushes in batches.
 */
export function track(event: string, category: EventCategory, properties?: Record<string, unknown>) {
  const analyticsEvent: AnalyticsEvent = {
    event,
    category,
    properties,
    userId: currentUserId || undefined,
    sessionId: sessionId || undefined,
    timestamp: new Date().toISOString(),
  };

  eventQueue.push(analyticsEvent);

  // Flush immediately if queue is full
  if (eventQueue.length >= MAX_QUEUE_SIZE) {
    flush();
  }

  // Also log in dev
  if (import.meta.env.DEV) {
    console.log(`[Analytics] ${category}/${event}`, properties || "");
  }
}

/**
 * Identify a user — attach traits for segmentation.
 */
export function identify(userId: string, traits?: Record<string, unknown>) {
  currentUserId = userId;
  track("user_identified", "system", { ...traits, userId });

  // Upsert user profile
  if (supabase) {
    supabase
      .from("analytics_users")
      .upsert({ user_id: userId, traits, last_seen: new Date().toISOString() }, { onConflict: "user_id" })
      .then(() => {});
  }
}

/**
 * Track a funnel step for conversion analysis.
 */
export function trackFunnel(step: FunnelStep) {
  track(`funnel_${step.funnel}_${step.step}`, "engagement", {
    funnel: step.funnel,
    step: step.step,
    stepNumber: step.stepNumber,
    ...step.metadata,
  });
}

// ─── Convenience Methods ────────────────────────────────────────────

export function pageView(page: string, properties?: Record<string, unknown>) {
  track("page_view", "navigation", { page, ...properties });
}

export function venueSearch(query: string, results: number, filters?: Record<string, unknown>) {
  track("venue_search", "discovery", { query, resultCount: results, ...filters });
}

export function bookingStarted(venueId: string, provider: string) {
  track("booking_started", "booking", { venueId, provider });
}

export function bookingCompleted(venueId: string, provider: string, confirmationId: string) {
  track("booking_completed", "booking", { venueId, provider, confirmationId });
}

export function bookingFailed(venueId: string, provider: string, reason: string) {
  track("booking_failed", "booking", { venueId, provider, reason });
}

export function aiChatSent(intent: string, tokensUsed?: number, provider?: string) {
  track("ai_chat_sent", "ai", { intent, tokensUsed, provider });
}

export function shareCreated(type: string, planId?: string) {
  track("share_created", "social", { type, planId });
}

export function boostPurchased(amount: number, tier: string) {
  track("boost_purchased", "monetization", { amount, tier });
}

export function pushOpened(notificationId: string, type: string) {
  track("push_opened", "system", { notificationId, type });
}

export function error(errorType: string, message: string, stack?: string) {
  track("error", "system", { errorType, message, stack: stack?.slice(0, 500) });
}

// ─── Flush / Persistence ────────────────────────────────���───────────

async function flush() {
  if (eventQueue.length === 0) return;

  const batch = eventQueue.splice(0, eventQueue.length);

  if (!supabase) {
    // No Supabase connected — just log in dev
    if (import.meta.env.DEV) {
      console.log(`[Analytics] Flushed ${batch.length} events (no DB — dev mode)`);
    }
    return;
  }

  try {
    const rows = batch.map((e) => ({
      event_name: e.event,
      category: e.category,
      properties: e.properties || {},
      user_id: e.userId || null,
      session_id: e.sessionId || null,
      created_at: e.timestamp,
    }));

    const { error: err } = await supabase.from("analytics_events").insert(rows);
    if (err) {
      console.error("[Analytics] Flush failed:", err.message);
      // Put events back in queue for retry
      eventQueue.unshift(...batch);
    }
  } catch (e) {
    console.error("[Analytics] Flush exception:", e);
    eventQueue.unshift(...batch);
  }
}

function startAutoFlush() {
  if (flushTimer) clearInterval(flushTimer);
  flushTimer = setInterval(flush, FLUSH_INTERVAL);

  // Flush on page unload
  if (typeof window !== "undefined") {
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flush();
    });
  }
}

/**
 * Force flush — call before navigation or app close.
 */
export { flush };

// ─── SQL Migration (run once) ───────────────────────────────────────

export const ANALYTICS_MIGRATION = `
-- Analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name TEXT NOT NULL,
  category TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  user_id TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying by user/event/time
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events(event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_category ON analytics_events(category, created_at DESC);

-- User profiles for segmentation
CREATE TABLE IF NOT EXISTS analytics_users (
  user_id TEXT PRIMARY KEY,
  traits JSONB DEFAULT '{}',
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW()
);
`;
