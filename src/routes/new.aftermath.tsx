import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { DotsBg, Frame, TOKENS } from "@/components/new-confetti/shell";

// Ported from prototype confetti-code/aftermath.jsx
// Post-night loop: celebrate → rate stops → invite/re-run
export const Route = createFileRoute("/new/aftermath")({ component: AftermathPage });

interface Stop {
  name: string;
  kind: string;
  time: string;
}

const DEFAULT_STOPS: Stop[] = [
  { name: "Lupa Notte", kind: "italian", time: "7:30 PM" },
  { name: "Skinny Pete's", kind: "dive bar", time: "9:15 PM" },
  { name: "Quartz Room", kind: "live show", time: "10:30 PM" },
];

type Step = "celebrate" | "rate" | "invite";
type Rating = "up" | "down";

// ── BigBurst — celebratory confetti pieces ───────────────────────────
function BigBurst({ active, density = 36 }: { active: boolean; density?: number }) {
  if (!active) return null;
  const pieces = Array.from({ length: density }, (_, i) => i);
  const colors = [TOKENS.accent1, TOKENS.accent2, TOKENS.accent3, TOKENS.accent4, TOKENS.paper];
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 80,
        overflow: "hidden",
      }}
    >
      {pieces.map((i) => {
        const left = (i * 47) % 100;
        const delay = (i % 9) * 50;
        const size = 5 + (i % 4) * 2;
        const dur = 1100 + (i % 6) * 200;
        const rot = (i * 53) % 360;
        return (
          <span
            key={i}
            style={{
              position: "absolute",
              left: `${left}%`,
              top: "40%",
              width: size,
              height: size * 1.4,
              background: colors[i % colors.length],
              border: `1.5px solid ${TOKENS.ink}`,
              transform: `rotate(${rot}deg)`,
              animation: `cf-fr-confetti ${dur}ms ${delay}ms cubic-bezier(.2,.7,.3,1) forwards`,
              opacity: 0,
            }}
          />
        );
      })}
    </div>
  );
}

