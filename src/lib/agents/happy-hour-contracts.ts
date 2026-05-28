// Confetti — DMV Happy Hour Itinerary Templates
//
// Six pre-built 3-stop itinerary contracts for the Happy Hour engine.
// Each template defines its slot structure (Pre-Game → Main Event → Nightcap),
// vibe filters, energy range, price range, and suggested neighborhood clusters.
//
// Consumed by the recommendation agent to shape AI-generated HH crawl plans.

import type { VibeTag, ClusterId } from "./happy-hour-engine";

// ── Types ─────────────────────────────────────────────────────────

export type HHSlotRole = "pre_game" | "main_event" | "nightcap";

export type HHSlot = {
  role: HHSlotRole;
  label: string;
  description: string;
  duration_min: number;
  vibe_priority: VibeTag[];
  energy_target: number; // 1-10 ideal energy for this slot
};

export type HHItineraryTemplate = {
  id: string;
  label: string;
  description: string;
  slots: [HHSlot, HHSlot, HHSlot]; // always 3 stops
  vibe_filter: VibeTag[];
  energy_range: [number, number]; // [min, max]
  price_range: ("$" | "$$" | "$$$" | "$$$$")[];
  suggested_clusters: ClusterId[];
};

// ── Slot Presets ──────────────────────────────────────────────────

const PRE_GAME_DEFAULT: HHSlot = {
  role: "pre_game",
  label: "Pre-Game",
  description: "Kick things off with a quick drink and light bites at a low-key spot.",
  duration_min: 45,
  vibe_priority: ["happy_hour", "patio"],
  energy_target: 4,
};

const MAIN_EVENT_DEFAULT: HHSlot = {
  role: "main_event",
  label: "Main Event",
  description: "The centerpiece — best deals, biggest vibe, longest stay.",
  duration_min: 90,
  vibe_priority: ["happy_hour", "trending"],
  energy_target: 7,
};

const NIGHTCAP_DEFAULT: HHSlot = {
  role: "nightcap",
  label: "Nightcap",
  description: "Wind down with a final round at a chill, walkable spot nearby.",
  duration_min: 45,
  vibe_priority: ["happy_hour", "culture"],
  energy_target: 5,
};

// ── Template 1: Happy Hour Classic ───────────────────────────────

const HAPPY_HOUR_CLASSIC: HHItineraryTemplate = {
  id: "happy_hour_classic",
  label: "Happy Hour Classic",
  description:
    "The standard after-work crawl. Maximize deals, minimize commute. Three walkable stops with the best drink specials and bar bites in the cluster.",
  slots: [
    { ...PRE_GAME_DEFAULT },
    { ...MAIN_EVENT_DEFAULT },
    { ...NIGHTCAP_DEFAULT },
  ],
  vibe_filter: ["happy_hour", "patio"],
  energy_range: [4, 7],
  price_range: ["$", "$$"],
  suggested_clusters: [
    "dc_14th_street",
    "dc_chinatown",
    "va_clarendon",
    "md_bethesda",
  ],
};

// ── Template 2: Culture Night ────────────────────────────────────

const CULTURE_NIGHT: HHItineraryTemplate = {
  id: "culture_night",
  label: "Culture Night",
  description:
    "Art, jazz, international food, and thoughtful cocktails. For the group that wants ambiance over volume and conversation over chaos.",
  slots: [
    {
      role: "pre_game",
      label: "Opening Act",
      description: "Start with craft cocktails or natural wine at an intimate bar with character.",
      duration_min: 45,
      vibe_priority: ["culture", "happy_hour"],
      energy_target: 4,
    },
    {
      role: "main_event",
      label: "The Experience",
      description: "International small plates or a jazz lounge — the spot you came for.",
      duration_min: 90,
      vibe_priority: ["culture", "happy_hour"],
      energy_target: 6,
    },
    {
      role: "nightcap",
      label: "Encore",
      description: "One last drink somewhere moody — speakeasy, mezcal bar, or dessert café.",
      duration_min: 45,
      vibe_priority: ["culture"],
      energy_target: 4,
    },
  ],
  vibe_filter: ["culture", "happy_hour"],
  energy_range: [3, 6],
  price_range: ["$$", "$$$"],
  suggested_clusters: [
    "dc_u_street",
    "dc_h_street",
    "dc_14th_street",
    "md_silver_spring",
  ],
};

// ── Template 3: Sports Bar Hop ───────────────────────────────────

const SPORTS_BAR_HOP: HHItineraryTemplate = {
  id: "sports_bar_hop",
  label: "Sports Bar Hop",
  description:
    "Big screens, beer specials, and wings. Built around game-day energy with three stops that keep the action rolling.",
  slots: [
    {
      role: "pre_game",
      label: "Warm-Up",
      description: "Grab a pitcher and settle in before the main game kicks off.",
      duration_min: 45,
      vibe_priority: ["sports", "happy_hour"],
      energy_target: 5,
    },
    {
      role: "main_event",
      label: "Game Time",
      description: "The big-screen destination — loudest cheers, best wing deals, coldest beer.",
      duration_min: 90,
      vibe_priority: ["sports", "happy_hour"],
      energy_target: 8,
    },
    {
      role: "nightcap",
      label: "Post-Game",
      description: "Celebrate or commiserate with one more round at a dive-y spot nearby.",
      duration_min: 45,
      vibe_priority: ["sports"],
      energy_target: 6,
    },
  ],
  vibe_filter: ["sports", "happy_hour"],
  energy_range: [5, 9],
  price_range: ["$", "$$"],
  suggested_clusters: [
    "dc_chinatown",
    "va_clarendon",
    "dc_navy_yard",
    "va_ballston",
  ],
};

