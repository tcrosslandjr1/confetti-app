import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Check, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

export const Route = createFileRoute("/business/pricing")({
  component: BusinessPricingPage,
  head: () => ({
    meta: [
      { title: "Pricing — Confetti for Business" },
      {
        name: "description",
        content:
          "Grow your venue with Confetti. AI-powered discovery, social-driven visibility, and real nightlife results. Plans from free to City Takeover.",
      },
      { property: "og:title", content: "Pricing — Confetti for Business" },
      {
        property: "og:description",
        content: "AI-powered discovery. Social-driven visibility. Real nightlife results.",
      },
    ],
  }),
});

type Tier = {
  id: string;
  name: string;
  price: string;
  cadence?: string;
  tag: string;
  value: string;
  features: string[];
  cta: { label: string; to?: string; priceId?: string };
  highlight?: boolean;
  accent: string;
};

const TIERS: Tier[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    cadence: "/ month",
    tag: "Included for all venues",
    value: "Your venue on Confetti. No cost. No commitment.",
    features: [
      "Venue profile",
      "Hours, address, website",
      "Google Maps link",
      "Monthly AI photo refresh",
      "TikTok + Instagram links",
      "Up to 2 active events",
    ],
    cta: { label: "Start Free", to: "/business/signup" },
    accent: "from-emerald-200/60 to-emerald-50",
  },
  {
    id: "featured",
    name: "Featured",
    price: "$49",
    cadence: "/ month",
    tag: "Most popular for bars & lounges",
    value: "Stand out in search and look premium.",
    features: [
      "Everything in Free",
      "Featured badge on venue card",
      "Higher ranking in search",
      "Unlimited events",
      "Weekly AI photo refresh",
      "Basic analytics dashboard",
    ],
    cta: { label: "Upgrade to Featured", priceId: "business_featured_monthly" },
    accent: "from-sky-200/70 to-sky-50",
  },
  {
    id: "boosted",
    name: "Boosted",
    price: "$149",
    cadence: "/ month",
    tag: "Best for trending venues",
    value: "Boost your social presence and dominate discovery.",
    features: [
      "Everything in Featured",
      "Boosted Reels (first TikTok/IG tile is Promoted)",
      "Priority placement in category searches",
      "AI hashtag recommendations",
      "AI content suggestions",
      "Full analytics (views, clicks, engagement)",
      "Unlimited photos & flyers",
    ],
    cta: { label: "Boost My Venue", priceId: "business_boosted_monthly" },
    highlight: true,
    accent: "from-primary/30 to-primary/5",
  },
  {
    id: "premium",
    name: "Premium",
    price: "$399",
    cadence: "/ month",
    tag: "For top clubs & rooftops",
    value: "Maximum visibility. Maximum influence.",
    features: [
      "Everything in Boosted",
      "Top 3 placement in all relevant searches",
      "Tonight's Hot Spots rotation",
      "AI-generated promo videos (coming)",
      "AI-generated flyers (coming)",
      "Dedicated account manager",
      "Priority support",
    ],
    cta: { label: "Go Premium", priceId: "business_premium_monthly" },
    accent: "from-orange-200/70 to-orange-50",
  },
];

const TAKEOVER = {
  name: "City Takeover",
  price: "$999 – $2,500",
  cadence: "per weekend",
  tag: "Major events & holidays",
  value: "Own the city for the night.",
  features: [
    "Full-screen takeover",
    "Featured in This Weekend in [City]",
    "Boosted Reels + Featured + Priority Search",
    "AI promo pack",
    "Optional push notification",
  ],
  cta: { label: "Request Takeover", to: "mailto:sales@confetti.app?subject=City%20Takeover" },
};

