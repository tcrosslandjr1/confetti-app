// ============================================================
// EventService — Event CRUD, discovery, RSVP
// ============================================================

import { serve } from "../_shared/server.ts";
import { supabaseAdmin, supabaseForUser, corsHeaders, jsonResponse, errorResponse } from "../_shared/supabase-client.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders() });

  const url = new URL(req.url);
  const action = url.pathname.split("/").pop();

  try {
    switch (action) {
      // ── Public: Browse & Discover ────────────────────────
      case "upcoming": {
        const body = await req.json();
        let query = supabaseAdmin
          .from("events")
          .select("*, venues(id, name, neighborhood, city, hero_image_url)")
          .gte("start_time", new Date().toISOString())
          .order("start_time", { ascending: true })
          .limit(body.limit || 30);

        if (body.city) query = query.eq("venues.city", body.city);
        if (body.event_type) query = query.eq("event_type", body.event_type);
        if (body.venue_id) query = query.eq("venue_id", body.venue_id);

        const { data, error } = await query;
        if (error) return errorResponse(error.message);
        return jsonResponse(data);
      }

      case "get": {
        const { event_id } = await req.json();
        const { data, error } = await supabaseAdmin
          .from("events")
          .select("*, venues(id, name, neighborhood, city, address, hero_image_url)")
          .eq("id", event_id)
          .single();
        if (error) return errorResponse(error.message);
        return jsonResponse(data);
      }

      case "search": {
        const body = await req.json();
        let query = supabaseAdmin
          .from("events")
          .select("*, venues(id, name, neighborhood, city)")
          .gte("start_time", body.from || new Date().toISOString())
          .order("start_time", { ascending: true })
          .limit(body.limit || 30);

        if (body.to) query = query.lte("start_time", body.to);
        if (body.q) query = query.or(`title.ilike.%${body.q}%,description.ilike.%${body.q}%`);
        if (body.tags?.length) query = query.overlaps("tags", body.tags);

        const { data, error } = await query;
        if (error) return errorResponse(error.message);
        return jsonResponse(data);
      }

      // ── Authenticated: RSVP ──────────────────────────────
      case "rsvp": {
        const authHeader = req.headers.get("Authorization")!;
        const sb = supabaseForUser(authHeader);
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return errorResponse("Unauthorized", 401);

        const { event_id } = await req.json();

        // Increment RSVP count directly
        const { data: event } = await supabaseAdmin
          .from("events")
          .select("rsvp_count")
          .eq("id", event_id)
          .single();

        if (!event) return errorResponse("Event not found", 404);

        const { data, error } = await supabaseAdmin
          .from("events")
          .update({ rsvp_count: (event.rsvp_count || 0) + 1 })
          .eq("id", event_id)
          .select()
          .single();

        if (error) return errorResponse(error.message);
        return jsonResponse({ rsvped: true, data });
      }

      // ── Business: Event Management ───────────────────────
      case "create": {
        const authHeader = req.headers.get("Authorization")!;
        const sb = supabaseForUser(authHeader);
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return errorResponse("Unauthorized", 401);

        const event = await req.json();
        const { data, error } = await supabaseAdmin
          .from("events")
          .insert({
            ...event,
            created_by: user.id,
            rsvp_count: 0,
          })
          .select()
          .single();
        if (error) return errorResponse(error.message);
        return jsonResponse(data);
      }

      case "update": {
        const authHeader = req.headers.get("Authorization")!;
        const sb = supabaseForUser(authHeader);
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return errorResponse("Unauthorized", 401);

        const { event_id, ...updates } = await req.json();
        const { data, error } = await supabaseAdmin
          .from("events")
          .update(updates)
          .eq("id", event_id)
          .select()
          .single();
        if (error) return errorResponse(error.message);
        return jsonResponse(data);
      }

      case "publish": {
        const authHeader = req.headers.get("Authorization")!;
        const sb = supabaseForUser(authHeader);
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return errorResponse("Unauthorized", 401);

        const { event_id } = await req.json();
        // Events have no status column — just return the event
        const { data, error } = await supabaseAdmin
          .from("events")
          .select("*")
          .eq("id", event_id)
          .single();
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
