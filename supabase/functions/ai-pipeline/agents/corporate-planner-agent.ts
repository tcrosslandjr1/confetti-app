// ============================================================
// Corporate Planner Agent — Layer 4 (Corporate Branch)
// Takes ranked venues → builds corporate-compliant outing
// Checks policies, budgets, headcount, approval requirements
// ============================================================

import { chatCompletion } from "../../_shared/openai.ts";

export async function corporatePlannerAgent(
  rankedVenues: any[],
  context: any,
  corporate: { company_id: string; team_id: string },
  supabase: any,
): Promise<{ result: any; tokens: number }> {
  // 1. Fetch company policies
  const { data: company } = await supabase
    .from("corporate_companies")
    .select("*")
    .eq("id", corporate.company_id)
    .single();

  // 2. Fetch team info
  const { data: team } = await supabase
    .from("corporate_teams")
    .select("*")
    .eq("id", corporate.team_id)
    .single();

  if (!company || !team) {
    return {
      result: { error: "Company or team not found", stops: [] },
      tokens: 0,
    };
  }

  const policies = company.policies || {};

  // 3. Filter venues for corporate compliance
  const compliantVenues = rankedVenues.filter((v) => {
    if (v.price_tier === "$$$$" && policies.max_per_person_budget < 100) return false;

    const blockedCats = policies.blocked_categories || [];
    if (blockedCats.includes(v.category)) return false;

    if (policies.alcohol_policy === "none" && ["bar", "lounge", "club"].includes(v.category)) {
      return false;
    }

    return true;
  });

  if (!compliantVenues.length) {
    return {
      result: {
        title: "No compliant venues found",
        stops: [],
        policy_notes: ["No venues match company policy constraints"],
      },
      tokens: 0,
    };
  }

  // 4. Generate corporate plan via GPT
  const venueSummaries = compliantVenues.slice(0, 8).map((v, i) => ({
    rank: i + 1,
    name: v.name,
    category: v.category,
    neighborhood: v.neighborhood,
    price: v.price_tier,
    rating: v.average_rating,
    corporate_friendly: true,
  }));

  const { content, usage } = await chatCompletion([
    {
      role: "system",
      content: `You are the Corporate Planner for Confetti. Build a team outing plan that is:
- Within budget ($${team.budget_per_person}/person, ${context.query_intent.party_size} people)
- Compliant with company policies
- Professional but fun — this is team bonding, not a board meeting
- 1-3 stops maximum for corporate outings

Return JSON:
{
  "title": "...",
  "type": "team_lunch|team_dinner|happy_hour|team_building|celebration",
  "estimated_cost_per_person": number,
  "estimated_total": number,
  "requires_approval": boolean,
  "stops": [
    {
      "order": 1,
      "venue_name": "...",
      "arrival_time": "...",
      "duration_minutes": number,
      "purpose": "main_dining|drinks|activity",
      "estimated_cost_pp": number,
      "why": "..."
    }
  ],
  "policy_notes": ["any relevant policy observations"],
  "booking_instructions": "what to tell the restaurant"
}`,
    },
    {
      role: "user",
      content: `Company: ${company.name}
Team: ${team.name} (${context.query_intent.party_size} people)
Budget: $${team.budget_per_person}/person
Policies: ${JSON.stringify(policies)}
City: ${context.location.city}
Occasion: ${context.query_intent.occasion}

Compliant venues:
${JSON.stringify(venueSummaries, null, 2)}`,
    },
  ], {
    temperature: 0.6,
    max_tokens: 1200,
    response_format: { type: "json_object" },
  });

  const plan = JSON.parse(content);

  // 5. Run policy check
  const { data: policyCheck } = await supabase.rpc("check_corporate_booking_policy", {
    p_company_id: corporate.company_id,
    p_team_id: corporate.team_id,
    p_estimated_cost: plan.estimated_cost_per_person * (context.query_intent?.party_size || 1) || 0,
    p_party_size: context.query_intent.party_size,
    p_scheduled_date: new Date().toISOString().split("T")[0],
  });

  plan.policy_check = policyCheck;
  plan.requires_approval = policyCheck?.requires_approval ?? plan.requires_approval;

  // Enrich stops with venue IDs
  plan.stops = (plan.stops || []).map((stop: any) => {
    const venue = compliantVenues.find((v) => v.name === stop.venue_name);
    return { ...stop, venue_id: venue?.id };
  });

  return { result: plan, tokens: usage.total_tokens };
}
