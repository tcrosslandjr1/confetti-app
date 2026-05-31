// ============================================================
// get-venues-by-outing — Outing-based venue discovery
//
// Returns social_venue_signals filtered by Confetti outing
// category, sorted by engagement_score descending.
//
// GET /get-venues-by-outing?city_slug=dc&outing=Girls+Night&limit=20
//
// Query params:
//   city_slug  — required, e.g. "dc", "baltimore"
//   outing     — required, e.g. "Girls Night", "Jazz Night"
//   limit      — optional, default 20, max 50
//   category   — optional, filter by venue category too
//                e.g. "Jazz" to narrow Girls Night to jazz venues
// ============================================================

import { serve } from "../_shared/server.ts";
import {
  supabaseAdmin,
  corsHeaders,
  jsonResponse,
  errorResponse,
} from "../_shared/supabase-client.ts";

// All valid Confetti outing categories (95 total, 10 groups)
const VALID_OUTINGS = new Set([
  // Social Outings
  "Girls Night","Guys Night","Couples Night","Double Date","Group Night Out",
  "Solo Night Out","In-Laws Night","Family Night","Coworker Night","Best Friends Night",
  "Reunion Night","Birthday Night","Anniversary Night","Bachelorette Party",
  "Bachelor Party","Graduation Night","Going-Away Night","Welcome-Back Night",
  // Party & Nightlife
  "Turn-Up Night","Club Night","Lounge Night","Rooftop Night","Bar Hop",
  "Dive Bar Crawl","Day Party","Pool Party","Yacht Day Party","Casino Night",
  "Strip Club Night","Bottle Service Night","After-Hours Night",
  // Chill & Low-Key
  "Chill Night","Wine Night","Brewery Night","Coffee Night","Dessert Night",
  "Picnic Night","Movie Night","Board Game Night","Scenic Walk Night",
  "Sunset Night","Waterfront Chill Night",
  // Food & Drink
  "Dinner Night","Tapas Night","Brunch Night","Food Truck Night","Fine Dining Night",
  "Tasting Menu Night","Seafood Night","Steakhouse Night","Sushi Night",
  "Pizza Night","BBQ Night","Happy Hour",
  // Culture & Arts
  "Museum Night","Art District Night","Gallery Night","Theater Night",
  "Comedy Show Night","Jazz Night","Live Music Night","Poetry Night",
  "Cultural Festival Night",
  // Adventure & Outdoors
  "Adventure Night","Hiking Night","Jet Ski Night","Boat Cruise Night",
  "Kayak/Paddle Night","Zipline Night","Go-Kart Night","Arcade Night",
  "Sports Game Night","Mini Golf Night","Bowling Night",
  // Luxury & Soft-Life
  "Soft Life Night","Luxury Dinner Night","Yacht Sunset Night","Spa Night",
  "Chauffeur Night","VIP Night","Penthouse Night",
  // Wellness & Self-Care
  "Spa & Sauna Night","Yoga Night","Meditation Night","Wellness Night",
  "Sound Bath Night",
  // Shopping & Experience
  "Shopping Night","Thrifting Night","Mall Night","Market Night","Pop-Up Event Night",
  // Custom / User-Defined
  "Custom Vibe Night","Build-Your-Own Night","Surprise Me Night",
  "Mystery Night","Hybrid Night",
]);

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }

  const url    = new URL(req.url);
  const city   = url.searchParams.get("city_slug");
  const outing = url.searchParams.get("outing");
  const limit  = Math.min(parseInt(url.searchParams.get("limit") ?? "20"), 50);
  const catFilter = url.searchParams.get("category");

  if (!city)   return errorResponse("city_slug is required", 400);
  if (!outing) return errorResponse("outing is required", 400);

  if (!VALID_OUTINGS.has(outing)) {
    return errorResponse(
      `Unknown outing: "${outing}". See /get-venues-by-outing/outings for full list.`,
      400,
    );
  }

  // Build query — outing must be in the venue's outing_tags array
  let query = supabaseAdmin
    .from("social_venue_signals")
    .select("venue_name, venue_slug, category, signal_type, platform, engagement_score, sentiment, snippet, neighborhood, hashtags, outing_tags, collected_at")
    .eq("city_slug", city)
    .eq("is_active", true)
    .contains("outing_tags", [outing])
    .order("engagement_score", { ascending: false })
    .limit(limit);

  if (catFilter) {
    query = query.eq("category", catFilter);
  }

  const { data, error } = await query;

  if (error) {
    return errorResponse(`Query failed: ${error.message}`, 500);
  }

  // Deduplicate by venue_slug (keep highest engagement_score)
  const seen = new Map<string, typeof data[0]>();
  for (const row of data ?? []) {
    const existing = seen.get(row.venue_slug);
    if (!existing || row.engagement_score > existing.engagement_score) {
      seen.set(row.venue_slug, row);
    }
  }
  const venues = Array.from(seen.values());

  return jsonResponse({
    ok:        true,
    city_slug: city,
    outing,
    count:     venues.length,
    venues,
  });
});
