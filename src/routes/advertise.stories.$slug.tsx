import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, ArrowLeft, Quote, TrendingUp, Users, MousePointerClick } from "lucide-react";

type Story = {
  slug: string;
  brand: string;
  city: string;
  category: string;
  headline: string;
  subhead: string;
  hero: string;
  stats: { label: string; value: string; icon: typeof TrendingUp }[];
  quote: { text: string; author: string; role: string };
  body: { heading: string; text: string }[];
  package: string;
};

const STORIES: Record<string, Story> = {
  "demo-cocktail-bar": {
    slug: "demo-cocktail-bar",
    brand: "Sample Cocktail Co.",
    city: "Lisbon",
    category: "Cocktail bar",
    headline: "From quiet Tuesdays to a 3-week waitlist.",
    subhead:
      "How a neighbourhood cocktail bar used Confetti's AI itineraries to fill weeknight tables.",
    hero: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1600&auto=format&fit=crop",
    stats: [
      { label: "New bookings / month", value: "+128", icon: TrendingUp },
      { label: "Itinerary appearances", value: "412", icon: Users },
      { label: "Click-through rate", value: "9.4%", icon: MousePointerClick },
    ],
    quote: {
      text: "Confetti put us inside the actual plan, not just on a list. People walked in knowing what they wanted to order.",
      author: "Sample Owner",
      role: "Owner, Sample Cocktail Co.",
    },
    body: [
      {
        heading: "The challenge",
        text: "Weekends were sold out, but Tuesday through Thursday felt invisible. Generic listing sites brought tourists looking for the cheapest happy hour — not their crowd.",
      },
      {
        heading: "The Confetti play",
        text: "We featured them as a Stop in the AI Build-My-Night flow for date-night and post-work occasions, plus a Promoted slot in the nearby rail. No coupons, no race to the bottom.",
      },
      {
        heading: "The result",
        text: "Within 30 days, weeknight covers were up 38%. The team reports that planners arrive already on the vibe — shorter explanations, higher tickets, better tips.",
      },
    ],
    package: "Featured",
  },
};

export const Route = createFileRoute("/advertise/stories/$slug")({
  loader: ({ params }) => {
    const story = STORIES[params.slug];
    if (!story) throw notFound();
    return { story };
  },
  head: ({ loaderData }) => {
    const s = loaderData?.story;
    if (!s) return { meta: [{ title: "Case study — Confetti" }] };
    return {
      meta: [
        { title: `${s.brand}: ${s.headline} — Confetti` },
        { name: "description", content: s.subhead },
        { property: "og:title", content: `${s.brand} on Confetti` },
        { property: "og:description", content: s.subhead },
        { property: "og:image", content: s.hero },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: s.hero },
      ],
    };
  },
  notFoundComponent: () => (
    <main className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="font-display text-4xl font-bold">Story not found</h1>
      <p className="mt-2 text-muted-foreground">This case study isn't published yet.</p>
      <Link
        to="/advertise"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-bold text-background"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Advertise
      </Link>
    </main>
  ),
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="font-display text-3xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
    </main>
  ),
  component: StoryPage,
});

function StoryPage() {
  const { story } = Route.useLoaderData();

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        to="/advertise"
        className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All stories
      </Link>

      <header className="mt-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
          {story.category} · {story.city}
        </span>
        <h1 className="mt-4 font-display text-4xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl">
          {story.headline}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{story.subhead}</p>
      </header>

      <img
        src={story.hero}
        alt=""
        className="mt-8 aspect-[16/9] w-full rounded-3xl border border-border object-cover shadow-pop"
      />

      <section className="mt-10 grid gap-3 sm:grid-cols-3">
        {story.stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <s.icon className="h-5 w-5 text-primary" />
            <div className="mt-2 font-display text-3xl font-extrabold">{s.value}</div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              {s.label}
            </div>
          </div>
        ))}
      </section>

      <article className="prose prose-lg mt-12 max-w-none">
        {story.body.map((b) => (
          <section key={b.heading} className="mt-8">
            <h2 className="font-display text-2xl font-bold">{b.heading}</h2>
            <p className="mt-2 text-muted-foreground">{b.text}</p>
          </section>
        ))}
      </article>

      <blockquote className="mt-12 rounded-3xl border-2 border-foreground/10 bg-gradient-to-br from-primary/10 via-card to-card p-8 shadow-pop">
        <Quote className="h-6 w-6 text-primary" />
        <p className="mt-3 font-display text-2xl leading-snug">"{story.quote.text}"</p>
        <footer className="mt-4 text-sm font-mono uppercase tracking-wider text-muted-foreground">
          — {story.quote.author}, {story.quote.role}
        </footer>
      </blockquote>

      <section className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border bg-card p-6 shadow-card">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Package used
          </div>
          <div className="font-display text-xl font-bold">{story.package}</div>
        </div>
        <Link
          to="/advertise"
          search={{ utm_source: "case_study", utm_campaign: story.slug } as never}
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-bold text-background hover:opacity-90"
        >
          Get results like this <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </main>
  );
}
