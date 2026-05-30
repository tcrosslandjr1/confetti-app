// Bootstraps venues for a city using real Google Places API (falls back to OSM).
// Replaces the Claude-based venue-discovery.ts for all plan flows.

import { supabaseAdmin } from "./supabase-client.ts";

const PRICE_MAP: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

function deriveTags(types: string[], name: string): { vibe_tags: string[]; cuisine_tags: string[] } {
  const t = types.map((x) => x.toLowerCase());
  const n = name.toLowerCase();
  const vibe: string[] = [];
  const cuisine: string[] = [];

  if (t.includes("night_club") || t.includes("nightclub")) { vibe.push("nightclub", "dance"); cuisine.push("Nightclub"); }
  if (t.includes("bar")) { vibe.push("cocktails"); cuisine.push("Bar"); }
  if (t.includes("fine_dining_restaurant")) { vibe.push("upscale", "fine-dining"); cuisine.push("Fine Dining"); }
  if (t.includes("restaurant")) { if (!cuisine.includes("Fine Dining")) cuisine.push("Restaurant"); }
  if (t.includes("cafe") || t.includes("coffee_shop")) { vibe.push("casual"); cuisine.push("Cafe"); }
  if (n.includes("rooftop")) vibe.push("rooftop", "outdoor");
  if (n.includes("speakeasy")) vibe.push("speakeasy", "cocktails");
  if (n.includes("lounge")) vibe.push("lounge");
  if (n.includes("brunch")) vibe.push("brunch");
  if (n.includes("brewery") || n.includes("brewing")) { vibe.push("casual"); cuisine.push("Brewery"); }

  return { vibe_tags: [...new Set(vibe)], cuisine_tags: [...new Set(cuisine)] };
}

interface PlaceResult {
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  types?: string[];
  primaryType?: string;
}

async function fetchFromGoogle(
  city: string,
  lat: number | null,
  lng: number | null,
  apiKey: string,
): Promise<PlaceResult[]> {
  const body: Record<string, unknown> = {
    textQuery: `restaurants bars nightlife in ${city}`,
    maxResultCount: 20,
  };
  if (typeof lat === "number" && typeof lng === "number") {
    body.locationBias = {
      circle: { center: { latitude: lat, longitude: lng }, radius: 8000 },
    };
  }
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": [
        "places.displayName", "places.formattedAddress", "places.location",
        "places.rating", "places.userRatingCount", "places.priceLevel",
        "places.types", "places.primaryType",
      ].join(","),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Google Places ${res.status}: ${await res.text().catch(() => "")}`);
  const data = await res.json();
  return (data.places ?? []) as PlaceResult[];
}

async function fetchFromOSM(lat: number, lng: number): Promise<PlaceResult[]> {
  const query = `[out:json][timeout:15];(nw["amenity"~"restaurant|bar|nightclub|cafe"](around:8000,${lat},${lng}););out center 20;`;
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!res.ok) throw new Error(`OSM ${res.status}`);
  const data = await res.json();
  return ((data.elements ?? []) as Array<Record<string, unknown>>)
    .filter((el) => (el.tags as Record<string, string>)?.name)
    .map((el) => {
      const tags = el.tags as Record<string, string>;
      const center = el.center as { lat: number; lon: number } | undefined;
      return {
        displayName: { text: tags.name },
        formattedAddress: [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ") || undefined,
        location: {
          latitude: center?.lat ?? (el.lat as number),
          longitude: center?.lon ?? (el.lon as number),
        },
        types: [tags.amenity ?? "restaurant"],
        primaryType: tags.amenity ?? "restaurant",
      };
    });
}

/**
 * Ensure a city has at least `minThreshold` venues in the venues table.
 * Uses Google Places API (with OSM fallback) — real data, no hallucinations.
 * Returns the number of rows inserted (0 if already populated or all sources fail).
 */
export async function ensureCityVenuesFromPlaces(
  city: string | null | undefined,
  lat: number | null | undefined,
  lng: number | null | undefined,
  minThreshold = 15,
): Promise<number> {
  if (!city) return 0;
  const trimmed = city.trim();
  if (!trimmed) return 0;

  const { count, error: countErr } = await supabaseAdmin
    .from("venues")
    .select("id", { count: "exact", head: true })
    .ilike("city", trimmed);
  if (countErr) return 0;
  if ((count ?? 0) >= minThreshold) return 0;

  let places: PlaceResult[] = [];
  const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");

  if (apiKey) {
    try {
      places = await fetchFromGoogle(trimmed, lat ?? null, lng ?? null, apiKey);
      console.log(`[places-discovery] Google returned ${places.length} places for ${trimmed}`);
    } catch (e) {
      console.warn("[places-discovery] Google failed, trying OSM:", (e as Error).message);
    }
  }

  if (places.length === 0 && typeof lat === "number" && typeof lng === "number") {
    try {
      places = await fetchFromOSM(lat, lng);
      console.log(`[places-discovery] OSM returned ${places.length} places for ${trimmed}`);
    } catch (e) {
      console.warn("[places-discovery] OSM also failed:", (e as Error).message);
    }
  }

  if (places.length === 0) return 0;

  const { data: existing } = await supabaseAdmin
    .from("venues")
    .select("slug")
    .ilike("city", trimmed);
  const knownSlugs = new Set(((existing ?? []) as { slug: string }[]).map((r) => r.slug));

  const rows = places
    .filter((p) => p.displayName?.text)
    .map((p) => {
      const name = p.displayName!.text;
      const { vibe_tags, cuisine_tags } = deriveTags(p.types ?? [], name);
      const priceNum = p.priceLevel ? (PRICE_MAP[p.priceLevel] ?? null) : null;
      return {
        id: crypto.randomUUID(),
        name,
        slug: slugify(name),
        city: trimmed,
        state: null as string | null,
        neighborhood: null as string | null,
        address: p.formattedAddress ?? null,
        lat: p.location?.latitude ?? null,
        lng: p.location?.longitude ?? null,
        cuisine: cuisine_tags[0] ?? null,
        cuisine_tags,
        vibe_tags,
        occasion_tags: [] as string[],
        price: priceNum ? "$".repeat(priceNum) : null,
        price_level: priceNum,
        rating: p.rating ?? null,
        rating_count: p.userRatingCount ?? null,
        photo_url: null as string | null,
        vibe_notes: null as string | null,
        popularity_score: p.rating
          ? p.rating * Math.log10((p.userRatingCount ?? 0) + 10)
          : 5,
        source_credit: "google-places",
        is_verified: true,
      };
    })
    .filter((r) => !knownSlugs.has(r.slug));

  if (rows.length === 0) return 0;

  const { data, error } = await supabaseAdmin.from("venues").insert(rows).select("id");
  if (error) {
    console.warn("[places-discovery] insert error:", error.message);
    return 0;
  }
  const inserted = (data ?? []).length;
  console.log(`[places-discovery] inserted ${inserted} venues for ${trimmed}`);
  return inserted;
}
