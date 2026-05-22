# Confetti — Planner Inputs

The 9 canonical fields every plan request resolves before the PlanGenerator
runs. Types live in `src/lib/agents/planner-inputs.ts`.

| # | Field | Required | Notes |
|---|---|---|---|
| 1 | City | yes | Drives venue catalog + weather context |
| 2 | Occasion | yes | girls-night / guys-night / date-night / group-hangout |
| 3 | Culture / mixed-culture friendly | yes | shared / mixed / open (default open) |
| 4 | Budget | yes | per-person range + $ tier |
| 5 | Music taste | optional | Genres for playlist + venue music match |
| 6 | Food preferences | optional | Cuisines, dietary, avoid list |
| 7 | Age range | optional | Filters 21+ venues, family-friendly, etc. |
| 8 | Group size | yes | If > 6, include corporate options (Core memory) |
| 9 | Safety preferences | optional | Well-lit, accessible, women-friendly, sober, rideshare |

## Defaults

- **Culture type** → `open` when unclear (vibe-first).
- **Vibe** inferred from occasion when missing:
  - date-night → romantic
  - girls-night / guys-night → turn-up
  - group-hangout → chill
- **Budget** → `$$` (25–75 pp) when unspecified.
- **Safety** → wellLit + rideshareSafe on by default.

## Agent rules

- Refuse to generate a plan if City, Occasion, Culture type, Budget, or
  Group size is missing — ask for it.
- All other fields softly default; never block on optional input.
- Apply Safety filters as **hard filters** in the FilterRules stage of the
  plan pipeline (Context → FilterRules → Ranking → PlanGenerator → Explainer).
- Group size > 6 automatically routes through CorporatePlanner (Core memory).
