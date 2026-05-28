# Confetti Pre-Ship UX Checklist

Every screen in `/src/routes/new.*.tsx` must pass every applicable item before it's considered shippable. This isn't optional polish — a single miss here (like a missing back button) breaks user trust instantly.

---

## 1. Navigation — Can the user get in AND out?

- [ ] **Back button present** — Every inner screen has a `BackButton` (from `shell.tsx`) or equivalent dark-theme back button. Only true root screens (`hub`, `signin`) skip this.
- [ ] **Back target is explicit** — `onClick={() => navigate({ to: "/new/..." })}` points to a real, logical parent. Never `history.back()` (breaks on deep links and refreshes).
- [ ] **TopBar layout is balanced** — If using the 3-item flex pattern (`BackButton | BrandMark | spacer`), the spacer is 36px wide to center the BrandMark.
- [ ] **Bottom nav/CTAs don't overlap content** — Scrollable content has enough bottom padding to clear any fixed footer buttons.
- [ ] **All `navigate()` targets exist** — Every `navigate({ to: ... })` points to an actual route file in `src/routes/`. No dead links.

## 2. States — What does the user see at every stage?

- [ ] **Loading state** — Any screen that fetches data shows a visible loading indicator (spinner, skeleton, or `"loading..."` text) while `ready === false` or data is in-flight.
- [ ] **Empty state** — If a list/feed/collection can be empty, there's a designed empty state — not a blank white void. Tell the user *why* it's empty and *what to do*.
- [ ] **Error state** — Network failures, auth failures, and missing data show a clear error message with a retry or escape action. Never a blank screen or unhandled promise rejection.
- [ ] **Success/confirmation state** — Destructive or irreversible actions (payments, sharing, submissions) show confirmation before AND feedback after.
- [ ] **Disabled state** — Buttons that depend on form completion or async work are visually disabled (`opacity: 0.45`, `cursor: not-allowed`) and functionally inert.

## 3. Buttons & Interactions — Does every tap do something?

- [ ] **Every button has a handler** — No `onClick={() => {}}` or missing `onClick`. If a button exists, it must do something real or navigate somewhere real.
- [ ] **No dead-end buttons** — Buttons labeled "contact", "share", "invite", etc. must have real functionality, not placeholder `navigate({ to: "/new/hub" })` that just bounces home.
- [ ] **ChunkyButton variant matches intent** — `"primary"` for main action, `"accent"` for secondary CTA, `"ghost"` for tertiary/cancel. Never two `"primary"` buttons side by side.
- [ ] **Touch targets are 44px+** — All tappable elements are at least 44×44px. The `BackButton` is 36px wide which is tight — don't go smaller anywhere.
- [ ] **No double-tap issues** — Buttons that trigger async work (API calls, navigation) are disabled or debounced after the first tap to prevent double submissions.

## 4. Typography & Visual Consistency

- [ ] **Correct font stack** — Headlines use `TOKENS.display` (Bricolage Grotesque). Body uses `TOKENS.ui` (Inter). Labels/codes use `TOKENS.mono` (JetBrains Mono). No raw `font-family` strings.
- [ ] **Uses TOKENS, not hex codes** — Colors reference `TOKENS.ink`, `TOKENS.accent1`, etc. No hardcoded hex values outside of `shell.tsx`.
- [ ] **Stamp, Ticket, Chip from shell.tsx** — Uses shared components, not one-off inline implementations of the same visual pattern.
- [ ] **Box shadows follow the system** — Chunky shadow is `Npx Npx 0 ${TOKENS.ink}`. No `rgba()` drop shadows on brutalist elements.

## 5. Layout & Responsiveness

- [ ] **Wrapped in `<Frame>`** — Every `/new/*` screen is wrapped in the `Frame` component. No exceptions.
- [ ] **Content doesn't overflow the frame** — The Frame is 420×874px max. Long content uses `overflowY: "auto"` with hidden scrollbars (`scrollbarWidth: "none"`).
- [ ] **Padding follows the pattern** — Top padding is `56px` (accounts for the top bar area). Side padding is `20-24px`. Bottom padding is `22-28px`.
- [ ] **z-index layers are correct** — `DotsBg` and `FloatingTickets` are behind content (`pointerEvents: "none"`). Interactive content has `position: relative; zIndex: 2`.

## 6. Flow Integrity — Walk the full journey

- [ ] **Entry → screen → exit tested** — Navigate to this screen from its parent, interact with it, and leave. Does the loop work?
- [ ] **Deep link works** — Paste the URL directly into the browser. Does the screen render correctly without prior navigation context?
- [ ] **Auth gate works** — Screens behind `useNewAuth()` redirect unauthenticated users to `/new/signin` or show a loading state. They never flash private content.
- [ ] **Forward navigation works** — If this screen sends the user somewhere next (e.g., printing → pass), that destination exists and handles the incoming state.

## 7. Content & Copy

- [ ] **No placeholder text** — No "Lorem ipsum", no "Coming soon", no "TBD" visible to users. Every string is final copy or a real dynamic value.
- [ ] **No Heritage Power Group references** — Zero mentions of HPG, electrical contracting, or anything from the other business. Ever.
- [ ] **Branding is "confetti" or "confetti."** — Lowercase "confetti" with optional period. Never "Confetti" (capitalized) in the UI, never "Loop" (old name).
- [ ] **Timestamps and currencies are formatted** — Dates use readable formats. Money shows currency symbol and two decimals. No raw epoch timestamps or cent values.

## 8. Dark Theme Screens

Some screens (like `new.night.tsx`) use dark backgrounds. These have different rules:

- [ ] **Back button uses dark variant** — `background: "rgba(0,0,0,0.4)"`, `border: 2px solid ${TOKENS.paper}`, `color: TOKENS.paper`, `backdropFilter: "blur(8px)"`.
- [ ] **Text color is `TOKENS.paper`** — Not `TOKENS.ink` (which is near-black and invisible on dark backgrounds).
- [ ] **Accent colors still pop** — Stamps, chips, and highlights remain visible against the dark background.

---

## How to Use This

**Before every PR that touches a `/new/*` route:**

1. Open the checklist
2. Run through every applicable section
3. If anything fails, fix it before pushing
4. Walk the full flow (Section 6) last — it catches integration issues the item-level checks miss

**When building a new screen:**

1. Start with `<Frame>` + `<TopBar onBack={...} />`
2. Add loading, empty, and error states before the happy path
3. Wire all buttons to real destinations
4. Run the full checklist before considering it done
