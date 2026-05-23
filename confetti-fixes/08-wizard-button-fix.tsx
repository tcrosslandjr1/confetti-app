/**
 * FIX: Auth redirect parameter in WizardButton
 * EDIT the file at: src/components/wizard/WizardButton.tsx
 *
 * Problem: This component sends users to /auth with { returnTo: ... }
 * but the auth page only reads "redirect". So the redirect is lost.
 *
 * Find this line (around line 39):
 *
 *   navigate({ to: "/auth", search: { returnTo: location.pathname } as never });
 *
 * Replace with:
 *
 *   navigate({ to: "/auth", search: { redirect: location.pathname, mode: "signin" } as never });
 *
 * That's the only change needed in this file.
 */
