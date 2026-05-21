// ============================================================
// ContentService — Reels, favorites, check-ins, passport stamps
// ============================================================

import { serve } from "../_shared/server.ts";
import { supabaseAdmin, supabaseForUser, corsHeaders, jsonResponse, errorResponse } from "../_shared/supabase-client.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders() });

  const url = new URL(req.url);
  const action = url.pathname.split("/").pop();

  try {
    switch (action) {
      // ── Reels ────────────────────────────────────────────
      case "feed": {
        const body = await req.json();
        let query = supabaseAdmin
          .from("reels")
          .select("*, venues(id, name, neighborhood, city)")
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(body.limit || 20);

        if (body.city) query = query.eq("venues.city", body.city);
        if (body.vibe) query = query.eq("vibe", body.vibe);
        if (body.offset) query = query.range(body.offset, body.offset + (body.limit || 20) - 1);

        const { data, error } = await query;
        if (error) return errorResponse(error.message);
        return jsonResponse(data);
      }

      case "upload-reel": {
        const authHeader = req.headers.get("Authorization")!;
        const sb = supabaseForUser(authHeader);
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return errorResponse("Unauthorized", 401);

        const reel = await req.json();
        const { data, error } = await sb
          .from("reels")
          .insert({
            venue_id: reel.venue_id,
            uploaded_by: user.id,
            url: reel.url,
            thumbnail_url: reel.thumbnail_url,
            platform: reel.platform || "confetti",
            tags: reel.tags || [],
            vibe: reel.vibe,
            status: "active",
          })
          .select()
          .single();
        if (error) return errorResponse(error.message);
        return jsonResponse(data);
      }

      case "interact-reel": {
        const authHeader = req.headers.get("Authorization")!;
        const sb = supabaseForUser(authHeader);
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return errorResponse("Unauthorized", 401);

        const { reel_id, interaction } = await req.json(); // interaction: "view" | "like"
        const field = interaction === "like" ? "like_count" : "view_count";

        const { data: reel } = await supabaseAdmin
          .from("reels")
          .select(field)
          .eq("id", reel_id)
          .single();

        if (reel) {
          await supabaseAdmin
            .from("reels")
            .update({ [field]: (reel as any)[field] + 1 })
            .eq("id", reel_id);
        }
        return jsonResponse({ ok: true });
      }

      // ── Favorites ────────────────────────────────────────
      case "favorites": {
        const authHeader = req.headers.get("Authorization")!;
        const sb = supabaseForUser(authHeader);
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return errorResponse("Unauthorized", 401);

        const { data, error } = await sb
          .from("favorites")
          .select("*, venues(id, name, category, neighborhood, hero_image_url, average_rating)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (error) return errorResponse(error.message);
        return jsonResponse(data);
      }

      case "toggle-favorite": {
        const authHeader = req.headers.get("Authorization")!;
        const sb = supabaseForUser(authHeader);
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return errorResponse("Unauthorized", 401);

        const { venue_id } = await req.json();

        // Check if already favorited
        const { data: existing } = await sb
          .from("favorites")
          .select("id")
          .eq("user_id", user.id)
          .eq("venue_id", venue_id)
          .maybeSingle();

        if (existing) {
          await sb.from("favorites").delete().eq("id", existing.id);
          return jsonResponse({ favorited: false });
        } else {
          await sb.from("favorites").insert({ user_id: user.id, venue_id });
          return jsonResponse({ favorited: true });
        }
      }

      // ── Check-ins ────────────────────────────────────────
      case "checkin": {
        const authHeader = req.headers.get("Authorization")!;
        const sb = supabaseForUser(authHeader);
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return errorResponse("Unauthorized", 401);

        const { venue_id, lat, lng } = await req.json();

        const { data, error } = await sb
          .from("user_checkins")
          .insert({
            user_id: user.id,
            venue_id,
            method: "manual",
            lat: lat || 0,
            lng: lng || 0,
            verified_at: new Date().toISOString(),
            confetti_earned: 10,
          })
          .select()
          .single();
        if (error) return errorResponse(error.message);

        // Auto-create passport stamp
        await sb.from("passport_stamps").insert({
          user_id: user.id,
          venue_id,
          stamp_type: "checkin",
        });

        return jsonResponse({ checkin: data, stamp_earned: true });
      }

      // ── Passport Stamps ──────────────────────────────────
      case "stamps": {
        const authHeader = req.headers.get("Authorization")!;
        const sb = supabaseForUser(authHeader);
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return errorResponse("Unauthorized", 401);

        const { data, error } = await sb
          .from("passport_stamps")
          .select("*, venues(id, name, neighborhood, city)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (error) return errorResponse(error.message);
        return jsonResponse(data);
      }

      // ── Achievements ─────────────────────────────────────
      case "achievements": {
        const authHeader = req.headers.get("Authorization")!;
        const sb = supabaseForUser(authHeader);
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return errorResponse("Unauthorized", 401);

        const { data, error } = await sb
          .from("achievements")
          .select("*")
          .eq("user_id", user.id)
          .order("unlocked_at", { ascending: false });
        if (error) return errorResponse(error.message);
        return jsonResponse(data);
      }

      default:
        return errorResponse("Unknown action", 404);
    }
  } catch (err) {
    return errorResponse(err.message, 500);
  }
});
