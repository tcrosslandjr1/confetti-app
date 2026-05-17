## Goal

When a business completes the `/advertise` 3‑step form (Business → Contact → Launch), automatically create a **pending business account**, an **owner user account**, and an **admin review queue item**. Admin can Approve/Reject from `/admin/advertisers`. The owner is routed based on status.

## What already exists (reuse, don't rebuild)

- `/advertise` route with the exact 3‑step form in the screenshot.
- `advertisers` table with `status` ('pending' default), `owner_id` (FK to auth user), RLS allowing owner + admin.
- `createAdvertiser`, `updateAdvertiserStatus`, `listAdminAdvertisers` in `src/lib/ads.ts`.
- `/admin/advertisers` page with an "Advertisers" tab.
- Auth + role system (`has_role`, `app_role`).

## What to add

### 1. Schema additions to `advertisers`
- `package_selected text` — the tier picked in the pricing card (`featured` / `boosted` / `premium`).
- `onboarding_step smallint default 1` — last step the user completed (1/2/3).
- `source text default 'self-serve'` — channel.
- `owner_name text`, `submitted_at timestamptz` (set on first insert; `created_at` already exists but stays as DB insert time).
- `review_note text` — admin-visible reason on reject.
- `reviewed_at timestamptz`, `reviewed_by uuid` — audit.
- New status values used by code: `'pending_review' | 'active' | 'rejected'` (existing 'pending' rows migrate to 'pending_review').

### 2. Step‑by‑step persistence

```text
Step 1 Continue  → upsert advertiser row (status='pending_review', onboarding_step=1, package_selected=tier)
Step 2 Continue  → update row with owner_name/contact_email/contact_phone, onboarding_step=2
Step 3 Launch    → onboarding_step=3, redirect to /business/pending
```

Reuse the existing `sessionStorage` draft + auth round‑trip. If user isn't signed in by step 3, we still bounce them to `/auth` as today.

### 3. Owner user account
- The submitter is already a Supabase auth user by the time step 3 fires (today's flow forces signup before insert). We add a `'business_owner'` role row in `user_roles` on the first `advertiser` insert.
- No extra "user account" table needed — `auth.users` + `user_roles` covers it.

### 4. Routing after submit
- `/business/pending` — new minimal route shown for `pending_review` advertisers ("We're reviewing your business. You'll be activated within 1 business day.").
- On `active` → redirect to existing `/advertise/portal` (or `/business/dashboard` if already approved).
- On `rejected` → show reason from `review_note` with "Edit and resubmit" CTA back to `/advertise#signup`.

A small server fn `getMyAdvertiserStatus` reads the row for the signed‑in user and the `/advertise/portal` + `/business/pending` routes use it to gate.

### 5. Admin Approvals queue
- New "Pending approvals" tab (or filter inside the existing Advertisers tab) at the top of `/admin/advertisers` with a badge count.
- Columns: Business Name · Category · City · Package · Owner Name · Owner Email · Submitted At · Approve / Reject.
- Approve → `status='active'`, set `reviewed_at`, `reviewed_by=auth.uid()`, send welcome notification, return portal link.
- Reject → prompt for reason → `status='rejected'`, store `review_note`, send rejection notification.
- Notifications go through the existing in‑app `notifications` table; email is best‑effort via the existing Resend connector if available.

### 6. Server functions (new in `src/lib/business-onboarding.functions.ts`)
- `upsertOnboardingStep1({ businessName, category, city, packageSelected })`
- `upsertOnboardingStep2({ ownerName, contactEmail, contactPhone })`
- `finalizeOnboardingStep3({ website?, notes? })`
- `getMyAdvertiserStatus()` → `{ status, reviewNote, portalUrl }`
- `adminDecideAdvertiser({ advertiserId, decision: 'approve' | 'reject', note? })` — guarded by `requireAdmin` middleware.

All write paths run under RLS as the user; the admin decide path runs through a server fn that checks `has_role(auth.uid(),'admin')` before update.

## Out of scope

- Stripe billing for the package (kept "billing handled by our team" copy).
- Separate `businesses` table — `advertisers` already serves this role and is referenced by `venues` / `ad_campaigns`.

## Technical notes

- Migration adds columns + a backfill `UPDATE advertisers SET status='pending_review' WHERE status='pending'`.
- All new columns are nullable / defaulted so existing rows keep working.
- RLS unchanged: owner reads/writes own row, admin reads/writes all.
- The `business_owner` role is additive — admins keep their `admin` role.

```text
Form submit → upsert advertisers row → user_roles += business_owner
                                    ↓
                       Admin advertisers page
                       Pending tab → Approve/Reject
                                    ↓
                       advertisers.status updated
                                    ↓
                       Owner redirected on next visit
```
