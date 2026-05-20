import { createLazyFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  Search,
  XCircle,
  Clock,
  Filter,
  Wine,
  Armchair,
  Eye,
  Mail,
  Loader2,
  Download,
  ArrowUpDown,
  RefreshCw,
  Send,
  Users,
  TrendingUp,
  AlertTriangle,
  Radio,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { resolveVenueNotificationEmail } from "@/lib/booking-notifications.functions";

export const Route = createLazyFileRoute("/admin/bookings")({
  component: AdminBookingsPage,
});

type Status = "pending" | "confirmed" | "cancelled";
type DateRange = "today" | "7d" | "30d" | "all";
type SortKey = "starts_at" | "party_size" | "venue_name";
type SortDir = "asc" | "desc";

type DrinkItem = { name: string; qty: number; notes?: string };

type Booking = {
  id: string;
  user_id: string;
  venue_id: string | null;
  venue_name: string;
  starts_at: string;
  party_size: number;
  status: string;
  cancelled_at: string | null;
  notes: string | null;
  pre_order_drinks: DrinkItem[] | null;
  seating_preference: string | null;
  profiles: { display_name: string | null } | null;
};

type Routing = { email: string | null; source: string; venueName: string | null };

type Delivery = {
  id: string;
  booking_id: string | null;
  recipient_email: string | null;
  source: string;
  status: string;
  error: string | null;
  subject: string | null;
  created_at: string;
};

const SOURCE_LABEL: Record<string, string> = {
  venue_staff_email: "Venue staff email",
  linked_advertiser: "Linked advertiser",
  ops_fallback: "Ops fallback",
  unresolved: "Unresolved",
};

const SOURCE_BADGE: Record<string, string> = {
  venue_staff_email: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  linked_advertiser: "bg-sky-500/15 text-sky-700 border-sky-500/30",
  ops_fallback: "bg-amber-500/15 text-amber-700 border-amber-500/30",
};

const STATUS_TABS: { key: "all" | Status; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "cancelled", label: "Cancelled" },
];

const RANGE_TABS: { key: DateRange; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "all", label: "All time" },
];

function StatusBadge({ status }: { status: string }) {
  if (status === "confirmed")
    return (
      <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20">
        <CheckCircle2 className="mr-1 h-3 w-3" /> Confirmed
      </Badge>
    );
  if (status === "cancelled")
    return (
      <Badge className="bg-destructive/15 text-destructive hover:bg-destructive/20">
        <XCircle className="mr-1 h-3 w-3" /> Cancelled
      </Badge>
    );
  return (
    <Badge className="bg-gold/20 text-foreground hover:bg-gold/30">
      <Clock className="mr-1 h-3 w-3" /> Pending
    </Badge>
  );
}

