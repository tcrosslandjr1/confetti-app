import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, Pencil, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BusinessPageShell } from "@/components/business/BusinessTabNav";
import {
  NoVenueClaim,
  VenueSwitcher,
  useManagedVenues,
} from "@/components/business/useManagedVenue";
import { listMyVenueEvents, deleteVenueEvent } from "@/lib/business-portal.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/business/events")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/business/login" });
  },
  head: () => ({ meta: [{ title: "Events Manager — Confetti for Business" }] }),
  component: BusinessEventsPage,
});

type Tab = "upcoming" | "past";

function BusinessEventsPage() {
  const { venues, activeId, setActiveId, isLoading: venuesLoading } = useManagedVenues();
  const fetchEvents = useServerFn(listMyVenueEvents);
  const deleteEvent = useServerFn(deleteVenueEvent);
  const qc = useQueryClient();

  const eventsQuery = useQuery({
    queryKey: ["my-venue-events"],
    queryFn: () => fetchEvents(),
    enabled: venues.length > 0,
  });

  const del = useMutation({
    mutationFn: (eventId: string) => deleteEvent({ data: { eventId } }),
    onSuccess: () => {
      toast.success("Event removed");
      qc.invalidateQueries({ queryKey: ["my-venue-events"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [tab, setTab] = useState<Tab>("upcoming");
  const now = Date.now();
  const all = eventsQuery.data?.events ?? [];
  const filtered = useMemo(() => {
    const forVenue = activeId ? all.filter((e) => e.venue_id === activeId) : all;
    return forVenue.filter((e) => {
      const starts = e.starts_at ? new Date(e.starts_at).getTime() : 0;
      return tab === "upcoming" ? starts >= now : starts < now;
    });
  }, [all, activeId, tab, now]);

  return (
    <BusinessPageShell
      eyebrow="Events Manager"
      title="Your events"
      description="Schedule, publish, and review your nightlife calendar."
      actions={
        <div className="flex items-center gap-2">
          <VenueSwitcher venues={venues} activeId={activeId} onChange={setActiveId} />
          <Button disabled>
            <CalendarPlus className="mr-1.5 h-4 w-4" /> Add event
          </Button>
        </div>
      }
    >
      {venuesLoading ? (
        <LoadingBlock />
      ) : !venues.length ? (
        <NoVenueClaim />
      ) : (
        <>
          <div className="mb-4 flex gap-2">
            {(["upcoming", "past"] as Tab[]).map((s) => (
              <button
                key={s}
                onClick={() => setTab(s)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition ${
                  tab === s
                    ? "border-ink bg-ink text-cream"
                    : "border-border bg-card hover:border-ink"
                }`}
              >
                {s} (
                {
                  all.filter((e) => {
                    const t = e.starts_at ? new Date(e.starts_at).getTime() : 0;
                    return s === "upcoming" ? t >= now : t < now;
                  }).length
                }
                )
              </button>
            ))}
          </div>

          {eventsQuery.isLoading ? (
            <LoadingBlock />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((e) => {
                const dt = e.starts_at ? new Date(e.starts_at) : null;
                return (
                  <Card key={e.id} className="overflow-hidden transition hover:shadow-md">
                    {e.image_url ? (
                      <img src={e.image_url} alt={e.title} className="h-32 w-full object-cover" />
                    ) : (
                      <div className="h-32 bg-gradient-to-br from-primary/30 to-orange-200" />
                    )}
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate font-semibold">{e.title}</div>
                        <Badge
                          variant={e.status === "published" ? "default" : "secondary"}
                          className="text-[10px]"
                        >
                          {e.status ?? "draft"}
                        </Badge>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {dt
                          ? dt.toLocaleString(undefined, {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })
                          : "TBA"}
                      </div>
                      <div className="mt-3 flex gap-1.5">
                        <Button size="sm" variant="outline" className="flex-1" disabled>
                          <Pencil className="mr-1 h-3 w-3" /> Edit
                        </Button>
                        {e.ticket_url && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={e.ticket_url} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={del.isPending}
                          onClick={() => {
                            if (confirm(`Delete "${e.title}"?`)) del.mutate(e.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
              {filtered.length === 0 && (
                <div className="col-span-full grid place-items-center rounded-2xl border border-dashed border-border py-16 text-sm text-muted-foreground">
                  No {tab} events.
                </div>
              )}
            </div>
          )}
        </>
      )}
    </BusinessPageShell>
  );
}

function LoadingBlock() {
  return (
    <div className="grid place-items-center py-16 text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}
