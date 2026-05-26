// Confetti OAuth helper — wraps Supabase Auth with a consistent return contract.

import { supabase } from "../supabase/client";
import type { Provider } from "@supabase/supabase-js";

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

type OAuthResult =
  | { redirected: true; error?: undefined }
  | { error: Error; redirected?: undefined }
  | { error?: undefined; redirected?: undefined };

/**
 * Thin wrapper around supabase.auth.signInWithOAuth that keeps
 * the same return contract the auth page expects:
 *   { redirected: true }  — browser is navigating to the provider
 *   { error: Error }      — something went wrong before redirect
 */
export const confettiAuth = {
  signInWithOAuth: async (
    provider: "google" | "apple" | "microsoft",
    opts?: SignInOptions,
  ): Promise<OAuthResult> => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider as Provider,
        options: {
          redirectTo: opts?.redirect_uri,
          queryParams: opts?.extraParams,
        },
      });

      if (error) {
        return { error: error instanceof Error ? error : new Error(String(error)) };
      }

      // Supabase signInWithOAuth triggers a full-page redirect to data.url.
      // By the time we reach here the browser is already navigating, but
      // return the flag so the caller can keep the spinner visible.
      return { redirected: true };
    } catch (e) {
      return { error: e instanceof Error ? e : new Error(String(e)) };
    }
  },
};
