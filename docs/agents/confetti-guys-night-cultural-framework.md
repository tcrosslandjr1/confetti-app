# Guys Night Cultural Framework

Branching framework the Itinerary Concierge consults when building guys-night plans. Pairs with `MIAMI_GUYS_NIGHT_PRESETS` in `src/lib/agents/guys-night-presets.ts`.

## The 4-step plan

**Step 1 — Know the group**
- Shared culture: build around that culture's food and social style.
- Mixed culture: each guy contributes one stop, song, or challenge.

**Step 2 — Pick the anchor**
- Food: BBQ, tacos, wings, hot pot, KBBQ, Caribbean, Indian, Ethiopian, soul food, seafood boil
- Activity: sports bar, pickup ball, barbershop meetup, dominoes, karaoke, cigar lounge, comedy, gaming, live music
- Competition: bowling, pool, darts, basketball, golf simulator, go-karts, trivia, arcade bar, fantasy draft

**Step 3 — Universal formula**
- Food → competition → music/sports/comedy → late-night food

**Step 4 — Final plan shape**
- Shared culture → cultural food + competitive activity + music/sports + late-night food
- Mixed → food crawl (each picks one) + competition + playlist rotation + late-night food

## Vibe presets

| Vibe | Best guys' night |
|---|---|
| Chill | BBQ/wings, sports game, cards/dominoes, late-night food |
| Competitive | Bowling, pool, darts, go-karts, golf sim, arcade bar |
| Music-heavy | Dinner, live band, DJ lounge, karaoke, open mic |
| Sports guys | Sports bar, pickup game, fantasy draft, UFC/boxing watch party |
| Stylish | Barbershop cleanup, steakhouse, cigar lounge, rooftop |
| Budget | Cookout, gaming night, card games, playlist battle |
| Mixed/multiracial | Food crawl (each picks a cuisine) + bowling/pool/arcade |
| Big group | Private-room karaoke, sports bar reservation, bowling lanes |
| Small group | Steak night, pool hall, cigar lounge, comedy show |

## Example timeline

```
7:00 PM — Wings, tacos, BBQ, KBBQ, or Caribbean food
8:30 PM — Bowling, pool, darts, arcade bar, or go-karts
10:00 PM — Sports bar, comedy show, karaoke, or lounge
11:30 PM — Late-night pizza, diner, tacos, halal cart, or dessert
```

## Agent rules

1. Default MIXED when group cultural signal is unclear — never make one guy the spokesperson for his background.
2. Mixed-group framing: "everyone picks one stop, one song, or one challenge."
3. Always include the universal formula beats: food → competition → music/sports/comedy → late-night food.
4. Cultural anchor only REPLACES a beat when the venue genuinely covers it; otherwise ADD a stop.
