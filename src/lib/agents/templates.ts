// Template Agent — occasion blueprints. Each template defines structure, tone,
// constraints, and naming pattern. The Itinerary Agent picks one based on the
// occasion (and falls back to a generic blueprint).

export type StopRole = {
  /** Slot name shown in the prompt + UI */
  slot: string;
  /** Plain-English description of what should fill this slot */
  description: string;
  /** Hint about the kind of category we expect (e.g. "small plates", "lounge") */
  categoryHints: string[];
  /** Suggested duration in minutes */
  durationMin: number;
};

export type OccasionTemplate = {
  /** Matches /create OCCASIONS[].id (or "generic") */
  occasionId: string;
  /** Branded blueprint name */
  blueprintName: string;
  /** Short description for the model */
  description: string;
  /** Tone hint passed to the Naming agent */
  tone: string;
  /** Ordered stops — model must produce roughly this many in this order */
  structure: StopRole[];
  /** Hard constraints */
  constraints: {
    maxNoise: "quiet" | "moderate" | "loud";
    priceCeiling: 1 | 2 | 3 | 4;
    accessibility?: "wheelchair-friendly" | "casual" | "any";
    chaos: "low" | "medium" | "high";
    avoidCategories?: string[];
  };
  /** Name patterns the Naming Agent should riff on */
  namePatterns: string[];
};

