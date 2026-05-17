import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { CorporatePageHeader, useActiveCorporateCompany } from "@/components/CorporateShell";

export const Route = createFileRoute("/corporate/reporting")({
  component: CorporateReportingPage,
});

function CorporateReportingPage() {
  const { data: company } = useActiveCorporateCompany();
  const companyId = company?.id;

  const { data: rows } = useQuery({
    enabled: !!companyId,
    queryKey: ["corporate", "reporting", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("corporate_outings")
        .select("status,total_budget_cents,team_id,city")
        .eq("company_id", companyId!);
      return data ?? [];
    },
  });

  const totalSpend = (rows ?? [])
    .filter((r) => r.status === "completed" || r.status === "booked")
    .reduce((s, r) => s + (r.total_budget_cents ?? 0), 0);

  const byTeam = new Map<string, number>();
  const byCity = new Map<string, number>();
  (rows ?? []).forEach((r) => {
    const key = r.team_id ?? "unassigned";
    byTeam.set(key, (byTeam.get(key) ?? 0) + (r.total_budget_cents ?? 0));
    const c = r.city ?? "—";
    byCity.set(c, (byCity.get(c) ?? 0) + (r.total_budget_cents ?? 0));
  });

  return (
    <div className="space-y-6">
      <CorporatePageHeader
        eyebrow="Insights"
        title="Reporting"
        description="Spend by team, by city, attendance, and recurring favorite venues."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Total spend</div>
          <div className="mt-2 text-3xl font-semibold">${(totalSpend / 100).toFixed(0)}</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Outings logged
          </div>
          <div className="mt-2 text-3xl font-semibold">{rows?.length ?? 0}</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Active teams
          </div>
          <div className="mt-2 text-3xl font-semibold">{byTeam.size}</div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold">Spend by team</h3>
          <ul className="mt-4 space-y-2 text-sm">
            {[...byTeam.entries()].map(([team, cents]) => (
              <li key={team} className="flex justify-between">
                <span className="text-muted-foreground">{team.slice(0, 8)}</span>
                <span className="font-medium">${(cents / 100).toFixed(0)}</span>
              </li>
            ))}
            {byTeam.size === 0 && <li className="text-muted-foreground">No data.</li>}
          </ul>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold">Spend by city</h3>
          <ul className="mt-4 space-y-2 text-sm">
            {[...byCity.entries()].map(([city, cents]) => (
              <li key={city} className="flex justify-between">
                <span className="text-muted-foreground">{city}</span>
                <span className="font-medium">${(cents / 100).toFixed(0)}</span>
              </li>
            ))}
            {byCity.size === 0 && <li className="text-muted-foreground">No data.</li>}
          </ul>
        </Card>
      </div>
    </div>
  );
}
