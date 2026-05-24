import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { CalendarPlus, Trash2, ArrowLeft, Calendar, Clock, MapPin } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useManagedVenues, VenueSwitcher, NoVenueClaim } from "@/components/business/useManagedVenue";
import { listMyVenueEvents, createVenueEvent, deleteVenueEvent } from "@/lib/business-api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/business/events")({
  beforeLoad: async () => {
    const { requireBusinessAccess } = await import("@/lib/business-guards");
    await requireBusinessAccess();
  },
  component: BusinessEventsPage,
  head: () => ({
    meta: [
      { title: "Events — Confetti for Business" },
      { name: "description", content: "Create and manage venue events." },
    ],
  }),
});

function BusinessEventsPage() {
  useAuth();
  const qc = useQueryClient();
  const { venues, activeId, activeVenue, setActiveId, isLoading: venuesLoading } = useManagedVenues();

  const { data, isLoading } = useQuery({
    queryKey: ["venue-events", activeId],
    queryFn: () => listMyVenueEvents(),
    enabled: !!activeId,
  });

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  const createMut = useMutation({
    mutationFn: () =>
      createVenueEvent({
        venueId: activeId!,
        title,
        description: description || undefined,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: endsAt ? new Date(endsAt).toISOString() : undefined,
        city: activeVenue?.city ?? "",
      }),
    onSuccess: () => {
      toast.success("Event created!");
      qc.invalidateQueries({ queryKey: ["venue-events", activeId] });
      setShowForm(false);
      setTitle("");
      setDescription("");
      setStartsAt("");
      setEndsAt("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (eventId: string) => deleteVenueEvent(eventId),
    onSuccess: () => {
      toast.success("Event deleted");
      qc.invalidateQueries({ queryKey: ["venue-events", activeId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const events = data?.events ?? [];

  if (venuesLoading) return <PageShell>Loading venues...</PageShell>;
  if (!venues.length) return <PageShell><NoVenueClaim /></PageShell>;

  return (
    <PageShell>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/business/dashboard" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Events</h1>
          <VenueSwitcher venues={venues} activeId={activeId} onChange={setActiveId} />
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <CalendarPlus className="mr-2 h-4 w-4" /> New Event
        </Button>
      </div>

      {showForm && (
        <Card className="mt-6 space-y-4 p-5">
          <h2 className="text-lg font-semibold">Create Event</h2>
          <input
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            placeholder="Event title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            placeholder="Description (optional)"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Starts at *</label>
              <input
                type="datetime-local"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Ends at</label>
              <input
                type="datetime-local"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => createMut.mutate()}
              disabled={!title || !startsAt || createMut.isPending}
              size="sm"
            >
              {createMut.isPending ? "Creating..." : "Create"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {isLoading ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">Loading events...</p>
      ) : events.length === 0 ? (
        <div className="mt-8 grid place-items-center rounded-2xl border border-dashed p-10 text-center">
          <Calendar className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No events yet. Create your first event to attract visitors.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {events.map((evt: any) => (
            <motion.div
              key={evt.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="flex items-center justify-between p-4">
                <div>
                  <h3 className="font-semibold">{evt.title}</h3>
                  {evt.description && (
                    <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">{evt.description}</p>
                  )}
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(evt.starts_at).toLocaleDateString()} {new Date(evt.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {evt.ends_at && (
                      <span>→ {new Date(evt.ends_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm("Delete this event?")) deleteMut.mutate(evt.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 md:px-6">{children}</div>
    </div>
  );
}
