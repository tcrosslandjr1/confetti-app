import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bot,
  CalendarCheck,
  ClipboardCheck,
  Download,
  FileText,
  RefreshCw,
  Sparkles,
  Store,
  TrendingUp,
  UserPlus,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/brief")({
  head: () => ({
    meta: [
      { title: "Daily Brief — Confetti Admin" },
      {
        name: "description",
        content:
          "24-hour activity snapshot: signups, bookings, agent runs, errors, and pending queue across the Confetti marketplace.",
      },
    ],
  }),
  component: AdminBriefPage,
});

type Range = "24h" | "7d" | "30d";

async function safeCount(
  table: string,
  filter?: (q: any) => any,
): Promise<number> {
  try {
    let q = supabase.from(table as any).select("id", { count: "exact", head: true });
    if (filter) q = filter(q);
    const { count } = await q;
    return count ?? 0;
  } catch {
    return 0;
  }
}

function sinceIso(range: Range): string {
  const d = new Date();
  if (range === "24h") d.setHours(d.getHours() - 24);
  else if (range === "7d") d.setDate(d.getDate() - 7);
  else d.setDate(d.getDate() - 30);
  return d.toISOString();
}

function useBrief(range: Range) {
  return useQuery({
    queryKey: ["admin", "brief", range],
    queryFn: async () => {
      const since = sinceIso(range);
      const [
        signups,
        bookings,
        newVenues,
        moderation,
        claims,
        advertisers,
        agentRuns,
        agentErrors,
      ] = await Promise.all([
        safeCount("profiles", (q) => q.gte("created_at", since)),
        safeCount("bookings", (q) => q.gte("created_at", since)),
        safeCount("venues", (q) => q.gte("created_at", since)),
        safeCount("venue_reports", (q) => q.eq("status", "open")),
        safeCount("venue_claims", (q) => q.eq("status", "pending")),
        safeCount("advertisers", (q) => q.eq("status", "pending_review")),
        // approximation: pull agent counters
        (async () => {
          try {
            const { data } = await supabase
              .from("agent_registry" as any)
              .select("tasks_completed");
            return (
              (data ?? []).reduce(
                (s: number, r: any) => s + (r.tasks_completed ?? 0),
                0,
              ) || 0
            );
          } catch {
            return 0;
          }
        })(),
        (async () => {
          try {
            const { data } = await supabase
              .from("agent_registry" as any)
              .select("error_count");
            return (
              (data ?? []).reduce(
                (s: number, r: any) => s + (r.error_count ?? 0),
                0,
              ) || 0
            );
          } catch {
            return 0;
          }
        })(),
      ]);
      return {
        signups,
        bookings,
        newVenues,
        moderation,
        claims,
        advertisers,
        agentRuns,
        agentErrors,
        generatedAt: new Date().toISOString(),
      };
    },
    staleTime: 60_000,
  });
}

function useTopVenues(range: Range) {
  return useQuery({
    queryKey: ["admin", "brief", "top-venues", range],
    queryFn: async () => {
      const since = sinceIso(range);
      try {
        const { data } = await supabase
          .from("bookings" as any)
          .select("venue_name, venue_id")
          .gte("created_at", since)
          .limit(500);
        const counts = new Map<string, number>();
        for (const r of (data ?? []) as any[]) {
          const k = r.venue_name ?? r.venue_id ?? "—";
          counts.set(k, (counts.get(k) ?? 0) + 1);
        }
        return [...counts.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count]) => ({ name, count }));
      } catch {
        return [];
      }
    },
    staleTime: 60_000,
  });
}

