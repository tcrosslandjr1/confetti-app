// Passive engagement tracker for venue/pick cards.
// Records linger / save / swipe_away / reopen events to the pick_signals table
// via the existing recordPickSignal server fn — best-effort, never throws.

import { useEffect, useRef } from "react";
import { recordPickSignal } from "@/lib/pick-signals.functions";
import { supabase } from "@/integrations/supabase/client";

const LINGER_MS = 2500; // visible this long → "linger"
const SWIPE_MAX_MS = 1500; // visible less than this → "swipe_away"

// Per-tab dedupe so we don't spam signals from one render.
const seenLinger = new Set<string>();
const seenReopen = new Set<string>();
const seenSwipe = new Set<string>();

// Cached auth flag — recordPickSignal requires auth and 401s for guests,
// which surfaces as a thrown Response in the runtime error overlay. Gate here.
let isAuthed = false;
if (typeof window !== "undefined") {
  void supabase.auth.getSession().then(({ data }) => {
    isAuthed = !!data.session;
  });
  supabase.auth.onAuthStateChange((_evt, session) => {
    isAuthed = !!session;
  });
}

function fire(kind: string, value: string, context?: Record<string, unknown>) {
  if (!value || !isAuthed) return;
  // Server fn under the hood; fire-and-forget. Swallow both rejections and
  // synchronous throws (TanStack serverFn can throw a Response object).
  try {
    void recordPickSignal({
      data: { kind: kind as never, value: value.toLowerCase(), context },
    }).catch(() => {});
  } catch {
    /* noop */
  }
}


/**
 * Attach to a card. `value` is the canonical taste term we want to learn from
 * (e.g. card title, vibe slug). Pass any extra context for analytics.
 */
export function useCardSignals(opts: {
  value: string;
  context?: Record<string, unknown>;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const enteredAtRef = useRef<number | null>(null);
  const lingerTimerRef = useRef<number | null>(null);
  const visibleCountRef = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || !opts.value) return;
    const key = opts.value.toLowerCase();

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            enteredAtRef.current = performance.now();
            visibleCountRef.current += 1;
            // Re-open: same card became visible a 2nd+ time this session.
            if (visibleCountRef.current >= 2 && !seenReopen.has(key)) {
              seenReopen.add(key);
              fire("reopen", opts.value, opts.context);
            }
            // Linger after threshold (once per session).
            if (!seenLinger.has(key)) {
              lingerTimerRef.current = window.setTimeout(() => {
                seenLinger.add(key);
                fire("linger", opts.value, opts.context);
              }, LINGER_MS);
            }
          } else {
            // Going off-screen — cancel pending linger and decide swipe_away.
            if (lingerTimerRef.current) {
              window.clearTimeout(lingerTimerRef.current);
              lingerTimerRef.current = null;
            }
            const enteredAt = enteredAtRef.current;
            enteredAtRef.current = null;
            if (
              enteredAt != null &&
              performance.now() - enteredAt < SWIPE_MAX_MS &&
              !seenLinger.has(key) &&
              !seenSwipe.has(key)
            ) {
              seenSwipe.add(key);
              fire("swipe_away", opts.value, opts.context);
            }
          }
        }
      },
      { threshold: [0, 0.5, 1] },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (lingerTimerRef.current) window.clearTimeout(lingerTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.value]);

  return { ref };
}

/** Manual "save" event — call from your bookmark/heart button. */
export function recordCardSave(value: string, context?: Record<string, unknown>) {
  fire("save", value, context);
}
