import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Frame, Stamp, TOKENS } from "@/components/new-confetti/shell";

export const Route = createFileRoute("/new/confetti-cam")({ component: ConfettiCamPage });

type Phase = "shoot" | "preview" | "posted";
type FilterId = "classic" | "warm" | "film" | "midnight" | "bw";

const FILTERS: { id: FilterId; label: string; overlay: string }[] = [
  { id: "classic",  label: "Classic",  overlay: "transparent" },
  { id: "warm",     label: "Warm",     overlay: "rgba(255,91,61,0.18)" },
  { id: "film",     label: "Film",     overlay: "rgba(247,200,59,0.16)" },
  { id: "midnight", label: "Midnight", overlay: "rgba(11,18,32,0.36)" },
  { id: "bw",       label: "B&W",      overlay: "rgba(0,0,0,0.35)" },
];

const CAPTIONS = [
  { t: "this carbonara healed me 🍝",         tags: "#brooklynnight #confetti #lupa" },
  { t: "we ate. we cried. we ate more.",       tags: "#bk #datenight #carbonara" },
  { t: "when the pass says lupa, you listen",  tags: "#confettiapp #foodietok #brooklyn" },
];

const POST_TARGETS = [
  { k: "tiktok", label: "TikTok",         bg: TOKENS.ink,    fg: TOKENS.paper, on: true  },
  { k: "ig",     label: "Instagram",      bg: TOKENS.accent3, fg: TOKENS.paper, on: true  },
  { k: "feed",   label: "Confetti feed",  bg: TOKENS.accent1, fg: TOKENS.ink,   on: true  },
  { k: "save",   label: "Save draft",     bg: TOKENS.paper,   fg: TOKENS.ink,   on: false },
];

