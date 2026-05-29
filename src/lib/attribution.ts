/**
 * attribution.ts
 *
 * Writes check-in events to `attribution_events` in Supabase and
 * triggers venue quality score recompute via the Edge Function.
 *
 * All calls are best-effort (fire-and-forget). Never block the user.
 */

import { supabase } from "@/integrations/supabase/client";

// We cast to `any` because attribution_events is a new table and hasn't been
// regenerated into the supabase types file yet.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

export interface CheckInAttributionPayload {
  itineraryId: string;
  stopId: string;
  venueId: string;
  venueName?: string;
  cityCode?: string;
  partySize?: number;
  spendTier?: "low" | "medium" | "high";
}

/**
 * Called on successful QR check-in.
 * 1. Writes an attribution_events row (method = 'qr_scan').
 * 2. Calls the venue-quality-score Edge Function to recompute quality.
 */
export async function recordCheckInAttribution(
  payload: CheckInAttributionPayload,
): Promise<void> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const row = {
      itinerary_id: payload.itineraryId,
      stop_id: payload.stopId,
      venue_id: payload.venueId,
      venue_name: payload.venueName ?? null,
      user_id: session?.user?.id ?? null,
      method: "qr_scan",
      party_size: payload.partySize ?? null,
      spend_tier: payload.spendTier ?? null,
      city_code: payload.cityCode ?? null,
      from_itinerary: true,
      confetti_referral_code: `${payload.itineraryId}_${payload.stopId}`,
      shared_to_social: false,
    };

    const { error } = await sb.from("attribution_events").insert(row);
    if (error) {
      console.warn("[attribution] insert failed:", error.message);
      return;
    }

    // Trigger quality score recompute (non-blocking)
    void triggerQualityRecompute(payload.venueId);
  } catch (e) {
    console.warn("[attribution] unexpected error:", (e as Error).message);
  }
}

/**
 * Called after a rate-your-night recap rating is saved.
 * Recomputes quality score so the fresh rating is reflected immediately.
 */
export async function triggerQualityRecompute(venueId: string): Promise<void> {
  try {
    await supabase.functions.invoke("venue-quality-score", {
      body: { venue_id: venueId },
    });
  } catch (e) {
    // Non-critical — cron will recompute daily even if this fails
    console.warn("[attribution] quality recompute failed:", (e as Error).message);
  }
}

/**
 * Called when user shares itinerary to social (Instagram, TikTok, etc.)
 * Updates the attribution event's share fields and triggers recompute.
 */
export async function recordSocialShare(
  venueId: string,
  platform: "instagram" | "tiktok" | "twitter" | "other",
): Promise<void> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user?.id) return;

    // Mark the most recent attribution event for this user+venue as shared
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await sb
      .from("attribution_events")
      .update({ shared_to_social: true, share_platform: platform })
      .eq("venue_id", venueId)
      .eq("user_id", session.user.id)
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(1);

    void triggerQualityRecompute(venueId);
  } catch (e) {
    console.warn("[attribution] social share record failed:", (e as Error).message);
  }
}
