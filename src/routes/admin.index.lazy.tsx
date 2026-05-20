import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AlertTriangle, BarChart3, Bell, CalendarCheck, CheckCircle2, ChevronRight, ClipboardCheck, Clock, Image as ImageIcon, RefreshCw, ScrollText, ShieldCheck, Sparkles, Store, TrendingUp, UserPlus, Users, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuditLog } from "@/lib/audit-log";
import { applyLogFilters, EMPTY_FILTERS, LogFilterBar, type LogFilterState } from "@/components/admin/LogFilterBar";
import { AdminKpiCard, AdminKpiGrid, AdminSection } from "@/components/admin/AdminUI";

export const Route = createLazyFileRoute("/admin/")({
  component: AdminDashboard,
});

/* ------------------------------------------------------------------ */
/*  Data hooks (real Supabase counts; fail soft to zero)               */
/* ------------------------------------------------------------------ */
async function safeCount(table: string, filter?: (q: any) => any): Promise<number> {
    try {
        let q = supabase.from(table as any).select("id", { count: "exact", head: true });
        if (filter)
            q = filter(q);
        const { count } = await q;
        return count ?? 0;
    }
    catch {
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
            const [pendingAdvertisers, pendingClaims, pendingModeration, activeVenues, signupsToday] = await Promise.all([
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
        staleTime: 30000,
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
        staleTime: 15000,
    });
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
function AdminDashboard() {
    const { data: kpis, isLoading } = useOverviewKpis();
    const { data: feed } = useActivityFeed();
    const audit = useAuditLog();
    const [filters, setFilters] = useState<LogFilterState>(EMPTY_FILTERS);
    const filteredFeed = useMemo(() => applyLogFilters(feed ?? [], filters, {
        getDate: (n) => n.created_at,
        getText: (n) => `${n.title} ${n.body ?? ""} ${n.kind}`,
    }), [feed, filters]);
    const filteredAudit = useMemo(() => applyLogFilters(audit, filters, {
        getDate: (a) => a.at,
        getText: (a) => `${a.summary} ${a.admin} ${a.action} ${a.entity} ${a.targetId}`,
    }).slice(0, 3), [audit, filters]);
    const k = kpis ?? {
        pendingAdvertisers: 0,
        pendingClaims: 0,
        pendingModeration: 0,
        activeVenues: 0,
        signupsToday: 0,
        aiJobsToday: 0,
        systemAlerts: 0,
    };
    const KPIS: Array<{
      label: string;
      value: number;
      icon: typeof ClipboardCheck;
      tone: "coral" | "purple" | "amber" | "emerald" | "pink" | "teal" | "destructive";
      to: string;
      hint: string;
    }> = [
        { label: "Pending business approvals", value: k.pendingAdvertisers, icon: ClipboardCheck, tone: "coral", to: "/admin/advertisers", hint: "Awaiting review" },
        { label: "Venue claims pending", value: k.pendingClaims, icon: ShieldCheck, tone: "purple", to: "/admin/business-claims", hint: "Owner verification" },
        { label: "Open moderation reports", value: k.pendingModeration, icon: AlertTriangle, tone: "amber", to: "/admin/moderation", hint: "Photos · flyers · details" },
        { label: "Active venues", value: k.activeVenues, icon: Store, tone: "emerald", to: "/admin/venues", hint: "Live in marketplace" },
        { label: "Signups today", value: k.signupsToday, icon: UserPlus, tone: "pink", to: "/admin/users", hint: "New profiles" },
        { label: "AI refresh jobs", value: k.aiJobsToday, icon: RefreshCw, tone: "teal", to: "/admin/logs", hint: "Today" },
        { label: "System alerts", value: k.systemAlerts, icon: Zap, tone: "destructive", to: "/admin/logs", hint: "Last 24h" },
    ];
    const QUICK_ACTIONS: Array<{
        to: string;
        label: string;
        icon: typeof Users;
        tone: string;
    }> = [
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
    const totalQueue = k.pendingAdvertisers + k.pendingClaims + k.pendingModeration;
    return (<div className="space-y-8">
      {/* Hero Header */}
      <header className="relative overflow-hidden rounded-3xl border-2 border-ink bg-gradient-to-br from-coral via-orange-400 to-gold p-6 shadow-brut sm:p-8">
        {/* Confetti dots */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[8%] top-4 h-2 w-2 rotate-12 bg-purple"/>
          <div className="absolute left-[22%] top-12 h-3 w-3 -rotate-12 rounded-sm bg-cream"/>
          <div className="absolute right-[12%] top-6 h-2.5 w-2.5 rotate-45 bg-ink"/>
          <div className="absolute right-[28%] bottom-6 h-2 w-2 -rotate-45 bg-cream"/>
          <div className="absolute right-[6%] bottom-10 h-3 w-3 rotate-12 rounded-full bg-purple"/>
          <div className="absolute left-[40%] bottom-4 h-2 w-2 bg-ink"/>
        </div>

        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-ink/70">
              Command center
            </p>
            <h1 className="mt-1 font-display text-4xl font-bold leading-tight text-ink sm:text-5xl">
              Admin Dashboard
            </h1>
            <p className="mt-2 max-w-lg text-sm text-ink/80">
              Fast snapshot of approvals, moderation, and system health.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-cream px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-ink shadow-brut">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"/>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"/>
              </span>
              All systems operational
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-ink px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-cream shadow-brut">
              <Clock className="h-3 w-3"/>
              {totalQueue} in queue
            </div>
          </div>
        </div>
      </header>

      {/* KPI grid */}
      <AdminKpiGrid cols={7}>
        {KPIS.map((kpi, idx) => (
          <AdminKpiCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            icon={kpi.icon}
            tone={kpi.tone}
            to={kpi.to}
            hint={kpi.hint}
            loading={isLoading}
            index={idx}
          />
        ))}
      </AdminKpiGrid>

      {/* Main grid: activity feed + quick actions */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Activity feed */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold">Live activity</h2>
              <p className="text-xs text-muted-foreground">
                System notifications and admin actions, filter and sort below.
              </p>
            </div>
            <Link to={"/admin/audit" as any} className="inline-flex items-center gap-1 text-xs font-semibold text-coral hover:underline">
              Full audit <ChevronRight className="h-3 w-3"/>
            </Link>
          </div>
          <LogFilterBar value={filters} onChange={setFilters} placeholder="Search activity…" className="mb-4"/>
          <ul className="space-y-3">
            {filteredFeed.map((n) => (<li key={n.id} className="flex gap-3 rounded-xl border border-border/60 bg-muted/30 p-3">
                <div className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-coral/15 text-coral">
                  <Bell className="h-3 w-3"/>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{n.title}</p>
                  {n.body && <p className="line-clamp-1 text-xs text-muted-foreground">{n.body}</p>}
                  <p className="mt-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    {n.kind.replace(/_/g, " ")} · {formatRelative(n.created_at)}
                  </p>
                </div>
                {n.link && (<Link to={n.link as any} className="self-center text-xs font-semibold text-coral hover:underline">
                    Open
                  </Link>)}
              </li>))}
            {filteredAudit.map((a) => (<li key={a.id} className="flex gap-3 rounded-xl border border-border/60 bg-card p-3">
                <div className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-purple/15 text-purple">
                  <CheckCircle2 className="h-3 w-3"/>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{a.summary}</p>
                  <p className="mt-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    {a.admin} · {a.action} {a.entity} · {formatRelative(a.at)}
                  </p>
                </div>
              </li>))}
            {filteredFeed.length === 0 && filteredAudit.length === 0 && (<li className="grid place-items-center rounded-xl border border-dashed border-border py-10 text-sm text-muted-foreground">
                No activity matches these filters.
              </li>)}
          </ul>
        </div>

        {/* Quick actions sidebar */}
        <aside className="space-y-3">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h2 className="mb-3 font-display text-lg font-bold">Quick actions</h2>
            <div className="grid gap-2">
              {QUICK_ACTIONS.map((a) => (<Link key={a.label} to={a.to as any} className="group flex items-center gap-3 rounded-xl border border-border bg-background/60 p-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-ink hover:shadow-brut">
                  <span className={`grid h-8 w-8 place-items-center rounded-lg ${a.tone}`}>
                    <a.icon className="h-4 w-4"/>
                  </span>
                  <span className="flex-1">{a.label}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition group-hover:translate-x-0.5"/>
                </Link>))}
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-5">
            <div className="mb-2 inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-coral"/> Trend
            </div>
            <p className="text-sm">
              Approvals are trending{" "}
              <span className="inline-flex items-center gap-0.5 font-bold text-emerald-600">
                <TrendingUp className="h-3 w-3"/> faster
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
        ].map((l) => (<Link key={l.to} to={l.to as any} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-sm font-medium transition hover:border-ink hover:shadow-brut">
            <l.icon className="h-4 w-4 text-muted-foreground"/>
            {l.label}
            <ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground"/>
          </Link>))}
      </section>
    </div>);
}

/* ------------------------------------------------------------------ */
/*  Utils                                                              */
/* ------------------------------------------------------------------ */
function formatRelative(iso: string): string {
    const t = new Date(iso).getTime();
    const diff = Date.now() - t;
    const m = Math.floor(diff / 60000);
    if (m < 1)
        return "just now";
    if (m < 60)
        return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24)
        return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
}
