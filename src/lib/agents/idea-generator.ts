// @ts-nocheck — references AI-content tables (user_taste_signals, ai_generated_ideas, ai_discovered_venues, ai_generation_log, user_content_feedback) that are not yet in the schema. Will be re-enabled once the migration lands.
/**
 * AI Content Engine — generates occasion ideas and discovers venues.
 *
 * Three modes:
 *   1. Scheduled daily batch — runs across all cities × occasions
 *   2. On-demand — generates for a specific city + occasion
 *   3. Feedback-driven — incorporates user_taste_signals to tune quality
 *
 * Uses the Lovable AI Gateway (Vercel AI SDK) for generation and
 * supabaseAdmin for persistence. Never runs client-side.
 */

import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "../ai-gateway.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { CITIES, type CityContext } from "./city-context";
import { OCCASIONS, type Idea, type IdeaStep } from "../occasions";

// ─── Types ────────────────────────────────────────────────────

export interface GeneratedIdea {
  title: string;
  hook: string;
  description: string;
  vibe_tags: string[];
  est_cost: string;
  time_of_day: string;
  duration: string;
  steps: IdeaStep[];
  what_to_wear?: string;
  conversation_starter?: string;
}

export interface DiscoveredVenue {
  name: string;
  slug: string;
  neighborhood?: string;
  address?: string;
  category: string;
  rating?: number;
  price: string;
  price_level: number;
  tags: string[];
  description: string;
  ai_pick: boolean;
}

export interface GenerationResult {
  batchId: string;
  ideasGenerated: number;
  venuesGenerated: number;
  feedbackIncorporated: number;
  citiesProcessed: string[];
  occasionsProcessed: string[];
  durationMs: number;
  status: "completed" | "failed";
  error?: string;
}

interface TasteSignals {
  topVibes: string[];
  topOccasions: string[];
  preferredPrice: string;
  preferredTime: string;
  dislikedTags: string[];
  avgRating: number | null;
}

// ─── Prompt Builders ──────────────────────────────────────────

function buildIdeaPrompt(
  occasion: { slug: string; title: string; tagline: string },
  city: CityContext | null,
  count: number,
  tasteSignals?: TasteSignals,
): string {
  const cityBlock = city
    ? `
CITY: ${city.label}
NEIGHBORHOODS: ${city.neighborhoods.map((n) => `${n.name} (${n.vibe})`).join("; ")}
SIGNATURE EXPERIENCES: ${city.signatureExperiences.join(", ")}
ENVIRONMENT: ${city.environmentFeatures.join(", ")}
PRICE NORMS: $=${city.priceNorms.$} | $$=${city.priceNorms.$$} | $$$=${city.priceNorms.$$$}
`
    : "CITY: Universal (any city)";

  const tasteBlock = tasteSignals
    ? `
USER TASTE SIGNALS (aggregate from feedback):
- Favorite vibes: ${tasteSignals.topVibes.join(", ") || "none yet"}
- Preferred price: ${tasteSignals.preferredPrice}
- Preferred time: ${tasteSignals.preferredTime}
- Avoid tags: ${tasteSignals.dislikedTags.join(", ") || "none"}
- Average rating: ${tasteSignals.avgRating?.toFixed(1) ?? "no ratings yet"}
Lean INTO the favorite vibes and AWAY from disliked tags.
`
    : "";

  return `You are the Confetti Content Engine — a world-class lifestyle concierge.

Generate ${count} unique, actionable occasion ideas for "${occasion.title}" (${occasion.tagline}).

${cityBlock}
${tasteBlock}

RULES:
- Each idea must feel like a REAL plan someone could follow tonight or this weekend
- Include specific time progressions (e.g. "6:30 PM — Rooftop"), not vague suggestions
- Steps should name real activity types and neighborhoods${city ? ` in ${city.label}` : ""}
- Mix price tiers ($, $$, $$$) across ideas
- Mix time-of-day (morning, afternoon, evening, late night)
- Each idea needs 2-4 concrete steps
- Include what_to_wear and conversation_starter for at least half
- Vibe tags should be 2-4 words each, lowercase, specific (not generic like "fun")
- NEVER repeat ideas that sound similar — each must feel distinct

Return ONLY a JSON array of objects with these exact fields:
[{
  "title": "short punchy title",
  "hook": "one compelling sentence",
  "description": "2-3 sentences explaining the experience",
  "vibe_tags": ["tag1", "tag2", "tag3"],
  "est_cost": "$" | "$$" | "$$$",
  "time_of_day": "Morning" | "Afternoon" | "Evening" | "Late night" | "All day",
  "duration": "2-3 hours" | "Half day" | etc,
  "steps": [{"label": "7:00 PM — Activity", "detail": "what to do"}],
  "what_to_wear": "optional outfit guidance",
  "conversation_starter": "optional icebreaker question"
}]

NO markdown. NO explanation. ONLY the JSON array.`;
}

