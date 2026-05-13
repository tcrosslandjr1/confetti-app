import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const EventSchema = z.object({
  name: z.enum([
    "pick_impression",
    "pick_click",
    "pick_feedback_up",
    "pick_feedback_down",
  ]),
  pickId: z.string().min(1).max(255),
  context: z.string().max(255).optional(),
  signals: z.array(z.string().min(1).max(64)).max(20).default([]),
  meta: z.record(z.string().max(64), z.any()).optional(),
  clientAt: z.string().datetime().optional(),
  sessionId: z.string().max(128).optional(),
  userId: z.string().uuid().optional(),
});

const BodySchema = z.object({
  events: z.array(EventSchema).min(1).max(50),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const Route = createFileRoute("/api/public/pick-events")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: async ({ request }) => {
        let payload: unknown;
        try {
          payload = await request.json();
        } catch {
          return new Response(JSON.stringify({ error: "invalid json" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
        const parsed = BodySchema.safeParse(payload);
        if (!parsed.success) {
          return new Response(
            JSON.stringify({ error: "invalid payload", issues: parsed.error.issues }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
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
          user_id: e.userId ?? null,
        }));
        const { error } = await supabaseAdmin.from("pick_events").insert(rows);
        if (error) {
          console.error("[pick-events] insert failed", error);
          return new Response(JSON.stringify({ error: "insert failed" }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
        return new Response(JSON.stringify({ ok: true, count: rows.length }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      },
    },
  },
});