function useTrend(range: Range) {
  return useQuery({
    queryKey: ["admin", "brief", "trend", range],
    queryFn: async () => {
      const now = new Date();
      const hourly = range === "24h";
      const bucketCount = hourly ? 24 : range === "7d" ? 7 : 30;
      const bucketMs = hourly ? 3_600_000 : 86_400_000;
      // Align start to a bucket boundary (top of hour / start of day).
      const aligned = new Date(now);
      if (hourly) aligned.setMinutes(0, 0, 0);
      else aligned.setHours(0, 0, 0, 0);
      const startTs = aligned.getTime() - (bucketCount - 1) * bucketMs;

      const buckets = Array.from({ length: bucketCount }, (_, i) => {
        const ts = startTs + i * bucketMs;
        const d = new Date(ts);
        const label = hourly
          ? d.toLocaleTimeString([], { hour: "numeric" })
          : d.toLocaleDateString([], { month: "short", day: "numeric" });
        return { ts, label, bookings: 0, agentRuns: 0 };
      });

      function place(key: "bookings" | "agentRuns", iso: string | null | undefined) {
        if (!iso) return;
        const idx = Math.floor((new Date(iso).getTime() - startTs) / bucketMs);
        if (idx >= 0 && idx < bucketCount) buckets[idx][key] += 1;
      }

      const sinceIsoStr = new Date(startTs).toISOString();
      const [bookingsRes, tasksRes] = await Promise.all([
        supabase
          .from("bookings" as any)
          .select("created_at")
          .gte("created_at", sinceIsoStr)
          .limit(5000),
        supabase
          .from("agent_tasks" as any)
          .select("completed_at")
          .gte("completed_at", sinceIsoStr)
          .not("completed_at", "is", null)
          .limit(5000),
      ]);

      for (const r of (bookingsRes.data ?? []) as any[]) place("bookings", r.created_at);
      for (const r of (tasksRes.data ?? []) as any[]) place("agentRuns", r.completed_at);

      return buckets;
    },
    staleTime: 60_000,
  });
}



