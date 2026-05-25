import { supabase } from "@/integrations/supabase/client";
import { getSelectedCity } from "@/lib/cities";
import { trackEngagement } from "@/lib/analytics";

type LogArgs = {
  surface: string; // e.g. "marquee_top" | "marquee_bottom"
  brand: string;
  occasion: string;
  href?: string;
};

// Throttle rapid duplicate viewport-impressions for the SAME slot to once per ~1.5s
// so a flickering animation can't spam events.
const lastFired = new Map<string, number>();
const THROTTLE_MS = 1500;

function key(a: LogArgs, slot?: string) {
  return `${a.surface}::${a.brand}::${a.occasion}::${slot ?? ""}`;
}

function insert(kind: "impression" | "click", a: LogArgs) {
  void supabase.from("ad_events").insert({
    kind,
    surface: a.surface,
    brand: a.brand,
    occasion: a.occasion,
    href: a.href ?? null,
  });
}

/**
 * Fire-and-forget impression. Each call counts (no session dedupe), but
 * repeats for the exact same slot within THROTTLE_MS are dropped.
 * Pass a `slot` id (e.g. rendered index) to track distinct DOM instances
 * independently across marquee loops.
 */
export function logAdViewImpression(args: LogArgs, slot?: string) {
  const k = key(args, slot);
  const now = Date.now();
  const prev = lastFired.get(k) ?? 0;
  if (now - prev < THROTTLE_MS) return;
  lastFired.set(k, now);
  insert("impression", args);
}

export function logAdClick(args: LogArgs) {
  insert("click", args);
}
