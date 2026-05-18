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

/* ------------------------- VENUE SEARCH ------------------------- */

export const searchVenuesForClaim = createServerFn({ method: "GET" })
  .inputValidator(z.object({ q: z.string().min(1).max(120) }))
  .handler(async ({ data }) => {
    const supabase = adminClient();
    const q = data.q.trim();
    const { data: rows, error } = await supabase
      .from("venues")
      .select(
        "id, name, city, neighborhood, hero_image_url, image_url, claim_status, claimed_by, website",
      )
      .or(`name.ilike.%${q}%,city.ilike.%${q}%,neighborhood.ilike.%${q}%`)
      .order("name")
      .limit(20);
    if (error) throw new Error(error.message);
    return { venues: rows ?? [] };
  });

/* ------------------------- MY CLAIMS ------------------------- */

export const listMyClaims = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = adminClient();
    const { data, error } = await supabase
      .from("venue_claims")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { claims: data ?? [] };
  });

/* ------------------------- SUBMIT CLAIM ------------------------- */

const ClaimInput = z.object({
  venueId: z.string().uuid().optional(),
  // For unlisted venues (Add New)
  proposedName: z.string().min(2).max(160).optional(),
  proposedPlaceId: z.string().max(200).optional(),
  proposedCity: z.string().max(120).optional(),
  proposedWebsite: z.string().url().max(300).optional(),
  // Verification
  method: z.enum(["social_tiktok", "social_instagram", "email_domain", "document"]),
  evidenceHandle: z.string().min(1).max(120).optional(),
  evidenceUrl: z.string().url().max(500).optional(),
  evidenceEmail: z.string().email().max(255).optional(),
  evidenceDomain: z.string().max(255).optional(),
  notes: z.string().max(2000).optional(),
});

export const submitVenueClaim = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => ClaimInput.parse(input))
  .handler(async ({ data, context }) => {
    const supabase = adminClient();
    if (!data.venueId && !data.proposedName) {
      throw new Error("Either venueId or proposedName is required");
    }

    // Social-match methods require a handle
    if (
      (data.method === "social_tiktok" || data.method === "social_instagram") &&
      !data.evidenceHandle
    ) {
      throw new Error("Social handle is required for this verification method");
    }

    const { data: row, error } = await supabase
      .from("venue_claims")
      .insert({
        user_id: context.userId,
        venue_id: data.venueId ?? null,
        proposed_name: data.proposedName ?? null,
        proposed_place_id: data.proposedPlaceId ?? null,
        proposed_city: data.proposedCity ?? null,
        proposed_website: data.proposedWebsite ?? null,
        method: data.method,
        evidence_handle: data.evidenceHandle ?? null,
        evidence_url: data.evidenceUrl ?? null,
        evidence_email: data.evidenceEmail ?? null,
        evidence_domain: data.evidenceDomain ?? null,
        notes: data.notes ?? null,
        status: "pending",
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { claim: row };
  });

/* ------------------------- ADMIN: LIST CLAIMS ------------------------- */

export const adminListVenueClaims = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      status: z.enum(["pending", "approved", "rejected", "all"]).default("pending"),
    }),
  )
  .handler(async ({ data, context }) => {
    const supabase = adminClient();
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roles) throw new Error("Admins only");

    let query = supabase
      .from("venue_claims")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status !== "all") query = query.eq("status", data.status);
    const { data: claims, error } = await query;
    if (error) throw new Error(error.message);

    const venueIds = Array.from(
      new Set((claims ?? []).map((c) => c.venue_id).filter(Boolean) as string[]),
    );
    const userIds = Array.from(
      new Set((claims ?? []).map((c) => c.user_id).filter(Boolean) as string[]),
    );

    const [venuesRes, profilesRes] = await Promise.all([
      venueIds.length
        ? supabase
            .from("venues")
            .select(
              "id, name, city, neighborhood, hero_image_url, image_url, claim_status, claimed_by, website",
            )
            .in("id", venueIds)
        : Promise.resolve({ data: [], error: null } as const),
      userIds.length
        ? supabase.from("profiles").select("id, display_name").in("id", userIds)
        : Promise.resolve({ data: [], error: null } as const),
    ]);

    const venueMap = new Map((venuesRes.data ?? []).map((v) => [v.id, v]));
    const profileMap = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));

    return {
      claims: (claims ?? []).map((c) => ({
        ...c,
        venue: c.venue_id ? (venueMap.get(c.venue_id) ?? null) : null,
        claimant: c.user_id ? (profileMap.get(c.user_id) ?? null) : null,
      })),
    };
  });

/* ------------------------- ADMIN: APPROVE CLAIM ------------------------- */

