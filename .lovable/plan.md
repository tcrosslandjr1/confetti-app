# Plan: Three distinct experiences — Visitor, Customer, Admin

The current "role switcher" only flips a label — every view ends up identical. This plan locks down visitor capabilities, gives customers a real personalized portal, and ships a separate admin login plus the four admin tools you picked.

---

## 1. Visitor experience (no auth) — read-only marketing

**Goal:** A visitor can understand what Confetti does, browse, and is invited to sign up — but cannot book, save, or see real itineraries.

- **Landing page (/)** — keep marketing copy, add a clearer "Sign up to plan a real night" CTA. Hide the "Build a night" wizard behind a sign-up gate when called by a visitor.
- **Wizard preview gate** — first 1–2 wizard steps run free; on "Build", visitors see a blurred preview of the result with a "Sign up to unlock your itinerary" overlay. Customers/admins see the real result.
- **Booking buttons** — anywhere a "Book / Reserve" button exists, replace its handler for visitors with a sign-up prompt + redirect to `/auth`.
- **Save / heart buttons** — same: `toast` saying "Sign in to save favorites" and route to `/auth`.
- **Portal & Concierge routes** — already gated; keep redirect to `/auth` (not silently to `/`) so the user lands on sign-up.
- **Header** — visitors see only marketing links + prominent "Sign up free".

## 2. Customer experience (signed in, role = customer)

**Goal:** A personalized hub. Real bookings, saved spots, AI concierge, referrals.

- **Personalized home** — when a logged-in customer visits `/`, redirect to `/portal` (their dashboard). The marketing landing stays for visitors.
- **Portal dashboard** — already exists at `/portal`. Audit it to surface: upcoming bookings, recent saved spots, active referral progress, unlocked achievements (using existing tables).
- **Full booking flow** — wizard results show real venues with working "Reserve" button → writes to `bookings` table.
- **Concierge & wizard** — full results unlocked, photo galleries, real Google Places data.
- **Referrals + achievements** — already wired in DB; ensure portal home shows them.

## 3. Admin experience (separate login + console)

**Goal:** A distinct admin surface. Admin signs in via `/admin/login`, lands directly in `/admin`, never sees customer chrome.

### a. Separate `/admin/login` route
- New page, brutalist dark theme to feel different from customer auth.
- Email + password sign-in only (no Google OAuth, no signup form — admins are invite-only).
- After successful sign-in, query `user_roles` for `admin`. If not admin → sign out + show "This account does not have admin access." If admin → redirect to `/admin`.
- The customer `/auth` page rejects admin-only accounts? No — admins can also sign in there, but `/admin/login` is the documented entry. Admin role is what gates `/admin`.

### b. Admin console layout
- Already has sidebar shell. Confirm and polish the four tools below.

### c. Admin tools (build / wire up)

1. **Venues management** (`/admin/venues`)
   - Table view of `venues` rows. "Add venue" dialog → insert into `venues` (name, category, neighborhood, city, price_level, image_url, description). Edit/delete inline.
   - **Migration needed:** add admin INSERT/UPDATE/DELETE RLS policies on `venues` (currently locked).

2. **User support** (`/admin/users`)
   - List recent users from `profiles`. Per-user drawer: bookings, referrals, achievements, role.
   - Actions: promote to admin (insert into `user_roles`), demote, send password reset email (`supabase.auth.admin` via server fn).
   - Server function `getUserOverview(userId)` using `requireSupabaseAuth` + verify caller `has_role('admin')`.

3. **Billing / payment issues** (`/admin/bookings`)
   - Already exists as a route — extend it: filter by status (pending/confirmed/cancelled), show `total_cents`, `stripe_session_id`. Actions: mark refunded, cancel, add admin note.
   - **Migration needed:** add `admin_notes text` column to `bookings`; admin UPDATE policy already exists via `has_role('admin')` on the existing select policy — add explicit ADMIN UPDATE policy.

4. **Integrations panel** (`/admin/integrations` — new route)
   - List the integrations the platform uses (Google Places, Lovable AI, Resend if added). Each shows: status (key configured? last call OK?), test button, link to docs.
   - Status checks call lightweight server functions that ping the upstream and return `ok / error`.
   - Adding/rotating actual secrets stays in Lovable Cloud → Secrets (linked from the panel) — we don't store keys in the DB.

### d. Role switcher
- Keep it for admins only (already works). Useful for previewing customer/visitor UI, but the **real** difference is now driven by actual auth state, not just the switcher.

---

## Technical details

### Files to add
- `src/routes/admin.login.tsx` — separate admin sign-in page.
- `src/routes/admin.integrations.tsx` — integrations panel.
- `src/lib/admin.functions.ts` — `getUserOverview`, `promoteToAdmin`, `demoteAdmin`, `pingIntegration`, `sendPasswordReset` (all guarded by `has_role('admin')`).
- `src/components/VisitorGate.tsx` — small helper that wraps a button/handler and redirects visitors to `/auth` with a toast.

### Files to edit
- `src/routes/index.tsx` — redirect signed-in customers to `/portal`.
- `src/routes/auth.tsx` — keep as customer signup/signin; add link "Are you an admin? Sign in here →".
- `src/components/SiteHeader.tsx` — show "Sign up free" instead of "Sign in" for visitors; hide Wizard CTA's full power behind gate.
- `src/components/wizard/BuildMyNightWizard.tsx` — for visitors, after step 4, show preview-blur + "Sign up to see your real plan".
- `src/routes/portal.bookings.tsx` — already real; verify visitor flow can't reach it.
- `src/routes/admin.venues.tsx` — full CRUD UI.
- `src/routes/admin.users.tsx` — user drawer + role + reset actions.
- `src/routes/admin.bookings.tsx` — status filters + admin actions.
- `src/routes/admin.tsx` — add "Integrations" nav item.

### Database migration
```text
- venues: add admin INSERT/UPDATE/DELETE policies (has_role admin)
- bookings: add admin_notes text column + admin UPDATE policy
```

### Out of scope (next iteration)
- Real Stripe refund integration (we'll mark refunded in DB only; show the Stripe dashboard link).
- Granular admin permissions (super-admin vs support). Single `admin` role for now.
- Visitor wizard "preview" copy/imagery — first pass uses blur + sign-up CTA.

---

## Order of work
1. Migration (venues admin policies, bookings.admin_notes).
2. Visitor gating: header, wizard, booking/save buttons.
3. Customer redirect from `/` → `/portal` when signed in.
4. Admin login page + redirect logic.
5. Admin tools: venues CRUD → users tools → bookings billing → integrations.
6. Smoke test all three roles on `/`, wizard, `/portal`, `/admin`.
