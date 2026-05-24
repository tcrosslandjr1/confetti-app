import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import { LocateFixed, MapPin, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { EventCard } from "@/components/EventCard";
import {
  CATEGORIES,
  CITIES,
  EVENTS,
  distanceMiles,
  fetchLiveEvents,
  type EventCategory,
  type EventItem,
} from "@/lib/events";

type EventsSearch = {
  cat?: EventCategory;
  q?: string;
  loc?: string; // city name or "me"
  lat?: number;
  lng?: number;
  radius?: number; // miles
};

export const Route = createFileRoute("/events/")({
  head: () => ({
    meta: [
      { title: "Browse events — Confetti" },
      {
        name: "description",
        content:
          "Search and filter events by category, neighborhood, and distance. Find your next night out near you.",
      },
      { property: "og:title", content: "Browse events — Confetti" },
      {
        property: "og:description",
        content: "Search and filter events near you.",
      },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): EventsSearch => ({
    cat:
      typeof s.cat === "string" && CATEGORIES.includes(s.cat as EventCategory)
        ? (s.cat as EventCategory)
        : undefined,
    q: typeof s.q === "string" ? s.q : undefined,
    loc: typeof s.loc === "string" ? s.loc : undefined,
    lat: typeof s.lat === "number" ? s.lat : undefined,
    lng: typeof s.lng === "number" ? s.lng : undefined,
    radius: typeof s.radius === "number" ? s.radius : undefined,
  }),
  component: BrowseEvents,
});

function BrowseEvents() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [query, setQuery] = useState(search.q ?? "");
  const [locating, setLocating] = useState(false);
  const [liveEvents, setLiveEvents] = useState<EventItem[]>(EVENTS);
  const [loadingLive, setLoadingLive] = useState(false);

  const radius = search.radius ?? 50;

  // Fetch live events on mount and when filters change
  const loadEvents = useCallback(async () => {
    setLoadingLive(true);
    try {
      const events = await fetchLiveEvents({
        city: search.loc && search.loc !== "me" ? search.loc : undefined,
        category: search.cat,
        q: query.trim() || undefined,
      });
      setLiveEvents(events);
    } catch {
      // fetchLiveEvents already falls back to static
      setLiveEvents(EVENTS);
    } finally {
      setLoadingLive(false);
    }
  }, [search.loc, search.cat, query]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const origin = useMemo(() => {
    if (search.loc === "me" && search.lat != null && search.lng != null) {
      return { lat: search.lat, lng: search.lng, label: "your location" };
    }
    const city = CITIES.find((c) => c.name === search.loc);
    if (city) return { lat: city.lat, lng: city.lng, label: city.name };
    return null;
  }, [search.loc, search.lat, search.lng]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return liveEvents
      .map((e) => ({
        e,
        dist: origin ? distanceMiles(origin, { lat: e.lat, lng: e.lng }) : null,
      }))
      .filter(({ e, dist }) => {
        if (search.cat && e.category !== search.cat) return false;
        if (origin && dist != null && dist > radius) return false;
        if (!q) return true;
        return (
          e.title.toLowerCase().includes(q) ||
          e.city.toLowerCase().includes(q) ||
          e.venue.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (a.dist ?? 0) - (b.dist ?? 0));
  }, [search.cat, query, origin, radius, liveEvents]);

  function setLocation(loc: string | undefined) {
    navigate({
      search: (p: EventsSearch) => ({
        ...p,
        loc,
        lat: undefined,
        lng: undefined,
      }),
    });
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by this browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        navigate({
          search: (p: EventsSearch) => ({
            ...p,
            loc: "me",
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        });
        toast.success("Using your current location");
      },
      (err) => {
        setLocating(false);
        toast.error(err.message || "Couldn't get your location");
      },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }

  function setRadius(miles: number) {
    navigate({ search: (p: EventsSearch) => ({ ...p, radius: miles }) });
  }

  // Restore last picked location + radius on first visit (when URL has none)
  useEffect(() => {
    if (search.loc != null || search.radius != null) return;
    try {
      const raw = localStorage.getItem("confetti.events.prefs");
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<EventsSearch>;
      if (!saved || (saved.loc == null && saved.radius == null)) return;
      navigate({
        replace: true,
        search: (p: EventsSearch) => ({
          ...p,
          loc: saved.loc ?? p.loc,
          lat: saved.lat ?? p.lat,
          lng: saved.lng ?? p.lng,
          radius: saved.radius ?? p.radius,
        }),
      });
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist last picked location + radius
  useEffect(() => {
    try {
      const prefs: Partial<EventsSearch> = {};
      if (search.loc) prefs.loc = search.loc;
      if (search.loc === "me") {
        if (search.lat != null) prefs.lat = search.lat;
        if (search.lng != null) prefs.lng = search.lng;
      }
      if (search.radius != null) prefs.radius = search.radius;
      if (Object.keys(prefs).length === 0) {
        localStorage.removeItem("confetti.events.prefs");
      } else {
        localStorage.setItem("confetti.events.prefs", JSON.stringify(prefs));
      }
    } catch {
      /* ignore */
    }
  }, [search.loc, search.lat, search.lng, search.radius]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="border-b border-border bg-gradient-warm/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl font-bold sm:text-5xl">
            Browse <span className="text-gradient">events</span>
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            {loadingLive ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading live events…
              </span>
            ) : (
              <>
                {filtered.length} event{filtered.length === 1 ? "" : "s"}
                {origin ? ` within ${radius} miles of ${origin.label}` : " matching your vibe"}.
              </>
            )}
          </p>

          <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, city, or venue…"
                className="h-12 w-full rounded-full border border-border bg-card pl-11 pr-4 text-sm shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Location picker + radius */}
          <div className="mt-5 grid gap-4 rounded-2xl bg-card p-4 shadow-soft sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <MapPin className="h-4 w-4 text-primary" /> Near
              </label>
              <select
                value={search.loc ?? ""}
                onChange={(e) => setLocation(e.target.value || undefined)}
                className="h-10 flex-1 rounded-full border border-border bg-background px-4 text-sm font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Anywhere</option>
                {search.loc === "me" && search.lat != null ? (
                  <option value="me">📍 Your current location</option>
                ) : null}
                {CITIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                onClick={useMyLocation}
                disabled={locating}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold transition-colors hover:bg-muted disabled:opacity-60"
              >
                <LocateFixed className={`h-3.5 w-3.5 ${locating ? "animate-pulse" : ""}`} />
                {locating ? "Locating…" : "Use my location"}
              </button>
            </div>

            <div className="flex items-center gap-3 sm:min-w-[260px]">
              <label className="text-sm font-semibold whitespace-nowrap">
                Within{" "}
                <span className="text-primary">
                  {radius} mi{radius === 1 ? "" : ""}
                </span>
              </label>
              <input
                type="range"
                min={5}
                max={500}
                step={5}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                disabled={!origin}
                className="flex-1 accent-primary disabled:opacity-50"
                aria-label="Search radius in miles"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={() => navigate({ search: (p: EventsSearch) => ({ ...p, cat: undefined }) })}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-pop ${
                !search.cat
                  ? "bg-foreground text-background"
                  : "bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              All
            </button>
            {CATEGORIES.map((c) => {
              const active = search.cat === c;
              return (
                <button
                  key={c}
                  onClick={() =>
                    navigate({
                      search: (p: EventsSearch) => ({ ...p, cat: active ? undefined : c }),
                    })
                  }
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-pop ${
                    active
                      ? "bg-foreground text-background"
                      : "bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-16 text-center">
            <p className="font-display text-2xl font-bold">No events found</p>
            <p className="mt-2 text-muted-foreground">
              {origin
                ? `Try expanding the radius beyond ${radius} miles or pick another neighborhood.`
                : "Try a different category or search term."}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(({ e, dist }) => (
              <div key={e.id} className="relative">
                {dist != null ? (
                  <span className="absolute right-3 top-3 z-10 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold shadow-soft backdrop-blur">
                    {dist < 1 ? "<1" : Math.round(dist)} mi
                  </span>
                ) : null}
                <EventCard event={e} />
              </div>
            ))}
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}