function NotificationRoutingCell({
  venueId,
  cache,
  resolve,
}: {
  venueId: string | null;
  cache: Map<string, Routing | null>;
  resolve: (id: string) => Promise<Routing | null>;
}) {
  const [routing, setRouting] = useState<Routing | null | undefined>(
    venueId ? cache.get(venueId) : null,
  );
  useEffect(() => {
    let cancelled = false;
    if (!venueId) return setRouting(null);
    if (cache.has(venueId)) return setRouting(cache.get(venueId));
    setRouting(undefined);
    resolve(venueId).then((r) => {
      if (!cancelled) setRouting(r);
    });
    return () => {
      cancelled = true;
    };
  }, [venueId, cache, resolve]);
  if (!venueId)
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Mail className="h-3 w-3" /> Ops fallback
      </span>
    );
  if (routing === undefined)
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" /> Resolving…
      </span>
    );
  if (!routing?.email)
    return <span className="text-xs text-destructive">Unresolved</span>;
  return (
    <div className="space-y-1">
      <div className="font-mono text-xs">{routing.email}</div>
      <span
        className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] ${
          SOURCE_BADGE[routing.source] ??
          "border-border bg-muted text-muted-foreground"
        }`}
      >
        {SOURCE_LABEL[routing.source] ?? routing.source}
      </span>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
  tone?: "default" | "positive" | "warning" | "danger";
}) {
  const toneClass =
    tone === "positive"
      ? "from-emerald-500/15 to-emerald-500/5 text-emerald-700"
      : tone === "warning"
        ? "from-gold/30 to-gold/5 text-foreground"
        : tone === "danger"
          ? "from-destructive/15 to-destructive/5 text-destructive"
          : "from-primary/10 to-primary/0 text-foreground";
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-start justify-between">
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <div
          className={`rounded-lg bg-gradient-to-br p-1.5 ${toneClass}`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 font-display text-2xl font-bold leading-none">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function rangeStart(range: DateRange): Date | null {
  const now = new Date();
  if (range === "all") return null;
  if (range === "today") {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const d = new Date(now);
  d.setDate(d.getDate() - (range === "7d" ? 7 : 30));
  return d;
}

function toCsv(rows: Booking[]): string {
  const headers = [
    "id",
    "guest",
    "user_id",
    "venue",
    "venue_id",
    "starts_at",
    "party_size",
    "status",
    "notes",
    "seating_preference",
    "pre_order_drinks",
  ];
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = rows.map((b) =>
    [
      b.id,
      b.profiles?.display_name ?? "",
      b.user_id,
      b.venue_name,
      b.venue_id ?? "",
      b.starts_at,
      b.party_size,
      b.cancelled_at ? "cancelled" : b.status,
      b.notes ?? "",
      b.seating_preference ?? "",
      JSON.stringify(b.pre_order_drinks ?? []),
    ]
      .map(escape)
      .join(","),
  );
  return [headers.join(","), ...lines].join("\n");
}

function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | Status>("all");
  const [range, setRange] = useState<DateRange>("7d");
  const [query, setQuery] = useState("");
  const [venueFilter, setVenueFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("starts_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<Booking | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [deliveriesLoading, setDeliveriesLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [liveOn, setLiveOn] = useState(true);

  const resolveEmail = useServerFn(resolveVenueNotificationEmail);
  const routingCacheRef = useRef(new Map<string, Routing | null>());
  const inFlightRef = useRef(new Map<string, Promise<Routing | null>>());

  const resolveRouting = useMemo(
    () => (venueId: string) => {
      const cache = routingCacheRef.current;
      if (cache.has(venueId))
        return Promise.resolve(cache.get(venueId) ?? null);
      const inflight = inFlightRef.current.get(venueId);
      if (inflight) return inflight;
      const p = resolveEmail({ data: { venueId } })
        .then((r) => {
          const result = (r as Routing | null) ?? null;
          cache.set(venueId, result);
          inFlightRef.current.delete(venueId);
          return result;
        })
        .catch(() => {
          cache.set(venueId, null);
          inFlightRef.current.delete(venueId);
          return null;
        });
      inFlightRef.current.set(venueId, p);
      return p;
    },
    [resolveEmail],
  );

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bookings")
      .select(
        "id,user_id,venue_id,venue_name,starts_at,party_size,status,cancelled_at,notes,pre_order_drinks,seating_preference",
      )
      .order("starts_at", { ascending: false });
    if (error) toast.error(error.message);
    const rows = (data ?? []) as Omit<Booking, "profiles">[];
    const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
    let profileMap = new Map<string, { display_name: string | null }>();
    if (userIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id,display_name")
        .in("id", userIds);
      profileMap = new Map(
        (profs ?? []).map((p) => [p.id, { display_name: p.display_name }]),
      );
    }
    setBookings(
      rows.map((r) => ({ ...r, profiles: profileMap.get(r.user_id) ?? null })),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Realtime subscription
  useEffect(() => {
    if (!liveOn) return;
    const ch = supabase
      .channel("admin-bookings-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        (payload) => {
          void load();
          if (payload.eventType === "INSERT") {
            const row = payload.new as Booking;
            toast.success("New booking", {
              description: `${row.venue_name} · party of ${row.party_size}`,
            });
          }
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [liveOn, load]);

  // Load deliveries for selected booking
  useEffect(() => {
    if (!selected) {
      setDeliveries([]);
      return;
    }
    let cancelled = false;
    setDeliveriesLoading(true);
    supabase
      .from("booking_notification_deliveries")
      .select(
        "id,booking_id,recipient_email,source,status,error,subject,created_at",
      )
      .eq("booking_id", selected.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) toast.error("Couldn't load notification log");
        else setDeliveries((data as Delivery[]) ?? []);
        setDeliveriesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selected]);

  const venues = useMemo(
    () => Array.from(new Set(bookings.map((b) => b.venue_name))).sort(),
    [bookings],
  );

  const rangeFiltered = useMemo(() => {
    const start = rangeStart(range);
    if (!start) return bookings;
    return bookings.filter((b) => new Date(b.starts_at) >= start);
  }, [bookings, range]);

  const filtered = useMemo(() => {
    const list = rangeFiltered.filter((b) => {
      const status = b.cancelled_at ? "cancelled" : b.status;
      if (tab !== "all" && status !== tab) return false;
      if (venueFilter !== "all" && b.venue_name !== venueFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        const guest = b.profiles?.display_name ?? "";
        if (
          !guest.toLowerCase().includes(q) &&
          !b.id.toLowerCase().includes(q) &&
          !b.venue_name.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
    const dir = sortDir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      if (sortKey === "party_size") return (a.party_size - b.party_size) * dir;
      if (sortKey === "venue_name")
        return a.venue_name.localeCompare(b.venue_name) * dir;
      return (
        (new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()) * dir
      );
    });
  }, [rangeFiltered, tab, venueFilter, query, sortKey, sortDir]);

  const counts = useMemo(
    () => ({
      all: rangeFiltered.length,
      pending: rangeFiltered.filter(
        (b) => !b.cancelled_at && b.status === "pending",
      ).length,
      confirmed: rangeFiltered.filter(
        (b) => !b.cancelled_at && b.status === "confirmed",
      ).length,
      cancelled: rangeFiltered.filter(
        (b) => b.cancelled_at || b.status === "cancelled",
      ).length,
    }),
    [rangeFiltered],
  );

  const kpis = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setDate(todayEnd.getDate() + 1);
    const todayCovers = rangeFiltered
      .filter((b) => {
        const d = new Date(b.starts_at);
        return d >= today && d < todayEnd && !b.cancelled_at;
      })
      .reduce((sum, b) => sum + b.party_size, 0);
    const totalCovers = rangeFiltered
      .filter((b) => !b.cancelled_at)
      .reduce((sum, b) => sum + b.party_size, 0);
    const avg =
      rangeFiltered.length === 0
        ? 0
        : Math.round(
            (rangeFiltered.reduce((s, b) => s + b.party_size, 0) /
              rangeFiltered.length) *
              10,
          ) / 10;
    const cancelRate =
      rangeFiltered.length === 0
        ? 0
        : Math.round((counts.cancelled / rangeFiltered.length) * 100);
    return { todayCovers, totalCovers, avg, cancelRate };
  }, [rangeFiltered, counts]);

  const trend = useMemo(() => {
    const days = range === "today" ? 1 : range === "7d" ? 7 : range === "30d" ? 30 : 30;
    const buckets: { date: string; bookings: number; covers: number }[] = [];
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(end);
      d.setDate(end.getDate() - i);
      buckets.push({
        date: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        bookings: 0,
        covers: 0,
      });
    }
    const startMs = new Date(end);
    startMs.setDate(end.getDate() - (days - 1));
    rangeFiltered.forEach((b) => {
      const d = new Date(b.starts_at);
      d.setHours(0, 0, 0, 0);
      const idx = Math.floor(
        (d.getTime() - startMs.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (idx >= 0 && idx < days) {
        buckets[idx].bookings += 1;
        if (!b.cancelled_at) buckets[idx].covers += b.party_size;
      }
    });
    return buckets;
  }, [rangeFiltered, range]);

  const exportCsv = () => {
    const csv = toCsv(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} bookings`);
  };

  const updateStatus = async (b: Booking, next: "confirmed" | "cancelled") => {
    setActionId(b.id);
    try {
      const patch =
        next === "cancelled"
          ? { status: "cancelled", cancelled_at: new Date().toISOString() }
          : { status: "confirmed", cancelled_at: null };
      const { error } = await supabase
        .from("bookings")
        .update(patch)
        .eq("id", b.id);
      if (error) throw error;
      toast.success(`Booking ${next}`);
      setBookings((rows) =>
        rows.map((r) => (r.id === b.id ? { ...r, ...patch } : r)),
      );
      if (selected?.id === b.id) setSelected({ ...b, ...patch });
    } catch (e) {
      toast.error("Update failed", { description: (e as Error).message });
    } finally {
      setActionId(null);
    }
  };

  const resendNotification = async (b: Booking) => {
    setActionId(b.id);
    try {
      const routing = b.venue_id ? await resolveRouting(b.venue_id) : null;
      const recipient = routing?.email ?? null;
      const source = routing?.source ?? "ops_fallback";
      const starts = new Date(b.starts_at);
      const subject = `Booking notification — ${b.venue_name} (retry)`;
      const body = `Party of ${b.party_size} on ${starts.toLocaleString()}`;
      const { error } = await supabase
        .from("booking_notification_deliveries")
        .insert({
          booking_id: b.id,
          venue_id: b.venue_id,
          venue_name: b.venue_name,
          recipient_email: recipient,
          source,
          channel: "email",
          status: recipient ? "sent" : "failed",
          error: recipient ? null : "No recipient resolved on retry",
          subject,
          body,
          test: false,
        });
      if (error) throw error;
      if (recipient) {
        toast.success(`Resent to ${recipient}`, { description: `Via ${source}.` });
      } else {
        toast.error("Resend failed", {
          description: "No recipient could be resolved.",
        });
      }
      // refresh deliveries
      if (selected?.id === b.id) {
        const { data } = await supabase
          .from("booking_notification_deliveries")
          .select(
            "id,booking_id,recipient_email,source,status,error,subject,created_at",
          )
          .eq("booking_id", b.id)
          .order("created_at", { ascending: false });
        setDeliveries((data as Delivery[]) ?? []);
      }
    } catch (e) {
      toast.error("Resend failed", { description: (e as Error).message });
    } finally {
      setActionId(null);
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Operations
          </p>
          <h1 className="font-display text-3xl font-bold leading-tight flex items-center gap-2">
            <CalendarCheck className="h-7 w-7" /> Bookings
          </h1>
          <p className="text-sm text-muted-foreground inline-flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" /> Live monitor — venues receive
            notifications and manage their own bookings.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setLiveOn((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              liveOn
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700"
                : "border-border bg-card text-muted-foreground"
            }`}
          >
            <Radio
              className={`h-3 w-3 ${liveOn ? "animate-pulse" : ""}`}
            />
            {liveOn ? "Live" : "Paused"}
          </button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
        </div>
      </header>

      {/* Date range */}
      <div className="flex flex-wrap items-center gap-2">
        {RANGE_TABS.map((t) => {
          const active = range === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setRange(t.key)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-muted"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          label="Total bookings"
          value={counts.all}
          icon={CalendarCheck}
          hint={`${kpis.totalCovers} covers`}
        />
        <KpiCard
          label="Today"
          value={kpis.todayCovers}
          icon={Users}
          hint="covers booked today"
          tone="positive"
        />
        <KpiCard
          label="Pending"
          value={counts.pending}
          icon={Clock}
          hint="awaiting confirmation"
          tone="warning"
        />
        <KpiCard
          label="Cancel rate"
          value={`${kpis.cancelRate}%`}
          icon={AlertTriangle}
          hint={`${counts.cancelled} cancelled · avg party ${kpis.avg}`}
          tone={kpis.cancelRate > 20 ? "danger" : "default"}
        />
      </div>

      {/* Trend chart */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Booking trend</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Bookings & covers per day
          </p>
        </div>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={trend}
              margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gBookings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gCovers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--gold))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--gold))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <RTooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="covers"
                stroke="hsl(var(--gold))"
                strokeWidth={2}
                fill="url(#gCovers)"
              />
              <Area
                type="monotone"
                dataKey="bookings"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#gBookings)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Status tabs */}
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
              <span
                className={`rounded-full px-1.5 text-[10px] ${
                  active ? "bg-background/20" : "bg-muted"
                }`}
              >
                {counts[t.key]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3 shadow-card">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search guest, venue, or booking ID…"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={venueFilter}
            onChange={(e) => setVenueFilter(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="all">All venues</option>
            {venues.map((v) => (
              <option key={v} value={v}>
                {v}
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
              <TableHead>Booking</TableHead>
              <TableHead>Guest</TableHead>
              <TableHead>
                <button
                  className="inline-flex items-center gap-1 hover:text-foreground"
                  onClick={() => toggleSort("venue_name")}
                >
                  Venue <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="inline-flex items-center gap-1 hover:text-foreground"
                  onClick={() => toggleSort("starts_at")}
                >
                  When <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="inline-flex items-center gap-1 hover:text-foreground"
                  onClick={() => toggleSort("party_size")}
                >
                  Party <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>Pre-arrival</TableHead>
              <TableHead>Notify</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                  Loading bookings…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  No bookings match your filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((b) => {
                const dt = new Date(b.starts_at);
                const status = b.cancelled_at ? "cancelled" : b.status;
                return (
                  <TableRow
                    key={b.id}
                    className="cursor-pointer transition hover:bg-muted/50"
                    onClick={() => setSelected(b)}
                  >
                    <TableCell className="font-mono text-xs">
                      {b.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold">
                        {b.profiles?.display_name ?? "Guest"}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {b.user_id.slice(0, 8)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold">{b.venue_name}</div>
                      {b.notes && (
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {b.notes}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {dt.toLocaleDateString()}
                      <div className="text-xs text-muted-foreground">
                        {dt.toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                    </TableCell>
                    <TableCell>{b.party_size}</TableCell>
                    <TableCell className="max-w-[260px]">
                      {(() => {
                        const drinks = Array.isArray(b.pre_order_drinks)
                          ? b.pre_order_drinks
                          : [];
                        if (drinks.length === 0 && !b.seating_preference) {
                          return (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          );
                        }
                        return (
                          <div className="space-y-1 text-xs">
                            {drinks.length > 0 && (
                              <div className="flex items-start gap-1">
                                <Wine className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                                <span>
                                  {drinks
                                    .map(
                                      (d) =>
                                        `${d.qty}× ${d.name}${
                                          d.notes ? ` (${d.notes})` : ""
                                        }`,
                                    )
                                    .join(", ")}
                                </span>
                              </div>
                            )}
                            {b.seating_preference && (
                              <div className="flex items-start gap-1">
                                <Armchair className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                                <span>{b.seating_preference}</span>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <NotificationRoutingCell
                        venueId={b.venue_id}
                        cache={routingCacheRef.current}
                        resolve={resolveRouting}
                      />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={status} />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <CalendarCheck className="h-5 w-5" />
                  {selected.venue_name}
                </SheetTitle>
                <SheetDescription>
                  Booking{" "}
                  <span className="font-mono">{selected.id.slice(0, 8)}</span> ·{" "}
                  <StatusBadge
                    status={
                      selected.cancelled_at ? "cancelled" : selected.status
                    }
                  />
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-5">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">
                      Guest
                    </p>
                    <p className="font-semibold">
                      {selected.profiles?.display_name ?? "Guest"}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {selected.user_id.slice(0, 8)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">
                      When
                    </p>
                    <p className="font-semibold">
                      {new Date(selected.starts_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">
                      Party size
                    </p>
                    <p className="font-semibold">{selected.party_size}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">
                      Seating
                    </p>
                    <p className="font-semibold">
                      {selected.seating_preference ?? "—"}
                    </p>
                  </div>
                </div>

                {selected.notes && (
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">
                      Notes
                    </p>
                    <p className="mt-1 rounded-md bg-muted/50 p-2 text-sm">
                      {selected.notes}
                    </p>
                  </div>
                )}

                {Array.isArray(selected.pre_order_drinks) &&
                  selected.pre_order_drinks.length > 0 && (
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">
                        Pre-order drinks
                      </p>
                      <ul className="mt-1 space-y-1 text-sm">
                        {selected.pre_order_drinks.map((d, i) => (
                          <li
                            key={i}
                            className="flex items-center gap-2 rounded-md bg-muted/40 px-2 py-1"
                          >
                            <Wine className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-medium">
                              {d.qty}× {d.name}
                            </span>
                            {d.notes && (
                              <span className="text-xs text-muted-foreground">
                                · {d.notes}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                <Separator />

                {/* Ops actions */}
                <div>
                  <p className="text-xs uppercase text-muted-foreground">
                    Ops actions
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => updateStatus(selected, "confirmed")}
                      disabled={
                        actionId === selected.id ||
                        (selected.status === "confirmed" &&
                          !selected.cancelled_at)
                      }
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updateStatus(selected, "cancelled")}
                      disabled={
                        actionId === selected.id || !!selected.cancelled_at
                      }
                    >
                      <XCircle className="h-3.5 w-3.5" /> Cancel
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resendNotification(selected)}
                      disabled={actionId === selected.id}
                    >
                      {actionId === selected.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      Resend notification
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Notification timeline */}
                <div>
                  <p className="text-xs uppercase text-muted-foreground">
                    Notification timeline
                  </p>
                  <ScrollArea className="mt-2 max-h-64 rounded-md border border-border">
                    {deliveriesLoading ? (
                      <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                      </div>
                    ) : deliveries.length === 0 ? (
                      <div className="p-3 text-sm text-muted-foreground">
                        No notification attempts yet.
                      </div>
                    ) : (
                      <ul className="divide-y divide-border">
                        {deliveries.map((d) => (
                          <li key={d.id} className="p-3 text-sm">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                                    d.status === "sent"
                                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                                      : d.status === "failed"
                                        ? "border-destructive/30 bg-destructive/10 text-destructive"
                                        : d.status === "skipped"
                                          ? "border-border bg-muted text-muted-foreground"
                                          : "border-amber-500/30 bg-amber-500/10 text-amber-700"
                                  }`}
                                >
                                  {d.status}
                                </span>
                                <span className="font-mono text-xs">
                                  {d.recipient_email ?? "—"}
                                </span>
                              </div>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(d.created_at).toLocaleString()}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {SOURCE_LABEL[d.source] ?? d.source}
                              {d.error ? ` · ${d.error}` : ""}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </ScrollArea>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
