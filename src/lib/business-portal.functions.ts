import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

function adminClient() {
  const url = process.env.SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function isAdmin(supabase: ReturnType<typeof adminClient>, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return Boolean(data);
}

async function assertCanManageVenue(
  supabase: ReturnType<typeof adminClient>,
  userId: string,
  venueId: string,
) {
  if (await isAdmin(supabase, userId)) return;
  const { data } = await supabase
    .from("venues")
    .select("id, claimed_by")
    .eq("id", venueId)
    .maybeSingle();
  if (!data) throw new Error("Venue not found");
  if (data.claimed_by !== userId) throw new Error("Not authorized to manage this venue");
}

/* ----------------------------- LISTING ----------------------------- */

export const listMyManagedVenues = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = adminClient();
    const admin = await isAdmin(supabase, context.userId);
    let q = supabase
      .from("venues")
      .select("id, name, city, neighborhood, hero_image_url, image_url, claim_status, promotion_approved, sponsored_boost_level, gallery_refreshed_at, socials_refreshed_at, official_photos");
    if (!admin) q = q.eq("claimed_by", context.userId);
    const { data, error } = await q.order("name");
    if (error) throw new Error(error.message);
    return { admin, venues: data ?? [] };
  });

export const getManagedVenue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ venueId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const supabase = adminClient();
    await assertCanManageVenue(supabase, context.userId, data.venueId);
    const { data: row, error } = await supabase
      .from("venues")
      .select("*")
      .eq("id", data.venueId)
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

/* ----------------------------- MEDIA ----------------------------- */

const UploadInput = z.object({
  venueId: z.string().uuid(),
  filename: z.string().min(1).max(200),
  contentType: z.string().min(3).max(100),
  /** base64-encoded image bytes (no data: prefix) */
  base64: z.string().min(10).max(8_000_000),
  setAsHero: z.boolean().optional(),
});

