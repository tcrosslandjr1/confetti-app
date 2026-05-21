# Confetti Trust Layer — Lovable Integration Prompts

Use these prompts sequentially in your Lovable project at:
https://lovable.dev/projects/f4bae350-0f3c-459c-a8b3-17702408f503

Each prompt is self-contained — paste one at a time and let Lovable complete it before moving to the next.

---

## Prompt 1: Database Schema (Run First)

```
I need to add a Trust Layer to my Confetti app. Please run the following SQL migrations in Supabase to create the required tables and functions.

First, create these enums:
- venue_verification_tier: 'unverified', 'verified', 'confetti_pick', 'confetti_elite'
- crowd_level: 'quiet', 'moderate', 'busy', 'at_capacity'
- safety_flag_type: 'well_lit', 'easy_pickup', 'doorman', 'limited_cell', 'cash_only', 'outdoor_waiting'
- safety_flag_status: 'pending', 'approved', 'rejected'

Then ALTER the existing `venues` table to add these columns:
- verification_tier (venue_verification_tier, default 'unverified')
- verified_at (TIMESTAMPTZ)
- verified_by (TEXT) — values: 'auto', 'community', 'manual', or a user_id
- verification_score (NUMERIC 4,2, default 0) — composite score 0-100
- checkin_count (INTEGER, default 0)
- complaint_count (INTEGER, default 0)
- avg_rating (NUMERIC 3,2, default 0)
- is_direct_partner (BOOLEAN, default false)
- has_exclusive_experiences (BOOLEAN, default false)
- photos_verified (BOOLEAN, default false)
- real_photo_count (INTEGER, default 0)
- ai_photo_count (INTEGER, default 0)

Create these new tables:

1. venue_verification_log — audit trail for tier changes:
   - id (UUID PK), venue_id (FK venues), previous_tier, new_tier, reason (TEXT), verified_by (TEXT), metadata (JSONB), created_at

2. venue_crowd_readings — real-time crowd data:
   - id (UUID PK), venue_id (FK venues), level (crowd_level), energy_score (NUMERIC 4,2), source (TEXT), confidence (NUMERIC 3,2), estimated_wait_minutes (INTEGER), reported_at (TIMESTAMPTZ), expires_at (TIMESTAMPTZ)
   - Index on (venue_id, reported_at DESC) and (expires_at)

3. venue_crowd_patterns — historical aggregates:
   - id (UUID PK), venue_id (FK venues), day_of_week (INT 0-6), hour (INT 0-23), avg_energy_score, typical_level, sample_count, updated_at
   - UNIQUE constraint on (venue_id, day_of_week, hour)

4. venue_pricing — menu price intelligence:
   - id (UUID PK), venue_id (FK venues), category (TEXT — 'cocktails','beer','wine','entrees','appetizers','bottle_service','cover'), price_low (NUMERIC), price_high (NUMERIC), currency (TEXT default 'USD'), notes (TEXT), source (TEXT), confidence (NUMERIC 3,2), last_verified (TIMESTAMPTZ)

5. venue_spend_estimates — aggregated per-person spend:
   - id (UUID PK), venue_id (FK venues), party_size (INT), avg_spend_per_person (NUMERIC), median_spend_per_person (NUMERIC), sample_count (INT), includes_tip (BOOLEAN), time_context (TEXT)
   - UNIQUE on (venue_id, party_size)

6. user_spend_reports — crowdsourced spend data from users:
   - id (UUID PK), user_id (FK auth.users), venue_id (FK venues), party_size (INT), total_spend (NUMERIC), visit_date (DATE), created_at

7. venue_safety_flags — community-reported safety info:
   - id (UUID PK), venue_id (FK venues), flag_type (safety_flag_type), report_count (INT default 1), status (safety_flag_status default 'pending'), first_reported_at, last_reported_at, reviewed_by, reviewed_at

8. user_safety_settings — per-user safety preferences:
   - id (UUID PK), user_id (FK auth.users UNIQUE), home_address_encrypted (TEXT), emergency_contacts (JSONB default '[]'), buddy_enabled (BOOLEAN default false), drink_limit_enabled (BOOLEAN default false), drink_limit (INT default 4), share_location_on_ride (BOOLEAN default true), updated_at

9. safe_route_home_logs — ride-home tracking:
   - id (UUID PK), user_id (FK auth.users), itinerary_id (UUID), ride_service (TEXT — 'uber' or 'lyft'), requested_at (TIMESTAMPTZ), home_confirmed (BOOLEAN default false), confirmed_at (TIMESTAMPTZ), buddy_notified (BOOLEAN default false)

10. buddy_events — buddy system activity:
    - id (UUID PK), user_id, buddy_id (both FK auth.users), itinerary_id (UUID), event_type (TEXT — 'paired','checkin_sent','checkin_confirmed','alert_triggered'), created_at

Enable Row Level Security on ALL new tables. Policies:
- venue_verification_log, venue_crowd_readings, venue_crowd_patterns, venue_pricing, venue_spend_estimates: SELECT for all authenticated users
- venue_safety_flags: SELECT for authenticated, INSERT for authenticated (status defaults to 'pending')
- user_safety_settings: SELECT/INSERT/UPDATE only where user_id = auth.uid()
- user_spend_reports: INSERT where user_id = auth.uid(), SELECT own reports
- safe_route_home_logs: full access where user_id = auth.uid()
- buddy_events: SELECT/INSERT where user_id = auth.uid() OR buddy_id = auth.uid()

Create a PostgreSQL function `calculate_energy_score(checkin_velocity NUMERIC, google_busyness NUMERIC, venue_capacity NUMERIC, current_count NUMERIC)` that returns NUMERIC:
- velocity_score = LEAST(checkin_velocity * 10, 100)
- google_score = COALESCE(google_busyness, 50)
- occupancy_score = CASE WHEN venue_capacity > 0 THEN (current_count / venue_capacity) * 100 ELSE 50 END
- final = (google_score * 0.4) + (velocity_score * 0.35) + (occupancy_score * 0.25)
- RETURN LEAST(ROUND(final, 2), 100)

Create a function `energy_to_crowd_level(score NUMERIC)` returns crowd_level:
- >= 85 → 'at_capacity'
- >= 60 → 'busy'
- >= 30 → 'moderate'
- else → 'quiet'
```

