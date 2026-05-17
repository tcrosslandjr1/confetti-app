import { Link, useRouterState } from "@tanstack/react-router";
import { Compass, Search, Plus, Award, User } from "lucide-react";
import { motion } from "framer-motion";
import { useId } from "react";

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

function TabItem({
  to,
  label,
  icon: Icon,
  active,
  prominent,
  labelId,
}: {
  to: string;
  label: string;
  icon: typeof Compass;
  active: boolean;
  prominent?: boolean;
  labelId: string;
}) {
  if (prominent) {
    return (
      <div className="relative -top-6">
        <Link
          to={to}
          aria-labelledby={labelId}
          aria-current={active ? "page" : undefined}
          className="block rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
        >
          <motion.span
            whileTap={{ scale: 0.92, x: 2, y: 2 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
            className={`grid h-16 w-16 place-items-center rounded-full border-2 border-ink bg-coral text-white shadow-[4px_4px_0px_0px_hsl(var(--ink))] transition-shadow duration-75 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none ${
              active ? "ring-2 ring-coral ring-offset-2 ring-offset-cream" : ""
            }`}
          >
            <Icon
              className="h-8 w-8"
              strokeWidth={3}
              strokeLinecap="square"
              strokeLinejoin="miter"
              aria-hidden="true"
            />
          </motion.span>
        </Link>
        <span
          id={labelId}
          className={`pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 font-mono text-[10px] font-bold uppercase tracking-widest ${active ? "text-coral" : "text-ink"}`}
        >
          {label}
        </span>
      </div>
    );
  }

  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={`group flex flex-1 flex-col items-center justify-center gap-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${active ? "" : ""}`}
    >
      <motion.span
        whileTap={{ scale: 0.88 }}
        transition={{ type: "spring", stiffness: 500, damping: 20 }}
        className={`p-1.5 transition-colors ${active ? "text-coral" : "text-ink"}`}
      >
        <Icon
          className="h-6 w-6"
          strokeWidth={2.5}
          strokeLinecap="square"
          strokeLinejoin="miter"
          aria-hidden="true"
        />
      </motion.span>
      <span
        id={labelId}
        className={`font-mono text-[10px] font-bold uppercase tracking-widest leading-none transition-colors ${active ? "text-coral" : "text-ink/60"}`}
      >
        {label}
      </span>
    </Link>
  );
}

export function TabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (HIDE_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  const baseId = useId();

  return (
    <nav
      aria-label="Primary navigation"
      className="fixed inset-x-0 bottom-0 z-50 pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {/* soft gradient fade so content scrolls cleanly behind the bar */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-cream/95 to-transparent"
      />
      <div className="relative border-t-2 border-ink bg-cream/95 backdrop-blur-xl">
        <div
          role="list"
          className="relative mx-auto flex h-20 max-w-2xl items-center justify-around px-2"
        >
          {TABS.map(({ to, label, icon, match, prominent }, i) => {
            const active = match(pathname);
            const labelId = `${baseId}-tab-label-${i}`;
            return (
              <div key={to} role="listitem" className="flex flex-1 justify-center">
                <TabItem
                  to={to}
                  label={label}
                  icon={icon}
                  active={active}
                  prominent={prominent}
                  labelId={labelId}
                />
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

