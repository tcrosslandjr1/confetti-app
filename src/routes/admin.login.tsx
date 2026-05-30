import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/login")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    const raw = search.redirect;
    if (typeof raw !== "string") return { redirect: undefined };
    // Must be a same-origin /admin/* path
    if (!raw.startsWith("/admin/")) return { redirect: undefined };
    // Reject protocol-relative tricks like //evil.com/admin
    if (raw.startsWith("//")) return { redirect: undefined };
    // Prevent redirect loops back to the login page itself
    if (raw === "/admin/login" || raw.startsWith("/admin/login?")) return { redirect: undefined };
    return { redirect: raw };
  },
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();

  const [email, setEmail] = useState("tcrosslandjr1@gmail.com");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  // Given an authenticated session, route admins onward and bounce everyone else.
  const gateSession = useCallback(
    async (userId: string) => {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (roleData) {
        navigate({ to: redirect ?? "/admin/console" });
        return true;
      }

      // Signed in, but not an admin — drop the session so they can try another account.
      await supabase.auth.signOut();
      setError("This account doesn't have admin access. Sign in with an admin email.");
      setSent(false);
      return false;
    },
    [navigate, redirect],
  );

  // On mount (and after a magic link returns here), check for an existing session.
  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!active) return;
      if (session) {
        await gateSession(session.user.id);
      }
      if (active) setChecking(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
        void gateSession(session.user.id);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [gateSession]);

  const handleSendLink = async () => {
    const addr = email.trim();
    if (!addr) {
      setError("Enter your admin email");
      return;
    }

    setLoading(true);
    setError(null);

    // Land back on /admin/login after the link is opened — the session check above
    // then verifies the admin role and forwards to the console. Using ?next= keeps
    // this reliable even when the link opens in a new tab.
    const emailRedirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
      "/admin/login",
    )}`;

    const { error: authError } = await supabase.auth.signInWithOtp({
      email: addr,
      options: {
        emailRedirectTo,
        // Never create a brand-new account from the admin door.
        shouldCreateUser: false,
      },
    });

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }
    setSent(true);
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#0a0a0f",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        padding: "24px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ marginBottom: 48 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 14px",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 8,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: "#ff5b3d",
                boxShadow: "0 0 8px #ff5b3d",
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: ".2em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.5)",
              }}
            >
              CONFETTI · ADMIN
            </span>
          </div>
        </div>

        <h1
          style={{
            margin: "0 0 6px",
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "#ffffff",
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          Admin access
        </h1>
        <p
          style={{
            margin: "0 0 32px",
            fontSize: 13,
            color: "rgba(255,255,255,0.4)",
            fontFamily: "'Inter', system-ui, sans-serif",
            lineHeight: 1.5,
          }}
        >
          Restricted to authorised accounts only. We'll email you a secure sign-in link.
        </p>

        {/* Error */}
        {error && (
          <div
            style={{
              padding: "10px 14px",
              marginBottom: 16,
              borderRadius: 8,
              background: "rgba(255,91,61,0.1)",
              border: "1px solid rgba(255,91,61,0.4)",
              fontSize: 12,
              color: "#ff8a75",
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
          >
            {error}
          </div>
        )}

        {checking ? (
          <div
            style={{
              padding: 20,
              textAlign: "center",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: ".14em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.35)",
            }}
          >
            checking session…
          </div>
        ) : sent ? (
          <div
            style={{
              padding: 20,
              borderRadius: 12,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,91,61,0.3)",
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 10 }}>📬</div>
            <div
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: 15,
                fontWeight: 700,
                color: "#ffffff",
                marginBottom: 6,
              }}
            >
              Check your inbox
            </div>
            <div
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: 13,
                color: "rgba(255,255,255,0.45)",
                lineHeight: 1.5,
              }}
            >
              We sent a secure sign-in link to {email}. Open it on this device to enter the admin
              console.
            </div>
            <button
              onClick={() => {
                setSent(false);
                setError(null);
              }}
              style={{
                appearance: "none",
                cursor: "pointer",
                marginTop: 16,
                padding: 0,
                border: "none",
                background: "transparent",
                color: "rgba(255,255,255,0.4)",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              ← use a different email
            </button>
          </div>
        ) : (
          <>
            {/* Email */}
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: ".16em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.35)",
                  marginBottom: 8,
                }}
              >
                admin email
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 14px",
                  background: "rgba(255,255,255,0.05)",
                  border: `1px solid ${email.trim() ? "rgba(255,91,61,0.4)" : "rgba(255,255,255,0.12)"}`,
                  borderRadius: 10,
                  transition: "border-color .15s",
                }}
              >
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>✉</span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendLink()}
                  placeholder="admin@confetti.app"
                  type="email"
                  autoComplete="email"
                  style={{
                    appearance: "none",
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    flex: 1,
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#ffffff",
                  }}
                />
              </div>
            </div>

            {/* Send link button */}
            <button
              onClick={handleSendLink}
              disabled={loading || !email.trim()}
              style={{
                appearance: "none",
                cursor: loading || !email.trim() ? "not-allowed" : "pointer",
                width: "100%",
                padding: "13px",
                background: loading || !email.trim() ? "rgba(255,255,255,0.06)" : "#ff5b3d",
                border: "none",
                borderRadius: 10,
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: 14,
                fontWeight: 700,
                color: loading || !email.trim() ? "rgba(255,255,255,0.3)" : "#ffffff",
                transition: "background .15s, color .15s",
              }}
            >
              {loading ? "sending link..." : "email me a sign-in link"}
            </button>
          </>
        )}

        {/* Back to app */}
        <div style={{ marginTop: 40, textAlign: "center" }}>
          <a
            href="/new/hub"
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: 12,
              color: "rgba(255,255,255,0.2)",
              textDecoration: "none",
            }}
          >
            ← back to app
          </a>
        </div>
      </div>
    </div>
  );
}
