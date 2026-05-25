import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  BrandMark, ChunkyButton, DotsBg, Frame, Icons, RouteDots, Ticket, TOKENS,
} from "@/components/new-confetti/shell";

// Ported from design/new-confetti/project/screens.jsx (PassScreen, line 677)
// Slim port: header + 3 stops + book CTA. Drop-flip card animation
// is a follow-up polish — visual fidelity holds without it.
export const Route = createFileRoute("/new/pass")({
  component: PassPage,
});

const STOPS = [
  { time: "6:30 PM", name: "Daughter Coffee", tag: "espresso start", sub: "good light, real beans",
    addr: "112 N 6th St", dur: "45m", cost: "$12", color: TOKENS.accent2 },
  { time: "8:30 PM", name: "Lupa Notte", tag: "italian", sub: "fresh pasta, wine bar vibe",
    addr: "88 N 6th St", dur: "90m", cost: "$58", color: TOKENS.accent1 },
  { time: "10:45 PM", name: "Skinny Dennis", tag: "honky tonk", sub: "$3 frozen margs, live country",
    addr: "152 Metropolitan Ave", dur: "120m", cost: "$22", color: TOKENS.accent3 },
];

function PassPage() {
  const navigate = useNavigate();

  return (
    <Frame>
      <div style={{
        position: "relative", height: "100%",
        background: TOKENS.bg,
        display: "flex", flexDirection: "column",
        padding: "56px 22px 22px",
        overflow: "hidden",
      }}>
        <DotsBg opacity={0.06} />

        <div style={{
          position: "relative", zIndex: 2,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 14,
        }}>
          <BrandMark size={17} />
          <span style={{
            fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800,
            letterSpacing: ".14em", opacity: 0.55,
          }}>PASS · #A7K2</span>
        </div>

        <div style={{
          position: "relative", zIndex: 2,
          flex: 1, overflowY: "auto", overflowX: "hidden",
          marginRight: -22, paddingRight: 22,
          scrollbarWidth: "none",
        }}>
          <h2 style={{
            fontFamily: TOKENS.display, fontWeight: 900,
            fontSize: 38, lineHeight: 0.95, letterSpacing: "-0.04em",
            color: TOKENS.ink, margin: "0 0 4px",
          }}>Your night,<br/>printed.</h2>
          <p style={{
            fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 600,
            color: TOKENS.ink, opacity: 0.55, margin: "0 0 16px",
          }}>Brooklyn · tonight · foodie mix</p>

          {/* Pass ticket header */}
          <Ticket color={TOKENS.paper} notch={false} style={{ padding: "18px 18px 16px", marginBottom: 14 }}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              paddingBottom: 14, borderBottom: `2.5px dashed ${TOKENS.ink}`,
            }}>
              <div>
                <div style={{
                  fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800,
                  letterSpacing: ".14em", opacity: 0.55,
                }}>TONIGHT · WILLIAMSBURG</div>
                <div style={{
                  fontFamily: TOKENS.display, fontWeight: 900, fontSize: 22,
                  letterSpacing: "-0.03em", marginTop: 2,
                }}>3 stops · ~4h · $92</div>
              </div>
              <div style={{
                width: 56, height: 56, borderRadius: 12,
                border: `2.5px solid ${TOKENS.ink}`, background: TOKENS.accent2,
                display: "grid", placeItems: "center",
                fontFamily: TOKENS.display, fontWeight: 900, fontSize: 11,
                letterSpacing: ".12em", color: TOKENS.ink,
                lineHeight: 1, textAlign: "center",
              }}>FRI<br/>MAY<br/>30</div>
            </div>
            <div style={{ marginTop: 12 }}><RouteDots progress={1} size={18} /></div>
          </Ticket>

          {/* Stops */}
          {STOPS.map((s, i) => (
            <div key={i} style={{
              border: `2.5px solid ${TOKENS.ink}`, borderRadius: 16,
              background: TOKENS.paper, padding: 14, marginBottom: 10,
              boxShadow: `4px 4px 0 ${TOKENS.ink}`,
              position: "relative",
            }}>
              {/* Stop number badge */}
              <span style={{
                position: "absolute", top: -10, left: -10,
                width: 28, height: 28, borderRadius: 999,
                background: s.color, border: `2.5px solid ${TOKENS.ink}`,
                display: "grid", placeItems: "center",
                fontFamily: TOKENS.display, fontWeight: 900, fontSize: 13,
                color: TOKENS.ink,
              }}>{i + 1}</span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                <span style={{
                  fontFamily: TOKENS.mono, fontSize: 11, fontWeight: 800,
                  letterSpacing: ".14em", color: TOKENS.ink,
                }}>{s.time}</span>
                <span style={{
                  fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 700,
                  letterSpacing: ".1em", opacity: 0.55,
                }}>· {s.tag}</span>
              </div>
              <div style={{
                fontFamily: TOKENS.display, fontWeight: 900, fontSize: 22,
                letterSpacing: "-0.03em", lineHeight: 1,
              }}>{s.name}</div>
              <div style={{
                fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 700,
                opacity: 0.65, marginTop: 4,
              }}>{s.sub}</div>
              <div style={{
                marginTop: 10, paddingTop: 10,
                borderTop: "1.5px dashed rgba(0,0,0,0.15)",
                display: "flex", gap: 14,
                fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800,
                letterSpacing: ".1em", opacity: 0.7,
              }}>
                <span>📍 {s.addr}</span>
                <span>⏱ {s.dur}</span>
                <span>💸 {s.cost}</span>
              </div>
            </div>
          ))}

          <div style={{ height: 12 }} />
        </div>

        <div style={{ position: "relative", zIndex: 2 }}>
          <ChunkyButton variant="accent" onClick={() => navigate({ to: "/new/night" })} icon={Icons.arrow}>
            Book everything · $92
          </ChunkyButton>
        </div>
      </div>
    </Frame>
  );
}
