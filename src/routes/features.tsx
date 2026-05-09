import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { GatedAction } from "@/components/GatedAction";
import { Sparkles, Calendar, MapPin, Heart, Compass, Users, Wand2, Car } from "lucide-react";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — Confetti" },
      { name: "description", content: "AI-planned outings, multi-stop routing, saved reservations, and a taste profile that learns what you love." },
      { property: "og:title", content: "Features — Confetti" },
      { property: "og:description", content: "Everything Confetti does to plan outings worth showing up for." },
    ],
  }),
  component: FeaturesPage,
});

const features = [
  { icon: Wand2, title: "AI-planned itineraries", body: "Pick a vibe — date night, kids day out, guys' night — and get a full schedule in seconds." },
  { icon: Car, title: "Door-to-door routing", body: "Car, transit, walking, Uber or Lyft. Confetti picks the best mode and gives you one-tap directions." },
  { icon: Calendar, title: "Saved reservations", body: "Store confirmations, party size, contact info and times for every stop in one place." },
  { icon: Heart, title: "Taste profile", body: "Tell us what you love. We learn from your social vibe and tune every suggestion to match." },
  { icon: MapPin, title: "Local discoveries", body: "Jump parks, paint nights, Home Depot kids days, hidden patios — not the same five chain restaurants." },
  { icon: Users, title: "For every crew", body: "Couples, families, elders, friend groups. Different ages, different energies, perfect plans." },
];

function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Features
          </span>
          <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            Everything you need to <span className="text-gradient">actually go out.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Confetti turns "what should we do?" into a full plan — with stops, timing, transit and reservations.
          </p>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-16 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="rounded-3xl border border-border bg-card p-6 shadow-card">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-vibe text-primary-foreground">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-display text-xl font-bold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-b border-border bg-muted/40">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <Compass className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">Ready to try it?</h2>
          <p className="mt-3 text-muted-foreground">Plan your first outing in under a minute.</p>
          <GatedAction to="/plan" feature="planning" className="mt-6 inline-flex h-12 items-center rounded-full bg-foreground px-6 text-sm font-semibold text-background transition-pop hover:scale-105">
            Launch the app
          </GatedAction>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
