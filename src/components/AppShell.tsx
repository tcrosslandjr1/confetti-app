import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { Home, Compass, Film, Sparkles, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocationTracking } from "@/hooks/useLocationTracking";

/* ── Navigation tabs ────────────────────────────────────────────────── */

const TABS = [
  { to: "/app", label: "Tonight", icon: Home, exact: true },
  { to: "/app/explore", label: "Explore", icon: Compass },
  { to: "/app/plan", label: "Plan", icon: Sparkles },
  { to: "/boarding-pass", label: "Pass", icon: Ticket },
  { to: "/app/reels", label: "Reels", icon: Film },
] as const;

/* ── BottomNav ──────────────────────────────────────────────────────── */

export function BottomNav() {
  const location = useLocation();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[var(--z-nav)] mx-auto w-full max-w-md border-t border-ink/10 bg-cream/92 backdrop-blur-2xl safe-bottom"
      aria-label="Main navigation"
    >
      <ul className="grid grid-cols-5 px-1 pt-2 pb-1" role="list">
        {TABS.map(({ to, label, icon: Icon, exact }) => {
          const active = exact
            ? location.pathname === to
            : location.pathname.startsWith(to);

          return (
            <li key={to}>
              <Link
                to={to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em] transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 focus-visible:ring-offset-cream rounded-xl",
                  active ? "text-ink" : "text-ink/35 hover:text-ink/60",
                )}
              >
                <span
                  className={cn(
                    "grid size-10 place-items-center rounded-2xl transition-all duration-200",
                    active
                      ? "bg-gold/90 text-ink shadow-sm scale-100"
                      : "text-ink/35",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-[18px] transition-transform duration-200",
                      active && "scale-110",
                    )}
                    strokeWidth={active ? 2.5 : 1.75}
                  />
                </span>
                <span className="select-none">{label}</span>
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

  return (
    <div className="relative mx-auto min-h-screen w-full max-w-md bg-cream text-ink pb-24">
      <Outlet />
      <BottomNav />
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
        "sticky top-0 z-[var(--z-sticky)] border-b border-ink/8 bg-cream/95 backdrop-blur-2xl px-5 pb-3.5 pt-5",
        className,
      )}
    >
      <div className="flex items-end justify-between gap-3">
        <div className="flex items-end gap-3 min-w-0">
          {left}
          <div className="min-w-0">
            {eyebrow && (
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-ink/45 mb-1">
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
