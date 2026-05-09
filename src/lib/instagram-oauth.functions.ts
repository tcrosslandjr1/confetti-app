import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getRequestHost } from "@tanstack/react-start/server";
import { z } from "zod";

/**
 * Instagram (Instagram Login API) — start the OAuth flow.
 *
 * Uses the "Instagram API with Instagram Login" flow (no Facebook Page link
 * required) — works for Business and Creator accounts.
 * Docs: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login
 *
 * Mints a one-time `state` row tied to the currently signed-in user so the
 * callback can link the Instagram identity to the right account.
 */
export const startInstagramLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        redirectTo: z.string().max(500).optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const clientId = process.env.INSTAGRAM_CLIENT_ID;
    if (!clientId) {
      throw new Error(
        "Instagram is not configured yet. Add INSTAGRAM_CLIENT_ID and INSTAGRAM_CLIENT_SECRET in Lovable Cloud secrets.",
      );
    }

    const url = process.env.SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const stateBytes = crypto.getRandomValues(new Uint8Array(24));
    const state = Array.from(stateBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const { error: insErr } = await admin.from("instagram_oauth_states").insert({
      state,
      user_id: context.userId,
      redirect_to: data.redirectTo ?? "/me",
    });
    if (insErr) throw new Error(`Could not start Instagram flow: ${insErr.message}`);

    const host = getRequestHost();
    const proto = host?.includes("localhost") ? "http" : "https";
    const redirectUri = `${proto}://${host}/api/public/instagram/callback`;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      // Read-only scopes; add more once Meta approves them in app review.
      scope: "instagram_business_basic",
      state,
    });

    return {
      url: `https://www.instagram.com/oauth/authorize?${params.toString()}`,
    };
  });

/**
 * Disconnect a linked Instagram account for the current user.
 */
export const disconnectInstagram = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("linked_social_accounts")
      .delete()
      .eq("user_id", context.userId)
      .eq("provider", "instagram");
    if (error) throw new Error(error.message);
    return { ok: true };
  });
