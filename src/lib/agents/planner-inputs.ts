/**
 * Canonical Confetti planner inputs. Every plan request must resolve these
 * 9 fields (some optional) before hitting the PlanGenerator.
 * Mirrors docs/agents/confetti-planner-inputs.md.
 */

export type GroupCultureType = "shared" | "mixed" | "open";
export type Vibe = "chill" | "romantic" | "turn-up" | "foodie" | "competitive" | "artsy" | "budget";
export type Occasion = "girls-night" | "guys-night" | "date-night" | "group-hangout";

export interface BudgetRange {
  /** per person, USD */
  min: number;
  max: number;
  tier: "$" | "$$" | "$$$" | "$$$$";
}

export interface AgeRange {
  min: number;
  max: number;
}

export interface SafetyPreferences {
  /** must be well-lit / public transit accessible */
  wellLit?: boolean;
  /** wheelchair / step-free */
  accessible?: boolean;
  /** women-friendly venues prioritized */
  womenFriendly?: boolean;
  /** alcohol-free option required */
  soberFriendly?: boolean;
  /** avoid venues with recent incident reports */
  avoidIncidentVenues?: boolean;
  /** prefer rideshare drop-off zones */
  rideshareSafe?: boolean;
}

export interface PlannerInputs {
  /** Required */
  city: string;
  occasion: Occasion;
  /** Cultural framework toggle. Default "open" when unclear. */
  cultureType: GroupCultureType;
  /** Specific cultural anchors when cultureType !== "open" (e.g. ["nigerian", "korean"]) */
  culturalAnchors?: string[];
  budget: BudgetRange;
  groupSize: number;

  /** Optional but strongly recommended */
  vibe?: Vibe;
  musicTaste?: string[]; // e.g. ["afrobeats", "house", "hip-hop"]
  foodPreferences?: {
    cuisines?: string[];
    dietary?: ("vegetarian" | "vegan" | "halal" | "kosher" | "gluten-free" | "nut-free")[];
    avoid?: string[];
  };
  ageRange?: AgeRange;
  safety?: SafetyPreferences;
}

/** Defaults applied when fields are missing. */
export const PLANNER_DEFAULTS = {
  cultureType: "open" as GroupCultureType,
  vibeByOccasion: {
    "date-night": "romantic",
    "girls-night": "turn-up",
    "guys-night": "turn-up",
    "group-hangout": "chill",
  } satisfies Record<Occasion, Vibe>,
  budget: { min: 25, max: 75, tier: "$$" } satisfies BudgetRange,
  safety: {
    wellLit: true,
    rideshareSafe: true,
  } satisfies SafetyPreferences,
};
