# Build Plan — Admin Console, Customer Portal, Role Switcher

We'll ship this in 4 phases so each one is testable on its own. You can review and tweak between phases.

---

## Phase 1 — Foundation: Roles, Seed Accounts, Brand Assets

**Goal:** You can log in as Admin, Customer, or Visitor and switch between them instantly.

**Database**
- New `app_role` enum: `admin`, `customer`
- New `user_roles` table (user_id, role) with RLS — roles stored separately to prevent privilege escalation
- `has_role(user_id, role)` security-definer function for safe RLS checks
- Trigger: every new signup auto-gets `customer` role

**Seed accounts** (created by you on first run via a one-click button)
- `admin@demo.local` / `Demo1234!` — full admin
- `customer@demo.local` / `Demo1234!` — regular customer
- Visitor = signed-out browsing

**Role Switcher (dev-only impersonation)**
- Floating pill in the top-right, visible **only to admins**
- Three buttons: Admin / Customer / Visitor
- "Customer" view = sets a session flag that hides admin UI and treats you as a customer (real RLS still applies — you see admin's own data, but with the customer chrome)
- "Visitor" view = same flag + hides authenticated UI, shows public landing
- Persistent "Exit impersonation" banner across the top of the screen when active
- Stored in `sessionStorage` so refresh keeps the view, but logout clears it

**Brand integration**
- Logo, colors, and fonts you upload get wired into `src/styles.css` design tokens
- Tailwind classes (`bg-primary`, `text-foreground`, etc.) automatically pick them up

**Responsive editing (web / tablet / mobile)**
- All new screens built mobile-first with `sm:` / `md:` / `lg:` breakpoints so they look right at 375px, 768px (iPad), and 1280px+ (desktop) without separate codepaths
- You can switch the preview between viewports with the device toggle above the preview

---

## Phase 2 — Admin Console (Full Ops)

**New section at `/admin`** (protected by `has_role(uid, 'admin')`)

Sidebar layout with these sections:

1. **Dashboard** — KPI cards (total users, active bookings, revenue MTD, top venues), recent activity feed
2. **Users** — list, search, filter by role, view profile, promote to admin / demote, deactivate
3. **Venues & Experiences** — full CRUD, image upload to storage, set price level, neighborhood, category, featured toggle
4. **Curated Content** — manage homepage featured spots, mood collections (Date Night, Late Eats, etc.), editorial lists
5. **Bookings** — table of all reservations, filter by status (pending / confirmed / cancelled / completed), cancel, refund
6. **Visits & Moderation** — review user-submitted check-ins, hide inappropriate notes, approve photos
7. **Analytics** — signups over time, bookings funnel, top-searched neighborhoods/cuisines, AI chat volume

**Bookings & visits-moderation are stubbed in Phase 2** with mock data; they go live in Phase 3.

---

## Phase 3 — Customer Portal Buildout + Bookings

**New customer area at `/portal`** with bottom-nav (mobile) and sidebar (desktop):

1. **Discover** — refined home with curated rails, mood picker (already partly built)
2. **Concierge** — existing AI chat, polished
3. **Bookings** — browse bookable venues/experiences, pick date+time+party size, confirm reservation; view upcoming + past bookings, cancel
4. **Passport** — XP / level / achievements (already built, polished)
5. **Saved** — favorite venues, wishlists
6. **Profile** — preferences, payment methods, account settings

**Database additions**
- `bookings` table (user_id, venue_id, starts_at, party_size, status, total_cents, stripe_session_id)
- `saved_venues` table
- `featured_content` table (for admin curation)
- All with RLS

**Admin bookings/moderation views go live** — wired to real data.

---

## Phase 4 — Payments (Stripe)

We run `recommend_payment_provider` first to confirm Stripe fits the lifestyle/dining/experiences product type. Then:

- Enable Lovable's built-in Stripe (no account setup needed for testing — test mode works immediately)
- You decide tax handling: full compliance (Stripe is merchant of record) vs. tax calculation only vs. none
- Create products for paid experiences (curated dinner reservations, ticketed events, premium concierge tier)
- Stripe Checkout for one-time bookings; optional subscription for premium tier
- Webhook at `/api/public/stripe-webhook` updates booking status on payment success

---

## Technical Details

- Stack stays: TanStack Start + React + Tailwind + Lovable Cloud (Supabase)
- Existing `/concierge`, `/auth`, `/onboarding` routes stay; admin lives at `/admin`, portal at `/portal`
- Role checks happen in `beforeLoad` (TanStack route guards) AND in RLS policies — defense in depth
- Impersonation is purely UI-level (it does NOT actually log you in as another user — that would be a security hole). Real RLS enforces server-side.
- All forms validated client-side with Zod and server-side via RLS + DB constraints
- Image uploads go to a public `brand-assets` bucket and a private `venue-images` bucket

---

## What I need from you to start Phase 1

1. **Brand assets**: upload logo (PNG/SVG, transparent bg ideal), 3–5 brand colors (hex), and font names (Google Fonts work easily)
2. **Confirm the plan** — or tell me what to add/cut

Once you reply with brand assets + 👍, I'll build Phase 1 end-to-end (database + seed + switcher + brand) in one go.
