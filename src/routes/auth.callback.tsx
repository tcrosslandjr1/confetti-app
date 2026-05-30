import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { completeAuthCallback } from "@/lib/auth";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

const PENDING_REDIRECT_KEY = "confetti.pendingRedirect";

/** Store a post-auth redirect path before navigating away to the OTP flow. */
export function storePendingRedirect(path: string) {
  if (typeof sessionStorage !== "undefined" && path && path.startsWith("/")) {
    sessionStorage.setItem(PENDING_REDIRECT_KEY, path);
  }
}

function consumePendingRedirect(): string {
  if (typeof sessionStorage === "undefined") return "/new/hub";
  const stored = sessionStorage.getItem(PENDING_REDIRECT_KEY);
  sessionStorage.removeItem(PENDING_REDIRECT_KEY);
  return stored && stored.startsWith("/") && !stored.startsWith("//") ? stored : "/new/hub";
}

/** Detect whether this is a brand-new user signup from the URL hash. */
function isNewUserSignup(): boolean {
  if (typeof window === "undefined") return false;
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const query = new URLSearchParams(window.location.search);
  const type = hash.get("type") ?? query.get("type");
  return type === "signup";
}

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let redirected = false;

    async function finish() {
      if (redirected) return;
      redirected = true;
      // Exchange the code for a session and guarantee the profiles row exists.
      try {
        await completeAuthCallback();
      } catch {
        // Non-fatal — the user is authenticated even if profile sync failed.
      }

      // Prefer a stored redirect (set before the user went to the email link),
      // then fall back to /app. New signups land directly on /app so the
      // FirstRunNudge can welcome them — there is no separate onboarding gate.
      const destination = consumePendingRedirect();
      navigate({ to: destination as "/new/hub", replace: true });
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        subscription.unsubscribe();
        void finish();
      }
    });

    // Fallback: already signed in when this component mounts
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        subscription.unsubscribe();
        void finish();
      }
    });

    // Hard timeout — never leave user stuck on this screen
    const t = setTimeout(() => {
      subscription.unsubscribe();
      void finish();
    }, 5000);

    return () => {
      clearTimeout(t);
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-mocha-dark">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-cream/20 border-t-coral" />
        <p className="font-mono text-xs uppercase tracking-widest text-cream/50">Signing you in…</p>
      </div>
    </div>
  );
}
