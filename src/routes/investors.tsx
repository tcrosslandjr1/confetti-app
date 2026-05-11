import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/investors")({
  head: () => ({
    meta: [
      { title: "Investors — Loop" },
      {
        name: "description",
        content:
          "Why Loop is the joyful planner category leader — traction, market, and how to back us.",
      },
      { property: "og:title", content: "Investors — Loop" },
      {
        property: "og:description",
        content: "Loop's investor brief: market, traction, model, and contact.",
      },
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
    body: "Going out is a $1.4T global spend with no native planning layer. Calendars, maps, and reviews are not plans. Loop owns the verb 'plan a night.'",
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
    body: "Loop turns intent ('Saturday with the in-laws') into a confirmed itinerary. We're the execution layer, not another chatbot.",
  },
];

const useOfFunds = [
  { pct: "45%", label: "Supply & city expansion" },
  { pct: "30%", label: "Product & AI itinerary engine" },
  { pct: "15%", label: "Advertiser growth" },
  { pct: "10%", label: "G&A" },
];

const faq: { group: string; items: { q: string; a: string }[] }[] = [
  {
    group: "Traction",
    items: [
      {
        q: "What's the current scale?",
        a: "42K+ plans built across 14 metros, 1.8K partner venues, and a 61% 30-day repeat rate among planners. Weekly active planners have grown ~22% MoM over the last two quarters.",
      },
      {
        q: "How are you measuring engagement?",
        a: "Three north-stars: plans completed (intent → confirmed itinerary), repeat planning rate (30/90 day), and bookings per plan. We instrument every step from vibe-pick to door-to-door.",
      },
      {
        q: "What's driving acquisition today?",
        a: 'Organic referral (each plan is shared with a crew of 2–4), SEO on long-tail occasion queries ("date night Brooklyn"), and partner co-marketing with venues.',
      },
    ],
  },
  {
    group: "Market",
    items: [
      {
        q: "How big is the opportunity?",
        a: "Going-out spend is $1.4T globally, $310B US. Today it's coordinated through calendars, group chats, and reviews — none of which produce a plan. We treat 'plan a night' as a category, not a feature.",
      },
      {
        q: "Who do you compete with?",
        a: "Reviews (Yelp, Google), reservations (OpenTable, Resy), and discovery (TimeOut). None deliver an end-to-end itinerary. Our wedge is the plan itself — the connective tissue between intent and bookings.",
      },
      {
        q: "Why now?",
        a: "LLMs finally make personalized, occasion-aware itineraries cheap to generate. Consumers are also re-prioritizing real-world experiences post-pandemic, and venues are hungry for incremental demand outside Friday/Saturday primetime.",
      },
    ],
  },
  {
    group: "Pricing & model",
    items: [
      {
        q: "How do you make money?",
        a: "Three streams: (1) advertiser subscriptions and placements (Starter / Featured / Spotlight), (2) booking take-rate via partner reservations, (3) optional Loop+ consumer membership for premium picks and concierge.",
      },
      {
        q: "What's the unit economics picture?",
        a: "Blended contribution margin is ~71% on advertiser revenue and ~58% on booking take-rate. Payback on paid acquisition is currently <4 months in launched metros.",
      },
      {
        q: "Are you raising prices?",
        a: "Not on the consumer side — the planner stays free. Advertiser tiers will move to dynamic pricing as inventory tightens in top metros, expected Q3.",
      },
    ],
  },
  {
    group: "Fundraising timeline",
    items: [
      {
        q: "What are you raising?",
        a: "$4M seed. $2.4M committed from existing angels and one institutional lead. $1.6M open allocation.",
      },
      {
        q: "When does the round close?",
        a: "Targeting a hard close 6 weeks from first meeting. We're prioritizing investors who can move within that window.",
      },
      {
        q: "What's the use of funds?",
        a: "45% supply & city expansion, 30% product and the AI itinerary engine, 15% advertiser growth, 10% G&A. Detailed model available in the data room.",
      },
      {
        q: "What's next after seed?",
        a: "We expect to raise a Series A in 12–18 months on the back of multi-city profitability and a clear advertiser ARR ramp.",
      },
    ],
  },
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
            Loop is building the operating system for going out — itineraries, bookings, and venue
            discovery in one joyful flow. We're raising to expand to 25 metros and double the
            advertiser base.
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
                <div className="font-display text-4xl font-extrabold text-ink sm:text-5xl">
                  {m.value}
                </div>
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
              <li className="flex justify-between border-b border-ink/10 pb-3">
                <span>Stage</span>
                <span className="font-mono text-sm">Seed</span>
              </li>
              <li className="flex justify-between border-b border-ink/10 pb-3">
                <span>Target</span>
                <span className="font-mono text-sm">$4.0M</span>
              </li>
              <li className="flex justify-between border-b border-ink/10 pb-3">
                <span>Committed</span>
                <span className="font-mono text-sm">$2.6M</span>
              </li>
              <li className="flex justify-between border-b border-ink/10 pb-3">
                <span>Lead</span>
                <span className="font-mono text-sm">In conversation</span>
              </li>
              <li className="flex justify-between">
                <span>Close</span>
                <span className="font-mono text-sm">Q3 2026</span>
              </li>
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
                    <span className="font-mono text-xs font-bold uppercase tracking-widest text-ink/70">
                      {u.label}
                    </span>
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

      {/* FAQ */}
      <section className="border-t-2 border-ink bg-cream">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
          <div className="max-w-2xl">
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-ink/60">
              / investor faq
            </span>
            <h2 className="mt-2 font-display text-4xl font-extrabold leading-[0.95] tracking-tight sm:text-5xl">
              The questions we keep getting.
            </h2>
            <p className="mt-3 text-ink/70">
              Short, direct answers. Deeper dives — model, cohort data, references — live in the
              data room.
            </p>
          </div>

          <div className="mt-12 space-y-12">
            {faq.map((group) => (
              <div key={group.group}>
                <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-coral">
                  {group.group}
                </h3>
                <div className="mt-4 divide-y-2 divide-ink/10 rounded-2xl border-2 border-ink bg-white shadow-brut">
                  {group.items.map((item) => (
                    <details
                      key={item.q}
                      className="group p-5 [&_summary::-webkit-details-marker]:hidden"
                    >
                      <summary className="flex cursor-pointer items-start justify-between gap-4 font-display text-lg font-bold text-ink">
                        <span>{item.q}</span>
                        <span
                          aria-hidden
                          className="mt-1 inline-grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-ink font-mono text-sm transition-transform group-open:rotate-45"
                        >
                          +
                        </span>
                      </summary>
                      <p className="mt-3 text-sm leading-relaxed text-ink/75">{item.a}</p>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink text-cream">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
          <h2 className="font-display text-4xl font-bold sm:text-5xl">Let's talk.</h2>
          <p className="mx-auto mt-4 max-w-xl text-cream/70">
            Data room, financial model, and customer references available under NDA. We respond
            within 48 hours.
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
