// Lightweight event analytics. Anon-friendly; fire-and-forget; never blocks UI.
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "confetti.analytics.session";

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "no_storage";
  }
}

async function getUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

export type EventType =
  | "pageview"
  | "cta_click"
  | "scroll_depth"
  | "time_to_interaction"
  | "error"
  | "navigation"
  | "feature_use"
  | "engagement"
  | "conversion"
  | "onboarding";

export async function trackEvent(
  type: EventType,
  name: string,
  opts: { path?: string; value?: number; metadata?: Record<string, unknown> } = {},
) {
  if (typeof window === "undefined") return;
  try {
    const path = opts.path ?? window.location.pathname;
    const userId = await getUserId();
    await supabase.from("analytics_events").insert({
      session_id: getSessionId(),
      user_id: userId,
      event_type: type,
      event_name: name,
      path,
      value: opts.value ?? null,
      metadata: (opts.metadata ?? {}) as never,
      user_agent: navigator.userAgent.slice(0, 255),
    });
  } catch {
    /* swallow — telemetry must never break UX */
  }
}

/** Track a pageview once on mount. */
export function usePageview(name: string, path?: string) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    void trackEvent("pageview", name, { path });
  }, [name, path]);
}

/** Track scroll depth milestones (25/50/75/100). One event per milestone per mount. */
export function useScrollDepth(path?: string) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = new Set<number>();
    const milestones = [25, 50, 75, 100];

    const onScroll = () => {
      const h = document.documentElement;
      const total = h.scrollHeight - h.clientHeight;
      if (total <= 0) return;
      const pct = Math.min(100, Math.round((h.scrollTop / total) * 100));
      for (const m of milestones) {
        if (pct >= m && !seen.has(m)) {
          seen.add(m);
          void trackEvent("scroll_depth", `depth_${m}`, { path, value: m });
        }
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [path]);
}

/** Track time from mount to first user interaction (click/keydown/touchstart). */
export function useTimeToInteraction(path?: string) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const start = performance.now();
    let fired = false;
    const fire = () => {
      if (fired) return;
      fired = true;
      const ms = Math.round(performance.now() - start);
      void trackEvent("time_to_interaction", "first_interaction", { path, value: ms });
      cleanup();
    };
    const opts: AddEventListenerOptions = { once: true, passive: true };
    window.addEventListener("pointerdown", fire, opts);
    window.addEventListener("keydown", fire, opts);
    window.addEventListener("touchstart", fire, opts);
    function cleanup() {
      window.removeEventListener("pointerdown", fire);
      window.removeEventListener("keydown", fire);
      window.removeEventListener("touchstart", fire);
    }
    return cleanup;
  }, [path]);
}

/** Imperative CTA tracker (use on onClick handlers). */
export function trackCta(name: string, metadata: Record<string, unknown> = {}) {
  void trackEvent("cta_click", name, { metadata });
}

/** Global error tracker — call once at app root. */
export function installErrorTracking() {
  if (typeof window === "undefined") return;
  if ((window as unknown as { __confettiErrTrackInstalled?: boolean }).__confettiErrTrackInstalled)
    return;
  (window as unknown as { __confettiErrTrackInstalled?: boolean }).__confettiErrTrackInstalled =
    true;

  window.addEventListener("error", (e) => {
    void trackEvent("error", "window_error", {
      metadata: {
        message: String(e.message).slice(0, 500),
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
      },
    });
  });

  window.addEventListener("unhandledrejection", (e) => {
    const reason = e.reason instanceof Error ? e.reason.message : String(e.reason);
    void trackEvent("error", "unhandled_rejection", {
      metadata: { reason: reason.slice(0, 500) },
    });
  });
}

// ─── Feature & conversion helpers ───────────────────────────────────
/** Track a feature being used (boarding pass view, check-in, share, etc). */
export function trackFeature(name: string, metadata: Record<string, unknown> = {}) {
  void trackEvent("feature_use", name, { metadata });
}

/** Track a conversion event (signup, booking, itinerary_created, etc). */
export function trackConversion(name: string, metadata: Record<string, unknown> = {}) {
  void trackEvent("conversion", name, { metadata });
}

/** Track an onboarding step (taste_quiz, city_select, etc). */
export function trackOnboarding(step: string, metadata: Record<string, unknown> = {}) {
  void trackEvent("onboarding", step, { metadata });
}

/** Track engagement (venue_tap, reel_view, stop_expand, etc). */
export function trackEngagement(name: string, metadata: Record<string, unknown> = {}) {
  void trackEvent("engagement", name, { metadata });
}

// ─── Automatic route-change tracker ─────────────────────────────────
// Drop <RouteAnalytics /> into __root.tsx to auto-track every navigation.
let _prevPath: string | null = null;

/**
 * React component that fires a `navigation` event on every TanStack Router
 * route change. Must be placed inside the Router context.
 * Uses `useRouter` to subscribe to router events.
 */
export function RouteAnalytics() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Fire for the initial page load
    const initial = window.location.pathname;
    if (initial !== _prevPath) {
      _prevPath = initial;
      void trackEvent("navigation", pathToName(initial), { path: initial });
    }

    // MutationObserver on <title> is the cheapest route-agnostic signal
    // that a navigation happened (TanStack Router updates <title> on nav).
    const observer = new MutationObserver(() => {
      const current = window.location.pathname;
      if (current !== _prevPath) {
        _prevPath = current;
        void trackEvent("navigation", pathToName(current), { path: current });
      }
    });

    const titleEl = document.querySelector("title");
    if (titleEl) {
      observer.observe(titleEl, { childList: true, characterData: true, subtree: true });
    }

    // Also listen to popstate for back/forward
    const onPop = () => {
      const current = window.location.pathname;
      if (current !== _prevPath) {
        _prevPath = current;
        void trackEvent("navigation", pathToName(current), { path: current });
      }
    };
    window.addEventListener("popstate", onPop);

    return () => {
      observer.disconnect();
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  return null;
}

/** Convert a pathname like /app/explore to a snake_case name like "app_explore". */
function pathToName(p: string): string {
  return p.replace(/^\//, "").replace(/\/$/, "").replace(/[/.-]/g, "_") || "home";
}
