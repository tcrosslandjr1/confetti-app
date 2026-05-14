## Goal

A new visitor on iPhone or Android lands on `/`, instantly understands "Confetti builds your night out in under a minute", and has exactly one obvious next tap. App-store-grade first impression.

## What's wrong today

- Hero says "Plans with a pulse" — vibey, not explanatory. No first-time visitor understands what tapping "Build my night" will actually do.
- Two side-by-side CTAs ("Build my night" / "How it works") split attention. Caption "no signup to try" floats awkwardly.
- Receipt mock-card looks like a real plan but isn't interactive — confusing on mobile.
- Marquee + multiple long sections push the actual product below the fold.
- Bottom tab bar shows 5 destinations (Home, Discover, Create, Passport, Profile) but the home screen never explains them.
- No "what happens when I tap this" preview, no progress affordance, no recovery if the wizard errors out.

## Plan (mobile-first, desktop unchanged)

### 1. Rewrite the hero for clarity, not vibe (`src/routes/index.tsx`)

- Eyebrow: `TONIGHT IN [CITY] · LIVE` (uses existing city context)
- H1: short and literal — `Your night out, planned in 60 seconds.`
- Sub: one sentence — `Pick a vibe. Get real venues, real times, and tap-to-book reservations. Free, no signup.`
- One primary CTA full-width on mobile: `Plan my night → 60 sec` (opens wizard)
- Secondary text link below: `See a sample plan` (scrolls to receipt card)
- Remove the inline "no signup to try" caption (fold into sub-copy)

### 2. Add a "How it works in 3 steps" strip directly under the hero

Three numbered cards, horizontally scrollable on mobile, grid on desktop:
1. Tell us the vibe (rooftop, dive bar, date night…)
2. We build the route — venues, times, walking + Lyft
3. Tap to book. Show up. We handle the rest.

Each card has an icon and one line. This is the missing "what does this app do" answer.

### 3. Make the receipt card obviously a sample, and make it tappable

- Add a `SAMPLE PLAN` ribbon to the receipt mock
- Wrap it in a button that opens the wizard pre-loaded with that vibe ("cute, walkable, ends with a slow drink")
- Add a single `Try this plan` CTA inside the card on mobile

### 4. Persistent first-run nudge above the bottom nav

A dismissible 1-line bar (mobile only): `New here? Start with Build my night →` that opens the wizard. Stored in `localStorage` so it disappears after dismiss or after the wizard is opened once.

### 5. Wizard hardening (one small fix, not a redesign)

- First step of `BuildMyNightWizard` shows a one-line preview: `Step 1 of 6 · Pick a vibe · ~45 sec total`
- If a step's network call fails (the `pick-signals` 401 we already saw), show a toast and let the user continue — never dead-end
- "Continue" button stays sticky at the bottom of the modal so it's always reachable on small screens

### 6. Tighten visible polish on `/`

- Reduce marquee height on mobile (`py-3` instead of `py-4`) and lower contrast so it stops competing with the hero
- Add `font-display: swap` preload hint for the display font (already imported) to fix FOUT on first paint
- Ensure every interactive element on `/` has min 44×44 tap target

## Out of scope (call out, don't do now)

- Discover, Venue, Passport, Profile, Auth screens
- Performance work beyond font preload + image lazy-loading on `/`
- Real PWA / install prompt
- Onboarding tour beyond the single first-run nudge

## Files touched

- `src/routes/index.tsx` — hero, 3-step strip, sample-plan card, first-run nudge
- `src/components/wizard/BuildMyNightWizard.tsx` — sticky footer, step header copy, error toast
- `src/components/wizard/wizard-context.tsx` — accept a `vibeKey` preset from the sample card (already supported)
- maybe `src/styles.css` — small font-preload hint
