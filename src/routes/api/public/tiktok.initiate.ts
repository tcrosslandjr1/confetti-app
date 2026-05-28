import { createFileRoute } from "@tanstack/react-router";
import { getRequestHost } from "@tanstack/react-start/server";

/**
 * TikTok OAuth initiation.
 * The client writes a state row then redirects here; we build the
 * full TikTok consent URL (which requires the server-side client key).
 */
export const Route = createFileRoute("/api/public/tiktok/initiate")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const state = url.searchParams.get("state");

        if (!state) {
          return new Response("Missing state", { status: 400 });
        }

        const clientKey = process.env.TIKTOK_CLIENT_KEY;
        if (!clientKey) {
          return new Response("TikTok not configured", { status: 503 });
        }

        const host = getRequestHost();
        const proto = host?.includes("localhost") ? "http" : "https";
        const redirectUri = `${proto}://${host}/api/public/tiktok/callback`;

        const params = new URLSearchParams({
          client_key: clientKey,
          response_type: "code",
          scope: "user.info.basic,video.list",
          redirect_uri: redirectUri,
          state,
        });

        const authUrl = `https://www.tiktok.com/v2/auth/authorize/?${params}`;
        return new Response(null, {
          status: 302,
          headers: { Location: authUrl },
        });
      },
    },
  },
});
