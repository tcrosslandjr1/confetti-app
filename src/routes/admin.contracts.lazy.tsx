import { createLazyFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  FileText,
  Search,
  Filter,
  Plus,
  Upload,
  Download,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileSignature,
  DollarSign,
  CalendarClock,
  History,
  ShieldAlert,
  RefreshCw,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  listContracts,
  getContract,
  createContract,
  updateContract,
  deleteContract,
  getSignedUrl,
  uploadContractFile,
  listContractVersions,
  createContractVersion,
  getExpiringContracts,
  runExpirationCheck,
  getContractStats,
  type Contract,
  type ContractType,
  type ContractStatus,
  type ContractVersion,
  type ExpiringContract,
  type ContractStats,
  type ContractCreateInput,
} from "@/lib/agents/contracts-library";

export const Route = createLazyFileRoute("/admin/contracts")({
  component: AdminContractsPage,
});

// ─── Helpers ──────────────────────────────────────────────

const TYPE_LABELS: Record<ContractType, string> = {
  service_agreement: "Service Agreement",
  nda: "NDA",
  partnership: "Partnership",
  sponsorship: "Sponsorship",
  influencer: "Influencer",
  vendor: "Vendor",
  license: "License",
  employment: "Employment",
  other: "Other",
};

const STATUS_COLORS: Record<ContractStatus, string> = {
  draft: "bg-slate-500/15 text-slate-700 border-slate-500/30",
  pending_signature: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  active: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  expired: "bg-red-500/15 text-red-700 border-red-500/30",
  terminated: "bg-destructive/15 text-destructive border-destructive/30",
  renewed: "bg-sky-500/15 text-sky-700 border-sky-500/30",
};

const STATUS_ICONS: Record<ContractStatus, typeof Clock> = {
  draft: FileText,
  pending_signature: FileSignature,
  active: CheckCircle2,
  expired: XCircle,
  terminated: ShieldAlert,
  renewed: RefreshCw,
};

function StatusBadge({ status }: { status: ContractStatus }) {
  const Icon = STATUS_ICONS[status] ?? Clock;
  const label = status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <Badge className={`${STATUS_COLORS[status]} capitalize`}>
      <Icon className="mr-1 h-3 w-3" />
      {label}
    </Badge>
  );
}

function currency(n: number | null) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Status Tabs ──────────────────────────────────────────

type TabKey = "all" | ContractStatus;

const STATUS_TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "draft", label: "Draft" },
  { key: "pending_signature", label: "Pending" },
  { key: "expired", label: "Expired" },
  { key: "terminated", label: "Terminated" },
  { key: "renewed", label: "Renewed" },
];

// ─── Stat Card ────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof FileText;
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent ?? "bg-muted"}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// ─── Create Dialog ────────────────────────────────────────

function CreateContractDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ContractType>("service_agreement");
  const [status, setStatus] = useState<ContractStatus>("draft");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setTitle("");
    setType("service_agreement");
    setStatus("draft");
    setStartDate("");
    setEndDate("");
    setValue("");
    setNotes("");
    setFile(null);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      const input: ContractCreateInput = {
        business_id: null,
        partner_id: null,
        title: title.trim(),
        type,
        status,
        start_date: startDate || null,
        end_date: endDate || null,
        auto_renew: false,
        renewal_terms: null,
        contract_value: value ? parseFloat(value) : null,
        payment_terms: null,
        file_path: null,
        file_name: null,
        file_size_bytes: null,
        file_type: null,
        signed_by: null,
        signed_at: null,
        notes: notes || null,
        tags: [],
        created_by: null,
      };

      const { id, error } = await createContract(input);
      if (error || !id) {
        toast.error(error ?? "Failed to create contract");
        return;
      }

      if (file) {
        const { error: upErr } = await uploadContractFile(file, "general", id);
        if (upErr) toast.error(`File upload failed: ${upErr}`);
        else {
          await updateContract(id, {
            file_path: `general/${id}/${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`,
            file_name: file.name,
            file_size_bytes: file.size,
            file_type: file.type,
          });
        }
      }

      toast.success("Contract created");
      reset();
      onClose();
      onCreated();
    } catch {
      toast.error("Unexpected error creating contract");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">New Contract</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Title *</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Venue Partnership — The Wharf" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value as ContractType)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as ContractStatus)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                <option value="draft">Draft</option>
                <option value="pending_signature">Pending Signature</option>
                <option value="active">Active</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Start Date</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">End Date</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground">Contract Value ($)</label>
            <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0" />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              placeholder="Optional notes…"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground">Attach File</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt,.png,.jpg"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-xs file:font-semibold"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-gradient-vibe px-4 py-2 text-sm font-semibold text-primary-foreground shadow-pop disabled:opacity-50"
          >
            {saving ? "Saving…" : "Create Contract"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Version History Panel ────────────────────────────────

function VersionPanel({
  contractId,
  contractTitle,
  onClose,
}: {
  contractId: string;
  contractTitle: string;
  onClose: () => void;
}) {
  const [versions, setVersions] = useState<ContractVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const v = await listContractVersions(contractId);
    setVersions(v);
    setLoading(false);
  }, [contractId]);

  useEffect(() => { load(); }, [load]);

  const handleUploadVersion = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { error } = await createContractVersion(contractId, file, "general", null, "New version uploaded from admin");
    if (error) toast.error(error);
    else {
      toast.success("Version uploaded");
      load();
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    const url = await getSignedUrl(filePath);
    if (!url) { toast.error("Could not generate download link"); return; }
    window.open(url, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Version History</h2>
            <p className="text-xs text-muted-foreground">{contractTitle}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm hover:bg-muted">
            <Upload className="h-4 w-4" />
            {uploading ? "Uploading…" : "Upload New Version"}
            <input type="file" className="hidden" onChange={handleUploadVersion} disabled={uploading} />
          </label>
        </div>

        <div className="max-h-64 space-y-2 overflow-y-auto">
          {loading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
          ) : versions.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No versions yet.</p>
          ) : (
            versions.map((v) => (
              <div key={v.id} className="flex items-center justify-between rounded-xl border border-border bg-background p-3">
                <div>
                  <p className="text-sm font-semibold">v{v.version_number}</p>
                  <p className="text-xs text-muted-foreground">{v.file_name}</p>
                  <p className="text-xs text-muted-foreground">{fmtDate(v.created_at)}</p>
                  {v.notes && <p className="text-xs italic text-muted-foreground">{v.notes}</p>}
                </div>
                <button
                  onClick={() => handleDownload(v.file_path, v.file_name)}
                  className="rounded-lg p-2 hover:bg-muted"
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Expiring Contracts Alert Panel ───────────────────────

function ExpirationAlerts({ expiring }: { expiring: ExpiringContract[] }) {
  if (expiring.length === 0) return null;

  const levelColor = {
    critical: "border-red-500/40 bg-red-500/10 text-red-700",
    warning: "border-amber-500/40 bg-amber-500/10 text-amber-700",
    notice: "border-sky-500/40 bg-sky-500/10 text-sky-700",
  };

  return (
    <div className="space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-bold">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        Expiring Soon ({expiring.length})
      </h3>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {expiring.map((c) => (
          <div key={c.contract_id} className={`rounded-xl border p-3 ${levelColor[c.alert_level]}`}>
            <p className="text-sm font-semibold">{c.title}</p>
            <p className="text-xs">
              Expires {fmtDate(c.end_date)} &middot; {c.days_until_expiry}d remaining
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────

function AdminContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [stats, setStats] = useState<ContractStats | null>(null);
  const [expiring, setExpiring] = useState<ExpiringContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("all");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [versionPanel, setVersionPanel] = useState<{ id: string; title: string } | null>(null);
  const [runningCheck, setRunningCheck] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [c, s, e] = await Promise.all([
      listContracts(),
      getContractStats(),
      getExpiringContracts(90),
    ]);
    setContracts(c);
    setStats(s);
    setExpiring(e);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRunCheck = async () => {
    setRunningCheck(true);
    try {
      // 1. Run client-side alert creation
      const count = await runExpirationCheck();

      // 2. Fire the edge function for email digest delivery
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseKey) {
        const res = await fetch(
          `${supabaseUrl}/functions/v1/contract-expiration-digest`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${supabaseKey}`,
              "Content-Type": "application/json",
            },
          }
        );
        const result = await res.json().catch(() => ({}));
        if (result.emailSent) {
          toast.success(
            `${count} alert(s) created · Digest email sent`
          );
        } else {
          toast.success(
            `${count} alert(s) created · Digest saved (email delivery requires RESEND_API_KEY)`
          );
        }
      } else {
        toast.success(`Expiration check complete: ${count} new alert(s) created`);
      }
    } catch (err) {
      console.error("Expiration check error:", err);
      toast.error("Expiration check failed");
    }
    setRunningCheck(false);
    load();
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete contract "${title}"? This cannot be undone.`)) return;
    const { error } = await deleteContract(id);
    if (error) toast.error(error);
    else {
      toast.success("Contract deleted");
      load();
    }
  };

  const handleDownload = async (filePath: string | null) => {
    if (!filePath) { toast.error("No file attached"); return; }
    const url = await getSignedUrl(filePath);
    if (!url) { toast.error("Could not generate download link"); return; }
    window.open(url, "_blank");
  };

  // Derived filter data
  const types = useMemo(
    () => Array.from(new Set(contracts.map((c) => c.type))),
    [contracts]
  );

  const filtered = useMemo(() => {
    return contracts.filter((c) => {
      if (tab !== "all" && c.status !== tab) return false;
      if (typeFilter !== "all" && c.type !== typeFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        if (
          !c.title.toLowerCase().includes(q) &&
          !c.id.toLowerCase().includes(q) &&
          !(c.notes ?? "").toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [contracts, tab, typeFilter, query]);

  const counts = useMemo(() => {
    const c: Record<TabKey, number> = {
      all: contracts.length,
      active: 0,
      draft: 0,
      pending_signature: 0,
      expired: 0,
      terminated: 0,
      renewed: 0,
    };
    contracts.forEach((ct) => { c[ct.status] = (c[ct.status] ?? 0) + 1; });
    return c;
  }, [contracts]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Legal &amp; Operations
          </p>
          <h1 className="font-display text-3xl font-bold leading-tight flex items-center gap-2">
            <FileText className="h-7 w-7" /> Contracts Library
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage contracts, track versions, and monitor expirations.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRunCheck}
            disabled={runningCheck}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
          >
            <CalendarClock className="h-4 w-4" />
            {runningCheck ? "Checking…" : "Run Expiration Check"}
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-vibe px-4 py-2 text-sm font-semibold text-primary-foreground shadow-pop"
          >
            <Plus className="h-4 w-4" /> New Contract
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      {stats && (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
          <StatCard icon={FileText} label="Total Contracts" value={stats.total} accent="bg-muted" />
          <StatCard icon={CheckCircle2} label="Active" value={stats.active} accent="bg-emerald-500/15 text-emerald-700" />
          <StatCard icon={AlertTriangle} label="Expiring Soon" value={stats.expiringSoon} accent="bg-amber-500/15 text-amber-700" />
          <StatCard icon={FileSignature} label="Pending Signature" value={stats.pendingSignature} accent="bg-sky-500/15 text-sky-700" />
          <StatCard icon={DollarSign} label="Total Value" value={currency(stats.totalValue)} accent="bg-violet-500/15 text-violet-700" />
        </div>
      )}

      {/* Expiration Alerts */}
      <ExpirationAlerts expiring={expiring} />

      {/* Status Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? "border-transparent bg-gradient-vibe text-primary-foreground shadow-pop"
                  : "border-border bg-card hover:bg-muted"
              }`}
            >
              {t.label}
              <span className={`rounded-full px-1.5 text-[10px] ${active ? "bg-background/20" : "bg-muted"}`}>
                {counts[t.key]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3 shadow-card">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, ID, or notes…"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="all">All types</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t] ?? t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>End</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                  Loading contracts…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                  No contracts match your filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="font-semibold">{c.title}</div>
                    {c.notes && (
                      <div className="text-xs text-muted-foreground line-clamp-1">{c.notes}</div>
                    )}
                    <div className="text-xs text-muted-foreground font-mono">{c.id.slice(0, 8)}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {TYPE_LABELS[c.type] ?? c.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{fmtDate(c.start_date)}</TableCell>
                  <TableCell className="text-sm">{fmtDate(c.end_date)}</TableCell>
                  <TableCell className="text-sm font-semibold">{currency(c.contract_value)}</TableCell>
                  <TableCell>
                    <StatusBadge status={c.status} />
                    {c.auto_renew && (
                      <span className="ml-1 text-[10px] text-muted-foreground">(auto-renew)</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {c.file_path && (
                        <button
                          onClick={() => handleDownload(c.file_path)}
                          className="rounded-lg p-1.5 hover:bg-muted"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setVersionPanel({ id: c.id, title: c.title })}
                        className="rounded-lg p-1.5 hover:bg-muted"
                        title="Version history"
                      >
                        <History className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id, c.title)}
                        className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      <CreateContractDialog open={showCreate} onClose={() => setShowCreate(false)} onCreated={load} />
      {versionPanel && (
        <VersionPanel
          contractId={versionPanel.id}
          contractTitle={versionPanel.title}
          onClose={() => setVersionPanel(null)}
        />
      )}
    </div>
  );
}
