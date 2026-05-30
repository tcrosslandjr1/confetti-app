// Confetti — LGBTQ+ Surprise Me Idea Library
// 50+ activity templates for queer users, organized by sub-category.
// Each idea maps to existing outing-categories.ts IDs and vibes.

export type SurpriseIdea = {
  id: string;
  title: string;
  bestFor: string[]; // category IDs from outing-categories.ts
  vibe: string[];
  budget: 1 | 2 | 3 | 4;
  timeNeeded: string;
  indoorOutdoor: "indoor" | "outdoor" | "both";
  weatherFit: "any" | "nice_weather" | "rain_ok";
  nearWater: boolean;
  energyLevel: "low" | "medium" | "high";
  surpriseLevel: "low" | "medium" | "high";
  bookingNeeded: boolean;
  suggestedSequence: string[];
  upgradeIdea: string;
};

// ── QUEER DATE NIGHT ─────────────────────────────────────────────
const QUEER_DATE: SurpriseIdea[] = [
  {
    id: "speakeasy_vinyl",
    title: "Speakeasy & Vinyl Night",
    bestFor: ["queer_date", "chosen_family_night"],
    vibe: ["romantic", "chill"],
    budget: 2,
    timeNeeded: "2.5 hours",
    indoorOutdoor: "indoor",
    weatherFit: "any",
    nearWater: false,
    energyLevel: "low",
    surpriseLevel: "medium",
    bookingNeeded: false,
    suggestedSequence: [
      "Cocktails at queer-friendly speakeasy",
      "Browse vinyl at record shop",
      "Dessert at a late-night cafe",
    ],
    upgradeIdea: "Add a rooftop nightcap with a skyline view",
  },
  {
    id: "bookstore_to_wine",
    title: "Bookstore Date → Wine Bar",
    bestFor: ["queer_date", "solo_night"],
    vibe: ["chill", "romantic", "soft_life"],
    budget: 2,
    timeNeeded: "2 hours",
    indoorOutdoor: "indoor",
    weatherFit: "any",
    nearWater: false,
    energyLevel: "low",
    surpriseLevel: "low",
    bookingNeeded: false,
    suggestedSequence: [
      "Pick books for each other at queer bookstore",
      "Read together at wine bar",
      "Walk home sharing favorite passages",
    ],
    upgradeIdea: "Choose a queer-owned bookstore with events calendar",
  },
  {
    id: "sunset_picnic_pride",
    title: "Rainbow Sunset Picnic",
    bestFor: ["queer_date"],
    vibe: ["romantic", "chill"],
    budget: 1,
    timeNeeded: "2 hours",
    indoorOutdoor: "outdoor",
    weatherFit: "nice_weather",
    nearWater: true,
    energyLevel: "low",
    surpriseLevel: "medium",
    bookingNeeded: false,
    suggestedSequence: [
      "Pack picnic with rainbow-themed snacks",
      "Sunset spot by water",
      "Playlist of queer artists",
    ],
    upgradeIdea: "Hire a local queer photographer for candid shots",
  },
  {
    id: "cooking_class_together",
    title: "Couples Cooking Class",
    bestFor: ["queer_date", "chosen_family_night"],
    vibe: ["chill", "social"],
    budget: 3,
    timeNeeded: "2.5 hours",
    indoorOutdoor: "indoor",
    weatherFit: "any",
    nearWater: false,
    energyLevel: "medium",
    surpriseLevel: "low",
    bookingNeeded: true,
    suggestedSequence: [
      "LGBTQ-friendly cooking class",
      "Eat what you made together",
      "Dessert cocktail nearby",
    ],
    upgradeIdea: "Choose a queer-owned restaurant that hosts classes",
  },
  {
    id: "art_gallery_cocktails",
    title: "Art Walk & Craft Cocktails",
    bestFor: ["queer_date", "sapphic_night"],
    vibe: ["instagrammy", "chill", "classy"],
    budget: 2,
    timeNeeded: "3 hours",
    indoorOutdoor: "both",
    weatherFit: "any",
    nearWater: false,
    energyLevel: "low",
    surpriseLevel: "medium",
    bookingNeeded: false,
    suggestedSequence: [
      "Queer artist gallery opening",
      "Cocktail bar with art theme",
      "Photo stop at mural",
    ],
    upgradeIdea: "Buy a small piece from a queer local artist",
  },
];