export const TEMPLATES: OccasionTemplate[] = [
  {
    occasionId: "girls",
    blueprintName: "Glitter & Giggles",
    description: "Photo-worthy pre-game, lively main, late dessert/bites, optional photo stop.",
    tone: "playful, sparkly, hype-girl energy",
    structure: [
      {
        slot: "Pre-game",
        description: "Cute cocktail bar with photo-worthy drinks",
        categoryHints: ["cocktail bar", "wine bar", "rooftop"],
        durationMin: 75,
      },
      {
        slot: "Main",
        description: "Lively spot with music, dancing, or high-energy lounge",
        categoryHints: ["lounge", "dance club", "live music"],
        durationMin: 120,
      },
      {
        slot: "Late",
        description: "Late-night dessert or bites",
        categoryHints: ["dessert", "late-night café", "bakery"],
        durationMin: 45,
      },
    ],
    constraints: { maxNoise: "loud", priceCeiling: 3, chaos: "high" },
    namePatterns: ["{vibe} & {twist}", "{neighborhood} {sparkle}", "{adjective} Hour"],
  },
  {
    occasionId: "guys",
    blueprintName: "High Stakes & High Spirits",
    description: "Sports/whiskey pre-game, casino/game/arcade main, casual late food.",
    tone: "loose, confident, low-cringe bro energy",
    structure: [
      {
        slot: "Pre-game",
        description: "Sports bar, whiskey bar, or beer hall",
        categoryHints: ["sports bar", "whiskey bar", "beer hall"],
        durationMin: 75,
      },
      {
        slot: "Main",
        description: "Casino, arcade bar, axe throwing, or game-night spot",
        categoryHints: ["casino", "arcade bar", "game lounge", "billiards"],
        durationMin: 120,
      },
      {
        slot: "Late",
        description: "Casual food — wings, burgers, tacos",
        categoryHints: ["wings", "burgers", "tacos", "late-night diner"],
        durationMin: 60,
      },
    ],
    constraints: { maxNoise: "loud", priceCeiling: 3, chaos: "high" },
    namePatterns: ["{stakes} & {spirits}", "From {pre} to {late}"],
  },
  {
    occasionId: "date",
    blueprintName: "Slow Burn",
    description: "Scenic pre, intimate dinner, romantic nightcap.",
    tone: "warm, cinematic, low-key",
    structure: [
      {
        slot: "Pre",
        description: "Scenic walk, viewpoint, or wine flight",
        categoryHints: ["wine bar", "scenic walk", "rooftop view"],
        durationMin: 60,
      },
      {
        slot: "Dinner",
        description: "Intimate, well-reviewed restaurant — quiet enough to talk",
        categoryHints: ["intimate restaurant", "small plates", "tasting menu"],
        durationMin: 105,
      },
      {
        slot: "Nightcap",
        description: "Speakeasy, jazz bar, or dessert lounge",
        categoryHints: ["speakeasy", "jazz bar", "dessert lounge"],
        durationMin: 60,
      },
    ],
    constraints: { maxNoise: "moderate", priceCeiling: 4, chaos: "low" },
    namePatterns: ["{place} & {time}", "{romantic} Edition", "Two-Top {twist}"],
  },
  {
    occasionId: "fam",
    blueprintName: "Charm Offensive",
    description: "Scenic walk, safe well-reviewed dinner, calm dessert.",
    tone: "warm, safe, easy-to-love",
    structure: [
      {
        slot: "Pre",
        description: "Scenic walk, waterfront, viewpoint, or coffee stop",
        categoryHints: ["scenic walk", "waterfront", "café"],
        durationMin: 45,
      },
      {
        slot: "Dinner",
        description: "Safe, well-reviewed restaurant — quiet enough to talk",
        categoryHints: ["family restaurant", "italian", "steakhouse"],
        durationMin: 90,
      },
      {
        slot: "Dessert",
        description: "Calm dessert café or quiet cocktail lounge",
        categoryHints: ["dessert café", "quiet lounge", "wine bar"],
        durationMin: 45,
      },
    ],
    constraints: {
      maxNoise: "quiet",
      priceCeiling: 3,
      accessibility: "wheelchair-friendly",
      chaos: "low",
      avoidCategories: ["dive bar", "club", "casino", "speakeasy"],
    },
    namePatterns: ["{relation}, Zero Stress Edition", "{neighborhood} Charm"],
  },
  {
    occasionId: "biz",
    blueprintName: "Team Cheers",
    description: "Easy meetup bar, group-friendly dinner with reservations, optional low-key after.",
    tone: "polished, inclusive, no-cringe",
    structure: [
      {
        slot: "Meetup",
        description: "Easy meetup bar near office or hotel",
        categoryHints: ["wine bar", "hotel bar", "cocktail lounge"],
        durationMin: 60,
      },
      {
        slot: "Dinner",
        description: "Group-friendly dinner with shared plates and reservations",
        categoryHints: ["shared plates", "group dining", "steakhouse"],
        durationMin: 105,
      },
      {
        slot: "After",
        description: "Optional low-key spot — no wild club vibes",
        categoryHints: ["quiet lounge", "wine bar", "speakeasy"],
        durationMin: 45,
      },
    ],
    constraints: {
      maxNoise: "moderate",
      priceCeiling: 4,
      chaos: "low",
      avoidCategories: ["club", "dive bar", "casino"],
    },
    namePatterns: ["Boardroom to {place}", "{team} Cheers"],
  },
  {
    occasionId: "bday",
    blueprintName: "Cake & Confetti",
    description: "Hype pre-game, signature dinner with a wow moment, dessert/late stop.",
    tone: "celebratory, generous, big-hug energy",
    structure: [
      {
        slot: "Pre-game",
        description: "Hype cocktail bar with a signature drink",
        categoryHints: ["cocktail bar", "rooftop", "lounge"],
        durationMin: 60,
      },
      {
        slot: "Dinner",
        description: "Signature dinner — a place that makes the night feel special",
        categoryHints: ["chef's tasting", "shared plates", "steakhouse"],
        durationMin: 105,
      },
      {
        slot: "Late",
        description: "Dessert spot or late-night dance floor",
        categoryHints: ["dessert", "dance club", "late-night café"],
        durationMin: 60,
      },
    ],
    constraints: { maxNoise: "loud", priceCeiling: 4, chaos: "medium" },
    namePatterns: ["{name}'s {twist}", "{age} & {fab}"],
  },
  {
    occasionId: "just",
    blueprintName: "Wildcard Night",
    description: "Three on-vibe stops with one unexpected twist.",
    tone: "curious, spontaneous, slightly mischievous",
    structure: [
      {
        slot: "Opener",
        description: "Easy on-vibe opener",
        categoryHints: ["wine bar", "cocktail bar", "café"],
        durationMin: 60,
      },
      {
        slot: "Anchor",
        description: "Anchor stop with personality",
        categoryHints: ["small plates", "lounge", "live music"],
        durationMin: 105,
      },
      {
        slot: "Twist",
        description: "Unexpected on-vibe finale",
        categoryHints: ["arcade bar", "speakeasy", "dessert", "rooftop"],
        durationMin: 60,
      },
    ],
    constraints: { maxNoise: "loud", priceCeiling: 3, chaos: "medium" },
    namePatterns: ["{adjective} Detour", "{neighborhood} Wildcard"],
  },
];

export function findTemplate(occasionId?: string | null): OccasionTemplate {
  if (!occasionId) return TEMPLATES.find((t) => t.occasionId === "just")!;
  return (
    TEMPLATES.find((t) => t.occasionId === occasionId.toLowerCase()) ??
    TEMPLATES.find((t) => t.occasionId === "just")!
  );
}