const COMPARISON: { label: string; values: (string | boolean)[] }[] = [
  { label: "Featured badge", values: [false, true, true, true, true] },
  { label: "Search ranking", values: ["Standard", "Higher", "Priority", "Top 3", "Top of feed"] },
  { label: "Boosted reels", values: [false, false, true, true, true] },
  { label: "Priority search", values: [false, false, true, true, true] },
  { label: "Hot Spots rotation", values: [false, false, false, true, true] },
  { label: "AI photo refresh", values: ["Monthly", "Weekly", "Weekly", "Daily", "On demand"] },
  {
    label: "Analytics depth",
    values: ["—", "Basic", "Full", "Full + insights", "Full + insights"],
  },
  { label: "AI content tools", values: [false, false, true, true, true] },
  { label: "Account manager", values: [false, false, false, true, true] },
  { label: "Takeover eligibility", values: [false, false, false, true, true] },
];

const COLS = ["Free", "Featured", "Boosted", "Premium", "Takeover"];

const FAQS = [
  {
    q: "Can I cancel anytime?",
    a: "Yes. All plans are month-to-month — cancel or downgrade from your venue dashboard at any time.",
  },
  {
    q: "Do I need a contract?",
    a: "No contracts on Free, Featured, Boosted, or Premium. City Takeover is a single-weekend buyout, paid up front.",
  },
  {
    q: "How does the AI refresh work?",
    a: "Our AI agent pulls fresh photos, suggests hashtags, and updates your profile on the cadence of your plan — no manual work from you.",
  },
  {
    q: "What counts as a boosted reel?",
    a: "On Boosted and above, the first TikTok or Instagram tile on your venue page is marked Promoted and shown ahead of the rest of your feed.",
  },
  {
    q: "How do City Takeovers work?",
    a: "Pick a weekend or holiday and we feature your venue across the city homepage, the This Weekend module, and optional push notifications. Limited inventory per city.",
  },
];

function BusinessPricingPage() {
  const { user } = useAuth();
  const { openCheckout, checkoutElement } = useStripeCheckout();
  const handlePlanCta = (priceId: string | undefined, name: string, fallback?: string) => {
    if (!priceId) {
      if (fallback) window.location.href = fallback;
      return;
    }
    if (!user) {
      window.location.href = `/business/login?next=${encodeURIComponent("/business/pricing")}`;
      return;
    }
    openCheckout({
      variant: { kind: "price", priceId, accountType: "business" },
      customerEmail: user.email ?? undefined,
      userId: user.id,
      title: `Subscribe to ${name}`,
    });
  };
  return (
    <div className="min-h-screen bg-background">
      <PaymentTestModeBanner />
      <PricingHero />
      <PricingTiers onCta={handlePlanCta} />
      <TakeoverBand />
      <ComparisonTable />
      <FAQ />
      <FinalCTA />
      {checkoutElement}
    </div>
  );
}

function PricingHero() {
  return (
    <section className="relative overflow-hidden border-b">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/15 via-background to-orange-100/40" />
      <div className="absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)] bg-[radial-gradient(circle_at_50%_-20%,hsl(var(--primary)/0.25),transparent_60%)]" />
      <div className="mx-auto max-w-5xl px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-5 inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium tracking-wider text-primary uppercase"
        >
          Confetti for Business
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="text-balance text-5xl font-bold tracking-tight md:text-7xl"
        >
          Grow your venue
          <br />
          <span className="text-primary">with Confetti.</span>
        </motion.h1>
        <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground md:text-xl">
          AI-powered discovery. Social-driven visibility. Real nightlife results.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link to="/business/signup">Get Started</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
            <a href="mailto:sales@confetti.app?subject=Confetti%20for%20Business">Talk to Sales</a>
          </Button>
        </div>
      </div>
    </section>
  );
}

type CtaHandler = (priceId: string | undefined, name: string, fallback?: string) => void;

function PricingTiers({ onCta }: { onCta: CtaHandler }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {TIERS.map((tier, i) => (
          <PricingCard key={tier.id} tier={tier} index={i} onCta={onCta} />
        ))}
      </div>
    </section>
  );
}

