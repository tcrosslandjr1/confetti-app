// ============================================================
// CONFETTI TRUST LAYER — Hooks & Service Functions
// Supabase queries, real-time subscriptions, business logic
// ============================================================

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type {
  VenueVerification,
  VerificationTier,
  CrowdReading,
  CrowdLevel,
  VenuePricing,
  SpendEstimate,
  ItineraryPriceEstimate,
  SafetyFlag,
  UserSafetySettings,
} from './01-types';

// ============================================================
// VERIFICATION SERVICE
// ============================================================

export async function fetchVenueVerification(venueId: string): Promise<VenueVerification | null> {
  const { data, error } = await supabase
    .from('venues')
    .select(`
      verification_tier,
      verified_at,
      verified_by,
      verification_score,
      checkin_count,
      complaint_count,
      avg_rating,
      is_direct_partner,
      has_exclusive_experiences,
      photos_verified,
      real_photo_count,
      ai_photo_count
    `)
    .eq('id', venueId)
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
}

/**
 * Auto-verification: Cross-references Google Places data to verify venue.
 * Called when a new venue is added or periodically for unverified venues.
 */
export async function autoVerifyVenue(venueId: string, googlePlacesData: {
  name: string;
  address: string;
  isOpen: boolean;
  rating: number;
  totalRatings: number;
  types: string[];
}): Promise<VerificationTier> {
  const { data: venue } = await supabase
    .from('venues')
    .select('name, address, verification_tier')
    .eq('id', venueId)
    .single();

  if (!venue) return 'unverified';

  // Score calculation
  let score = 0;

  // Name match (fuzzy)
  const nameMatch = venue.name.toLowerCase().includes(googlePlacesData.name.toLowerCase()) ||
    googlePlacesData.name.toLowerCase().includes(venue.name.toLowerCase());
  if (nameMatch) score += 30;

  // Address match
  const addressMatch = venue.address?.toLowerCase().includes(googlePlacesData.address.toLowerCase().slice(0, 20));
  if (addressMatch) score += 25;

  // Currently open
  if (googlePlacesData.isOpen) score += 10;

  // Rating exists and decent
  if (googlePlacesData.rating >= 4.0) score += 20;
  else if (googlePlacesData.rating >= 3.5) score += 10;

  // Has enough reviews
  if (googlePlacesData.totalRatings >= 100) score += 15;
  else if (googlePlacesData.totalRatings >= 30) score += 10;

  // Determine tier based on score
  let newTier: VerificationTier = 'unverified';
  if (score >= 70) newTier = 'verified';

  // Update venue
  await supabase
    .from('venues')
    .update({
      verification_score: score,
      verification_tier: newTier,
      verified_at: newTier !== 'unverified' ? new Date().toISOString() : null,
      verified_by: 'auto',
      avg_rating: googlePlacesData.rating,
    })
    .eq('id', venueId);

  // Log the verification
  await supabase.from('venue_verification_log').insert({
    venue_id: venueId,
    previous_tier: venue.verification_tier,
    new_tier: newTier,
    reason: `Auto-verification score: ${score}/100`,
    verified_by: 'auto',
    metadata: { google_data: googlePlacesData, score },
  });

  return newTier;
}

// ============================================================
// CROWD LEVEL SERVICE
// ============================================================

export async function fetchCurrentCrowd(venueId: string): Promise<CrowdReading | null> {
  const { data, error } = await supabase
    .from('venue_crowd_readings')
    .select('*')
    .eq('venue_id', venueId)
    .gte('expires_at', new Date().toISOString())
    .order('reported_at', { ascending: false })
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
}

/**
 * Real-time crowd subscription for a venue.
 * Returns unsubscribe function.
 */
