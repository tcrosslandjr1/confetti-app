import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarCheck, CheckCircle2, Search, XCircle, Clock, Filter } from "lucide-react";
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
import { toast } from "sonner";
import { logAudit } from "@/lib/audit-log";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/admin/bookings")({
  component: AdminBookingsPage,
});

type Status = "pending" | "confirmed" | "cancelled";
type Booking = {
  id: string;
  guest: string;
  email: string;
  venue: string;
  neighborhood: string;
  date: string;
  time: string;
  party: number;
  status: Status;
};

const SEED: Booking[] = [
  { id: "BK-1042", guest: "Sarah Klein", email: "sarah@k.co", venue: "Maydan", neighborhood: "14th St", date: "2026-05-12", time: "19:30", party: 4, status: "pending" },
  { id: "BK-1041", guest: "Marcus Tate", email: "m.tate@mail.com", venue: "Albi", neighborhood: "Navy Yard", date: "2026-05-11", time: "20:00", party: 2, status: "confirmed" },
  { id: "BK-1040", guest: "Priya Rao", email: "priya@r.io", venue: "Le Diplomate", neighborhood: "Logan Circle", date: "2026-05-11", time: "18:45", party: 6, status: "pending" },
  { id: "BK-1039", guest: "Jordan Liu", email: "jliu@mail.com", venue: "Rose's Luxury", neighborhood: "Barracks Row", date: "2026-05-10", time: "21:15", party: 3, status: "cancelled" },
  { id: "BK-1038", guest: "Ana Ferreira", email: "ana.f@mail.com", venue: "Bresca", neighborhood: "14th St", date: "2026-05-10", time: "19:00", party: 2, status: "confirmed" },
  { id: "BK-1037", guest: "Devon Hale", email: "devon@h.dev", venue: "Maydan", neighborhood: "14th St", date: "2026-05-09", time: "20:30", party: 5, status: "pending" },
  { id: "BK-1036", guest: "Mia Chen", email: "mia@c.co", venue: "Albi", neighborhood: "Navy Yard", date: "2026-05-09", time: "18:00", party: 2, status: "confirmed" },
  { id: "BK-1035", guest: "Tomas Reid", email: "tomas@r.dev", venue: "Le Diplomate", neighborhood: "Logan Circle", date: "2026-05-08", time: "19:45", party: 4, status: "cancelled" },
];

const STATUS_TABS: { key: "all" | Status; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "cancelled", label: "Cancelled" },
];

function StatusBadge({ status }: { status: Status }) {
  if (status === "confirmed")
    return <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20"><CheckCircle2 className="mr-1 h-3 w-3" />Confirmed</Badge>;
  if (status === "cancelled")
    return <Badge className="bg-destructive/15 text-destructive hover:bg-destructive/20"><XCircle className="mr-1 h-3 w-3" />Cancelled</Badge>;
  return <Badge className="bg-gold/20 text-foreground hover:bg-gold/30"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
}

function AdminBookingsPage() {
  const { user } = useAuth();
  const adminEmail = user?.email ?? "admin";
  const [bookings, setBookings] = useState<Booking[]>(SEED);
  const [tab, setTab] = useState<"all" | Status>("all");
  const [query, setQuery] = useState("");
  const [venueFilter, setVenueFilter] = useState<string>("all");

  const venues = useMemo(() => Array.from(new Set(SEED.map((b) => b.venue))), []);

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (tab !== "all" && b.status !== tab) return false;
      if (venueFilter !== "all" && b.venue !== venueFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        if (
          !b.guest.toLowerCase().includes(q) &&
          !b.email.toLowerCase().includes(q) &&
          !b.id.toLowerCase().includes(q) &&
          !b.venue.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [bookings, tab, venueFilter, query]);

  const counts = useMemo(
    () => ({
      all: bookings.length,
      pending: bookings.filter((b) => b.status === "pending").length,
      confirmed: bookings.filter((b) => b.status === "confirmed").length,
      cancelled: bookings.filter((b) => b.status === "cancelled").length,
    }),
    [bookings],
  );

  const updateStatus = (id: string, status: Status) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    const action = status === "confirmed" ? "Confirmed" : "Cancelled";
    toast.success(`${action} ${id}`);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Operations</p>
          <h1 className="font-display text-3xl font-bold leading-tight flex items-center gap-2">
            <CalendarCheck className="h-7 w-7" /> Bookings
          </h1>
          <p className="text-sm text-muted-foreground">Review, confirm, or cancel reservations across venues.</p>
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
            placeholder="Search guest, email, venue, or booking ID…"
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
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                  No bookings match your filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-mono text-xs">{b.id}</TableCell>
                  <TableCell>
                    <div className="font-semibold">{b.guest}</div>
                    <div className="text-xs text-muted-foreground">{b.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold">{b.venue}</div>
                    <div className="text-xs text-muted-foreground">{b.neighborhood}</div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {b.date}
                    <div className="text-xs text-muted-foreground">{b.time}</div>
                  </TableCell>
                  <TableCell>{b.party}</TableCell>
                  <TableCell><StatusBadge status={b.status} /></TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={b.status === "confirmed"}
                        onClick={() => updateStatus(b.id, "confirmed")}
                      >
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={b.status === "cancelled"}
                        onClick={() => updateStatus(b.id, "cancelled")}
                        className="text-destructive hover:text-destructive"
                      >
                        <XCircle className="mr-1 h-3.5 w-3.5" /> Cancel
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
