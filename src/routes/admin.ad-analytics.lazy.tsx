import { createLazyFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3, CalendarIcon, Eye, Filter, MousePointerClick, Percent } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export const Route = createLazyFileRoute("/admin/ad-analytics")({
  component: AdAnalyticsPage,
});

type AdEvent = {
    id: string;
    kind: "impression" | "click";
    surface: string | null;
    brand: string | null;
    occasion: string | null;
    created_at: string;
};

type Range = "7d" | "30d" | "90d" | "custom";

const RANGE_DAYS: Record<Exclude<Range, "custom">, number> = { "7d": 7, "30d": 30, "90d": 90 };

const ALL = "__all__";

function startOfDay(d: Date) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

function endOfDay(d: Date) {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
}

function dayKey(iso: string) {
    return iso.slice(0, 10);
}

function fmtPct(n: number) {
    return `${(n * 100).toFixed(2)}%`;
}

function AdAnalyticsPage() {
    const [range, setRange] = useState<Range>("30d");
    const [from, setFrom] = useState<Date | undefined>();
    const [to, setTo] = useState<Date | undefined>();
    const [brand, setBrand] = useState<string>(ALL);
    const [occasion, setOccasion] = useState<string>(ALL);
    const [surface, setSurface] = useState<string>(ALL);
    const [events, setEvents] = useState<AdEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const window = useMemo(() => {
        if (range === "custom" && from && to) {
            return { from: startOfDay(from), to: endOfDay(to) };
        }
        const days = RANGE_DAYS[(range === "custom" ? "30d" : range) as Exclude<Range, "custom">];
        const end = endOfDay(new Date());
        const start = new Date(end);
        start.setDate(end.getDate() - (days - 1));
        return { from: startOfDay(start), to: end };
    }, [range, from, to]);
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setErr(null);
        (async () => {
            const { data, error } = await supabase
                .from("ad_events")
                .select("id, kind, surface, brand, occasion, created_at")
                .gte("created_at", window.from.toISOString())
                .lte("created_at", window.to.toISOString())
                .order("created_at", { ascending: true })
                .limit(10000);
            if (cancelled)
                return;
            if (error)
                setErr(error.message);
            else
                setEvents((data ?? []) as AdEvent[]);
            setLoading(false);
        })();
        return () => {
            cancelled = true;
        };
    }, [window.from, window.to]);
    const filtered = useMemo(() => events.filter((e) => (brand === ALL || (e.brand ?? "") === brand) &&
        (occasion === ALL || (e.occasion ?? "") === occasion) &&
        (surface === ALL || (e.surface ?? "") === surface)), [events, brand, occasion, surface]);
    const brands = useMemo(() => Array.from(new Set(events.map((e) => e.brand).filter(Boolean) as string[])).sort(), [events]);
    const occasions = useMemo(() => Array.from(new Set(events.map((e) => e.occasion).filter(Boolean) as string[])).sort(), [events]);
    const surfaces = useMemo(() => Array.from(new Set(events.map((e) => e.surface).filter(Boolean) as string[])).sort(), [events]);
    const totals = useMemo(() => {
        let imp = 0, clk = 0;
        for (const e of filtered) {
            if (e.kind === "impression")
                imp++;
            else if (e.kind === "click")
                clk++;
        }
        return { impressions: imp, clicks: clk, ctr: imp ? clk / imp : 0 };
    }, [filtered]);
    const byDay = useMemo(() => {
        const map = new Map<string, {
            date: string;
            impressions: number;
            clicks: number;
        }>();
        // Pre-fill all days for a continuous axis
        const days: string[] = [];
        const cur = new Date(window.from);
        while (cur <= window.to) {
            const k = cur.toISOString().slice(0, 10);
            days.push(k);
            map.set(k, { date: k.slice(5), impressions: 0, clicks: 0 });
            cur.setDate(cur.getDate() + 1);
        }
        for (const e of filtered) {
            const k = dayKey(e.created_at);
            const row = map.get(k);
            if (!row)
                continue;
            if (e.kind === "impression")
                row.impressions++;
            else if (e.kind === "click")
                row.clicks++;
        }
        return days.map((d) => map.get(d)!);
    }, [filtered, window.from, window.to]);
    const groupBy = (key: "brand" | "occasion" | "surface") => {
        const map = new Map<string, {
            name: string;
            impressions: number;
            clicks: number;
            ctr: number;
        }>();
        for (const e of filtered) {
            const name = (e[key] ?? "—") as string;
            const row = map.get(name) ?? { name, impressions: 0, clicks: 0, ctr: 0 };
            if (e.kind === "impression")
                row.impressions++;
            else if (e.kind === "click")
                row.clicks++;
            map.set(name, row);
        }
        return Array.from(map.values())
            .map((r) => ({ ...r, ctr: r.impressions ? r.clicks / r.impressions : 0 }))
            .sort((a, b) => b.impressions + b.clicks - (a.impressions + a.clicks))
            .slice(0, 12);
    };
    const byBrand = useMemo(() => groupBy("brand"), [filtered]);
    const byOccasion = useMemo(() => groupBy("occasion"), [filtered]);
    const bySurface = useMemo(() => groupBy("surface"), [filtered]);
    const tooltipStyle = {
        background: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
        borderRadius: 12,
        fontSize: 12,
    };
    return (<div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Ad performance
          </p>
          <h1 className="font-display text-3xl font-bold leading-tight flex items-center gap-2">
            <BarChart3 className="h-7 w-7"/> Ad analytics
          </h1>
          <p className="text-sm text-muted-foreground">
            Impressions and clicks by brand, occasion, surface, and date range.
          </p>
        </div>
        <div className="inline-flex rounded-full border border-border bg-card p-1 text-xs">
          {(["7d", "30d", "90d", "custom"] as Range[]).map((r) => (<button key={r} onClick={() => setRange(r)} className={`rounded-full px-3 py-1.5 font-semibold transition ${range === r
                ? "bg-foreground text-background shadow-pop"
                : "text-muted-foreground hover:text-foreground"}`}>
              {r === "7d" ? "7d" : r === "30d" ? "30d" : r === "90d" ? "90d" : "Custom"}
            </button>))}
        </div>
      </header>

      <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Filter className="h-4 w-4"/> Filters
        </div>
        <div className="grid gap-3 md:grid-cols-5">
          {range === "custom" && (<>
              <DateField label="From" value={from} onChange={setFrom}/>
              <DateField label="To" value={to} onChange={setTo}/>
            </>)}
          <SelectField label="Brand" value={brand} onChange={setBrand} options={brands}/>
          <SelectField label="Occasion" value={occasion} onChange={setOccasion} options={occasions}/>
          <SelectField label="Surface" value={surface} onChange={setSurface} options={surfaces}/>
        </div>
        {err && <p className="mt-3 text-xs text-destructive">{err}</p>}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat label="Impressions" value={totals.impressions.toLocaleString()} icon={Eye}/>
        <Stat label="Clicks" value={totals.clicks.toLocaleString()} icon={MousePointerClick}/>
        <Stat label="CTR" value={fmtPct(totals.ctr)} icon={Percent}/>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Daily impressions vs clicks</h2>
          <span className="text-xs text-muted-foreground">
            {loading ? "Loading…" : `${filtered.length} events`}
          </span>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={byDay} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border"/>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))"/>
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))"/>
              <Tooltip contentStyle={tooltipStyle}/>
              <Legend wrapperStyle={{ fontSize: 12 }}/>
              <Line type="monotone" dataKey="impressions" name="Impressions" stroke="hsl(var(--primary))" strokeWidth={2} dot={false}/>
              <Line type="monotone" dataKey="clicks" name="Clicks" stroke="oklch(0.78 0.15 85)" strokeWidth={2} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <GroupChart title="By brand" rows={byBrand} tooltipStyle={tooltipStyle}/>
        <GroupChart title="By occasion" rows={byOccasion} tooltipStyle={tooltipStyle}/>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <GroupChart title="By surface" rows={bySurface} tooltipStyle={tooltipStyle}/>
        <BreakdownTable title="Top brand × occasion" events={filtered}/>
      </section>
    </div>);
}

