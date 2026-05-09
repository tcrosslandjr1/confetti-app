import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
import { toast } from "sonner";

export const Route = createFileRoute("/admin/audit")({
  component: AdminAuditPage,
});

const ACTION_META: Record<AuditAction, { icon: typeof CheckCircle2; tone: string; label: string }> = {
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
        const hay = `${e.id} ${e.admin} ${e.action} ${e.entity} ${e.targetId} ${e.summary}`.toLowerCase();
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
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Compliance</p>
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
            <option key={a} value={a}>{ACTION_META[a].label}</option>
          ))}
        </select>
        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value as "all" | AuditEntity)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="all">All entities</option>
          {(Object.keys(ENTITY_META) as AuditEntity[]).map((e) => (
            <option key={e} value={e}>{ENTITY_META[e].label}</option>
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
                  No entries match your filters. Actions you take in other admin pages will appear here.
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
    </div>
  );
}
