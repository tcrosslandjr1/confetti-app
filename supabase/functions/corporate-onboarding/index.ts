// ============================================================
// Corporate Onboarding — 8-step guided flow
// Step 1: Company Setup (name, domain, city, industry)
// Step 2: Admin Creation (owner account link)
// Step 3: Policy Configuration (budgets, alcohol, categories)
// Step 4: Team Creation (first team + members)
// Step 5: Venue Preferences (preferred neighborhoods, vibes)
// Step 6: First Outing (generate a sample plan)
// Step 7: Approval Flow Test (simulate booking approval)
// Step 8: Reporting Setup (dashboard preferences)
// ============================================================

import { serve } from "../_shared/server.ts";
import { supabaseAdmin, supabaseForUser, corsHeaders, jsonResponse, errorResponse } from "../_shared/supabase-client.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders() });

  const url = new URL(req.url);
  const action = url.pathname.split("/").pop();
  const authHeader = req.headers.get("Authorization")!;
  const sb = supabaseForUser(authHeader);
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return errorResponse("Unauthorized", 401);

  try {
    switch (action) {
      // ── Get Onboarding Status ────────────────────────────
      case "status": {
        const { company_id } = await req.json();
        const { data, error } = await supabaseAdmin
          .from("corporate_companies")
          .select("id, name, onboarding_step, billing_plan")
          .eq("id", company_id)
          .single();
        if (error) return errorResponse(error.message);

        const steps = [
          { step: 1, title: "Company Setup", description: "Register your company", completed: (data.onboarding_step || 0) >= 1 },
          { step: 2, title: "Admin Account", description: "Link your admin account", completed: (data.onboarding_step || 0) >= 2 },
          { step: 3, title: "Policies", description: "Configure outing policies", completed: (data.onboarding_step || 0) >= 3 },
          { step: 4, title: "Teams", description: "Create your first team", completed: (data.onboarding_step || 0) >= 4 },
          { step: 5, title: "Venue Preferences", description: "Set venue preferences", completed: (data.onboarding_step || 0) >= 5 },
          { step: 6, title: "First Outing", description: "Generate a sample outing", completed: (data.onboarding_step || 0) >= 6 },
          { step: 7, title: "Approval Flow", description: "Test the approval workflow", completed: (data.onboarding_step || 0) >= 7 },
          { step: 8, title: "Reporting", description: "Configure your dashboard", completed: (data.onboarding_step || 0) >= 8 },
        ];

        return jsonResponse({
          company_id: data.id,
          company_name: data.name,
          current_step: data.onboarding_step || 0,
          billing_plan: data.billing_plan,
          steps,
          is_complete: (data.onboarding_step || 0) >= 8,
        });
      }

      // ── Step 1: Company Setup ────────────────────────────
      case "step-1": {
        const body = await req.json();
        const { data, error } = await supabaseAdmin
          .from("corporate_companies")
          .insert({
            name: body.name,
            domain: body.domain,
            logo_url: body.logo_url,
            primary_city: body.city,
            industry: body.industry,
            employee_count: body.employee_count,
            billing_plan: "starter",
            monthly_credit_allowance: 500,
            onboarding_step: 1,
            owner_user_id: user.id,
            policies: {
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
        if (error) return errorResponse(error.message);
        return jsonResponse({ step: 1, completed: true, company: data });
      }

      // ── Step 2: Admin Account Link ───────────────────────
      case "step-2": {
        const { company_id } = await req.json();

        // Verify user is company owner
        const { data: company } = await supabaseAdmin
          .from("corporate_companies")
          .select("owner_user_id")
          .eq("id", company_id)
          .single();
        if (!company || company.owner_user_id !== user.id) {
          return errorResponse("Not company owner", 403);
        }

        await supabaseAdmin
          .from("corporate_companies")
          .update({ onboarding_step: 2 })
          .eq("id", company_id);

        return jsonResponse({ step: 2, completed: true, admin_id: user.id });
      }

      // ── Step 3: Policy Configuration ─────────────────────
      case "step-3": {
        const { company_id, policies } = await req.json();

        const { data, error } = await supabaseAdmin
          .from("corporate_companies")
          .update({ policies, onboarding_step: 3 })
          .eq("id", company_id)
          .select("policies")
          .single();
        if (error) return errorResponse(error.message);
        return jsonResponse({ step: 3, completed: true, policies: data.policies });
      }

      // ── Step 4: Team Creation ────────────────────────────
      case "step-4": {
        const { company_id, team_name, members, budget_per_person } = await req.json();

        // Create team
        const { data: team, error: teamErr } = await supabaseAdmin
          .from("corporate_teams")
          .insert({
            company_id,
            name: team_name,
            budget_per_person: budget_per_person || 75,
            approval_required: true,
            approver_user_id: user.id,
          })
          .select()
          .single();
        if (teamErr) return errorResponse(teamErr.message);

        // Add owner as admin
        await supabaseAdmin.from("corporate_team_members").insert({
          team_id: team.id,
          user_id: user.id,
          role: "admin",
        });

        // Add members if provided
        if (members?.length) {
          const memberInserts = members.map((m: any) => ({
            team_id: team.id,
            user_id: m.user_id,
            role: m.role || "member",
          }));
          await supabaseAdmin.from("corporate_team_members").insert(memberInserts);
        }

        await supabaseAdmin
          .from("corporate_companies")
          .update({ onboarding_step: 4 })
          .eq("id", company_id);

        return jsonResponse({ step: 4, completed: true, team });
      }

      // ── Step 5: Venue Preferences ────────────────────────
      case "step-5": {
        const { company_id, team_id, preferred_vibes, preferred_cuisines } = await req.json();

        await supabaseAdmin
          .from("corporate_teams")
          .update({
            preferred_vibes: preferred_vibes || [],
            preferred_cuisines: preferred_cuisines || [],
          })
          .eq("id", team_id);

        await supabaseAdmin
          .from("corporate_companies")
          .update({ onboarding_step: 5 })
          .eq("id", company_id);

        return jsonResponse({ step: 5, completed: true, preferred_vibes, preferred_cuisines });
      }

      // ── Step 6: First Outing (Sample Plan) ───────────────
      case "step-6": {
        const { company_id, team_id, query } = await req.json();

        // Call the AI pipeline with corporate context
        const pipelineUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/ai-pipeline`;
        const pipelineRes = await fetch(pipelineUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            "x-user-id": user.id,
          },
          body: JSON.stringify({
            query: query || "Team lunch downtown, good vibes",
            user_id: user.id,
            corporate: { company_id, team_id },
          }),
        });

        const result = await pipelineRes.json();

        await supabaseAdmin
          .from("corporate_companies")
          .update({ onboarding_step: 6 })
          .eq("id", company_id);

        return jsonResponse({ step: 6, completed: true, sample_plan: result.plan });
      }

      // ── Step 7: Approval Flow Test ───────────────────────
      case "step-7": {
        const { company_id, team_id } = await req.json();

        // Create a test booking that requires approval
        const { data: booking, error } = await supabaseAdmin
          .from("corporate_bookings")
          .insert({
            company_id,
            team_id,
            requested_by: user.id,
            status: "pending",
            scheduled_date: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
            party_size: 6,
            cost_per_person: 50,
            estimated_cost: 300,
            policy_check: { test: true, passed: true },
          })
          .select()
          .single();
        if (error) return errorResponse(error.message);

        // Auto-approve the test booking
        await supabaseAdmin
          .from("corporate_bookings")
          .update({
            status: "approved",
            approved_by: user.id,
          })
          .eq("id", booking.id);

        await supabaseAdmin
          .from("corporate_companies")
          .update({ onboarding_step: 7 })
          .eq("id", company_id);

        return jsonResponse({
          step: 7,
          completed: true,
          test_booking: { ...booking, status: "approved" },
          message: "Approval flow tested successfully",
        });
      }

      // ── Step 8: Reporting Setup ──────────────────────────
      case "step-8": {
        const { company_id, reporting_preferences } = await req.json();

        const { data: company } = await supabaseAdmin
          .from("corporate_companies")
          .select("policies")
          .eq("id", company_id)
          .single();

        if (company) {
          const updatedPolicies = {
            ...(company.policies || {}),
            reporting: reporting_preferences || {
              weekly_digest: true,
              monthly_report: true,
              spend_alerts: true,
              alert_threshold_pct: 80,
            },
          };

          await supabaseAdmin
            .from("corporate_companies")
            .update({ policies: updatedPolicies, onboarding_step: 8 })
            .eq("id", company_id);
        }

        return jsonResponse({
          step: 8,
          completed: true,
          onboarding_complete: true,
          message: "Welcome to Confetti for Business!",
        });
      }

      default:
        return errorResponse("Unknown action", 404);
    }
  } catch (err) {
    return errorResponse(err.message, 500);
  }
});
