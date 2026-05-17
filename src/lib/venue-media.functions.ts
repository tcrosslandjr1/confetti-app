import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type VenueMediaUpdate = {
  place_id?: string | null;
  gallery_urls?: unknown;
  gallery_refreshed_at?: string | null;
  tiktok_url?: string | null;
  tiktok_handle?: string | null;
  instagram_url?: string | null;
  instagram_handle?: string | null;
  socials_refreshed_at?: string | null;
};

function adminClient() {
  const url = process.env.SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function assertAdmin(supabase: ReturnType<typeof adminClient>, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(`Role check failed: ${error.message}`);
  if (!data) throw new Error("Admin access required");
}

/**
 * Refresh photos + socials for a single venue. Returns counts.
 * Used by the admin row action and reused by the bulk cron.
 */
export async function refreshOneVenue(
  venueId: string,
): Promise<{ photos_added: number; socials_found: number; error?: string }> {
  const { fetchPlacePhotos, findPlaceId, discoverSocials } = await import("./venue-media.server");
  const supabase = adminClient();
  const { data: venue, error } = await supabase
    .from("venues")
    .select("id, name, city, place_id, website")
    .eq("id", venueId)
    .maybeSingle();
  if (error) return { photos_added: 0, socials_found: 0, error: error.message };
  if (!venue) return { photos_added: 0, socials_found: 0, error: "Venue not found" };

  let placeId = venue.place_id as string | null;
  const updates: VenueMediaUpdate = {};
  if (!placeId) {
    placeId = await findPlaceId(venue.name, venue.city);
    if (placeId) updates.place_id = placeId;
  }

  let photosAdded = 0;
  if (placeId) {
    try {
      const photos = await fetchPlacePhotos(placeId, 8);
      if (photos.length) {
        updates.gallery_urls = photos;
        updates.gallery_refreshed_at = new Date().toISOString();
        photosAdded = photos.length;
      }
    } catch (e) {
      console.warn("[venue-media] place photos failed", venue.id, e);
    }
  }

  let socialsFound = 0;
  try {
    const socials = await discoverSocials(venue.name, venue.city, venue.website);
    if (socials.tiktok_url || socials.instagram_url) {
      Object.assign(updates, socials);
      updates.socials_refreshed_at = new Date().toISOString();
      socialsFound = (socials.tiktok_url ? 1 : 0) + (socials.instagram_url ? 1 : 0);
    }
  } catch (e) {
    console.warn("[venue-media] social discovery failed", venue.id, e);
  }

  if (Object.keys(updates).length) {
    const { error: upErr } = await supabase
      .from("venues")
      .update(updates as never)
      .eq("id", venueId);
    if (upErr) return { photos_added: 0, socials_found: 0, error: upErr.message };
  }

  return { photos_added: photosAdded, socials_found: socialsFound };
}

/** Process a batch of venues that haven't been refreshed in the last 30 days. */
export async function refreshStaleVenues(
  limit = 25,
  trigger: "cron" | "manual" = "cron",
): Promise<{
  run_id: string;
  venues_processed: number;
  photos_added: number;
  socials_found: number;
  errors: Array<{ venue_id: string; error: string }>;
}> {
  const supabase = adminClient();
  const runIns = await supabase
    .from("venue_media_refresh_runs")
    .insert({ trigger } as never)
    .select("id")
    .single();
  if (runIns.error) throw new Error(runIns.error.message);
  const runId = runIns.data.id as string;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: venues, error } = await supabase
    .from("venues")
    .select("id")
    .or(`gallery_refreshed_at.is.null,gallery_refreshed_at.lt.${thirtyDaysAgo}`)
    .order("gallery_refreshed_at", { ascending: true, nullsFirst: true })
    .limit(limit);
  if (error) throw new Error(error.message);

  let totalPhotos = 0;
  let totalSocials = 0;
  const errors: Array<{ venue_id: string; error: string }> = [];
  for (const v of venues ?? []) {
    const r = await refreshOneVenue(v.id);
    totalPhotos += r.photos_added;
    totalSocials += r.socials_found;
    if (r.error) errors.push({ venue_id: v.id, error: r.error });
  }

  await supabase
    .from("venue_media_refresh_runs")
    .update({
      finished_at: new Date().toISOString(),
      venues_processed: venues?.length ?? 0,
      photos_added: totalPhotos,
      socials_found: totalSocials,
      errors: errors as never,
    } as never)
    .eq("id", runId);

  return {
    run_id: runId,
    venues_processed: venues?.length ?? 0,
    photos_added: totalPhotos,
    socials_found: totalSocials,
    errors,
  };
}

export const refreshVenueMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ venueId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(adminClient(), context.userId);
    const result = await refreshOneVenue(data.venueId);
    return result;
  });

export const triggerBulkRefresh = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ limit: z.number().int().min(1).max(100).optional() }).optional())
  .handler(async ({ data, context }) => {
    await assertAdmin(adminClient(), context.userId);
    return refreshStaleVenues(data?.limit ?? 25, "manual");
  });
