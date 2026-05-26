// Confetti v10 — Multi-Agent Orchestrator
// Single entry point that routes a raw user request through every Confetti agent.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText, Output } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAiProvider } from "./ai-gateway.server";
import { generatePlan } from "./generate-plan.functions";
import { generateTrip } from "./trip.functions";
import {
  DEFAULT_PROFILE,
  learnProfileFromSignals,
  getDefaultsFromProfile,
  applySafetyGuards,
  type PersonalizationProfile,
} from "./agents/personalization";

const IntentSchema = z.object({
  mode: z.enum(["single", "trip"]).describe("single = one outing, trip = multi-day"),
  city: z.string().nullable(),
  category: z.string().nullable(),
  vibe: z.string().nullable(),
  audience: z.string().nullable(),
  groupSize: z.number().int().min(1).max(50).nullable(),
  tripLengthDays: z.number().int().min(1).max(14).nullable(),
  budgetTier: z.number().int().min(1).max(4).nullable(),
  energyCurve: z.string().nullable(),
});

async function intentAgent(rawRequest: string) {
  const provider = getAiProvider();
  const model = provider("google/gemini-3-flash-preview");
  const { experimental_output: out } = await generateText({
    model,
    system:
      "You are Confetti's intent agent. Extract structured fields from a user's plan request. Output JSON only. If a multi-day trip is implied (days, weekend, vacation, 'X days in Y'), set mode=trip. Otherwise mode=single. Set null when not specified.",
    prompt: rawRequest,
    experimental_output: Output.object({ schema: IntentSchema }),
    maxRetries: 1,
  });
  return out;
}

async function loadProfile(
  supabase: { from: (t: string) => any },
  userId: string,
): Promise<PersonalizationProfile> {
  const { data: row } = await supabase
    .from("user_preferences")
    .select(
      "preferred_vibes, preferred_categories, preferred_price_tier, preferred_time_slots, personalized_name_style, adult_opt_in, promo_sensitivity, comfort_level, nightlife_intensity, risk_tolerance, disliked_categories",
    )
    .eq("user_id", userId)
    .maybeSingle();
  if (!row) {
    // Try to learn from recent signals.
    const { data: sigs } = await supabase
      .from("user_signals")
      .select("signal_type, payload, city")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (sigs && sigs.length) return learnProfileFromSignals(sigs as never, DEFAULT_PROFILE);
    return DEFAULT_PROFILE;
  }
  return { ...DEFAULT_PROFILE, ...(row as Partial<PersonalizationProfile>) };
}

export const orchestratePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        rawRequest: z.string().min(2).max(600),
        currentCity: z.string().max(80).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // 1. Intent agent
    const intent = await intentAgent(data.rawRequest);

    // 2. Personalization
    const profile = await loadProfile(supabase, userId);
    const defaults = getDefaultsFromProfile(profile);

    // Resolve city
    const city = intent.city ?? data.currentCity ?? "Miami";
    const vibe = intent.vibe ?? defaults.defaultVibe ?? "easygoing";
    const category = intent.category ?? defaults.defaultCategory ?? "casual";
    const groupSize = intent.groupSize ?? 2;
    const budgetTier = intent.budgetTier ?? defaults.defaultBudgetTier ?? 2;

    // 3. Branch single vs trip
    if (intent.mode === "trip" && (intent.tripLengthDays ?? 0) >= 2) {
      const safeInput = applySafetyGuards({ vibeLabel: vibe, occasionLabel: category }, profile);
      const result = await generateTrip({
        data: {
          destinationCity: city,
          tripLengthDays: intent.tripLengthDays ?? 3,
          groupSize,
          groupType: intent.audience ?? undefined,
          energyCurve: (intent.energyCurve as never) ?? "chill-turnup-chill",
        },
      });
      // Log signals (best-effort)
      void supabase.from("user_signals").insert([
        {
          user_id: userId,
          signal_type: "trip_generated",
          payload: { city, days: intent.tripLengthDays },
          city,
        },
        {
          user_id: userId,
          signal_type: "vibe_chosen",
          payload: { vibe: safeInput.vibeLabel },
          city,
        },
      ]);
      const r = result as {
        tripId: string;
        tripName: string;
        nameOptions: { name: string; score: number }[];
      };
      return {
        mode: "trip" as const,
        tripId: r.tripId,
        tripName: r.tripName,
        nameOptions: r.nameOptions,
      };
    }

    const safeInput = applySafetyGuards({ vibeLabel: vibe, occasionLabel: category }, profile);
    const plan = await generatePlan({
      data: {
        city,
        occasionLabel: safeInput.occasionLabel,
        vibeLabel: safeInput.vibeLabel,
        groupSize,
        budget: budgetTier as 1 | 2 | 3 | 4,
        timeOfDay: (defaults.defaultTimeOfDay as never) ?? undefined,
      },
    });

    void supabase.from("user_signals").insert([
      { user_id: userId, signal_type: "plan_generated", payload: { city, vibe, category }, city },
      { user_id: userId, signal_type: "vibe_chosen", payload: { vibe }, city },
      { user_id: userId, signal_type: "category_chosen", payload: { category }, city },
      { user_id: userId, signal_type: "budget", payload: { tier: budgetTier }, city },
    ]);

    return {
      mode: "single" as const,
      plan,
      reasoning: {
        intent,
        profileApplied: {
          defaultVibe: defaults.defaultVibe,
          defaultBudget: defaults.defaultBudgetTier,
          nameStyle: defaults.nameStyle,
        },
      },
    };
  });
