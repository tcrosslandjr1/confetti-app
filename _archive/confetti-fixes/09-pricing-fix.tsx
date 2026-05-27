/**
 * FIX: Auth redirect parameter in pricing page
 * EDIT the file at: src/routes/pricing.lazy.tsx
 *
 * Problem: Same issue — uses ?next= but auth reads ?redirect=.
 *
 * Find this line (around line 69):
 *
 *   window.location.href = `/auth?next=${encodeURIComponent("/pricing")}`;
 *
 * Replace with:
 *
 *   window.location.href = `/auth?redirect=${encodeURIComponent("/pricing")}`;
 *
 * That's the only change needed in this file.
 */
