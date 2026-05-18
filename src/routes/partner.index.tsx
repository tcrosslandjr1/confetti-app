import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarCheck,
  Clock,
  ShoppingBag,
  DollarSign,
  Star,
  TrendingUp,
  CheckCircle2,
  Ban,
  XCircle,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/partner/")({
  component: PartnerHome,
});

const STATS = [
  { label: "Today's Reservations", value: 18, icon: CalendarCheck, hint: "6 upcoming • 12 confirmed", tone: "primary" },
  { label: "Pending Confirmations", value: 4, icon: Clock, hint: "Tier 2 — needs review", tone: "amber" },
  { label: "Active Orders", value: 7, icon: ShoppingBag, hint: "3 in kitchen", tone: "blue" },
  { label: "Today's Revenue", value: "$1,284", icon: DollarSign, hint: "Deposits + orders", tone: "green" },
];

const TIMELINE = [
  { time: "6:30 PM", name: "@maya.k", party: 4, status: "Confirmed", source: "Itinerary" },
  { time: "6:45 PM", name: "@dan", party: 2, status: "Confirmed", source: "Direct" },
  { time: "7:00 PM", name: "@aliyahg", party: 6, status: "Pending", source: "Party Room" },
  { time: "7:15 PM", name: "@theo", party: 2, status: "Confirmed", source: "Itinerary" },
  { time: "8:00 PM", name: "@noor", party: 8, status: "Pending", source: "Itinerary" },
];

function PartnerHome() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Tonight at Sundae Rooftop</h1>
          <p className="text-muted-foreground mt-1 text-sm">Friday, May 22 — clear skies, peak vibe window 8–11 PM.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-gradient-to-r from-primary to-orange-400 text-primary-foreground border-0 gap-1">
            <Sparkles className="h-3 w-3" />
            Trending in Rooftop Vibes
          </Badge>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border text-sm">
            <Star className="h-3.5 w-3.5 fill-primary text-primary" />
            <span className="font-medium">4.8</span>
            <span className="text-muted-foreground">Confetti Score</span>
          </div>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</div>
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="mt-2 text-3xl font-semibold">{s.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{s.hint}</div>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Timeline */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Upcoming bookings</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/partner/reservations">View all</Link>
            </Button>
          </div>
          <div className="space-y-1">
            {TIMELINE.map((r, i) => (
              <div
                key={i}
                className="flex items-center gap-4 py-3 border-b last:border-0 border-border/60"
              >
                <div className="w-16 text-sm font-medium tabular-nums">{r.time}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{r.name} · party of {r.party}</div>
                  <div className="text-xs text-muted-foreground">via {r.source}</div>
                </div>
                <Badge
                  variant={r.status === "Confirmed" ? "secondary" : "outline"}
                  className={r.status === "Pending" ? "border-amber-500/40 text-amber-700 dark:text-amber-400" : ""}
                >
                  {r.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick actions */}
        <Card className="p-5">
          <h2 className="font-semibold mb-4">Quick actions</h2>
          <div className="space-y-2">
            <Button className="w-full justify-start" variant="default">
              <CheckCircle2 className="h-4 w-4 mr-2" /> Confirm all pending (4)
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Ban className="h-4 w-4 mr-2" /> Block a time slot
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <XCircle className="h-4 w-4 mr-2" /> Mark item unavailable
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link to="/partner/calendar">
                <CalendarDays className="h-4 w-4 mr-2" /> Full calendar
              </Link>
            </Button>
          </div>

          <div className="mt-6 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 text-xs font-medium text-primary mb-1">
              <TrendingUp className="h-3.5 w-3.5" />
              Weekly trend
            </div>
            <div className="text-sm">Reservations up <span className="font-semibold text-primary">+22%</span> vs last week.</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
