import { supabase } from "@/integrations/supabase/client";

type LogArgs = {
  surface: string; // e.g. "marquee_top" | "marquee_bottom"
  brand: string;
  occasion: string;
  href?: string;
};

// Dedupe impressions per session so the same sponsored slot doesn't spam events
// each render (the marquee duplicates items 2-3x for the seamless loop).
const seenImpressions = new Set<string>();

function key(a: LogArgs) {
  return `${a.surface}::${a.brand}::${a.occasion}`;
}

export function logAdImpression(args: LogArgs) {
  const k = key(args);
  if (seenImpressions.has(k)) return;
  seenImpressions.add(k);
  void supabase.from("ad_events").insert({
    kind: "impression",
    surface: args.surface,
    brand: args.brand,
    occasion: args.occasion,
    href: args.href ?? null,
  });
}

export function logAdClick(args: LogArgs) {
  void supabase.from("ad_events").insert({
    kind: "click",
    surface: args.surface,
    brand: args.brand,
    occasion: args.occasion,
    href: args.href ?? null,
  });
}
