# Confetti — App Store Readiness Plan

**Date:** May 14, 2026
**Project:** Confetti (AI Dining & Nightlife Concierge)
**Lovable URL:** https://lovable.dev/projects/f4bae350-0f3c-459c-a8b3-17702408f503
**Preview URL:** https://preview--confettiplan.lovable.app/

---

## Executive Summary

Confetti has a strong foundation — polished UI, consistent cream/ink/red theme, and several screens with excellent mock data (boarding pass, events, portal dashboard, gamification). The app needs targeted work across three areas before App Store submission: (1) fix "Concierge" → "Confetti" branding throughout, (2) populate empty screens with static mock data so the app feels complete end-to-end, and (3) wrap the web app in Capacitor for native iOS/Android packaging.

---

## Screen-by-Screen Audit Results

### Screens That Are Ready (Minimal or No Work Needed)

| Screen | Route | Status | Notes |
|--------|-------|--------|-------|
| Landing Page | `/` | Ready | Confetti branding, great hero, CTA works |
| Features | `/features` | Ready | Clean design, correct branding |
| How It Works | `/how-it-works` | Ready | Step-by-step flow |
| About | `/about` | Ready | Company info page |
| Contact | `/contact` | Ready | Contact form |
| Privacy / Terms | `/privacy`, `/terms` | Ready | Required for App Store |
| Portal Dashboard | `/portal` | Ready | Excellent — widgets, mock DC venues (Le Diplomate, Service Bar, Maydan) |
| Profile | `/portal/profile` | Ready | Stats, badges, settings — well built |
| Concierge Vibe Picker | `/concierge` | Ready | Gradient mood cards, level badge |
| Quick Generate Flow | `/plan` → `/plan/preview` → `/plan/ready` | Ready | Full boarding pass with mock DC itinerary — flagship feature works beautifully |
| Events | `/events` | Ready | 6 fully populated cards with images, dates, prices, category badges |
| Teams (For Business) | `/teams` | Ready | Great copy, 4 use-case cards, CTAs |
| Taste Tuner | `/taste-tuner` | Ready | Tinder-style swipe cards with images and tags — very polished |
| Advertiser Portal | `/advertise` | Ready | 3 pricing tiers, stats, great copy |
| Achievements | `/portal/achievements` | Ready (branding fix needed) | 9 badges, stats, search/filter — just fix "Concierge" text in badge descriptions |
| Passport / Gamification | `/concierge/passport` | Ready (branding fix needed) | Level/XP system, achievements, visit logger |

### Screens That Need Mock Data

