import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  BarChart3,
  Bell,
  CalendarCheck,
  LayoutDashboard,
  Megaphone,
  ScrollText,
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

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console — Concierge" },
      {
        name: "description",
        content: "Internal admin console for managing the Concierge platform.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLayout,
});

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
const NAV: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/venues", label: "Venues", icon: Store },
  { to: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
  { to: "/admin/notifications", label: "Notifications", icon: Bell },
  { to: "/admin/advertisers", label: "Advertisers", icon: Megaphone },
  { to: "/admin/marquee", label: "Sponsored marquee", icon: Megaphone },
  { to: "/admin/integrations", label: "Integrations", icon: Sparkles },
  { to: "/admin/moderation", label: "Moderation", icon: ShieldCheck },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/ad-analytics", label: "Ad analytics", icon: BarChart3 },
  { to: "/admin/audit", label: "Audit log", icon: ScrollText },
];

function AdminLayout() {
  const { loading, isAdmin, user, viewAs } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/admin/login" });
    else if (!isAdmin) navigate({ to: "/" });
    else if (viewAs !== "admin") navigate({ to: viewAs === "customer" ? "/portal" : "/" });
  }, [loading, user, isAdmin, viewAs, navigate]);

  if (loading || !isAdmin || viewAs !== "admin") {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Checking access…
      </div>
    );
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
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar collapsible="icon">
        <SidebarContent>
          <div className="flex items-center gap-2 px-3 py-4">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-vibe shadow-pop">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="text-sm">
              <div className="font-display font-bold leading-none">Concierge</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Admin
              </div>
            </div>
          </div>
          <SidebarGroup>
            <SidebarGroupLabel>Operations</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV.map((item) => {
                  const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild isActive={active}>
                        <Link
                          to={item.to as string as "/"}
                          onClick={handleNav}
                          className="flex items-center gap-2"
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Shortcuts</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/" onClick={handleNav} className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
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
