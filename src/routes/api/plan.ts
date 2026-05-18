import { createFileRoute } from "@tanstack/react-router";
import { generatePlan } from "@/lib/generate-plan.functions";
import { getAuthedUserId, unauthorizedResponse } from "@/lib/require-auth.server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const Route = createFileRoute("/api/plan")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: async ({ request }) => {
        const userId = await getAuthedUserId(request);
        if (!userId) return unauthorizedResponse(corsHeaders);
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json(
            { error: "Invalid JSON body" },
            { status: 400, headers: corsHeaders },
          );
        }

        try {
          // Runs the full pipeline:
          //   Context (city + taste + weather + mood)
          //   → FilterRules (Quality Guardrail, blocked venues, forbidden cats)
          //   → Ranking (promoted boosts + trend/rating sort)
          //   → PlanGenerator (template-driven structured output)
          //   → Explainer (rationale + tagline + guardrail note)
          const plan = await generatePlan({ data: body as never });
          return Response.json({ plan }, { status: 200, headers: corsHeaders });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Pipeline failed";
          // Zod validation errors throw with a JSON-ish message; surface 400 for those.
          const status = /invalid|required|expected/i.test(message) ? 400 : 500;
          console.error("[/api/plan] pipeline error:", err);
          return Response.json({ error: message }, { status, headers: corsHeaders });
        }
      },
    },
  },
});
