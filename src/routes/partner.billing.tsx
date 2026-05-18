import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, Copy, ExternalLink, Sparkles } from "lucide-react";

export const Route = createFileRoute("/partner/billing")({
  component: BillingPage,
});

const TIERS = [
  { n: 0, name: "Listed", features: ["Profile in Confetti", "Photos & vibe tags"] },
  {
    n: 1,
    name: "External link",
    features: ["Everything in Listed", "External reservation link", "Confetti Score"],
  },
  {
    n: 2,
    name: "Manual booking",
    features: ["Everything in Tier 1", "In-app reservations", "Order-ahead", "Deposits"],
  },
  {
    n: 3,
    name: "Instant book",
    features: ["Everything in Tier 2", "Instant confirm", "POS sync", "Promotions engine"],
  },
];

const PAYOUTS = [
  { date: "May 17", amount: "$1,842.00", status: "Paid" },
  { date: "May 10", amount: "$2,103.50", status: "Paid" },
  { date: "May 3", amount: "$1,672.25", status: "Paid" },
  { date: "Apr 26", amount: "$1,988.00", status: "Paid" },
];

function BillingPage() {
  const current = 3;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold">Tier & billing</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your current plan, payouts, and integration credentials.
        </p>
      </div>

      <Card className="p-6 bg-gradient-to-br from-primary/10 via-orange-400/5 to-transparent border-primary/20">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-primary font-medium flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Current tier
            </div>
            <div className="text-3xl font-semibold mt-1">Tier {current} — Instant Book</div>
            <div className="text-sm text-muted-foreground mt-1">
              Full Confetti suite, including POS sync.
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Commission</div>
            <div className="text-2xl font-semibold">5%</div>
            <div className="text-xs text-muted-foreground">per booking + order</div>
          </div>
        </div>

        <div className="grid sm:grid-cols-4 gap-3 mt-6">
          {TIERS.map((t) => (
            <div
              key={t.n}
              className={`p-4 rounded-lg border ${t.n === current ? "border-primary bg-card" : "border-border/60 bg-card/40"}`}
            >
              <div className="flex items-center justify-between">
                <div className="font-semibold">Tier {t.n}</div>
                {t.n === current && <Check className="h-4 w-4 text-primary" />}
              </div>
              <div className="text-xs text-muted-foreground">{t.name}</div>
              <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                {t.features.map((f) => (
                  <li key={f}>· {f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="font-semibold mb-4">Billing</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monthly platform fee</span>
              <span className="font-medium">$0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment schedule</span>
              <span className="font-medium">Weekly</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bank account</span>
              <span className="font-medium">Chase ****1234</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Next payout</span>
              <span className="font-medium">May 24</span>
            </div>
          </div>
          <Button variant="outline" className="mt-4">
            Update bank account
          </Button>

          <h3 className="font-medium mt-6 mb-2 text-sm">Payout history</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PAYOUTS.map((p) => (
                <TableRow key={p.date}>
                  <TableCell>{p.date}</TableCell>
                  <TableCell className="font-medium">{p.amount}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{p.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      PDF
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold mb-4">Integration</h2>
          <div className="space-y-4 text-sm">
            <div>
              <div className="text-xs text-muted-foreground mb-1">API key</div>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value="cf_live_••••••••••••••••3a72"
                  className="font-mono text-xs"
                />
                <Button variant="outline" size="icon">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Webhook URL</div>
              <Input defaultValue="https://sundae.com/api/confetti/hooks" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
              <div>
                <div className="text-sm font-medium">POS: Toast</div>
                <div className="text-xs text-muted-foreground">Connected · last sync 2m ago</div>
              </div>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Manage
              </Button>
            </div>
            <div className="text-xs text-muted-foreground flex justify-between">
              <span>API usage this month</span>
              <span className="font-medium text-foreground">14,212 / 100,000</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
