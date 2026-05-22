import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ChevronDown,
  Loader2,
  Package,
  ShoppingBag,
  X,
} from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BusinessPageShell } from "@/components/business/BusinessTabNav";
import {
  NoVenueClaim,
  VenueSwitcher,
  useManagedVenues,
} from "@/components/business/useManagedVenue";
import { listVenuePreOrders, updatePreOrderStatus } from "@/lib/business-portal.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/business/preorders")({
  beforeLoad: async () => {
    const { requireBusinessAccess } = await import("@/lib/business-guards");
    await requireBusinessAccess();
  },
  head: () => ({ meta: [{ title: "Pre-Orders — Confetti for Business" }] }),
  component: BusinessPreOrdersPage,
});

type StatusFilter = "all" | "pending" | "sent" | "confirmed" | "cancelled";

function BusinessPreOrdersPage() {
  const { venues, activeId, setActiveId, isLoading: venuesLoading } = useManagedVenues();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  if (venuesLoading) {
    return (
      <BusinessPageShell eyebrow="Pre-Orders" title="Pre-Orders">
        <div className="grid place-items-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </BusinessPageShell>
    );
  }

  if (!venues.length) {
    return (
      <BusinessPageShell eyebrow="Pre-Orders" title="Pre-Orders">
        <NoVenueClaim />
      </BusinessPageShell>
    );
  }

  return (
    <BusinessPageShell
      eyebrow="Pre-Orders"
      title="Pre-Orders"
      description="Passenger food & drink orders placed before arrival"
      actions={
        <VenueSwitcher venues={venues} activeId={activeId} onChange={setActiveId} />
      }
    >
      {activeId && (
        <>
          <FilterBar active={statusFilter} onChange={setStatusFilter} />
          <PreOrderList venueId={activeId} status={statusFilter} />
        </>
      )}
    </BusinessPageShell>
  );
}

/* ─── Filter ─── */

const STATUSES: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "sent", label: "Sent to Kitchen" },
  { value: "confirmed", label: "Confirmed" },
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

/* ─── Pre-Order List ─── */

function PreOrderList({ venueId, status }: { venueId: string; status: StatusFilter }) {
  const fetch = useServerFn(listVenuePreOrders);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["venue-preorders", venueId, status],
    queryFn: () => fetch({ venueId, status: status === "all" ? undefined : status }),
    staleTime: 15_000,
  });

  if (isLoading) {
    return (
      <div className="grid place-items-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const preOrders = data?.preOrders ?? [];

  if (!preOrders.length) {
    return (
      <Card className="grid place-items-center border-dashed border-border p-10 text-center">
        <ShoppingBag className="h-8 w-8 text-muted-foreground/50" />
        <p className="mt-2 text-sm text-muted-foreground">
          No pre-orders yet
        </p>
        <p className="text-xs text-muted-foreground">
          Passenger food & drink orders will appear here
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {preOrders.map((order: any) => (
        <PreOrderCard
          key={order.id}
          order={order}
          venueId={venueId}
          onUpdated={() => queryClient.invalidateQueries({ queryKey: ["venue-preorders", venueId] })}
        />
      ))}
    </div>
  );
}

/* ─── Pre-Order Card ─── */

function PreOrderCard({
  order,
  venueId,
  onUpdated,
}: {
  order: any;
  venueId: string;
  onUpdated: () => void;
}) {
  const updateStatus = useServerFn(updatePreOrderStatus);
  const [expanded, setExpanded] = useState(false);

  const confirmMutation = useMutation({
    mutationFn: () => updateStatus({ venueId, preOrderId: order.id, status: "confirmed" }),
    onSuccess: () => {
      toast.success("Pre-order confirmed");
      onUpdated();
    },
    onError: (e) => toast.error(e.message),
  });

  const cancelMutation = useMutation({
    mutationFn: () => updateStatus({ venueId, preOrderId: order.id, status: "cancelled" }),
    onSuccess: () => {
      toast.success("Pre-order cancelled");
      onUpdated();
    },
    onError: (e) => toast.error(e.message),
  });

  const booking = order.booking;
  const items = order.items ?? [];
  const totalCents = items.reduce(
    (sum: number, i: any) => sum + (i.menu_item?.price_cents ?? 0) * (i.quantity ?? 1),
    0,
  );

  return (
    <Card className="border-border p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-100">
            <Package className="h-5 w-5 text-amber-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">
                {booking?.confirmation_code ?? "Order"}
              </p>
              <PreOrderStatusBadge status={order.status} />
            </div>
            <p className="text-xs text-muted-foreground">
              {booking?.booking_time &&
                new Date(booking.booking_time).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              {booking?.party_size && ` · ${booking.party_size} guests`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-emerald-700">
            ${(totalCents / 100).toFixed(2)}
          </span>
          <span className="text-xs text-muted-foreground">
            {items.length} item{items.length !== 1 ? "s" : ""}
          </span>

          {order.status === "pending" && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-7 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                disabled={confirmMutation.isPending}
                onClick={() => confirmMutation.mutate()}
              >
                <Check className="mr-1 h-3 w-3" /> Confirm
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 border-red-300 text-red-700 hover:bg-red-50"
                disabled={cancelMutation.isPending}
                onClick={() => cancelMutation.mutate()}
              >
                <X className="mr-1 h-3 w-3" /> Cancel
              </Button>
            </>
          )}

          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-1 rounded p-1 hover:bg-muted"
          >
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 border-t border-border pt-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="pb-1 font-medium">Item</th>
                <th className="pb-1 text-center font-medium">Qty</th>
                <th className="pb-1 text-right font-medium">Price</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, idx: number) => (
                <tr key={idx} className="border-t border-border/50">
                  <td className="py-1.5 font-medium">
                    {item.menu_item?.name ?? "Unknown item"}
                  </td>
                  <td className="py-1.5 text-center">{item.quantity ?? 1}</td>
                  <td className="py-1.5 text-right">
                    ${((item.menu_item?.price_cents ?? 0) * (item.quantity ?? 1) / 100).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border font-semibold">
                <td className="pt-1.5">Total</td>
                <td />
                <td className="pt-1.5 text-right">${(totalCents / 100).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          {order.notes && (
            <p className="mt-2 rounded bg-muted/50 p-2 text-xs italic text-muted-foreground">
              Note: {order.notes}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

/* ─── Status Badge ─── */

function PreOrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    pending: { label: "Pending", className: "bg-amber-100 text-amber-800 border-amber-200" },
    sent: { label: "Sent", className: "bg-blue-100 text-blue-800 border-blue-200" },
    confirmed: { label: "Confirmed", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    cancelled: { label: "Cancelled", className: "bg-red-100 text-red-800 border-red-200" },
  };
  const badge = map[status] ?? { label: status, className: "bg-muted text-muted-foreground" };
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badge.className}`}>
      {badge.label}
    </span>
  );
}
