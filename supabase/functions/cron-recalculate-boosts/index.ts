// ============================================================
// CRON: Recalculate Business Boosts — runs every 6 hours
// Calls recalculate_business_boosts() Postgres function
// Ends expired campaigns, pauses over-budget, deactivates coupons
// ============================================================

import { serve } from "../_shared/server.ts";
import { supabaseAdmin, corsHeaders, jsonResponse, errorResponse } from "../_shared/supabase-client.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders() });

  const authHeader = req.headers.get("Authorization");
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return errorResponse("Unauthorized cron call", 401);
  }

  try {
    const startTime = Date.now();

    const { data, error } = await supabaseAdmin.rpc("recalculate_business_boosts");

    const latency = Date.now() - startTime;

    if (error) {
      await supabaseAdmin.from("scheduled_job_ledger").insert({
        job_name: "recalculate_business_boosts",
        status: "failed",
        started_at: new Date(startTime).toISOString(),
        completed_at: new Date().toISOString(),
        error_message: error.message,
        metadata: { duration_ms: latency },
      });
      return errorResponse(error.message);
    }

    await supabaseAdmin.from("scheduled_job_ledger").insert({
      job_name: "recalculate_business_boosts",
      status: "completed",
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      rows_affected: data || 0,
      metadata: { duration_ms: latency },
    });

    return jsonResponse({
      job: "recalculate_business_boosts",
      status: "completed",
      duration_ms: latency,
      rows_affected: data || 0,
    });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
});
