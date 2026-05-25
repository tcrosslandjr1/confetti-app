import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  BrandMark, ChunkyButton, Frame, Icons, Stamp, Ticket, TOKENS,
} from "@/components/new-confetti/shell";

// Slim port — design/new-confetti/project/more.jsx (InfluencerScreen, line 1229)
export const Route = createFileRoute("/new/influencer")({
  component: InfluencerPage,
});

const PERKS = [
  { ico: "💸", h: "20% per signup", b: "lifetime revenue share" },
  { ico: "🎟️", h: "free passes",   b: "for testing + posting" },
  { ico: "📸", h: "your own filter", b: "custom confetti cam preset" },
  { ico: "🏆", h: "leaderboard $$$", b: "monthly bonus pool" },
];

function InfluencerPage() {
  const navigate = useNavigate();
  const [handle, setHandle] = useState("");

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

        <Stamp color={TOKENS.accent3} rotate={-3} style={{ alignSelf: "flex-start" }}>creator program</Stamp>
        <h1 style={{
          fontFamily: TOKENS.display, fontWeight: 900,
          fontSize: 38, lineHeight: 0.92, letterSpacing: "-0.04em",
          margin: "10px 0 14px",
        }}>Got a<br/>following?</h1>

        <div style={{
          flex: 1, overflowY: "auto", scrollbarWidth: "none",
          marginRight: -20, paddingRight: 20,
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
            {PERKS.map((p) => (
              <div key={p.h} style={{
                padding: 12,
                border: `2.5px solid ${TOKENS.ink}`, borderRadius: 14,
                background: TOKENS.paper,
                boxShadow: `3px 3px 0 ${TOKENS.ink}`,
              }}>
                <div style={{ fontSize: 22 }}>{p.ico}</div>
                <div style={{
                  fontFamily: TOKENS.display, fontWeight: 900, fontSize: 13,
                  letterSpacing: "-0.01em", marginTop: 6,
                }}>{p.h}</div>
                <div style={{
                  fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 700,
                  opacity: 0.6, marginTop: 3, letterSpacing: ".06em",
                }}>{p.b}</div>
              </div>
            ))}
          </div>

          <Ticket color={TOKENS.accent2} notch={false} style={{ padding: 14, marginBottom: 14 }}>
            <div style={{
              fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800,
              letterSpacing: ".14em", opacity: 0.7,
            }}>WHO WE WORK WITH</div>
            <div style={{
              fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 700, marginTop: 6, lineHeight: 1.4,
            }}>Nightlife · food · music · travel creators with 5K+ on any platform. We're picky — we like real personality.</div>
          </Ticket>

          <div style={{
            fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800,
            letterSpacing: ".14em", opacity: 0.55, marginBottom: 4,
            textTransform: "uppercase",
          }}>your main handle</div>
          <input value={handle} onChange={(e) => setHandle(e.target.value)}
            placeholder="@yourhandle"
            style={{
              width: "100%", padding: "14px 16px", boxSizing: "border-box",
              border: `2.5px solid ${TOKENS.ink}`, borderRadius: 12,
              background: TOKENS.paper,
              fontFamily: TOKENS.ui, fontSize: 15, fontWeight: 700,
              outline: "none",
            }} />
        </div>

        <div style={{ marginTop: 12 }}>
          <ChunkyButton variant="accent" onClick={() => navigate({ to: "/new/hub" })}
            icon={Icons.arrow}>apply</ChunkyButton>
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
