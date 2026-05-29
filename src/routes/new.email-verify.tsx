import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BrandMark, ChunkyButton, Frame, Icons, Stamp, Ticket, TOKENS,
} from "@/components/new-confetti/shell";
import { supabase } from "@/integrations/supabase/client";

// Slim port — design/new-confetti/project/auth-flow.jsx (EmailVerifyScreen, line 130)
export const Route = createFileRoute("/new/email-verify")({
  component: EmailVerifyPage,
});

function EmailVerifyPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    // Auto-redirect when magic link triggers SIGNED_IN
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) navigate({ to: "/new/hub" });
    });
    // Also check immediately in case already signed in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate({ to: "/new/hub" });
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleContinue = async () => {
    setChecking(true);
    setSessionError(null);
    const { data: { session } } = await supabase.auth.getSession();
    setChecking(false);
    if (session) {
      navigate({ to: "/new/hub" });
    } else {
      setSessionError("Link not detected yet — check your email and click the link first.");
    }
  };

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
          <button onClick={() => navigate({ to: "/new/signin" })} style={backBtn()}>←</button>
          <BrandMark size={17} />
          <span style={{ width: 36 }} />
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{
            width: 92, height: 92, borderRadius: 24,
            background: TOKENS.accent2, border: `3px solid ${TOKENS.ink}`,
            display: "grid", placeItems: "center", margin: "0 auto 18px",
            fontSize: 44, boxShadow: `6px 6px 0 ${TOKENS.ink}`,
          }}>📬</div>

          <div style={{ alignSelf: "center", marginBottom: 10 }}>
            <Stamp color={TOKENS.accent2} rotate={-2}>verify · email</Stamp>
          </div>

          <h1 style={{
            fontFamily: TOKENS.display, fontWeight: 900,
            fontSize: 36, lineHeight: 0.92, letterSpacing: "-0.04em",
            margin: "0 0 6px", textAlign: "center",
          }}>Check your<br/>inbox.</h1>
          <p style={{
            fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 700, color: TOKENS.inkMuted,
            margin: "0 0 18px", textAlign: "center",
          }}>We sent a magic link to your email. Click it to sign in.</p>

          <Ticket color={TOKENS.paper} notch={false} style={{ padding: 12 }}>
            <div style={{
              fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800,
              letterSpacing: ".14em", color: TOKENS.inkHint,
            }}>NOT IN INBOX?</div>
            <div style={{
              fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 700, marginTop: 4,
            }}>Check spam, then tap resend.</div>
          </Ticket>
        </div>

        {sessionError && (
          <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: "#fee2e2", border: "2px solid #ef4444", fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 600, color: "#991b1b" }}>
            {sessionError}
          </div>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: sessionError ? 8 : 0 }}>
          <ChunkyButton variant="ghost" onClick={() => navigate({ to: "/new/email-verify" })}>resend</ChunkyButton>
          <ChunkyButton variant="accent" onClick={handleContinue} disabled={checking}
            icon={Icons.arrow}>{checking ? "checking..." : "i clicked it"}</ChunkyButton>
        </div>
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
