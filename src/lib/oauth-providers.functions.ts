// @public-server-fn — returns only booleans about which OAuth providers are
// configured; no secrets or user data. Safe to expose unauthenticated so the
// ConnectionsPanel can render before login.
import { createServerFn } from "@tanstack/react-start";
import { getProvidersConfigStatus } from "./oauth-providers";

/**
 * Public: which custom OAuth providers (TikTok / Instagram) have credentials
 * configured in Lovable Cloud secrets. Returns booleans + the names of any
 * missing env vars — never the values themselves.
 *
 * Used by the ConnectionsPanel to disable "Connect" buttons + show actionable
 * "Not configured" hints instead of letting the click fail mid-flow.
 */
export const getOAuthProvidersStatus = createServerFn({ method: "GET" }).handler(async () => {
  return { providers: getProvidersConfigStatus() };
});
