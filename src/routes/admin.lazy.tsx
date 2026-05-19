import { createLazyFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BarChart3, Bell, CalendarCheck, LayoutDashboard, LogOut, Megaphone, MessageSquareQuote, Search, ScrollText, Settings, ShieldCheck, Sparkles, Store, Users, X } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth-context";
import { NotificationsBell } from "@/components/NotificationsBell";
import { AdminSkeleton } from "@/components/AdminSkeleton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createLazyFileRoute("/admin")({
  component: AdminLayout,
  errorComponent: AdminRouteError,
  pendingComponent: () => {
      if (typeof window !== "undefined") {
          // eslint-disable-next-line no-console
          console.log("[admin] route pending…", window.location.pathname);
      }
      return <AdminSkeleton />;
  },
});

function AdminRouteError({ error, reset }: {
    error: Error;
    reset: () => void;
}) {
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
    return (<div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-2xl space-y-4 text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Admin console failed to load
        </h1>
        <p className="text-sm text-muted-foreground">
          A route-load or render error was captured. Details below — full stack is also in the
          browser console.
        </p>
        <details open className="rounded-md border border-border bg-muted/40 p-3 text-left text-xs">
          <summary className="cursor-pointer font-mono font-semibold text-foreground">
            {error?.name || "Error"}: {error?.message}
          </summary>
          <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] text-muted-foreground">
            {error?.stack}
          </pre>
        </details>
        <div className="flex flex-wrap justify-center gap-2">
          <button onClick={reset} className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Try again
          </button>
          <a href="/" className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent">
            Go home
          </a>
        </div>
      </div>
    </div>);
}

type NavItem = {
    to: string;
    label: string;
    icon: typeof LayoutDashboard;
    exact?: boolean;
};

type NavSection = {
    label: string;
    items: NavItem[];
};

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
    const { redirect } = Route.useSearch();
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
        if (loading || isLoginRoute)
            return;
        if (allowPreview)
            return;
        if (!user)
            navigate({ to: "/admin/login", search: { redirect: pathname } as never });
        else if (!isAdmin)
            navigate({ to: "/" });
        else if (viewAs === "customer")
            navigate({ to: "/portal" });
        else if (viewAs === "business")
            navigate({ to: "/advertise/portal" });
        else if (viewAs === "visitor")
            navigate({ to: "/" });
        else if (redirect && redirect !== pathname)
            navigate({ to: redirect as never, replace: true });
    }, [loading, user, isAdmin, viewAs, allowPreview, navigate, isLoginRoute, pathname, redirect]);
    if (isLoginRoute) {
        return <Outlet />;
    }
    if (!allowPreview && (loading || !isAdmin || viewAs !== "admin")) {
        return <AdminSkeleton />;
    }
    return (<SidebarProvider>
      <AdminShell user={user} pathname={pathname}/>
    </SidebarProvider>);
}

