import { createLazyFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3, MousePointerClick, ThumbsDown, ThumbsUp, Eye } from "lucide-react";
import { getPickAnalytics, type PickAnalyticsResponse } from "@/lib/pick-analytics.functions";

export const Route = createLazyFileRoute("/admin/pick-analytics")({
  component: PickAnalyticsPage,
});

type Range = 7 | 30 | 90;

type Metric = "impressions" | "clicks" | "up" | "down";

const METRICS: {
    key: Metric;
    label: string;
    icon: typeof Eye;
    color: string;
}[] = [
    { key: "impressions", label: "Impressions", icon: Eye, color: "oklch(0.65 0.18 35)" },
    { key: "clicks", label: "Clicks", icon: MousePointerClick, color: "oklch(0.62 0.2 280)" },
    { key: "up", label: "Upvotes", icon: ThumbsUp, color: "oklch(0.7 0.18 145)" },
    { key: "down", label: "Downvotes", icon: ThumbsDown, color: "oklch(0.6 0.22 25)" },
];

const SIGNAL_PALETTE = [
    "oklch(0.65 0.2 35)",
    "oklch(0.62 0.2 280)",
    "oklch(0.7 0.18 145)",
    "oklch(0.78 0.15 85)",
    "oklch(0.6 0.22 25)",
    "oklch(0.55 0.18 200)",
    "oklch(0.68 0.16 320)",
    "oklch(0.6 0.18 100)",
];

