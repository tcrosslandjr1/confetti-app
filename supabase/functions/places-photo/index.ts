// ============================================================
// places-photo — Server-side proxy for Google Places photo media
// Usage: GET /places-photo?path=places/.../photos/...&w=600
// ============================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/supabase-client.ts";

const MAX_WIDTH = 1200;
const MIN_WIDTH = 100;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders() });

  const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
  if (!apiKey) return jsonResponse({ error: "GOOGLE_PLACES_API_KEY not configured" }, 500);

  const url = new URL(req.url);
  const path = url.searchParams.get("path");

  // Clamp width — without this, attackers can request arbitrarily large
  // images and run up Google Places billing per request.
  const requested = parseInt(url.searchParams.get("w") ?? "600", 10);
  const width = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, Number.isFinite(requested) ? requested : 600));

  if (!path || !/^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/.test(path)) {
    return jsonResponse({ error: "Invalid photo path" }, 400);
  }

  const upstream = await fetch(
    `https://places.googleapis.com/v1/${path}/media?key=${apiKey}&maxWidthPx=${width}`,
    { redirect: "follow" }
  );

  if (!upstream.ok) {
    return jsonResponse({ error: `Upstream ${upstream.status}` }, upstream.status);
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      ...corsHeaders(),
      "Content-Type": upstream.headers.get("Content-Type") ?? "image/jpeg",
      "Cache-Control": "public, max-age=86400",
    },
  });
});
