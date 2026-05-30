/**
 * Client-side replacements for every server function in
 * business-onboarding.functions.ts.
 *
 * Uses the anon-key Supabase client + RLS so these work in SPA mode
 * without SUPABASE_SERVICE_ROLE_KEY.
 */

import { supabase } from "@/integrations/supabase/client";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

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
  return !!data;
}

/* ------------------------------------------------------------------ */
/*  VENUE SEARCH  (public — no auth required)                          */
/* ------------------------------------------------------------------ */

export async function searchVenuesForClaim(q: string) {
  const trimmed = q.trim();
  if (!trimmed || trimmed.length > 120) throw new Error("Query must be 1-120 chars");

  const { data: rows, error } = await (supabase as any)
    .from("venues")
    .select(
      "id, name, city, neighborhood, hero_image_url, image_url, claim_status, claimed_by, website",
    )
    .or(`name.ilike.%${trimmed}%,city.ilike.%${trimmed}%,neighborhood.ilike.%${trimmed}%`)
    .order("name")
    .limit(20);
  if (error) throw new Error(error.message);
  return { venues: rows ?? [] };
}

/* ------------------------------------------------------------------ */
/*  MY CLAIMS                                                          */
/* ------------------------------------------------------------------ */

export async function listMyClaims() {
  const user = await requireUser();
  const { data, error } = await (supabase as any)
    .from("venue_claims")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return { claims: data ?? [] };
}

/* ------------------------------------------------------------------ */
/*  SUBMIT CLAIM                                                       */
/* ------------------------------------------------------------------ */

