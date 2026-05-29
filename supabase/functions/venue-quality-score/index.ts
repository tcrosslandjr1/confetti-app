// ─────────────────────────────────────────────────────────────────────────────
// venue-quality-score — Closes the feedback loop.
//
// Aggregates attribution_events + pick_signals into a rolling 30-day quality
// score per venue. Called:
//   1. After every QR check-in (POST with { venue_id })
//   2. After every rate-your-night submission (POST with { venue_id })
//   3. Via daily cron to recompute all venues (POST with { mode: 'cron' })
//
// Output: upserts venue_quality_scores table, which ai-recommend reads
// as a reranking multiplier: final_score = base_score × (0.7 + 0.3 × quality)
// ─────────────────────────────────────────────────────────────────────────────

import { serve } from "../_shared/server.ts";
import { jsonResponse, errorResponse, supabaseAdmin } from "../_shared/supabase-client.ts";

// ── Score weights (must sum to 1.0) ──────────────────────────────────────────
const WEIGHTS = {
  completion_rate:   0.25,
  avg_rating:        0.25,
  return_rate:       0.20,
  dwell_score:       0.15,
  social_share_rate: 0.10,
  recency_boost:     0.05,
};

// Category-average dwell times (minutes) for normalisation
const CATEGORY_DWELL_BASELINE: Record<string, number> = {
  "cocktail bar":     75,
  "restaurant":       60,
  "rooftop bar":      90,
  "nightclub":       180,
  "brunch":           80,
  "coffee shop":      40,
  "lounge":          100,
  "default":          70,
};

interface QualityRequest {
  venue_id?: string;       // single venue recompute (post check-in / rating)
  mode?: "cron";           // recompute all venues with ≥1 event in last 30d
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204 });

  let body: QualityRequest = {};
  try { body = await req.json(); } catch { /* no body = cron mode */ }

  const sb = supabaseAdmin();

  // ── Determine which venue_ids to process ─────────────────────────────────
  let venueIds: string[] = [];

  if (body.mode === "cron") {
    // All venues with attribution events in the last 30 days
    const { data, error } = await sb
      .from("attribution_events")
      .select("venue_id")
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    if (error) return errorResponse(`cron venue fetch failed: ${error.message}`, 500);
    venueIds = [...new Set((data ?? []).map((r: { venue_id: string }) => r.venue_id))];
  } else if (body.venue_id) {
    venueIds = [body.venue_id];
  } else {
    return errorResponse("Provide venue_id or mode=cron", 400);
  }

  if (venueIds.length === 0) {
    return jsonResponse({ updated: 0, message: "No venues to process" });
  }

  const results: Array<{ venue_id: string; quality_score: number }> = [];

  for (const venueId of venueIds) {
    try {
      const score = await computeVenueScore(sb, venueId);
      results.push({ venue_id: venueId, quality_score: score });
    } catch (e) {
      console.warn(`[venue-quality-score] failed for ${venueId}:`, (e as Error).message);
    }
  }

  return jsonResponse({ updated: results.length, scores: results });
});

// ─────────────────────────────────────────────────────────────────────────────

