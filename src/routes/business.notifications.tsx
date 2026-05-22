import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  BellOff,
  CalendarCheck,
  CheckCheck,
  Loader2,
  MapPin,
  ShoppingBag,
  Star,
  Users,
  XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BusinessPageShell } from "@/components/business/BusinessTabNav";
import {
  NoVenueClaim,
  VenueSwitcher,
  useManagedVenues,
} from "@/components/business/useManagedVenue";
import {
  listVenueNotifications,
  markNotificationsRead,
} from "@/lib/business-portal.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/business/notifications")({
  beforeLoad: async () => {
    const { requireBusinessAccess } = await import("@/lib/business-guards");
    await requireBusinessAccess();
  },
  head: () => ({ meta: [{ title: "Notifications — Confetti for Business" }] }),
  component: BusinessNotificationsPage,
});

function BusinessNotificationsPage() {
  const { venues, activeId, setActiveId, isLoading: venuesLoading } = useManagedVenues();

  if (venuesLoading) {
    return (
      <BusinessPageShell eyebrow="Notifications" title="Venue Alerts">
        <div className="grid place-items-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </BusinessPageShell>
    );
  }

  if (!venues.length) {
    return (
      <BusinessPageShell eyebrow="Notifications" title="Venue Alerts">
        <NoVenueClaim />
      </BusinessPageShell>
    );
  }

  return (
    <BusinessPageShell
      eyebrow="Notifications"
      title="Venue Alerts"
      description="Booking updates, arrivals, and pre-order notifications"
      actions={
        <VenueSwitcher venues={venues} activeId={activeId} onChange={setActiveId} />
      }
    >
      {activeId && <NotificationsFeed venueId={activeId} />}
    </BusinessPageShell>
  );
}

/* ─── Notifications Feed ─── */

function NotificationsFeed({ venueId }: { venueId: string }) {
  const fetchNotifications = useServerFn(listVenueNotifications);
  const markRead = useServerFn(markNotificationsRead);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["venue-notifications", venueId],
    queryFn: () => fetchNotifications({ venueId, unreadOnly: false, limit: 50 }),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const markAllMutation = useMutation({
    mutationFn: () => markRead({ venueId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venue-notifications", venueId] });
      toast.success("All notifications marked as read");
    },
  });

  if (isLoading) {
    return (
      <div className="grid place-items-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  if (!notifications.length) {
    return (
      <Card className="grid place-items-center border-dashed border-border p-10 text-center">
        <BellOff className="h-8 w-8 text-muted-foreground/50" />
        <p className="mt-2 text-sm text-muted-foreground">No notifications yet</p>
        <p className="text-xs text-muted-foreground">
          You'll see booking alerts, passenger arrivals, and pre-order notifications here
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {unreadCount > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-2">
          <span className="text-sm font-semibold text-amber-800">
            {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
          </span>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            disabled={markAllMutation.isPending}
            onClick={() => markAllMutation.mutate()}
          >
            <CheckCheck className="mr-1 h-3 w-3" /> Mark all read
          </Button>
        </div>
      )}

      {notifications.map((n) => (
        <Card
          key={n.id}
          className={`flex items-start gap-3 border-border p-4 transition ${
            !n.is_read ? "border-l-4 border-l-amber-400 bg-amber-50/30" : ""
          }`}
        >
          <NotificationIcon type={n.type} />
          <div className="flex-1">
            <p className={`text-sm ${!n.is_read ? "font-semibold" : ""}`}>{n.title}</p>
            {n.body && (
              <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
            )}
            <p className="mt-1 text-[10px] text-muted-foreground">
              {timeAgo(n.created_at)}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ─── Notification Icon by Type ─── */

function NotificationIcon({ type }: { type: string }) {
  const map: Record<string, { icon: typeof Bell; color: string }> = {
    new_booking: { icon: CalendarCheck, color: "text-blue-600 bg-blue-100" },
    cancelled_booking: { icon: XCircle, color: "text-red-600 bg-red-100" },
    modified_booking: { icon: CalendarCheck, color: "text-amber-600 bg-amber-100" },
    passenger_arriving: { icon: MapPin, color: "text-violet-600 bg-violet-100" },
    passenger_arrived: { icon: MapPin, color: "text-emerald-600 bg-emerald-100" },
    pre_order_fired: { icon: ShoppingBag, color: "text-pink-600 bg-pink-100" },
    new_review: { icon: Star, color: "text-amber-600 bg-amber-100" },
    corporate_booking_request: { icon: Users, color: "text-blue-600 bg-blue-100" },
    system: { icon: Bell, color: "text-gray-600 bg-gray-100" },
  };
  const entry = map[type] ?? map.system!;
  const Icon = entry.icon;
  return (
    <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${entry.color}`}>
      <Icon className="h-4 w-4" />
    </div>
  );
}

/* ─── Time Ago Util ─── */

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
