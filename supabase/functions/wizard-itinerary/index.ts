// Dynamic itinerary builder — uses Google Places Search to return 3 real venues
// near the user's coordinates that match the selected vibes + budget. Works in any
// city/region worldwide (not limited to DMV).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Body = {
  vibes?: string[];
  budget?: string | null; // "$" | "$$" | "$$$" | "$$$$"
  lat?: number | null;
  lng?: number | null;
  city?: string | null; // optional fallback when no coords
  count?: number; // default 3
  // Alternatives mode — when set, returns up to `limit` candidates
  // for a single vibe (or free-text query), excluding `excludeIds`.
  mode?: "itinerary" | "alternatives";
  vibe?: string | null; // vibe key for alternatives mode
  query?: string | null; // free-text query fallback (e.g. "rooftop bar")
  excludeIds?: string[];
  limit?: number; // alternatives mode page size, default 6
};

// Map vibe key → Google Places text query + included place types + a default time slot.
const VIBE_RECIPES: Record<
  string,
  { query: string; types: string[]; time: string; vibeLabel: string; tone: string }
> = {
  rooftop: {
    query: "rooftop bar",
    types: ["bar"],
    time: "7:00 PM",
    vibeLabel: "Rooftop views",
    tone: "bg-coral",
  },
  dance: {
    query: "dance club nightclub",
    types: ["night_club"],
    time: "10:30 PM",
    vibeLabel: "Dance floor",
    tone: "bg-purple",
  },
  speakeasy: {
    query: "speakeasy cocktail bar",
    types: ["bar"],
    time: "8:30 PM",
    vibeLabel: "Speakeasy",
    tone: "bg-gold",
  },
  live: {
    query: "live music venue",
    types: ["bar", "night_club"],
    time: "8:00 PM",
    vibeLabel: "Live music",
    tone: "bg-pink-300",
  },
  bougie: {
    query: "fine dining tasting menu restaurant",
    types: ["restaurant"],
    time: "6:30 PM",
    vibeLabel: "Bougie dinner",
    tone: "bg-emerald-400",
  },
  dive: {
    query: "dive bar",
    types: ["bar"],
    time: "9:00 PM",
    vibeLabel: "Dive bar",
    tone: "bg-amber-300",
  },
  late: {
    query: "late night food restaurant open late",
    types: ["restaurant"],
    time: "11:30 PM",
    vibeLabel: "Late night eats",
    tone: "bg-sky-300",
  },
};

const DEFAULT_VIBES = ["bougie", "speakeasy", "rooftop"];
const PRICE_MAP: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};
function budgetToMaxLevel(b?: string | null): number {
  if (!b) return 4;
  return Math.min(4, Math.max(1, b.length));
}

