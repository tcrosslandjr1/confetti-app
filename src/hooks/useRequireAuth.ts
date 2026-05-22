import { useEffect } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";

/**
 * Redirects unauthenticated users to /auth with a redirect param
 * that brings them back after sign-in.
 *
 * Usage:
 *   function ProtectedPage() {
 *     const { ready, user } = useRequireAuth();
 *     if (!ready) return <LoadingSkeleton />;
 *     // user is guaranteed non-null here
 *   }
 */
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({
        to: "/auth",
        search: { redirect: location.pathname, mode: "signin" as const },
        replace: true,
      });
    }
  }, [user, loading, navigate, location.pathname]);

  return {
    /** True once auth state is resolved AND the user is signed in */
    ready: !loading && !!user,
    user,
    loading,
  };
}