function AdminShell({ user, pathname, }: {
    user: ReturnType<typeof useAuth>["user"];
    pathname: string;
}) {
    const { isMobile, setOpenMobile, state } = useSidebar();
    const collapsed = state === "collapsed";
    const [query, setQuery] = useState("");
    const handleNav = () => {
        if (isMobile)
            setOpenMobile(false);
    };
    const filteredSections = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return NAV_SECTIONS;
        return NAV_SECTIONS
            .map((s) => ({ ...s, items: s.items.filter((i) => i.label.toLowerCase().includes(q)) }))
            .filter((s) => s.items.length > 0);
    }, [query]);
    const initials = (user?.email ?? "?").slice(0, 2).toUpperCase();
    const activeItem = useMemo(() => {
        for (const s of NAV_SECTIONS) {
            for (const i of s.items) {
                const active = i.exact ? pathname === i.to : pathname.startsWith(i.to);
                if (active) return { section: s.label, item: i };
            }
        }
        return { section: "Overview", item: NAV_SECTIONS[0].items[0] };
    }, [pathname]);
    const activeLabel = activeItem.item.label;
    const activeSection = activeItem.section;
    return (<div className="flex min-h-screen w-full bg-gradient-to-br from-cream/60 via-background to-background">
      <Sidebar collapsible="icon" className="border-r-2 border-ink/10">
        <SidebarContent className="bg-cream/30">
          {/* Brand header */}
          <div className="relative mx-2 mt-3 flex items-center gap-2.5 overflow-hidden rounded-2xl border-2 border-ink bg-gradient-to-br from-coral via-orange-400 to-gold px-3 py-3 shadow-brut">
            <span className="pointer-events-none absolute right-2 top-2 h-1.5 w-1.5 rotate-12 bg-cream/70" aria-hidden/>
            <span className="pointer-events-none absolute bottom-2 left-10 h-1.5 w-1.5 rotate-45 bg-ink/50" aria-hidden/>
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border-2 border-ink bg-cream shadow-brut">
              <Sparkles className="h-4 w-4 text-coral"/>
            </div>
            {!collapsed && (
              <div className="min-w-0 text-sm">
                <div className="font-display font-extrabold leading-none text-ink">Confetti</div>
                <div className="mt-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-ink/70">
                  Admin · Command
                </div>
              </div>
            )}
          </div>

          {!collapsed && (
            <div className="mx-2 mt-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink/40" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter nav…"
                  className="w-full rounded-lg border border-ink/15 bg-cream/60 py-1.5 pl-8 pr-7 text-xs font-medium text-ink placeholder:text-ink/40 outline-none transition focus:border-coral focus:bg-cream"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-1.5 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded text-ink/50 hover:bg-ink/5 hover:text-ink"
                    aria-label="Clear filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {filteredSections.map((section) => (<SidebarGroup key={section.label}>
              <SidebarGroupLabel className="flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-ink/50">
                <span>{section.label}</span>
                {!collapsed && (
                  <span className="rounded-full bg-ink/5 px-1.5 py-0.5 text-[9px] font-bold text-ink/50">
                    {section.items.length}
                  </span>
                )}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => {
                const active = item.exact
                    ? pathname === item.to
                    : pathname.startsWith(item.to);
                return (<SidebarMenuItem key={item.to}>
                        <SidebarMenuButton asChild isActive={active} tooltip={item.label} className={active
                        ? "relative border border-ink/15 bg-coral/15 font-bold text-ink shadow-sm hover:bg-coral/20 before:absolute before:left-0 before:top-1/2 before:h-5 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-coral"
                        : "transition hover:translate-x-0.5 hover:bg-cream/60"}>
                          <Link to={item.to as string as "/"} onClick={handleNav} className="flex items-center gap-2.5">
                            <item.icon className={`h-4 w-4 ${active ? "text-coral" : "text-ink/60"}`}/>
                            <span>{item.label}</span>
                            {active && (<span className="ml-auto h-1.5 w-1.5 rounded-full bg-coral"/>)}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>);
            })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>))}

          {filteredSections.length === 0 && !collapsed && (
            <div className="mx-3 mt-1 rounded-lg border border-dashed border-ink/15 bg-cream/40 px-3 py-4 text-center text-[11px] text-ink/50">
              No matches for "{query}"
            </div>
          )}

          <SidebarGroup>
            <SidebarGroupLabel className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-ink/50">
              Shortcuts
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="View site" className="transition hover:translate-x-0.5 hover:bg-cream/60">
                    <Link to="/" onClick={handleNav} className="flex items-center gap-2.5">
                      <Sparkles className="h-4 w-4 text-ink/60"/>
                      <span>View site</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-ink/10 bg-cream/40 p-2">
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-full border-2 border-ink bg-gradient-to-br from-coral to-gold text-[10px] font-extrabold text-cream shadow-brut">
                {initials}
              </div>
              <button
                type="button"
                onClick={() => supabase.auth.signOut().then(() => (window.location.href = "/"))}
                className="grid h-8 w-8 place-items-center rounded-lg text-ink/60 hover:bg-ink/5 hover:text-coral"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-ink/10 bg-cream/70 p-2">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-ink bg-gradient-to-br from-coral to-gold text-[11px] font-extrabold text-cream shadow-brut">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-bold text-ink">{user?.email ?? "Signed in"}</div>
                <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink/50">Administrator</div>
              </div>
              <button
                type="button"
                onClick={() => supabase.auth.signOut().then(() => (window.location.href = "/"))}
                className="grid h-8 w-8 place-items-center rounded-lg text-ink/50 transition hover:bg-coral/10 hover:text-coral"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </SidebarFooter>
      </Sidebar>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl">
          <SidebarTrigger />
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
            <Link
              to="/admin"
              className="font-semibold text-foreground hover:text-coral transition-colors"
              activeOptions={{ exact: true }}
              activeProps={{ className: "text-coral" }}
            >
              Admin
            </Link>
            <span className="text-ink/30">/</span>
            <span className="hidden rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:inline">
              {activeSection}
            </span>
            <span className="hidden text-ink/30 sm:inline">/</span>
            <span className="font-mono text-xs text-ink/70">{activeLabel}</span>
          </nav>
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
    </div>);
}
