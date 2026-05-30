import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { Home, Compass, Sparkles, Ticket, User } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useLocationTracking } from "@/hooks/useLocationTracking";
import { useAuth } from "@/lib/auth-context";

/* ── Navigation tabs ────────────────────────────────────────────────── */

type Tab = {
  to: "/app" | "/app/explore" | "/app/plan" | "/boarding-pass" | "/app/profile";
  label: string;
  icon: typeof Home;
  exact?: boolean;
  isYou?: boolean;
};

const TABS: readonly Tab[] = [
  { to: "/app", label: "Tonight", icon: Home, exact: true },
  { to: "/app/explore", label: "Explore", icon: Compass },
  { to: "/app/plan", label: "Plan", icon: Sparkles },
  { to: "/boarding-pass", label: "Pass", icon: Ticket },
  { to: "/app/profile", label: "you", icon: User, isYou: true },
];

/* ── BottomNav ──────────────────────────────────────────────────────── */

export function BottomNav() {
  const location = useLocation();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[var(--z-nav)] mx-auto w-full max-w-md border-t-2 border-ink bg-cream/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
      aria-label="Main navigation"
    >
      <ul className="grid min-h-[72px] grid-cols-5 place-items-center px-2" role="list">
        {TABS.map(({ to, label, icon: Icon, exact, isYou }) => {
          const active = exact
            ? location.pathname === to
            : location.pathname.startsWith(to);

          if (isYou) {
            return (
              <li key={to}>
                <Link
                  to={to}
                  aria-current={active ? "page" : undefined}
                  className="flex flex-col items-center gap-1 focus-visible:outline-none"
                >
                  <span
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-3.5 py-2 transition-all duration-200",
                      active
                        ? "bg-ink text-cream"
                        : "bg-transparent text-ink/40 hover:text-ink/70",
                    )}
                  >
                    <Icon className="size-[18px]" strokeWidth={2.5} strokeLinecap="square" strokeLinejoin="miter" />
                    <span className="font-mono text-[10px] font-bold">{label}</span>
                  </span>
                </Link>
              </li>
            );
          }

          return (
            <li key={to}>
              <Link
                to={to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-1 transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 focus-visible:ring-offset-cream rounded-xl",
                )}
              >
                <span className="relative">
                  <Icon
                    className={cn(
                      "size-[22px] transition-all duration-200",
                      active ? "text-coral" : "text-ink/30 hover:text-ink/50",
                    )}
                    strokeWidth={2.5}
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                  />
                  {active && (
                    <span className="absolute -bottom-1.5 left-1/2 h-[3px] w-4 -translate-x-1/2 rounded-full bg-coral" />
                  )}
                </span>
                <span
                  className={cn(
                    "font-mono text-[9px] font-bold uppercase tracking-widest select-none",
                    active ? "text-coral" : "text-ink/30",
                  )}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/* ── AppShell ───────────────────────────────────────────────────────── */

export function AppShell() {
  useLocationTracking();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Auth guard — redirect unauthenticated visitors to /auth
  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({
        to: "/auth",
        search: { redirect: window.location.pathname },
        replace: true,
      });
    }
  }, [user, loading, navigate]);

  // Show nothing while auth resolves or while redirecting
  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-ink/10 border-t-coral" />
      </div>
    );
  }

  return (
    <div className="relative mx-auto min-h-screen w-full max-w-md bg-cream text-ink pb-24">
      <Outlet />
    </div>
  );
}

/* ── MobileHeader ───────────────────────────────────────────────────── */

export function MobileHeader({
  eyebrow,
  title,
  right,
  left,
  className,
}: {
  eyebrow?: string;
  title: string;
  right?: React.ReactNode;
  left?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-[var(--z-sticky)] bg-cream px-5 pb-3.5 pt-5",
        className,
      )}
    >
      <div className="flex items-end justify-between gap-3">
        <div className="flex items-end gap-3 min-w-0">
          {left}
          <div className="min-w-0">
            {eyebrow && (
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-coral mb-1">
                {eyebrow}
              </p>
            )}
            <h1 className="truncate font-display text-[22px] font-extrabold tracking-[-0.02em] text-ink leading-none">
              {title}
            </h1>
          </div>
        </div>
        {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
      </div>
    </header>
  );
}
