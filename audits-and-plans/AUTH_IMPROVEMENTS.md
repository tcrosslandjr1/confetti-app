# Auth Improvements — Complete Code Bundle

> **How to use:** Each section below is a self-contained change. Copy the code blocks directly into Lovable or your editor. Apply them in order (1 → 2 → 3 → 4 → 5).

---

## 1. Consolidate Social Links Tables (Migration)

**Problem:** Two competing tables — `profile_social_links` (Google/Apple) vs `linked_social_accounts` (TikTok/Instagram). This migration merges them into `linked_social_accounts` as the single source of truth.

**File: New Supabase migration** — run this in Supabase SQL Editor or create a new migration file.

```sql
-- Migration: Consolidate profile_social_links → linked_social_accounts
-- Safe to run multiple times (idempotent).

-- 1. Copy any Google/Apple rows from profile_social_links that aren't
--    already in linked_social_accounts.
INSERT INTO public.linked_social_accounts (
  user_id, provider, provider_user_id, username, display_name,
  avatar_url, created_at, updated_at
)
SELECT
  psl.user_id,
  psl.provider,
  COALESCE(psl.provider_user_id, 'unknown'),
  NULL,                                          -- profile_social_links has no username column
  psl.metadata->>'name',
  psl.metadata->>'avatar_url',
  psl.connected_at,
  COALESCE(psl.last_used_at, psl.connected_at)
FROM public.profile_social_links psl
WHERE NOT EXISTS (
  SELECT 1 FROM public.linked_social_accounts lsa
  WHERE lsa.user_id = psl.user_id AND lsa.provider = psl.provider
)
ON CONFLICT (user_id, provider) DO NOTHING;

-- 2. Drop the old table (safe — nothing reads it after the auth.ts patch below).
DROP TABLE IF EXISTS public.profile_social_links CASCADE;

-- 3. Create the username availability RPC (needed for Task 4 below).
CREATE OR REPLACE FUNCTION public.check_username_available(desired_username text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF desired_username IS NULL
     OR length(trim(desired_username)) < 3
     OR NOT (trim(desired_username) ~ '^[A-Za-z0-9_]{3,24}$')
  THEN
    RETURN false;
  END IF;

  RETURN NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE lower(username) = lower(trim(desired_username))
  );
END;
$$;

REVOKE ALL ON FUNCTION public.check_username_available(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_username_available(text) TO anon, authenticated;

-- 4. Create the referral code validation RPC (needed for Task 5 below).
CREATE OR REPLACE FUNCTION public.check_referral_code(code_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  owner_name text;
BEGIN
  IF code_input IS NULL OR length(trim(code_input)) = 0 THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'empty');
  END IF;

  SELECT p.full_name INTO owner_name
  FROM public.referral_codes rc
  JOIN public.profiles p ON p.id = rc.user_id
  WHERE rc.code = upper(trim(code_input));

  IF owner_name IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'not_found');
  END IF;

  RETURN jsonb_build_object('valid', true, 'referrer', owner_name);
END;
$$;

REVOKE ALL ON FUNCTION public.check_referral_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_referral_code(text) TO anon, authenticated;
```

---

## 2. Patch `src/lib/auth.ts` — Use `linked_social_accounts` Instead of `profile_social_links`

**Replace the entire `syncProfile` function** (lines 68-108) with this version that writes to `linked_social_accounts`:

```typescript
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
```

---

## 3. Patch `src/routes/auth.lazy.tsx` — Username Field + Referral Validation + Remove Location from Signup

This is the big one. There are **four changes** to make in the auth page.

### 3A. Add new state variables (near line 54, after the existing state declarations)

Find this block:
```typescript
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState<string | null>(null);
```

Replace with:
```typescript
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState<string | null>(null);

  // Username availability check (debounced)
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const usernameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Referral code validation (debounced)
  const [refStatus, setRefStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [refReferrer, setRefReferrer] = useState<string | null>(null);
  const refTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
```

### 3B. Add the debounced check handlers (right after the state declarations above)

