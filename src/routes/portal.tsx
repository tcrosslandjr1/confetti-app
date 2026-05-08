import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { Bookmark, CalendarCheck, Compass, MessageCircle, BookMarked, User } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/portal")({
  head: () => ({
    meta: [
      { title: "My Portal — Concierge" },
      { name: "description", content: "Your bookings, saved spots, passport, and profile in one place." },
    ],
  }),
  component: PortalLayout,
});

const NAV = [
  { to: "/portal", label: "Discover", icon: Compass, exact: true },
  { to: "/concierge/chat", label: "Concierge", icon: MessageCircle },
  { to: "/portal/bookings", label: "Bookings", icon: CalendarCheck },
  { to: "/concierge/passport", label: "Passport", icon: BookMarked },
  { to: "/portal/saved", label: "Saved", icon: Bookmark },
  { to: "/portal/profile", label: "Profile", icon: User },
] as const;

function PortalLayout() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [user, loading, nav]);

  if (loading || !user) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0">
      <SiteHeader />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-8 lg:py-12">
        <aside className="hidden lg:block">
          <nav className="sticky top-20 rounded-3xl border border-border bg-card p-3 shadow-card">
            {NAV.map(({ to, label, icon: Icon, exact }) => {
              const active = exact ? pathname === to : pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to as "/"}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition-pop ${
                    active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  }`}
                >
                  <span className={`grid h-9 w-9 place-items-center rounded-full ${active ? "bg-gradient-vibe text-primary-foreground shadow-pop" : ""}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/90 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-2xl items-stretch justify-around px-2 py-2">
          {NAV.slice(0, 5).map(({ to, label, icon: Icon, exact }) => {
            const active = exact ? pathname === to : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to as "/"}
                className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-bold uppercase tracking-wider ${
                  active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "text-primary" : ""}`} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="hidden lg:block">
        <SiteFooter />
      </div>
    </div>
  );
}
