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

type AdminDb = ReturnType<typeof adminClient>;
type UntypedAdminDb = AdminDb & { from: (table: string) => any };

function untypedDb(db: AdminDb): UntypedAdminDb {
  return db as UntypedAdminDb;
}

async function isAdmin(supabase: AdminDb, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return Boolean(data);
}

async function assertCanManageVenue(
  supabase: AdminDb,
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
      .select(
        "id, name, city, neighborhood, hero_image_url, image_url, claim_status, promotion_approved, sponsored_boost_level, gallery_refreshed_at, socials_refreshed_at, official_photos",
      );
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

    await supabase
      .from("venues")
      .update(update as never)
      .eq("id", data.venueId);

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
    if (data.tiktokLocationTag !== undefined)
      update.tiktok_location_tag = data.tiktokLocationTag || null;
    if (data.instagramOfficial !== undefined) update.instagram_url = data.instagramOfficial || null;
    if (data.instagramHandle !== undefined) update.instagram_handle = data.instagramHandle || null;
    if (data.instagramHashtags) update.instagram_hashtags = data.instagramHashtags.map(normTag);
    if (data.instagramLocationTag !== undefined)
      update.instagram_location_tag = data.instagramLocationTag || null;
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
  .inputValidator(
    z.object({ venueId: z.string().uuid(), platform: z.enum(["tiktok", "instagram"]) }),
  )
  .handler(async ({ data, context }) => {
    const supabase = adminClient();
    await assertCanManageVenue(supabase, context.userId, data.venueId);
    const update =
      data.platform === "tiktok"
        ? {
            tiktok_url: null,
            tiktok_handle: null,
            tiktok_hashtags: [],
            tiktok_location_tag: null,
            tiktok_thumbnails: [],
          }
        : {
            instagram_url: null,
            instagram_handle: null,
            instagram_hashtags: [],
            instagram_location_tag: null,
            instagram_thumbnails: [],
          };
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

/* ----------------------------- EVENTS ----------------------------- */

export const listMyVenueEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = adminClient();
    const admin = await isAdmin(supabase, context.userId);
    let vq = supabase.from("venues").select("id, name");
    if (!admin) vq = vq.eq("claimed_by", context.userId);
    const { data: venues, error: vErr } = await vq;
    if (vErr) throw new Error(vErr.message);
    const ids = (venues ?? []).map((v) => v.id);
    if (ids.length === 0) return { events: [] };
    const { data, error } = await supabase
      .from("events")
      .select(
        "id, title, starts_at, ends_at, status, image_url, ticket_url, price_cents, venue_id, venue_name",
      )
      .in("venue_id", ids)
      .order("starts_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { events: data ?? [] };
  });

export const deleteVenueEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ eventId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const supabase = adminClient();
    const { data: ev } = await supabase
      .from("events")
      .select("venue_id")
      .eq("id", data.eventId)
      .single();
    if (!ev?.venue_id) throw new Error("Event not found");
    await assertCanManageVenue(supabase, context.userId, ev.venue_id);
    const { error } = await supabase.from("events").delete().eq("id", data.eventId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const CreateEventInput = z.object({
  venueId: z.string().uuid(),
  title: z.string().min(1).max(200),
  starts_at: z.string().min(1),
  ends_at: z.string().optional().nullable(),
  description: z.string().max(4000).optional().nullable(),
  city: z.string().min(1).max(120),
  address: z.string().max(400).optional().nullable(),
  neighborhood: z.string().max(120).optional().nullable(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  venue_name: z.string().max(200).optional().nullable(),
  image_url: z.string().url().or(z.literal("")).optional().nullable(),
  ticket_url: z.string().url().or(z.literal("")).optional().nullable(),
  price_cents: z.number().int().nonnegative().optional().nullable(),
});

export const createVenueEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(CreateEventInput)
  .handler(async ({ data, context }) => {
    const supabase = adminClient();
    await assertCanManageVenue(supabase, context.userId, data.venueId);
    const { data: venue } = await supabase
      .from("venues")
      .select("name, city, neighborhood")
      .eq("id", data.venueId)
      .single();
    const insert = {
      venue_id: data.venueId,
      venue_name: data.venue_name || venue?.name || null,
      title: data.title,
      starts_at: data.starts_at,
      ends_at: data.ends_at || null,
      description: data.description || null,
      city: data.city || venue?.city || "",
      address: data.address || null,
      neighborhood: data.neighborhood || venue?.neighborhood || null,
      lat: data.lat ?? null,
      lng: data.lng ?? null,
      image_url: data.image_url || null,
      ticket_url: data.ticket_url || null,
      price_cents: data.price_cents ?? null,
      source: "business_portal",
      created_by: context.userId,
      status: "published",
    };
    const { data: row, error } = await supabase.from("events").insert(insert).select("id").single();
    if (error) throw new Error(error.message);
    return { ok: true, eventId: row.id };
  });

/* ----------------------------- SETTINGS ----------------------------- */

const SettingsInput = z.object({
  venueId: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(4000).optional(),
  city: z.string().max(120).optional(),
  neighborhood: z.string().max(120).optional(),
  website: z.string().url().or(z.literal("")).optional(),
  price_band: z.string().max(20).optional(),
  category: z.string().max(80).optional(),
  staff_email: z.string().email().or(z.literal("")).optional(),
});

export const updateVenueSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(SettingsInput)
  .handler(async ({ data, context }) => {
    const supabase = adminClient();
    await assertCanManageVenue(supabase, context.userId, data.venueId);
    const { venueId, ...rest } = data;
    const update: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(rest)) {
      if (v === undefined) continue;
      update[k] = v === "" ? null : v;
    }
    if (Object.keys(update).length === 0) return { ok: true };
    const { error } = await supabase
      .from("venues")
      .update(update as never)
      .eq("id", venueId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ----------------------------- BILLING ----------------------------- */

export const getMyBusinessSubscription = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = adminClient();
    const { data, error } = await supabase
      .from("subscriptions")
      .select(
        "id, status, tier, current_period_start, current_period_end, cancel_at_period_end, price_id, product_id, account_type, environment, updated_at",
      )
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false })
      .limit(5);
    if (error) throw new Error(error.message);
    const active =
      (data ?? []).find(
        (s) =>
          (s.status === "active" || s.status === "trialing") &&
          (!s.current_period_end || new Date(s.current_period_end).getTime() > Date.now()),
      ) ?? null;
    return { subscription: active, history: data ?? [] };
  });

/* ----------------------------- BOOKINGS ----------------------------- */

export const listVenueBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      venueId: z.string().uuid(),
      status: z.enum(["upcoming", "confirmed", "completed", "cancelled", "all"]).default("all"),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(50).default(20),
    }),
  )
  .handler(async ({ context, input }) => {
    const supabase = adminClient();
    await assertCanManageVenue(supabase, context.userId, input.venueId);

    let q = supabase
      .from("bookings")
      .select(
        "id, user_id, confirmation_code, party_size, booking_time, status, special_requests, created_at, cancelled_at, cancellation_reason",
        { count: "exact" },
      )
      .eq("venue_id", input.venueId)
      .order("booking_time", { ascending: false });

    if (input.status !== "all") {
      q = q.eq("status", input.status);
    }

    const from = (input.page - 1) * input.limit;
    q = q.range(from, from + input.limit - 1);

    const { data, error, count } = await q;
    if (error) throw new Error(error.message);

    // Fetch passenger profiles for the bookings
    const userIds = [...new Set((data ?? []).map((b) => b.user_id))];
    let profiles: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
    if (userIds.length) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", userIds);
      profiles = Object.fromEntries(
        (profileData ?? []).map((p) => [p.id, { display_name: p.display_name, avatar_url: p.avatar_url }]),
      );
    }

    return {
      bookings: (data ?? []).map((b) => ({
        ...b,
        passenger: profiles[b.user_id] ?? { display_name: null, avatar_url: null },
      })),
      total: count ?? 0,
      page: input.page,
      totalPages: Math.ceil((count ?? 0) / input.limit),
    };
  });

