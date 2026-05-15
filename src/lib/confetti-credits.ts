import { supabase } from "@/integrations/supabase/client";

export type CreditPackage = {
  key: string;
  label: string;
  credits: number;
  price_cents: number;
  blurb: string;
  popular?: boolean;
};

// $1 = 10 Confetti credits. Bigger packs = bonus credits.
export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    key: "starter",
    label: "Starter Pack",
    credits: 1_000,
    price_cents: 10_000,
    blurb: "Reward your first 20 bookings with 50 Confetti each.",
  },
  {
    key: "growth",
    label: "Growth Pack",
    credits: 5_500,
    price_cents: 50_000,
    blurb: "10% bonus credits. Great for a launch month.",
    popular: true,
  },
  {
    key: "scale",
    label: "Scale Pack",
    credits: 12_000,
    price_cents: 100_000,
    blurb: "20% bonus credits. Sustained reward program.",
  },
];

// 100 Confetti = $1 cash redemption value
export const CONFETTI_PER_DOLLAR = 100;

export function confettiToDollars(credits: number): string {
  return `$${(credits / CONFETTI_PER_DOLLAR).toFixed(2)}`;
}

export type AdvertiserBalance = {
  advertiser_id: string;
  balance_credits: number;
  lifetime_purchased_credits: number;
  lifetime_granted_credits: number;
};

export type Purchase = {
  id: string;
  advertiser_id: string;
  package_key: string;
  credits: number;
  amount_cents: number;
  status: string;
  created_at: string;
};

export type Grant = {
  id: string;
  user_id: string;
  advertiser_id: string | null;
  venue_name: string | null;
  booking_id: string | null;
  credits: number;
  reason: string;
  created_at: string;
};

export type Redemption = {
  id: string;
  user_id: string;
  advertiser_id: string | null;
  credits: number;
  redeem_code: string;
  status: "pending" | "redeemed" | "cancelled";
  created_at: string;
  redeemed_at: string | null;
};

export async function getAdvertiserBalance(
  advertiserId: string,
): Promise<AdvertiserBalance> {
  const { data } = await supabase
    .from("advertiser_confetti_balances")
    .select("*")
    .eq("advertiser_id", advertiserId)
    .maybeSingle();
  return (
    (data as AdvertiserBalance | null) ?? {
      advertiser_id: advertiserId,
      balance_credits: 0,
      lifetime_purchased_credits: 0,
      lifetime_granted_credits: 0,
    }
  );
}

export async function listPurchases(advertiserId: string): Promise<Purchase[]> {
  const { data } = await supabase
    .from("confetti_purchases")
    .select("*")
    .eq("advertiser_id", advertiserId)
    .order("created_at", { ascending: false })
    .limit(20);
  return (data ?? []) as Purchase[];
}

export async function buyCreditPackage(
  advertiserId: string,
  pkg: CreditPackage,
): Promise<void> {
  // Mock checkout — record purchase and increment balance.
  const { error: insertErr } = await supabase.from("confetti_purchases").insert({
    advertiser_id: advertiserId,
    package_key: pkg.key,
    credits: pkg.credits,
    amount_cents: pkg.price_cents,
    status: "paid",
  });
  if (insertErr) throw insertErr;

  const current = await getAdvertiserBalance(advertiserId);
  const newBalance = current.balance_credits + pkg.credits;
  const newLifetime = current.lifetime_purchased_credits + pkg.credits;

  if (current.balance_credits === 0 && current.lifetime_purchased_credits === 0) {
    const { error } = await supabase.from("advertiser_confetti_balances").insert({
      advertiser_id: advertiserId,
      balance_credits: newBalance,
      lifetime_purchased_credits: newLifetime,
      lifetime_granted_credits: 0,
    });
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("advertiser_confetti_balances")
      .update({
        balance_credits: newBalance,
        lifetime_purchased_credits: newLifetime,
        updated_at: new Date().toISOString(),
      })
      .eq("advertiser_id", advertiserId);
    if (error) throw error;
  }
}

export async function listUserGrants(userId: string): Promise<Grant[]> {
  const { data } = await supabase
    .from("confetti_grants")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []) as Grant[];
}

export async function listAdvertiserGrants(advertiserId: string): Promise<Grant[]> {
  const { data } = await supabase
    .from("confetti_grants")
    .select("*")
    .eq("advertiser_id", advertiserId)
    .order("created_at", { ascending: false })
    .limit(20);
  return (data ?? []) as Grant[];
}

export async function listUserRedemptions(userId: string): Promise<Redemption[]> {
  const { data } = await supabase
    .from("confetti_redemptions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  return (data ?? []) as Redemption[];
}

export function userBalance(grants: Grant[], redemptions: Redemption[]): number {
  const earned = grants.reduce((s, g) => s + g.credits, 0);
  const spent = redemptions
    .filter((r) => r.status !== "cancelled")
    .reduce((s, r) => s + r.credits, 0);
  return Math.max(0, earned - spent);
}

function genCode(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "CF-";
  for (let i = 0; i < 8; i++) {
    s += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return s;
}

export async function createRedemption(
  userId: string,
  credits: number,
): Promise<Redemption> {
  const code = genCode();
  const { data, error } = await supabase
    .from("confetti_redemptions")
    .insert({
      user_id: userId,
      credits,
      redeem_code: code,
      status: "pending",
    })
    .select()
    .single();
  if (error) throw error;
  return data as Redemption;
}

export async function cancelRedemption(id: string): Promise<void> {
  await supabase
    .from("confetti_redemptions")
    .update({ status: "cancelled" })
    .eq("id", id);
}
