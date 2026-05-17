/**
 * Server-only helpers for refreshing venue media (photos + socials).
 * - Photos via Google Places Photo (existing GOOGLE_PLACES_API_KEY).
 * - Social profile discovery via Firecrawl search.
 */
import Firecrawl from "@mendable/firecrawl-js";

const PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY;

export type GalleryItem = {
  url: string;
  source: "google_places" | "manual";
  attribution?: string | null;
};

export type DiscoveredSocials = {
  tiktok_url: string | null;
  tiktok_handle: string | null;
  instagram_url: string | null;
  instagram_handle: string | null;
};

function requirePlacesKey(): string {
  if (!PLACES_KEY) throw new Error("GOOGLE_PLACES_API_KEY is not configured");
  return PLACES_KEY;
}

/** Find Place From Text — returns a place_id or null. */
export async function findPlaceId(
  name: string,
  city?: string | null,
): Promise<string | null> {
  const key = requirePlacesKey();
  const query = [name, city].filter(Boolean).join(" ");
  const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id&key=${key}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = (await res.json()) as { candidates?: Array<{ place_id?: string }> };
  return json.candidates?.[0]?.place_id ?? null;
}

/** Fetch up to maxN photos from Google Place Details and resolve their CDN URLs. */
export async function fetchPlacePhotos(
  placeId: string,
  maxN = 8,
): Promise<GalleryItem[]> {
  const key = requirePlacesKey();
  const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=photos&key=${key}`;
  const dr = await fetch(detailsUrl);
  if (!dr.ok) return [];
  const details = (await dr.json()) as {
    result?: {
      photos?: Array<{ photo_reference: string; html_attributions?: string[] }>;
    };
  };
  const photos = details.result?.photos?.slice(0, maxN) ?? [];

  // Resolve each photo to a stable CDN URL by following the redirect from the
  // photo endpoint. The resolved URL changes periodically (signed) but stays
  // valid for weeks — perfect for a monthly refresh cadence.
  const items: GalleryItem[] = [];
  for (const p of photos) {
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1600&photo_reference=${encodeURIComponent(p.photo_reference)}&key=${key}`;
    try {
      const r = await fetch(photoUrl, { redirect: "manual" });
      const finalUrl = r.headers.get("location") || photoUrl;
      items.push({
        url: finalUrl,
        source: "google_places",
        attribution: p.html_attributions?.[0]?.replace(/<[^>]+>/g, "") ?? null,
      });
    } catch {
      // skip individual photo failures
    }
  }
  return items;
}

function extractHandle(url: string, host: "tiktok" | "instagram"): string | null {
  try {
    const u = new URL(url);
    if (host === "tiktok") {
      // /@handle or /@handle/video/... or /handle
      const m = u.pathname.match(/\/@([A-Za-z0-9_.]+)/);
      if (m) return m[1].toLowerCase();
    } else {
      // /handle or /handle/
      const m = u.pathname.match(/^\/([A-Za-z0-9_.]+)\/?$/);
      if (m && !["p", "reel", "reels", "tv", "explore", "stories"].includes(m[1].toLowerCase())) {
        return m[1].toLowerCase();
      }
    }
  } catch {
    // fall through
  }
  return null;
}

function canonicalSocial(url: string, host: "tiktok" | "instagram"): string | null {
  const handle = extractHandle(url, host);
  if (!handle) return null;
  return host === "tiktok"
    ? `https://www.tiktok.com/@${handle}`
    : `https://www.instagram.com/${handle}/`;
}

/** Search TikTok + Instagram for a venue's official profile via Firecrawl. */
export async function discoverSocials(
  name: string,
  city?: string | null,
  website?: string | null,
): Promise<DiscoveredSocials> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    console.warn("[venue-media] FIRECRAWL_API_KEY missing — skipping social discovery");
    return { tiktok_url: null, tiktok_handle: null, instagram_url: null, instagram_handle: null };
  }

  const firecrawl = new Firecrawl({ apiKey });
  const venuePart = [name, city].filter(Boolean).join(" ");

  async function searchOne(host: "tiktok" | "instagram"): Promise<{ url: string; handle: string } | null> {
    const domain = host === "tiktok" ? "tiktok.com" : "instagram.com";
    const query = `site:${domain} ${venuePart}`;
    try {
      const result = (await firecrawl.search(query, { limit: 5 })) as unknown as {
        web?: Array<{ url: string }>;
        data?: Array<{ url: string }>;
      };
      const hits = result.web ?? result.data ?? [];
      for (const hit of hits) {
        const canonical = canonicalSocial(hit.url, host);
        const handle = canonical && extractHandle(canonical, host);
        if (canonical && handle) return { url: canonical, handle };
      }
    } catch (e) {
      console.warn(`[venue-media] firecrawl ${host} search failed:`, e instanceof Error ? e.message : e);
    }
    return null;
  }

  // Also check the venue website if we have one — it sometimes already links to socials
  // (skipped for now to keep credits tight; search results are usually enough).
  void website;

  const [tt, ig] = await Promise.all([searchOne("tiktok"), searchOne("instagram")]);
  return {
    tiktok_url: tt?.url ?? null,
    tiktok_handle: tt?.handle ?? null,
    instagram_url: ig?.url ?? null,
    instagram_handle: ig?.handle ?? null,
  };
}
