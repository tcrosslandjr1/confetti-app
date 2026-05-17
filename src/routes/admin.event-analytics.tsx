import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, MousePointerClick, AlertTriangle, Timer, Eye, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/admin/event-analytics")({
  head: () => ({
    meta: [
      { title: "Event analytics — Confetti admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: EventAnalyticsPage,
});

type Row = {
  id: string;
  session_id: string;
  user_id: string | null;
  event_type: string;
  event_name: string;
  path: string;
  value: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

const WINDOWS = [
  { id: "1h", label: "1h", hours: 1 },
  { id: "24h", label: "24h", hours: 24 },
  { id: "7d", label: "7d", hours: 24 * 7 },
  { id: "30d", label: "30d", hours: 24 * 30 },
];

function EventAnalyticsPage() {
  const [windowId, setWindowId] = useState("24h");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const hours = WINDOWS.find((w) => w.id === windowId)?.hours ?? 24;

  async function load() {
    setLoading(true);
    setErr(null);
    const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
    const { data, error } = await supabase
      .from("analytics_events")
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error) setErr(error.message);
    setRows((data ?? []) as Row[]);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowId]);

  const stats = useMemo(() => computeStats(rows), [rows]);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Event analytics</h1>
          <p className="text-sm text-muted-foreground">
            CTA clicks, scroll depth, time-to-interaction, and errors across the app.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-full border border-border bg-card p-0.5">
            {WINDOWS.map((w) => (
              <button
                key={w.id}
                onClick={() => setWindowId(w.id)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  windowId === w.id ? "bg-ink text-cream" : "text-muted-foreground hover:text-ink"
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => void load()}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-xs font-semibold hover:border-ink"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </header>

      {err && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {err}
        </div>
      )}

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi icon={Eye} label="Pageviews" value={stats.pageviews} />
        <Kpi icon={MousePointerClick} label="CTA clicks" value={stats.ctaClicks} />
        <Kpi
          icon={Timer}
          label="Median time-to-interaction"
          value={stats.medianTti != null ? `${stats.medianTti} ms` : "—"}
        />
        <Kpi icon={AlertTriangle} label="Errors" value={stats.errors} tone={stats.errors > 0 ? "warn" : "ok"} />
      </div>

      {/* Per-path table */}
      <Section title="By path" icon={BarChart3}>
        <Table
          headers={["Path", "Views", "CTA clicks", "CTR", "Median TTI", "Errors"]}
          rows={stats.byPath.map((p) => [
            p.path,
            String(p.views),
            String(p.ctaClicks),
            p.views > 0 ? `${Math.round((p.ctaClicks / p.views) * 100)}%` : "—",
            p.medianTti != null ? `${p.medianTti} ms` : "—",
            String(p.errors),
          ])}
        />
      </Section>

      {/* Top CTAs */}
      <Section title="Top CTAs" icon={MousePointerClick}>
        <Table
          headers={["CTA name", "Path", "Clicks"]}
          rows={stats.topCtas.map((c) => [c.name, c.path, String(c.count)])}
        />
      </Section>

      {/* Scroll depth */}
      <Section title="Scroll depth (% of sessions reaching milestone)" icon={BarChart3}>
        <Table
          headers={["Path", "≥25%", "≥50%", "≥75%", "100%"]}
          rows={stats.scrollByPath.map((s) => [
            s.path,
            pct(s.p25, s.sessions),
            pct(s.p50, s.sessions),
            pct(s.p75, s.sessions),
            pct(s.p100, s.sessions),
          ])}
        />
      </Section>

      {/* Recent errors */}
      <Section title="Recent errors" icon={AlertTriangle}>
        {stats.recentErrors.length === 0 ? (
          <p className="text-sm text-muted-foreground">No errors in window.</p>
        ) : (
          <ul className="space-y-2">
            {stats.recentErrors.slice(0, 20).map((e) => (
              <li key={e.id} className="rounded-lg border border-border bg-card p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold">{e.event_name}</span>
                  <span className="text-muted-foreground">{new Date(e.created_at).toLocaleString()}</span>
                </div>
                <div className="mt-1 text-muted-foreground">{e.path}</div>
                {e.metadata && (
                  <pre className="mt-1 overflow-x-auto rounded bg-muted/40 p-2 text-[11px]">
                    {JSON.stringify(e.metadata, null, 2)}
                  </pre>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function pct(n: number, total: number) {
  if (total === 0) return "—";
  return `${Math.round((n / total) * 100)}%`;
}

function Kpi({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof BarChart3;
  label: string;
  value: number | string;
  tone?: "warn" | "ok";
}) {
  return (
    <div
      className={`rounded-xl border bg-card p-4 ${
        tone === "warn" ? "border-amber-400/60" : "border-border"
      }`}
    >
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
        <Icon className="h-4 w-4" />
      </div>
      <div className="mt-2 font-display text-2xl font-extrabold">{value}</div>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof BarChart3;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <header className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h2 className="font-display text-sm font-bold uppercase tracking-wider">{title}</h2>
      </header>
      {children}
    </section>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No data in window.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
            {headers.map((h) => (
              <th key={h} className="py-2 pr-3 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border/40 last:border-0">
              {r.map((c, j) => (
                <td key={j} className="py-2 pr-3 font-mono text-xs">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid];
}

function computeStats(rows: Row[]) {
  const pageviews = rows.filter((r) => r.event_type === "pageview").length;
  const ctaClicks = rows.filter((r) => r.event_type === "cta_click").length;
  const errors = rows.filter((r) => r.event_type === "error").length;
  const tti = rows
    .filter((r) => r.event_type === "time_to_interaction" && r.value != null)
    .map((r) => Number(r.value));
  const medianTti = median(tti);

  // by path
  const pathMap = new Map<
    string,
    { views: number; ctaClicks: number; tti: number[]; errors: number }
  >();
  for (const r of rows) {
    const p = r.path;
    if (!pathMap.has(p)) pathMap.set(p, { views: 0, ctaClicks: 0, tti: [], errors: 0 });
    const s = pathMap.get(p)!;
    if (r.event_type === "pageview") s.views++;
    else if (r.event_type === "cta_click") s.ctaClicks++;
    else if (r.event_type === "time_to_interaction" && r.value != null) s.tti.push(Number(r.value));
    else if (r.event_type === "error") s.errors++;
  }
  const byPath = Array.from(pathMap.entries())
    .map(([path, s]) => ({
      path,
      views: s.views,
      ctaClicks: s.ctaClicks,
      medianTti: median(s.tti),
      errors: s.errors,
    }))
    .sort((a, b) => b.views - a.views);

  // top CTAs (name + path -> count)
  const ctaMap = new Map<string, { name: string; path: string; count: number }>();
  for (const r of rows) {
    if (r.event_type !== "cta_click") continue;
    const key = `${r.event_name}::${r.path}`;
    if (!ctaMap.has(key)) ctaMap.set(key, { name: r.event_name, path: r.path, count: 0 });
    ctaMap.get(key)!.count++;
  }
  const topCtas = Array.from(ctaMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  // scroll depth by path — count distinct sessions reaching each milestone
  const scrollMap = new Map<
    string,
    { sessions: Set<string>; p25: Set<string>; p50: Set<string>; p75: Set<string>; p100: Set<string> }
  >();
  for (const r of rows) {
    if (!scrollMap.has(r.path))
      scrollMap.set(r.path, {
        sessions: new Set(),
        p25: new Set(),
        p50: new Set(),
        p75: new Set(),
        p100: new Set(),
      });
    const s = scrollMap.get(r.path)!;
    s.sessions.add(r.session_id);
    if (r.event_type === "scroll_depth" && r.value != null) {
      const v = Number(r.value);
      if (v >= 25) s.p25.add(r.session_id);
      if (v >= 50) s.p50.add(r.session_id);
      if (v >= 75) s.p75.add(r.session_id);
      if (v >= 100) s.p100.add(r.session_id);
    }
  }
  const scrollByPath = Array.from(scrollMap.entries())
    .map(([path, s]) => ({
      path,
      sessions: s.sessions.size,
      p25: s.p25.size,
      p50: s.p50.size,
      p75: s.p75.size,
      p100: s.p100.size,
    }))
    .filter((s) => s.sessions > 0)
    .sort((a, b) => b.sessions - a.sessions);

  const recentErrors = rows.filter((r) => r.event_type === "error");

  return {
    pageviews,
    ctaClicks,
    errors,
    medianTti,
    byPath,
    topCtas,
    scrollByPath,
    recentErrors,
  };
}
