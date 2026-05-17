# Confetti Experience OS

Source of truth for customer journey, notifications, rewards, AI personalization, UX writing, and onboarding. Backend services and AI agents should treat this as authoritative.

---

## A. Customer Experience Map

### Phase 1 — Discovery

- **Touchpoints:** TikTok/IG reels, QR codes in venues, hotel partnerships, word of mouth
- **Emotions:** Curiosity, excitement
- **System actions:** Personalized landing page, "Tonight in Your City" preview

### Phase 2 — Onboarding

- **Touchpoints:** App install, first-time setup
- **Emotions:** Ease, clarity
- **System actions:** Ask vibe preferences, ask home city, offer "Plan My Night" immediately

### Phase 3 — Activation

- **Touchpoints:** First AI plan, first reel watched, first venue saved
- **Emotions:** "This app gets me"
- **System actions:** Tailored recommendations, smart notifications

### Phase 4 — Engagement

- **Touchpoints:** Tonight feed, explore map, reels feed, group planning
- **Emotions:** Confidence, fun
- **System actions:** Real-time trending, personalized vibes, group coordination tools

### Phase 5 — Action

- **Touchpoints:** Booking, check-in
- **Emotions:** Convenience, trust
- **System actions:** One-tap booking, rewards for check-ins

### Phase 6 — Reward

- **Touchpoints:** Points, perks, VIP access
- **Emotions:** "I'm winning"
- **System actions:** Reward triggers, personalized perks

### Phase 7 — Loyalty

- **Touchpoints:** Weekly digest, birthday planning, seasonal recommendations
- **Emotions:** Attachment, habit
- **System actions:** AI-driven personalization, predictive suggestions

---

## B. Notification Strategy

### Categories

1. **Real-time nightlife** — "This rooftop is popping right now." / "3 places near you just went viral." / "Tonight's trending: [venue]."
2. **Personalized** — "Your vibe tonight: classy + chill." / "We found a spot you'll love." / "Your friends are going out tonight."
3. **AI planner** — "Want me to plan your night?" / "Ready for a new weekend plan?"
4. **Rewards** — "You earned 50 Confetti!" / "Unlock your next perk."
5. **Social/group** — "Your crew voted on a venue." / "Someone added a new spot to your plan."
6. **Corporate** — "Your team outing is ready." / "Approval needed for tomorrow's event."

### Rules

- Max 2 notifications per user per day.
- Always personalize (vibe, city, time-of-day).
- Always tie to real-time relevance — no generic blasts.

---

## C. Rewards System

### Point sources & values

| Action        | Confetti points           |
| ------------- | ------------------------- |
| Check-in      | 25                        |
| Booking       | 100                       |
| Reel share    | 10                        |
| Invite friend | 50                        |
| Save plan     | 5                         |
| Watch reel    | (tracked, no fixed value) |

### Tiers

- **Silver** — 0–999 pts — basic perks, early access
- **Gold** — 1,000–4,999 pts — free drinks, VIP lines
- **Platinum** — 5,000+ pts — exclusive events, concierge

### Reward triggers

- Auto-trigger after check-in
- Auto-trigger after booking
- Weekly summary digest

---

## D. AI Personalization Rules

### Input signals

Reels watched, venues clicked, plans saved, check-ins, group size patterns, preferred vibes, time-of-day/night usage, budget patterns, music preferences, dress code preferences.

### Output personalization

Tonight feed ranking, explore recommendations, AI plan generation, notification timing, rewards suggestions, seasonal adjustments.

### Behavior models

- Nightlife personality type
- Preferred vibe clusters
- Social patterns (solo, couple, group)
- Spending patterns
- Time-based patterns (weekday vs weekend)

### Rules

- Update long-term personalization weekly.
- Use real-time signals for Tonight feed.
- Use long-term signals for AI plan generation.

---

## E. UX Writing System

### Voice

Energetic, playful, smart, helpful, city-savvy.

### Tone

Fun but not childish. Confident but not arrogant. Informative but not boring.

### Copy examples

- **Home:** "Tonight is looking good." / "Your city is calling."
- **AI planner:** "Let me cook something up." / "I've got 3 perfect plans for you."
- **Group planning:** "Your crew is vibing." / "Votes are in."
- **Rewards:** "You're leveling up." / "Perks unlocked."
- **Corporate:** "Your team outing is ready." / "Here's a polished plan for your crew."

---

## F. Onboarding Flows

### F1 — User Onboarding

1. Welcome — "Let's make your nights unforgettable."
2. Choose vibes — Chill / Classy / Rooftop / Turn-up / Live music
3. Set home city
4. Ask for notifications — "I'll only send what matters."
5. First action — "Want me to plan your night?"

### F2 — Business Onboarding

1. Create account
2. Add venue details
3. Upload photos
4. Add events
5. Add reels
6. Choose subscription tier
7. Enable corporate visibility

### F3 — Corporate Onboarding

1. Company setup
2. Add admins
3. Set policies
4. Import teams
5. Approve venues
6. Plan first outing