Insert this block immediately after:
```typescript
  // Debounced username availability check
  const checkUsername = (value: string) => {
    const normalized = value.trim().replace(/\s+/g, "_").replace(/[^\w]/g, "").slice(0, 24);
    setUsername(normalized);

    if (usernameTimerRef.current) clearTimeout(usernameTimerRef.current);

    if (normalized.length < 3) {
      setUsernameStatus(normalized.length === 0 ? "idle" : "invalid");
      return;
    }
    if (!/^[A-Za-z0-9_]{3,24}$/.test(normalized)) {
      setUsernameStatus("invalid");
      return;
    }

    setUsernameStatus("checking");
    usernameTimerRef.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase.rpc("check_username_available", {
          desired_username: normalized,
        });
        if (error) throw error;
        setUsernameStatus(data ? "available" : "taken");
      } catch {
        setUsernameStatus("idle");
      }
    }, 400);
  };

  // Debounced referral code validation
  const checkRefCode = (value: string) => {
    const upper = value.toUpperCase();
    setRefCode(upper);
    setRefReferrer(null);

    if (refTimerRef.current) clearTimeout(refTimerRef.current);

    if (!upper.trim()) {
      setRefStatus("idle");
      return;
    }

    setRefStatus("checking");
    refTimerRef.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase.rpc("check_referral_code", {
          code_input: upper.trim(),
        });
        if (error) throw error;
        const result = data as { valid: boolean; referrer?: string; reason?: string };
        if (result.valid) {
          setRefStatus("valid");
          setRefReferrer(result.referrer ?? null);
        } else {
          setRefStatus("invalid");
        }
      } catch {
        setRefStatus("idle");
      }
    }, 500);
  };
```

### 3C. Update the `onSubmit` handler — Remove location request, add username to signup

Find the `onSubmit` function (around line 273). Replace the **entire signup branch** inside it.

Find this section:
```typescript
      if (mode === "signup") {
        if (refCode.trim()) rememberReferralCode(refCode);
        const loc = allowWithoutLocation
          ? null
          : await requestUserLocation({ enableHighAccuracy: false, timeout: 3500, maximumAge: 60_000 }).catch(() => null);
        setLocationBlocked(!loc);
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              display_name: name || email.split("@")[0],
              ...(loc ? { signup_lat: loc.lat, signup_lng: loc.lng } : {}),
            },
          },
        });
        if (error) throw error;
        if (data.session && data.user) {
          await routeAfterAuth(data.user.id);
          return;
        }
        setNotice("Account created. Check your email to verify your account, then sign in.");
        setMode("signin");
        return;
```

Replace with:
```typescript
      if (mode === "signup") {
        // Block submission if username is taken or invalid
        if (username && usernameStatus === "taken") {
          setError("That username is already taken. Try another.");
          return;
        }
        if (username && usernameStatus === "invalid") {
          setError("Username must be 3-24 characters (letters, numbers, underscores).");
          return;
        }
        // Block if referral code is explicitly invalid
        if (refCode.trim() && refStatus === "invalid") {
          setError("That referral code wasn't recognized. Double-check it or leave it blank.");
          return;
        }
        if (refCode.trim()) rememberReferralCode(refCode);
        const normalizedUsername = username || (name || email.split("@")[0]).trim().replace(/\s+/g, "_").replace(/[^\w]/g, "").slice(0, 24);
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              display_name: name || email.split("@")[0],
              username: normalizedUsername,
            },
          },
        });
        if (error) throw error;
        if (data.session && data.user) {
          await routeAfterAuth(data.user.id);
          return;
        }
        setNotice("Account created. Check your email to verify your account, then sign in.");
        setMode("signin");
        return;
```

Also in the **sign-in branch**, remove the location call. Find:
```typescript
        // Refresh location opportunistically on sign-in too.
        void requestUserLocation();
```
Delete that line (location will be requested on first recommendation instead).

### 3D. Update the signup form JSX — Add username input + referral validation feedback + remove location checkbox

**Add the username input field.** Find the name input (around line 862-876). Right after the closing `</div>` of the name input, add the username field:

Find:
```typescript
            {mode === "signup" && (
              <div className="relative">
                <UserIcon
                  className="pointer-events-none absolute inset-y-0 left-4 my-auto h-4 w-4 text-ink/40"
                  aria-hidden
                />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="w-full rounded-2xl border-2 border-ink bg-cream pl-11 pr-4 py-4 text-sm font-semibold text-ink placeholder:text-ink/40 outline-none focus:ring-2 focus:ring-coral/40 transition"
                />
              </div>
            )}
```

