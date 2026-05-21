-- ============================================================
-- CONFETTI TRUST LAYER — Supabase Database Schema
-- Features: Verified Venues, Crowd Levels, Transparent Pricing, Safety
-- ============================================================

-- ENUMS
CREATE TYPE venue_verification_tier AS ENUM ('unverified', 'verified', 'confetti_pick', 'confetti_elite');
CREATE TYPE crowd_level AS ENUM ('quiet', 'moderate', 'busy', 'at_capacity');
CREATE TYPE safety_flag_type AS ENUM ('well_lit', 'easy_pickup', 'doorman', 'limited_cell', 'cash_only', 'outdoor_waiting');
CREATE TYPE safety_flag_status AS ENUM ('pending', 'approved', 'rejected');

-- ============================================================
-- 1. VERIFIED VENUES
-- ============================================================

-- Extends existing venues table with verification data
ALTER TABLE venues ADD COLUMN IF NOT EXISTS verification_tier venue_verification_tier DEFAULT 'unverified';
ALTER TABLE venues ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS verified_by TEXT; -- 'auto' | 'community' | 'manual' | user_id
ALTER TABLE venues ADD COLUMN IF NOT EXISTS verification_score NUMERIC(4,2) DEFAULT 0; -- 0-100 composite score
ALTER TABLE venues ADD COLUMN IF NOT EXISTS checkin_count INTEGER DEFAULT 0;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS complaint_count INTEGER DEFAULT 0;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(3,2) DEFAULT 0;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS is_direct_partner BOOLEAN DEFAULT FALSE;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS has_exclusive_experiences BOOLEAN DEFAULT FALSE;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS photos_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS real_photo_count INTEGER DEFAULT 0;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS ai_photo_count INTEGER DEFAULT 0;

-- Verification audit log
CREATE TABLE venue_verification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  previous_tier venue_verification_tier,
  new_tier venue_verification_tier,
  reason TEXT NOT NULL,
  verified_by TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_verification_log_venue ON venue_verification_log(venue_id);
CREATE INDEX idx_verification_log_created ON venue_verification_log(created_at DESC);

-- ============================================================
-- 2. CROWD LEVELS
-- ============================================================

CREATE TABLE venue_crowd_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  level crowd_level NOT NULL,
  energy_score NUMERIC(4,2) NOT NULL, -- 0-100
  source TEXT NOT NULL, -- 'checkin_velocity' | 'google_popular_times' | 'venue_report' | 'historical'
  confidence NUMERIC(3,2) NOT NULL, -- 0-1
  estimated_wait_minutes INTEGER,
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL -- readings expire (typically 30 min)
);

CREATE INDEX idx_crowd_venue_time ON venue_crowd_readings(venue_id, reported_at DESC);
CREATE INDEX idx_crowd_expires ON venue_crowd_readings(expires_at);

-- Historical crowd patterns (aggregated)
CREATE TABLE venue_crowd_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
  hour INTEGER NOT NULL CHECK (hour BETWEEN 0 AND 23),
  avg_energy_score NUMERIC(4,2) NOT NULL,
  typical_level crowd_level NOT NULL,
  sample_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(venue_id, day_of_week, hour)
);

CREATE INDEX idx_crowd_patterns_venue ON venue_crowd_patterns(venue_id);

-- ============================================================
-- 3. TRANSPARENT PRICING
-- ============================================================

CREATE TABLE venue_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- 'cocktails' | 'beer' | 'wine' | 'entrees' | 'appetizers' | 'bottle_service' | 'cover'
  price_low NUMERIC(8,2) NOT NULL,
  price_high NUMERIC(8,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  notes TEXT, -- e.g., "Fri/Sat after 11pm"
  source TEXT NOT NULL, -- 'menu_scrape' | 'user_reported' | 'venue_provided' | 'booking_data'
  confidence NUMERIC(3,2) DEFAULT 0.5,
  last_verified TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pricing_venue ON venue_pricing(venue_id);

-- Aggregated spend data (anonymized)
CREATE TABLE venue_spend_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  party_size INTEGER NOT NULL,
  avg_spend_per_person NUMERIC(8,2) NOT NULL,
  median_spend_per_person NUMERIC(8,2),
  sample_count INTEGER DEFAULT 0,
  includes_tip BOOLEAN DEFAULT FALSE,
  time_context TEXT, -- 'weeknight' | 'weekend' | 'late_night'
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(venue_id, party_size, time_context)
);

-- User-reported spend (feeds into estimates)
CREATE TABLE user_spend_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  party_size INTEGER,
  total_spend NUMERIC(8,2) NOT NULL,
  visit_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_spend_reports_venue ON user_spend_reports(venue_id);

-- ============================================================
-- 4. SAFETY FEATURES
-- ============================================================

-- Venue safety flags (community-reported)
CREATE TABLE venue_safety_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  flag_type safety_flag_type NOT NULL,
  status safety_flag_status DEFAULT 'pending',
  reported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  report_count INTEGER DEFAULT 1, -- multiple users can report same flag
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(venue_id, flag_type)
);

CREATE INDEX idx_safety_flags_venue ON venue_safety_flags(venue_id, status);

