/**
 * Monthly cron hook: refresh venue photos + social links.
 * Called by pg_cron with the `apikey` header set to the project anon key.
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/refresh-venue-media")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = request.headers.get("apikey");
        const expected = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!expected || apiKey !== expected) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const { refreshStaleVenues } = await import("@/lib/venue-media.functions");
          // 50 venues per monthly run keeps within Firecrawl free-tier credits
          // (2 searches * 50 = 100 credits) and Google Places photo quotas.
          const result = await refreshStaleVenues(50, "cron");
          console.log("refresh-venue-media hook", result);
          return Response.json({ ok: true, ...result });
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          console.error("refresh-venue-media hook failed", message);
          return new Response(JSON.stringify({ ok: false, error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