---

## Prompt 2: TypeScript Types

```
Create a new file `src/types/trust-layer.ts` with all the TypeScript types for our Trust Layer:

export type VerificationTier = 'unverified' | 'verified' | 'confetti_pick' | 'confetti_elite';

export interface VenueVerification {
  tier: VerificationTier;
  verifiedAt: string | null;
  verifiedBy: string | null;
  verificationScore: number;
  checkinCount: number;
  complaintCount: number;
  avgRating: number;
  isDirectPartner: boolean;
  hasExclusiveExperiences: boolean;
  photosVerified: boolean;
  realPhotoCount: number;
  aiPhotoCount: number;
}

export type CrowdLevel = 'quiet' | 'moderate' | 'busy' | 'at_capacity';

export interface CrowdReading {
  id: string;
  venueId: string;
  level: CrowdLevel;
  energyScore: number;
  source: string;
  confidence: number;
  estimatedWaitMinutes: number | null;
  reportedAt: string;
  expiresAt: string;
}

export interface CrowdIndicatorProps {
  level: CrowdLevel;
  energyScore: number;
  estimatedWait?: number | null;
}

export interface CrowdPattern {
  dayOfWeek: number;
  hour: number;
  avgEnergyScore: number;
  typicalLevel: CrowdLevel;
}

export type PriceCategory = 'cocktails' | 'beer' | 'wine' | 'entrees' | 'appetizers' | 'bottle_service' | 'cover';

export interface VenuePricing {
  id: string;
  venueId: string;
  category: PriceCategory;
  priceLow: number;
  priceHigh: number;
  currency: string;
  notes: string | null;
  source: string;
  confidence: number;
  lastVerified: string;
}

export interface SpendEstimate {
  venueId: string;
  partySize: number;
  avgSpendPerPerson: number;
  medianSpendPerPerson: number;
  sampleCount: number;
  includesTip: boolean;
  timeContext: string | null;
}

export interface ItineraryPriceEstimate {
  stops: { venueId: string; venueName: string; estimateLow: number; estimateHigh: number }[];
  totalLow: number;
  totalHigh: number;
  perPersonLow: number;
  perPersonHigh: number;
  partySize: number;
  overBudget: boolean;
  budgetLimit: number | null;
}

export type SafetyFlagType = 'well_lit' | 'easy_pickup' | 'doorman' | 'limited_cell' | 'cash_only' | 'outdoor_waiting';

export interface SafetyFlag {
  id: string;
  venueId: string;
  flagType: SafetyFlagType;
  reportCount: number;
  isPositive: boolean;
}

export interface UserSafetySettings {
  homeAddressEncrypted: string | null;
  emergencyContacts: EmergencyContact[];
  buddyEnabled: boolean;
  drinkLimitEnabled: boolean;
  drinkLimit: number;
  shareLocationOnRide: boolean;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface SafeRouteHomeProps {
  lastVenue: { name: string; lat: number; lng: number };
  hasHomeAddress: boolean;
  buddyName: string | null;
}

export interface DrinkTrackerProps {
  limit: number;
  current: number;
  onIncrement: () => void;
  onDecrement: () => void;
}
```

