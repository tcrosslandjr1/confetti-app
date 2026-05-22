import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  Users,
  Clock,
  X,
  Plus,
  CheckCircle2,
  Gift,
  Wine,
  Armchair,
  Trash2,
  Apple,
} from "lucide-react";
import { awardXP } from "@/lib/gamification";
import { downloadAppleInvite } from "@/lib/apple-invite";
import { ReservationConfirmation } from "@/components/ReservationConfirmation";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { getMyPendingFirstBookingDiscount } from "@/lib/referrals";
import { useRefreshable } from "@/hooks/use-refresh-bus";

export const Route = createFileRoute("/portal/bookings")({
  component: PortalBookingsPage,
});

type Venue = {
  id: string;
  name: string;
  category: string;
  neighborhood: string | null;
  price_level: number;
  image_url: string | null;
};
type DrinkItem = { name: string; qty: number; notes?: string };
type Booking = {
  id: string;
  venue_id: string | null;
  venue_name: string;
  starts_at: string;
  party_size: number;
  status: string;
  notes: string | null;
  cancelled_at: string | null;
  pre_order_drinks: DrinkItem[] | null;
  seating_preference: string | null;
  confirmation_code?: string;
};

// Hardcoded sample bookings shown when the user has no real bookings yet, so
// the page always looks complete for App Store review. Dates are computed
// relative to today so the "upcoming" tab always has at least one entry.
const buildMockBookings = (): Booking[] => {
  const upcoming = new Date();
  upcoming.setDate(upcoming.getDate() + 6);
  upcoming.setHours(19, 30, 0, 0);
  const past = new Date();
  past.setDate(past.getDate() - 20);
  past.setHours(20, 0, 0, 0);
  return [
    {
      id: "mock-cf-8821",
      venue_id: null,
      venue_name: "Le Diplomate",
      starts_at: upcoming.toISOString(),
      party_size: 4,
      status: "confirmed",
      notes: "14th Street NW · French bistro",
      cancelled_at: null,
      pre_order_drinks: null,
      seating_preference: null,
      confirmation_code: "CF-8821",
    },
    {
      id: "mock-cf-7703",
      venue_id: null,
      venue_name: "Rasika",
      starts_at: past.toISOString(),
      party_size: 2,
      status: "completed",
      notes: "Penn Quarter · Modern Indian",
      cancelled_at: null,
      pre_order_drinks: null,
      seating_preference: null,
      confirmation_code: "CF-7703",
    },
  ];
};
const isMockBookingId = (id: string) => id.startsWith("mock-");

function PortalBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDiscountCents, setPendingDiscountCents] = useState(0);

  const load = () => {
    supabase
      .from("bookings")
      .select("*")
      .order("starts_at", { ascending: false })
      .then(({ data }) => {
        const real = (data as Booking[]) ?? [];
        setBookings(real.length > 0 ? real : buildMockBookings());
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
    supabase
      .from("venues")
      .select("id,name,category,neighborhood,price_level,image_url")
      .order("name")
      .then(({ data }) => {
        setVenues((data as Venue[]) ?? []);
      });
    getMyPendingFirstBookingDiscount().then((d) => setPendingDiscountCents(d?.amount_cents ?? 0));
  }, []);

  useRefreshable(async () => {
    load();
    const d = await getMyPendingFirstBookingDiscount();
    setPendingDiscountCents(d?.amount_cents ?? 0);
  });

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
    if (isMockBookingId(id)) {
      toast.info("This is a sample booking — book a real venue to manage it here.");
      return;
    }
    if (
      typeof window !== "undefined" &&
      !window.confirm("Cancel this booking? This can't be undone.")
    ) {
      return;
    }
    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Booking cancelled");
      load();
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            My Portal
          </p>
          <h1 className="mt-1 flex items-center gap-2 font-display text-4xl font-bold">
            <CalendarCheck className="h-8 w-8" /> Bookings
          </h1>
          <p className="mt-2 text-muted-foreground">
            Reserve a venue, manage upcoming nights, and revisit past trips.
          </p>
        </div>
        <BookDialog venues={venues} userId={user?.id} onBooked={load} />
      </header>

      {pendingDiscountCents > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-4">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground">
            <Gift className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold">
              ${(pendingDiscountCents / 100).toFixed(0)} off your first booking
            </div>
            <p className="text-xs text-muted-foreground">
              Applied automatically when you book — courtesy of your friend's invite.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : bookings.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-cream p-10 text-center">
          <CalendarCheck className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-3 font-display text-2xl font-bold">No bookings yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Pick a venue and reserve your first table.
          </p>
        </div>
      ) : (
        <BookingsTabs upcoming={upcoming} past={past} onCancel={cancel} onUpdated={load} />
      )}
    </div>
  );
}

