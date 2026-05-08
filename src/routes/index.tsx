import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, MapPin, Sparkles, Ticket, TrendingUp } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { EventCard } from "@/components/EventCard";
import { CATEGORIES, EVENTS } from "@/lib/events";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Confetti — Discover events you'll love" },
      {
        name: "description",
        content:
          "Find concerts, food festivals, tech meetups and unforgettable nights out. Browse local events, book tickets, and host your own with Confetti.",
      },
      { property: "og:title", content: "Confetti — Discover events you'll love" },
      {
        property: "og:description",
        content: "Browse, book, and host events. Powered by an AI concierge that knows your taste.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const featured = EVENTS.slice(0, 6);
  const trending = EVENTS.slice(6, 9);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 -z-10 bg-gradient-warm opacity-10" />
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-28">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              New • AI concierge
            </span>
            <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Find the night <span className="text-gradient">you'll remember.</span>
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Concerts, food halls, rooftop parties, tech meetups — discover thousands of
              events near you and book in seconds.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/events"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-base font-semibold text-primary-foreground shadow-pop transition-pop hover:scale-105"
              >
                Browse events <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/auth"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-border bg-card px-6 text-base font-semibold text-foreground transition-colors hover:bg-muted"
              >
                Host an event
              </Link>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-3 pt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-2"><Ticket className="h-4 w-4 text-primary" /> Instant tickets</span>
              <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Local picks</span>
              <span className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Trending now</span>
            </div>
          </div>

          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              {featured.slice(0, 4).map((e, i) => (
                <div
                  key={e.id}
                  className={`overflow-hidden rounded-3xl shadow-card ${i % 2 === 0 ? "translate-y-6" : ""}`}
                >
                  <img src={e.image} alt={e.title} className="aspect-[3/4] w-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Browse by vibe</h2>
              <p className="mt-2 text-muted-foreground">Pick a category and see what's on tonight.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {CATEGORIES.map((cat) => (
              <a
                key={cat}
                href={`/events?cat=${cat}`}
                className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold transition-pop hover:scale-105 hover:border-primary hover:text-primary"
              >
                {cat}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Featured events */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Featured events</h2>
              <p className="mt-2 text-muted-foreground">Hand-picked happenings near you.</p>
            </div>
            <Link
              to="/events"
              className="hidden items-center gap-1 text-sm font-semibold text-primary hover:underline sm:inline-flex"
            >
              See all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </div>
      </section>

      {/* Trending strip */}
      <section className="border-b border-border bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Trending this week</h2>
              <p className="mt-2 text-muted-foreground">What everyone's grabbing tickets for.</p>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trending.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </div>
      </section>

      {/* Host CTA */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-10 rounded-3xl bg-gradient-hero p-10 text-primary-foreground shadow-pop sm:p-14 lg:grid-cols-2 lg:items-center">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur">
                <Calendar className="h-3.5 w-3.5" />
                For organizers
              </span>
              <h2 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
                Host an event in minutes.
              </h2>
              <p className="max-w-lg text-base opacity-90">
                Set up ticketing, manage RSVPs, and reach a built-in audience of locals
                already looking for their next night out.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
              <Link
                to="/auth"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-base font-semibold text-foreground transition-pop hover:scale-105"
              >
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/events"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-white/40 px-6 text-base font-semibold text-white transition-colors hover:bg-white/10"
              >
                See examples
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
