import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  BarChart3,
  Bell,
  CalendarCheck,
  LayoutDashboard,
  Megaphone,
  MessageSquareQuote,
  ScrollText,
  Settings,
  ShieldCheck,
  Sparkles,
  Store,
  Users,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth-context";
import { NotificationsBell } from "@/components/NotificationsBell";
import { AdminSkeleton } from "@/components/AdminSkeleton";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console — Confetti" },
      {
        name: "description",
        content: "Internal admin console for managing the Concierge platform.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLayout,
  errorComponent: AdminRouteError,
  pendingComponent: () => {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line no-console
      console.log("[admin] route pending…", window.location.pathname);
    }
    return <AdminSkeleton />;
  },
  // Show the skeleton immediately on slow navigations rather than waiting the
  // default 1s before swapping in pendingComponent.
  pendingMs: 0,
});

function AdminRouteError({ error, reset }: { error: Error; reset: () => void }) {
  // eslint-disable-next-line no-console
  console.group("[admin] route errorComponent caught error");
  // eslint-disable-next-line no-console
  console.error(error);
  // eslint-disable-next-line no-console
  console.log("name:", error?.name, "message:", error?.message);
  // eslint-disable-next-line no-console
  console.log("stack:", error?.stack);
  if (typeof window !== "undefined") {
    // eslint-disable-next-line no-console
    console.log("pathname:", window.location.pathname);
  }
  // eslint-disable-next-line no-console
  console.groupEnd();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-2xl space-y-4 text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Admin console failed to load
        </h1>
        <p className="text-sm text-muted-foreground">
          A route-load or render error was captured. Details below — full stack is also in the
          browser console.
        </p>
        <details
          open
          className="rounded-md border border-border bg-muted/40 p-3 text-left text-xs"
        >
          <summary className="cursor-pointer font-mono font-semibold text-foreground">
            {error?.name || "Error"}: {error?.message}
          </summary>
          <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] text-muted-foreground">
            {error?.stack}
          </pre>
        </details>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
type NavSection = { label: string; items: NavItem[] };

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Overview",
    items: [{ to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true }],
  },
  {
    label: "People",
    items: [
      { to: "/admin/users", label: "Users", icon: Users },
      { to: "/admin/roles", label: "Admin roles", icon: ShieldCheck },
    ],
  },
  {
    label: "Marketplace",
    items: [
      { to: "/admin/venues", label: "Venues", icon: Store },
      { to: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
      { to: "/admin/business-claims", label: "Venue claims", icon: ShieldCheck },
    ],
  },
  {
    label: "Growth",
    items: [
      { to: "/admin/advertisers", label: "Advertisers", icon: Megaphone },
      { to: "/admin/marquee", label: "Sponsored marquee", icon: Megaphone },
      { to: "/admin/outreach", label: "Weekly outreach", icon: Sparkles },
      { to: "/admin/notifications", label: "Notifications", icon: Bell },
      { to: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
    ],
  },
  {
    label: "Trust & Safety",
    items: [{ to: "/admin/moderation", label: "Moderation", icon: ShieldCheck }],
  },
  {
    label: "Analytics",
    items: [
      { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
      { to: "/admin/event-analytics", label: "Event analytics", icon: BarChart3 },
      { to: "/admin/pick-analytics", label: "Pick analytics", icon: BarChart3 },
      { to: "/admin/ad-analytics", label: "Ad analytics", icon: BarChart3 },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/admin/integrations", label: "Integrations", icon: Sparkles },
      { to: "/admin/settings", label: "Settings", icon: Settings },
      { to: "/admin/audit", label: "Audit log", icon: ScrollText },
      { to: "/admin/logs", label: "System logs", icon: ScrollText },
      { to: "/admin/wallet-debug", label: "Wallet JWT debug", icon: ShieldCheck },
      { to: "/admin/launch", label: "Launch checklist", icon: ScrollText },
      { to: "/admin/routes-map", label: "Routes map", icon: ScrollText },
    ],
  },
];

function AdminLayout() {
  const { loading, isAdmin, user, viewAs, isPreview } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isLoginRoute = pathname === "/admin/login";
  // Preview mode lets the admin console UI render without a real admin session
  // so the role can be tested. RLS still blocks real data writes.
  const allowPreview = isPreview && viewAs === "admin";

  // Trace gate state so we can see WHY the admin shell is or isn't rendering.
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log("[admin] gate", {
      pathname,
      loading,
      hasUser: Boolean(user),
      isAdmin,
      viewAs,
      isPreview,
      allowPreview,
      isLoginRoute,
    });
  }, [pathname, loading, user, isAdmin, viewAs, isPreview, allowPreview, isLoginRoute]);


  useEffect(() => {
    if (loading || isLoginRoute) return;
    if (allowPreview) return;
    if (!user) navigate({ to: "/admin/login" });
    else if (!isAdmin) navigate({ to: "/" });
    else if (viewAs === "customer") navigate({ to: "/portal" });
    else if (viewAs === "business") navigate({ to: "/advertise/portal" });
    else if (viewAs === "visitor") navigate({ to: "/" });
  }, [loading, user, isAdmin, viewAs, allowPreview, navigate, isLoginRoute]);

  if (isLoginRoute) {
    return <Outlet />;
  }

  if (!allowPreview && (loading || !isAdmin || viewAs !== "admin")) {
    return <AdminSkeleton />;
  }

  return (
    <SidebarProvider>
      <AdminShell user={user} pathname={pathname} />
    </SidebarProvider>
  );
}

