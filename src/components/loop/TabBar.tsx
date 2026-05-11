import { Link, useRouterState } from "@tanstack/react-router";
import { Compass, Search, Plus, Award, User } from "lucide-react";

type Tab = {
  to: string;
  label: string;
  icon: typeof Compass;
  match: (p: string) => boolean;
  prominent?: boolean;
};

const TABS: Tab[] = [
  { to: "/portal", label: "Home", icon: Compass, match: (p) => p === "/portal" || p === "/" },
  {
    to: "/viral",
    label: "Discover",
    icon: Search,
    match: (p) => p.startsWith("/viral") || p.startsWith("/venue"),
  },
  {
    to: "/create",
    label: "Create",
    icon: Plus,
    prominent: true,
    match: (p) => p.startsWith("/create") || p.startsWith("/quick-generate"),
  },
  { to: "/passport", label: "Passport", icon: Award, match: (p) => p.startsWith("/passport") },
  {
    to: "/portal/profile",
    label: "Profile",
    icon: User,
    match: (p) => p.startsWith("/portal/profile") || p.startsWith("/me"),
  },
];

const HIDE_PREFIXES = [
  "/admin",
  "/auth",
  "/onboarding",
  "/about",
  "/pricing",
  "/features",
  "/how-it-works",
  "/contact",
  "/investors",
  "/advertise",
  "/data-terms",
  "/api",
  "/concierge",
  "/taste-tuner",
];

export function TabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname === "/" || HIDE_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t-2 border-ink bg-cream/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="mx-auto flex max-w-2xl items-stretch justify-around px-2 py-1.5">
        {TABS.map(({ to, label, icon: Icon, match, prominent }) => {
          const active = match(pathname);
          if (prominent) {
            return (
              <Link
                key={to}
                to={to}
                className="relative -mt-5 flex flex-col items-center gap-0.5 px-3"
                aria-label={label}
                aria-current={active ? "page" : undefined}
              >
                <span
                  className={`grid h-14 w-14 place-items-center rounded-full border-2 border-ink bg-gradient-vibe text-primary-foreground shadow-brut transition-transform ${active ? "scale-110 ring-2 ring-coral ring-offset-2 ring-offset-cream" : ""}`}
                >
                  <Icon className="h-6 w-6" strokeWidth={2.5} />
                </span>
                <span
                  className={`font-mono text-[9px] font-bold uppercase tracking-widest ${active ? "text-coral" : "text-ink/80"}`}
                >
                  {label}
                </span>
              </Link>
            );
          }
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? "page" : undefined}
              className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 transition-colors ${active ? "text-coral" : "text-ink/60 hover:text-ink"}`}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              <span className="font-mono text-[9px] font-bold uppercase tracking-widest">
                {label}
              </span>
              {active && (
                <span className="absolute -bottom-0.5 h-1.5 w-1.5 rounded-full bg-coral" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
