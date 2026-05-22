import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BusinessPageShell } from "@/components/business/BusinessTabNav";
import {
  NoVenueClaim,
  VenueSwitcher,
  useManagedVenues,
} from "@/components/business/useManagedVenue";
import { listVenueCorporateBookings } from "@/lib/business-portal.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/business/corporate")({
  beforeLoad: async () => {
    const { requireBusinessAccess } = await import("@/lib/business-guards");
    await requireBusinessAccess();
  },
  head: () => ({ meta: [{ title: "Corporate Bookings — Confetti for Business" }] }),
  component: BusinessCorporatePage,
});

type StatusFilter = "all" | "pending" | "approved" | "completed" | "cancelled";

function BusinessCorporatePage() {
  const { venues, activeId, setActiveId, isLoading: venuesLoading } = useManagedVenues();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);

  if (venuesLoading) {
    return (
      <BusinessPageShell eyebrow="Corporate" title="Corporate Bookings">
        <div className="grid place-items-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </BusinessPageShell>
    );
  }

  if (!venues.length) {
    return (
      <BusinessPageShell eyebrow="Corporate" title="Corporate Bookings">
        <NoVenueClaim />
      </BusinessPageShell>
    );
  }

  return (
    <BusinessPageShell
      eyebrow="Corporate"
      title="Corporate Bookings"
      description="Team events, company dinners, and group reservations from businesses"
      actions={
        <VenueSwitcher venues={venues} activeId={activeId} onChange={setActiveId} />
      }
    >
      {activeId && (
        <>
          <FilterBar active={statusFilter} onChange={(s) => { setStatusFilter(s); setPage(1); }} />
          <CorporateList venueId={activeId} status={statusFilter} page={page} setPage={setPage} />
        </>
      )}
    </BusinessPageShell>
  );
}

/* ─── Filter ─── */

const STATUSES: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
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

/* ─── Corporate List ─── */

function CorporateList({
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
  const fetch = useServerFn(listVenueCorporateBookings);

  const { data, isLoading } = useQuery({
    queryKey: ["venue-corporate", venueId, status, page],
    queryFn: () => fetch({ venueId, status, page, limit: 20 }),
    staleTime: 30_000,
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
        <Building2 className="h-8 w-8 text-muted-foreground/50" />
        <p className="mt-2 text-sm text-muted-foreground">
          No corporate bookings yet
        </p>
        <p className="text-xs text-muted-foreground">
          Team events and company reservations will appear here
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map((b: any) => (
        <Card key={b.id} className="flex flex-col gap-3 border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {b.company?.logo_url ? (
              <img src={b.company.logo_url} alt="" className="h-10 w-10 rounded object-cover" />
            ) : (
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-100">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
            )}
            <div>
              <p className="text-sm font-semibold">{b.company?.name ?? "Company"}</p>
              <p className="text-xs text-muted-foreground">
                {b.scheduled_date && new Date(b.scheduled_date).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
                {b.scheduled_time && ` at ${b.scheduled_time}`}
                {b.party_size && ` · ${b.party_size} guests`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={b.status} />
          </div>
        </Card>
      ))}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
          <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
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
    pending: { label: "Pending", className: "bg-amber-100 text-amber-800 border-amber-200" },
    approved: { label: "Approved", className: "bg-blue-100 text-blue-800 border-blue-200" },
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
