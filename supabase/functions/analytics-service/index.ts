// ============================================================
// AnalyticsService — Platform metrics, venue analytics,
//                    agent performance, business dashboards
// ============================================================

import { serve } from "../_shared/server.ts";
import { supabaseAdmin, supabaseForUser, corsHeaders, jsonResponse, errorResponse } from "../_shared/supabase-client.ts";

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
      // ── Venue Analytics (Business Dashboard) ─────────────
      case "venue-stats": {
        const { venue_id, period_days } = await req.json();
        const since = new Date(Date.now() - (period_days || 30) * 86400000).toISOString();

        const [
          { count: checkinCount },
          { count: favoriteCount },
          { count: reviewCount },
          { data: reviews },
          { data: reels },
          { data: boosts },
          { data: coupons },
        ] = await Promise.all([
          supabaseAdmin.from("user_checkins").select("*", { count: "exact", head: true }).eq("venue_id", venue_id).gte("verified_at", since),
          supabaseAdmin.from("favorites").select("*", { count: "exact", head: true }).eq("venue_id", venue_id),
          supabaseAdmin.from("reviews").select("*", { count: "exact", head: true }).eq("venue_id", venue_id).gte("created_at", since),
          supabaseAdmin.from("reviews").select("rating").eq("venue_id", venue_id),
          supabaseAdmin.from("reels").select("view_count, like_count").eq("venue_id", venue_id),
          supabaseAdmin.from("boost_campaigns").select("total_credits_spent, impressions, click_throughs, status").eq("venue_id", venue_id),
          supabaseAdmin.from("coupon_redemptions").select("status").eq("venue_id", venue_id).gte("created_at", since),
        ]);

        const avgRating = reviews?.length
          ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
          : 0;

        const totalViews = (reels || []).reduce((sum: number, r: any) => sum + (r.view_count || 0), 0);
        const totalLikes = (reels || []).reduce((sum: number, r: any) => sum + (r.like_count || 0), 0);
        const totalBoostSpend = (boosts || []).reduce((sum: number, b: any) => sum + (b.total_credits_spent || 0), 0);
        const redemptions = (coupons || []).filter((c: any) => c.status === "used").length;

        return jsonResponse({
          period_days: period_days || 30,
          checkins: checkinCount || 0,
          favorites: favoriteCount || 0,
          new_reviews: reviewCount || 0,
          average_rating: Math.round(avgRating * 10) / 10,
          reel_views: totalViews,
          reel_likes: totalLikes,
          boost_spend: totalBoostSpend,
          active_boosts: (boosts || []).filter((b: any) => b.status === "active").length,
          coupon_redemptions: redemptions,
        });
      }

      // ── Agent Performance ────────────────────────────────
      case "agent-performance": {
        const { period_days } = await req.json();
        const since = new Date(Date.now() - (period_days || 7) * 86400000).toISOString();

        const { data: runs, error } = await supabaseAdmin
          .from("agent_run_log")
          .select("pipeline_type, status, total_tokens, total_latency_ms, steps, created_at")
          .gte("created_at", since)
          .order("created_at", { ascending: false });

        if (error) return errorResponse(error.message);

        const totalRuns = runs?.length || 0;
        const successful = runs?.filter((r: any) => r.status === "completed").length || 0;
        const failed = runs?.filter((r: any) => r.status === "failed").length || 0;
        const avgTokens = totalRuns
          ? Math.round(runs!.reduce((sum: number, r: any) => sum + (r.total_tokens || 0), 0) / totalRuns)
          : 0;
        const avgLatency = totalRuns
          ? Math.round(runs!.reduce((sum: number, r: any) => sum + (r.total_latency_ms || 0), 0) / totalRuns)
          : 0;

        // Per-agent breakdown
        const agentStats: Record<string, { calls: number; avg_tokens: number; avg_latency_ms: number }> = {};
        for (const run of runs || []) {
          for (const step of run.steps || []) {
            if (!agentStats[step.agent]) {
              agentStats[step.agent] = { calls: 0, avg_tokens: 0, avg_latency_ms: 0 };
            }
            agentStats[step.agent].calls++;
            agentStats[step.agent].avg_tokens += step.tokens || 0;
            agentStats[step.agent].avg_latency_ms += step.latency_ms || 0;
          }
        }
        for (const key of Object.keys(agentStats)) {
          agentStats[key].avg_tokens = Math.round(agentStats[key].avg_tokens / agentStats[key].calls);
          agentStats[key].avg_latency_ms = Math.round(agentStats[key].avg_latency_ms / agentStats[key].calls);
        }

        return jsonResponse({
          period_days: period_days || 7,
          total_runs: totalRuns,
          successful,
          failed,
          success_rate: totalRuns ? Math.round((successful / totalRuns) * 100) : 0,
          avg_tokens_per_run: avgTokens,
          avg_latency_ms: avgLatency,
          by_pipeline: {
            personal: runs?.filter((r: any) => r.pipeline_type === "personal").length || 0,
            corporate: runs?.filter((r: any) => r.pipeline_type === "corporate").length || 0,
          },
          agent_breakdown: agentStats,
        });
      }

      // ── Platform Overview (Admin) ────────────────────────
      case "platform-overview": {
        const [
          { count: userCount },
          { count: venueCount },
          { count: checkinCount },
          { count: planCount },
          { count: boostCount },
          { count: corpCount },
        ] = await Promise.all([
          supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }),
          supabaseAdmin.from("venues").select("*", { count: "exact", head: true }),
          supabaseAdmin.from("user_checkins").select("*", { count: "exact", head: true }),
          supabaseAdmin.from("trip_plans").select("*", { count: "exact", head: true }),
          supabaseAdmin.from("boost_campaigns").select("*", { count: "exact", head: true }).eq("status", "active"),
          supabaseAdmin.from("corporate_companies").select("*", { count: "exact", head: true }),
        ]);

        // Revenue from boosts
        const { data: boostRevenue } = await supabaseAdmin
          .from("boost_campaigns")
          .select("total_credits_spent");
        const totalBoostRevenue = (boostRevenue || []).reduce((sum: number, b: any) => sum + (b.total_credits_spent || 0), 0);

        // Active subscribers
        const { count: subscriberCount } = await supabaseAdmin
          .from("user_subscriptions")
          .select("*", { count: "exact", head: true });

        return jsonResponse({
          total_users: userCount || 0,
          total_venues: venueCount || 0,
          total_checkins: checkinCount || 0,
          total_plans_generated: planCount || 0,
          active_boost_campaigns: boostCount || 0,
          corporate_accounts: corpCount || 0,
          active_subscribers: subscriberCount || 0,
          total_boost_revenue: totalBoostRevenue,
        });
      }

      // ── Trending Report ──────────────────────────────────
      case "trending-report": {
        const { city } = await req.json();
        let query = supabaseAdmin
          .from("trending_venues")
          .select("*, venues(name, category, neighborhood, average_rating)")
          .gte("expires_at", new Date().toISOString())
          .order("trend_score", { ascending: false })
          .limit(20);

        if (city) query = query.eq("city", city);

        const { data, error } = await query;
        if (error) return errorResponse(error.message);
        return jsonResponse(data);
      }

      // ── Scheduled Job Ledger ─────────────────────────────
      case "job-history": {
        const { job_name, limit } = await req.json();
        let query = supabaseAdmin
          .from("scheduled_job_ledger")
          .select("*")
          .order("started_at", { ascending: false })
          .limit(limit || 20);

        if (job_name) query = query.eq("job_name", job_name);

        const { data, error } = await query;
        if (error) return errorResponse(error.message);
        return jsonResponse(data);
      }

      default:
        return errorResponse("Unknown action", 404);
    }
  } catch (err) {
    return errorResponse(err.message, 500);
  }
});
