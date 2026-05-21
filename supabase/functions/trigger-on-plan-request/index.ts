// ============================================================
// TRIGGER: On User Requests Plan
// Fires when a chat_messages row with role="user" is inserted.
// Hardened: HMAC webhook signature required, idempotent on message id,
// invokes ai-pipeline using INTERNAL_TRIGGER_SECRET (not the service-role
// key) for service-to-service auth.
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

  const record = payload.record || payload;
  if (!record?.user_id || !record.body) return errorResponse("Invalid payload");
  if (record.role !== "user") return jsonResponse({ skipped: true, reason: "not a user message" });

  const eventId = record.id ? String(record.id) : `${record.user_id}:${Date.now()}`;
  const claimed = await claimTriggerEvent("trigger-on-plan-request", eventId);
  if (!claimed) return jsonResponse({ skipped: true, reason: "duplicate event" });

  const internalSecret = Deno.env.get("INTERNAL_TRIGGER_SECRET");
  if (!internalSecret) {
    return errorResponse("INTERNAL_TRIGGER_SECRET not configured", 500);
  }

  try {
    const pipelineUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/ai-pipeline`;
    const response = await fetch(pipelineUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-trigger-secret": internalSecret,
        "x-user-id": record.user_id,
      },
      body: JSON.stringify({
        query: record.body,
        chat_message_id: record.id,
      }),
    });

    const result = await response.json();

    if (result.plan?.narrative) {
      await supabaseAdmin.from("chat_messages").insert({
        user_id: record.user_id,
        role: "assistant",
        body: result.plan.narrative,
        metadata: {
          plan: result.plan,
          boarding_pass: result.plan.boarding_pass,
          run_id: result.meta?.run_id,
        },
      });
    }

    return jsonResponse({ triggered: true, run_id: result.meta?.run_id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[trigger-on-plan-request] error:", msg);
    return errorResponse("Internal error", 500);
  }
});
