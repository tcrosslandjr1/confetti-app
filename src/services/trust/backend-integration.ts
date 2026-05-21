// ============================================================
// CONFETTI TRUST LAYER — Backend Integration
// Production-ready service layer wired to @/lib/supabase
//
// This file provides the core services for trust data:
// verification badges, live crowd readings, pricing,
// safety flags, and spend estimates.
// ============================================================

import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { VenueCard } from "@/lib/venue-discovery-types";

import type {
  VenueVerification,
  VerificationTier,
  CrowdReading,
  CrowdLevel,
  VenuePricing,
  SafetyFlag,
  SpendEstimate,
} from "./types";

// ============================================================
// 1. EXTENDED VENUE TYPE — adds trust fields to existing VenueCard
// ============================================================

export interface VenueCardWithTrust extends VenueCard {
  trust?: {
    verification: VenueVerification | null;
    crowd: CrowdReading | null;
    pricing: VenuePricing[];
    safetyFlags: SafetyFlag[];
    spendEstimate: SpendEstimate | null;
  };
}

// ============================================================
// 2. SERVICE FUNCTIONS — direct Supabase queries
//    (with isSupabaseConfigured guard)
// ============================================================

async function safeFetch<T>(
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  if (!isSupabaseConfigured) return fallback;
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

/** Fetch verification data for a single venue */
export async function getVenueVerification(
  venueId: string
): Promise<VenueVerification | null> {
  return safeFetch(async () => {
    const { data, error } = await supabase
      .from("venues")
      .select(
        `verification_tier, verified_at, verified_by,
         verification_score, checkin_count, complaint_count,
         avg_rating, is_direct_partner, has_exclusive_experiences,
         photos_verified, real_photo_count, ai_photo_count`
      )
      .eq("id", venueId)
      .single();

    if (error || !data) return null;

    return {
      tier: data.verification_tier as VerificationTier,
      verifiedAt: data.verified_at,
      verifiedBy: data.verified_by,
      verificationScore: data.verification_score,
      checkinCount: data.checkin_count,
      complaintCount: data.complaint_count,
      avgRating: data.avg_rating,
      isDirectPartner: data.is_direct_partner,
      hasExclusiveExperiences: data.has_exclusive_experiences,
      photosVerified: data.photos_verified,
      realPhotoCount: data.real_photo_count,
      aiPhotoCount: data.ai_photo_count,
    };
  }, null);
}

/** Fetch the freshest crowd reading */
export async function getCurrentCrowd(
  venueId: string
): Promise<CrowdReading | null> {
  return safeFetch(async () => {
    const { data, error } = await supabase
      .from("venue_crowd_readings")
      .select("*")
      .eq("venue_id", venueId)
      .gte("expires_at", new Date().toISOString())
      .order("reported_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      venueId: data.venue_id,
      level: data.level as CrowdLevel,
      energyScore: data.energy_score,
      source: data.source,
      confidence: data.confidence,
      estimatedWaitMinutes: data.estimated_wait_minutes,
      reportedAt: data.reported_at,
      expiresAt: data.expires_at,
    };
  }, null);
}

/** Subscribe to real-time crowd inserts for a venue */
export function subscribeToCrowd(
  venueId: string,
  onUpdate: (reading: CrowdReading) => void
): () => void {
  if (!isSupabaseConfigured) return () => {};

  const channel = supabase
    .channel(`crowd:${venueId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "venue_crowd_readings",
        filter: `venue_id=eq.${venueId}`,
      },
      (payload) => {
        const d = payload.new;
        onUpdate({
          id: d.id,
          venueId: d.venue_id,
          level: d.level as CrowdLevel,
          energyScore: d.energy_score,
          source: d.source,
          confidence: d.confidence,
          estimatedWaitMinutes: d.estimated_wait_minutes,
          reportedAt: d.reported_at,
          expiresAt: d.expires_at,
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/** Fetch pricing rows for a venue */
export async function getVenuePricing(
  venueId: string
): Promise<VenuePricing[]> {
  return safeFetch(async () => {
    const { data, error } = await supabase
      .from("venue_pricing")
      .select("*")
      .eq("venue_id", venueId)
      .order("category");

    if (error || !data) return [];

    return data.map((d) => ({
      id: d.id,
      venueId: d.venue_id,
      category: d.category,
      priceLow: d.price_low,
      priceHigh: d.price_high,
      currency: d.currency,
      notes: d.notes,
      source: d.source,
      confidence: d.confidence,
      lastVerified: d.last_verified,
    }));
  }, []);
}

/** Fetch safety flags for a venue */
export async function getVenueSafetyFlags(
  venueId: string
): Promise<SafetyFlag[]> {
  return safeFetch(async () => {
    const { data, error } = await supabase
      .from("venue_safety_flags")
      .select("*")
      .eq("venue_id", venueId)
      .eq("status", "approved");

    if (error || !data) return [];

    return data.map((d) => ({
      id: d.id,
      venueId: d.venue_id,
      flagType: d.flag_type,
      reportCount: d.report_count,
      isPositive: ["well_lit", "easy_pickup", "doorman"].includes(d.flag_type),
    }));
  }, []);
}

/** Fetch spend estimate for a party size */
export async function getSpendEstimate(
  venueId: string,
  partySize: number
): Promise<SpendEstimate | null> {
  return safeFetch(async () => {
    const { data, error } = await supabase
      .from("venue_spend_estimates")
      .select("*")
      .eq("venue_id", venueId)
      .eq("party_size", partySize)
      .single();

    if (error || !data) return null;

    return {
      venueId: data.venue_id,
      partySize: data.party_size,
      avgSpendPerPerson: data.avg_spend_per_person,
      medianSpendPerPerson: data.median_spend_per_person,
      sampleCount: data.sample_count,
      includesTip: data.includes_tip,
      timeContext: data.time_context,
    };
  }, null);
}

// ============================================================
// 3. COMPOSITE HOOK — single hook that loads all trust data
// ============================================================

export interface TrustSignals {
  verification: VenueVerification | null;
  crowd: CrowdReading | null;
  pricing: VenuePricing[];
  safetyFlags: SafetyFlag[];
  spendEstimate: SpendEstimate | null;
  loading: boolean;
  error: string | null;
}

export function useVenueTrustSignals(
  venueId: string | null,
  partySize = 2
): TrustSignals {
  const [state, setState] = useState<TrustSignals>({
    verification: null,
    crowd: null,
    pricing: [],
    safetyFlags: [],
    spendEstimate: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!venueId) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }

    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    Promise.all([
      getVenueVerification(venueId),
      getCurrentCrowd(venueId),
      getVenuePricing(venueId),
      getVenueSafetyFlags(venueId),
      getSpendEstimate(venueId, partySize),
    ])
      .then(([verification, crowd, pricing, safetyFlags, spendEstimate]) => {
        if (cancelled) return;
        setState({
          verification,
          crowd,
          pricing,
          safetyFlags,
          spendEstimate,
          loading: false,
          error: null,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setState((s) => ({
          ...s,
          loading: false,
          error: err?.message ?? "Failed to load trust signals",
        }));
      });

    // Real-time crowd subscription
    const unsub = subscribeToCrowd(venueId, (reading) => {
      if (!cancelled) {
        setState((s) => ({ ...s, crowd: reading }));
      }
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [venueId, partySize]);

  return state;
}

// ============================================================
// 4. BATCH HOOK — load trust data for a list of venues at once
//    (used on the Discover feed to avoid N+1 queries)
// ============================================================

export function useBatchTrustSignals(venueIds: string[]) {
  const [map, setMap] = useState<Record<string, Partial<TrustSignals>>>({});
  const [loading, setLoading] = useState(true);

  const idsKey = useMemo(() => venueIds.sort().join(","), [venueIds]);

  useEffect(() => {
    if (!venueIds.length || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    // Batch query: verification tiers for all venues at once
    Promise.all([
      supabase
        .from("venues")
        .select(
          "id, verification_tier, verified_at, verification_score, avg_rating, is_direct_partner"
        )
        .in("id", venueIds),
      supabase
        .from("venue_crowd_readings")
        .select("*")
        .in("venue_id", venueIds)
        .gte("expires_at", new Date().toISOString())
        .order("reported_at", { ascending: false }),
    ]).then(([verRes, crowdRes]) => {
      if (cancelled) return;

      const result: Record<string, Partial<TrustSignals>> = {};

      // Map verification data
      for (const v of verRes.data ?? []) {
        result[v.id] = {
          verification: {
            tier: v.verification_tier as VerificationTier,
            verifiedAt: v.verified_at,
            verifiedBy: "auto",
            verificationScore: v.verification_score ?? 0,
            checkinCount: 0,
            complaintCount: 0,
            avgRating: v.avg_rating ?? 0,
            isDirectPartner: v.is_direct_partner ?? false,
            hasExclusiveExperiences: false,
            photosVerified: false,
            realPhotoCount: 0,
            aiPhotoCount: 0,
          },
        };
      }

      // Map crowd data — take the most recent per venue
      const seen = new Set<string>();
      for (const c of crowdRes.data ?? []) {
        if (seen.has(c.venue_id)) continue;
        seen.add(c.venue_id);

        if (!result[c.venue_id]) result[c.venue_id] = {};
        result[c.venue_id].crowd = {
          id: c.id,
          venueId: c.venue_id,
          level: c.level as CrowdLevel,
          energyScore: c.energy_score,
          source: c.source,
          confidence: c.confidence,
          estimatedWaitMinutes: c.estimated_wait_minutes,
          reportedAt: c.reported_at,
          expiresAt: c.expires_at,
        };
      }

      setMap(result);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [idsKey]);

  return { map, loading };
}

// ============================================================
// 5. UTILITY — merge trust data onto an existing VenueCard
// ============================================================

export function enrichVenueCard(
  card: VenueCard,
  trust: Partial<TrustSignals>
): VenueCardWithTrust {
  return {
    ...card,
    trust: {
      verification: trust.verification ?? null,
      crowd: trust.crowd ?? null,
      pricing: trust.pricing ?? [],
      safetyFlags: trust.safetyFlags ?? [],
      spendEstimate: trust.spendEstimate ?? null,
    },
  };
}

// ============================================================
// 6. ENERGY HELPERS (client-side, no DB)
// ============================================================

export function calculateEnergyScore(params: {
  checkinVelocity: number;
  googleBusyness: number | null;
  venueCapacity: number | null;
  currentCount: number | null;
}): number {
  const velocityScore = Math.min(params.checkinVelocity * 10, 100);
  const googleScore = params.googleBusyness ?? 50;
  let occupancyScore = 50;
  if (params.venueCapacity && params.venueCapacity > 0 && params.currentCount != null) {
    occupancyScore = (params.currentCount / params.venueCapacity) * 100;
  }
  const final = googleScore * 0.4 + velocityScore * 0.35 + occupancyScore * 0.25;
  return Math.min(Math.round(final * 100) / 100, 100);
}

export function energyToCrowdLevel(score: number): CrowdLevel {
  if (score >= 85) return "at_capacity";
  if (score >= 60) return "busy";
  if (score >= 30) return "moderate";
  return "quiet";
}

// ============================================================
// 7. RIDE DEEP LINKS
// ============================================================

export function getRideDeepLink(
  service: "uber" | "lyft",
  pickup: { lat: number; lng: number; name: string },
  destination: { lat: number; lng: number } | null
): string {
  if (service === "uber") {
    const params = new URLSearchParams({
      action: "setPickup",
      "pickup[latitude]": pickup.lat.toString(),
      "pickup[longitude]": pickup.lng.toString(),
      "pickup[nickname]": pickup.name,
    });
    if (destination) {
      params.set("dropoff[latitude]", destination.lat.toString());
      params.set("dropoff[longitude]", destination.lng.toString());
      params.set("dropoff[nickname]", "Home");
    }
    return `uber://?${params.toString()}`;
  }

  const params = new URLSearchParams({
    "pickup[latitude]": pickup.lat.toString(),
    "pickup[longitude]": pickup.lng.toString(),
  });
  if (destination) {
    params.set("destination[latitude]", destination.lat.toString());
    params.set("destination[longitude]", destination.lng.toString());
  }
  return `lyft://ridetype?id=lyft&${params.toString()}`;
}
