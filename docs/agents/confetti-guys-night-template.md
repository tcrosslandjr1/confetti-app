# Guys Night plan template

Default 3-stop flow. Source of truth: `src/lib/agents/guys-night-template.ts`.

1. **Seafood / steak / wings / BBQ** (food) — hearty, protein-forward dinner optimized for group sharing and pre-game energy.
2. **Competitive activity** (activity) — casino night, pool, darts, bowling, or sports bar. Selected via `vibe`: chill → pool / darts, playful → bowling / sports bar, turn-up → casino night.
3. **Hookah, cigar lounge, comedy show, or late-night food** (social / late-night) — low-pressure wind-down or entertainment, within 1mi of the activity stop, open past midnight.

## Rules
- Used as the default when `occasion = guys-night` and no template override.
- Stop 2 is swap-eligible via group vote (change activity type).
- Food anchor respects dietary prefs (steakhouse for date-night crossover, wings/BBQ for casual, seafood for celebratory).
- Competitive activity selection biases toward group size: 2–4 → pool / darts, 5–8 → bowling / sports bar, 9+ → casino night.