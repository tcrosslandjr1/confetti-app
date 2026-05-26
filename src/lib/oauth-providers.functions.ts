// @public-server-fn — returns only booleans about which OAuth providers are
// configured + names of missing env vars (never values). Safe unauthenticated
// so the ConnectionsPanel can render before login.
import { createServerFn } from "@tanstack/react-start";
import { getProvidersConfigStatus } from "./oauth-providers";

/**
 * Public: which custom OAuth providers (TikTok / Instagram) have credentials
 * configured in environment variables. Returns booleans + the names of any
 * missing env vars — never the values themselves.
 *
 * Used by the ConnectionsPanel to disable "Connect" buttons + show actionable
 * "Not configured" hints instead of letting the click fail mid-flow.
 */
export const getOAuthProvidersStatus = createServerFn({ method: "GET" }).handler(async () => {
  return { providers: getProvidersConfigStatus() };
});
