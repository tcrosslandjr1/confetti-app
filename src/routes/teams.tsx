import { createFileRoute, Link } from "@tanstack/react-router";
import { Briefcase, Users2, Wine, Mic2, ArrowRight, CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { GatedAction } from "@/components/GatedAction";

export const Route = createFileRoute("/teams")({
  head: () => ({
    meta: [
      { title: "For Teams — Corporate event planning | Loop" },
      { name: "description", content: "Plan team offsites, client dinners, and multi-day company trips in minutes. Curated venues, RSVPs, and budgets in one place." },
      { property: "og:title", content: "For Teams — Corporate event planning" },
      { property: "og:description", content: "Plan team offsites, client dinners, and multi-day company trips in minutes." },
    ],
  }),
  component: TeamsPage,
});

const USE_CASES = [
  { icon: Wine, title: "Client dinner", body: "One-night, high-touch venue with the right room and a curated wine list." },
  { icon: Users2, title: "Team night out", body: "End-of-quarter celebration: dinner, a venue change, late-night vibes." },
  { icon: Briefcase, title: "Multi-day offsite", body: "2–4 days of work sessions, dinners, and downtime — without the spreadsheet." },
  { icon: Mic2, title: "Conference add-on", body: "Curate the after-hours your attendees will actually remember." },
];

const FEATURES = [
  "Multi-day itineraries with per-day vibe + budget",
  "RSVP links for every attendee — no logins",
  "Dietary roll-up so the venue gets it right",
  "Live budget vs. per-person cap",
  "One shareable link for the whole crew",
  "White-glove handoff to the venue",
];

function TeamsPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="border-b-2 border-ink bg-cream">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-28">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-gold px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest">
                <Briefcase className="h-3 w-3" /> For Teams
              </span>
              <h1 className="mt-5 font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-7xl">
                Plan the night <span className="font-serif italic font-normal text-coral">your team</span> still talks about.
              </h1>
              <p className="mt-5 max-w-xl text-lg text-ink/80">
                From a single client dinner to a 4-day company offsite — Loop does the venue research, the RSVPs, and the budgeting so you can show up and look like a hero.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <GatedAction
                  to="/teams/new"
                  feature="team event planning"
                  className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-ink bg-ink px-6 font-mono text-xs font-bold uppercase tracking-widest text-cream shadow-brut transition-pop hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brut-lg"
                >
                  Plan an event <ArrowRight className="h-4 w-4" />
                </GatedAction>
                <Link
                  to="/contact"
                  className="inline-flex h-12 items-center rounded-full border-2 border-ink bg-cream px-6 font-mono text-xs font-bold uppercase tracking-widest text-ink shadow-brut transition-pop hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brut-lg"
                >
                  Talk to sales
                </Link>
              </div>
              <p className="mt-4 font-mono text-[11px] uppercase tracking-widest text-ink/60">
                · Free to plan · Pay only when you book ·
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {USE_CASES.map((u, i) => {
                const Icon = u.icon;
                const tilt = (i % 2 === 0 ? -1 : 1) * 0.6;
                return (
                  <div
                    key={u.title}
                    style={{ transform: `rotate(${tilt}deg)` }}
                    className="rounded-2xl border-2 border-ink bg-cream p-5 shadow-brut transition-pop hover:-translate-y-1 hover:rotate-0"
                  >
                    <Icon className="h-6 w-6" />
                    <div className="mt-3 font-display text-xl font-extrabold leading-tight">{u.title}</div>
                    <p className="mt-1 text-sm text-ink/70">{u.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-b-2 border-ink bg-ink text-cream">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <h2 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl">
              Every task you'd hand an executive assistant — handled.
            </h2>
            <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 rounded-2xl border border-cream/15 bg-cream/[0.03] p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                  <span className="text-sm">{f}</span>
                </li>
              ))}
            </ul>
            <div className="mt-10">
              <Link
                to="/teams/new"
                className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-cream bg-gold px-6 font-mono text-xs font-bold uppercase tracking-widest text-ink shadow-brut transition-pop hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brut-lg"
              >
                Start a team plan <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
