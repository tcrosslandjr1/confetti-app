/**
 * Gamification Engine — Awards XP, levels up, and unlocks achievements.
 *
 * Call `awardXP(userId, action)` after key user events.
 * The engine handles:
 *   1. XP increment on the profiles table
 *   2. Level-up detection and profile update
 *   3. Achievement unlock checks
 *   4. Toast notifications for celebrations
 */

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ─── XP Rewards Map ─────────────────────────────────────────────────────────
// Each action and the XP it awards. Keep sorted by value for readability.
export const XP_REWARDS: Record<string, number> = {
  // Core actions
  complete_onboarding: 50,
  first_booking: 100,
  booking: 25,
  first_referral: 75,
  referral_signup: 30,
  referral_booking: 50,

  // Engagement
  create_itinerary: 20,
  complete_itinerary: 40,
  review_venue: 15,
  favorite_venue: 5,
  share_itinerary: 10,
  taste_tuner_complete: 30,

  // Social
  invite_sent: 5,
  rsvp_accepted: 10,
  group_plan_created: 20,

  // Streaks & milestones
  weekend_visit: 15,
  streak_3: 50,
  streak_5: 100,
  preorder_placed: 20,
};

// ─── Level Thresholds ───────────────────────────────────────────────────────
// Level N requires LEVEL_THRESHOLDS[N] total XP (cumulative).
// Pattern: each level requires progressively more XP.
const LEVEL_THRESHOLDS: number[] = [
  0,     // Level 1: 0 XP (everyone starts here)
  100,   // Level 2
  250,   // Level 3
  500,   // Level 4
  850,   // Level 5
  1300,  // Level 6
  1900,  // Level 7
  2600,  // Level 8
  3500,  // Level 9
  4600,  // Level 10
  6000,  // Level 11
  7800,  // Level 12
  10000, // Level 13
  12500, // Level 14
  15500, // Level 15
];

/** Get the level for a given XP total */
export function levelForXP(xp: number): number {
  let lvl = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) lvl = i + 1;
    else break;
  }
  return lvl;
}

/** XP needed for next level from current XP */
export function xpToNextLevel(xp: number): { current: number; required: number; progress: number } {
  const currentLevel = levelForXP(xp);
  if (currentLevel >= LEVEL_THRESHOLDS.length) {
    return { current: xp, required: xp, progress: 1 };
  }
  const currentThreshold = LEVEL_THRESHOLDS[currentLevel - 1];
  const nextThreshold = LEVEL_THRESHOLDS[currentLevel];
  const progressXP = xp - currentThreshold;
  const neededXP = nextThreshold - currentThreshold;
  return {
    current: progressXP,
    required: neededXP,
    progress: neededXP > 0 ? progressXP / neededXP : 1,
  };
}

// ─── Core Engine ────────────────────────────────────────────────────────────

/**
 * Award XP to a user for a specific action.
 * Handles level-up detection and shows celebration toasts.
 *
 * @returns The new XP total, or null if an error occurred.
 */
export async function awardXP(
  userId: string,
  action: keyof typeof XP_REWARDS | string,
  options?: { silent?: boolean },
): Promise<number | null> {
  const amount = XP_REWARDS[action] ?? 0;
  if (amount === 0) return null;

  // Fetch current profile
  const { data: profile, error: fetchErr } = await supabase
    .from("profiles")
    .select("xp, level")
    .eq("id", userId)
    .maybeSingle();

  if (fetchErr || !profile) return null;

  const oldXP = profile.xp ?? 0;
  const newXP = oldXP + amount;
  const oldLevel = profile.level ?? 1;
  const newLevel = levelForXP(newXP);

  // Update profile
  const updates: { xp: number; level?: number } = { xp: newXP };
  if (newLevel > oldLevel) updates.level = newLevel;

  const { error: updateErr } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId);

  if (updateErr) return null;

  // Celebrate!
  if (!options?.silent) {
    if (newLevel > oldLevel) {
      toast.success(`Level up! You're now Level ${newLevel}`, {
        description: `+${amount} XP earned`,
        duration: 5000,
      });
    } else {
      toast(`+${amount} XP`, { description: formatAction(action), duration: 2500 });
    }
  }

  // Fire and forget achievement check
  checkAndUnlockAchievements(userId, action).catch(() => {});

  return newXP;
}