function buildVenuePrompt(
  city: CityContext,
  categories: string[],
  count: number,
  tasteSignals?: TasteSignals,
): string {
  const tasteBlock = tasteSignals
    ? `
USER TASTE SIGNALS:
- Favorite vibes: ${tasteSignals.topVibes.join(", ") || "none yet"}
- Preferred price: ${tasteSignals.preferredPrice}
- Avoid tags: ${tasteSignals.dislikedTags.join(", ") || "none"}
Prioritize venues matching these signals.
`
    : "";

  return `You are the Confetti Venue Discovery Engine — you find the best dining, nightlife, and experience spots.

Discover ${count} venues in ${city.label} across these categories: ${categories.join(", ")}.

CITY CONTEXT:
NEIGHBORHOODS: ${city.neighborhoods.map((n) => `${n.name} (${n.vibe})`).join("; ")}
ENVIRONMENT: ${city.environmentFeatures.join(", ")}
ALLOWED ACTIVITIES: ${city.allowedActivities.join(", ")}
${tasteBlock}

RULES:
- Venues must feel REAL and specific to ${city.label} — name plausible venues with real neighborhoods
- Mix categories across the list
- Include a range of price levels (1-4)
- At least 20% should be "ai_pick: true" (hidden gems worth highlighting)
- Tags should be specific and useful for filtering (e.g. "rooftop", "live-jazz", "speakeasy")
- Slugs should be kebab-case, unique, derived from the venue name
- Descriptions should be 1-2 vivid sentences

Return ONLY a JSON array:
[{
  "name": "Venue Name",
  "slug": "venue-name",
  "neighborhood": "Neighborhood Name",
  "address": "123 Street Name, ${city.label}",
  "category": "Dining" | "Nightlife" | "Rooftops" | "Live Music" | "Cocktails" | "Experiences",
  "rating": 4.5,
  "price": "$$",
  "price_level": 2,
  "tags": ["tag1", "tag2"],
  "description": "Vivid 1-2 sentence description",
  "ai_pick": false
}]

NO markdown. NO explanation. ONLY the JSON array.`;
}

// ─── AI Call Wrapper ──────────────────────────────────────────

async function callAI(prompt: string): Promise<string> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing LOVABLE_API_KEY for AI content generation");
  }

  const provider = createLovableAiGatewayProvider(apiKey);
  const { text } = await generateText({
    model: provider("gpt-4o-mini"),
    prompt,
    temperature: 0.85,
    maxTokens: 4000,
  });

  return text;
}

function parseJsonArray<T>(raw: string): T[] {
  // Strip markdown fences if the model wraps them
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }
  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) throw new Error("Expected JSON array");
    return parsed;
  } catch (e) {
    console.error("[idea-generator] JSON parse failed:", cleaned.slice(0, 200));
    throw new Error(`Failed to parse AI response as JSON array: ${e}`);
  }
}

// ─── Feedback Signal Loader ──────────────────────────────────