function Stat({ label, value, icon: Icon }: {
    label: string;
    value: string;
    icon: typeof Eye;
}) {
    return (<div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-2 font-display text-3xl font-bold">{value}</div>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-muted">
          <Icon className="h-5 w-5"/>
        </div>
      </div>
    </div>);
}

function SelectField({ label, value, onChange, options, }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: string[];
}) {
    return (<div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm">
        <option value={ALL}>All</option>
        {options.map((o) => (<option key={o} value={o}>
            {o}
          </option>))}
      </select>
    </div>);
}

function DateField({ label, value, onChange, }: {
    label: string;
    value: Date | undefined;
    onChange: (d: Date | undefined) => void;
}) {
    return (<div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("h-9 w-full justify-start text-left font-normal text-sm", !value && "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-4 w-4"/>
            {value ? format(value, "PP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={value} onSelect={onChange} initialFocus className={cn("p-3 pointer-events-auto")}/>
        </PopoverContent>
      </Popover>
    </div>);
}

function GroupChart({ title, rows, tooltipStyle, }: {
    title: string;
    rows: {
        name: string;
        impressions: number;
        clicks: number;
        ctr: number;
    }[];
    tooltipStyle: React.CSSProperties;
}) {
    return (<div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">{title}</h2>
        <span className="text-xs text-muted-foreground">Top {rows.length}</span>
      </div>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border"/>
            <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" interval={0} angle={-20} dy={10} height={60}/>
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))"/>
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number, n: string) => n === "ctr" ? [fmtPct(v), "CTR"] : [v.toLocaleString(), n]}/>
            <Legend wrapperStyle={{ fontSize: 12 }}/>
            <Bar dataKey="impressions" name="Impressions" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]}/>
            <Bar dataKey="clicks" name="Clicks" fill="oklch(0.78 0.15 85)" radius={[6, 6, 0, 0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>);
}

