import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  BrandMark, ChunkyButton, Frame, Icons, Stamp, TOKENS,
} from "@/components/new-confetti/shell";

// Slim port — design/new-confetti/project/auth-flow.jsx (TwoFactorScreen, line 488)
export const Route = createFileRoute("/new/2fa")({
  component: TwoFactorPage,
});

const METHODS = [
  { id: "app",   ico: "🛡️", label: "authenticator app", sub: "google · 1password · authy", rec: true },
  { id: "sms",   ico: "📱", label: "text message",      sub: "we'll text a code", rec: false },
  { id: "email", ico: "📬", label: "email",              sub: "code in your inbox",  rec: false },
];

function TwoFactorPage() {
  const navigate = useNavigate();
  const [active, setActive] = useState("app");

  return (
    <Frame>
      <div style={{
        position: "relative", height: "100%", background: TOKENS.bg,
        display: "flex", flexDirection: "column",
        padding: "56px 20px 22px", overflow: "hidden",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 24,
        }}>
          <button onClick={() => navigate({ to: "/new/settings" })} style={backBtn()}>←</button>
          <BrandMark size={17} />
          <span style={{ width: 36 }} />
        </div>

        <Stamp color={TOKENS.accent3} rotate={-3} style={{ alignSelf: "flex-start" }}>2-step · keep it safe</Stamp>
        <h1 style={{
          fontFamily: TOKENS.display, fontWeight: 900,
          fontSize: 36, lineHeight: 0.92, letterSpacing: "-0.04em",
          margin: "10px 0 6px",
        }}>Lock it<br/>down.</h1>
        <p style={{
          fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 700, opacity: 0.6,
          margin: "0 0 18px",
        }}>Pick how we double-check it's really you.</p>

        <div style={{
          flex: 1, overflowY: "auto", scrollbarWidth: "none",
          marginRight: -20, paddingRight: 20,
        }}>
          {METHODS.map((m) => (
            <button key={m.id} onClick={() => setActive(m.id)} style={{
              appearance: "none", cursor: "pointer", textAlign: "left", width: "100%",
              display: "flex", alignItems: "center", gap: 12,
              padding: 14, marginBottom: 10,
              border: `2.5px solid ${TOKENS.ink}`, borderRadius: 16,
              background: active === m.id ? TOKENS.accent2 : TOKENS.paper,
              boxShadow: `4px 4px 0 ${TOKENS.ink}`,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: TOKENS.bg, border: `2.5px solid ${TOKENS.ink}`,
                display: "grid", placeItems: "center", fontSize: 22, flexShrink: 0,
              }}>{m.ico}</div>
              <div style={{ flex: 1 }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  fontFamily: TOKENS.display, fontWeight: 900, fontSize: 14,
                  letterSpacing: "-0.01em",
                }}>
                  {m.label}
                  {m.rec && (
                    <span style={{
                      padding: "1px 6px", borderRadius: 999,
                      background: TOKENS.accent1, color: TOKENS.paper,
                      fontFamily: TOKENS.mono, fontSize: 8, fontWeight: 800,
                      letterSpacing: ".1em", border: `1.5px solid ${TOKENS.ink}`,
                    }}>BEST</span>
                  )}
                </div>
                <div style={{
                  fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 700,
                  opacity: 0.6, marginTop: 2, letterSpacing: ".06em",
                }}>{m.sub}</div>
              </div>
              <span style={{
                width: 20, height: 20, borderRadius: 999,
                border: `2.5px solid ${TOKENS.ink}`,
                background: active === m.id ? TOKENS.ink : "transparent",
                flexShrink: 0,
              }} />
            </button>
          ))}
        </div>

        <ChunkyButton variant="accent" onClick={() => navigate({ to: "/new/settings" })}
          icon={Icons.check}>turn on 2-step</ChunkyButton>
      </div>
    </Frame>
  );
}

function backBtn(): React.CSSProperties {
  return {
    appearance: "none", cursor: "pointer",
    width: 36, height: 36, borderRadius: 999,
    border: `2.5px solid ${TOKENS.ink}`, background: TOKENS.paper,
    fontSize: 14, fontWeight: 900, boxShadow: `3px 3px 0 ${TOKENS.ink}`,
  };
}
