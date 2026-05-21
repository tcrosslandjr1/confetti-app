// ============================================================
// PlanService — Itinerary CRUD, trip plans, chat, group invites
// ============================================================

import { serve } from "../_shared/server.ts";
import { supabaseAdmin, supabaseForUser, corsHeaders, jsonResponse, errorResponse } from "../_shared/supabase-client.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders() });

  const url = new URL(req.url);
  const action = url.pathname.split("/").pop();

  try {
    switch (action) {
      // ── Itineraries ──────────────────────────────────────
      case "list": {
        const authHeader = req.headers.get("Authorization")!;
        const sb = supabaseForUser(authHeader);
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return errorResponse("Unauthorized", 401);

        const { data, error } = await sb
          .from("itineraries")
          .select("*, itinerary_stops(*, venues(id, name, neighborhood, hero_image_url))")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);
        if (error) return errorResponse(error.message);
        return jsonResponse(data);
      }

      case "get": {
        const authHeader = req.headers.get("Authorization")!;
        const sb = supabaseForUser(authHeader);
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return errorResponse("Unauthorized", 401);

        const { itinerary_id } = await req.json();
        const { data, error } = await sb
          .from("itineraries")
          .select("*, itinerary_stops(*, venues(*))")
          .eq("id", itinerary_id)
          .single();
        if (error) return errorResponse(error.message);
        return jsonResponse(data);
      }

      case "save": {
        const authHeader = req.headers.get("Authorization")!;
        const sb = supabaseForUser(authHeader);
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return errorResponse("Unauthorized", 401);

        const body = await req.json();

        // Create itinerary
        const { data: itinerary, error: itErr } = await sb
          .from("itineraries")
          .insert({
            user_id: user.id,
            title: body.title,
            occasion: body.occasion,
            total_estimated_cost: body.total_estimated_cost || 0,
            total_duration_minutes: body.total_duration_minutes || 0,
            status: "saved",
          })
          .select()
          .single();
        if (itErr) return errorResponse(itErr.message);

        // Create stops
        if (body.stops?.length) {
          const stops = body.stops.map((s: any, i: number) => ({
            itinerary_id: itinerary.id,
            venue_id: s.venue_id,
            stop_order: i + 1,
            starts_at: s.starts_at || s.arrival_time,
            duration_minutes: s.duration_minutes,
            travel_to_next_minutes: s.travel_to_next_minutes || 0,
            dress_code: s.dress_code || s.role,
            vibe_match: s.vibe_match || s.notes || s.why,
          }));
          await sb.from("itinerary_stops").insert(stops);
        }

        return jsonResponse(itinerary);
      }

      case "delete": {
        const authHeader = req.headers.get("Authorization")!;
        const sb = supabaseForUser(authHeader);
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return errorResponse("Unauthorized", 401);

        const { itinerary_id } = await req.json();
        await sb.from("itinerary_stops").delete().eq("itinerary_id", itinerary_id);
        const { error } = await sb.from("itineraries").delete().eq("id", itinerary_id).eq("user_id", user.id);
        if (error) return errorResponse(error.message);
        return jsonResponse({ deleted: true });
      }

      // ── Trip Plans (AI-generated) ────────────────────────
      case "trip-plans": {
        const authHeader = req.headers.get("Authorization")!;
        const sb = supabaseForUser(authHeader);
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return errorResponse("Unauthorized", 401);

        const { data, error } = await sb
          .from("trip_plans")
          .select("*, trip_stops(*, venues(id, name, neighborhood, hero_image_url))")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);
        if (error) return errorResponse(error.message);
        return jsonResponse(data);
      }

      // ── Chat Messages ────────────────────────────────────
      case "chat-history": {
        const authHeader = req.headers.get("Authorization")!;
        const sb = supabaseForUser(authHeader);
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return errorResponse("Unauthorized", 401);

        const body = await req.json();
        const { data, error } = await sb
          .from("chat_messages")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true })
          .limit(body.limit || 50);
        if (error) return errorResponse(error.message);
        return jsonResponse(data);
      }

      // ── Group Invites (Party Room) ───────────────────────
      case "invite-group": {
        const authHeader = req.headers.get("Authorization")!;
        const sb = supabaseForUser(authHeader);
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return errorResponse("Unauthorized", 401);

        const { itinerary_id } = await req.json();
        const invite = {
          itinerary_id,
          owner_id: user.id,
          invite_token: crypto.randomUUID(),
          expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
        };

        const { data, error } = await sb
          .from("group_invites")
          .insert(invite)
          .select()
          .single();
        if (error) return errorResponse(error.message);
        return jsonResponse(data);
      }

      case "accept-invite": {
        const { invite_token } = await req.json();
        const { data: invite, error } = await supabaseAdmin
          .from("group_invites")
          .select("*")
          .eq("invite_token", invite_token)
          .gte("expires_at", new Date().toISOString())
          .single();
        if (error || !invite) return errorResponse("Invalid or expired invite link", 404);
        return jsonResponse(invite);
      }

      default:
        return errorResponse("Unknown action", 404);
    }
  } catch (err) {
    return errorResponse(err.message, 500);
  }
});
