// partner-admin — service-role-backed CRUD for the /admin/partners admin
// queue. Verified via a shared ADMIN_PIN secret in the request header so the
// frontend can drive the queue without giving anon the right to mutate
// boost_campaigns directly.
//
// Actions:
//   list_campaigns       — { status?: CampaignStatus | "all" }
//   approve_campaign     — { id }
//   reject_campaign      — { id }
//   pause_campaign       — { id }
//   resume_campaign      — { id }
//   create_demo_sponsor  — { venueId, campaignName?, targetVibes? }

import { serve } from "../_shared/server.ts";
import { jsonResponse, errorResponse, supabaseAdmin } from "../_shared/supabase-client.ts";
import { backfillVerifyVenues } from "../_shared/venue-discovery.ts";

interface Body {
  action: string;
  status?: string;
  id?: string;
  venueId?: string;
  city?: string;
  campaignName?: string;
  targetVibes?: string[];
  /** verify_backfill: how many rows to process per call (default 25, max 50). */
  batchSize?: number;
}

function isAdminAuthorized(req: Request): boolean {
  const expected = Deno.env.get("ADMIN_PIN");
  if (!expected) return false;
  const presented = req.headers.get("x-admin-pin");
  return !!presented && presented === expected;
}

async function listCampaigns(status?: string) {
  let q = supabaseAdmin
    .from("boost_campaigns")
    .select(
      "id,name,status,business_id,venue_id,boost_strength,daily_credit_budget,total_credits_spent,start_date,end_date,target_cities,target_vibes,target_categories,target_occasions,target_price_range,impressions,click_throughs,check_ins",
    )
    .order("start_date", { ascending: false })
    .limit(200);
  if (status && status !== "all") q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Array<{
    id: string;
    business_id: string;
    venue_id: string;
    [k: string]: unknown;
  }>;
  if (rows.length === 0) return [];

  const businessIds = [...new Set(rows.map((r) => r.business_id))];
  const venueIds = [...new Set(rows.map((r) => r.venue_id))];
  const [biz, ven] = await Promise.all([
    supabaseAdmin
      .from("business_accounts")
      .select("id,business_name,tier")
      .in("id", businessIds),
    supabaseAdmin
      .from("venues")
      .select("id,name,address,city")
      .in("id", venueIds),
  ]);
  const byBiz = new Map(
    ((biz.data ?? []) as Array<{ id: string; business_name: string; tier: string }>).map((b) => [b.id, b]),
  );
  const byVen = new Map(
    ((ven.data ?? []) as Array<{ id: string; name: string; address: string | null; city: string }>).map((v) => [v.id, v]),
  );
  return rows.map((r) => ({
    ...r,
    business_name: byBiz.get(r.business_id)?.business_name,
    business_tier: byBiz.get(r.business_id)?.tier,
    venue_name: byVen.get(r.venue_id)?.name,
    venue_address: byVen.get(r.venue_id)?.address ?? null,
    venue_city: byVen.get(r.venue_id)?.city,
  }));
}

