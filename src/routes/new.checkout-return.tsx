import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BrandMark, ChunkyButton, DotsBg, Frame, Icons, Stamp, Ticket, TOKENS,
} from "@/components/new-confetti/shell";

// Slim port — design/new-confetti/project/more.jsx (CheckoutReturnScreen, line 330)
export const Route = createFileRoute("/new/checkout-return")({
  component: CheckoutReturnPage,
});

function CheckoutReturnPage() {
  const navigate = useNavigate();
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDone(true), 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <Frame>
      <div style={{
        position: "relative", height: "100%", background: TOKENS.bg,
        display: "flex", flexDirection: "column",
        padding: "56px 20px 22px", overflow: "hidden",
      }}>
        <DotsBg opacity={0.05} />

        <div style={{
          position: "relative", zIndex: 2,
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 24,
        }}>
          <BrandMark size={17} />
        </div>

        <div style={{
          position: "relative", zIndex: 2,
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "stretch", justifyContent: "center",
        }}>
          {!done ? (
            <>
              <div style={{ display: "grid", placeItems: "center", margin: "0 auto 24px" }}>
                <div style={{
                  width: 72, height: 72, borderRadius: 999,
                  border: `4px solid ${TOKENS.ink}`,
                  borderTopColor: "transparent",
                  animation: "cf-spin 1s linear infinite",
                }} />
              </div>
              <h1 style={{
                fontFamily: TOKENS.display, fontWeight: 900,
                fontSize: 32, lineHeight: 0.95, letterSpacing: "-0.04em",
                margin: 0, textAlign: "center",
              }}>Confirming<br/>your pass…</h1>
              <p style={{
                fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 700, opacity: 0.6,
                margin: "8px 0 0", textAlign: "center",
              }}>One sec — talking to the door.</p>
            </>
          ) : (
            <>
              <div style={{ alignSelf: "flex-start", marginBottom: 8 }}>
                <Stamp color={TOKENS.accent2} rotate={-3}>paid · confirmed</Stamp>
              </div>
              <h1 style={{
                fontFamily: TOKENS.display, fontWeight: 900,
                fontSize: 40, lineHeight: 0.92, letterSpacing: "-0.04em",
                margin: "0 0 14px",
              }}>You're<br/>locked in.</h1>

              <Ticket color={TOKENS.accent1} notch style={{ padding: 14 }}>
                <div style={{ color: TOKENS.paper }}>
                  <div style={{
                    fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800,
                    letterSpacing: ".14em", opacity: 0.85,
                  }}>RECEIPT · #CFT-4188</div>
                  <div style={{
                    fontFamily: TOKENS.display, fontWeight: 900, fontSize: 18,
                    letterSpacing: "-0.02em", marginTop: 6, lineHeight: 1.2,
                  }}>Disco Night · Brooklyn<br/>3 stops · $44 total</div>
                </div>
              </Ticket>

              <p style={{
                fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 700, opacity: 0.65,
                margin: "14px 0 0",
              }}>We saved your pass to Wallet. We'll ping you 1hr before stop one.</p>
            </>
          )}
        </div>

        <div style={{
          position: "relative", zIndex: 2,
          display: "flex", gap: 8,
        }}>
          <ChunkyButton variant="ghost" onClick={() => navigate({ to: "/new/trips" })}>view all passes</ChunkyButton>
          <ChunkyButton variant="accent" onClick={() => navigate({ to: "/new/pass" })}
            disabled={!done} icon={Icons.arrow}>
            see pass
          </ChunkyButton>
        </div>
      </div>
    </Frame>
  );
}
