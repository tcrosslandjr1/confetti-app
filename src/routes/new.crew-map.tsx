import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BrandMark, TOKENS } from "@/components/new-confetti/shell";

// Slim port — design/new-confetti/project/discover.jsx (CrewMapScreen, line 921)
export const Route = createFileRoute("/new/crew-map")({
  component: CrewMapPage,
});

const PINS = [
  { who: "Sara", at: "Lupa Notte",   x: "32%", y: "38%", color: TOKENS.accent1 },
  { who: "Mike", at: "Skinny Dennis", x: "70%", y: "55%", color: TOKENS.accent3 },
  { who: "Ren",  at: "Daughter",      x: "48%", y: "22%", color: TOKENS.accent2 },
  { who: "You",  at: "Lupa Notte",    x: "32%", y: "38%", color: TOKENS.ink },
];

function CrewMapPage() {
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: "100dvh", display: "grid", placeItems: "center",
      background: "#0a0a0a", padding: 24,
    }}>
      <div style={{
        position: "relative",
        width: "min(420px, 100%)",
        height: "min(874px, calc(100dvh - 48px))",
        overflow: "hidden",
        borderRadius: 28,
        background: TOKENS.ink,
        boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
        color: TOKENS.paper,
      }}>
        {/* Top bar */}
        <div style={{
          position: "absolute", top: 16, left: 16, right: 16, zIndex: 5,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <button onClick={() => navigate({ to: "/new/hub" })} style={{
            appearance: "none", cursor: "pointer",
            width: 36, height: 36, borderRadius: 999,
            border: `2px solid ${TOKENS.paper}`, background: "rgba(0,0,0,0.4)",
            color: TOKENS.paper, fontSize: 14, fontWeight: 900,
            backdropFilter: "blur(8px)",
          }}>←</button>
          <div style={{ color: TOKENS.paper }}><BrandMark size={17} /></div>
          <span style={{ width: 36 }} />
        </div>

        {/* Fake map */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px),
            radial-gradient(circle at 30% 40%, ${TOKENS.accent3}33, transparent 50%),
            radial-gradient(circle at 70% 60%, ${TOKENS.accent1}22, transparent 50%)
          `,
          backgroundSize: "42px 42px, 42px 42px, 100% 100%, 100% 100%",
        }}>
          {/* River-ish curve */}
          <svg width="100%" height="100%" viewBox="0 0 420 874" style={{ position: "absolute", inset: 0 }}>
            <path d="M -20 350 Q 200 250 250 450 T 460 700" stroke={TOKENS.accent3} strokeWidth="40"
              fill="none" opacity="0.35" />
          </svg>

          {/* Pins */}
          {PINS.map((p) => (
            <div key={p.who} style={{
              position: "absolute", top: p.y, left: p.x,
              transform: "translate(-50%, -50%)",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 999,
                background: p.color, border: `2.5px solid ${TOKENS.paper}`,
                display: "grid", placeItems: "center",
                fontFamily: TOKENS.display, fontWeight: 900, fontSize: 14,
                color: TOKENS.ink,
                boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
              }}>{p.who[0]}</div>
              <div style={{
                padding: "3px 8px", borderRadius: 999,
                background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)",
                fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800,
                letterSpacing: ".1em", color: TOKENS.paper, whiteSpace: "nowrap",
              }}>{p.who}</div>
            </div>
          ))}
        </div>

        {/* Bottom sheet */}
        <div style={{
          position: "absolute", left: 16, right: 16, bottom: 24, zIndex: 4,
          padding: 14, borderRadius: 18,
          background: TOKENS.paper, color: TOKENS.ink,
          border: `2.5px solid ${TOKENS.ink}`,
          boxShadow: `4px 4px 0 ${TOKENS.ink}`,
        }}>
          <div style={{
            fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800,
            letterSpacing: ".14em", opacity: 0.6,
          }}>CREW LIVE · 3 IN MOTION</div>
          <div style={{
            fontFamily: TOKENS.display, fontWeight: 900, fontSize: 18,
            letterSpacing: "-0.02em", marginTop: 4,
          }}>Sara, Mike, Ren are out tonight.</div>
          <div style={{
            display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap",
          }}>
            {PINS.filter((p) => p.who !== "You").map((p) => (
              <span key={p.who} style={{
                padding: "4px 10px", borderRadius: 999,
                background: p.color, border: `2px solid ${TOKENS.ink}`,
                fontFamily: TOKENS.ui, fontSize: 11, fontWeight: 800,
                color: TOKENS.ink,
              }}>{p.who} → {p.at}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
