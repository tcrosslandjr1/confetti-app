import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/login")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    const raw = typeof search.redirect === "string" ? search.redirect : "";
    const safe = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/admin/console";
    return { redirect: safe };
  },
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already signed in and admin, go straight to console
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (data) navigate({ to: redirect ?? "/admin/console" });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          // Check admin role before redirecting
          const { data } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .eq("role", "admin")
            .maybeSingle();
          if (data) {
            navigate({ to: redirect ?? "/admin/console" });
          } else {
            // Signed in but not admin — sign them out and show error
            await supabase.auth.signOut();
            setError("This account does not have admin access.");
            setSent(false);
          }
        }
      }
    );
    return () => subscription.unsubscribe();
  }, [navigate, redirect]);

  const handleSend = async () => {
    if (!email.trim()) { setError("Enter your email"); return; }
    setLoading(true);
    setError(null);
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/admin/console`,
      },
    });
    setLoading(false);
    if (authError) { setError(authError.message); return; }
    setSent(true);
  };

  return (
    <div style={{
      minHeight: "100dvh", background: "#0a0a0f",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
      padding: "24px",
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>

        {/* Logo / wordmark */}
        <div style={{ marginBottom: 48 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            padding: "8px 14px",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 8,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: 2,
              background: "#ff5b3d",
              boxShadow: "0 0 8px #ff5b3d",
            }} />
            <span style={{
              fontSize: 11, fontWeight: 800, letterSpacing: ".2em",
              textTransform: "uppercase", color: "rgba(255,255,255,0.5)",
            }}>CONFETTI · ADMIN</span>
          </div>
        </div>

        {/* Heading */}
        <h1 style={{
          margin: "0 0 6px",
          fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em",
          color: "#ffffff",
          fontFamily: "'Inter', system-ui, sans-serif",
        }}>Admin access</h1>
        <p style={{
          margin: "0 0 32px",
          fontSize: 13, color: "rgba(255,255,255,0.4)",
          fontFamily: "'Inter', system-ui, sans-serif",
          lineHeight: 1.5,
        }}>
          {sent
            ? "Check your email for the login link."
            : "Restricted to authorised accounts only."}
        </p>

        {/* Error */}
        {error && (
          <div style={{
            padding: "10px 14px", marginBottom: 16, borderRadius: 8,
            background: "rgba(255,91,61,0.1)", border: "1px solid rgba(255,91,61,0.4)",
            fontSize: 12, color: "#ff8a75",
            fontFamily: "'Inter', system-ui, sans-serif",
          }}>{error}</div>
        )}

        {!sent ? (
          <>
            {/* Email field */}
            <div style={{ marginBottom: 12 }}>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: ".16em",
                textTransform: "uppercase", color: "rgba(255,255,255,0.35)",
                marginBottom: 8,
              }}>email address</div>
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "12px 14px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 10,
              }}>
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>✉</span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="admin@confetti.app"
                  type="email"
                  autoComplete="email"
                  style={{
                    appearance: "none", border: "none", outline: "none",
                    background: "transparent", flex: 1,
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontSize: 14, fontWeight: 500, color: "#ffffff",
                  }}
                />
              </div>
            </div>

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={loading || !email.trim()}
              style={{
                appearance: "none", cursor: loading ? "not-allowed" : "pointer",
                width: "100%", padding: "13px",
                background: loading || !email.trim() ? "rgba(255,255,255,0.06)" : "#ff5b3d",
                border: "none", borderRadius: 10,
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: 14, fontWeight: 700,
                color: loading || !email.trim() ? "rgba(255,255,255,0.3)" : "#ffffff",
                letterSpacing: "0.01em",
                transition: "background .15s, color .15s",
              }}
            >
              {loading ? "sending..." : "send access link"}
            </button>
          </>
        ) : (
          /* Sent state */
          <div style={{
            padding: "20px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
          }}>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: ".16em",
              textTransform: "uppercase", color: "rgba(255,255,255,0.3)",
              marginBottom: 8,
            }}>LINK SENT</div>
            <div style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: 15, fontWeight: 600, color: "#ffffff",
              marginBottom: 16, lineHeight: 1.4,
            }}>
              We sent a link to<br />
              <span style={{ color: "#ff5b3d" }}>{email}</span>
            </div>
            <button onClick={() => { setSent(false); setEmail(""); setError(null); }} style={{
              appearance: "none", cursor: "pointer",
              padding: "9px 16px",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 8,
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)",
            }}>
              try different email
            </button>
          </div>
        )}

        {/* Back to app */}
        <div style={{ marginTop: 40, textAlign: "center" }}>
          <a href="/new/hub" style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 12, color: "rgba(255,255,255,0.2)",
            textDecoration: "none",
          }}>← back to app</a>
        </div>
      </div>
    </div>
  );
}
