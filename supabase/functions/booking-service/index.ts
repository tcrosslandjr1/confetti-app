// ============================================================
// BookingService — Reservation management, wallet passes
// ============================================================

import { serve } from "../_shared/server.ts";
import { supabaseAdmin, supabaseForUser, corsHeaders, jsonResponse, errorResponse } from "../_shared/supabase-client.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders() });

  const url = new URL(req.url);
  const action = url.pathname.split("/").pop();
  const authHeader = req.headers.get("Authorization")!;
  const sb = supabaseForUser(authHeader);
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return errorResponse("Unauthorized", 401);

  try {
    switch (action) {
      // ── Bookings ─────────────────────────────────────────
      case "create": {
        const body = await req.json();
        const { data, error } = await sb
          .from("bookings")
          .insert({
            user_id: user.id,
            venue_id: body.venue_id,
            itinerary_id: body.itinerary_id,
            booking_time: body.booking_time,
            party_size: body.party_size,
            special_requests: body.special_requests,
            status: "pending",
          })
          .select()
          .single();
        if (error) return errorResponse(error.message);
        return jsonResponse(data);
      }

      case "list": {
        const body = await req.json();
        let query = sb
          .from("bookings")
          .select("*, venues(id, name, neighborhood, city, hero_image_url, address)")
          .eq("user_id", user.id)
          .order("booking_time", { ascending: true });

        if (body.status) query = query.eq("status", body.status);
        if (body.upcoming) query = query.gte("booking_time", new Date().toISOString());

        const { data, error } = await query.limit(body.limit || 20);
        if (error) return errorResponse(error.message);
        return jsonResponse(data);
      }

      case "cancel": {
        const { booking_id } = await req.json();
        const { data, error } = await sb
          .from("bookings")
          .update({ status: "cancelled" })
          .eq("id", booking_id)
          .eq("user_id", user.id)
          .select()
          .single();
        if (error) return errorResponse(error.message);
        return jsonResponse(data);
      }

      case "confirm": {
        const { booking_id, confirmation_code } = await req.json();
        const { data, error } = await supabaseAdmin
          .from("bookings")
          .update({
            status: "confirmed",
            confirmation_code,
          })
          .eq("id", booking_id)
          .select()
          .single();
        if (error) return errorResponse(error.message);
        return jsonResponse(data);
      }

      // ── Wallet Passes ────────────────────────────────────
      case "create-pass": {
        const body = await req.json();
        const { data, error } = await sb
          .from("wallet_passes")
          .insert({
            user_id: user.id,
            platform: body.platform, // "apple" | "google"
            status: "active",
            serial_number: crypto.randomUUID(),
            barcode: crypto.randomUUID().replace(/-/g, "").toUpperCase(),
            barcode_format: body.barcode_format || "qr",
            tier: body.tier || "free",
            credit_balance: 0,
          })
          .select()
          .single();
        if (error) return errorResponse(error.message);
        return jsonResponse(data);
      }

      case "list-passes": {
        const { data, error } = await sb
          .from("wallet_passes")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "active")
          .order("created_at", { ascending: false });
        if (error) return errorResponse(error.message);
        return jsonResponse(data);
      }

      case "void-pass": {
        const { pass_id } = await req.json();
        const { data, error } = await sb
          .from("wallet_passes")
          .update({ status: "revoked" })
          .eq("id", pass_id)
          .eq("user_id", user.id)
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