// ── PRIDE NIGHT OUT ──────────────────────────────────────────────
const PRIDE_NIGHT: SurpriseIdea[] = [
  {
    id: "drag_pregame_dance",
    title: "Drag Show → Dance Floor",
    bestFor: ["pride_night", "drag_brunch"],
    vibe: ["turn_up", "instagrammy", "wild"],
    budget: 2,
    timeNeeded: "4 hours",
    indoorOutdoor: "indoor",
    weatherFit: "any",
    nearWater: false,
    energyLevel: "high",
    surpriseLevel: "high",
    bookingNeeded: true,
    suggestedSequence: ["Pregame cocktails", "Drag performance", "Late-night queer dance club"],
    upgradeIdea: "VIP section or meet-the-performers",
  },
  {
    id: "pride_bar_crawl",
    title: "Rainbow Bar Crawl",
    bestFor: ["pride_night", "chosen_family_night"],
    vibe: ["turn_up", "social"],
    budget: 2,
    timeNeeded: "4 hours",
    indoorOutdoor: "indoor",
    weatherFit: "any",
    nearWater: false,
    energyLevel: "high",
    surpriseLevel: "medium",
    bookingNeeded: false,
    suggestedSequence: [
      "Start at classic queer bar",
      "Move to cocktail lounge",
      "End at dance floor",
      "Late-night food stop",
    ],
    upgradeIdea: "Color-coded outfit for each bar",
  },
  {
    id: "pride_rooftop_vibes",
    title: "Rooftop Pride Vibes",
    bestFor: ["pride_night"],
    vibe: ["instagrammy", "turn_up"],
    budget: 3,
    timeNeeded: "3 hours",
    indoorOutdoor: "outdoor",
    weatherFit: "nice_weather",
    nearWater: false,
    energyLevel: "medium",
    surpriseLevel: "medium",
    bookingNeeded: true,
    suggestedSequence: [
      "Queer rooftop happy hour",
      "Photo moment at sunset",
      "DJ set or live music below",
    ],
    upgradeIdea: "Book a private cabana with a group",
  },
  {
    id: "karaoke_queens",
    title: "Karaoke Queens Night",
    bestFor: ["pride_night", "chosen_family_night"],
    vibe: ["social", "turn_up", "wild"],
    budget: 2,
    timeNeeded: "3 hours",
    indoorOutdoor: "indoor",
    weatherFit: "any",
    nearWater: false,
    energyLevel: "high",
    surpriseLevel: "medium",
    bookingNeeded: false,
    suggestedSequence: [
      "Dinner at queer-friendly spot",
      "Private karaoke room",
      "Late-night ice cream or tacos",
    ],
    upgradeIdea: "Theme it: divas only, or decade challenge",
  },
  {
    id: "queer_pool_day",
    title: "Queer Pool Party Day",
    bestFor: ["pride_night"],
    vibe: ["day_party", "instagrammy", "wild"],
    budget: 3,
    timeNeeded: "5 hours",
    indoorOutdoor: "outdoor",
    weatherFit: "nice_weather",
    nearWater: true,
    energyLevel: "high",
    surpriseLevel: "high",
    bookingNeeded: true,
    suggestedSequence: ["Brunch pregame", "LGBTQ+ pool party event", "Sunset cooldown at lounge"],
    upgradeIdea: "Cabana reservation with bottle service",
  },
];

