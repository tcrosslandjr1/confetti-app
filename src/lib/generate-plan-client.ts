// Client-side bridge: Taste Agent → generate-plan edge function → ActiveLoop
// Loads user taste preferences, calls the AI plan generator, and converts
// the structured itinerary into a boarding-pass-ready ActiveLoop object.

import { loadPrefs, tasteSummary } from "@/lib/taste";
import { getSelectedCity } from "@/lib/cities";
import type { ActiveLoop, LoopStop } from "@/lib/loop-store";

// ─── Types matching the edge function's output ──────────────────────────────

export type AiItineraryStop = {
  order: number;
  venue_name: string;
  neighborhood: string;
  category: string;
  arrival: string;
  duration: string;
  purpose: string;
  vibe: string;
  logistics: string;
  pro_tip: string;
  insider_tip?: string;
};

export type AiTwist = {
  stop_number: number;
  type: string;
  description: string;
};

export type AiBoardingPass = {
  flight_number: string;
  departure_gate: string;
  destination: string;
  captain_note: string;
};

export type AiItinerary = {
  title: string;
  theme: string;
  mood_emoji: string;
  tagline: string;
  narrative_arc: string;
  route_logic: string;
  city: string;
  occasion: string;
  group_size: number;
  total_budget_estimate: string;
  time_window: string;
  stops: AiItineraryStop[];
  twist: AiTwist;
  boarding_pass: AiBoardingPass;
};

// ─── Input shape for the client call ────────────────────────────────────────

export type GeneratePlanInput = {
  occasion: string;
  vibe?: string;
  budget?: string;
  timeOfDay?: string;
  groupSize?: number;
  planType?: string;
  surpriseMode?: boolean;
  notes?: string;
};

// ─── Main function ──────────────────────────────────────────────────────────

/**
 * Full pipeline:
 * 1. Load user taste prefs from Supabase
 * 2. Compute tasteSummary (one-paragraph AI injection)
 * 3. Determine city from user prefs or app state
 * 4. Call the `generate-plan` edge function
 * 5. Return structured AiItinerary + pre-built ActiveLoop
 */
export async function generateAiPlan(input: GeneratePlanInput): Promise<{
  itinerary: AiItinerary;
  loop: ActiveLoop;
}> {
  // Step 1+2: Taste Agent layer — load preferences and summarize
  const prefs = await loadPrefs();
  const summary = tasteSummary(prefs);

  // Step 3: City resolution (user's selected city → fallback to taste → default DC)
  const selectedCity = getSelectedCity();
  const city =
    selectedCity?.name ??
    prefs.taste_profile?.cities?.[0] ??
    "Washington DC";

  // Step 4: Call the AI plan generation edge function
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase environment not configured");

  const res = await fetch(`${url}/functions/v1/generate-plan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      occasion: input.occasion,
      vibe: input.vibe,
      budget: input.budget,
      timeOfDay: input.timeOfDay,
      city,
      groupSize: input.groupSize ?? 2,
      tasteSummary: summary || undefined,
      planType: input.planType,
      surpriseMode: input.surpriseMode,
      notes: input.notes,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("AI is busy — try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted — contact support.");
    throw new Error(`Plan generation failed (${res.status}): ${errText.slice(0, 120)}`);
  }

  const data = (await res.json()) as { itinerary?: AiItinerary };
  if (!data.itinerary) throw new Error("No itinerary returned from AI");

  const itinerary = data.itinerary;

  // Step 5: Convert AI itinerary → ActiveLoop for boarding pass view
  const loop = itineraryToLoop(itinerary, input);

  return { itinerary, loop };
}

// ─── Converter: AI Itinerary → ActiveLoop (boarding pass) ───────────────────

function itineraryToLoop(it: AiItinerary, input: GeneratePlanInput): ActiveLoop {
  const stops: LoopStop[] = it.stops.map((s, i) => ({
    id: `stop-${i + 1}`,
    name: s.venue_name,
    type: s.category.replace(/_/g, " "),
    time: s.arrival,
    area: s.neighborhood,
    detail: s.purpose,
    rationale: s.pro_tip,
    kind: i === 0 ? "departure" : i === it.stops.length - 1 ? "destination" : "layover",
    category: s.category,
    priceLevel: input.budget,
    signature: s.insider_tip ?? s.pro_tip,
    tags: [
      { label: s.vibe.split(" ")[0] ?? s.category, variant: "vibe" as const },
      { label: s.duration, variant: "time" as const },
    ],
  }));

  // Determine the twist stop and mark it
  const twistIdx = Math.max(0, (it.twist?.stop_number ?? 1) - 1);
  if (stops[twistIdx]) {
    stops[twistIdx].emoji = "✨";
    stops[twistIdx].detail = `${stops[twistIdx].detail ?? ""} [TWIST: ${it.twist.description}]`.trim();
  }

  return {
    id: it.boarding_pass.flight_number,
    passenger: "YOU",
    date: new Date().toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    groupSize: it.group_size,
    from: it.boarding_pass.departure_gate,
    to: it.boarding_pass.destination,
    gate: it.stops[0]?.neighborhood ?? "GATE A",
    boardingTime: it.stops[0]?.arrival ?? "7:00 PM",
    occasion: it.occasion,
    vibe: input.vibe,
    stops,
    city: it.city,
    experienceName: it.title,
    experienceTagline: it.tagline,
    estimatedSpend: it.total_budget_estimate,
    occasionEmoji: it.mood_emoji,
    planParams: {
      city: it.city,
      occasionId: input.occasion,
      occasionLabel: it.occasion,
      vibeId: input.vibe,
      vibeLabel: input.vibe,
      groupSize: input.groupSize ?? 2,
      budget: budgetToNumber(input.budget),
    },
  };
}

function budgetToNumber(b?: string): 1 | 2 | 3 | 4 | undefined {
  if (!b) return undefined;
  const len = b.replace(/[^$]/g, "").length;
  return Math.max(1, Math.min(4, len)) as 1 | 2 | 3 | 4;
}
