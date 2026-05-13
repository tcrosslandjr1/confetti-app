import type { ReactNode } from "react";
import { useAuth, type ViewAs } from "@/lib/auth-context";

/**
 * Mirror of the database `has_role(_user_id, _role)` SECURITY DEFINER function.
 *
 * Source of truth = `public.user_roles` (server). This hook reflects that lookup
 * via `AuthProvider`, so any UI guarded with it stays in sync with the RLS
 * policies that ultimately authorize the action.
 *
 * IMPORTANT: This is a UX guard only. The server still enforces access via
 * RLS policies that call `public.has_role(auth.uid(), '<role>'::app_role)`.
 * Never rely on this hook for security decisions.
 */
export function useHasRole(role: ViewAs): { ok: boolean; loading: boolean } {
  const { isAdmin, viewAs, loading, user } = useAuth();
  if (loading) return { ok: false, loading: true };
  // Honor the impersonated view: an admin viewing as "visitor" should see
  // exactly what a visitor sees (no admin/customer/business surfaces), and
  // an admin viewing as "customer" can use customer surfaces (booking, etc.).
  if (role === "visitor") return { ok: viewAs === "visitor", loading: false };
  if (role === "admin") return { ok: isAdmin && viewAs === "admin", loading: false };
  if (role === "business") return { ok: viewAs === "business", loading: false };
  if (role === "customer") return { ok: !!user && viewAs === "customer", loading: false };
  return { ok: false, loading: false };
}

type Props = {
  /** Role required to render the children. */
  role: ViewAs;
  children: ReactNode;
  /** Optional fallback when the user lacks the role. Defaults to nothing. */
  fallback?: ReactNode;
  /** Hide while role lookup is pending. Default true so we never flash unauthorized actions. */
  hideWhileLoading?: boolean;
};

/**
 * Hide UI for actions the current user is not authorized to perform.
 *
 * Use this anywhere you render a button, link, or surface whose backing
 * mutation/RLS requires a specific role. Pair it with the matching server-side
 * policy — the gate is for UX, not security.
 */
export function RoleGate({ role, children, fallback = null, hideWhileLoading = true }: Props) {
  const { ok, loading } = useHasRole(role);
  if (loading) return hideWhileLoading ? null : <>{fallback}</>;
  return ok ? <>{children}</> : <>{fallback}</>;
}