export const getVenueBookingStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ venueId: z.string().uuid() }))
  .handler(async ({ context, input }) => {
    const supabase = adminClient();
    await assertCanManageVenue(supabase, context.userId, input.venueId);

    const now = new Date().toISOString();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

    // Get counts by status
    const { data: all } = await supabase
      .from("bookings")
      .select("status, party_size, booking_time")
      .eq("venue_id", input.venueId)
      .gte("created_at", thirtyDaysAgo);

    const bookings = all ?? [];
    const upcoming = bookings.filter((b) => b.status === "upcoming" || b.status === "confirmed");
    const completed = bookings.filter((b) => b.status === "completed");
    const cancelled = bookings.filter((b) => b.status === "cancelled");
    const totalGuests = bookings.reduce((sum, b) => sum + (b.party_size ?? 0), 0);

    return {
      total30d: bookings.length,
      upcoming: upcoming.length,
      completed: completed.length,
      cancelled: cancelled.length,
      totalGuests30d: totalGuests,
      avgPartySize: bookings.length ? +(totalGuests / bookings.length).toFixed(1) : 0,
    };
  });

export const updateBookingStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      venueId: z.string().uuid(),
      bookingId: z.string().uuid(),
      status: z.enum(["confirmed", "completed", "cancelled"]),
      reason: z.string().optional(),
    }),
  )
  .handler(async ({ context, input }) => {
    const supabase = adminClient();
    await assertCanManageVenue(supabase, context.userId, input.venueId);

    const updates: Record<string, unknown> = { status: input.status };
    if (input.status === "cancelled") {
      updates.cancelled_at = new Date().toISOString();
      updates.cancellation_reason = input.reason ?? "Cancelled by venue";
    }

    const { error } = await supabase
      .from("bookings")
      .update(updates)
      .eq("id", input.bookingId)
      .eq("venue_id", input.venueId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ----------------------------- VENUE NOTIFICATIONS ----------------------------- */

export const listVenueNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      venueId: z.string().uuid(),
      unreadOnly: z.boolean().default(false),
      limit: z.number().int().min(1).max(50).default(20),
    }),
  )
  .handler(async ({ context, input }) => {
    const supabase = adminClient();
    await assertCanManageVenue(supabase, context.userId, input.venueId);

    let q = supabase
      .from("venue_notifications")
      .select("*")
      .eq("venue_id", input.venueId)
      .order("created_at", { ascending: false })
      .limit(input.limit);

    if (input.unreadOnly) q = q.eq("is_read", false);

    const { data, error } = await q;
    if (error) throw new Error(error.message);

    // Count unread
    const { count } = await supabase
      .from("venue_notifications")
      .select("id", { count: "exact", head: true })
      .eq("venue_id", input.venueId)
      .eq("is_read", false);

    return { notifications: data ?? [], unreadCount: count ?? 0 };
  });

