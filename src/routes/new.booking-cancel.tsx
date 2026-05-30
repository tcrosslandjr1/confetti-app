import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { DotsBg, Frame, TOKENS } from "@/components/new-confetti/shell";

// Port of BookingCancelScreen — design/new-confetti/project/new-screens-4.jsx

export const Route = createFileRoute("/new/booking-cancel")({
  component: BookingCancelPage,
});

type Phase = "confirm" | "reason" | "processing" | "done";

const REASONS = [
  { id: "sick", l: "feeling sick", icon: "🤒" },
  { id: "cancel-night", l: "cancelling whole night", icon: "↺" },
  { id: "late", l: "running too late", icon: "⏱" },
  { id: "group", l: "group changed plans", icon: "👥" },
  { id: "venue", l: "venue issue (loud, closed, etc)", icon: "⚠" },
  { id: "other", l: "other", icon: "…" },
];

const STOP_NAME = "Lupa Notte";
const STOP_TIME = "8:30 PM";

function BookingCancelPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("confirm");

  const confirmCancel = () => {
    setPhase("processing");
    setTimeout(() => setPhase("done"), 1500);
  };

  // Done
  if (phase === "done") {
    return (
      <Frame>
        <div style={{ position: "relative", height: "100dvh", background: TOKENS.bg, display: "flex", flexDirection: "column", padding: "56px 22px 24px", overflow: "hidden" }}>
          <DotsBg opacity={0.05} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 14 }}>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 80, height: 80, borderRadius: "50%", background: TOKENS.accent4, border: `3px solid ${TOKENS.ink}`, boxShadow: `5px 5px 0 ${TOKENS.ink}`, fontSize: 38 }}>✓</span>
            <h2 style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 28, letterSpacing: "-0.04em", margin: 0 }}>cancelled.</h2>
            <p style={{ fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 700, color: TOKENS.inkMuted, maxWidth: 260, margin: 0, lineHeight: 1.45 }}>
              {STOP_NAME} at {STOP_TIME} is off your pass. $22 back on your card in 1-3 days.
            </p>
            <div style={{ padding: "8px 12px", background: TOKENS.accent2, border: `2px solid ${TOKENS.ink}`, borderRadius: 10, fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800, letterSpacing: ".06em", maxWidth: 260, lineHeight: 1.4 }}>
              ✣ sparkle can replace this stop · same vibe, similar price?
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
              <button onClick={() => navigate({ to: "/new/chat" })} style={{ appearance: "none", cursor: "pointer", padding: "12px 22px", border: `3px solid ${TOKENS.ink}`, borderRadius: 12, background: TOKENS.accent1, color: TOKENS.ink, fontFamily: TOKENS.display, fontWeight: 900, fontSize: 15, letterSpacing: "-0.02em", boxShadow: `4px 4px 0 ${TOKENS.ink}` }}>
                ✣ find me a replacement
              </button>
              <button onClick={() => navigate({ to: "/new/pass" })} style={{ appearance: "none", cursor: "pointer", padding: "10px 16px", border: `2px solid ${TOKENS.ink}`, borderRadius: 10, background: TOKENS.paper, color: TOKENS.ink, fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 800 }}>
                no thanks — back to pass
              </button>
            </div>
          </div>
        </div>
      </Frame>
    );
  }

  // Processing
  if (phase === "processing") {
    return (
      <Frame>
        <div style={{ position: "relative", height: "100dvh", background: TOKENS.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 22 }}>
          <DotsBg opacity={0.05} />
          <div style={{ textAlign: "center", position: "relative", zIndex: 2 }}>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 70, height: 70, borderRadius: "50%", background: TOKENS.ink, color: TOKENS.paper, animation: "cf-spin 1.2s linear infinite", fontFamily: TOKENS.display, fontWeight: 900, fontSize: 28 }}>↻</span>
            <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 22, letterSpacing: "-0.035em", marginTop: 14 }}>cancelling…</div>
            <div style={{ fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 700, letterSpacing: ".1em", color: TOKENS.inkHint, marginTop: 4 }}>NOTIFYING {STOP_NAME.toUpperCase()}</div>
          </div>
        </div>
      </Frame>
    );
  }

  // Reason picker
  if (phase === "reason") {
    return (
      <Frame>
        <div style={{ position: "relative", height: "100dvh", background: TOKENS.bg, display: "flex", flexDirection: "column", padding: "56px 22px 24px", overflow: "hidden" }}>
          <DotsBg opacity={0.05} />
          <div style={{ marginBottom: 14 }}><button onClick={() => setPhase("confirm")} style={backBtn}>←</button></div>
          <h2 style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 26, letterSpacing: "-0.04em", margin: "0 0 4px" }}>what happened?</h2>
          <p style={{ fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 700, color: TOKENS.inkMuted, margin: "0 0 16px" }}>helps us learn — pick one and we'll cancel.</p>
          <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
            {REASONS.map((r) => (
              <button key={r.id} onClick={confirmCancel} style={{ appearance: "none", cursor: "pointer", textAlign: "left", width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", marginBottom: 6, border: `2.5px solid ${TOKENS.ink}`, borderRadius: 12, background: TOKENS.paper, boxShadow: `3px 3px 0 ${TOKENS.ink}` }}>
                <span style={{ fontSize: 20 }}>{r.icon}</span>
                <span style={{ flex: 1, fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 800, color: TOKENS.ink }}>{r.l}</span>
                <span style={{ color: TOKENS.inkHint, fontSize: 16, fontWeight: 900 }}>›</span>
              </button>
            ))}
          </div>
        </div>
      </Frame>
    );
  }

  // Confirm screen
  return (
    <Frame>
      <div style={{ position: "relative", height: "100dvh", background: TOKENS.bg, display: "flex", flexDirection: "column", padding: "56px 22px 24px", overflow: "hidden" }}>
        <DotsBg opacity={0.05} />
        <div style={{ marginBottom: 14 }}><button onClick={() => navigate({ to: "/new/pass" })} style={backBtn}>←</button></div>

        <span style={{ fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800, letterSpacing: ".14em", color: TOKENS.inkHint }}>CANCEL THIS STOP</span>
        <h2 style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 28, letterSpacing: "-0.04em", margin: "6px 0 14px" }}>{STOP_NAME}</h2>

        {/* Stop card */}
        <div style={{ padding: 14, marginBottom: 14, border: `2.5px solid ${TOKENS.ink}`, borderRadius: 14, background: TOKENS.paper, boxShadow: `4px 4px 0 ${TOKENS.ink}` }}>
          <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".14em", color: TOKENS.inkHint, marginBottom: 4 }}>YOUR BOOKING</div>
          <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 20, letterSpacing: "-0.03em" }}>{STOP_NAME}</div>
          <div style={{ fontFamily: TOKENS.ui, fontSize: 12.5, fontWeight: 700, color: TOKENS.inkMuted, marginTop: 4 }}>
            {STOP_TIME} · table for 2 · 88 N 6th St
          </div>
          <div style={{ marginTop: 10, padding: "8px 10px", background: "rgba(43,182,115,0.18)", border: `1.5px dashed ${TOKENS.ink}`, borderRadius: 8, fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800, letterSpacing: ".04em" }}>
            💸 $22 refundable · 24h hold released
          </div>
        </div>

        {/* Policy */}
        <div style={{ padding: "10px 12px", marginBottom: 14, background: "rgba(255,255,255,0.5)", border: `1.5px dashed ${TOKENS.ink}`, borderRadius: 10, fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 700, letterSpacing: ".04em", lineHeight: 1.5, color: TOKENS.inkMuted }}>
          ✓ free cancel until 4h before<br />
          ✓ {STOP_NAME} is notified instantly<br />
          ✓ sparkle can find a replacement stop
        </div>

        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
          <button onClick={() => setPhase("reason")} style={{ appearance: "none", cursor: "pointer", padding: "14px 16px", border: `3px solid ${TOKENS.ink}`, borderRadius: 14, background: "#d32323", color: "#fff", fontFamily: TOKENS.display, fontWeight: 900, fontSize: 16, letterSpacing: "-0.02em", boxShadow: `5px 5px 0 ${TOKENS.ink}` }}>
            cancel this stop →
          </button>
          <button onClick={() => navigate({ to: "/new/pass" })} style={{ appearance: "none", cursor: "pointer", padding: "12px 14px", border: `2.5px solid ${TOKENS.ink}`, borderRadius: 12, background: TOKENS.paper, color: TOKENS.ink, fontFamily: TOKENS.ui, fontWeight: 800, fontSize: 13 }}>
            keep the booking
          </button>
        </div>
      </div>
    </Frame>
  );
}

const backBtn: React.CSSProperties = {
  appearance: "none",
  cursor: "pointer",
  width: 36,
  height: 36,
  borderRadius: 999,
  border: `2.5px solid ${TOKENS.ink}`,
  background: TOKENS.paper,
  fontSize: 14,
  fontWeight: 900,
  boxShadow: `3px 3px 0 ${TOKENS.ink}`,
};
