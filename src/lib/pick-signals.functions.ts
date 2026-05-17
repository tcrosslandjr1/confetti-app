import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SignalKind = z.enum([
  "mood",
  "swap_reason",
  "recap_note",
  "linger",
  "save",
  "swipe_away",
  "reopen",
]);

const SignalSchema = z.object({
  kind: SignalKind,
  value: z.string().min(1).max(80),
  context: z.record(z.string(), z.unknown()).optional(),
});

// Pick signals are fire-and-forget telemetry. Anonymous users (no auth header)
// are silently ignored — we never want this to surface as a 401 in the UI.
export const recordPickSignal = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SignalSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      const { getRequest } = await import("@tanstack/react-start/server");
      const { createClient } = await import("@supabase/supabase-js");
      const req = getRequest();
      const authHeader = req?.headers.get("authorization");
      if (!authHeader?.startsWith("Bearer ")) return { ok: true, skipped: true };
      const token = authHeader.slice(7);
      const SUPABASE_URL = process.env.SUPABASE_URL!;
      const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY!;
      const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data: claims } = await supabase.auth.getClaims(token);
      const userId = claims?.claims?.sub;
      if (!userId) return { ok: true, skipped: true };
      await supabase.from("pick_signals").insert({
        user_id: userId,
        kind: data.kind,
        value: data.value,
        context: (data.context ?? {}) as never,
      });
      return { ok: true };
    } catch (err) {
      console.error("[recordPickSignal] failed", err);
      return { ok: false };
    }
  });

const RatingSchema = z.object({
  itineraryId: z.string().uuid(),
  overallRating: z.number().int().min(1).max(5).optional(),
  overallReview: z.string().max(800).optional(),
  stops: z
    .array(
      z.object({
        stopId: z.string().uuid(),
        rating: z.number().int().min(1).max(5).optional(),
        review: z.string().max(400).optional(),
      }),
    )
    .max(20)
    .optional(),
});

export const saveItineraryRecap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => RatingSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error: itinErr } = await supabase
      .from("itineraries")
      .update({
        overall_rating: data.overallRating ?? null,
        overall_review: data.overallReview ?? null,
        completed_at: new Date().toISOString(),
      })
      .eq("id", data.itineraryId);
    if (itinErr) throw new Error(itinErr.message);

    if (data.stops?.length) {
      for (const s of data.stops) {
        const { error } = await supabase
          .from("itinerary_stops")
          .update({ user_rating: s.rating ?? null, user_review: s.review ?? null })
          .eq("id", s.stopId);
        if (error) throw new Error(error.message);
      }
    }
    return { ok: true };
  });

export type TasteCandidate = {
  value: string;
  loveScore: number;
  avoidScore: number;
  suggestion: "love" | "avoid";
  signals: { linger: number; save: number; reopen: number; swipe_away: number };
};

/**
 * Aggregate the last 7 days of passive card signals into love/avoid candidates.
 * - linger (≥3) and save (≥1) and reopen (≥2) push toward "love"
 * - swipe_away (≥3) with no positive engagement pushes toward "avoid"
 */
export const getTasteCandidates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from("pick_signals")
      .select("kind,value")
      .eq("user_id", userId)
      .in("kind", ["linger", "save", "swipe_away", "reopen"])
      .gte("created_at", since);
    if (error) throw new Error(error.message);

    const buckets = new Map<
      string,
      { linger: number; save: number; reopen: number; swipe_away: number }
    >();
    for (const row of data ?? []) {
      const v = (row.value || "").toLowerCase();
      if (!v) continue;
      const b = buckets.get(v) ?? { linger: 0, save: 0, reopen: 0, swipe_away: 0 };
      const k = row.kind as keyof typeof b;
      if (k in b) (b as Record<string, number>)[k] = (b[k] ?? 0) + 1;
      buckets.set(v, b);
    }

    const out: TasteCandidate[] = [];
    for (const [value, s] of buckets) {
      const loveScore = s.linger + s.save * 3 + s.reopen * 2;
      const avoidScore = s.swipe_away - s.linger - s.save * 2;
      if (loveScore >= 3 && loveScore > avoidScore) {
        out.push({ value, loveScore, avoidScore, suggestion: "love", signals: s });
      } else if (avoidScore >= 3) {
        out.push({ value, loveScore, avoidScore, suggestion: "avoid", signals: s });
      }
    }
    out.sort((a, b) => Math.max(b.loveScore, b.avoidScore) - Math.max(a.loveScore, a.avoidScore));
    return { candidates: out.slice(0, 8) };
  });

const ConfirmSchema = z.object({
  loves: z.array(z.string().min(1).max(80)).max(20).default([]),
  avoids: z.array(z.string().min(1).max(80)).max(20).default([]),
});

/** Merge user-confirmed terms into taste_profile.loves / taste_profile.avoid. */
export const confirmTasteUpdate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ConfirmSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("user_preferences")
      .select("taste_profile")
      .eq("user_id", userId)
      .maybeSingle();
    const tp =
      ((existing?.taste_profile ?? {}) as {
        loves?: string[];
        avoid?: string[];
      }) || {};
    const loves = Array.from(
      new Set([
        ...(tp.loves ?? []).map((s) => s.toLowerCase()),
        ...data.loves.map((s) => s.toLowerCase()),
      ]),
    ).slice(0, 30);
    const avoid = Array.from(
      new Set([
        ...(tp.avoid ?? []).map((s) => s.toLowerCase()),
        ...data.avoids.map((s) => s.toLowerCase()),
      ]),
    ).slice(0, 30);
    // Drop anything that ended up on both lists in favor of the most recent vote.
    const filteredLoves = loves.filter((l) => !data.avoids.map((s) => s.toLowerCase()).includes(l));
    const filteredAvoid = avoid.filter((a) => !data.loves.map((s) => s.toLowerCase()).includes(a));
    const next = { ...tp, loves: filteredLoves, avoid: filteredAvoid };
    const { error } = await supabase
      .from("user_preferences")
      .upsert({ user_id: userId, taste_profile: next as never }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true, taste_profile: next };
  });
