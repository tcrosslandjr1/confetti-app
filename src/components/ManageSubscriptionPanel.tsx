import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useSubscription } from "@/hooks/useSubscription";
import { getStripeEnvironment } from "@/lib/stripe";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  createPortalSession,
  cancelSubscription,
  changePlan,
} from "@/lib/checkout.functions";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { useAuth } from "@/lib/auth-context";

const LABEL: Record<string, string> = {
  consumer_plus_monthly: "Confetti Plus",
  consumer_crew_monthly: "Confetti Crew",
  business_featured_monthly: "Featured Venue",
  business_boosted_monthly: "Boosted Venue",
  business_premium_monthly: "Premium Venue",
};

export function ManageSubscriptionPanel() {
  const { user } = useAuth();
  const { subscription, isActive, priceId, loading, refetch } = useSubscription();
  const { openCheckout, checkoutElement } = useStripeCheckout();
  const portalFn = useServerFn(createPortalSession);
  const cancelFn = useServerFn(cancelSubscription);
  const changeFn = useServerFn(changePlan);
  const [busy, setBusy] = useState(false);

  if (loading) return null;

  if (!isActive || !subscription) {
    return (
      <Card>
        <CardHeader><CardTitle>Subscription</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">You're on the free plan.</p>
          <Button
            onClick={() => {
              if (!user) { window.location.href = "/auth"; return; }
              openCheckout({
                variant: { kind: "price", priceId: "consumer_plus_monthly", accountType: "user" },
                customerEmail: user.email ?? undefined,
                userId: user.id,
                title: "Subscribe to Confetti Plus",
              });
            }}
          >
            Upgrade to Plus
          </Button>
          {checkoutElement}
        </CardContent>
      </Card>
    );
  }

  const tierName = priceId ? (LABEL[priceId] ?? priceId) : "Active plan";
  const env = getStripeEnvironment();
  const renewsOn = subscription.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString()
    : null;

  const handlePortal = async () => {
    setBusy(true);
    try {
      const url = await portalFn({ data: { environment: env, returnUrl: window.location.href } });
      window.open(url, "_blank");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not open billing portal");
    } finally { setBusy(false); }
  };

  const handleCancel = async () => {
    if (!confirm("Cancel your subscription? Access will end immediately.")) return;
    setBusy(true);
    try {
      await cancelFn({ data: { environment: env } });
      toast.success("Subscription canceled");
      await refetch();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not cancel");
    } finally { setBusy(false); }
  };

  const handleChange = async (newPriceId: "consumer_plus_monthly" | "consumer_crew_monthly") => {
    if (newPriceId === priceId) return;
    setBusy(true);
    try {
      const res = await changeFn({ data: { environment: env, newPriceId } });
      toast.success(
        res.mode === "upgrade"
          ? "Upgraded — changes are live"
          : res.mode === "downgrade_at_period_end"
            ? "Downgrade scheduled at period end"
            : "Plan unchanged",
      );
      await refetch();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not change plan");
    } finally { setBusy(false); }
  };

  const isConsumer = priceId?.startsWith("consumer_");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Subscription
          <Badge variant={subscription.cancel_at_period_end ? "destructive" : "secondary"}>
            {subscription.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium">{tierName}</p>
          {renewsOn && (
            <p className="text-xs text-muted-foreground">
              {subscription.cancel_at_period_end ? "Ends" : "Renews"} on {renewsOn}
            </p>
          )}
          {subscription.pending_price_id && (
            <p className="text-xs text-muted-foreground">
              Switches to {LABEL[subscription.pending_price_id] ?? subscription.pending_price_id} at period end.
            </p>
          )}
        </div>

        {isConsumer && (
          <div className="flex flex-wrap gap-2">
            {priceId !== "consumer_plus_monthly" && (
              <Button size="sm" variant="outline" disabled={busy}
                onClick={() => handleChange("consumer_plus_monthly")}>
                Switch to Plus
              </Button>
            )}
            {priceId !== "consumer_crew_monthly" && (
              <Button size="sm" variant="outline" disabled={busy}
                onClick={() => handleChange("consumer_crew_monthly")}>
                Switch to Crew
              </Button>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" disabled={busy} onClick={handlePortal}>
            Manage billing
          </Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={handleCancel}
            className="text-destructive hover:text-destructive">
            Cancel subscription
          </Button>
        </div>
        {checkoutElement}
      </CardContent>
    </Card>
  );
}
