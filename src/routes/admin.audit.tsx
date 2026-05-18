import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  CheckCircle2,
  ScrollText,
  Search,
  Trash2,
  User as UserIcon,
  XCircle,
  Edit3,
  Shield,
  CalendarCheck,
  Store,
  Flag,
  Download,
  Eraser,
  ShieldAlert,
    MapPin,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type AuditAction, type AuditEntity, clearAudit, useAuditLog } from "@/lib/audit-log";
import { clearAccessDenials, useAccessDenials, type DenialEntry } from "@/lib/access-denials";
import {
  clearSecurityTrace,
  useSecurityTrace,
  type SecurityTraceEntry,
} from "@/lib/security-trace";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/audit")({
  component: AdminAuditPage,
});

const ACTION_META: Record<AuditAction, { icon: typeof CheckCircle2; tone: string; label: string }> =
  {
    approve: { icon: CheckCircle2, tone: "bg-emerald-500/15 text-emerald-700", label: "Approve" },
    confirm: { icon: CheckCircle2, tone: "bg-emerald-500/15 text-emerald-700", label: "Confirm" },
    remove: { icon: Trash2, tone: "bg-destructive/15 text-destructive", label: "Remove" },
    reject: { icon: XCircle, tone: "bg-destructive/15 text-destructive", label: "Reject" },
    cancel: { icon: XCircle, tone: "bg-destructive/15 text-destructive", label: "Cancel" },
    edit: { icon: Edit3, tone: "bg-muted text-foreground", label: "Edit" },
    role: { icon: Shield, tone: "bg-purple/20 text-foreground", label: "Role change" },
    status: { icon: UserIcon, tone: "bg-gold/20 text-foreground", label: "Status change" },
  };

const ENTITY_META: Record<AuditEntity, { icon: typeof CalendarCheck; label: string }> = {
  booking: { icon: CalendarCheck, label: "Booking" },
  venue: { icon: Store, label: "Venue" },
  report: { icon: Flag, label: "Report" },
  user: { icon: UserIcon, label: "User" },
};

function formatWhen(iso: string) {
  const d = new Date(iso);
  const diffMin = Math.round((Date.now() - d.getTime()) / 60_000);
  let rel: string;
  if (diffMin < 1) rel = "just now";
  else if (diffMin < 60) rel = `${diffMin}m ago`;
  else if (diffMin < 60 * 24) rel = `${Math.round(diffMin / 60)}h ago`;
  else rel = `${Math.round(diffMin / (60 * 24))}d ago`;
  return { rel, abs: d.toLocaleString() };
}

