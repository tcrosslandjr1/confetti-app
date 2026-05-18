import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Check } from "lucide-react";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { useAuth } from "@/lib/auth-context";

export const Route  createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Confetti" },
      {
        name: "description",
        content:
          "Free to start. Upgrade for unlimited AI plans, saved reservations and the full taste profile.",
      },
      { property: "og:title", content: "Pricing — Confetti" },
      {
        property: "og:description",
        content: "Simple plans for casual planners and people who go out every weekend.",
      },
    ],
  }),
  component: PricingPage,
});

const tiers = [
  {
    name: "Free",
    price: "$0",
    blurb: "Plan a few outings a month.",
    features: [
      "3 AI itineraries / month",
      "Swipeable idea cards",
      "Save up to 5 trips",
      "Basic taste profile",
    ],
    cta: "Start free",
    priceId: null as string | null,
    highlight: false,
  },
  {
    name: "Plus",
    price: "$8",
    suffix: "/mo",
    blurb: "For people who actually go out.",
    features: [
      "Unlimited itineraries",
      "Multi-stop routing & transit",
      "Saved reservations vault",
      "Full taste profile + social learning",
      "Priority AI",
    ],
    cta: "Try Plus",
    priceId: "consumer_plus_monthly",
    highlight: true,
  },
  {
    name: "Crew",
    price: "$18",
    suffix: "/mo",
    blurb: "Plan with friends and family.",
    features: [
      "Everything in Plus",
      "Shared trips & voting",
      "Up to 6 members",
      "Group reservations",
      "Concierge chat",
    ],
    cta: "Get Crew",
    priceId: "consumer_crew_monthly",
    highlight: false,
  },
];

function PricingPage() {
  const { user } = useAuth();
  const { openCheckout, checkoutElement } = useStripeCheckout();
  const handleCta = (priceId: string | null, name: string) => {
    if (!priceId) return;
    if (!user) {
      window.location.href = `/auth?next=${encodeURIComponent("/pricing")}`;
      return;
    }
    openCheckout({
      variant: { kind: "price", priceId, accountType: "user" },
      customerEmail: user.email ?? undefined,
      userId: user.id,
      title: `Subscribe to ${name}`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <PaymentTestModeBanner />
      <SiteHeader />
      <section className="border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6">
          <h1 className="font-display text-5xl font-bold tracking-tight sm:text-6xl">
            Simple <span className="text-gradient">pricing</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Start free. Upgrade when you're ready to plan everything.
          </p>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 md:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tiers.map((t) => (
              <div
                key={t.name}
                className={`w-[85%] shrink-0 snap-center rounded-3xl border p-6 shadow-card md:w-auto md:shrink ${t.highlight ? "border-primary bg-card ring-2 ring-primary/30" : "border-border bg-card"}`}
              >
                <h3 className="font-display text-2xl font-bold">{t.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t.blurb}</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold">{t.price}</span>
                  {t.suffix && <span className="text-sm text-muted-foreground">{t.suffix}</span>}
                </div>
                <ul className="mt-6 space-y-2 text-sm">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() =>
                    t.priceId ? handleCta(t.priceId, t.name) : (window.location.href = "/auth")
                  }
                  className={`mt-6 inline-flex h-11 w-full items-center justify-center rounded-full text-sm font-semibold transition-pop hover:scale-[1.02] ${
                    t.highlight
                      ? "bg-foreground text-background"
                      : "border border-border bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  {t.cta}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 md:hidden">
            {tiers.map((t) => (
              <span
                key={t.name}
                className={`h-1.5 w-6 rounded-full ${t.highlight ? "bg-primary" : "bg-border"}`}
              />
            ))}
            <span className="ml-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              swipe to compare
            </span>
          </div>
        </div>
      </section>

      <SiteFooter />
      {checkoutElement}
    </div>
  );
}
