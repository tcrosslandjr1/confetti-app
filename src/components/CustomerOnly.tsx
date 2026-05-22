// Gate that hides customer-facing UI when the viewer is acting as a business
// owner or is currently inside a /business/* route.
import { type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";

export function useIsBusinessSurface() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { effectiveRole } = useAuth();
  return effectiveRole === "business" || pathname.startsWith("/business");
}

/** Renders children only when the viewer is NOT on a business surface. */
export function CustomerOnly({ children }: { children: ReactNode }) {
  const hide = useIsBusinessSurface();
  if (hide) return null;
  return <>{children}</>;
}
