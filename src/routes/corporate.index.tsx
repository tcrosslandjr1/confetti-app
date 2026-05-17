import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, CheckCircle2, DollarSign, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CorporatePageHeader, useActiveCorporateCompany } from "@/components/CorporateShell";

export const Route = createFileRoute("/corporate/")({
  component: CorporateDashboardPage,
});

function CorporateDashboardPage() {
  const { data: company } = useActiveCorporateCompany();
  const companyId = company?.id;

  const { data: outings } = useQuery({
    enabled: !!companyId,
    queryKey: ["corporate", "outings", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("corporate_outings")
        .select("id,title,status,starts_at,headcount,budget_per_person_cents,total_budget_cents")
        .eq("company_id", companyId!)
        .order("starts_at", { ascending: true });
      return data ?? [];
    },
  });

  const now = Date.now();
  const upcoming = (outings ?? []).filter(
    (o) => o.starts_at && new Date(o.starts_at).getTime() > now,
  );
  const pendingApprovals = (outings ?? []).filter((o) => o.status === "pending_approval");
  const monthlySpend = (outings ?? [])
    .filter((o) => o.status === "completed" || o.status === "booked")
    .reduce((s, o) => s + (o.total_budget_cents ?? 0), 0);

  if (!company) {
    return (
      <div className="space-y-6">
        <CorporatePageHeader
          eyebrow="Welcome"
          title="Set up your company"
          description="Create your company workspace to invite admins, set policies, and plan outings."
        />
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">You don't have a corporate workspace yet.</p>
          <Button asChild className="mt-4">
            <Link to="/corporate/settings">Create company</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CorporatePageHeader
        eyebrow={`Welcome back to ${company.name}`}
        title="Corporate Dashboard"
        description="At-a-glance view of upcoming outings, approvals, spend, and team activity."
        actions={
          <Button asChild>
            <Link to="/corporate/planner">Plan an outing</Link>
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CalendarDays} label="Upcoming outings" value={upcoming.length} />
        <StatCard icon={CheckCircle2} label="Pending approvals" value={pendingApprovals.length} />
        <StatCard
          icon={DollarSign}
          label="Spend this period"
          value={`$${(monthlySpend / 100).toFixed(0)}`}
        />
        <StatCard icon={Users} label="Total outings" value={outings?.length ?? 0} />
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold">Upcoming outings</h2>
        {upcoming.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No outings on the books. Use the planner to generate options.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {upcoming.slice(0, 5).map((o) => (
              <li key={o.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium">{o.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(o.starts_at!).toLocaleString()} · party of {o.headcount}
                  </div>
                </div>
                <span className="rounded-full bg-muted px-3 py-1 text-xs capitalize">
                  {o.status.replace(/_/g, " ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold">{value}</div>
        </div>
      </div>
    </Card>
  );
}
