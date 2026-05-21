// ============================================================
// TRIGGER: On Corporate Booking Requested
// Hardened: HMAC webhook signature required, idempotent on booking.id.
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

  const booking = payload.record || payload;
  if (!booking?.id || !booking.company_id || !booking.team_id) {
    return errorResponse("Invalid booking payload");
  }

  if (booking.status !== "pending") {
    return jsonResponse({ skipped: true, reason: "not pending" });
  }

  const claimed = await claimTriggerEvent("trigger-on-corporate-booking", String(booking.id));
  if (!claimed) return jsonResponse({ skipped: true, reason: "duplicate event" });

  try {
    const [{ data: team }, { data: company }] = await Promise.all([
      supabaseAdmin.from("corporate_teams").select("*").eq("id", booking.team_id).single(),
      supabaseAdmin.from("corporate_companies").select("*").eq("id", booking.company_id).single(),
    ]);

    if (!team || !company) return errorResponse("Team or company not found");

    const totalCost = booking.estimated_cost || 0;
    const autoApprove = !team.approval_required;

    if (autoApprove) {
      await supabaseAdmin
        .from("corporate_bookings")
        .update({
          status: "approved",
          approved_by: null,
          policy_check: {
            ...(booking.policy_check || {}),
            auto_approved: true,
            reason: "Under approval threshold",
          },
        })
        .eq("id", booking.id);
      return jsonResponse({ action: "auto_approved", booking_id: booking.id });
    }

    const approver = team.approver_user_id;
    if (approver) {
      await supabaseAdmin.from("chat_messages").insert({
        user_id: approver,
        role: "system",
        body: `Corporate booking request from your team "${team.name}" requires approval. Estimated cost: $${totalCost}. Booking ID: ${booking.id}`,
        metadata: {
          type: "corporate_booking_approval",
          booking_id: booking.id,
          team_id: team.id,
          estimated_cost: totalCost,
        },
      });
    }

    return jsonResponse({
      action: "approval_required",
      booking_id: booking.id,
      approver_user_id: approver,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[trigger-on-corporate-booking] error:", msg);
    return errorResponse("Internal error", 500);
  }
});
