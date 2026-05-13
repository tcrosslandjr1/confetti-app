import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText, Output } from "ai";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { findCity } from "./agents/city-context";
import { findTemplate } from "./agents/templates";
import { impromptuPoolPrompt } from "./agents/impromptu";
import { fetchForecastForCityDate, weatherGuidance } from "./weather.server";
import type { GeneratedPlan } from "./agents/types";

const PlanRequestSchema = z.object({
  city: z.string().min(1).max(80).optional(),
  occasionId: z.string().min(1).max(40).optional(),
  occasionLabel: z.string().min(1).max(80).optional(),
  vibeId: z.string().min(1).max(40).optional(),
  vibeLabel: z.string().min(1).max(80).optional(),
  groupSize: z.number().int().min(1).max(50).optional(),
  date: z.string().min(1).max(40).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  duration: z.string().min(1).max(20).optional(),
  budget: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
  tasteSummary: z.string().max(1200).optional(),
  /** Tonight's mood — distinct from long-term vibe. e.g. "hyped", "mellow", "romantic". */
  currentMood: z.string().min(1).max(40).optional(),
  /** "Change My Night" steering, e.g. "make it more chill", "cheaper", "more romantic". */
  tweakDirective: z.string().max(300).optional(),
});

type CandidateVenue = {
  id: string;
  name: string;
  category: string;
  neighborhood: string | null;
  rating: number | null;
  trendScore: number | null;
  mentionCount: number | null;
  tags: string[];
  summary: string | null;
  placeId: string | null;
  lat: number | null;
  lng: number | null;
};

// ── Quality Guardrail (deterministic) ─────────────────────────────
async function fetchQualifiedVenues(city: string): Promise<CandidateVenue[]> {
  // Load up to 60 candidate venues from the discovered viral_venues pool.
  const { data: rows, error } = await supabaseAdmin
    .from("viral_venues")
    .select(
      "id, city, venue_name, neighborhood, rating, trend_score, tags, summary, google_place_id, mention_count, lat, lng",
    )
    .ilike("city", city)
    .gte("rating", 4.0)
    .order("trend_score", { ascending: false })
    .limit(60);
  if (error) {
    console.error("[generatePlan] viral_venues query failed", error);
    return [];
  }

  // Honor the blocked-by-reports list if any.
  let blocked = new Set<string>();
  try {
    const { data: blockedRows } = await supabaseAdmin.rpc("blocked_place_ids_for_city", {
      _city: city,
    });
    if (Array.isArray(blockedRows)) {
      blocked = new Set(blockedRows.map((r: { place_id: string }) => r.place_id));
    }
  } catch {
    /* RPC missing or empty — ignore */
  }

  return (rows ?? [])
    .filter((r) => !r.google_place_id || !blocked.has(r.google_place_id))
    .map((r) => ({
      id: r.id,
      name: r.venue_name,
      category: (r.tags?.[0] as string | undefined) ?? "venue",
      neighborhood: r.neighborhood,
      rating: r.rating !== null ? Number(r.rating) : null,
      trendScore: r.trend_score !== null ? Number(r.trend_score) : null,
      mentionCount: r.mention_count,
      tags: (r.tags as string[]) ?? [],
      summary: r.summary,
      placeId: r.google_place_id,
      lat: r.lat !== null ? Number(r.lat) : null,
      lng: r.lng !== null ? Number(r.lng) : null,
    }));
}

// ── Schema for the model's structured output ──────────────────────
const StopOutputSchema = z.object({
  slot: z.string(),
  venueId: z.string().describe("The id field from one of the provided candidate venues"),
  time: z.string().describe("HH:MM 12-hour clock time, e.g. '7:30 PM'"),
  rationale: z.string().min(8).max(200),
});