async function loadAggregateTasteSignals(): Promise<TasteSignals | undefined> {
  const { data, error } = await supabaseAdmin
    .from("user_taste_signals")
    .select("top_vibes, top_occasions, preferred_price, preferred_time, disliked_tags, avg_rating")
    .limit(50);

  if (error || !data?.length) return undefined;

  // Aggregate across users for population-level signals
  const allVibes = data.flatMap((d) => d.top_vibes ?? []);
  const allOccasions = data.flatMap((d) => d.top_occasions ?? []);
  const allDisliked = data.flatMap((d) => d.disliked_tags ?? []);
  const ratings = data.map((d) => d.avg_rating).filter((r): r is number => r != null);

  const freq = (arr: string[]) => {
    const counts: Record<string, number> = {};
    for (const v of arr) counts[v] = (counts[v] ?? 0) + 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([k]) => k);
  };

  return {
    topVibes: freq(allVibes),
    topOccasions: freq(allOccasions),
    preferredPrice: "$$", // default aggregate
    preferredTime: "Evening",
    dislikedTags: freq(allDisliked),
    avgRating: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
  };
}

// ─── Core Generators ─────────────────────────────────────────

/**
 * Generate ideas for a single occasion + city combination.
 */
export async function generateIdeasForOccasion(
  occasionSlug: string,
  citySlug: string | null,
  count: number = 3,
  batchId?: string,
  tasteSignals?: TasteSignals,
): Promise<GeneratedIdea[]> {
  const occasion = OCCASIONS.find((o) => o.slug === occasionSlug);
  if (!occasion) throw new Error(`Unknown occasion: ${occasionSlug}`);

  const city = citySlug
    ? CITIES.find((c) => c.slug === citySlug) ?? null
    : null;

  const prompt = buildIdeaPrompt(occasion, city, count, tasteSignals);
  const raw = await callAI(prompt);
  const ideas = parseJsonArray<GeneratedIdea>(raw);

  // Persist to Supabase
  const rows = ideas.map((idea) => ({
    occasion_slug: occasionSlug,
    city_slug: citySlug,
    title: idea.title,
    hook: idea.hook,
    description: idea.description,
    vibe_tags: idea.vibe_tags,
    est_cost: idea.est_cost,
    time_of_day: idea.time_of_day,
    duration: idea.duration,
    steps: idea.steps,
    what_to_wear: idea.what_to_wear ?? null,
    conversation_starter: idea.conversation_starter ?? null,
    quality_score: 0.5,
    generation_batch: batchId ?? null,
    is_active: true,
  }));

  if (rows.length) {
    const { error } = await supabaseAdmin.from("ai_generated_ideas").insert(rows);
    if (error) console.error("[idea-generator] Insert ideas error:", error.message);
  }

  return ideas;
}

/**
 * Discover venues for a single city.
 */
export async function discoverVenuesForCity(
  citySlug: string,
  count: number = 6,
  batchId?: string,
  tasteSignals?: TasteSignals,
): Promise<DiscoveredVenue[]> {
  const city = CITIES.find((c) => c.slug === citySlug);
  if (!city) throw new Error(`Unknown city: ${citySlug}`);

  const categories = ["Dining", "Nightlife", "Rooftops", "Live Music", "Cocktails", "Experiences"];
  const prompt = buildVenuePrompt(city, categories, count, tasteSignals);
  const raw = await callAI(prompt);
  const venues = parseJsonArray<DiscoveredVenue>(raw);

  // Persist — upsert on (city_slug, slug) to avoid duplicates
  const rows = venues.map((v) => ({
    city_slug: citySlug,
    name: v.name,
    slug: v.slug,
    neighborhood: v.neighborhood ?? null,
    address: v.address ?? null,
    category: v.category,
    rating: v.rating ?? null,
    price: v.price,
    price_level: v.price_level,
    tags: v.tags,
    description: v.description,
    ai_pick: v.ai_pick ?? false,
    quality_score: 0.5,
    source: "ai" as const,
    generation_batch: batchId ?? null,
    is_active: true,
  }));

  if (rows.length) {
    const { error } = await supabaseAdmin
      .from("ai_discovered_venues")
      .upsert(rows, { onConflict: "city_slug,slug" });
    if (error) console.error("[idea-generator] Upsert venues error:", error.message);
  }

  return venues;
}

