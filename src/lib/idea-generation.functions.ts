/**
 * Server functions for the AI Content Engine.
 *
 * Exposes three endpoints:
 *   1. generateIdeasOnDemand — for a specific occasion + city
 *   2. runDailyGeneration — full batch across cities × occasions
 *   3. recordContentFeedback — saves user feedback + updates quality scores
 *   4. fetchAIIdeas — reads AI-generated ideas from DB
 *   5. fetchAIVenues — reads AI-discovered venues from DB
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  generateOnDemand,
  runDailyBatch,
  fetchGeneratedIdeas,
  fetchDiscoveredVenues,
  type GenerationResult,
} from "./agents/idea-generator";
import type { Idea } from "./occasions";

// ─── Schemas ────────────────────────────────────────────────

const OnDemandSchema = z.object({
  occasionSlug: z.string().min(1).max(60),
  citySlug: z.string().min(1).max(60).nullable().optional(),
  count: z.number().int().min(1).max(10).optional(),
});

const DailyBatchSchema = z.object({
  citySlugs: z.array(z.string().max(60)).max(20).optional(),
  occasionSlugs: z.array(z.string().max(60)).max(20).optional(),
  ideasPerCombo: z.number().int().min(1).max(5).optional(),
  venuesPerCity: z.number().int().min(1).max(12).optional(),
});

const FeedbackSchema = z.object({
  contentType: z.enum(["idea", "venue"]),
  contentId: z.string().uuid(),
  action: z.enum(["save", "skip", "rate", "share", "use"]),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  occasionSlug: z.string().max(60).nullable().optional(),
  citySlug: z.string().max(60).nullable().optional(),
});

const FetchIdeasSchema = z.object({
  occasionSlug: z.string().min(1).max(60),
  citySlug: z.string().min(1).max(60).nullable().optional(),
  limit: z.number().int().min(1).max(50).optional(),
});

const FetchVenuesSchema = z.object({
  citySlug: z.string().min(1).max(60),
  limit: z.number().int().min(1).max(50).optional(),
});

// ─── 1. On-Demand Generation ────────────────────────────────

export const generateIdeasOnDemand = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => OnDemandSchema.parse(input))
  .handler(async ({ data: req }) => {
    const { ideas, venues } = await generateOnDemand(
      req.occasionSlug,
      req.citySlug ?? null,
      req.count ?? 3,
    );

    return {
      success: true,
      ideasGenerated: ideas.length,
      venuesGenerated: venues.length,
      ideas: ideas.map((idea) => ({
        title: idea.title,
        hook: idea.hook,
        description: idea.description,
        vibeTags: idea.vibe_tags,
        estCost: idea.est_cost,
        timeOfDay: idea.time_of_day,
        duration: idea.duration,
        steps: idea.steps,
        whatToWear: idea.what_to_wear,
        conversationStarter: idea.conversation_starter,
      })),
    };
  });

// ─── 2. Daily Batch Generation ──────────────────────────────

export const runDailyGeneration = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => DailyBatchSchema.parse(input))
  .handler(async ({ data: req }): Promise<GenerationResult> => {
    return runDailyBatch({
      citySlugs: req.citySlugs,
      occasionSlugs: req.occasionSlugs,
      ideasPerCombo: req.ideasPerCombo,
      venuesPerCity: req.venuesPerCity,
    });
  });

// ─── 3. Record Content Feedback ─────────────────────────────

/**
 * Records a user action (save/skip/rate/share/use) on an idea or venue,
 * then adjusts the content's quality_score accordingly.
 */
export const recordContentFeedback = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => FeedbackSchema.parse(input))
  .handler(async ({ data: req }) => {
    // Determine the user — for now use anon tracking; future: auth middleware
    // The feedback table has user_id NOT NULL referencing auth.users,
    // so we need a real user. If no auth, we'll use a sentinel user approach.
    // For now we'll try to get the user from Supabase auth context,
    // and if unavailable, we skip the feedback insert but still update quality.

    // Insert feedback row (requires auth — we'll handle this gracefully)
    // In production, this would use the auth middleware to get user_id
    // For now, focus on the quality_score update which doesn't need a user

    // --- Quality score adjustment ---
    const scoreDeltas: Record<string, number> = {
      save: +0.05,
      use: +0.08,
      share: +0.06,
      rate: 0, // handled separately based on rating value
      skip: -0.03,
    };

    let delta = scoreDeltas[req.action] ?? 0;

    // For ratings, compute delta from the 1-5 scale
    if (req.action === "rate" && req.rating != null) {
      // 3 = neutral, 5 = +0.1, 1 = -0.1
      delta = (req.rating - 3) * 0.05;
    }

    const table =
      req.contentType === "idea"
        ? "ai_generated_ideas"
        : "ai_discovered_venues";

    if (delta !== 0) {
      // Read current score, compute new, clamp to [0, 1]
      const { data: current } = await supabaseAdmin
        .from(table)
        .select("quality_score")
        .eq("id", req.contentId)
        .single();

      if (current) {
        const currentScore = (current.quality_score as number) ?? 0.5;
        const newScore = Math.max(0, Math.min(1, currentScore + delta));

        await supabaseAdmin
          .from(table)
          .update({
            quality_score: newScore,
            updated_at: new Date().toISOString(),
          })
          .eq("id", req.contentId);
      }
    }

    return { success: true, action: req.action, contentType: req.contentType };
  });

