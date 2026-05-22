import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BusinessPageShell } from "@/components/business/BusinessTabNav";
import {
  NoVenueClaim,
  VenueSwitcher,
  useManagedVenues,
} from "@/components/business/useManagedVenue";
import {
  listVenueBookings,
  getVenueBookingStats,
  updateBookingStatus,
} from "@/lib/business-portal.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/business/bookings")({
  beforeLoad: async () => {
    const { requireBusinessAccess } = await import("@/lib/business-guards");
    await requireBusinessAccess();
  },
  head: () => ({ meta: [{ title: "Bookings — Confetti for Business" }] }),
  component: BusinessBookingsPage,
});

type StatusFilter = "all" | "upcoming" | "confirmed" | "completed" | "cancelled";

function BusinessBookingsPage() {
  const { venues, activeId, setActiveId, isLoading: venuesLoading } = useManagedVenues();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);

  if (venuesLoading) {
    return (
      <BusinessPageShell eyebrow="Bookings" title="Passenger Bookings">
        <div className="grid place-items-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </BusinessPageShell>
    );
  }

  if (!venues.length) {
    return (
      <BusinessPageShell eyebrow="Bookings" title="Passenger Bookings">
        <NoVenueClaim />
      </BusinessPageShell>
    );
  }

  return (
    <BusinessPageShell
      eyebrow="Bookings"
      title="Passenger Bookings"
      description="View and manage reservations from your passengers"
      actions={
        <VenueSwitcher venues={venues} activeId={activeId} onChange={setActiveId} />
      }
    >
      {activeId && (
        <>
          <StatsRow venueId={activeId} />
          <FilterBar active={statusFilter} onChange={(s) => { setStatusFilter(s); setPage(1); }} />
          <BookingsTable venueId={activeId} status={statusFilter} page={page} setPage={setPage} />
        </>
      )}
    </BusinessPageShell>
  );
}

/* ─── Stats Row ─── */

function StatsRow({ venueId }: { venueId: string }) {
  const fetchStats = useServerFn(getVenueBookingStats);
  const { data: stats } = useQuery({
    queryKey: ["venue-booking-stats", venueId],
    queryFn: () => fetchStats({ venueId }),
    staleTime: 60_000,
  });

  const cards = [
    { label: "Upcoming", value: stats?.upcoming ?? "—", icon: Clock, color: "text-amber-600" },
    { label: "Completed (30d)", value: stats?.completed ?? "—", icon: Check, color: "text-emerald-600" },
    { label: "Cancelled (30d)", value: stats?.cancelled ?? "—", icon: XCircle, color: "text-red-500" },
    { label: "Total Guests (30d)", value: stats?.totalGuests30d ?? "—", icon: Users, color: "text-blue-600" },
    { label: "Avg Party Size", value: stats?.avgPartySize ?? "—", icon: Users, color: "text-violet-600" },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((c) => (
        <Card key={c.label} className="flex items-center gap-3 border-border p-4">
          <c.icon className={`h-5 w-5 shrink-0 ${c.color}`} />
          <div>
            <p className="text-xl font-bold leading-none">{c.value}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{c.label}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ─── Filter Bar ─── */

const STATUSES: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function FilterBar({ active, onChange }: { active: StatusFilter; onChange: (s: StatusFilter) => void }) {
  return (
    <div className="mb-4 flex gap-1 overflow-x-auto">
      {STATUSES.map((s) => (
        <button
          key={s.value}
          onClick={() => onChange(s.value)}
          className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
            active === s.value
              ? "border-ink bg-ink text-cream"
              : "border-border hover:border-ink"
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

/* ─── Bookings Table ─── */

function BookingsTable({
  venueId,
  status,
  page,
  setPage,
}: {
  venueId: string;
  status: StatusFilter;
  page: number;
  setPage: (p: number) => void;
}) {
  const fetchBookings = useServerFn(listVenueBookings);
  const updateStatus = useServerFn(updateBookingStatus);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["venue-bookings", venueId, status, page],
    queryFn: () => fetchBookings({ venueId, status, page, limit: 20 }),
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: (vars: { bookingId: string; status: "confirmed" | "completed" | "cancelled"; reason?: string }) =>
      updateStatus({ venueId, ...vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venue-bookings", venueId] });
      queryClient.invalidateQueries({ queryKey: ["venue-booking-stats", venueId] });
      toast.success("Booking updated");
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="grid place-items-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const bookings = data?.bookings ?? [];
  const totalPages = data?.totalPages ?? 1;

  if (!bookings.length) {
    return (
      <Card className="grid place-items-center border-dashed border-border p-10 text-center">
        <CalendarCheck className="h-8 w-8 text-muted-foreground/50" />
        <p className="mt-2 text-sm text-muted-foreground">
          No {status === "all" ? "" : status + " "}bookings yet
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map((b) => (
        <Card
          key={b.id}
          className="flex flex-col gap-3 border-border p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3">
            {b.passenger.avatar_url ? (
              <img
                src={b.passenger.avatar_url}
                alt=""
                className="h-9 w-9 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted text-xs font-bold">
                {(b.passenger.display_name ?? "?")[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold">
                {b.passenger.display_name ?? "Passenger"}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(b.booking_time).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}{" "}
                &middot; Party of {b.party_size}
              </p>
              {b.special_requests && (
                <p className="mt-0.5 text-xs italic text-muted-foreground">
                  &ldquo;{b.special_requests}&rdquo;
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={b.status} />
            <span className="font-mono text-[10px] text-muted-foreground">
              {b.confirmation_code}
            </span>

            {(b.status === "upcoming" || b.status === "confirmed") && (
              <div className="flex gap-1">
                {b.status === "upcoming" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate({ bookingId: b.id, status: "confirmed" })}
                  >
                    <Check className="mr-1 h-3 w-3" /> Confirm
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  disabled={mutation.isPending}
                  onClick={() => mutation.mutate({ bookingId: b.id, status: "completed" })}
                >
                  Complete
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-red-600 hover:text-red-700"
                  disabled={mutation.isPending}
                  onClick={() =>
                    mutation.mutate({ bookingId: b.id, status: "cancelled", reason: "Cancelled by venue" })
                  }
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </Card>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

/* ─── Status Badge ─── */

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    upcoming: { label: "Upcoming", className: "bg-amber-100 text-amber-800 border-amber-200" },
    confirmed: { label: "Confirmed", className: "bg-blue-100 text-blue-800 border-blue-200" },
    completed: { label: "Completed", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    cancelled: { label: "Cancelled", className: "bg-red-100 text-red-800 border-red-200" },
  };
  const badge = map[status] ?? { label: status, className: "bg-muted text-muted-foreground" };
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badge.className}`}>
      {badge.label}
    </span>
  );
}
