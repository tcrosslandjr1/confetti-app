import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  BrandMark, ChunkyButton, DotsBg, Frame, Icons, Stamp, Ticket, TOKENS,
} from "@/components/new-confetti/shell";

// Slim port — design/new-confetti/project/signals.jsx (WhatsHotScreen, line 73)
export const Route = createFileRoute("/new/whats-hot")({
  component: WhatsHotPage,
});

const HOT = [
  {
    name: "Loft Disco",
    why: "+220% saves this week",
    sub: "honey dijon residency announced",
    badge: "SPIKING",
    color: TOKENS.accent1,
  },
  {
    name: "Misi",
    why: "1-hour wait → walk-in",
    sub: "tuesday is the new friday",
    badge: "EASY ENTRY",
    color: TOKENS.accent2,
  },
  {
    name: "Skinny Dennis",
    why: "$3 frozen margs (today only)",
    sub: "country night · 9 PM",
    badge: "DEAL",
    color: TOKENS.accent3,
  },
  {
    name: "Cafe Mogador",
    why: "new chef · revamped menu",
    sub: "moroccan brunch destination",
    badge: "FRESH",
    color: TOKENS.paper,
  },
];

function WhatsHotPage() {
  const navigate = useNavigate();
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
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 14,
        }}>
          <button onClick={() => navigate({ to: "/new/hub" })} style={backBtn()}>←</button>
          <BrandMark size={17} />
          <span style={{ width: 36 }} />
        </div>

        <Stamp color={TOKENS.accent1} rotate={-3} style={{ alignSelf: "flex-start" }}>signals · live</Stamp>
        <h1 style={{
          fontFamily: TOKENS.display, fontWeight: 900,
          fontSize: 38, lineHeight: 0.92, letterSpacing: "-0.04em",
          margin: "10px 0 14px", position: "relative", zIndex: 2,
        }}>What's<br/>hot tonight.</h1>

        <div style={{
          position: "relative", zIndex: 2,
          flex: 1, overflowY: "auto", scrollbarWidth: "none",
          marginRight: -20, paddingRight: 20,
        }}>
          {HOT.map((h, i) => (
            <Ticket key={i} color={TOKENS.paper} notch style={{ padding: 14, marginBottom: 10 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 8, marginBottom: 6,
              }}>
                <span style={{
                  padding: "3px 10px", borderRadius: 999,
                  background: h.color, border: `2px solid ${TOKENS.ink}`,
                  fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800,
                  letterSpacing: ".14em",
                  color: h.color === TOKENS.paper ? TOKENS.ink : TOKENS.paper,
                }}>{h.badge}</span>
                <span style={{
                  width: 6, height: 6, borderRadius: 999, background: TOKENS.accent1,
                  animation: "cf-pulse 1.2s infinite",
                }} />
              </div>
              <div style={{
                fontFamily: TOKENS.display, fontWeight: 900, fontSize: 19,
                letterSpacing: "-0.02em",
              }}>{h.name}</div>
              <div style={{
                fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 800, marginTop: 2,
              }}>{h.why}</div>
              <div style={{
                fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 700,
                opacity: 0.6, marginTop: 4, letterSpacing: ".06em",
              }}>{h.sub}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                <button onClick={() => navigate({ to: "/new/venue" })} style={{
                  appearance: "none", cursor: "pointer",
                  padding: "5px 12px", borderRadius: 999,
                  border: `2px solid ${TOKENS.ink}`, background: TOKENS.bg,
                  fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800,
                  letterSpacing: ".1em",
                }}>SEE</button>
                <button onClick={() => navigate({ to: "/new/plan" })} style={{
                  appearance: "none", cursor: "pointer",
                  padding: "5px 12px", borderRadius: 999,
                  border: `2px solid ${TOKENS.ink}`, background: TOKENS.accent2,
                  fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800,
                  letterSpacing: ".1em",
                }}>ADD TO PLAN</button>
              </div>
            </Ticket>
          ))}
        </div>

        <div style={{ marginTop: 12, position: "relative", zIndex: 2 }}>
          <ChunkyButton variant="accent" onClick={() => navigate({ to: "/new/plan" })}
            icon={Icons.arrow}>plan tonight from these</ChunkyButton>
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