export const markNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      venueId: z.string().uuid(),
      notificationIds: z.array(z.string().uuid()).optional(),
    }),
  )
  .handler(async ({ context, input }) => {
    const supabase = adminClient();
    await assertCanManageVenue(supabase, context.userId, input.venueId);

    let q = supabase
      .from("venue_notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("venue_id", input.venueId)
      .eq("is_read", false);

    if (input.notificationIds?.length) {
      q = q.in("id", input.notificationIds);
    }

    const { error } = await q;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ═══════════════════════════════════════════════════════════════
// MENU MANAGEMENT
// ═══════════════════════════════════════════════════════════════

export const listVenueMenu = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ venueId: z.string().uuid() }))
  .handler(async ({ context, input }) => {
    const supabase = adminClient();
    await assertCanManageVenue(supabase, context.userId, input.venueId);

    const { data: categories } = await supabase
      .from("venue_menu_categories")
      .select("*")
      .eq("venue_id", input.venueId)
      .order("sort_order");

    const { data: items } = await supabase
      .from("venue_menu_items")
      .select("*")
      .eq("venue_id", input.venueId)
      .order("sort_order");

    return { categories: categories ?? [], items: items ?? [] };
  });

export const upsertMenuCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      venueId: z.string().uuid(),
      id: z.string().uuid().optional(),
      name: z.string().min(1).max(100),
      sort_order: z.number().int().optional(),
    }),
  )
  .handler(async ({ context, input }) => {
    const supabase = adminClient();
    await assertCanManageVenue(supabase, context.userId, input.venueId);

    if (input.id) {
      const { error } = await supabase
        .from("venue_menu_categories")
        .update({ name: input.name, sort_order: input.sort_order ?? 0 })
        .eq("id", input.id)
        .eq("venue_id", input.venueId);
      if (error) throw new Error(error.message);
      return { ok: true, id: input.id };
    }

    const { data, error } = await supabase
      .from("venue_menu_categories")
      .insert({ venue_id: input.venueId, name: input.name, sort_order: input.sort_order ?? 0 })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: data.id };
  });

