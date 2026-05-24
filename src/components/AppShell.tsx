import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { Home, Compass, Film, Sparkles, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocationTracking } from "@/hooks/useLocationTracking";

const TABS = [
  { to: "/app", label: "Tonight", icon: Home, exact: true },
  { to: "/app/explore", label: "Explore", icon: Compass },
  { to: "/app/plan", label: "Plan", icon: Sparkles },
  { to: "/boarding-pass", label: "Pass", icon: Ticket },
  { to: "/app/reels", label: "Reels", icon: Film },
];

export function BottomNav() {
  const location = useLocation();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-[var(--z-nav)] mx-auto w-full max-w-md border-t border-ink/10 bg-cream/90 backdrop-blur-xl safe-bottom">
      <ul className="grid grid-cols-5 px-1 pt-1.5 pb-1">
        {TABS.map(({ to, label, icon: Icon, exact }) => {
          const active = exact ? location.pathname === to : location.pathname.startsWith(to);
          return (
            <li key={to}>
              <Link
                to={to}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em] transition-all duration-200",
                  active ? "text-ink" : "text-ink/40 hover:text-ink/70",
                )}
              >
                <span
                  className={cn(
                    "grid size-10 place-items-center rounded-2xl transition-all duration-200",
                    active
                      ? "bg-gold/90 text-ink shadow-sm"
                      : "text-ink/40",
                  )}
                >
                  <Icon className={cn("size-[18px] transition-transform duration-200", active && "scale-110")} strokeWidth={active ? 2.5 : 2} />
                </span>
                <span className={cn(active && "text-ink")}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function AppShell() {
  useLocationTracking();
  return (
    <div className="relative mx-auto min-h-screen w-full max-w-md bg-cream text-ink pb-24">
      <Outlet />
      <BottomNav />
    </div>
  );
}

export function MobileHeader({
  eyebrow,
  title,
  right,
  left,
}: {
  eyebrow?: string;
  title: string;
  right?: React.ReactNode;
  left?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-[var(--z-sticky)] border-b border-ink/8 bg-cream/95 backdrop-blur-xl px-5 pb-3.5 pt-5">
      <div className="flex items-end justify-between gap-3">
        <div className="flex items-end gap-3">
          {left}
          <div>
            {eyebrow && (
              <div className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-ink/45 mb-1">
                {eyebrow}
              </div>
            )}
            <h1 className="font-display text-[22px] font-extrabold tracking-[-0.02em] text-ink leading-none">
              {title}
            </h1>
          </div>
        </div>
        {right && <div className="flex items-center gap-2">{right}</div>}
      </div>
    </header>
  );
}
