// ============================================================
// RewardsService — Achievements, streaks, leaderboards, XP
// ============================================================

import { serve } from "../_shared/server.ts";
import { supabaseAdmin, supabaseForUser, corsHeaders, jsonResponse, errorResponse } from "../_shared/supabase-client.ts";

// Achievement definitions
const ACHIEVEMENT_DEFS = [
  { key: "first_night_out", title: "First Night Out", description: "Complete your first Confetti itinerary", xp: 100, check: "checkins >= 1" },
  { key: "city_explorer", title: "City Explorer", description: "Visit 5 different neighborhoods", xp: 250, check: "neighborhoods >= 5" },
  { key: "taste_maker", title: "Taste Maker", description: "Leave 10 reviews", xp: 300, check: "reviews >= 10" },
  { key: "social_butterfly", title: "Social Butterfly", description: "Invite 5 friends to outings", xp: 200, check: "invites >= 5" },
  { key: "night_owl", title: "Night Owl", description: "Check in after midnight 3 times", xp: 150, check: "late_checkins >= 3" },
  { key: "world_traveler", title: "World Traveler", description: "Use Confetti in 3 different cities", xp: 500, check: "cities >= 3" },
  { key: "streak_7", title: "Week Warrior", description: "7-day activity streak", xp: 350, check: "streak >= 7" },
  { key: "streak_30", title: "Monthly Maven", description: "30-day activity streak", xp: 1000, check: "streak >= 30" },
  { key: "black_member", title: "Black Card", description: "Subscribe to Confetti Black", xp: 500, check: "is_black" },
  { key: "stamp_collector_10", title: "Stamp Collector", description: "Collect 10 passport stamps", xp: 400, check: "stamps >= 10" },
];

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders() });

  const url = new URL(req.url);
  const action = url.pathname.split("/").pop();
  const authHeader = req.headers.get("Authorization")!;
  const sb = supabaseForUser(authHeader);
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return errorResponse("Unauthorized", 401);

  try {
    switch (action) {
      // ── Achievements ─────────────────────────────────────
      case "achievements": {
        const { data: earned, error } = await sb
          .from("achievements")
          .select("*")
          .eq("user_id", user.id);
        if (error) return errorResponse(error.message);

        const earnedKeys = new Set((earned || []).map((a: any) => a.code));
        const all = ACHIEVEMENT_DEFS.map((def) => ({
          ...def,
          earned: earnedKeys.has(def.key),
          earned_at: earned?.find((a: any) => a.code === def.key)?.unlocked_at,
        }));

        return jsonResponse(all);
      }

      case "check-achievements": {
        // Gather user stats
        const [
          { count: checkinCount },
          { count: reviewCount },
          { count: inviteCount },
          { count: stampCount },
          { data: checkins },
          { data: subscription },
        ] = await Promise.all([
          sb.from("user_checkins").select("*", { count: "exact", head: true }).eq("user_id", user.id),
          sb.from("reviews").select("*", { count: "exact", head: true }).eq("user_id", user.id),
          sb.from("group_invites").select("*", { count: "exact", head: true }).eq("owner_id", user.id),
          sb.from("passport_stamps").select("*", { count: "exact", head: true }).eq("user_id", user.id),
          sb.from("user_checkins").select("venue_id, venues(neighborhood, city), verified_at").eq("user_id", user.id),
          sb.from("user_subscriptions").select("tier").eq("user_id", user.id).maybeSingle(),
        ]);

        const neighborhoods = new Set((checkins || []).map((c: any) => c.venues?.neighborhood)).size;
        const cities = new Set((checkins || []).map((c: any) => c.venues?.city)).size;
        const lateCheckins = (checkins || []).filter((c: any) => {
          const hour = new Date(c.verified_at).getHours();
          return hour >= 0 && hour < 5;
        }).length;

        const stats: Record<string, number | boolean> = {
          checkins: checkinCount || 0,
          reviews: reviewCount || 0,
          invites: inviteCount || 0,
          stamps: stampCount || 0,
          neighborhoods,
          cities,
          late_checkins: lateCheckins,
          streak: 0, // TODO: compute from behavior events
          is_black: subscription?.tier?.includes("black") || false,
        };

        // Check which achievements are newly earned
        const { data: existing } = await sb
          .from("achievements")
          .select("code")
          .eq("user_id", user.id);
        const earnedKeys = new Set((existing || []).map((a: any) => a.code));

        const newlyEarned: any[] = [];
        for (const def of ACHIEVEMENT_DEFS) {
          if (earnedKeys.has(def.key)) continue;

          let qualified = false;
          if (def.key === "first_night_out") qualified = (stats.checkins as number) >= 1;
          else if (def.key === "city_explorer") qualified = (stats.neighborhoods as number) >= 5;
          else if (def.key === "taste_maker") qualified = (stats.reviews as number) >= 10;
          else if (def.key === "social_butterfly") qualified = (stats.invites as number) >= 5;
          else if (def.key === "night_owl") qualified = (stats.late_checkins as number) >= 3;
          else if (def.key === "world_traveler") qualified = (stats.cities as number) >= 3;
          else if (def.key === "streak_7") qualified = (stats.streak as number) >= 7;
          else if (def.key === "streak_30") qualified = (stats.streak as number) >= 30;
          else if (def.key === "black_member") qualified = stats.is_black as boolean;
          else if (def.key === "stamp_collector_10") qualified = (stats.stamps as number) >= 10;

          if (qualified) {
            const { data: achievement } = await sb
              .from("achievements")
              .insert({
                user_id: user.id,
                code: def.key,
                name: def.title,
                description: def.description,
                progress: 1,
                target: 1,
                unlocked_at: new Date().toISOString(),
              })
              .select()
              .single();
            if (achievement) newlyEarned.push(achievement);
          }
        }

        return jsonResponse({ stats, newly_earned: newlyEarned });
      }

      // ── XP & Level ───────────────────────────────────────
      case "xp-summary": {
        const { data: achievements } = await sb
          .from("achievements")
          .select("code")
          .eq("user_id", user.id);

        const totalXP = (achievements || []).reduce((sum: number, a: any) => {
          const def = ACHIEVEMENT_DEFS.find((d) => d.key === a.code);
          return sum + (def?.xp || 0);
        }, 0);
        const level = Math.floor(totalXP / 500) + 1;
        const xpToNext = 500 - (totalXP % 500);

        return jsonResponse({ total_xp: totalXP, level, xp_to_next_level: xpToNext });
      }

      // ── Leaderboard ──────────────────────────────────────
      case "leaderboard": {
        const body = await req.json();
        const city = body.city;

        // Get top users by stamp count
        const { data, error } = await supabaseAdmin
          .from("profiles")
          .select("id, full_name, avatar_url")
          .order("created_at", { ascending: true })
          .limit(50);

        if (error) return errorResponse(error.message);

        // Enrich with achievement counts
        const enriched = await Promise.all(
          (data || []).map(async (p: any) => {
            const { count: stampCount } = await supabaseAdmin
              .from("passport_stamps")
              .select("*", { count: "exact", head: true })
              .eq("user_id", p.id);

            const { data: achievements } = await supabaseAdmin
              .from("achievements")
              .select("code")
              .eq("user_id", p.id);

            const totalXP = (achievements || []).reduce((sum: number, a: any) => {
              const def = ACHIEVEMENT_DEFS.find((d) => d.key === a.code);
              return sum + (def?.xp || 0);
            }, 0);

            return {
              user_id: p.id,
              display_name: p.full_name,
              avatar_url: p.avatar_url,
              stamps: stampCount || 0,
              xp: totalXP,
              level: Math.floor(totalXP / 500) + 1,
            };
          }),
        );

        enriched.sort((a, b) => b.xp - a.xp);

        return jsonResponse(enriched.slice(0, body.limit || 20));
      }

      default:
        return errorResponse("Unknown action", 404);
    }
  } catch (err) {
    return errorResponse(err.message, 500);
  }
});
