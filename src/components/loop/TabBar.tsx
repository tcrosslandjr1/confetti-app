import { Link, useRouterState } from "@tanstack/react-router";
import { Compass, Search, Plus, Award, User } from "lucide-react";
import { motion } from "framer-motion";

type Tab = {
  to: string;
  label: string;
  icon: typeof Compass;
  match: (p: string) => boolean;
  prominent?: boolean;
};

const TABS: Tab[] = [
  { to: "/", label: "Home", icon: Compass, match: (p) => p === "/" || p === "/portal" },
  {
    to: "/discover",
    label: "Discover",
    icon: Search,
    match: (p) => p.startsWith("/discover") || p.startsWith("/viral") || p.startsWith("/venue"),
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
    to: "/me",
    label: "Profile",
    icon: User,
    match: (p) => p.startsWith("/me") || p.startsWith("/portal/profile"),
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
  if (HIDE_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {/* soft gradient fade so content scrolls cleanly behind the bar */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-cream/95 to-transparent"
      />
      <div className="relative border-t-2 border-ink bg-cream/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-stretch justify-around px-2 pt-1.5 pb-1">
          {TABS.map(({ to, label, icon: Icon, match, prominent }) => {
            const active = match(pathname);
            if (prominent) {
              return (
                <Link
                  key={to}
                  to={to}
                  className="relative -mt-6 flex flex-col items-center gap-1 px-3 outline-none"
                  aria-label={label}
                  aria-current={active ? "page" : undefined}
                >
                  <motion.span
                    whileTap={{ scale: 0.88 }}
                    transition={{ type: "spring", stiffness: 500, damping: 22 }}
                    className={`grid h-16 w-16 place-items-center rounded-full border-2 border-ink bg-gradient-vibe text-primary-foreground shadow-brut-lg ${
                      active ? "ring-2 ring-coral ring-offset-2 ring-offset-cream" : ""
                    }`}
                  >
                    <Icon className="h-7 w-7" strokeWidth={2.5} />
                  </motion.span>
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
                aria-label={label}
                className="group relative flex flex-1 flex-col items-center justify-end gap-0.5 py-1.5 outline-none"
              >
                <motion.span
                  whileTap={{ scale: 0.85 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  className={`grid h-10 w-10 place-items-center rounded-2xl transition-colors ${
                    active ? "bg-coral/10 text-coral" : "text-ink/55 group-active:bg-ink/5"
                  }`}
                >
                  <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.6 : 2} />
                </motion.span>
                <span
                  className={`font-mono text-[9px] font-bold uppercase tracking-widest leading-none transition-colors ${active ? "text-coral" : "text-ink/55"}`}
                >
                  {label}
                </span>
                {active && (
                  <motion.span
                    layoutId="tabbar-indicator"
                    transition={{ type: "spring", stiffness: 480, damping: 32 }}
                    className="absolute -top-0.5 h-1 w-8 rounded-full bg-coral"
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
