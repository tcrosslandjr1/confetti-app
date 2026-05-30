/**
 * Client-side business API — replaces server functions from business-portal.functions.ts
 * Uses the anon-key Supabase client (RLS-protected) instead of adminClient().
 *
 * Every function here mirrors the original server function logic but runs in the
 * browser, authenticated via supabase.auth.getUser().
 */
import { supabase } from "@/integrations/supabase/client";

// ─── helpers ────────────────────────────────────────────────────

async function requireUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Not authenticated");
  return user;
}

async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await (supabase as any)
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return Boolean(data);
}

async function assertCanManageVenue(userId: string, venueId: string) {
  if (await isAdmin(userId)) return;
  const { data } = await (supabase as any)
    .from("venues")
    .select("id, claimed_by")
    .eq("id", venueId)
    .maybeSingle();
  if (!data) throw new Error("Venue not found");
  if (data.claimed_by !== userId) throw new Error("Not authorized to manage this venue");
}

// ─── LISTING ────────────────────────────────────────────────────

export async function listMyManagedVenues() {
  const user = await requireUser();
  const admin = await isAdmin(user.id);
  let q = (supabase as any)
    .from("venues")
    .select(
      "id, name, city, neighborhood, hero_image_url, image_url, claim_status, promotion_approved, sponsored_boost_level, gallery_refreshed_at, socials_refreshed_at, official_photos",
    );
  if (!admin) q = q.eq("claimed_by", user.id);
  const { data, error } = await q.order("name");
  if (error) throw new Error(error.message);
  return { admin, venues: data ?? [] };
}

