# Venue anchor taxonomy

Canonical anchor categories the PlanGenerator chooses from. Source of truth:
`src/lib/agents/venue-anchors.ts`.

## Food anchors (slot: early)
- Seafood / crab house
- Steakhouse
- KBBQ / hot pot
- Tacos / tapas
- Soul food
- Caribbean food
- Indian / Middle Eastern / African

## Social anchors (slot: mid → late)
- Lounge
- Hookah lounge
- Rooftop
- Karaoke
- Comedy show
- Live music
- Dance club (late)

## Activity anchors (slot: mid, paint-and-sip early)
- Casino night
- Bowling
- Pool hall
- Arcade bar
- Paint-and-sip
- Go-karts
- Game night

## Agent rules

- Every plan must include exactly 1 food anchor (slot=early).
- 2-stop plans: food + (social OR activity).
- 3-stop plans: food + activity + social, following chill → active → late-night.
- 4-stop plans: food + activity + social + dessert/late-night.
- Vibe filter: intersect requested `vibe` with anchor `vibeTags`; drop anchors
  with zero overlap before ranking.
- Cultural anchors (`culturalAnchors` in PlannerInputs) bias the food slot:
  e.g. "caribbean" → Caribbean food; "nigerian" → African.
- Boosted venues still win within the chosen anchor category.
