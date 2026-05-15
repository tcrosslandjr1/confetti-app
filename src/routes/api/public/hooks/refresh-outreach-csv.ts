import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  buildOutreachRanking,
  rankingToCsv,
} from "@/lib/outreach-ranking.server";

// Hit by pg_cron every Monday. Recomputes the 30d unclaimed-venue ranking,
// dedupes by venue name, and stores the CSV snapshot in outreach_snapshots.
// Auth: must present the Supabase anon key in the `apikey` header (matches
// the standard Lovable cron pattern).
export const Route = createFileRoute("/api/public/hooks/refresh-outreach-csv")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const provided = request.headers.get("apikey") ?? "";
        const expected = process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY ?? "";
        if (!expected || provided !== expected) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const ranking = await buildOutreachRanking(30, 500);
          const csv = rankingToCsv(ranking);

          const { data, error } = await supabaseAdmin
            .from("outreach_snapshots")
            .insert({
              generated_at: ranking.generatedAt,
              window_days: ranking.windowDays,
              venue_count: ranking.venues.length,
              csv,
              source: "cron",
            })
            .select("id, generated_at, venue_count")
            .single();
          if (error) throw error;

          // Keep only the most recent 12 snapshots
          const { data: stale } = await supabaseAdmin
            .from("outreach_snapshots")
            .select("id")
            .order("generated_at", { ascending: false })
            .range(12, 999);
          if (stale && stale.length > 0) {
            await supabaseAdmin
              .from("outreach_snapshots")
              .delete()
              .in("id", stale.map((s) => s.id));
          }

          return new Response(JSON.stringify({ ok: true, snapshot: data }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err: any) {
          console.error("[refresh-outreach-csv] failed", err);
          return new Response(
            JSON.stringify({ error: err?.message ?? "unknown error" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
