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

/* ============================================================
   PROMOTER PROFILE
   ============================================================ */

export const getMyPromoterProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = adminClient();
    const { data } = await supabase
      .from("promoters")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    return { promoter: data ?? null };
  });

const ProfileInput = z.object({
  display_name: z.string().trim().min(2).max(120),
  bio: z.string().trim().max(2000).optional().nullable(),
  avatar_url: z.string().url().max(500).optional().nullable(),
  niche: z.array(z.string().min(1).max(40)).max(10).default([]),
  cities: z.array(z.string().min(1).max(60)).max(10).default([]),
  rate_card: z.record(z.string(), z.number().int().min(0).max(100_000_00)).default({}),
  audience: z.record(z.string(), z.number().int().min(0).max(1_000_000_000)).default({}),
  sample_links: z.array(z.string().url().max(500)).max(20).default([]),
});

export const upsertMyPromoterProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ProfileInput.parse(d))
  .handler(async ({ data, context }) => {
    const supabase = adminClient();
    const { data: existing } = await supabase
      .from("promoters")
      .select("id, status")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (existing) {
      const { data: updated, error } = await supabase
        .from("promoters")
        .update({ ...data })
        .eq("id", existing.id)
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return { promoter: updated };
    }
    const { data: inserted, error } = await supabase
      .from("promoters")
      .insert({ ...data, user_id: context.userId, status: "pending" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { promoter: inserted };
  });

/* ============================================================
   PUBLIC BROWSE
   ============================================================ */

const BrowseInput = z.object({
  city: z.string().max(60).optional(),
  niche: z.string().max(40).optional(),
  q: z.string().max(120).optional(),
});

export const browsePromoters = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => BrowseInput.parse(d ?? {}))
  .handler(async ({ data }) => {
    const supabase = adminClient();
    let qb = supabase
      .from("promoters")
      .select(
        "id, display_name, bio, avatar_url, niche, cities, rate_card, audience, rating, jobs_completed",
      )
      .eq("status", "approved")
      .order("rating", { ascending: false, nullsFirst: false })
      .limit(60);
    if (data.city) qb = qb.contains("cities", [data.city]);
    if (data.niche) qb = qb.contains("niche", [data.niche]);
    if (data.q) qb = qb.ilike("display_name", `%${data.q}%`);
    const { data: rows, error } = await qb;
    if (error) throw new Error(error.message);
    return { promoters: rows ?? [] };
  });

export const getPromoter = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const supabase = adminClient();
    const { data: row, error } = await supabase
      .from("promoters")
      .select(
        "id, display_name, bio, avatar_url, niche, cities, rate_card, audience, sample_links, rating, jobs_completed, status",
      )
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row || row.status !== "approved") throw new Error("Promoter not found");
    return { promoter: row };
  });

/* ============================================================
   JOBS — BUSINESS SIDE
   ============================================================ */

const HireInput = z.object({
  promoter_id: z.string().uuid(),
  advertiser_id: z.string().uuid(),
  venue_id: z.string().uuid().optional().nullable(),
  title: z.string().trim().min(3).max(160),
  brief: z.string().trim().min(20).max(4000),
  deliverables: z
    .array(
      z.object({
        type: z.string().min(1).max(40),
        platform: z.string().min(1).max(40),
        description: z.string().max(500).optional(),
      }),
    )
    .min(1)
    .max(10),
  amount_cents: z.number().int().min(100).max(100_000_00),
  due_at: z.string().datetime().optional().nullable(),
});

export const createJobOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => HireInput.parse(d))
  .handler(async ({ data, context }) => {
    const supabase = adminClient();
    const { data: adv } = await supabase
      .from("advertisers")
      .select("id, owner_id")
      .eq("id", data.advertiser_id)
      .maybeSingle();
    if (!adv || adv.owner_id !== context.userId)
      throw new Error("Not authorized for this advertiser");

    const { data: row, error } = await supabase
      .from("promoter_jobs")
      .insert({
        promoter_id: data.promoter_id,
        advertiser_id: data.advertiser_id,
        venue_id: data.venue_id ?? null,
        title: data.title,
        brief: data.brief,
        deliverables: data.deliverables,
        amount_cents: data.amount_cents,
        platform_fee_bps: 1000,
        due_at: data.due_at ?? null,
        status: "offered",
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { job: row };
  });

export const listBusinessJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = adminClient();
    const { data: advs } = await supabase
      .from("advertisers")
      .select("id")
      .eq("owner_id", context.userId);
    const advIds = (advs ?? []).map((a) => a.id);
    if (advIds.length === 0) return { jobs: [] };
    const { data, error } = await supabase
      .from("promoter_jobs")
      .select("*, promoters(display_name, avatar_url)")
      .in("advertiser_id", advIds)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { jobs: data ?? [] };
  });

/* ============================================================
   JOBS — PROMOTER SIDE
   ============================================================ */

export const listMyPromoterJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = adminClient();
    const { data: p } = await supabase
      .from("promoters")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!p) return { jobs: [] };
    const { data, error } = await supabase
      .from("promoter_jobs")
      .select(
        "*, advertisers(business_name), promoter_submissions(id, content_url, verification_status, posted_at)",
      )
      .eq("promoter_id", p.id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { jobs: data ?? [] };
  });

const JobActionInput = z.object({
  job_id: z.string().uuid(),
  action: z.enum(["accept", "decline", "mark_in_progress", "cancel"]),
});

