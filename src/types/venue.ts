import type { Tables } from "@/integrations/supabase/types";

/**
 * Canonical Venue shape used by VenueCard and venue UI components.
 * Maps from the snake_case DB row (public.venues) into camelCase.
 */
export type Venue = {
  id: string;
  name: string;
  heroImageUrl: string;
  galleryImages: string[];
  googleImages: string[];
  tiktokOfficial: string;
  instagramOfficial: string;
  tiktokHashtags: string[];
  instagramHashtags: string[];
  tiktokLocationTag: string;
  instagramLocationTag: string;
  websiteUrl: string;
  googleMapsUrl: string;
  tags: string[];
  rating: number;
  priceBand: string;
  isSponsored: boolean;
  /** 0 = none, 1 = featured, 2 = boosted reels, 3 = priority search */
  sponsoredBoostLevel: 0 | 1 | 2 | 3;
  /** Invite-only control: true = venue is approved for promotional features */
  promotionApproved: boolean;
};

const PRICE_BAND_BY_LEVEL: Record<number, string> = {
  1: "$",
  2: "$$",
  3: "$$$",
  4: "$$$$",
};

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  return [];
}

function clampBoost(n: unknown): 0 | 1 | 2 | 3 {
  const v = Number(n ?? 0);
  if (v >= 3) return 3;
  if (v === 2) return 2;
  if (v === 1) return 1;
  return 0;
}

/** Map a raw `public.venues` row into the canonical Venue shape. */
export function mapVenueRow(row: Tables<"venues">): Venue {
  const gallery = toStringArray(row.gallery_urls as unknown);
  const google = toStringArray(row.google_images as unknown);
  const hero = row.hero_image_url || row.image_url || google[0] || gallery[0] || "";

  const mapsUrl =
    row.google_maps_url ||
    (row.place_id
      ? `https://www.google.com/maps/place/?q=place_id:${row.place_id}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          [row.name, row.neighborhood, row.city].filter(Boolean).join(" "),
        )}`);

  return {
    id: row.id,
    name: row.name,
    heroImageUrl: hero,
    galleryImages: gallery,
    googleImages: google,
    tiktokOfficial: row.tiktok_url ?? "",
    instagramOfficial: row.instagram_url ?? "",
    tiktokHashtags: Array.isArray(row.tiktok_hashtags) ? row.tiktok_hashtags : [],
    instagramHashtags: Array.isArray(row.instagram_hashtags) ? row.instagram_hashtags : [],
    tiktokLocationTag: row.tiktok_location_tag ?? "",
    instagramLocationTag: row.instagram_location_tag ?? "",
    websiteUrl: row.website ?? "",
    googleMapsUrl: mapsUrl,
    tags: Array.isArray(row.tags) ? row.tags : [],
    rating: typeof row.rating === "number" ? row.rating : Number(row.rating ?? 0),
    priceBand: row.price_band ?? PRICE_BAND_BY_LEVEL[row.price_level] ?? "$$",
    isSponsored: Boolean(row.is_sponsored),
    sponsoredBoostLevel: clampBoost(row.sponsored_boost_level),
    promotionApproved: Boolean(row.promotion_approved),
  };
}