export function subscribeToCrowd(
  venueId: string,
  onUpdate: (reading: CrowdReading) => void
): () => void {
  const channel = supabase
    .channel(`crowd:${venueId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'venue_crowd_readings',
        filter: `venue_id=eq.${venueId}`,
      },
      (payload) => {
        const data = payload.new;
        onUpdate({
          id: data.id,
          venueId: data.venue_id,
          level: data.level as CrowdLevel,
          energyScore: data.energy_score,
          source: data.source,
          confidence: data.confidence,
          estimatedWaitMinutes: data.estimated_wait_minutes,
          reportedAt: data.reported_at,
          expiresAt: data.expires_at,
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Calculate energy score from multiple signals.
 * Mirrors the SQL function for client-side use.
 */
export function calculateEnergyScore(params: {
  checkinVelocity: number; // check-ins per hour
  googleBusyness: number | null; // 0-100
  venueCapacity: number | null;
  currentCount: number | null;
}): number {
  const velocityScore = Math.min(params.checkinVelocity * 10, 100);
  const googleScore = params.googleBusyness ?? 50;

  let occupancyScore = 50;
  if (params.venueCapacity && params.venueCapacity > 0 && params.currentCount != null) {
    occupancyScore = (params.currentCount / params.venueCapacity) * 100;
  }

  const final = (googleScore * 0.4) + (velocityScore * 0.35) + (occupancyScore * 0.25);
  return Math.min(Math.round(final * 100) / 100, 100);
}

export function energyToCrowdLevel(score: number): CrowdLevel {
  if (score >= 85) return 'at_capacity';
  if (score >= 60) return 'busy';
  if (score >= 30) return 'moderate';
  return 'quiet';
}

// ============================================================
// PRICING SERVICE
// ============================================================

export async function fetchVenuePricing(venueId: string): Promise<VenuePricing[]> {
  const { data, error } = await supabase
    .from('venue_pricing')
    .select('*')
    .eq('venue_id', venueId)
    .order('category');

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
}

export async function fetchSpendEstimate(
  venueId: string,
  partySize: number
): Promise<SpendEstimate | null> {
  const { data, error } = await supabase
    .from('venue_spend_estimates')
    .select('*')
    .eq('venue_id', venueId)
    .eq('party_size', partySize)
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
}

/**
 * Calculate itinerary-level price estimate from individual stops.
 */
export async function calculateItineraryEstimate(
  stops: { venueId: string; venueName: string }[],
  partySize: number,
  budgetPerPerson: number | null
): Promise<ItineraryPriceEstimate> {
  const stopEstimates = await Promise.all(
    stops.map(async (stop) => {
      const pricing = await fetchVenuePricing(stop.venueId);

      // Estimate per person: avg of cocktail prices * 2 + appetizer avg
      let low = 0;
      let high = 0;

      const cocktails = pricing.find((p) => p.category === 'cocktails');
      const covers = pricing.find((p) => p.category === 'cover');

      if (cocktails) {
        low += cocktails.priceLow * 2; // assume 2 drinks
        high += cocktails.priceHigh * 3; // assume 3 drinks
      } else {
        low += 15; // fallback
        high += 40;
      }

      if (covers) {
        low += covers.priceLow;
        high += covers.priceHigh;
      }

      return {
        venueId: stop.venueId,
        venueName: stop.venueName,
        estimateLow: low,
        estimateHigh: high,
      };
    })
  );

  const totalLow = stopEstimates.reduce((sum, s) => sum + s.estimateLow, 0) * partySize;
  const totalHigh = stopEstimates.reduce((sum, s) => sum + s.estimateHigh, 0) * partySize;
  const perPersonLow = stopEstimates.reduce((sum, s) => sum + s.estimateLow, 0);
  const perPersonHigh = stopEstimates.reduce((sum, s) => sum + s.estimateHigh, 0);

  return {
    stops: stopEstimates,
    totalLow,
    totalHigh,
    perPersonLow,
    perPersonHigh,
    partySize,
    overBudget: budgetPerPerson ? perPersonHigh > budgetPerPerson : false,
    budgetLimit: budgetPerPerson,
  };
}

export async function submitSpendReport(
  userId: string,
  venueId: string,
  partySize: number,
  totalSpend: number
): Promise<void> {
  await supabase.from('user_spend_reports').insert({
    user_id: userId,
    venue_id: venueId,
    party_size: partySize,
    total_spend: totalSpend,
    visit_date: new Date().toISOString().split('T')[0],
  });
}

// ============================================================
// SAFETY SERVICE
// ============================================================

export async function fetchSafetyFlags(venueId: string): Promise<SafetyFlag[]> {
  const { data, error } = await supabase
    .from('venue_safety_flags')
    .select('*')
    .eq('venue_id', venueId)
    .eq('status', 'approved');

  if (error || !data) return [];

  return data.map((d) => ({
    id: d.id,
    venueId: d.venue_id,
    flagType: d.flag_type,
    reportCount: d.report_count,
    isPositive: ['well_lit', 'easy_pickup', 'doorman'].includes(d.flag_type),
  }));
}

export async function fetchUserSafetySettings(userId: string): Promise<UserSafetySettings | null> {
  const { data, error } = await supabase
    .from('user_safety_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;

  return {
    homeAddressEncrypted: data.home_address_encrypted,
    emergencyContacts: data.emergency_contacts ?? [],
    buddyEnabled: data.buddy_enabled,
    drinkLimitEnabled: data.drink_limit_enabled,
    drinkLimit: data.drink_limit,
    shareLocationOnRide: data.share_location_on_ride,
  };
}

export async function updateSafetySettings(
  userId: string,
  updates: Partial<UserSafetySettings>
): Promise<void> {
  await supabase
    .from('user_safety_settings')
    .upsert({
      user_id: userId,
      ...updates,
      updated_at: new Date().toISOString(),
    });
}

export async function logSafeRouteHome(
  userId: string,
  itineraryId: string,
  rideService: 'uber' | 'lyft'
): Promise<void> {
  await supabase.from('safe_route_home_logs').insert({
    user_id: userId,
    itinerary_id: itineraryId,
    ride_service: rideService,
  });
}

export async function confirmHomeSafe(logId: string, buddyId?: string): Promise<void> {
  await supabase
    .from('safe_route_home_logs')
    .update({
      home_confirmed: true,
      confirmed_at: new Date().toISOString(),
      buddy_notified: !!buddyId,
    })
    .eq('id', logId);
}

/**
 * Generate ride deep link with venue as pickup, home as destination.
 */
export function getRideDeepLink(
  service: 'uber' | 'lyft',
  pickup: { lat: number; lng: number; name: string },
  destination: { lat: number; lng: number } | null
): string {
  if (service === 'uber') {
    const params = new URLSearchParams({
      action: 'setPickup',
      'pickup[latitude]': pickup.lat.toString(),
      'pickup[longitude]': pickup.lng.toString(),
      'pickup[nickname]': pickup.name,
    });
    if (destination) {
      params.set('dropoff[latitude]', destination.lat.toString());
      params.set('dropoff[longitude]', destination.lng.toString());
      params.set('dropoff[nickname]', 'Home');
    }
    return `uber://?${params.toString()}`;
  }

  // Lyft
  const params = new URLSearchParams({
    'pickup[latitude]': pickup.lat.toString(),
    'pickup[longitude]': pickup.lng.toString(),
  });
  if (destination) {
    params.set('destination[latitude]', destination.lat.toString());
    params.set('destination[longitude]', destination.lng.toString());
  }
  return `lyft://ridetype?id=lyft&${params.toString()}`;
}

