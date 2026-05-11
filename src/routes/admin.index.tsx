import { createFileRoute } from "@tanstack/react-router";
import { Activity, CalendarCheck, DollarSign, Store, TrendingUp, Users } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

const KPIS = [
  {
    label: "Total users",
    value: "1,284",
    delta: "+12.4%",
    icon: Users,
    tone: "from-coral/30 to-coral/5",
  },
  {
    label: "Active bookings",
    value: "327",
    delta: "+4.1%",
    icon: CalendarCheck,
    tone: "from-purple/30 to-purple/5",
  },
  {
    label: "Revenue MTD",
    value: "$48.2k",
    delta: "+18.7%",
    icon: DollarSign,
    tone: "from-gold/40 to-gold/5",
  },
  {
    label: "Venues live",
    value: "92",
    delta: "+3",
    icon: Store,
    tone: "from-coral/30 to-purple/10",
  },
];

const TOP_VENUES = [
  { name: "Maydan", neighborhood: "14th St", bookings: 84 },
  { name: "Le Diplomate", neighborhood: "Logan Circle", bookings: 71 },
  { name: "Albi", neighborhood: "Navy Yard", bookings: 63 },
  { name: "Rose's Luxury", neighborhood: "Barracks Row", bookings: 58 },
  { name: "Bresca", neighborhood: "14th St", bookings: 49 },
];

const ACTIVITY = [
  { who: "Sarah K.", what: "booked Maydan for 4", when: "2m ago" },
  { who: "Admin", what: "featured 'Late Eats' collection", when: "18m ago" },
  { who: "Marcus T.", what: "left a 5★ visit note at Albi", when: "42m ago" },
  { who: "System", what: "imported 12 new venues", when: "1h ago" },
  { who: "Priya R.", what: "joined as customer", when: "3h ago" },
];

function AdminDashboard() {
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Overview
          </p>
          <h1 className="font-display text-3xl font-bold leading-tight">Good morning, Admin.</h1>
          <p className="text-sm text-muted-foreground">Here's how the platform is doing today.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs">
          <Activity className="h-3.5 w-3.5 text-coral" /> All systems operational
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS.map((k) => (
          <div
            key={k.label}
            className={`relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${k.tone} p-5 shadow-card`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  {k.label}
                </div>
                <div className="mt-2 font-display text-3xl font-bold">{k.value}</div>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-background/70 backdrop-blur">
                <k.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <TrendingUp className="h-3 w-3" /> {k.delta} vs last month
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Top venues this week</h2>
            <span className="text-xs text-muted-foreground">By bookings</span>
          </div>
          <ul className="space-y-3">
            {TOP_VENUES.map((v, i) => {
              const max = TOP_VENUES[0].bookings;
              const pct = (v.bookings / max) * 100;
              return (
                <li key={v.name} className="flex items-center gap-3">
                  <span className="w-5 text-xs font-mono text-muted-foreground">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate font-semibold">{v.name}</span>
                      <span className="text-xs text-muted-foreground">{v.neighborhood}</span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-vibe"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-10 text-right text-sm font-semibold">{v.bookings}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h2 className="mb-4 font-display text-lg font-bold">Recent activity</h2>
          <ul className="space-y-3">
            {ACTIVITY.map((a, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-coral" />
                <div className="min-w-0 flex-1">
                  <p className="truncate">
                    <span className="font-semibold">{a.who}</span>{" "}
                    <span className="text-muted-foreground">{a.what}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{a.when}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-border bg-card/50 p-5 text-sm text-muted-foreground">
        <p>
          <span className="font-semibold text-foreground">Phase 2 preview.</span> Users, Venues,
          Curated, Bookings, Moderation, and Analytics screens are scaffolded next. Pick a sidebar
          item to start.
        </p>
      </section>
    </div>
  );
}
