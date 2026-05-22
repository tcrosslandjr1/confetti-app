// Business-owner navigation analytics.
// Fires pageview + tab_click events tagged with role="business" into the
// shared analytics_events pipeline so we can segment business-portal usage.
import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { trackEvent } from "@/lib/analytics";
import { useAuth } from "@/lib/auth-context";

const SURFACE = "business_nav";

/** Fire one pageview per pathname change while acting as a business owner. */
export function useBusinessNavPageviews() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { effectiveRole, user } = useAuth();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (effectiveRole !== "business") return;
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    void trackEvent("pageview", "business_pageview", {
      path: pathname,
      metadata: {
        surface: SURFACE,
        role: "business",
        user_id: user?.id ?? null,
      },
    });
  }, [pathname, effectiveRole, user?.id]);
}

/** Imperative tracker for a business-nav tab click. */
export function trackBusinessNavClick(label: string, to: string) {
  void trackEvent("cta_click", "business_nav_click", {
    path: typeof window !== "undefined" ? window.location.pathname : undefined,
    metadata: { surface: SURFACE, role: "business", label, to },
  });
}
