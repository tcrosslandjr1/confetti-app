import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

function adminClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function assertAdmin(userId: string) {
  const supabase = adminClient();
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Admins only");
}

/* ----------------------------- EVENTS ----------------------------- */

const EventListInput = z.object({
  status: z
    .enum(["pending_review", "published", "rejected", "all"])
    .default("pending_review"),
  city: z.string().max(80).optional(),
  query: z.string().max(120).optional(),
  page: z.number().int().min(1).max(500).default(1),
  pageSize: z.number().int().min(5).max(50).default(10),
});

export const adminListEventsForModeration = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => EventListInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const supabase = adminClient();

    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;

    let q = supabase
      .from("events")
      .select(
        "id, title, city, neighborhood, category, venue_name, starts_at, image_url, status, source, created_at",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (data.status !== "all") q = q.eq("status", data.status);
    if (data.city) q = q.ilike("city", `%${data.city}%`);
    if (data.query) {
      const term = data.query.replace(/[%,]/g, " ").trim();
      if (term) q = q.or(`title.ilike.%${term}%,venue_name.ilike.%${term}%`);
    }

    const { data: rows, error, count } = await q;
    if (error) throw new Error(error.message);

    return {
      events: rows ?? [],
      total: count ?? 0,
      page: data.page,
      pageSize: data.pageSize,
    };
  });

const EventDecideInput = z.object({
  eventId: z.string().uuid(),
  decision: z.enum(["approve", "reject"]),
  note: z.string().max(2000).optional(),
});

export const adminDecideEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => EventDecideInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const supabase = adminClient();

    const { data: existing } = await supabase
      .from("events")
      .select("id, title")
      .eq("id", data.eventId)
      .maybeSingle();
    if (!existing) throw new Error("Event not found");

    const newStatus = data.decision === "approve" ? "published" : "rejected";
    const { error } = await supabase
      .from("events")
      .update({ status: newStatus })
      .eq("id", data.eventId);
    if (error) throw new Error(error.message);

    await supabase.from("admin_audit_log").insert({
      reviewer_id: context.userId,
      action: data.decision === "approve" ? "event_approve" : "event_reject",
      entity_type: "event",
      entity_id: data.eventId,
      entity_label: existing.title,
      note: data.note ?? null,
      metadata: { status: newStatus },
    } as never);

    return { ok: true };
  });

/* ----------------------------- VENUES ----------------------------- */

const VenueListInput = z.object({
  status: z.enum(["pending", "approved", "rejected", "all"]).default("pending"),
  city: z.string().max(80).optional(),
  category: z.string().max(80).optional(),
  query: z.string().max(120).optional(),
  page: z.number().int().min(1).max(500).default(1),
  pageSize: z.number().int().min(5).max(50).default(10),
});

export const adminListVenuesForModeration = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => VenueListInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const supabase = adminClient();

    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;

    // Rejected venues are tracked via audit log (no schema column).
    let rejectedIds: string[] = [];
    if (data.status === "rejected" || data.status === "pending") {
      const { data: rj } = await supabase
        .from("admin_audit_log")
        .select("entity_id, created_at")
        .eq("entity_type", "venue")
        .eq("action", "venue_reject")
        .order("created_at", { ascending: false })
        .limit(500);
      rejectedIds = Array.from(
        new Set(((rj ?? []) as { entity_id: string | null }[])
          .map((r) => r.entity_id)
          .filter((x): x is string => !!x)),
      );
    }

    let q = supabase
      .from("venues")
      .select(
        "id, name, city, neighborhood, category, hero_image_url, image_url, verified, claim_status, created_at",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (data.status === "approved") q = q.eq("verified", true);
    if (data.status === "pending") {
      q = q.eq("verified", false);
      if (rejectedIds.length) q = q.not("id", "in", `(${rejectedIds.join(",")})`);
    }
    if (data.status === "rejected") {
      if (!rejectedIds.length) {
        return { venues: [], total: 0, page: data.page, pageSize: data.pageSize };
      }
      q = q.in("id", rejectedIds);
    }
    if (data.city) q = q.ilike("city", `%${data.city}%`);
    if (data.category) q = q.eq("category", data.category);
    if (data.query) {
      const term = data.query.replace(/[%,]/g, " ").trim();
      if (term) q = q.or(`name.ilike.%${term}%,neighborhood.ilike.%${term}%`);
    }

    const { data: rows, error, count } = await q;
    if (error) throw new Error(error.message);

    return {
      venues: rows ?? [],
      total: count ?? 0,
      page: data.page,
      pageSize: data.pageSize,
    };
  });

const VenueDecideInput = z.object({
  venueId: z.string().uuid(),
  decision: z.enum(["approve", "reject"]),
  note: z.string().max(2000).optional(),
});

export const adminDecideVenue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => VenueDecideInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const supabase = adminClient();

    const { data: existing } = await supabase
      .from("venues")
      .select("id, name")
      .eq("id", data.venueId)
      .maybeSingle();
    if (!existing) throw new Error("Venue not found");

    const verified = data.decision === "approve";
    const { error } = await supabase
      .from("venues")
      .update({ verified })
      .eq("id", data.venueId);
    if (error) throw new Error(error.message);

    await supabase.from("admin_audit_log").insert({
      reviewer_id: context.userId,
      action: data.decision === "approve" ? "venue_approve" : "venue_reject",
      entity_type: "venue",
      entity_id: data.venueId,
      entity_label: existing.name,
      note: data.note ?? null,
      metadata: { verified },
    } as never);

    return { ok: true };
  });
