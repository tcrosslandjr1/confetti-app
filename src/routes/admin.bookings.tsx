import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, CheckCircle2, Search, XCircle, Clock, Filter, Wine, Armchair, Eye } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/bookings")({
  component: AdminBookingsPage,
});

type Status = "pending" | "confirmed" | "cancelled";
type DrinkItem = { name: string; qty: number; notes?: string };
type Booking = {
  id: string;
  user_id: string;
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

const STATUS_TABS: { key: "all" | Status; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "cancelled", label: "Cancelled" },
];

function StatusBadge({ status }: { status: string }) {
  if (status === "confirmed")
    return <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20"><CheckCircle2 className="mr-1 h-3 w-3" />Confirmed</Badge>;
  if (status === "cancelled")
    return <Badge className="bg-destructive/15 text-destructive hover:bg-destructive/20"><XCircle className="mr-1 h-3 w-3" />Cancelled</Badge>;
  return <Badge className="bg-gold/20 text-foreground hover:bg-gold/30"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
}

function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | Status>("all");
  const [query, setQuery] = useState("");
  const [venueFilter, setVenueFilter] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bookings")
      .select("id,user_id,venue_name,starts_at,party_size,status,cancelled_at,notes,pre_order_drinks,seating_preference")
      .order("starts_at", { ascending: false });
    if (error) toast.error(error.message);
    const rows = (data ?? []) as Omit<Booking, "profiles">[];
    const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
    let profileMap = new Map<string, { display_name: string | null }>();
    if (userIds.length) {
      const { data: profs } = await supabase.from("profiles").select("id,display_name").in("id", userIds);
      profileMap = new Map((profs ?? []).map((p) => [p.id, { display_name: p.display_name }]));
    }
    setBookings(rows.map((r) => ({ ...r, profiles: profileMap.get(r.user_id) ?? null })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const venues = useMemo(() => Array.from(new Set(bookings.map((b) => b.venue_name))), [bookings]);

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
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
  }, [bookings, tab, venueFilter, query]);

  const counts = useMemo(
    () => ({
      all: bookings.length,
      pending: bookings.filter((b) => !b.cancelled_at && b.status === "pending").length,
      confirmed: bookings.filter((b) => !b.cancelled_at && b.status === "confirmed").length,
      cancelled: bookings.filter((b) => b.cancelled_at || b.status === "cancelled").length,
    }),
    [bookings],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Operations</p>
          <h1 className="font-display text-3xl font-bold leading-tight flex items-center gap-2">
            <CalendarCheck className="h-7 w-7" /> Bookings
          </h1>
          <p className="text-sm text-muted-foreground inline-flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" /> Monitor only — venues receive notifications and manage their own bookings.
          </p>
        </div>
      </header>

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
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Booking</TableHead>
              <TableHead>Guest</TableHead>
              <TableHead>Venue</TableHead>
              <TableHead>When</TableHead>
              <TableHead>Party</TableHead>
              <TableHead>Pre-arrival</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">Loading…</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                  No bookings match your filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((b) => {
                const dt = new Date(b.starts_at);
                const status = b.cancelled_at ? "cancelled" : b.status;
                return (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono text-xs">{b.id.slice(0, 8)}</TableCell>
                    <TableCell>
                      <div className="font-semibold">{b.profiles?.display_name ?? "Guest"}</div>
                      <div className="text-xs text-muted-foreground font-mono">{b.user_id.slice(0, 8)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold">{b.venue_name}</div>
                      {b.notes && <div className="text-xs text-muted-foreground line-clamp-1">{b.notes}</div>}
                    </TableCell>
                    <TableCell className="text-sm">
                      {dt.toLocaleDateString()}
                      <div className="text-xs text-muted-foreground">{dt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</div>
                    </TableCell>
                    <TableCell>{b.party_size}</TableCell>
                    <TableCell className="max-w-[260px]">
                      {(() => {
                        const drinks = Array.isArray(b.pre_order_drinks) ? b.pre_order_drinks : [];
                        if (drinks.length === 0 && !b.seating_preference) {
                          return <span className="text-xs text-muted-foreground">—</span>;
                        }
                        return (
                          <div className="space-y-1 text-xs">
                            {drinks.length > 0 && (
                              <div className="flex items-start gap-1">
                                <Wine className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                                <span>{drinks.map((d) => `${d.qty}× ${d.name}${d.notes ? ` (${d.notes})` : ""}`).join(", ")}</span>
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
                    <TableCell><StatusBadge status={status} /></TableCell>
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
