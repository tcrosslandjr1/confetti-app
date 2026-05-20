-- ============================================================================
-- Confetti App — Consent Management System
-- Migration 001: Core consent schema
-- Entity: Confetti App, LLC
-- Date: 2026-05-19
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. DOCUMENT VERSIONS
-- Tracks every version of every legal document. When a document updates,
-- users with the old version get flagged for re-consent.
-- ============================================================================
CREATE TABLE document_versions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_key  TEXT NOT NULL,              -- e.g., 'terms_of_service', 'privacy_policy'
  document_name TEXT NOT NULL,              -- Human-readable: 'Terms of Service'
  version       TEXT NOT NULL,              -- Semver: '1.0.0'
  effective_date TIMESTAMPTZ NOT NULL,
  summary       TEXT,                       -- Plain-language changelog for re-consent
  document_url  TEXT,                       -- Link to full document (PDF/markdown)
  category      TEXT NOT NULL CHECK (category IN (
    'user_facing', 'influencer', 'venue_partner', 'compliance'
  )),
  is_current    BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (document_key, version)
);

CREATE INDEX idx_doc_versions_current ON document_versions (document_key) WHERE is_current = true;

-- ============================================================================
-- 2. CONSENT CATEGORIES
-- Defines each independent consent bucket. Maps to legal basis.
-- ============================================================================
CREATE TABLE consent_categories (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_key  TEXT UNIQUE NOT NULL,       -- e.g., 'taste_profiling', 'sms_push'
  display_name  TEXT NOT NULL,              -- 'Taste Profiling'
  description   TEXT NOT NULL,              -- Plain-language explanation shown to user
  legal_basis   TEXT NOT NULL,              -- 'consent', 'contract', 'legitimate_interest'
  gdpr_article  TEXT,                       -- 'Art. 6(1)(a)', 'Art. 9(2)(a)'
  is_required   BOOLEAN NOT NULL DEFAULT false,  -- true = cannot use app without
  is_special_category BOOLEAN NOT NULL DEFAULT false,  -- GDPR Art. 9 data
  withdrawal_consequence TEXT,              -- What happens if user withdraws
  max_prompts_per_session INT DEFAULT 1,   -- Anti-nag limit
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 3. CONSENT RECORDS
-- Current consent state per user per category. One row per user+category.
-- ============================================================================
CREATE TABLE consent_records (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_key  TEXT NOT NULL REFERENCES consent_categories(category_key),
  granted       BOOLEAN NOT NULL DEFAULT false,
  version       TEXT NOT NULL,              -- Document/policy version consented to
  method        TEXT NOT NULL CHECK (method IN (
    'clickwrap_onboarding', 'toggle_onboarding', 'toggle_settings',
    'api_request', 'automated_expiry', 'admin_reset', 'breach_reset'
  )),
  device_id     TEXT,
  ip_hash       TEXT,                       -- Hashed IP, never raw
  user_agent    TEXT,
  granted_at    TIMESTAMPTZ,               -- When consent was given
  withdrawn_at  TIMESTAMPTZ,               -- When consent was withdrawn (null if active)
  expires_at    TIMESTAMPTZ,               -- For session-scoped consent (Party Room)
  session_id    UUID,                       -- For group_taste per-session consent
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, category_key)
);

CREATE INDEX idx_consent_user ON consent_records (user_id);
CREATE INDEX idx_consent_category ON consent_records (category_key);
CREATE INDEX idx_consent_pending ON consent_records (user_id) WHERE granted = false;

