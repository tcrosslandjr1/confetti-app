// Gate that hides customer-facing UI when the viewer is NOT a customer.
// Business owners, admins, and visitors all get gated out.
import { type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";

export function useIsBusinessSurface() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { effectiveRole } = useAuth();
  return effectiveRole === "business" || pathname.startsWith("/business");
}

/** Renders children only when the viewer is a signed-in customer.
 *  Hides for business, admin, and visitor roles. */
export function CustomerOnly({ children }: { children: ReactNode }) {
  const { effectiveRole, user } = useAuth();
  if (!user || effectiveRole !== "customer") return null;
  return <>{children}</>;
}
