import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { CheckCircle2, CreditCard, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BusinessPageShell } from "@/components/business/BusinessTabNav";
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

const INVOICES = [
  { id: "INV-2026-005", date: "May 1, 2026", amount: "$199.00", status: "Paid" },
  { id: "INV-2026-004", date: "Apr 1, 2026", amount: "$199.00", status: "Paid" },
  { id: "INV-2026-003", date: "Mar 1, 2026", amount: "$199.00", status: "Paid" },
];

function BusinessBillingPage() {
  return (
    <BusinessPageShell
      eyebrow="Billing & Subscription"
      title="Plan and invoices"
      description="Manage your Confetti for Business subscription and payment method."
      actions={
        <Button asChild>
          <Link to="/business/pricing">Upgrade plan</Link>
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5 md:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Current plan
              </div>
              <div className="mt-1 font-display text-2xl font-bold">Boost — Tier 2</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Renews on <span className="font-semibold text-foreground">Jun 1, 2026</span> · $199 / mo
              </div>
            </div>
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {["Featured badge", "Boosted reels", "Priority search", "Hot Spots rotation"].map((f) => (
              <span
                key={f}
                className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
              >
                {f}
              </span>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Payment method
          </div>
          <div className="mt-3 flex items-center gap-3 rounded-lg border bg-background/50 p-3">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <div className="text-sm font-semibold">Visa •••• 4242</div>
              <div className="text-xs text-muted-foreground">Exp 09/28</div>
            </div>
          </div>
          <Button variant="outline" size="sm" className="mt-3 w-full">
            Update card
          </Button>
        </Card>
      </div>

      <Card className="mt-6 p-5">
        <div className="mb-3 font-display text-lg font-bold">Invoices</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-2">Invoice</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th className="text-right">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {INVOICES.map((inv) => (
                <tr key={inv.id} className="border-t border-border/60">
                  <td className="py-2 font-mono text-xs">{inv.id}</td>
                  <td>{inv.date}</td>
                  <td className="font-semibold">{inv.amount}</td>
                  <td>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                      <CheckCircle2 className="h-2.5 w-2.5" /> {inv.status}
                    </span>
                  </td>
                  <td className="text-right">
                    <Button size="sm" variant="ghost">
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </BusinessPageShell>
  );
}
