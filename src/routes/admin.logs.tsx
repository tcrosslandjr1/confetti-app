import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  RefreshCw,
  ScrollText,
  ShieldAlert,
  UploadCloud,
  XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuditLog, type AuditEntry } from "@/lib/audit-log";
import {
  applyLogFilters,
  EMPTY_FILTERS,
  LogFilterBar,
  type LogFilterState,
} from "@/components/admin/LogFilterBar";

export const Route = createFileRoute("/admin/logs")({
  head: () => ({ meta: [{ title: "System & Error Logs — Admin" }] }),
  component: AdminLogsPage,
});

type Tab = "api" | "ai" | "uploads" | "admin" | "security";

const TABS: Array<{ id: Tab; label: string; icon: typeof ScrollText; tone: string }> = [
  { id: "api", label: "API errors", icon: XCircle, tone: "text-destructive" },
  { id: "ai", label: "Failed AI jobs", icon: Cpu, tone: "text-purple" },
  { id: "uploads", label: "Failed uploads", icon: UploadCloud, tone: "text-amber-600" },
  { id: "admin", label: "Admin actions", icon: ScrollText, tone: "text-coral" },
  { id: "security", label: "Security events", icon: ShieldAlert, tone: "text-emerald-600" },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

function AdminLogsPage() {
  const [tab, setTab] = useState<Tab>("api");
  const [filters, setFilters] = useState<LogFilterState>(EMPTY_FILTERS);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Backend health
          </p>
          <h1 className="font-display text-3xl font-bold leading-tight">System & error logs</h1>
          <p className="text-sm text-muted-foreground">
            Errors, failed jobs, uploads, admin actions, and security events.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:border-ink"
        >
          <RefreshCw className="h-3 w-3" /> Refresh
        </button>
      </header>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-2">
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? "border-ink bg-ink text-cream shadow-brut"
                  : "border-border bg-card hover:border-ink"
              }`}
            >
              <t.icon className={`h-3.5 w-3.5 ${active ? "" : t.tone}`} />
              {t.label}
            </button>
          );
        })}
      </div>

      <LogFilterBar value={filters} onChange={setFilters} placeholder="Search logs…" />

      {/* Panels */}
      {tab === "api" && <ApiErrorsPanel filters={filters} />}
      {tab === "ai" && <AiJobsPanel filters={filters} />}
      {tab === "uploads" && <UploadsPanel filters={filters} />}
      {tab === "admin" && <AdminActionsPanel filters={filters} />}
      {tab === "security" && <SecurityPanel filters={filters} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Panels                                                             */
/* ------------------------------------------------------------------ */

function ApiErrorsPanel({ query }: { query: string }) {
  // Pull recent booking notification delivery failures as a proxy for API errors.
  const { data, isLoading } = useQuery({
    queryKey: ["logs", "api-errors"],
    queryFn: async () => {
      const { data } = await supabase
        .from("booking_notification_deliveries" as any)
        .select("id, status, error, subject, recipient_email, source, created_at")
        .neq("status", "delivered")
        .order("created_at", { ascending: false })
        .limit(50);
      return (data ?? []) as unknown as Array<{
        id: string;
        status: string;
        error: string | null;
        subject: string | null;
        recipient_email: string | null;
        source: string | null;
        created_at: string;
      }>;
    },
    staleTime: 15_000,
  });

  const filtered = filterRows(
    data ?? [],
    query,
    (r) => `${r.subject} ${r.error} ${r.recipient_email}`,
  );

  return (
    <LogTable
      loading={isLoading}
      empty="No API/delivery errors in the last 50 events."
      columns={["When", "Status", "Subject", "Recipient", "Source", "Error"]}
      rows={filtered.map((r) => [
        timeAgo(r.created_at),
        <StatusPill key="s" tone="bad">
          {r.status}
        </StatusPill>,
        r.subject ?? "—",
        r.recipient_email ?? "—",
        r.source ?? "—",
        <code key="e" className="text-[11px] text-muted-foreground line-clamp-1">
          {r.error ?? "—"}
        </code>,
      ])}
    />
  );
}

function AiJobsPanel({ query }: { query: string }) {
  // Use vendor_connect_jobs (or analogous) — fall back to empty.
  const { data, isLoading } = useQuery({
    queryKey: ["logs", "ai-jobs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ai_jobs" as any)
        .select("id, kind, status, target, error, created_at")
        .in("status", ["failed", "error"])
        .order("created_at", { ascending: false })
        .limit(50);
      return (data ?? []) as unknown as Array<{
        id: string;
        kind: string;
        status: string;
        target: string | null;
        error: string | null;
        created_at: string;
      }>;
    },
    staleTime: 15_000,
    retry: false,
  });

  const filtered = filterRows(data ?? [], query, (r) => `${r.kind} ${r.target} ${r.error}`);

  return (
    <LogTable
      loading={isLoading}
      empty="No failed AI jobs. Ranking, refresh, and explainer pipelines are healthy."
      columns={["When", "Kind", "Target", "Status", "Error"]}
      rows={filtered.map((r) => [
        timeAgo(r.created_at),
        <span key="k" className="font-mono text-[11px] uppercase tracking-wider">
          {r.kind}
        </span>,
        r.target ?? "—",
        <StatusPill key="s" tone="bad">
          {r.status}
        </StatusPill>,
        <code key="e" className="text-[11px] text-muted-foreground line-clamp-1">
          {r.error ?? "—"}
        </code>,
      ])}
    />
  );
}

function UploadsPanel({ query }: { query: string }) {
  // Pull failed venue_media rows (if a status column exists).
  const { data, isLoading } = useQuery({
    queryKey: ["logs", "uploads"],
    queryFn: async () => {
      const { data } = await supabase
        .from("venue_media" as any)
        .select("id, venue_id, kind, source, status, created_at")
        .eq("status", "failed")
        .order("created_at", { ascending: false })
        .limit(50);
      return (data ?? []) as unknown as Array<{
        id: string;
        venue_id: string | null;
        kind: string;
        source: string | null;
        status: string;
        created_at: string;
      }>;
    },
    staleTime: 15_000,
    retry: false,
  });

  const filtered = filterRows(data ?? [], query, (r) => `${r.kind} ${r.source} ${r.venue_id}`);

  return (
    <LogTable
      loading={isLoading}
      empty="No failed uploads in the last 50 events."
      columns={["When", "Venue", "Kind", "Source", "Status"]}
      rows={filtered.map((r) => [
        timeAgo(r.created_at),
        <code key="v" className="text-[11px]">
          {r.venue_id?.slice(0, 8) ?? "—"}
        </code>,
        r.kind,
        r.source ?? "—",
        <StatusPill key="s" tone="bad">
          {r.status}
        </StatusPill>,
      ])}
    />
  );
}

function AdminActionsPanel({ query }: { query: string }) {
  const entries = useAuditLog();
  const filtered = filterRows(
    entries,
    query,
    (e: AuditEntry) => `${e.summary} ${e.admin} ${e.entity} ${e.targetId}`,
  );

  return (
    <LogTable
      loading={false}
      empty="No admin actions recorded yet this session."
      columns={["When", "Admin", "Action", "Entity", "Target", "Summary"]}
      rows={filtered.map((e) => [
        timeAgo(e.at),
        e.admin,
        <span key="a" className="font-mono text-[11px] uppercase tracking-wider">
          {e.action}
        </span>,
        e.entity,
        <code key="t" className="text-[11px]">
          {e.targetId}
        </code>,
        e.summary,
      ])}
    />
  );
}

function SecurityPanel({ query }: { query: string }) {
  // Surface failed-login signals from notifications kind=security_event when present.
  const { data, isLoading } = useQuery({
    queryKey: ["logs", "security"],
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications" as any)
        .select("id, kind, title, body, created_at")
        .in("kind", ["security_event", "auth_failed", "rls_denied"])
        .order("created_at", { ascending: false })
        .limit(50);
      return (data ?? []) as unknown as Array<{
        id: string;
        kind: string;
        title: string;
        body: string | null;
        created_at: string;
      }>;
    },
    staleTime: 15_000,
  });

  const filtered = filterRows(data ?? [], query, (r) => `${r.title} ${r.body} ${r.kind}`);

  return (
    <LogTable
      loading={isLoading}
      empty={
        <span className="inline-flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" /> No security events. All clear.
        </span>
      }
      columns={["When", "Kind", "Title", "Detail"]}
      rows={filtered.map((r) => [
        timeAgo(r.created_at),
        <span key="k" className="font-mono text-[11px] uppercase tracking-wider">
          {r.kind}
        </span>,
        r.title,
        <span key="b" className="text-xs text-muted-foreground line-clamp-1">
          {r.body ?? "—"}
        </span>,
      ])}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Primitives                                                         */
/* ------------------------------------------------------------------ */

function LogTable({
  loading,
  empty,
  columns,
  rows,
}: {
  loading: boolean;
  empty: ReactNode;
  columns: string[];
  rows: ReactNode[][];
}) {
  if (loading) {
    return (
      <div className="grid place-items-center rounded-2xl border border-dashed border-border p-12 text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="grid place-items-center rounded-2xl border border-dashed border-border p-12 text-sm text-muted-foreground">
        {empty}
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            <tr>
              {columns.map((c) => (
                <th key={c} className="px-3 py-2 font-semibold">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((cells, i) => (
              <tr key={i} className="border-t border-border/60 hover:bg-muted/30">
                {cells.map((cell, j) => (
                  <td key={j} className="px-3 py-2 align-middle">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-border/60 px-3 py-2 text-[11px] text-muted-foreground">
        <span>{rows.length} entries</span>
        <Link to={"/admin/audit" as any} className="font-semibold text-coral hover:underline">
          Open audit log →
        </Link>
      </div>
    </div>
  );
}

function StatusPill({ tone, children }: { tone: "ok" | "bad" | "warn"; children: ReactNode }) {
  const cls =
    tone === "ok"
      ? "bg-emerald-100 text-emerald-700"
      : tone === "warn"
        ? "bg-amber-100 text-amber-700"
        : "bg-red-100 text-red-700";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${cls}`}
    >
      {tone === "bad" && <AlertTriangle className="h-2.5 w-2.5" />}
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function filterRows<T>(rows: T[], query: string, extract: (r: T) => string): T[] {
  if (!query.trim()) return rows;
  const q = query.toLowerCase();
  return rows.filter((r) => extract(r).toLowerCase().includes(q));
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
