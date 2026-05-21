// ============================================================
// AuthService — Handles login, signup, social auth, username resolution
// ============================================================

import { serve } from "../_shared/server.ts";
import { supabaseAdmin, supabaseForUser, corsHeaders, jsonResponse, errorResponse } from "../_shared/supabase-client.ts";
import { consumeRateLimit, callerIdentity } from "../_shared/ratelimit.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders() });

  const url = new URL(req.url);
  const action = url.pathname.split("/").pop();

  // Rate limit every auth-service action by IP (5/min) — slows brute force
  // on resolve-login and prevents login-flood abuse.
  const allowed = await consumeRateLimit({
    scope: `auth-service:${action ?? "unknown"}`,
    identity: callerIdentity(req),
    burst: 5,
    refillPerSec: 5 / 60,
  });
  if (!allowed) return errorResponse("Too many requests", 429);

  try {
    switch (action) {
      case "resolve-login": {
        // Resolve username or email → email for Supabase Auth
        const { identifier } = await req.json();
        if (typeof identifier !== "string" || identifier.length === 0 || identifier.length > 254) {
          return errorResponse("identifier must be a 1-254 char string");
        }
        const { data, error } = await supabaseAdmin.rpc("resolve_login_identifier", {
          login_identifier: identifier,
        });
        if (error) return errorResponse("Lookup failed");
        return jsonResponse({ email: data });
      }

      case "social-link": {
        // Link a social provider (Instagram, TikTok, etc.) to profile
        const authHeader = req.headers.get("Authorization")!;
        const sb = supabaseForUser(authHeader);
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return errorResponse("Unauthorized", 401);

        const { provider, provider_user_id, provider_email, metadata } = await req.json();

        const { data, error } = await sb
          .from("profile_social_links")
          .upsert({
            user_id: user.id,
            provider,
            provider_user_id,
            provider_email,
            metadata: metadata || {},
            last_used_at: new Date().toISOString(),
          }, { onConflict: "user_id,provider" })
          .select()
          .single();

        if (error) return errorResponse(error.message);
        return jsonResponse(data);
      }

      case "update-last-login": {
        const authHeader = req.headers.get("Authorization")!;
        const sb = supabaseForUser(authHeader);
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return errorResponse("Unauthorized", 401);

        await supabaseAdmin
          .from("profiles")
          .update({ last_login_at: new Date().toISOString() })
          .eq("id", user.id);

        return jsonResponse({ ok: true });
      }

      default:
        return errorResponse("Unknown action", 404);
    }
  } catch (err) {
    return errorResponse(err.message, 500);
  }
});
