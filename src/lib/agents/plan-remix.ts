/**
 * Plan remix lineage — every plan keeps a pointer to its parent so we can
 * render remix trees. Mirrors docs/agents/confetti-plan-remix.md.
 */

export interface PlanStop {
  kind: "food" | "activity" | "dessert" | "late-night" | "music";
  label: string;
  venueId?: string;
}

export interface Plan {
  id: string;
  authorId: string;
  city: string;
  occasion: string;
  vibe: string;
  stops: PlanStop[];
  /** null for original plans; set to parent plan id for remixes. */
  remixOfId: string | null;
  /** Depth in the remix tree (0 = original). */
  remixDepth: number;
  createdAt: string;
}

/** Example tree referenced in the discovery/feed surfaces. */
export const EXAMPLE_REMIX_TREE: Plan[] = [
  {
    id: "p-1",
    authorId: "u-a",
    city: "NYC",
    occasion: "girls-night",
    vibe: "turn-up",
    remixOfId: null,
    remixDepth: 0,
    createdAt: "",
    stops: [
      { kind: "food", label: "KBBQ" },
      { kind: "activity", label: "Karaoke" },
      { kind: "dessert", label: "Boba" },
    ],
  },
  {
    id: "p-2",
    authorId: "u-b",
    city: "NYC",
    occasion: "girls-night",
    vibe: "turn-up",
    remixOfId: "p-1",
    remixDepth: 1,
    createdAt: "",
    stops: [
      { kind: "food", label: "Hot pot" },
      { kind: "activity", label: "Arcade bar" },
      { kind: "dessert", label: "Matcha dessert" },
    ],
  },
  {
    id: "p-3",
    authorId: "u-c",
    city: "NYC",
    occasion: "girls-night",
    vibe: "turn-up",
    remixOfId: "p-1",
    remixDepth: 1,
    createdAt: "",
    stops: [
      { kind: "food", label: "Filipino dinner" },
      { kind: "activity", label: "Karaoke" },
      { kind: "late-night", label: "Late-night bakery" },
    ],
  },
];
