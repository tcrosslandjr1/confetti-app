import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { GatedAction } from "@/components/GatedAction";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works — Loop" },
      {
        name: "description",
        content:
          "Three steps to a full outing plan: pick a vibe, swipe ideas, hit the road with timing, transit and reservations sorted.",
      },
      { property: "og:title", content: "How it works — Loop" },
      { property: "og:description", content: "From vibe to door-to-door plan in three steps." },
    ],
  }),
  component: HowItWorksPage,
});

const steps = [
  {
    n: "01",
    t: "Tell us the vibe",
    d: "Date night, kids day out, meeting the in-laws, guys' night — or just describe the day in your own words.",
  },
  {
    n: "02",
    t: "Swipe through ideas",
    d: "Tinder for plans. Right to save, left to skip. Each card is a real spot tuned to your taste profile.",
  },
  {
    n: "03",
    t: "Get a full plan",
    d: "Multi-stop schedule with timing, travel between stops, costs, dress code and one-tap reservations.",
  },
];

function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6">
          <h1 className="font-display text-5xl font-bold tracking-tight sm:text-6xl">
            From idea to <span className="text-gradient">door-to-door plan</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Three steps. No spreadsheets, no group chats, no "I don't know, what do you want to do?"
          </p>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
          <div className="grid gap-10 sm:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="space-y-3">
                <div className="font-display text-5xl font-bold text-gradient">{s.n}</div>
                <h3 className="font-display text-xl font-bold">{s.t}</h3>
                <p className="text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-14 text-center">
            <GatedAction
              to="/plan"
              feature="planning"
              className="inline-flex h-12 items-center rounded-full bg-foreground px-6 text-sm font-semibold text-background transition-pop hover:scale-105"
            >
              Plan my day
            </GatedAction>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
