/**
 * FIX: Auth redirect parameter in business pricing
 * EDIT the file at: src/routes/business.pricing.tsx
 *
 * Problem: Sends users to /business/login?next=... but business.login.tsx
 * is just a redirect to /business/signup?mode=login — the "next" param
 * is completely lost in the redirect.
 *
 * Find this line (around line 192):
 *
 *   window.location.href = `/business/login?next=${encodeURIComponent("/business/pricing")}`;
 *
 * Replace with:
 *
 *   window.location.href = `/auth?redirect=${encodeURIComponent("/business/pricing")}&mode=signin`;
 *
 * This sends users directly to the main auth page with the correct
 * redirect parameter, so they come back to /business/pricing after login.
 */
