# Confetti — CX Framework Gap Specifications

**Date:** May 17, 2026  
**Purpose:** Full specs for every gap identified when comparing the current Confetti build against the 7-layer CX framework.

---

## LAYER 1 — USER EXPERIENCE (UX) GAPS

### Gap 1.1: Loyalty Phase — Weekly "City Nights" Digest

**What's missing:** A recurring personalized digest that makes Confetti feel like part of the user's weekly rhythm, not just something they open when they already have plans.

**Spec:**

Every Thursday at 5pm local time, users receive a push notification + in-app card:

```
┌─────────────────────────────────────────┐
│  🎉 YOUR CITY THIS WEEKEND              │
│                                         │
│  Based on your taste:                   │
│                                         │
│  🔥 NEW — Rooftop at The Wharf just     │
│     opened · matches your vibe 94%      │
│                                         │
│  🎵 TONIGHT — Latin Night @ Decades     │
│     (your crew went last month)         │
│                                         │
│  🍸 TRENDING — Secret cocktail pop-up   │
│     Fri only · 40 spots left            │
│                                         │
│  [Plan My Weekend]  [Browse All]        │
└─────────────────────────────────────────┘
```

**Content sources:**
- Taste Agent outputs (vibe preferences, past favorites)
- Context Agent (new openings, events, weather-appropriate picks)
- Venue Data Agent (trending venues by check-in velocity)
- Social signals (what friends/crew are saving or going to)

**Personalization rules:**
- Show 3–5 items max (not overwhelming)
- Always include: 1 new venue, 1 trending event, 1 twist/surprise
- If user hasn't opened app in 7+ days, lead with FOMO: "Your crew has been out 3 times since you last planned"
- If user is a regular (weekly activity), lead with "something new": unexpected picks to keep it fresh

**Delivery channels:**
- Push notification (preview line only)
- In-app card on Home screen (persists until Sunday midnight)
- Email (optional, user-toggled in settings)

---

### Gap 1.2: Loyalty Phase — Birthday Planning

**What's missing:** Confetti knows (or should know) the user's birthday but does nothing special with it.

**Spec:**

**Data capture:** During onboarding or profile setup, ask: "When's your birthday? (We plan something special.)" — optional but incentivized with +50 XP.

**Pre-birthday flow (7 days before):**

```
Push: "Your birthday is next week 🎂 Want Confetti to plan something unforgettable?"
       [Plan My Birthday]  [Not This Year]
```

Tapping "Plan My Birthday" triggers a special AI Planner mode:

- Asks: Solo celebration, date night, or crew?
- If crew: auto-creates a Party Room, pulls contacts, sets up Vibe Vote
- Budget question: "Treat yourself" or "group split"
- AI generates 3 themed birthday itineraries (heavier on twist moments)
  - Example: "Crown & Curfew" — dinner with a surprise dessert + cocktail bar where they announce you + late-night rooftop with champagne toast

**On the birthday:**
- Animated confetti splash screen on app open
- "Happy Birthday" badge unlocked (+200 XP)
- Partner venues get flagged: "Birthday guest — surprise welcome recommended"
- Post-night: shareable "Birthday Boarding Pass" card with photos slot

**Venue partnership angle:**
- Venues in the itinerary receive a heads-up via On My Way: "Birthday celebration incoming"
- Venues that offer birthday perks (free dessert, champagne toast) get a "🎂 Birthday Friendly" badge in listings
- This becomes a selling point for venue partnerships

---

### Gap 1.3: Loyalty Phase — Seasonal Recommendations

**What's missing:** The app doesn't shift its personality based on time of year.

**Spec:**

**Seasonal modes** (automatic, no user action needed):

| Season | Shift | Example |
|--------|-------|---------|
| Summer | Rooftops, patios, pool parties, outdoor festivals, late sunsets | "Golden Hour starts at 8:30 tonight — here's where to catch it" |
| Fall | Cozy bars, whiskey spots, Halloween events, sports watch parties | "Sweater weather unlocked — 5 fireplace bars near you" |
| Winter | Holiday pop-ups, NYE planning, indoor speakeasies, heated patios | "NYE countdown: 14 days — secure your night now" |
| Spring | Patio openings, brunch crawls, new openings season, cherry blossoms | "Patio season is back — 8 new outdoor spots since last year" |

**Implementation:**
- Context Agent already has weather/season awareness — extend to drive Home screen theming
- Seasonal badges: "Summer Nighthawk," "Winter Insider," "Fall Flame"
- Seasonal challenges: "Visit 3 rooftops this month → unlock Summer Legend badge"

---

## LAYER 2 — CUSTOMER LIFECYCLE GAPS

### Gap 2.1: Re-engagement Flows (Win-Back)

**What's missing:** No strategy for users who go dormant.

**Spec:**

