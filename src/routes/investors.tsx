import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/investors")({
  head: () => ({
    meta: [
      { title: "Investors — Confetti" },
      { name: "description", content: "Why Confetti is the joyful planner category leader — traction, market, and how to back us." },
      { property: "og:title", content: "Investors — Confetti" },
      { property: "og:description", content: "Confetti's investor brief: market, traction, model, and contact." },
    ],
  }),
  component: InvestorsPage,
});

const metrics = [
  { label: "Plans built", value: "42K+", note: "since launch" },
  { label: "Avg. plan time", value: "94s", note: "vs ~22 min ad-hoc" },
  { label: "Repeat rate", value: "61%", note: "30-day return planners" },
  { label: "Partner venues", value: "1.8K", note: "across 14 metros" },
];

const pillars = [
  {
    title: "A category, not a feature",
    body: "Going out is a $1.4T global spend with no native planning layer. Calendars, maps, and reviews are not plans. Confetti owns the verb 'plan a night.'",
  },
  {
    title: "Three-sided flywheel",
    body: "Visitors discover, customers plan and book, advertisers pay for placement. Each side compounds the other — more plans, better data, sharper recs.",
  },
  {
    title: "Software margins, local moat",
    body: "Self-serve advertiser portal + booking take-rate. Local supply (venues, operators) is sticky once curated and onboarded.",
  },
  {
    title: "Built for the AI shift",
    body: "Confetti turns intent ('Saturday with the in-laws') into a confirmed itinerary. We're the execution layer, not another chatbot.",
  },
];

const useOfFunds = [
  { pct: "45%", label: "Supply & city expansion" },
  { pct: "30%", label: "Product & AI itinerary engine" },
  { pct: "15%", label: "Advertiser growth" },
  { pct: "10%", label: "G&A" },
];

function InvestorsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="border-b-2 border-ink bg-cream">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-coral">
            Investor brief · Series Seed
          </p>
          <h1 className="mt-4 font-display text-5xl font-extrabold tracking-tight text-ink sm:text-7xl">
            Back the planner that gets <span className="text-gradient">people out the door.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-ink/70">
            Confetti is building the operating system for going out — itineraries, bookings, and venue discovery in one joyful flow. We're raising to expand to 25 metros and double the advertiser base.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="mailto:investors@confetti.app"
              className="inline-flex h-12 items-center rounded-full border-2 border-ink bg-ink px-6 font-mono text-xs font-bold uppercase tracking-widest text-cream shadow-brut transition-pop hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brut-lg"
            >
              Request the deck →
            </a>
            <Link
              to="/contact"
              className="inline-flex h-12 items-center rounded-full border-2 border-ink bg-cream px-6 font-mono text-xs font-bold uppercase tracking-widest text-ink shadow-brut transition-pop hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brut-lg"
            >
              Book a call
            </Link>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="border-b-2 border-ink bg-background">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-0 px-4 sm:grid-cols-4 sm:px-6 lg:px-8">
          {metrics.map((m, i) => (
            <div
              key={m.label}
              className={`py-10 ${i !== 0 ? "border-l-2 border-ink/10" : ""} ${i < 2 ? "border-b-2 border-ink/10 sm:border-b-0" : ""}`}
            >
              <div className="px-4">
                <div className="font-display text-4xl font-extrabold text-ink sm:text-5xl">{m.value}</div>
                <div className="mt-2 font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">
                  {m.label}
                </div>
                <div className="mt-1 text-xs text-ink/50">{m.note}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pillars */}
      <section className="border-b-2 border-ink bg-cream/40">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            The thesis
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {pillars.map((p) => (
              <div
                key={p.title}
                className="rounded-3xl border-2 border-ink bg-background p-6 shadow-brut transition-pop hover:-translate-y-0.5 hover:shadow-brut-lg"
              >
                <h3 className="font-display text-xl font-bold text-ink">{p.title}</h3>
                <p className="mt-3 text-sm text-ink/70">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Round + use of funds */}
      <section className="border-b-2 border-ink bg-background">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-coral">
              The round
            </p>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-ink">
              Raising $4M seed
            </h2>
            <ul className="mt-6 space-y-3 text-ink/80">
              <li className="flex justify-between border-b border-ink/10 pb-3"><span>Stage</span><span className="font-mono text-sm">Seed</span></li>
              <li className="flex justify-between border-b border-ink/10 pb-3"><span>Target</span><span className="font-mono text-sm">$4.0M</span></li>
              <li className="flex justify-between border-b border-ink/10 pb-3"><span>Committed</span><span className="font-mono text-sm">$2.6M</span></li>
              <li className="flex justify-between border-b border-ink/10 pb-3"><span>Lead</span><span className="font-mono text-sm">In conversation</span></li>
              <li className="flex justify-between"><span>Close</span><span className="font-mono text-sm">Q3 2026</span></li>
            </ul>
          </div>
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-coral">
              Use of funds
            </p>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-ink">
              Where it goes
            </h2>
            <div className="mt-6 space-y-4">
              {useOfFunds.map((u) => (
                <div key={u.label}>
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-xs font-bold uppercase tracking-widest text-ink/70">{u.label}</span>
                    <span className="font-display text-xl font-extrabold text-ink">{u.pct}</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full border-2 border-ink bg-cream">
                    <div className="h-full bg-coral" style={{ width: u.pct }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink text-cream">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
          <h2 className="font-display text-4xl font-bold sm:text-5xl">
            Let's talk.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-cream/70">
            Data room, financial model, and customer references available under NDA. We respond within 48 hours.
          </p>
          <a
            href="mailto:investors@confetti.app"
            className="mt-8 inline-flex h-12 items-center rounded-full border-2 border-cream bg-coral px-6 font-mono text-xs font-bold uppercase tracking-widest text-ink shadow-brut transition-pop hover:-translate-x-0.5 hover:-translate-y-0.5"
          >
            investors@confetti.app
          </a>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
