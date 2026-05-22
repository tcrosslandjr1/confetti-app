# Confetti — Universal Planning Flow

The master flow every occasion follows. Cultural frameworks (girls/guys/date
night) plug into Step 2 (group type) and Step 4 (plan generation).

```text
User opens app
      |
      v
Choose occasion
  Girls Night / Guys Night / Date Night / Group Hangout
      |
      v
Choose group type
  Shared culture / Multiracial group / Open mix
      |
      v
Pick vibe
  Chill / Romantic / Turn-up / Foodie / Competitive / Artsy / Budget
      |
      v
App generates plan
  Food + activity + music + dessert/late-night stop
      |
      v
User can save, customize, invite, or post
```

## Agent rules

- Always resolve **occasion → group type → vibe** before generating stops.
- If group type is unclear, default to **Open mix** (vibe-first).
- If vibe is unclear, infer from occasion + time of day:
  - Date night → Romantic
  - Girls/Guys night → Turn-up
  - Group hangout (day) → Chill
  - Group hangout (night) → Foodie
- Plan shape is **always** food + activity + music moment + late-night/dessert close.
- Surface Save / Customize / Invite / Post actions on every generated plan.

## Cross-references

- `confetti-girls-night-cultural-framework.md`
- `confetti-guys-night-cultural-framework.md`
- `confetti-date-night-cultural-framework.md`
