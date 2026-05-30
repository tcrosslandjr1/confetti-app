import { createFileRoute, Link, Navigate } from "@tanstack/react-router";

/**
 * Redirect map — old routes → new consolidated destinations.
 * Keeps bookmarks and shared links alive after the route consolidation.
 * Prefix-matched: "/admin/anything" matches the "/admin" key.
 */
const REDIRECTS: Record<string, string> = {
  // ── Preview / static-host aliases ────────────────────────
  "/index": "/",
  "/index.html": "/",

  // ── Discovery (merged into Home) ─────────────────────────
  "/tonight": "/new/hub",
  "/discover": "/new/hub",
  "/viral": "/new/hub",
  "/vibe-picker": "/new/hub",
  "/vibe-plans": "/new/hub",
  "/weather": "/new/hub",

  // ── Planning (merged into Plan) ──────────────────────────
  "/night-planner": "/new/plan",
  "/quick-generate": "/new/plan",
  "/boarding-pass-planner": "/new/plan",
  // "/boarding-pass" — now handled by src/routes/boarding-pass.tsx
  "/active-loop": "/new/plan",
  "/active-confetti": "/new/plan",
  "/plan": "/new/plan",
  "/plan/preview": "/new/plan",
  "/plan/ready": "/new/plan",
  "/taste-tuner": "/new/plan",
  "/group-outing": "/new/plan",
  "/team-events": "/new/plan",
  "/event-pack": "/new/plan",
  "/confirmation": "/new/plan",

  // ── Chat / AI (merged into Chat) ─────────────────────────
  "/concierge": "/chat",
  "/ask": "/chat",
  "/create": "/chat",

  // ── Portal / Profile (merged into Profile tab) ───────────
  "/portal": "/new/profile",
  "/me": "/new/profile",
  "/passport": "/new/profile",
  "/profile/preferences": "/new/profile",
  "/favorites": "/new/profile",
  "/reservations": "/new/profile",
  "/scan": "/new/profile",

  // ── Auth ──────────────────────────────────────────────────
  "/login": "/auth",
  "/signup": "/auth",
  "/reset-password": "/auth",
  "/onboarding": "/auth",

  // ── Business (login/register → business login) ───────────
  "/business/register": "/business/login",
  "/business/signup": "/business/login",
  "/business/pending": "/business/dashboard",
  "/business/settings": "/business/dashboard",
  "/business/billing": "/business/dashboard",
  "/business/pricing": "/business/dashboard",
  "/business/media": "/business/dashboard",
  "/business/events": "/business/dashboard",
  "/business/bookings": "/business/dashboard",
  "/business/menu": "/business/dashboard",
  "/business/preorders": "/business/dashboard",
  "/business/social": "/business/dashboard",
  "/business/notifications": "/business/dashboard",
  "/business/payouts": "/business/dashboard",
  "/business/promoters": "/business/dashboard",
  "/business/corporate": "/business/dashboard",
  "/business/ai-refresh": "/business/dashboard",

  // ── Moved to separate apps (send to home) ────────────────
  "/admin": "/admin/console",
  "/partner": "/",
  "/corporate": "/",
  "/promoter": "/",
  "/advertise": "/",

  // ── Static pages (merged into About / Privacy) ───────────
  "/faq": "/about",
  "/how-it-works": "/about",
  "/features": "/about",
  "/pricing": "/about",
  "/contact": "/about",
  "/testimonials": "/about",
  "/investors": "/about",
  "/partners": "/about",
  "/terms": "/privacy",
  "/cookies": "/privacy",
  "/data-terms": "/privacy",

  // ── Misc ──────────────────────────────────────────────────
  "/translate": "/new/hub",
  "/city-guides": "/new/explore",
  "/guides": "/new/explore",
  "/qa": "/",
};

function resolveRedirect(pathname: string): string | null {
  // Exact match first
  if (REDIRECTS[pathname]) return REDIRECTS[pathname];
  // Prefix match (e.g. /admin/venues → / because /admin is mapped)
  const segments = pathname.split("/").filter(Boolean);
  for (let i = segments.length; i >= 1; i--) {
    const prefix = "/" + segments.slice(0, i).join("/");
    if (REDIRECTS[prefix]) return REDIRECTS[prefix];
  }
  return null;
}

export const Route = createFileRoute("/$")({
  component: CatchAll,
});

function CatchAll() {
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  const target = resolveRedirect(pathname);

  if (target) {
    return <Navigate to={target} replace />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-6xl font-bold tracking-tight">404</h1>
      <p className="text-lg text-muted-foreground">
        This page doesn't exist — but your night out still can.
      </p>
      <Link
        to="/"
        className="mt-2 inline-flex h-10 items-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105"
      >
        Take me home
      </Link>
    </div>
  );
}