Replace with:
```typescript
            {mode === "signup" && (
              <>
                <div className="relative">
                  <UserIcon
                    className="pointer-events-none absolute inset-y-0 left-4 my-auto h-4 w-4 text-ink/40"
                    aria-hidden
                  />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                    className="w-full rounded-2xl border-2 border-ink bg-cream pl-11 pr-4 py-4 text-sm font-semibold text-ink placeholder:text-ink/40 outline-none focus:ring-2 focus:ring-coral/40 transition"
                  />
                </div>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-4 my-auto flex h-4 items-center text-ink/40 text-xs font-bold">@</span>
                  <input
                    value={username}
                    onChange={(e) => checkUsername(e.target.value)}
                    placeholder="Username (optional)"
                    maxLength={24}
                    className={`w-full rounded-2xl border-2 bg-cream pl-11 pr-12 py-4 text-sm font-semibold text-ink placeholder:text-ink/40 outline-none transition focus:ring-2 focus:ring-coral/40 ${
                      usernameStatus === "taken"
                        ? "border-red-400"
                        : usernameStatus === "available"
                          ? "border-emerald-400"
                          : "border-ink"
                    }`}
                  />
                  {usernameStatus === "checking" && (
                    <Loader2 className="absolute inset-y-0 right-4 my-auto h-4 w-4 animate-spin text-ink/40" />
                  )}
                  {usernameStatus === "available" && (
                    <span className="pointer-events-none absolute inset-y-0 right-4 my-auto grid h-7 w-7 place-items-center rounded-full border-2 border-ink bg-coral text-cream animate-[reveal-scale_0.35s_cubic-bezier(0.22,1,0.36,1)_forwards]">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                  )}
                  {usernameStatus === "taken" && (
                    <span className="pointer-events-none absolute inset-y-0 right-4 my-auto grid h-7 w-7 place-items-center rounded-full border-2 border-red-400 bg-red-50 text-red-500 text-xs font-bold">
                      ✕
                    </span>
                  )}
                </div>
                {usernameStatus === "taken" && (
                  <p className="px-1 text-[10px] font-semibold text-red-500 -mt-1 animate-[reveal-up_0.25s_ease_forwards]">
                    That username is taken — try another
                  </p>
                )}
                {usernameStatus === "invalid" && username.length > 0 && (
                  <p className="px-1 text-[10px] font-semibold text-amber-600 -mt-1 animate-[reveal-up_0.25s_ease_forwards]">
                    3-24 characters: letters, numbers, underscores only
                  </p>
                )}
              </>
            )}
```

**Replace the referral code input** with a validated version. Find:
```typescript
            {mode === "signup" && (
              <input
                value={refCode}
                onChange={(e) => setRefCode(e.target.value.toUpperCase())}
                placeholder="Referral code (optional) — get $25 off your first booking"
                className="w-full rounded-2xl border-2 border-ink/40 bg-cream/60 px-4 py-4 text-sm font-mono font-semibold uppercase tracking-wider text-ink placeholder:text-ink/40 outline-none focus:border-ink focus:bg-cream focus:ring-2 focus:ring-coral/40 transition"
              />
            )}
```

