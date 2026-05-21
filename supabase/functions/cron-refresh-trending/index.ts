// ============================================================
// CRON: Refresh Trending Venues — runs every 1 hour
// Calls the refresh_trending_venues() Postgres function
// which scores venues based on check-ins, favorites, views, boosts
// ============================================================

import { serve } from "../_shared/server.ts";
import { supabaseAdmin, corsHeaders, jsonResponse, errorResponse } from "../_shared/supabase-client.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders() });

  // Verify cron secret — hard-require it so an unset CRON_SECRET
  // doesn't leave the endpoint open to anonymous callers
  const authHeader = req.headers.get("Authorization");
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return errorResponse("Unauthorized cron call", 401);
  }

  try {
    const startTime = Date.now();

    // Call the DB function
    const { data, error } = await supabaseAdmin.rpc("refresh_trending_venues");

    const latency = Date.now() - startTime;

    if (error) {
      // Log failure to ledger
      await supabaseAdmin.from("scheduled_job_ledger").insert({
        job_name: "refresh_trending_venues",
        status: "failed",
        started_at: new Date(startTime).toISOString(),
        completed_at: new Date().toISOString(),
        error_message: error.message,
        metadata: { duration_ms: latency },
      });
      return errorResponse(error.message);
    }

    // Log success
    await supabaseAdmin.from("scheduled_job_ledger").insert({
      job_name: "refresh_trending_venues",
      status: "completed",
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      rows_affected: data || 0,
      metadata: { duration_ms: latency },
    });

    return jsonResponse({
      job: "refresh_trending_venues",
      status: "completed",
      duration_ms: latency,
      rows_affected: data || 0,
    });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
});
