import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, CreditCard, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BusinessPageShell } from "@/components/business/BusinessTabNav";
import { getMyBusinessSubscription } from "@/lib/business-portal.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/business/billing")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/business/login" });
  },
  head: () => ({ meta: [{ title: "Billing — Confetti for Business" }] }),
  component: BusinessBillingPage,
});

function fmtDate(d: string | null | undefined) {
  return d
    ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "—";
}

function BusinessBillingPage() {
  const fetcher = useServerFn(getMyBusinessSubscription);
  const q = useQuery({ queryKey: ["my-business-sub"], queryFn: () => fetcher() });

  const sub = q.data?.subscription ?? null;
  const history = q.data?.history ?? [];

  return (
    <BusinessPageShell
      eyebrow="Billing & Subscription"
      title="Plan and history"
      description="Manage your Confetti for Business subscription."
      actions={
        <Button asChild>
          <Link to="/business/pricing">{sub ? "Change plan" : "Upgrade plan"}</Link>
        </Button>
      }
    >
      {q.isLoading ? (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-5 md:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Current plan
                  </div>
                  <div className="mt-1 font-display text-2xl font-bold">
                    {sub ? sub.tier ?? sub.product_id ?? "Active subscription" : "Free"}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {sub ? (
                      <>
                        Status{" "}
                        <span className="font-semibold capitalize text-foreground">
                          {sub.status}
                        </span>
                        {sub.current_period_end && (
                          <>
                            {" · "}
                            {sub.cancel_at_period_end ? "ends" : "renews"}{" "}
                            <span className="font-semibold text-foreground">
                              {fmtDate(sub.current_period_end)}
                            </span>
                          </>
                        )}
                      </>
                    ) : (
                      "No active subscription. Upgrade to unlock promotion features."
                    )}
                  </div>
                </div>
                {sub ? (
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                ) : (
                  <CreditCard className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              {sub?.cancel_at_period_end && (
                <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  Scheduled to cancel at the end of the current period.
                </div>
              )}
            </Card>

            <Card className="p-5">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Payment method
              </div>
              <div className="mt-3 flex items-center gap-3 rounded-lg border bg-background/50 p-3">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1 text-sm">
                  {sub ? "Managed in Stripe" : "No card on file"}
                </div>
              </div>
              <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
                <Link to="/business/pricing">Manage</Link>
              </Button>
            </Card>
          </div>

          <Card className="mt-6 p-5">
            <div className="mb-3 font-display text-lg font-bold">Subscription history</div>
            {history.length === 0 ? (
              <div className="grid place-items-center py-10 text-sm text-muted-foreground">
                No subscription records yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="py-2">Tier</th>
                      <th>Status</th>
                      <th>Period start</th>
                      <th>Period end</th>
                      <th>Env</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((row) => (
                      <tr key={row.id} className="border-t border-border/60">
                        <td className="py-2 font-semibold">
                          {row.tier ?? row.product_id ?? "—"}
                        </td>
                        <td>
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                            {row.status}
                          </span>
                        </td>
                        <td>{fmtDate(row.current_period_start)}</td>
                        <td>{fmtDate(row.current_period_end)}</td>
                        <td className="text-xs uppercase text-muted-foreground">
                          {row.environment}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </BusinessPageShell>
  );
}
