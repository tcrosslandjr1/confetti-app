import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { getRequestHost } from "@tanstack/react-start/server";

/**
 * Instagram OAuth callback (Instagram API with Instagram Login).
 *
 * Flow:
 *   1. Validate `state` against instagram_oauth_states (single-use, not expired).
 *   2. Exchange `code` for a short-lived access token (form-encoded POST to api.instagram.com).
 *   3. Upgrade to a 60-day long-lived token via graph.instagram.com.
 *   4. Fetch the user's profile (id, username, account_type) from graph.instagram.com.
 *   5. Upsert into linked_social_accounts under the user_id we stashed in state.
 *   6. Redirect back into the app.
 */
export const Route = createFileRoute("/api/public/instagram/callback")({
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
          return finish(`/me?instagram=error&reason=${encodeURIComponent(errReason ?? errParam)}`);
        }
        if (!code || !state) {
          return finish("/me?instagram=error&reason=missing_params");
        }

        const clientId = process.env.INSTAGRAM_CLIENT_ID;
        const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
        const supabaseUrl = process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!clientId || !clientSecret || !supabaseUrl || !serviceKey) {
          return finish("/me?instagram=error&reason=server_not_configured");
        }

        const admin = createClient(supabaseUrl, serviceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });

        // 1) Validate + consume state
        const { data: stateRow, error: stateErr } = await admin
          .from("instagram_oauth_states")
          .select("state, user_id, redirect_to, expires_at, consumed_at")
          .eq("state", state)
          .maybeSingle();

        if (stateErr || !stateRow) {
          return finish("/me?instagram=error&reason=invalid_state");
        }
        if (stateRow.consumed_at) {
          return finish("/me?instagram=error&reason=state_used");
        }
        if (new Date(stateRow.expires_at).getTime() < Date.now()) {
          return finish("/me?instagram=error&reason=state_expired");
        }

        await admin
          .from("instagram_oauth_states")
          .update({ consumed_at: new Date().toISOString() })
          .eq("state", state);

        const host = getRequestHost();
        const proto = host?.includes("localhost") ? "http" : "https";
        const redirectUri = `${proto}://${host}/api/public/instagram/callback`;

        // 2) Exchange code for short-lived token
        const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "authorization_code",
            redirect_uri: redirectUri,
            code,
          }),
        });

        if (!tokenRes.ok) {
          const text = await tokenRes.text();
          console.error("Instagram token exchange failed", tokenRes.status, text);
          return finish("/me?instagram=error&reason=token_exchange_failed");
        }

        const shortLived = (await tokenRes.json()) as {
          access_token?: string;
          user_id?: number | string;
          permissions?: string[] | string;
          error_type?: string;
          error_message?: string;
        };

        if (!shortLived.access_token) {
          console.error("Instagram short-lived token error", shortLived);
          return finish("/me?instagram=error&reason=token_error");
        }

        // 3) Upgrade to long-lived (60 day) token
        let accessToken = shortLived.access_token;
        let expiresAt: string | null = null;

        const llParams = new URLSearchParams({
          grant_type: "ig_exchange_token",
          client_secret: clientSecret,
          access_token: shortLived.access_token,
        });
        const llRes = await fetch(
          `https://graph.instagram.com/access_token?${llParams.toString()}`,
        );
        if (llRes.ok) {
          const ll = (await llRes.json()) as {
            access_token?: string;
            expires_in?: number;
          };
          if (ll.access_token) accessToken = ll.access_token;
          if (ll.expires_in) {
            expiresAt = new Date(Date.now() + ll.expires_in * 1000).toISOString();
          }
        } else {
          console.warn("Instagram long-lived exchange failed", llRes.status);
        }

        // 4) Fetch user profile
        const meRes = await fetch(
          `https://graph.instagram.com/v21.0/me?fields=id,username,account_type&access_token=${encodeURIComponent(accessToken)}`,
        );

        let providerUserId: string | null = shortLived.user_id ? String(shortLived.user_id) : null;
        let username: string | null = null;
        let accountType: string | null = null;
        let rawProfile: unknown = null;

        if (meRes.ok) {
          const me = (await meRes.json()) as {
            id?: string;
            username?: string;
            account_type?: string;
          };
          rawProfile = me;
          providerUserId = me.id ?? providerUserId;
          username = me.username ?? null;
          accountType = me.account_type ?? null;
        } else {
          console.warn("Instagram /me fetch failed", meRes.status);
        }

        if (!providerUserId) {
          return finish("/me?instagram=error&reason=no_user_id");
        }

        const scope = Array.isArray(shortLived.permissions)
          ? shortLived.permissions.join(",")
          : (shortLived.permissions ?? null);

        // 5) Upsert linked account
        const { error: upsertErr } = await admin.from("linked_social_accounts").upsert(
          {
            user_id: stateRow.user_id,
            provider: "instagram",
            provider_user_id: providerUserId,
            username,
            display_name: username,
            avatar_url: null, // not exposed by Instagram Login API
            scope,
            access_token: accessToken,
            refresh_token: null,
            expires_at: expiresAt,
            raw: { profile: rawProfile, account_type: accountType } as Record<string, unknown>,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,provider" },
        );

        if (upsertErr) {
          console.error("Linked account upsert failed", upsertErr);
          return finish("/me?instagram=error&reason=link_failed");
        }

        // 6) Redirect back
        const back = stateRow.redirect_to || "/me";
        const sep = back.includes("?") ? "&" : "?";
        return finish(`${back}${sep}instagram=connected`);
      },
    },
  },
});