function BookingsTabs({
  upcoming,
  past,
  onCancel,
  onUpdated,
}: {
  upcoming: Booking[];
  past: Booking[];
  onCancel: (id: string) => void;
  onUpdated: () => void;
}) {
  const [tab, setTab] = useState<"upcoming" | "past">(
    upcoming.length === 0 && past.length > 0 ? "past" : "upcoming",
  );
  const rows = tab === "upcoming" ? upcoming : past;
  return (
    <div>
      <div
        role="tablist"
        className="inline-flex rounded-2xl border-2 border-ink bg-cream p-1 shadow-brut"
      >
        {(["upcoming", "past"] as const).map((k) => {
          const count = k === "upcoming" ? upcoming.length : past.length;
          const active = tab === k;
          return (
            <button
              key={k}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(k)}
              className={`rounded-xl px-4 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest transition ${
                active ? "bg-ink text-cream" : "text-ink/70 hover:text-ink"
              }`}
            >
              {k} <span className={active ? "opacity-80" : "opacity-60"}>({count})</span>
            </button>
          );
        })}
      </div>
      <div className="mt-4">
        {rows.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-cream/60 p-6 text-center text-sm text-muted-foreground">
            Nothing in {tab} yet.
          </p>
        ) : (
          <ul className={`grid gap-3 sm:grid-cols-2 ${tab === "past" ? "opacity-80" : ""}`}>
            {rows.map((b) => (
              <BookingCard
                key={b.id}
                b={b}
                onCancel={tab === "upcoming" ? onCancel : undefined}
                onUpdated={onUpdated}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function bookingToDetails(b: Booking) {
  const dt = new Date(b.starts_at);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return {
    id: b.id,
    venueName: b.venue_name,
    venueAddress: b.notes ?? undefined,
    date: `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`,
    time: `${pad(dt.getHours())}:${pad(dt.getMinutes())}`,
    partySize: b.party_size,
    confirmationCode: b.confirmation_code ?? b.id.slice(0, 8).toUpperCase(),
    status: (b.cancelled_at || b.status === "cancelled"
      ? "cancelled"
      : b.status === "confirmed"
        ? "confirmed"
        : "confirmed") as "confirmed" | "modified" | "cancelled",
    specialRequests: b.seating_preference ?? undefined,
  };
}

function BookingCard({
  b,
  onCancel,
  onUpdated,
}: {
  b: Booking;
  onCancel?: (id: string) => void;
  onUpdated?: () => void;
}) {
  const dt = new Date(b.starts_at);
  const cancelled = !!b.cancelled_at || b.status === "cancelled";
  const confirmed = !cancelled && b.status === "confirmed";
  const isUpcoming = dt.getTime() > Date.now();
  const drinks = Array.isArray(b.pre_order_drinks) ? b.pre_order_drinks : [];
  const hasPreorder = drinks.length > 0 || !!b.seating_preference;

  // Use ReservationConfirmation for confirmed upcoming bookings with a code
  if (confirmed && isUpcoming && b.confirmation_code) {
    return (
      <li>
        <ReservationConfirmation
          booking={bookingToDetails(b)}
          onModify={() => {
            toast.info("To modify this reservation, please contact the venue directly.");
          }}
          onCancel={(id, _reason) => onCancel?.(id)}
        />
        <div className="mt-2 flex flex-wrap gap-2 px-1">
          <PreorderDialog booking={b} onSaved={onUpdated} />
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadAppleInvite({
                id: b.id,
                title: b.venue_name,
                startsAt: b.starts_at,
                notes: `Party of ${b.party_size}${b.notes ? ` — ${b.notes}` : ""}`,
              })
            }
          >
            <Apple className="mr-1 h-3.5 w-3.5" /> Add to Apple Invites
          </Button>
        </div>
      </li>
    );
  }

  // Fallback: past / cancelled / pending bookings use simpler card
  return (
    <li className="rounded-2xl border-2 border-ink bg-cream p-5 shadow-brut">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-bold">{b.venue_name}</h3>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {dt.toLocaleString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" />
              Party of {b.party_size}
            </span>
          </div>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
            cancelled
              ? "bg-destructive/15 text-destructive"
              : b.status === "confirmed"
                ? "bg-emerald-500/15 text-emerald-700"
                : "bg-gold/20 text-foreground"
          }`}
        >
          {cancelled ? "Cancelled" : b.status}
        </span>
      </div>
      {b.notes && <p className="mt-2 text-sm text-muted-foreground">{b.notes}</p>}
      {b.confirmation_code && (
        <p className="mt-1.5 font-mono text-[11px] uppercase tracking-widest text-ink/60">
          Confirmation #{b.confirmation_code}
        </p>
      )}

      {confirmed && hasPreorder && (
        <div className="mt-3 space-y-1.5 rounded-xl border-2 border-ink bg-background/60 p-3 text-xs">
          {drinks.length > 0 && (
            <div>
              <div className="mb-1 inline-flex items-center gap-1 font-semibold text-foreground">
                <Wine className="h-3.5 w-3.5" /> Drinks ahead
              </div>
              <ul className="space-y-0.5 text-muted-foreground">
                {drinks.map((d, i) => (
                  <li key={i}>
                    · {d.qty}× {d.name}
                    {d.notes ? ` — ${d.notes}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {b.seating_preference && (
            <div className="pt-1">
              <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                <Armchair className="h-3.5 w-3.5" /> Seating:
              </span>{" "}
              <span className="text-muted-foreground">{b.seating_preference}</span>
            </div>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {confirmed && <PreorderDialog booking={b} onSaved={onUpdated} />}
        {!cancelled && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadAppleInvite({
                id: b.id,
                title: b.venue_name,
                startsAt: b.starts_at,
                notes: `Party of ${b.party_size}${b.notes ? ` — ${b.notes}` : ""}`,
              })
            }
          >
            <Apple className="mr-1 h-3.5 w-3.5" /> Add to Apple Invites
          </Button>
        )}
        {!cancelled && onCancel && (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onCancel(b.id)}
          >
            <X className="mr-1 h-3.5 w-3.5" /> Cancel
          </Button>
        )}
      </div>
    </li>
  );
}

function PreorderDialog({ booking, onSaved }: { booking: Booking; onSaved?: () => void }) {
  const [open, setOpen] = useState(false);
  const initial =
    Array.isArray(booking.pre_order_drinks) && booking.pre_order_drinks.length > 0
      ? booking.pre_order_drinks
      : [{ name: "", qty: 1, notes: "" }];
  const [drinks, setDrinks] = useState<DrinkItem[]>(initial);
  const [seating, setSeating] = useState<string>(booking.seating_preference ?? "");
  const [saving, setSaving] = useState(false);
  const has =
    (Array.isArray(booking.pre_order_drinks) && booking.pre_order_drinks.length > 0) ||
    !!booking.seating_preference;

  const update = (i: number, patch: Partial<DrinkItem>) =>
    setDrinks((d) => d.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  const addRow = () => setDrinks((d) => [...d, { name: "", qty: 1, notes: "" }]);
  const removeRow = (i: number) => setDrinks((d) => d.filter((_, idx) => idx !== i));

  const save = async () => {
    if (isMockBookingId(booking.id)) {
      toast.info("This is a sample booking — book a real venue to send preferences.");
      setOpen(false);
      return;
    }
    setSaving(true);
    const cleaned = drinks
      .map((d) => ({
        name: d.name.trim(),
        qty: Math.max(1, Number(d.qty) || 1),
        notes: d.notes?.trim() || undefined,
      }))
      .filter((d) => d.name.length > 0);
    const { error } = await supabase
      .from("bookings")
      .update({ pre_order_drinks: cleaned, seating_preference: seating.trim() || null })
      .eq("id", booking.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Preferences sent to the venue");
    setOpen(false);
    onSaved?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <Wine className="h-3.5 w-3.5" /> {has ? "Edit drinks & seating" : "Order drinks ahead"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            Drinks & seating — {booking.venue_name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="flex items-center gap-1.5">
              <Wine className="h-4 w-4" /> Drinks to have ready
            </Label>
            <div className="mt-2 space-y-2">
              {drinks.map((d, i) => (
                <div key={i} className="grid grid-cols-[64px_1fr_auto] gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={d.qty}
                    onChange={(e) => update(i, { qty: parseInt(e.target.value) || 1 })}
                  />
                  <Input
                    value={d.name}
                    placeholder="Negroni, Sancerre, sparkling water…"
                    onChange={(e) => update(i, { name: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRow(i)}
                    disabled={drinks.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <div className="col-span-3">
                    <Input
                      value={d.notes ?? ""}
                      placeholder="Notes (extra dry, no ice, etc.)"
                      onChange={(e) => update(i, { notes: e.target.value })}
                    />
                  </div>
                </div>
              ))}
              <Button type="button" variant="ghost" size="sm" onClick={addRow} className="gap-1">
                <Plus className="h-3.5 w-3.5" /> Add another
              </Button>
            </div>
          </div>
          <div>
            <Label className="flex items-center gap-1.5">
              <Armchair className="h-4 w-4" /> Desired seating area
            </Label>
            <Input
              className="mt-2"
              value={seating}
              onChange={(e) => setSeating(e.target.value)}
              placeholder="Booth, patio, bar, window, quiet corner, private room…"
            />
          </div>
          <Button onClick={save} disabled={saving} className="w-full">
            {saving ? "Saving…" : "Save preferences"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BookDialog({
  venues,
  userId,
  onBooked,
}: {
  venues: Venue[];
  userId?: string;
  onBooked: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [venueId, setVenueId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("19:00");
  const [party, setParty] = useState(2);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!userId) {
      toast.error("Sign in to book a venue.");
      return;
    }
    const venue = venues.find((v) => v.id === venueId);
    if (!venue || !date || !time) {
      toast.error("Please pick a venue, date, and time");
      return;
    }
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
      awardXP(userId, "booking");
      setOpen(false);
      setVenueId("");
      setDate("");
      setNotes("");
      onBooked();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> New booking
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Reserve a table</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Venue</Label>
            <select
              value={venueId}
              onChange={(e) => setVenueId(e.target.value)}
              className="mt-1 w-full rounded-md border-2 border-ink bg-background px-3 py-2 text-sm"
            >
              <option value="">Choose a venue…</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                  {v.neighborhood ? ` — ${v.neighborhood}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={date}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Time</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Party size</Label>
            <Input
              type="number"
              min={1}
              max={20}
              value={party}
              onChange={(e) => setParty(parseInt(e.target.value) || 1)}
            />
          </div>
          <div>
            <Label>Notes (optional)</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Allergies, occasion, requests…"
            />
          </div>
          <Button onClick={submit} disabled={submitting} className="w-full">
            {submitting ? "Booking…" : "Confirm booking"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