// ── CHOSEN FAMILY ────────────────────────────────────────────────
const CHOSEN_FAMILY: SurpriseIdea[] = [
  {
    id: "potluck_game_night",
    title: "Potluck & Game Night",
    bestFor: ["chosen_family_night"],
    vibe: ["chill", "social"],
    budget: 1,
    timeNeeded: "3 hours",
    indoorOutdoor: "indoor",
    weatherFit: "any",
    nearWater: false,
    energyLevel: "low",
    surpriseLevel: "low",
    bookingNeeded: false,
    suggestedSequence: [
      "Everyone brings a dish",
      "Board games or card games",
      "Late-night dessert round",
    ],
    upgradeIdea: "Add a queer movie screening",
  },
  {
    id: "brewery_trivia",
    title: "Queer Trivia at a Brewery",
    bestFor: ["chosen_family_night", "queer_comedy"],
    vibe: ["social", "chill"],
    budget: 2,
    timeNeeded: "2.5 hours",
    indoorOutdoor: "indoor",
    weatherFit: "any",
    nearWater: false,
    energyLevel: "medium",
    surpriseLevel: "low",
    bookingNeeded: false,
    suggestedSequence: [
      "Arrive early for flight tasting",
      "LGBTQ+ themed trivia",
      "Winner picks late-night snack spot",
    ],
    upgradeIdea: "Team costumes or themed team names",
  },
  {
    id: "spa_day_squad",
    title: "Spa Day with the Squad",
    bestFor: ["chosen_family_night", "queer_wellness"],
    vibe: ["soft_life", "chill"],
    budget: 3,
    timeNeeded: "3 hours",
    indoorOutdoor: "indoor",
    weatherFit: "any",
    nearWater: false,
    energyLevel: "low",
    surpriseLevel: "low",
    bookingNeeded: true,
    suggestedSequence: ["Group spa treatment", "Tea lounge cooldown", "Light lunch together"],
    upgradeIdea: "Choose an LGBTQ+-owned spa or bathhouse",
  },
  {
    id: "thrift_challenge",
    title: "Thrift Store Challenge",
    bestFor: ["chosen_family_night"],
    vibe: ["social", "instagrammy"],
    budget: 1,
    timeNeeded: "3 hours",
    indoorOutdoor: "indoor",
    weatherFit: "any",
    nearWater: false,
    energyLevel: "medium",
    surpriseLevel: "high",
    bookingNeeded: false,
    suggestedSequence: [
      "$20 budget per person",
      "Style each other's outfits",
      "Runway reveal at dinner",
    ],
    upgradeIdea: "Wear the outfits to a queer bar after",
  },
  {
    id: "community_volunteer",
    title: "Community Volunteer + Brunch",
    bestFor: ["chosen_family_night"],
    vibe: ["social", "chill"],
    budget: 1,
    timeNeeded: "4 hours",
    indoorOutdoor: "both",
    weatherFit: "any",
    nearWater: false,
    energyLevel: "medium",
    surpriseLevel: "low",
    bookingNeeded: true,
    suggestedSequence: ["LGBTQ+ center volunteer shift", "Group brunch reward", "Reflection walk"],
    upgradeIdea: "Make it a monthly ritual",
  },
];

// ── BALLROOM / PERFORMANCE ───���───────────────────────────────────
const BALLROOM: SurpriseIdea[] = [
  {
    id: "ballroom_night_out",
    title: "Ballroom Night",
    bestFor: ["ballroom_night", "pride_night"],
    vibe: ["turn_up", "live_music", "wild"],
    budget: 2,
    timeNeeded: "4 hours",
    indoorOutdoor: "indoor",
    weatherFit: "any",
    nearWater: false,
    energyLevel: "high",
    surpriseLevel: "high",
    bookingNeeded: true,
    suggestedSequence: [
      "Dinner pregame",
      "Ballroom event / vogue night",
      "Late-night food debrief",
    ],
    upgradeIdea: "Enter a category and walk",
  },
  {
    id: "queer_open_mic",
    title: "Queer Open Mic Night",
    bestFor: ["queer_comedy", "chosen_family_night"],
    vibe: ["social", "chill", "live_music"],
    budget: 1,
    timeNeeded: "2.5 hours",
    indoorOutdoor: "indoor",
    weatherFit: "any",
    nearWater: false,
    energyLevel: "medium",
    surpriseLevel: "medium",
    bookingNeeded: false,
    suggestedSequence: [
      "Coffee or cocktails at venue",
      "Open mic performances",
      "Debrief over late bites",
    ],
    upgradeIdea: "Sign up and perform yourself",
  },
  {
    id: "drag_competition",
    title: "Drag Competition Night",
    bestFor: ["drag_brunch", "pride_night", "ballroom_night"],
    vibe: ["turn_up", "instagrammy", "live_music"],
    budget: 2,
    timeNeeded: "3 hours",
    indoorOutdoor: "indoor",
    weatherFit: "any",
    nearWater: false,
    energyLevel: "high",
    surpriseLevel: "high",
    bookingNeeded: true,
    suggestedSequence: [
      "Pre-show drinks",
      "Live drag competition",
      "Tips and photos with performers",
    ],
    upgradeIdea: "Get a table near the stage",
  },
];

