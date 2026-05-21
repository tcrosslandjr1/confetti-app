# Confetti — Full Booking Architecture

## 1. Business Model: Aggregator vs. Direct vs. Hybrid

### The Three Models

**Pure Aggregator** (pull from Resy, OpenTable, SevenRooms APIs)
- Pros: Instant inventory across thousands of venues, no sales team needed, fast to market
- Cons: You're a skin on top of someone else's system, thin margins (if any), limited venue data, they can cut you off, you can't offer exclusive experiences
- Revenue: Affiliate commissions ($1–3 per cover) or subscription from users

**Pure Direct** (your own venue relationships and inventory system)
- Pros: Full control, exclusive experiences, deeper venue data, higher margins, can offer things aggregators can't (secret menus, off-hours access, chef's table)
- Cons: Slow to scale, need a sales/partnerships team, venues must adopt your system or you build integrations with their POS

**Hybrid** (recommended for Confetti)
- Phase 1: Aggregate from Resy/OpenTable for baseline availability — users can book anywhere
- Phase 2: Layer in direct partnerships for "Confetti Exclusive" experiences that you can't get elsewhere
- Phase 3: As volume grows, migrate high-performing venues to direct relationships (better margins, better data)

### Why Hybrid Wins for Confetti

Confetti's value prop isn't "find a table" — it's "find the *right* experience for your mood tonight." The AI layer is what differentiates you. So you need:

1. **Breadth** (aggregator) so the AI always has options to recommend
2. **Depth** (direct) so you can offer things nobody else can — the twist moments, the secret spots, the "tell them Confetti sent you" experiences

### Revenue Architecture

| Source | Model | Margin |
|--------|-------|--------|
| Standard reservations | Aggregator pass-through | $1–3/cover affiliate |
| Confetti Exclusive experiences | Direct partnership | 15–20% commission on spend |
| Premium itineraries (multi-stop) | Hybrid | $5–15 booking fee per stop |
| Confetti Gold (subscription) | User-facing | $14.99/mo — priority access, no booking fees |
| Venue promotion/featured placement | B2B | CPM or flat monthly from venues |

---

## 2. Booking Flow UX

### The Journey: Recommendation → Confirmed

```
[Recommendation Agent suggests spots]
        ↓
[User taps a venue card]
        ↓
[Venue Detail View]
   - Vibe photos/video
   - Menu highlights
   - Dress code & price range
   - "Why Confetti picked this for you" (AI reasoning)
   - Available time slots (real-time)
        ↓
[Select time + party size]
   - Calendar strip (tonight, tomorrow, this weekend)
   - Party size selector
   - If Group: pull from Party Room participants
   - Special requests field ("birthday," "window seat," "quiet corner")
        ↓
[Booking Summary / "Boarding Pass Preview"]
   - Venue, date, time, party size
   - Deposit required? (shown clearly)
   - Cancellation policy
   - Add to multi-stop itinerary? (if applicable)
        ↓
[Confirm & Pay (if deposit required)]
   - Apple Pay / Google Pay / saved card
   - Split deposit option for groups
        ↓
[Confirmation Screen — Animated Boarding Pass]
   - Confetti animation
   - Boarding pass card with QR code
   - "Add to Calendar" button
   - "Share with your crew" button
   - XP earned notification
```

### Multi-Stop Itinerary Flow

When the Recommendation Agent builds a full night (dinner → bar → late-night spot):

```
[Itinerary View — Boarding Pass Stack]
   - Stop 1: Dinner @ 7:30pm — [Book] or [Booked ✓]
   - Stop 2: Cocktails @ 9:45pm — [Book] or [Booked ✓]
   - Stop 3: Late night @ 11:30pm — [Book] or [Booked ✓]
   - "Book All" button (one tap, all three)
```

Each stop is independently bookable, but "Book All" is the magic — one tap, entire night locked in.

### Edge Cases to Design For

