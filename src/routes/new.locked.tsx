import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  BackButton, BrandMark, ChunkyButton, Frame, Stamp, Ticket, TOKENS,
} from "@/components/new-confetti/shell";

// Slim port — design/new-confetti/project/auth-flow.jsx (AccountLockedScreen, line 617)
export const Route = createFileRoute("/new/locked")({
  component: LockedPage,
});

function LockedPage() {
  const navigate = useNavigate();
  return (
    <Frame>
      <div style={{
        position: "relative", height: "100%", background: TOKENS.bg,
        display: "flex", flexDirection: "column",
        padding: "56px 20px 22px", overflow: "hidden",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24,
        }}>
          <BackButton onClick={() => navigate({ to: "/new/signin" })} />
          <BrandMark size={17} />
          <span style={{ width: 36 }} />
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{
            width: 92, height: 92, borderRadius: 24,
            background: TOKENS.accent1, border: `3px solid ${TOKENS.ink}`,
            display: "grid", placeItems: "center", margin: "0 auto 20px",
            fontSize: 44, boxShadow: `6px 6px 0 ${TOKENS.ink}`,
          }}>🔒</div>

          <div style={{ alignSelf: "center", marginBottom: 10 }}>
            <Stamp color={TOKENS.accent1} rotate={-2}>account locked</Stamp>
          </div>

          <h1 style={{
            fontFamily: TOKENS.display, fontWeight: 900,
            fontSize: 36, lineHeight: 0.92, letterSpacing: "-0.04em",
            margin: 0, textAlign: "center",
          }}>Hold up.<br/>Too many tries.</h1>

          <p style={{
            fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 700, opacity: 0.65,
            margin: "12px auto 16px", textAlign: "center", maxWidth: 280,
          }}>We paused sign-ins to keep your account safe. Recover or reach out — we're fast.</p>

          <Ticket color={TOKENS.paper} notch={false} style={{ padding: 12 }}>
            <div style={{
              fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800,
              letterSpacing: ".14em", opacity: 0.6,
            }}>WHAT THIS MEANS</div>
            <div style={{
              fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 700, marginTop: 4,
            }}>Try again in 15 mins, or reset via email link.</div>
          </Ticket>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <ChunkyButton variant="ghost" onClick={() => navigate({ to: "/new/signin" })}>contact</ChunkyButton>
          <ChunkyButton variant="accent" onClick={() => navigate({ to: "/new/signin" })}>
            recover
          </ChunkyButton>
        </div>
      </div>
    </Frame>
  );
}
