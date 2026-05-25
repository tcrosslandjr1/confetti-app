import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { BrandMark, Chip, DotsBg, Frame, TOKENS } from "@/components/new-confetti/shell";

// Slim port — design/new-confetti/project/discover.jsx (ExploreScreen, line 90)
export const Route = createFileRoute("/new/explore")({
  component: ExplorePage,
});

const VENUES = [
  { name: "Lupa Notte",   tag: "italian · wine",    n: "88 N 6th",      heat: TOKENS.accent1 },
  { name: "Daughter",     tag: "coffee · small",    n: "112 N 6th",     heat: TOKENS.accent2 },
  { name: "Skinny Dennis", tag: "honky tonk",       n: "152 Metro",     heat: TOKENS.accent3 },
  { name: "Misi",         tag: "pasta hall",        n: "329 Kent",      heat: TOKENS.accent2 },
  { name: "Union Pool",   tag: "patio + tacos",     n: "484 Union",     heat: TOKENS.accent1 },
  { name: "Joe's Tavern", tag: "cocktails · jazz",  n: "22 Berry",      heat: TOKENS.accent3 },
];

const FILTERS = ["near me", "open now", "walkable", "$", "$$", "rooftop", "cocktails", "weird"];

function ExplorePage() {
  const navigate = useNavigate();
  const [active, setActive] = useState<string[]>(["near me"]);
  const toggle = (f: string) =>
    setActive((a) => a.includes(f) ? a.filter((x) => x !== f) : [...a, f]);

  return (
    <Frame>
      <div style={{
        position: "relative", height: "100%", background: TOKENS.bg,
        display: "flex", flexDirection: "column",
        padding: "56px 20px 20px", overflow: "hidden",
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

        <div style={{ position: "relative", zIndex: 2 }}>
          <h2 style={{
            fontFamily: TOKENS.display, fontWeight: 900,
            fontSize: 32, lineHeight: 0.95, letterSpacing: "-0.04em",
            margin: "0 0 4px",
          }}>Brooklyn,<br/>tonight.</h2>
          <p style={{
            fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 700, opacity: 0.55,
            margin: "0 0 12px",
          }}>42 spots live · 12 popping right now</p>
        </div>

        {/* Filter chips */}
        <div style={{
          position: "relative", zIndex: 2,
          display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none",
          marginRight: -20, paddingRight: 20, marginBottom: 14,
        }}>
          {FILTERS.map((f) => (
            <Chip key={f} dense selected={active.includes(f)} color={TOKENS.accent2}
              onClick={() => toggle(f)}>{f}</Chip>
          ))}
        </div>

        {/* Venue grid */}
        <div style={{
          position: "relative", zIndex: 2,
          flex: 1, overflowY: "auto", scrollbarWidth: "none",
          marginRight: -20, paddingRight: 20,
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {VENUES.map((v) => (
              <button key={v.name} onClick={() => navigate({ to: "/new/venue" })} style={{
                appearance: "none", cursor: "pointer", textAlign: "left",
                padding: 0,
                border: `2.5px solid ${TOKENS.ink}`, borderRadius: 14,
                background: TOKENS.paper,
                boxShadow: `4px 4px 0 ${TOKENS.ink}`,
                overflow: "hidden",
              }}>
                <div style={{
                  height: 90, background: v.heat,
                  borderBottom: `2.5px solid ${TOKENS.ink}`,
                  display: "grid", placeItems: "center",
                  fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800,
                  letterSpacing: ".14em", opacity: 0.6, color: TOKENS.ink,
                }}>VENUE</div>
                <div style={{ padding: "10px 12px" }}>
                  <div style={{
                    fontFamily: TOKENS.display, fontWeight: 900, fontSize: 15,
                    letterSpacing: "-0.02em", lineHeight: 1.05,
                  }}>{v.name}</div>
                  <div style={{
                    fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 700,
                    opacity: 0.6, marginTop: 4, letterSpacing: ".06em",
                  }}>{v.tag}</div>
                  <div style={{
                    fontFamily: TOKENS.mono, fontSize: 8, fontWeight: 700,
                    opacity: 0.45, marginTop: 2, letterSpacing: ".06em",
                  }}>📍 {v.n}</div>
                </div>
              </button>
            ))}
          </div>
          <div style={{ height: 12 }} />
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
