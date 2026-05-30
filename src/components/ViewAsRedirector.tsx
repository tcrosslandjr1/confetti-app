import { useEffect, useRef } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth, type ViewAs } from "@/lib/auth-context";

/**
 * Section prefixes owned by each role. If viewAs changes and the current
 * pathname is in a foreign section, we redirect to that role's home.
 * Visitor owns "everything public" (no portal prefix) so we only kick them
 * out of portal routes.
 */
const SECTION_PREFIXES: Record<Exclude<ViewAs, "visitor">, string[]> = {
  admin: ["/admin"],
  business: ["/business"],
  promoter: ["/promoter"],
  customer: ["/new/hub"],
};

const HOME: Record<ViewAs, string> = {
  admin: "/admin/console",
  business: "/business/dashboard",
  promoter: "/promoter",
  customer: "/new/profile",
  visitor: "/",
};

const PORTAL_PREFIXES = ["/admin", "/business", "/promoter", "/new/hub"];

// Login routes for each portal must stay reachable regardless of viewAs.
const LOGIN_PATHS = new Set([
  "/admin/login",
  "/business/login",
  "/promoter/login",
  "/auth",
  "/login",
]);

// Public /app/* routes that visitors can browse without auth.
// These are discovery / marketing surfaces — no account required.
const PUBLIC_APP_PREFIXES = ["/new/explore", "/new/explore", "/new/reels"];

function pathBelongsTo(path: string, role: ViewAs): boolean {
  if (role === "visitor") {
    // Visitor owns anything that is NOT a portal route.
    return !PORTAL_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));
  }
  const prefixes = SECTION_PREFIXES[role];
  return prefixes.some((p) => path === p || path.startsWith(p + "/"));
}

/**
 * Watches viewAs changes and, when the active path no longer belongs to the
 * selected role, navigates to that role's home. This makes the role switcher
 * the single source of truth for "which portal am I in?" — including when
 * viewAs is changed from outside the switcher (e.g. SIGNED_IN reset, manual
 * sessionStorage edit, deep link).
 */
export function ViewAsRedirector() {
  const { viewAs, viewAsLoaded, sessionLoading } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const lastViewAs = useRef<ViewAs | null>(null);

  useEffect(() => {
    if (!viewAsLoaded || sessionLoading) return;

    // Skip when we're on a login route — let auth flows complete.
    if (LOGIN_PATHS.has(path)) {
      lastViewAs.current = viewAs;
      return;
    }

    // Skip when we're on a public app route — visitors can browse these.
    if (PUBLIC_APP_PREFIXES.some((p) => path === p || path.startsWith(p + "/"))) {
      lastViewAs.current = viewAs;
      return;
    }

    // Only redirect when viewAs actually transitions, OR on first mount if
    // already on a mismatched portal route.
    const changed = lastViewAs.current !== null && lastViewAs.current !== viewAs;
    const mismatched = !pathBelongsTo(path, viewAs);

    if ((changed || lastViewAs.current === null) && mismatched) {
      // First mount: only redirect away from portal routes that aren't ours.
      // Don't yank visitors off public pages.
      const isOnPortal = PORTAL_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));
      if (changed || isOnPortal) {
        navigate({ to: HOME[viewAs] });
      }
    }

    lastViewAs.current = viewAs;
  }, [viewAs, viewAsLoaded, sessionLoading, path, navigate]);

  return null;
}
