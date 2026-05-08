import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, MapPin, Users, Clock, X, Plus, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/bookings")({
  component: PortalBookingsPage,
});

type Venue = { id: string; name: string; category: string; neighborhood: string | null; price_level: number; image_url: string | null };
type Booking = {
  id: string;
  venue_id: string | null;
  venue_name: string;
  starts_at: string;
  party_size: number;
  status: string;
  notes: string | null;
  cancelled_at: string | null;
};

function PortalBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    supabase
      .from("bookings")
      .select("*")
      .order("starts_at", { ascending: false })
      .then(({ data }) => {
        setBookings((data as Booking[]) ?? []);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
    supabase.from("venues").select("id,name,category,neighborhood,price_level,image_url").order("name").then(({ data }) => {
      setVenues((data as Venue[]) ?? []);
    });
  }, []);

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    const up: Booking[] = [];
    const ps: Booking[] = [];
    bookings.forEach((b) => {
      if (b.cancelled_at || new Date(b.starts_at).getTime() < now) ps.push(b);
      else up.push(b);
    });
    up.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
    return { upcoming: up, past: ps };
  }, [bookings]);

  const cancel = async (id: string) => {
    const { error } = await supabase.from("bookings").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Booking cancelled"); load(); }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">My Portal</p>
          <h1 className="mt-1 flex items-center gap-2 font-display text-4xl font-bold"><CalendarCheck className="h-8 w-8" /> Bookings</h1>
          <p className="mt-2 text-muted-foreground">Reserve a venue, manage upcoming nights, and revisit past trips.</p>
        </div>
        <BookDialog venues={venues} userId={user?.id} onBooked={load} />
      </header>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : bookings.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
          <CalendarCheck className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-3 font-display text-2xl font-bold">No bookings yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">Pick a venue and reserve your first table.</p>
        </div>
      ) : (
        <>
          <Group title="Upcoming" rows={upcoming} onCancel={cancel} />
          <Group title="Past" rows={past} muted />
        </>
      )}
    </div>
  );
}

function Group({ title, rows, onCancel, muted }: { title: string; rows: Booking[]; onCancel?: (id: string) => void; muted?: boolean }) {
  if (rows.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 font-display text-2xl font-bold">{title} <span className="rounded-full bg-muted px-2 py-0.5 text-sm font-semibold text-muted-foreground">{rows.length}</span></h2>
      <ul className={`grid gap-3 sm:grid-cols-2 ${muted ? "opacity-80" : ""}`}>
        {rows.map((b) => <BookingCard key={b.id} b={b} onCancel={onCancel} />)}
      </ul>
    </section>
  );
}

function BookingCard({ b, onCancel }: { b: Booking; onCancel?: (id: string) => void }) {
  const dt = new Date(b.starts_at);
  const cancelled = !!b.cancelled_at || b.status === "cancelled";
  return (
    <li className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-bold">{b.venue_name}</h3>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{dt.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
            <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />Party of {b.party_size}</span>
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
          cancelled ? "bg-destructive/15 text-destructive" : b.status === "confirmed" ? "bg-emerald-500/15 text-emerald-700" : "bg-gold/20 text-foreground"
        }`}>{cancelled ? "Cancelled" : b.status}</span>
      </div>
      {b.notes && <p className="mt-2 text-sm text-muted-foreground">{b.notes}</p>}
      {!cancelled && onCancel && (
        <Button variant="ghost" size="sm" className="mt-3 text-destructive hover:text-destructive" onClick={() => onCancel(b.id)}>
          <X className="mr-1 h-3.5 w-3.5" /> Cancel reservation
        </Button>
      )}
    </li>
  );
}

function BookDialog({ venues, userId, onBooked }: { venues: Venue[]; userId?: string; onBooked: () => void }) {
  const [open, setOpen] = useState(false);
  const [venueId, setVenueId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("19:00");
  const [party, setParty] = useState(2);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!userId) return;
    const venue = venues.find((v) => v.id === venueId);
    if (!venue || !date || !time) { toast.error("Please pick a venue, date, and time"); return; }
    setSubmitting(true);
    const startsAt = new Date(`${date}T${time}:00`).toISOString();
    const { error } = await supabase.from("bookings").insert({
      user_id: userId,
      venue_id: venue.id,
      venue_name: venue.name,
      starts_at: startsAt,
      party_size: party,
      status: "pending",
      notes: notes || null,
    });
    setSubmitting(false);
    if (error) toast.error(error.message);
    else {
      toast.success(`Booked ${venue.name} ✓`, { icon: <CheckCircle2 className="h-4 w-4" /> });
      setOpen(false);
      setVenueId(""); setDate(""); setNotes("");
      onBooked();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Plus className="h-4 w-4" /> New booking</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="font-display text-2xl">Reserve a table</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Venue</Label>
            <select value={venueId} onChange={(e) => setVenueId(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
              <option value="">Choose a venue…</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>{v.name}{v.neighborhood ? ` — ${v.neighborhood}` : ""}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div><Label>Time</Label><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
          </div>
          <div>
            <Label>Party size</Label>
            <Input type="number" min={1} max={20} value={party} onChange={(e) => setParty(parseInt(e.target.value) || 1)} />
          </div>
          <div>
            <Label>Notes (optional)</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Allergies, occasion, requests…" />
          </div>
          <Button onClick={submit} disabled={submitting} className="w-full">{submitting ? "Booking…" : "Confirm booking"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
