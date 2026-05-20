// ============================================================================
// Confetti App — Consent UI Types
// Shared types for all consent components.
// ============================================================================

export type ConsentCategory =
  | "core_service"
  | "taste_profiling"
  | "location_services"
  | "dietary_health"
  | "marketing_comms"
  | "sms_push"
  | "cookies_tracking"
  | "group_taste"
  | "third_party_sharing";

export interface ConsentToggleState {
  category: ConsentCategory;
  granted: boolean;
  label: string;
  description: string;
  required: boolean;
  specialNotice?: string;
  withdrawalConsequence?: string;
}

export interface DocumentVersion {
  key: string;
  title: string;
  version: string;
  url: string;
}

export interface OnboardingConsentPayload {
  core_service: boolean;
  taste_profiling: boolean;
  location_services: boolean;
  dietary_health: boolean;
  marketing_comms: boolean;
  sms_push: boolean;
  cookies_tracking: boolean;
  document_versions: Record<string, string>;
}

export interface ConsentSettingsData {
  category: ConsentCategory;
  granted: boolean;
  version: string;
  granted_at: string | null;
  withdrawn_at: string | null;
  is_required: boolean;
  withdrawal_consequence: string;
}

export type OnboardingStep = 1 | 2 | 3 | 4 | 5;
