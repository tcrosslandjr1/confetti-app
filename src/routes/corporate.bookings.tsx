import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import {
  CorporatePageHeader,
  useActiveCorporateCompany,
} from "@/components/CorporateShell";

export const Route = createFileRoute("/corporate/bookings")({
  component: CorporateBookingsPage,
});

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-muted text-foreground",
  pending_approval: "bg-amber-100 text-amber-900",
  approved: "bg-emerald-100 text-emerald-900",
  booked: "bg-primary/15 text-primary",
  completed: "bg-secondary text-secondary-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

function CorporateBookingsPage() {
  const { data: company } = useActiveCorporateCompany();
  const companyId = company?.id;

  const { data: outings } = useQuery({
    enabled: !!companyId,
    queryKey: ["corporate", "bookings", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("corporate_outings")
        .select(
          "id,title,status,starts_at,headcount,total_budget_cents,city",
        )
        .eq("company_id", companyId!)
        .order("starts_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <CorporatePageHeader
        eyebrow="Operations"
        title="Bookings"
        description="Every confirmed outing with venue details, cost, and receipts."
      />
      <Card className="p-0">
        {!outings || outings.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No bookings yet.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {outings.map((o) => (
              <li key={o.id} className="flex items-center justify-between p-4">
                <div>
                  <div className="font-medium">{o.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {o.starts_at
                      ? new Date(o.starts_at).toLocaleString()
                      : "TBD"}{" "}
                    · {o.city ?? "—"} · party of {o.headcount}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">
                    ${(o.total_budget_cents / 100).toFixed(0)}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs capitalize ${
                      STATUS_COLOR[o.status] ?? "bg-muted"
                    }`}
                  >
                    {o.status.replace(/_/g, " ")}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
