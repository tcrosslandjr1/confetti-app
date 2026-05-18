import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Sparkles, Zap, Gift, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/partner/promotions")({
  component: PromotionsPage,
});

const PROMOS = [
  { name: "Happy Hour Double Points", type: "2× Confetti Points", icon: Zap, range: "Mon–Fri 4–6 PM", impressions: 2840, bookings: 218, revenue: "$4,210", active: true },
  { name: "First-time visitor: free dessert", type: "Free item", icon: Gift, range: "Until Jul 1", impressions: 1420, bookings: 96, revenue: "$1,884", active: true },
  { name: "Boosted placement — Rooftop Vibes", type: "Priority placement", icon: TrendingUp, range: "May 18–25", impressions: 8920, bookings: 412, revenue: "$11,240", active: false },
];

function PromotionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">Promotions & specials</h1>
          <p className="text-muted-foreground text-sm mt-1">Run Confetti-powered promos that drive bookings.</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-1.5" />New promotion</Button>
      </div>

      <div className="space-y-3">
        {PROMOS.map((p) => {
          const Icon = p.icon;
          return (
            <Card key={p.name} className="p-5">
              <div className="flex items-start gap-4 flex-wrap">
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-semibold">{p.name}</div>
                    <Badge variant="outline">{p.type}</Badge>
                    {p.active ? (
                      <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Scheduled</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{p.range}</div>
                </div>
                <div className="flex gap-6 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">Impressions</div>
                    <div className="font-semibold tabular-nums">{p.impressions.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Bookings</div>
                    <div className="font-semibold tabular-nums">{p.bookings}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Revenue</div>
                    <div className="font-semibold tabular-nums">{p.revenue}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch defaultChecked={p.active} />
                  <Button variant="ghost" size="sm">Edit</Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-6 bg-gradient-to-br from-primary/10 to-orange-400/5 border-primary/20">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary text-primary-foreground grid place-items-center shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="font-semibold">Confetti Moments</div>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Opt-in surprises for Confetti users on check-in — a free dessert, champagne toast, or DJ shoutout.
              You absorb the cost; Confetti boosts your Score and visibility.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <Button>Set up a Moment</Button>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Switch /> Currently off
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
