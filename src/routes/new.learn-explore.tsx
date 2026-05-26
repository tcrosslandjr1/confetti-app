import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  BrandMark, Chip, DotsBg, Frame, Stamp, Ticket, TOKENS,
} from "@/components/new-confetti/shell";

// Slim port — design/new-confetti/project/learn.jsx (LearnExploreScreen, line 160)
export const Route = createFileRoute("/new/learn-explore")({
  component: LearnExplorePage,
});

const FILTERS = ["all", "music", "food", "drink", "art", "history"];
const LIBS = [
  { name: "Disco 101",     n: "12 chapters", color: TOKENS.accent3 },
  { name: "NYC pizza map", n: "24 stops",    color: TOKENS.accent1 },
  { name: "Wine that's loud", n: "8 picks",  color: TOKENS.accent2 },
  { name: "Hidden bars",   n: "18 doors",    color: TOKENS.paper },
];

function LearnExplorePage() {
  const navigate = useNavigate();
  const [active, setActive] = useState<string>("all");

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

        <Stamp color={TOKENS.accent2} rotate={-3} style={{ alignSelf: "flex-start" }}>learn + explore</Stamp>
        <h1 style={{
          fontFamily: TOKENS.display, fontWeight: 900,
          fontSize: 38, lineHeight: 0.92, letterSpacing: "-0.04em",
          margin: "10px 0 12px", position: "relative", zIndex: 2,
        }}>Know the<br/>night.</h1>

        <div style={{
          position: "relative", zIndex: 2,
          display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none",
          marginRight: -20, paddingRight: 20, marginBottom: 14,
        }}>
          {FILTERS.map((f) => (
            <Chip key={f} dense selected={active === f} color={TOKENS.accent2}
              onClick={() => setActive(f)}>{f}</Chip>
          ))}
        </div>

        <div style={{
          position: "relative", zIndex: 2,
          flex: 1, overflowY: "auto", scrollbarWidth: "none",
          marginRight: -20, paddingRight: 20,
        }}>
          {LIBS.map((l, i) => (
            <button key={i} onClick={() => navigate({ to: "/new/explore" })} style={{
              appearance: "none", cursor: "pointer", textAlign: "left", width: "100%",
              padding: 0, border: "none", background: "transparent",
            }}>
              <Ticket color={l.color} notch style={{ padding: 14, marginBottom: 10 }}>
                <div style={{
                  fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800,
                  letterSpacing: ".14em", opacity: 0.7,
                }}>LIBRARY · {l.n.toUpperCase()}</div>
                <div style={{
                  fontFamily: TOKENS.display, fontWeight: 900, fontSize: 22,
                  letterSpacing: "-0.03em", marginTop: 4,
                }}>{l.name}</div>
                <div style={{
                  fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800,
                  letterSpacing: ".12em", marginTop: 8,
                }}>OPEN →</div>
              </Ticket>
            </button>
          ))}
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
