/**
 * Waterfront swap rules + Girls Night tier presets.
 *
 * Drives dynamic experience swaps when a city has a waterfront, and provides
 * cheap / mid / high-end tier presets for the Girls Night occasion.
 */

import type { CityContext } from "./city-context";

export type Tier = "cheap" | "mid" | "high";

/** Map a budget number (1–4) to a tier label. */
export function budgetToTier(budget?: number): Tier {
  if (!budget || budget <= 1) return "cheap";
  if (budget === 2) return "mid";
  return "high";
}

/**
 * Prompt fragment describing waterfront swap rules for the current city.
 * Returns null when the city has no waterfront — falls back to non-water alts.
 */
export function buildWaterfrontPrompt(ctx: CityContext): string {
  const wf = ctx.waterfront;
  if (!wf?.hasWaterfront) {
    return `# Waterfront Logic
This city has NO waterfront. Default to rooftops, skyline views, trendy neighborhoods, speakeasies, or scenic overlooks instead of pier/marina/cruise concepts.`;
  }

  const water = wf.waterType ?? "waterfront";
  const spots = (wf.signatureSpots ?? []).join(", ");
  const features = wf.features.join(", ");
  const activities = wf.activities.join(", ");

  const swaps: string[] = [];
  swaps.push("Rooftop → Waterfront rooftop");
  swaps.push("Regular dinner → Waterfront / dockside dinner");
  swaps.push("Lounge → Marina lounge");
  swaps.push("Bar hop → Pier or boardwalk bar hop");
  swaps.push("Luxury dinner → Waterfront chef-tasting");
  swaps.push("High-end twist → Yacht rental, sunset cruise, or harbor charter");
  if (water === "ocean") swaps.push("Add beach-club option when group skews lively");
  if (water === "river") swaps.push("Add riverwalk cocktail-lounge crawl");
  if (water === "lake") swaps.push("Add lakefront winery or lakeside patio");
  if (water === "bay" || water === "harbor")
    swaps.push("Add ferry-hop or harbor sunset cruise as the bonus move");

  return `# Waterfront Logic — ${ctx.label}
hasWaterfront: true · waterType: ${water}
Features: ${features}
Activities available: ${activities}
${spots ? `Signature spots to bias toward: ${spots}` : ""}

Dynamic swaps (apply when they improve the night):
${swaps.map((s) => `  • ${s}`).join("\n")}`;
}

/* ------------------------------ Girls Night ------------------------------- */

type TierPreset = {
  title: string;
  priceBand: string;
  beats: string[];
};

const NON_WATERFRONT_PRESETS: Record<Tier, TierPreset[]> = {
  cheap: [
    {
      title: "Rooftop Sip & Stroll",
      priceBand: "$0–$35",
      beats: ["BYO drinks on a friend's roof", "Late-night ice cream walk", "Polaroid wall photos"],
    },
  ],
  mid: [
    {
      title: "Skyline Dinner & Vinyl",
      priceBand: "$40–$90",
      beats: ["Trendy small-plates", "Skyline rooftop cocktail", "Vinyl bar for one slow dance"],
    },
  ],
  high: [
    {
      title: "Chef's Counter & Speakeasy",
      priceBand: "$120–$400+",
      beats: ["Chef-tasting reservation", "Hidden speakeasy nightcap", "Black-car door-to-door"],
    },
  ],
};

const WATERFRONT_PRESETS: Record<Tier, TierPreset[]> = {
  cheap: [
    {
      title: "Pier Pressure",
      priceBand: "$0–$35",
      beats: [
        "Walk the pier or riverwalk",
        "Grab ice cream or boba",
        "Sunset photos by the water",
        "Wine at someone's place",
      ],
    },
    {
      title: "Budget Winery + Waterfront Stroll",
      priceBand: "$0–$35",
      beats: [
        "Affordable winery tasting",
        "Drive to the waterfront",
        "Bottle on the dock / rocks",
        "Playlist + girl talk",
      ],
    },
  ],
  mid: [
    {
      title: "Dinner on the Dock",
      priceBand: "$40–$90",
      beats: [
        "Waterfront seafood / tapas / wine bar",
        "Golden-hour patio seating",
        "Marina walk after dinner",
        "Waterfront cocktail nightcap",
      ],
    },
    {
      title: "Sunset Cruise Girls Night",
      priceBand: "$40–$90",
      beats: [
        "Group ticket on a public sunset cruise",
        "Shared bottle if allowed",
        "Photos on the bow",
        "End at a marina lounge",
      ],
    },
    {
      title: "Winery + Waterfront Picnic",
      priceBand: "$40–$90",
      beats: ["Mid-range winery tasting", "Drive to the waterfront", "Charcuterie picnic", "Sparkling rosé moment"],
    },
  ],
  high: [
    {
      title: "Yacht & Rosé Takeover",
      priceBand: "$120–$400+",
      beats: [
        "2–3 hr yacht rental split between the group",
        "Curated wine selection",
        "Bluetooth speaker + vibes",
        "Dockside dinner after",
      ],
    },
    {
      title: "Luxury Waterfront Supper Club",
      priceBand: "$120–$400+",
      beats: [
        "Chef-driven waterfront restaurant",
        "Wine pairing",
        "Black-car pickup",
        "Marina rooftop cocktails after",
      ],
    },
    {
      title: "Private Winery + Waterfront Chauffeur",
      priceBand: "$120–$400+",
      beats: [
        "Private reserve tasting",
        "Chauffeured ride to the waterfront",
        "Champagne on the pier",
        "Luxury lounge nightcap",
      ],
    },
  ],
};

/** Returns Girls Night tier presets the model can pick from / riff on. */
export function girlsNightPresets(ctx: CityContext, tier: Tier): TierPreset[] {
  return ctx.waterfront?.hasWaterfront ? WATERFRONT_PRESETS[tier] : NON_WATERFRONT_PRESETS[tier];
}

/** Prompt fragment listing on-brand tier presets for Girls Night. */
export function buildGirlsNightPresetsPrompt(ctx: CityContext, budget?: number): string {
  const tier = budgetToTier(budget);
  const presets = girlsNightPresets(ctx, tier);
  const lines = presets
    .map(
      (p) =>
        `  • ${p.title} (${p.priceBand}) — ${p.beats.join(" → ")}`,
    )
    .join("\n");
  return `# Girls Night Tier Presets — tier=${tier}
Use one of these as the structural spine of the plan; riff on the beats with real candidate venues that fit the city, vibe, and budget. Don't copy titles verbatim into the plan name — let the Naming Agent style it.
${lines}`;
}