export const adminApproveVenueClaim = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      claimId: z.string().uuid(),
      adminNote: z.string().max(2000).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const supabase = adminClient();
    const { data: adminRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!adminRow) throw new Error("Admins only");

    const { data: claim, error: cErr } = await supabase
      .from("venue_claims")
      .select("*")
      .eq("id", data.claimId)
      .single();
    if (cErr || !claim) throw new Error(cErr?.message ?? "Claim not found");
    if (claim.status === "approved") return { claim };

    let venueId = claim.venue_id;
    // For proposed (new) venues, create a stub venue row.
    if (!venueId && claim.proposed_name) {
      const { data: newVenue, error: vErr } = await supabase
        .from("venues")
        .insert({
          name: claim.proposed_name,
          category: "nightlife",
          city: claim.proposed_city ?? null,
          website: claim.proposed_website ?? null,
          place_id: claim.proposed_place_id ?? null,
          claimed_by: claim.user_id,
          claim_status: "claimed",
          verified: true,
        })
        .select("id")
        .single();
      if (vErr) throw new Error(vErr.message);
      venueId = newVenue.id;
    } else if (venueId && claim.user_id) {
      const { error: vErr } = await supabase
        .from("venues")
        .update({
          claimed_by: claim.user_id,
          claim_status: "claimed",
          verified: true,
        })
        .eq("id", venueId);
      if (vErr) throw new Error(vErr.message);
    }

    const { data: updated, error: uErr } = await supabase
      .from("venue_claims")
      .update({
        status: "approved",
        admin_note: data.adminNote ?? null,
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
        venue_id: venueId,
      })
      .eq("id", data.claimId)
      .select("*")
      .single();
    if (uErr) throw new Error(uErr.message);
    return { claim: updated };
  });

/* ------------------------- ADMIN: REJECT CLAIM ------------------------- */

export const adminRejectVenueClaim = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      claimId: z.string().uuid(),
      adminNote: z.string().min(1).max(2000),
    }),
  )
  .handler(async ({ data, context }) => {
    const supabase = adminClient();
    const { data: adminRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!adminRow) throw new Error("Admins only");

    const { data: updated, error } = await supabase
      .from("venue_claims")
      .update({
        status: "rejected",
        admin_note: data.adminNote,
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.claimId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { claim: updated };
  });

/* ------------------------- BUSINESS OWNER ROLE ------------------------- */

export const grantBusinessOwnerRoleFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = adminClient();
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: context.userId, role: "business_owner" as never })
      .select("id");
    // Ignore unique violation (role already granted)
    if (error && !/duplicate|unique/i.test(error.message)) {
      throw new Error(error.message);
    }
    return { ok: true };
  });

export async function grantBusinessOwnerRole() {
  return grantBusinessOwnerRoleFn();
}

/* ------------------------- ADMIN: DECIDE ADVERTISER ------------------------- */

export const decideAdvertiserFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      advertiserId: z.string().uuid(),
      decision: z.enum(["approve", "reject"]),
      note: z.string().max(2000).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const supabase = adminClient();
    const { data: adminRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!adminRow) throw new Error("Admins only");

    const newStatus = data.decision === "approve" ? "active" : "rejected";
    const { data: adv, error } = await supabase
      .from("advertisers")
      .update({
        status: newStatus,
        review_note: data.note ?? null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: context.userId,
      } as never)
      .eq("id", data.advertiserId)
      .select("id, owner_id, business_name, contact_email")
      .single();
    if (error) throw new Error(error.message);

    // In-app notification for the owner
    try {
      const title =
        data.decision === "approve"
          ? "Your business is approved 🎉"
          : "Your business application was not approved";
      const body =
        data.decision === "approve"
          ? `Welcome to Confetti — open your portal to launch your first campaign.`
          : (data.note ?? "We couldn't approve your application at this time.");
      await supabase.from("notifications").insert({
        user_id: adv.owner_id,
        kind: data.decision === "approve" ? "business_approved" : "business_rejected",
        title,
        body,
        link: data.decision === "approve" ? "/advertise/portal" : "/advertise#signup",
      } as never);
    } catch {
      /* non-fatal */
    }

    return { advertiser: adv };
  });

/* ------------------------- OWNER: RESUBMIT ADVERTISER ------------------------- */

const ResubmitInput = z.object({
  business_name: z.string().min(2).max(160),
  website: z.string().url().max(300).optional().or(z.literal("")),
  contact_email: z.string().email().max(255),
  contact_phone: z.string().max(40).optional().or(z.literal("")),
  category: z.string().max(80).optional().or(z.literal("")),
  city: z.string().max(120).optional().or(z.literal("")),
  owner_name: z.string().max(160).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
  package_selected: z.string().max(40).optional().or(z.literal("")),
});

export const resubmitAdvertiserFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => ResubmitInput.parse(input))
  .handler(async ({ data, context }) => {
    const supabase = adminClient();

    const { data: existing, error: findErr } = await supabase
      .from("advertisers")
      .select("id, owner_id, status")
      .eq("owner_id", context.userId)
      .maybeSingle();
    if (findErr) throw new Error(findErr.message);
    if (!existing) throw new Error("No application found to resubmit");
    if (existing.status !== "rejected") {
      throw new Error("Only rejected applications can be resubmitted");
    }

    const patch = {
      business_name: data.business_name,
      website: data.website || null,
      contact_email: data.contact_email,
      contact_phone: data.contact_phone || null,
      category: data.category || null,
      city: data.city || null,
      owner_name: data.owner_name || null,
      notes: data.notes || null,
      package_selected: data.package_selected || null,
      status: "pending_review",
      review_note: null,
      reviewed_at: null,
      reviewed_by: null,
      submitted_at: new Date().toISOString(),
    } as never;

    const { data: updated, error } = await supabase
      .from("advertisers")
      .update(patch)
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    // Notify all admins about the resubmission
    try {
      const { data: admins } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      const rows = (admins ?? []).map((a: { user_id: string }) => ({
        user_id: a.user_id,
        kind: "business_resubmitted",
        title: "Business application resubmitted",
        body: `${data.business_name} updated their application and is awaiting review.`,
        link: "/admin/advertisers",
      }));
      if (rows.length) await supabase.from("notifications").insert(rows as never);
    } catch {
      /* non-fatal */
    }

    return { advertiser: updated };
  });

