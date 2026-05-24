// ============================================================
// Eventbrite Events — Fetch & cache live events from Eventbrite API v3
// Supports: search by location/category, sync to cache table,
//           and single-event lookup.
// ============================================================

import { serve } from "../_shared/server.ts";
import { supabaseAdmin, corsHeaders, jsonResponse, errorResponse } from "../_shared/supabase-client.ts";

const EVENTBRITE_BASE = "https://www.eventbriteapi.com/v3";

// Map Confetti categories → Eventbrite category IDs
// https://www.eventbrite.com/platform/api#/reference/categories
const CATEGORY_MAP: Record<string, string[]> = {
  Music:    ["103"],         // Music
  Food:     ["110"],         // Food & Drink
  Arts:     ["105"],         // Performing & Visual Arts
  Sports:   ["108"],         // Sports & Fitness
  Wellness: ["107"],         // Health & Wellness
  Tech:     ["102"],         // Science & Technology
};

// Confetti cities → Eventbrite location strings + coords
const CITY_COORDS: Record<string, { query: string; lat: number; lng: number }> = {
  "Brooklyn, NY":        { query: "Brooklyn, NY",        lat: 40.6782, lng: -73.9442 },
  "San Francisco, CA":   { query: "San Francisco, CA",   lat: 37.7749, lng: -122.4194 },
  "Austin, TX":          { query: "Austin, TX",          lat: 30.2672, lng: -97.7431 },
  "Chicago, IL":         { query: "Chicago, IL",         lat: 41.8781, lng: -87.6298 },
  "Boulder, CO":         { query: "Boulder, CO",         lat: 40.0150, lng: -105.2705 },
  "Los Angeles, CA":     { query: "Los Angeles, CA",     lat: 34.0522, lng: -118.2437 },
  "Washington, DC":      { query: "Washington, DC",      lat: 38.9072, lng: -77.0369 },
  "Miami, FL":           { query: "Miami, FL",           lat: 25.7617, lng: -80.1918 },
  "New York, NY":        { query: "New York, NY",        lat: 40.7128, lng: -74.0060 },
  "Atlanta, GA":         { query: "Atlanta, GA",         lat: 33.7490, lng: -84.3880 },
};

type SearchBody = {
  city?: string;
  lat?: number;
  lng?: number;
  category?: string;
  q?: string;
  radius?: string;     // e.g. "10mi" or "25km"
  limit?: number;       // max events to return (default 20)
  page?: number;
  sort_by?: string;     // "date" | "best" | "distance"
};

// ── Eventbrite API helpers ──────────────────────────────────

async function ebFetch(path: string, token: string) {
  const res = await fetch(`${EVENTBRITE_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Eventbrite ${res.status}: ${errText}`);
  }
  return res.json();
}

async function searchEvents(params: SearchBody, token: string) {
  const searchParams = new URLSearchParams();

  // Location — prefer lat/lng, fall back to city text
  if (params.lat && params.lng) {
    searchParams.set("location.latitude", String(params.lat));
    searchParams.set("location.longitude", String(params.lng));
    searchParams.set("location.within", params.radius || "25mi");
  } else if (params.city) {
    const known = CITY_COORDS[params.city];
    if (known) {
      searchParams.set("location.latitude", String(known.lat));
      searchParams.set("location.longitude", String(known.lng));
      searchParams.set("location.within", params.radius || "25mi");
    } else {
      searchParams.set("location.address", params.city);
      searchParams.set("location.within", params.radius || "25mi");
    }
  }

  // Category filter
  if (params.category && CATEGORY_MAP[params.category]) {
    searchParams.set("categories", CATEGORY_MAP[params.category].join(","));
  }

  // Text search
  if (params.q) {
    searchParams.set("q", params.q);
  }

  // Sort & pagination
  searchParams.set("sort_by", params.sort_by || "date");
  searchParams.set("page", String(params.page || 1));
  searchParams.set("expand", "venue,organizer,ticket_availability");

  // Only future events
  searchParams.set("start_date.range_start", new Date().toISOString().split(".")[0] + "Z");

  const data = await ebFetch(`/events/search/?${searchParams.toString()}`, token);
  return data;
}

// ── Transform Eventbrite event → Confetti schema ────────────

function mapCategory(ebCategories: string[]): string {
  for (const [confettiCat, ebIds] of Object.entries(CATEGORY_MAP)) {
    if (ebCategories.some((id) => ebIds.includes(id))) return confettiCat;
  }
  return "Music"; // default
}

function transformEvent(ev: any): Record<string, unknown> {
  const venue = ev.venue || {};
  const organizer = ev.organizer || {};
  const ticket = ev.ticket_availability || {};

  const city = venue.address
    ? `${venue.address.city || ""}, ${venue.address.region || ""}`.replace(/, $/, "")
    : "Unknown";

  return {
    eventbrite_id: ev.id,
    title: ev.name?.text || "Untitled Event",
    category: ev.category_id ? mapCategory([ev.category_id]) : "Music",
    start_date: ev.start?.utc || new Date().toISOString(),
    end_date: ev.end?.utc || null,
    city,
    venue: venue.name || null,
    price: ticket.minimum_ticket_price?.major_value
      ? parseFloat(ticket.minimum_ticket_price.major_value)
      : 0,
    currency: ticket.minimum_ticket_price?.currency || "USD",
    image_url: ev.logo?.url || ev.logo?.original?.url || null,
    blurb: ev.summary || ev.description?.text?.substring(0, 280) || null,
    organizer: organizer.name || null,
    ticket_url: ev.url || null,
    lat: venue.latitude ? parseFloat(venue.latitude) : null,
    lng: venue.longitude ? parseFloat(venue.longitude) : null,
    capacity: ev.capacity || null,
    is_free: ev.is_free || false,
    status: ev.status || "live",
    raw_json: ev,
    last_synced: new Date().toISOString(),
  };
}

