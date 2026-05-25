import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  BrandMark, ChunkyButton, DotsBg, FloatingTickets, Frame, Icons, Stamp, TOKENS,
} from "@/components/new-confetti/shell";

// Ported from design/new-confetti/project/auth.jsx (SignInScreen, line 8)
export const Route = createFileRoute("/new/signin")({
  component: SignInPage,
});

function SignInPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("jess@brooklyn.com");
  const [sent, setSent] = useState(false);
  const onSignIn = () => navigate({ to: "/new/hub" });
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
                  <input value={email} onChange={(e) => setEmail(e.target.value)} style={{
                    appearance: "none", border: "none", outline: "none",
                    background: "transparent", flex: 1,
                    fontFamily: TOKENS.ui, fontSize: 16, fontWeight: 700, color: TOKENS.ink,
                  }} />
                </div>
              </div>
              <ChunkyButton variant="accent" onClick={() => setSent(true)} icon={Icons.arrow}>
                send magic link
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
                <SSOTile label="Apple" glyph="" bg={TOKENS.ink} fg={TOKENS.paper} />
                <SSOTile label="Google" glyph="G" bg={TOKENS.paper} fg={TOKENS.ink} />
                <SSOTile label="TikTok" glyph="♪" bg={TOKENS.ink} fg={TOKENS.paper} />
                <SSOTile label="Instagram" glyph="◍" bg={TOKENS.accent3} fg={TOKENS.paper} />
                <SSOTile label="X" glyph="✕" bg={TOKENS.ink} fg={TOKENS.paper} />
                <SSOTile label="Spotify" glyph="♫" bg="#1DB954" fg={TOKENS.ink} />
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
              <button onClick={onSignIn} style={{
                appearance: "none", cursor: "pointer",
                marginTop: 14, padding: "10px 16px",
                border: `2.5px solid ${TOKENS.ink}`, borderRadius: 999,
                background: TOKENS.ink, color: TOKENS.paper,
                fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 800,
              }}>simulate click →</button>
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

function SSOTile({ label, glyph, bg, fg }: { label: string; glyph: ReactNode; bg: string; fg: string }) {
  return (
    <button style={{
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
