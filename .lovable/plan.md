# Rebrand to "Loop" + 10 new feature surfaces

This is a large multi-file build. Plan first, build after approval.

## 1. Rebrand: Party Planner Plus → Loop

- Global find/replace across `src/` for "Party Planner Plus" → "Loop", "Party Planner" → "Loop", and reward currency tokens → "Confetti"
- Update `<head>` titles in route files, root layout meta, footer, header logo text
- Keep current light theme + warm palette (no token changes)

## 2. New routes (each is a `src/routes/*.tsx` file)

| Route | File |
|---|---|
| `/boarding-pass` | `boarding-pass.tsx` |
| `/onboarding` | already exists — replace content with 5-step wizard |
| `/create` | `create.tsx` (4-step Loop creator) |
| `/active-loop` | `active-loop.tsx` |
| `/venue/$id` | `venue.$id.tsx` |
| `/confirmation` | `confirmation.tsx` |
| `/passport` | `passport.tsx` |
| `/chat` | `chat.tsx` |

All wired in `routeTree.gen.ts` via TanStack file routing (auto).

## 3. Shared components (under `src/components/loop/`)

- `BoardingPass.tsx` — airline-style card with tear perforation, barcode SVG, timeline of stops, Apple/Google Wallet buttons
- `TabBar.tsx` — fixed bottom nav (Home, Discover, Create [prominent], Passport, Profile) with active dot indicator. Mounted in `__root.tsx` on mobile-friendly routes.
- `WizardShell.tsx` — reusable progress bar + Back/Next + framer-motion step transitions (used by `/onboarding` and `/create`)
- `ConfettiBurst.tsx` — 42-piece falling confetti animation
- `ChipGrid.tsx` — reusable selectable chip grid for tastes/vibes/cities
- `TypingDots.tsx` — 3 bouncing dots typing indicator

## 4. Per-feature details

### Boarding Pass
- Mock data from a context/hook `useActiveLoop()` (localStorage-backed for now)
- Sections: header (BOARDING PASS + plane), passenger/date/group, FROM→TO route, GATE/BOARDING/SEAT row, dotted divider, vertical timeline of stops with check circles, perforation tear-line, barcode bars
- Apple Wallet / Google Wallet buttons (visual only — toast "Coming soon")

### Onboarding (`/onboarding` rewrite)
- 5 steps: City → Tastes → Vibes → Budget (slider $50–$500+) → Group size
- Persists choices to `localStorage` (`loop:onboarding`)
- On finish → `/portal` (home). First-visit gate via localStorage flag in `__root.tsx`.

### Loop Creator (`/create`)
- 4 steps: Who / What / When / Vibe
- Step 1 includes a "Generate for me" shortcut card → `/quick-generate`
- Final summary → "Create My Loop" → writes mock loop to localStorage → `/boarding-pass`

### Active Loop (`/active-loop`)
- Reads loop from localStorage, marks current stop with pulsing "NOW"
- "I'm Here" check-in: confetti burst, +50 Confetti (localStorage `loop:confetti`), stop marked done
- Mini-map placeholder div with gradient + pin icons
- Next Stop card with ETA, "End Loop Early" button at bottom

### Venue Detail (`/venue/$id`)
- Hero image (Unsplash), name/type/rating/price/area
- Tag chips, "Why we picked this" AI card, hours/phone/address
- Add to Loop / Book Now buttons
- 4-image photo grid

### Confirmation (`/confirmation`)
- Full-screen confetti, large gradient checkmark circle
- Loop summary, Wallet buttons, "View Boarding Pass" CTA, Share button

### Passport (`/passport`)
- Level + Confetti total, badges grid (Explorer, Night Owl, Foodie, Social Butterfly, Trailblazer, Local Legend)
- Recent activity feed (mock), level progress bar, redeem section

### AI Chat (`/chat`)
- Uses Lovable AI Gateway via existing edge function pattern (or simple client mock if none exists — will check `concierge.chat` first and reuse)
- Bubble UI, sparkle avatar, typing dots, suggested chips, typewriter reveal

## 5. Home update (`portal.index.tsx` or `index.tsx`)
- Greeting hero "Hey, {name}"
- Quick Generate CTA (existing) prominent
- "Continue your Loop" card if `localStorage` has active loop
- Trending venues horizontal scroll
- Taste profile summary linking to `/taste-tuner`
- Keep existing Quick Generate, Taste Tuner, Social Connect

## 6. Tab Bar mounting
- Render `<TabBar />` in `__root.tsx` for app-shell routes (home, discover, create, passport, profile, boarding-pass, active-loop, venue, chat)
- Hide on auth, admin, marketing pages

## Out of scope (will note for next iteration)
- Real Apple/Google Wallet pass generation (.pkpass)
- Real GPS geolocation (just simulated)
- Real maps SDK (placeholder block)
- Backend persistence of loops/confetti (localStorage only this pass)

## Files
- **New**: 8 route files + 6 shared components
- **Edited**: `__root.tsx` (TabBar + onboarding gate + brand), `portal.index.tsx` (home), `onboarding.tsx` (rewrite), header/footer components for rebrand, any file containing "Party Planner Plus"

Approve to proceed.