function PickAnalyticsPage() {
    const [range, setRange] = useState<Range>(30);
    const [metric, setMetric] = useState<Metric>("impressions");
    const fetchFn = useServerFn(getPickAnalytics);
    const { data, isLoading, error } = useQuery<PickAnalyticsResponse>({
        queryKey: ["pick-analytics", range],
        queryFn: () => fetchFn({ data: { days: range } }),
    });
    // Build pivoted series: one row per date, one column per signal kind for the
    // selected metric.
    const chartData = useMemo(() => {
        if (!data)
            return [];
        const dateMap = new Map<string, Record<string, number | string>>();
        // Seed every date in the range so the line chart is continuous.
        const today = new Date();
        for (let i = range - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setUTCDate(today.getUTCDate() - i);
            const key = d.toISOString().slice(0, 10);
            dateMap.set(key, { date: key.slice(5) });
        }
        for (const b of data.buckets) {
            const row = dateMap.get(b.date) ?? { date: b.date.slice(5) };
            row[b.signal] = (row[b.signal] as number | undefined) ?? 0;
            row[b.signal] = (row[b.signal] as number) + b[metric];
            dateMap.set(b.date, row);
        }
        return Array.from(dateMap.values());
    }, [data, metric, range]);
    const totalsRows = useMemo(() => {
        if (!data)
            return [];
        return Object.entries(data.totals)
            .map(([signal, t]) => ({ signal, ...t }))
            .sort((a, b) => b.impressions - a.impressions);
    }, [data]);
    const totalsAll = useMemo(() => {
        return totalsRows.reduce((acc, r) => ({
            impressions: acc.impressions + r.impressions,
            clicks: acc.clicks + r.clicks,
            up: acc.up + r.up,
            down: acc.down + r.down,
        }), { impressions: 0, clicks: 0, up: 0, down: 0 });
    }, [totalsRows]);
    return (<div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Trust signals
          </p>
          <h1 className="font-display text-3xl font-bold leading-tight flex items-center gap-2">
            <BarChart3 className="h-7 w-7"/> Pick analytics
          </h1>
          <p className="text-sm text-muted-foreground">
            Impressions, clicks, and feedback per "Why this pick" signal kind.
          </p>
        </div>
        <div className="inline-flex rounded-full border border-border bg-card p-1 text-xs">
          {([7, 30, 90] as Range[]).map((r) => (<button key={r} onClick={() => setRange(r)} className={`rounded-full px-3 py-1.5 font-semibold transition ${range === r
                ? "bg-gradient-vibe text-primary-foreground shadow-pop"
                : "text-muted-foreground hover:text-foreground"}`}>
              Last {r} days
            </button>))}
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {METRICS.map((m) => {
            const Icon = m.icon;
            const value = totalsAll[m.key];
            const active = metric === m.key;
            return (<button key={m.key} onClick={() => setMetric(m.key)} className={`group relative overflow-hidden rounded-2xl border p-5 text-left shadow-card transition ${active
                    ? "border-primary bg-gradient-to-br from-primary/15 to-primary/5"
                    : "border-border bg-card hover:border-primary/40"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    {m.label}
                  </div>
                  <div className="mt-2 font-display text-3xl font-bold">
                    {isLoading ? "—" : value.toLocaleString()}
                  </div>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: `${m.color}22`, color: m.color }}>
                  <Icon className="h-5 w-5"/>
                </div>
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                {active ? "Showing in chart" : "Click to chart"}
              </div>
            </button>);
        })}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold">
            {METRICS.find((m) => m.key === metric)?.label} per signal — daily
          </h2>
          <span className="text-xs text-muted-foreground">
            {data ? `${data.rowCount.toLocaleString()} events` : "Loading…"}
          </span>
        </div>
        <div className="h-80 w-full">
          {error ? (<div className="grid h-full place-items-center text-sm text-destructive">
              Failed to load analytics.
            </div>) : isLoading ? (<div className="grid h-full place-items-center text-sm text-muted-foreground">
              Loading…
            </div>) : !data || data.signals.length === 0 ? (<div className="grid h-full place-items-center text-sm text-muted-foreground">
              No pick events recorded in this range yet.
            </div>) : (<ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border"/>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))"/>
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false}/>
                <Tooltip contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 12,
                fontSize: 12,
            }}/>
                <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle"/>
                {data.signals.map((sig, i) => (<Line key={sig} type="monotone" dataKey={sig} stroke={SIGNAL_PALETTE[i % SIGNAL_PALETTE.length]} strokeWidth={2} dot={false} connectNulls/>))}
              </LineChart>
            </ResponsiveContainer>)}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Totals by signal</h2>
          <span className="text-xs text-muted-foreground">Last {range} days</span>
        </div>
        <div className="h-80 w-full">
          {totalsRows.length === 0 ? (<div className="grid h-full place-items-center text-sm text-muted-foreground">
              {isLoading ? "Loading…" : "No data."}
            </div>) : (<ResponsiveContainer width="100%" height="100%">
              <BarChart data={totalsRows} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border"/>
                <XAxis dataKey="signal" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" interval={0} angle={-15} dy={8} height={50}/>
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false}/>
                <Tooltip contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 12,
                fontSize: 12,
            }}/>
                <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle"/>
                {METRICS.map((m) => (<Bar key={m.key} dataKey={m.key} name={m.label} fill={m.color} radius={[6, 6, 0, 0]}/>))}
              </BarChart>
            </ResponsiveContainer>)}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <h2 className="mb-3 font-display text-lg font-bold">Per-signal breakdown</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-2 pr-3">Signal</th>
                <th className="py-2 pr-3 text-right">Impressions</th>
                <th className="py-2 pr-3 text-right">Clicks</th>
                <th className="py-2 pr-3 text-right">CTR</th>
                <th className="py-2 pr-3 text-right">Upvotes</th>
                <th className="py-2 pr-3 text-right">Downvotes</th>
                <th className="py-2 text-right">Net</th>
              </tr>
            </thead>
            <tbody>
              {totalsRows.map((r) => {
            const ctr = r.impressions ? (r.clicks / r.impressions) * 100 : 0;
            const net = r.up - r.down;
            return (<tr key={r.signal} className="border-b border-border/60">
                    <td className="py-2 pr-3 font-semibold">{r.signal}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">
                      {r.impressions.toLocaleString()}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">
                      {r.clicks.toLocaleString()}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">{ctr.toFixed(1)}%</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{r.up.toLocaleString()}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{r.down.toLocaleString()}</td>
                    <td className={`py-2 text-right tabular-nums font-semibold ${net > 0 ? "text-emerald-600" : net < 0 ? "text-destructive" : ""}`}>
                      {net > 0 ? `+${net}` : net}
                    </td>
                  </tr>);
        })}
              {totalsRows.length === 0 && (<tr>
                  <td colSpan={7} className="py-6 text-center text-muted-foreground">
                    {isLoading ? "Loading…" : "No pick events recorded yet."}
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </section>
    </div>);
}
