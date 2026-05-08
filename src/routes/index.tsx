import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Wand2, Car, Calendar, Heart, Star, Check } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { OCCASIONS } from "@/lib/occasions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Confetti — The joyful planner for outings worth showing up for" },
      {
        name: "description",
        content:
          "Confetti turns 'what should we do?' into a full plan. AI itineraries, multi-stop routing, saved reservations — for date night, family time, friends and every vibe in between.",
      },
      { property: "og:title", content: "Confetti — The joyful planner for outings" },
      { property: "og:description", content: "From vibe to door-to-door plan in under a minute." },
    ],
  }),
  component: Landing,
});

const VALUE_PROPS = [
  { icon: Wand2, title: "AI itineraries", body: "A full schedule from one prompt." },
  { icon: Car, title: "Door-to-door routing", body: "Car, transit, Uber or Lyft, sorted." },
  { icon: Calendar, title: "Saved reservations", body: "Confirmations live in one vault." },
  { icon: Heart, title: "Tuned to you", body: "A taste profile that learns what you love." },
];

const TESTIMONIALS = [
  { name: "Mara K.", role: "Mom of two", quote: "Saturdays used to be a stalemate. Now we have a plan before breakfast." },
  { name: "Devin R.", role: "Date-night believer", quote: "It found a rooftop, a noodle spot and a vinyl bar — all in walking distance. Felt like a concierge." },
  { name: "Priya S.", role: "Group-text MVP", quote: "The shared trip killed our 47-message group chat. Everyone just voted." },
];

const FAQS = [
  { q: "Is Confetti free?", a: "Yes — start free with up to 3 AI itineraries a month. Plus unlocks unlimited plans and the saved reservations vault." },
  { q: "What kinds of outings does it plan?", a: "Date nights, kids' day-outs, guys' afternoons, girls' nights, in-laws weekends, elder-friendly museum days, small-town adventures — pick a vibe or describe it." },
  { q: "How does the routing work?", a: "Confetti picks the best mode between stops (car, transit, walking, Uber, Lyft) and gives you one-tap directions or rideshare deep links." },
  { q: "Do I need to connect social media?", a: "No. Connecting is optional and helps the AI learn your taste faster. You can also chat with the concierge to share what you like." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 -z-10 bg-gradient-warm opacity-10" />
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28 lg:px-8">
          <div className="flex flex-col justify-center">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Outings worth showing up for
            </span>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Plan the day. <span className="text-gradient">Skip the group chat.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Confetti turns "what should we do?" into a full plan — multi-stop, timed, routed and reservation-ready. For every vibe, every crew, every weekend.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/plan" className="inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-semibold text-background transition-pop hover:scale-105">
                Plan my day <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/how-it-works" className="inline-flex h-12 items-center rounded-full border border-border bg-card px-6 text-sm font-semibold transition-colors hover:bg-muted">
                See how it works
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex -space-x-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className={`h-7 w-7 rounded-full border-2 border-background bg-gradient-to-br ${["from-pink-400 to-orange-300", "from-violet-400 to-indigo-300", "from-emerald-400 to-teal-300", "from-amber-400 to-rose-300"][i]}`} />
                ))}
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
                <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
                <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
                <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
                <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
                <span className="ml-1">Loved by early planners</span>
              </div>
            </div>
          </div>

          {/* Mock preview card */}
          <div className="relative">
            <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-vibe opacity-20 blur-2xl" />
            <div className="rounded-[2rem] border border-border bg-card p-5 shadow-pop">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="rounded-full bg-muted px-2 py-1 font-semibold uppercase tracking-wider">Saturday plan</span>
                <span>3 stops · 6h · ~$84</span>
              </div>
              <div className="mt-4 space-y-3">
                {[
                  { t: "11:00", title: "Brunch at Lila's Patio", sub: "12 min · walk", color: "from-pink-400 to-rose-300" },
                  { t: "1:30", title: "Vinyl crawl on Mason St.", sub: "8 min · car", color: "from-violet-400 to-indigo-300" },
                  { t: "5:00", title: "Sunset rooftop at Aera", sub: "10 min · Lyft", color: "from-amber-400 to-orange-300" },
                ].map((s) => (
                  <div key={s.t} className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3">
                    <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${s.color} text-sm font-bold text-white`}>
                      {s.t}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{s.title}</div>
                      <div className="text-xs text-muted-foreground">{s.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-muted/60 p-3 text-xs">
                <span className="font-semibold">Reservation saved</span>
                <span className="text-muted-foreground">Confirmation #A7K2</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value props strip */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {VALUE_PROPS.map((v) => {
            const Icon = v.icon;
            return (
              <div key={v.title} className="rounded-2xl border border-border bg-card p-5">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-vibe text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold">{v.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{v.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Occasions */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                What's the <span className="text-gradient">occasion?</span>
              </h2>
              <p className="mt-2 max-w-xl text-muted-foreground">
                Tap a vibe to see ideas. Or jump straight into the planner.
              </p>
            </div>
            <Link to="/plan" className="hidden h-11 items-center rounded-full bg-foreground px-5 text-sm font-semibold text-background transition-pop hover:scale-105 sm:inline-flex">
              Plan a day
            </Link>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

      {/* Testimonials */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="text-center font-display text-3xl font-bold tracking-tight sm:text-4xl">
            People love <span className="text-gradient">going out again</span>
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="rounded-3xl border border-border bg-card p-6 shadow-card">
                <div className="flex gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                </div>
                <blockquote className="mt-4 text-base">"{t.quote}"</blockquote>
                <figcaption className="mt-5 text-sm">
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-muted-foreground">{t.role}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="border-b border-border bg-muted/40">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Free to start. <span className="text-gradient">Plus when you're hooked.</span>
              </h2>
              <p className="mt-3 text-muted-foreground">
                Three AI itineraries a month, on the house. Upgrade for unlimited plans, the reservations vault and a taste profile that keeps learning.
              </p>
              <Link to="/pricing" className="mt-6 inline-flex h-11 items-center rounded-full bg-foreground px-5 text-sm font-semibold text-background transition-pop hover:scale-105">
                See pricing
              </Link>
            </div>
            <ul className="space-y-3 rounded-3xl border border-border bg-card p-6 text-sm">
              {["Unlimited AI itineraries", "Multi-stop routing & transit", "Saved reservations vault", "Full taste profile"].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" /> {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
          <h2 className="text-center font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Questions, answered
          </h2>
          <div className="mt-10 space-y-3">
            {FAQS.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-border bg-card p-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between gap-4 font-semibold">
                  {f.q}
                  <span className="text-muted-foreground transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Big CTA */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
          <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Your next outing <span className="text-gradient">starts here.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Tell Confetti the vibe. Get a real plan in under a minute.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/plan" className="inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-semibold text-background transition-pop hover:scale-105">
              Plan my day <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/features" className="inline-flex h-12 items-center rounded-full border border-border bg-card px-6 text-sm font-semibold transition-colors hover:bg-muted">
              Explore features
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