function AdminBriefPage() {
  const [range, setRange] = useState<Range>("24h");
  const { data, isLoading, refetch, isFetching } = useBrief(range);
  const { data: topVenues } = useTopVenues(range);
  const { data: trend, isLoading: trendLoading } = useTrend(range);

  const trendTotals = useMemo(() => {
    const t = trend ?? [];
    return {
      bookings: t.reduce((s, b) => s + b.bookings, 0),
      agentRuns: t.reduce((s, b) => s + b.agentRuns, 0),
      peakBookings: t.reduce((m, b) => Math.max(m, b.bookings), 0),
      peakAgent: t.reduce((m, b) => Math.max(m, b.agentRuns), 0),
    };
  }, [trend]);

  const stats = useMemo(
    () => [
      {
        label: "New signups",
        value: data?.signups ?? 0,
        icon: UserPlus,
        tone: "from-pink/25 to-pink/5",
        to: "/admin/users",
      },
      {
        label: "Bookings",
        value: data?.bookings ?? 0,
        icon: CalendarCheck,
        tone: "from-coral/30 to-coral/5",
        to: "/admin/bookings",
      },
      {
        label: "New venues",
        value: data?.newVenues ?? 0,
        icon: Store,
        tone: "from-emerald-400/25 to-emerald-100/5",
        to: "/admin/venues",
      },
      {
        label: "Open moderation",
        value: data?.moderation ?? 0,
        icon: AlertTriangle,
        tone: "from-amber-400/30 to-amber-100/5",
        to: "/admin/moderation",
      },
      {
        label: "Pending claims",
        value: data?.claims ?? 0,
        icon: ClipboardCheck,
        tone: "from-purple/25 to-purple/5",
        to: "/admin/business-claims",
      },
      {
        label: "Pending advertisers",
        value: data?.advertisers ?? 0,
        icon: Sparkles,
        tone: "from-gold/25 to-gold/5",
        to: "/admin/advertisers",
      },
      {
        label: "Agent runs",
        value: data?.agentRuns ?? 0,
        icon: Bot,
        tone: "from-teal/25 to-teal/5",
        to: "/admin/agents",
      },
      {
        label: "Agent errors",
        value: data?.agentErrors ?? 0,
        icon: Zap,
        tone: "from-destructive/30 to-destructive/5",
        to: "/admin/logs",
      },
    ],
    [data],
  );

  const exportCsv = () => {
    if (!data) return;
    const rows: Array<[string, number | string]> = [
      ["range", range],
      ["generated_at", data.generatedAt],
      ["signups", data.signups],
      ["bookings", data.bookings],
      ["new_venues", data.newVenues],
      ["open_moderation", data.moderation],
      ["pending_claims", data.claims],
      ["pending_advertisers", data.advertisers],
      ["agent_runs", data.agentRuns],
      ["agent_errors", data.agentErrors],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `confetti-brief-${range}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded");
  };

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-3xl border-2 border-ink bg-gradient-to-br from-coral via-orange-400 to-gold p-6 shadow-brut sm:p-8">
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-ink/70">
              Daily Brief
            </p>
            <h1 className="mt-1 font-display text-4xl font-bold leading-tight text-ink sm:text-5xl">
              {range === "24h"
                ? "Last 24 hours"
                : range === "7d"
                  ? "Last 7 days"
                  : "Last 30 days"}
            </h1>
            <p className="mt-2 max-w-lg text-sm text-ink/80">
              Marketplace pulse — signups, bookings, agent activity, and queue health.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex overflow-hidden rounded-full border-2 border-ink bg-cream shadow-brut">
              {(["24h", "7d", "30d"] as Range[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRange(r)}
                  className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                    range === r ? "bg-ink text-cream" : "text-ink hover:bg-cream/70"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-cream px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-ink shadow-brut hover:-translate-y-0.5 disabled:opacity-60"
            >
              <RefreshCw className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-ink px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-cream shadow-brut hover:-translate-y-0.5"
            >
              <Download className="h-3 w-3" /> CSV
            </button>
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, idx) => (
          <Link
            key={s.label}
            to={s.to as any}
            className={`group relative overflow-hidden rounded-2xl border-2 border-ink bg-gradient-to-br ${s.tone} p-4 shadow-brut transition hover:-translate-y-1 hover:-rotate-1`}
          >
            <div className="flex items-start justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-xl border-2 border-ink bg-cream shadow-brut">
                <s.icon className="h-4 w-4 text-ink" />
              </div>
              <span className="font-mono text-[9px] font-bold text-ink/30">
                0{idx + 1}
              </span>
            </div>
            <div className="mt-3 font-display text-3xl font-bold leading-none tabular-nums text-ink">
              {isLoading ? "—" : s.value.toLocaleString()}
            </div>
            <div className="mt-2 text-[11px] font-bold uppercase tracking-wider text-ink/85">
              {s.label}
            </div>
          </Link>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Top venues booked</h2>
            <Link to="/admin/bookings" className="text-xs font-semibold text-coral hover:underline">
              All bookings →
            </Link>
          </div>
          {(!topVenues || topVenues.length === 0) ? (
            <p className="text-sm text-muted-foreground">No bookings in this window.</p>
          ) : (
            <ol className="space-y-2">
              {topVenues.map((v, i) => (
                <li
                  key={v.name}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-2 truncate">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-coral/15 text-xs font-bold text-coral">
                      {i + 1}
                    </span>
                    <span className="truncate font-medium">{v.name}</span>
                  </span>
                  <span className="font-mono text-xs font-bold text-ink/70">
                    {v.count} {v.count === 1 ? "booking" : "bookings"}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <aside className="space-y-3">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h2 className="mb-3 font-display text-lg font-bold">Reports</h2>
            <div className="grid gap-2">
              {[
                { to: "/admin/analytics", label: "Full analytics", icon: FileText },
                { to: "/admin/event-analytics", label: "Event analytics", icon: Activity },
                { to: "/admin/pick-analytics", label: "Pick analytics", icon: Sparkles },
                { to: "/admin/ad-analytics", label: "Ad performance", icon: Sparkles },
                { to: "/admin/audit", label: "Audit log", icon: FileText },
              ].map((l) => (
                <Link
                  key={l.to}
                  to={l.to as any}
                  className="flex items-center gap-2 rounded-xl border border-border bg-background/60 p-2.5 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-ink hover:shadow-brut"
                >
                  <l.icon className="h-4 w-4 text-coral" />
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-5 text-xs text-muted-foreground">
            Generated{" "}
            {data?.generatedAt
              ? new Date(data.generatedAt).toLocaleString()
              : "—"}
          </div>
        </aside>
      </section>
    </div>
  );
}
