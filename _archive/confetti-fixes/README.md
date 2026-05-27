# Confetti Audit Fix Files

These are ready-to-paste code fixes for the 37 issues found in the full technical audit.
Organized by priority — apply in order.

## How to apply in Lovable

For each fix below, open the file listed in Lovable's editor, select all the code,
delete it, and paste the new code from the fix file. Then save.

Some fixes are NEW files — create them in Lovable at the path shown.

---

## Priority 1: SPA & Routing Foundation

| Fix File | Target File in Lovable | What it does |
|---|---|---|
| `01-spa-catch-all-route.tsx` | `src/routes/$.tsx` (NEW) | Adds catch-all route so unknown URLs show 404 instead of server error |
| `02-public-redirects` | `public/_redirects` (NEW) | SPA fallback rule as safety net for direct-URL navigation |

## Priority 2: Auth & Security (CRITICAL)

| Fix File | Target File in Lovable | What it does |
|---|---|---|
| `03-use-role-guard.ts` | `src/hooks/useRoleGuard.ts` (NEW) | Reusable hook that checks login + role before showing a page |
| `04-business-payouts-guarded.tsx` | `src/routes/business.payouts.tsx` | Adds auth + business role guard to the payouts page |
| `05-admin-pin-lock-fix.tsx` | `src/components/AdminPinLock.tsx` | Removes hardcoded PIN — now fetches from Supabase RPC |
| `06-use-require-auth.ts` | `src/hooks/useRequireAuth.ts` (NEW) | Simple hook: redirects to /auth if not logged in |

## Priority 3: Redirect & Navigation Fixes

| Fix File | Target File in Lovable | What it does |
|---|---|---|
| `07-buy-ticket-button-fix.tsx` | `src/components/BuyTicketButton.tsx` | Changes `?next=` to `?redirect=` so auth page reads it |
| `08-wizard-button-fix.tsx` | `src/components/wizard/WizardButton.tsx` | Changes `returnTo` to `redirect` |
| `09-pricing-fix.tsx` | Partial — see comments | Changes `?next=` to `?redirect=` in pricing page |
| `10-business-pricing-fix.tsx` | Partial — see comments | Fixes redirect param for business pricing |
| `11-rsvp-route-fix.tsx` | `src/routes/rsvp.$token.tsx` | Renames to `/rsvp/token/$token` to remove ambiguity with `$tripId` |
| `12-nav-link-aliases.tsx` | `src/routes/city-guides.tsx` (NEW) | Redirect aliases for dead nav links (/city-guides, /login, /signup) |
| `13-login-alias.tsx` | `src/routes/login.tsx` (NEW) | Redirects /login → /auth?mode=signin |
| `14-signup-alias.tsx` | `src/routes/signup.tsx` (NEW) | Redirects /signup → /auth?mode=signup |

## Priority 4: Dead Button Placeholders

| Fix File | Target File in Lovable | What it does |
|---|---|---|
| `15-coming-soon-toast.ts` | `src/lib/coming-soon.ts` (NEW) | Reusable `comingSoon()` function for placeholder buttons |

## Priority 5: Polish

| Fix File | Target File in Lovable | What it does |
|---|---|---|
| `16-business-hero-contrast.css` | Partial — see comments | CSS fix for near-invisible business hero text |