async function updateStatus(id: string, status: string) {
  const { error } = await supabaseAdmin
    .from("boost_campaigns")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

async function createDemoSponsor(opts: {
  venueId?: string;
  city?: string;
  campaignName?: string;
  targetVibes?: string[];
}) {
  let venue: { id: string; name: string; city: string } | null = null;
  if (opts.venueId) {
    const { data, error } = await supabaseAdmin
      .from("venues")
      .select("id,name,city")
      .eq("id", opts.venueId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    venue = data as typeof venue;
  } else if (opts.city) {
    const { data, error } = await supabaseAdmin
      .from("venues")
      .select("id,name,city")
      .ilike("city", `%${opts.city}%`)
      .order("popularity_score", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    venue = data as typeof venue;
  }
  if (!venue) throw new Error("Venue not found");

  const demoEmail = "qa+demo-partner@confetti.local";
  let businessId: string;
  const { data: existing } = await supabaseAdmin
    .from("business_accounts")
    .select("id")
    .eq("contact_email", demoEmail)
    .maybeSingle();
  if (existing) {
    businessId = (existing as { id: string }).id;
  } else {
    const newId = crypto.randomUUID();
    const { error: insErr } = await supabaseAdmin
      .from("business_accounts")
      .insert({
        id: newId,
        business_name: "Confetti QA Partner (demo)",
        contact_email: demoEmail,
        contact_name: "QA Demo",
        city: (venue as { city: string }).city,
        tier: "partner",
        credit_balance: 1000,
        total_credits_used: 0,
        is_active: true,
      });
    if (insErr) throw new Error(`create_business: ${insErr.message}`);
    businessId = newId;
  }

  const campaignId = crypto.randomUUID();
  const start = new Date().toISOString();
  const end = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
  const { error: campErr } = await supabaseAdmin
    .from("boost_campaigns")
    .insert({
      id: campaignId,
      business_id: businessId,
      venue_id: (venue as { id: string }).id,
      name: opts.campaignName ?? `Demo Partner Pick — ${(venue as { name: string }).name}`,
      status: "active",
      boost_strength: 8,
      daily_credit_budget: 50,
      total_credits_spent: 0,
      start_date: start,
      end_date: end,
      target_cities: [(venue as { city: string }).city],
      target_vibes: opts.targetVibes ?? ["cocktails", "speakeasy", "rooftop", "outdoor"],
      target_categories: null,
      target_occasions: null,
      target_price_range: null,
    });
  if (campErr) throw new Error(`create_campaign: ${campErr.message}`);

  return {
    campaignId,
    businessId,
    venueId: (venue as { id: string }).id,
    venueName: (venue as { name: string }).name,
  };
}

serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") return jsonResponse({ ok: true });
    if (req.method !== "POST") return errorResponse("Method not allowed", 405);
    if (!isAdminAuthorized(req)) return errorResponse("Unauthorized", 401);

    let body: Body;
    try {
      body = (await req.json()) as Body;
    } catch {
      return errorResponse("Invalid JSON body");
    }

    switch (body.action) {
      case "list_campaigns": {
        const rows = await listCampaigns(body.status);
        return jsonResponse({ campaigns: rows });
      }
      case "approve_campaign":
        if (!body.id) return errorResponse("id required");
        await updateStatus(body.id, "active");
        return jsonResponse({ ok: true });
      case "reject_campaign":
        if (!body.id) return errorResponse("id required");
        await updateStatus(body.id, "draft");
        return jsonResponse({ ok: true });
      case "pause_campaign":
        if (!body.id) return errorResponse("id required");
        await updateStatus(body.id, "paused");
        return jsonResponse({ ok: true });
      case "resume_campaign":
        if (!body.id) return errorResponse("id required");
        await updateStatus(body.id, "active");
        return jsonResponse({ ok: true });
      case "verify_backfill": {
        const result = await backfillVerifyVenues(
          Math.max(1, Math.min(body.batchSize ?? 25, 50)),
        );
        return jsonResponse(result);
      }
      case "verify_status": {
        const { count: remaining } = await supabaseAdmin
          .from("venues")
          .select("id", { count: "exact", head: true })
          .or("is_verified.is.null,is_verified.eq.false");
        const { count: verified } = await supabaseAdmin
          .from("venues")
          .select("id", { count: "exact", head: true })
          .eq("is_verified", true);
        return jsonResponse({ remaining: remaining ?? 0, verified: verified ?? 0 });
      }
      case "create_demo_sponsor": {
        if (!body.venueId && !body.city) return errorResponse("venueId or city required");
        const result = await createDemoSponsor({
          venueId: body.venueId,
          city: body.city,
          campaignName: body.campaignName,
          targetVibes: body.targetVibes,
        });
        return jsonResponse(result);
      }
      default:
        return errorResponse("Unknown action", 400);
    }
  } catch (err) {
    console.error("[partner-admin] uncaught:", (err as Error).stack ?? err);
    return errorResponse(
      `Unhandled: ${(err as Error).message ?? String(err)}`,
      500,
    );
  }
});
