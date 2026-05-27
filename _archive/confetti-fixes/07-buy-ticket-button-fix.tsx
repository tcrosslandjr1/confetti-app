/**
 * FIX: Auth redirect parameter in BuyTicketButton
 * EDIT the file at: src/components/BuyTicketButton.tsx
 *
 * Problem: This component sends users to /auth?next=... but the auth page
 * only reads the "redirect" parameter. So after login, users get sent to /
 * instead of back to the page they were on.
 *
 * Find this line (around line 41):
 *
 *   window.location.href = `/auth?next=${encodeURIComponent(window.location.pathname)}`;
 *
 * Replace with:
 *
 *   window.location.href = `/auth?redirect=${encodeURIComponent(window.location.pathname)}`;
 *
 * That's the only change needed in this file.
 */