- **Venue full**: Waitlist option with position + estimated wait, or AI suggests alternative with "similar vibe, 2 blocks away"
- **Group member can't make it**: Modify party size without canceling
- **Running late**: One-tap "running 15 min late" notification to venue (direct partners only)
- **Cancellation**: Clear policy shown upfront; free cancel until X hours before; deposit forfeit rules
- **Walk-in vs. Reservation**: Some nightlife is walk-in only — Confetti shows "no reservation needed, best arrival time: 10:30pm" with real-time crowd estimate (if data available)

---

## 3. Payment & Transactions

### Payment Stack

```
┌─────────────────────────────────┐
│         Stripe Connect          │  ← Platform account
├─────────────────────────────────┤
│  Connected Accounts (Venues)    │  ← Each venue has a Stripe account
├─────────────────────────────────┤
│  Payment Methods                │
│  - Apple Pay                    │
│  - Google Pay                   │
│  - Saved cards (Stripe vault)   │
├─────────────────────────────────┤
│  Split Payments                 │
│  - Equal split                  │
│  - Custom amounts               │
│  - "I'll cover it" (one person) │
└─────────────────────────────────┘
```

### Transaction Types

**1. No-cost reservation (most common)**
- No payment at booking
- Revenue comes from venue commission on actual spend (tracked via POS integration or honor system for aggregated bookings)

**2. Deposit-required booking**
- $10–50 per person deposit held
- Applied to final bill at venue
- Forfeited on no-show (after grace period)
- Stripe PaymentIntent created, captured only on no-show

**3. Prepaid experience (Confetti Exclusives)**
- Full payment upfront (tasting menu, bottle service, private event)
- Stripe checkout with venue as connected account
- Confetti takes platform fee (15–20%)

**4. Subscription (Confetti Gold)**
- $14.99/mo recurring via Stripe Billing
- Perks: no booking fees, priority access, exclusive drops, 1 free cancellation/month

### Group Split Billing (Party Room Integration)

When booking from a Party Room:

```
[Booking confirmed — $50 deposit for 4 people]
        ↓
[Split options appear in Party Room chat]
   - "Split equally ($12.50 each)" 
   - "Tyrone covers it"
   - "Custom split"
        ↓
[Each member gets a payment request notification]
        ↓
[Payment status visible to group]
   - Tyrone: Paid ✓
   - Marcus: Paid ✓
   - Aisha: Pending...
   - DeVon: Paid ✓
        ↓
[All paid → Booking fully confirmed]
```

### Commission & Payout Structure

| Scenario | Confetti Takes | Venue Gets | When |
|----------|---------------|------------|------|
| Aggregated booking | $1–3 affiliate fee | N/A (via Resy/OT) | Monthly from aggregator |
| Direct booking (no deposit) | 10% of table spend | 90% | T+2 after visit |
| Direct booking (deposit) | Platform fee from deposit | Deposit applied to bill | Real-time |
| Exclusive experience | 15–20% | 80–85% | T+2 after event |
| Subscription revenue | 100% | N/A | Monthly |

### Fraud & Risk

- Velocity checks: flag accounts making 10+ reservations/day
- No-show scoring: users who no-show 3x get deposit requirement on all future bookings
- Chargeback handling via Stripe Radar
- Group split: if one member doesn't pay within 2 hours, the booker is responsible for full deposit

---

## 4. Post-Experience Feedback Loop

### The 3-Touch Feedback System

**Touch 1: Passive Check-in (automatic)**
- Geofence or Bluetooth detection confirms user arrived at venue
- Triggers: XP award, streak tracking, "checked in" status in Party Room
- No user action required

**Touch 2: Quick Reaction (next morning)**
- Push notification: "How was [Venue] last night?"
- Single-tap reaction: 🔥 (fire), 😊 (good), 😐 (meh), 👎 (nah)
- Optional: one-sentence voice note ("the DJ was amazing after midnight")
- Takes < 5 seconds — designed for hungover thumbs

