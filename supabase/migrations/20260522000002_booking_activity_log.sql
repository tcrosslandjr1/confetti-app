-- ============================================================
-- Booking activity log — tracks all provider interactions
-- for debugging, analytics, and audit trail
-- Generated: 2026-05-22
-- ============================================================

CREATE TABLE IF NOT EXISTS public.booking_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,          -- check_availability, create_booking, cancel_booking, etc.
  provider TEXT NOT NULL,        -- viator, stripe, opentable, etc.
  result_status TEXT NOT NULL DEFAULT 'success',  -- success | error
  metadata JSONB DEFAULT '{}',   -- full response (for debugging)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for user activity lookups
CREATE INDEX IF NOT EXISTS idx_booking_activity_user
  ON booking_activity_log (user_id, created_at DESC);

-- Index for provider error monitoring
CREATE INDEX IF NOT EXISTS idx_booking_activity_provider_status
  ON booking_activity_log (provider, result_status, created_at DESC);

-- RLS
ALTER TABLE booking_activity_log ENABLE ROW LEVEL SECURITY;

-- Service role can write (edge function uses service role)
CREATE POLICY "service_role_booking_log" ON booking_activity_log FOR ALL
  USING (auth.role() = 'service_role');

-- Users can read their own activity
CREATE POLICY "users_read_own_booking_log" ON booking_activity_log FOR SELECT
  USING (auth.uid() = user_id);