function formatAction(action: string): string {
  return action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Achievement Engine ─────────────────────────────────────────────────────

/** Map of achievement codes → the action(s) that trigger them */
const ACHIEVEMENT_TRIGGERS: Record<string, string[]> = {
  first_steps: ["complete_onboarding"],
  first_booking: ["first_booking", "booking"],
  first_referral: ["first_referral", "referral_signup"],
  foodie: ["booking", "complete_itinerary"],
  explorer: ["booking", "complete_itinerary"],
  weekend_warrior: ["weekend_visit"],
  night_owl: ["booking", "complete_itinerary"],
  social_butterfly: ["taste_tuner_complete"],
  streak_3: ["streak_3"],
  streak_5: ["streak_5"],
};

/**
 * Check if the user qualifies for any new achievements after an action.
 * Unlocks and awards bonus XP from the achievement.
 */
async function checkAndUnlockAchievements(userId: string, action: string): Promise<void> {
  // Get all achievements
  const { data: allAch } = await supabase
    .from("achievements")
    .select("id, code, title, xp_reward, icon");

  if (!allAch?.length) return;

  // Get user's already-unlocked achievements
  const { data: userAch } = await supabase
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", userId);

  const unlockedIds = new Set((userAch ?? []).map((ua) => ua.achievement_id));

  // Check each achievement to see if this action could trigger it
  for (const ach of allAch) {
    if (unlockedIds.has(ach.id)) continue; // already unlocked

    const triggers = ACHIEVEMENT_TRIGGERS[ach.code];
    if (!triggers || !triggers.includes(action)) continue;

    // Additional validation per achievement code
    const qualifies = await checkAchievementQualification(userId, ach.code);
    if (!qualifies) continue;

    // Unlock it!
    const { error } = await supabase.from("user_achievements").insert({
      user_id: userId,
      achievement_id: ach.id,
      unlocked_at: new Date().toISOString(),
    });

    if (error) continue;

    // Award bonus XP from the achievement (silently — the toast below covers it)
    if (ach.xp_reward > 0) {
      await supabase
        .from("profiles")
        .update({ xp: (await getProfileXP(userId)) + ach.xp_reward })
        .eq("id", userId);
    }

    // Celebrate achievement unlock
    toast.success(`Badge unlocked: ${ach.title}!`, {
      description: ach.xp_reward > 0 ? `+${ach.xp_reward} bonus XP` : undefined,
      duration: 5000,
    });
  }
}

/**
 * Per-achievement qualification checks that validate actual user state.
 * Returns true if the user meets the criteria for the achievement.
 */
async function checkAchievementQualification(userId: string, code: string): Promise<boolean> {
  switch (code) {
    case "first_steps": {
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_complete")
        .eq("id", userId)
        .maybeSingle();
      return data?.onboarding_complete === true;
    }
    case "first_booking": {
      const { count } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      return (count ?? 0) >= 1;
    }
    case "first_referral": {
      const { count } = await supabase
        .from("referrals")
        .select("id", { count: "exact", head: true })
        .eq("referrer_id", userId)
        .eq("status", "joined");
      return (count ?? 0) >= 1;
    }
    case "foodie": {
      const { count } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      return (count ?? 0) >= 10;
    }
    case "explorer": {
      const { count } = await supabase
        .from("itineraries")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      return (count ?? 0) >= 5;
    }
    case "weekend_warrior": {
      // Simplified: 3+ itineraries means qualifies
      const { count } = await supabase
        .from("itineraries")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      return (count ?? 0) >= 3;
    }
    case "night_owl": {
      const { count } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      return (count ?? 0) >= 5;
    }
    case "social_butterfly": {
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_complete")
        .eq("id", userId)
        .maybeSingle();
      return data?.onboarding_complete === true;
    }
    case "streak_3":
    case "streak_5":
      // These are awarded directly from the action name match
      return true;
    default:
      return true;
  }
}

async function getProfileXP(userId: string): Promise<number> {
  const { data } = await supabase
    .from("profiles")
    .select("xp")
    .eq("id", userId)
    .maybeSingle();
  return data?.xp ?? 0;
}

// ─── Convenience Hooks / Helpers ────────────────────────────────────────────

/** Get the level title for display */
export function levelTitle(level: number): string {
  const titles: Record<number, string> = {
    1: "Newcomer",
    2: "Explorer",
    3: "Regular",
    4: "Local",
    5: "Insider",
    6: "Connoisseur",
    7: "VIP",
    8: "Elite",
    9: "Legend",
    10: "Icon",
    11: "Mythic",
    12: "Celestial",
    13: "Ethereal",
    14: "Transcendent",
    15: "Confetti Royalty",
  };
  return titles[level] ?? `Level ${level}`;
}
