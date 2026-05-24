import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { Home, Compass, Film, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocationTracking } from "@/hooks/useLocationTracking";

const TABS = [
  { to: "/app", label: "Tonight", icon: Home, exact: true },
  { to: "/app/explore", label: "Explore", icon: Compass },
  { to: "/app/reels", label: "Reels", icon: Film },
  { to: "/app/plan", label: "Plan", icon: Sparkles },
  { to: "/app/profile", label: "Profile", icon: User },
];

export function AppShell() {
  const location = useLocation();
  useLocationTracking();
  return (
    <div className="relative mx-auto min-h-screen w-full max-w-md bg-cream text-ink pb-24">
      <Outlet />
      <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md border-t-2 border-ink bg-cream/95 backdrop-blur">
        <ul className="grid grid-cols-5">
          {TABS.map(({ to, label, icon: Icon, exact }) => {
            const active = exact ? location.pathname === to : location.pathname.startsWith(to);
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.15em] transition-colors",
                    active ? "text-ink" : "text-ink/60 hover:text-ink",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-9 place-items-center rounded-full transition-all",
                      active
                        ? "border-2 border-ink bg-gold text-ink shadow-brut"
                        : "border-2 border-transparent",
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
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
    <header className="sticky top-0 z-20 flex items-end justify-between gap-3 border-b-2 border-ink bg-cream px-5 pb-3 pt-6">
      <div className="flex items-end gap-3">
        {left}
        <div>
          {eyebrow && (
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-ink/60">
              {eyebrow}
            </div>
          )}
          <h1 className="mt-1 font-display text-2xl font-extrabold tracking-[-0.02em] text-ink">
            {title}
          </h1>
        </div>
      </div>
      {right}
    </header>
  );
}