async function computeVenueScore(
  // deno-lint-ignore no-explicit-any
  sb: any,
  venueId: string,
): Promise<number> {
  const window30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const window7d  = new Date(Date.now() -  7 * 24 * 60 * 60 * 1000).toISOString();
  const window90d = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  // ── Fetch attribution events ────────────────────────────────────────────
  const { data: events30d } = await sb
    .from("attribution_events")
    .select("user_id, method, party_size, dwell_minutes, shared_to_social, created_at, venue_name, city_code")
    .eq("venue_id", venueId)
    .gte("created_at", window30d);

  const { data: events7d } = await sb
    .from("attribution_events")
    .select("id")
    .eq("venue_id", venueId)
    .gte("created_at", window7d);

  const { data: events90d } = await sb
    .from("attribution_events")
    .select("user_id")
    .eq("venue_id", venueId)
    .gte("created_at", window90d);

  // ── Fetch ratings from pick_signals ────────────────────────────────────
  const { data: ratings } = await sb
    .from("pick_signals")
    .select("rating")
    .eq("venue_id", venueId)
    .eq("signal_type", "recap_note")
    .gte("created_at", window30d)
    .not("rating", "is", null);

  const ev = events30d ?? [];
  const sampleSize = ev.length;

  if (sampleSize === 0) {
    // Upsert with default 0.5 and zero confidence — no data yet
    await upsertScore(sb, venueId, {
      venue_name: null, city_code: null,
      completion_rate: 0.5, avg_rating: 0.5, return_rate: 0.5,
      dwell_score: 0.5, social_share_rate: 0.0,
      quality_score: 0.5, sample_size: 0, confidence: 0.0,
      verified_visits_30d: 0, total_party_size_30d: 0,
      social_amplifications: 0, avg_dwell_minutes: null,
      visit_velocity: 0.0,
    });
    return 0.5;
  }

  // Metadata from most recent event
  const latestEv = ev[0];
  const venueName  = latestEv?.venue_name ?? null;
  const cityCode   = latestEv?.city_code  ?? null;

  // ── 1. Completion rate ─────────────────────────────────────────────────
  // Proxy: ratio of 'verified' (qr_scan) events to all events
  const verifiedCount = ev.filter((e: { method: string }) => e.method === "qr_scan").length;
  const completionRate = sampleSize > 0 ? Math.min(verifiedCount / sampleSize, 1.0) : 0.5;

  // ── 2. Average rating ──────────────────────────────────────────────────
  const ratingList = (ratings ?? []).map((r: { rating: number }) => r.rating).filter(Boolean);
  const avgRating = ratingList.length > 0
    ? Math.min(ratingList.reduce((a: number, b: number) => a + b, 0) / ratingList.length / 5.0, 1.0)
    : 0.5;  // default to neutral when no ratings yet

  // ── 3. Return rate ─────────────────────────────────────────────────────
  const allUserIds = (events90d ?? []).map((e: { user_id: string }) => e.user_id).filter(Boolean);
  const userVisitCounts = allUserIds.reduce((acc: Record<string, number>, uid: string) => {
    acc[uid] = (acc[uid] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const uniqueUsers = Object.keys(userVisitCounts).length;
  const returningUsers = Object.values(userVisitCounts).filter((c) => (c as number) >= 2).length;
  const returnRate = uniqueUsers > 0 ? Math.min(returningUsers / uniqueUsers, 1.0) : 0.3;

  // ── 4. Dwell score ─────────────────────────────────────────────────────
  const dwellTimes = ev.map((e: { dwell_minutes: number | null }) => e.dwell_minutes).filter((d: number | null) => d != null && d > 0) as number[];
  const avgDwell = dwellTimes.length > 0
    ? dwellTimes.reduce((a, b) => a + b, 0) / dwellTimes.length
    : null;
  const baseline = CATEGORY_DWELL_BASELINE["default"];
  const dwellScore = avgDwell != null
    ? Math.min(avgDwell / baseline, 1.0)   // cap at 1.0 (2× baseline = perfect)
    : 0.5;

  // ── 5. Social share rate ───────────────────────────────────────────────
  const socialShares = ev.filter((e: { shared_to_social: boolean }) => e.shared_to_social).length;
  const socialShareRate = sampleSize > 0 ? Math.min(socialShares / sampleSize, 1.0) : 0.0;

  // ── 6. Recency boost ───────────────────────────────────────────────────
  // Compare last-7d vs daily avg of last 30d. Velocity > 1 = trending up.
  const recent7d = (events7d ?? []).length;
  const dailyAvg30d = sampleSize / 30;
  const weeklyRate  = recent7d / 7;
  const velocityRaw = dailyAvg30d > 0 ? (weeklyRate / dailyAvg30d) - 1.0 : 0.0;
  const velocity    = Math.max(-1.0, Math.min(1.0, velocityRaw));
  // Recency score: 0.5 = neutral, 1.0 = fast growing, 0.0 = shrinking fast
  const recencyScore = 0.5 + velocity * 0.5;

  // ── Composite score ────────────────────────────────────────────────────
  const raw =
    WEIGHTS.completion_rate   * completionRate   +
    WEIGHTS.avg_rating        * avgRating        +
    WEIGHTS.return_rate       * returnRate       +
    WEIGHTS.dwell_score       * dwellScore       +
    WEIGHTS.social_share_rate * socialShareRate  +
    WEIGHTS.recency_boost     * recencyScore;

  // Confidence ramps up with sample size (0 at n=0, 1.0 at n=50+)
  const confidence = Math.min(sampleSize / 50, 1.0);

  // Blend with prior of 0.5 until we have enough data
  const qualityScore = (1 - confidence) * 0.5 + confidence * raw;

  // ── Dashboard aggregates ───────────────────────────────────────────────
  const totalPartySize = ev
    .map((e: { party_size: number | null }) => e.party_size ?? 0)
    .reduce((a: number, b: number) => a + b, 0);

  await upsertScore(sb, venueId, {
    venue_name: venueName,
    city_code: cityCode,
    completion_rate: round2(completionRate),
    avg_rating: round2(avgRating),
    return_rate: round2(returnRate),
    dwell_score: round2(dwellScore),
    social_share_rate: round2(socialShareRate),
    quality_score: round2(qualityScore),
    sample_size: sampleSize,
    confidence: round2(confidence),
    verified_visits_30d: verifiedCount,
    total_party_size_30d: totalPartySize,
    social_amplifications: socialShares,
    avg_dwell_minutes: avgDwell != null ? round2(avgDwell) : null,
    visit_velocity: round2(velocity),
  });

  return qualityScore;
}

// ─────────────────────────────────────────────────────────────────────────────

interface ScorePayload {
  venue_name: string | null;
  city_code: string | null;
  completion_rate: number;
  avg_rating: number;
  return_rate: number;
  dwell_score: number;
  social_share_rate: number;
  quality_score: number;
  sample_size: number;
  confidence: number;
  verified_visits_30d: number;
  total_party_size_30d: number;
  social_amplifications: number;
  avg_dwell_minutes: number | null;
  visit_velocity: number;
}

// deno-lint-ignore no-explicit-any
async function upsertScore(sb: any, venueId: string, payload: ScorePayload) {
  await sb
    .from("venue_quality_scores")
    .upsert(
      { venue_id: venueId, ...payload, computed_at: new Date().toISOString() },
      { onConflict: "venue_id" },
    );
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
