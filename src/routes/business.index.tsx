import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/business/")({
  component: BusinessLandingPage,
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
  const ctaHref = user ? "/business/claim" : "/business/signup";

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
            List your venue.
            <br />
            <span className="text-primary">Own the night.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Showcase your venue to nightlife lovers searching Confetti every weekend. Verify
            ownership, control your gallery, and unlock promotional boosts — invite‑only.
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
              title: "Claim & verify",
              body: "Find your venue, prove ownership via social, email or documents, and get approved in 24–48 hours.",
            },
            {
              title: "Control your story",
              body: "Manage photos, hours, vibe tags, and events. Connect TikTok and Instagram for auto‑updated content.",
            },
            {
              title: "Boost your reach",
              body: "Invite‑only promotion tools unlock featured cards, boosted reels, and priority search.",
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
      </div>
    </div>
  );
}
