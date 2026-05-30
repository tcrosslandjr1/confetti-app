import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { getRequestHost } from "@tanstack/react-start/server";

/**
 * Facebook OAuth callback (Facebook Login).
 *
 * Flow:
 *   1. Validate `state` against facebook_oauth_states (single-use, not expired).
 *   2. Exchange `code` for a short-lived token via graph.facebook.com.
 *   3. Upgrade to a 60-day long-lived token.
 *   4. Fetch the user's profile (id, name, email).
 *   5. Upsert into linked_social_accounts.
 *   6. Redirect back into the app.
 */
export const Route = createFileRoute("/api/public/facebook/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const errParam = url.searchParams.get("error");
        const errReason = url.searchParams.get("error_reason");

        const finish = (path: string) =>
          new Response(null, { status: 302, headers: { Location: path } });

        if (errParam) {
          return finish(
            `/new/socials?facebook=error&reason=${encodeURIComponent(errReason ?? errParam)}`,
          );
        }
        if (!code || !state) {
          return finish("/new/socials?facebook=error&reason=missing_params");
        }

        const appId = process.env.FACEBOOK_APP_ID;
        const appSecret = process.env.FACEBOOK_APP_SECRET;
        const supabaseUrl = process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!appId || !appSecret || !supabaseUrl || !serviceKey) {
          return finish("/new/socials?facebook=error&reason=server_not_configured");
        }

        const admin = createClient(supabaseUrl, serviceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });

        // 1) Validate + consume state
        const { data: stateRow, error: stateErr } = await admin
          .from("facebook_oauth_states")
          .select("state, user_id, redirect_to, expires_at, consumed_at")
          .eq("state", state)
          .maybeSingle();

        if (stateErr || !stateRow)
          return finish("/new/socials?facebook=error&reason=invalid_state");
        if (stateRow.consumed_at) return finish("/new/socials?facebook=error&reason=state_used");
        if (new Date(stateRow.expires_at).getTime() < Date.now()) {
          return finish("/new/socials?facebook=error&reason=state_expired");
        }

        await admin
          .from("facebook_oauth_states")
          .update({ consumed_at: new Date().toISOString() })
          .eq("state", state);

        const host = getRequestHost();
        const proto = host?.includes("localhost") ? "http" : "https";
        const redirectUri = `${proto}://${host}/api/public/facebook/callback`;

        // 2) Exchange code for short-lived token
        const tokenParams = new URLSearchParams({
          client_id: appId,
          client_secret: appSecret,
          redirect_uri: redirectUri,
          code,
        });
        const tokenRes = await fetch(
          `https://graph.facebook.com/v20.0/oauth/access_token?${tokenParams}`,
        );

        if (!tokenRes.ok) {
          const text = await tokenRes.text();
          console.error("Facebook token exchange failed", tokenRes.status, text);
          return finish("/new/socials?facebook=error&reason=token_exchange_failed");
        }

        const tokenJson = (await tokenRes.json()) as {
          access_token?: string;
          token_type?: string;
          expires_in?: number;
          error?: { message: string };
        };

        if (tokenJson.error || !tokenJson.access_token) {
          console.error("Facebook token error", tokenJson);
          return finish("/new/socials?facebook=error&reason=token_error");
        }

        // 3) Upgrade to long-lived token
        let accessToken = tokenJson.access_token;
        let expiresAt: string | null = null;

        const llParams = new URLSearchParams({
          grant_type: "fb_exchange_token",
          client_id: appId,
          client_secret: appSecret,
          fb_exchange_token: tokenJson.access_token,
        });
        const llRes = await fetch(
          `https://graph.facebook.com/v20.0/oauth/access_token?${llParams}`,
        );
        if (llRes.ok) {
          const ll = (await llRes.json()) as { access_token?: string; expires_in?: number };
          if (ll.access_token) accessToken = ll.access_token;
          if (ll.expires_in) {
            expiresAt = new Date(Date.now() + ll.expires_in * 1000).toISOString();
          }
        }

        // 4) Fetch user profile
        const meRes = await fetch(
          `https://graph.facebook.com/v20.0/me?fields=id,name,email&access_token=${encodeURIComponent(accessToken)}`,
        );

        let providerUserId: string | null = null;
        let displayName: string | null = null;
        let username: string | null = null;
        let rawProfile: unknown = null;

        if (meRes.ok) {
          const me = (await meRes.json()) as { id?: string; name?: string; email?: string };
          rawProfile = me;
          providerUserId = me.id ?? null;
          displayName = me.name ?? null;
          username = me.email ?? null; // FB doesn't have @usernames — use email as identifier
        }

        if (!providerUserId) {
          return finish("/new/socials?facebook=error&reason=no_user_id");
        }

        // 5) Upsert linked account
        const { error: upsertErr } = await admin.from("linked_social_accounts").upsert(
          {
            user_id: stateRow.user_id,
            provider: "facebook",
            provider_user_id: providerUserId,
            username,
            display_name: displayName,
            avatar_url: null,
            scope: "public_profile,email",
            access_token: accessToken,
            refresh_token: null,
            expires_at: expiresAt,
            raw: rawProfile as Record<string, unknown>,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,provider" },
        );

        if (upsertErr) {
          console.error("Linked account upsert failed", upsertErr);
          return finish("/new/socials?facebook=error&reason=link_failed");
        }

        // 6) Redirect back
        const back = stateRow.redirect_to || "/new/socials";
        const sep = back.includes("?") ? "&" : "?";
        return finish(`${back}${sep}facebook=connected`);
      },
    },
  },
});
