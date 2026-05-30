/**
 * End-to-end demo scenario: Maya plans a multiracial girls night in DC,
 * shares it, friends vote-swap a stop, and another user remixes it for ATL.
 *
 * Wires together: planner-inputs → plan → group-vote swap → remix lineage.
 * Mirrors docs/agents/confetti-scenario-maya-dc.md.
 */

import type { PlannerInputs } from "./planner-inputs";
import type { Plan, PlanStop } from "./plan-remix";

export interface VoteSwap {
  planId: string;
  fromStopIndex: number;
  fromLabel: string;
  toLabel: string;
  votes: number;
  threshold: number;
  appliedAt: string | null;
}

export const MAYA_INPUTS: PlannerInputs = {
  city: "Washington, DC",
  occasion: "girls-night",
  cultureType: "mixed",
  culturalAnchors: ["caribbean", "latin", "west-african"],
  budget: { min: 40, max: 80, tier: "$$" },
  groupSize: 4,
  vibe: "turn-up",
  musicTaste: ["afrobeats", "rnb", "reggaeton"],
  foodPreferences: { cuisines: ["caribbean", "latin"] },
  ageRange: { min: 21, max: 32 },
  safety: {
    wellLit: true,
    womenFriendly: true,
    rideshareSafe: true,
  },
};

const MAYA_STOPS: PlanStop[] = [
  { kind: "food", label: "Caribbean-Latin dinner" },
  { kind: "activity", label: "Fit check / photo stop" },
  { kind: "music", label: "Afrobeats + reggaeton lounge" },
  { kind: "dessert", label: "Late-night dessert" },
];

export const MAYA_PLAN: Plan = {
  id: "p-maya-dc-1",
  authorId: "u-maya",
  city: "Washington, DC",
  occasion: "girls-night",
  vibe: "foodie+turn-up",
  stops: MAYA_STOPS,
  remixOfId: null,
  remixDepth: 0,
  createdAt: "",
};

/** Two friends vote to swap the lounge for karaoke; threshold = 2. */
export const MAYA_VOTE_SWAP: VoteSwap = {
  planId: MAYA_PLAN.id,
  fromStopIndex: 2,
  fromLabel: "Afrobeats + reggaeton lounge",
  toLabel: "Afrobeats karaoke room",
  votes: 2,
  threshold: 2,
  appliedAt: "",
};

/** Resulting plan after the group vote applies. */
export const MAYA_PLAN_AFTER_VOTE: Plan = {
  ...MAYA_PLAN,
  stops: MAYA_STOPS.map((s, i) =>
    i === MAYA_VOTE_SWAP.fromStopIndex ? { ...s, label: MAYA_VOTE_SWAP.toLabel } : s,
  ),
};

/** Another user saves the (post-vote) plan and remixes it for Atlanta. */
export const MAYA_REMIX_ATL: Plan = {
  id: "p-maya-dc-1-atl-remix",
  authorId: "u-remixer",
  city: "Atlanta, GA",
  occasion: "girls-night",
  vibe: "foodie+turn-up",
  remixOfId: MAYA_PLAN.id,
  remixDepth: 1,
  createdAt: "",
  stops: MAYA_PLAN_AFTER_VOTE.stops,
};

export const MAYA_SCENARIO = {
  inputs: MAYA_INPUTS,
  original: MAYA_PLAN,
  voteSwap: MAYA_VOTE_SWAP,
  afterVote: MAYA_PLAN_AFTER_VOTE,
  remix: MAYA_REMIX_ATL,
};
