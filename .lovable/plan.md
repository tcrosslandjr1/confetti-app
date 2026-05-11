## Goal

Rebrand the existing app to **Confetti** (curated city experience, light theme, coral/orange on white), wire up the Google Maps key, and refresh the 10 feature areas listed. Most routes already exist (`/boarding-pass`, `/onboarding`, `/create`, `/confirmation`, `/passport`, `/chat`, `/venue/$id`, `/quick-generate`, `/taste-tuner`, `/active-loop`) so most work is rebuild + polish, not greenfield.

## Scope notes (please read before approving)

- **Env var**: `VITE_GOOGLE_MAPS_API_KEY` cannot be added to `.env` (auto-managed by Lovable Cloud). Since `VITE_*` keys are exposed to the browser anyway, I'll store the Maps key as a constant in `src/lib/config.ts` and recommend you restrict it by HTTP referrer in Google Cloud Console. This is the standard pattern for publishable keys here.
- **Active plan route**: spec calls it `/active-confetti`. The current file is `/active-loop`. I'll create the new `/active-confetti` route and leave `/active-loop` as a thin redirect so old links don't 404.
- **Theme**: keep the existing light theme. I'll audit `src/styles.css` to ensure coral/orange-on-white tokens are the source of truth and remove any "Loop" / "Party Planner Plus" naming that leaks into UI copy.
- **Wallet buttons**: "Add to Apple Wallet / Google Wallet" will be visual buttons with the right icons; clicking shows a "coming soon" toast (real `.pkpass` / Google Wallet JWT signing requires server-side certs that aren't set up).
- **Map placeholder**: `/active-confetti` will render a Google Maps `<iframe>` embed using the new key as the "mini-map", since `@vis.gl/react-google-maps` isn't installed and adding a full SDK is out of scope here. Tell me if you want the full interactive SDK and I'll add it as a follow-up.

## Implementation plan

### 1. Branding sweep
- Add `src/lib/config.ts` exporting `GOOGLE_MAPS_API_KEY` and `APP_NAME = "Confetti"`.
- Replace user-visible occurrences of "Loopplan", "Loop", "Party Planner Plus" with **Confetti** in: `__root.tsx`, `SiteFooter`, `index.tsx`, `about.tsx`, `pricing.tsx`, `features.tsx`, `how-it-works.tsx`, `me.tsx`, `chat.tsx`, `boarding-pass.tsx`, `confirmation.tsx`, `passport.tsx`, `create.tsx`, `onboarding.tsx`, `venue.$id.tsx`, page `<title>`/`og:title` tags. Leave internal identifiers (file names, store keys like `loop-store`, ad helpers) untouched to avoid breaking imports.
- Reward currency text "Loop" / "Loops" → "Confetti".

### 2. Tab bar
- New `src/components/ConfettiTabBar.tsx` with 5 tabs: Home (`/`), Discover (`/trips` or `/events`), Create (`/create`, prominent center), Passport (`/passport`), Profile (`/me`). Active tab gets a coral dot indicator.
- Mount inside `__root.tsx` as a fixed bottom bar on small screens; hide on `/admin*`, `/auth`, and onboarding.

### 3. Home (`/`)
- Replace hero with "Hey, {firstName}" greeting (falls back to "there" when signed out), Quick Generate CTA card, "Continue your plan" card (reads from `loop-store` if an active plan exists), trending venues horizontal scroll, and a "Your taste profile" summary card linking to `/taste-tuner`.
- Keep existing testimonials/marquee sections below.

### 4. Boarding Pass (`/boarding-pass`)
- Rebuild `src/components/loop/BoardingPass.tsx` to the spec: BOARDING PASS header + plane icon, passenger/date/group, HOME → NIGHT OUT route, GATE / BOARDING TIME / SEAT fields, vertical stop timeline with checkmark circles, dotted-line perforation + barcode strip, Apple/Google Wallet buttons.

### 5. Onboarding wizard (`/onboarding`)
- 5 steps: City → Tastes → Vibes → Budget slider ($50–$500+) → Group size. Top progress bar, Back/Next, fade-in transitions. Persists to `localStorage` (`confetti.onboarding`) and to Supabase profile if signed in. First-visit redirect from `/` when flag missing.

### 6. Confetti Creator (`/create`)
- 4 steps (Who / What / When / Vibe) + a "Generate for me" shortcut card on Step 1 linking to `/quick-generate`. Final summary → `/boarding-pass`.

### 7. Active plan (`/active-confetti`)
- Mini Google Maps iframe at top, current stop with pulsing NOW badge, "I'm Here" check-in button → confetti burst + toast "+50 Confetti" + green checkmark, Next Stop card with ETA, End Early button.
- Add `/active-loop` redirect.

### 8. Venue detail (`/venue/$id`)
- Hero image, name/type/rating/price/area, tag chips, "Why we picked this" AI card, hours/phone/address, Add to Plan + Book Now buttons, 3–4 image grid.

### 9. Confirmation (`/confirmation`)
- 42-piece confetti rain, gradient-circle checkmark, plan summary, Wallet buttons, "View Boarding Pass" CTA, "Share with friends".

### 10. Passport (`/passport`)
- Level + total Confetti header, achievement badges grid (Explorer, Night Owl, Foodie, Social Butterfly, +4 more), recent activity feed, progress bar to next level, Redeem Confetti grid.

### 11. AI Chat (`/chat`)
- Bubble UI (user right, AI left with sparkle avatar), 3-dot typing indicator, suggested-reply chips, typewriter reveal. Backend: existing Lovable AI Gateway edge function if present, otherwise a new `confetti-chat` edge function using `google/gemini-2.5-flash`.

## Out of scope (will note in final reply)
- Real Apple Wallet `.pkpass` signing and Google Wallet JWT issuance.
- Full interactive Google Maps SDK with markers/directions (using embed iframe instead).
- Renaming files/DB tables/store keys that contain "loop".