---

## Prompt 3: Verification Badge Components

```
Create a new file `src/components/trust/VerificationBadge.tsx` with these components using React, TypeScript, Tailwind CSS, Framer Motion, and lucide-react icons.

Import the types from '@/types/trust-layer'.

1. Create a BADGE_CONFIG object that maps each VerificationTier to:
   - unverified: ShieldAlert icon, "Not Verified", gray colors, "Info not confirmed"
   - verified: Check icon, "Verified", blue colors, "Confirmed accurate by Confetti"
   - confetti_pick: Star icon, "Confetti Pick", amber colors, "Highly rated by the community"
   - confetti_elite: Crown icon, "Confetti Elite", purple colors, "Exclusive partner venue"

2. VerificationBadge component:
   - Props: tier (VerificationTier), size ('sm'|'md'|'lg'), showLabel (boolean)
   - For unverified: just gray icon + italic text
   - For others: animated pill badge with colored background, border, icon, and label
   - Use framer-motion scale/opacity animation on mount

3. VerificationTrustCard component:
   - Props: verification (VenueVerification)
   - Expanded card showing: badge, check-in count, description, rating with filled star, photo count, partner status, exclusives available
   - Uses a 2-column grid for trust signals

4. VenueCardBadge component (compact inline for venue list cards):
   - Props: tier, checkinCount
   - Returns null for unverified
   - Shows icon + label + check-in count inline

5. VerifiedOnlyFilter component:
   - Props: enabled (boolean), onToggle callback
   - Toggle pill button that switches between active (blue) and inactive (gray) states
```

---

## Prompt 4: Crowd Level Components

```
Create a new file `src/components/trust/CrowdIndicator.tsx` with these components:

Import CrowdLevel, CrowdIndicatorProps, CrowdPattern from '@/types/trust-layer'.

1. Create CROWD_CONFIG mapping each CrowdLevel to:
   - quiet: 🟢, "Quiet", "Walk right in", emerald colors, 20% fill
   - moderate: 🟡, "Moderate", "Some wait possible", yellow colors, 50% fill
   - busy: 🔴, "Busy", "Expect 15–30 min wait", red colors, 80% fill
   - at_capacity: ⚫, "At Capacity", "Reservation recommended", gray-800 colors, 100% fill

2. CrowdIndicatorCompact — for venue cards in lists:
   - Shows emoji + label + optional wait time ("· ~15 min wait")
   - Single line, small text

3. CrowdIndicatorFull — for venue detail page:
   - Colored background card with Users icon, level label, "Live" indicator
   - Animated progress bar (framer-motion width animation, 0.8s easeOut)
   - Description text + wait time with Clock icon

4. CrowdSpikeAlert — notification when an itinerary stop gets busier:
   - Orange alert card with TrendingUp icon
   - Shows venue name, previous level → current level
   - Two buttons: "Suggest alternative" and "Keep it"

5. CrowdPatternChart — weekly heatmap for venue detail:
   - Grid: rows = Sun–Sat, columns = hours 12pm–11pm
   - Each cell colored by energy score (emerald < yellow < red < gray-800)
   - Color legend below the chart
   - Title: "Typical crowd levels"
```

---

## Prompt 5: Transparent Pricing Components

```
Create a new file `src/components/trust/TransparentPricing.tsx` with these components:

Import VenuePricing, SpendEstimate, ItineraryPriceEstimate, PriceCategory from '@/types/trust-layer'.

1. CATEGORY_CONFIG maps each PriceCategory to emoji + label:
   cocktails→🍸, beer→🍺, wine→🍷, entrees→🍽️, appetizers→🥗, bottle_service→🍾, cover→🎫

2. Helper functions:
   - formatPrice(amount, currency='USD') using Intl.NumberFormat, no decimals
   - formatRange(low, high) — shows single price if equal, or "$X–$Y"

3. VenuePriceCard — on venue detail page:
   - Header: DollarSign icon + "What to expect"
   - Lists each pricing item: emoji + label on left, price range on right, optional notes tag
   - Below separator: if spendEstimate exists with 5+ samples, show Lightbulb icon + "Typical night out here (2 people): ~$X/person"

4. PriceTag — compact inline for venue cards:
   - Just "$X–$Y" with tiny DollarSign icon + optional category label

5. ItineraryPriceBreakdown — on the Boarding Pass screen:
   - Header: "Estimated Night" + per-person range
   - Lists each stop: "Stop 1 (Venue Name)" + estimate range
   - Separator + total for party size
   - If overBudget, show OverBudgetAlert

6. OverBudgetAlert:
   - Amber card with AlertTriangle icon
   - "This plan might run ~$X over your usual budget."
   - Optional "Want me to find alternatives?" link button

7. SurgePricingNotice:
   - Orange inline pill: TrendingUp icon + "Saturday night prices are typically X% higher"

8. SpendReporter — post-visit optional submission:
   - "How much did your group spend at {venue}?"
   - "Optional & anonymous — helps others plan their budget"
   - Dollar input field + Submit button + Skip link
```

