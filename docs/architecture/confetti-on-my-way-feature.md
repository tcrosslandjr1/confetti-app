# Confetti — "On My Way" Feature Spec

## Overview

**On My Way** is a smart arrival intelligence layer that bridges the gap between guests leaving their current location and arriving at a venue. It simultaneously serves three audiences: the guest's party (group coordination), the venue (operational readiness), and Confetti's business model (monetizable touchpoint with restaurants/bars/clubs).

---

## Core User Flows

### 1. Group Mode — "The Party Room"

When a user taps **On My Way** from their boarding pass:

- Their live ETA broadcasts to the Party Room (group itinerary)
- Each group member sees a real-time arrival card:
  ```
  ┌─────────────────────────────┐
  │  🚗  Tyrone is on his way   │
  │  ETA: 8:42 PM · 12 min out │
  │  ░░░░░░░░░▓▓▓▓▓            │
  └─────────────────────────────┘
  ```
- As members get closer, progress bars fill — builds group anticipation
- Optional: share live map dot (privacy toggle per user)
- Smart notification: "Everyone's within 5 min — your table is almost full 🎉"

### 2. Intimate Mode — "Date Night"

For 2-person itineraries flagged as **date night** or **intimate**:

- Couples can link as a **Duo** — one tap sends On My Way for both
- Shared boarding pass view (no separate ETAs needed when traveling together)
- Single ETA broadcast to the venue
- Privacy-first: no location sharing with anyone outside the Duo
- Option to "surprise" — one person plans, the other gets reveals stop-by-stop

### 3. Venue Alert — "They're Coming"

When On My Way is triggered, the venue receives a smart notification:

```
┌──────────────────────────────────────────┐
│  📍 CONFETTI VENUE ALERT                 │
│                                          │
│  Party: Tyrone's Birthday Night          │
│  Size: 4 guests                          │
│  ETA: 8:42 PM (12 min)                   │
│  Reservation: 8:45 PM — Table 7          │
│                                          │
│  ⚡ Pre-orders:                           │
│  • 2x Old Fashioned                      │
│  • 1x Spicy Margarita                    │
│  • 1x Sparkling Water                    │
│                                          │
│  [View Party Preferences] [Confirm Ready]│
└──────────────────────────────────────────┘
```

**What venues get:**
- Exact headcount approaching + ETA countdown
- Pre-orders queued (drinks ready on arrival)
- Guest preferences from their Taste Graph (allergies, favorites, vibe)
- Table/section prep time alert
- VIP flag if applicable

---

## Pre-Order Engine (Monetizable Layer)

### How It Works for Guests

1. User taps **On My Way**
2. A slide-up panel shows the venue's "Quick Start" menu:
   - Signature cocktails / drinks
   - Appetizers / shareables
   - Bottle service (if applicable)
3. User selects items → "Have it ready when I arrive"
4. Payment captured in-app (or added to tab)
5. Venue receives order with ETA sync — starts prep at the right moment

### How It Works for Venues (The B2B Pitch)

**Revenue impact:**
- Eliminates dead time between seating and first order (avg 8-12 min saved)
- Increases per-table spend by ~15-22% (impulse pre-orders)
- Reduces walkout risk (guests committed with pre-order)

**Operational impact:**
- Kitchen/bar gets advance notice → smoother flow
- Staff knows party size, timing, and special needs before arrival
- Table turn optimization (know exactly when next party arrives)

---

## B2B Sales Pitch — "Confetti for Venues"

### Elevator Pitch

> "Your guests are already planning their night on Confetti. When they tap 'On My Way,' you get a 10-15 minute head start — exact arrival time, party size, drink orders, and guest preferences. Your bar starts pouring before they sit down. That's revenue in the door faster, a better guest experience, and zero dead time at the table."

### Venue Tier Packages

| Tier | What They Get | Price Model |
|------|---------------|-------------|
| **Basic** (Free) | ETA alerts + party size | Free — drives adoption |
| **Pro** | Pre-orders + guest preferences + Taste Graph data | % of pre-order revenue (8-12%) |
| **Premium** | All above + featured placement in Confetti recommendations + "Venue Pick" badge + analytics dashboard | Monthly SaaS ($199-499/mo) + commission |

### Key Selling Points for Venue Owners

1. **"First drink on the table" guarantee** — Drinks poured by arrival. Guest delight = return visits.
2. **Dead-time killer** — Average bar loses $12-18/table in the gap between seating and first order. Eliminate it.
3. **VIP without the velvet rope** — Know your guest before they walk in. Their allergies, their go-to drink, their birthday.
4. **No-show insurance** — If someone taps On My Way + pre-orders, they're coming. Better signal than a reservation alone.
5. **Confetti's audience** — These are high-intent nightlife spenders already planning premium experiences.

