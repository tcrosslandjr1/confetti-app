// Validation layer for venue rows fetched from `public.venues` /
// `public.viral_venues`. Every field is parsed defensively: malformed or
// missing values collapse to `null` (or `[]` for lists) so the UI never
// renders fabricated content on top of bad data.

import { z } from "zod";
import type { GalleryItem } from "@/components/venue/VenueGallery";

const trimmedString = z.union([z.string(), z.number(), z.null(), z.undefined()]).transform((v) => {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length > 0 ? s : null;
});

const optionalUrl = z.union([z.string(), z.null(), z.undefined()]).transform((v) => {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s) return null;
  try {
    // Allow tel: links separately
    if (s.startsWith("tel:")) return s;
    const u = new URL(s);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
});

const rating = z.union([z.number(), z.string(), z.null(), z.undefined()]).transform((v) => {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return null;
  if (n <= 0 || n > 5) return null;
  return Math.round(n * 10) / 10;
});

const priceLevel = z.union([z.number(), z.string(), z.null(), z.undefined()]).transform((v) => {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isInteger(n)) return null;
  if (n < 1 || n > 4) return null;
  return n as 1 | 2 | 3 | 4;
});

const stringArray = z.union([z.array(z.unknown()), z.null(), z.undefined()]).transform((v) => {
  if (!Array.isArray(v)) return [] as string[];
  return v.map((x) => (typeof x === "string" ? x.trim() : "")).filter((x) => x.length > 0);
});

const galleryArray = z
  .union([z.array(z.unknown()), z.null(), z.undefined()])
  .transform((v): GalleryItem[] => {
    if (!Array.isArray(v)) return [];
    const out: GalleryItem[] = [];
    for (const raw of v) {
      if (typeof raw === "string" && raw.trim()) {
        out.push({ url: raw.trim() });
      } else if (raw && typeof raw === "object" && typeof (raw as any).url === "string") {
        const url = (raw as any).url.trim();
        if (url) out.push({ ...(raw as object), url } as GalleryItem);
      }
    }
    return out;
  });

const boolish = z
  .union([z.boolean(), z.null(), z.undefined()])
  .transform((v) => (typeof v === "boolean" ? v : false));

export type ValidatedVenue = {
  id: string;
  name: string;
  category: string | null;
  neighborhood: string | null;
  address: string | null;
  city: string | null;
  description: string | null;
  image_url: string | null;
  rating: number | null;
  price_level: 1 | 2 | 3 | 4 | null;
  tags: string[];
  gallery_urls: GalleryItem[];
  website: string | null;
  tiktok_url: string | null;
  tiktok_handle: string | null;
  instagram_url: string | null;
  instagram_handle: string | null;
  phone: string | null;
  booking_url: string | null;
  menu_url: string | null;
  google_maps_url: string | null;
  place_id: string | null;
  featured: boolean;
  verified: boolean;
  specials: string | null;
  source: "venues" | "viral_venues";
};

const VenueRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  category: trimmedString,
  neighborhood: trimmedString,
  address: trimmedString.optional(),
  city: trimmedString,
  description: trimmedString,
  hero_image_url: trimmedString.optional(),
  image_url: trimmedString.optional(),
  rating,
  price_level: priceLevel,
  tags: stringArray,
  gallery_urls: galleryArray,
  website: optionalUrl,
  tiktok_url: optionalUrl,
  tiktok_handle: trimmedString.optional(),
  instagram_url: optionalUrl,
  instagram_handle: trimmedString.optional(),
  phone: trimmedString.optional(),
  booking_url: optionalUrl,
  menu_url: optionalUrl,
  google_maps_url: optionalUrl,
  maps_url: optionalUrl.optional(),
  place_id: trimmedString.optional(),
  featured: boolish,
  verified: boolish,
  specials: trimmedString.optional(),
});

export function validateVenueRow(
  row: unknown,
  source: "venues" | "viral_venues",
): ValidatedVenue | null {
  const parsed = VenueRowSchema.safeParse(row);
  if (!parsed.success) {
    if (typeof console !== "undefined") {
      console.warn("[venue] validation failed", parsed.error.flatten());
    }
    return null;
  }
  const v = parsed.data;
  const googleMaps =
    v.google_maps_url ??
    v.maps_url ??
    (v.place_id ? `https://www.google.com/maps/place/?q=place_id:${v.place_id}` : null);

  return {
    id: v.id,
    name: v.name,
    category: v.category,
    neighborhood: v.neighborhood,
    address: v.address ?? null,
    city: v.city,
    description: v.description,
    image_url: v.hero_image_url ?? v.image_url ?? null,
    rating: v.rating,
    price_level: v.price_level,
    tags: v.tags,
    gallery_urls: v.gallery_urls,
    website: v.website,
    tiktok_url: v.tiktok_url,
    tiktok_handle: v.tiktok_handle ?? null,
    instagram_url: v.instagram_url,
    instagram_handle: v.instagram_handle ?? null,
    phone: v.phone ?? null,
    booking_url: v.booking_url,
    menu_url: v.menu_url,
    google_maps_url: googleMaps,
    place_id: v.place_id ?? null,
    featured: v.featured,
    verified: v.verified,
    specials: v.specials ?? null,
    source,
  };
}
