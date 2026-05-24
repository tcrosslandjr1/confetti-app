/**
 * Server functions for the Social Signal Layer.
 *
 * Exposes endpoints for:
 *   1. fetchTrendingByCity — get social signals for a city, optionally filtered by type
 *   2. refreshSocialSignals — trigger on-demand collection for a city
 *   3. getSocialContext — load structured social context for prompt injection
 *   4. runSocialBatch — trigger full batch collection across cities
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  collectOnDemand,
  loadSocialContext,
  runSocialSignalBatch,
  type SocialContext,
  type CollectionResult,
  type SignalType,
} from "./agents/social-signal-collector";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// ─── Schemas ────────────────────────────────────────────────

const CitySignalSchema = z.object({
  citySlug: z.string().min(1).max(60),
  signalType: z
    .enum(["trending", "popular", "new", "lowkey", "unique"])
    .nullable()
    .optional(),
  limit: z.number().int().min(1).max(50).optional(),
});

const RefreshSchema = z.object({
  citySlug: z.string().min(1).max(60),
});

const ContextSchema = z.object({
  citySlug: z.string().min(1).max(60),
});

const BatchSchema = z.object({
  citySlugs: z.array(z.string().max(60)).max(20).optional(),
});

// ─── 1. Fetch Social Signals by City ────────────────────────

/**
 * Read social signals for a city from Supabase.
 * Optionally filter by signal type (trending, popular, etc.).
 */
export const fetchTrendingByCity = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => CitySignalSchema.parse(input))
  .handler(async ({ data: req }) => {
    let query = supabaseAdmin
      .from("social_venue_signals")
      .select("*")
      .eq("city_slug", req.citySlug)
      .eq("is_active", true)
      .order("engagement_score", { ascending: false })
      .limit(req.limit ?? 20);

    if (req.signalType) {
      query = query.eq("signal_type", req.signalType);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[social-fn] Fetch error:", error.message);
      return { success: false, signals: [], error: error.message };
    }

    return {
      success: true,
      signals: data ?? [],
      count: data?.length ?? 0,
    };
  });

// ─── 2. Refresh Social Signals (On-Demand) ──────────────────

/**
 * Trigger fresh social signal collection for a single city.
 * Collects new signals via AI, persists them, then returns the
 * structured social context.
 */
export const refreshSocialSignals = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => RefreshSchema.parse(input))
  .handler(async ({ data: req }): Promise<{
    success: boolean;
    context: SocialContext | null;
    error?: string;
  }> => {
    try {
      const context = await collectOnDemand(req.citySlug);
      return { success: true, context };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[social-fn] Refresh error:", message);
      return { success: false, context: null, error: message };
    }
  });

// ─── 3. Get Social Context (Cached Read) ────────────────────

/**
 * Load the structured social context for a city from cached signals.
 * Does NOT trigger new collection — use refreshSocialSignals for that.
 * This is the primary entry point for injecting social data into AI prompts.
 */
export const getSocialContext = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ContextSchema.parse(input))
  .handler(async ({ data: req }): Promise<{
    success: boolean;
    context: SocialContext | null;
  }> => {
    const context = await loadSocialContext(req.citySlug);
    return { success: true, context };
  });

// ─── 4. Run Social Signal Batch ─────────────────────────────

/**
 * Trigger a full batch collection across all (or specified) cities.
 * Designed to be called from a scheduled job alongside the daily
 * AI Content Engine batch.
 */
export const runSocialBatch = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => BatchSchema.parse(input))
  .handler(async ({ data: req }): Promise<CollectionResult> => {
    return runSocialSignalBatch({
      citySlugs: req.citySlugs,
    });
  });
