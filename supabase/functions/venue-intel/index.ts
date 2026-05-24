// ============================================================
// venue-intel — Claude-powered on-demand venue enrichment.
// Called by the client when a boarding-pass stop has no enriched
// data. Returns structured venue intelligence (address, price,
// dress code, signature dish, crowd, phone, best for, wait time).
// ============================================================

import { serve } from "../_shared/server.ts";
import { corsHeaders, jsonResponse, errorResponse } from "../_shared/supabase-client.ts";

// ─── Types ────────────────────────────────────────────────────

interface RequestBody {
  venue_name: string;
  venue_type?: string;
  area?: string;
  city: string;
}

interface VenueIntelResponse {
  venue_name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  price_level: string | null;
  dress_code: string | null;
  signature: string | null;
  crowd: string | null;
  phone: string | null;
  best_for: string | null;
  wait_time: string | null;
  parking: string | null;
  photo: string | null;
  rating: number | null;
}

// ─── Handler ──────────────────────────────────────────────────

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  // Parse body
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const { venue_name, venue_type, area, city } = body;
  if (!venue_name || !city) {
    return errorResponse("venue_name and city are required", 400);
  }

  // Get Anthropic key from env
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!anthropicKey) {
    console.error("[venue-intel] ANTHROPIC_API_KEY not set");
    return errorResponse("Service misconfigured", 500);
  }

  // ─── Call Claude for venue intelligence ─────────────────────

  const systemPrompt = `You are a hyper-local venue intelligence assistant for a lifestyle concierge app called Confetti.
Given a venue name, type, area, and city, return detailed real-world information about the venue.

IMPORTANT RULES:
- Only return information you are confident about. Use null for any field you're unsure of.
- price_level must be one of: "$", "$$", "$$$", "$$$$"
- dress_code should be short (e.g., "Smart casual", "Come as you are", "Upscale")
- signature should be the venue's most famous dish, drink, or experience
- crowd should describe the typical clientele in 5-10 words
- best_for should be a short phrase (e.g., "Date night", "Group celebrations", "Late-night vibes")
- wait_time should be typical wait (e.g., "10-15 min on weekends", "No wait", "Reservations recommended")
- parking should be a short concrete description of where to park (e.g., "Valet $25, street meters on Connecticut Ave", "Garage at 1234 K St NW (entrance on 14th)", "Lot behind the building, free after 6pm", "Street parking only — meters until 10pm"). Include nearby garages, valet pricing if known, and any Sunday/weekend specifics. Null if you don't know.
- rating should be 1-5 scale (can be decimal like 4.3)
- phone should be formatted as (XXX) XXX-XXXX if US, or international format otherwise
- Return ONLY valid JSON matching the schema below. No markdown, no explanation.`;

  const userPrompt = `Venue: "${venue_name}"
Type: ${venue_type || "unknown"}
Area/Neighborhood: ${area || "unknown"}
City: ${city}

Return a JSON object with these fields:
{
  "venue_name": "string (canonical name)",
  "address": "string or null",
  "lat": number or null,
  "lng": number or null,
  "price_level": "$ | $$ | $$$ | $$$$ or null",
  "dress_code": "string or null",
  "signature": "string or null",
  "crowd": "string or null",
  "phone": "string or null",
  "best_for": "string or null",
  "wait_time": "string or null",
  "parking": "string or null",
  "photo": null,
  "rating": number or null
}`;

  try {
    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 600,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!claudeRes.ok) {
      const errText = await claudeRes.text();
      console.error(`[venue-intel] Claude API error ${claudeRes.status}:`, errText);
      return errorResponse("AI lookup failed", 502);
    }

    const claudeData = await claudeRes.json();
    const rawText = claudeData?.content?.[0]?.text ?? "";

    // Parse the JSON from Claude's response
    // Strip any markdown code fences if present
    const jsonStr = rawText
      .replace(/^```json?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let venueData: VenueIntelResponse;
    try {
      venueData = JSON.parse(jsonStr);
    } catch {
      console.error("[venue-intel] Failed to parse Claude response:", rawText);
      return errorResponse("AI returned invalid data", 502);
    }

    // Validate and sanitize
    const result: VenueIntelResponse = {
      venue_name: venueData.venue_name || venue_name,
      address: venueData.address || null,
      lat: typeof venueData.lat === "number" ? venueData.lat : null,
      lng: typeof venueData.lng === "number" ? venueData.lng : null,
      price_level: venueData.price_level || null,
      dress_code: venueData.dress_code || null,
      signature: venueData.signature || null,
      crowd: venueData.crowd || null,
      phone: venueData.phone || null,
      best_for: venueData.best_for || null,
      wait_time: venueData.wait_time || null,
      parking: venueData.parking || null,
      photo: venueData.photo || null,
      rating: typeof venueData.rating === "number" ? venueData.rating : null,
    };

    return jsonResponse(result);
  } catch (err) {
    console.error("[venue-intel] Unexpected error:", err);
    return errorResponse("Internal error", 500);
  }
});
