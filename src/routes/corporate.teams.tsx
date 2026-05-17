import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CorporatePageHeader,
  useActiveCorporateCompany,
} from "@/components/CorporateShell";

export const Route = createFileRoute("/corporate/teams")({
  component: CorporateTeamsPage,
});

function CorporateTeamsPage() {
  const { data: company } = useActiveCorporateCompany();
  const companyId = company?.id;

  const { data: teams } = useQuery({
    enabled: !!companyId,
    queryKey: ["corporate", "teams", companyId],
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("corporate_teams")
        .select("id,name,city,description,manager_id")
        .eq("company_id", companyId!)
        .order("name");
      if (!rows) return [];
      // count members per team
      const ids = rows.map((r) => r.id);
      const { data: members } = await supabase
        .from("corporate_team_members")
        .select("team_id")
        .in("team_id", ids);
      const counts = new Map<string, number>();
      (members ?? []).forEach((m) =>
        counts.set(m.team_id, (counts.get(m.team_id) ?? 0) + 1),
      );
      return rows.map((r) => ({ ...r, member_count: counts.get(r.id) ?? 0 }));
    },
  });

  return (
    <div className="space-y-6">
      <CorporatePageHeader
        eyebrow="People"
        title="Teams"
        description="Group employees, set per-team budgets, and review outing history."
        actions={<Button>New team</Button>}
      />
      {(!teams || teams.length === 0) && (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          No teams yet.
        </Card>
      )}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {teams?.map((t) => (
          <Card key={t.id} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{t.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {t.city ?? "Unspecified city"}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs">
                <Users className="size-3" />
                {t.member_count}
              </span>
            </div>
            {t.description && (
              <p className="mt-3 text-sm text-muted-foreground">
                {t.description}
              </p>
            )}
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm">
                Manage
              </Button>
              <Button variant="ghost" size="sm">
                History
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