---

## Prompt 6: Safety Features Components

```
Create a new file `src/components/trust/SafetyFeatures.tsx` with these components:

Import SafetyFlag, SafetyFlagType, SafeRouteHomeProps, DrinkTrackerProps, EmergencyContact from '@/types/trust-layer'.

1. FLAG_CONFIG maps each SafetyFlagType:
   - well_lit: 💡 "Well-lit area" (positive)
   - easy_pickup: 🚗 "Easy rideshare pickup" (positive)
   - doorman: 🚪 "Doorman present" (positive)
   - limited_cell: 📵 "Limited cell service" (negative)
   - cash_only: 💵 "Cash only" (negative)
   - outdoor_waiting: 🌧️ "Outdoor waiting area" (negative)

2. VenueSafetyFlags — on venue detail:
   - Splits flags into positive (emerald pills) and caution (amber pills)
   - Each shows emoji + label, positive flags show report count if > 5

3. SafeRouteHome card — appears in itinerary when night ends:
   - Purple gradient card with Car icon
   - "Getting home? 🚗" header + "Confetti looks out for you"
   - 2-column grid: Uber button (black) and Lyft button (pink #FF00BF)
   - "Share live location until home" button with MapPin icon (shows buddy name if set)
   - "I'm home safe" button (emerald) with Home icon

4. DrinkTracker — opt-in pace tracker:
   - Header: Wine icon + "Tonight's pace" + "X of Y"
   - Visual bar: array of rounded pills, filled ones are purple (or amber when near limit)
   - Increment/decrement circle buttons with drink emoji display (🍸🍸🍸)
   - When at limit: gentle amber message "You hit your goal — nice self-awareness 💪 Water round?"

5. EmergencyPanel — full-screen slide-up sheet:
   - Red Shield icon + "Emergency Resources" header + close button
   - Call emergency number (red card, tel: link)
   - Nearest hospital (blue card with Heart icon, name + distance)
   - Share my location button (purple card with MapPin)
   - List of emergency contacts (each is a tel: link with name + relationship)
   - AnimatePresence for enter/exit animations, spring damping 25

6. EmergencyButton — persistent 🆘 button for itinerary header:
   - Small circle, gray bg, hover turns red-50, scales emoji on hover

7. BuddySystemToggle:
   - Row with UserCheck icon, "Buddy System" label
   - Shows buddy name if enabled, otherwise "Get alerts if you leave alone"
   - "Pick buddy" text link if enabled but no buddy selected
   - Custom toggle switch (purple when on, gray when off, with sliding white circle)
```

---

## Prompt 7: Service Layer & Hooks

