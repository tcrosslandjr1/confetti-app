// Google Places lookup — returns live rating, price_level, open_now per venue.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Query = { venue: string; address?: string; neighborhood?: string };
type Body = { queries: Query[] };

type PlaceResult = {
  venue: string;
  placeId?: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: number; // 0..4
  openNow?: boolean;
  businessStatus?: string;
  found: boolean;
};

const PRICE_MAP: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

async function lookup(q: Query, key: string): Promise<PlaceResult> {
  const text = [q.venue, q.address, q.neighborhood].filter(Boolean).join(" ");
  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask":
          "places.id,places.rating,places.userRatingCount,places.priceLevel,places.currentOpeningHours.openNow,places.businessStatus",
      },
      body: JSON.stringify({ textQuery: text, pageSize: 1 }),
    });
    if (!res.ok) return { venue: q.venue, found: false };
    const data = await res.json();
    const p = data.places?.[0];
    if (!p) return { venue: q.venue, found: false };
    return {
      venue: q.venue,
      placeId: p.id,
      rating: typeof p.rating === "number" ? p.rating : undefined,
      userRatingCount: p.userRatingCount,
      priceLevel: p.priceLevel ? PRICE_MAP[p.priceLevel] : undefined,
      openNow: p.currentOpeningHours?.openNow,
      businessStatus: p.businessStatus,
      found: true,
    };
  } catch {
    return { venue: q.venue, found: false };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const key = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!key) return json({ error: "missing GOOGLE_PLACES_API_KEY" }, 500);
    const body = (await req.json()) as Body;
    if (!body?.queries?.length) return json({ results: [] });
    const results = await Promise.all(body.queries.slice(0, 12).map((q) => lookup(q, key)));
    return json({ results });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}
