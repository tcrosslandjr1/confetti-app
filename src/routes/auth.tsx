import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Loader2, Wand2, Star, MapPin, PartyPopper, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

import { useServerFn } from "@tanstack/react-start";
import { seedDemoAccounts } from "@/lib/seed-demo.functions";
import { lovable } from "@/integrations/lovable";
import { rememberReferralCode, getPendingReferralCode } from "@/lib/referrals";
import { requestUserLocation } from "@/lib/location";
import { getMyAdvertiser } from "@/lib/ads";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => {
    const raw = typeof search.redirect === "string" ? search.redirect : "";
    // Only allow internal paths to avoid open-redirect to off-site URLs.
    const safe = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
    return { redirect: safe };
  },
  head: () => ({ meta: [{ title: "Sign in — Confetti" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { redirect: redirectTo } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [refCode, setRefCode] = useState(() => getPendingReferralCode() ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthBusy, setOauthBusy] = useState<"google" | "apple" | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [locationBlocked, setLocationBlocked] = useState(false);
  const [allowWithoutLocation, setAllowWithoutLocation] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState<string | null>(null);
  const seedFn = useServerFn(seedDemoAccounts);

  // Translate OAuth provider/Supabase errors into something a user can act on.
  function explainOAuthError(provider: "google" | "apple", raw: string): string {
    const msg = raw.toLowerCase();
    const label = provider === "google" ? "Google" : "Apple";
    if (msg.includes("popup") && msg.includes("closed"))
      return `${label} sign-in window was closed before finishing. Try again.`;
    if (
      msg.includes("access_denied") ||
      msg.includes("user cancelled") ||
      msg.includes("user canceled")
    )
      return `You cancelled the ${label} sign-in. No changes were made.`;
    if (msg.includes("redirect") && msg.includes("uri"))
      return `${label} rejected the redirect URL. The app's OAuth config needs the current domain whitelisted.`;
    if (msg.includes("invalid_client") || msg.includes("client_id"))
      return `${label} client credentials are invalid. Check the app configuration in Lovable Cloud → Auth.`;
    if (msg.includes("network") || msg.includes("failed to fetch"))
      return `Couldn't reach ${label}. Check your connection and try again.`;
    if (msg.includes("token"))
      return `${label} returned an invalid token. Try again, and if it keeps failing, sign in with email instead.`;
    return `${label} sign-in failed: ${raw}`;
  }

  // Parse OAuth callback errors landing back on /auth (?error=… or #error=…).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const search = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(
      window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "",
    );
    const errParam =
      search.get("error_description") ||
      search.get("error") ||
      hash.get("error_description") ||
      hash.get("error");
    const providerHint =
      (search.get("provider") || hash.get("provider") || "").toLowerCase() === "apple"
        ? "apple"
        : "google";
    if (errParam) {
      setError(
        explainOAuthError(
          providerHint as "google" | "apple",
          decodeURIComponent(errParam.replace(/\+/g, " ")),
        ),
      );
      // Clean the URL so the error doesn't stick on refresh.
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const onOAuth = async (provider: "google" | "apple") => {
    setError(null);
    setOauthBusy(provider);
    try {
      const { error, redirected } = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: `${window.location.origin}/auth?redirect=${encodeURIComponent(redirectTo)}`,
      });
      if (error) {
        setError(explainOAuthError(provider, error.message));
        setOauthBusy(null);
        return;
      }
      if (!redirected) {
        // Tokens already exchanged — auth-context will pick the session up.
        navigate({ to: redirectTo as never });
      }
      // If redirected === true, the browser is navigating away; leave busy on.
    } catch (e: any) {
      setError(explainOAuthError(provider, e?.message ?? String(e)));
      setOauthBusy(null);
    }
  };

  const fillDemo = (which: "admin" | "customer") => {
    setMode("signin");
    setEmail(which === "admin" ? "admin@demo.local" : "customer@demo.local");
    setPassword("Demo1234!");
  };

  const onSeed = async () => {
    setSeeding(true);
    setSeedMsg(null);
    try {
      await seedFn({});
      setSeedMsg("Demo accounts ready. Click Admin or Customer below to fill the form.");
    } catch (e: any) {
      setSeedMsg(e?.message ?? "Seed failed");
    } finally {
      setSeeding(false);
    }
  };

  // After sign-in, route business owners to their advertiser portal when the
  // caller didn't request a specific destination. Falls back to redirectTo
  // (defaults to "/") for everyone else.
  async function routeAfterAuth(uid: string) {
    if (redirectTo && redirectTo !== "/") {
      navigate({ to: redirectTo as never });
      return;
    }
    try {
      const advertiser = await getMyAdvertiser(uid);
      if (advertiser) {
        navigate({ to: "/advertise/portal" });
        return;
      }
    } catch {
      // Ignore — fall through to default redirect.
    }
    navigate({ to: redirectTo as never });
  }

  useEffect(() => {
    if (user) void routeAfterAuth(user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        if (refCode.trim()) rememberReferralCode(refCode);
        // Require location access by default. The user can opt out with
        // an explicit "continue without location" toggle.
        const loc = await requestUserLocation();
        if (!loc && !allowWithoutLocation) {
          setLocationBlocked(true);
          setError(
            "Location access is required to create your account. Enable location in your browser, then try again — or choose 'Continue without location' below.",
          );
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
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
      } else {
        const { error: signErr, data } = await supabase.auth.signInWithPassword({ email, password });
        if (signErr) throw signErr;
        // Refresh location opportunistically on sign-in too.
        void requestUserLocation();
        if (data.user) {
          await routeAfterAuth(data.user.id);
          return;
        }
      }
      navigate({ to: redirectTo as never });
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Decorative background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-gradient-vibe opacity-25 blur-3xl" />
        <div className="absolute top-1/3 -right-40 h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,_oklch(0.78_0.18_60_/_0.5),_transparent_70%)] blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-[radial-gradient(circle,_oklch(0.72_0.21_355_/_0.35),_transparent_70%)] blur-3xl" />
      </div>

      <div className="mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
        {/* Brand / marketing pane */}
        <aside className="relative hidden flex-col justify-between overflow-hidden p-10 lg:flex">
          <div className="absolute inset-6 -z-10 rounded-[2.5rem] bg-gradient-vibe shadow-pop" />
          <div className="absolute inset-6 -z-10 rounded-[2.5rem] bg-[radial-gradient(120%_80%_at_0%_0%,_oklch(1_0_0_/_0.18),_transparent_55%)]" />
          <div className="relative flex items-center gap-3 text-primary-foreground">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-background/20 backdrop-blur ring-1 ring-background/30">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="font-display text-xl font-bold leading-none">Confetti</div>
              <div className="text-xs opacity-80">Your city insider</div>
            </div>
          </div>

          <div className="relative space-y-6 text-primary-foreground">
            <h2 className="font-display text-4xl font-bold leading-[1.05]">
              Be the plan,<br />not an afterthought.
            </h2>
            <p className="max-w-sm text-sm/relaxed opacity-90">
              Curated dining, nightlife and events — picked for your taste, your city, your night.
            </p>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-background/20 backdrop-blur"><PartyPopper className="h-4 w-4" /></span>
                Earn Confetti on every booking
              </li>
              <li className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-background/20 backdrop-blur"><MapPin className="h-4 w-4" /></span>
                Hand-picked spots in 40+ cities
              </li>
              <li className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-background/20 backdrop-blur"><ShieldCheck className="h-4 w-4" /></span>
                Skip-the-line perks at partner venues
              </li>
            </ul>
          </div>

          <div className="relative rounded-2xl bg-background/15 p-4 text-primary-foreground backdrop-blur ring-1 ring-background/25">
            <div className="flex items-center gap-1 text-amber-200">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-current" />
              ))}
            </div>
            <p className="mt-2 text-sm leading-relaxed">
              "Booked an impossible reservation in 30 seconds. Felt like I had a friend on the inside."
            </p>
            <p className="mt-2 text-xs opacity-80">— Maya R., Brooklyn</p>
          </div>
        </aside>

        {/* Form pane */}
        <div className="flex flex-col px-6 py-10 sm:px-10 lg:py-14">
          <div className="flex items-center justify-between gap-3 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-vibe shadow-pop">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <div className="font-display text-lg font-bold leading-none">
                  <span className="text-gradient">Confetti</span>
                </div>
                <div className="text-xs text-muted-foreground">Your city insider</div>
              </div>
            </div>
          </div>

        <div className="mt-12">
          <h1 className="font-display text-3xl font-bold leading-tight">
            {mode === "signup" ? "Your personal\nguide to every city" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signup"
              ? "Dining, nightlife, and curated experiences picked for your taste."
              : "Pick up where you left off."}
          </p>
        </div>

        <div className="mt-8 space-y-2.5">
          <button
            type="button"
            onClick={() => onOAuth("google")}
            disabled={oauthBusy !== null}
            aria-busy={oauthBusy === "google"}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-4 text-sm font-semibold transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            {oauthBusy === "google" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 4.5c1.7 0 3.2.6 4.4 1.6l3.3-3.3C17.5 1.1 14.9 0 12 0 7.3 0 3.3 2.7 1.3 6.6l3.9 3C6.2 6.7 8.9 4.5 12 4.5z"
                />
                <path
                  fill="#34A853"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.4c-.3 1.5-1.1 2.7-2.4 3.5l3.7 2.9c2.2-2 3.8-5 3.8-8.5z"
                />
                <path
                  fill="#4A90E2"
                  d="M5.2 14.4c-.2-.6-.4-1.3-.4-2s.1-1.4.4-2l-3.9-3C.5 9 0 10.5 0 12s.5 3 1.3 4.6l3.9-3.2z"
                />
                <path
                  fill="#FBBC05"
                  d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5l-3.9 3C3.3 21.3 7.3 24 12 24z"
                />
              </svg>
            )}
            {oauthBusy === "google" ? "Redirecting to Google…" : "Continue with Google"}
          </button>

          <button
            type="button"
            onClick={() => onOAuth("apple")}
            disabled={oauthBusy !== null}
            aria-busy={oauthBusy === "apple"}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-foreground py-4 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {oauthBusy === "apple" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg
                width="16"
                height="18"
                viewBox="0 0 16 18"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M13.3 9.5c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.9-1.4-.1-2.8.9-3.5.9-.7 0-1.9-.8-3.1-.8-1.6 0-3.1.9-3.9 2.4-1.7 2.9-.4 7.2 1.2 9.5.8 1.1 1.8 2.4 3 2.4 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.1.8 1.3 0 2.1-1.1 2.9-2.3.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.7-1-2.7-4zM11 2.7c.6-.7 1-1.8.9-2.7-.9 0-2 .6-2.6 1.3-.6.6-1.1 1.7-.9 2.6 1 .1 2-.5 2.6-1.2z" />
              </svg>
            )}
            {oauthBusy === "apple" ? "Redirecting to Apple…" : "Continue with Apple"}
          </button>

          <button
            type="button"
            onClick={() =>
              setError(
                "Sign in with email/Google/Apple first, then connect TikTok from your profile to link the two accounts.",
              )
            }
            className="inline-flex w-full items-center justify-between gap-2 rounded-2xl border border-dashed border-border bg-card/60 px-4 py-3.5 text-sm font-semibold text-muted-foreground transition hover:bg-accent"
          >
            <span className="inline-flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-foreground text-background">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.6 6.3a5.5 5.5 0 0 1-3.4-1.2 5.5 5.5 0 0 1-2-3.4h-3.5v13.6a2.5 2.5 0 1 1-2.5-2.5c.3 0 .5 0 .8.1V9.4a6.1 6.1 0 0 0-.8 0 6 6 0 1 0 6 6V9a8.9 8.9 0 0 0 5.4 1.8V7.3c-.6 0-1.3-.3-2-1z" />
                </svg>
              </span>
              Continue with TikTok
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide">
              Soon
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              setError(
                "Sign in with email/Google/Apple first, then connect Instagram from your profile to link the two accounts. (Requires an Instagram Business or Creator account.)",
              )
            }
            className="inline-flex w-full items-center justify-between gap-2 rounded-2xl border border-dashed border-border bg-card/60 px-4 py-3.5 text-sm font-semibold text-muted-foreground transition hover:bg-accent"
          >
            <span className="inline-flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] text-white">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
                </svg>
              </span>
              Continue with Instagram
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide">
              Soon
            </span>
          </button>
        </div>

        {oauthBusy && (
          <p
            role="status"
            className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground"
          >
            <Loader2 className="h-3 w-3 animate-spin" />
            Opening {oauthBusy === "google" ? "Google" : "Apple"}… you'll be redirected back here
            when you're done.
          </p>
        )}

        <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-wider text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> or email{" "}
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          {mode === "signup" && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-2xl border border-border bg-card px-4 py-4 text-sm outline-none ring-ring/30 focus:ring-2"
            />
          )}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-2xl border border-border bg-card px-4 py-4 text-sm outline-none ring-ring/30 focus:ring-2"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-2xl border border-border bg-card px-4 py-4 text-sm outline-none ring-ring/30 focus:ring-2"
          />
          {mode === "signup" && (
            <input
              value={refCode}
              onChange={(e) => setRefCode(e.target.value.toUpperCase())}
              placeholder="Referral code (optional) — get $25 off your first booking"
              className="w-full rounded-2xl border border-border bg-card px-4 py-4 text-sm font-mono uppercase tracking-wider outline-none ring-ring/30 focus:ring-2"
            />
          )}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive"
            >
              <span aria-hidden className="mt-0.5">
                ⚠️
              </span>
              <div className="space-y-1">
                <p className="font-semibold">Something went wrong</p>
                <p className="opacity-90">{error}</p>
              </div>
            </div>
          )}
          {mode === "signup" && locationBlocked && (
            <label className="flex items-start gap-2 rounded-xl border border-border bg-card/50 p-3 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={allowWithoutLocation}
                onChange={(e) => setAllowWithoutLocation(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                Continue without location. Recommendations won't be tailored to your area until you
                enable it later.
              </span>
            </label>
          )}
          <button
            disabled={loading}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-vibe py-4 text-sm font-semibold text-primary-foreground shadow-pop transition-pop active:scale-95 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "signup" ? "Create account" : "Sign in"}
          </button>
          {mode === "signup" && (
            <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
              By creating an account you accept our{" "}
              <Link
                to="/data-terms"
                className="font-semibold text-foreground underline underline-offset-2"
              >
                Data sharing terms
              </Link>
              .
            </p>
          )}
        </form>

        <button
          type="button"
          onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}
          className="mt-6 text-center text-sm text-muted-foreground"
        >
          {mode === "signin" ? "Don't have an account? " : "Already have one? "}
          <span className="font-semibold text-foreground">
            {mode === "signin" ? "Sign up" : "Sign in"}
          </span>
        </button>

        {import.meta.env.DEV && (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/50 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Wand2 className="h-3.5 w-3.5" /> Dev quick start
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            One-click seed two demo accounts so you can test the admin and customer views.
          </p>
          <button
            type="button"
            onClick={onSeed}
            disabled={seeding}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background py-2.5 text-xs font-semibold transition hover:bg-accent disabled:opacity-60"
          >
            {seeding && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {seeding ? "Creating…" : "Seed demo accounts"}
          </button>
          {seedMsg && <p className="mt-2 text-xs text-muted-foreground">{seedMsg}</p>}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillDemo("admin")}
              className="rounded-xl bg-primary/10 py-2 text-xs font-semibold text-primary hover:bg-primary/20"
            >
              Use Admin
            </button>
            <button
              type="button"
              onClick={() => fillDemo("customer")}
              className="rounded-xl bg-secondary py-2 text-xs font-semibold text-secondary-foreground hover:bg-secondary/80"
            >
              Use Customer
            </button>
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">
            Password for both: <span className="font-mono">Demo1234!</span>
          </p>
        </div>
        )}

        <div className="mt-auto pt-10 text-center text-xs text-muted-foreground">
          By continuing you agree to our terms and{" "}
          <Link to="/data-terms" className="underline">
            data sharing policy
          </Link>
          .{" "}
          <Link to="/events" className="underline">
            Browse events
          </Link>
          <div className="mt-3">
            Are you an admin?{" "}
            <Link to="/admin/login" className="font-semibold text-foreground underline">
              Sign in here →
            </Link>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
