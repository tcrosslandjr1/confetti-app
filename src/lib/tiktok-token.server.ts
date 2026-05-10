/**
 * TikTok token refresh / rotation.
 *
 * TikTok's OAuth access tokens expire after ~24h. Each token response also
 * includes a refresh_token (valid ~365 days, single-use — every refresh
 * returns a NEW refresh_token that must replace the old one).
 *
 * This module is *.server.ts so it is excluded from client bundles.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

interface TiktokTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  refresh_expires_in?: number;
  scope?: string;
  open_id?: string;
  error?: string;
  error_description?: string;
}

export interface RefreshedTiktokRow {
  user_id: string;
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
  scope: string | null;
}

function getAdminClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Call TikTok's token endpoint with grant_type=refresh_token.
 * Returns the parsed response or throws.
 */
async function callTiktokRefresh(refreshToken: string): Promise<TiktokTokenResponse> {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  if (!clientKey || !clientSecret) {
    throw new Error("TikTok credentials are not configured on the server");
  }

  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cache-Control": "no-cache",
    },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const json = (await res.json().catch(() => ({}))) as TiktokTokenResponse;
  if (!res.ok || json.error || !json.access_token) {
    const reason = json.error_description || json.error || `http_${res.status}`;
    throw new Error(`TikTok refresh failed: ${reason}`);
  }
  return json;
}

/**
 * Refresh the TikTok token for a single linked account row and persist
 * the rotated tokens. Returns the new expiry timestamp (or null).
 */
export async function refreshTiktokForUser(userId: string): Promise<RefreshedTiktokRow> {
  const admin = getAdminClient();

  const { data: row, error } = await admin
    .from("linked_social_accounts")
    .select("user_id, refresh_token")
    .eq("user_id", userId)
    .eq("provider", "tiktok")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!row) throw new Error("No linked TikTok account for user");
  if (!row.refresh_token) throw new Error("Stored TikTok account has no refresh_token");

  const tokenJson = await callTiktokRefresh(row.refresh_token);

  const expiresAt = tokenJson.expires_in
    ? new Date(Date.now() + tokenJson.expires_in * 1000).toISOString()
    : null;

  const update = {
    access_token: tokenJson.access_token!,
    // TikTok rotates the refresh token — only overwrite when a new one is
    // returned, otherwise keep the old one to avoid losing access.
    refresh_token: tokenJson.refresh_token ?? row.refresh_token,
    expires_at: expiresAt,
    scope: tokenJson.scope ?? null,
    updated_at: new Date().toISOString(),
  };

  const { error: upErr } = await admin
    .from("linked_social_accounts")
    .update(update)
    .eq("user_id", userId)
    .eq("provider", "tiktok");
  if (upErr) throw new Error(upErr.message);

  return {
    user_id: userId,
    access_token: update.access_token,
    refresh_token: update.refresh_token,
    expires_at: update.expires_at,
    scope: update.scope,
  };
}

/**
 * Returns a TikTok access token for the user, refreshing it first if it
 * expires within `skewSeconds` (default 5 min). Use this anywhere we need
 * to call the TikTok API on the user's behalf.
 */
export async function getValidTiktokAccessToken(
  userId: string,
  skewSeconds = 300,
): Promise<string> {
  const admin = getAdminClient();
  const { data: row, error } = await admin
    .from("linked_social_accounts")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .eq("provider", "tiktok")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!row?.access_token) throw new Error("No linked TikTok account");

  const expiresAt = row.expires_at ? new Date(row.expires_at).getTime() : 0;
  const needsRefresh = !expiresAt || expiresAt - Date.now() < skewSeconds * 1000;

  if (!needsRefresh) return row.access_token;

  const refreshed = await refreshTiktokForUser(userId);
  return refreshed.access_token;
}

/**
 * Find linked TikTok rows whose access token expires within `withinHours`
 * and refresh each. Used by the scheduled cron hook.
 */
export async function refreshExpiringTiktokTokens(withinHours = 24): Promise<{
  attempted: number;
  refreshed: number;
  failed: Array<{ user_id: string; error: string }>;
}> {
  const admin = getAdminClient();
  const cutoff = new Date(Date.now() + withinHours * 3600 * 1000).toISOString();

  const { data: rows, error } = await admin
    .from("linked_social_accounts")
    .select("user_id, expires_at")
    .eq("provider", "tiktok")
    .not("refresh_token", "is", null)
    .or(`expires_at.is.null,expires_at.lte.${cutoff}`);

  if (error) throw new Error(error.message);

  const failed: Array<{ user_id: string; error: string }> = [];
  let refreshed = 0;
  for (const r of rows ?? []) {
    try {
      await refreshTiktokForUser(r.user_id);
      refreshed += 1;
    } catch (e) {
      failed.push({ user_id: r.user_id, error: e instanceof Error ? e.message : String(e) });
    }
  }

  return { attempted: rows?.length ?? 0, refreshed, failed };
}
