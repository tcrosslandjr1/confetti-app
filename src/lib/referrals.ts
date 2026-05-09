import { supabase } from "@/integrations/supabase/client";

const PENDING_REF_KEY = "concierge.pendingReferralCode";

export function rememberReferralCode(code: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PENDING_REF_KEY, code.trim().toUpperCase());
  } catch {}
}

export function getPendingReferralCode(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(PENDING_REF_KEY);
  } catch {
    return null;
  }
}

export function clearPendingReferralCode() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PENDING_REF_KEY);
  } catch {}
}

export function buildReferralLink(code: string): string {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://concierge.app";
  return `${origin}/?ref=${encodeURIComponent(code)}`;
}

export async function getOrCreateMyReferralCode(): Promise<string | null> {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) return null;
  const { data } = await supabase
    .from("referral_codes")
    .select("code")
    .eq("user_id", uid)
    .maybeSingle();
  return data?.code ?? null;
}

export type MyReferralStats = {
  invited: number;
  signedUp: number;
  completed: number;
  earnedCents: number;
};

export async function getMyReferralStats(): Promise<MyReferralStats> {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) return { invited: 0, signedUp: 0, completed: 0, earnedCents: 0 };

  const [refs, rewards] = await Promise.all([
    supabase.from("referrals").select("status").eq("referrer_id", uid),
    supabase
      .from("referral_rewards")
      .select("amount_cents,status,type")
      .eq("user_id", uid)
      .eq("type", "gift_card"),
  ]);

  const list = refs.data ?? [];
  const earned = (rewards.data ?? []).reduce(
    (sum, r) => sum + (r.amount_cents ?? 0),
    0,
  );
  return {
    invited: list.length,
    signedUp: list.filter((r) => r.status === "signed_up" || r.status === "completed").length,
    completed: list.filter((r) => r.status === "completed").length,
    earnedCents: earned,
  };
}

export async function listMyInvites() {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) return [];
  const { data } = await supabase
    .from("referrals")
    .select("id,referee_email,status,channel,created_at,completed_at")
    .eq("referrer_id", uid)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function listMyRewards() {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) return [];
  const { data } = await supabase
    .from("referral_rewards")
    .select("id,type,amount_cents,status,redeem_code,created_at,issued_at")
    .eq("user_id", uid)
    .order("created_at", { ascending: false });
  return data ?? [];
}

/** Sends invites: records each as a referral and opens the user's mail client. */
export async function inviteByEmail(emails: string[]): Promise<number> {
  const cleaned = emails
    .map((e) => e.trim().toLowerCase())
    .filter((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e));
  if (cleaned.length === 0) return 0;

  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) return 0;
  const code = await getOrCreateMyReferralCode();
  if (!code) return 0;

  await supabase.from("referrals").insert(
    cleaned.map((email) => ({
      referrer_id: uid,
      referee_email: email,
      code,
      channel: "email",
      status: "pending",
    })),
  );

  if (typeof window !== "undefined") {
    const link = buildReferralLink(code);
    const subject = encodeURIComponent("You'll love this — $25 off your first booking");
    const body = encodeURIComponent(
      `Hey,\n\nI've been using Concierge to plan nights out and thought you'd love it. Use my link to get a discount on your first booking — and I'll get a $25 gift card when you do.\n\n${link}\n\nCode: ${code}\n`,
    );
    window.location.href = `mailto:${cleaned.join(",")}?subject=${subject}&body=${body}`;
  }

  return cleaned.length;
}

/** Called after a fresh signup — links the new user to a pending referral if any. */
export async function consumePendingReferralOnSignup() {
  const code = getPendingReferralCode();
  if (!code) return;
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  const email = u.user?.email?.toLowerCase();
  if (!uid) return;

  const { data: codeRow } = await supabase
    .from("referral_codes")
    .select("user_id")
    .eq("code", code)
    .maybeSingle();
  const referrerId = codeRow?.user_id;
  if (!referrerId || referrerId === uid) {
    clearPendingReferralCode();
    return;
  }

  // If invite already exists for this email, attach the new user_id; otherwise insert.
  const existing = await supabase
    .from("referrals")
    .select("id")
    .eq("code", code)
    .eq("referee_email", email ?? "")
    .maybeSingle();

  if (existing.data?.id) {
    await supabase
      .from("referrals")
      .update({ referee_id: uid, status: "signed_up", signed_up_at: new Date().toISOString() })
      .eq("id", existing.data.id);
  } else {
    await supabase.from("referrals").insert({
      referrer_id: referrerId,
      referee_id: uid,
      referee_email: email,
      code,
      channel: "link",
      status: "signed_up",
      signed_up_at: new Date().toISOString(),
    });
  }

  // Issue pending first-booking discount for the referee
  await supabase.from("referral_rewards").insert({
    user_id: uid,
    type: "first_booking_discount",
    amount_cents: 2500,
    status: "pending",
  });

  clearPendingReferralCode();
}

export type LeaderboardRow = {
  user_id: string;
  display_name: string;
  level: number;
  invited: number;
  signed_up: number;
  completed: number;
  earned_cents: number;
  tier: "none" | "first" | "rising" | "super" | "legend";
};

export async function getReferralLeaderboard(limit = 20): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase.rpc("referral_leaderboard", { _limit: limit });
  if (error) return [];
  return (data ?? []) as LeaderboardRow[];
}

export type ReferralBadge = {
  code: string;
  title: string;
  description: string;
  icon: string;
  xp_reward: number;
  unlocked: boolean;
  unlocked_at: string | null;
};

const REFERRAL_BADGE_CODES = [
  "referral_first",
  "referral_rising",
  "referral_super",
  "referral_legend",
] as const;

export async function getMyReferralBadges(): Promise<ReferralBadge[]> {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  const { data: defs } = await supabase
    .from("achievements")
    .select("id,code,title,description,icon,xp_reward")
    .in("code", REFERRAL_BADGE_CODES as unknown as string[]);
  if (!defs) return [];
  const order = new Map(REFERRAL_BADGE_CODES.map((c, i) => [c, i] as const));
  let unlockedMap = new Map<string, string>();
  if (uid) {
    const { data: ua } = await supabase
      .from("user_achievements")
      .select("achievement_id,unlocked_at")
      .eq("user_id", uid);
    unlockedMap = new Map((ua ?? []).map((r) => [r.achievement_id, r.unlocked_at]));
  }
  return defs
    .map((d) => ({
      code: d.code,
      title: d.title,
      description: d.description,
      icon: d.icon,
      xp_reward: d.xp_reward,
      unlocked: unlockedMap.has(d.id),
      unlocked_at: unlockedMap.get(d.id) ?? null,
    }))
    .sort((a, b) => (order.get(a.code as any) ?? 0) - (order.get(b.code as any) ?? 0));
}

export async function getMyPendingFirstBookingDiscount() {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) return null;
  const { data } = await supabase
    .from("referral_rewards")
    .select("amount_cents,status")
    .eq("user_id", uid)
    .eq("type", "first_booking_discount")
    .in("status", ["pending", "issued"])
    .maybeSingle();
  return data;
}
