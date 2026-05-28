import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BackButton, BrandMark, DotsBg, FloatingTickets, Frame, RouteDots, TOKENS,
} from "@/components/new-confetti/shell";

// Ported from design/new-confetti/project/screens.jsx (LoaderScreen, line 442)
export const Route = createFileRoute("/new/printing")({
  component: LoaderPage,
});

const AGENTS = [
  { id: "context",  label: "context",   blurb: "reading your last 18 passes" },
  { id: "planner",  label: "planner",   blurb: "sketching 3 route shapes" },
  { id: "ranking",  label: "ranking",   blurb: "scoring 42 venues by fit" },
  { id: "filter",   label: "filter",    blurb: "enforcing budget + walkable" },
  { id: "explainer", label: "explainer", blurb: "writing the why for each pick" },
  { id: "plangen",  label: "plan-gen",  blurb: "composing the pass" },
];

function LoaderPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const TOTAL = 6800;
    let raf = 0;
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / TOTAL);
      setProgress(t);
      setStep(Math.min(AGENTS.length - 1, Math.floor(t * AGENTS.length)));
      if (t < 1) raf = requestAnimationFrame(tick);
      else setTimeout(() => navigate({ to: "/new/pass" }), 400);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [navigate]);

  const messages = AGENTS.map((a) => `${a.label}: ${a.blurb}`);

  return (
    <Frame>
      <div style={{
        position: "relative", height: "100%", overflow: "hidden",
        background: TOKENS.bg,
        display: "grid", placeItems: "center",
        padding: "60px 24px 36px",
      }}>
        <DotsBg />
        <FloatingTickets density={6} />

        {/* Radial wash */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: `radial-gradient(circle at 20% 22%, ${TOKENS.accent1}33 0%, transparent 30%),
                       radial-gradient(circle at 80% 75%, ${TOKENS.accent2}66 0%, transparent 32%)`,
        }} />

        <div style={{
          position: "relative", zIndex: 2,
          width: "100%", maxWidth: 340, textAlign: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <BackButton onClick={() => navigate({ to: "/new/hub" })} />
            <BrandMark size={22} spin />
            <span style={{ width: 36 }} />
          </div>

          {/* Ticket machine */}
          <div style={{
            border: `3px solid ${TOKENS.ink}`, borderRadius: 22,
            background: TOKENS.paper,
            boxShadow: `7px 7px 0 ${TOKENS.ink}`,
            overflow: "hidden", textAlign: "left",
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              padding: "11px 16px",
              borderBottom: `3px solid ${TOKENS.ink}`,
              background: TOKENS.accent1,
              fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800,
              letterSpacing: ".16em", color: TOKENS.ink,
            }}>
              <span>6-AGENT PIPELINE</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <span style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: TOKENS.ink,
                  animation: "cf-pulse 1.2s infinite",
                }} />
                RUNNING
              </span>
            </div>

            <div style={{
              margin: 18, padding: 16,
              border: `3px solid ${TOKENS.ink}`, borderRadius: 16,
              background: TOKENS.bg,
              animation: "cf-print 2.4s infinite ease-in-out",
              transformOrigin: "top center",
            }}>
              <div style={{
                display: "flex", justifyContent: "space-between",
                fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800,
                letterSpacing: ".14em",
              }}>
                <span>YOUR PASS</span><span>#A7K2</span>
              </div>
              <RouteDots progress={progress} size={18} />
              <div style={{
                display: "flex", flexDirection: "column", gap: 4,
                minHeight: 130, justifyContent: "center",
              }}>
                {AGENTS.map((a, i) => {
                  const t = progress * AGENTS.length;
                  const active = t > i && t < i + 1;
                  const done = t >= i + 1;
                  return (
                    <div key={a.id} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "3px 6px",
                      background: active ? TOKENS.accent2 : "transparent",
                      border: active ? `2px solid ${TOKENS.ink}` : "2px solid transparent",
                      borderRadius: 8,
                      transition: "all .25s",
                      opacity: done || active ? 1 : 0.35,
                    }}>
                      <span style={{
                        width: 14, height: 14, flexShrink: 0,
                        borderRadius: 999,
                        border: `2px solid ${TOKENS.ink}`,
                        background: done ? TOKENS.accent1 : active ? TOKENS.paper : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 8, fontWeight: 900, color: TOKENS.ink,
                      }}>{done ? "✓" : ""}</span>
                      <span style={{
                        fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800,
                        letterSpacing: ".06em", color: TOKENS.ink, minWidth: 64,
                      }}>{a.label}</span>
                      <span style={{
                        fontFamily: TOKENS.ui, fontSize: 10, fontWeight: 600,
                        color: TOKENS.ink, opacity: 0.7, flex: 1,
                        textAlign: "left", whiteSpace: "nowrap",
                        overflow: "hidden", textOverflow: "ellipsis",
                      }}>{a.blurb}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{
                display: "flex", justifyContent: "space-between",
                fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800,
                letterSpacing: ".14em", marginTop: 4,
              }}>
                <span>3 STOPS</span><span>~4H</span><span>~$92</span>
              </div>
            </div>
          </div>

          <h1 style={{
            fontFamily: TOKENS.display, fontWeight: 900,
            fontSize: 44, lineHeight: 0.95, letterSpacing: "-0.04em",
            color: TOKENS.ink, margin: "24px 0 6px",
          }}>Printing your night.</h1>

          <div style={{
            position: "relative", minHeight: 24,
            fontFamily: TOKENS.ui, fontSize: 15, fontWeight: 700,
            color: TOKENS.ink, opacity: 0.85,
          }}>
            {messages.map((m, i) => (
              <span key={i} style={{
                position: "absolute", inset: 0,
                opacity: i === step ? 1 : 0,
                transform: i === step ? "translateY(0)" : "translateY(6px)",
                transition: "all .4s",
              }}>{m}</span>
            ))}
          </div>

          {/* Progress bar */}
          <div style={{
            marginTop: 22,
            height: 10, border: `2.5px solid ${TOKENS.ink}`, borderRadius: 999,
            background: TOKENS.paper, overflow: "hidden",
          }}>
            <div style={{
              height: "100%", width: `${progress * 100}%`,
              background: `linear-gradient(90deg, ${TOKENS.accent1}, ${TOKENS.accent2}, ${TOKENS.accent3})`,
              transition: "width .2s linear",
            }} />
          </div>
        </div>
      </div>
    </Frame>
  );
}
