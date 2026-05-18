import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText, Output } from "ai";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

export const AUDIENCE_TYPES = [
  "fraternity",
  "sorority",
  "aka",
  "line-sisters",
  "church-friends",
  "corporate-team",
  "alumni-group",
  "volunteer-group",
  "faith-group",
  "student-org",
] as const;
export type AudienceType = (typeof AUDIENCE_TYPES)[number];

export const AUDIENCE_LABELS: Record<AudienceType, string> = {
  fraternity: "Fraternity",
  sorority: "Sorority",
  aka: "Alpha Kappa Alpha",
  "line-sisters": "Line Sisters",
  "church-friends": "Church Friends",
  "corporate-team": "Corporate Team",
  "alumni-group": "Alumni Group",
  "volunteer-group": "Volunteer Group",
  "faith-group": "Faith Group",
  "student-org": "Student Organization",
};

const AUDIENCE_GUIDANCE: Record<AudienceType, string> = {
  fraternity:
    "Best: hiking day trip, service + cookout, sports tournament, escape room + dinner, road trip tailgate. Priorities: bonding, low planning overhead, affordable, team challenges, alumni-friendly. Avoid unsafe drinking-centered plans, unclear transportation, no safety leads.",
  sorority:
    "Lean toward elegance, service, sisterhood, mentorship, reflection. Best: community service + tea social, cultural museum + panel, wellness day, philanthropy fundraiser, sisterhood retreat.",
  aka: "Best: community service + tea social, cultural museum tour + panel, wellness day, philanthropy fundraiser, sisterhood retreat. Priorities: service, sisterhood, elegance, mentorship, reflection, community impact. Tone refined, intentional.",
  "line-sisters":
    "Best: progressive brunch + skills workshop, scavenger hunt with memory tasks, DIY craft night, volunteer tutoring clinic, sunset photoshoot + picnic. Priorities: intimate bonding, mentorship, memories, conversation, low-pressure connection.",
  "church-friends":
    "Best: community outreach day, worship walk and reflection, potluck fellowship + game night, volunteer build/repair, retreat day. Priorities: fellowship, service, restoration, outreach, accessibility, family-safe tone.",
  "corporate-team":
    "Best: half-day offsite with facilitated workshop, volunteer team build, innovation sprint, outdoor challenge day, cooking competition. Priorities: alignment, measurable outcomes, professional facilitation, accessibility, team communication, action planning.",
  "alumni-group":
    "Mix nostalgia + service + networking. Best: campus revisit + brunch, mentorship mixer, scholarship fundraiser, sports watch party, alumni service day.",
  "volunteer-group":
    "Service-first. Best: park cleanup, food pantry shift, build project, tutoring clinic, donation drive. Wrap with a thank-you meal.",
  "faith-group":
    "Family-safe, fellowship-focused. Best: retreat day, outreach + picnic, prayer hike, multigenerational potluck.",
  "student-org":
    "Affordable, energetic, schedule-friendly. Best: campus scavenger hunt, study + dinner, volunteer day, intramural tournament, cultural night.",
};

const EventStep = z.object({
  time: z.string().min(1).max(40),
  title: z.string().min(1).max(80),
  description: z.string().min(1).max(300),
  location_type: z.string().min(1).max(60),
  estimated_cost_min: z.number().min(0).max(10000),
  estimated_cost_max: z.number().min(0).max(10000),
  required_supplies: z.array(z.string().max(60)).max(10),
  safety_notes: z.string().max(240).optional().default(""),
});

const RoleAssignment = z.object({
  role_name: z.string().min(1).max(60),
  responsibilities: z.string().min(1).max(240),
});

const SignupField = z.object({
  field_name: z.string().min(1).max(60),
  required: z.boolean(),
  field_type: z.enum(["text", "phone", "email", "yes_no", "long_text", "number"]),
});

const BudgetLine = z.object({
  label: z.string().min(1).max(60),
  amount_min: z.number().min(0).max(10000),
  amount_max: z.number().min(0).max(10000),
});