function AftermathPage() {
  const navigate = useNavigate();
  const stops = DEFAULT_STOPS;

  const [ratings, setRatings] = useState<Record<number, Rating>>({});
  const [step, setStep] = useState<Step>("celebrate");
  const [burst, setBurst] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setBurst(false), 1600);
    const t2 = setTimeout(() => setStep("rate"), 1800);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, []);

  const rated = Object.keys(ratings).length;
  const ups = Object.values(ratings).filter((r) => r === "up").length;

  const onDone = () => navigate({ to: "/new/welcome" });
  const onReRun = () => navigate({ to: "/new/chat" });
  const onShare = () => {
    if (navigator.share) {
      navigator.share({ title: "Confetti", text: "Join me on Confetti — free pass!" }).catch(() => {});
    }
  };

  const STOP_COLORS = [TOKENS.accent1, TOKENS.accent2, TOKENS.accent3] as const;
  const STOP_FG = [TOKENS.ink, TOKENS.ink, TOKENS.paper] as const;

  return (
    <Frame>
      <div
        className="cf-screen"
        style={{
          position: "relative",
          height: "100dvh",
          overflow: "hidden",
          background: TOKENS.bg,
          display: "flex",
          flexDirection: "column",
          padding: "56px 22px 28px",
        }}
      >
        <DotsBg opacity={0.06} />
        <BigBurst active={burst} />

        {/* ── CELEBRATE ─────────────────────────────────────────── */}
        {step === "celebrate" && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              gap: 14,
              position: "relative",
              zIndex: 2,
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 96,
                height: 96,
                borderRadius: "50%",
                background: TOKENS.accent1,
                border: `3px solid ${TOKENS.ink}`,
                boxShadow: `5px 5px 0 ${TOKENS.ink}`,
                fontFamily: TOKENS.display,
                fontWeight: 900,
                fontSize: 52,
                color: TOKENS.ink,
                animation: "cf-pop 0.5s ease-out",
              }}
            >
              ✣
            </span>
            <h1
              style={{
                fontFamily: TOKENS.display,
                fontWeight: 900,
                fontSize: 44,
                lineHeight: 0.9,
                letterSpacing: "-0.045em",
                color: TOKENS.ink,
                margin: "6px 0 0",
              }}
            >
              night
              <br />
              complete.
            </h1>
            <p
              style={{
                fontFamily: TOKENS.ui,
                fontSize: 14,
                fontWeight: 700,
                color: TOKENS.ink,
                opacity: 0.65,
                margin: 0,
                maxWidth: 280,
              }}
            >
              {stops.length} stops · saved to your scrapbook
            </p>
            <div
              style={{
                marginTop: 8,
                padding: "10px 16px",
                background: TOKENS.accent2,
                border: `2.5px solid ${TOKENS.ink}`,
                borderRadius: 999,
                boxShadow: `3px 3px 0 ${TOKENS.ink}`,
                fontFamily: TOKENS.display,
                fontWeight: 900,
                fontSize: 16,
                color: TOKENS.ink,
              }}
            >
              + 250 points earned
            </div>
          </div>
        )}

        {/* ── RATE STOPS ────────────────────────────────────────── */}
        {step === "rate" && (
          <div
            style={{ position: "relative", zIndex: 2, flex: 1, display: "flex", flexDirection: "column" }}
          >
            <span
              style={{
                fontFamily: TOKENS.mono,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: ".14em",
                opacity: 0.55,
                color: TOKENS.ink,
              }}
            >
              QUICK RATE · BUILDS YOUR TASTE
            </span>
            <h1
              style={{
                fontFamily: TOKENS.display,
                fontWeight: 900,
                fontSize: 32,
                lineHeight: 0.94,
                letterSpacing: "-0.04em",
                color: TOKENS.ink,
                margin: "8px 0 6px",
              }}
            >
              How was
              <br />
              each stop?
            </h1>
            <p
              style={{
                fontFamily: TOKENS.ui,
                fontSize: 12,
                fontWeight: 600,
                opacity: 0.6,
                margin: "0 0 18px",
                color: TOKENS.ink,
              }}
            >
              Sparkle learns from this. Better picks every night.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {stops.map((s, i) => {
                const r = ratings[i];
                return (
                  <div
                    key={i}
                    style={{
                      padding: "12px 14px",
                      border: `2.5px solid ${TOKENS.ink}`,
                      borderRadius: 14,
                      background:
                        r === "up" ? TOKENS.accent4 : r === "down" ? "rgba(19,11,13,0.06)" : TOKENS.paper,
                      boxShadow: `3px 3px 0 ${TOKENS.ink}`,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      transition: "background .25s",
                    }}
                  >
                    <span
                      style={{
                        flexShrink: 0,
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        border: `2px solid ${TOKENS.ink}`,
                        background: STOP_COLORS[i % 3],
                        fontFamily: TOKENS.display,
                        fontWeight: 900,
                        fontSize: 11,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: STOP_FG[i % 3],
                      }}
                    >
                      {i + 1}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: TOKENS.display,
                          fontWeight: 900,
                          fontSize: 16,
                          letterSpacing: "-0.02em",
                          lineHeight: 1,
                          color: TOKENS.ink,
                        }}
                      >
                        {s.name}
                      </div>
                      <div
                        style={{
                          fontFamily: TOKENS.mono,
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: ".1em",
                          opacity: 0.55,
                          marginTop: 2,
                          textTransform: "uppercase" as const,
                          color: TOKENS.ink,
                        }}
                      >
                        {s.kind}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => setRatings({ ...ratings, [i]: "down" })}
                        style={{
                          appearance: "none",
                          cursor: "pointer",
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          border: `2px solid ${TOKENS.ink}`,
                          background: r === "down" ? TOKENS.ink : TOKENS.paper,
                          color: r === "down" ? TOKENS.paper : TOKENS.ink,
                          fontSize: 16,
                        }}
                      >
                        👎
                      </button>
                      <button
                        onClick={() => setRatings({ ...ratings, [i]: "up" })}
                        style={{
                          appearance: "none",
                          cursor: "pointer",
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          border: `2px solid ${TOKENS.ink}`,
                          background: r === "up" ? TOKENS.ink : TOKENS.paper,
                          color: r === "up" ? TOKENS.paper : TOKENS.ink,
                          fontSize: 16,
                        }}
                      >
                        👍
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {ups > 0 && (
              <div
                style={{
                  marginTop: 14,
                  padding: "10px 12px",
                  background: "rgba(43,182,115,0.18)",
                  border: `1.5px dashed ${TOKENS.ink}`,
                  borderRadius: 10,
                  fontFamily: TOKENS.mono,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: ".06em",
                  color: TOKENS.ink,
                  animation: "cf-pop 0.3s ease-out",
                }}
              >
                + saved to your taste:{" "}
                {Object.entries(ratings)
                  .filter(([, r]) => r === "up")
                  .map(([idx]) => stops[Number(idx)]?.kind)
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            )}

            <button
              onClick={() => setStep("invite")}
              style={{
                appearance: "none",
                cursor: "pointer",
                padding: "14px 16px",
                marginTop: "auto",
                border: `3px solid ${TOKENS.ink}`,
                borderRadius: 14,
                background: rated ? TOKENS.accent1 : TOKENS.paper,
                color: TOKENS.ink,
                fontFamily: TOKENS.display,
                fontWeight: 900,
                fontSize: 17,
                letterSpacing: "-0.02em",
                boxShadow: `5px 5px 0 ${TOKENS.ink}`,
              }}
            >
              {rated ? `next →` : `skip rating →`}
            </button>
          </div>
        )}

        {/* ── INVITE + RE-RUN ───────────────────────────────────── */}
        {step === "invite" && (
          <div
            style={{ position: "relative", zIndex: 2, flex: 1, display: "flex", flexDirection: "column" }}
          >
            <span
              style={{
                fontFamily: TOKENS.mono,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: ".14em",
                opacity: 0.55,
                color: TOKENS.ink,
              }}
            >
              ONE LAST THING
            </span>
            <h1
              style={{
                fontFamily: TOKENS.display,
                fontWeight: 900,
                fontSize: 32,
                lineHeight: 0.94,
                letterSpacing: "-0.04em",
                color: TOKENS.ink,
                margin: "8px 0 14px",
              }}
            >
              Send a friend their
              <br />
              first pass.
            </h1>

            {/* Referral card */}
            <div
              style={{
                padding: 14,
                marginBottom: 12,
                border: `3px solid ${TOKENS.ink}`,
                borderRadius: 16,
                background: TOKENS.accent1,
                boxShadow: `5px 5px 0 ${TOKENS.ink}`,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span
                style={{
                  fontSize: 36,
                  lineHeight: 1,
                  flexShrink: 0,
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  background: TOKENS.paper,
                  border: `2.5px solid ${TOKENS.ink}`,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                🎟
              </span>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: TOKENS.mono,
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: ".14em",
                    opacity: 0.7,
                    color: TOKENS.ink,
                  }}
                >
                  BOTH GET A FREE PASS
                </div>
                <div
                  style={{
                    fontFamily: TOKENS.display,
                    fontWeight: 900,
                    fontSize: 18,
                    letterSpacing: "-0.02em",
                    marginTop: 2,
                    color: TOKENS.ink,
                  }}
                >
                  jess.c / abc12
                </div>
                <div
                  style={{
                    fontFamily: TOKENS.ui,
                    fontSize: 11,
                    fontWeight: 700,
                    opacity: 0.75,
                    marginTop: 2,
                    color: TOKENS.ink,
                  }}
                >
                  tap to copy + share
                </div>
              </div>
            </div>

            <button
              onClick={onShare}
              style={{
                appearance: "none",
                cursor: "pointer",
                padding: "12px 16px",
                marginBottom: 10,
                border: `2.5px solid ${TOKENS.ink}`,
                borderRadius: 12,
                background: TOKENS.paper,
                color: TOKENS.ink,
                fontFamily: TOKENS.ui,
                fontWeight: 800,
                fontSize: 13,
                boxShadow: `3px 3px 0 ${TOKENS.ink}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              📤 share via…
            </button>

            {/* Re-run nudge */}
            <div
              style={{
                marginTop: 14,
                padding: 14,
                border: `2.5px dashed ${TOKENS.ink}`,
                borderRadius: 14,
                background: "rgba(255,255,255,0.4)",
              }}
            >
              <div
                style={{
                  fontFamily: TOKENS.mono,
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: ".14em",
                  opacity: 0.6,
                  marginBottom: 6,
                  color: TOKENS.ink,
                }}
              >
                NUDGE · NEXT FRIDAY
              </div>
              <div
                style={{
                  fontFamily: TOKENS.display,
                  fontWeight: 900,
                  fontSize: 18,
                  letterSpacing: "-0.02em",
                  marginBottom: 8,
                  color: TOKENS.ink,
                }}
              >
                Want this again, Fri 5/30?
              </div>
              <button
                onClick={onReRun}
                style={{
                  appearance: "none",
                  cursor: "pointer",
                  padding: "10px 14px",
                  border: `2.5px solid ${TOKENS.ink}`,
                  borderRadius: 10,
                  background: TOKENS.accent2,
                  color: TOKENS.ink,
                  fontFamily: TOKENS.ui,
                  fontWeight: 800,
                  fontSize: 12,
                  boxShadow: `3px 3px 0 ${TOKENS.ink}`,
                }}
              >
                ↻ pre-print for Friday
              </button>
            </div>

            <button
              onClick={onDone}
              style={{
                appearance: "none",
                cursor: "pointer",
                padding: "14px 16px",
                marginTop: "auto",
                border: `3px solid ${TOKENS.ink}`,
                borderRadius: 14,
                background: TOKENS.ink,
                color: TOKENS.paper,
                fontFamily: TOKENS.display,
                fontWeight: 900,
                fontSize: 17,
                letterSpacing: "-0.02em",
                boxShadow: `5px 5px 0 ${TOKENS.accent1}`,
              }}
            >
              back to hub →
            </button>
          </div>
        )}
      </div>
    </Frame>
  );
}
