/**
 * SocialConnectService
 *
 * Handles the "Connect your socials" OAuth initiation flow for TikTok,
 * Instagram, and Facebook. Stores a single-use state row in Supabase,
 * then redirects the browser to the platform's OAuth consent screen.
 *
 * Callbacks land at:
 *   /api/public/tiktok/callback
 *   /api/public/instagram/callback
 *   /api/public/facebook/callback   (to be created — mirrors instagram pattern)
 *
 * After the callback upserts linked_social_accounts, the user is
 * redirected back to /new/socials?<platform>=connected (or =error).
 */

import { supabase } from "@/integrations/supabase/client";

export type SocialPlatform = "tiktok" | "instagram" | "facebook";

// --------------------------------------------------------------------------
// State table name per platform
// --------------------------------------------------------------------------
const STATE_TABLE: Record<SocialPlatform, string> = {
  tiktok:    "tiktok_oauth_states",
  instagram: "instagram_oauth_states",
  facebook:  "facebook_oauth_states",
};

// --------------------------------------------------------------------------
// OAuth base URLs and params (client IDs come from Vercel env on the server;
// here we only need the redirect to the consent screen).
// We bounce through a lightweight server action that knows the secrets.
// --------------------------------------------------------------------------

/** Kick off an OAuth flow for the given platform. */
export async function connectPlatform(
  platform: SocialPlatform,
  redirectBack = "/new/socials",
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Must be signed in to connect social accounts");

  // Generate a cryptographically random state token
  const stateToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

  // Write the state row — the callback validates this before issuing tokens
  const table = STATE_TABLE[platform];
  const { error } = await supabase.from(table).insert({
    state: stateToken,
    user_id: user.id,
    redirect_to: redirectBack,
    expires_at: expiresAt,
  });

  if (error) throw new Error(`Failed to create OAuth state: ${error.message}`);

  // Delegate to a thin server route that knows the client ID / secret
  const initiateUrl = `/api/public/${platform}/initiate?state=${stateToken}`;
  window.location.href = initiateUrl;
}

/** Disconnect a platform by deleting the linked_social_accounts row. */
export async function disconnectPlatform(platform: SocialPlatform): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Must be signed in");

  const { error } = await supabase
    .from("linked_social_accounts")
    .delete()
    .eq("user_id", user.id)
    .eq("provider", platform);

  if (error) throw new Error(`Failed to disconnect ${platform}: ${error.message}`);
}

/** Fetch all linked accounts for the current user. */
export async function getLinkedAccounts(): Promise<LinkedAccount[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("linked_social_accounts")
    .select("provider, username, display_name, avatar_url, updated_at")
    .eq("user_id", user.id);

  if (error) return [];
  return (data ?? []) as LinkedAccount[];
}

/** Trigger a social-sync run for the current user. */
export async function triggerSocialSync(): Promise<{ ok: boolean; message: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { ok: false, message: "Not signed in" };

  const res = await supabase.functions.invoke("social-sync", {
    body: { manual: true },
  });

  if (res.error) return { ok: false, message: res.error.message };
  return { ok: true, message: "Sync started — your taste profile is updating!" };
}

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------
export interface LinkedAccount {
  provider: SocialPlatform;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  updated_at: string | null;
}
