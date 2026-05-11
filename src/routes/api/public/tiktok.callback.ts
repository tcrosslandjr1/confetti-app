import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { getRequestHost } from "@tanstack/react-start/server";

/**
 * TikTok OAuth callback.
 *
 * Flow:
 *   1. Validate `state` against tiktok_oauth_states (single-use, not expired).
 *   2. Exchange `code` for an access token at TikTok.
 *   3. Fetch the TikTok user's basic profile (open_id, display name, avatar).
 *   4. Upsert into linked_social_accounts under the user_id we stashed in state.
 *   5. Redirect back into the app.
 */
export const Route = createFileRoute("/api/public/tiktok/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const errParam = url.searchParams.get("error");

        const finish = (path: string) =>
          new Response(null, { status: 302, headers: { Location: path } });

        if (errParam) {
          return finish(`/me?tiktok=error&reason=${encodeURIComponent(errParam)}`);
        }
        if (!code || !state) {
          return finish("/me?tiktok=error&reason=missing_params");
        }

        const clientKey = process.env.TIKTOK_CLIENT_KEY;
        const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
        const supabaseUrl = process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!clientKey || !clientSecret || !supabaseUrl || !serviceKey) {
          return finish("/me?tiktok=error&reason=server_not_configured");
        }

        const admin = createClient(supabaseUrl, serviceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });

        // 1) Validate + consume state row
        const { data: stateRow, error: stateErr } = await admin
          .from("tiktok_oauth_states")
          .select("state, user_id, redirect_to, expires_at, consumed_at")
          .eq("state", state)
          .maybeSingle();

        if (stateErr || !stateRow) {
          return finish("/me?tiktok=error&reason=invalid_state");
        }
        if (stateRow.consumed_at) {
          return finish("/me?tiktok=error&reason=state_used");
        }
        if (new Date(stateRow.expires_at).getTime() < Date.now()) {
          return finish("/me?tiktok=error&reason=state_expired");
        }

        // Mark consumed early to prevent replay; if anything below fails we
        // simply don't write a linked account row.
        await admin
          .from("tiktok_oauth_states")
          .update({ consumed_at: new Date().toISOString() })
          .eq("state", state);

        // Reconstruct the same redirect_uri we used to start the flow.
        const host = getRequestHost();
        const proto = host?.includes("localhost") ? "http" : "https";
        const redirectUri = `${proto}://${host}/api/public/tiktok/callback`;

        // 2) Exchange code for token
        const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Cache-Control": "no-cache",
          },
          body: new URLSearchParams({
            client_key: clientKey,
            client_secret: clientSecret,
            code,
            grant_type: "authorization_code",
            redirect_uri: redirectUri,
          }),
        });

        if (!tokenRes.ok) {
          const text = await tokenRes.text();
          console.error("TikTok token exchange failed", tokenRes.status, text);
          return finish("/me?tiktok=error&reason=token_exchange_failed");
        }

        const tokenJson = (await tokenRes.json()) as {
          access_token?: string;
          refresh_token?: string;
          expires_in?: number;
          open_id?: string;
          scope?: string;
          error?: string;
          error_description?: string;
        };

        if (tokenJson.error || !tokenJson.access_token) {
          console.error("TikTok token error", tokenJson);
          return finish("/me?tiktok=error&reason=token_error");
        }

        // 3) Fetch user profile
        const profileRes = await fetch(
          "https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,username",
          {
            headers: {
              Authorization: `Bearer ${tokenJson.access_token}`,
            },
          },
        );

        let username: string | null = null;
        let displayName: string | null = null;
        let avatarUrl: string | null = null;
        let openId: string | null = tokenJson.open_id ?? null;
        let rawProfile: unknown = null;

        if (profileRes.ok) {
          const profileJson = (await profileRes.json()) as {
            data?: {
              user?: {
                open_id?: string;
                avatar_url?: string;
                display_name?: string;
                username?: string;
              };
            };
          };
          rawProfile = profileJson;
          const u = profileJson.data?.user;
          if (u) {
            openId = u.open_id ?? openId;
            username = u.username ?? null;
            displayName = u.display_name ?? null;
            avatarUrl = u.avatar_url ?? null;
          }
        } else {
          console.warn("TikTok user info fetch failed", profileRes.status);
        }

        if (!openId) {
          return finish("/me?tiktok=error&reason=no_open_id");
        }

        const expiresAt = tokenJson.expires_in
          ? new Date(Date.now() + tokenJson.expires_in * 1000).toISOString()
          : null;

        // 4) Upsert linked_social_accounts
        const { error: upsertErr } = await admin.from("linked_social_accounts").upsert(
          {
            user_id: stateRow.user_id,
            provider: "tiktok",
            provider_user_id: openId,
            username,
            display_name: displayName,
            avatar_url: avatarUrl,
            scope: tokenJson.scope ?? null,
            access_token: tokenJson.access_token,
            refresh_token: tokenJson.refresh_token ?? null,
            expires_at: expiresAt,
            raw: rawProfile as Record<string, unknown> | null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,provider" },
        );

        if (upsertErr) {
          console.error("Linked account upsert failed", upsertErr);
          return finish("/me?tiktok=error&reason=link_failed");
        }

        // 5) Redirect back
        const back = stateRow.redirect_to || "/me";
        const sep = back.includes("?") ? "&" : "?";
        return finish(`${back}${sep}tiktok=connected`);
      },
    },
  },
});
