// ============================================================
// UserService — Profile CRUD, taste profiles, preferences, subscriptions
// ============================================================

import { serve } from "../_shared/server.ts";
import {
  supabaseForUser,
  corsHeaders,
  jsonResponse,
  errorResponse,
} from "../_shared/supabase-client.ts";
import {
  ValidationError,
  parseJson,
  pickKeys,
  requireString,
  requireObject,
  requireEnum,
  optionalString,
  optionalUuid,
} from "../_shared/validate.ts";

// Whitelist of user-controllable preference keys. Anything else (user_id,
// role, admin, internal flags) is silently dropped.
const PREFERENCE_KEYS = [
  "notification_email",
  "notification_push",
  "marketing_opt_in",
  "default_city",
  "default_radius_meters",
  "favorite_cuisines",
  "dietary_restrictions",
  "accessibility_needs",
  "preferred_price_tier",
] as const;

const EVENT_TYPES = [
  "venue_view",
  "venue_save",
  "venue_unsave",
  "plan_created",
  "plan_completed",
  "boarding_pass_added",
  "checkin",
  "search",
  "chat_message",
] as const;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders() });

  const url = new URL(req.url);
  const action = url.pathname.split("/").pop();
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return errorResponse("Unauthorized", 401);
  const sb = supabaseForUser(authHeader);
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return errorResponse("Unauthorized", 401);

  try {
    switch (action) {
      // ── Profile ──────────────────────────────────────────
      case "get-profile": {
        const { data, error } = await sb
          .from("profiles")
          .select("*, user_preferences(*)")
          .eq("id", user.id)
          .single();
        if (error) return errorResponse("Lookup failed");
        return jsonResponse(data);
      }

      case "update-profile": {
        const body = await parseJson(req);
        const filtered = pickKeys(body, ["full_name", "avatar_url", "username"]);
        if (filtered.full_name !== undefined) {
          filtered.full_name = requireString(filtered.full_name, "full_name", { min: 1, max: 120 });
        }
        if (filtered.username !== undefined) {
          filtered.username = requireString(filtered.username, "username", {
            min: 3, max: 24, pattern: /^[A-Za-z0-9_]+$/,
          });
        }
        if (filtered.avatar_url !== undefined) {
          filtered.avatar_url = optionalString(filtered.avatar_url, "avatar_url", { max: 1024 });
        }
        (filtered as Record<string, unknown>).updated_at = new Date().toISOString();

        const { data, error } = await sb
          .from("profiles")
          .update(filtered)
          .eq("id", user.id)
          .select()
          .single();
        if (error) return errorResponse("Update failed");
        return jsonResponse(data);
      }

      // ── Taste Profile ────────────────────────────────────
      case "get-taste-profile": {
        const { data, error } = await sb
          .from("taste_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();
        if (error && error.code !== "PGRST116") return errorResponse("Lookup failed");
        return jsonResponse(
          data || { cuisine_scores: {}, vibe_scores: {}, neighborhood_scores: {}, price_preference: {} },
        );
      }

      case "update-taste-profile": {
        const body = await parseJson(req);
        // Each scores object is a free-form record of category → number. We
        // validate the wrapper shape but trust the inner values (they're
        // computed by client agents).
        const tasteFields = pickKeys(body, [
          "cuisine_scores",
          "vibe_scores",
          "neighborhood_scores",
          "price_affinity",
        ]);
        for (const [k, v] of Object.entries(tasteFields)) {
          if (v !== undefined) requireObject(v, k);
        }

        const { data, error } = await sb
          .from("taste_profiles")
          .upsert(
            {
              user_id: user.id,
              ...tasteFields,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          )
          .select()
          .single();
        if (error) return errorResponse("Update failed");
        return jsonResponse(data);
      }

      // ── Preferences (key-whitelisted) ────────────────────
      case "update-preferences": {
        const body = await parseJson(req);
        const safe = pickKeys(body, PREFERENCE_KEYS);
        // user_id is always forced to the JWT-derived ID — never accept it
        // from the client.
        const row = {
          ...safe,
          user_id: user.id,
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await sb
          .from("user_preferences")
          .upsert(row, { onConflict: "user_id" })
          .select()
          .single();
        if (error) return errorResponse("Update failed");
        return jsonResponse(data);
      }

      // ── Subscription ─────────────────────────────────────
      case "get-subscription": {
        const { data, error } = await sb
          .from("user_subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        if (error) return errorResponse("Lookup failed");
        return jsonResponse(data || { tier: "free", confetti_balance: 0 });
      }

      case "upgrade-subscription": {
        // TODO(Phase 3.1): gate behind a verified Stripe webhook event.
        // For now, restrict the upgrade to admins only so the endpoint isn't
        // a free upgrade lever for any authenticated user.
        const { data: isAdminResult } = await sb.rpc("is_admin");
        if (isAdminResult !== true) return errorResponse("Forbidden", 403);

        const body = await parseJson(req);
        const tier = requireEnum(body.tier, "tier", ["black_monthly", "black_annual"] as const);

        const { data, error } = await sb
          .from("user_subscriptions")
          .upsert(
            {
              user_id: user.id,
              tier,
              plan_limit: tier === "black_annual" ? 999 : 20,
            },
            { onConflict: "user_id" },
          )
          .select()
          .single();
        if (error) return errorResponse("Update failed");
        return jsonResponse(data);
      }

      // ── Behavior Events ──────────────────────────────────
      case "log-event": {
        const body = await parseJson(req);
        const eventType = requireEnum(body.event_type, "event_type", EVENT_TYPES);
        const venueId = optionalUuid(body.venue_id, "venue_id");
        const metadata = body.metadata !== undefined ? requireObject(body.metadata, "metadata") : {};

        const { data, error } = await sb
          .from("user_behavior_events")
          .insert({
            user_id: user.id,
            event_type: eventType,
            venue_id: venueId ?? null,
            metadata,
          })
          .select()
          .single();
        if (error) return errorResponse("Log failed");
        return jsonResponse(data);
      }

      // ── Social Links ─────────────────────────────────────
      case "get-social-links": {
        const { data, error } = await sb
          .from("profile_social_links")
          .select("*")
          .eq("user_id", user.id);
        if (error) return errorResponse("Lookup failed");
        return jsonResponse(data);
      }

      default:
        return errorResponse("Unknown action", 404);
    }
  } catch (err) {
    if (err instanceof ValidationError) return errorResponse(err.message, 400);
    console.error("[user-service] unexpected error:", err);
    return errorResponse("Internal error", 500);
  }
});
