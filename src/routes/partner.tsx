import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Store,
  CalendarRange,
  UtensilsCrossed,
  CalendarDays,
  ClipboardList,
  ShoppingBag,
  BookOpen,
  BarChart3,
  CreditCard,
  Megaphone,
  LifeBuoy,
  Building2,
  Bell,
  Code2,
  Info,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/partner")({
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      throw redirect({
        to: "/auth",
        search: { redirect: location.pathname } as never,
      });
    }
    return { userEmail: data.user.email ?? null };
  },
  head: () => ({
    meta: [
      { title: "Partner Dashboard — Confetti" },
      {
        name: "description",
        content: "Manage reservations, orders, menu, and analytics for your venue on Confetti.",
      },
    ],
  }),
  component: PartnerLayout,
});

const NAV = [
  { to: "/partner", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/partner/profile", label: "Venue Profile", icon: Store },
  { to: "/partner/booking-settings", label: "Booking Settings", icon: CalendarRange },
  { to: "/partner/order-settings", label: "Order-Ahead", icon: UtensilsCrossed },
  { to: "/partner/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/partner/reservations", label: "Reservations", icon: ClipboardList },
  { to: "/partner/orders", label: "Orders", icon: ShoppingBag },
  { to: "/partner/menu", label: "Menu Editor", icon: BookOpen },
  { to: "/partner/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/partner/billing", label: "Tier & Billing", icon: CreditCard },
  { to: "/partner/promotions", label: "Promotions", icon: Megaphone },
  { to: "/partner/api", label: "Partner API", icon: Code2 },
  { to: "/partner/support", label: "Support", icon: LifeBuoy },
];

const DEMO_BANNER_KEY = "partner-demo-banner-dismissed";

function PartnerLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { userEmail } = Route.useRouteContext();
  const initials = (userEmail ?? "?").slice(0, 2).toUpperCase();
  const [bannerDismissed, setBannerDismissed] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(DEMO_BANNER_KEY) === "1") {
      setBannerDismissed(true);
    }
  }, []);
  const dismissBanner = () => {
    setBannerDismissed(true);
    if (typeof window !== "undefined") sessionStorage.setItem(DEMO_BANNER_KEY, "1");
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-foreground flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border/60 bg-card/40 backdrop-blur sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-border/60">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground grid place-items-center font-bold">
              C
            </div>
            <div>
              <div className="text-sm font-semibold leading-none">Confetti</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Partner Portal</div>
            </div>
          </Link>
        </div>

        <div className="px-3 py-3 border-b border-border/60">
          <div className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-left">
            <Building2 className="h-4 w-4 text-primary" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">Your venue</div>
              <div className="text-[11px] text-muted-foreground truncate">
                {userEmail ?? "Signed in"}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled
            className="w-full mt-1 justify-start text-xs text-muted-foreground"
            title="Venue claim flow coming soon"
          >
            + Add venue
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {NAV.map((item) => {
            const active = item.exact ? path === item.to : path.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  active
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border/60 text-[11px] text-muted-foreground truncate">
          Logged in as <span className="text-foreground">{userEmail ?? "—"}</span>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 px-4 md:px-8 h-14 border-b border-border/60 bg-background/80 backdrop-blur">
          <div className="md:hidden font-semibold">Confetti Partners</div>
          <div className="flex-1" />
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
          </Button>
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-orange-400 text-primary-foreground grid place-items-center text-xs font-semibold">
            {initials}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-[1400px] w-full mx-auto">
          {!bannerDismissed && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
              <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <div className="flex-1 text-foreground/80">
                <span className="font-medium text-foreground">Preview portal.</span> Showing sample
                data while we wire real venue data. Reservations, orders, and analytics here are not
                live yet.
              </div>
              <button
                type="button"
                onClick={dismissBanner}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