const PlanOutputSchema = z.object({
  experienceName: z
    .string()
    .min(3)
    .max(60)
    .describe("Themed boarding-pass name, e.g. 'Salsa, Skylines & Secrets'"),
  experienceTagline: z.string().min(8).max(140),
  stops: z.array(StopOutputSchema).min(2).max(4),
  bonus: z
    .object({
      name: z.string().min(2).max(60),
      reason: z.string().min(8).max(160),
      time: z.string().optional(),
    })
    .nullable()
    .describe("Optional bonus move; null if none fits"),
  estimatedSpend: z.string().describe("Per-person range, e.g. '$60–$90'"),
  fitScore: z.number().min(0).max(1),
  guardrailNote: z.string().max(160).nullable(),
});

export const generatePlan = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => PlanRequestSchema.parse(input))
  .handler(async ({ data: req }): Promise<GeneratedPlan> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY — Lovable AI Gateway is not configured.");

    // 1. City Context Agent
    const cityCtx = findCity(req.city);

    // 2. Template Agent
    const template = findTemplate(req.occasionId);

    // 3. Quality Guardrail — pull candidate venues for the city
    let candidates = await fetchQualifiedVenues(cityCtx.city);

    // Filter out categories the template forbids (e.g. no club for in-laws).
    const avoid = template.constraints.avoidCategories ?? [];
    if (avoid.length) {
      const lcAvoid = avoid.map((a) => a.toLowerCase());
      candidates = candidates.filter(
        (c) => !lcAvoid.some((a) => c.category.toLowerCase().includes(a) || c.tags.some((t) => t.toLowerCase().includes(a))),
      );
    }

    // Trim to 30 most relevant candidates — keeps prompt cheap.
    const topCandidates = candidates.slice(0, 30);

    // 4 + 5 + 6. Itinerary + Naming + Impromptu + Relevance — single AI call.
    const gateway = createLovableAiGatewayProvider(apiKey);
    const model = gateway("google/gemini-3-flash-preview");

    const startTime = req.startTime ?? "19:00";
    const occasion = req.occasionLabel ?? template.blueprintName;
    const vibe = req.vibeLabel ?? "easygoing";
    const groupSize = req.groupSize ?? 2;
    const budget = req.budget ?? template.constraints.priceCeiling;

    const candidateBlock = topCandidates.length
      ? topCandidates
          .map(
            (c, i) =>
              `${i + 1}. id=${c.id} | "${c.name}" | ${c.category} | ${c.neighborhood ?? "—"} | rating=${c.rating ?? "?"} | trend=${(c.trendScore ?? 0).toFixed(2)} | tags=[${c.tags.slice(0, 4).join(", ")}] | ${c.summary?.slice(0, 110) ?? ""}`,
          )
          .join("\n")
      : "(no discovered venues — invent on-vibe placeholders that match the city's allowed activities)";

    const system = [
      "You are Confetti's multi-agent Itinerary Concierge. You execute SEVEN agents in a single response, in order, and return one structured plan.",
      "",
      "[1] CITY CONTEXT AGENT — Honor only the supplied city tags, allowed activities, neighborhoods, and environment features. Never invent venues that don't fit the city's real environment (no harbor stops in landlocked cities, no casinos outside gaming towns, no beach bars in Chicago, etc.).",
      "[2] OCCASION TEMPLATE AGENT — Follow the provided blueprint flow exactly (pre-game → main → after, plus optional bonus). Respect noise/chaos/accessibility constraints. Never recommend chaotic venues for sensitive occasions (in-laws, corporate, family).",
      "[3] TASTE LEARNING AGENT — Treat the Taste Graph as authoritative user preference. Use only nightlife-relevant signals (likes, check-ins, follows, music/food/neighborhood). Never infer political, demographic, or sensitive attributes. Skip anything in the user's avoid list.",
      "[4] VENUE MATCHING AGENT — Pick exactly one venue per template slot from the candidate list. Each pick must (a) match the slot's category hint and vibe, (b) be open at the recommended time, (c) honor the budget tier, (d) avoid duplicate categories across stops, (e) prefer venues in the city's signature neighborhoods.",
      "[5] IMPROMPTU IDEAS AGENT — Add ONE optional bonus move from the supplied city pool (or invent one only if it clearly fits the city's allowed activities). Must be ≤5 minute walk from a stop, on-vibe, open, safe, and either scenic or fun. Set bonus to null if nothing genuinely enhances the night.",
      "",
      "[6] QUALITY GUARDRAIL POLICY — Before finalizing, validate every stop against HARD RULES:",
      "    • rating ≥ 4.0",
      "    • venue is open at the recommended time (no closed/inconsistent hours)",
      "    • travel time between consecutive stops ≤ this city's max (see Transport)",
      "    • price within the user's budget ceiling",
      "    • no safety complaints, no occasion mismatch, no city-context violation",
      "    SOFT RULES (prefer when available): good lighting (girls' night), quiet ambiance (in-laws), group seating (corporate), scenic views (date night).",
      "    AUTO-REPLACE: if any candidate fails a hard rule, swap to the next best match in the candidate list and note the swap in guardrailNote. Only finalize when every stop passes.",
      "",
      "[7] NAMING STYLE GUIDE — Pattern: [City Element] + [Vibe Element] + [Twist]. Examples: 'Harbor Lights & Late Bites', 'Dice & Dazzle on the Strip', 'Pier Pressure & Prosecco', 'Boardroom to Barstools', 'Salsa, Skylines & Secrets'. Must be clever, readable, on-brand for the city + occasion. Never cringe, never generic, never reuse the same pattern twice in a row. Plus a single confident one-line tagline.",
      "",
      "If the candidate list is empty, you may invent realistic on-vibe places that match the city's allowed activities — mark them with venueId='invent:<short-slug>' so the app knows they aren't in our DB.",
    ].join("\n");

    const tasteBlock = req.tasteSummary?.trim()
      ? `# Taste Graph (Taste Learning Agent — nightlife-relevant signals only)\n${req.tasteSummary.trim()}\n\n`
      : "";

    const moodBlock = req.currentMood?.trim()
      ? `# Tonight's Mood (overrides default vibe energy if they conflict)\nUser feels: ${req.currentMood.trim()}. Bias venue energy toward this mood (e.g. "mellow" => quieter, slower-paced, low-stimulation; "hyped" => loud, dancey, social; "romantic" => candlelit, intimate; "adventurous" => unexpected/new spots; "recovering" => light food, no clubs, easy ambiance).\n\n`
      : "";

    // Fetch real weather for date+city and add as guidance to the prompt.
    let weatherBlock = "";
    if (req.date && cityCtx.city) {
      const f = await fetchForecastForCityDate(cityCtx.city, req.date);
      if (f) {
        weatherBlock = `# Weather Context (real forecast — Quality Guardrail must respect this)\n${f.emoji} ${f.label} · ${f.tMinF}–${f.tMaxF}°F · ${f.precipProb}% precip\n${weatherGuidance(f)}\n\n`;
      }
    }

    const neighborhoodBlock = cityCtx.neighborhoods
      .map((n) => `  • ${n.name} — ${n.vibe}`)
      .join("\n");

    const prompt = `# Plan request

# City Knowledge Pack — ${cityCtx.label}
Tags: ${cityCtx.tags.join(", ")}
Environment features: ${cityCtx.environmentFeatures.join(", ")}
Signature experiences: ${cityCtx.signatureExperiences.join(", ")}
Allowed activities: ${cityCtx.allowedActivities.join(", ")}
${cityCtx.avoid?.length ? `Forbidden in this city: ${cityCtx.avoid.join(", ")}\n` : ""}Neighborhoods:
${neighborhoodBlock}
Price norms: $ = ${cityCtx.priceNorms.$} | $$ = ${cityCtx.priceNorms.$$} | $$$ = ${cityCtx.priceNorms.$$$}
Transport: max ${cityCtx.transport.maxTravelMinutes} min between stops${cityCtx.transport.avoidCrossCity ? "; avoid cross-city jumps" : ""}.${
  cityCtx.travel
    ? `
Travel intel — walkability=${cityCtx.travel.travelModes.walkability}, uber=${cityCtx.travel.travelModes.uberAvailability}, transit=${cityCtx.travel.travelModes.publicTransitQuality}, parking=${cityCtx.travel.travelModes.parkingDifficulty}, EV=${cityCtx.travel.travelModes.evFriendly}.
Travel recs — short hops: ${cityCtx.travel.travelRecommendations.shortHops}; cross-neighborhood: ${cityCtx.travel.travelRecommendations.crossNeighborhood}; groups: ${cityCtx.travel.travelRecommendations.groups}; late-night: ${cityCtx.travel.travelRecommendations.lateNight}.
Stop choices must respect this travel intel: prefer walkable clusters when walkability is high; if walkability is low, keep stops close to cut rideshare hops; avoid stops that require parking in high-difficulty zones late-night unless rideshare is implied.`
    : ""
}
${req.tweakDirective ? `\n# Live Reroute directive (override default vibe to honor this):\n"${req.tweakDirective}"\nKeep the city, occasion, and group fixed; re-pick stops + naming + bonus to satisfy the directive.\n` : ""}

Occasion: ${occasion}
Vibe: ${vibe}
Group size: ${groupSize}
Start time: ${startTime}
Duration: ${req.duration ?? "3 hr"}
Budget ceiling: ${"$".repeat(budget)}

${moodBlock}${weatherBlock}${tasteBlock}# Template (Occasion Template Agent)
Blueprint: ${template.blueprintName}
Tone: ${template.tone}
Constraints: noise<=${template.constraints.maxNoise}, chaos=${template.constraints.chaos}, accessibility=${template.constraints.accessibility ?? "any"}${template.constraints.avoidCategories?.length ? `, AVOID=[${template.constraints.avoidCategories.join(", ")}]` : ""}

Required stops in order:
${template.structure.map((s, i) => `${i + 1}. ${s.slot} — ${s.description} (cats: ${s.categoryHints.join(", ")}; ~${s.durationMin}m)`).join("\n")}

# Candidate venues (Quality Guardrail pre-filtered: rating>=4.0, not blocked, forbidden categories removed)
${candidateBlock}

# Bonus-move pool (Impromptu Ideas Agent — pick one or null)
${impromptuPoolPrompt(cityCtx.slug, req.occasionId)}

# Your task
Run all seven agents and return the structured plan.
Each stop's rationale must tie the pick to the occasion, vibe, city, OR taste graph in one sentence.
Estimate per-person spend as a "$X–$Y" range honoring the budget ceiling and this city's price norms.
Return fitScore reflecting how well the picks match (0.85+ if every stop fits the slot's category hint AND the city's allowed activities AND the taste graph; lower it if you had to stretch).
Use guardrailNote to flag any compromise (e.g. "swapped club for lounge — no in-laws-safe club found", "stretched travel to 14m — best Wharf option").
Name pattern hints: ${template.namePatterns.join(" | ")}.`;

    const { experimental_output: output } = await generateText({
      model,
      system,
      prompt,
      experimental_output: Output.object({ schema: PlanOutputSchema }),
      maxRetries: 1,
    });

    // ── Post-pipeline guardrail: re-attach venue data and stamp ids ──
    const byId = new Map(topCandidates.map((c) => [c.id, c]));
    const stops = output.stops.map((s, i) => {
      const v = byId.get(s.venueId);
      return {
        id: `s${i + 1}`,
        slot: s.slot,
        name: v?.name ?? s.venueId.replace(/^invent:/, "").replace(/-/g, " "),
        type: v?.category ?? template.structure[i]?.categoryHints[0] ?? "venue",
        time: s.time,
        area: v?.neighborhood ?? undefined,
        rationale: s.rationale,
        venueId: v?.id,
        lat: v?.lat ?? undefined,
        lng: v?.lng ?? undefined,
      };
    });

    return {
      experienceName: output.experienceName,
      experienceTagline: output.experienceTagline,
      city: cityCtx.label,
      occasionLabel: occasion,
      vibeLabel: vibe,
      blueprint: template.blueprintName,
      stops,
      bonus: output.bonus
        ? { name: output.bonus.name, reason: output.bonus.reason, time: output.bonus.time }
        : undefined,
      estimatedSpend: output.estimatedSpend,
      fitScore: output.fitScore,
      guardrailNote: output.guardrailNote ?? undefined,
    };
  });
