import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  BrandMark,
  ChunkyButton,
  Frame,
  Icons,
  Stamp,
  TOKENS,
} from "@/components/new-confetti/shell";
import { supabase } from "@/integrations/supabase/client";

// Slim port — design/new-confetti/project/auth-flow.jsx (ForgotPwScreen, line 424)
export const Route = createFileRoute("/new/forgot-pw")({
  component: ForgotPwPage,
});

function ForgotPwPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) {
      setError("Enter your email first.");
      return;
    }
    setLoading(true);
    setError(null);
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/new/hub`,
    });
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    setSent(true);
  };

  return (
    <Frame>
      <div
        style={{
          position: "relative",
          height: "100%",
          background: TOKENS.bg,
          display: "flex",
          flexDirection: "column",
          padding: "56px 20px 22px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <button onClick={() => navigate({ to: "/new/signin" })} style={backBtn()}>
            ←
          </button>
          <BrandMark size={17} />
          <span style={{ width: 36 }} />
        </div>

        {sent ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                padding: 20,
                border: `3px solid ${TOKENS.ink}`,
                borderRadius: 18,
                background: TOKENS.accent2,
                boxShadow: `5px 5px 0 ${TOKENS.ink}`,
              }}
            >
              <div
                style={{
                  fontFamily: TOKENS.mono,
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: ".14em",
                  color: TOKENS.inkHint,
                }}
              >
                CHECK YOUR INBOX
              </div>
              <div
                style={{
                  fontFamily: TOKENS.display,
                  fontWeight: 900,
                  fontSize: 22,
                  letterSpacing: "-0.025em",
                  marginTop: 6,
                  lineHeight: 1.1,
                }}
              >
                Reset link sent to
                <br />
                {email}.
              </div>
              <button
                onClick={() => navigate({ to: "/new/signin" })}
                style={{
                  appearance: "none",
                  cursor: "pointer",
                  marginTop: 14,
                  padding: "10px 16px",
                  border: `2.5px solid ${TOKENS.ink}`,
                  borderRadius: 999,
                  background: TOKENS.ink,
                  color: TOKENS.paper,
                  fontFamily: TOKENS.ui,
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                ← back to sign in
              </button>
            </div>
          </div>
        ) : (
          <>
            <Stamp color={TOKENS.accent2} rotate={-3} style={{ alignSelf: "flex-start" }}>
              reset
            </Stamp>
            <h1
              style={{
                fontFamily: TOKENS.display,
                fontWeight: 900,
                fontSize: 38,
                lineHeight: 0.92,
                letterSpacing: "-0.04em",
                margin: "10px 0 6px",
              }}
            >
              Forgot it.
              <br />
              That's fine.
            </h1>
            <p
              style={{
                fontFamily: TOKENS.ui,
                fontSize: 13,
                fontWeight: 700,
                color: TOKENS.inkMuted,
                margin: "0 0 20px",
              }}
            >
              Drop your email — we send a reset link.
            </p>

            {error && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "#fee2e2",
                  border: "2px solid #ef4444",
                  fontFamily: TOKENS.ui,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#991b1b",
                  marginBottom: 10,
                }}
              >
                {error}
              </div>
            )}

            <div
              style={{
                fontFamily: TOKENS.mono,
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: ".14em",
                color: TOKENS.inkHint,
                marginBottom: 4,
                textTransform: "uppercase",
              }}
            >
              email
            </div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleReset()}
              placeholder="you@you.com"
              type="email"
              style={{
                width: "100%",
                padding: "14px 16px",
                boxSizing: "border-box",
                border: `2.5px solid ${TOKENS.ink}`,
                borderRadius: 12,
                background: TOKENS.paper,
                fontFamily: TOKENS.ui,
                fontSize: 15,
                fontWeight: 700,
                outline: "none",
              }}
            />

            <div style={{ flex: 1 }} />

            <div style={{ display: "flex", gap: 8 }}>
              <ChunkyButton variant="ghost" onClick={() => navigate({ to: "/new/signin" })}>
                back to sign in
              </ChunkyButton>
              <ChunkyButton
                variant="accent"
                onClick={handleReset}
                disabled={loading}
                icon={Icons.arrow}
              >
                {loading ? "sending..." : "send link"}
              </ChunkyButton>
            </div>
          </>
        )}
      </div>
    </Frame>
  );
}

function backBtn(): React.CSSProperties {
  return {
    appearance: "none",
    cursor: "pointer",
    width: 36,
    height: 36,
    borderRadius: 999,
    border: `2.5px solid ${TOKENS.ink}`,
    background: TOKENS.paper,
    fontSize: 14,
    fontWeight: 900,
    boxShadow: `3px 3px 0 ${TOKENS.ink}`,
  };
}