export const GroupOutingPlan = z.object({
  audience_type: z.enum(AUDIENCE_TYPES),
  event_name: z.string().min(1).max(80),
  one_line_summary: z.string().min(1).max(180),
  estimated_cost_min: z.number().min(0).max(5000),
  estimated_cost_max: z.number().min(0).max(5000),
  ideal_group_size_min: z.number().int().min(2).max(500),
  ideal_group_size_max: z.number().int().min(2).max(500),
  itinerary_steps: z.array(EventStep).min(3).max(8),
  budget_breakdown: z.array(BudgetLine).min(2).max(8),
  checklist: z.array(z.string().min(1).max(80)).min(4).max(15),
  safety_notes: z.array(z.string().min(1).max(160)).min(2).max(8),
  promo_blurb: z.string().min(20).max(400),
  flyer_copy: z.string().min(40).max(800),
  chat_announcement: z.string().min(20).max(400),
  role_assignments: z.array(RoleAssignment).min(3).max(8),
  signup_fields: z.array(SignupField).min(5).max(14),
  cancellation_policy: z.string().min(10).max(240),
  accessibility_notes: z.string().min(10).max(240),
  payment_required: z.boolean(),
  rsvp_deadline: z.string().min(3).max(60),
});
export type GroupOutingPlan = z.infer<typeof GroupOutingPlan>;

const InputSchema = z.object({
  audience: z.enum(AUDIENCE_TYPES),
  city: z.string().max(80).optional(),
  groupSize: z.number().int().min(2).max(500).optional(),
  budgetPerPerson: z.number().min(0).max(1000).optional(),
  occasion: z.string().max(160).optional(),
  notes: z.string().max(400).optional(),
});

const DEFAULT_SIGNUP_FIELDS = [
  "Name",
  "Phone",
  "Email",
  "Emergency contact name",
  "Emergency contact phone",
  "Dietary restrictions",
  "Medical notes",
  "Carpool yes/no",
  "Payment collected yes/no",
  "Waiver acknowledged yes/no",
  "Can bring supplies yes/no",
  "Notes",
];

const SYSTEM = `You are the Confetti Group + Organization Outing Planner.
Generate ready-to-run outing plans for fraternities, sororities, AKA chapters, line sisters,
church friends, corporate teams, alumni groups, volunteer groups, faith groups, and student orgs.

Rules:
- Match the tone and priorities of the audience.
- Corporate plans feel professional, outcome-driven, with facilitation and clear deliverables.
- Faith/church/family plans stay safe, fellowship-focused, multigenerational.
- Greek plans cover bonding, service, mentorship, and logistics; never center on heavy drinking.
- Always include a Safety Lead role and explicit safety notes.
- Use realistic per-person budgets in USD.
- Itinerary should have concrete times and 3–8 steps.
- Signup fields must include: Name, Phone, Email, Emergency contact, Dietary restrictions, Waiver acknowledged.
- Output JSON only matching the schema.`;

export const generateGroupOutingPlan = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    const prompt =
      `Audience: ${AUDIENCE_LABELS[data.audience]} (${data.audience})\n` +
      `Guidance: ${AUDIENCE_GUIDANCE[data.audience]}\n` +
      (data.city ? `City: ${data.city}\n` : "") +
      (data.groupSize ? `Group size: ${data.groupSize}\n` : "") +
      (data.budgetPerPerson ? `Target budget/person: $${data.budgetPerPerson}\n` : "") +
      (data.occasion ? `Occasion: ${data.occasion}\n` : "") +
      (data.notes ? `Notes: ${data.notes}\n` : "") +
      `\nProduce a complete GroupOutingPlan. Include itinerary, budget breakdown, ` +
      `checklist, safety notes, role assignments (with a Safety Lead), signup fields, ` +
      `promo blurb, chat announcement, flyer copy, cancellation policy, accessibility notes, ` +
      `and an RSVP deadline (e.g. "Thursday 6 PM").\n` +
      `Recommended baseline signup fields: ${DEFAULT_SIGNUP_FIELDS.join(", ")}.`;

    const { output } = await generateText({
      model,
      system: SYSTEM,
      output: Output.object({ schema: GroupOutingPlan }),
      prompt,
    });

    return output;
  });