-- ============================================================================
-- 4. CONSENT HISTORY
-- Immutable append-only log of every consent state change.
-- ============================================================================
CREATE TABLE consent_history (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_key  TEXT NOT NULL,
  event_type    TEXT NOT NULL CHECK (event_type IN (
    'granted', 'withdrawn', 'reconsent_prompted', 'reconsent_completed',
    'reconsent_declined', 'expired', 'admin_reset', 'breach_reset'
  )),
  old_version   TEXT,
  new_version   TEXT,
  method        TEXT,
  device_id     TEXT,
  ip_hash       TEXT,
  user_agent    TEXT,
  session_id    UUID,
  metadata      JSONB DEFAULT '{}',         -- Additional context
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_consent_history_user ON consent_history (user_id, created_at DESC);
CREATE INDEX idx_consent_history_category ON consent_history (category_key, created_at DESC);

-- ============================================================================
-- 5. AUDIT LOG
-- Comprehensive audit trail for ALL consent-related events.
-- Append-only. No updates or deletes. 6-year retention.
-- ============================================================================
CREATE TABLE consent_audit_log (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type    TEXT NOT NULL CHECK (event_type IN (
    'consent_granted', 'consent_withdrawn', 'consent_expired',
    'reconsent_prompted', 'reconsent_completed', 'reconsent_declined',
    'data_request_received', 'data_request_completed', 'data_request_denied',
    'data_export_generated', 'data_deletion_executed',
    'breach_notification_sent', 'breach_consent_reset',
    'document_version_published', 'consent_check_passed', 'consent_check_blocked',
    'agent_access_granted', 'agent_access_denied'
  )),
  user_id       UUID,                       -- Null for system events
  category_key  TEXT,
  agent_name    TEXT,                       -- Which AI agent triggered this
  details       JSONB NOT NULL DEFAULT '{}',
  device_id     TEXT,
  ip_hash       TEXT,
  user_agent    TEXT,
  app_version   TEXT,
  os_info       TEXT,
  session_id    UUID,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_user ON consent_audit_log (user_id, created_at DESC);
CREATE INDEX idx_audit_type ON consent_audit_log (event_type, created_at DESC);
CREATE INDEX idx_audit_agent ON consent_audit_log (agent_name, created_at DESC);

-- ============================================================================
-- 6. DATA SUBJECT REQUESTS
-- GDPR Articles 15-22 and CCPA request tracking.
-- ============================================================================
CREATE TABLE data_subject_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type    TEXT NOT NULL CHECK (request_type IN (
    'access', 'rectification', 'erasure', 'restrict_processing',
    'portability', 'object_profiling', 'automated_decision_review',
    'ccpa_do_not_sell', 'ccpa_delete'
  )),
  status          TEXT NOT NULL DEFAULT 'received' CHECK (status IN (
    'received', 'identity_verified', 'processing', 'completed', 'denied'
  )),
  received_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledged_at TIMESTAMPTZ,              -- Must be within 72 hours
  deadline_at     TIMESTAMPTZ NOT NULL,     -- 30 days from receipt
  completed_at    TIMESTAMPTZ,
  denial_reason   TEXT,
  notes           TEXT,
  export_url      TEXT,                     -- For portability/access: link to export
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dsr_user ON data_subject_requests (user_id);
CREATE INDEX idx_dsr_status ON data_subject_requests (status) WHERE status != 'completed';
CREATE INDEX idx_dsr_deadline ON data_subject_requests (deadline_at) WHERE status NOT IN ('completed', 'denied');

-- ============================================================================
-- 7. DOCUMENT CONSENT MAPPING
-- Links which documents are required for each consent category.
-- ============================================================================
CREATE TABLE document_consent_map (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_key  TEXT NOT NULL REFERENCES consent_categories(category_key),
  document_key  TEXT NOT NULL,
  is_primary    BOOLEAN NOT NULL DEFAULT false, -- The main document for this category
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (category_key, document_key)
);

-- ============================================================================
-- 8. E-SIGN RECORDS
-- Tracks signed partner agreements (influencer, venue).
-- ============================================================================
CREATE TABLE esign_records (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  signer_type     TEXT NOT NULL CHECK (signer_type IN ('influencer', 'venue', 'vendor')),
  signer_name     TEXT NOT NULL,
  signer_email    TEXT NOT NULL,
  signer_company  TEXT,
  document_key    TEXT NOT NULL,
  document_version TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'sent', 'viewed', 'signed', 'declined', 'expired', 'voided'
  )),
  sent_at         TIMESTAMPTZ,
  viewed_at       TIMESTAMPTZ,
  signed_at       TIMESTAMPTZ,
  ip_address_hash TEXT,
  signature_hash  TEXT,                     -- SHA-256 of signature image/data
  pdf_url         TEXT,                     -- Signed PDF storage URL
  envelope_id     TEXT,                     -- DocuSign/e-sign provider envelope ID
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_esign_signer ON esign_records (signer_email);
CREATE INDEX idx_esign_status ON esign_records (status) WHERE status NOT IN ('signed', 'voided');

-- ============================================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_subject_requests ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own consent records
CREATE POLICY "Users manage own consent"
  ON consent_records FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own consent history (no writes — system only)
CREATE POLICY "Users read own consent history"
  ON consent_history FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert consent history (via service role)
CREATE POLICY "Service inserts consent history"
  ON consent_history FOR INSERT
  WITH CHECK (true);

-- Users can read and create their own data requests
CREATE POLICY "Users manage own data requests"
  ON data_subject_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create data requests"
  ON data_subject_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Audit log: read-only for admins, insert for service role
ALTER TABLE consent_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service inserts audit log"
  ON consent_audit_log FOR INSERT
  WITH CHECK (true);

-- Document versions and categories are public read
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads document versions"
  ON document_versions FOR SELECT USING (true);

ALTER TABLE consent_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads consent categories"
  ON consent_categories FOR SELECT USING (true);

-- ============================================================================
-- 10. SEED DATA: Consent Categories
-- ============================================================================
INSERT INTO consent_categories (category_key, display_name, description, legal_basis, gdpr_article, is_required, is_special_category, withdrawal_consequence, sort_order) VALUES
  ('core_service', 'Core Service', 'Account creation and basic app functionality including browsing venues and viewing recommendations.', 'contract', 'Art. 6(1)(b)', true, false, 'Account will be deactivated and deleted.', 1),
  ('taste_profiling', 'Taste Profiling', 'Let Confetti learn your dining and nightlife preferences to give you personalized recommendations.', 'consent', 'Art. 6(1)(a)', false, false, 'You will see generic recommendations instead of personalized ones.', 2),
  ('location_services', 'Location Services', 'Share your real-time location for nearby venue recommendations and contextual suggestions.', 'consent', 'Art. 6(1)(a)', false, false, 'You can manually select your city instead.', 3),
  ('dietary_health', 'Dietary & Allergen Info', 'Share dietary restrictions and allergen information for safer dining recommendations. This may reveal health or religious information.', 'explicit_consent', 'Art. 9(2)(a)', false, true, 'No allergen filtering will be applied to recommendations.', 4),
  ('marketing_comms', 'Email Marketing', 'Receive email newsletters, promotions, and curated picks from Confetti.', 'consent', 'Art. 6(1)(a)', false, false, 'You will not receive promotional emails.', 5),
  ('sms_push', 'SMS & Push Notifications', 'Receive text messages and push notifications about recommendations, deals, and updates.', 'consent', 'TCPA + Art. 6(1)(a)', false, false, 'You will not receive SMS or push marketing messages.', 6),
  ('cookies_tracking', 'Analytics & Tracking', 'Allow analytics cookies and behavioral tracking to improve the app experience.', 'consent', 'Art. 6(1)(a)', false, false, 'Only essential cookies will be used.', 7),
  ('group_taste', 'Party Room (Group)', 'Temporarily merge your taste preferences with a group for shared recommendations. Per-session only.', 'consent', 'Art. 6(1)(a)', false, false, 'You will be excluded from group taste merging and see generic group picks.', 8),
  ('third_party_sharing', 'Anonymized Venue Insights', 'Allow anonymized, aggregated taste trend data to be shared with venue partners.', 'legitimate_interest', 'Art. 6(1)(f)', false, false, 'Your data will be excluded from aggregated venue insights.', 9);

-- ============================================================================
-- 11. SEED DATA: Document Versions (v1.0.0 — launch)
-- ============================================================================
INSERT INTO document_versions (document_key, document_name, version, effective_date, category, summary) VALUES
  ('terms_of_service', 'Terms of Service', '1.0.0', '2026-05-19', 'user_facing', 'Initial launch version.'),
  ('privacy_policy', 'Privacy Policy', '1.0.0', '2026-05-19', 'user_facing', 'Initial launch version.'),
  ('cookie_policy', 'Cookie & Tracking Consent Policy', '1.0.0', '2026-05-19', 'user_facing', 'Initial launch version.'),
  ('subscription_terms', 'Subscription & Auto-Renewal Terms', '1.0.0', '2026-05-19', 'user_facing', 'Initial launch version.'),
  ('acceptable_use', 'Acceptable Use Policy', '1.0.0', '2026-05-19', 'user_facing', 'Initial launch version.'),
  ('age_verification', 'Age Verification Gate Policy', '1.0.0', '2026-05-19', 'user_facing', 'Initial launch version.'),
  ('influencer_agreement', 'Influencer Partnership Agreement', '1.0.0', '2026-05-19', 'influencer', 'Initial launch version.'),
  ('payment_schedule', 'Payment Schedule Addendum', '1.0.0', '2026-05-19', 'influencer', 'Initial launch version.'),
  ('influencer_nda', 'Influencer NDA', '1.0.0', '2026-05-19', 'influencer', 'Initial launch version.'),
  ('content_license', 'Content License Agreement', '1.0.0', '2026-05-19', 'influencer', 'Initial launch version.'),
  ('venue_agreement', 'Venue Partnership Agreement', '1.0.0', '2026-05-19', 'venue_partner', 'Initial launch version.'),
  ('venue_dpa', 'Venue Data Processing Agreement', '1.0.0', '2026-05-19', 'venue_partner', 'Initial launch version.'),
  ('vendor_dpa', 'Vendor Data Processing Agreement', '1.0.0', '2026-05-19', 'compliance', 'Initial launch version.'),
  ('dmca_policy', 'DMCA & Copyright Policy', '1.0.0', '2026-05-19', 'compliance', 'Initial launch version.'),
  ('disclaimer', 'Disclaimer & Liability Waiver', '1.0.0', '2026-05-19', 'compliance', 'Initial launch version.'),
  ('eula', 'End User License Agreement', '1.0.0', '2026-05-19', 'compliance', 'Initial launch version.'),
  ('data_profiling', 'Data Profiling & Taste Learning Addendum', '1.0.0', '2026-05-19', 'compliance', 'Initial launch version.'),
  ('sms_consent', 'SMS & Push Notification Consent', '1.0.0', '2026-05-19', 'compliance', 'Initial launch version.');

-- ============================================================================
-- 12. SEED DATA: Document-Consent Mapping
-- ============================================================================
INSERT INTO document_consent_map (category_key, document_key, is_primary) VALUES
  ('core_service', 'terms_of_service', true),
  ('core_service', 'privacy_policy', false),
  ('core_service', 'eula', false),
  ('core_service', 'acceptable_use', false),
  ('core_service', 'age_verification', false),
  ('taste_profiling', 'data_profiling', true),
  ('taste_profiling', 'privacy_policy', false),
  ('location_services', 'privacy_policy', true),
  ('dietary_health', 'data_profiling', true),
  ('dietary_health', 'privacy_policy', false),
  ('marketing_comms', 'privacy_policy', true),
  ('sms_push', 'sms_consent', true),
  ('cookies_tracking', 'cookie_policy', true),
  ('group_taste', 'data_profiling', true),
  ('third_party_sharing', 'privacy_policy', true);

-- ============================================================================
-- 13. HELPER FUNCTIONS
-- ============================================================================

-- Check if user needs re-consent for any category
CREATE OR REPLACE FUNCTION check_reconsent_needed(p_user_id UUID)
RETURNS TABLE (
  category_key TEXT,
  current_version TEXT,
  latest_version TEXT,
  document_key TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cr.category_key,
    cr.version AS current_version,
    dv.version AS latest_version,
    dcm.document_key
  FROM consent_records cr
  JOIN document_consent_map dcm ON dcm.category_key = cr.category_key AND dcm.is_primary = true
  JOIN document_versions dv ON dv.document_key = dcm.document_key AND dv.is_current = true
  WHERE cr.user_id = p_user_id
    AND cr.granted = true
    AND cr.version != dv.version;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get full consent status for a user (what the Consent Agent calls)
CREATE OR REPLACE FUNCTION get_consent_status(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'user_id', p_user_id,
    'granted_categories', COALESCE(
      (SELECT jsonb_agg(cr.category_key)
       FROM consent_records cr
       WHERE cr.user_id = p_user_id AND cr.granted = true AND cr.withdrawn_at IS NULL
         AND (cr.expires_at IS NULL OR cr.expires_at > now())),
      '[]'::jsonb
    ),
    'denied_categories', COALESCE(
      (SELECT jsonb_agg(cc.category_key)
       FROM consent_categories cc
       LEFT JOIN consent_records cr ON cr.category_key = cc.category_key AND cr.user_id = p_user_id
       WHERE cr.id IS NULL OR cr.granted = false OR cr.withdrawn_at IS NOT NULL),
      '[]'::jsonb
    ),
    'pending_reconsent', EXISTS (
      SELECT 1 FROM check_reconsent_needed(p_user_id)
    ),
    'has_core_consent', EXISTS (
      SELECT 1 FROM consent_records cr
      WHERE cr.user_id = p_user_id AND cr.category_key = 'core_service'
        AND cr.granted = true AND cr.withdrawn_at IS NULL
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant consent (upsert + history + audit)
CREATE OR REPLACE FUNCTION grant_consent(
  p_user_id UUID,
  p_category_key TEXT,
  p_version TEXT,
  p_method TEXT,
  p_device_id TEXT DEFAULT NULL,
  p_ip_hash TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_session_id UUID DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_old_version TEXT;
  v_category consent_categories%ROWTYPE;
BEGIN
  -- Validate category exists
  SELECT * INTO v_category FROM consent_categories WHERE category_key = p_category_key;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown consent category: %', p_category_key;
  END IF;

  -- Get old version if exists
  SELECT version INTO v_old_version FROM consent_records
  WHERE user_id = p_user_id AND category_key = p_category_key;

  -- Upsert consent record
  INSERT INTO consent_records (user_id, category_key, granted, version, method, device_id, ip_hash, user_agent, granted_at, session_id, updated_at)
  VALUES (p_user_id, p_category_key, true, p_version, p_method, p_device_id, p_ip_hash, p_user_agent, now(), p_session_id, now())
  ON CONFLICT (user_id, category_key)
  DO UPDATE SET
    granted = true,
    version = p_version,
    method = p_method,
    device_id = COALESCE(p_device_id, consent_records.device_id),
    ip_hash = COALESCE(p_ip_hash, consent_records.ip_hash),
    user_agent = COALESCE(p_user_agent, consent_records.user_agent),
    granted_at = now(),
    withdrawn_at = NULL,
    session_id = p_session_id,
    updated_at = now();

  -- Log to history
  INSERT INTO consent_history (user_id, category_key, event_type, old_version, new_version, method, device_id, ip_hash, user_agent, session_id)
  VALUES (p_user_id, p_category_key, 'granted', v_old_version, p_version, p_method, p_device_id, p_ip_hash, p_user_agent, p_session_id);

  -- Log to audit
  INSERT INTO consent_audit_log (event_type, user_id, category_key, details, device_id, ip_hash, user_agent, session_id)
  VALUES ('consent_granted', p_user_id, p_category_key,
    jsonb_build_object('version', p_version, 'method', p_method, 'old_version', v_old_version),
    p_device_id, p_ip_hash, p_user_agent, p_session_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Withdraw consent
CREATE OR REPLACE FUNCTION withdraw_consent(
  p_user_id UUID,
  p_category_key TEXT,
  p_method TEXT DEFAULT 'toggle_settings',
  p_device_id TEXT DEFAULT NULL,
  p_ip_hash TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_old_version TEXT;
BEGIN
  -- Cannot withdraw core_service through this function (use account deletion)
  IF p_category_key = 'core_service' THEN
    RAISE EXCEPTION 'Core service consent withdrawal requires account deletion flow';
  END IF;

  SELECT version INTO v_old_version FROM consent_records
  WHERE user_id = p_user_id AND category_key = p_category_key;

  UPDATE consent_records
  SET granted = false, withdrawn_at = now(), updated_at = now()
  WHERE user_id = p_user_id AND category_key = p_category_key;

  INSERT INTO consent_history (user_id, category_key, event_type, old_version, method, device_id, ip_hash)
  VALUES (p_user_id, p_category_key, 'withdrawn', v_old_version, p_method, p_device_id, p_ip_hash);

  INSERT INTO consent_audit_log (event_type, user_id, category_key, details, device_id, ip_hash)
  VALUES ('consent_withdrawn', p_user_id, p_category_key,
    jsonb_build_object('version', v_old_version, 'method', p_method),
    p_device_id, p_ip_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
