import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { listUserGrants, listUserRedemptions, userBalance } from "@/lib/confetti-credits";
import type { PassportStamp } from "@/lib/loop-store";

export type PassportStats = {
  /** True once the first real query has resolved. */
  ready: boolean;
  /** Whether the data is backed by a signed-in account. */
  signedIn: boolean;
  displayName: string | null;
  confetti: number;
  /** 7-element boolean array: index 0 = 6 days ago … index 6 = today. */
  streakDays: boolean[];
  /** Stamps earned from completed itineraries (most recent first). */
  stamps: PassportStamp[];
  /** Codes of unlocked achievements (matches `achievements.code`). */
  unlockedBadgeCodes: Set<string>;
  /** Total achievements defined in the catalogue. */
  totalBadges: number;
};

const EMPTY_STREAK: boolean[] = [false, false, false, false, false, false, false];

function cityAbbreviation(input: string | null | undefined): string {
  if (!input) return "TRIP";
  const map: Record<string, string> = {
    "washington dc": "DC",
    washington: "DC",
    "new york": "NYC",
    "new york city": "NYC",
    miami: "MIA",
    "los angeles": "LA",
    "san francisco": "SF",
    chicago: "CHI",
    boston: "BOS",
    austin: "ATX",
    nashville: "BNA",
    seattle: "SEA",
    denver: "DEN",
    atlanta: "ATL",
  };
  const key = input.trim().toLowerCase();
  if (map[key]) return map[key];
  const initials = input
    .replace(/[^a-zA-Z\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((w) => w[0].toUpperCase())
    .join("");
  return initials || input.slice(0, 3).toUpperCase();
}

function startOfDay(d: Date): number {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

/**
 * Aggregates the signed-in user's passport stats from Supabase.
 * Returns `signedIn: false` (and zeroed stats) when there's no session, so the
 * caller can fall back to demo data without crashing.
 */
export function usePassportStats(): PassportStats {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<PassportStats>({
    ready: false,
    signedIn: false,
    displayName: null,
    confetti: 0,
    streakDays: EMPTY_STREAK,
    stamps: [],
    unlockedBadgeCodes: new Set(),
    totalBadges: 0,
  });

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    if (!user) {
      setStats({
        ready: true,
        signedIn: false,
        displayName: null,
        confetti: 0,
        streakDays: EMPTY_STREAK,
        stamps: [],
        unlockedBadgeCodes: new Set(),
        totalBadges: 0,
      });
      return;
    }

    (async () => {
      const userId = user.id;
      const [
        profileRes,
        grants,
        redemptions,
        itineraryRes,
        bookingRes,
        achievementsRes,
        unlockedRes,
      ] = await Promise.all([
        supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle(),
        listUserGrants(userId),
        listUserRedemptions(userId),
        supabase
          .from("itineraries")
          .select("id, title, updated_at")
          .eq("user_id", userId)
          .eq("status", "completed")
          .order("updated_at", { ascending: false })
          .limit(50),
        supabase
          .from("bookings")
          .select("booking_time, status")
          .eq("user_id", userId)
          .in("status", ["confirmed", "completed", "checked_in"])
          .order("booking_time", { ascending: false })
          .limit(50),
        supabase.from("achievements").select("id, code"),
        supabase.from("user_achievements").select("achievement_id").eq("user_id", userId),
      ]);

      if (cancelled) return;

      const confetti = userBalance(grants, redemptions);

      // Streak: last 7 days (today inclusive), true if any check-in / completed activity
      const today = startOfDay(new Date());
      const dayMs = 24 * 60 * 60 * 1000;
      const activityDays = new Set<number>();
      for (const i of itineraryRes.data ?? []) {
        if (i.updated_at) activityDays.add(startOfDay(new Date(i.updated_at)));
      }
      for (const b of bookingRes.data ?? []) {
        if (b.booking_time) activityDays.add(startOfDay(new Date(b.booking_time)));
      }
      const streakDays = Array.from({ length: 7 }, (_, idx) => {
        const dayStart = today - (6 - idx) * dayMs;
        return activityDays.has(dayStart);
      });

      // Stamps from completed itineraries
      const stamps: PassportStamp[] = (itineraryRes.data ?? []).map((it) => ({
        id: it.id,
        city: "OUT",
        theme: it.title || "Night Out",
        date: new Date(it.updated_at).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        earnedAt: it.updated_at,
      }));

      // Badges
      const achById = new Map<string, string>(); // id -> code
      for (const a of achievementsRes.data ?? []) achById.set(a.id, a.code);
      const unlockedBadgeCodes = new Set<string>();
      for (const u of unlockedRes.data ?? []) {
        const code = achById.get(u.achievement_id);
        if (code) unlockedBadgeCodes.add(code);
      }

      setStats({
        ready: true,
        signedIn: true,
        displayName: profileRes.data?.display_name ?? null,
        confetti,
        streakDays,
        stamps,
        unlockedBadgeCodes,
        totalBadges: achievementsRes.data?.length ?? 0,
      });
    })().catch(() => {
      if (cancelled) return;
      setStats((s) => ({ ...s, ready: true }));
    });

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  return stats;
}
