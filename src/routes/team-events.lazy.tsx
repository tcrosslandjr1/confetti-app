import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { Calendar, MapPin, PartyPopper, Users, Utensils } from "lucide-react";

export const Route = createLazyFileRoute("/team-events")({
  component: TeamEventsPage,
});

const USE_CASES = [
  { icon: Utensils, title: "Team dinners", desc: "Bond over food at curated restaurants that fit everyone's taste" },
  { icon: PartyPopper, title: "Celebrations", desc: "Birthdays, promotions, milestones — we find the perfect spot" },
  { icon: Calendar, title: "Offsite socials", desc: "After-hours programming for your company retreat" },
  { icon: MapPin, title: "Client entertainment", desc: "Impress clients with venues that match the vibe" },
];

function TeamEventsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="border-b border-border px-4 py-20 text-center">
        <div className="mx-auto max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Users className="h-3 w-3" /> For teams of 4–200
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Unforgettable team events, zero stress
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Tell Confetti your team size, vibe, and budget — we'll plan the
            perfect evening, handle reservations, and make sure everyone has a
            great time.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/corporate/planner"
              className="inline-flex items-center rounded-full bg-ink px-7 py-3 text-sm font-bold text-cream shadow-lg transition hover:opacity-90"
            >
              Plan an event
            </Link>
            <Link
              to="/corporate"
              className="inline-flex items-center rounded-full border border-border px-6 py-3 text-sm font-semibold transition hover:border-ink"
            >
              Learn about Corporate
            </Link>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="mx-auto max-w-4xl px-4 py-16">
        <h2 className="mb-10 text-center font-display text-2xl font-bold">
          Perfect for every occasion
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {USE_CASES.map((uc) => (
            <div
              key={uc.title}
              className="rounded-2xl border border-border p-6 transition hover:border-ink/30"
            >
              <uc.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-3 font-semibold">{uc.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{uc.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-muted/30 px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-2xl font-bold">How it works</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              { step: "1", label: "Share details", sub: "Team size, date, budget, vibe" },
              { step: "2", label: "Get options", sub: "AI picks 3 perfect venues" },
              { step: "3", label: "Book instantly", sub: "One click reserves everything" },
            ].map((s) => (
              <div key={s.step}>
                <span className="mx-auto mb-2 grid h-8 w-8 place-items-center rounded-full bg-ink text-xs font-bold text-cream">
                  {s.step}
                </span>
                <h3 className="font-semibold">{s.label}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 text-center">
        <div className="mx-auto max-w-md">
          <h2 className="font-display text-2xl font-bold">Ready to plan?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Our AI planner handles everything — or talk to our team for bespoke
            events.
          </p>
          <Link
            to="/corporate/planner"
            className="mt-6 inline-flex items-center rounded-full bg-ink px-7 py-3 text-sm font-bold text-cream transition hover:opacity-90"
          >
            Start planning
          </Link>
        </div>
      </section>
    </div>
  );
}
