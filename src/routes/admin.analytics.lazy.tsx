import { createLazyFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3, DollarSign, CalendarCheck, TrendingUp, Users } from "lucide-react";

export const Route = createLazyFileRoute("/admin/analytics")({
  component: AdminAnalyticsPage,
});

type Range = "7d" | "30d" | "90d";

function gen(days: number, base: number, variance: number, growth = 1) {
    const today = new Date("2026-05-08");
    const out: {
        date: string;
        bookings: number;
        revenue: number;
    }[] = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const trend = (days - i) / days;
        const seasonal = Math.sin((i / 7) * Math.PI) * 0.25;
        const noise = (Math.sin(i * 13.37) + Math.cos(i * 7.7)) * 0.5;
        const bookings = Math.max(4, Math.round(base + trend * variance * growth + seasonal * variance + noise * variance * 0.3));
        const revenue = bookings * (60 + Math.round(((Math.sin(i * 1.3) + 1) / 2) * 80));
        out.push({
            date: d.toISOString().slice(5, 10),
            bookings,
            revenue,
        });
    }
    return out;
}

const VENUE_PERF = [
    { name: "Maydan", bookings: 184, revenue: 22400 },
    { name: "Le Diplomate", bookings: 161, revenue: 19880 },
    { name: "Albi", bookings: 143, revenue: 24310 },
    { name: "Rose's Luxury", bookings: 128, revenue: 17600 },
    { name: "Bresca", bookings: 109, revenue: 15240 },
    { name: "Pineapple & Pearls", bookings: 92, revenue: 21100 },
];

const CATEGORY_MIX = [
    { name: "Dining", value: 58, color: "hsl(var(--primary))" },
    { name: "Nightlife", value: 22, color: "var(--purple, oklch(0.55 0.2 300))" },
    { name: "Experiences", value: 14, color: "var(--gold, oklch(0.78 0.15 85))" },
    { name: "Events", value: 6, color: "var(--coral, oklch(0.68 0.18 25))" },
];

const RANGE_DAYS: Record<Range, number> = { "7d": 7, "30d": 30, "90d": 90 };

function StatCard({ label, value, delta, icon: Icon, tone, }: {
    label: string;
    value: string;
    delta: string;
    icon: typeof BarChart3;
    tone: string;
}) {
    return (<div className={`relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${tone} p-5 shadow-card`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-2 font-display text-3xl font-bold">{value}</div>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-background/70 backdrop-blur">
          <Icon className="h-5 w-5"/>
        </div>
      </div>
      <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
        <TrendingUp className="h-3 w-3"/> {delta}
      </div>
    </div>);
}

function AdminAnalyticsPage() {
    const [range, setRange] = useState<Range>("30d");
    const data = useMemo(() => gen(RANGE_DAYS[range], 18, 24, 1.4), [range]);
    const totals = useMemo(() => {
        const bookings = data.reduce((s, d) => s + d.bookings, 0);
        const revenue = data.reduce((s, d) => s + d.revenue, 0);
        const avgTicket = revenue / Math.max(1, bookings);
        return { bookings, revenue, avgTicket };
    }, [data]);
    return (<div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Insights
          </p>
          <h1 className="font-display text-3xl font-bold leading-tight flex items-center gap-2">
            <BarChart3 className="h-7 w-7"/> Analytics
          </h1>
          <p className="text-sm text-muted-foreground">
            Booking volume, revenue, and venue performance over time.
          </p>
        </div>
        <div className="inline-flex rounded-full border border-border bg-card p-1 text-xs">
          {(Object.keys(RANGE_DAYS) as Range[]).map((r) => (<button key={r} onClick={() => setRange(r)} className={`rounded-full px-3 py-1.5 font-semibold transition ${range === r
                ? "bg-gradient-vibe text-primary-foreground shadow-pop"
                : "text-muted-foreground hover:text-foreground"}`}>
              {r === "7d" ? "Last 7 days" : r === "30d" ? "Last 30 days" : "Last 90 days"}
            </button>))}
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Bookings" value={totals.bookings.toLocaleString()} delta="+14.2%" icon={CalendarCheck} tone="from-coral/30 to-coral/5"/>
        <StatCard label="Revenue" value={`$${(totals.revenue / 1000).toFixed(1)}k`} delta="+22.6%" icon={DollarSign} tone="from-gold/40 to-gold/5"/>
        <StatCard label="Avg ticket" value={`$${totals.avgTicket.toFixed(0)}`} delta="+3.1%" icon={TrendingUp} tone="from-purple/30 to-purple/5"/>
        <StatCard label="New users" value="312" delta="+9.4%" icon={Users} tone="from-coral/30 to-purple/10"/>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Bookings over time</h2>
            <span className="text-xs text-muted-foreground">Daily</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="bk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5}/>
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border"/>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))"/>
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))"/>
                <Tooltip contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 12,
            fontSize: 12,
        }}/>
                <Area type="monotone" dataKey="bookings" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#bk)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Revenue trend</h2>
            <span className="text-xs text-muted-foreground">USD, daily</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border"/>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))"/>
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${v / 1000}k`}/>
                <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]} contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 12,
            fontSize: 12,
        }}/>
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Venue performance</h2>
            <span className="text-xs text-muted-foreground">Bookings vs revenue</span>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={VENUE_PERF} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border"/>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" interval={0} angle={-15} dy={8} height={50}/>
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))"/>
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${v / 1000}k`}/>
                <Tooltip contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 12,
            fontSize: 12,
        }}/>
                <Legend wrapperStyle={{ fontSize: 12 }}/>
                <Bar yAxisId="left" dataKey="bookings" name="Bookings" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]}/>
                <Bar yAxisId="right" dataKey="revenue" name="Revenue" fill="oklch(0.78 0.15 85)" radius={[6, 6, 0, 0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Category mix</h2>
            <span className="text-xs text-muted-foreground">% of bookings</span>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={CATEGORY_MIX} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3}>
                  {CATEGORY_MIX.map((entry, i) => (<Cell key={i} fill={entry.color}/>))}
                </Pie>
                <Tooltip formatter={(v: number, n: string) => [`${v}%`, n]} contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 12,
            fontSize: 12,
        }}/>
                <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle"/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>);
}
