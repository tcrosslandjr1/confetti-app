// Geofence Processor Edge Function
// Receives passenger location pings, detects proximity to booked venues,
// fires arrival notifications and pre-order triggers.

import { serve } from "../_shared/server.ts";
import {
  supabaseAdmin,
  supabaseForUser,
  corsHeaders,
  jsonResponse,
  errorResponse,
} from "../_shared/supabase-client.ts";

// ─── Haversine distance (meters) ───
function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6_371_000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  // Auth — passenger must be authenticated
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return errorResponse("Missing authorization", 401);

  const userClient = supabaseForUser(authHeader);
  const {
    data: { user },
    error: authErr,
  } = await userClient.auth.getUser();
  if (authErr || !user) return errorResponse("Unauthorized", 401);

  // Parse body
  const body = await req.json().catch(() => null);
  if (!body || typeof body.lat !== "number" || typeof body.lng !== "number") {
    return errorResponse("lat and lng are required numbers");
  }

  const { lat, lng, accuracy_meters, heading, speed } = body;
  const userId = user.id;

  // 1. Store the location ping
  await supabaseAdmin.from("passenger_locations").insert({
    user_id: userId,
    lat,
    lng,
    accuracy_meters: accuracy_meters ?? null,
    heading: heading ?? null,
    speed: speed ?? null,
  });

  // 2. Find upcoming/confirmed bookings for this passenger
  const now = new Date().toISOString();
  const windowEnd = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(); // 4h ahead

  const { data: bookings } = await supabaseAdmin
    .from("bookings")
    .select("id, venue_id, booking_time, status, special_requests")
    .eq("user_id", userId)
    .in("status", ["upcoming", "confirmed"])
    .gte("booking_time", now)
    .lte("booking_time", windowEnd);

  if (!bookings || bookings.length === 0) {
    return jsonResponse({ triggered: [] });
  }

  // 3. Get geofences for those venues
  const venueIds = [...new Set(bookings.map((b) => b.venue_id))];
  const { data: geofences } = await supabaseAdmin
    .from("venue_geofences")
    .select("*")
    .in("venue_id", venueIds);

  if (!geofences || geofences.length === 0) {
    return jsonResponse({ triggered: [] });
  }

  // Build lookup
  const geoByVenue = new Map(geofences.map((g) => [g.venue_id, g]));

  // 4. Check each booking against geofence
  const triggered: Array<{
    booking_id: string;
    venue_id: string;
    trigger_type: string;
    distance_meters: number;
  }> = [];

  for (const booking of bookings) {
    const geo = geoByVenue.get(booking.venue_id);
    if (!geo) continue;

    const distance = haversineMeters(lat, lng, geo.lat, geo.lng);

    // Determine trigger type
    let triggerType: "approaching" | "arrived" | null = null;
    if (distance <= geo.arrival_radius_meters && geo.notify_on_arrival) {
      triggerType = "arrived";
    } else if (distance <= geo.pre_order_radius_meters) {
      triggerType = "approaching";
    }

    if (!triggerType) continue;

    // 5. Deduplication — check if we already fired this trigger for this booking today
    const today = new Date().toISOString().slice(0, 10);
    const { data: existing } = await supabaseAdmin
      .from("passenger_arrivals")
      .select("id")
      .eq("user_id", userId)
      .eq("booking_id", booking.id)
      .eq("trigger_type", triggerType)
      .gte("created_at", `${today}T00:00:00Z`)
      .limit(1);

    if (existing && existing.length > 0) continue; // already triggered

    // 6. Insert arrival record
    await supabaseAdmin.from("passenger_arrivals").insert({
      user_id: userId,
      venue_id: booking.venue_id,
      booking_id: booking.id,
      trigger_type: triggerType,
      distance_meters: Math.round(distance),
      notified_venue: true,
      pre_order_sent: triggerType === "arrived" && geo.fire_pre_order,
    });

    // 7. Create venue notification
    if (triggerType === "approaching") {
      await supabaseAdmin.from("venue_notifications").insert({
        venue_id: booking.venue_id,
        type: "passenger_arriving",
        title: "Passenger approaching",
        body: `A passenger with a booking is ~${Math.round(distance)}m away and heading your way.`,
        metadata: { distance_meters: Math.round(distance), booking_id: booking.id },
        booking_id: booking.id,
        passenger_id: userId,
      });
    } else if (triggerType === "arrived") {
      await supabaseAdmin.from("venue_notifications").insert({
        venue_id: booking.venue_id,
        type: "passenger_arrived",
        title: "Passenger arrived",
        body: `Your guest has arrived! Booking ${booking.id.slice(0, 8)}...`,
        metadata: { distance_meters: Math.round(distance), booking_id: booking.id },
        booking_id: booking.id,
        passenger_id: userId,
      });

      // 8. Fire pre-order: check booking_pre_orders table for pending orders
      if (geo.fire_pre_order) {
        const { data: preOrders } = await supabaseAdmin
          .from("booking_pre_orders")
          .select(
            "id, total_cents, notes, pre_order_items(quantity, price_cents, special_instructions, menu_item:venue_menu_items(name))"
          )
          .eq("booking_id", booking.id)
          .eq("status", "pending");

        if (preOrders && preOrders.length > 0) {
          // Mark pre-orders as "sent"
          const preOrderIds = preOrders.map((po: any) => po.id);
          await supabaseAdmin
            .from("booking_pre_orders")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .in("id", preOrderIds);

          // Build summary for notification
          const itemSummary = preOrders
            .flatMap((po: any) =>
              (po.pre_order_items ?? []).map(
                (i: any) => `${i.quantity}x ${i.menu_item?.name ?? "item"}`
              )
            )
            .join(", ");

          const totalCents = preOrders.reduce(
            (s: number, po: any) => s + (po.total_cents ?? 0),
            0
          );

          await supabaseAdmin.from("venue_notifications").insert({
            venue_id: booking.venue_id,
            type: "pre_order_fired",
            title: "Pre-order ready to prepare",
            body: `Guest arriving — prepare: ${itemSummary || "pre-order items"} ($${(totalCents / 100).toFixed(2)})`,
            metadata: {
              booking_id: booking.id,
              pre_order_ids: preOrderIds,
              total_cents: totalCents,
              items: itemSummary,
            },
            booking_id: booking.id,
            passenger_id: userId,
          });
        } else if (booking.special_requests) {
          // Fallback: legacy special_requests field
          await supabaseAdmin.from("venue_notifications").insert({
            venue_id: booking.venue_id,
            type: "pre_order_fired",
            title: "Pre-order incoming",
            body: `Guest pre-order: ${booking.special_requests}`,
            metadata: {
              booking_id: booking.id,
              pre_order_details: booking.special_requests,
            },
            booking_id: booking.id,
            passenger_id: userId,
          });
        }
      }
    }

    triggered.push({
      booking_id: booking.id,
      venue_id: booking.venue_id,
      trigger_type: triggerType,
      distance_meters: Math.round(distance),
    });
  }

  return jsonResponse({ triggered });
});
