/**
 * Canonical Girls Night plan template — 4-stop flow following the
 * chill → active → late-night vibe progression.
 * Mirrors docs/agents/confetti-girls-night-template.md.
 */

import type { AnchorCategory } from "./venue-anchors";

export interface TemplateStop {
  slot: "dinner" | "photos" | "social" | "late-night";
  label: string;
  category: AnchorCategory | "moment";
  /** Anchor ids from venue-anchors.ts; "moment" stops have no anchor pool. */
  anchorOptions: string[];
}

export const GIRLS_NIGHT_TEMPLATE: TemplateStop[] = [
  {
    slot: "dinner",
    label: "Shareable dinner",
    category: "food",
    anchorOptions: [
      "seafood-crab",
      "tacos-tapas",
      "kbbq-hotpot",
      "caribbean",
      "soul-food",
      "global-indian-me-african",
    ],
  },
  {
    slot: "photos",
    label: "Fit check + photos",
    category: "moment",
    anchorOptions: [],
  },
  {
    slot: "social",
    label: "Lounge, hookah, karaoke, or dancing",
    category: "social",
    anchorOptions: ["lounge", "hookah-lounge", "karaoke", "dance-club"],
  },
  {
    slot: "late-night",
    label: "Dessert or late-night bites",
    category: "food",
    anchorOptions: ["dessert", "late-night-bites"],
  },
];
