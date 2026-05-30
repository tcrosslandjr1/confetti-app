// Confetti — single source of truth for the browser Supabase client.
//
// IMPORTANT: Do NOT call createClient() here. This module previously created a
// SECOND browser auth client on the same storage key as the canonical client
// in `@/integrations/supabase/client`. Two GoTrueClient instances sharing one
// storage key race on session reads/writes and token refresh, which produced
// the "Multiple GoTrueClient instances detected" warning and flaky magic-link
// logins (sign-in appearing to fail or looping back to the sign-in screen).
//
// We now re-export the canonical singleton so the whole app shares ONE auth
// client and one session.

import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase as canonicalSupabase } from "@/integrations/supabase/client";

const rawUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const rawKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

function hasRealConfig(): boolean {
  // The canonical client ships hardcoded Confetti fallbacks, so a missing env
  // var does not break the connection. Treat config as present unless it is
  // explicitly a placeholder value.
  if (rawUrl?.includes("your-project-ref") || rawKey?.includes("your-supabase")) return false;
  return true;
}

export const isSupabaseConfigured = hasRealConfig();

// Re-export the ONE canonical client. Keeps the historical `@/lib/supabase`
// import path working while guaranteeing a single GoTrueClient instance.
export const supabase: SupabaseClient = canonicalSupabase as unknown as SupabaseClient;