export const promoterJobAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => JobActionInput.parse(d))
  .handler(async ({ data, context }) => {
    const supabase = adminClient();
    const { data: job } = await supabase
      .from("promoter_jobs")
      .select("*, promoters!inner(user_id)")
      .eq("id", data.job_id)
      .maybeSingle();
    if (!job || (job as any).promoters.user_id !== context.userId)
      throw new Error("Not authorized");

    const nowIso = new Date().toISOString();
    const updates =
      data.action === "accept"
        ? { status: "accepted" as const, accepted_at: nowIso }
        : data.action === "decline"
          ? { status: "cancelled" as const, cancelled_at: nowIso }
          : data.action === "mark_in_progress"
            ? { status: "in_progress" as const }
            : { status: "cancelled" as const, cancelled_at: nowIso };

    const { data: updated, error } = await supabase
      .from("promoter_jobs")
      .update(updates)
      .eq("id", data.job_id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { job: updated };
  });

/* ============================================================
   SUBMISSIONS
   ============================================================ */

const SubmissionInput = z.object({
  job_id: z.string().uuid(),
  content_url: z.string().url().max(500),
  platform: z.enum(["instagram", "tiktok", "youtube", "twitter", "other"]),
  caption: z.string().max(2000).optional().nullable(),
  posted_at: z.string().datetime().optional().nullable(),
  boarding_pass_itinerary_id: z.string().uuid(),
  boarding_pass_visible: z.boolean(),
});

export const submitContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SubmissionInput.parse(d))
  .handler(async ({ data, context }) => {
    const supabase = adminClient();
    const { data: job } = await supabase
      .from("promoter_jobs")
      .select("id, promoter_id, promoters!inner(user_id)")
      .eq("id", data.job_id)
      .maybeSingle();
    if (!job || (job as any).promoters.user_id !== context.userId)
      throw new Error("Not authorized");

    // Verify the boarding pass belongs to the same promoter user
    const { data: itin } = await supabase
      .from("itineraries")
      .select("id, user_id")
      .eq("id", data.boarding_pass_itinerary_id)
      .maybeSingle();
    if (!itin || itin.user_id !== context.userId) {
      throw new Error("Boarding pass must be a Confetti trip you planned.");
    }

    const { data: row, error } = await supabase
      .from("promoter_submissions")
      .insert({
        job_id: data.job_id,
        content_url: data.content_url,
        platform: data.platform,
        caption: data.caption ?? null,
        posted_at: data.posted_at ?? null,
        boarding_pass_visible: data.boarding_pass_visible,
        verification_status: "pending",
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    await supabase
      .from("promoter_jobs")
      .update({
        boarding_pass_itinerary_id: data.boarding_pass_itinerary_id,
        status: "delivered",
        delivered_at: new Date().toISOString(),
      })
      .eq("id", data.job_id);

    return { submission: row };
  });

/* ============================================================
   ADMIN VERIFICATION
   ============================================================ */

function assertAdmin(supabase: ReturnType<typeof adminClient>, userId: string) {
  return supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle()
    .then(({ data }) => {
      if (!data) throw new Error("Admin only");
    });
}

export const adminListPendingSubmissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = adminClient();
    await assertAdmin(supabase, context.userId);
    const { data, error } = await supabase
      .from("promoter_submissions")
      .select(
        "*, promoter_jobs(id, title, amount_cents, platform_fee_bps, promoter_id, advertiser_id, advertisers(business_name), promoters(display_name))",
      )
      .eq("verification_status", "pending")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { submissions: data ?? [] };
  });

const VerifyInput = z.object({
  submission_id: z.string().uuid(),
  decision: z.enum(["approved", "rejected", "needs_revision"]),
  review_notes: z.string().max(2000).optional().nullable(),
});

export const adminVerifySubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => VerifyInput.parse(d))
  .handler(async ({ data, context }) => {
    const supabase = adminClient();
    await assertAdmin(supabase, context.userId);

    const { data: sub, error: subErr } = await supabase
      .from("promoter_submissions")
      .update({
        verification_status: data.decision,
        review_notes: data.review_notes ?? null,
        reviewer_id: context.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.submission_id)
      .select("*, promoter_jobs(*)")
      .single();
    if (subErr) throw new Error(subErr.message);

    if (data.decision === "approved") {
      const job = (sub as any).promoter_jobs;
      const net = Math.floor((job.amount_cents * (10000 - job.platform_fee_bps)) / 10000);

      await supabase
        .from("promoter_jobs")
        .update({ status: "verified", verified_at: new Date().toISOString() })
        .eq("id", job.id);

      // Create pending payout (Stripe Connect transfer to be triggered separately)
      await supabase.from("promoter_payouts").insert({
        promoter_id: job.promoter_id,
        job_id: job.id,
        amount_cents: net,
        currency: job.currency,
        status: "pending",
      });

      await supabase
        .from("promoters")
        .update({
          jobs_completed:
            (
              await supabase
                .from("promoters")
                .select("jobs_completed")
                .eq("id", job.promoter_id)
                .single()
            ).data!.jobs_completed + 1,
        })
        .eq("id", job.promoter_id);
    }

    return { submission: sub };
  });

export const adminListPromoters = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = adminClient();
    await assertAdmin(supabase, context.userId);
    const { data, error } = await supabase
      .from("promoters")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { promoters: data ?? [] };
  });

const ApproveInput = z.object({
  promoter_id: z.string().uuid(),
  status: z.enum(["approved", "suspended", "rejected"]),
  admin_notes: z.string().max(1000).optional().nullable(),
});

export const adminSetPromoterStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ApproveInput.parse(d))
  .handler(async ({ data, context }) => {
    const supabase = adminClient();
    await assertAdmin(supabase, context.userId);
    const { data: row, error } = await supabase
      .from("promoters")
      .update({
        status: data.status,
        admin_notes: data.admin_notes ?? null,
        verified_at: data.status === "approved" ? new Date().toISOString() : null,
      })
      .eq("id", data.promoter_id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { promoter: row };
  });
