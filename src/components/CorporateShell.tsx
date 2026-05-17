import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Building2,
  ShieldCheck,
  Users,
  Sparkles,
  CheckCircle2,
  CalendarDays,
  BarChart3,
  LogOut,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type CorporateCompany = {
  id: string;
  name: string;
  plan_tier: string;
  domain: string | null;
  owner_id: string;
};

export function useActiveCorporateCompany() {
  const { user } = useAuth();
  return useQuery({
    enabled: !!user,
    queryKey: ["corporate", "active-company", user?.id],
    queryFn: async (): Promise<CorporateCompany | null> => {
      if (!user) return null;
      // Prefer companies where user is owner; fall back to membership
      const { data: owned } = await supabase
        .from("corporate_companies")
        .select("id,name,plan_tier,domain,owner_id")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1);
      if (owned && owned.length) return owned[0] as CorporateCompany;
      const { data: memberships } = await supabase
        .from("corporate_company_members")
        .select("company_id")
        .eq("user_id", user.id)
        .limit(1);
      const cid = memberships?.[0]?.company_id;
      if (!cid) return null;
      const { data } = await supabase
        .from("corporate_companies")
        .select("id,name,plan_tier,domain,owner_id")
        .eq("id", cid)
        .maybeSingle();
      return (data as CorporateCompany) ?? null;
    },
  });
}

const NAV = [
  { to: "/corporate", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/corporate/settings", label: "Company", icon: Building2 },
  { to: "/corporate/policies", label: "Policies", icon: ShieldCheck },
  { to: "/corporate/teams", label: "Teams", icon: Users },
  { to: "/corporate/planner", label: "Outing Planner", icon: Sparkles },
  { to: "/corporate/approvals", label: "Approvals", icon: CheckCircle2 },
  { to: "/corporate/bookings", label: "Bookings", icon: CalendarDays },
  { to: "/corporate/reporting", label: "Reporting", icon: BarChart3 },
];

export function CorporateShell() {
  const location = useLocation();
  const { data: company } = useActiveCorporateCompany();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-8 md:px-6 md:py-10">
        <aside className="hidden w-60 shrink-0 md:block">
          <div className="sticky top-6 space-y-6">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                Corporate
              </div>
              <div className="mt-1 truncate text-lg font-semibold">
                {company?.name ?? "Your Company"}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {company ? `${company.plan_tier} plan` : "No company yet"}
              </div>
            </div>
            <nav className="space-y-1">
              {NAV.map(({ to, label, icon: Icon, exact }) => {
                const active = exact
                  ? location.pathname === to
                  : location.pathname.startsWith(to);
                return (
                  <Link
                    key={to}
                    to={to}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                    {label}
                  </Link>
                );
              })}
            </nav>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground"
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/corporate/login";
              }}
            >
              <LogOut className="mr-2 size-4" /> Sign out
            </Button>
          </div>
        </aside>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function CorporatePageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <div className="text-xs uppercase tracking-widest text-primary">
            {eyebrow}
          </div>
        )}
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