// ============================================================
// COMPOSITE: TRUST SIGNALS HOOK
// ============================================================

export function useVenueTrustSignals(venueId: string | null) {
  const [verification, setVerification] = useState<VenueVerification | null>(null);
  const [crowd, setCrowd] = useState<CrowdReading | null>(null);
  const [pricing, setPricing] = useState<VenuePricing[]>([]);
  const [safetyFlags, setSafetyFlags] = useState<SafetyFlag[]>([]);
  const [spendEstimate, setSpendEstimate] = useState<SpendEstimate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!venueId) return;

    setLoading(true);

    Promise.all([
      fetchVenueVerification(venueId),
      fetchCurrentCrowd(venueId),
      fetchVenuePricing(venueId),
      fetchSafetyFlags(venueId),
      fetchSpendEstimate(venueId, 2), // default 2 people
    ]).then(([v, c, p, sf, se]) => {
      setVerification(v);
      setCrowd(c);
      setPricing(p);
      setSafetyFlags(sf);
      setSpendEstimate(se);
      setLoading(false);
    });

    // Subscribe to live crowd updates
    const unsub = subscribeToCrowd(venueId, (reading) => {
      setCrowd(reading);
    });

    return unsub;
  }, [venueId]);

  return { verification, crowd, pricing, safetyFlags, spendEstimate, loading };
}
