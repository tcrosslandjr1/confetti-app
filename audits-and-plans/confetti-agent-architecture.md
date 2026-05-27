# Confetti Multi-Agent Architecture

## System Overview

Confetti uses a 6-agent architecture where the **Recommendation Agent** acts as the orchestrator, calling specialized agents for data, context, naming, personalization, and quality control.

```
User Request
     │
     ▼
┌─────────────────────────────────┐
│     RECOMMENDATION AGENT        │  ← Orchestrator
│   (builds the itinerary)        │
└─────────┬───────────────────────┘
          │
          │ Calls in parallel:
          │
     ┌────┴────────────────────────────────┐
     │                                      │
     ▼                                      ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  TASTE AGENT │  │  VENUE DATA  │  │   CONTEXT    │
│              │  │    AGENT     │  │    AGENT     │
│ User prefs & │  │ Intelligence │  │  Weather,    │
│ taste graph  │  │ cards for    │  │  events,     │
│              │  │ venues       │  │  conditions  │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                  │                  │
       └──────────────────┼──────────────────┘
                          │
                          ▼
              ┌──────────────────────┐
              │  RECOMMENDATION      │
              │  AGENT assembles     │
              │  draft itinerary     │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │    NAMING AGENT      │
              │  Theme name,         │
              │  tagline, palette    │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  QUALITY CONTROL     │
              │  AGENT               │
              │  Validates & scores  │
              └──────────┬───────────┘
                         │
                    ┌────┴────┐
                    │         │
                 PASS       FAIL
                    │         │
                    ▼         ▼
              Deliver to   Return to
              User         Recommendation
                           Agent with
                           fix notes
```

---

## Agent Responsibilities (Clean Separation)

| Agent | Owns | Never Does |
|-------|------|------------|
| **Taste Agent** | User preferences, taste graph, personalization signals | Pick venues, build routes |
| **Venue Data Agent** | Venue intelligence cards, hours, vibes, confidence scores | Build itineraries, name themes |
| **Context Agent** | Weather, events, crowds, disruptions, modifiers | Recommend venues, pick stops |
| **Recommendation Agent** | Itinerary assembly, stop sequencing, twist design, narrative arc | Raw data gathering, naming, final QA |
| **Naming Agent** | Theme names, taglines, mood palettes, boarding pass flavor | Pick venues, judge feasibility |
| **Quality Control Agent** | Validation, scoring, pass/fail, fix instructions | Create or modify content |

---

## Data Flow

### 1. User submits a request
"Plan a birthday night out in Miami for 6 people, bougie vibes, $80/person budget"

### 2. Recommendation Agent triggers parallel calls:

- **Taste Agent** → Returns Taste Profile Summary (known preferences, past ratings, vibe patterns)
- **Venue Data Agent** → Returns 10–15 venue cards matching criteria for Miami
- **Context Agent** → Returns Context Brief (weather, events, sunset time, crowd levels)

### 3. Recommendation Agent assembles draft itinerary
Using all inputs, builds a 4-stop itinerary with narrative arc, twist, and route logic.

### 4. Naming Agent receives the draft
Returns 3–5 theme name options with taglines and palettes. Recommendation Agent picks the best fit (or lets user choose).

### 5. Quality Control Agent validates
Runs all 7 checks. Scores the itinerary. Either approves or sends back with specific fix notes.

### 6. Delivery
Approved itinerary is formatted as a Confetti Boarding Pass and delivered to the user.

---

## Inter-Agent Contracts

### Taste Agent → Recommendation Agent
```yaml
taste_profile:
  vibe_preferences: [list]
  price_comfort: "$$$"
  group_behavior: "likes loud venues, avoids pretentious spots"
  known_dislikes: ["sushi", "country bars"]
  adventurousness: 8/10
  past_favorites: [venue_ids]
```

### Venue Data Agent → Recommendation Agent
```yaml
venue_cards: [list of Venue Intelligence Cards]
# Each card includes confidence score, verified hours, vibe tags
```

### Context Agent → Recommendation Agent
```yaml
context_brief:
  weather: {...}
  events: [...]
  modifiers: ["start_later", "skip_outdoor"]
  crowd_forecast: {...}
```

### Recommendation Agent → Naming Agent
```yaml
naming_brief:
  city, occasion, vibes, stops[], twist_type, time_window, season
```

### Full Itinerary → Quality Control Agent
```yaml
# Complete assembled itinerary including all upstream data
# QC returns scorecard with verdict
```

---

## Scaling Notes

- **New city support:** Venue Data Agent + Context Agent handle city expansion. No changes to other agents.
- **New venue types:** Add to Venue Data Agent's classification taxonomy.
- **New occasions:** Add to Naming Agent's occasion-energy mapping.
- **API integrations:** Plug into Venue Data Agent (Google Places, Yelp) and Context Agent (weather APIs, event APIs). Other agents don't change.
- **Quality bar changes:** Adjust QC Agent's scoring weights and thresholds.

---

## Files

| File | Agent |
|------|-------|
| `confetti-taste-agent-prompt.md` | Taste Agent |
| `confetti-venue-data-agent-prompt.md` | Venue Data Agent |
| `confetti-context-weather-agent-prompt.md` | Context & Weather Agent |
| `confetti-recommendation-agent-prompt.md` | Recommendation Agent (orchestrator) |
| `confetti-naming-agent-prompt.md` | Naming Agent |
| `confetti-quality-control-agent-prompt.md` | Quality Control Agent |
| `confetti-agent-architecture.md` | This file (architecture overview) |
