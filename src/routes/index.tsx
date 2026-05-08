import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, Sparkles, Ticket } from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { EventCard } from "@/components/EventCard";
import { CATEGORIES, EVENTS } from "@/lib/events";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Confetti — Find events worth showing up for" },
      {
        name: "description",
        content:
          "Discover concerts, festivals, food markets, talks, and meetups happening near you. Bright, joyful event discovery.",
      },
      { property: "og:title", content: "Confetti — Find events worth showing up for" },
      {
        property: "og:description",
        content: "Discover concerts, festivals, talks, and meetups near you.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const featured = EVENTS.slice(0, 6);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-20 pt-12 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:px-8 lg:pt-20">
          <div className="relative z-10 flex flex-col justify-center">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground shadow-soft">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              2,400+ events live this week
            </span>
            <h1 className="mt-5 font-display text-5xl font-bold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              Find events
              <br />
              that actually
              <br />
              <span className="text-gradient">spark joy.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg text-muted-foreground">
              Concerts, food markets, founder summits, sunrise yoga — handpicked
              gatherings happening right around you.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/events"
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-sm font-semibold text-background shadow-pop transition-pop hover:scale-105"
              >
                Browse events
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3.5 text-sm font-semibold transition-pop hover:bg-muted">
                <Ticket className="h-4 w-4" />
                Host your own
              </button>
            </div>

            <div className="mt-10 flex flex-wrap gap-6 text-sm">
              {[
                ["120k+", "going this month"],
                ["48", "cities"],
                ["4.9★", "host rating"],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="font-display text-2xl font-bold">{k}</div>
                  <div className="text-muted-foreground">{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-hero opacity-40 blur-3xl" />
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-pop">
              <img
                src={heroImg}
                alt="Crowd cheering with confetti at a vibrant concert"
                width={1600}
                height={1100}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                <div className="flex items-center gap-3 text-primary-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-semibold">
                    Trending: Neon Nights · Sat 8pm
                  </span>
                </div>
              </div>
            </div>

            {/* floating ticket */}
            <div className="absolute -left-4 top-10 hidden rotate-[-8deg] rounded-2xl bg-card p-4 shadow-pop md:block">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-warm">
                  <Ticket className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Just sold</div>
                  <div className="text-sm font-semibold">VIP · Sunset Market</div>
                </div>
              </div>
            </div>
            <div className="absolute -right-4 bottom-16 hidden rotate-[6deg] rounded-2xl bg-card p-4 shadow-pop md:block">
              <div className="text-xs text-muted-foreground">Going</div>
              <div className="mt-1 flex -space-x-2">
                {["bg-magenta", "bg-tangerine", "bg-sun", "bg-grape"].map((c) => (
                  <span
                    key={c}
                    className={`h-7 w-7 rounded-full border-2 border-card ${c}`}
                  />
                ))}
              </div>
              <div className="mt-1 text-sm font-semibold">+842 friends</div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Browse by vibe
          </h2>
          <Link
            to="/events"
            className="text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            See all →
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((cat, i) => {
            const palette = [
              "bg-gradient-vibe text-primary-foreground",
              "bg-gradient-warm",
              "bg-magenta text-primary-foreground",
              "bg-grape text-primary-foreground",
              "bg-tangerine",
              "bg-sun",
            ][i % 6];
            return (
              <a
                key={cat}
                href={`/events?cat=${cat}`}
                className={`group flex aspect-square flex-col justify-between rounded-2xl p-4 transition-pop hover:-translate-y-1 hover:shadow-pop ${palette}`}
              >
                <span className="text-xs font-semibold opacity-80">
                  Category
                </span>
                <span className="font-display text-2xl font-bold">{cat}</span>
              </a>
            );
          })}
        </div>
      </section>

      {/* FEATURED EVENTS */}
      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <span className="text-sm font-semibold text-primary">
              Don't miss
            </span>
            <h2 className="mt-1 font-display text-3xl font-bold sm:text-4xl">
              Trending this week
            </h2>
          </div>
          <Link
            to="/events"
            className="hidden text-sm font-semibold text-muted-foreground hover:text-foreground sm:block"
          >
            View all events →
          </Link>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-10 sm:p-16">
          <div className="relative z-10 max-w-xl">
            <h2 className="font-display text-4xl font-bold leading-tight text-primary-foreground sm:text-5xl">
              Throw the event everyone talks about Monday morning.
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/90">
              Free to list. Sell tickets in minutes. Beautiful by default.
            </p>
            <button className="mt-8 inline-flex items-center gap-2 rounded-full bg-background px-6 py-3.5 text-sm font-semibold text-foreground shadow-pop transition-pop hover:scale-105">
              Start hosting
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-sun/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 right-32 h-72 w-72 rounded-full bg-grape/40 blur-3xl" />
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
