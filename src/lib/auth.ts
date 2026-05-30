import type { Provider, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "./supabase";

export { isSupabaseConfigured };

export type AuthProviderId = "google" | "apple";

export type AccountPayload = {
  fullName: string;
  username: string;
  email: string;
  password: string;
};

export type AuthAccount = {
  id: string;
  email: string;
  fullName: string;
  username: string;
  provider: "email" | AuthProviderId;
};

const demoAccountKey = "confetti-demo-account";
const usernamePattern = /^[A-Za-z0-9_]{3,24}$/;

export function normalizeUsername(value: string) {
  return value.trim().replace(/\s+/g, "_").replace(/[^\w]/g, "").slice(0, 24);
}

function redirectUrl() {
  return typeof window === "undefined" ? undefined : `${window.location.origin}/auth/callback`;
}

function readDemoAccount(): AuthAccount | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(demoAccountKey);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthAccount;
  } catch {
    return null;
  }
}

function saveDemoAccount(account: AuthAccount) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(demoAccountKey, JSON.stringify(account));
  }
}

function mapSupabaseUser(user: User, provider: AuthAccount["provider"] = "email"): AuthAccount {
  const metadata = user.user_metadata ?? {};
  return {
    id: user.id,
    email: user.email ?? "",
    fullName: metadata.full_name ?? metadata.name ?? "Confetti Member",
    username: metadata.username ?? normalizeUsername(user.email?.split("@")[0] ?? "confetti_member"),
    provider
  };
}

function getAuthProvider(user: User): AuthAccount["provider"] {
  const provider = user.app_metadata?.provider;
  return provider === "google" || provider === "apple" ? provider : "email";
}

export async function ensureProfile(user: User) {
  return syncProfile(user);
}

async function syncProfile(user: User) {
  const provider = getAuthProvider(user);
  const account = mapSupabaseUser(user, provider);

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    full_name: account.fullName,
    username: account.username,
    email: account.email,
    avatar_url: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null,
    auth_provider: provider,
    last_login_at: new Date().toISOString()
  });

  // Non-fatal: the auth user already exists, so let the user proceed.
  // A DB trigger or a later upsert (on next login) can repair the row.
  if (profileError) {
    console.warn("[Confetti] profile sync failed (non-fatal):", profileError.message);
  }

  // Write Google/Apple identity data to linked_social_accounts (same table TikTok/Instagram use).
  if (provider === "google" || provider === "apple") {
    const identity = user.identities?.find((item) => item.provider === provider);
    const identityData = identity?.identity_data as Record<string, unknown> | undefined;

    const providerEmail = typeof identityData?.email === "string" ? identityData.email : account.email;
    const displayName = (identityData?.name ?? user.user_metadata?.name ?? null) as string | null;
    const avatarUrl = (identityData?.avatar_url ?? user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null) as string | null;

    const { error: linkError } = await supabase.from("linked_social_accounts").upsert(
      {
        user_id: user.id,
        provider,
        provider_user_id: identity?.id ?? "unknown",
        username: providerEmail,
        display_name: displayName,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,provider" }
    );

    if (linkError) {
      console.warn("[Confetti] social link sync failed (non-fatal):", linkError.message);
    }
  }

  return account;
}

function validateAccount(payload: AccountPayload) {
  const username = normalizeUsername(payload.username);

  if (!usernamePattern.test(username)) {
    throw new Error("Username must be 3-24 characters using letters, numbers, or underscores.");
  }

  if (!payload.email.includes("@")) {
    throw new Error("Enter a valid email address.");
  }

  if (payload.password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  return { ...payload, username, email: payload.email.trim().toLowerCase() };
}

export async function createAccountWithEmail(payload: AccountPayload) {
  const clean = validateAccount(payload);
  const fullName = clean.fullName.trim() || clean.username;

  if (import.meta.env.DEV && !isSupabaseConfigured) {
    const account: AuthAccount = {
      id: `demo-${Date.now()}`,
      email: clean.email,
      fullName,
      username: clean.username,
      provider: "email"
    };
    saveDemoAccount(account);
    return { account, needsEmailConfirmation: false };
  }

  const { data, error } = await supabase.auth.signUp({
    email: clean.email,
    password: clean.password,
    options: {
      data: {
        full_name: fullName,
        username: clean.username
      },
      emailRedirectTo: redirectUrl()
    }
  });

  if (error) throw error;
  if (!data.user) throw new Error("Account creation did not return a user.");

  const needsEmailConfirmation = Boolean(!data.session);

  // The profile upsert only succeeds when we have an active session
  // (RLS requires auth.uid() = id). When email confirmation is required
  // there's no session yet, so we skip the upsert here and let the
  // auth callback or a database trigger fill in the profile later.
  // Throwing on a missing-session profile error was previously failing
  // the whole signup even though the auth user had been created.
  if (!needsEmailConfirmation) {
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: data.user.id,
      full_name: fullName,
      username: clean.username,
      email: clean.email,
      auth_provider: "email",
      last_login_at: new Date().toISOString()
    });
    if (profileError) {
      console.warn("[Confetti] profile upsert failed (non-fatal):", profileError.message);
    }
  }

  return {
    account: mapSupabaseUser(data.user),
    needsEmailConfirmation
  };
}

