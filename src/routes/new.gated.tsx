import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  BrandMark, ChunkyButton, Frame, Icons, Stamp, Ticket, TOKENS,
} from "@/components/new-confetti/shell";

// Slim port — design/new-confetti/project/gated.jsx (GatedOverlay, line 40 + MemberFeatureGrid, line 131)
export const Route = createFileRoute("/new/gated")({
  component: GatedPage,
});

const FEATURES = [
  { ico: "🌃", label: "unlimited prints",  sub: "every night, no caps" },
  { ico: "🎟️", label: "front of door",    sub: "skip the line at picks" },
  { ico: "💃", label: "crew sync",         sub: "live map + group plans" },
  { ico: "📸", label: "confetti cam",      sub: "premium share filter" },
  { ico: "🔥", label: "early drops",       sub: "thursday previews" },
  { ico: "💎", label: "concierge",         sub: "1:1 night help" },
];

function GatedPage() {
  const navigate = useNavigate();
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
          <button onClick={() => navigate({ to: "/new/hub" })} style={backBtn()}>←</button>
          <BrandMark size={17} />
          <span style={{ width: 36 }} />
        </div>

        <Stamp color={TOKENS.accent3} rotate={-3} style={{ alignSelf: "flex-start" }}>members only</Stamp>
        <h1 style={{
          fontFamily: TOKENS.display, fontWeight: 900,
          fontSize: 36, lineHeight: 0.92, letterSpacing: "-0.04em",
          margin: "10px 0 14px",
        }}>This is an<br/>All-Access pick.</h1>

        <div style={{
          flex: 1, overflowY: "auto", scrollbarWidth: "none",
          marginRight: -20, paddingRight: 20,
        }}>
          <Ticket color={TOKENS.accent1} notch style={{ padding: 14, marginBottom: 14 }}>
            <div style={{ color: TOKENS.paper }}>
              <div style={{
                fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800,
                letterSpacing: ".14em", opacity: 0.85,
              }}>WHAT YOU UNLOCK</div>
              <div style={{
                fontFamily: TOKENS.display, fontWeight: 900, fontSize: 20,
                letterSpacing: "-0.02em", marginTop: 6, lineHeight: 1.15,
              }}>Every night, every pass, every front-of-door perk.</div>
            </div>
          </Ticket>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {FEATURES.map((f) => (
              <div key={f.label} style={{
                padding: 12,
                border: `2.5px solid ${TOKENS.ink}`, borderRadius: 14,
                background: TOKENS.paper,
                boxShadow: `3px 3px 0 ${TOKENS.ink}`,
              }}>
                <div style={{ fontSize: 24 }}>{f.ico}</div>
                <div style={{
                  fontFamily: TOKENS.display, fontWeight: 900, fontSize: 13,
                  letterSpacing: "-0.01em", marginTop: 6,
                }}>{f.label}</div>
                <div style={{
                  fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 700,
                  opacity: 0.6, marginTop: 3, letterSpacing: ".06em",
                }}>{f.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <ChunkyButton variant="ghost" onClick={() => navigate({ to: "/new/hub" })}>maybe later</ChunkyButton>
          <ChunkyButton variant="accent" onClick={() => navigate({ to: "/new/all-access" })} icon={Icons.arrow}>
            get all-access
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
