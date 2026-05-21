// ============================================================
// TRIGGER: On Venue Boost Purchased
// Fires when a boost_campaign is inserted with status="active"
// Validates budget, sets up campaign tracking, updates venue tier
//
// Hardened: HMAC webhook signature required, idempotent on campaign.id,
// credit deduction is atomic via Postgres function.
// ============================================================

import { serve } from "../_shared/server.ts";
import {
  supabaseAdmin,
  corsHeaders,
  jsonResponse,
  errorResponse,
} from "../_shared/supabase-client.ts";
import { claimTriggerEvent, verifyTriggerAuth } from "../_shared/trigger.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders() });

  const rawBody = await req.text();
  const authResult = await verifyTriggerAuth(req, rawBody);
  if (!authResult.ok) return errorResponse(authResult.reason, 401);

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return errorResponse("Invalid JSON");
  }

  const campaign = payload.record || payload;
  if (!campaign?.id || !campaign?.venue_id || !campaign?.business_id) {
    return errorResponse("Invalid campaign payload");
  }

  // Replay protection: campaign.id is the dedupe key.
  const claimed = await claimTriggerEvent("trigger-on-boost-purchased", String(campaign.id));
  if (!claimed) return jsonResponse({ skipped: true, reason: "duplicate event" });

  try {
    const campaignCost = Number(campaign.daily_credit_budget ?? 0) * 30;

    // Atomic deduct-or-pause via the Postgres function (added below in a
    // migration). Falls back to read-then-update if the RPC is missing
    // (older deployments).
    const { data: rpcResult, error: rpcErr } = await supabaseAdmin.rpc(
      "deduct_boost_budget",
      { p_campaign_id: campaign.id, p_amount: campaignCost },
    );

    if (rpcErr && rpcErr.code === "42883") {
      // Function doesn't exist (older DB). Use the legacy path.
      const { data: biz } = await supabaseAdmin
        .from("business_accounts")
        .select("*")
        .eq("id", campaign.business_id)
        .single();

      if (!biz) return errorResponse("Business account not found");

      if (Number(biz.credit_balance) < campaignCost) {
        await supabaseAdmin
          .from("boost_campaigns")
          .update({ status: "paused" })
          .eq("id", campaign.id);
        return jsonResponse({
          action: "paused",
          reason: "Insufficient budget",
          required: campaignCost,
          available: Number(biz.credit_balance),
        });
      }

      await supabaseAdmin
        .from("business_accounts")
        .update({ credit_balance: Number(biz.credit_balance) - campaignCost })
        .eq("id", biz.id);
    } else if (rpcErr) {
      return errorResponse(`Deduct failed: ${rpcErr.message}`, 500);
    } else if (rpcResult?.status === "paused") {
      return jsonResponse({
        action: "paused",
        reason: "Insufficient budget",
        required: campaignCost,
        available: rpcResult.balance,
      });
    }

    // Update venue subscription tier if boost is significant.
    if (Number(campaign.boost_strength ?? 0) >= 8) {
      await supabaseAdmin
        .from("venues")
        .update({ subscription_tier: "boost" })
        .eq("id", campaign.venue_id)
        .in("subscription_tier", ["free", "spotlight"]);
    }

    // Initialize campaign metrics (no-op for the trigger replay path because
    // we already returned early on duplicate event).
    await supabaseAdmin
      .from("boost_campaigns")
      .update({
        impressions: 0,
        click_throughs: 0,
        total_credits_spent: 0,
      })
      .eq("id", campaign.id);

    // Log the event.
    const { data: biz } = await supabaseAdmin
      .from("business_accounts")
      .select("owner_user_id")
      .eq("id", campaign.business_id)
      .single();

    if (biz?.owner_user_id) {
      await supabaseAdmin.from("user_behavior_events").insert({
        user_id: biz.owner_user_id,
        event_type: "boost_purchased",
        venue_id: campaign.venue_id,
        metadata: {
          campaign_id: campaign.id,
          boost_strength: campaign.boost_strength,
          total_budget: campaignCost,
          daily_credit_budget: campaign.daily_credit_budget,
        },
      });
    }

    return jsonResponse({
      action: "activated",
      campaign_id: campaign.id,
      budget_deducted: campaignCost,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[trigger-on-boost-purchased] error:", msg);
    return errorResponse("Internal error", 500);
  }
});
