// Google Places lookup — returns live rating, price_level, open_now, photos, address per venue.
import { getCorsHeaders } from "../_shared/cors.ts";

type Query = { venue: string; address?: string; neighborhood?: string };
type Body = { queries: Query[] };

type PlaceResult = {
  venue: string;
  placeId?: string;
  displayName?: string;
  formattedAddress?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: number; // 0..4
  openNow?: boolean;
  businessStatus?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  photos?: string[]; // direct CDN URIs (short-lived)
  found: boolean;
};

const PRICE_MAP: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

async function resolvePhoto(name: string, key: string, maxHeightPx = 600): Promise<string | null> {
  try {
    const url = `https://places.googleapis.com/v1/${name}/media?maxHeightPx=${maxHeightPx}&skipHttpRedirect=true&key=${key}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    return json.photoUri ?? null;
  } catch {
    return null;
  }
}

async function lookup(q: Query, key: string): Promise<PlaceResult> {
  const text = [q.venue, q.address, q.neighborhood].filter(Boolean).join(" ");
  const attempts = [
    text,
    [q.venue, q.address, q.neighborhood, "Washington DC"].filter(Boolean).join(" "),
  ];
  try {
    let p;
    for (const textQuery of attempts) {
      const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": key,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.currentOpeningHours.openNow,places.businessStatus,places.websiteUri,places.googleMapsUri,places.photos",
        },
        body: JSON.stringify({ textQuery, pageSize: 1 }),
      });
      if (!res.ok) continue;
      const data = await res.json();
      p = data.places?.[0];
      if (p) break;
    }
    if (!p) return { venue: q.venue, found: false };

    const photoNames: string[] = (p.photos ?? [])
      .slice(0, 3)
      .map((ph: { name: string }) => ph.name)
      .filter(Boolean);
    const photos = (await Promise.all(photoNames.map((n) => resolvePhoto(n, key)))).filter(
      (u): u is string => !!u,
    );

    return {
      venue: q.venue,
      placeId: p.id,
      displayName: p.displayName?.text,
      formattedAddress: p.formattedAddress,
      latitude: typeof p.location?.latitude === "number" ? p.location.latitude : undefined,
      longitude: typeof p.location?.longitude === "number" ? p.location.longitude : undefined,
      rating: typeof p.rating === "number" ? p.rating : undefined,
      userRatingCount: p.userRatingCount,
      priceLevel: p.priceLevel ? PRICE_MAP[p.priceLevel] : undefined,
      openNow: p.currentOpeningHours?.openNow,
      businessStatus: p.businessStatus,
      websiteUri: p.websiteUri,
      googleMapsUri: p.googleMapsUri,
      photos,
      found: true,
    };
  } catch {
    return { venue: q.venue, found: false };
  }
}

async function diagnose(key: string | undefined) {
  const checks: Array<{ name: string; ok: boolean; detail: string }> = [];
  if (!key) {
    return {
      ok: false,
      keyPresent: false,
      keyMasked: null,
      checks: [
        {
          name: "Secret configured",
          ok: false,
          detail: "GOOGLE_PLACES_API_KEY is not set in Lovable Cloud secrets.",
        },
      ],
      remediation:
        "Open Lovable Cloud → Secrets and add GOOGLE_PLACES_API_KEY (server-side key with Places API (New) enabled).",
    };
  }
  const masked = `${key.slice(0, 6)}…${key.slice(-4)} (len ${key.length})`;
  checks.push({ name: "Secret configured", ok: true, detail: masked });

  // Live test against Places API (New) searchText.
  let ok = false;
  let remediation: string | undefined;
  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress",
      },
      body: JSON.stringify({ textQuery: "Maydan Washington DC", pageSize: 1 }),
    });
    const text = await res.text();
    let parsed: any = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      /* keep raw */
    }
    if (res.ok) {
      const sample = parsed?.places?.[0];
      checks.push({
        name: "Places API (New) reachable",
        ok: true,
        detail: sample
          ? `HTTP 200 · "${sample.displayName?.text ?? sample.id}"`
          : `HTTP 200 · empty result`,
      });
      ok = true;
    } else {
      const code = parsed?.error?.status ?? `HTTP ${res.status}`;
      const msg = parsed?.error?.message ?? text.slice(0, 200);
      checks.push({ name: "Places API (New) reachable", ok: false, detail: `${code} — ${msg}` });
      if (/API_KEY_INVALID|API key not valid/i.test(msg)) {
        remediation =
          "Key rejected. Create a server-side key with Application restrictions = None and API restrictions including 'Places API (New)'.";
      } else if (/referer|referrer|HTTP referer/i.test(msg)) {
        remediation =
          "Browser-restricted key detected. Server calls need an unrestricted (or IP-restricted) key.";
      } else if (/SERVICE_DISABLED|has not been used|disabled/i.test(msg)) {
        remediation =
          "Enable 'Places API (New)' in Google Cloud Console → APIs & Services → Library.";
      } else if (/billing/i.test(msg)) {
        remediation = "Enable billing on the Google Cloud project linked to this key.";
      } else if (/quota|RESOURCE_EXHAUSTED/i.test(msg)) {
        remediation = "Quota exceeded. Increase quota or wait for the daily reset.";
      }
    }
  } catch (e) {
    checks.push({
      name: "Places API (New) reachable",
      ok: false,
      detail: `Network error: ${(e as Error).message}`,
    });
  }
  return { ok, keyPresent: true, keyMasked: masked, checks, remediation };
}

async function autocomplete(
  input: string,
  key: string,
  opts: { sessionToken?: string; types?: string[]; country?: string } = {},
) {
  if (!input || input.trim().length < 2) return { suggestions: [] };
  const body: Record<string, unknown> = {
    input,
    ...(opts.sessionToken ? { sessionToken: opts.sessionToken } : {}),
    ...(opts.types?.length ? { includedPrimaryTypes: opts.types } : {}),
    ...(opts.country ? { includedRegionCodes: [opts.country.toLowerCase()] } : {}),
  };
  const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    return { suggestions: [], error: `HTTP ${res.status}: ${text.slice(0, 200)}` };
  }
  const data = await res.json();
  const suggestions = (data.suggestions ?? [])
    .map((s: any) => s.placePrediction)
    .filter(Boolean)
    .map((p: any) => ({
      placeId: p.placeId,
      primaryText: p.structuredFormat?.mainText?.text ?? p.text?.text ?? "",
      secondaryText: p.structuredFormat?.secondaryText?.text ?? "",
      fullText: p.text?.text ?? "",
      types: p.types ?? [],
    }));
  return { suggestions };
}

async function placeDetails(placeId: string, key: string, sessionToken?: string) {
  const url = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`);
  if (sessionToken) url.searchParams.set("sessionToken", sessionToken);
  const res = await fetch(url.toString(), {
    headers: {
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask":
        "id,displayName,formattedAddress,location,addressComponents,websiteUri,googleMapsUri,internationalPhoneNumber,types",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    return { error: `HTTP ${res.status}: ${text.slice(0, 200)}` };
  }
  const p = await res.json();
  const findComp = (type: string) =>
    p.addressComponents?.find((c: any) => c.types?.includes(type))?.longText ?? null;
  return {
    placeId: p.id,
    name: p.displayName?.text ?? null,
    formattedAddress: p.formattedAddress ?? null,
    latitude: p.location?.latitude ?? null,
    longitude: p.location?.longitude ?? null,
    city: findComp("locality") ?? findComp("postal_town") ?? null,
    state: findComp("administrative_area_level_1"),
    country: findComp("country"),
    postalCode: findComp("postal_code"),
    neighborhood: findComp("neighborhood") ?? findComp("sublocality_level_1"),
    websiteUri: p.websiteUri ?? null,
    googleMapsUri: p.googleMapsUri ?? null,
    phone: p.internationalPhoneNumber ?? null,
    types: p.types ?? [],
  };
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const key = Deno.env.get("GOOGLE_PLACES_API_KEY");
    const body = (await req.json().catch(() => ({}))) as Body & {
      diag?: boolean;
      autocomplete?: { input: string; sessionToken?: string; types?: string[]; country?: string };
      details?: { placeId: string; sessionToken?: string };
    };
    if (body?.diag) return json(await diagnose(key), 200, cors);
    if (!key) return json({ error: "missing GOOGLE_PLACES_API_KEY" }, 500, cors);
    if (body?.autocomplete?.input !== undefined) {
      return json(await autocomplete(body.autocomplete.input, key, body.autocomplete), 200, cors);
    }
    if (body?.details?.placeId) {
      return json(await placeDetails(body.details.placeId, key, body.details.sessionToken), 200, cors);
    }
    if (!body?.queries?.length) return json({ results: [] }, 200, cors);
    const results = await Promise.all(body.queries.slice(0, 12).map((q) => lookup(q, key)));
    return json({ results }, 200, cors);
  } catch (e) {
    return json({ error: (e as Error).message }, 500, cors);
  }
});

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}
