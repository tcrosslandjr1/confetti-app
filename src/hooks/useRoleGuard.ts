import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth, type ViewAs } from "@/lib/auth-context";

/**
 * Blocks access unless the user's effective role matches one of the
 * allowed roles. Unauthenticated users are sent to /auth; authenticated
 * users without the right role are sent to the fallback path.
 *
 * Usage:
 *   function AdminPage() {
 *     const { ready } = useRoleGuard(["admin"]);
 *     if (!ready) return <LoadingSkeleton />;
 *   }
 *
 *   function BusinessPage() {
 *     const { ready } = useRoleGuard(["admin", "business"], "/");
 *     if (!ready) return <LoadingSkeleton />;
 *   }
 */
export function useRoleGuard(
  allowedRoles: ViewAs[],
  fallback: string = "/",
) {
  const { user, loading, effectiveRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    // Not signed in at all — send to auth
    if (!user) {
      navigate({
        to: "/auth",
        search: { redirect: window.location.pathname, mode: "signin" as const },
        replace: true,
      });
      return;
    }

    // Signed in but wrong role — send to fallback
    if (!allowedRoles.includes(effectiveRole)) {
      navigate({ to: fallback, replace: true });
    }
  }, [user, loading, effectiveRole, allowedRoles, fallback, navigate]);

  const authorized = !loading && !!user && allowedRoles.includes(effectiveRole);

  return {
    /** True once auth is resolved AND user has an allowed role */
    ready: authorized,
    user,
    effectiveRole,
    loading,
  };
}
