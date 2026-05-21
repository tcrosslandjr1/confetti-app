// ============================================================
// Confetti AI Pipeline — Orchestrator
// Chains: ContextAgent → FilterRulesAgent → RankingAgent
//       → PlanGeneratorAgent → ExplainerAgent
// Corporate branch: → CorporatePlannerAgent (after Ranking)
// ============================================================

import { serve } from "../_shared/server.ts";
import { supabaseAdmin, supabaseForUser, corsHeaders, jsonResponse, errorResponse } from "../_shared/supabase-client.ts";
import { consumeRateLimit } from "../_shared/ratelimit.ts";
import { contextAgent } from "./agents/context-agent.ts";
import { filterRulesAgent } from "./agents/filter-rules-agent.ts";
import { rankingAgent } from "./agents/ranking-agent.ts";
import { planGeneratorAgent } from "./agents/plan-generator-agent.ts";
import { corporatePlannerAgent } from "./agents/corporate-planner-agent.ts";
import { explainerAgent } from "./agents/explainer-agent.ts";

interface PipelineRequest {
  query: string;
  location?: { lat: number; lng: number; city?: string };
  occasion?: string;
  party_size?: number;
  budget?: string;
  mood?: string;
  corporate?: { company_id: string; team_id: string };
  session_id?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }

  try {
    // Two valid auth paths:
    //   1. User JWT — normal client calls.
    //   2. INTERNAL_TRIGGER_SECRET header + x-user-id — service-to-service
    //      calls from our own triggers. NOT the service-role key (which would
    //      mean any service-role leak == impersonation primitive).
    let userId: string;
    const internalSecret = Deno.env.get("INTERNAL_TRIGGER_SECRET");
    const internalHeader = req.headers.get("x-internal-trigger-secret");
    if (internalSecret && internalHeader === internalSecret) {
      const headerUserId = req.headers.get("x-user-id");
      if (!headerUserId) return errorResponse("Missing x-user-id for internal call", 400);
      userId = headerUserId;
    } else {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) return errorResponse("Missing auth", 401);
      const sb = supabaseForUser(authHeader);
      const { data: { user }, error: authErr } = await sb.auth.getUser();
      if (authErr || !user) return errorResponse("Unauthorized", 401);
      userId = user.id;
    }

    // 10 pipeline runs/min/user — each run can fire 5+ Claude calls,
    // so we cap aggressively to keep token spend bounded.
    const allowed = await consumeRateLimit({
      scope: "ai-pipeline",
      identity: `user:${userId}`,
      burst: 10,
      refillPerSec: 10 / 60,
    });
    if (!allowed) return errorResponse("Rate limit exceeded", 429);

    const body: PipelineRequest = await req.json();

    // Input caps — prevent a single request from running up the token bill.
    if (typeof body.query !== "string" || body.query.length === 0 || body.query.length > 1000) {
      return errorResponse("query must be 1-1000 chars", 400);
    }
    if (body.party_size !== undefined && (typeof body.party_size !== "number" || body.party_size < 1 || body.party_size > 50)) {
      return errorResponse("party_size out of range", 400);
    }
    const isCorporate = !!body.corporate;
    const pipelineType = isCorporate ? "corporate" : "recommendation";

    // Create agent run log
    const { data: runLog } = await supabaseAdmin
      .from("agent_run_log")
      .insert({
        user_id: userId,
        pipeline_type: pipelineType,
        session_id: body.session_id || null,
        status: "running",
        steps: [],
      })
      .select("id")
      .single();

    const runId = runLog?.id;
    const steps: unknown[] = [];
    let totalTokens = 0;
    const pipelineStart = Date.now();

    // Helper to log each step
    async function runStep<T>(
      name: string,
      fn: () => Promise<{ result: T; tokens: number }>,
    ): Promise<T> {
      const start = Date.now();
      const { result, tokens } = await fn();
      const step = {
        agent: name,
        started_at: new Date(start).toISOString(),
        completed_at: new Date().toISOString(),
        latency_ms: Date.now() - start,
        tokens_used: tokens,
      };
      steps.push(step);
      totalTokens += tokens;
      return result;
    }

    // ── Step 1: Context Agent ──
    const context = await runStep("ContextAgent", () =>
      contextAgent(userId, body, supabaseAdmin),
    );

    // ── Step 2: Filter Rules Agent ──
    const filters = await runStep("FilterRulesAgent", () =>
      filterRulesAgent(context, body),
    );

    // ── Step 3: Ranking Agent ──
    const rankedVenues = await runStep("RankingAgent", () =>
      rankingAgent(filters, context, supabaseAdmin),
    );

    let plan: unknown;

    if (isCorporate) {
      // ── Corporate Branch: Corporate Planner Agent ──
      plan = await runStep("CorporatePlannerAgent", () =>
        corporatePlannerAgent(
          rankedVenues,
          context,
          body.corporate!,
          supabaseAdmin,
        ),
      );
    } else {
      // ── Step 4: Plan Generator Agent ──
      plan = await runStep("PlanGeneratorAgent", () =>
        planGeneratorAgent(rankedVenues, context, body),
      );
    }

    // ── Step 5: Explainer Agent ──
    const explained = await runStep("ExplainerAgent", () =>
      explainerAgent(plan, context, body),
    );

    // Update run log
    const totalLatency = Date.now() - pipelineStart;
    if (runId) {
      await supabaseAdmin
        .from("agent_run_log")
        .update({
          steps,
          total_tokens: totalTokens,
          total_latency_ms: totalLatency,
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", runId);
    }

    return jsonResponse({
      plan: explained,
      meta: {
        run_id: runId,
        pipeline: pipelineType,
        total_tokens: totalTokens,
        latency_ms: totalLatency,
        steps_count: steps.length,
      },
    });
  } catch (err) {
    console.error("Pipeline error:", err);
    return errorResponse(err.message, 500);
  }
});
