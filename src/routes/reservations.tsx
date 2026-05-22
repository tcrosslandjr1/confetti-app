import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, Inbox } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ReservationConfirmation, type BookingDetails } from "@/components/ReservationConfirmation";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/reservations")({
  head: () => ({
    meta: [
      { title: "Saved reservations — Confetti" },
      {
        name: "description",
        content:
          "Every reservation, confirmation code, and contact detail across your trips, in one place.",
      },
    ],
  }),
  component: ReservationsPage,
});

type DbBooking = {
  id: string;
  venue_name: string;
  starts_at: string;
  party_size: number;
  status: string;
  notes: string | null;
  cancelled_at: string | null;
  seating_preference: string | null;
  confirmation_code?: string;
};

function dbToDetails(b: DbBooking): BookingDetails {
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
    status:
      b.cancelled_at || b.status === "cancelled"
        ? "cancelled"
        : b.status === "modified"
          ? "modified"
          : "confirmed",
    specialRequests: b.seating_preference ?? undefined,
  };
}

// Sample data so the page looks complete before the user has real bookings
function buildSampleBookings(): BookingDetails[] {
  const soon = new Date();
  soon.setDate(soon.getDate() + 4);
  soon.setHours(20, 0, 0, 0);
  const past = new Date();
  past.setDate(past.getDate() - 10);
  past.setHours(19, 30, 0, 0);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return [
    {
      id: "sample-1",
      venueName: "Le Diplomate",
      venueAddress: "1601 14th St NW · Washington, DC",
      date: `${soon.getFullYear()}-${pad(soon.getMonth() + 1)}-${pad(soon.getDate())}`,
      time: `${pad(soon.getHours())}:${pad(soon.getMinutes())}`,
      partySize: 4,
      confirmationCode: "CF-8821",
      status: "confirmed",
      specialRequests: "Patio seating preferred",
    },
    {
      id: "sample-2",
      venueName: "Rasika",
      venueAddress: "633 D St NW · Washington, DC",
      date: `${past.getFullYear()}-${pad(past.getMonth() + 1)}-${pad(past.getDate())}`,
      time: `${pad(past.getHours())}:${pad(past.getMinutes())}`,
      partySize: 2,
      confirmationCode: "CF-7703",
      status: "confirmed",
    },
  ];
}

function ReservationsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  useEffect(() => {
    supabase
      .from("bookings")
      .select("id,venue_name,starts_at,party_size,status,notes,cancelled_at,seating_preference,confirmation_code")
      .order("starts_at", { ascending: false })
      .then(({ data }) => {
        const rows = (data as DbBooking[]) ?? [];
        setBookings(rows.length > 0 ? rows.map(dbToDetails) : buildSampleBookings());
        setLoading(false);
      });
  }, []);

  const { upcoming, past: pastList } = useMemo(() => {
    const now = Date.now();
    const up: BookingDetails[] = [];
    const ps: BookingDetails[] = [];
    bookings.forEach((b) => {
      const t = new Date(`${b.date}T${b.time}`).getTime();
      if (b.status === "cancelled" || t < now) ps.push(b);
      else up.push(b);
    });
    up.sort(
      (a, b) =>
        new Date(`${a.date}T${a.time}`).getTime() -
        new Date(`${b.date}T${b.time}`).getTime(),
    );
    return { upcoming: up, past: ps };
  }, [bookings]);

  const rows = tab === "upcoming" ? upcoming : pastList;

  const handleCancel = async (id: string, reason: string) => {
    if (id.startsWith("sample-")) {
      toast.info("This is a sample reservation — book a real venue first.");
      return;
    }
    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: "cancelled" as const } : b)),
      );
      toast.success("Reservation cancelled");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="flex items-center gap-3 font-display text-4xl font-bold sm:text-5xl">
            <CalendarCheck className="h-9 w-9" /> My Reservations
          </h1>
          <p className="mt-3 text-muted-foreground">
            Every confirmation, countdown, and contact detail in one place.
          </p>
        </header>

        {!user && (
          <div className="mb-8 rounded-2xl border border-primary/30 bg-primary/5 p-5 text-center">
            <p className="text-sm text-muted-foreground">
              <Link to="/auth" className="font-semibold text-primary underline">
                Sign in
              </Link>{" "}
              to see your real reservations. Showing sample data below.
            </p>
          </div>
        )}

        {/* Tabs */}
        <div
          role="tablist"
          className="mb-6 inline-flex rounded-2xl border-2 border-ink bg-cream p-1 shadow-brut"
        >
          {(["upcoming", "past"] as const).map((k) => {
            const count = k === "upcoming" ? upcoming.length : pastList.length;
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
                {k}{" "}
                <span className={active ? "opacity-80" : "opacity-60"}>
                  ({count})
                </span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-cream p-10 text-center">
            <Inbox className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="mt-3 font-display text-2xl font-bold">
              No {tab} reservations
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {tab === "upcoming"
                ? "Your next booking will appear here with a countdown timer."
                : "Past visits will show up here after the date passes."}
            </p>
            <Link
              to="/events"
              className="mt-5 inline-flex rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background"
            >
              Browse events
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {rows.map((b) => (
              <ReservationConfirmation
                key={b.id}
                booking={b}
                onModify={() =>
                  toast.info(
                    "To modify this reservation, please contact the venue directly.",
                  )
                }
                onCancel={handleCancel}
              />
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
