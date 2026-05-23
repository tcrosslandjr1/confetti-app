/**
 * FIX: Role-Based Auth Guard Hook
 * CREATE this file at: src/hooks/useRoleGuard.ts
 *
 * Problem: Business, partner, corporate, and promoter routes only check
 * if the user is logged in — they don't check if the user has the right ROLE.
 * Any logged-in customer can access /business/payouts, /partner/dashboard, etc.
 *
 * Usage in any route component:
 *   const guard = useRoleGuard("business");
 *   if (guard) return guard;  // Shows loading or redirects away
 */
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth, type ViewAs } from "@/lib/auth-context";

type GuardResult = JSX.Element | null;

/**
 * Returns null when the user is authorized (let the page render).
 * Returns a JSX element (loading spinner or redirect) when not authorized.
 *
 * @param requiredRole - "admin" | "business" | "customer"
 * @param redirectTo - Where to send unauthorized users (default: /auth)
 */
export function useRoleGuard(
  requiredRole: ViewAs,
  redirectTo = "/auth",
): GuardResult {
  const { user, loading, effectiveRole, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    // Not logged in at all → send to auth
    if (!user) {
      navigate({
        to: "/auth",
        search: { redirect: window.location.pathname, mode: "signin" } as never,
        replace: true,
      });
      return;
    }

    // Admins can access everything (they use the role switcher)
    if (isAdmin) return;

    // Check if user's effective role matches what this route needs
    if (effectiveRole !== requiredRole) {
      navigate({ to: redirectTo as never, replace: true });
    }
  }, [loading, user, effectiveRole, isAdmin, requiredRole, redirectTo, navigate]);

  // Still loading auth state
  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    ) as JSX.Element;
  }

  // Not logged in (useEffect will redirect)
  if (!user) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <p className="text-sm text-muted-foreground">Redirecting to sign in…</p>
      </div>
    ) as JSX.Element;
  }

  // Wrong role (useEffect will redirect) — unless admin
  if (!isAdmin && effectiveRole !== requiredRole) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <p className="text-sm text-muted-foreground">Access restricted</p>
      </div>
    ) as JSX.Element;
  }

  // Authorized — return null so the page renders normally
  return null;
}
