import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, Sparkles, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useSubscription } from "@/hooks/useSubscription";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { getStripeEnvironment } from "@/lib/stripe";
import {
  createPortalSession,
  cancelSubscription,
  changePlan,
  BUSINESS_PRICES,
} from "@/lib/checkout.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type BusinessPriceId = (typeof BUSINESS_PRICES)[number];

type TierDef = {
  id: BusinessPriceId;
  name: string;
  price: string;
  tag: string;
  features: string[];
  highlight?: boolean;
  accent: string;
};

const TIERS: TierDef[] = [
  {
    id: "business_featured_monthly",
    name: "Featured",
    price: "$49",
    tag: "Stand out in search",
    accent: "from-sky-200/70 to-sky-50",
    features: [
      "Featured badge on venue card",
      "Higher ranking in search",
      "Unlimited events",
      "Weekly AI photo refresh",
      "Basic analytics",
    ],
  },
  {
    id: "business_boosted_monthly",
    name: "Boosted",
    price: "$149",
    tag: "Best for trending venues",
    accent: "from-primary/30 to-primary/5",
    highlight: true,
    features: [
      "Everything in Featured",
      "Boosted Reels (Promoted tile)",
      "Priority placement in categories",
      "AI content & hashtag suggestions",
      "Full analytics dashboard",
    ],
  },
  {
    id: "business_premium_monthly",
    name: "Premium",
    price: "$399",
    tag: "For top clubs & rooftops",
    accent: "from-amber-200/70 to-amber-50",
    features: [
      "Everything in Boosted",
      "Top 3 placement everywhere",
      "Tonight's Hot Spots rotation",
      "Dedicated account manager",
      "Priority support",
    ],
  },
];

const TIER_LABEL: Record<string, string> = {
  business_featured_monthly: "Featured",
  business_boosted_monthly: "Boosted",
  business_premium_monthly: "Premium",
};

export function BusinessUpgradePanel() {
  const { user } = useAuth();
  const { subscription, isActive, priceId, refetch, loading } = useSubscription();
  const { openCheckout, checkoutElement } = useStripeCheckout();
  const portalFn = useServerFn(createPortalSession);
  const cancelFn = useServerFn(cancelSubscription);
  const changeFn = useServerFn(changePlan);
  const [busy, setBusy] = useState<string | null>(null);

  const env = getStripeEnvironment();
  const isBusinessSub =
    isActive && (priceId?.startsWith("business_") ?? false) && subscription;
  const currentTier = isBusinessSub ? priceId : null;

  const startCheckout = (tierId: BusinessPriceId, label: string) => {
    if (!user) {
      window.location.href = "/business/login";
      return;
    }
    openCheckout({
      variant: { kind: "price", priceId: tierId, accountType: "business" },
      customerEmail: user.email ?? undefined,
      userId: user.id,
      title: `Subscribe to ${label}`,
    });
  };

  const handleSwitch = async (tierId: BusinessPriceId) => {
    if (tierId === currentTier) return;
    setBusy(tierId);
    try {
      const res = await changeFn({ data: { environment: env, newPriceId: tierId } });
      toast.success(
        res.mode === "upgrade"
          ? "Upgraded — changes are live"
          : res.mode === "downgrade_at_period_end"
          ? "Downgrade scheduled for end of period"
          : "Plan unchanged",
      );
      await refetch();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not change plan");
    } finally {
      setBusy(null);
    }
  };

  const handlePortal = async () => {
    setBusy("portal");
    try {
      const url = await portalFn({
        data: { environment: env, returnUrl: window.location.href },
      });
      window.open(url, "_blank");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not open billing portal");
    } finally {
      setBusy(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Cancel your venue subscription? Access ends immediately.")) return;
    setBusy("cancel");
    try {
      await cancelFn({ data: { environment: env } });
      toast.success("Subscription canceled");
      await refetch();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not cancel");
    } finally {
      setBusy(null);
    }
  };

  if (loading) return null;

  const renewsOn = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString()
    : null;

  return (
    <section className="space-y-6">
      <PaymentTestModeBanner />

      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Sparkles className="h-5 w-5 text-primary" />
            Promotion plans
          </h2>
          <p className="text-sm text-muted-foreground">
            Boost visibility, unlock analytics, and dominate discovery in your city.
          </p>
        </div>
        {isBusinessSub && currentTier && (
          <Card className="rounded-2xl border-primary/30 bg-primary/5 px-4 py-3">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="capitalize">
                {subscription?.status}
              </Badge>
              <div className="text-sm">
                <p className="font-semibold">
                  {TIER_LABEL[currentTier] ?? currentTier}
                </p>
                {renewsOn && (
                  <p className="text-xs text-muted-foreground">
                    {subscription?.cancel_at_period_end ? "Ends" : "Renews"} {renewsOn}
                  </p>
                )}
                {subscription?.pending_price_id && (
                  <p className="text-xs text-muted-foreground">
                    Switches to {TIER_LABEL[subscription.pending_price_id] ??
                      subscription.pending_price_id} at period end
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {TIERS.map((tier) => {
          const isCurrent = tier.id === currentTier;
          const isPending = subscription?.pending_price_id === tier.id;
          const showSwitch = isBusinessSub && !isCurrent;
          const label = TIER_LABEL[tier.id];
          const loadingThis = busy === tier.id;

          return (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card
                className={cn(
                  "relative flex h-full flex-col overflow-hidden rounded-2xl border bg-gradient-to-br p-6",
                  tier.accent,
                  tier.highlight && "border-primary/40 shadow-lg",
                  isCurrent && "ring-2 ring-primary",
                )}
              >
                {tier.highlight && !isCurrent && (
                  <Badge className="absolute right-4 top-4 bg-primary text-primary-foreground">
                    Most popular
                  </Badge>
                )}
                {isCurrent && (
                  <Badge className="absolute right-4 top-4 bg-primary text-primary-foreground">
                    Current
                  </Badge>
                )}
                {isPending && (
                  <Badge variant="secondary" className="absolute right-4 top-4">
                    Pending
                  </Badge>
                )}

                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {tier.tag}
                  </p>
                  <h3 className="text-xl font-bold">{tier.name}</h3>
                  <p className="text-3xl font-bold">
                    {tier.price}
                    <span className="text-sm font-normal text-muted-foreground">
                      {" "}/ month
                    </span>
                  </p>
                </div>

                <ul className="my-6 flex-1 space-y-2 text-sm">
                  {tier.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <Button variant="outline" disabled className="w-full">
                    Active
                  </Button>
                ) : showSwitch ? (
                  <Button
                    className="w-full"
                    disabled={!!busy}
                    onClick={() => handleSwitch(tier.id)}
                    variant={tier.highlight ? "default" : "outline"}
                  >
                    {loadingThis && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Switch to {label}
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    disabled={!!busy}
                    onClick={() => startCheckout(tier.id, label)}
                    variant={tier.highlight ? "default" : "outline"}
                  >
                    Upgrade to {label}
                  </Button>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>

      {isBusinessSub && (
        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!!busy}
            onClick={handlePortal}
          >
            {busy === "portal" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Manage billing
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={!!busy}
            onClick={handleCancel}
            className="text-destructive hover:text-destructive"
          >
            {busy === "cancel" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cancel subscription
          </Button>
        </div>
      )}

      {checkoutElement}
    </section>
  );
}
