import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

import { getAuthedUserId } from "@/lib/require-auth.server";
import { corsHeaders, preflightResponse } from "@/lib/cors";

const EventSchema = z.object({
  name: z.enum(["pick_impression", "pick_click", "pick_feedback_up", "pick_feedback_down"]),
  pickId: z.string().min(1).max(255),
  context: z.string().max(255).optional(),
  signals: z.array(z.string().min(1).max(64)).max(20).default([]),
  meta: z.record(z.string().max(64), z.any()).optional(),
  clientAt: z.string().datetime().optional(),
  sessionId: z.string().max(128).optional(),
  // user_id is derived server-side from the Bearer token — never trusted from the client.
});

const BodySchema = z.object({
  events: z.array(EventSchema).min(1).max(50),
});

export const Route = createFileRoute("/api/public/pick-events")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => preflightResponse(request),
      POST: async ({ request }) => {
        const origin = request.headers.get("Origin");
        const hdrs = corsHeaders(origin);
        // Optional auth: anonymous analytics are allowed, but if a Bearer token
        // is present we use it as the source of truth for user_id. Clients can
        // no longer spoof another user's id by passing it in the body.
        const userId = await getAuthedUserId(request);
        let payload: unknown;
        try {
          payload = await request.json();
        } catch {
          return new Response(JSON.stringify({ error: "invalid json" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...hdrs },
          });
        }
        const parsed = BodySchema.safeParse(payload);
        if (!parsed.success) {
          return new Response(
            JSON.stringify({ error: "invalid payload", issues: parsed.error.issues }),
            { status: 400, headers: { "Content-Type": "application/json", ...hdrs } },
          );
        }
        const rows = parsed.data.events.map((e) => ({
          name: e.name,
          pick_id: e.pickId,
          context: e.context ?? null,
          signals: e.signals,
          meta: e.meta ?? {},
          client_at: e.clientAt ?? null,
          session_id: e.sessionId ?? null,
          user_id: userId,
        }));
        const { error } = await supabaseAdmin.from("pick_events").insert(rows);
        if (error) {
          console.error("[pick-events] insert failed", error);
          return new Response(JSON.stringify({ error: "insert failed" }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...hdrs },
          });
        }
        return new Response(JSON.stringify({ ok: true, count: rows.length }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...hdrs },
        });
      },
    },
  },
});
