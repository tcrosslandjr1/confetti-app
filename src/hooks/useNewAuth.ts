import { useEffect } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";

/**
 * Auth guard for `new.*` routes.
 * Redirects unauthenticated users to /new/signin.
 *
 * Usage:
 *   function ProtectedPage() {
 *     const { ready, user } = useNewAuth();
 *     if (!ready) return <LoadingSkeleton />;
 *     // user is guaranteed non-null here
 *   }
 */
export function useNewAuth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/new/signin", replace: true });
    }
  }, [user, loading, navigate, location.pathname]);

  return {
    ready: !loading && !!user,
    user,
    loading,
  };
}