**Dormancy tiers and triggers:**

| Days Inactive | Tier | Action |
|---------------|------|--------|
| 7 days | Cooling | Soft push: "Your city didn't stop — here's what you missed" |
| 14 days | Dormant | Push + email: "We saved 3 spots we think you'd love" with taste-matched venues |
| 30 days | At-risk | Personal touch: "Hey [Name], want me to plan something this weekend? No pressure." |
| 60 days | Lapsed | Re-activation offer: "Come back and get a free Confetti Black week" |
| 90+ days | Churned | Monthly light-touch email only: "Still here if you need us. [City] highlights this month." |

**Win-back mechanics:**
- 14-day push includes a **One-Tap Plan**: "Tap here and I'll plan Friday night in 30 seconds" — skips all input, uses last known Taste Profile
- 30-day message is conversational (from the AI concierge persona, not marketing-speak)
- 60-day offer auto-expires in 48 hours (urgency without being spammy)
- Never more than 1 push per dormancy tier (respect attention)

**Tracking:**
- Reactivation rate per tier
- Time-to-first-action after reactivation
- If a user returns and immediately books → flag as "sleeping regular" (not churned, just seasonal)

---

### Gap 2.2: Hotel & Travel Partnerships

**What's missing:** No integration with the travel context — people visiting a city are the highest-intent users.

**Spec:**

**Partner types:**
1. Hotels — concierge desk replacement / digital concierge card in room
2. Airlines — "Arriving in [city]? Plan your night" push on landing
3. Travel apps — Confetti as embedded experience widget

**Hotel integration flow:**

```
Guest checks in at partner hotel
       ↓
Front desk hands QR card: "Your city guide tonight"
   OR hotel app sends deep link
       ↓
Opens Confetti with pre-set context:
   - City: [hotel city]
   - Context: "Visiting" (vs. local)
   - Budget hint: hotel tier (luxury = suggest $$$$)
   - Duration: check-in to check-out dates
       ↓
AI Planner adapts:
   - "Since you're here through Saturday, here's a 3-night plan"
   - Includes walking-distance options from hotel
   - Factors in jet lag (east coast arrival = earlier dinner suggestions)
```

**Revenue model:**
- Hotels pay per referral that converts to booking ($3–5/guest)
- Hotels on Premium venue tier get featured placement for their restaurant/bar
- White-label option for luxury hotels: "Powered by Confetti" concierge in their own app

**Airline partnership:**
- Push notification trigger: phone reconnects to network after landing
- "Welcome to Miami ☀️ Want me to plan tonight?" 
- Partner airlines get co-branded boarding pass: "[Airline] × Confetti"

---

### Gap 2.3: Structured Advocacy Program

**What's missing:** Sharing exists (boarding pass cards) but there's no program to reward and amplify advocates.

**Spec:**

**Advocacy tiers:**

| Tier | Requirement | Rewards |
|------|-------------|---------|
| Sharer | Shared 1 boarding pass or invited 1 friend | "Social Butterfly" badge |
| Connector | 3 friends joined via their link | 1 free month Confetti Black |
| Ambassador | 10+ friends joined + 5 group plans hosted | Permanent "Ambassador" badge, early access to all features, direct line to team |
| Creator | Posts Confetti content on social (verified) | Revenue share on bookings from their content, featured in app |

