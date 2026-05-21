// ============================================================
// CorporateService — Company onboarding, teams, policies, bookings
//
// Security model:
// - Every action requires a real user JWT.
// - Company actions require caller to be the company owner OR a team
//   admin of any team under that company.
// - Team actions require caller to be a team admin of that team.
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
  pickKeys,
  requireString,
  requireUuid,
  requireNumber,
  optionalNumber,
  optionalString,
  optionalBool,
  requireEnum,
  optionalEnum,
  requireObject,
} from "../_shared/validate.ts";

type AccessLevel = "none" | "team_member" | "team_admin" | "company_owner";

async function checkCompanyAccess(userId: string, companyId: string): Promise<AccessLevel> {
  const { data: company } = await supabaseAdmin
    .from("corporate_companies")
    .select("owner_user_id")
    .eq("id", companyId)
    .maybeSingle();
  if (!company) return "none";
  if (company.owner_user_id === userId) return "company_owner";

  // Check team admin membership against any team in the company.
  const { data: teams } = await supabaseAdmin
    .from("corporate_team_members")
    .select("role, corporate_teams!inner(company_id)")
    .eq("user_id", userId);

  if (Array.isArray(teams)) {
    for (const t of teams as Array<{ role: string; corporate_teams: { company_id: string } }>) {
      if (t.corporate_teams?.company_id === companyId) {
        if (t.role === "admin") return "team_admin";
        return "team_member";
      }
    }
  }
  return "none";
}

async function checkTeamAccess(userId: string, teamId: string): Promise<AccessLevel> {
  const { data: m } = await supabaseAdmin
    .from("corporate_team_members")
    .select("role, corporate_teams!inner(company_id, owner_user_id:corporate_companies!inner(owner_user_id))")
    .eq("user_id", userId)
    .eq("team_id", teamId)
    .maybeSingle();
  if (m) {
    return (m as { role: string }).role === "admin" ? "team_admin" : "team_member";
  }
  // Caller may be the company owner — check that path.
  const { data: team } = await supabaseAdmin
    .from("corporate_teams")
    .select("company_id, corporate_companies!inner(owner_user_id)")
    .eq("id", teamId)
    .maybeSingle();
  const ownerId = (team as { corporate_companies?: { owner_user_id?: string } } | null)?.corporate_companies?.owner_user_id;
  if (ownerId === userId) return "company_owner";
  return "none";
}

