import { createFileRoute } from "@tanstack/react-router";
import { getRequestHost } from "@tanstack/react-start/server";

/**
 * Instagram OAuth initiation (Instagram Login / Meta).
 */
export const Route = createFileRoute("/api/public/instagram/initiate")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const state = url.searchParams.get("state");

        if (!state) {
          return new Response("Missing state", { status: 400 });
        }

        const clientId = process.env.INSTAGRAM_CLIENT_ID;
        if (!clientId) {
          return new Response("Instagram not configured", { status: 503 });
        }

        const host = getRequestHost();
        const proto = host?.includes("localhost") ? "http" : "https";
        const redirectUri = `${proto}://${host}/api/public/instagram/callback`;

        const params = new URLSearchParams({
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: "code",
          scope: "instagram_basic,instagram_content_publish",
          state,
        });

        const authUrl = `https://api.instagram.com/oauth/authorize?${params}`;
        return new Response(null, {
          status: 302,
          headers: { Location: authUrl },
        });
      },
    },
  },
});