export const deleteMenuCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ venueId: z.string().uuid(), categoryId: z.string().uuid() }))
  .handler(async ({ context, input }) => {
    const supabase = adminClient();
    await assertCanManageVenue(supabase, context.userId, input.venueId);

    const { error } = await supabase
      .from("venue_menu_categories")
      .delete()
      .eq("id", input.categoryId)
      .eq("venue_id", input.venueId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const upsertMenuItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      venueId: z.string().uuid(),
      id: z.string().uuid().optional(),
      category_id: z.string().uuid().nullable().optional(),
      name: z.string().min(1).max(200),
      description: z.string().max(500).optional(),
      price_cents: z.number().int().min(0),
      image_url: z.string().url().optional().nullable(),
      is_available: z.boolean().optional(),
      dietary_tags: z.array(z.string()).optional(),
      sort_order: z.number().int().optional(),
    }),
  )
  .handler(async ({ context, input }) => {
    const supabase = adminClient();
    await assertCanManageVenue(supabase, context.userId, input.venueId);

    const row = {
      venue_id: input.venueId,
      category_id: input.category_id ?? null,
      name: input.name,
      description: input.description ?? null,
      price_cents: input.price_cents,
      image_url: input.image_url ?? null,
      is_available: input.is_available ?? true,
      dietary_tags: input.dietary_tags ?? [],
      sort_order: input.sort_order ?? 0,
      updated_at: new Date().toISOString(),
    };

    if (input.id) {
      const { error } = await supabase
        .from("venue_menu_items")
        .update(row)
        .eq("id", input.id)
        .eq("venue_id", input.venueId);
      if (error) throw new Error(error.message);
      return { ok: true, id: input.id };
    }

    const { data, error } = await supabase
      .from("venue_menu_items")
      .insert(row)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: data.id };
  });