**Touch 3: Taste Refinement (periodic, optional)**
- After 5+ experiences, prompt: "You've been loving rooftop bars — want more of those?"
- Swipe-style preference cards that refine the Taste Graph
- Never annoying, always framed as "unlock better recs"

### How Feedback Flows Back Into the System

```
[User reaction: 🔥 on rooftop cocktail bar]
        ↓
[Taste Agent updates User Taste Graph]
   - Increases weight: rooftop +0.3, cocktails +0.2, DJ +0.1
   - Contextual: "Friday night + group of 4 = rooftop preference"
        ↓
[Recommendation Agent receives updated signals]
   - Next time similar context → prioritizes rooftop venues
   - "Twist moment" logic: occasionally suggests something adjacent
     (e.g., speakeasy with skyline view — satisfies the height/view
     preference without being literally "another rooftop")
        ↓
[Venue scoring model updates]
   - Venue reputation score adjusts based on aggregate reactions
   - Venues consistently getting 🔥 rise in recommendations
   - Venues getting 👎 get flagged for quality review
```

### Gamification Triggers (Post-Experience)

| Trigger | Reward | Purpose |
|---------|--------|---------|
| First booking completed | "First Flight" badge + 50 XP | Activation |
| 3 bookings in one week | "Weekend Warrior" badge + 150 XP | Habit formation |
| Tried a new cuisine | "Taste Explorer" badge + 75 XP | Discovery |
| Full itinerary completed (3+ stops) | "Night Owl" badge + 200 XP | Multi-stop engagement |
| Left a voice note review | "Storyteller" badge + 50 XP | Content generation |
| Brought 3+ friends (Party Room) | "Life of the Party" badge + 100 XP | Viral growth |
| 10 consecutive weeks with a booking | "Regular" badge + 500 XP | Retention |
| Visited a Confetti Exclusive | "Insider" badge + 150 XP | Premium upsell |

### XP → Tangible Rewards

| Level | XP Required | Unlocks |
|-------|-------------|---------|
| Newcomer | 0 | Basic recommendations |
| Explorer | 500 | Priority waitlist, custom avatar |
| Regular | 2,000 | Free booking fee waiver (1/month), early access to exclusives |
| VIP | 5,000 | Confetti Gold free for 1 month, venue perks (free appetizer at partners) |
| Legend | 15,000 | Invite to Confetti-hosted events, direct line to concierge team |

### Social Sharing Moment

After every completed experience, the Boarding Pass becomes a **shareable card**:

```
┌─────────────────────────────────┐
│  ✈ CONFETTI BOARDING PASS       │
│                                 │
│  PASSENGER: Tyrone + 3          │
│  DESTINATION: Rooftop Lounge X  │
│  DATE: Fri May 16, 2026         │
│  GATE: Table 7                  │
│  STATUS: ✓ LANDED               │
│                                 │
│  ★★★★★ "The vibes were unreal" │
│                                 │
│  [Share to Stories] [Send]      │
└─────────────────────────────────┘
```

This is the organic growth engine — every share is a branded, intriguing ad for Confetti.

---

## Next Steps: Build Priority

| Priority | What | Why |
|----------|------|-----|
| P0 | Venue detail card + time slot picker | Core booking UX — everything else is meaningless without this |
| P0 | Stripe Connect setup | Payment rail must exist before deposits work |
| P1 | Aggregator integration (Resy API) | Gives you instant inventory to recommend against |
| P1 | Confirmation + Boarding Pass animation | The emotional payoff moment |
| P1 | Quick Reaction feedback (next-morning push) | Feeds Taste Agent immediately |
| P2 | Group split billing | Party Room monetization |
| P2 | Multi-stop "Book All" | Differentiator for full itineraries |
| P2 | Gamification system (XP + badges) | Retention engine |
| P3 | Geofence check-in | Passive engagement data |
| P3 | Confetti Exclusives program | Direct venue partnerships (needs traction first) |
| P3 | Subscription tier (Confetti Gold) | Recurring revenue (needs active user base first) |
