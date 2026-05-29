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

  const [email, setEmail] = useState("tcrosslandjr1@gmail.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);

  // Lockout timer countdown
  useEffect(() => {
    if (!locked) return;
    const interval = setInterval(() => {
      setLockTimer((t) => {
        if (t <= 1) { setLocked(false); clearInterval(interval); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [locked]);

  // If already signed in as admin, go straight to console
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
  }, [navigate, redirect]);

  const handleSignIn = async () => {
    if (locked) return;
    if (!email.trim() || !password) { setError("Enter your email and password"); return; }

    setLoading(true);
    setError(null);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setLoading(false);
      const next = attempts + 1;
      setAttempts(next);
      if (next >= 5) {
        setLocked(true);
        setLockTimer(60);
        setError("Too many failed attempts. Locked for 60 seconds.");
      } else {
        setError(authError.message === "Invalid login credentials"
          ? `Incorrect email or password. (${5 - next} attempts remaining)`
          : authError.message);
      }
      return;
    }

    // Verify admin role
    if (data.session) {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        await supabase.auth.signOut();
        setLoading(false);
        setError("This account does not have admin access.");
        setPassword("");
        return;
      }
    }

    setLoading(false);
    navigate({ to: redirect ?? "/admin/console" });
  };

  return (
    <div style={{
      minHeight: "100dvh", background: "#0a0a0f",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
      padding: "24px",
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>

        {/* Logo */}
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
        }}>Restricted to authorised accounts only.</p>

        {/* Error */}
        {error && (
          <div style={{
            padding: "10px 14px", marginBottom: 16, borderRadius: 8,
            background: "rgba(255,91,61,0.1)", border: "1px solid rgba(255,91,61,0.4)",
            fontSize: 12, color: "#ff8a75",
            fontFamily: "'Inter', system-ui, sans-serif",
          }}>{error}</div>
        )}

        {/* Lockout screen */}
        {locked ? (
          <div style={{
            padding: 20, borderRadius: 12, textAlign: "center",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,91,61,0.3)",
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
            <div style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: 14, fontWeight: 600, color: "#ffffff", marginBottom: 6,
            }}>Access locked</div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 28, fontWeight: 800, color: "#ff5b3d",
            }}>{lockTimer}s</div>
            <div style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 6,
            }}>Too many failed attempts</div>
          </div>
        ) : (
          <>
            {/* Email */}
            <div style={{ marginBottom: 12 }}>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: ".16em",
                textTransform: "uppercase", color: "rgba(255,255,255,0.35)",
                marginBottom: 8,
              }}>email</div>
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

            {/* Password */}
            <div style={{ marginBottom: 20 }}>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: ".16em",
                textTransform: "uppercase", color: "rgba(255,255,255,0.35)",
                marginBottom: 8,
              }}>password</div>
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "12px 14px",
                background: "rgba(255,255,255,0.05)",
                border: `1px solid ${password ? "rgba(255,91,61,0.4)" : "rgba(255,255,255,0.12)"}`,
                borderRadius: 10,
                transition: "border-color .15s",
              }}>
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>🔑</span>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                  placeholder="••••••••••••"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  style={{
                    appearance: "none", border: "none", outline: "none",
                    background: "transparent", flex: 1,
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontSize: 14, fontWeight: 500, color: "#ffffff",
                  }}
                />
                <button
                  onClick={() => setShowPassword((s) => !s)}
                  style={{
                    appearance: "none", border: "none", background: "transparent",
                    cursor: "pointer", color: "rgba(255,255,255,0.3)",
                    fontSize: 12, fontWeight: 700, padding: 0,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >{showPassword ? "HIDE" : "SHOW"}</button>
              </div>
            </div>

            {/* Sign in button */}
            <button
              onClick={handleSignIn}
              disabled={loading || !password}
              style={{
                appearance: "none",
                cursor: loading || !password ? "not-allowed" : "pointer",
                width: "100%", padding: "13px",
                background: loading || !password ? "rgba(255,255,255,0.06)" : "#ff5b3d",
                border: "none", borderRadius: 10,
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: 14, fontWeight: 700,
                color: loading || !password ? "rgba(255,255,255,0.3)" : "#ffffff",
                transition: "background .15s, color .15s",
              }}
            >
              {loading ? "verifying..." : "sign in to admin"}
            </button>

            {/* Attempt dots */}
            {attempts > 0 && (
              <div style={{
                display: "flex", justifyContent: "center", gap: 6, marginTop: 16,
              }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: i < attempts ? "#ff5b3d" : "rgba(255,255,255,0.1)",
                    transition: "background .2s",
                  }} />
                ))}
              </div>
            )}
          </>
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
