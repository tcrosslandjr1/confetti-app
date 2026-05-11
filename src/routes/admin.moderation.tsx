import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Flag,
  MessageSquareWarning,
  Search,
  ShieldCheck,
  Star,
  Trash2,
  User,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit-log";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/admin/moderation")({
  component: AdminModerationPage,
});

type Severity = "low" | "medium" | "high";
type ItemType = "review" | "comment" | "venue" | "profile";
type Status = "pending" | "approved" | "removed";

type Report = {
  id: string;
  type: ItemType;
  reason: string;
  severity: Severity;
  reporter: string;
  target: string;
  context: string;
  content: string;
  reportedAt: string;
  status: Status;
};

const SEED: Report[] = [
  {
    id: "RP-2041",
    type: "review",
    reason: "Hate speech",
    severity: "high",
    reporter: "Marcus Tate",
    target: "user_8821 → Maydan",
    context: "Review on Maydan",
    content: "Worst place ever, the people who go here are [removed slur]…",
    reportedAt: "12m ago",
    status: "pending",
  },
  {
    id: "RP-2040",
    type: "comment",
    reason: "Spam / promotion",
    severity: "low",
    reporter: "System",
    target: "user_4471",
    context: "Comment on 'Late Eats' collection",
    content: "Visit my site bestdeals[.]xyz for free crypto airdrops!! 🎁🎁🎁",
    reportedAt: "34m ago",
    status: "pending",
  },
  {
    id: "RP-2039",
    type: "venue",
    reason: "Closed permanently",
    severity: "medium",
    reporter: "Priya Rao",
    target: "Bistro 1521",
    context: "Venue listing",
    content: "Walked by today, sign on the door says closed for good. Should be unlisted.",
    reportedAt: "1h ago",
    status: "pending",
  },
  {
    id: "RP-2038",
    type: "profile",
    reason: "Impersonation",
    severity: "high",
    reporter: "Ana Ferreira",
    target: "@chef_jose_andres_official",
    context: "User profile",
    content: "Profile claims to be José Andrés. Avatar is a screenshot from his Instagram.",
    reportedAt: "3h ago",
    status: "pending",
  },
  {
    id: "RP-2037",
    type: "review",
    reason: "Off-topic",
    severity: "low",
    reporter: "Devon Hale",
    target: "user_2210 → Albi",
    context: "Review on Albi",
    content: "I had a great time at the Wizards game last night btw, who's going Friday?",
    reportedAt: "5h ago",
    status: "approved",
  },
  {
    id: "RP-2036",
    type: "comment",
    reason: "Harassment",
    severity: "medium",
    reporter: "Mia Chen",
    target: "user_9912",
    context: "Comment on Sarah K.'s trip",
    content: "Stop posting, no one cares about your boring dinners.",
    reportedAt: "1d ago",
    status: "removed",
  },
];

const TYPE_ICON: Record<ItemType, typeof Flag> = {
  review: Star,
  comment: MessageSquareWarning,
  venue: ShieldCheck,
  profile: User,
};

const SEVERITY_TONE: Record<Severity, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-gold/20 text-foreground",
  high: "bg-destructive/15 text-destructive",
};

const TABS: { key: "pending" | "approved" | "removed" | "all"; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "removed", label: "Removed" },
  { key: "all", label: "All" },
];

function StatusBadge({ status }: { status: Status }) {
  if (status === "approved")
    return (
      <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20">
        <CheckCircle2 className="mr-1 h-3 w-3" /> Approved
      </Badge>
    );
  if (status === "removed")
    return (
      <Badge className="bg-destructive/15 text-destructive hover:bg-destructive/20">
        <Trash2 className="mr-1 h-3 w-3" /> Removed
      </Badge>
    );
  return (
    <Badge className="bg-gold/20 text-foreground hover:bg-gold/30">
      <AlertTriangle className="mr-1 h-3 w-3" /> Pending
    </Badge>
  );
}

