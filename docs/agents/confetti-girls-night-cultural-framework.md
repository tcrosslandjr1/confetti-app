# Girls Night Cultural Framework

Branching framework the Itinerary Concierge consults when building girls-night plans. Pairs with `GIRLS_NIGHT_PRESETS` in `src/lib/agents/girls-night-presets.ts`.

## The 4-step plan

**Step 1 — Know the group**
- Shared culture: build around that culture's food, music, and social style.
- Mixed culture: build around everyone contributing something.

**Step 2 — Pick the anchor**
- Food: shareable dinner
- Music: playlist or live DJ
- Activity: karaoke, dancing, lounge, bowling, paint-and-sip, comedy

**Step 3 — Make it social-media friendly**
- Fit check
- Group photo
- Short video moment
- Dessert or late-night food

**Step 4 — Choose the final plan**
- Shared culture → cultural dinner + karaoke/dance/music lounge + dessert
- Multiracial → culture-swap dinner + passport playlist + group-voted activity

## Decision tree

```
START
  |
  v
Who is in the group?
  |
  +--> Mostly one shared cultural / ethnic vibe
  |       |
  |       v
  |   Pick a culturally inspired anchor
  |       |
  |       +--> Food
  |       |     KBBQ, tacos, soul food, mezze, Indian street food,
  |       |     Caribbean food, hot pot, etc.
  |       |
  |       +--> Music / activity
  |       |     Karaoke, salsa/bachata, Afrobeats, Bollywood,
  |       |     R&B lounge, dancehall, K-pop, reggaeton
  |       |
  |       v
  |   Add the universal girls-night formula
  |       |
  |       +--> Dinner
  |       +--> Fit check / photos
  |       +--> One fun activity
  |       +--> Dessert or late-night bites
  |       |
  |       v
  |   Best final plan:
  |   "Cultural dinner + music/dance/karaoke + dessert"
  |
  +--> Multiracial / mixed cultural group
          |
          v
      Do not make one girl represent a whole culture
          |
          v
      Pick a shared format instead
          |
          +--> Culture-swap dinner
          |     Everyone contributes one food, song, drink,
          |     outfit idea, or tradition
          |
          +--> Passport playlist
          |     Each girl adds 5 songs from her taste/background
          |
          +--> Group-vote activity
          |     Karaoke, bowling, rooftop, dance class,
          |     paint-and-sip, comedy show, spa night
          |
          v
      Add the universal girls-night formula
          |
          +--> Shareable dinner
          +--> Glam/get-ready moment
          +--> One interactive activity
          +--> Playlist rotation
          +--> Dessert or late-night bites
          |
          v
      Best final plan:
      "Culture-swap dinner + passport playlist + karaoke/dancing"
```

## Agent rules

1. Detect group cultural signal from the taste graph (`music_taste`, `scene_keywords`, `cities`) and optional explicit hints from the planner intake. If 60%+ of signals share one culture cluster, take the **shared-vibe** branch. Otherwise default to **mixed**.
2. Never name a single member as "the X representative." The mixed branch is the safe default when uncertain.
3. Always include the universal formula beats: dinner → glam/photos → one interactive activity → dessert or late-night bites.
4. Cultural anchors only override beats when the venue genuinely fits (e.g. KBBQ counts as both dinner AND interactive). Otherwise add a stop, don't replace one.
5. Use existing `GIRLS_NIGHT_PRESETS` as the venue/flow library; the cultural framework picks *which preset* to remix and *what anchor* to layer on top.
