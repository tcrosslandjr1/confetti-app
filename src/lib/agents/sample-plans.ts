/**
 * Canonical sample plans for each occasion — used as fallback presets
 * by the PlanGenerator and as seed examples in the UI.
 */

export type OccasionId = "girls-night" | "guys-night" | "date-night" | "mixed-group";

export interface SamplePlanStop {
  label: string;
  anchorId: string;
}

export interface SamplePlan {
  occasion: OccasionId;
  title: string;
  stops: SamplePlanStop[];
}

export const SAMPLE_PLANS: Record<OccasionId, SamplePlan> = {
  "girls-night": {
    occasion: "girls-night",
    title: "Girls Night",
    stops: [
      { label: "Crab house",     anchorId: "seafood-crab" },
      { label: "Rooftop lounge", anchorId: "rooftop" },
      { label: "Hookah",         anchorId: "hookah-lounge" },
      { label: "Dessert",        anchorId: "dessert" },
    ],
  },
  "guys-night": {
    occasion: "guys-night",
    title: "Guys Night",
    stops: [
      { label: "Seafood boil", anchorId: "seafood-crab" },
      { label: "Casino night", anchorId: "casino-night" },
      { label: "Cigar lounge", anchorId: "cigar-lounge" },
    ],
  },
  "date-night": {
    occasion: "date-night",
    title: "Date Night",
    stops: [
      { label: "Seafood dinner",     anchorId: "seafood-crab" },
      { label: "Jazz lounge",        anchorId: "live-music" },
      { label: "Late-night dessert", anchorId: "dessert" },
    ],
  },
  "mixed-group": {
    occasion: "mixed-group",
    title: "Mixed Group",
    stops: [
      { label: "Crab house",    anchorId: "seafood-crab" },
      { label: "Karaoke",       anchorId: "karaoke" },
      { label: "Hookah lounge", anchorId: "hookah-lounge" },
    ],
  },
};

export const SAMPLE_PLAN_LIST: SamplePlan[] = Object.values(SAMPLE_PLANS);
