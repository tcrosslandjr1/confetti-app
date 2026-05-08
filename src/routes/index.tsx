import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { OCCASIONS } from "@/lib/occasions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Confetti — Outing ideas for every occasion" },
      {
        name: "description",
        content:
          "Date night, girls' night, family time, meeting the in-laws, exploring small towns — get personalized outing ideas as swipeable flashcards.",
      },
      { property: "og:title", content: "Confetti — Outing ideas for every occasion" },
      {
        property: "og:description",
        content: "Pick an occasion, swipe through ideas tuned to your vibe.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 -z-10 bg-gradient-warm opacity-10" />
        <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 lg:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Personalized outing ideas
          </span>
          <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            What's the <span className="text-gradient">occasion?</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Tap a vibe and we'll deal you a stack of swipeable ideas — date night, girls' night,
            family time, meeting the in-laws, off-the-map adventures. Save the ones you love.
          </p>
        </div>
      </section>

      {/* Occasion grid */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {OCCASIONS.map((o) => {
              const Icon = o.icon;
              return (
                <Link
                  key={o.slug}
                  to="/ideas/$slug"
                  params={{ slug: o.slug }}
                  className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${o.gradient} p-6 text-white shadow-card transition-pop hover:-translate-y-1 hover:shadow-pop`}
                >
                  <div className="flex items-start justify-between">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/20 backdrop-blur">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-3xl">{o.emoji}</span>
                  </div>
                  <div className="mt-12">
                    <h3 className="font-display text-2xl font-bold leading-tight">{o.title}</h3>
                    <p className="mt-1 text-sm opacity-90">{o.tagline}</p>
                  </div>
                  <ArrowRight className="absolute bottom-6 right-6 h-5 w-5 opacity-60 transition-transform group-hover:translate-x-1 group-hover:opacity-100" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b border-border bg-muted/40">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="text-center font-display text-3xl font-bold tracking-tight sm:text-4xl">
            How Confetti works
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              { n: "01", t: "Pick the occasion", d: "From low-key Sunday to first-time-meeting-the-parents." },
              { n: "02", t: "Swipe the cards", d: "Like Tinder for plans. Right to save, left to skip, tap to plan." },
              { n: "03", t: "Make it happen", d: "Every card is ready-to-go: timeline, cost, what to wear." },
            ].map((s) => (
              <div key={s.n} className="space-y-3">
                <div className="font-display text-4xl font-bold text-gradient">{s.n}</div>
                <h3 className="font-display text-xl font-bold">{s.t}</h3>
                <p className="text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