Replace with:
```typescript
            {mode === "signup" && (
              <div>
                <div className="relative">
                  <Ticket
                    className="pointer-events-none absolute inset-y-0 left-4 my-auto h-4 w-4 text-ink/40"
                    aria-hidden
                  />
                  <input
                    value={refCode}
                    onChange={(e) => checkRefCode(e.target.value)}
                    placeholder="Referral code (optional)"
                    className={`w-full rounded-2xl border-2 bg-cream/60 pl-11 pr-12 py-4 text-sm font-mono font-semibold uppercase tracking-wider text-ink placeholder:text-ink/40 outline-none focus:bg-cream focus:ring-2 focus:ring-coral/40 transition ${
                      refStatus === "valid"
                        ? "border-emerald-400"
                        : refStatus === "invalid"
                          ? "border-red-400"
                          : "border-ink/40 focus:border-ink"
                    }`}
                  />
                  {refStatus === "checking" && (
                    <Loader2 className="absolute inset-y-0 right-4 my-auto h-4 w-4 animate-spin text-ink/40" />
                  )}
                  {refStatus === "valid" && (
                    <span className="pointer-events-none absolute inset-y-0 right-4 my-auto grid h-7 w-7 place-items-center rounded-full border-2 border-ink bg-coral text-cream animate-[reveal-scale_0.35s_cubic-bezier(0.22,1,0.36,1)_forwards]">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                  )}
                  {refStatus === "invalid" && (
                    <span className="pointer-events-none absolute inset-y-0 right-4 my-auto grid h-7 w-7 place-items-center rounded-full border-2 border-red-400 bg-red-50 text-red-500 text-xs font-bold">
                      ✕
                    </span>
                  )}
                </div>
                {refStatus === "valid" && refReferrer && (
                  <p className="px-1 mt-1.5 text-[10px] font-semibold text-emerald-600 animate-[reveal-up_0.25s_ease_forwards]">
                    <Gift className="inline h-3 w-3 mr-1" />
                    Referred by {refReferrer} — $25 off your first booking!
                  </p>
                )}
                {refStatus === "invalid" && (
                  <p className="px-1 mt-1.5 text-[10px] font-semibold text-red-500 animate-[reveal-up_0.25s_ease_forwards]">
                    Code not recognized — double-check it or leave blank
                  </p>
                )}
              </div>
            )}
```

**Remove the location-blocked checkbox.** Find and DELETE this entire block:
```typescript
            {mode === "signup" && locationBlocked && (
              <label className="flex items-start gap-2 rounded-xl border-2 border-ink/30 bg-cream/60 p-3 text-xs text-ink/70">
                <input
                  type="checkbox"
                  checked={allowWithoutLocation}
                  onChange={(e) => setAllowWithoutLocation(e.target.checked)}
                  className="mt-0.5 accent-coral"
                />
                <span>
                  Continue without location. Recommendations won't be tailored to your area until
                  you enable it later.
                </span>
              </label>
            )}
```

---

## 4. Clean Up Unused Imports in `auth.lazy.tsx`

After the changes above, you can remove the `requestUserLocation` import since it's no longer used on this page. Find:
```typescript
import { requestUserLocation } from "@/lib/location";
```
Delete that line.

Also remove the unused state variables. Find:
```typescript
  const [locationBlocked, setLocationBlocked] = useState(false);
  const [allowWithoutLocation, setAllowWithoutLocation] = useState(false);
```
Delete both lines.

And remove the `MapPin` import if it's only used for location — check if it's used elsewhere in the file first.

---

## 5. Update `src/lib/auth.ts` — Pass Username Through `createAccountWithEmail`

In the `createAccountWithEmail` function, the profile upsert (around line 168) should also write the username. This function is used by the demo mode fallback. Find:

```typescript
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: data.user.id,
      full_name: fullName,
      username: clean.username,
      email: clean.email,
      auth_provider: "email",
      last_login_at: new Date().toISOString()
    });
```

This already writes username correctly — no change needed here. The key fix is that `auth.lazy.tsx` now passes `username` in the `data` metadata of `supabase.auth.signUp()`, which the `handle_new_user` trigger can pick up to populate the profiles table.

---

## Summary of Changes

| # | What | Where | Type |
|---|------|-------|------|
| 1 | Consolidate social links tables + create RPCs | SQL migration | Backend |
| 2 | Switch `syncProfile` to `linked_social_accounts` | `src/lib/auth.ts` | Backend |
| 3A | Add username + referral validation state | `src/routes/auth.lazy.tsx` | Frontend |
| 3B | Debounced check handlers for username + referral | `src/routes/auth.lazy.tsx` | Frontend |
| 3C | Remove location from signup, add username to metadata | `src/routes/auth.lazy.tsx` | Frontend |
| 3D | Username input field + referral validation UI | `src/routes/auth.lazy.tsx` | Frontend |
| 4 | Clean up unused imports | `src/routes/auth.lazy.tsx` | Frontend |
| 5 | No change needed (already correct) | `src/lib/auth.ts` | — |

**Already done (no action needed):**
- Forgot-password flow: fully built at `/reset-password`
- TikTok callback: fully built at `/api/public/tiktok/callback`
- Instagram callback: fully built at `/api/public/instagram/callback`