// ── SAPPHIC / QUEER WOMEN ────────────────────────────────────────
const SAPPHIC: SurpriseIdea[] = [
  {
    id: "sapphic_wine_night",
    title: "Sapphic Wine & Cheese Night",
    bestFor: ["sapphic_night", "queer_date"],
    vibe: ["romantic", "soft_life", "chill"],
    budget: 2,
    timeNeeded: "2 hours",
    indoorOutdoor: "indoor",
    weatherFit: "any",
    nearWater: false,
    energyLevel: "low",
    surpriseLevel: "low",
    bookingNeeded: false,
    suggestedSequence: [
      "Curated wine flight",
      "Cheese board + conversation",
      "Bookshop browse after",
    ],
    upgradeIdea: "Women-owned winery tasting",
  },
  {
    id: "sapphic_hiking_brunch",
    title: "Sunrise Hike → Brunch",
    bestFor: ["sapphic_night", "queer_date"],
    vibe: ["chill", "adventurous"],
    budget: 2,
    timeNeeded: "4 hours",
    indoorOutdoor: "outdoor",
    weatherFit: "nice_weather",
    nearWater: false,
    energyLevel: "medium",
    surpriseLevel: "medium",
    bookingNeeded: false,
    suggestedSequence: [
      "Early morning trail",
      "Photo at summit",
      "Reward brunch at queer-friendly spot",
    ],
    upgradeIdea: "Pack matching thermoses with coffee",
  },
  {
    id: "sapphic_dance_night",
    title: "Women's Dance Night",
    bestFor: ["sapphic_night", "pride_night"],
    vibe: ["turn_up", "social"],
    budget: 2,
    timeNeeded: "4 hours",
    indoorOutdoor: "indoor",
    weatherFit: "any",
    nearWater: false,
    energyLevel: "high",
    surpriseLevel: "medium",
    bookingNeeded: false,
    suggestedSequence: [
      "Cocktails at women-owned bar",
      "Sapphic dance party",
      "Late-night diner debrief",
    ],
    upgradeIdea: "Get a group together and match outfits",
  },
];

// ── TRANS-AFFIRMING ──────────────────────────────────────────────
const TRANS_AFFIRMING: SurpriseIdea[] = [
  {
    id: "trans_chill_night",
    title: "Low-Key Safe Space Night",
    bestFor: ["trans_safe_night", "chosen_family_night"],
    vibe: ["chill", "soft_life"],
    budget: 2,
    timeNeeded: "2.5 hours",
    indoorOutdoor: "indoor",
    weatherFit: "any",
    nearWater: false,
    energyLevel: "low",
    surpriseLevel: "low",
    bookingNeeded: false,
    suggestedSequence: [
      "Dinner at verified trans-friendly restaurant",
      "Bookstore or cafe hang",
      "Optional dessert walk",
    ],
    upgradeIdea: "Find a trans-owned business to support",
  },
  {
    id: "trans_creative_night",
    title: "Creative Workshop Night",
    bestFor: ["trans_safe_night"],
    vibe: ["chill", "social"],
    budget: 2,
    timeNeeded: "2.5 hours",
    indoorOutdoor: "indoor",
    weatherFit: "any",
    nearWater: false,
    energyLevel: "low",
    surpriseLevel: "medium",
    bookingNeeded: true,
    suggestedSequence: [
      "Pottery / art class at inclusive studio",
      "Tea or coffee after",
      "Small gallery visit",
    ],
    upgradeIdea: "Attend a trans artist pop-up event",
  },
];

// ── EXPORT ALL ───���───────────────────────────────────────────────
export const LGBTQ_SURPRISE_IDEAS: SurpriseIdea[] = [
  ...QUEER_DATE,
  ...PRIDE_NIGHT,
  ...CHOSEN_FAMILY,
  ...BALLROOM,
  ...SAPPHIC,
  ...TRANS_AFFIRMING,
];

/** Filter ideas by category ID or vibe tag. */
export function findIdeasForCategory(categoryId: string): SurpriseIdea[] {
  return LGBTQ_SURPRISE_IDEAS.filter((idea) => idea.bestFor.includes(categoryId));
}

export function findIdeasForVibe(vibe: string): SurpriseIdea[] {
  return LGBTQ_SURPRISE_IDEAS.filter((idea) => idea.vibe.includes(vibe));
}

export function findIdeasByBudget(tier: 1 | 2 | 3 | 4): SurpriseIdea[] {
  return LGBTQ_SURPRISE_IDEAS.filter((idea) => idea.budget <= tier);
}

export function findIdeasByEnergy(level: "low" | "medium" | "high"): SurpriseIdea[] {
  return LGBTQ_SURPRISE_IDEAS.filter((idea) => idea.energyLevel === level);
}
