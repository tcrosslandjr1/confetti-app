import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CorporatePageHeader,
  useActiveCorporateCompany,
} from "@/components/CorporateShell";

export const Route = createFileRoute("/corporate/policies")({
  component: CorporatePoliciesPage,
});

function CorporatePoliciesPage() {
  const { data: company } = useActiveCorporateCompany();
  const companyId = company?.id;

  const { data: policies } = useQuery({
    enabled: !!companyId,
    queryKey: ["corporate", "policies", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("corporate_policies")
        .select("*")
        .eq("company_id", companyId!)
        .order("is_default", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <CorporatePageHeader
        eyebrow="Governance"
        title="Policies"
        description="Budget rules, alcohol rules, allowed categories, and approval thresholds."
        actions={<Button>New policy</Button>}
      />
      {(!policies || policies.length === 0) && (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          No policies yet. Add one to constrain venues and require approvals.
        </Card>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {policies?.map((p) => (
          <Card key={p.id} className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{p.name}</h3>
                {p.is_default && (
                  <Badge variant="secondary" className="mt-1">
                    Default
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="sm">
                Edit
              </Button>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <PolicyRow
                label="Budget / person"
                value={`$${(p.per_person_budget_cents / 100).toFixed(0)}`}
              />
              <PolicyRow
                label="Approval over"
                value={
                  p.approval_threshold_cents > 0
                    ? `$${(p.approval_threshold_cents / 100).toFixed(0)}`
                    : "—"
                }
              />
              <PolicyRow
                label="Max headcount"
                value={p.max_headcount ?? "—"}
              />
              <PolicyRow
                label="Alcohol"
                value={p.alcohol_allowed ? "Allowed" : "Not allowed"}
              />
              <PolicyRow
                label="Allowed cities"
                value={
                  p.allowed_cities?.length
                    ? p.allowed_cities.join(", ")
                    : "Any"
                }
              />
              <PolicyRow
                label="Allowed categories"
                value={
                  p.allowed_categories?.length
                    ? p.allowed_categories.join(", ")
                    : "Any"
                }
              />
            </dl>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PolicyRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}