### Integration Options

- **Tier 1: Dashboard only** — Venue staff see alerts on a tablet/browser (no POS integration needed)
- **Tier 2: POS integration** — Pre-orders push directly to Toast/Square/Clover/Lightspeed
- **Tier 3: Full API** — Custom integration for enterprise venues/hotel groups

---

## Technical Architecture

### ETA Engine

```
User Location (GPS) 
    → Apple Maps / Google Maps Directions API
    → Real-time ETA calculation (accounts for traffic)
    → Broadcast to:
        ├── Party Room (WebSocket push)
        ├── Venue Dashboard (webhook + push)
        └── Pre-Order Timer (trigger prep at ETA - prep_time)
```

### Privacy & Permissions

- Location shared ONLY when On My Way is active (not passive tracking)
- User controls: share ETA only (no map dot) vs. share live location
- Date Night mode: no external sharing by default
- All location data ephemeral — purged after arrival confirmation
- GDPR/CCPA compliant: explicit opt-in per trip

### Smart Timing for Pre-Orders

```
ETA = 12 minutes
Cocktail prep time = 3 minutes
→ Trigger bar prep at T-4 minutes (1 min buffer)
→ Drinks hit the table within 60 seconds of seating
```

---

## UX in the Boarding Pass

### On My Way Button States

```
[ BEFORE ]
┌─────────────────────────┐
│  🎯  On My Way          │  ← Prominent CTA on current stop card
└─────────────────────────┘

[ ACTIVE ]
┌─────────────────────────┐
│  🚗  12 min · 2.4 mi    │  ← Live countdown
│  ░░░░░░░▓▓▓▓▓▓▓▓▓▓     │
│  Party notified ✓        │
│  Venue notified ✓        │
│  Pre-order: 2 drinks 🍸  │
└─────────────────────────┘

[ ARRIVED ]
┌─────────────────────────┐
│  🎉  You're here!       │  ← Auto-detects arrival
│  Check in to earn XP     │
│  Your drinks are ready   │
└─────────────────────────┘
```

### Pre-Order Slide-Up

When user taps On My Way → brief slide-up:

```
┌─────────────────────────────────┐
│  🍸 Start your night early      │
│                                 │
│  Dauphine's Quick Start:        │
│  ┌───────────┐ ┌───────────┐   │
│  │ Old       │ │ Espresso  │   │
│  │ Fashioned │ │ Martini   │   │
│  │ $16       │ │ $18       │   │
│  └───────────┘ └───────────┘   │
│  ┌───────────┐ ┌───────────┐   │
│  │ Spicy     │ │ Sparkling │   │
│  │ Marg      │ │ Water     │   │
│  │ $15       │ │ $0        │   │
│  └───────────┘ └───────────┘   │
│                                 │
│  [ Skip ] [ Order · $34 ]       │
└─────────────────────────────────┘
```

---

## Gamification Tie-In

- **XP Bonus:** +25 XP for using On My Way (encourages adoption)
- **"Punctual Player" Badge:** Arrive within 2 min of your ETA 5 times
- **"Night Starter" Badge:** First in your party to tap On My Way
- **Pre-Order Streak:** Order ahead 3 nights in a row → unlock secret menu items (venue partnership)

---

## Revenue Model Summary

| Stream | Source | Est. Per Transaction |
|--------|--------|---------------------|
| Pre-order commission | % of food/drink orders placed via On My Way | 8-12% |
| Venue subscription | Monthly SaaS for Pro/Premium features | $199-499/mo |
| Promoted placement | Venues pay to be "recommended" in itineraries | CPM / CPC |
| Data insights | Anonymized foot traffic + preference analytics sold to venue groups | Enterprise pricing |
| Sponsored pre-orders | "First round on [Brand]" — liquor/beverage sponsor covers first drink | Per-redemption fee |

---

## Phase Rollout

| Phase | Scope | Timeline |
|-------|-------|----------|
| **V1** | On My Way button + group ETA alerts + venue webhook (no pre-order) | MVP |
| **V2** | Pre-order engine + payment integration + venue dashboard | +4 weeks |
| **V3** | POS integrations (Toast/Square) + analytics dashboard | +8 weeks |
| **V4** | Sponsored pre-orders + promoted placement + enterprise API | +12 weeks |

---

## Competitive Moat

No one else connects **group coordination + venue intelligence + pre-ordering** in a single tap. Resy/OpenTable handle reservations. Uber handles rides. Confetti owns the *intent-to-arrive* moment — the 10-15 minutes between "let's go" and "we're here." That's the most monetizable moment in nightlife.