function AdminAuditPage() {
  const entries = useAuditLog();
  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<"all" | AuditAction>("all");
  const [entityFilter, setEntityFilter] = useState<"all" | AuditEntity>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (actionFilter !== "all" && e.action !== actionFilter) return false;
      if (entityFilter !== "all" && e.entity !== entityFilter) return false;
      if (q) {
        const hay =
          `${e.id} ${e.admin} ${e.action} ${e.entity} ${e.targetId} ${e.summary}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [entries, query, actionFilter, entityFilter]);

  const exportCsv = () => {
    const rows = [
      ["id", "timestamp", "admin", "action", "entity", "target_id", "summary"],
      ...filtered.map((e) => [e.id, e.at, e.admin, e.action, e.entity, e.targetId, e.summary]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} entries`);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Compliance
          </p>
          <h1 className="font-display text-3xl font-bold leading-tight flex items-center gap-2">
            <ScrollText className="h-7 w-7" /> Audit log
          </h1>
          <p className="text-sm text-muted-foreground">
            Every approve, remove, and admin action — with timestamp and actor.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="mr-1 h-3.5 w-3.5" /> Export CSV
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              clearAudit();
              toast.success("Audit log cleared");
            }}
            className="text-destructive hover:text-destructive"
          >
            <Eraser className="mr-1 h-3.5 w-3.5" /> Clear
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3 shadow-card">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by admin, target ID, action, or summary…"
            className="pl-9"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value as "all" | AuditAction)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="all">All actions</option>
          {(Object.keys(ACTION_META) as AuditAction[]).map((a) => (
            <option key={a} value={a}>
              {ACTION_META[a].label}
            </option>
          ))}
        </select>
        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value as "all" | AuditEntity)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="all">All entities</option>
          {(Object.keys(ENTITY_META) as AuditEntity[]).map((e) => (
            <option key={e} value={e}>
              {ENTITY_META[e].label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Entry</TableHead>
              <TableHead>When</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Summary</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                  No entries match your filters. Actions you take in other admin pages will appear
                  here.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((e) => {
                const A = ACTION_META[e.action];
                const E = ENTITY_META[e.entity];
                const w = formatWhen(e.at);
                return (
                  <TableRow key={e.id}>
                    <TableCell className="font-mono text-xs">{e.id}</TableCell>
                    <TableCell>
                      <div className="text-sm">{w.rel}</div>
                      <div className="text-xs text-muted-foreground">{w.abs}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-vibe text-[10px] font-bold text-primary-foreground">
                          {e.admin.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm">{e.admin}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${A.tone} hover:opacity-90`}>
                        <A.icon className="mr-1 h-3 w-3" /> {A.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <E.icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">{E.label}</span>
                        <span className="font-mono text-xs">{e.targetId}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[420px]">
                      <span className="text-sm text-foreground/85">{e.summary}</span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <PlacesMatchAuditSection />
      <AccessDenialsSection />
      <SecurityTraceSection />
    </div>
  );
}

function formatRelAbs(iso: string) {
  const d = new Date(iso);
  const diffMin = Math.round((Date.now() - d.getTime()) / 60_000);
  let rel: string;
  if (diffMin < 1) rel = "just now";
  else if (diffMin < 60) rel = `${diffMin}m ago`;
  else if (diffMin < 60 * 24) rel = `${Math.round(diffMin / 60)}h ago`;
  else rel = `${Math.round(diffMin / (60 * 24))}d ago`;
  return { rel, abs: d.toLocaleString() };
}

function AccessDenialsSection() {
  const denials = useAccessDenials();
  const [q, setQ] = useState("");
  const [feature, setFeature] = useState<"all" | DenialEntry["feature"]>("all");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return denials.filter((d) => {
      if (feature !== "all" && d.feature !== feature) return false;
      if (s) {
        const hay =
          `${d.id} ${d.attemptedPath} ${d.fromPath} ${d.viewerRole} ${d.userId ?? ""} ${d.note ?? ""} ${d.feature}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [denials, q, feature]);

  const last24h = useMemo(
    () => denials.filter((d) => Date.now() - new Date(d.at).getTime() < 24 * 60 * 60 * 1000).length,
    [denials],
  );
  const visitorCount = useMemo(
    () => denials.filter((d) => d.viewerRole === "visitor").length,
    [denials],
  );

  const exportCsv = () => {
    const rows = [
      [
        "id",
        "timestamp",
        "source",
        "feature",
        "attempted_path",
        "from_path",
        "viewer_role",
        "user_id",
        "note",
      ],
      ...filtered.map((d) => [
        d.id,
        d.at,
        d.source,
        d.feature,
        d.attemptedPath,
        d.fromPath,
        d.viewerRole,
        d.userId ?? "",
        d.note ?? "",
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `access-denials-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} denials`);
  };

  const FEATURES: DenialEntry["feature"][] = [
    "planning",
    "booking",
    "portal",
    "concierge",
    "trips",
    "reservations",
    "other",
  ];

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Access monitoring
          </p>
          <h2 className="font-display text-2xl font-bold leading-tight flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-amber-600" /> Denied access attempts
          </h2>
          <p className="text-sm text-muted-foreground">
            Visitors and signed-out users blocked from planning, bookings, and portal pages.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download className="mr-1 h-3.5 w-3.5" /> Export CSV
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              clearAccessDenials();
              toast.success("Denial log cleared");
            }}
            className="text-destructive hover:text-destructive"
          >
            <Eraser className="mr-1 h-3.5 w-3.5" /> Clear
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Total denials" value={denials.length} />
        <StatCard label="Last 24 hours" value={last24h} />
        <StatCard label="Visitor view" value={visitorCount} />
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3 shadow-card">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by path, user ID, role, or note…"
            className="pl-9"
          />
        </div>
        <select
          value={feature}
          onChange={(e) => setFeature(e.target.value as typeof feature)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="all">All features</option>
          {FEATURES.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Entry</TableHead>
              <TableHead>When</TableHead>
              <TableHead>Viewer</TableHead>
              <TableHead>Feature</TableHead>
              <TableHead>Attempted</TableHead>
              <TableHead>Note</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                  No denied attempts recorded yet. Visitors blocked from gated pages will appear
                  here.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((d) => {
                const w = formatRelAbs(d.at);
                return (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono text-xs">{d.id}</TableCell>
                    <TableCell>
                      <div className="text-sm">{w.rel}</div>
                      <div className="text-xs text-muted-foreground">{w.abs}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm capitalize">{d.viewerRole}</div>
                      {d.userId ? (
                        <div className="font-mono text-[11px] text-muted-foreground">
                          {d.userId.slice(0, 8)}…
                        </div>
                      ) : (
                        <div className="text-[11px] text-muted-foreground">no session</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-amber-500/15 text-amber-700 hover:opacity-90 capitalize">
                        {d.feature}
                      </Badge>
                      <div className="mt-1 text-[11px] text-muted-foreground">{d.source}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      <div>{d.attemptedPath}</div>
                      <div className="text-muted-foreground">from {d.fromPath}</div>
                    </TableCell>
                    <TableCell className="max-w-[320px] text-sm text-foreground/85">
                      {d.note ?? "—"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}

type PlacesMatchRow = {
  id: string;
  created_at: string;
  source: string;
  user_id: string | null;
  city: string | null;
  requested_name: string | null;
  query: string | null;
  place_id: string | null;
  matched_name: string | null;
  status: string;
  score: number | null;
  rating: number | null;
  user_rating_count: number | null;
  business_status: string | null;
};

function PlacesMatchAuditSection() {
  const [rows, setRows] = useState<PlacesMatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "matched" | "fallback" | "unmatched">(
    "all",
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("places_match_audit")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (cancelled) return;
      if (error) {
        toast.error(`Failed to load Places audit: ${error.message}`);
      } else {
        setRows((data ?? []) as PlacesMatchRow[]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (s) {
        const hay =
          `${r.source} ${r.city ?? ""} ${r.requested_name ?? ""} ${r.matched_name ?? ""} ${r.place_id ?? ""} ${r.query ?? ""}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [rows, q, statusFilter]);

  const matched = rows.filter((r) => r.status === "matched").length;
  const fallback = rows.filter((r) => r.status === "fallback").length;
  const unmatched = rows.filter((r) => r.status === "unmatched").length;

  const exportCsv = () => {
    const header = [
      "id",
      "created_at",
      "source",
      "user_id",
      "city",
      "requested_name",
      "query",
      "place_id",
      "matched_name",
      "status",
      "score",
      "rating",
      "user_rating_count",
      "business_status",
    ];
    const data = [
      header,
      ...filtered.map((r) => header.map((h) => (r as Record<string, unknown>)[h] ?? "")),
    ];
    const csv = data
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `places-match-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} rows`);
  };

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Itinerary verification
          </p>
          <h2 className="font-display text-2xl font-bold leading-tight flex items-center gap-2">
            <MapPin className="h-6 w-6 text-coral" /> Places match audit
          </h2>
          <p className="text-sm text-muted-foreground">
            Every Google Places lookup performed while building an itinerary — name, status, and
            score.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download className="mr-1 h-3.5 w-3.5" /> Export CSV
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Matched (exact)" value={matched} />
        <StatCard label="Fallback (category)" value={fallback} />
        <StatCard label="Unmatched" value={unmatched} />
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3 shadow-card">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by city, name, place ID, or query…"
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="matched">Matched</option>
          <option value="fallback">Fallback</option>
          <option value="unmatched">Unmatched</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Requested → Matched</TableHead>
              <TableHead>Place ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                  No Places matches recorded yet. Generated itineraries will appear here.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => {
                const w = formatRelAbs(r.created_at);
                const tone =
                  r.status === "matched"
                    ? "bg-emerald-500/15 text-emerald-700"
                    : r.status === "fallback"
                      ? "bg-amber-500/15 text-amber-700"
                      : "bg-destructive/15 text-destructive";
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="text-sm">{w.rel}</div>
                      <div className="text-xs text-muted-foreground">{w.abs}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{r.source}</TableCell>
                    <TableCell className="text-sm">{r.city ?? "—"}</TableCell>
                    <TableCell className="max-w-[320px] text-sm">
                      <div className="truncate">{r.requested_name ?? r.query ?? "—"}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        → {r.matched_name ?? "—"}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-[11px]">
                      {r.place_id ? `${r.place_id.slice(0, 16)}…` : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${tone} hover:opacity-90 capitalize`}>{r.status}</Badge>
                      {r.business_status && r.business_status !== "OPERATIONAL" ? (
                        <div className="mt-1 text-[11px] text-muted-foreground">
                          {r.business_status}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {r.score == null ? "—" : Number(r.score).toFixed(2)}
                      {r.rating != null ? (
                        <div className="text-[11px] text-muted-foreground">
                          {r.rating}★ · {r.user_rating_count ?? 0}
                        </div>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

function SecurityTraceSection() {
  const traces = useSecurityTrace();
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<"all" | SecurityTraceEntry["kind"]>("all");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return traces.filter((t) => {
      if (kind !== "all" && t.kind !== kind) return false;
      if (!needle) return true;
      return [
        t.actorRole,
        t.realRole,
        t.userEmail,
        t.userId,
        t.fromRole,
        t.toRole,
        t.action,
        t.path,
        t.note,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle));
    });
  }, [traces, q, kind]);

  function exportCsv() {
    const head = [
      "id",
      "at",
      "kind",
      "outcome",
      "actorRole",
      "realRole",
      "userEmail",
      "fromRole",
      "toRole",
      "action",
      "path",
      "note",
    ];
    const rows = filtered.map((t) =>
      head
        .map((k) => {
          const v = (t as Record<string, unknown>)[k];
          const s = v == null ? "" : String(v);
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    );
    const csv = [head.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `security-trace-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const KINDS: SecurityTraceEntry["kind"][] = ["view-switch", "view-exit", "protected-attempt"];

  return (
    <section className="mt-12 space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Shield className="h-5 w-5 text-muted-foreground" />
            Security trace
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            View-as switches and protected action attempts. Stored locally for traceability.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              clearSecurityTrace();
              toast.success("Security trace cleared");
            }}
          >
            <Eraser className="mr-1.5 h-3.5 w-3.5" /> Clear
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by role, email, action…"
            className="h-9 w-72 pl-8"
          />
        </div>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as typeof kind)}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="all">All kinds</option>
          {KINDS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Kind</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Detail</TableHead>
              <TableHead>Path</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  No security trace entries yet.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((t) => {
                const when = formatRelAbs(t.at);
                return (
                  <TableRow key={t.id}>
                    <TableCell title={when.abs} className="whitespace-nowrap text-sm">
                      {when.rel}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {t.kind}
                      </Badge>
                      {t.outcome !== "info" ? (
                        <span
                          className={`ml-1.5 text-xs ${
                            t.outcome === "denied" ? "text-destructive" : "text-emerald-600"
                          }`}
                        >
                          {t.outcome}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="font-medium">{t.userEmail ?? t.userId ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        {t.actorRole}
                        {t.realRole && t.realRole !== t.actorRole ? ` (real ${t.realRole})` : ""}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[360px] text-sm">
                      {t.kind === "view-switch" || t.kind === "view-exit" ? (
                        <span>
                          {t.fromRole} → <strong>{t.toRole}</strong>
                        </span>
                      ) : (
                        <span>{t.action ?? "—"}</span>
                      )}
                      {t.note ? (
                        <div className="text-xs text-muted-foreground">{t.note}</div>
                      ) : null}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {t.path ?? "—"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