// ── Upsert events into cache ────────────────────────────────

async function upsertEvents(events: Record<string, unknown>[]) {
  if (!events.length) return { upserted: 0 };

  const { data, error } = await supabaseAdmin
    .from("eventbrite_events")
    .upsert(events, { onConflict: "eventbrite_id", ignoreDuplicates: false })
    .select("id");

  if (error) throw new Error(`Upsert failed: ${error.message}`);
  return { upserted: data?.length || 0 };
}

// ── Log sync run ────────────────────────────────────────────

async function logSync(
  city: string,
  category: string | null,
  found: number,
  upserted: number,
  error: string | null,
  startedAt: string,
) {
  await supabaseAdmin.from("eventbrite_sync_log").insert({
    city,
    category,
    events_found: found,
    events_upserted: upserted,
    error,
    started_at: startedAt,
    finished_at: new Date().toISOString(),
  });
}

// ── Handler ─────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const action = url.pathname.split("/").pop();
  const token = Deno.env.get("EVENTBRITE_PRIVATE_TOKEN");

  if (!token) {
    return errorResponse("EVENTBRITE_PRIVATE_TOKEN not configured", 500);
  }

  try {
    switch (action) {
      // ── Search: real-time pass-through + cache ──────────
      case "search": {
        const body: SearchBody = await req.json();
        const limit = Math.min(body.limit || 20, 50);

        const result = await searchEvents(body, token);
        const rawEvents = result.events || [];

        // Transform to Confetti schema
        const transformed = rawEvents.slice(0, limit).map(transformEvent);

        // Async cache — don't block response
        const startedAt = new Date().toISOString();
        upsertEvents(transformed)
          .then((r) =>
            logSync(body.city || "unknown", body.category || null, rawEvents.length, r.upserted, null, startedAt)
          )
          .catch((e) =>
            logSync(body.city || "unknown", body.category || null, rawEvents.length, 0, e.message, startedAt)
          );

        return jsonResponse({
          events: transformed,
          pagination: result.pagination || null,
          total: result.pagination?.object_count || rawEvents.length,
        });
      }

      // ── Sync: bulk sync for a city (cron job) ──────────
      case "sync": {
        const body = await req.json();
        const city = body.city || "Washington, DC";
        const categories = body.categories || Object.keys(CATEGORY_MAP);
        const startedAt = new Date().toISOString();
        let totalFound = 0;
        let totalUpserted = 0;

        for (const cat of categories) {
          try {
            const result = await searchEvents({ city, category: cat, limit: 50 }, token);
            const rawEvents = result.events || [];
            const transformed = rawEvents.map(transformEvent);
            const { upserted } = await upsertEvents(transformed);
            totalFound += rawEvents.length;
            totalUpserted += upserted;
          } catch (e) {
            console.error(`Sync error for ${city}/${cat}:`, e);
            await logSync(city, cat, 0, 0, (e as Error).message, startedAt);
          }
        }

        await logSync(city, null, totalFound, totalUpserted, null, startedAt);
        return jsonResponse({ city, totalFound, totalUpserted });
      }

      // ── Get single event by Eventbrite ID ──────────────
      case "get": {
        const { eventbrite_id } = await req.json();

        // Try cache first
        const { data: cached } = await supabaseAdmin
          .from("eventbrite_events")
          .select("*")
          .eq("eventbrite_id", eventbrite_id)
          .single();

        if (cached) return jsonResponse(cached);

        // Fallback: fetch from Eventbrite API
        const ev = await ebFetch(`/events/${eventbrite_id}/?expand=venue,organizer,ticket_availability`, token);
        const transformed = transformEvent(ev);
        await upsertEvents([transformed]);
        return jsonResponse(transformed);
      }

      // ── Cached: query local cache (no API call) ────────
      case "cached": {
        const body = await req.json();
        let query = supabaseAdmin
          .from("eventbrite_events")
          .select("*")
          .eq("status", "live")
          .gte("start_date", new Date().toISOString())
          .order("start_date", { ascending: true })
          .limit(body.limit || 30);

        if (body.city) query = query.eq("city", body.city);
        if (body.category) query = query.eq("category", body.category);
        if (body.q) query = query.or(`title.ilike.%${body.q}%,blurb.ilike.%${body.q}%`);

        const { data, error } = await query;
        if (error) return errorResponse(error.message);
        return jsonResponse({ events: data });
      }

      // ── Prune: remove old/past events from cache ───────
      case "prune": {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 7); // remove events ended 7+ days ago

        const { data, error } = await supabaseAdmin
          .from("eventbrite_events")
          .delete()
          .lt("start_date", cutoff.toISOString())
          .select("id");

        if (error) return errorResponse(error.message);
        return jsonResponse({ pruned: data?.length || 0 });
      }

      default:
        return errorResponse(`Unknown action: ${action}`, 404);
    }
  } catch (e) {
    console.error("eventbrite-events error:", e);
    return errorResponse((e as Error).message, 500);
  }
});
