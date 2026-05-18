import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Download } from "lucide-react";

export const Route = createFileRoute("/partner/analytics")({
  component: AnalyticsPage,
});

const METRICS = [
  { label: "Reservations", value: "412", delta: "+22%", up: true },
  { label: "Orders", value: "298", delta: "+14%", up: true },
  { label: "Revenue via Confetti", value: "$18,420", delta: "+31%", up: true },
  { label: "Avg party size", value: "3.4", delta: "+0.2", up: true },
  { label: "No-show rate", value: "4.2%", delta: "-1.1%", up: false },
  { label: "Cancel rate", value: "6.8%", delta: "+0.4%", up: true },
  { label: "Confetti Score", value: "4.8 / 5", delta: "+0.1", up: true },
  { label: "Repeat visitors", value: "38%", delta: "+5%", up: true },
];

const TOP_VIBES = [
  { name: "Rooftop Vibes", pct: 42 },
  { name: "Date Night", pct: 28 },
  { name: "Chill & Classy", pct: 18 },
  { name: "Group Friendly", pct: 12 },
];

const FUNNEL = [
  { label: "Itinerary appearances", value: 2840 },
  { label: "Bookings from itinerary", value: 318 },
  { label: "Conversion rate", value: "11.2%" },
  { label: "Swap-in rate", value: "8.4%" },
];

// peak hour heatmap
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = ["5p", "6p", "7p", "8p", "9p", "10p", "11p"];

function heat(d: number, h: number) {
  const base = (d * 3 + h * 2 + (d + h) * 7) % 100;
  const score = Math.min(100, base + (d >= 4 && h >= 2 && h <= 5 ? 40 : 0));
  return score;
}

function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Performance across reservations, orders, and discovery.</p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="month">
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This week</SelectItem>
              <SelectItem value="month">This month</SelectItem>
              <SelectItem value="quarter">This quarter</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline"><Download className="h-4 w-4 mr-1.5" />Export</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {METRICS.map((m) => (
          <Card key={m.label} className="p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{m.label}</div>
            <div className="mt-2 text-2xl font-semibold">{m.value}</div>
            <div className={`mt-1 text-xs flex items-center gap-1 ${m.up ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
              {m.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {m.delta} vs last period
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <h2 className="font-semibold mb-4">Peak booking hours</h2>
          <div className="overflow-x-auto">
            <div className="min-w-[420px] grid grid-cols-[60px_repeat(7,1fr)] gap-1">
              <div />
              {DAYS.map((d) => (<div key={d} className="text-xs text-center text-muted-foreground">{d}</div>))}
              {HOURS.map((h, hi) => (
                <>
                  <div key={`h-${hi}`} className="text-xs text-muted-foreground text-right pr-2 py-1.5">{h}</div>
                  {DAYS.map((_, di) => {
                    const s = heat(di, hi);
                    return (
                      <div
                        key={`${di}-${hi}`}
                        className="h-7 rounded"
                        style={{ background: `hsl(var(--primary) / ${(s / 100 * 0.85 + 0.05).toFixed(2)})` }}
                        title={`${DAYS[di]} ${h} — ${s}`}
                      />
                    );
                  })}
                </>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold mb-4">Top vibes driving traffic</h2>
          <div className="space-y-3">
            {TOP_VIBES.map((v) => (
              <div key={v.name}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>{v.name}</span>
                  <span className="font-medium tabular-nums">{v.pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-orange-400" style={{ width: `${v.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 lg:col-span-3">
          <h2 className="font-semibold mb-4">Itinerary funnel</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {FUNNEL.map((f) => (
              <div key={f.label} className="p-4 rounded-lg bg-muted/30">
                <div className="text-xs text-muted-foreground">{f.label}</div>
                <div className="text-2xl font-semibold mt-1">{f.value}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
