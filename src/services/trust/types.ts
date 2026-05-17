// ============================================================
// CONFETTI TRUST LAYER — TypeScript Types
// ============================================================

// --- VERIFICATION ---

export type VerificationTier = 'unverified' | 'verified' | 'confetti_pick' | 'confetti_elite';

export interface VenueVerification {
  tier: VerificationTier;
  verifiedAt: string | null;
  verifiedBy: 'auto' | 'community' | 'manual' | string;
  verificationScore: number; // 0-100
  checkinCount: number;
  complaintCount: number;
  avgRating: number;
  isDirectPartner: boolean;
  hasExclusiveExperiences: boolean;
  photosVerified: boolean;
  realPhotoCount: number;
  aiPhotoCount: number;
}

export interface VerificationBadgeProps {
  tier: VerificationTier;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

// --- CROWD LEVELS ---

export type CrowdLevel = 'quiet' | 'moderate' | 'busy' | 'at_capacity';

export interface CrowdReading {
  id: string;
  venueId: string;
  level: CrowdLevel;
  energyScore: number; // 0-100
  source: 'checkin_velocity' | 'google_popular_times' | 'venue_report' | 'historical';
  confidence: number; // 0-1
  estimatedWaitMinutes: number | null;
  reportedAt: string;
  expiresAt: string;
}

export interface CrowdIndicatorProps {
  level: CrowdLevel;
  energyScore: number;
  estimatedWait: number | null;
  size?: 'compact' | 'full';
}

export interface CrowdPattern {
  dayOfWeek: number;
  hour: number;
  avgEnergyScore: number;
  typicalLevel: CrowdLevel;
}

// --- PRICING ---

export type PriceCategory =
  | 'cocktails'
  | 'beer'
  | 'wine'
  | 'entrees'
  | 'appetizers'
  | 'bottle_service'
  | 'cover';

export interface VenuePricing {
  id: string;
  venueId: string;
  category: PriceCategory;
  priceLow: number;
  priceHigh: number;
  currency: string;
  notes: string | null;
  source: 'menu_scrape' | 'user_reported' | 'venue_provided' | 'booking_data';
  confidence: number;
  lastVerified: string;
}

export interface SpendEstimate {
  venueId: string;
  partySize: number;
  avgSpendPerPerson: number;
  medianSpendPerPerson: number | null;
  sampleCount: number;
  includesTip: boolean;
  timeContext: 'weeknight' | 'weekend' | 'late_night' | null;
}

export interface ItineraryPriceEstimate {
  stops: {
    venueId: string;
    venueName: string;
    estimateLow: number;
    estimateHigh: number;
  }[];
  totalLow: number;
  totalHigh: number;
  perPersonLow: number;
  perPersonHigh: number;
  partySize: number;
  overBudget: boolean;
  budgetLimit: number | null;
}

export interface TransparentPricingProps {
  pricing: VenuePricing[];
  spendEstimate: SpendEstimate | null;
  compact?: boolean;
}

// --- SAFETY ---

export type SafetyFlagType =
  | 'well_lit'
  | 'easy_pickup'
  | 'doorman'
  | 'limited_cell'
  | 'cash_only'
  | 'outdoor_waiting';

export interface SafetyFlag {
  id: string;
  venueId: string;
  flagType: SafetyFlagType;
  reportCount: number;
  isPositive: boolean; // well_lit, easy_pickup, doorman = positive
}

export interface UserSafetySettings {
  homeAddressEncrypted: string | null;
  emergencyContacts: EmergencyContact[];
  buddyEnabled: boolean;
  drinkLimitEnabled: boolean;
  drinkLimit: number | null;
  shareLocationOnRide: boolean;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface SafeRouteHomeProps {
  lastVenue: {
    name: string;
    address: string;
    lat: number;
    lng: number;
  };
  hasHomeAddress: boolean;
  buddyName: string | null;
}

export interface DrinkTrackerProps {
  limit: number;
  current: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

// --- COMPOSITE: Trust Card (shown on venue cards) ---

export interface VenueTrustSignals {
  verification: VenueVerification;
  crowd: CrowdReading | null;
  pricing: VenuePricing[];
  safetyFlags: SafetyFlag[];
  spendEstimate: SpendEstimate | null;
}
