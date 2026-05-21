// ============================================================
// VenueService — Venue CRUD, search, trending, boost status
// ============================================================

import { serve } from "../_shared/server.ts";
import { supabaseAdmin, supabaseForUser, corsHeaders, jsonResponse, errorResponse } from "../_shared/supabase-client.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders() });

  const url = new URL(req.url);
  const action = url.pathname.split("/").pop();

  try {
    switch (action) {
      // ── Public: Search & Browse ──────────────────────────
      case "search": {
        const body = await req.json();
        let query = supabaseAdmin
          .from("venues")
          .select("id, name, category, neighborhood, city, price_tier, vibe_tags, cuisine_tags, average_rating, hero_image_url, address, latitude, longitude, subscription_tier, is_verified")
          .gte("average_rating", body.min_rating || 0)
          .limit(body.limit || 50);

        if (body.city) query = query.ilike("city", `%${body.city}%`);
        if (body.neighborhood) query = query.ilike("neighborhood", `%${body.neighborhood}%`);
        if (body.category) query = query.eq("category", body.category);
        if (body.price_tiers?.length) query = query.in("price_tier", body.price_tiers);
        if (body.corporate_friendly) query = query.eq("corporate_friendly", true);
        if (body.q) query = query.or(`name.ilike.%${body.q}%,description.ilike.%${body.q}%`);

        const { data, error } = await query.order("average_rating", { ascending: false });
        if (error) return errorResponse(error.message);
        return jsonResponse(data);
      }

      case "get": {
        const { venue_id } = await req.json();
        const { data, error } = await supabaseAdmin
          .from("venues")
          .select("*, venue_parking(*), venue_menu_highlights(*)")
          .eq("id", venue_id)
          .single();
        if (error) return errorResponse(error.message);

        // Attach active boosts and coupons
        const { data: boosts } = await supabaseAdmin
          .from("boost_campaigns")
          .select("id, boost_strength, start_date, end_date")
          .eq("venue_id", venue_id)
          .eq("status", "active");

        const { data: coupons } = await supabaseAdmin
          .from("coupons")
          .select("id, title, type, value, min_spend, terms")
          .eq("venue_id", venue_id)
          .eq("is_active", true);

        return jsonResponse({ ...data, active_boosts: boosts || [], active_coupons: coupons || [] });
      }

      // ── Trending ─────────────────────────────────────────
      case "trending": {
        const { city, limit } = await req.json();
        let query = supabaseAdmin
          .from("trending_venues")
          .select("*, venues(id, name, category, neighborhood, price_tier, hero_image_url, average_rating, vibe_tags)")
          .gte("expires_at", new Date().toISOString())
          .order("rank_in_city", { ascending: true })
          .limit(limit || 20);

        if (city) query = query.eq("city", city);

        const { data, error } = await query;
        if (error) return errorResponse(error.message);
        return jsonResponse(data);
      }

      // ── Authenticated: Venue Management (Business) ──────
      case "create": {
        const authHeader = req.headers.get("Authorization")!;
        const sb = supabaseForUser(authHeader);
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return errorResponse("Unauthorized", 401);

        const venue = await req.json();
        const { data, error } = await supabaseAdmin
          .from("venues")
          .insert({
            ...venue,
            created_at: new Date().toISOString(),
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

        const { venue_id, ...updates } = await req.json();
        updates.updated_at = new Date().toISOString();

        const { data, error } = await supabaseAdmin
          .from("venues")
          .update(updates)
          .eq("id", venue_id)
          .select()
          .single();
        if (error) return errorResponse(error.message);
        return jsonResponse(data);
      }

      // ── Reviews ──────────────────────────────────────────
      case "reviews": {
        const { venue_id, limit, offset } = await req.json();
        const { data, error } = await supabaseAdmin
          .from("reviews")
          .select("*, profiles(full_name, avatar_url)")
          .eq("venue_id", venue_id)
          .order("created_at", { ascending: false })
          .range(offset || 0, (offset || 0) + (limit || 20) - 1);
        if (error) return errorResponse(error.message);
        return jsonResponse(data);
      }

      case "add-review": {
        const authHeader = req.headers.get("Authorization")!;
        const sb = supabaseForUser(authHeader);
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return errorResponse("Unauthorized", 401);

        const review = await req.json();
        const { data, error } = await sb
          .from("reviews")
          .insert({
            user_id: user.id,
            venue_id: review.venue_id,
            rating: review.rating,
            body: review.body || review.comment,
            photo_urls: review.photo_urls || [],
          })
          .select()
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
