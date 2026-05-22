# Sample Plans

Canonical sample plans per occasion. Used as fallbacks by PlanGenerator and as seed previews in the UI.

| Occasion | Stops |
|----------|-------|
| Girls Night | Crab house → Rooftop lounge → Hookah → Dessert |
| Guys Night | Seafood boil → Casino night → Cigar lounge |
| Date Night | Seafood dinner → Jazz lounge → Late-night dessert |
| Mixed Group | Crab house → Karaoke → Hookah lounge |

All stops reference anchor IDs from `src/lib/agents/venue-anchors.ts`. Boosted venues still override the default anchor pick within each category.
