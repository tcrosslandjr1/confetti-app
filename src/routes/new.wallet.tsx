import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  BrandMark, ChunkyButton, Frame, Icons, Stamp, Ticket, TOKENS,
} from "@/components/new-confetti/shell";
import { useNewAuth } from "@/hooks/useNewAuth";

export const Route = createFileRoute("/new/wallet")({
  component: WalletPage,
});

const HISTORY = [
  { what: "Pass redeemed · Lupa Notte", amt: "-120", c: TOKENS.accent1 },
  { what: "Stamp earned · pasta hunter", amt: "+50",  c: TOKENS.accent2 },
  { what: "Crew invite bonus · Maya",    amt: "+200", c: TOKENS.accent3 },
  { what: "Pass redeemed · Loft Disco",  amt: "-150", c: TOKENS.accent1 },
];

function WalletPage() {
  const { ready } = useNewAuth();
  const navigate = useNavigate();

  if (!ready) {
    return (
      <Frame>
        <div style={{
          height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
          background: TOKENS.bg, fontFamily: TOKENS.display, fontSize: 24, fontWeight: 900,
          color: TOKENS.inkMuted,
        }}>loading...</div>
      </Frame>
    );
  }

  return (
    <Frame>
      <div style={{
        position: "relative", height: "100%", background: TOKENS.bg,
        display: "flex", flexDirection: "column",
        padding: "56px 20px 22px", overflow: "hidden",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 14,
        }}>
          <button onClick={() => navigate({ to: "/new/profile" })} style={backBtn()}>←</button>
          <BrandMark size={17} />
          <span style={{ width: 36 }} />
        </div>

        <Stamp color={TOKENS.accent2} rotate={-3} style={{ alignSelf: "flex-start" }}>your wallet</Stamp>
        <h1 style={{
          fontFamily: TOKENS.display, fontWeight: 900,
          fontSize: 38, lineHeight: 0.92, letterSpacing: "-0.04em",
          margin: "10px 0 14px",
        }}>1,420<br/>confetti.</h1>

        {/* Big balance ticket */}
        <Ticket color={TOKENS.accent3} notch style={{ padding: 16 }}>
          <div style={{ color: TOKENS.paper }}>
            <div style={{
              fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800,
              letterSpacing: ".14em", opacity: 0.85,
            }}>NEXT REWARD</div>
            <div style={{
              fontFamily: TOKENS.display, fontWeight: 900, fontSize: 18,
              letterSpacing: "-0.02em", marginTop: 4, lineHeight: 1.2,
            }}>80 more confetti for a free dessert at Lupa Notte.</div>
            <div style={{
              height: 8, marginTop: 10, borderRadius: 999,
              background: "rgba(0,0,0,0.25)", overflow: "hidden",
              border: `1.5px solid ${TOKENS.ink}`,
            }}>
              <div style={{ width: "82%", height: "100%", background: TOKENS.accent2 }} />
            </div>
          </div>
        </Ticket>

        {/* History */}
        <div style={{
          fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800,
          letterSpacing: ".16em", opacity: 0.55, marginTop: 18, marginBottom: 8,
        }}>RECENT ACTIVITY</div>

        <div style={{
          flex: 1, overflowY: "auto", scrollbarWidth: "none",
          marginRight: -20, paddingRight: 20,
        }}>
          {HISTORY.map((h, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 12px", marginBottom: 6,
              border: `2px solid ${TOKENS.ink}`, borderRadius: 12,
              background: TOKENS.paper,
            }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 10, minWidth: 0,
              }}>
                <span style={{
                  width: 10, height: 10, borderRadius: 999, background: h.c,
                  border: `1.5px solid ${TOKENS.ink}`,
                }} />
                <span style={{
                  fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 700,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>{h.what}</span>
              </div>
              <span style={{
                fontFamily: TOKENS.mono, fontSize: 12, fontWeight: 900,
                color: h.amt.startsWith("+") ? "#0a7a3f" : TOKENS.ink,
              }}>{h.amt}</span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <ChunkyButton variant="ghost" onClick={() => navigate({ to: "/new/referral" })}>refer & earn</ChunkyButton>
          <ChunkyButton variant="accent" onClick={() => navigate({ to: "/new/all-access" })} icon={Icons.arrow}>
            upgrade
          </ChunkyButton>
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
