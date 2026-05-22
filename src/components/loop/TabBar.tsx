import { Link, useRouterState } from "@tanstack/react-router";
import { Compass, Search, Plus, Award, User, LayoutDashboard, CalendarPlus, Image as ImageIcon, Link2, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { useId } from "react";
import { useAuth } from "@/lib/auth-context";
import { trackBusinessNavClick } from "@/lib/business-analytics";

type Tab = {
  to: string;
  label: string;
  icon: typeof Compass;
  match: (p: string) => boolean;
  prominent?: boolean;
};

const CUSTOMER_TABS: Tab[] = [
  { to: "/", label: "Home", icon: Compass, match: (p) => p === "/" || p === "/portal" },
  {
    to: "/discover",
    label: "Discover",
    icon: Search,
    match: (p) => p.startsWith("/discover") || p.startsWith("/viral") || p.startsWith("/venue"),
  },
  {
    to: "/create",
    label: "Plan",
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

const BUSINESS_TABS: Tab[] = [
  { to: "/business/dashboard", label: "Dashboard", icon: LayoutDashboard, match: (p) => p.startsWith("/business/dashboard") },
  { to: "/business/events", label: "Events", icon: CalendarPlus, match: (p) => p.startsWith("/business/events") },
  { to: "/business/media", label: "Media", icon: ImageIcon, match: (p) => p.startsWith("/business/media") },
  { to: "/business/social", label: "Social", icon: Link2, match: (p) => p.startsWith("/business/social") },
  { to: "/business/settings", label: "Settings", icon: Settings, match: (p) => p.startsWith("/business/settings") },
];

const HIDE_PREFIXES = [
  "/admin",
  "/auth",
  "/onboarding",
  "/taste-tuner",
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
  onClick,
}: {
  to: string;
  label: string;
  icon: typeof Compass;
  active: boolean;
  prominent?: boolean;
  labelId: string;
  onClick?: () => void;
}) {
  if (prominent) {
    return (
      <div className="relative -top-6 flex flex-col items-center">
        <Link
          to={to}
          onClick={onClick}
          aria-labelledby={labelId}
          aria-current={active ? "page" : undefined}
          className="block rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
        >
          <motion.span
            whileTap={{ scale: 0.92, x: 2, y: 2 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
            className={`grid h-14 w-14 sm:h-16 sm:w-16 place-items-center rounded-full border-2 border-ink bg-coral text-white shadow-[4px_4px_0px_0px_hsl(var(--ink))] transition-shadow duration-75 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none ${
              active ? "ring-2 ring-coral ring-offset-2 ring-offset-cream" : ""
            }`}
          >
            <Icon
              className="h-7 w-7 sm:h-8 sm:w-8"
              strokeWidth={3}
              strokeLinecap="square"
              strokeLinejoin="miter"
              aria-hidden="true"
            />
          </motion.span>
        </Link>
        <span
          id={labelId}
          className={`mt-1 block max-w-full overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-widest ${active ? "text-coral" : "text-ink"}`}
        >
          {label}
        </span>
      </div>
    );
  }

  return (
    <Link
      to={to}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className="group flex w-full min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-0.5 py-1 min-h-[60px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
    >
      <motion.span
        whileTap={{ scale: 0.88 }}
        transition={{ type: "spring", stiffness: 500, damping: 20 }}
        className={`p-1.5 transition-colors ${active ? "text-coral" : "text-ink"}`}
      >
        <Icon
          className="h-5 w-5 sm:h-6 sm:w-6"
          strokeWidth={2.5}
          strokeLinecap="square"
          strokeLinejoin="miter"
          aria-hidden="true"
        />
      </motion.span>
      <span
        id={labelId}
        className={`relative block max-w-full overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-widest leading-none transition-colors ${active ? "text-coral" : "text-ink/60"}`}
      >
        {label}
        {active && (
          <span
            aria-hidden="true"
            className="absolute -bottom-1.5 left-1/2 h-[3px] w-4 -translate-x-1/2 rounded-full bg-coral"
          />
        )}
      </span>
    </Link>
  );
}

export function TabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { effectiveRole } = useAuth();
  const baseId = useId();
  if (HIDE_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  const tabs = effectiveRole === "business" ? BUSINESS_TABS : CUSTOMER_TABS;

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
      <div className="relative border-t-2 border-ink bg-cream/95 backdrop-blur-xl supports-[backdrop-filter]:bg-cream/80">
        <div
          role="list"
          className="relative mx-auto grid w-full max-w-2xl min-h-[80px] grid-cols-5 place-items-center px-2 sm:px-4"
        >
          {tabs.map(({ to, label, icon, match, prominent }, i) => {
            const active = match(pathname);
            const labelId = `${baseId}-tab-label-${i}`;
            return (
              <div
                key={to}
                role="listitem"
                className="flex min-w-0 justify-center"
              >
                <TabItem
                  to={to}
                  label={label}
                  icon={icon}
                  active={active}
                  prominent={prominent}
                  labelId={labelId}
                  onClick={
                    effectiveRole === "business"
                      ? () => trackBusinessNavClick(label, to)
                      : undefined
                  }
                />
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
