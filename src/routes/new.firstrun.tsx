import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, type CSSProperties } from "react";
import {
  BrandMark,
  DotsBg,
  FloatingTickets,
  Frame,
  Ticket,
  TOKENS,
} from "@/components/new-confetti/shell";

export const Route = createFileRoute("/new/firstrun")({ component: FirstRunPage });

// ── Confetti burst (CSS-only, fires once) ─────────────────────────────────
function ConfettiBurst({ active }: { active: boolean }) {
  if (!active) return null;
  const colors = [TOKENS.accent1, TOKENS.accent2, TOKENS.accent3, TOKENS.paper];
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 50,
        overflow: "hidden",
      }}
    >
      {Array.from({ length: 32 }, (_, i) => {
        const left = (i * 37) % 100;
        const delay = (i % 8) * 60;
        const size = 6 + (i % 4) * 2;
        const dur = 1200 + (i % 6) * 180;
        const rot = (i * 53) % 360;
        return (
          <span
            key={i}
            style={{
              position: "absolute",
              left: left + "%",
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
      <style>{`
        @keyframes cf-fr-confetti {
          0%   { opacity:1; transform:translate(0,-40px) rotate(0); }
          70%  { opacity:1; }
          100% { opacity:0; transform:translate(60px,540px) rotate(720deg); }
        }
        @keyframes cf-slideup-text {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </div>
  );
}

type Beat = "pick-vibe" | "pick-detail" | "working" | "reveal";

interface PassStop {
  name: string;
  kind: string;
  time: string;
  must?: string;
}
interface Pass {
  title: string;
  totalCost: string;
  duration: string;
  stops: PassStop[];
}

const VIBES = [
  { id: "date",     label: "date night",  emoji: "🌹", bg: TOKENS.accent1, agent: "Night Out Agent" },
  { id: "family",   label: "family day",  emoji: "🌳", bg: TOKENS.accent2, agent: "Family Agent" },
  { id: "cookout",  label: "cookout",     emoji: "🔥", bg: TOKENS.accent1, agent: "Hosting Agent" },
  { id: "kids",     label: "kids party",  emoji: "🎂", bg: TOKENS.accent2, agent: "Party Agent" },
  { id: "tourist",  label: "tourist day", emoji: "🗽", bg: TOKENS.paper,   agent: "Night Out Agent" },
  { id: "recharge", label: "recharge",    emoji: "🌿", bg: TOKENS.accent3, agent: "Family Agent" },
] as const;

const CITIES = ["Brooklyn", "Manhattan", "LA", "Austin", "Chicago", "Miami"];
const BUDGETS = [
  { label: "$",   sub: "under 40" },
  { label: "$$",  sub: "40–100" },
  { label: "$$$", sub: "100+" },
];

function FirstRunPage() {
  const navigate = useNavigate();
  const [beat, setBeat] = useState<Beat>("pick-vibe");
  const [vibe, setVibe] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [budget, setBudget] = useState<string | null>(null);
  const [reasoning, setReasoning] = useState<string[]>([]);
  const [agent, setAgent] = useState<string | null>(null);
  const [pass, setPass] = useState<Pass | null>(null);
  const [burst, setBurst] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Beat 3 — simulate streaming reasoning + generate fallback pass
  useEffect(() => {
    if (beat !== "working") return;
    let cancelled = false;

    const chosenVibe = VIBES.find((v) => v.id === vibe);
    setAgent(chosenVibe?.agent ?? "Night Out Agent");
    setReasoning([]);

    const lines = [
      `routing → ${chosenVibe?.agent ?? "Night Out Agent"}`,
      `reading ${city} venue pool…`,
      `filtering for ${chosenVibe?.label ?? vibe} · ${budget}`,
      `optimizing walking route…`,
      `printing pass…`,
    ];
    lines.forEach((ln, i) => {
      setTimeout(() => {
        if (cancelled) return;
        setReasoning((prev) => [...prev, ln]);
      }, 380 + i * 520);
    });

    // Synthetic pass (no real Claude call in the firstrun demo)
    const fallback: Pass = {
      title: `${chosenVibe?.label ?? "night"} in ${(city ?? "").toLowerCase()}`,
      totalCost: budget === "$" ? "$36" : budget === "$$$" ? "$148" : "$84",
      duration: "4h",
      stops: [
        { name: "Lupa Notte",    kind: "italian",   time: "7:30 PM", must: "cacio e pepe + the natural list" },
        { name: "Skinny Pete's", kind: "dive bar",  time: "9:15 PM", must: "house old fashioned, sit at the bar" },
        { name: "Quartz Room",   kind: "live show", time: "10:30 PM", must: "late set, get there for the opener" },
      ],
    };

    const totalDelay = 380 + lines.length * 520;
    const revealAt = Math.max(totalDelay, 2800);

    const t = setTimeout(() => {
      if (cancelled) return;
      setPass(fallback);
      setBurst(true);
      setBeat("reveal");
      setTimeout(() => setBurst(false), 1400);
    }, revealAt);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beat]);

  const BEAT_ORDER: Beat[] = ["pick-vibe", "pick-detail", "working", "reveal"];

  return (
    <Frame>
      <div
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
        {beat === "pick-vibe" && <FloatingTickets density={4} />}

        {/* Header */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
          }}
        >
          <BrandMark size={18} spin={beat === "working"} />
          <button
            onClick={() => navigate({ to: "/new/signin" })}
            style={{
              appearance: "none",
              cursor: "pointer",
              background: "transparent",
              border: "none",
              fontFamily: TOKENS.mono,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: ".14em",
              color: TOKENS.ink,
              opacity: 0.6,
            }}
          >
            SIGN IN ›
          </button>
        </div>

        {/* Progress dots */}
        <div style={{ position: "relative", zIndex: 2, display: "flex", gap: 6, marginBottom: 24 }}>
          {BEAT_ORDER.map((b, i) => {
            const here = BEAT_ORDER.indexOf(beat);
            return (
              <span
                key={b}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 999,
                  background: i <= here ? TOKENS.ink : "rgba(19,11,13,0.15)",
                  transition: "background .3s",
                }}
              />
            );
          })}
        </div>

        {/* ── BEAT 1: pick vibe ── */}
        {beat === "pick-vibe" && (
          <div style={{ position: "relative", zIndex: 2, flex: 1, display: "flex", flexDirection: "column" }}>
            <span style={{ fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800, letterSpacing: ".14em", opacity: 0.55, color: TOKENS.ink }}>
              STEP 1 OF 3 · NO SIGN-UP YET
            </span>
            <h1 style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 38, lineHeight: 0.94, letterSpacing: "-0.04em", color: TOKENS.ink, margin: "8px 0 6px" }}>
              What are<br />you up for?
            </h1>
            <p style={{ fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 600, opacity: 0.6, margin: "0 0 18px", color: TOKENS.ink }}>
              Pick one — we'll print a real pass in 8 seconds. No signup.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {VIBES.map((v) => (
                <button
                  key={v.id}
                  onClick={() => { setVibe(v.id); setBeat("pick-detail"); }}
                  style={{
                    appearance: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    padding: "14px 12px",
                    border: `2.5px solid ${TOKENS.ink}`,
                    borderRadius: 14,
                    background: v.bg,
                    color: v.id === "recharge" ? TOKENS.paper : TOKENS.ink,
                    boxShadow: `4px 4px 0 ${TOKENS.ink}`,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    minHeight: 90,
                  } as CSSProperties}
                >
                  <span style={{ fontSize: 24, lineHeight: 1 }}>{v.emoji}</span>
                  <span style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 17, letterSpacing: "-0.02em", lineHeight: 1 }}>{v.label}</span>
                  <span style={{ fontFamily: TOKENS.mono, fontSize: 8.5, fontWeight: 700, letterSpacing: ".12em", opacity: 0.7, marginTop: "auto", textTransform: "uppercase" }}>
                    → {v.agent.replace(" Agent", "")}
                  </span>
                </button>
              ))}
            </div>
            <p style={{ fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 700, letterSpacing: ".12em", opacity: 0.45, color: TOKENS.ink, marginTop: 18, textAlign: "center", textTransform: "uppercase" }}>
              each vibe routes to a different sparkle specialist
            </p>
          </div>
        )}

        {/* ── BEAT 2: pick city + budget ── */}
        {beat === "pick-detail" && (
          <div style={{ position: "relative", zIndex: 2, flex: 1, display: "flex", flexDirection: "column" }}>
            <span style={{ fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800, letterSpacing: ".14em", opacity: 0.55, color: TOKENS.ink }}>STEP 2 OF 3</span>
            <h1 style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 34, lineHeight: 0.94, letterSpacing: "-0.04em", color: TOKENS.ink, margin: "8px 0 18px" }}>
              Where + how much?
            </h1>

            <div style={{ marginBottom: 18 }}>
              <div style={{ fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800, letterSpacing: ".14em", opacity: 0.55, color: TOKENS.ink, marginBottom: 8, textTransform: "uppercase" }}>city</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {CITIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCity(c)}
                    style={{
                      appearance: "none",
                      cursor: "pointer",
                      padding: "8px 14px",
                      border: `2.5px solid ${TOKENS.ink}`,
                      borderRadius: 999,
                      background: city === c ? TOKENS.ink : TOKENS.paper,
                      color: city === c ? TOKENS.paper : TOKENS.ink,
                      fontFamily: TOKENS.ui,
                      fontSize: 12,
                      fontWeight: 800,
                      boxShadow: city === c ? "none" : `2px 2px 0 ${TOKENS.ink}`,
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800, letterSpacing: ".14em", opacity: 0.55, color: TOKENS.ink, marginBottom: 8, textTransform: "uppercase" }}>budget</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {BUDGETS.map((b) => (
                  <button
                    key={b.label}
                    onClick={() => setBudget(b.label)}
                    style={{
                      appearance: "none",
                      cursor: "pointer",
                      padding: "12px 8px",
                      border: `2.5px solid ${TOKENS.ink}`,
                      borderRadius: 12,
                      background: budget === b.label ? TOKENS.accent1 : TOKENS.paper,
                      color: TOKENS.ink,
                      boxShadow: `3px 3px 0 ${TOKENS.ink}`,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <span style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 20 }}>{b.label}</span>
                    <span style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 700, letterSpacing: ".08em", opacity: 0.65 }}>{b.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setBeat("working")}
              disabled={!city || !budget}
              style={{
                appearance: "none",
                cursor: city && budget ? "pointer" : "not-allowed",
                padding: "16px 18px",
                border: `3px solid ${TOKENS.ink}`,
                borderRadius: 16,
                background: city && budget ? TOKENS.accent1 : "rgba(19,11,13,0.1)",
                color: TOKENS.ink,
                opacity: city && budget ? 1 : 0.5,
                fontFamily: TOKENS.display,
                fontWeight: 900,
                fontSize: 18,
                letterSpacing: "-0.02em",
                boxShadow: `5px 5px 0 ${TOKENS.ink}`,
                marginTop: "auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              ✣ print my pass
            </button>
            <button
              onClick={() => setBeat("pick-vibe")}
              style={{
                appearance: "none",
                cursor: "pointer",
                background: "transparent",
                border: "none",
                fontFamily: TOKENS.mono,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: ".14em",
                color: TOKENS.ink,
                opacity: 0.5,
                marginTop: 12,
                padding: 8,
                textTransform: "uppercase",
              }}
            >
              ‹ back to vibes
            </button>
          </div>
        )}

        {/* ── BEAT 3: Sparkle working ── */}
        {beat === "working" && (
          <div style={{ position: "relative", zIndex: 2, flex: 1, display: "flex", flexDirection: "column" }}>
            <span style={{ fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800, letterSpacing: ".14em", opacity: 0.55, color: TOKENS.ink }}>STEP 3 OF 3 · LIVE</span>
            <h1 style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 32, lineHeight: 0.94, letterSpacing: "-0.04em", color: TOKENS.ink, margin: "8px 0 20px" }}>
              Sparkle is printing<br />your pass…
            </h1>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 0" }}>
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 88,
                height: 88,
                borderRadius: "50%",
                border: `3px solid ${TOKENS.ink}`,
                background: TOKENS.accent1,
                fontFamily: TOKENS.display,
                fontWeight: 900,
                fontSize: 44,
                color: TOKENS.ink,
                animation: "cf-spin 2.4s linear infinite",
                boxShadow: `5px 5px 0 ${TOKENS.ink}`,
              }}>✣</span>
            </div>

            {agent && (
              <div style={{
                display: "inline-flex",
                alignSelf: "center",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                marginBottom: 14,
                background: TOKENS.paper,
                border: `2.5px solid ${TOKENS.ink}`,
                borderRadius: 999,
                boxShadow: `3px 3px 0 ${TOKENS.ink}`,
                fontFamily: TOKENS.mono,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: ".12em",
                color: TOKENS.ink,
                animation: "cf-pop 0.3s ease-out",
              }}>
                ROUTED → {agent.toUpperCase()}
              </div>
            )}

            <div style={{
              background: TOKENS.paper,
              border: `2.5px solid ${TOKENS.ink}`,
              borderRadius: 14,
              boxShadow: `4px 4px 0 ${TOKENS.ink}`,
              padding: 14,
              minHeight: 140,
              fontFamily: TOKENS.mono,
              fontSize: 11,
              lineHeight: 1.7,
              color: TOKENS.ink,
            }}>
              {reasoning.length === 0 && <div style={{ opacity: 0.4 }}>booting agents…</div>}
              {reasoning.map((r, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    animation: "cf-slideup-text 0.3s ease-out",
                    opacity: i === reasoning.length - 1 ? 1 : 0.55,
                  }}
                >
                  <span style={{
                    width: 5,
                    height: 5,
                    borderRadius: 999,
                    background: i === reasoning.length - 1 ? TOKENS.accent1 : TOKENS.ink,
                    flexShrink: 0,
                  }} />
                  <span>{r}</span>
                </div>
              ))}
            </div>

            {err && (
              <div style={{ marginTop: 12, padding: "10px 12px", background: TOKENS.accent1, border: `2.5px solid ${TOKENS.ink}`, borderRadius: 10, fontFamily: TOKENS.mono, fontSize: 11, fontWeight: 700 }}>
                {err}
              </div>
            )}
          </div>
        )}

        {/* ── BEAT 4: reveal the pass ── */}
        {beat === "reveal" && pass && (
          <div style={{ position: "relative", zIndex: 2, flex: 1, display: "flex", flexDirection: "column" }}>
            <ConfettiBurst active={burst} />

            <span style={{ fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800, letterSpacing: ".14em", opacity: 0.55, color: TOKENS.ink }}>YOUR PASS · PREVIEW</span>
            <h1 style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 28, lineHeight: 0.94, letterSpacing: "-0.04em", color: TOKENS.ink, margin: "6px 0 14px" }}>
              {pass.title}
            </h1>

            <Ticket color={TOKENS.paper} style={{ padding: 14, marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ padding: "4px 8px", background: TOKENS.accent2, border: `2px solid ${TOKENS.ink}`, borderRadius: 999, fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".14em" }}>
                  {(city ?? "").toUpperCase()} · {budget}
                </span>
                <span style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, opacity: 0.5, letterSpacing: ".12em" }}>
                  {pass.duration} · {pass.totalCost}
                </span>
              </div>
              {pass.stops.map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: "8px 0",
                    borderTop: i ? `1.5px dashed ${TOKENS.ink}` : "none",
                    opacity: 0,
                    animation: `cf-slideup-text 0.4s ${0.2 + i * 0.18}s forwards ease-out`,
                  } as CSSProperties}
                >
                  <span style={{
                    flexShrink: 0,
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    border: `2px solid ${TOKENS.ink}`,
                    background: [TOKENS.accent1, TOKENS.accent2, TOKENS.accent3][i % 3],
                    fontFamily: TOKENS.display,
                    fontWeight: 900,
                    fontSize: 11,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: i === 2 ? TOKENS.paper : TOKENS.ink,
                  }}>
                    {i + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 16, letterSpacing: "-0.02em" }}>{s.name}</span>
                      <span style={{ flexShrink: 0, fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 700, letterSpacing: ".08em", opacity: 0.6 }}>{s.time}</span>
                    </div>
                    <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 700, letterSpacing: ".1em", opacity: 0.55, textTransform: "uppercase", marginTop: 1 }}>{s.kind}</div>
                    {s.must && (
                      <div style={{ fontFamily: TOKENS.ui, fontSize: 11.5, fontWeight: 600, marginTop: 4, lineHeight: 1.35 }}>↳ {s.must}</div>
                    )}
                  </div>
                </div>
              ))}
            </Ticket>

            <div style={{ padding: "10px 12px", marginBottom: 12, background: "rgba(19,11,13,0.04)", border: `1.5px dashed ${TOKENS.ink}`, borderRadius: 10, fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 600, color: TOKENS.ink, opacity: 0.75, lineHeight: 1.5 }}>
              ↳ chosen for: {budget} budget · walking distance · {VIBES.find((v) => v.id === vibe)?.label ?? "your vibe"}
            </div>

            <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                onClick={() => navigate({ to: "/new/signup" })}
                style={{
                  appearance: "none",
                  cursor: "pointer",
                  padding: "14px 16px",
                  border: `3px solid ${TOKENS.ink}`,
                  borderRadius: 14,
                  background: TOKENS.accent1,
                  color: TOKENS.ink,
                  fontFamily: TOKENS.display,
                  fontWeight: 900,
                  fontSize: 17,
                  letterSpacing: "-0.02em",
                  boxShadow: `5px 5px 0 ${TOKENS.ink}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                save + invite the crew →
              </button>
              <button
                onClick={() => {
                  setBeat("pick-vibe");
                  setVibe(null); setCity(null); setBudget(null);
                  setPass(null); setReasoning([]); setAgent(null);
                }}
                style={{
                  appearance: "none",
                  cursor: "pointer",
                  padding: "10px 14px",
                  border: `2.5px solid ${TOKENS.ink}`,
                  borderRadius: 12,
                  background: TOKENS.paper,
                  color: TOKENS.ink,
                  fontFamily: TOKENS.ui,
                  fontWeight: 800,
                  fontSize: 12,
                  boxShadow: `3px 3px 0 ${TOKENS.ink}`,
                }}
              >
                ↻ try another vibe
              </button>
            </div>
          </div>
        )}
      </div>
    </Frame>
  );
}
