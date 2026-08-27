import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const subscriptionsTable = () => (supabase as any).from("subscriptions");
import { getStripeEnvironment } from "@/lib/stripe-env";
import { useAuth } from "@/lib/auth-context";

export type SubscriptionRow = {
  id: string;
  user_id: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  product_id: string | null;
  price_id: string | null;
  status: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  pending_price_id: string | null;
  tier: string | null;
  environment: string;
};

const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

function isActive(row: SubscriptionRow | null): boolean {
  if (!row) return false;
  const future = !row.current_period_end || new Date(row.current_period_end) > new Date();
  if (ACTIVE_STATUSES.has(row.status ?? "") && future) return true;
  if (row.status === "canceled" && future) return true;
  return false;
}

const TIER_RANK: Record<string, number> = {
  free: 0,
  consumer_plus_monthly: 1,
  consumer_crew_monthly: 2,
  user_unlimited_monthly: 2,
  user_vip_monthly: 3,
  business_basic_monthly: 1,
  business_featured_monthly: 1,
  business_boosted_monthly: 2,
  business_premium_monthly: 3,
};

export function useSubscription() {
  const { user } = useAuth();
  const [row, setRow] = useState<SubscriptionRow | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) {
      setRow(null);
      setLoading(false);
      return;
    }
    const { data } = await subscriptionsTable()
      .select("*")
      .eq("user_id", user.id)
      .eq("environment", getStripeEnvironment())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setRow((data as SubscriptionRow | null) ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`sub:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${user.id}` },
        () => {
          void refetch();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, refetch]);

  const active = isActive(row);
  const priceId = row?.price_id ?? null;
  const rank = priceId ? (TIER_RANK[priceId] ?? 0) : 0;

  return {
    subscription: row,
    isActive: active,
    priceId,
    rank,
    loading,
    refetch,
    hasPlus: active && rank >= 1,
    hasCrew: active && rank >= 2,
    isBusiness: active && (priceId?.startsWith("business_") ?? false),
  };
}

export function useFeatureAccess() {
  const sub = useSubscription();
  const { user } = useAuth();
  return {
    ...sub,
    canUseAIConcierge: sub.hasPlus,
    canSaveUnlimitedItineraries: sub.hasPlus,
    canBookVIP: sub.hasCrew, // VIP table booking — Crew tier or unlock
    isSignedIn: !!user,
  };
}
