import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Calendar, ExternalLink, MapPin, User } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { formatEventDate, getEvent, fetchEventById, EVENTS } from "@/lib/events";
import { EventCard } from "@/components/EventCard";
import { EventSaveActions } from "@/components/EventSaveActions";
import { TicketTierSelector } from "@/components/TicketTierSelector";
import { toast } from "sonner";

export const Route = createFileRoute("/events/$eventId")({
  loader: async ({ params }) => {
    // Try static first (instant), then Eventbrite cache
    const event = getEvent(params.eventId) ?? (await fetchEventById(params.eventId));
    if (!event) throw notFound();
    return { event };
  },
  head: ({ loaderData }) => {
    const e = loaderData?.event;
    if (!e) return { meta: [{ title: "Event — Confetti" }] };
    return {
      meta: [
        { title: `${e.title} — Confetti` },
        { name: "description", content: e.blurb },
        { property: "og:title", content: e.title },
        { property: "og:description", content: e.blurb },
        { property: "og:image", content: e.image },
        { name: "twitter:image", content: e.image },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="text-center">
        <h1 className="font-display text-5xl font-bold">Event not found</h1>
        <p className="mt-3 text-muted-foreground">That event may have ended or moved.</p>
        <Link
          to="/events"
          className="mt-6 inline-flex rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background"
        >
          Browse events
        </Link>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-muted-foreground">{error.message}</p>
      </div>
    </div>
  ),
  component: EventDetail,
});

function EventDetail() {
  const { event } = Route.useLoaderData();
  const d = formatEventDate(event.date);
  const isEventbrite = event.source === "eventbrite";
  const related = EVENTS.filter((e) => e.id !== event.id && e.category === event.category).slice(
    0,
    3,
  );

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero image */}
      <section className="relative">
        <div className="relative h-[44vh] min-h-[320px] w-full overflow-hidden">
          <img
            src={event.image}
            alt={event.title}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </div>

        <div className="mx-auto -mt-32 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
            {/* Main */}
            <div className="relative rounded-3xl bg-card p-8 shadow-card sm:p-10">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-gradient-vibe px-3 py-1 text-xs font-semibold text-primary-foreground">
                  {event.category}
                </span>
                <span className="text-sm font-semibold text-primary">
                  {d.weekday}, {d.month} {d.day} · {d.time}
                </span>
              </div>

              <h1 className="mt-4 font-display text-4xl font-bold leading-tight sm:text-5xl">
                {event.title}
              </h1>

              <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {event.venue} · {event.city}
                </span>
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Hosted by {event.organizer}
                </span>
              </div>

              <div className="mt-8 h-px bg-border" />

              <div className="mt-8">
                <h2 className="font-display text-xl font-bold">About this event</h2>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  {event.blurb} Whether you're coming solo or rolling with the crew, expect great
                  vibes, friendly faces, and memories that will outlast your phone battery. Doors
                  open 30 minutes before showtime.
                </p>
                <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                  {[
                    "Wheelchair accessible venue",
                    "Re-entry allowed",
                    "Food & drinks on site",
                    "All ages welcome",
                  ].map((p) => (
                    <li
                      key={p}
                      className="flex items-center gap-2 rounded-xl bg-muted px-4 py-3 text-sm font-medium"
                    >
                      <span className="h-2 w-2 rounded-full bg-gradient-vibe" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Sticky ticket card */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-3xl bg-card p-6 shadow-pop">
                <div className="mb-4 flex items-center gap-3 rounded-2xl bg-muted p-3">
                  <div className="flex h-14 w-14 flex-col items-center justify-center rounded-xl bg-background">
                    <span className="text-[10px] font-bold uppercase text-primary">{d.month}</span>
                    <span className="text-xl font-bold leading-none">{d.day}</span>
                  </div>
                  <div className="text-sm">
                    <div className="font-semibold">{d.full}</div>
                    <div className="text-muted-foreground">{d.time} local time</div>
                  </div>
                </div>

                {isEventbrite && event.ticketUrl ? (
                  <div className="space-y-3">
                    <div className="rounded-xl bg-muted p-4 text-center">
                      <p className="text-2xl font-bold">
                        {event.price === 0 ? "Free" : `$${event.price}`}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {event.price === 0 ? "Free event" : "Starting price"}
                      </p>
                    </div>
                    <a
                      href={event.ticketUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-vibe px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-pop transition-transform hover:scale-[1.02] active:scale-95"
                    >
                      Get tickets on Eventbrite
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                ) : (
                  <TicketTierSelector
                    tiers={[
                      {
                        id: `${event.id}-ga`,
                        name: "General Admission",
                        description: "Standard entry with full access to the event",
                        price: event.price,
                        capacity: 200,
                        sold: 142,
                      },
                      {
                        id: `${event.id}-vip`,
                        name: "VIP",
                        description: "Priority entry, premium bar, reserved seating",
                        price: event.price > 0 ? Math.round(event.price * 2) : 50,
                        capacity: 50,
                        sold: 38,
                      },
                      {
                        id: `${event.id}-table`,
                        name: "Table Service",
                        description: "Private table for 4, bottle service included",
                        price: event.price > 0 ? Math.round(event.price * 5) : 200,
                        capacity: 10,
                        sold: 7,
                      },
                    ]}
                    onPurchase={(selections) => {
                      const total = selections.reduce((sum, s) => sum + s.quantity, 0);
                      toast.success(
                        `${total} ticket${total !== 1 ? "s" : ""} reserved — redirecting to checkout`,
                      );
                    }}
                  />
                )}

                <div className="mt-4">
                  <EventSaveActions event={event} />
                </div>

                <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  Add to calendar after checkout
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            More {event.category.toLowerCase()} events
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}

      <SiteFooter />
    </div>
  );
}
