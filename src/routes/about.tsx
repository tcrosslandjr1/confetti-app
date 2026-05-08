import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Confetti" },
      { name: "description", content: "Confetti is the joyful planner for outings — built to get you off the couch and into the world." },
      { property: "og:title", content: "About — Confetti" },
      { property: "og:description", content: "Why we built Confetti and what we believe about going out." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="border-b border-border">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
          <h1 className="font-display text-5xl font-bold tracking-tight sm:text-6xl">
            We believe in <span className="text-gradient">going out.</span>
          </h1>
          <div className="mt-8 space-y-5 text-lg text-muted-foreground">
            <p>
              Confetti started with one frustration: it's harder to decide what to do than to actually do it. Group chats stall. Tabs pile up. Saturday becomes another night on the couch.
            </p>
            <p>
              So we built a planner that does the messy part — picking the spots, timing the day, sorting the route, holding the reservations — and leaves you with the fun part: showing up.
            </p>
            <p>
              We design for every kind of outing. Date night. Kids' day out. Meeting the in-laws. A guys' afternoon at the range. Sunday with the elders. The plan should match the people.
            </p>
            <p>
              We're a small team building this in the open. If you have a vibe we should plan for, <Link to="/contact" className="text-foreground underline underline-offset-4 hover:text-primary">tell us</Link>.
            </p>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
