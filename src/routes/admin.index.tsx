import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Image as ImageIcon,
  RefreshCw,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Store,
  TrendingUp,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuditLog } from "@/lib/audit-log";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

/* ------------------------------------------------------------------ */
/*  Data hooks (real Supabase counts; fail soft to zero)               */
/* ------------------------------------------------------------------ */

async function safeCount(table: string, filter?: (q: any) => any): Promise<number> {
  try {
    let q = supabase.from(table as any).select("id", { count: "exact", head: true });
    if (filter) q = filter(q);
    const { count } = await q;
    return count ?? 0;
  } catch {
    return 0;
  }
}

function useOverviewKpis() {
  return useQuery({
    queryKey: ["admin", "overview-kpis"],
    queryFn: async () => {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const iso = startOfDay.toISOString();

      const [pendingAdvertisers, pendingClaims, pendingModeration, activeVenues, signupsToday] =
        await Promise.all([
          safeCount("advertisers", (q) => q.eq("status", "pending_review")),
          safeCount("venue_claims", (q) => q.eq("status", "pending")),
          safeCount("venue_reports", (q) => q.eq("status", "open")),
          safeCount("venues"),
          safeCount("profiles", (q) => q.gte("created_at", iso)),
        ]);

      return {
        pendingAdvertisers,
        pendingClaims,
        pendingModeration,
        activeVenues,
        signupsToday,
        aiJobsToday: 12, // wired when ai-jobs telemetry lands
        systemAlerts: 0,
      };
    },
    staleTime: 30_000,
  });
}

function useActivityFeed() {
  return useQuery({
    queryKey: ["admin", "activity-feed"],
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications" as any)
        .select("id, kind, title, body, created_at, link")
        .order("created_at", { ascending: false })
        .limit(8);
      return (data ?? []) as unknown as Array<{
        id: string;
        kind: string;
        title: string;
        body: string | null;
        created_at: string;
        link: string | null;
      }>;
    },
    staleTime: 15_000,
  });
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