function requireMinAccess(level: AccessLevel, required: AccessLevel): boolean {
  const rank: Record<AccessLevel, number> = {
    none: 0,
    team_member: 1,
    team_admin: 2,
    company_owner: 3,
  };
  return rank[level] >= rank[required];
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
      // ── Company ──────────────────────────────────────────
      case "create-company": {
        const body = await parseJson(req);
        const name = requireString(body.name, "name", { min: 1, max: 160 });
        const domain = requireString(body.domain, "domain", { min: 3, max: 253 });
        const logoUrl = optionalString(body.logo_url, "logo_url", { max: 1024 });
        const city = optionalString(body.city, "city", { max: 80 });
        const industry = optionalString(body.industry, "industry", { max: 80 });
        const employeeCount = optionalNumber(body.employee_count, "employee_count", { min: 1, max: 1_000_000, integer: true });
        const policies = body.policies !== undefined ? requireObject(body.policies, "policies") : null;

        const { data, error } = await supabaseAdmin
          .from("corporate_companies")
          .insert({
            name,
            domain,
            logo_url: logoUrl,
            primary_city: city,
            industry,
            employee_count: employeeCount,
            billing_plan: "starter",
            monthly_credit_allowance: 500,
            onboarding_step: 1,
            owner_user_id: user.id,
            policies: policies ?? {
              max_per_person_budget: 75,
              require_approval_above: 500,
              allowed_categories: [],
              blocked_categories: [],
              alcohol_policy: "allowed",
              max_party_size: 25,
              advance_booking_days: 3,
              allowed_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
            },
          })
          .select()
          .single();
        if (error) return errorResponse("Create failed");
        return jsonResponse(data);
      }

      case "get-company": {
        const body = await parseJson(req);
        const companyId = requireUuid(body.company_id, "company_id");
        const access = await checkCompanyAccess(user.id, companyId);
        if (!requireMinAccess(access, "team_member")) return errorResponse("Forbidden", 403);

        const { data, error } = await supabaseAdmin
          .from("corporate_companies")
          .select("*")
          .eq("id", companyId)
          .single();
        if (error) return errorResponse("Lookup failed");
        return jsonResponse(data);
      }

      case "update-company": {
        const body = await parseJson(req);
        const companyId = requireUuid(body.company_id, "company_id");
        const access = await checkCompanyAccess(user.id, companyId);
        if (!requireMinAccess(access, "company_owner")) return errorResponse("Forbidden", 403);

        // Whitelist mutable fields. owner_user_id, billing_plan, etc. stay server-controlled.
        const updates = pickKeys(body, [
          "name", "domain", "logo_url", "primary_city", "industry", "employee_count",
        ]);

        const { data, error } = await supabaseAdmin
          .from("corporate_companies")
          .update(updates)
          .eq("id", companyId)
          .select()
          .single();
        if (error) return errorResponse("Update failed");
        return jsonResponse(data);
      }

      case "update-policies": {
        const body = await parseJson(req);
        const companyId = requireUuid(body.company_id, "company_id");
        const policies = requireObject(body.policies, "policies");
        const access = await checkCompanyAccess(user.id, companyId);
        if (!requireMinAccess(access, "company_owner")) return errorResponse("Forbidden", 403);

        const { data, error } = await supabaseAdmin
          .from("corporate_companies")
          .update({ policies })
          .eq("id", companyId)
          .select()
          .single();
        if (error) return errorResponse("Update failed");
        return jsonResponse(data);
      }

      case "advance-onboarding": {
        const body = await parseJson(req);
        const companyId = requireUuid(body.company_id, "company_id");
        const access = await checkCompanyAccess(user.id, companyId);
        if (!requireMinAccess(access, "company_owner")) return errorResponse("Forbidden", 403);

        const { data: company } = await supabaseAdmin
          .from("corporate_companies")
          .select("onboarding_step")
          .eq("id", companyId)
          .single();
        if (!company) return errorResponse("Company not found");

        const nextStep = Math.min((company.onboarding_step || 1) + 1, 8);
        const { data, error } = await supabaseAdmin
          .from("corporate_companies")
          .update({ onboarding_step: nextStep })
          .eq("id", companyId)
          .select()
          .single();
        if (error) return errorResponse("Update failed");
        return jsonResponse(data);
      }

      // ── Teams ────────────────────────────────────────────
      case "create-team": {
        const body = await parseJson(req);
        const companyId = requireUuid(body.company_id, "company_id");
        const name = requireString(body.name, "name", { min: 1, max: 120 });
        const budget = optionalNumber(body.budget_per_person, "budget_per_person", { min: 0, max: 1_000_000 }) ?? 75;
        const approvalRequired = optionalBool(body.approval_required, "approval_required") ?? true;
        const approverId = body.approver_id !== undefined ? requireUuid(body.approver_id, "approver_id") : user.id;
        const access = await checkCompanyAccess(user.id, companyId);
        if (!requireMinAccess(access, "company_owner")) return errorResponse("Forbidden", 403);

        const { data, error } = await supabaseAdmin
          .from("corporate_teams")
          .insert({
            company_id: companyId,
            name,
            budget_per_person: budget,
            approval_required: approvalRequired,
            approver_user_id: approverId,
            preferred_vibes: Array.isArray(body.preferred_vibes) ? body.preferred_vibes : [],
            preferred_cuisines: Array.isArray(body.preferred_cuisines) ? body.preferred_cuisines : [],
          })
          .select()
          .single();
        if (error) return errorResponse("Create failed");

        await supabaseAdmin.from("corporate_team_members").insert({
          team_id: data.id,
          user_id: user.id,
          role: "admin",
        });

        return jsonResponse(data);
      }

      case "list-teams": {
        const body = await parseJson(req);
        const companyId = requireUuid(body.company_id, "company_id");
        const access = await checkCompanyAccess(user.id, companyId);
        if (!requireMinAccess(access, "team_member")) return errorResponse("Forbidden", 403);

        const { data, error } = await supabaseAdmin
          .from("corporate_teams")
          .select("*, corporate_team_members(user_id, role, profiles(full_name, avatar_url))")
          .eq("company_id", companyId);
        if (error) return errorResponse("Lookup failed");
        return jsonResponse(data);
      }

      case "add-team-member": {
        const body = await parseJson(req);
        const teamId = requireUuid(body.team_id, "team_id");
        const memberId = requireUuid(body.user_id, "user_id");
        const role = optionalEnum(body.role, "role", ["admin", "member"] as const) ?? "member";
        const access = await checkTeamAccess(user.id, teamId);
        if (!requireMinAccess(access, "team_admin")) return errorResponse("Forbidden", 403);

        const { data, error } = await supabaseAdmin
          .from("corporate_team_members")
          .insert({ team_id: teamId, user_id: memberId, role })
          .select()
          .single();
        if (error) return errorResponse("Add failed");
        return jsonResponse(data);
      }

      case "remove-team-member": {
        const body = await parseJson(req);
        const teamId = requireUuid(body.team_id, "team_id");
        const memberId = requireUuid(body.user_id, "user_id");
        const access = await checkTeamAccess(user.id, teamId);
        if (!requireMinAccess(access, "team_admin")) return errorResponse("Forbidden", 403);

        const { error } = await supabaseAdmin
          .from("corporate_team_members")
          .delete()
          .eq("team_id", teamId)
          .eq("user_id", memberId);
        if (error) return errorResponse("Remove failed");
        return jsonResponse({ removed: true });
      }

      // ── Corporate Bookings ───────────────────────────────
      case "request-booking": {
        const body = await parseJson(req);
        const companyId = requireUuid(body.company_id, "company_id");
        const teamId = requireUuid(body.team_id, "team_id");
        const planId = optionalUuidOrString(body.plan_id, "plan_id");
        const venueId = requireUuid(body.venue_id, "venue_id");
        const scheduledDate = requireString(body.scheduled_date, "scheduled_date", { max: 32 });
        const scheduledTime = optionalString(body.scheduled_time, "scheduled_time", { max: 32 });
        const partySize = requireNumber(body.party_size, "party_size", { min: 1, max: 5000, integer: true });
        const costPerPerson = requireNumber(body.cost_per_person, "cost_per_person", { min: 0, max: 1_000_000 });
        const estimatedCost = requireNumber(body.estimated_cost, "estimated_cost", { min: 0, max: 100_000_000 });

        const access = await checkTeamAccess(user.id, teamId);
        if (!requireMinAccess(access, "team_member")) return errorResponse("Forbidden", 403);

        const { data: policyCheck } = await supabaseAdmin.rpc("check_corporate_booking_policy", {
          p_company_id: companyId,
          p_team_id: teamId,
          p_estimated_cost: estimatedCost,
          p_party_size: partySize,
          p_scheduled_date: scheduledDate,
        });

        const { data, error } = await supabaseAdmin
          .from("corporate_bookings")
          .insert({
            company_id: companyId,
            team_id: teamId,
            plan_id: planId,
            venue_id: venueId,
            requested_by: user.id,
            status: policyCheck?.requires_approval ? "pending" : "approved",
            scheduled_date: scheduledDate,
            scheduled_time: scheduledTime,
            party_size: partySize,
            cost_per_person: costPerPerson,
            estimated_cost: estimatedCost,
            policy_check: policyCheck,
          })
          .select()
          .single();
        if (error) return errorResponse("Create failed");
        return jsonResponse(data);
      }

      case "approve-booking": {
        const body = await parseJson(req);
        const bookingId = requireUuid(body.booking_id, "booking_id");

        const { data: booking } = await supabaseAdmin
          .from("corporate_bookings")
          .select("team_id")
          .eq("id", bookingId)
          .maybeSingle();
        if (!booking) return errorResponse("Booking not found", 404);

        const access = await checkTeamAccess(user.id, booking.team_id);
        if (!requireMinAccess(access, "team_admin")) return errorResponse("Forbidden", 403);

        const { data, error } = await supabaseAdmin
          .from("corporate_bookings")
          .update({ status: "approved", approved_by: user.id })
          .eq("id", bookingId)
          .select()
          .single();
        if (error) return errorResponse("Update failed");
        return jsonResponse(data);
      }

      case "reject-booking": {
        const body = await parseJson(req);
        const bookingId = requireUuid(body.booking_id, "booking_id");
        const reason = optionalString(body.reason, "reason", { max: 500 });

        const { data: booking } = await supabaseAdmin
          .from("corporate_bookings")
          .select("team_id")
          .eq("id", bookingId)
          .maybeSingle();
        if (!booking) return errorResponse("Booking not found", 404);

        const access = await checkTeamAccess(user.id, booking.team_id);
        if (!requireMinAccess(access, "team_admin")) return errorResponse("Forbidden", 403);

        const { data, error } = await supabaseAdmin
          .from("corporate_bookings")
          .update({ status: "rejected", approved_by: user.id, rejection_reason: reason })
          .eq("id", bookingId)
          .select()
          .single();
        if (error) return errorResponse("Update failed");
        return jsonResponse(data);
      }

      case "list-bookings": {
        const body = await parseJson(req);
        const companyId = requireUuid(body.company_id, "company_id");
        const teamId = body.team_id !== undefined ? requireUuid(body.team_id, "team_id") : undefined;
        const status = optionalEnum(body.status, "status", ["pending", "approved", "rejected", "completed", "cancelled"] as const);

        const access = await checkCompanyAccess(user.id, companyId);
        if (!requireMinAccess(access, "team_member")) return errorResponse("Forbidden", 403);

        let query = supabaseAdmin
          .from("corporate_bookings")
          .select("*, venues(id, name, neighborhood), profiles!requested_by(full_name)")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false });

        if (teamId) query = query.eq("team_id", teamId);
        if (status) query = query.eq("status", status);

        const { data, error } = await query;
        if (error) return errorResponse("Lookup failed");
        return jsonResponse(data);
      }

      default:
        return errorResponse("Unknown action", 404);
    }
  } catch (err) {
    if (err instanceof ValidationError) return errorResponse(err.message, 400);
    console.error("[corporate-service] unexpected error:", err);
    return errorResponse("Internal error", 500);
  }
});

// plan_id may be a UUID or a free-form string identifier — accept both.
function optionalUuidOrString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  return requireString(value, field, { max: 80 });
}
