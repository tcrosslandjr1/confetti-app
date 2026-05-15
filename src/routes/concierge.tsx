import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  Activity,
  Bookmark,
  BookMarked,
  CalendarCheck,
  Compass,
  Flame,
  Gift,
  MessageCircle,
  User,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/concierge")({
  component: ConciergeLayout,
});

type NavItem = { to: string; label: string; icon: typeof Compass; exact?: boolean };
const NAV: NavItem[] = [
  { to: "/portal", label: "Discover", icon: Compass, exact: true },
  { to: "/portal/viral", label: "Viral Now", icon: Flame },
  { to: "/concierge/chat", label: "Concierge", icon: MessageCircle },
  { to: "/portal/bookings", label: "Bookings", icon: CalendarCheck },
  { to: "/portal/activity", label: "Activity", icon: Activity },
  { to: "/concierge/passport", label: "Passport", icon: BookMarked },
  { to: "/portal/saved", label: "Saved", icon: Bookmark },
  { to: "/concierge/profile", label: "Profile", icon: User },
  { to: "/portal/refer", label: "Refer & earn", icon: Gift },
];

function ConciergeLayout() {
  const { user, loading, viewAs } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/auth" }); return; }
    if (viewAs === "admin") { navigate({ to: "/admin" }); return; }
    if (viewAs === "business") { navigate({ to: "/advertise/portal" }); return; }
    if (viewAs === "visitor") { navigate({ to: "/" }); return; }
  }, [user, loading, viewAs, navigate]);

  return (
    <div className="min-h-screen bg-cream text-ink pb-24 lg:pb-0">
      <SiteHeader />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-8 lg:py-12">
        <aside className="hidden lg:block">
          <nav className="sticky top-20 rounded-2xl border-2 border-ink bg-cream p-3 shadow-brut">
            <div className="mb-3 border-b-2 border-dashed border-ink pb-2 px-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink/60">/ concierge</span>
            </div>
            {NAV.map(({ to, label, icon: Icon, exact }) => {
              const active = exact ? pathname === to : pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to as "/"}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-pop ${
                    active
                      ? "border-2 border-ink bg-gold text-ink shadow-brut -translate-x-0.5 -translate-y-0.5"
                      : "border-2 border-transparent text-ink/70 hover:border-ink hover:bg-cream hover:text-ink"
                  }`}
                >
                  <span
                    className={`grid h-9 w-9 place-items-center rounded-lg border-2 ${active ? "border-ink bg-coral text-cream" : "border-ink/20 bg-cream text-ink/70"}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="font-display tracking-tight">{label}</span>
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
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink bg-cream lg:hidden">
        <div className="mx-auto flex max-w-2xl items-stretch justify-around px-2 py-2">
          {NAV.slice(0, 5).map(({ to, label, icon: Icon, exact }) => {
            const active = exact ? pathname === to : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to as "/"}
                className={`flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[10px] font-bold uppercase tracking-wider ${
                  active ? "text-coral" : "text-ink/60"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "text-coral" : ""}`} />
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