```
Create a new file `src/hooks/useTrustLayer.ts` with Supabase service functions and a composite hook:

Import supabase from '@/integrations/supabase/client' and all types from '@/types/trust-layer'.

SERVICE FUNCTIONS:

1. fetchVenueVerification(venueId: string) → Promise<VenueVerification | null>
   - SELECT verification columns from venues WHERE id = venueId
   - Map snake_case DB columns to camelCase interface

2. fetchCurrentCrowd(venueId: string) → Promise<CrowdReading | null>
   - SELECT from venue_crowd_readings WHERE venue_id AND expires_at >= now()
   - ORDER BY reported_at DESC, LIMIT 1

3. subscribeToCrowd(venueId, onUpdate callback) → returns unsubscribe function
   - Use supabase.channel(`crowd:${venueId}`) with postgres_changes listener
   - Event: INSERT on venue_crowd_readings, filter: venue_id=eq.${venueId}
   - Map payload.new to CrowdReading and call onUpdate

4. calculateEnergyScore({ checkinVelocity, googleBusyness, venueCapacity, currentCount }) → number
   - velocityScore = min(checkinVelocity * 10, 100)
   - googleScore = googleBusyness ?? 50
   - occupancyScore = capacity > 0 ? (currentCount/capacity)*100 : 50
   - final = google*0.4 + velocity*0.35 + occupancy*0.25
   - Return min(round to 2 decimals, 100)

5. energyToCrowdLevel(score) → CrowdLevel
   - >=85 → at_capacity, >=60 → busy, >=30 → moderate, else → quiet

6. fetchVenuePricing(venueId) → Promise<VenuePricing[]>
   - SELECT from venue_pricing WHERE venue_id, ORDER BY category

7. fetchSpendEstimate(venueId, partySize) → Promise<SpendEstimate | null>
   - SELECT from venue_spend_estimates WHERE venue_id AND party_size

8. calculateItineraryEstimate(stops[], partySize, budgetPerPerson) → Promise<ItineraryPriceEstimate>
   - For each stop, fetch pricing, estimate per-person spend (2-3 drinks + cover if applicable)
   - Fallback: $15-$40/person if no data
   - Sum all stops × partySize for total
   - Set overBudget = perPersonHigh > budgetPerPerson

9. submitSpendReport(userId, venueId, partySize, totalSpend) → Promise<void>
   - INSERT into user_spend_reports

10. fetchSafetyFlags(venueId) → Promise<SafetyFlag[]>
    - SELECT from venue_safety_flags WHERE venue_id AND status='approved'
    - Map isPositive based on flag_type being in ['well_lit','easy_pickup','doorman']

11. fetchUserSafetySettings(userId) → Promise<UserSafetySettings | null>
    - SELECT from user_safety_settings WHERE user_id

12. updateSafetySettings(userId, updates) → Promise<void>
    - UPSERT into user_safety_settings

13. getRideDeepLink(service, pickup, destination) → string
    - Uber: uber://?action=setPickup&pickup[latitude]=X&pickup[longitude]=Y&pickup[nickname]=Name&dropoff[latitude]=X&dropoff[longitude]=Y&dropoff[nickname]=Home
    - Lyft: lyft://ridetype?id=lyft&pickup[latitude]=X&pickup[longitude]=Y&destination[latitude]=X&destination[longitude]=Y

COMPOSITE HOOK:

export function useVenueTrustSignals(venueId: string | null) — returns { verification, crowd, pricing, safetyFlags, spendEstimate, loading }:
- useState for each piece of data
- useEffect: when venueId changes, Promise.all to fetch all 5 data points
- Also subscribe to live crowd updates via subscribeToCrowd
- Return unsubscribe in cleanup
- Default partySize = 2 for spend estimate
```

---

## Prompt 8: Integration Points

```
Now integrate the Trust Layer components into the existing venue and itinerary screens:

1. On the venue detail page (wherever we show a single venue's info):
   - Add VerificationBadge next to the venue name
   - Add CrowdIndicatorFull below the venue header
   - Add VenuePriceCard in the venue info section
   - Add VenueSafetyFlags below the pricing
   - Use the useVenueTrustSignals(venueId) hook to fetch all data

2. On venue list cards (search results, itinerary stops):
   - Add VenueCardBadge inline with venue name
   - Add CrowdIndicatorCompact below venue category
   - Add PriceTag showing cocktail price range

3. On the Boarding Pass / itinerary screen:
   - Add ItineraryPriceBreakdown card showing the full night's estimated cost
   - Add EmergencyButton (🆘) in the itinerary header
   - Add CrowdSpikeAlert when a stop's crowd level increases during the night (subscribe to real-time updates)

4. In user settings/profile:
   - Add BuddySystemToggle
   - Add DrinkTracker toggle (enable/disable + set limit)
   - Add emergency contacts management

5. Post-itinerary flow (after last stop):
   - Show SafeRouteHome card with Uber/Lyft deep links
   - If drink tracking is enabled, show DrinkTracker during the night
   - Show SpendReporter for each visited venue the next day

6. Add a VerifiedOnlyFilter toggle to venue search/browse screens

Make sure all real-time subscriptions are cleaned up on component unmount.
```

---

## Usage Notes

- Run prompts 1-7 in order (each builds on the previous)
- Prompt 8 ties everything together into your existing UI
- All components use your existing Tailwind config — no new dependencies needed beyond framer-motion and lucide-react (which you already have)
- The Supabase real-time subscription for crowd data requires that your Supabase project has Realtime enabled on the `venue_crowd_readings` table
- Safety settings use encrypted home address — implement encryption/decryption in a separate utility
- Ride deep links open native Uber/Lyft apps on mobile; on desktop they redirect to the web app