**Referral mechanics:**
- Every user gets a personal referral link (already implied by "Refer & Earn" screen)
- Referee gets: first itinerary free (if they'd normally hit the 3/month wall)
- Referrer gets: 100 XP + progress toward next advocacy tier
- Group multiplier: if you invite 3+ people to a single Party Room who are all new → bonus 500 XP

**Social proof in-app:**
- "Tyrone brought 12 friends to Confetti" badge visible on profile
- Leaderboard: "Top Connectors This Month" (opt-in)
- Ambassador content featured in Explore feed

---

## LAYER 3 — IN-APP EXPERIENCE GAPS

### Gap 3.1: Reels / Video Feed

**What's missing:** The framework positions a TikTok-style video feed as a core discovery surface. Confetti has no video content layer.

**Spec:**

**Feed location:** Bottom nav icon (between Explore and AI Planner) — or swipe-right from Home.

**Content types:**

| Type | Source | Overlay |
|------|--------|---------|
| Venue vibe reels | Venues upload 15–60s clips | Venue name + "Add to Plan" button |
| User night-out clips | Users post from completed itineraries | Boarding pass tag + "Plan this night" |
| AI-curated compilations | Auto-generated "Best Rooftops" / "Date Night Spots" | Themed title + venue cards |
| Influencer content | Confetti creators program | Creator handle + affiliate link |

**UX flow:**

```
[Full-screen vertical video — autoplay, sound off by default]
   │
   │  Overlays:
   │  ├── Venue name + vibe tags (top-left)
   │  ├── 🔥 Energy meter (top-right)  
   │  ├── ❤️ Save  💬 Comment  ↗️ Share (right side)
   │  └── [+ Add to Plan] button (bottom)
   │
   │  Swipe up = next reel
   │  Tap venue name = venue detail card
   │  Tap "Add to Plan" = adds to current draft itinerary or creates new
```

**Personalization:**
- Feed ranked by Taste Agent signals (not just recency/popularity)
- If user likes rooftop content → more rooftop reels surface
- "Because you saved [Venue]" sections
- Geographic filtering: prioritize user's current city, then cities they've visited

**Content creation flow (for users):**

After completing an itinerary and checking in:
```
"Share your night? 🎬"
[Record a clip]  [Upload from camera roll]  [Skip]
```

- Clips auto-tagged with venue + itinerary theme
- Posted to public feed (or friends-only toggle)
- Creator earns 50 XP per post, bonus if it gets 100+ views

**Venue content tools (B2B):**
- Venue dashboard includes "Upload Reel" button
- Venues on Pro/Premium tier can post unlimited reels
- Reels with high engagement get organic boost in recommendations
- Paid boost option: "Promote this reel" → appears in more feeds for 48 hours

**Moderation:**
- AI content screening (no explicit content, violence, etc.)
- Community flagging system
- Venue-uploaded content fast-tracked (lower moderation friction)

---

### Gap 3.2: "What's Popping Right Now" — Real-Time Feed

**What's missing:** No live activity indicator showing what's happening in the city at this moment.

**Spec:**

**Location:** Home screen section (below personalized picks) + dedicated tab in Explore.

**Data sources:**
- Check-in velocity (how many Confetti users checked in at a venue in last 2 hours)
- On My Way signals (how many people are headed to a venue right now)
- Social signals (venue mentions spiking on social)
- Venue-reported (venues can push "We're packed tonight" or "DJ just started")

**Display:**

```
┌─────────────────────────────────────────┐
│  ⚡ POPPING RIGHT NOW                   │
│                                         │
│  🔴 LIVE  Service Bar · Shaw            │
│  ███████████░░  Energy: 🔥🔥🔥🔥         │
│  47 people headed there · DJ til 2am    │
│                                         │
│  🔴 LIVE  Dauphine's · 14th St          │
│  █████████░░░░  Energy: 🔥🔥🔥           │
│  Full house · 20 min wait for walk-ins  │
│                                         │
│  🟡 HEATING UP  Residents Café          │
│  ██████░░░░░░░  Energy: 🔥🔥             │
│  Live jazz starting at 9pm              │
│                                         │
│  [See all 23 live venues →]             │
└─────────────────────────────────────────┘
```

**Energy scoring algorithm:**
```
energy_score = (
  check_ins_last_2h * 3 +
  on_my_way_count * 2 +
  social_mentions * 1 +
  venue_self_report * 2
) / max_possible → normalized 1–5 flames
```

**Thresholds:**
- 🟡 Heating Up: score > 20th percentile for that venue type
- 🔴 LIVE: score > 60th percentile
- 🔥 ON FIRE: score > 90th percentile (rare, signals exceptional night)

**Privacy:**
- Individual check-ins never shown (only aggregate counts)
- "X people headed there" is anonymized
- Users can opt out of contributing to crowd data (their check-ins won't count)

---

### Gap 3.3: Map View with Live Filters

**What's missing:** Explore section doesn't have a functional map with real-time overlays.

**Spec:**

**Map features:**
- Pins colored by vibe category (rooftop = blue, dive bar = red, restaurant = green, club = purple)
- Pin size scales with current energy level (bigger = more active right now)
- Cluster view when zoomed out, individual pins when zoomed in
- "Heat zones" overlay option showing nightlife density

**Filter bar (horizontal scroll above map):**
```
[Vibe ▾] [Price ▾] [Music ▾] [Open Now] [Walking Distance] [Crew Size ▾]
```

**Tap a pin → mini card:**
```
┌────────────────────────┐
│ 📍 The Gibson          │
│ ★ 4.7 · $$$  · Speakeasy│
│ ⚡ Heating Up           │
│ Open til 2am            │
│ [Add to Plan] [Details] │
└────────────────────────┘
```

**"Near me" mode:**
- Shows walking radius (5, 10, 15 min rings)
- Real-time: updates pins as user moves
- Useful for mid-night pivots: "Where should we go next?"

---

## LAYER 4 — AI PERSONALIZATION GAPS

### Gap 4.1: Weather & Season Adaptation (Completion)

**What's missing:** Context Agent has weather spec but it's not fully wired to change recommendation behavior.

**Spec — decision rules:**

| Condition | AI Behavior |
|-----------|-------------|
| Rain tonight (>60% chance) | Suppress outdoor venues, boost speakeasies/indoor spots, add "Rain plan" badge |
| Extreme heat (>95°F) | Prioritize AC'd venues, pool bars, late-night starts | 
| Perfect weather (65–80°F, clear) | Boost rooftops, patios, outdoor festivals, suggest earlier starts |
| Snow/ice | Shorten walking routes, suggest Uber between stops, add "Winter Wonderland" twist |
| Sunset timing | If itinerary overlaps golden hour → route to a view spot for that stop |
| Holiday weekend | Expect crowds, book earlier, suggest less mainstream spots, mention cover charges |

**How it surfaces to users:**
- Small weather chip on itinerary: "☀️ 72° tonight — perfect for your rooftop stop"
- If weather changes after plan is created: push notification "Rain moved in — want me to adjust your plan?"
- Context Agent re-runs and suggests indoor swaps for affected stops

---

### Gap 4.2: Notifications Personalization

**What's missing:** No spec for how push notifications adapt to user behavior.

**Spec:**

**Notification frequency tiers (auto-assigned based on engagement):**

| User Type | Max Pushes/Week | Content Style |
|-----------|----------------|---------------|
| Power user (3+ nights/week) | 5 | New spots, crew activity, flash deals |
| Regular (1–2 nights/week) | 3 | Weekend digest, trending, friend plans |
| Casual (1–2 nights/month) | 1 | Monthly "don't miss" + gentle nudge |
| Dormant (hasn't opened in 14+ days) | 1 every 2 weeks | Win-back (see Layer 2) |

**Smart timing:**
- Learn when user typically opens app (if always at 5pm Friday → send digest at 4:45pm Friday)
- Never send between 1am–8am (unless user is a verified night owl — checked in after midnight 3+ times)
- Group context: if Party Room is active and planning, increase relevance-based notifications for that group

**Content personalization:**
- Notification copy uses user's vibe language: if they always search "bougie" → use "bougie" in the push
- A/B test notification styles per user: some respond to FOMO ("selling out"), some to discovery ("just opened"), some to social ("your crew is going")

---

## LAYER 5 — CUSTOMER SUPPORT & TRUST GAPS

### Gap 5.1: Verified Venue Program

**What's missing:** No system to signal venue quality/trustworthiness to users.

**Spec:**

**Verification tiers:**

| Badge | Requirement | Visual |
|-------|-------------|--------|
| ✓ Verified | Confetti team confirmed venue exists + basic info accurate | Small blue checkmark |
| ⭐ Confetti Pick | Meets quality bar (4.5+ rating, 50+ check-ins, no complaints) | Gold star badge |
| 👑 Confetti Elite | Direct partnership + exclusive experiences available | Crown badge + "Elite" tag |

**Verification process:**
- Phase 1 (automated): Cross-reference Google Places, Yelp, venue website — if all match → auto-verify
- Phase 2 (community): After 10+ check-ins with no flags → upgrade to Confetti Pick eligible
- Phase 3 (manual): For Elite status, Confetti team visits or video-calls venue to confirm quality

**User-facing:**
- Unverified venues show subtle "Info not confirmed" disclaimer
- Verified venues show checkmark on all cards and detail pages
- Filter option: "Verified only" in Explore

**Trust signals on venue cards:**
```
┌──────────────────────────────────────┐
│  The Gibson  ✓ Verified              │
│  ⭐ Confetti Pick · 234 check-ins    │
│  📸 Photos verified: 12 real · 0 AI  │
│  💲 Price range: $14–22/cocktail     │
│  👥 Crowd tonight: Moderate          │
└──────────────────────────────────────┘
```

---

### Gap 5.2: Safety Tips & Features

**What's missing:** Nightlife has inherent safety considerations. Confetti doesn't address them.

**Spec:**

**Safety features:**

1. **Safe Route Home**
   - After last stop in itinerary, show: "Getting home? 🚗"
   - One-tap Uber/Lyft deep link with destination pre-filled (home address if saved)
   - Option to share live location with a trusted contact until home
   - "I'm home safe" confirmation (sent to trusted contact)

2. **Buddy System**
   - In Party Room: designate a "Buddy" who gets alerts if you leave the group venue without checking out
   - Optional, privacy-first (user enables per-night)

3. **Venue Safety Indicators**
   - Community-reported: "Well-lit area," "Easy Uber pickup," "Doorman present"
   - Negative flags (reviewed by team before publishing): "Limited cell service," "Cash only (no card trail)"

4. **Drink Limit Awareness (opt-in)**
   - User can set a personal "I want to stay under X drinks" goal
   - Gentle mid-night check-in: "How's the night going? 🍸🍸 (2 of 4)"
   - Never preachy, always optional, never shared with anyone

5. **Emergency Resources**
   - Persistent but unobtrusive: small "🆘" icon in itinerary header
   - Tap → local emergency number, nearest hospital, "Share my location" to emergency contacts
   - Available in every city worldwide

**Positioning:**
- Frame as "Confetti looks out for you" — not risk-averse corporate language
- Safety tips shown contextually (late-night itinerary → show safe ride home; new city → show emergency resources)
- Never gate features behind safety acknowledgment (no "agree to stay safe" popups)

---

### Gap 5.3: Crowd Level Indicators

**What's missing:** Users can't see how busy a venue is before going.

**Spec:**

**Data sources (same as "What's Popping" but applied per-venue):**
- Confetti check-in velocity
- Google Popular Times API (real-time busyness)
- Venue self-report ("We're at capacity" button on venue dashboard)
- Historical patterns (Fridays at 10pm = always packed)

**Display on venue cards:**

```
Crowd: ░░░░░█████████████ BUSY (est. 20 min wait for walk-ins)
```

Levels:
- 🟢 Quiet — "Walk right in"
- 🟡 Moderate — "Some wait possible"
- 🔴 Busy — "Expect 15–30 min wait"
- ⚫ At Capacity — "Reservation recommended"

**On itinerary stops:**
- If a stop's crowd level spikes after plan is created → alert: "Heads up — [Venue] is filling up fast. Want me to suggest an alternative or should we keep it?"

**For venue partners:**
- Venues see their own crowd indicator and can override: "Actually we have space" → resets to moderate
- Analytics: "Your busiest hour is 10pm Saturdays" (helps them staff and promote slow periods)

---

### Gap 5.4: Transparent Pricing

**What's missing:** Users don't know what to expect cost-wise until they arrive.

**Spec:**

**Price intelligence on venue cards:**

```
💲 What to expect:
   Cocktails: $14–22
   Entrees: $28–45
   Bottle service: $300+
   Cover charge: $20 (Fri/Sat after 11pm)
   
   💡 Typical night out here (2 people): ~$120–160
```

**Data sources:**
- Menu scraping (Context Agent capability)
- User-reported (post-visit: "How much did you spend?" — optional, anonymized)
- Venue-provided (direct partners share pricing)
- Historical booking data (average transaction for Confetti users at this venue)

**Per-itinerary total estimate:**

On the Boarding Pass, show:
```
ESTIMATED NIGHT: $85–120/person
   Stop 1 (Dinner): $45–60
   Stop 2 (Cocktails): $25–35
   Stop 3 (Late Night): $15–25 + $10 cover
```

**Alerts:**
- If total exceeds user's budget preference (from Taste Agent) → flag: "This plan might run over your usual budget — want me to find alternatives?"
- Surge pricing awareness: "Saturday night prices are typically 15% higher at this venue"

---

### Gap 5.5: Support Escalation Paths

**What's missing:** Only the AI concierge exists. No human support, no venue-specific support, no issue resolution flow.

**Spec:**

**Support tiers:**

| Tier | Channel | Response Time | Handles |
|------|---------|---------------|---------|
| 0 | AI Concierge (in-app) | Instant | FAQ, plan changes, recommendations, general questions |
| 1 | In-app chat (human) | < 15 min (during nightlife hours) | Booking issues, payment problems, venue disputes |
| 2 | Email support | < 24 hours | Account issues, refunds, complex disputes |
| 3 | Venue support hotline | Real-time (for venue partners) | Dashboard issues, payout questions, integration help |

**AI → Human handoff:**
- AI concierge recognizes when it can't help: "I'm not able to fix this myself — let me connect you with our team"
- Seamless transition: human agent sees full conversation context
- No repeated questions

**Issue types and flows:**

```
"Venue was closed when we arrived"
   → AI confirms via Google/data → auto-refund deposit + 100 XP apology bonus
   → Flag venue for re-verification

"I was charged but didn't go"
   → Check: was On My Way triggered? Check-in detected?
   → If no arrival signals → auto-refund within 24h
   → If ambiguous → escalate to Tier 1

"Venue experience was terrible"
   → "Sorry to hear that. What happened?"
   → Categorize: food quality / service / safety / misrepresentation
   → If safety → immediate escalation + venue flag
   → If quality → log in venue scoring, offer credit for next plan

"App crashed and I lost my plan"
   → Plans are server-side → recover and resend
   → Offer: "Want me to regenerate or restore your saved plan?"
```

**Post-outing follow-up (extending existing flow):**

Currently: "How was your night?" with emoji reaction.

Add:
```
If reaction is 😐 or 👎:
   → "Sorry it wasn't great. What happened?"
   → [Venue issue] [Plan didn't match my mood] [Something else]
   → Route to appropriate resolution
```

---

### Gap 5.6: Real Photos & Content Verification

**What's missing:** No system to ensure venue photos/videos are authentic.

**Spec:**

**Photo trust system:**

| Source | Trust Level | Display |
|--------|-------------|---------|
| Venue-uploaded (professional) | Medium | "📸 Venue photo" label |
| Confetti user-uploaded (during check-in) | High | "📸 Real guest photo · [date]" |
| AI-generated / stock | Rejected | Never shown — venues cannot upload stock/AI photos |
| Google Places | Low | Fallback only when no other source available |

**Freshness:**
- Photos older than 6 months get "from [Month Year]" tag
- Venues prompted quarterly: "Update your photos — fresh ones get 3x more saves"
- User photos from last 30 days prioritized in carousel

**Detection:**
- AI screening for stock photos (reverse image search on upload)
- EXIF data check for location match (photo GPS vs. venue GPS)
- Community flagging: "This doesn't look like the venue" button

---

## LAYER 6 — GROWTH LOOPS GAPS

### Gap 6.1: Reels Viral Loop (Full Spec)

**What's missing:** The single biggest one-to-many growth channel. Every other loop is person-to-person (1:1 or 1:few). Reels is 1:many.

**The loop:**
```
User has great night → records/uploads clip → clip shown to other users
→ viewers tap "Plan this night" → new users install → they go out 
→ they record → more content → more installs
```

**What makes this work vs. just being "another video feed":**

1. **Actionable content** — every reel has a "Plan This Night" button that instantly creates a draft itinerary matching what they just watched
2. **Venue-tagged** — not just entertainment, it's discovery fuel. Each reel is a data point for the Recommendation Agent
3. **Cross-platform sharing** — reels export as 9:16 Stories with Confetti watermark + QR code. One share = potential install from every viewer
4. **Creator incentive** — XP + eventual revenue share for top creators. This isn't altruistic sharing, it's rewarded

**External sharing flow:**
```
[User taps Share on a reel]
   → Export as watermarked Story (Confetti logo + QR code bottom-right)
   → Share to: IG Story, TikTok, iMessage, WhatsApp
   → QR code → deep link to that reel in Confetti (or App Store if not installed)
   → New user sees the reel + "Plan a night like this" CTA
```

**Content flywheel metrics:**
- Reel → Install conversion rate
- Reel → Plan creation rate
- Average reels per active user per month
- Top creator retention rate

---

### Gap 6.2: Corporate → Personal Use Loop

**What's missing:** No designed pathway from corporate outing attendee → personal Confetti user.

**Spec:**

**The loop:**
```
Company books corporate outing on Confetti → 20 employees attend
→ Each attendee gets: "Your corporate night was powered by Confetti"
→ One-tap personal account creation (pre-filled from corporate profile)
→ First personal plan free → they become a regular user
→ They bring Confetti to their next company → new corporate client
```

**Implementation:**

1. **During corporate outing:** Attendees interact with a shared Boarding Pass (view-only or interactive checklist)
2. **Post-event push (24 hours later):**
   ```
   "Last night was on [Company]. Your next night out is on us."
   [Claim Your Free Plan →]
   ```
3. **Account bridge:** If attendee doesn't have Confetti, they create a personal account. If they do, they get 1 free plan credit.
4. **Taste seeding:** Their corporate outing preferences (venues they liked) seed their personal Taste Graph — instant personalization from day one.
5. **Referral back to corporate:** Power users who've done 5+ personal nights see: "Love Confetti? Bring it to your team → [Suggest to your office]"

---

## LAYER 7 — BUSINESS & CORPORATE CX GAPS

### Gap 7.1: Corporate Outing Planner

**What's missing:** No flow for companies to plan team events through Confetti.

**Spec:**

**Entry point:** `/teams` page (exists but is a marketing page) → "Plan a Team Outing" CTA → dedicated flow.

**Corporate planner flow:**

```
Step 1: Basics
   - Company name
   - Event type: [Team dinner] [Happy hour] [Client entertainment] [Holiday party] [Offsite activity]
   - Headcount: [slider 5–200]
   - Date/time: [calendar picker] or "flexible this week"

Step 2: Preferences
   - Budget per person: [$25] [$50] [$75] [$100] [$150+]
   - Vibe: [Casual] [Upscale] [Fun/Active] [Intimate] [Impressive (client-facing)]
   - Dietary needs: [checkboxes]
   - Accessibility requirements

Step 3: AI generates 3 options
   - Option A: Safe pick (crowd-pleaser, proven venue)
   - Option B: Impressive pick (wow-factor, great for clients)
   - Option C: Fun pick (unique, activity-based)
   - Each shows: venue, menu options, private space availability, total cost estimate

Step 4: Approval & Booking
   - Export proposal as PDF (for manager/finance approval)
   - One-tap book when approved
   - Auto-sends calendar invites to attendees
   - Headcount management: RSVP tracker
```

**Corporate account features:**
- Multiple admins per company
- Centralized billing (invoice monthly, not per-booking)
- Budget tracking: "You've spent $4,200 of your $10,000 Q2 events budget"
- Pre-approved venues list (company can whitelist/blacklist)
- Expense report integration: auto-generate receipt with GL codes

**Pricing:**
- Free to plan (AI generates options for free → hooks them)
- Booking fee: $5/person or waived on annual contract
- Enterprise tier ($499/mo): unlimited events, dedicated account manager, custom reporting

---

### Gap 7.2: Venue Analytics Dashboard

**What's missing:** Venues can receive alerts (On My Way) but can't see performance data.

**Spec:**

**Dashboard sections:**

```
┌─────────────────────────────────────────────────────────┐
│  📊 YOUR CONFETTI PERFORMANCE — This Month              │
│                                                         │
│  Impressions: 2,340    Saves: 187    Bookings: 43       │
│  [▲12% vs last month] [▲8%]        [▲22%]              │
│                                                         │
│  ─────────────────────────────────────────────────      │
│                                                         │
│  👥 WHO'S COMING TO YOU                                  │
│  • 68% groups of 3–6                                    │
│  • 45% ages 25–34                                       │
│  • Top vibes: "Upscale casual" · "Date night"           │
│  • Peak booking: Friday 7–9pm                           │
│                                                         │
│  ─────────────────────────────────────────────────      │
│                                                         │
│  💰 REVENUE IMPACT                                       │
│  Pre-orders via On My Way: $1,840 (+$220 vs last month) │
│  Avg spend per Confetti guest: $67 (vs $52 non-Confetti)│
│  No-show rate: 4% (industry avg: 15%)                   │
│                                                         │
│  ─────────────────────────────────────────────────      │
│                                                         │
│  📈 RECOMMENDATIONS                                      │
│  • "Upload a reel — venues with video get 3x saves"     │
│  • "Your Tuesday nights are slow — try a Happy Hour     │
│     boost ($29, reach 500 taste-matched users)"         │
│  • "12 users saved you but didn't book — consider       │
│     offering a weeknight special"                        │
│                                                         │
│  [Download Report]  [Boost My Venue]  [Upload Reel]     │
└─────────────────────────────────────────────────────────┘
```

**Data points tracked:**
- Impressions (how many users saw venue in recommendations)
- Saves (added to wishlist / itinerary draft)
- Bookings (confirmed via Confetti)
- Check-ins (actually showed up)
- Reactions (post-visit emoji ratings)
- Revenue (pre-orders, booking fees)
- Repeat rate (% of guests who return within 60 days)
- Competitive position ("You rank #3 for 'rooftop bar' in your area")

**Access by venue tier:**
- Basic (free): Bookings + check-ins only
- Pro: Full dashboard
- Premium: Full dashboard + competitor benchmarks + custom reports

---

### Gap 7.3: Venue Event Posting

**What's missing:** Venues can't create and promote their own events through Confetti.

**Spec:**

**Event creation flow (venue dashboard):**

```
Step 1: Event basics
   - Name: "Latin Night Fridays"
   - Type: [Recurring weekly] [One-time] [Limited series]
   - Date/time
   - Capacity (or "no limit")
   - Cover charge (if any)

Step 2: Details
   - Description (AI assists: "Describe in a sentence, we'll polish it")
   - Photos/video upload
   - Vibe tags (selected from Confetti taxonomy)
   - Music genre
   - Dress code
   - Age requirement

Step 3: Distribution
   - [Free] Show in Explore for taste-matched users within 5 miles
   - [Boost $29–$99] Show to more users + appear in "Tonight" digest
   - [Feature $199] Top placement in Events tab + push notification to matched users
```

**How events appear to users:**

- Events tab (already exists with mock data) → populated by real venue posts
- In AI recommendations: "There's also a Latin Night at [Venue] tonight — matches your dance vibe"
- In the weekly digest: "🎵 Events this weekend matching your taste"
- On the map: event pins (different icon from venue pins)

**Recurring events:**
- Venue creates once, auto-posts weekly
- Users can "subscribe" to recurring events → auto-added to their weekly digest
- If event is canceled, subscribers get notified

---

### Gap 7.4: Business Onboarding Flow

**What's missing:** No clear path for a new venue to get started on Confetti.

**Spec:**

**Self-serve onboarding (< 5 minutes):**

```
Step 1: Claim your venue
   - Search by name/address (pulled from Google Places)
   - "Is this your venue?" → Claim
   - Verification: confirm via phone number on file, or business email domain

Step 2: Complete your profile
   - Upload logo + 3 photos minimum
   - Confirm: hours, price range, cuisine/vibe tags, music, dress code
   - AI pre-fills from existing data: "We found this info — look right?"

Step 3: Choose your tier
   - Basic (Free): Get discovered, receive booking alerts
   - Pro ($99/mo): Pre-orders, analytics, reels, featured placement
   - Premium ($499/mo): Everything + priority AI placement + corporate referrals

Step 4: Connect your tools
   - [Connect POS] (Toast, Square, Clover)
   - [Connect reservation system] (Resy, OpenTable, SevenRooms)
   - [Skip — I'll use the Confetti dashboard only]

Step 5: Go live
   - "You're live! Here's what happens next:"
   - First Confetti recommendations will include you within 24 hours
   - Download the Venue Manager app for real-time alerts
```

**Ongoing support for venues:**
- In-dashboard help center with video tutorials
- "Venue Success" email series (week 1: optimize photos, week 2: post first reel, week 3: enable pre-orders)
- Quarterly check-in from Confetti team (for Pro/Premium)

---

## CROSS-CUTTING GAPS

### Gap X.1: Offline / Low-Connectivity Mode

**What's missing:** Nightlife happens in basements, clubs, and areas with poor signal. No offline consideration.

**Spec:**
- Active itinerary cached on device when created
- Boarding pass viewable offline (including QR code for venue check-in)
- Check-in queues locally, syncs when connectivity returns
- "On My Way" requires connectivity (GPS + data) — graceful fallback: "We'll notify the venue when you're back online"

---

### Gap X.2: Accessibility

**What's missing:** No mention of accessibility in any spec.

**Spec:**
- Venue accessibility info: wheelchair accessible, elevator, ground floor, accessible restrooms
- Filter: "Accessible venues only" in Explore
- Screen reader support for all boarding pass elements
- High contrast mode for dark venues (readable in dim lighting)
- Voice control: "Hey Confetti, where should we go next?" → AI responds via speaker

---

### Gap X.3: Multi-Language Support

**What's missing:** App is English-only. Vision is worldwide.

**Spec:**
- Phase 1: English + Spanish (largest US nightlife demographics)
- Phase 2: French, Portuguese, Japanese, Korean, Arabic (top nightlife tourism cities)
- AI concierge responds in user's language
- Venue details shown in user's language (AI-translated with "ℹ️ Auto-translated" flag)
- Venue names never translated (keep original)

---

## PRIORITY MATRIX

| Gap | Impact | Effort | Priority |
|-----|--------|--------|----------|
| 5.1 Verified Venues | High (trust = bookings) | Medium | **P0** |
| 5.3 Crowd Levels | High (real-time value) | Medium | **P0** |
| 5.4 Transparent Pricing | High (reduces friction) | Low | **P0** |
| 3.2 "What's Popping" Feed | High (daily engagement) | Medium | **P1** |
| 6.1 Reels Viral Loop | Very High (growth) | High | **P1** |
| 2.1 Re-engagement Flows | High (retention) | Low | **P1** |
| 1.1 Weekly Digest | Medium (retention) | Low | **P1** |
| 5.2 Safety Features | High (trust + differentiation) | Medium | **P1** |
| 7.2 Venue Analytics | High (B2B retention) | Medium | **P2** |
| 7.1 Corporate Planner | High (revenue) | High | **P2** |
| 1.2 Birthday Planning | Medium (delight) | Low | **P2** |
| 7.3 Event Posting | Medium (content supply) | Medium | **P2** |
| 7.4 Business Onboarding | Medium (B2B growth) | Medium | **P2** |
| 3.1 Reels Feed UX | High (but depends on 6.1) | High | **P2** |
| 3.3 Map View | Medium (utility) | Medium | **P2** |
| 2.2 Hotel Partnerships | High (revenue) | High | **P3** |
| 2.3 Advocacy Program | Medium (growth) | Low | **P3** |
| 6.2 Corporate → Personal | Medium (growth) | Low | **P3** |
| 1.3 Seasonal Modes | Low (polish) | Low | **P3** |
| 4.1 Weather Adaptation | Low (already partially there) | Low | **P3** |
| 4.2 Notification Personalization | Medium (engagement) | Medium | **P3** |
| 5.5 Support Escalation | Medium (trust) | Medium | **P3** |
| 5.6 Photo Verification | Low (quality) | Medium | **P3** |
| X.1 Offline Mode | Low (edge case) | Medium | **P4** |
| X.2 Accessibility | Medium (inclusive) | Medium | **P3** |
| X.3 Multi-Language | Low (not needed until intl launch) | High | **P4** |

---

## SUMMARY

**Total gaps identified:** 26 across all 7 layers + 3 cross-cutting

**Current overall coverage:** ~70%

**To reach 90%+ coverage:** Close all P0 + P1 items (10 specs)

**To reach 100%:** Close everything through P3 (23 specs)

The foundation is exceptional — especially the AI architecture. What's mostly missing is the trust/safety infrastructure, the content/video layer, and the B2B operational tools. The core consumer experience and personalization engine are ahead of the framework's expectations.
