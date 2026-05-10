/**
 * Scheduled hook: rotate TikTok access tokens before they expire.
 *
 * Called by pg_cron with the project anon key in the `apikey` header.
 * pg_cron auth is enforced at the platform edge for /api/public/* — we
 * still validate the apikey header so direct hits without it 401.
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/tiktok-refresh")({
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

        const { refreshExpiringTiktokTokens } = await import(
          "@/lib/tiktok-token.server"
        );

        try {
          const result = await refreshExpiringTiktokTokens(24);
          console.log("tiktok-refresh hook", result);
          return Response.json({ ok: true, ...result });
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          console.error("tiktok-refresh hook failed", message);
          return new Response(JSON.stringify({ ok: false, error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
