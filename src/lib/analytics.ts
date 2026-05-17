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
  | "error";

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
  if ((window as unknown as { __confettiErrTrackInstalled?: boolean }).__confettiErrTrackInstalled) return;
  (window as unknown as { __confettiErrTrackInstalled?: boolean }).__confettiErrTrackInstalled = true;

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
