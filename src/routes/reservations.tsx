import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  MapPin,
  Ticket,
  ExternalLink,
  Phone,
  Mail,
  Hash,
  Users,
  Clock,
  FileText,
  CheckCircle2,
  Clock3,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/lib/auth-context";
import { listReservations, type Reservation } from "@/lib/itineraries";

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

function ReservationsPage() {
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [rows, setRows] = useState<Reservation[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      nav({ to: "/auth" });
      return;
    }
    listReservations()
      .then(setRows)
      .catch((e) => setErr(e.message));
  }, [user, authLoading, nav]);

  const { upcoming, past } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const up: Reservation[] = [];
    const pst: Reservation[] = [];
    (rows ?? []).forEach((r) => {
      const d = r.itinerary_date ? new Date(r.itinerary_date) : null;
      if (d && d.getTime() < today.getTime()) pst.push(r);
      else up.push(r);
    });
    const byDate = (a: Reservation, b: Reservation) =>
      (a.itinerary_date ?? "").localeCompare(b.itinerary_date ?? "") ||
      (a.reservation_time ?? a.start_time ?? "").localeCompare(
        b.reservation_time ?? b.start_time ?? "",
      );
    return { upcoming: up.sort(byDate), past: pst.sort(byDate).reverse() };
  }, [rows]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="border-b border-border bg-gradient-warm/40">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Ticket className="h-3.5 w-3.5 text-primary" /> Saved reservations
          </span>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Your bookings vault.
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Every confirmation code, party size, and contact detail — pulled from each stop you've
            booked across your trips.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {err && (
          <p className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">{err}</p>
        )}
        {!rows ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : rows.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-10">
            <Group title="Upcoming" rows={upcoming} icon={<Clock3 className="h-4 w-4" />} />
            <Group title="Past" rows={past} icon={<CheckCircle2 className="h-4 w-4" />} muted />
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
      <Ticket className="mx-auto h-10 w-10 text-muted-foreground" />
      <h2 className="mt-3 font-display text-2xl font-bold">No reservations yet</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Plan a day, mark a stop as Pending or Confirmed, and your booking details land here.
      </p>
      <Link
        to="/plan"
        className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-pop transition-pop hover:scale-105"
      >
        Plan a day
      </Link>
    </div>
  );
}

function Group({
  title,
  rows,
  icon,
  muted,
}: {
  title: string;
  rows: Reservation[];
  icon: React.ReactNode;
  muted?: boolean;
}) {
  if (rows.length === 0) return null;
  return (
    <div>
      <h2 className="mb-3 inline-flex items-center gap-2 font-display text-2xl font-bold">
        {icon} {title}{" "}
        <span className="rounded-full bg-muted px-2 py-0.5 text-sm font-semibold text-muted-foreground">
          {rows.length}
        </span>
      </h2>
      <ul className={`grid gap-4 sm:grid-cols-2 ${muted ? "opacity-80" : ""}`}>
        {rows.map((r) => (
          <ReservationCard key={r.id} r={r} />
        ))}
      </ul>
    </div>
  );
}

function ReservationCard({ r }: { r: Reservation }) {
  const status = r.booking_status === "confirmed";
  const time = r.reservation_time?.slice(0, 5) ?? r.start_time?.slice(0, 5);
  return (
    <li className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to="/trips/$id"
            params={{ id: r.itinerary_id }}
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            {r.itinerary_title}
          </Link>
          <h3 className="mt-1 truncate font-display text-xl font-bold">{r.name}</h3>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${status ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}`}
        >
          {r.booking_status}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
        {r.itinerary_date && (
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />
            {new Date(r.itinerary_date).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              weekday: "short",
            })}
          </span>
        )}
        {time && (
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4" /> {time}
          </span>
        )}
        {r.itinerary_city && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4" /> {r.itinerary_city}
          </span>
        )}
        {r.party_size && (
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-4 w-4" /> Party of {r.party_size}
          </span>
        )}
      </div>

      <div className="mt-3 grid gap-1.5 text-sm">
        {r.booking_ref && (
          <Detail
            icon={<Hash className="h-4 w-4" />}
            label="Confirmation #"
            value={r.booking_ref}
            mono
          />
        )}
        {r.contact_phone && (
          <Detail
            icon={<Phone className="h-4 w-4" />}
            label="Phone"
            value={r.contact_phone}
            href={`tel:${r.contact_phone}`}
          />
        )}
        {r.contact_email && (
          <Detail
            icon={<Mail className="h-4 w-4" />}
            label="Email"
            value={r.contact_email}
            href={`mailto:${r.contact_email}`}
          />
        )}
        {r.confirmation_note && (
          <Detail
            icon={<FileText className="h-4 w-4" />}
            label="Note"
            value={r.confirmation_note}
          />
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          to="/trips/$id"
          params={{ id: r.itinerary_id }}
          className="inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-1.5 text-xs font-bold text-background hover:scale-105 transition-pop"
        >
          Open trip
        </Link>
        {r.booking_url && (
          <a
            href={r.booking_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
          >
            {r.booking_provider ?? "Book"} <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </li>
  );
}

function Detail({
  icon,
  label,
  value,
  href,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  mono?: boolean;
}) {
  const body = <span className={`${mono ? "font-mono" : ""} text-foreground`}>{value}</span>;
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <span className="min-w-0">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}:{" "}
        </span>
        {href ? (
          <a href={href} className="text-primary hover:underline">
            {body}
          </a>
        ) : (
          body
        )}
      </span>
    </div>
  );
}
