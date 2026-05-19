import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { formatEventDate, type EventItem } from "@/lib/events";

export function EventCard({ event }: { event: EventItem }) {
  const d = formatEventDate(event.date);
  return (
    <Link
      to="/events/$eventId"
      params={{ eventId: event.id }}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-card shadow-card transition-pop hover:-translate-y-1 hover:shadow-pop"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={event.image}
          alt={event.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
         decoding="async"/>
        <div className="absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold backdrop-blur">
          {event.category}
        </div>
        <div className="absolute bottom-3 left-3 flex h-14 w-14 flex-col items-center justify-center rounded-xl bg-background shadow-soft">
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
            {d.month}
          </span>
          <span className="text-xl font-bold leading-none">{d.day}</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-display text-lg font-bold leading-tight">{event.title}</h3>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {event.city}
        </div>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-sm font-semibold">
            {event.price === 0 ? (
              <span className="text-gradient">Free</span>
            ) : (
              <>From ${event.price}</>
            )}
          </span>
          <span className="text-xs text-muted-foreground">
            {d.weekday} · {d.time}
          </span>
        </div>
      </div>
    </Link>
  );
}
