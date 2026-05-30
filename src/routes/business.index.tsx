import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { BadgeCheck, BarChart3, Megaphone, ShieldCheck, Sparkles, Store } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/business/")({
  component: BusinessLandingPage,
  validateSearch: (s: Record<string, unknown>) => ({
    message: typeof s.message === "string" ? s.message : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Confetti for Business — List Your Venue" },
      {
        name: "description",
        content:
          "Showcase your venue on Confetti. Reach nightlife lovers, manage your presence, and unlock promotional boosts.",
      },
    ],
  }),
});

function BusinessLandingPage() {
  const { user } = useAuth();
  const { message } = Route.useSearch();
  const ctaHref = user ? "/business/claim" : "/business/signup";

  useEffect(() => {
    if (message) toast.info(message);
  }, [message]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="mb-6 inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium tracking-wider text-primary uppercase">
            Confetti for Business
          </div>
          <h1 className="text-balance text-5xl font-bold tracking-tight md:text-7xl">
            Get verified.
            <br />
            <span className="text-primary">Own the night.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Turn your Confetti listing into an official growth channel. Verified businesses get a
            trust badge, profile control, event promotion, analytics, and access to paid placements
            when people are deciding where to go.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="min-w-48">
              <Link to={ctaHref}>Get started</Link>
            </Button>
            {!user && (
              <Button asChild variant="outline" size="lg" className="min-w-48">
                <Link to="/business/login">I already have an account</Link>
              </Button>
            )}
          </div>
        </motion.div>

        <div className="mt-24 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Earn the badge",
              body: "Show guests that your venue is official, active, and trusted on Confetti.",
            },
            {
              title: "Control your story",
              body: "Manage photos, hours, vibe tags, menus, booking links, events, and social links.",
            },
            {
              title: "Boost your reach",
              body: "Unlock featured cards, event boosts, AI plan placement, and priority discovery.",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold">{card.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{card.body}</p>
            </div>
          ))}
        </div>

        <section className="mt-24 rounded-3xl border border-border bg-card p-6 shadow-sm md:p-10">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium tracking-wider text-primary uppercase">
                <BadgeCheck className="h-4 w-4" />
                Verified Business Badge
              </div>
              <h2 className="mt-5 text-3xl font-bold tracking-tight md:text-4xl">
                Verification gives businesses a reason to join.
              </h2>
              <p className="mt-4 text-muted-foreground">
                The badge is the doorway into Confetti's business platform: trust first, profile
                control next, and paid visibility when a venue is ready to grow.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild>
                  <Link to={ctaHref}>Claim your venue</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/business/ads">View ad options</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  icon: ShieldCheck,
                  title: "Guest trust",
                  body: "An official badge helps guests choose your venue for dates, birthdays, groups, and special plans.",
                },
                {
                  icon: Store,
                  title: "Profile control",
                  body: "Keep your photos, hours, vibe, menu links, booking links, offers, and events accurate.",
                },
                {
                  icon: Sparkles,
                  title: "Better discovery",
                  body: "Verified venues can appear in higher-intent recommendations, city guides, and AI-generated plans.",
                },
                {
                  icon: Megaphone,
                  title: "Event promotion",
                  body: "Boost happy hours, brunches, DJ nights, tastings, private events, launches, and pop-ups.",
                },
                {
                  icon: BarChart3,
                  title: "Performance insights",
                  body: "Track views, saves, clicks, booking interest, event attention, and campaign performance.",
                },
                {
                  icon: BadgeCheck,
                  title: "Paid ad access",
                  body: "Only verified businesses can buy featured placements, boosts, and sponsored recommendations.",
                },
              ].map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={benefit.title}
                    className="rounded-2xl border border-border bg-background p-5"
                  >
                    <Icon className="h-5 w-5 text-primary" />
                    <h3 className="mt-3 font-semibold">{benefit.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{benefit.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
