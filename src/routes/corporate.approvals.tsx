import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CorporatePageHeader,
  useActiveCorporateCompany,
} from "@/components/CorporateShell";

export const Route = createFileRoute("/corporate/approvals")({
  component: CorporateApprovalsPage,
});

function CorporateApprovalsPage() {
  const { data: company } = useActiveCorporateCompany();
  const companyId = company?.id;

  const { data: outings } = useQuery({
    enabled: !!companyId,
    queryKey: ["corporate", "approvals", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("corporate_outings")
        .select(
          "id,title,status,starts_at,headcount,total_budget_cents,team_id",
        )
        .eq("company_id", companyId!)
        .eq("status", "pending_approval")
        .order("starts_at");
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <CorporatePageHeader
        eyebrow="Workflow"
        title="Approvals"
        description="Review outings that exceed policy thresholds or need admin sign-off."
      />
      <Card className="p-0">
        {!outings || outings.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No approvals waiting on you.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {outings.map((o) => (
              <li
                key={o.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <div className="min-w-0">
                  <div className="font-medium">{o.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {o.starts_at
                      ? new Date(o.starts_at).toLocaleString()
                      : "TBD"}{" "}
                    · party of {o.headcount} · $
                    {(o.total_budget_cents / 100).toFixed(0)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Request changes
                  </Button>
                  <Button variant="destructive" size="sm">
                    Reject
                  </Button>
                  <Button size="sm">Approve</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
