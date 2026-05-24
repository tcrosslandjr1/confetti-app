# Confetti UI/Design Enhancement Mega-Prompt for Lovable

> Paste this entire prompt into Lovable. It covers every page, mobile polish, animations, micro-interactions, and design consistency.

---

## Context

Confetti is a playful, bold AI-powered lifestyle concierge app. The design language is **neo-brutalist with a warm twist**: cream backgrounds, coral/gold/ink accents, thick 2px borders, `shadow-brut` drop shadows, rounded-2xl corners, mono uppercase labels, and a display font for headings. Think "luxury meets street art."

The app already has these animation utilities in `src/styles.css` — USE THEM, don't reinvent:
- `reveal` / `reveal-scale` + `.in` classes (IntersectionObserver-based entrance)
- `@keyframes card-pop-in`, `float`, `shimmer`, `wiggle`, `confetti-fall`, `pulse-glow`, `reveal-up`, `reveal-scale`, `fade-in-msg`
- Utility classes: `.glass`, `.grain`, `.tilt-3d`, `.parallax`
- `prefers-reduced-motion` safety net already in place

The app has a `<Reveal>` and `<RevealStagger>` component at `src/components/Reveal.tsx` and a `<PageTransition>` component at `src/components/PageTransition.tsx` using framer-motion. Use these.

---

## Global Rules (apply everywhere)

### Mobile-first
- Every page must look perfect at 375px width (iPhone SE) through 430px (iPhone 15 Pro Max)
- Bottom nav (`AppShell`) must never overlap content — add `pb-20` or `pb-24` to all `/app/*` pages
- Tap targets must be at least 44x44px
- No horizontal overflow — audit every horizontal scroll container for proper padding and `overflow-x-auto`
- Use `safe-area-inset-bottom` padding where the bottom nav sits

### Animations & Transitions
- Wrap every section in `<Reveal>` with staggered `delay` props (80ms step)
- Cards should have `transition-transform duration-200 active:scale-[0.97] hover:scale-[1.03]` for tap feedback
- Category/filter chips: `transition-all duration-200 active:scale-95`
- Page route changes already use `<PageTransition>` — ensure it wraps children in `__root.tsx`
- Loading states: use `animate-pulse` skeleton placeholders, not spinners
- Button press: `active:scale-95 transition-transform duration-150`
- Image loading: fade in with `opacity-0 → opacity-100` transition on `onLoad`

### Design Consistency
- All cards: `rounded-2xl border-2 border-ink shadow-brut` (brutalist style pages) OR `rounded-2xl border border-border` (app shell pages)
- Section headings: uppercase mono tracking-widest, small text
- Empty states: dashed border, centered icon + text, muted foreground
- Use `font-display` for page titles, `font-mono` for labels/tags
- Color accents: coral for CTAs, gold for highlights/badges, teal for success

---

## Page-by-Page Instructions

### 1. `/app` — Tonight Feed (`app.index.tsx`)
- [DONE] Sections wrapped in `<Reveal>` with staggered delays
- [DONE] Venue cards and reel thumbnails have hover/tap scale
- Add: skeleton loading cards while `venues`/`reels`/`events` are loading (`isLoading` from useQuery)
- Add: subtle gradient overlay on reel thumbnails (already partial — make consistent)
- Add: "See all" links next to section headings that navigate to `/app/explore` and `/app/reels`

### 2. `/app/explore` — Explore (`app.explore.tsx`)
- [DONE] Venue list items have staggered Reveal entrance + tap scale
- [DONE] Category chips have active:scale-95
- Add: search input should have a subtle `focus:ring-2 ring-primary/30` glow
- Add: skeleton placeholders when loading
- Map view placeholder: add a subtle animated gradient or shimmer instead of static text

### 3. `/app/plan` — Plan My Night (`app.plan.tsx`)
- Wrap the entire wizard in a step-transition animation (slide left/right between steps)
- Each step should `<Reveal>` its content
- The occasion and vibe picker buttons should have `active:scale-95` tap feedback
- Budget slider: add a tooltip that follows the thumb
- Final "Generate" button: add `pulse-glow` animation to draw attention
- Add a confetti burst animation (`<ConfettiBurst>` component exists) when the plan is generated

### 4. `/app/reels` — Reels Feed (`app.reels.tsx`)
- Full-screen vertical snap scroll (like TikTok)
- Each reel should snap to viewport height: `h-[100dvh] snap-start`
- Add swipe-up gesture hint on the first reel (animated chevron)
- Reel metadata (title, venue, location) should slide up from bottom with `reveal-up`
- Like/share/bookmark buttons on the right side with `active:scale-90` tap feedback
- Add: double-tap to like with a heart burst animation

### 5. `/app/profile` — Profile (`app.profile.tsx`)
- Profile card at top: add a subtle `float` animation to the avatar ring
- Stats row (favorites, badges, etc.) should use `<RevealStagger>` with scale variant
- Settings/menu items: add chevron icons and `active:bg-muted` press state
- Badges section: each badge should have a `card-pop-in` entrance animation
- Add: pull-to-refresh gesture (component exists at `src/components/PullToRefresh.tsx`)

### 6. `/chat` — AI Chat (`chat.tsx`)
- [DONE] Messages have typewriter + reveal-up animations
- [DONE] Venue cards render inline
- Add: suggestion chips should have a staggered entrance animation when they update
- Add: the AI avatar sparkle icon should have a subtle `wiggle` animation while typing
- Add: venue cards inside messages should have `card-pop-in` animation