function AdminShell({
  user,
  pathname,
}: {
  user: ReturnType<typeof useAuth>["user"];
  pathname: string;
}) {
  const { isMobile, setOpenMobile } = useSidebar();
  const handleNav = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <div className="flex min-h-screen w-full bg-gradient-to-br from-cream/60 via-background to-background">
      <Sidebar collapsible="icon" className="border-r-2 border-ink/10">
        <SidebarContent className="bg-cream/30">
          {/* Brand header */}
          <div className="relative mx-2 mt-3 flex items-center gap-2.5 overflow-hidden rounded-2xl border-2 border-ink bg-gradient-to-br from-coral via-orange-400 to-gold px-3 py-3 shadow-brut">
            <span className="pointer-events-none absolute right-2 top-2 h-1.5 w-1.5 rotate-12 bg-cream/70" aria-hidden />
            <span className="pointer-events-none absolute bottom-2 left-10 h-1.5 w-1.5 rotate-45 bg-ink/50" aria-hidden />
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border-2 border-ink bg-cream shadow-brut">
              <Sparkles className="h-4 w-4 text-coral" />
            </div>
            <div className="min-w-0 text-sm">
              <div className="font-display font-extrabold leading-none text-ink">Confetti</div>
              <div className="mt-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-ink/70">
                Admin · Command
              </div>
            </div>
          </div>

          {NAV_SECTIONS.map((section) => (
            <SidebarGroup key={section.label}>
              <SidebarGroupLabel className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-ink/50">
                {section.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => {
                    const active = item.exact
                      ? pathname === item.to
                      : pathname.startsWith(item.to);
                    return (
                      <SidebarMenuItem key={item.to}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          className={
                            active
                              ? "border border-ink/15 bg-coral/15 font-bold text-ink shadow-sm hover:bg-coral/20"
                              : "transition hover:translate-x-0.5 hover:bg-cream/60"
                          }
                        >
                          <Link
                            to={item.to as string as "/"}
                            onClick={handleNav}
                            className="flex items-center gap-2.5"
                          >
                            <item.icon
                              className={`h-4 w-4 ${active ? "text-coral" : "text-ink/60"}`}
                            />
                            <span>{item.label}</span>
                            {active && (
                              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-coral" />
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}

          <SidebarGroup>
            <SidebarGroupLabel className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-ink/50">
              Shortcuts
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className="transition hover:translate-x-0.5 hover:bg-cream/60"
                  >
                    <Link to="/" onClick={handleNav} className="flex items-center gap-2.5">
                      <Sparkles className="h-4 w-4 text-ink/60" />
                      <span>View site</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl">
          <SidebarTrigger />
          <div className="text-sm font-semibold">Admin Console</div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden truncate text-xs text-muted-foreground sm:inline">
              {user?.email}
            </span>
            <NotificationsBell />
          </div>
        </header>
        <main className="min-w-0 flex-1 overflow-x-hidden px-3 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