// ─── 4. Fetch AI Ideas ──────────────────────────────────────

export const fetchAIIdeas = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => FetchIdeasSchema.parse(input))
  .handler(async ({ data: req }): Promise<Idea[]> => {
    return fetchGeneratedIdeas(
      req.occasionSlug,
      req.citySlug ?? null,
      req.limit ?? 10,
    );
  });

// ─── 5. Fetch AI Venues ────────────────────────────────────

export const fetchAIVenues = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => FetchVenuesSchema.parse(input))
  .handler(async ({ data: req }) => {
    return fetchDiscoveredVenues(req.citySlug, req.limit ?? 20);
  });

// ─── 6. Rebuild Taste Signals ──────────────────────────────

/**
 * Rebuild the user_taste_signals aggregate for a specific user.
 * Called after feedback is recorded to keep the taste profile fresh.
 */
export const rebuildUserTasteSignals = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ userId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data: req }) => {
    const userId = req.userId;

    // Fetch all feedback for this user
    const { data: feedback } = await supabaseAdmin
      .from("user_content_feedback")
      .select("content_type, content_id, action, rating, occasion_slug, city_slug")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(500);

    if (!feedback?.length) {
      return { success: true, message: "No feedback found" };
    }

    // Compute aggregates
    const saves = feedback.filter((f) => f.action === "save");
    const skips = feedback.filter((f) => f.action === "skip");
    const ratings = feedback.filter((f) => f.action === "rate" && f.rating != null);

    // Top occasions (from saves and positive ratings)
    const occasionCounts: Record<string, number> = {};
    for (const f of [...saves, ...ratings.filter((r) => (r.rating ?? 0) >= 4)]) {
      if (f.occasion_slug) {
        occasionCounts[f.occasion_slug] = (occasionCounts[f.occasion_slug] ?? 0) + 1;
      }
    }
    const topOccasions = Object.entries(occasionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([slug]) => slug);

    // Top vibes — need to look up the saved idea's vibe_tags
    const savedIdeaIds = saves
      .filter((f) => f.content_type === "idea")
      .map((f) => f.content_id);

    let topVibes: string[] = [];
    if (savedIdeaIds.length) {
      const { data: ideas } = await supabaseAdmin
        .from("ai_generated_ideas")
        .select("vibe_tags")
        .in("id", savedIdeaIds.slice(0, 50));

      if (ideas?.length) {
        const vibeCounts: Record<string, number> = {};
        for (const idea of ideas) {
          for (const tag of idea.vibe_tags ?? []) {
            vibeCounts[tag] = (vibeCounts[tag] ?? 0) + 1;
          }
        }
        topVibes = Object.entries(vibeCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([tag]) => tag);
      }
    }

    // Disliked tags — from skipped content
    const skippedIdeaIds = skips
      .filter((f) => f.content_type === "idea")
      .map((f) => f.content_id);

    let dislikedTags: string[] = [];
    if (skippedIdeaIds.length) {
      const { data: skippedIdeas } = await supabaseAdmin
        .from("ai_generated_ideas")
        .select("vibe_tags")
        .in("id", skippedIdeaIds.slice(0, 50));

      if (skippedIdeas?.length) {
        const skipCounts: Record<string, number> = {};
        for (const idea of skippedIdeas) {
          for (const tag of idea.vibe_tags ?? []) {
            skipCounts[tag] = (skipCounts[tag] ?? 0) + 1;
          }
        }
        // Only count as "disliked" if skipped ≥2 times and not in topVibes
        dislikedTags = Object.entries(skipCounts)
          .filter(([tag, count]) => count >= 2 && !topVibes.includes(tag))
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([tag]) => tag);
      }
    }

    // Average rating
    const ratingValues = ratings.map((r) => r.rating!);
    const avgRating = ratingValues.length
      ? ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length
      : null;

    // Upsert the signals
    const { error } = await supabaseAdmin
      .from("user_taste_signals")
      .upsert(
        {
          user_id: userId,
          top_occasions: topOccasions,
          top_vibes: topVibes,
          preferred_price: "$$", // could compute from saved venues later
          preferred_time: "Evening",
          disliked_tags: dislikedTags,
          total_saves: saves.length,
          total_skips: skips.length,
          total_ratings: ratings.length,
          avg_rating: avgRating,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

    if (error) {
      console.error("[taste-signals] Upsert error:", error.message);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      topOccasions,
      topVibes,
      dislikedTags,
      avgRating,
      totalFeedback: feedback.length,
    };
  });
