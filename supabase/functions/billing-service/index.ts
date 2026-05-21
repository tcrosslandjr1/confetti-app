// ============================================================
// BillingService — Boost campaigns, coupons, business accounts,
//                  Confetti Fund, subscription billing
//
// Security model:
// - Every action requires a real user JWT.
// - "supabaseAdmin" is used only after we verify ownership (boost, coupon)
//   or after we verify admin role (fund operations).
// - User-input fields are validated via _shared/validate helpers.
// ============================================================

import { serve } from "../_shared/server.ts";
import {
  supabaseAdmin,
  supabaseForUser,
  corsHeaders,
  jsonResponse,
  errorResponse,
} from "../_shared/supabase-client.ts";
import {
  ValidationError,
  parseJson,
  requireString,
  requireUuid,
  requireNumber,
  optionalNumber,
  optionalString,
  requireEnum,
  optionalEnum,
} from "../_shared/validate.ts";

async function isCallerAdmin(authHeader: string): Promise<boolean> {
  const sb = supabaseForUser(authHeader);
  const { data, error } = await sb.rpc("is_admin");
  if (error) return false;
  return data === true;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders() });

  const url = new URL(req.url);
  const action = url.pathname.split("/").pop();
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return errorResponse("Unauthorized", 401);
  const sb = supabaseForUser(authHeader);
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return errorResponse("Unauthorized", 401);

  try {
    switch (action) {
      // ── Business Account ─────────────────────────────────
      case "get-business": {
        const { data, error } = await sb
          .from("business_accounts")
          .select("*")
          .eq("owner_user_id", user.id)
          .maybeSingle();
        if (error) return errorResponse("Lookup failed");
        return jsonResponse(data);
      }

      case "create-business": {
        const body = await parseJson(req);
        const businessName = requireString(body.business_name, "business_name", { min: 1, max: 120 });
        const contactName = optionalString(body.contact_name, "contact_name", { max: 120 }) ?? "";
        const contactEmail = optionalString(body.contact_email, "contact_email", { max: 254 }) ?? user.email ?? "";
        const tier = optionalEnum(body.tier, "tier", ["spotlight", "premium", "enterprise"] as const) ?? "spotlight";
        const city = optionalString(body.city, "city", { max: 80 }) ?? "";

        // credit_balance is server-controlled — never trust client input.
        // venue_ids is also assigned later via venue-claim flow, not on create.

        const { data, error } = await sb
          .from("business_accounts")
          .insert({
            owner_user_id: user.id,
            business_name: businessName,
            contact_name: contactName,
            contact_email: contactEmail,
            tier,
            credit_balance: 0,
            venue_ids: [],
            city,
          })
          .select()
          .single();
        if (error) return errorResponse("Create failed");
        return jsonResponse(data);
      }

      // ── Boost Campaigns ──────────────────────────────────
      case "create-boost": {
        const body = await parseJson(req);
        const venueId = requireUuid(body.venue_id, "venue_id");
        const boostStrength = optionalNumber(body.boost_strength, "boost_strength", { min: 1, max: 10, integer: true }) ?? 5;
        const dailyBudget = requireNumber(body.daily_credit_budget, "daily_credit_budget", { min: 1, max: 100_000, integer: true });
        const name = optionalString(body.name, "name", { max: 120 }) ?? "Boost Campaign";
        const startDate = optionalString(body.start_date, "start_date", { max: 32 });
        const endDate = optionalString(body.end_date, "end_date", { max: 32 });

        const { data: biz } = await sb
          .from("business_accounts")
          .select("id, credit_balance, venue_ids")
          .eq("owner_user_id", user.id)
          .single();

        if (!biz) return errorResponse("No business account found", 403);

        // Ownership: the venue must be claimed by this business.
        const venueIds = Array.isArray(biz.venue_ids) ? biz.venue_ids : [];
        if (!venueIds.includes(venueId)) {
          return errorResponse("Venue not owned by this business", 403);
        }

        if (biz.credit_balance < dailyBudget * 30) {
          return errorResponse("Insufficient credit balance");
        }

        const { data, error } = await supabaseAdmin
          .from("boost_campaigns")
          .insert({
            venue_id: venueId,
            business_id: biz.id,
            name,
            boost_strength: boostStrength,
            daily_credit_budget: dailyBudget,
            total_credits_spent: 0,
            start_date: startDate,
            end_date: endDate,
            status: "active",
          })
          .select()
          .single();
        if (error) return errorResponse("Create failed");
        return jsonResponse(data);
      }

      case "list-boosts": {
        const body = await parseJson(req);
        const venueId = requireUuid(body.venue_id, "venue_id");

        // Ownership: caller must be an admin OR own a business with this venue.
        const callerIsAdmin = await isCallerAdmin(authHeader);
        if (!callerIsAdmin) {
          const { data: biz } = await sb
            .from("business_accounts")
            .select("venue_ids")
            .eq("owner_user_id", user.id)
            .maybeSingle();
          const venueIds = Array.isArray(biz?.venue_ids) ? biz.venue_ids : [];
          if (!venueIds.includes(venueId)) {
            return errorResponse("Forbidden", 403);
          }
        }

        const { data, error } = await supabaseAdmin
          .from("boost_campaigns")
          .select("*")
          .eq("venue_id", venueId)
          .order("created_at", { ascending: false });
        if (error) return errorResponse("Lookup failed");
        return jsonResponse(data);
      }

      case "pause-boost": {
        const body = await parseJson(req);
        const campaignId = requireUuid(body.campaign_id, "campaign_id");

        // Ownership: caller must be admin OR own the business that owns the campaign.
        const callerIsAdmin = await isCallerAdmin(authHeader);
        if (!callerIsAdmin) {
          const { data: campaign } = await supabaseAdmin
            .from("boost_campaigns")
            .select("business_id")
            .eq("id", campaignId)
            .maybeSingle();
          if (!campaign) return errorResponse("Campaign not found", 404);

          const { data: biz } = await sb
            .from("business_accounts")
            .select("id")
            .eq("owner_user_id", user.id)
            .maybeSingle();
          if (!biz || biz.id !== campaign.business_id) {
            return errorResponse("Forbidden", 403);
          }
        }

        const { data, error } = await supabaseAdmin
          .from("boost_campaigns")
          .update({ status: "paused" })
          .eq("id", campaignId)
          .select()
          .single();
        if (error) return errorResponse("Update failed");
        return jsonResponse(data);
      }

      // ── Coupons ──────────────────────────────────────────
      case "create-coupon": {
        const body = await parseJson(req);
        const venueId = requireUuid(body.venue_id, "venue_id");
        const title = requireString(body.title, "title", { min: 1, max: 200 });
        const type = requireEnum(body.type, "type", ["percentage", "fixed", "bogo", "freebie"] as const);
        const value = requireNumber(body.value, "value", { min: 0, max: 1_000_000 });
        const minSpend = optionalNumber(body.min_spend, "min_spend", { min: 0, max: 1_000_000 }) ?? 0;
        const maxRedemptions = optionalNumber(body.max_redemptions, "max_redemptions", { min: 1, max: 1_000_000, integer: true });
        const terms = optionalString(body.terms, "terms", { max: 2000 });
        const expiresAt = optionalString(body.expires_at, "expires_at", { max: 64 });

        // Extra cap for percentages.
        if (type === "percentage" && value > 100) {
          return errorResponse("percentage value must be <= 100");
        }

        // Ownership: venue must be claimed by caller's business.
        const { data: biz } = await sb
          .from("business_accounts")
          .select("venue_ids")
          .eq("owner_user_id", user.id)
          .maybeSingle();
        const venueIds = Array.isArray(biz?.venue_ids) ? biz.venue_ids : [];
        if (!venueIds.includes(venueId)) {
          return errorResponse("Venue not owned by this business", 403);
        }

        const { data, error } = await supabaseAdmin
          .from("coupons")
          .insert({
            venue_id: venueId,
            title,
            type,
            value,
            min_spend: minSpend,
            max_redemptions: maxRedemptions,
            current_redemptions: 0,
            terms,
            expires_at: expiresAt,
            is_active: true,
          })
          .select()
          .single();
        if (error) return errorResponse("Create failed");
        return jsonResponse(data);
      }

      case "redeem-coupon": {
        const body = await parseJson(req);
        const couponId = requireUuid(body.coupon_id, "coupon_id");

        const { data: coupon } = await supabaseAdmin
          .from("coupons")
          .select("*")
          .eq("id", couponId)
          .eq("is_active", true)
          .single();

        if (!coupon) return errorResponse("Coupon not found or inactive");
        if (coupon.max_redemptions && coupon.current_redemptions >= coupon.max_redemptions) {
          return errorResponse("Coupon fully redeemed");
        }
        if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
          return errorResponse("Coupon expired");
        }

        const { data: existing } = await sb
          .from("coupon_redemptions")
          .select("id")
          .eq("coupon_id", couponId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (existing) return errorResponse("Already redeemed");

        const { data: redemption, error } = await sb
          .from("coupon_redemptions")
          .insert({
            coupon_id: couponId,
            user_id: user.id,
            venue_id: coupon.venue_id,
            status: "claimed",
          })
          .select()
          .single();
        if (error) return errorResponse("Redeem failed");

        await supabaseAdmin
          .from("coupons")
          .update({ current_redemptions: coupon.current_redemptions + 1 })
          .eq("id", couponId);

        return jsonResponse(redemption);
      }

      // ── Confetti Fund (admin-only) ───────────────────────
      case "fund-balance": {
        if (!await isCallerAdmin(authHeader)) return errorResponse("Forbidden", 403);
        const { data, error } = await supabaseAdmin
          .from("confetti_fund")
          .select("*")
          .single();
        if (error) return errorResponse("Lookup failed");
        return jsonResponse(data);
      }

      case "disburse-credit": {
        if (!await isCallerAdmin(authHeader)) return errorResponse("Forbidden", 403);

        const body = await parseJson(req);
        const amount = requireNumber(body.amount, "amount", { min: 0.01, max: 1_000_000 });
        const recipientId = requireUuid(body.recipient_id, "recipient_id");
        const description = optionalString(body.description, "description", { max: 500 });
        const referenceType = optionalString(body.reference_type, "reference_type", { max: 80 });

        const { data: fund } = await supabaseAdmin
          .from("confetti_fund")
          .select("*")
          .single();

        if (!fund || Number(fund.balance) < amount) {
          return errorResponse("Insufficient fund balance");
        }

        const newBalance = Number(fund.balance) - amount;

        const { data: txn, error } = await supabaseAdmin
          .from("fund_transactions")
          .insert({
            fund_id: fund.id,
            type: "disbursement",
            amount,
            user_id: recipientId,
            description: description ?? `Disbursement: ${referenceType ?? "manual"}`,
            balance_after: newBalance,
          })
          .select()
          .single();
        if (error) return errorResponse("Transaction failed");

        await supabaseAdmin
          .from("confetti_fund")
          .update({ balance: newBalance })
          .eq("id", fund.id);

        return jsonResponse(txn);
      }

      default:
        return errorResponse("Unknown action", 404);
    }
  } catch (err) {
    if (err instanceof ValidationError) return errorResponse(err.message, 400);
    console.error("[billing-service] unexpected error:", err);
    return errorResponse("Internal error", 500);
  }
});