function PricingCard({ tier, index, onCta }: { tier: Tier; index: number; onCta: CtaHandler }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className={cn(
        "relative flex flex-col rounded-3xl border bg-card p-8 shadow-sm transition-shadow hover:shadow-md",
        tier.highlight && "border-primary shadow-lg ring-1 ring-primary/30",
      )}
    >
      {tier.highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
          Most popular
        </div>
      )}
      <div
        className={cn(
          "absolute inset-x-0 top-0 -z-10 h-32 rounded-t-3xl bg-gradient-to-b opacity-60",
          tier.accent,
        )}
      />
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {tier.tag}
      </div>
      <h3 className="mt-2 text-2xl font-bold">{tier.name}</h3>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-4xl font-bold tracking-tight">{tier.price}</span>
        {tier.cadence && <span className="text-sm text-muted-foreground">{tier.cadence}</span>}
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{tier.value}</p>

      <ul className="mt-6 flex-1 space-y-3">
        {tier.features.map((f) => (
          <li key={f} className="flex gap-2 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <Button
        className="mt-8 w-full"
        variant={tier.highlight ? "default" : "outline"}
        onClick={() => onCta(tier.cta.priceId, tier.name, tier.cta.to)}
      >
        {tier.cta.label}
      </Button>
    </motion.div>
  );
}

function TakeoverBand() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-20">
      <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/15 via-orange-100/30 to-background p-10 md:p-14">
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-primary">
              {TAKEOVER.tag}
            </div>
            <h3 className="mt-2 text-3xl font-bold md:text-4xl">{TAKEOVER.name}</h3>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold">{TAKEOVER.price}</span>
              <span className="text-sm text-muted-foreground">{TAKEOVER.cadence}</span>
            </div>
            <p className="mt-3 max-w-md text-muted-foreground">{TAKEOVER.value}</p>
            <Button asChild size="lg" className="mt-6">
              <a href={TAKEOVER.cta.to}>{TAKEOVER.cta.label}</a>
            </Button>
          </div>
          <ul className="space-y-3">
            {TAKEOVER.features.map((f) => (
              <li key={f} className="flex gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Cell({ v }: { v: string | boolean }) {
  if (v === true) return <Check className="mx-auto h-4 w-4 text-primary" />;
  if (v === false) return <Minus className="mx-auto h-4 w-4 text-muted-foreground/40" />;
  return <span className="text-sm">{v}</span>;
}

function ComparisonTable() {
  return (
    <section className="border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Compare plans</h2>
          <p className="mt-2 text-muted-foreground">See the value jump at every tier.</p>
        </div>

        {/* Desktop */}
        <div className="hidden overflow-hidden rounded-2xl border bg-card md:block">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-6 py-4 text-left text-sm font-semibold">Feature</th>
                {COLS.map((c) => (
                  <th key={c} className="px-4 py-4 text-center text-sm font-semibold">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row, i) => (
                <tr key={row.label} className={cn(i % 2 === 1 && "bg-muted/20")}>
                  <td className="px-6 py-3 text-sm font-medium">{row.label}</td>
                  {row.values.map((v, j) => (
                    <td key={j} className="px-4 py-3 text-center">
                      <Cell v={v} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden">
          <Accordion type="single" collapsible className="w-full">
            {COLS.map((col, colIdx) => (
              <AccordionItem key={col} value={col}>
                <AccordionTrigger className="text-base font-semibold">{col}</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2">
                    {COMPARISON.map((row) => (
                      <li
                        key={row.label}
                        className="flex items-center justify-between gap-3 border-b py-2 text-sm last:border-b-0"
                      >
                        <span className="text-muted-foreground">{row.label}</span>
                        <span className="font-medium">
                          <Cell v={row.values[colIdx]} />
                        </span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-20">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold md:text-4xl">Frequently asked</h2>
      </div>
      <Accordion type="single" collapsible className="w-full">
        {FAQS.map((f, i) => (
          <AccordionItem key={i} value={`q-${i}`}>
            <AccordionTrigger className="text-left text-base font-semibold">{f.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="relative overflow-hidden border-t">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/15 via-orange-100/40 to-background" />
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h2 className="text-balance text-4xl font-bold md:text-5xl">Ready to grow your venue?</h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Claim your venue in minutes. Unlock promotion tools whenever you're ready.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link to="/business/signup">Get Started</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
            <a href="mailto:sales@confetti.app?subject=Confetti%20for%20Business">Talk to Sales</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