function ShootScreen({
  filter, setFilter, recording, setRecording, seconds,
  onBack, onNext,
}: {
  filter: FilterId; setFilter: (f: FilterId) => void;
  recording: boolean; setRecording: (r: boolean) => void;
  seconds: number; onBack: () => void; onNext: () => void;
}) {
  return (
    <div className="cf-screen" style={{
      position: "relative", height: "100dvh",
      background: "#0a0a0a", color: TOKENS.paper,
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(circle at 50% 40%, #2a1a1a 0%, #0a0808 80%)",
      }} />
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: FILTERS.find((f) => f.id === filter)!.overlay,
      }} />
      {/* Header */}
      <div style={{
        position: "absolute", top: 56, left: 16, right: 16, zIndex: 20,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <button onClick={onBack} style={{
          appearance: "none", cursor: "pointer",
          width: 38, height: 38, borderRadius: 999,
          border: `2px solid ${TOKENS.paper}`, background: "rgba(0,0,0,0.4)", color: TOKENS.paper,
          fontSize: 16, fontWeight: 900, backdropFilter: "blur(20px)",
        }}>✕</button>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px",
          border: `2px solid ${TOKENS.paper}`, borderRadius: 999,
          background: "rgba(0,0,0,0.45)",
          fontFamily: TOKENS.display, fontWeight: 900, fontSize: 14,
          backdropFilter: "blur(20px)",
        }}>
          <span style={{ color: TOKENS.accent1 }}>✣</span> confetti cam
        </div>
        <div style={{ width: 38 }} />
      </div>
      {recording && (
        <div style={{
          position: "absolute", top: 110, left: "50%", transform: "translateX(-50%)", zIndex: 20,
          padding: "5px 12px", background: "#d32323", color: TOKENS.paper,
          border: `2px solid ${TOKENS.paper}`, borderRadius: 999,
          fontFamily: TOKENS.mono, fontSize: 12, fontWeight: 800, letterSpacing: ".12em",
          display: "inline-flex", alignItems: "center", gap: 6,
        }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: TOKENS.paper, animation: "cf-pulse 1s infinite" }} />
          REC · {seconds.toFixed(1)}S
        </div>
      )}
      {/* Watermark */}
      <div style={{
        position: "absolute", bottom: 200, left: 16, zIndex: 15,
        display: "flex", alignItems: "center", gap: 6, padding: "6px 11px",
        background: "rgba(0,0,0,0.55)", border: `1.5px solid ${TOKENS.paper}`, borderRadius: 6,
        fontFamily: TOKENS.display, fontWeight: 900, fontSize: 14, letterSpacing: "-0.02em",
        backdropFilter: "blur(10px)",
      }}>
        <span style={{ color: TOKENS.accent1 }}>✣</span> confetti.app · #A7K2
      </div>
      {/* Filter strip */}
      <div style={{
        position: "absolute", bottom: 130, left: 0, right: 0, zIndex: 15,
        display: "flex", gap: 8, padding: "0 16px", overflowX: "auto", scrollbarWidth: "none",
      }}>
        {FILTERS.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            appearance: "none", cursor: "pointer", flexShrink: 0, padding: "8px 14px",
            border: `2px solid ${TOKENS.paper}`, borderRadius: 999,
            background: filter === f.id ? TOKENS.accent1 : "rgba(0,0,0,0.45)",
            color: filter === f.id ? TOKENS.ink : TOKENS.paper,
            fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 800, backdropFilter: "blur(10px)",
          }}>{f.label}</button>
        ))}
      </div>
      {/* Controls */}
      <div style={{
        position: "absolute", bottom: 40, left: 0, right: 0, zIndex: 20,
        display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 30px",
      }}>
        <div style={{ width: 56, height: 56, borderRadius: 12, border: `2.5px solid ${TOKENS.paper}`, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>📷</div>
        <button onClick={() => { if (recording) { setRecording(false); onNext(); } else setRecording(true); }} style={{
          appearance: "none", cursor: "pointer",
          width: 84, height: 84, borderRadius: 999,
          border: `5px solid ${TOKENS.paper}`,
          background: recording ? "#d32323" : TOKENS.accent1,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 0 4px rgba(255,250,240,0.2)`,
        }}>
          <span style={{
            width: recording ? 22 : 64, height: recording ? 22 : 64,
            borderRadius: recording ? 4 : 999, background: TOKENS.paper, transition: "all .2s",
          }} />
        </button>
        <div style={{ width: 56, height: 56, borderRadius: 12, border: `2.5px solid ${TOKENS.paper}`, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🖼</div>
      </div>
    </div>
  );
}

function PreviewScreen({
  filter, onBack, onPost,
}: {
  filter: FilterId; onBack: () => void; onPost: () => void;
}) {
  const [selectedCaption, setSelectedCaption] = useState(0);
  return (
    <div className="cf-screen" style={{
      position: "relative", height: "100dvh", background: TOKENS.bg,
      display: "flex", flexDirection: "column", padding: "56px 22px 24px", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.05, backgroundImage: `radial-gradient(${TOKENS.ink} 1px, transparent 1px)`, backgroundSize: "22px 22px" }} />
      <div style={{
        position: "relative", zIndex: 2,
        display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14,
      }}>
        <button onClick={onBack} style={{
          appearance: "none", cursor: "pointer",
          width: 36, height: 36, borderRadius: 999,
          border: `2.5px solid ${TOKENS.ink}`, background: TOKENS.paper,
          fontSize: 14, fontWeight: 900, color: TOKENS.ink, boxShadow: `3px 3px 0 ${TOKENS.ink}`,
        }}>←</button>
        <Stamp color={TOKENS.accent1} rotate={-2}>preview · post</Stamp>
        <span style={{ width: 36 }} />
      </div>
      <div style={{ position: "relative", zIndex: 2, flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
        {/* Preview + meta */}
        <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
          <div style={{
            width: 130, flexShrink: 0, aspectRatio: "9/16",
            border: `2.5px solid ${TOKENS.ink}`, borderRadius: 12,
            background: TOKENS.accent3, overflow: "hidden", position: "relative",
            backgroundImage: "repeating-linear-gradient(135deg, rgba(0,0,0,0.1) 0 12px, transparent 12px 24px)",
            boxShadow: `4px 4px 0 ${TOKENS.ink}`,
          }}>
            <div style={{
              position: "absolute", bottom: 12, left: 8,
              padding: "4px 8px", background: "rgba(0,0,0,0.55)", color: TOKENS.paper,
              border: `1.5px solid ${TOKENS.paper}`, borderRadius: 4,
              fontFamily: TOKENS.display, fontWeight: 900, fontSize: 9,
            }}><span style={{ color: TOKENS.accent1 }}>✣</span> confetti.app · #A7K2</div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 22, letterSpacing: "-0.025em", lineHeight: 1.1, margin: "0 0 6px", color: TOKENS.ink }}>2.4 sec clip ready.</h3>
            <div style={{ fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 700, color: TOKENS.ink, opacity: 0.6, letterSpacing: ".08em", marginBottom: 10, textTransform: "uppercase" as const }}>{filter.toUpperCase()} FILTER · 9:16</div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
              <span style={{ padding: "4px 10px", background: TOKENS.accent2, border: `2px solid ${TOKENS.ink}`, borderRadius: 999, fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800, letterSpacing: ".1em", alignSelf: "flex-start" }}>STOP 2 · LUPA NOTTE</span>
              <span style={{ padding: "4px 10px", background: TOKENS.accent1, border: `2px solid ${TOKENS.ink}`, borderRadius: 999, fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800, letterSpacing: ".1em", alignSelf: "flex-start" }}>+25 PTS WHEN POSTED</span>
            </div>
          </div>
        </div>
        {/* Captions */}
        <div style={{ fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800, letterSpacing: ".14em", color: TOKENS.ink, opacity: 0.55, textTransform: "uppercase" as const, marginBottom: 8 }}>✣ CAPTION · 3 OPTIONS</div>
        {CAPTIONS.map((c, i) => (
          <div key={i} onClick={() => setSelectedCaption(i)} style={{
            padding: 12, marginBottom: 8,
            border: `2.5px solid ${TOKENS.ink}`, borderRadius: 12,
            background: selectedCaption === i ? TOKENS.accent1 : TOKENS.paper,
            boxShadow: selectedCaption === i ? `3px 3px 0 ${TOKENS.ink}` : "none",
            display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
          }}>
            <span style={{
              width: 22, height: 22, borderRadius: 999, border: `2px solid ${TOKENS.ink}`,
              background: selectedCaption === i ? TOKENS.ink : TOKENS.paper,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 900, color: selectedCaption === i ? TOKENS.paper : TOKENS.ink, flexShrink: 0,
            }}>{selectedCaption === i ? "✓" : ""}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 800, color: TOKENS.ink }}>{c.t}</div>
              <div style={{ fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 700, color: TOKENS.ink, opacity: 0.6, marginTop: 2 }}>{c.tags}</div>
            </div>
          </div>
        ))}
        {/* Post to */}
        <div style={{ fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800, letterSpacing: ".14em", color: TOKENS.ink, opacity: 0.55, textTransform: "uppercase" as const, marginBottom: 8, marginTop: 14 }}>POST TO</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {POST_TARGETS.map((p) => (
            <button key={p.k} style={{
              appearance: "none", cursor: "pointer",
              padding: "11px 12px", border: `2.5px solid ${TOKENS.ink}`, borderRadius: 12,
              background: p.on ? p.bg : TOKENS.paper, color: p.on ? p.fg : TOKENS.ink,
              fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 800,
              boxShadow: p.on ? `3px 3px 0 ${TOKENS.ink}` : "none",
              transform: p.on ? "translate(-1px,-1px)" : "none",
              textAlign: "left" as const,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ width: 16, height: 16, borderRadius: 999, background: p.on ? "currentColor" : "transparent", border: "2px solid currentColor" }} />
              {p.label}
            </button>
          ))}
        </div>
        <div style={{ height: 16 }} />
      </div>
      <div style={{ position: "relative", zIndex: 2, paddingTop: 14 }}>
        <button onClick={onPost} style={{
          appearance: "none", cursor: "pointer", width: "100%",
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10,
          padding: "16px 20px", border: `3px solid ${TOKENS.ink}`, borderRadius: 16,
          background: TOKENS.accent1, color: TOKENS.ink,
          fontFamily: TOKENS.ui, fontSize: 17, fontWeight: 900, boxShadow: `5px 5px 0 ${TOKENS.ink}`,
        }}>post + earn 25 pts →</button>
      </div>
    </div>
  );
}

function ConfettiCamPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("shoot");
  const [filter, setFilter] = useState<FilterId>("classic");
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => setSeconds((s) => s + 0.1), 100);
    return () => clearInterval(t);
  }, [recording]);

  if (phase === "posted") return (
    <Frame>
      <div className="cf-screen" style={{
        position: "relative", height: "100dvh", background: TOKENS.bg,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "56px 22px 24px",
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: 999,
          border: `4px solid ${TOKENS.ink}`, background: TOKENS.accent1,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontFamily: TOKENS.display, fontWeight: 900, fontSize: 40,
          animation: "cf-pop 0.4s cubic-bezier(.2,1.4,.4,1)", boxShadow: `5px 5px 0 ${TOKENS.ink}`,
          marginBottom: 16,
        }}>✓</div>
        <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 28, letterSpacing: "-0.025em", color: TOKENS.ink, textAlign: "center" as const }}>Posted + 25 pts earned.</div>
        <button onClick={() => navigate({ to: "/new/pass" })} style={{
          appearance: "none", cursor: "pointer", marginTop: 20,
          padding: "14px 24px", border: `2.5px solid ${TOKENS.ink}`, borderRadius: 14,
          background: TOKENS.accent2, color: TOKENS.ink,
          fontFamily: TOKENS.ui, fontSize: 15, fontWeight: 900, boxShadow: `3px 3px 0 ${TOKENS.ink}`,
        }}>back to pass →</button>
      </div>
    </Frame>
  );

  if (phase === "preview") return (
    <Frame>
      <PreviewScreen filter={filter} onBack={() => setPhase("shoot")} onPost={() => setPhase("posted")} />
    </Frame>
  );

  return (
    <Frame>
      <ShootScreen
        filter={filter} setFilter={setFilter}
        recording={recording} setRecording={setRecording}
        seconds={seconds}
        onBack={() => navigate({ to: "/new/pass" })}
        onNext={() => setPhase("preview")}
      />
    </Frame>
  );
}
