import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { Home, Compass, Film, Sparkles, User, LayoutDashboard, CalendarPlus, Image as ImageIcon, Link2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { trackBusinessNavClick } from "@/lib/business-analytics";

const CUSTOMER_TABS = [
  { to: "/app", label: "Tonight", icon: Home, exact: true },
  { to: "/app/explore", label: "Explore", icon: Compass },
  { to: "/app/reels", label: "Reels", icon: Film },
  { to: "/app/plan", label: "Plan", icon: Sparkles },
  { to: "/app/profile", label: "Profile", icon: User },
];

const BUSINESS_TABS = [
  { to: "/business/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: false },
  { to: "/business/events", label: "Events", icon: CalendarPlus, exact: false },
  { to: "/business/media", label: "Media", icon: ImageIcon, exact: false },
  { to: "/business/social", label: "Social", icon: Link2, exact: false },
  { to: "/business/settings", label: "Settings", icon: Settings, exact: false },
];

export function AppShell() {
  const location = useLocation();
  const { effectiveRole } = useAuth();
  const tabs = effectiveRole === "business" ? BUSINESS_TABS : CUSTOMER_TABS;
  return (
    <div className="relative mx-auto min-h-screen w-full max-w-md bg-background pb-24">
      <Outlet />
      <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md border-t border-border bg-background/95 backdrop-blur">
        <ul className="grid grid-cols-5">
          {tabs.map(({ to, label, icon: Icon, exact }) => {
            const active = exact === true ? location.pathname === to : location.pathname.startsWith(to);
            return (
              <li key={to}>
                <Link
                  to={to}
                  onClick={
                    effectiveRole === "business"
                      ? () => trackBusinessNavClick(label, to)
                      : undefined
                  }
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium tracking-wide uppercase",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="size-5" />
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
}: {
  eyebrow?: string;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 flex items-end justify-between gap-3 bg-gradient-to-b from-background via-background to-background/0 px-5 pb-3 pt-6">
      <div>
        {eyebrow && (
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </div>
        )}
        <h1 className="mt-0.5 text-2xl font-bold tracking-tight">{title}</h1>
      </div>
      {right}
    </header>
  );
}
