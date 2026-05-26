/**
 * OAuth provider configuration registry.
 *
 * Single source of truth for the custom OAuth providers we host
 * (TikTok, Instagram). Native Supabase identities (Google, Apple) are
 * managed separately by Supabase Auth and are not in this registry.
 *
 * This module is shared between server functions and the configuration
 * status UI, so it must NOT read process.env at module scope — server-only
 * helpers do that lazily inside handlers.
 */

import { z } from "zod";

export type CustomOAuthProvider = "tiktok" | "instagram";

export interface ProviderConfigSpec {
  id: CustomOAuthProvider;
  label: string;
  /**
   * Names of the environment variables (Vercel env vars) that hold
   * the app credentials for this provider.
   */
  envVars: readonly [clientIdVar: string, clientSecretVar: string];
  /** Callback path appended to the request origin. */
  callbackPath: string;
  /** Authorization endpoint the user is redirected to. */
  authorizeUrl: string;
  /** Token exchange endpoint. */
  tokenUrl: string;
  /** Default OAuth scopes we request. */
  defaultScope: string;
  /** Where to find the credentials. */
  developerPortal: string;
}

export const OAUTH_PROVIDERS = {
  tiktok: {
    id: "tiktok",
    label: "TikTok",
    envVars: ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"],
    callbackPath: "/api/public/tiktok/callback",
    authorizeUrl: "https://www.tiktok.com/v2/auth/authorize/",
    tokenUrl: "https://open.tiktokapis.com/v2/oauth/token/",
    defaultScope: "user.info.basic,user.info.profile",
    developerPortal: "https://developers.tiktok.com",
  },
  instagram: {
    id: "instagram",
    label: "Instagram",
    envVars: ["INSTAGRAM_CLIENT_ID", "INSTAGRAM_CLIENT_SECRET"],
    callbackPath: "/api/public/instagram/callback",
    authorizeUrl: "https://www.instagram.com/oauth/authorize",
    tokenUrl: "https://api.instagram.com/oauth/access_token",
    defaultScope: "instagram_business_basic",
    developerPortal: "https://developers.facebook.com",
  },
} as const satisfies Record<CustomOAuthProvider, ProviderConfigSpec>;

/**
 * Server-only: read + validate a provider's credentials from env.
 * Throws a descriptive Error if either env var is missing or empty.
 *
 * Why a Zod schema for two strings? Because we want the same cleanup
 * (trim, non-empty, sane max length) applied everywhere a credential is
 * read, and the same error shape for the UI to surface.
 */
const credentialsSchema = z.object({
  clientId: z.string().trim().min(1, "must not be empty").max(512, "is suspiciously long"),
  clientSecret: z.string().trim().min(1, "must not be empty").max(512, "is suspiciously long"),
});

export type ProviderCredentials = z.infer<typeof credentialsSchema>;

export function readProviderCredentials(id: CustomOAuthProvider): ProviderCredentials {
  const spec = OAUTH_PROVIDERS[id];
  const [idVar, secretVar] = spec.envVars;
  const raw = {
    clientId: process.env[idVar] ?? "",
    clientSecret: process.env[secretVar] ?? "",
  };
  const parsed = credentialsSchema.safeParse(raw);
  if (!parsed.success) {
    const missing: string[] = [];
    if (!raw.clientId) missing.push(idVar);
    if (!raw.clientSecret) missing.push(secretVar);
    if (missing.length > 0) {
      throw new Error(
        `${spec.label} is not configured. Missing environment variable(s): ${missing.join(", ")}.`,
      );
    }
    // Present but failed shape validation (too long, etc.)
    throw new Error(
      `${spec.label} credentials are invalid: ${parsed.error.issues
        .map((i) => `${i.path.join(".")} ${i.message}`)
        .join("; ")}.`,
    );
  }
  return parsed.data;
}

/**
 * Server-only: report which providers have credentials present, without
 * leaking the values themselves. Safe to expose to the client.
 */
export function getProvidersConfigStatus(): Array<{
  id: CustomOAuthProvider;
  label: string;
  configured: boolean;
  missing: string[];
  developerPortal: string;
}> {
  return (Object.values(OAUTH_PROVIDERS) as ProviderConfigSpec[]).map((spec) => {
    const missing = spec.envVars.filter((name) => !process.env[name]?.trim());
    return {
      id: spec.id,
      label: spec.label,
      configured: missing.length === 0,
      missing,
      developerPortal: spec.developerPortal,
    };
  });
}

/** Build the OAuth callback URL from the request host. */
export function buildCallbackUrl(id: CustomOAuthProvider, host: string | undefined): string {
  const proto = !host || host.includes("localhost") ? "http" : "https";
  return `${proto}://${host ?? "localhost"}${OAUTH_PROVIDERS[id].callbackPath}`;
}
