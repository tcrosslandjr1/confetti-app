# Confetti — Plan Remix

Any public plan can be **remixed**: a new plan that keeps the same shape
(food + activity + music + dessert/late-night) but swaps one or more stops.
Remix lineage is preserved so we can render trees and credit the original.

## Example

```text
Original (KBBQ vibe)
  └── KBBQ + karaoke + boba                    (original, depth 0)
        ├── Hot pot + arcade bar + matcha      (remix, depth 1)
        └── Filipino dinner + karaoke + bakery (remix, depth 1)
```

## Data shape

`src/lib/agents/plan-remix.ts` — `Plan { remixOfId, remixDepth }`.

- `remixOfId = null` → original.
- `remixOfId = <parent.id>` → remix.
- `remixDepth = parent.remixDepth + 1`.

## Agent rules

- A remix MUST preserve occasion + city + vibe of the parent unless the user
  explicitly changes them (then it becomes a new original, not a remix).
- The plan shape stays consistent: food + activity + music moment + dessert
  or late-night close (Universal Flow Step 4).
- Always credit the original author on the remix card: "Remixed from @author".
- Original author gets **+5 Confetti pts** when their plan is remixed
  (same value as save plan, per Core memory).
- Remixes count toward the trending rail's remix metric (Discovery Feed rail 4).
- Cap remix depth display at 3 levels in UI; deeper lineage collapses behind
  a "View full tree" link.
- Private plans cannot be remixed — only `visibility = public` plans.

## Surfaces

- Plan detail page → "Remix this plan" button (creates child plan, opens editor).
- Discovery feed rail 4 (trending) → shows top originals + remix counts.
- Author profile → originals and remixes tabbed separately.
