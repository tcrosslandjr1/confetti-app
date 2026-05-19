import { createLazyFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CalendarClock, CheckCircle2, Eye, Flag, MapPin, MessageSquareWarning, Search, ShieldCheck, Star, Trash2, User, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit-log";
import { useAuth } from "@/lib/auth-context";
import { adminListEventsForModeration, adminDecideEvent, adminListVenuesForModeration, adminDecideVenue } from "@/lib/moderation.functions";
import { ModerationDecideDialog } from "@/components/admin/ModerationDecideDialog";

export const Route = createLazyFileRoute("/admin/moderation")({
  component: AdminModerationPage,
});

/* =================== REPORTS (existing in-memory queue) =================== */
type Severity = "low" | "medium" | "high";

type ItemType = "review" | "comment" | "venue" | "profile";

type ReportStatus = "pending" | "approved" | "removed";

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
    status: ReportStatus;
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

function ReportStatusBadge({ status }: {
    status: ReportStatus;
}) {
    if (status === "approved")
        return (<Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20">
        <CheckCircle2 className="mr-1 h-3 w-3"/> Approved
      </Badge>);
    if (status === "removed")
        return (<Badge className="bg-destructive/15 text-destructive hover:bg-destructive/20">
        <Trash2 className="mr-1 h-3 w-3"/> Removed
      </Badge>);
    return (<Badge className="bg-gold/20 text-foreground hover:bg-gold/30">
      <AlertTriangle className="mr-1 h-3 w-3"/> Pending
    </Badge>);
}

/* ============================== PAGE SHELL ============================== */
function AdminModerationPage() {
    return (<div className="space-y-6">
      <header>
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          Trust & Safety
        </p>
        <h1 className="font-display text-3xl font-bold leading-tight flex items-center gap-2">
          <ShieldCheck className="h-7 w-7"/> Moderation Center
        </h1>
        <p className="text-sm text-muted-foreground">
          Approve or reject submissions across reports, events, and venues.
        </p>
      </header>

      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">
            <CalendarClock className="mr-1.5 h-4 w-4"/> Events
          </TabsTrigger>
          <TabsTrigger value="venues">
            <MapPin className="mr-1.5 h-4 w-4"/> Venues
          </TabsTrigger>
          <TabsTrigger value="reports">
            <Flag className="mr-1.5 h-4 w-4"/> Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <EventsModerationTab />
        </TabsContent>
        <TabsContent value="venues">
          <VenuesModerationTab />
        </TabsContent>
        <TabsContent value="reports">
          <ReportsTab />
        </TabsContent>
      </Tabs>
    </div>);
}

/* ============================== EVENTS TAB ============================== */
type EventStatus = "pending_review" | "published" | "rejected" | "all";

const EVENT_TABS: {
    key: EventStatus;
    label: string;
}[] = [
    { key: "pending_review", label: "Pending" },
    { key: "published", label: "Approved" },
    { key: "rejected", label: "Rejected" },
    { key: "all", label: "All" },
];

function EventsModerationTab() {
    const [status, setStatus] = useState<EventStatus>("pending_review");
    const [city, setCity] = useState("");
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const [decision, setDecision] = useState<{
        eventId: string;
        label: string;
        kind: "approve" | "reject";
    } | null>(null);
    const list = useServerFn(adminListEventsForModeration);
    const decide = useServerFn(adminDecideEvent);
    const qc = useQueryClient();
    const { data, isLoading, error } = useQuery({
        queryKey: ["mod-events", status, city, query, page],
        queryFn: () => list({
            data: {
                status,
                city: city.trim() || undefined,
                query: query.trim() || undefined,
                page,
                pageSize,
            },
        }),
    });
    const decideMut = useMutation({
        mutationFn: (vars: {
            eventId: string;
            decision: "approve" | "reject";
            note?: string;
        }) => decide({ data: vars }),
        onSuccess: (_d, v) => {
            toast.success(v.decision === "approve" ? "Event approved" : "Event rejected");
            qc.invalidateQueries({ queryKey: ["mod-events"] });
            setDecision(null);
        },
        onError: (e: Error) => toast.error(e.message),
    });
    const events = data?.events ?? [];
    const total = data?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    return (<div className="space-y-4">
      <ModerationToolbar tabs={EVENT_TABS} active={status} onTab={(k) => {
            setStatus(k as EventStatus);
            setPage(1);
        }} query={query} onQuery={(v) => {
            setQuery(v);
            setPage(1);
        }} city={city} onCity={(v) => {
            setCity(v);
            setPage(1);
        }} placeholder="Search by title or venue…"/>

      {isLoading && <p className="text-sm text-muted-foreground">Loading events…</p>}
      {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}
      {!isLoading && events.length === 0 && <EmptyState label="No events in this view."/>}

      <div className="grid gap-3">
        {events.map((e) => (<article key={e.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center">
            <div className="h-20 w-full overflow-hidden rounded-md bg-muted sm:h-16 sm:w-24 shrink-0">
              {e.image_url && (<img src={e.image_url} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async"/>)}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-semibold text-foreground truncate">{e.title}</h4>
                <EventStatusBadge status={e.status}/>
                {e.source && e.source !== "manual" && (<Badge variant="outline" className="text-[10px]">
                    {e.source}
                  </Badge>)}
              </div>
              <p className="text-xs text-muted-foreground">
                {e.venue_name ?? "—"} · {e.city}
                {e.neighborhood ? ` · ${e.neighborhood}` : ""} ·{" "}
                {new Date(e.starts_at).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant="outline" onClick={() => setDecision({
                eventId: e.id,
                label: e.title,
                kind: "approve",
            })} disabled={e.status === "published"}>
                <CheckCircle2 className="mr-1 h-3.5 w-3.5"/> Approve
              </Button>
              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDecision({
                eventId: e.id,
                label: e.title,
                kind: "reject",
            })} disabled={e.status === "rejected"}>
                <XCircle className="mr-1 h-3.5 w-3.5"/> Reject
              </Button>
            </div>
          </article>))}
      </div>

      <PaginationBar page={page} totalPages={totalPages} onPage={setPage}/>

      <ModerationDecideDialog open={!!decision} onOpenChange={(o) => !o && setDecision(null)} decision={decision?.kind ?? null} targetLabel={decision ? `event "${decision.label}"` : ""} pending={decideMut.isPending} onConfirm={(note) => decision &&
            decideMut.mutate({
                eventId: decision.eventId,
                decision: decision.kind,
                note: note || undefined,
            })}/>
    </div>);
}

function EventStatusBadge({ status }: {
    status: string;
}) {
    if (status === "published")
        return (<Badge className="bg-emerald-500/15 text-emerald-700">
        <CheckCircle2 className="mr-1 h-3 w-3"/> Approved
      </Badge>);
    if (status === "rejected")
        return (<Badge className="bg-destructive/15 text-destructive">
        <XCircle className="mr-1 h-3 w-3"/> Rejected
      </Badge>);
    return (<Badge className="bg-gold/20 text-foreground">
      <AlertTriangle className="mr-1 h-3 w-3"/> Pending
    </Badge>);
}

/* ============================== VENUES TAB ============================== */
type VenueStatus = "pending" | "approved" | "rejected" | "all";

const VENUE_TABS: {
    key: VenueStatus;
    label: string;
}[] = [
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
    { key: "all", label: "All" },
];

function VenuesModerationTab() {
    const [status, setStatus] = useState<VenueStatus>("pending");
    const [city, setCity] = useState("");
    const [category, setCategory] = useState("");
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const [decision, setDecision] = useState<{
        venueId: string;
        label: string;
        kind: "approve" | "reject";
    } | null>(null);
    const list = useServerFn(adminListVenuesForModeration);
    const decide = useServerFn(adminDecideVenue);
    const qc = useQueryClient();
    const { data, isLoading, error } = useQuery({
        queryKey: ["mod-venues", status, city, category, query, page],
        queryFn: () => list({
            data: {
                status,
                city: city.trim() || undefined,
                category: category.trim() || undefined,
                query: query.trim() || undefined,
                page,
                pageSize,
            },
        }),
    });
    const decideMut = useMutation({
        mutationFn: (vars: {
            venueId: string;
            decision: "approve" | "reject";
            note?: string;
        }) => decide({ data: vars }),
        onSuccess: (_d, v) => {
            toast.success(v.decision === "approve" ? "Venue approved" : "Venue rejected");
            qc.invalidateQueries({ queryKey: ["mod-venues"] });
            setDecision(null);
        },
        onError: (e: Error) => toast.error(e.message),
    });
    const venues = data?.venues ?? [];
    const total = data?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    return (<div className="space-y-4">
      <ModerationToolbar tabs={VENUE_TABS} active={status} onTab={(k) => {
            setStatus(k as VenueStatus);
            setPage(1);
        }} query={query} onQuery={(v) => {
            setQuery(v);
            setPage(1);
        }} city={city} onCity={(v) => {
            setCity(v);
            setPage(1);
        }} extra={<Input value={category} onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
            }} placeholder="Category…" className="h-9 w-32"/>} placeholder="Search by name or neighborhood…"/>

      {isLoading && <p className="text-sm text-muted-foreground">Loading venues…</p>}
      {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}
      {!isLoading && venues.length === 0 && <EmptyState label="No venues in this view."/>}

      <div className="grid gap-3">
        {venues.map((v) => {
            const img = v.hero_image_url ?? v.image_url ?? null;
            return (<article key={v.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center">
              <div className="h-20 w-full overflow-hidden rounded-md bg-muted sm:h-16 sm:w-24 shrink-0">
                {img && <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async"/>}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-semibold text-foreground truncate">{v.name}</h4>
                  <VenueStatusBadge verified={v.verified}/>
                  {v.category && (<Badge variant="outline" className="text-[10px] capitalize">
                      {v.category}
                    </Badge>)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {v.city ?? "—"}
                  {v.neighborhood ? ` · ${v.neighborhood}` : ""} · claim:{" "}
                  {v.claim_status ?? "unclaimed"}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={() => setDecision({
                    venueId: v.id,
                    label: v.name,
                    kind: "approve",
                })} disabled={!!v.verified}>
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5"/> Approve
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDecision({
                    venueId: v.id,
                    label: v.name,
                    kind: "reject",
                })}>
                  <XCircle className="mr-1 h-3.5 w-3.5"/> Reject
                </Button>
              </div>
            </article>);
        })}
      </div>

      <PaginationBar page={page} totalPages={totalPages} onPage={setPage}/>

      <ModerationDecideDialog open={!!decision} onOpenChange={(o) => !o && setDecision(null)} decision={decision?.kind ?? null} targetLabel={decision ? `venue "${decision.label}"` : ""} pending={decideMut.isPending} onConfirm={(note) => decision &&
            decideMut.mutate({
                venueId: decision.venueId,
                decision: decision.kind,
                note: note || undefined,
            })}/>
    </div>);
}

function VenueStatusBadge({ verified }: {
    verified: boolean | null;
}) {
    if (verified)
        return (<Badge className="bg-emerald-500/15 text-emerald-700">
        <CheckCircle2 className="mr-1 h-3 w-3"/> Approved
      </Badge>);
    return (<Badge className="bg-gold/20 text-foreground">
      <AlertTriangle className="mr-1 h-3 w-3"/> Pending
    </Badge>);
}

/* ============================ SHARED TOOLBAR ============================ */
function ModerationToolbar<T extends string>({ tabs, active, onTab, query, onQuery, city, onCity, extra, placeholder, }: {
    tabs: {
        key: T;
        label: string;
    }[];
    active: T;
    onTab: (k: T) => void;
    query: string;
    onQuery: (v: string) => void;
    city: string;
    onCity: (v: string) => void;
    extra?: React.ReactNode;
    placeholder: string;
}) {
    return (<div className="flex flex-wrap items-center gap-2">
      {tabs.map((t) => {
            const isActive = active === t.key;
            return (<button key={t.key} onClick={() => onTab(t.key)} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${isActive
                    ? "border-transparent bg-gradient-vibe text-primary-foreground shadow-pop"
                    : "border-border bg-card hover:bg-muted"}`}>
            {t.label}
          </button>);
        })}
      <div className="ml-auto flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"/>
          <Input value={query} onChange={(e) => onQuery(e.target.value)} placeholder={placeholder} className="h-9 w-64 pl-8"/>
        </div>
        <Input value={city} onChange={(e) => onCity(e.target.value)} placeholder="City…" className="h-9 w-28"/>
        {extra}
      </div>
    </div>);
}

function PaginationBar({ page, totalPages, onPage, }: {
    page: number;
    totalPages: number;
    onPage: (p: number) => void;
}) {
    if (totalPages <= 1)
        return null;
    const windowSize = 5;
    const half = Math.floor(windowSize / 2);
    let start = Math.max(1, page - half);
    let end = Math.min(totalPages, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);
    const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    return (<Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#" onClick={(e) => {
            e.preventDefault();
            if (page > 1)
                onPage(page - 1);
        }} aria-disabled={page <= 1} className={page <= 1 ? "pointer-events-none opacity-50" : ""}/>
        </PaginationItem>
        {pages.map((p) => (<PaginationItem key={p}>
            <PaginationLink href="#" isActive={p === page} onClick={(e) => {
                e.preventDefault();
                onPage(p);
            }}>
              {p}
            </PaginationLink>
          </PaginationItem>))}
        <PaginationItem>
          <PaginationNext href="#" onClick={(e) => {
            e.preventDefault();
            if (page < totalPages)
                onPage(page + 1);
        }} aria-disabled={page >= totalPages} className={page >= totalPages ? "pointer-events-none opacity-50" : ""}/>
        </PaginationItem>
      </PaginationContent>
    </Pagination>);
}

function EmptyState({ label }: {
    label: string;
}) {
    return (<div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
      {label}
    </div>);
}

/* ============================== REPORTS TAB ============================== */
function ReportsTab() {
    const { user } = useAuth();
    const adminEmail = user?.email ?? "admin";
    const [reports, setReports] = useState<Report[]>(SEED);
    const [tab, setTab] = useState<ReportStatus | "all">("pending");
    const [typeFilter, setTypeFilter] = useState<"all" | ItemType>("all");
    const [severityFilter, setSeverityFilter] = useState<"all" | Severity>("all");
    const [query, setQuery] = useState("");
    const counts = useMemo(() => ({
        pending: reports.filter((r) => r.status === "pending").length,
        approved: reports.filter((r) => r.status === "approved").length,
        removed: reports.filter((r) => r.status === "removed").length,
        all: reports.length,
    }), [reports]);
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return reports.filter((r) => {
            if (tab !== "all" && r.status !== tab)
                return false;
            if (typeFilter !== "all" && r.type !== typeFilter)
                return false;
            if (severityFilter !== "all" && r.severity !== severityFilter)
                return false;
            if (q) {
                const hay = `${r.id} ${r.target} ${r.reason} ${r.content} ${r.context} ${r.reporter}`.toLowerCase();
                if (!hay.includes(q))
                    return false;
            }
            return true;
        });
    }, [reports, tab, typeFilter, severityFilter, query]);
    const decideReport = (id: string, status: "approved" | "removed") => {
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
    const TABS: {
        key: "pending" | "approved" | "removed" | "all";
        label: string;
    }[] = [
        { key: "pending", label: "Pending" },
        { key: "approved", label: "Approved" },
        { key: "removed", label: "Removed" },
        { key: "all", label: "All" },
    ];
    return (<div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-3 shadow-card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by report ID, target, reason, or content…" className="pl-9"/>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => {
            const active = tab === t.key;
            return (<button key={t.key} onClick={() => setTab(t.key)} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${active
                    ? "border-transparent bg-gradient-vibe text-primary-foreground shadow-pop"
                    : "border-border bg-card hover:bg-muted"}`}>
              {t.label}
              <span className={`rounded-full px-1.5 text-[10px] ${active ? "bg-background/20" : "bg-muted"}`}>
                {counts[t.key]}
              </span>
            </button>);
        })}
        <div className="ml-auto flex items-center gap-2">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as "all" | ItemType)} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
            <option value="all">All types</option>
            <option value="review">Reviews</option>
            <option value="comment">Comments</option>
            <option value="venue">Venues</option>
            <option value="profile">Profiles</option>
          </select>
          <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value as "all" | Severity)} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
            <option value="all">All severities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (<EmptyState label="Nothing to moderate here. Inbox zero ✨"/>) : (<div className="grid gap-4 md:grid-cols-2">
          {filtered.map((r) => {
                const Icon = TYPE_ICON[r.type];
                return (<article key={r.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-card">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-muted">
                      <Icon className="h-4 w-4"/>
                    </div>
                    <div>
                      <div className="text-xs font-mono text-muted-foreground">{r.id}</div>
                      <div className="text-sm font-semibold capitalize">
                        {r.type} · {r.context}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${SEVERITY_TONE[r.severity]}`}>
                      {r.severity}
                    </span>
                    <ReportStatusBadge status={r.status}/>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-background/60 p-3 text-sm">
                  <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Flag className="h-3 w-3"/> {r.reason} · target:{" "}
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
                  <Button size="sm" variant="outline" disabled={r.status === "approved"} onClick={() => decideReport(r.id, "approved")}>
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5"/> Approve
                  </Button>
                  <Button size="sm" variant="ghost" disabled={r.status === "removed"} onClick={() => decideReport(r.id, "removed")} className="text-destructive hover:text-destructive">
                    <Trash2 className="mr-1 h-3.5 w-3.5"/> Remove
                  </Button>
                  <Button size="sm" variant="ghost" className="ml-auto">
                    <Eye className="mr-1 h-3.5 w-3.5"/> View context
                  </Button>
                </div>
              </article>);
            })}
        </div>)}
    </div>);
}