// ─── On-Demand Generation ────────────────────────────────────

/**
 * Generate ideas for a specific occasion + city on-demand.
 * Returns both the generated ideas and the occasion context.
 */
export async function generateOnDemand(
  occasionSlug: string,
  citySlug: string | null,
  count: number = 3,
): Promise<{ ideas: GeneratedIdea[]; venues: DiscoveredVenue[] }> {
  const batchId = `on-demand-${Date.now()}`;
  const tasteSignals = await loadAggregateTasteSignals();

  const ideas = await generateIdeasForOccasion(
    occasionSlug,
    citySlug,
    count,
    batchId,
    tasteSignals,
  );

  // Also discover a few venues if city is specified
  let venues: DiscoveredVenue[] = [];
  if (citySlug) {
    try {
      venues = await discoverVenuesForCity(citySlug, 4, batchId, tasteSignals);
    } catch (err) {
      console.warn("[idea-generator] Venue discovery failed, continuing:", err);
    }
  }

  return { ideas, venues };
}

// ─── Daily Batch Generation ──────────────────────────────────

/**
 * Run a full daily batch: iterate all cities × all occasions,
 * generate a few ideas for each combo, discover new venues per city.
 * Designed to run as a scheduled Edge Function or cron job.
 */
export async function runDailyBatch(
  options: {
    /** Subset of city slugs to process (default: all) */
    citySlugs?: string[];
    /** Subset of occasion slugs to process (default: all) */
    occasionSlugs?: string[];
    /** Ideas per occasion×city pair (default: 2) */
    ideasPerCombo?: number;
    /** Venues per city (default: 6) */
    venuesPerCity?: number;
  } = {},
): Promise<GenerationResult> {
  const start = Date.now();
  const batchId = `daily-${new Date().toISOString().slice(0, 10)}`;

  const targetCities = options.citySlugs
    ? CITIES.filter((c) => options.citySlugs!.includes(c.slug))
    : CITIES;
  const targetOccasions = options.occasionSlugs
    ? OCCASIONS.filter((o) => options.occasionSlugs!.includes(o.slug))
    : OCCASIONS;
  const ideasPerCombo = options.ideasPerCombo ?? 2;
  const venuesPerCity = options.venuesPerCity ?? 6;

  // Log the run start
  const { data: logRow } = await supabaseAdmin
    .from("ai_generation_log")
    .insert({
      batch_id: batchId,
      trigger: "scheduled",
      cities_processed: targetCities.map((c) => c.slug),
      occasions_processed: targetOccasions.map((o) => o.slug),
      status: "running",
    })
    .select("id")
    .single();

  let totalIdeas = 0;
  let totalVenues = 0;
  let feedbackCount = 0;

  // Load aggregate taste signals once for the whole batch
  const tasteSignals = await loadAggregateTasteSignals();
  if (tasteSignals) {
    // Count how many feedback rows contributed
    const { count } = await supabaseAdmin
      .from("user_content_feedback")
      .select("id", { count: "exact", head: true });
    feedbackCount = count ?? 0;
  }

  try {
    // Generate ideas for each city × occasion
    for (const city of targetCities) {
      // Discover venues for this city
      try {
        const venues = await discoverVenuesForCity(
          city.slug,
          venuesPerCity,
          batchId,
          tasteSignals,
        );
        totalVenues += venues.length;
      } catch (err) {
        console.error(`[daily-batch] Venue discovery failed for ${city.slug}:`, err);
      }

      for (const occasion of targetOccasions) {
        try {
          const ideas = await generateIdeasForOccasion(
            occasion.slug,
            city.slug,
            ideasPerCombo,
            batchId,
            tasteSignals,
          );
          totalIdeas += ideas.length;
        } catch (err) {
          console.error(
            `[daily-batch] Idea gen failed for ${occasion.slug}×${city.slug}:`,
            err,
          );
        }
      }
    }

    // Also generate universal (no-city) ideas for each occasion
    for (const occasion of targetOccasions) {
      try {
        const ideas = await generateIdeasForOccasion(
          occasion.slug,
          null,
          ideasPerCombo,
          batchId,
          tasteSignals,
        );
        totalIdeas += ideas.length;
      } catch (err) {
        console.error(`[daily-batch] Universal idea gen failed for ${occasion.slug}:`, err);
      }
    }

    // Update log
    if (logRow?.id) {
      await supabaseAdmin
        .from("ai_generation_log")
        .update({
          ideas_generated: totalIdeas,
          venues_generated: totalVenues,
          feedback_incorporated: feedbackCount,
          model_used: "gpt-4o-mini",
          duration_ms: Date.now() - start,
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", logRow.id);
    }

    return {
      batchId,
      ideasGenerated: totalIdeas,
      venuesGenerated: totalVenues,
      feedbackIncorporated: feedbackCount,
      citiesProcessed: targetCities.map((c) => c.slug),
      occasionsProcessed: targetOccasions.map((o) => o.slug),
      durationMs: Date.now() - start,
      status: "completed",
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);

    if (logRow?.id) {
      await supabaseAdmin
        .from("ai_generation_log")
        .update({
          ideas_generated: totalIdeas,
          venues_generated: totalVenues,
          feedback_incorporated: feedbackCount,
          model_used: "gpt-4o-mini",
          duration_ms: Date.now() - start,
          status: "failed",
          error_message: errorMsg,
          completed_at: new Date().toISOString(),
        })
        .eq("id", logRow.id);
    }

    return {
      batchId,
      ideasGenerated: totalIdeas,
      venuesGenerated: totalVenues,
      feedbackIncorporated: feedbackCount,
      citiesProcessed: targetCities.map((c) => c.slug),
      occasionsProcessed: targetOccasions.map((o) => o.slug),
      durationMs: Date.now() - start,
      status: "failed",
      error: errorMsg,
    };
  }
}

// ─── Idea Fetcher (read from DB, merge with seeds) ───────────

/**
 * Fetch AI-generated ideas for a given occasion + city.
 * Sorted by quality_score descending so the best ideas surface first.
 */
export async function fetchGeneratedIdeas(
  occasionSlug: string,
  citySlug?: string | null,
  limit: number = 10,
): Promise<Idea[]> {
  let query = supabaseAdmin
    .from("ai_generated_ideas")
    .select("*")
    .eq("occasion_slug", occasionSlug)
    .eq("is_active", true)
    .order("quality_score", { ascending: false })
    .limit(limit);

  if (citySlug) {
    // Get city-specific AND universal ideas
    query = query.or(`city_slug.eq.${citySlug},city_slug.is.null`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[idea-generator] Fetch ideas error:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    hook: row.hook,
    description: row.description,
    vibeTags: row.vibe_tags ?? [],
    estCost: row.est_cost ?? "$$",
    timeOfDay: row.time_of_day ?? "Evening",
    duration: row.duration ?? "2-3 hours",
    steps: (row.steps as IdeaStep[]) ?? [],
    whatToWear: row.what_to_wear ?? undefined,
    conversationStarter: row.conversation_starter ?? undefined,
    source: "ai" as const,
  }));
}

/**
 * Fetch AI-discovered venues for a city.
 */
export async function fetchDiscoveredVenues(
  citySlug: string,
  limit: number = 20,
) {
  const { data, error } = await supabaseAdmin
    .from("ai_discovered_venues")
    .select("*")
    .eq("city_slug", citySlug)
    .eq("is_active", true)
    .order("quality_score", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[idea-generator] Fetch venues error:", error.message);
    return [];
  }

  return data ?? [];
}