export async function getManagedVenue(venueId: string) {
  const user = await requireUser();
  await assertCanManageVenue(user.id, venueId);
  const { data, error } = await (supabase as any)
    .from("venues")
    .select("*")
    .eq("id", venueId)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// ─── MEDIA ──────────────────────────────────────────────────────

export async function uploadOfficialPhoto(input: {
  venueId: string;
  filename: string;
  contentType: string;
  base64: string;
  setAsHero?: boolean;
}) {
  const user = await requireUser();
  await assertCanManageVenue(user.id, input.venueId);

  const safe = input.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${input.venueId}/${Date.now()}-${safe}`;

  // Convert base64 to Uint8Array for browser upload
  const binaryStr = atob(input.base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

  const { error: upErr } = await supabase.storage
    .from("venue-photos")
    .upload(path, bytes, { contentType: input.contentType, upsert: false });
  if (upErr) throw new Error(`Upload failed: ${upErr.message}`);

  const { data: pub } = supabase.storage.from("venue-photos").getPublicUrl(path);
  const url = pub.publicUrl;

  const { data: row } = await (supabase as any)
    .from("venues")
    .select("official_photos, hero_image_url")
    .eq("id", input.venueId)
    .single();
  const next = [url, ...(row?.official_photos ?? [])];
  const update: Record<string, unknown> = { official_photos: next };
  if (input.setAsHero || !row?.hero_image_url) update.hero_image_url = url;

  const { error: updErr } = await (supabase as any)
    .from("venues")
    .update(update)
    .eq("id", input.venueId);
  if (updErr) throw new Error(updErr.message);

  return { url };
}

export async function removeOfficialPhoto(input: { venueId: string; url: string }) {
  const user = await requireUser();
  await assertCanManageVenue(user.id, input.venueId);

  const { data: row } = await (supabase as any)
    .from("venues")
    .select("official_photos, hero_image_url")
    .eq("id", input.venueId)
    .single();
  const next = (row?.official_photos ?? []).filter((u: string) => u !== input.url);
  const update: Record<string, unknown> = { official_photos: next };
  if (row?.hero_image_url === input.url) update.hero_image_url = next[0] ?? null;

  await (supabase as any).from("venues").update(update).eq("id", input.venueId);

  const match = input.url.match(/venue-photos\/(.+)$/);
  if (match) {
    await supabase.storage.from("venue-photos").remove([match[1]]);
  }
  return { ok: true };
}

export async function setHeroImage(input: { venueId: string; url: string }) {
  const user = await requireUser();
  await assertCanManageVenue(user.id, input.venueId);
  const { error } = await (supabase as any)
    .from("venues")
    .update({ hero_image_url: input.url })
    .eq("id", input.venueId);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function toggleMediaHidden(input: { venueId: string; url: string }) {
  const user = await requireUser();
  await assertCanManageVenue(user.id, input.venueId);
  const { data: row } = await (supabase as any)
    .from("venues")
    .select("hidden_media_urls")
    .eq("id", input.venueId)
    .single();
  const current: string[] = row?.hidden_media_urls ?? [];
  const next = current.includes(input.url)
    ? current.filter((u: string) => u !== input.url)
    : [...current, input.url];
  const { error } = await (supabase as any)
    .from("venues")
    .update({ hidden_media_urls: next })
    .eq("id", input.venueId);
  if (error) throw new Error(error.message);
  return { hidden: !current.includes(input.url) };
}

// ─── SOCIAL ─────────────────────────────────────────────────────

export async function updateVenueSocial(input: {
  venueId: string;
  tiktokOfficial?: string;
  tiktokHandle?: string;
  tiktokHashtags?: string[];
  tiktokLocationTag?: string;
  instagramOfficial?: string;
  instagramHandle?: string;
  instagramHashtags?: string[];
  instagramLocationTag?: string;
}) {
  const user = await requireUser();
  await assertCanManageVenue(user.id, input.venueId);

  const normTag = (s: string) => s.trim().replace(/^#/, "").toLowerCase();
  const update: Record<string, unknown> = {};
  if (input.tiktokOfficial !== undefined) update.tiktok_url = input.tiktokOfficial || null;
  if (input.tiktokHandle !== undefined) update.tiktok_handle = input.tiktokHandle || null;
  if (input.tiktokHashtags) update.tiktok_hashtags = input.tiktokHashtags.map(normTag);
  if (input.tiktokLocationTag !== undefined)
    update.tiktok_location_tag = input.tiktokLocationTag || null;
  if (input.instagramOfficial !== undefined) update.instagram_url = input.instagramOfficial || null;
  if (input.instagramHandle !== undefined) update.instagram_handle = input.instagramHandle || null;
  if (input.instagramHashtags) update.instagram_hashtags = input.instagramHashtags.map(normTag);
  if (input.instagramLocationTag !== undefined)
    update.instagram_location_tag = input.instagramLocationTag || null;
  update.socials_refreshed_at = new Date().toISOString();

  const { error } = await (supabase as any).from("venues").update(update).eq("id", input.venueId);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function disconnectSocial(input: {
  venueId: string;
  platform: "tiktok" | "instagram";
}) {
  const user = await requireUser();
  await assertCanManageVenue(user.id, input.venueId);
  const update =
    input.platform === "tiktok"
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
  const { error } = await (supabase as any).from("venues").update(update).eq("id", input.venueId);
  if (error) throw new Error(error.message);
  return { ok: true };
}

// ─── EVENTS ─────────────────────────────────────────────────────

export async function listMyVenueEvents() {
  const user = await requireUser();
  const admin = await isAdmin(user.id);
  let vq = (supabase as any).from("venues").select("id, name");
  if (!admin) vq = vq.eq("claimed_by", user.id);
  const { data: venues, error: vErr } = await vq;
  if (vErr) throw new Error(vErr.message);
  const ids = (venues ?? []).map((v: { id: string }) => v.id);
  if (ids.length === 0) return { events: [] };
  const { data, error } = await (supabase as any)
    .from("events")
    .select(
      "id, title, starts_at, ends_at, status, image_url, ticket_url, price_cents, venue_id, venue_name",
    )
    .in("venue_id", ids)
    .order("starts_at", { ascending: false });
  if (error) throw new Error(error.message);
  return { events: data ?? [] };
}

export async function createVenueEvent(input: {
  venueId: string;
  title: string;
  starts_at: string;
  ends_at?: string | null;
  description?: string | null;
  city: string;
  address?: string | null;
  neighborhood?: string | null;
  lat?: number | null;
  lng?: number | null;
  venue_name?: string | null;
  image_url?: string | null;
  ticket_url?: string | null;
  price_cents?: number | null;
}) {
  const user = await requireUser();
  await assertCanManageVenue(user.id, input.venueId);
  const { data: venue } = await (supabase as any)
    .from("venues")
    .select("name, city, neighborhood")
    .eq("id", input.venueId)
    .single();
  const insert = {
    venue_id: input.venueId,
    venue_name: input.venue_name || venue?.name || null,
    title: input.title,
    starts_at: input.starts_at,
    ends_at: input.ends_at || null,
    description: input.description || null,
    city: input.city || venue?.city || "",
    address: input.address || null,
    neighborhood: input.neighborhood || venue?.neighborhood || null,
    lat: input.lat ?? null,
    lng: input.lng ?? null,
    image_url: input.image_url || null,
    ticket_url: input.ticket_url || null,
    price_cents: input.price_cents ?? null,
    source: "business_portal",
    created_by: user.id,
    status: "published",
  };
  const { data: row, error } = await (supabase as any)
    .from("events")
    .insert(insert)
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return { ok: true, eventId: row.id };
}

export async function deleteVenueEvent(eventId: string) {
  const user = await requireUser();
  const { data: ev } = await (supabase as any)
    .from("events")
    .select("venue_id")
    .eq("id", eventId)
    .single();
  if (!ev?.venue_id) throw new Error("Event not found");
  await assertCanManageVenue(user.id, ev.venue_id);
  const { error } = await (supabase as any).from("events").delete().eq("id", eventId);
  if (error) throw new Error(error.message);
  return { ok: true };
}

// ─── SETTINGS ───────────────────────────────────────────────────

export async function updateVenueSettings(input: {
  venueId: string;
  name?: string;
  description?: string;
  city?: string;
  neighborhood?: string;
  website?: string;
  price_band?: string;
  category?: string;
  staff_email?: string;
}) {
  const user = await requireUser();
  await assertCanManageVenue(user.id, input.venueId);
  const { venueId, ...rest } = input;
  const update: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rest)) {
    if (v === undefined) continue;
    update[k] = v === "" ? null : v;
  }
  if (Object.keys(update).length === 0) return { ok: true };
  const { error } = await (supabase as any).from("venues").update(update).eq("id", venueId);
  if (error) throw new Error(error.message);
  return { ok: true };
}

// ─── BILLING ────────────────────────────────────────────────────

export async function getMyBusinessSubscription() {
  const user = await requireUser();
  const { data, error } = await (supabase as any)
    .from("subscriptions")
    .select(
      "id, status, tier, current_period_start, current_period_end, cancel_at_period_end, price_id, product_id, account_type, environment, updated_at",
    )
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(5);
  if (error) throw new Error(error.message);
  const active =
    (data ?? []).find(
      (s: { status: string; current_period_end?: string | null }) =>
        (s.status === "active" || s.status === "trialing") &&
        (!s.current_period_end || new Date(s.current_period_end).getTime() > Date.now()),
    ) ?? null;
  return { subscription: active, history: data ?? [] };
}

// ─── BOOKINGS ───────────────────────────────────────────────────

export async function listVenueBookings(input: {
  venueId: string;
  status?: "upcoming" | "confirmed" | "completed" | "cancelled" | "all";
  page?: number;
  limit?: number;
}) {
  const user = await requireUser();
  await assertCanManageVenue(user.id, input.venueId);

  const page = input.page ?? 1;
  const limit = input.limit ?? 20;
  const status = input.status ?? "all";

  let q = (supabase as any)
    .from("bookings")
    .select(
      "id, user_id, confirmation_code, party_size, starts_at, status, notes, created_at, cancelled_at, admin_notes",
      { count: "exact" },
    )
    .eq("venue_id", input.venueId)
    .order("starts_at", { ascending: false });

  if (status !== "all") q = q.eq("status", status);

  const from = (page - 1) * limit;
  q = q.range(from, from + limit - 1);

  const { data, error, count } = await q;
  if (error) throw new Error(error.message);

  const userIds = [...new Set((data ?? []).map((b: { user_id: string }) => b.user_id))];
  let profiles: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
  if (userIds.length) {
    const { data: profileData } = await (supabase as any)
      .from("profiles")
      .select("id, display_name")
      .in("id", userIds);
    profiles = Object.fromEntries(
      (profileData ?? []).map((p: { id: string; display_name: string | null }) => [
        p.id,
        { display_name: p.display_name, avatar_url: null },
      ]),
    );
  }

  return {
    bookings: (data ?? []).map((b: { user_id: string }) => ({
      ...b,
      passenger: profiles[b.user_id] ?? { display_name: null, avatar_url: null },
    })),
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

export async function getVenueBookingStats(venueId: string) {
  const user = await requireUser();
  await assertCanManageVenue(user.id, venueId);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  const { data: all } = await (supabase as any)
    .from("bookings")
    .select("status, party_size, starts_at")
    .eq("venue_id", venueId)
    .gte("created_at", thirtyDaysAgo);

  const bookings: Array<{ status: string; party_size?: number | null }> = all ?? [];
  const upcoming = bookings.filter((b) => b.status === "upcoming" || b.status === "confirmed");
  const completed = bookings.filter((b) => b.status === "completed");
  const cancelled = bookings.filter((b) => b.status === "cancelled");
  const totalGuests = bookings.reduce((sum: number, b) => sum + (b.party_size ?? 0), 0);

  return {
    total30d: bookings.length,
    upcoming: upcoming.length,
    completed: completed.length,
    cancelled: cancelled.length,
    totalGuests30d: totalGuests,
    avgPartySize: bookings.length ? +(totalGuests / bookings.length).toFixed(1) : 0,
  };
}

export async function updateBookingStatus(input: {
  venueId: string;
  bookingId: string;
  status: "confirmed" | "completed" | "cancelled";
  reason?: string;
}) {
  const user = await requireUser();
  await assertCanManageVenue(user.id, input.venueId);

  const updates: Record<string, unknown> = { status: input.status };
  if (input.status === "cancelled") {
    updates.cancelled_at = new Date().toISOString();
    updates.admin_notes = input.reason ?? "Cancelled by venue";
  }

  const { error } = await (supabase as any)
    .from("bookings")
    .update(updates)
    .eq("id", input.bookingId)
    .eq("venue_id", input.venueId);
  if (error) throw new Error(error.message);
  return { ok: true };
}

// ─── NOTIFICATIONS ──────────────────────────────────────────────

export async function listVenueNotifications(input: {
  venueId: string;
  unreadOnly?: boolean;
  limit?: number;
}) {
  const user = await requireUser();
  await assertCanManageVenue(user.id, input.venueId);

  let q = (supabase as any)
    .from("venue_notifications")
    .select("*")
    .eq("venue_id", input.venueId)
    .order("created_at", { ascending: false })
    .limit(input.limit ?? 20);

  if (input.unreadOnly) q = q.eq("is_read", false);

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  const { count } = await (supabase as any)
    .from("venue_notifications")
    .select("id", { count: "exact", head: true })
    .eq("venue_id", input.venueId)
    .eq("is_read", false);

  return { notifications: data ?? [], unreadCount: count ?? 0 };
}

export async function markNotificationsRead(input: {
  venueId: string;
  notificationIds?: string[];
}) {
  const user = await requireUser();
  await assertCanManageVenue(user.id, input.venueId);

  let q = (supabase as any)
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
}

// ─── MENU ───────────────────────────────────────────────────────

export async function listVenueMenu(venueId: string) {
  const user = await requireUser();
  await assertCanManageVenue(user.id, venueId);

  const { data: categories } = await (supabase as any)
    .from("venue_menu_categories")
    .select("*")
    .eq("venue_id", venueId)
    .order("sort_order");

  const { data: items } = await (supabase as any)
    .from("venue_menu_items")
    .select("*")
    .eq("venue_id", venueId)
    .order("sort_order");

  return { categories: categories ?? [], items: items ?? [] };
}

export async function upsertMenuCategory(input: {
  venueId: string;
  id?: string;
  name: string;
  sort_order?: number;
}) {
  const user = await requireUser();
  await assertCanManageVenue(user.id, input.venueId);

  if (input.id) {
    const { error } = await (supabase as any)
      .from("venue_menu_categories")
      .update({ name: input.name, sort_order: input.sort_order ?? 0 })
      .eq("id", input.id)
      .eq("venue_id", input.venueId);
    if (error) throw new Error(error.message);
    return { ok: true, id: input.id };
  }

  const { data, error } = await (supabase as any)
    .from("venue_menu_categories")
    .insert({ venue_id: input.venueId, name: input.name, sort_order: input.sort_order ?? 0 })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return { ok: true, id: data.id };
}

export async function deleteMenuCategory(input: { venueId: string; categoryId: string }) {
  const user = await requireUser();
  await assertCanManageVenue(user.id, input.venueId);
  const { error } = await (supabase as any)
    .from("venue_menu_categories")
    .delete()
    .eq("id", input.categoryId)
    .eq("venue_id", input.venueId);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function upsertMenuItem(input: {
  venueId: string;
  id?: string;
  category_id?: string | null;
  name: string;
  description?: string;
  price_cents: number;
  image_url?: string | null;
  is_available?: boolean;
  dietary_tags?: string[];
  sort_order?: number;
}) {
  const user = await requireUser();
  await assertCanManageVenue(user.id, input.venueId);

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
    const { error } = await (supabase as any)
      .from("venue_menu_items")
      .update(row)
      .eq("id", input.id)
      .eq("venue_id", input.venueId);
    if (error) throw new Error(error.message);
    return { ok: true, id: input.id };
  }

  const { data, error } = await (supabase as any)
    .from("venue_menu_items")
    .insert(row)
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return { ok: true, id: data.id };
}

export async function deleteMenuItem(input: { venueId: string; itemId: string }) {
  const user = await requireUser();
  await assertCanManageVenue(user.id, input.venueId);
  const { error } = await (supabase as any)
    .from("venue_menu_items")
    .delete()
    .eq("id", input.itemId)
    .eq("venue_id", input.venueId);
  if (error) throw new Error(error.message);
  return { ok: true };
}

// ─── PRE-ORDERS ─────────────────────────────────────────────────

export async function listVenuePreOrders(input: {
  venueId: string;
  status?: "pending" | "sent" | "confirmed" | "cancelled" | "all";
}) {
  const user = await requireUser();
  await assertCanManageVenue(user.id, input.venueId);

  let q = (supabase as any)
    .from("booking_pre_orders")
    .select(
      `
      *,
      booking:bookings(id, starts_at, party_size, confirmation_code),
      items:pre_order_items(*, menu_item:venue_menu_items(name, price_cents))
    `,
    )
    .eq("venue_id", input.venueId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (input.status && input.status !== "all") {
    q = q.eq("status", input.status);
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return { preOrders: data ?? [] };
}

export async function updatePreOrderStatus(input: {
  venueId: string;
  preOrderId: string;
  status: "confirmed" | "cancelled";
}) {
  const user = await requireUser();
  await assertCanManageVenue(user.id, input.venueId);

  const { error } = await (supabase as any)
    .from("booking_pre_orders")
    .update({ status: input.status, updated_at: new Date().toISOString() })
    .eq("id", input.preOrderId)
    .eq("venue_id", input.venueId);
  if (error) throw new Error(error.message);
  return { ok: true };
}

// ─── CORPORATE BOOKINGS ─────────────────────────────────────────

export async function listVenueCorporateBookings(input: {
  venueId: string;
  status?: "pending" | "approved" | "completed" | "cancelled" | "all";
  page?: number;
  limit?: number;
}) {
  const user = await requireUser();
  await assertCanManageVenue(user.id, input.venueId);

  const limit = input.limit ?? 20;
  const page = input.page ?? 1;
  const offset = (page - 1) * limit;

  let q = (supabase as any)
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
}

// ─── ANALYTICS ──────────────────────────────────────────────────

export async function getVenueAnalytics(input: { venueId: string; days?: number }) {
  const user = await requireUser();
  await assertCanManageVenue(user.id, input.venueId);

  const days = input.days ?? 30;
  const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);

  const { data: daily } = await (supabase as any)
    .from("venue_analytics_daily")
    .select("*")
    .eq("venue_id", input.venueId)
    .gte("date", since)
    .order("date", { ascending: true });

  const rows = daily ?? [];
  const totals = rows.reduce(
    (acc: any, r: any) => ({
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
}

// ─── ADMIN-ONLY ─────────────────────────────────────────────────

export async function getAdminPlatformStats() {
  const user = await requireUser();
  const admin = await isAdmin(user.id);
  if (!admin) throw new Error("Not authorized");

  const [venuesRes, usersRes, bookingsRes, claimsRes] = await Promise.all([
    (supabase as any).from("venues").select("id", { count: "exact", head: true }),
    (supabase as any).from("profiles").select("id", { count: "exact", head: true }),
    (supabase as any).from("bookings").select("id", { count: "exact", head: true }),
    (supabase as any)
      .from("venue_claims")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  return {
    totalVenues: venuesRes.count ?? 0,
    totalUsers: usersRes.count ?? 0,
    totalBookings: bookingsRes.count ?? 0,
    pendingClaims: claimsRes.count ?? 0,
  };
}

export async function getAdminRecentBookings() {
  const user = await requireUser();
  const admin = await isAdmin(user.id);
  if (!admin) throw new Error("Not authorized");

  const { data, error } = await (supabase as any)
    .from("bookings")
    .select("id, starts_at, party_size, status, confirmation_code, venue:venues(name, city)")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw new Error(error.message);
  return { bookings: data ?? [] };
}

export async function getAdminAllVenues() {
  const user = await requireUser();
  const admin = await isAdmin(user.id);
  if (!admin) throw new Error("Not authorized");

  const { data, error } = await (supabase as any)
    .from("venues")
    .select("id, name, city, neighborhood, claim_status, promotion_approved, hero_image_url")
    .order("name")
    .limit(200);
  if (error) throw new Error(error.message);
  return { venues: data ?? [] };
}