async function resolvePhoto(name: string, key: string): Promise<string | null> {
  try {
    const url = `https://places.googleapis.com/v1/${name}/media?maxHeightPx=600&skipHttpRedirect=true&key=${key}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    return json.photoUri ?? null;
  } catch {
    return null;
  }
}

async function searchCandidates(
  recipe: { query: string; types: string[] } | { query: string; types: string[] },
  body: Body,
  excludeIds: Set<string>,
  key: string,
  pageSize = 8,
) {
  const reqBody: Record<string, unknown> = {
    textQuery: body.city ? `${recipe.query} in ${body.city}` : recipe.query,
    pageSize,
    includedType: recipe.types[0],
  };
  if (typeof body.lat === "number" && typeof body.lng === "number") {
    reqBody.locationBias = {
      circle: {
        center: { latitude: body.lat, longitude: body.lng },
        radius: 25000, // 25km — covers metro area
      },
    };
  }
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.businessStatus,places.types,places.shortFormattedAddress,places.googleMapsUri,places.websiteUri,places.photos",
    },
    body: JSON.stringify(reqBody),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    console.error("[wizard-itinerary] places API error", res.status, txt);
    return [];
  }
  const data = await res.json();
  const places = (data.places ?? []) as Array<{
    id: string;
    displayName?: { text?: string };
    formattedAddress?: string;
    shortFormattedAddress?: string;
    location?: { latitude?: number; longitude?: number };
    rating?: number;
    userRatingCount?: number;
    priceLevel?: string;
    businessStatus?: string;
    photos?: Array<{ name: string }>;
  }>;
  const maxLevel = budgetToMaxLevel(body.budget);
  return places
    .filter((p) => !excludeIds.has(p.id))
    .filter((p) => !p.businessStatus || p.businessStatus === "OPERATIONAL")
    .filter((p) => {
      const lvl = p.priceLevel ? PRICE_MAP[p.priceLevel] : null;
      return lvl == null || lvl <= maxLevel;
    })
    .sort((a, b) => {
      const ar = (a.rating ?? 0) * Math.log10((a.userRatingCount ?? 0) + 10);
      const br = (b.rating ?? 0) * Math.log10((b.userRatingCount ?? 0) + 10);
      return br - ar;
    });
}

async function shapeCandidate(
  pick: {
    id: string;
    displayName?: { text?: string };
    formattedAddress?: string;
    shortFormattedAddress?: string;
    location?: { latitude?: number; longitude?: number };
    rating?: number;
    userRatingCount?: number;
    priceLevel?: string;
    photos?: Array<{ name: string }>;
  },
  key: string,
) {
  const photoName = pick.photos?.[0]?.name;
  const photo = photoName ? await resolvePhoto(photoName, key) : null;
  const addr = pick.shortFormattedAddress ?? pick.formattedAddress ?? "";
  const parts = addr.split(",").map((s) => s.trim()).filter(Boolean);
  const neighborhood = parts.length >= 2 ? parts[parts.length - 2] : undefined;
  return {
    id: pick.id,
    venue: pick.displayName?.text ?? "Unknown",
    address: pick.formattedAddress,
    neighborhood,
    rating: pick.rating,
    userRatingCount: pick.userRatingCount,
    priceLevel: pick.priceLevel ? PRICE_MAP[pick.priceLevel] : null,
    photo,
    lat: pick.location?.latitude,
    lng: pick.location?.longitude,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const key = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!key) return json({ error: "missing GOOGLE_PLACES_API_KEY" }, 500);
    const body = (await req.json()) as Body;

    // ---- Alternatives mode: return multiple candidates for a single vibe/query
    if (body.mode === "alternatives") {
      const exclude = new Set(body.excludeIds ?? []);
      const limit = Math.max(1, Math.min(body.limit ?? 6, 10));
      const recipe = body.vibe && VIBE_RECIPES[body.vibe]
        ? VIBE_RECIPES[body.vibe]
        : {
            query: body.query || "restaurant bar",
            types: ["restaurant"],
            time: "8:00 PM",
            vibeLabel: body.query || "Pick",
            tone: "bg-coral",
          };
      const raw = await searchCandidates(recipe, body, exclude, key, Math.max(limit + 2, 8));
      const shaped = await Promise.all(raw.slice(0, limit).map((p) => shapeCandidate(p, key)));
      return json({
        candidates: shaped.map((s) => ({
          ...s,
          vibeKey: body.vibe ?? null,
          vibeLabel: recipe.vibeLabel,
          tone: recipe.tone,
          time: recipe.time,
        })),
      });
    }

    // ---- Default: build a 3-stop itinerary
    const requestedVibes = (body.vibes ?? []).filter((v) => VIBE_RECIPES[v]);
    const vibeKeys = (requestedVibes.length ? requestedVibes : DEFAULT_VIBES).slice(0, 3);
    const count = Math.max(1, Math.min(body.count ?? 3, 4));
    while (vibeKeys.length < count) {
      const fill = DEFAULT_VIBES.find((v) => !vibeKeys.includes(v));
      if (!fill) break;
      vibeKeys.push(fill);
    }

    const seen = new Set<string>();
    const stops: Array<Record<string, unknown>> = [];
    for (const vibeKey of vibeKeys) {
      const recipe = VIBE_RECIPES[vibeKey];
      const candidates = await searchCandidates(recipe, body, seen, key);
      const pick = candidates[0];
      if (!pick) continue;
      const result = await shapeCandidate(pick, key);
      seen.add(result.id);
      stops.push({
        time: recipe.time,
        venue: result.venue,
        vibe: recipe.vibeLabel,
        tone: recipe.tone,
        address: result.address,
        neighborhood: result.neighborhood,
        rating: result.rating,
        userRatingCount: result.userRatingCount,
        priceLevel: result.priceLevel,
        photo: result.photo,
        lat: result.lat,
        lng: result.lng,
        placeId: result.id,
        vibeKey,
      });
    }
    return json({ stops });
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
