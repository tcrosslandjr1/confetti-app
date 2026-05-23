/**
 * FIX: Simple auth-required hook
 * CREATE this file at: src/hooks/useRequireAuth.ts
 *
 * Problem: Many app.* routes and some business routes have no auth check.
 * This hook is the simplest possible guard — just checks if logged in.
 * For role-specific checks, use useRoleGuard instead.
 *
 * Usage:
 *   const guard = useRequireAuth();
 *   if (guard) return guard;
 */
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";

export function useRequireAuth(): JSX.Element | null {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({
        to: "/auth",
        search: {
          redirect: window.location.pathname,
          mode: "signin",
        } as never,
        replace: true,
      });
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    ) as JSX.Element;
  }

  if (!user) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <p className="text-sm text-muted-foreground">Redirecting to sign in…</p>
      </div>
    ) as JSX.Element;
  }

  return null;
}
