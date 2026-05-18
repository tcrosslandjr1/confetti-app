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
import {
  listMyVenueEvents,
  deleteVenueEvent,
  createVenueEvent,
} from "@/lib/business-portal.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlacesAutocomplete, type PlaceDetails } from "@/components/PlacesAutocomplete";
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
          <AddEventDialog
            venueId={activeId}
            onCreated={() => qc.invalidateQueries({ queryKey: ["my-venue-events"] })}
          />
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

function AddEventDialog({ venueId, onCreated }: { venueId: string | null; onCreated: () => void }) {
  const createEvent = useServerFn(createVenueEvent);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [description, setDescription] = useState("");
  const [venueName, setVenueName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [ticketUrl, setTicketUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [priceUsd, setPriceUsd] = useState("");
  const [saving, setSaving] = useState(false);

  function reset() {
    setTitle("");
    setStartsAt("");
    setEndsAt("");
    setDescription("");
    setVenueName("");
    setAddress("");
    setCity("");
    setNeighborhood("");
    setLat(null);
    setLng(null);
    setTicketUrl("");
    setImageUrl("");
    setPriceUsd("");
  }

  function applyVenue(p: PlaceDetails) {
    setVenueName(p.name ?? venueName);
    if (p.formattedAddress) setAddress(p.formattedAddress);
    if (p.city) setCity(p.city);
    if (p.neighborhood) setNeighborhood(p.neighborhood);
    if (p.latitude) setLat(p.latitude);
    if (p.longitude) setLng(p.longitude);
  }

  function applyAddress(p: PlaceDetails) {
    if (p.formattedAddress) setAddress(p.formattedAddress);
    if (p.city) setCity(p.city);
    if (p.neighborhood && !neighborhood) setNeighborhood(p.neighborhood);
    if (p.latitude) setLat(p.latitude);
    if (p.longitude) setLng(p.longitude);
  }

  async function submit() {
    if (!venueId) return toast.error("Pick a venue first");
    if (!title.trim()) return toast.error("Title is required");
    if (!startsAt) return toast.error("Start time is required");
    if (!city.trim()) return toast.error("City is required");
    setSaving(true);
    try {
      await createEvent({
        data: {
          venueId,
          title: title.trim(),
          starts_at: new Date(startsAt).toISOString(),
          ends_at: endsAt ? new Date(endsAt).toISOString() : null,
          description: description || null,
          venue_name: venueName || null,
          address: address || null,
          city: city.trim(),
          neighborhood: neighborhood || null,
          lat,
          lng,
          ticket_url: ticketUrl || null,
          image_url: imageUrl || null,
          price_cents: priceUsd ? Math.round(parseFloat(priceUsd) * 100) : null,
        },
      });
      toast.success("Event created");
      onCreated();
      reset();
      setOpen(false);
    } catch (e) {
      toast.error((e as Error).message || "Failed to create event");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={!venueId}>
          <CalendarPlus className="mr-1.5 h-4 w-4" /> Add event
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>New event</DialogTitle>
          <DialogDescription>
            Publish a show, party, or pop-up. Venue & address use Google Places to autofill location
            details.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="ev-title">Title *</Label>
            <Input
              id="ev-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sunday Brunch Set"
            />
          </div>
          <div className="grid gap-2">
            <Label>Venue *</Label>
            <PlacesAutocomplete
              value={venueName}
              onChange={setVenueName}
              onSelect={applyVenue}
              types={["establishment"]}
              placeholder="Search a venue…"
              variant="venue"
            />
          </div>
          <div className="grid gap-2">
            <Label>Address</Label>
            <PlacesAutocomplete
              value={address}
              onChange={setAddress}
              onSelect={applyAddress}
              placeholder="Street address…"
              variant="address"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="ev-city">City *</Label>
              <Input
                id="ev-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Washington DC"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ev-nbhd">Neighborhood</Label>
              <Input
                id="ev-nbhd"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="Shaw"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="ev-start">Starts *</Label>
              <Input
                id="ev-start"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ev-end">Ends</Label>
              <Input
                id="ev-end"
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ev-desc">Description</Label>
            <Textarea
              id="ev-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What's the night about?"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="ev-ticket">Ticket URL</Label>
              <Input
                id="ev-ticket"
                value={ticketUrl}
                onChange={(e) => setTicketUrl(e.target.value)}
                placeholder="https://"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ev-price">Price (USD)</Label>
              <Input
                id="ev-price"
                type="number"
                step="0.01"
                min="0"
                value={priceUsd}
                onChange={(e) => setPriceUsd(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ev-img">Cover image URL</Label>
            <Input
              id="ev-img"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
            Create event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
