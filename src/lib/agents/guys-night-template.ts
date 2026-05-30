/**
 * Canonical Guys Night plan template — 3-stop flow:
 *   food → competitive activity → late-night social
 * Mirrors docs/agents/confetti-guys-night-template.md.
 */

import type { AnchorCategory } from "./venue-anchors";

export interface TemplateStop {
  slot: "dinner" | "activity" | "late-night";
  label: string;
  category: AnchorCategory;
  /** Anchor ids from venue-anchors.ts. */
  anchorOptions: string[];
}

export const GUYS_NIGHT_TEMPLATE: TemplateStop[] = [
  {
    slot: "dinner",
    label: "Seafood / steak / wings / BBQ",
    category: "food",
    anchorOptions: ["seafood-crab", "steakhouse", "wings-bbq", "kbbq-hotpot"],
  },
  {
    slot: "activity",
    label: "Competitive activity",
    category: "activity",
    anchorOptions: ["casino-night", "pool-hall", "darts", "bowling", "sports-bar"],
  },
  {
    slot: "late-night",
    label: "Hookah, cigar lounge, comedy show, or late-night food",
    category: "social",
    anchorOptions: ["hookah-lounge", "cigar-lounge", "comedy-show", "late-night-food"],
  },
];