async function resolveLoginIdentifier(identifier: string) {
  const clean = identifier.trim().toLowerCase();
  if (clean.includes("@")) return clean;
  if (import.meta.env.DEV && !isSupabaseConfigured) return clean;

  const { data, error } = await supabase.rpc("resolve_login_identifier", {
    login_identifier: normalizeUsername(clean)
  });

  if (error) throw error;
  if (!data) throw new Error("That username was not found. Try your email address.");
  return String(data);
}

export async function signInWithEmailOrUsername(identifier: string, password: string) {
  if (!password) throw new Error("Enter your password.");

  if (import.meta.env.DEV && !isSupabaseConfigured) {
    const saved = readDemoAccount();
    if (saved) return saved;
    const username = normalizeUsername(identifier.includes("@") ? identifier.split("@")[0] : identifier);
    const account: AuthAccount = {
      id: "demo-user",
      email: identifier.includes("@") ? identifier : `${username || "demo"}@confetti.local`,
      fullName: "Demo Explorer",
      username: username || "demo_explorer",
      provider: "email"
    };
    saveDemoAccount(account);
    return account;
  }

  const email = await resolveLoginIdentifier(identifier);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error("Sign in did not return a user.");

  await supabase
    .from("profiles")
    .update({ last_login_at: new Date().toISOString(), auth_provider: "email" })
    .eq("id", data.user.id);

  return mapSupabaseUser(data.user);
}

export async function signInWithSocial(provider: AuthProviderId) {
  if (import.meta.env.DEV && !isSupabaseConfigured) {
    const account: AuthAccount = {
      id: `demo-${provider}`,
      email: `${provider}@confetti.local`,
      fullName: `${provider === "google" ? "Google" : "Apple"} Demo`,
      username: `${provider}_demo`,
      provider
    };
    saveDemoAccount(account);
    return { account, redirecting: false };
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as Provider,
    options: {
      redirectTo: redirectUrl(),
      queryParams: provider === "google" ? { access_type: "offline", prompt: "consent" } : undefined
    }
  });

  if (error) throw error;
  return { url: data.url, redirecting: true };
}

export async function getCurrentAccount() {
  if (import.meta.env.DEV && !isSupabaseConfigured) return readDemoAccount();

  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.user) return null;
  return mapSupabaseUser(data.session.user);
}

export type AdminLevel = "none" | "support" | "manager" | "owner";

// Returns the caller's admin level. Backed by the `admin_users` table joined
// against auth.uid() via the `is_admin()` SQL function for the boolean check.
// Reads `admin_users` directly for the granular role since `is_admin()` flattens
// it. RLS on admin_users only lets owners read other rows; reading your own row
// is gated by the same policy, so non-admins simply get null → "none".
export async function getAdminLevel(): Promise<AdminLevel> {
  if (import.meta.env.DEV && !isSupabaseConfigured) return "none";

  const session = await supabase.auth.getSession();
  const userId = session.data.session?.user?.id;
  if (!userId) return "none";

  const { data, error } = await supabase
    .from("admin_users")
    .select("role, status")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data || data.status !== "active") return "none";
  const role = String(data.role) as AdminLevel;
  if (role === "owner" || role === "manager" || role === "support") return role;
  return "none";
}

export async function completeAuthCallback() {
  if (import.meta.env.DEV && !isSupabaseConfigured) return readDemoAccount();

  if (typeof window !== "undefined") {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const queryParams = new URLSearchParams(window.location.search);
    const authError = hashParams.get("error_description") ?? queryParams.get("error_description");
    if (authError) throw new Error(authError);

    const code = queryParams.get("code");
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
    }
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!data.session?.user) throw new Error("No Supabase session was found after the callback.");

  return syncProfile(data.session.user);
}

export async function signOutAccount() {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(demoAccountKey);
  }
  await supabase.auth.signOut({ scope: "local" });
}