export const uploadOfficialPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(UploadInput)
  .handler(async ({ data, context }) => {
    const supabase = adminClient();
    await assertCanManageVenue(supabase, context.userId, data.venueId);

    const safe = data.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${data.venueId}/${Date.now()}-${safe}`;
    const bytes = Buffer.from(data.base64, "base64");

    const { error: upErr } = await supabase.storage
      .from("venue-photos")
      .upload(path, bytes, { contentType: data.contentType, upsert: false });
    if (upErr) throw new Error(`Upload failed: ${upErr.message}`);

    const { data: pub } = supabase.storage.from("venue-photos").getPublicUrl(path);
    const url = pub.publicUrl;

    const { data: row } = await supabase
      .from("venues")
      .select("official_photos, hero_image_url")
      .eq("id", data.venueId)
      .single();
    const next = [url, ...(row?.official_photos ?? [])];
    const update: Record<string, unknown> = { official_photos: next };
    if (data.setAsHero || !row?.hero_image_url) update.hero_image_url = url;

    const { error: updErr } = await supabase
      .from("venues")
      .update(update as never)
      .eq("id", data.venueId);
    if (updErr) throw new Error(updErr.message);

    return { url };
  });

export const removeOfficialPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ venueId: z.string().uuid(), url: z.string().url() }))
  .handler(async ({ data, context }) => {
    const supabase = adminClient();
    await assertCanManageVenue(supabase, context.userId, data.venueId);

    const { data: row } = await supabase
      .from("venues")
      .select("official_photos, hero_image_url")
      .eq("id", data.venueId)
      .single();
    const next = (row?.official_photos ?? []).filter((u) => u !== data.url);
    const update: Record<string, unknown> = { official_photos: next };
    if (row?.hero_image_url === data.url) update.hero_image_url = next[0] ?? null;

    await supabase.from("venues").update(update as never).eq("id", data.venueId);

    // Best-effort storage delete (path = everything after /venue-photos/)
    const match = data.url.match(/venue-photos\/(.+)$/);
    if (match) {
      await supabase.storage.from("venue-photos").remove([match[1]]);
    }
    return { ok: true };
  });

export const setHeroImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ venueId: z.string().uuid(), url: z.string().url() }))
  .handler(async ({ data, context }) => {
    const supabase = adminClient();
    await assertCanManageVenue(supabase, context.userId, data.venueId);
    const { error } = await supabase
      .from("venues")
      .update({ hero_image_url: data.url } as never)
      .eq("id", data.venueId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleMediaHidden = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ venueId: z.string().uuid(), url: z.string().url() }))
  .handler(async ({ data, context }) => {
    const supabase = adminClient();
    await assertCanManageVenue(supabase, context.userId, data.venueId);
    const { data: row } = await supabase
      .from("venues")
      .select("hidden_media_urls")
      .eq("id", data.venueId)
      .single();
    const current = row?.hidden_media_urls ?? [];
    const next = current.includes(data.url)
      ? current.filter((u) => u !== data.url)
      : [...current, data.url];
    const { error } = await supabase
      .from("venues")
      .update({ hidden_media_urls: next } as never)
      .eq("id", data.venueId);
    if (error) throw new Error(error.message);
    return { hidden: !current.includes(data.url) };
  });

/* ----------------------------- SOCIAL ----------------------------- */

const SocialInput = z.object({
  venueId: z.string().uuid(),
  tiktokOfficial: z.string().url().or(z.literal("")).optional(),
  tiktokHandle: z.string().max(80).optional(),
  tiktokHashtags: z.array(z.string().min(1).max(60)).max(20).optional(),
  tiktokLocationTag: z.string().max(120).optional(),
  instagramOfficial: z.string().url().or(z.literal("")).optional(),
  instagramHandle: z.string().max(80).optional(),
  instagramHashtags: z.array(z.string().min(1).max(60)).max(20).optional(),
  instagramLocationTag: z.string().max(120).optional(),
});

export const updateVenueSocial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(SocialInput)
  .handler(async ({ data, context }) => {
    const supabase = adminClient();
    await assertCanManageVenue(supabase, context.userId, data.venueId);

    const normTag = (s: string) => s.trim().replace(/^#/, "").toLowerCase();
    const update: Record<string, unknown> = {};
    if (data.tiktokOfficial !== undefined) update.tiktok_url = data.tiktokOfficial || null;
    if (data.tiktokHandle !== undefined) update.tiktok_handle = data.tiktokHandle || null;
    if (data.tiktokHashtags) update.tiktok_hashtags = data.tiktokHashtags.map(normTag);
    if (data.tiktokLocationTag !== undefined) update.tiktok_location_tag = data.tiktokLocationTag || null;
    if (data.instagramOfficial !== undefined) update.instagram_url = data.instagramOfficial || null;
    if (data.instagramHandle !== undefined) update.instagram_handle = data.instagramHandle || null;
    if (data.instagramHashtags) update.instagram_hashtags = data.instagramHashtags.map(normTag);
    if (data.instagramLocationTag !== undefined) update.instagram_location_tag = data.instagramLocationTag || null;
    update.socials_refreshed_at = new Date().toISOString();

    const { error } = await supabase
      .from("venues")
      .update(update as never)
      .eq("id", data.venueId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const disconnectSocial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ venueId: z.string().uuid(), platform: z.enum(["tiktok", "instagram"]) }))
  .handler(async ({ data, context }) => {
    const supabase = adminClient();
    await assertCanManageVenue(supabase, context.userId, data.venueId);
    const update =
      data.platform === "tiktok"
        ? { tiktok_url: null, tiktok_handle: null, tiktok_hashtags: [], tiktok_location_tag: null, tiktok_thumbnails: [] }
        : { instagram_url: null, instagram_handle: null, instagram_hashtags: [], instagram_location_tag: null, instagram_thumbnails: [] };
    const { error } = await supabase
      .from("venues")
      .update(update as never)
      .eq("id", data.venueId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* --------------------------- AI REFRESH --------------------------- */

export const requestVenueRefresh = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ venueId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const supabase = adminClient();
    await assertCanManageVenue(supabase, context.userId, data.venueId);
    const { refreshOneVenue } = await import("./venue-media.functions");
    return refreshOneVenue(data.venueId);
  });
