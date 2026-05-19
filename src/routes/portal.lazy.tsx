import { createLazyFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { Bookmark, CalendarCheck, Compass, MessageCircle, BookMarked, User, Gift, Flame, Activity, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { inferFeatureFromPath, logAccessDenial } from "@/lib/access-denials";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PullToRefresh } from "@/components/PullToRefresh";
import { triggerRefresh } from "@/hooks/use-refresh-bus";

export const Route = createLazyFileRoute("/portal")({
  component: PortalLayout,
});

type NavItem = {
    to: string;
    label: string;
    icon: typeof Compass;
    exact?: boolean;
};

const NAV: NavItem[] = [
    { to: "/portal", label: "Discover", icon: Compass, exact: true },
    { to: "/portal/viral", label: "Viral Now", icon: Flame },
    { to: "/concierge/chat", label: "Concierge", icon: MessageCircle },
    { to: "/portal/bookings", label: "Bookings", icon: CalendarCheck },
    { to: "/portal/activity", label: "Activity", icon: Activity },
    { to: "/passport", label: "Passport", icon: BookMarked },
    { to: "/portal/saved", label: "Saved", icon: Bookmark },
    { to: "/portal/profile", label: "Profile", icon: User },
    { to: "/portal/refer", label: "Refer & earn", icon: Gift },
];

function PortalLayout() {
    const { user, loading, viewAs, isPreview } = useAuth();
    const nav = useNavigate();
    const pathname = useRouterState({ select: (s) => s.location.pathname });
    // Allow unauthenticated access to /portal/saved for App Store demo screenshots.
    const isDemoPage = pathname === "/portal/saved" || pathname === "/portal/profile";
    useEffect(() => {
        if (loading)
            return;
        if (isDemoPage)
            return;
        // Preview mode (role switcher picked "customer" without a real session) —
        // render the shell so the role can be tested.
        if (isPreview && viewAs === "customer")
            return;
        if (!user) {
            logAccessDenial({
                source: "route-guard",
                feature: inferFeatureFromPath(pathname),
                attemptedPath: pathname,
                fromPath: pathname,
                viewerRole: "anonymous",
                userId: null,
                note: "Unauthenticated user blocked from portal route",
            });
            nav({ to: "/auth" });
        }
        else if (viewAs === "visitor") {
            logAccessDenial({
                source: "route-guard",
                feature: inferFeatureFromPath(pathname),
                attemptedPath: pathname,
                fromPath: pathname,
                viewerRole: "visitor",
                userId: user.id,
                note: "Visitor view blocked from portal route",
            });
            nav({ to: "/" });
        }
        else if (viewAs === "admin") {
            // Admins must switch to "Customer" view to use the booking/portal flow —
            // we don't want admin accounts placing bookings while testing.
            nav({ to: "/admin" });
        }
        else if (viewAs === "business") {
            nav({ to: "/advertise/portal" });
        }
    }, [user, loading, viewAs, isPreview, nav, pathname, isDemoPage]);
    const allowPreview = isPreview && viewAs === "customer";
    if (!isDemoPage && !allowPreview && (loading || !user || viewAs !== "customer")) {
        const message = "Loading your portal…";
        return (<div role="status" aria-live="polite" className="grid min-h-screen place-items-center bg-cream text-ink">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-coral" aria-hidden="true"/>
          <p className="font-display text-sm font-bold tracking-tight text-ink/70">{message}</p>
          <span className="sr-only">{message}</span>
        </div>
      </div>);
    }
    return (<div className="min-h-screen bg-cream text-ink pb-24 lg:pb-0">
      <SiteHeader />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-8 lg:py-12">
        <aside className="hidden lg:block">
          <nav className="sticky top-20 rounded-2xl border-2 border-ink bg-cream p-3 shadow-brut">
            <div className="mb-3 border-b-2 border-dashed border-ink pb-2 px-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink/60">
                / portal
              </span>
            </div>
            {NAV.map(({ to, label, icon: Icon, exact }) => {
            const active = exact ? pathname === to : pathname.startsWith(to);
            return (<Link key={to} to={to as "/"} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-pop ${active
                    ? "border-2 border-ink bg-gold text-ink shadow-brut -translate-x-0.5 -translate-y-0.5"
                    : "border-2 border-transparent text-ink/70 hover:border-ink hover:bg-cream hover:text-ink"}`}>
                  <span className={`grid h-9 w-9 place-items-center rounded-lg border-2 ${active ? "border-ink bg-coral text-cream" : "border-ink/20 bg-cream text-ink/70"}`}>
                    <Icon className="h-4 w-4"/>
                  </span>
                  <span className="font-display tracking-tight">{label}</span>
                </Link>);
        })}
          </nav>
        </aside>
        <main className="min-w-0">
          <PullToRefresh onRefresh={triggerRefresh}>
            <Outlet />
          </PullToRefresh>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink bg-cream lg:hidden">
        <div className="mx-auto flex max-w-2xl items-stretch justify-around px-2 py-2">
          {NAV.slice(0, 5).map(({ to, label, icon: Icon, exact }) => {
            const active = exact ? pathname === to : pathname.startsWith(to);
            return (<Link key={to} to={to as "/"} className={`flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[10px] font-bold uppercase tracking-wider ${active ? "text-coral" : "text-ink/60"}`}>
                <Icon className={`h-5 w-5 ${active ? "text-coral" : ""}`}/>
                {label}
              </Link>);
        })}
        </div>
      </nav>

      <div className="hidden lg:block">
        <SiteFooter />
      </div>
    </div>);
}
