import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { EventCard } from "@/components/EventCard";
import { CATEGORIES, EVENTS, type EventCategory } from "@/lib/events";

type EventsSearch = { cat?: EventCategory; q?: string };

export const Route = createFileRoute("/events/")({
  head: () => ({
    meta: [
      { title: "Browse events — Confetti" },
      {
        name: "description",
        content:
          "Search and filter events by category, city, and date. Find your next night out.",
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
  }),
  component: BrowseEvents,
});

function BrowseEvents() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [query, setQuery] = useState(search.q ?? "");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EVENTS.filter((e) => {
      if (search.cat && e.category !== search.cat) return false;
      if (!q) return true;
      return (
        e.title.toLowerCase().includes(q) ||
        e.city.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q)
      );
    });
  }, [search.cat, query]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="border-b border-border bg-gradient-warm/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl font-bold sm:text-5xl">
            Browse <span className="text-gradient">events</span>
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            {filtered.length} event{filtered.length === 1 ? "" : "s"} matching
            your vibe.
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

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={() => navigate({ search: (p: any) => ({ ...p, cat: undefined }) })}
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
                      search: (p: any) => ({ ...p, cat: active ? undefined : c }),
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
              Try a different category or search term.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}
