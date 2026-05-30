import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { DotsBg, Frame, TOKENS } from "@/components/new-confetti/shell";

// Port of SavedScreen — design/new-confetti/project/new-screens-1.jsx

export const Route = createFileRoute("/new/saved")({
  component: SavedPage,
});

const SAVED = [
  { id: "westlight", name: "Westlight", tag: "rooftop · $$$", nbhd: "Williamsburg", savedOn: "4d ago", vibe: "romantic", kidsMenu: false, c: TOKENS.accent1 },
  { id: "lupa", name: "Lupa Notte", tag: "italian · $$", nbhd: "Williamsburg", savedOn: "1w ago", vibe: "date", kidsMenu: true, c: TOKENS.accent2 },
  { id: "olmsted", name: "Olmsted", tag: "tasting · $$$", nbhd: "Prospect Hts", savedOn: "2w ago", vibe: "foodie", kidsMenu: false, c: TOKENS.accent3 },
  { id: "cabin", name: "The Cabin", tag: "rooftop · $$", nbhd: "East Williamsburg", savedOn: "3w ago", vibe: "hype", kidsMenu: false, c: TOKENS.paper },
  { id: "pizza", name: "Pizza Moto", tag: "pizza · $", nbhd: "Red Hook", savedOn: "1mo", vibe: "family", kidsMenu: true, c: TOKENS.accent2 },
];

const COLLECTIONS = [
  { id: "date", name: "date nights", count: 12, color: TOKENS.accent1, emoji: "🌹" },
  { id: "kids", name: "kid-welcome", count: 8, color: TOKENS.accent2, emoji: "🧒" },
  { id: "rooftop", name: "rooftops", count: 5, color: TOKENS.accent3, emoji: "🏙" },
  { id: "cheap", name: "under $20", count: 14, color: TOKENS.paper, emoji: "💸" },
];

function SavedPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<"list" | "collections">("list");

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
            padding: "0 22px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <button onClick={() => navigate({ to: "/new/hub" })} style={backBtn}>
            ←
          </button>
          <h2 style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 24, letterSpacing: "-0.035em", margin: 0 }}>
            saved
          </h2>
          <span style={{ fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800, color: TOKENS.inkHint, letterSpacing: ".1em" }}>
            {SAVED.length} venues
          </span>
        </div>

        {/* View toggle */}
        <div style={{ position: "relative", zIndex: 2, padding: "0 22px 12px", display: "flex", gap: 6 }}>
          {(["list", "collections"] as const).map((id) => (
            <button
              key={id}
              onClick={() => setView(id)}
              style={{
                appearance: "none",
                cursor: "pointer",
                flex: 1,
                padding: "8px 12px",
                border: `2.5px solid ${TOKENS.ink}`,
                borderRadius: 999,
                background: view === id ? TOKENS.ink : TOKENS.paper,
                color: view === id ? TOKENS.paper : TOKENS.ink,
                fontFamily: TOKENS.ui,
                fontSize: 12,
                fontWeight: 800,
                boxShadow: view === id ? "none" : `3px 3px 0 ${TOKENS.ink}`,
              }}
            >
              {id}
            </button>
          ))}
        </div>

        {/* Content */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            flex: 1,
            overflowY: "auto",
            padding: "0 22px 12px",
            scrollbarWidth: "none",
          }}
        >
          {view === "list" &&
            SAVED.map((v) => (
              <div
                key={v.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  marginBottom: 8,
                  border: `2.5px solid ${TOKENS.ink}`,
                  borderRadius: 14,
                  background: v.c,
                  boxShadow: `3px 3px 0 ${TOKENS.ink}`,
                }}
              >
                <button
                  onClick={() => navigate({ to: "/new/venue" })}
                  style={{ flex: 1, appearance: "none", cursor: "pointer", textAlign: "left", background: "transparent", border: "none", padding: 0, display: "flex", flexDirection: "column", gap: 2 }}
                >
                  <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".14em", color: TOKENS.inkHint, textTransform: "uppercase" }}>
                    {v.tag} · {v.nbhd}
                  </div>
                  <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 18, letterSpacing: "-0.025em", lineHeight: 1, color: TOKENS.ink }}>
                    {v.name}
                  </div>
                  <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                    <span style={{ padding: "2px 7px", background: TOKENS.paper, border: `1.5px solid ${TOKENS.ink}`, borderRadius: 999, fontFamily: TOKENS.mono, fontSize: 8.5, fontWeight: 800, letterSpacing: ".06em" }}>
                      {v.vibe}
                    </span>
                    {v.kidsMenu && (
                      <span style={{ padding: "2px 7px", background: TOKENS.accent4, border: `1.5px solid ${TOKENS.ink}`, borderRadius: 999, fontFamily: TOKENS.mono, fontSize: 8.5, fontWeight: 800, letterSpacing: ".06em" }}>
                        🍴 kids menu
                      </span>
                    )}
                    <span style={{ fontFamily: TOKENS.mono, fontSize: 8.5, fontWeight: 700, color: TOKENS.inkHint, alignSelf: "center" }}>
                      saved {v.savedOn}
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => navigate({ to: "/new/plan" })}
                  style={{
                    appearance: "none",
                    cursor: "pointer",
                    padding: "7px 10px",
                    border: `2px solid ${TOKENS.ink}`,
                    borderRadius: 999,
                    background: TOKENS.ink,
                    color: TOKENS.paper,
                    fontFamily: TOKENS.mono,
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: ".1em",
                  }}
                >
                  + PASS
                </button>
              </div>
            ))}

          {view === "collections" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {COLLECTIONS.map((c) => (
                <button
                  key={c.id}
                  style={{
                    appearance: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    padding: 14,
                    border: `2.5px solid ${TOKENS.ink}`,
                    borderRadius: 14,
                    background: c.color,
                    color: TOKENS.ink,
                    boxShadow: `4px 4px 0 ${TOKENS.ink}`,
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    minHeight: 110,
                  }}
                >
                  <span style={{ fontSize: 26, lineHeight: 1 }}>{c.emoji}</span>
                  <span style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 16, letterSpacing: "-0.025em", marginTop: 4 }}>
                    {c.name}
                  </span>
                  <span style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".1em", color: TOKENS.inkHint, marginTop: "auto", textTransform: "uppercase" }}>
                    {c.count} VENUES
                  </span>
                </button>
              ))}
              <button
                style={{
                  appearance: "none",
                  cursor: "pointer",
                  textAlign: "center",
                  padding: 14,
                  minHeight: 110,
                  border: `2.5px dashed ${TOKENS.ink}`,
                  borderRadius: 14,
                  background: "transparent",
                  color: TOKENS.ink,
                  fontFamily: TOKENS.ui,
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                + new collection
              </button>
            </div>
          )}
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
