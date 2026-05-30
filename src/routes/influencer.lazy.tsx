import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { Camera, Gift, Sparkles, TrendingUp, Users } from "lucide-react";

export const Route = createLazyFileRoute("/influencer")({
  component: InfluencerPage,
});

const TIERS = [
  {
    name: "Explorer",
    followers: "1K–10K",
    perks: ["Free priority reservations", "Exclusive venue invites", "Confetti merch kit"],
  },
  {
    name: "Tastemaker",
    followers: "10K–50K",
    perks: [
      "Complimentary dining credits",
      "Early access to new cities",
      "Co-branded content features",
    ],
  },
  {
    name: "Icon",
    followers: "50K+",
    perks: ["Revenue share on referrals", "Custom event hosting", "Brand partnership intros"],
  },
];

const STEPS = [
  { icon: Camera, label: "Apply", desc: "Share your profile and content style" },
  { icon: Sparkles, label: "Get matched", desc: "We pair you with venues that fit your vibe" },
  { icon: TrendingUp, label: "Create & earn", desc: "Post, tag, and unlock rewards" },
];

function InfluencerPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/5 to-background px-4 py-20 text-center">
        <div className="mx-auto max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3 w-3" /> Now accepting applications
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
            The Confetti Influencer Program
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Turn your nightlife and dining content into exclusive perks, free experiences, and real
            income.
          </p>
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="mt-8 inline-flex items-center rounded-full bg-ink px-7 py-3 text-sm font-bold text-cream shadow-lg transition hover:opacity-90"
          >
            Apply now
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-4xl px-4 py-16">
        <h2 className="mb-10 text-center font-display text-2xl font-bold">How it works</h2>
        <div className="grid gap-8 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={i} className="text-center">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10">
                <step.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">{step.label}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tiers */}
      <section className="border-t border-border bg-muted/30 px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-center font-display text-2xl font-bold">Compensation tiers</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {TIERS.map((tier) => (
              <div key={tier.name} className="rounded-2xl border border-border bg-background p-6">
                <h3 className="font-display text-lg font-bold">{tier.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{tier.followers} followers</p>
                <ul className="mt-4 space-y-2">
                  {tier.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2 text-sm">
                      <Gift className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 text-center">
        <div className="mx-auto max-w-md">
          <Users className="mx-auto h-8 w-8 text-primary" />
          <h2 className="mt-4 font-display text-2xl font-bold">Ready to join?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We review applications weekly. Accepted creators get onboarded within 48 hours.
          </p>
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="mt-6 inline-flex items-center rounded-full bg-ink px-7 py-3 text-sm font-bold text-cream transition hover:opacity-90"
          >
            Apply now
          </Link>
        </div>
      </section>
    </div>
  );
}
