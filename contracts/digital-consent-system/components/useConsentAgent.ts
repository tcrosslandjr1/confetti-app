// ============================================================================
// Confetti App — useConsentAgent Hook
// React hook that wraps the ConsentAgent service for component use.
// ============================================================================

import { useState, useCallback } from "react";
import type {
  ConsentCategory,
  OnboardingConsentPayload,
  ConsentSettingsData,
} from "./ConsentTypes";

// ---------------------------------------------------------------------------
// API base — reads from env, falls back to local Supabase Edge Functions
// ---------------------------------------------------------------------------

const API_BASE =
  typeof process !== "undefined" && process.env?.NEXT_PUBLIC_CONSENT_API_URL
    ? process.env.NEXT_PUBLIC_CONSENT_API_URL
    : "/api/consent";

// ---------------------------------------------------------------------------
// Fetch helper
// ---------------------------------------------------------------------------

async function api<T>(
  path: string,
  opts: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(opts.headers || {}),
      },
      credentials: "include",
      ...opts,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { data: null, error: body.error || `HTTP ${res.status}` };
    }
    const data = await res.json();
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || "Network error" };
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useConsentAgent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---- Onboarding: submit all consent choices from boarding pass flow ----
  const submitOnboardingConsent = useCallback(
    async (payload: OnboardingConsentPayload) => {
      setLoading(true);
      setError(null);
      const result = await api<{ success: boolean }>("/onboarding", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setLoading(false);
      if (result.error) setError(result.error);
      return result;
    },
    []
  );

  // ---- Get current consent status for settings page ----
  const getConsentStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await api<{ consents: ConsentSettingsData[] }>("/status");
    setLoading(false);
    if (result.error) setError(result.error);
    return result;
  }, []);

  // ---- Grant a single consent category ----
  const grantConsent = useCallback(
    async (category: ConsentCategory, version: string) => {
      setLoading(true);
      setError(null);
      const result = await api<{ success: boolean }>("/grant", {
        method: "POST",
        body: JSON.stringify({ category, version }),
      });
      setLoading(false);
      if (result.error) setError(result.error);
      return result;
    },
    []
  );

  // ---- Withdraw a single consent category ----
  const withdrawConsent = useCallback(
    async (category: ConsentCategory) => {
      setLoading(true);
      setError(null);
      const result = await api<{ success: boolean }>("/withdraw", {
        method: "POST",
        body: JSON.stringify({ category }),
      });
      setLoading(false);
      if (result.error) setError(result.error);
      return result;
    },
    []
  );

  // ---- Check if re-consent is needed ----
  const checkReconsent = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await api<{
      needed: boolean;
      items: { category_key: string; current_version: string; latest_version: string }[];
    }>("/reconsent");
    setLoading(false);
    if (result.error) setError(result.error);
    return result;
  }, []);

  // ---- Submit a data subject request (GDPR Art. 15-22) ----
  const submitDataRequest = useCallback(async (requestType: string) => {
    setLoading(true);
    setError(null);
    const result = await api<{ request_id: string }>("/data-request", {
      method: "POST",
      body: JSON.stringify({ request_type: requestType }),
    });
    setLoading(false);
    if (result.error) setError(result.error);
    return result;
  }, []);

  // ---- Export user data (GDPR Art. 20 portability) ----
  const exportData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await api<{ download_url: string }>("/export");
    setLoading(false);
    if (result.error) setError(result.error);
    return result;
  }, []);

  // ---- Delete account (core_service withdrawal) ----
  const requestAccountDeletion = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await api<{ request_id: string }>("/data-request", {
      method: "POST",
      body: JSON.stringify({ request_type: "erasure" }),
    });
    setLoading(false);
    if (result.error) setError(result.error);
    return result;
  }, []);

  return {
    loading,
    error,
    submitOnboardingConsent,
    getConsentStatus,
    grantConsent,
    withdrawConsent,
    checkReconsent,
    submitDataRequest,
    exportData,
    requestAccountDeletion,
  };
}
