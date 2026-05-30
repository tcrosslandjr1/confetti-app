/**
 * Confetti venue anchor taxonomy — the canonical set of "anchor" venue
 * categories the PlanGenerator picks from when assembling a 2–4 stop plan.
 * Mirrors docs/agents/confetti-venue-anchors.md.
 */

export type AnchorCategory = "food" | "social" | "activity";

export interface VenueAnchor {
  id: string;
  label: string;
  category: AnchorCategory;
  /** Vibe tags this anchor naturally satisfies. */
  vibeTags: string[];
  /** Typical slot in the night (chill → active → late-night). */
  slot: "early" | "mid" | "late";
}

export const FOOD_ANCHORS: VenueAnchor[] = [
  {
    id: "seafood-crab",
    label: "Seafood / crab house",
    category: "food",
    vibeTags: ["foodie", "celebratory"],
    slot: "early",
  },
  {
    id: "steakhouse",
    label: "Steakhouse",
    category: "food",
    vibeTags: ["foodie", "date", "upscale"],
    slot: "early",
  },
  {
    id: "kbbq-hotpot",
    label: "KBBQ / hot pot",
    category: "food",
    vibeTags: ["foodie", "group", "shared"],
    slot: "early",
  },
  {
    id: "tacos-tapas",
    label: "Tacos / tapas",
    category: "food",
    vibeTags: ["foodie", "budget", "shared"],
    slot: "early",
  },
  {
    id: "soul-food",
    label: "Soul food",
    category: "food",
    vibeTags: ["foodie", "comfort"],
    slot: "early",
  },
  {
    id: "caribbean",
    label: "Caribbean food",
    category: "food",
    vibeTags: ["foodie", "turn-up"],
    slot: "early",
  },
  {
    id: "global-indian-me-african",
    label: "Indian / Middle Eastern / African",
    category: "food",
    vibeTags: ["foodie", "cultural"],
    slot: "early",
  },
  {
    id: "wings-bbq",
    label: "Wings / BBQ",
    category: "food",
    vibeTags: ["foodie", "group", "casual"],
    slot: "early",
  },
  {
    id: "sushi",
    label: "Sushi",
    category: "food",
    vibeTags: ["foodie", "date", "upscale"],
    slot: "early",
  },
  {
    id: "dessert",
    label: "Dessert",
    category: "food",
    vibeTags: ["date", "playful", "sweet"],
    slot: "late",
  },
  {
    id: "tea-house",
    label: "Tea house",
    category: "food",
    vibeTags: ["chill", "date"],
    slot: "late",
  },
];

export const SOCIAL_ANCHORS: VenueAnchor[] = [
  {
    id: "lounge",
    label: "Lounge",
    category: "social",
    vibeTags: ["chill", "date", "turn-up"],
    slot: "mid",
  },
  {
    id: "hookah-lounge",
    label: "Hookah lounge",
    category: "social",
    vibeTags: ["chill", "turn-up"],
    slot: "mid",
  },
  {
    id: "rooftop",
    label: "Rooftop",
    category: "social",
    vibeTags: ["date", "chill", "scenic"],
    slot: "mid",
  },
  {
    id: "karaoke",
    label: "Karaoke",
    category: "social",
    vibeTags: ["turn-up", "group", "playful"],
    slot: "mid",
  },
  {
    id: "comedy-show",
    label: "Comedy show",
    category: "social",
    vibeTags: ["date", "group", "playful"],
    slot: "mid",
  },
  {
    id: "live-music",
    label: "Live music",
    category: "social",
    vibeTags: ["artsy", "date", "turn-up"],
    slot: "mid",
  },
  {
    id: "dance-club",
    label: "Dance club",
    category: "social",
    vibeTags: ["turn-up"],
    slot: "late",
  },
  {
    id: "cigar-lounge",
    label: "Cigar lounge",
    category: "social",
    vibeTags: ["chill", "upscale"],
    slot: "late",
  },
  {
    id: "late-night-food",
    label: "Late-night food",
    category: "social",
    vibeTags: ["chill", "foodie"],
    slot: "late",
  },
  {
    id: "cocktail-bar",
    label: "Cocktail bar",
    category: "social",
    vibeTags: ["date", "chill", "upscale"],
    slot: "late",
  },
];

export const ACTIVITY_ANCHORS: VenueAnchor[] = [
  {
    id: "casino-night",
    label: "Casino night",
    category: "activity",
    vibeTags: ["competitive", "turn-up"],
    slot: "mid",
  },
  {
    id: "bowling",
    label: "Bowling",
    category: "activity",
    vibeTags: ["competitive", "group"],
    slot: "mid",
  },
  {
    id: "pool-hall",
    label: "Pool hall",
    category: "activity",
    vibeTags: ["competitive", "chill"],
    slot: "mid",
  },
  {
    id: "arcade-bar",
    label: "Arcade bar",
    category: "activity",
    vibeTags: ["competitive", "playful"],
    slot: "mid",
  },
  {
    id: "paint-and-sip",
    label: "Paint-and-sip",
    category: "activity",
    vibeTags: ["artsy", "date", "chill"],
    slot: "early",
  },
  {
    id: "go-karts",
    label: "Go-karts",
    category: "activity",
    vibeTags: ["competitive", "turn-up"],
    slot: "mid",
  },
  {
    id: "game-night",
    label: "Game night",
    category: "activity",
    vibeTags: ["chill", "group", "playful"],
    slot: "mid",
  },
  {
    id: "darts",
    label: "Darts",
    category: "activity",
    vibeTags: ["competitive", "chill"],
    slot: "mid",
  },
  {
    id: "sports-bar",
    label: "Sports bar",
    category: "activity",
    vibeTags: ["competitive", "group", "casual"],
    slot: "mid",
  },
  {
    id: "scenic-walk",
    label: "Scenic walk",
    category: "activity",
    vibeTags: ["date", "chill", "scenic"],
    slot: "late",
  },
];

export const VENUE_ANCHORS: VenueAnchor[] = [
  ...FOOD_ANCHORS,
  ...SOCIAL_ANCHORS,
  ...ACTIVITY_ANCHORS,
];

export const VENUE_ANCHORS_BY_CATEGORY: Record<AnchorCategory, VenueAnchor[]> = {
  food: FOOD_ANCHORS,
  social: SOCIAL_ANCHORS,
  activity: ACTIVITY_ANCHORS,
};
