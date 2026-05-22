# Scenario — Maya's multiracial girls night in DC

Canonical end-to-end demo wiring planner inputs → generated plan → group
vote-swap → cross-city remix. Source of truth lives at
`src/lib/agents/scenario-maya-dc.ts`.

## 1. Inputs (Maya)

- City: Washington, DC
- Occasion: Girls Night
- Group type: Multiracial / mixed cultural
- Vibes: Foodie + dancing (turn-up)
- Budget: $40–$80 / person
- Music taste: Afrobeats, R&B, reggaeton
- Safety: women-only, verified profiles, public meetup only

## 2. Generated plan

1. Caribbean-Latin dinner (food)
2. Fit check / photo stop (activity)
3. Afrobeats + reggaeton lounge (music)
4. Late-night dessert (dessert)

## 3. Share + group vote-swap

- Maya shares the plan privately with the group chat (PlanShareFlow).
- Two friends vote to swap stop #3 lounge → **Afrobeats karaoke room**.
- Threshold = 2 votes (group of 4). Swap auto-applies; plan version bumps.

## 4. Remix for Atlanta

- Another user saves the post-vote plan and remixes it.
- `remixOfId` points back to Maya's plan, `remixDepth = 1`.
- City changes DC → Atlanta; occasion/vibe preserved per remix rules.
- Maya earns +5 Confetti pts as the parent author.

## Agent rules used

- planner-inputs: respects all 8 inputs (budget cap excludes >$80 venues).
- safety-features: women-only + verified filters applied before ranking.
- group-collab: vote-swap threshold = ceil(groupSize / 2).
- plan-remix: city may change on remix; occasion + vibe locked unless edited.
- discovery-feed: post-vote plan eligible for rails 1 (similar planners) and
  4 (trending in DC); Atlanta remix appears in rail 4 for ATL users.
