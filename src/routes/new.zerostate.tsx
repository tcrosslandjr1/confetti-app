import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  BrandMark,
  DotsBg,
  FloatingTickets,
  Frame,
  TOKENS,
} from "@/components/new-confetti/shell";

// Ported from design_extracted/new-confetti/project/confetti-code/zerostate.jsx
// Shows when a user has no saved passes yet — teaches the app loop.
export const Route = createFileRoute("/new/zerostate")({ component: ZeroStatePage });

const HOW_STEPS = [
  { n: 1, t: "tell sparkle", d: "date · family · cookout · anything", c: TOKENS.paper },
  { n: 2, t: "pass prints",  d: "3 stops, route, budget, timing",    c: TOKENS.accent2 },
  { n: 3, t: "night-of",     d: "check in. earn points. recap.",      c: TOKENS.paper },
] as const;

function ZeroStatePage() {
  const navigate = useNavigate();

  return (
    <Frame>
      <div
        style={{
          position: "relative",
          minHeight: "100dvh",
          background: TOKENS.bg,
          display: "flex",
          flexDirection: "column",
          padding: "56px 22px 28px",
        }}
      >
        <DotsBg opacity={0.06} />
        <FloatingTickets density={3} />

        {/* Top bar */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <BrandMark size={18} />
        </div>

        <div style={{ position: "relative", zIndex: 2 }}>
          {/* Big hero CTA */}
          <button
            onClick={() => navigate({ to: "/new/chat" })}
            style={{
              appearance: "none",
              cursor: "pointer",
              textAlign: "left",
              width: "100%",
              padding: "20px 18px",
              marginBottom: 14,
              border: `3px solid ${TOKENS.ink}`,
              borderRadius: 20,
              background: TOKENS.accent1,
              color: TOKENS.ink,
              boxShadow: `6px 6px 0 ${TOKENS.ink}`,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <span
              style={{
                fontFamily: TOKENS.mono,
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: ".16em",
                opacity: 0.7,
              }}
            >
              START HERE · YOUR FIRST PASS
            </span>
            <span
              style={{
                fontFamily: TOKENS.display,
                fontWeight: 900,
                fontSize: 28,
                letterSpacing: "-0.035em",
                lineHeight: 0.95,
              }}
            >
              Print your<br />first night out.
            </span>
            <span
              style={{
                fontFamily: TOKENS.ui,
                fontSize: 12,
                fontWeight: 700,
                opacity: 0.75,
                marginTop: 4,
              }}
            >
              Tell Sparkle a vibe. 4 minutes to a real pass.
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                marginTop: 8,
                padding: "6px 10px",
                background: TOKENS.paper,
                border: `2px solid ${TOKENS.ink}`,
                borderRadius: 999,
                alignSelf: "flex-start",
                fontFamily: TOKENS.mono,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: ".12em",
              }}
            >
              ✣ chat with sparkle →
            </span>
          </button>

          {/* How it works — 3 mini cards */}
          <div
            style={{
              fontFamily: TOKENS.mono,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: ".14em",
              opacity: 0.55,
              color: TOKENS.ink,
              marginBottom: 8,
              textTransform: "uppercase",
            }}
          >
            how a pass works
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 8,
              marginBottom: 18,
            }}
          >
            {HOW_STEPS.map((s) => (
              <div
                key={s.n}
                style={{
                  padding: "10px 10px",
                  border: `2.5px solid ${TOKENS.ink}`,
                  borderRadius: 12,
                  background: s.c,
                  color: TOKENS.ink,
                  boxShadow: `3px 3px 0 ${TOKENS.ink}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  minHeight: 92,
                }}
              >
                <span
                  style={{
                    fontFamily: TOKENS.display,
                    fontWeight: 900,
                    fontSize: 18,
                    lineHeight: 1,
                  }}
                >
                  0{s.n}
                </span>
                <span
                  style={{
                    fontFamily: TOKENS.display,
                    fontWeight: 900,
                    fontSize: 13,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.05,
                  }}
                >
                  {s.t}
                </span>
                <span
                  style={{
                    fontFamily: TOKENS.mono,
                    fontSize: 8.5,
                    fontWeight: 700,
                    letterSpacing: ".06em",
                    opacity: 0.65,
                    lineHeight: 1.3,
                    marginTop: "auto",
                  }}
                >
                  {s.d}
                </span>
              </div>
            ))}
          </div>

          {/* Trust signals */}
          <div
            style={{
              marginBottom: 18,
              padding: "12px 14px",
              background: "rgba(255,255,255,0.5)",
              border: `1.5px dashed ${TOKENS.ink}`,
              borderRadius: 12,
            }}
          >
            <div
              style={{
                fontFamily: TOKENS.mono,
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: ".14em",
                opacity: 0.6,
                marginBottom: 6,
              }}
            >
              WHAT YOU SHOULD KNOW
            </div>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: 4,
                fontFamily: TOKENS.ui,
                fontSize: 11,
                fontWeight: 600,
                color: TOKENS.ink,
                opacity: 0.85,
                lineHeight: 1.4,
              }}
            >
              <li>· No payment until you actually book a stop</li>
              <li>· Your taste is private — never sold to advertisers</li>
              <li>· Skip a stop anytime — Sparkle adapts mid-night</li>
            </ul>
          </div>

          {/* Secondary actions */}
          <div
            style={{
              fontFamily: TOKENS.mono,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: ".14em",
              opacity: 0.55,
              color: TOKENS.ink,
              marginBottom: 8,
              textTransform: "uppercase",
            }}
          >
            or try
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              marginBottom: 18,
            }}
          >
            <button
              onClick={() => navigate({ to: "/new/taste" })}
              style={{
                appearance: "none",
                cursor: "pointer",
                textAlign: "left",
                padding: "12px 12px",
                border: `2.5px solid ${TOKENS.ink}`,
                borderRadius: 12,
                background: TOKENS.paper,
                color: TOKENS.ink,
                boxShadow: `3px 3px 0 ${TOKENS.ink}`,
                display: "flex",
                flexDirection: "column",
                gap: 3,
              }}
            >
              <span style={{ fontSize: 20 }}>📋</span>
              <span
                style={{
                  fontFamily: TOKENS.display,
                  fontWeight: 900,
                  fontSize: 14,
                  letterSpacing: "-0.02em",
                }}
              >
                vibe form
              </span>
              <span
                style={{
                  fontFamily: TOKENS.mono,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: ".08em",
                  opacity: 0.6,
                }}
              >
                chips + sliders
              </span>
            </button>
            <button
              onClick={() => navigate({ to: "/new/explore" })}
              style={{
                appearance: "none",
                cursor: "pointer",
                textAlign: "left",
                padding: "12px 12px",
                border: `2.5px solid ${TOKENS.ink}`,
                borderRadius: 12,
                background: TOKENS.paper,
                color: TOKENS.ink,
                boxShadow: `3px 3px 0 ${TOKENS.ink}`,
                display: "flex",
                flexDirection: "column",
                gap: 3,
              }}
            >
              <span style={{ fontSize: 20 }}>🗺</span>
              <span
                style={{
                  fontFamily: TOKENS.display,
                  fontWeight: 900,
                  fontSize: 14,
                  letterSpacing: "-0.02em",
                }}
              >
                explore
              </span>
              <span
                style={{
                  fontFamily: TOKENS.mono,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: ".08em",
                  opacity: 0.6,
                }}
              >
                venues nearby
              </span>
            </button>
          </div>
        </div>
      </div>
    </Frame>
  );
}