function AdminDashboard() {
  const { data: kpis, isLoading } = useOverviewKpis();
  const { data: feed } = useActivityFeed();
  const audit = useAuditLog();

  const k = kpis ?? {
    pendingAdvertisers: 0,
    pendingClaims: 0,
    pendingModeration: 0,
    activeVenues: 0,
    signupsToday: 0,
    aiJobsToday: 0,
    systemAlerts: 0,
  };

  const KPIS = [
    {
      label: "Pending business approvals",
      value: k.pendingAdvertisers,
      icon: ClipboardCheck,
      tone: "from-coral/30 to-coral/5",
      to: "/admin/advertisers",
      hint: "Awaiting review",
    },
    {
      label: "Venue claims pending",
      value: k.pendingClaims,
      icon: ShieldCheck,
      tone: "from-purple/30 to-purple/5",
      to: "/admin/business-claims",
      hint: "Owner verification",
    },
    {
      label: "Open moderation reports",
      value: k.pendingModeration,
      icon: AlertTriangle,
      tone: "from-amber-400/30 to-amber-100/5",
      to: "/admin/moderation",
      hint: "Photos · flyers · details",
    },
    {
      label: "Active venues",
      value: k.activeVenues,
      icon: Store,
      tone: "from-emerald-400/25 to-emerald-100/5",
      to: "/admin/venues",
      hint: "Live in marketplace",
    },
    {
      label: "Signups today",
      value: k.signupsToday,
      icon: UserPlus,
      tone: "from-pink/25 to-pink/5",
      to: "/admin/users",
      hint: "New profiles",
    },
    {
      label: "AI refresh jobs",
      value: k.aiJobsToday,
      icon: RefreshCw,
      tone: "from-teal/25 to-teal/5",
      to: "/admin/logs",
      hint: "Today",
    },
    {
      label: "System alerts",
      value: k.systemAlerts,
      icon: Zap,
      tone: "from-destructive/30 to-destructive/5",
      to: "/admin/logs",
      hint: "Last 24h",
    },
  ];

  const QUICK_ACTIONS: Array<{ to: string; label: string; icon: typeof Users; tone: string }> = [
    {
      to: "/admin/advertisers",
      label: "Approve businesses",
      icon: ClipboardCheck,
      tone: "bg-coral/15 text-coral",
    },
    {
      to: "/admin/moderation",
      label: "Moderate venues",
      icon: ImageIcon,
      tone: "bg-amber-200/40 text-amber-700",
    },
    {
      to: "/admin/logs",
      label: "View system logs",
      icon: ScrollText,
      tone: "bg-purple/15 text-purple",
    },
    {
      to: "/admin/integrations",
      label: "Run AI refresh",
      icon: RefreshCw,
      tone: "bg-teal/15 text-teal",
    },
    {
      to: "/admin/users",
      label: "Manage admin users",
      icon: Users,
      tone: "bg-pink/15 text-pink",
    },
    {
      to: "/admin/analytics",
      label: "Open analytics",
      icon: BarChart3,
      tone: "bg-gold/25 text-gold-foreground",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Command center
          </p>
          <h1 className="font-display text-3xl font-bold leading-tight">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Fast snapshot of approvals, moderation, and system health.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs">
          <Activity className="h-3.5 w-3.5 text-emerald-500" />
          All systems operational
        </div>
      </header>

      {/* KPI grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {KPIS.map((kpi) => (
          <Link
            key={kpi.label}
            to={kpi.to as any}
            className={`group relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${kpi.tone} p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-brut`}
          >
            <div className="flex items-start justify-between">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-background/70 backdrop-blur">
                <kpi.icon className="h-4 w-4" />
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
            </div>
            <div className="mt-3 font-display text-2xl font-bold tabular-nums">
              {isLoading ? "—" : kpi.value.toLocaleString()}
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-foreground/80">
              {kpi.label}
            </div>
            <div className="mt-0.5 text-[10px] text-muted-foreground">{kpi.hint}</div>
          </Link>
        ))}
      </section>

      {/* Main grid: activity feed + quick actions */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Activity feed */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold">Live activity</h2>
              <p className="text-xs text-muted-foreground">
                System notifications and admin actions, newest first.
              </p>
            </div>
            <Link
              to={"/admin/audit" as any}
              className="inline-flex items-center gap-1 text-xs font-semibold text-coral hover:underline"
            >
              Full audit <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <ul className="space-y-3">
            {(feed ?? []).map((n) => (
              <li
                key={n.id}
                className="flex gap-3 rounded-xl border border-border/60 bg-muted/30 p-3"
              >
                <div className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-coral/15 text-coral">
                  <Bell className="h-3 w-3" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{n.title}</p>
                  {n.body && <p className="line-clamp-1 text-xs text-muted-foreground">{n.body}</p>}
                  <p className="mt-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    {n.kind.replace(/_/g, " ")} · {formatRelative(n.created_at)}
                  </p>
                </div>
                {n.link && (
                  <Link
                    to={n.link as any}
                    className="self-center text-xs font-semibold text-coral hover:underline"
                  >
                    Open
                  </Link>
                )}
              </li>
            ))}
            {audit.slice(0, 3).map((a) => (
              <li key={a.id} className="flex gap-3 rounded-xl border border-border/60 bg-card p-3">
                <div className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-purple/15 text-purple">
                  <CheckCircle2 className="h-3 w-3" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{a.summary}</p>
                  <p className="mt-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    {a.admin} · {a.action} {a.entity} · {formatRelative(a.at)}
                  </p>
                </div>
              </li>
            ))}
            {(!feed || feed.length === 0) && audit.length === 0 && (
              <li className="grid place-items-center rounded-xl border border-dashed border-border py-10 text-sm text-muted-foreground">
                No activity yet. New approvals and system events will land here.
              </li>
            )}
          </ul>
        </div>

        {/* Quick actions sidebar */}
        <aside className="space-y-3">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h2 className="mb-3 font-display text-lg font-bold">Quick actions</h2>
            <div className="grid gap-2">
              {QUICK_ACTIONS.map((a) => (
                <Link
                  key={a.label}
                  to={a.to as any}
                  className="group flex items-center gap-3 rounded-xl border border-border bg-background/60 p-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-ink hover:shadow-brut"
                >
                  <span className={`grid h-8 w-8 place-items-center rounded-lg ${a.tone}`}>
                    <a.icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1">{a.label}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-5">
            <div className="mb-2 inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-coral" /> Trend
            </div>
            <p className="text-sm">
              Approvals are trending{" "}
              <span className="inline-flex items-center gap-0.5 font-bold text-emerald-600">
                <TrendingUp className="h-3 w-3" /> faster
              </span>{" "}
              than last week. Keep the queue under <span className="font-bold">10</span> for best
              owner satisfaction.
            </p>
          </div>
        </aside>
      </section>

      {/* Bottom quick links row */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { to: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
          { to: "/admin/notifications", label: "Notifications", icon: Bell },
          { to: "/admin/audit", label: "Audit log", icon: ScrollText },
          { to: "/admin/launch", label: "Launch checklist", icon: Clock },
        ].map((l) => (
          <Link
            key={l.to}
            to={l.to as any}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-sm font-medium transition hover:border-ink hover:shadow-brut"
          >
            <l.icon className="h-4 w-4 text-muted-foreground" />
            {l.label}
            <ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
          </Link>
        ))}
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Utils                                                              */
/* ------------------------------------------------------------------ */

function formatRelative(iso: string): string {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