### 7. `/venue/$id` — Venue Detail (`venue.$id.tsx`)
- Hero image: full-width with parallax scroll effect (use `.parallax` class)
- Add: image gallery horizontal scroll with snap points
- Content sections (about, menu, reviews): wrap each in `<Reveal>` with stagger
- "Book" / "Add to plan" CTA button: sticky at bottom with `shadow-brut`, `active:scale-95`
- Review cards: staggered entrance
- Back button: add `backdrop-blur` glass effect header that appears on scroll

### 8. `/trips/index` — Trips List (`trips.index.tsx`)
- Trip cards should use `card-pop-in` staggered animation
- Each card: show a mini boarding-pass preview with the `tilt-3d` hover effect
- Empty state: animated illustration or confetti graphic with "Plan your first night" CTA
- Add: swipe-to-delete gesture on trip cards

### 9. `/trips/$id` — Trip Detail (`trips.$id.tsx`)
- Timeline/stops: use a vertical line connector with animated dots
- Each stop card should `<Reveal>` in sequence
- "Share" button should trigger confetti burst
- Add: estimated time between stops

### 10. `/trips/$id/passport` and `/boarding-pass` — Boarding Pass
- The boarding pass should have the `tilt-3d` effect on hover/touch
- Add: subtle `shimmer` animation across the pass like a holographic effect
- QR code section: add `pulse-glow` to draw attention
- Tear-line / perforation: use a dashed border with slight animation

### 11. `/events/index` — Events List (`events.index.tsx`)
- Event cards: staggered `<Reveal>` entrance
- Date badges: use the gold accent with `card-pop-in`
- Category filter chips: already have `transition-pop` — ensure consistency with explore page chips
- Geolocation button pulse: already has `animate-pulse` — good

### 12. `/events/$eventId` — Event Detail (`events.$eventId.tsx`)
- Hero image with parallax
- Event info sections: staggered Reveal
- "RSVP" / "Get Tickets" button: sticky bottom CTA with pulse-glow
- Attendee avatars: stacked with overlap, slight float animation

### 13. `/check-in` — Check-In Confirmation (`check-in.tsx`)
- Big success checkmark: use `reveal-scale` with a bounce overshoot
- Confetti burst animation on successful check-in
- Venue name: typewriter effect
- Points earned: counter animation (count up from 0)
- Add: haptic feedback hint (CSS visual only — slight shake then settle)

### 14. `/business` — Business Landing (`business.index.tsx`)
- Already has framer-motion — good
- Ensure all sections use staggered entrance
- Stats counter: animate numbers counting up
- CTA sections: add `pulse-glow` to primary buttons
- Testimonial cards: horizontal scroll with snap

### 15. `/business/dashboard` — Business Dashboard (`business.dashboard.tsx`)
- KPI cards: `<RevealStagger>` with scale variant
- Charts: fade-in with slight scale-up
- Table rows: staggered entrance
- Period selector: `active:scale-95` on chips

### 16. Auth pages (`auth.tsx`, `auth.lazy.tsx`)
- Already well-animated — no changes needed
- Ensure mobile keyboard doesn't push layout off-screen (use `visual-viewport` resize handling)

### 17. Landing page (`index.tsx`)
- Already well-animated — light touch only
- Ensure CTA buttons have consistent `active:scale-95`
- Verify all images lazy-load with fade-in

### 18. `/influencer` — Influencer Page
- Add: scroll-triggered counters for the compensation tier numbers
- Boarding pass hero: add `shimmer` animation
- Application form: smooth expand animation

---

## Additional Global Enhancements

### Navigation & App Shell
- Bottom nav icons: add a subtle bounce when tapped (the active one)
- Active tab indicator: smooth sliding underline/pill that transitions between tabs
- Header: add `backdrop-blur-xl bg-background/80` for glass effect on scroll

### Loading & Empty States
- Every page that fetches data: show skeleton cards (rounded-2xl, animate-pulse, same dimensions as real cards)
- Empty states: use a consistent pattern — centered icon, heading, subtext, optional CTA button
- Error states: coral accent border, retry button

### Haptic-feel Micro-interactions
- All tappable elements: `active:scale-95` or `active:scale-[0.97]` with `transition-transform duration-150`
- Toggle switches: smooth slide with color transition
- Pull-to-refresh: use the existing `<PullToRefresh>` component on all scrollable list pages

### Typography Polish
- Page titles: `text-2xl font-display font-bold` on mobile, `text-3xl` on desktop
- Section headings: `text-sm font-semibold tracking-tight` (not too loud)
- Body text: `text-sm` on mobile, `text-base` on desktop
- Timestamps/metadata: `text-[11px] text-muted-foreground`

### Image Handling
- All `<img>` tags: add `loading="lazy" decoding="async"`
- Add fade-in on load: wrap in a component that transitions `opacity-0 → opacity-100` on the img's `onLoad` event
- Broken image fallback: show a gradient placeholder with the venue/event initial

---

## DO NOT

- Do not remove any existing animations from `index.tsx` or `auth.tsx`
- Do not change the color palette or font families
- Do not add any new npm dependencies — use existing framer-motion, lucide-react, and CSS keyframes
- Do not touch `routeTree.gen.ts` — it is auto-generated and gitignored
- Do not modify the AI chat agent files (`src/lib/agents/*`)
- Do not use `localStorage` or `sessionStorage`
- Do not add sound effects or audio
