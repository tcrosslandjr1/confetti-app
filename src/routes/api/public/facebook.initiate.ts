import { createFileRoute } from "@tanstack/react-router";
import { getRequestHost } from "@tanstack/react-start/server";

/**
 * Facebook OAuth initiation (Facebook Login).
 */
export const Route = createFileRoute("/api/public/facebook/initiate")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const state = url.searchParams.get("state");

        if (!state) {
          return new Response("Missing state", { status: 400 });
        }

        const appId = process.env.FACEBOOK_APP_ID;
        if (!appId) {
          return new Response("Facebook not configured", { status: 503 });
        }

        const host = getRequestHost();
        const proto = host?.includes("localhost") ? "http" : "https";
        const redirectUri = `${proto}://${host}/api/public/facebook/callback`;

        const params = new URLSearchParams({
          client_id: appId,
          redirect_uri: redirectUri,
          response_type: "code",
          scope: "public_profile,email,user_likes,user_events,user_posts",
          state,
        });

        const authUrl = `https://www.facebook.com/v20.0/dialog/oauth?${params}`;
        return new Response(null, {
          status: 302,
          headers: { Location: authUrl },
        });
      },
    },
  },
});