export async function submitVenueClaim(input: {
  venueId?: string;
  proposedName?: string;
  proposedPlaceId?: string;
  proposedCity?: string;
  proposedWebsite?: string;
  method: "social_tiktok" | "social_instagram" | "email_domain" | "document";
  evidenceHandle?: string;
  evidenceUrl?: string;
  evidenceEmail?: string;
  evidenceDomain?: string;
  notes?: string;
}) {
  const user = await requireUser();

  if (!input.venueId && !input.proposedName) {
    throw new Error("Either venueId or proposedName is required");
  }
  if (
    (input.method === "social_tiktok" || input.method === "social_instagram") &&
    !input.evidenceHandle
  ) {
    throw new Error("Social handle is required for this verification method");
  }

  const { data: row, error } = await (supabase as any)
    .from("venue_claims")
    .insert({
      user_id: user.id,
      venue_id: input.venueId ?? null,
      proposed_name: input.proposedName ?? null,
      proposed_place_id: input.proposedPlaceId ?? null,
      proposed_city: input.proposedCity ?? null,
      proposed_website: input.proposedWebsite ?? null,
      method: input.method,
      evidence_handle: input.evidenceHandle ?? null,
      evidence_url: input.evidenceUrl ?? null,
      evidence_email: input.evidenceEmail ?? null,
      evidence_domain: input.evidenceDomain ?? null,
      notes: input.notes ?? null,
      status: "pending",
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return { claim: row };
}

/* ------------------------------------------------------------------ */
/*  ADMIN: LIST CLAIMS                                                 */
/* ------------------------------------------------------------------ */

export async function adminListVenueClaims(
  status: "pending" | "approved" | "rejected" | "all" = "pending",
) {
  const user = await requireUser();
  if (!(await isAdmin(user.id))) throw new Error("Admins only");

  let query = (supabase as any)
    .from("venue_claims")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status !== "all") query = query.eq("status", status);

  const { data: claims, error } = await query;
  if (error) throw new Error(error.message);

  const venueIds = Array.from(
    new Set((claims ?? []).map((c: any) => c.venue_id).filter(Boolean) as string[]),
  );
  const userIds = Array.from(
    new Set((claims ?? []).map((c: any) => c.user_id).filter(Boolean) as string[]),
  );

  const [venuesRes, profilesRes] = await Promise.all([
    venueIds.length
      ? (supabase as any)
          .from("venues")
          .select(
            "id, name, city, neighborhood, hero_image_url, image_url, claim_status, claimed_by, website",
          )
          .in("id", venueIds)
      : Promise.resolve({ data: [], error: null }),
    userIds.length
      ? (supabase as any).from("profiles").select("id, display_name").in("id", userIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const venueMap = new Map((venuesRes.data ?? []).map((v: any) => [v.id, v]));
  const profileMap = new Map((profilesRes.data ?? []).map((p: any) => [p.id, p]));

  return {
    claims: (claims ?? []).map((c: any) => ({
      ...c,
      venue: c.venue_id ? (venueMap.get(c.venue_id) ?? null) : null,
      claimant: c.user_id ? (profileMap.get(c.user_id) ?? null) : null,
    })),
  };
}

/* ------------------------------------------------------------------ */
/*  ADMIN: APPROVE CLAIM                                               */
/* ------------------------------------------------------------------ */

export async function adminApproveVenueClaim(input: { claimId: string; adminNote?: string }) {
  const user = await requireUser();
  if (!(await isAdmin(user.id))) throw new Error("Admins only");

  const { data: claim, error: cErr } = await (supabase as any)
    .from("venue_claims")
    .select("*")
    .eq("id", input.claimId)
    .single();
  if (cErr || !claim) throw new Error(cErr?.message ?? "Claim not found");
  if (claim.status === "approved") return { claim };

  let venueId = claim.venue_id;

  // For proposed (new) venues, create a stub venue row.
  if (!venueId && claim.proposed_name) {
    const { data: newVenue, error: vErr } = await (supabase as any)
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
    const { error: vErr } = await (supabase as any)
      .from("venues")
      .update({
        claimed_by: claim.user_id,
        claim_status: "claimed",
        verified: true,
      })
      .eq("id", venueId);
    if (vErr) throw new Error(vErr.message);
  }

  const { data: updated, error: uErr } = await (supabase as any)
    .from("venue_claims")
    .update({
      status: "approved",
      admin_note: input.adminNote ?? null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      venue_id: venueId,
    })
    .eq("id", input.claimId)
    .select("*")
    .single();
  if (uErr) throw new Error(uErr.message);
  return { claim: updated };
}

/* ------------------------------------------------------------------ */
/*  ADMIN: REJECT CLAIM                                                */
/* ------------------------------------------------------------------ */

export async function adminRejectVenueClaim(input: { claimId: string; adminNote: string }) {
  const user = await requireUser();
  if (!(await isAdmin(user.id))) throw new Error("Admins only");

  const { data: updated, error } = await (supabase as any)
    .from("venue_claims")
    .update({
      status: "rejected",
      admin_note: input.adminNote,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", input.claimId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return { claim: updated };
}

/* ------------------------------------------------------------------ */
/*  BUSINESS OWNER ROLE                                                */
/* ------------------------------------------------------------------ */

export async function grantBusinessOwnerRole() {
  const user = await requireUser();
  const { error } = await (supabase as any)
    .from("user_roles")
    .insert({ user_id: user.id, role: "business_owner" })
    .select("id");
  // Ignore unique violation (role already granted)
  if (error && !/duplicate|unique/i.test(error.message)) {
    throw new Error(error.message);
  }
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/*  ADMIN: DECIDE ADVERTISER                                           */
/* ------------------------------------------------------------------ */

export async function decideAdvertiser(input: {
  advertiserId: string;
  decision: "approve" | "reject";
  note?: string;
}) {
  const user = await requireUser();
  if (!(await isAdmin(user.id))) throw new Error("Admins only");

  const newStatus = input.decision === "approve" ? "active" : "rejected";
  const { data: adv, error } = await (supabase as any)
    .from("advertisers")
    .update({
      status: newStatus,
      review_note: input.note ?? null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq("id", input.advertiserId)
    .select("id, owner_id, business_name, contact_email")
    .single();
  if (error) throw new Error(error.message);

  // In-app notification for the owner
  try {
    const title =
      input.decision === "approve"
        ? "Your business is approved 🎉"
        : "Your business application was not approved";
    const body =
      input.decision === "approve"
        ? "Welcome to Confetti — open your portal to launch your first campaign."
        : (input.note ?? "We couldn't approve your application at this time.");
    await (supabase as any).from("notifications").insert({
      user_id: adv.owner_id,
      kind: input.decision === "approve" ? "business_approved" : "business_rejected",
      title,
      body,
      link: input.decision === "approve" ? "/business/dashboard" : "/for-business",
    });
  } catch {
    /* non-fatal */
  }

  return { advertiser: adv };
}

/* ------------------------------------------------------------------ */
/*  OWNER: RESUBMIT ADVERTISER                                        */
/* ------------------------------------------------------------------ */

export async function resubmitAdvertiser(input: {
  business_name: string;
  website?: string;
  contact_email: string;
  contact_phone?: string;
  category?: string;
  city?: string;
  owner_name?: string;
  notes?: string;
  package_selected?: string;
}) {
  const user = await requireUser();

  const { data: existing, error: findErr } = await (supabase as any)
    .from("advertisers")
    .select("id, owner_id, status")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (findErr) throw new Error(findErr.message);
  if (!existing) throw new Error("No application found to resubmit");
  if (existing.status !== "rejected") {
    throw new Error("Only rejected applications can be resubmitted");
  }

  const { data: updated, error } = await (supabase as any)
    .from("advertisers")
    .update({
      business_name: input.business_name,
      website: input.website || null,
      contact_email: input.contact_email,
      contact_phone: input.contact_phone || null,
      category: input.category || null,
      city: input.city || null,
      owner_name: input.owner_name || null,
      notes: input.notes || null,
      package_selected: input.package_selected || null,
      status: "pending_review",
      review_note: null,
      reviewed_at: null,
      reviewed_by: null,
      submitted_at: new Date().toISOString(),
    })
    .eq("id", existing.id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  // Notify all admins about the resubmission
  try {
    const { data: admins } = await (supabase as any)
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");
    const rows = (admins ?? []).map((a: { user_id: string }) => ({
      user_id: a.user_id,
      kind: "business_resubmitted",
      title: "Business application resubmitted",
      body: `${input.business_name} updated their application and is awaiting review.`,
      link: "/business/dashboard",
    }));
    if (rows.length) await (supabase as any).from("notifications").insert(rows);
  } catch {
    /* non-fatal */
  }

  return { advertiser: updated };
}