export const deleteMenuItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ venueId: z.string().uuid(), itemId: z.string().uuid() }))
  .handler(async ({ context, input }) => {
    const supabase = adminClient();
    await assertCanManageVenue(supabase, context.userId, input.venueId);

    const { error } = await supabase
      .from("venue_menu_items")
      .delete()
      .eq("id", input.itemId)
      .eq("venue_id", input.venueId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ═══════════════════════════════════════════════════════════════
// PRE-ORDERS (venue-side view)
// ═══════════════════════════════════════════════════════════════

export const listVenuePreOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      venueId: z.string().uuid(),
      status: z.enum(["pending", "sent", "confirmed", "cancelled", "all"]).optional(),
    }),
  )
  .handler(async ({ context, input }) => {
    const supabase = adminClient();
    await assertCanManageVenue(supabase, context.userId, input.venueId);

    let q = supabase
      .from("booking_pre_orders")
      .select(`
        *,
        booking:bookings(id, booking_time, party_size, confirmation_code),
        items:pre_order_items(*, menu_item:venue_menu_items(name, price_cents))
      `)
      .eq("venue_id", input.venueId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (input.status && input.status !== "all") {
      q = q.eq("status", input.status);
    }

    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return { preOrders: data ?? [] };
  });

export const updatePreOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      venueId: z.string().uuid(),
      preOrderId: z.string().uuid(),
      status: z.enum(["confirmed", "cancelled"]),
    }),
  )
  .handler(async ({ context, input }) => {
    const supabase = adminClient();
    await assertCanManageVenue(supabase, context.userId, input.venueId);

    const { error } = await supabase
      .from("booking_pre_orders")
      .update({ status: input.status, updated_at: new Date().toISOString() })
      .eq("id", input.preOrderId)
      .eq("venue_id", input.venueId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ═══════════════════════════════════════════════════════════════
// CORPORATE BOOKINGS (venue-side view)
// ═══════════════════════════════════════════════════════════════

export const listVenueCorporateBookings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      venueId: z.string().uuid(),
      status: z.enum(["pending", "approved", "completed", "cancelled", "all"]).optional(),
      page: z.number().int().min(1).optional(),
      limit: z.number().int().min(1).max(50).optional(),
    }),
  )
  .handler(async ({ context, input }) => {
    const supabase = adminClient();
    await assertCanManageVenue(supabase, context.userId, input.venueId);

    const limit = input.limit ?? 20;
    const page = input.page ?? 1;
    const offset = (page - 1) * limit;

    let q = supabase
      .from("corporate_bookings")
      .select("*, company:corporate_companies(name, logo_url)", { count: "exact" })
      .eq("venue_id", input.venueId)
      .order("scheduled_date", { ascending: false })
      .range(offset, offset + limit - 1);

    if (input.status && input.status !== "all") {
      q = q.eq("status", input.status);
    }

    const { data, count, error } = await q;
    if (error) throw new Error(error.message);

    return {
      bookings: data ?? [],
      totalPages: Math.ceil((count ?? 0) / limit),
      total: count ?? 0,
    };
  });

// ═══════════════════════════════════════════════════════════════
// REAL ANALYTICS
// ═══════════════════════════════════════════════════════════════

export const getVenueAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      venueId: z.string().uuid(),
      days: z.number().int().min(1).max(90).optional(),
    }),
  )
  .handler(async ({ context, input }) => {
    const supabase = adminClient();
    await assertCanManageVenue(supabase, context.userId, input.venueId);

    const days = input.days ?? 30;
    const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);

    const { data: daily } = await supabase
      .from("venue_analytics_daily")
      .select("*")
      .eq("venue_id", input.venueId)
      .gte("date", since)
      .order("date", { ascending: true });

    const rows = daily ?? [];
    const totals = rows.reduce(
      (acc, r) => ({
        impressions: acc.impressions + (r.impressions ?? 0),
        profile_views: acc.profile_views + (r.profile_views ?? 0),
        clicks: acc.clicks + (r.clicks ?? 0),
        bookings_count: acc.bookings_count + (r.bookings_count ?? 0),
        cancellations: acc.cancellations + (r.cancellations ?? 0),
        pre_orders_count: acc.pre_orders_count + (r.pre_orders_count ?? 0),
        revenue_cents: acc.revenue_cents + Number(r.revenue_cents ?? 0),
        unique_visitors: acc.unique_visitors + (r.unique_visitors ?? 0),
      }),
      {
        impressions: 0,
        profile_views: 0,
        clicks: 0,
        bookings_count: 0,
        cancellations: 0,
        pre_orders_count: 0,
        revenue_cents: 0,
        unique_visitors: 0,
      },
    );

    return { daily: rows, totals, days };
  });