-- User safety settings
CREATE TABLE user_safety_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  home_address_encrypted TEXT, -- encrypted for Safe Route Home
  emergency_contacts JSONB DEFAULT '[]', -- [{name, phone, relationship}]
  buddy_enabled BOOLEAN DEFAULT FALSE,
  drink_limit_enabled BOOLEAN DEFAULT FALSE,
  drink_limit INTEGER,
  share_location_on_ride BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safe Route Home logs
CREATE TABLE safe_route_home_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  itinerary_id UUID,
  ride_service TEXT, -- 'uber' | 'lyft'
  home_confirmed BOOLEAN DEFAULT FALSE,
  confirmed_at TIMESTAMPTZ,
  buddy_notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Buddy system events
CREATE TABLE buddy_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  buddy_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  party_room_id UUID,
  event_type TEXT NOT NULL, -- 'activated' | 'left_venue' | 'home_safe' | 'alert_triggered'
  venue_id UUID REFERENCES venues(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE venue_crowd_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_safety_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_safety_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE safe_route_home_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE buddy_events ENABLE ROW LEVEL SECURITY;

-- Crowd readings: public read
CREATE POLICY "Anyone can read crowd readings" ON venue_crowd_readings FOR SELECT USING (true);

-- Pricing: public read
CREATE POLICY "Anyone can read venue pricing" ON venue_pricing FOR SELECT USING (true);

-- Safety flags: public read for approved, reporters can see their own
CREATE POLICY "Read approved safety flags" ON venue_safety_flags FOR SELECT
  USING (status = 'approved' OR reported_by = auth.uid());

-- User safety settings: own data only
CREATE POLICY "Users manage own safety settings" ON user_safety_settings
  FOR ALL USING (user_id = auth.uid());

-- Safe route logs: own data only
CREATE POLICY "Users see own safe route logs" ON safe_route_home_logs
  FOR ALL USING (user_id = auth.uid());

-- Buddy events: participants only
CREATE POLICY "Buddy event participants" ON buddy_events
  FOR SELECT USING (user_id = auth.uid() OR buddy_id = auth.uid());

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-verification function: checks if venue qualifies for upgrade
CREATE OR REPLACE FUNCTION check_venue_verification(p_venue_id UUID)
RETURNS venue_verification_tier AS $$
DECLARE
  v_venue RECORD;
  v_new_tier venue_verification_tier;
BEGIN
  SELECT * INTO v_venue FROM venues WHERE id = p_venue_id;

  IF v_venue IS NULL THEN
    RETURN 'unverified';
  END IF;

  -- Elite: must be direct partner with exclusives
  IF v_venue.is_direct_partner AND v_venue.has_exclusive_experiences THEN
    RETURN 'confetti_elite';
  END IF;

  -- Confetti Pick: 4.5+ rating, 50+ check-ins, 0 complaints
  IF v_venue.avg_rating >= 4.5
     AND v_venue.checkin_count >= 50
     AND v_venue.complaint_count = 0 THEN
    RETURN 'confetti_pick';
  END IF;

  -- Verified: basic cross-reference passed
  IF v_venue.verification_score >= 70 THEN
    RETURN 'verified';
  END IF;

  RETURN 'unverified';
END;
$$ LANGUAGE plpgsql;

-- Calculate crowd energy score from multiple signals
CREATE OR REPLACE FUNCTION calculate_energy_score(
  p_checkin_velocity NUMERIC,  -- check-ins per hour
  p_google_busyness NUMERIC,   -- 0-100 from Google
  p_venue_capacity INTEGER,
  p_current_count INTEGER
) RETURNS NUMERIC AS $$
DECLARE
  v_velocity_score NUMERIC;
  v_google_score NUMERIC;
  v_occupancy_score NUMERIC;
  v_final NUMERIC;
BEGIN
  -- Velocity: normalize to 0-100 (10 check-ins/hr = 100)
  v_velocity_score := LEAST(p_checkin_velocity * 10, 100);

  -- Google: already 0-100
  v_google_score := COALESCE(p_google_busyness, 50);

  -- Occupancy: percentage of capacity
  IF p_venue_capacity > 0 AND p_current_count IS NOT NULL THEN
    v_occupancy_score := (p_current_count::NUMERIC / p_venue_capacity) * 100;
  ELSE
    v_occupancy_score := 50; -- default if unknown
  END IF;

  -- Weighted average: Google (40%), Velocity (35%), Occupancy (25%)
  v_final := (v_google_score * 0.4) + (v_velocity_score * 0.35) + (v_occupancy_score * 0.25);

  RETURN ROUND(LEAST(v_final, 100), 2);
END;
$$ LANGUAGE plpgsql;

-- Convert energy score to crowd level
CREATE OR REPLACE FUNCTION energy_to_crowd_level(p_score NUMERIC)
RETURNS crowd_level AS $$
BEGIN
  IF p_score >= 85 THEN RETURN 'at_capacity';
  ELSIF p_score >= 60 THEN RETURN 'busy';
  ELSIF p_score >= 30 THEN RETURN 'moderate';
  ELSE RETURN 'quiet';
  END IF;
END;
$$ LANGUAGE plpgsql;
