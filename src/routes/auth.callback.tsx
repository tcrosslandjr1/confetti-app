import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

const PENDING_REDIRECT_KEY = "confetti.pendingRedirect";

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

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let done = false;

    function go() {
      if (done) return;
      done = true;
      navigate({ to: consumePendingRedirect() as "/new/hub", replace: true });
    }

    async function processUrl() {
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      const query = typeof window !== "undefined" ? window.location.search : "";

      // ── Hash token (magic link / implicit flow) ──────────────────
      // Supabase redirects back as /auth/callback#access_token=...&refresh_token=...
      if (hash.includes("access_token")) {
        const params = new URLSearchParams(hash.replace(/^#/, ""));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (!error) { go(); return; }
        }
      }

      // ── PKCE code (OAuth / email confirmation) ───────────────────
      // Supabase redirects back as /auth/callback?code=...
      const code = new URLSearchParams(query).get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) { go(); return; }
      }

      // ── Already signed in ────────────────────────────────────────
      const { data } = await supabase.auth.getSession();
      if (data.session) { go(); return; }

      // ── Wait for Supabase to emit SIGNED_IN ──────────────────────
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
          subscription.unsubscribe();
          go();
        }
      });

      // Hard fallback — never leave user stuck here
      setTimeout(() => {
        subscription.unsubscribe();
        go();
      }, 8000);
    }

    void processUrl();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: "#1a0a00" }}>
      <div className="text-center">
        <div
          style={{
            width: 32, height: 32, borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.15)",
            borderTopColor: "#e85d3e",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 16px",
          }}
        />
        <p style={{
          fontFamily: "monospace", fontSize: 11, fontWeight: 700,
          letterSpacing: "0.14em", textTransform: "uppercase",
          color: "rgba(255,255,255,0.4)",
        }}>
          Signing you in…
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
