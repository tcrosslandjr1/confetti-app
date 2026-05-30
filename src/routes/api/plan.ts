import { createFileRoute } from "@tanstack/react-router";
import { generatePlan } from "@/lib/generate-plan.functions";
import { getAuthedUserId, unauthorizedResponse } from "@/lib/require-auth.server";
import { corsHeaders, preflightResponse } from "@/lib/cors";

export const Route = createFileRoute("/api/plan")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => preflightResponse(request),
      POST: async ({ request }) => {
        const origin = request.headers.get("Origin");
        const hdrs = corsHeaders(origin);
        const userId = await getAuthedUserId(request);
        if (!userId) return unauthorizedResponse(hdrs);
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON body" }, { status: 400, headers: hdrs });
        }

        try {
          // Runs the full pipeline:
          //   Context (city + taste + weather + mood)
          //   → FilterRules (Quality Guardrail, blocked venues, forbidden cats)
          //   → Ranking (promoted boosts + trend/rating sort)
          //   → PlanGenerator (template-driven structured output)
          //   → Explainer (rationale + tagline + guardrail note)
          const plan = await generatePlan({ data: body as never });
          return Response.json({ plan }, { status: 200, headers: hdrs });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Pipeline failed";
          // Zod validation errors throw with a JSON-ish message; surface 400 for those.
          const status = /invalid|required|expected/i.test(message) ? 400 : 500;
          console.error("[/api/plan] pipeline error:", err);
          return Response.json({ error: message }, { status, headers: hdrs });
        }
      },
    },
  },
});
