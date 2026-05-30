import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { DotsBg, Frame, TOKENS } from "@/components/new-confetti/shell";

// Port of CalendarScreen — design/new-confetti/project/new-screens-3.jsx

export const Route = createFileRoute("/new/calendar")({
  component: CalendarPage,
});

const DAYS = [
  { d: "fri", n: 23, isToday: false },
  { d: "sat", n: 24, isToday: false },
  { d: "sun", n: 25, isToday: true },
  { d: "mon", n: 26, isToday: false },
  { d: "tue", n: 27, isToday: false },
  { d: "wed", n: 28, isToday: false },
  { d: "thu", n: 29, isToday: false },
];

const ITEMS = [
  { day: 24, time: "7:30p", kind: "plan", t: "date night LES", sub: "lupa → westlight → skinny dennis", c: TOKENS.accent1, booked: true },
  { day: 25, time: "11a", kind: "booking", t: "brunch · Olmsted", sub: "pre-ordered · 3 covers", c: TOKENS.accent4, booked: true },
  { day: 27, time: "6:30p", kind: "event", t: "Pearl Charles live", sub: "Baby's All Right · 8 tix left", c: TOKENS.accent2, booked: false },
  { day: 29, time: "7p", kind: "plan", t: "family park day", sub: "prospect park → carousel", c: TOKENS.accent3, textLight: true, booked: true },
];

function CalendarPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<"week" | "list">("week");

  return (
    <Frame>
      <div
        style={{
          position: "relative",
          height: "100dvh",
          background: TOKENS.bg,
          display: "flex",
          flexDirection: "column",
          padding: "56px 0 24px",
          overflow: "hidden",
        }}
      >
        <DotsBg opacity={0.05} />

        {/* Header */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            padding: "0 22px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <button onClick={() => navigate({ to: "/new/hub" })} style={backBtn}>←</button>
          <h2 style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 22, letterSpacing: "-0.035em", margin: 0 }}>this week</h2>
          <span style={{ padding: "4px 10px", background: TOKENS.accent2, border: `2px solid ${TOKENS.ink}`, borderRadius: 999, fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800, letterSpacing: ".1em" }}>
            {ITEMS.length}
          </span>
        </div>

        {/* View toggle */}
        <div style={{ position: "relative", zIndex: 2, padding: "0 22px 8px", display: "flex", gap: 6 }}>
          {(["week", "list"] as const).map((id) => (
            <button key={id} onClick={() => setView(id)} style={{ appearance: "none", cursor: "pointer", flex: 1, padding: "8px 12px", border: `2.5px solid ${TOKENS.ink}`, borderRadius: 999, background: view === id ? TOKENS.ink : TOKENS.paper, color: view === id ? TOKENS.paper : TOKENS.ink, fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 800, boxShadow: view === id ? "none" : `2px 2px 0 ${TOKENS.ink}` }}>
              {id}
            </button>
          ))}
        </div>

        {/* Day strip */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            padding: "4px 22px 8px",
            display: "flex",
            gap: 4,
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
        >
          {DAYS.map((d) => {
            const count = ITEMS.filter((it) => it.day === d.n).length;
            return (
              <button
                key={d.n}
                style={{
                  appearance: "none",
                  cursor: "pointer",
                  flexShrink: 0,
                  minWidth: 48,
                  padding: "8px 4px",
                  border: `2.5px solid ${TOKENS.ink}`,
                  borderRadius: 12,
                  background: d.isToday ? TOKENS.accent1 : count > 0 ? TOKENS.paper : "transparent",
                  color: TOKENS.ink,
                  boxShadow: count > 0 ? `2px 2px 0 ${TOKENS.ink}` : "none",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <span style={{ fontFamily: TOKENS.mono, fontSize: 8.5, fontWeight: 800, letterSpacing: ".1em", color: TOKENS.inkHint, textTransform: "uppercase" }}>{d.d}</span>
                <span style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 16, letterSpacing: "-0.02em" }}>{d.n}</span>
                <span style={{ fontFamily: TOKENS.mono, fontSize: 8, fontWeight: 800, letterSpacing: ".06em", color: count > 0 ? TOKENS.ink : TOKENS.inkHint }}>
                  {count > 0 ? `· ${count} ·` : "—"}
                </span>
              </button>
            );
          })}
        </div>

        {/* List */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            flex: 1,
            overflowY: "auto",
            padding: "4px 22px 12px",
            scrollbarWidth: "none",
          }}
        >
          {ITEMS.map((it, i) => {
            const day = DAYS.find((d) => d.n === it.day);
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 10,
                  padding: 12,
                  marginBottom: 8,
                  border: `2.5px solid ${TOKENS.ink}`,
                  borderRadius: 12,
                  background: it.c,
                  color: it.textLight ? TOKENS.paper : TOKENS.ink,
                  boxShadow: `3px 3px 0 ${TOKENS.ink}`,
                }}
              >
                <div
                  style={{
                    flexShrink: 0,
                    minWidth: 56,
                    padding: "4px 6px",
                    background: "rgba(0,0,0,0.18)",
                    border: "1.5px solid currentColor",
                    borderRadius: 8,
                    fontFamily: TOKENS.mono,
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: ".06em",
                    textAlign: "center",
                  }}
                >
                  <div>{day?.d.toUpperCase()} {it.day}</div>
                  <div style={{ fontSize: 13, fontWeight: 900, marginTop: 1, fontFamily: TOKENS.display, letterSpacing: "-0.02em" }}>{it.time}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: TOKENS.mono, fontSize: 8.5, fontWeight: 800, letterSpacing: ".14em", opacity: 0.7, textTransform: "uppercase" }}>
                    {it.kind} {it.booked && "· ✓ booked"}
                  </div>
                  <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 16, letterSpacing: "-0.025em", marginTop: 2 }}>{it.t}</div>
                  <div style={{ fontFamily: TOKENS.ui, fontSize: 11, fontWeight: 700, opacity: 0.75, marginTop: 2, lineHeight: 1.3 }}>{it.sub}</div>
                </div>
              </div>
            );
          })}

          <button
            onClick={() => navigate({ to: "/new/plan" })}
            style={{ appearance: "none", cursor: "pointer", width: "100%", padding: "14px 16px", marginTop: 6, border: `2.5px dashed ${TOKENS.ink}`, borderRadius: 14, background: "transparent", color: TOKENS.ink, fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 800 }}
          >
            ＋ plan a new night
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
