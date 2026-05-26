import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, type ReactNode } from "react";
import {
  BrandMark, ChunkyButton, DotsBg, FloatingTickets, Frame, Icons, Stamp, TOKENS,
} from "@/components/new-confetti/shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/new/signin")({
  component: SignInPage,
});

type OAuthProvider = "apple" | "google" | "spotify";

function SignInPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Listen for auth state changes — redirect on sign-in
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" && session) {
          navigate({ to: "/new/hub" });
        }
      }
    );
    // Check if already signed in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate({ to: "/new/hub" });
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleMagicLink = async () => {
    if (!email.trim()) { setError("Enter your email"); return; }
    setLoading(true);
    setError(null);
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/new/hub` },
    });
    setLoading(false);
    if (authError) { setError(authError.message); return; }
    setSent(true);
  };

  const handleOAuth = async (provider: OAuthProvider) => {
    setError(null);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/new/hub` },
    });
    if (authError) setError(authError.message);
  };

  const onSignUp = () => navigate({ to: "/new/signup" });

  return (
    <Frame>
      <div style={{
        position: "relative", height: "100%",
        background: TOKENS.bg,
        display: "flex", flexDirection: "column",
        padding: "70px 28px 36px", overflow: "hidden",
      }}>
        <DotsBg opacity={0.06} />
        <FloatingTickets density={4} />

        <div style={{ position: "relative", zIndex: 2 }}><BrandMark size={20} spin /></div>

        <div style={{
          position: "relative", zIndex: 2, flex: 1,
          display: "flex", flexDirection: "column",
          justifyContent: "center", gap: 18,
        }}>
          <Stamp color={TOKENS.accent2} rotate={-3} style={{ alignSelf: "flex-start" }}>welcome back</Stamp>
          <h1 style={{
            fontFamily: TOKENS.display, fontWeight: 900,
            fontSize: 44, lineHeight: 0.95, letterSpacing: "-0.04em",
            color: TOKENS.ink, margin: 0,
          }}>Pick up<br/>where you left.</h1>

          {error && (
            <div style={{
              padding: "10px 14px", borderRadius: 10,
              background: "#fee2e2", border: "2px solid #ef4444",
              fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 600, color: "#991b1b",
            }}>{error}</div>
          )}

          {!sent ? (
            <>
              <div>
                <div style={{
                  fontFamily: TOKENS.mono, fontSize: 11, fontWeight: 800,
                  letterSpacing: ".14em", opacity: 0.55, textTransform: "uppercase",
                  marginBottom: 8,
                }}>email · we'll send a magic link</div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "14px 16px",
                  border: `2.5px solid ${TOKENS.ink}`, borderRadius: 14,
                  background: TOKENS.paper,
                  boxShadow: `4px 4px 0 ${TOKENS.ink}`,
                }}>
                  <span style={{ color: TOKENS.accent1 }}>✉</span>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleMagicLink()}
                    placeholder="you@email.com"
                    type="email"
                    autoComplete="email"
                    style={{
                      appearance: "none", border: "none", outline: "none",
                      background: "transparent", flex: 1,
                      fontFamily: TOKENS.ui, fontSize: 16, fontWeight: 700, color: TOKENS.ink,
                    }}
                  />
                </div>
              </div>
              <ChunkyButton variant="accent" onClick={handleMagicLink} icon={Icons.arrow} disabled={loading}>
                {loading ? "sending..." : "send magic link"}
              </ChunkyButton>

              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 700,
                opacity: 0.5, letterSpacing: ".12em", margin: "4px 0",
              }}>
                <div style={{ flex: 1, height: 2, background: TOKENS.ink, opacity: 0.15 }} />
                OR ONE-TAP
                <div style={{ flex: 1, height: 2, background: TOKENS.ink, opacity: 0.15 }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <SSOTile label="Apple" glyph="" bg={TOKENS.ink} fg={TOKENS.paper} onClick={() => handleOAuth("apple")} />
                <SSOTile label="Google" glyph="G" bg={TOKENS.paper} fg={TOKENS.ink} onClick={() => handleOAuth("google")} />
                <SSOTile label="TikTok" glyph="♪" bg={TOKENS.ink} fg={TOKENS.paper} onClick={() => {}} />
                <SSOTile label="Instagram" glyph="◍" bg={TOKENS.accent3} fg={TOKENS.paper} onClick={() => {}} />
                <SSOTile label="X" glyph="✕" bg={TOKENS.ink} fg={TOKENS.paper} onClick={() => {}} />
                <SSOTile label="Spotify" glyph="♫" bg="#1DB954" fg={TOKENS.ink} onClick={() => handleOAuth("spotify")} />
              </div>
              <button style={{
                appearance: "none", cursor: "pointer", width: "100%",
                padding: "12px 14px",
                border: `2px dashed ${TOKENS.ink}`, borderRadius: 12,
                background: "transparent",
                fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 800,
                color: TOKENS.ink, marginTop: 8,
              }}>📱 continue with phone</button>
            </>
          ) : (
            <div style={{
              padding: 20,
              border: `3px solid ${TOKENS.ink}`, borderRadius: 18,
              background: TOKENS.accent2,
              boxShadow: `5px 5px 0 ${TOKENS.ink}`,
            }}>
              <div style={{
                fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800,
                letterSpacing: ".14em", textTransform: "uppercase", opacity: 0.7,
              }}>CHECK YOUR INBOX</div>
              <div style={{
                fontFamily: TOKENS.display, fontWeight: 900, fontSize: 22,
                letterSpacing: "-0.025em", marginTop: 6, lineHeight: 1.1,
              }}>We sent a link to<br/>{email}.</div>
              <button onClick={() => { setSent(false); setEmail(""); }} style={{
                appearance: "none", cursor: "pointer",
                marginTop: 14, padding: "10px 16px",
                border: `2.5px solid ${TOKENS.ink}`, borderRadius: 999,
                background: TOKENS.ink, color: TOKENS.paper,
                fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 800,
              }}>try different email →</button>
            </div>
          )}
        </div>

        <div style={{
          position: "relative", zIndex: 2,
          textAlign: "center",
          fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 600,
          color: TOKENS.ink, opacity: 0.7,
        }}>
          new here?{" "}
          <button onClick={onSignUp} style={{
            appearance: "none", cursor: "pointer", background: "transparent",
            border: "none", padding: 0, fontFamily: "inherit", fontSize: "inherit",
            fontWeight: 900, color: TOKENS.accent1,
            textDecoration: "underline", textUnderlineOffset: 3,
          }}>print your first night →</button>
        </div>
      </div>
    </Frame>
  );
}

function SSOTile({ label, glyph, bg, fg, onClick }: { label: string; glyph: ReactNode; bg: string; fg: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{
      appearance: "none", cursor: "pointer",
      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
      padding: "12px 10px",
      border: `2.5px solid ${TOKENS.ink}`, borderRadius: 12,
      background: bg, color: fg,
      fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 900,
      boxShadow: `3px 3px 0 ${TOKENS.ink}`,
    }}>
      <span style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 18, height: 18,
        fontFamily: TOKENS.display, fontWeight: 900, fontSize: 14,
      }}>{glyph}</span>
      {label}
    </button>
  );
}
