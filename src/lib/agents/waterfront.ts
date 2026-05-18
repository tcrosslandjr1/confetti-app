// Waterfront detection + dynamic-swap prompt for the Itinerary Concierge.
// Uses the city's existing environmentFeatures/tags — no schema change.

import type { CityContext } from "./city-context";

const WATER_FEATURE_TOKENS = [
  "waterfront",
  "harbor",
  "harbour",
  "river",
  "riverwalk",
  "lake",
  "bay",
  "beach",
  "marina",
  "pier",
  "boardwalk",
  "ocean",
] as const;

export type WaterType = "ocean" | "river" | "lake" | "bay" | "harbor" | "mixed";

export type WaterfrontProfile = {
  hasWaterfront: boolean;
  waterType: WaterType | null;
  features: string[]; // pier, marina, riverwalk, beach, boardwalk, harbor
};

function classifyWaterType(features: string[], tags: string[]): WaterType | null {
  const all = [...features, ...tags].map((s) => s.toLowerCase());
  const hits = new Set<WaterType>();
  if (all.some((s) => s.includes("ocean") || s.includes("beach"))) hits.add("ocean");
  if (all.some((s) => s.includes("river"))) hits.add("river");
  if (all.some((s) => s.includes("lake"))) hits.add("lake");
  if (all.some((s) => s.includes("bay"))) hits.add("bay");
  if (all.some((s) => s.includes("harbor") || s.includes("harbour"))) hits.add("harbor");
  if (hits.size === 0) return null;
  if (hits.size === 1) return [...hits][0];
  return "mixed";
}

export function detectWaterfront(city: CityContext): WaterfrontProfile {
  const pool = [...(city.environmentFeatures ?? []), ...(city.tags ?? [])].map((s) =>
    s.toLowerCase(),
  );
  const features = WATER_FEATURE_TOKENS.filter((t) => pool.some((p) => p.includes(t)));
  const hasWaterfront = features.length > 0;
  return {
    hasWaterfront,
    waterType: hasWaterfront ? classifyWaterType(features, city.tags ?? []) : null,
    features,
  };
}

/** Dynamic-swap rules the agent applies when a city has a waterfront. */
export function buildWaterfrontPrompt(city: CityContext): string {
  const wf = detectWaterfront(city);
  if (!wf.hasWaterfront) {
    return [
      "# Waterfront Logic",
      "This city does NOT have a meaningful waterfront. Fallback to: rooftops, skyline views, trendy neighborhoods, speakeasies, scenic overlooks. Do NOT invent harbor/pier/marina/beach stops.",
    ].join("\n");
  }
  const featureLabel = wf.features.length ? wf.features.join(", ") : "waterfront";
  const typeLabel = wf.waterType ?? "waterfront";
  return [
    "# Waterfront Logic",
    `City has a ${typeLabel} waterfront (features: ${featureLabel}). When a slot can be staged near the water, prefer the waterfront variant.`,
    "Dynamic swaps to prefer when on-vibe and within travel limits:",
    "  • Rooftop → Waterfront rooftop",
    "  • Regular dinner → Waterfront dinner",
    "  • Lounge → Marina lounge",
    "  • Bar hop → Pier / boardwalk bar hop",
    "  • Luxury dinner → Waterfront chef tasting",
    "  • High-end twist → Yacht rental or sunset cruise",
    "Never force a swap that breaks the budget, travel cap, or category fit.",
  ].join("\n");
}
