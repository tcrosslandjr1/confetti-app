import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  CalendarPlus,
  CreditCard,
  Image as ImageIcon,
  LayoutDashboard,
  Link2,
  RefreshCw,
  Settings,
} from "lucide-react";
import type { ReactNode } from "react";

const TABS = [
  { to: "/business/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/business/events", label: "Events", icon: CalendarPlus },
  { to: "/business/media", label: "Media", icon: ImageIcon },
  { to: "/business/social", label: "Social", icon: Link2 },
  { to: "/business/ai-refresh", label: "AI Refresh", icon: RefreshCw },
  { to: "/business/billing", label: "Billing", icon: CreditCard },
  { to: "/business/settings", label: "Settings", icon: Settings },
] as const;

export function BusinessTabNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="sticky top-0 z-20 -mx-4 mb-6 overflow-x-auto border-b border-border bg-background/80 px-4 backdrop-blur-xl md:-mx-6 md:px-6">
      <ul className="flex gap-1 py-2">
        {TABS.map((t) => {
          const active = pathname.startsWith(t.to);
          return (
            <li key={t.to}>
              <Link
                to={t.to as any}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "border-ink bg-ink text-cream shadow-brut"
                    : "border-border bg-card hover:border-ink"
                }`}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function BusinessPageShell({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-4 md:px-6 md:pt-6">
        <BusinessTabNav />
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              {eyebrow}
            </p>
            <h1 className="font-display text-3xl font-bold leading-tight">{title}</h1>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions}
        </header>
        {children}
      </div>
    </div>
  );
}

export const _BUSINESS_QUICK_LINKS = [
  { to: "/business/analytics" as const, label: "Analytics", icon: BarChart3 },
];