| Screen | Route | Issue | Fix Required |
|--------|-------|-------|--------------|
| Discover | `/discover` | Stuck on "Loading venues..." forever | Add 8-12 hardcoded DC venues with images, ratings, cuisine tags |
| Trips | `/trips` | Shows "Loading..." with empty page | Add 2-3 mock past trip cards (DC Mother's Day, Weekend Brunch, etc.) |
| Concierge Chat | `/concierge/chat` | Empty "No chats yet" state only | Add 1-2 mock conversation threads with AI responses |
| Bookings | `/portal/bookings` | Clean empty state | Add 1-2 mock booking cards (upcoming reservation at Le Diplomate, past visit) |
| Activity | `/portal/activity` | Empty "No activity yet" | Add 5-6 mock activity entries (check-ins, plan changes, group updates) |
| Saved Spots | `/portal/saved` | Empty "Nothing saved yet" | Add 3-4 mock saved venue cards |
| Viral Now | `/viral` | "Nothing trending here yet" + references `/admin/integrations` (user-facing leak) | Add 6-8 mock trending venue cards; remove admin path reference |

### Branding Fixes (Concierge → Confetti)

These are all text/string replacements — straightforward but critical for brand consistency:

| Location | Current Text | Should Be |
|----------|-------------|-----------|
| Auth screen header | "Concierge / Your city insider" | "Confetti / Your city insider" |
| Auth screen tab title | "Sign in — Concierge" | "Sign in — Confetti" |
| Refer & Earn body text | "first Concierge booking" | "first Confetti booking" |
| Refer & Earn tab title | "Refer friends — Concierge" | "Refer friends — Confetti" |
| Saved spots tab title | "My Portal — Concierge" | "My Portal — Confetti" |
| Bookings tab title | "Bookings — Concierge" | "Bookings — Confetti" |
| Concierge Chat tab title | "Chats — Concierge" | "Chats — Confetti" |
| Achievements tab title | "Achievements — Concierge" | "Achievements — Confetti" |
| Passport tab title | "Passport — Concierge" | "Passport — Confetti" |
| Achievement badge text | "Got your first friend onto Concierge" | "Got your first friend onto Confetti" |
| Achievement badge text | "Keep using Concierge" | "Keep using Confetti" |
| Sidebar label (passport view) | "/ CONCIERGE" | "/ CONFETTI" or "/ PORTAL" |
| Ticker banner (some pages) | "YOUR CITY // ON A LOOP" | Consider updating or removing — feels like old branding |

**Recommended approach:** Do a global find-and-replace in the codebase for "Concierge" (case-sensitive) → "Confetti", then manually review each instance to make sure contextual uses still make sense (e.g., "AI concierge" as a feature description is fine, "Concierge" as the app name is not).

---

## Priority Action Plan

### Phase 1: Critical Fixes (Do First — 1-2 Days)

These are blockers for a polished demo and App Store review.

**1. Global Branding Fix**
- Find and replace all "Concierge" app name references → "Confetti"
- Update the auth screen logo/header
- Fix all browser tab titles (in `<title>` tags or route meta)
- Update achievement/badge description text
- Remove "YOUR CITY // ON A LOOP" ticker or update to Confetti tagline

**2. Fix Dead/Loading Screens**
- **Discover page**: Add hardcoded array of 8-12 DC venues with name, image URL, cuisine type, rating, price range, address. Remove the API loading state and render static data directly.
- **Trips page**: Add 2-3 mock trip objects with title, date, venue count, cover image. Show them as cards instead of "Loading..."
- **Viral Now**: Add 6-8 mock trending venues. Remove the "/admin/integrations" admin reference from the empty state message.

**3. Populate Empty States with Sample Data**
- **Concierge Chat**: Create 1 mock conversation thread with 3-4 message exchanges showing the AI recommending DC spots
- **Bookings**: Add 1 upcoming and 1 past mock booking
- **Activity Feed**: Add 5-6 mock entries like "Checked in at Le Diplomate", "Swapped stop 2 on Mother's Day plan"
- **Saved Spots**: Add 3-4 saved venue cards with images

### Phase 2: App Store Requirements (2-3 Days)

**4. Capacitor Setup (Recommended Packaging Approach)**

Capacitor is the best choice for Confetti because:
- Wraps your existing React web app as a native iOS/Android app
- Gives you native app icons, splash screens, and push notification capability
- Passes App Store review as a "real" app (unlike PWAs which Apple sometimes rejects)
- You keep building in Lovable/React — Capacitor just wraps the output
- Easy to add native plugins later (camera, geolocation, payments)

Steps:
1. Export the built site from Lovable (or connect Lovable to a GitHub repo)
2. Run `npm install @capacitor/core @capacitor/cli`
3. Run `npx cap init "Confetti" "app.confetti.plan"`
4. Run `npx cap add ios` and `npx cap add android`
5. Run `npx cap sync` to copy web assets into native projects
6. Open in Xcode (iOS) or Android Studio (Android)
7. Build, test on simulators, then submit

**5. App Store Assets Needed**

| Asset | iOS Requirement | Android Requirement |
|-------|----------------|-------------------|
| App Icon | 1024x1024 PNG (no transparency, no rounded corners) | 512x512 PNG |
| Screenshots | 6.7" (1290x2796), 6.5" (1284x2778), 5.5" (1242x2208) — at least 1 set | Phone + 7" tablet + 10" tablet |
| App Name | "Confetti — AI City Guide" (30 char max) | "Confetti — AI City Guide" |
| Subtitle | "Dining, nightlife & plans" (30 char max) | N/A |
| Description | 4000 chars max — highlight AI planning, boarding pass, gamification | Same |
| Category | Food & Drink (primary), Lifestyle (secondary) | Food & Drink |
| Privacy Policy URL | Required — already exists at `/privacy` | Required |
| Support URL | Required — use `/contact` | Required |
| Age Rating | 4+ (no mature content) | Everyone |

**6. iOS-Specific Requirements**
- Apple Sign In: Already present on auth screen — must work for App Store approval
- Privacy nutrition labels: Declare what data you collect (email, name, usage data)
- No "beta", "test", or "demo" language visible in the app
- All links must work (no dead ends or 404s)
- App must function without network if possible (or gracefully handle offline)

**7. Android-Specific Requirements**
- Target API level 34+ (Android 14)
- Data safety form in Google Play Console
- Content rating questionnaire
- Feature graphic (1024x500)

### Phase 3: Polish & Submit (2-3 Days)

**8. Navigation & Flow Audit**
- Ensure every sidebar link works and doesn't dead-end
- "Plan a new day" / "Build a Night" buttons should all route to the plan flow
- Back buttons should work consistently
- Ensure the View As selector doesn't break navigation

**9. Mobile Responsiveness Check**
- Test all screens at 375px (iPhone SE) and 390px (iPhone 14) widths
- Ensure the sidebar collapses properly on mobile
- Boarding pass should render cleanly on phone screens
- Nav header shouldn't overflow on small screens

**10. Performance & Polish**
- Remove any console.log statements
- Ensure no "Loading..." spinners persist indefinitely (replace with mock data or timeout gracefully)
- Add proper error boundaries so the app doesn't white-screen on errors
- Confirm all images load (no broken image placeholders)

---

## What NOT to Do Yet

- **Don't add real API integrations** — build the full static experience first
- **Don't pay for API keys** until the app is approved and you're ready to go live
- **Don't build a custom backend** — Supabase auth is sufficient for now
- **Don't worry about real venue data** — mock data that looks real is the goal

---

## Estimated Timeline

| Phase | Work | Duration |
|-------|------|----------|
| Phase 1 | Branding fixes + mock data for empty screens | 1-2 days |
| Phase 2 | Capacitor setup + App Store assets | 2-3 days |
| Phase 3 | Polish, responsiveness, submission | 2-3 days |
| **Total** | | **5-8 days** |

---

## Summary of Findings

**What's working great:** The boarding pass flow is the killer feature — it works end-to-end beautifully. The portal dashboard, events page, gamification system, advertiser portal, teams page, and taste tuner are all polished and feel like a real app. The cream/ink/red design system is consistent and distinctive.

**What needs fixing:** ~15 instances of "Concierge" branding need to become "Confetti". Seven screens show empty/loading states that need hardcoded mock data. The Discover page is particularly important since it's a primary navigation destination.

**Packaging recommendation:** Use Capacitor to wrap the React app for both iOS and Android. It's the fastest path to the App Store with your existing Lovable/React codebase, and it produces genuine native apps that pass review.