function AdminModerationPage() {
  const { user } = useAuth();
  const adminEmail = user?.email ?? "admin";
  const [reports, setReports] = useState<Report[]>(SEED);
  const [tab, setTab] = useState<"pending" | "approved" | "removed" | "all">("pending");
  const [typeFilter, setTypeFilter] = useState<"all" | ItemType>("all");
  const [severityFilter, setSeverityFilter] = useState<"all" | Severity>("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(
    () => ({
      pending: reports.filter((r) => r.status === "pending").length,
      approved: reports.filter((r) => r.status === "approved").length,
      removed: reports.filter((r) => r.status === "removed").length,
      all: reports.length,
    }),
    [reports],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reports.filter((r) => {
      if (tab !== "all" && r.status !== tab) return false;
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (severityFilter !== "all" && r.severity !== severityFilter) return false;
      if (q) {
        const hay =
          `${r.id} ${r.target} ${r.reason} ${r.content} ${r.context} ${r.reporter}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [reports, tab, typeFilter, severityFilter, query]);

  const decide = (id: string, status: "approved" | "removed") => {
    const r = reports.find((x) => x.id === id);
    setReports((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
    toast.success(status === "approved" ? `Approved ${id}` : `Removed ${id}`);
    logAudit({
      admin: adminEmail,
      action: status === "approved" ? "approve" : "remove",
      entity: "report",
      targetId: id,
      summary: `${status === "approved" ? "Approved" : "Removed"}${r ? ` ${r.type} report (${r.reason}) on ${r.target}` : ""}`,
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Trust & Safety
          </p>
          <h1 className="font-display text-3xl font-bold leading-tight flex items-center gap-2">
            <ShieldCheck className="h-7 w-7" /> Moderation
          </h1>
          <p className="text-sm text-muted-foreground">
            Review reported content and decide whether to approve or remove it.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {(["pending", "approved", "removed"] as const).map((s) => (
            <div key={s} className="rounded-xl border border-border bg-card px-4 py-2 shadow-card">
              <div className="text-xl font-bold font-display">{counts[s]}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s}</div>
            </div>
          ))}
        </div>
      </header>

      <div className="rounded-2xl border border-border bg-card p-3 shadow-card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by report ID, target, reason, or content…"
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => {
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
              <span
                className={`rounded-full px-1.5 text-[10px] ${active ? "bg-background/20" : "bg-muted"}`}
              >
                {counts[t.key]}
              </span>
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as "all" | ItemType)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="all">All types</option>
            <option value="review">Reviews</option>
            <option value="comment">Comments</option>
            <option value="venue">Venues</option>
            <option value="profile">Profiles</option>
          </select>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as "all" | Severity)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="all">All severities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
          Nothing to moderate here. Inbox zero ✨
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((r) => {
            const Icon = TYPE_ICON[r.type];
            return (
              <article
                key={r.id}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-card"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-muted">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-mono text-muted-foreground">{r.id}</div>
                      <div className="text-sm font-semibold capitalize">
                        {r.type} · {r.context}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${SEVERITY_TONE[r.severity]}`}
                    >
                      {r.severity}
                    </span>
                    <StatusBadge status={r.status} />
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-background/60 p-3 text-sm">
                  <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Flag className="h-3 w-3" /> {r.reason} · target:{" "}
                    <span className="font-mono">{r.target}</span>
                  </div>
                  <p className="text-foreground/90">"{r.content}"</p>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Reported by <span className="font-semibold text-foreground">{r.reporter}</span>{" "}
                    · {r.reportedAt}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={r.status === "approved"}
                    onClick={() => decide(r.id, "approved")}
                  >
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={r.status === "removed"}
                    onClick={() => decide(r.id, "removed")}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove
                  </Button>
                  <Button size="sm" variant="ghost" className="ml-auto">
                    <Eye className="mr-1 h-3.5 w-3.5" /> View context
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
