import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getRequestHost } from "@tanstack/react-start/server";
import { z } from "zod";

/**
 * TikTok Login Kit — start the OAuth flow.
 *
 * Returns the URL the browser should be sent to. We mint a one-time `state`
 * row tied to the currently signed-in user so the callback knows which
 * account to link the TikTok identity to.
 *
 * TikTok docs: https://developers.tiktok.com/doc/login-kit-web
 */
export const startTiktokLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        redirectTo: z.string().max(500).optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    if (!clientKey) {
      throw new Error(
        "TikTok is not configured yet. Add TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET in Lovable Cloud secrets.",
      );
    }

    const url = process.env.SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Random URL-safe state (no Buffer dep needed in Worker runtime)
    const stateBytes = crypto.getRandomValues(new Uint8Array(24));
    const state = Array.from(stateBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const { error: insErr } = await admin.from("tiktok_oauth_states").insert({
      state,
      user_id: context.userId,
      redirect_to: data.redirectTo ?? "/me",
    });
    if (insErr) throw new Error(`Could not start TikTok flow: ${insErr.message}`);

    // Determine callback origin from the incoming request so it matches the
    // domain the user is currently on (custom domain vs lovable.app).
    const host = getRequestHost();
    const proto = host?.includes("localhost") ? "http" : "https";
    const redirectUri = `${proto}://${host}/api/public/tiktok/callback`;

    const params = new URLSearchParams({
      client_key: clientKey,
      response_type: "code",
      scope: "user.info.basic,user.info.profile",
      redirect_uri: redirectUri,
      state,
    });

    return {
      url: `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`,
    };
  });

/**
 * Disconnect a linked TikTok account for the current user.
 * RLS allows a user to delete their own row; we still go through a server fn
 * so we can later revoke the TikTok token server-side.
 */
export const disconnectTiktok = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("linked_social_accounts")
      .delete()
      .eq("user_id", context.userId)
      .eq("provider", "tiktok");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Read the current user's linked accounts (without leaking tokens).
 */
export const getMyLinkedAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("linked_social_accounts")
      .select(
        "id, provider, provider_user_id, username, display_name, avatar_url, scope, created_at, updated_at",
      )
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { accounts: data ?? [] };
  });