function BreakdownTable({ title, events }: {
    title: string;
    events: AdEvent[];
}) {
    const rows = useMemo(() => {
        const map = new Map<string, {
            brand: string;
            occasion: string;
            impressions: number;
            clicks: number;
        }>();
        for (const e of events) {
            const k = `${e.brand ?? "—"}::${e.occasion ?? "—"}`;
            const row = map.get(k) ?? {
                brand: e.brand ?? "—",
                occasion: e.occasion ?? "—",
                impressions: 0,
                clicks: 0,
            };
            if (e.kind === "impression")
                row.impressions++;
            else if (e.kind === "click")
                row.clicks++;
            map.set(k, row);
        }
        return Array.from(map.values())
            .map((r) => ({ ...r, ctr: r.impressions ? r.clicks / r.impressions : 0 }))
            .sort((a, b) => b.impressions + b.clicks - (a.impressions + a.clicks))
            .slice(0, 15);
    }, [events]);
    return (<div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="border-b border-border px-5 py-3">
        <h2 className="font-display text-lg font-bold">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Brand</th>
              <th className="px-3 py-2 text-left">Occasion</th>
              <th className="px-3 py-2 text-right">Imp.</th>
              <th className="px-3 py-2 text-right">Clicks</th>
              <th className="px-3 py-2 text-right">CTR</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (<tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                  No events in this window.
                </td>
              </tr>)}
            {rows.map((r, i) => (<tr key={i} className="border-t border-border">
                <td className="px-3 py-2 font-semibold">{r.brand}</td>
                <td className="px-3 py-2">{r.occasion}</td>
                <td className="px-3 py-2 text-right">{r.impressions.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{r.clicks.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{fmtPct(r.ctr)}</td>
              </tr>))}
          </tbody>
        </table>
      </div>
    </div>);
}