// ── Template 4: Girls Night Out ──────────────────────────────────

const GIRLS_NIGHT_OUT: HHItineraryTemplate = {
  id: "girls_night_out",
  label: "Girls Night Out",
  description:
    "Chic rooftops, wine bars, and photo-worthy spots. Curated for style, ambiance, and great group selfie lighting.",
  slots: [
    {
      role: "pre_game",
      label: "Golden Hour",
      description: "Rooftop or patio with great lighting — the photo op before drinks.",
      duration_min: 45,
      vibe_priority: ["girls_night", "rooftop", "patio"],
      energy_target: 5,
    },
    {
      role: "main_event",
      label: "The Main Sip",
      description: "Wine bar, cocktail lounge, or chic bistro with group-friendly seating.",
      duration_min: 90,
      vibe_priority: ["girls_night", "happy_hour", "trending"],
      energy_target: 7,
    },
    {
      role: "nightcap",
      label: "Last Call Glow",
      description: "Dessert spot or a low-key bar with candles and conversation.",
      duration_min: 45,
      vibe_priority: ["girls_night", "culture"],
      energy_target: 5,
    },
  ],
  vibe_filter: ["girls_night", "rooftop", "trending"],
  energy_range: [4, 8],
  price_range: ["$$", "$$$"],
  suggested_clusters: [
    "dc_navy_yard",
    "dc_wharf",
    "dc_14th_street",
    "md_bethesda",
  ],
};

// ── Template 5: Guys Night Out ───────────────────────────────────

const GUYS_NIGHT_OUT: HHItineraryTemplate = {
  id: "guys_night_out",
  label: "Guys Night Out",
  description:
    "Breweries, whiskey bars, and pool tables. No frills, strong pours, and a solid crew vibe from start to finish.",
  slots: [
    {
      role: "pre_game",
      label: "First Round",
      description: "Brewery taproom or dive bar with cheap drafts to set the tone.",
      duration_min: 45,
      vibe_priority: ["guys_night", "happy_hour"],
      energy_target: 5,
    },
    {
      role: "main_event",
      label: "The Spot",
      description: "Whiskey bar, pool hall, or beer garden — the place you'll remember.",
      duration_min: 90,
      vibe_priority: ["guys_night", "happy_hour", "sports"],
      energy_target: 8,
    },
    {
      role: "nightcap",
      label: "Closing Time",
      description: "Laid-back bar with late hours for one more round and tall tales.",
      duration_min: 45,
      vibe_priority: ["guys_night"],
      energy_target: 6,
    },
  ],
  vibe_filter: ["guys_night", "sports", "happy_hour"],
  energy_range: [5, 9],
  price_range: ["$", "$$"],
  suggested_clusters: [
    "dc_h_street",
    "va_clarendon",
    "dc_georgetown",
    "va_ballston",
  ],
};

// ── Template 6: Trending Hotspots ────────────────────────────────

const TRENDING_HOTSPOTS: HHItineraryTemplate = {
  id: "trending_hotspots",
  label: "Trending Hotspots",
  description:
    "Whatever's buzzing right now. High trend-score filter pulls the DMV's most talked-about openings, pop-ups, and viral spots into one crawl.",
  slots: [
    {
      role: "pre_game",
      label: "The Opener",
      description: "Start at the newest opening or pop-up everyone's posting about.",
      duration_min: 45,
      vibe_priority: ["trending", "happy_hour"],
      energy_target: 6,
    },
    {
      role: "main_event",
      label: "Peak Buzz",
      description: "Highest trend-score venue in the cluster — the one with the line.",
      duration_min: 90,
      vibe_priority: ["trending", "rooftop", "waterfront"],
      energy_target: 8,
    },
    {
      role: "nightcap",
      label: "Next Wave",
      description: "A rising spot before it blows up — early-adopter energy.",
      duration_min: 45,
      vibe_priority: ["trending", "culture"],
      energy_target: 6,
    },
  ],
  vibe_filter: ["trending", "rooftop", "waterfront"],
  energy_range: [5, 9],
  price_range: ["$$", "$$$", "$$$$"],
  suggested_clusters: [
    "dc_wharf",
    "dc_navy_yard",
    "dc_14th_street",
    "dc_u_street",
    "va_old_town",
  ],
};

// ── Exports ───────────────────────────────────────────────────────

export const HH_TEMPLATES: HHItineraryTemplate[] = [
  HAPPY_HOUR_CLASSIC,
  CULTURE_NIGHT,
  SPORTS_BAR_HOP,
  GIRLS_NIGHT_OUT,
  GUYS_NIGHT_OUT,
  TRENDING_HOTSPOTS,
];

export const HH_TEMPLATE_MAP: Record<string, HHItineraryTemplate> = Object.fromEntries(
  HH_TEMPLATES.map((t) => [t.id, t]),
);

/** Look up a template by id. Returns undefined when not found. */
export function getTemplate(id: string): HHItineraryTemplate | undefined {
  return HH_TEMPLATE_MAP[id];
}

/** Return all template ids. */
export function listTemplateIds(): string[] {
  return HH_TEMPLATES.map((t) => t.id);
}
