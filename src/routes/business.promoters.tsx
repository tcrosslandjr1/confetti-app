import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Megaphone, TrendingUp, Zap, Crown, Star } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  useManagedVenues,
  VenueSwitcher,
  NoVenueClaim,
} from "@/components/business/useManagedVenue";
import { getManagedVenue, getMyBusinessSubscription } from "@/lib/business-api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PromoStorefront } from "@/components/business/PromoStorefront";

export const Route = createFileRoute("/business/promoters")({
  beforeLoad: async () => {
    const { requireBusinessAccess } = await import("@/lib/business-guards");
    await requireBusinessAccess();
  },
  component: BusinessPromotersPage,
  head: () => ({
    meta: [
      { title: "Promote — Confetti for Business" },
      { name: "description", content: "Boost your venue visibility with promotions." },
    ],
  }),
});

function BusinessPromotersPage() {
  useAuth();
  const { venues, activeId, setActiveId, isLoading: venuesLoading } = useManagedVenues();

  const { data: venue } = useQuery({
    queryKey: ["managed-venue-detail", activeId],
    queryFn: () => getManagedVenue(activeId!),
    enabled: !!activeId,
  });

  const { data: subData } = useQuery({
    queryKey: ["business-subscription"],
    queryFn: () => getMyBusinessSubscription(),
  });

  const subscription = subData?.subscription;
  const boostLevel = venue?.sponsored_boost_level ?? 0;

  if (venuesLoading) return <PageShell>Loading venues...</PageShell>;
  if (!venues.length)
    return (
      <PageShell>
        <NoVenueClaim />
      </PageShell>
    );

  return (
    <PageShell>
      <div className="flex items-center gap-3">
        <Link to="/business/dashboard" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Promote</h1>
        <VenueSwitcher venues={venues} activeId={activeId} onChange={setActiveId} />
      </div>

      {/* Current Status */}
      <Card className="mt-6 p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Megaphone className="h-5 w-5 text-primary" /> Promotion Status
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatusCard
            icon={<TrendingUp className="h-5 w-5" />}
            label="Boost Level"
            value={`${boostLevel} / 4`}
          />
          <StatusCard
            icon={<Crown className="h-5 w-5" />}
            label="Subscription"
            value={subscription ? (subscription.tier ?? subscription.status) : "None"}
          />
          <StatusCard
            icon={<Star className="h-5 w-5" />}
            label="Venue Approved"
            value={venue?.promotion_approved ? "Yes" : "No"}
          />
          <StatusCard
            icon={<Zap className="h-5 w-5" />}
            label="Visibility"
            value={boostLevel > 0 ? "Boosted" : "Standard"}
          />
        </div>
      </Card>

      {/* Boost Tiers */}
      <section className="mt-8">
        <h2 className="mb-4 text-xl font-bold">Boost Tiers</h2>
        <div className="grid gap-4 md:grid-cols-4">
          {[
            {
              level: 1,
              name: "Spark",
              desc: "Appear higher in neighborhood results",
              price: "$29/mo",
            },
            {
              level: 2,
              name: "Glow",
              desc: "Featured badge + priority in city searches",
              price: "$79/mo",
            },
            {
              level: 3,
              name: "Blaze",
              desc: "Homepage carousel + trending section",
              price: "$149/mo",
            },
            {
              level: 4,
              name: "Supernova",
              desc: "Full spotlight: hero placement, push notifications, AI priority",
              price: "$299/mo",
            },
          ].map((tier, i) => (
            <motion.div
              key={tier.level}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Card
                className={`relative p-5 transition-shadow hover:shadow-md ${
                  boostLevel >= tier.level ? "border-primary bg-primary/5" : ""
                }`}
              >
                {boostLevel >= tier.level && (
                  <div className="absolute right-3 top-3 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                    ACTIVE
                  </div>
                )}
                <div className="text-2xl font-bold text-primary">L{tier.level}</div>
                <h3 className="mt-1 font-semibold">{tier.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{tier.desc}</p>
                <div className="mt-3 text-lg font-bold">{tier.price}</div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Promo Marketplace */}
      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-bold">Promo Marketplace</h2>
        <p className="text-sm text-muted-foreground">
          One-time boosts and add-ons to maximize visibility.
        </p>
        <PromoStorefront />
      </section>
    </PageShell>
  );
}

function StatusCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-background/70 p-4">
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold capitalize">{value}</div>
    </div>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 md:px-6">{children}</div>
    </div>
  );
}
