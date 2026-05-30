import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { TOKENS } from "@/components/new-confetti/shell";
import { togglePinnedVenue } from "@/lib/night-builder-store";

// Slim port — design/new-confetti/project/discover.jsx (ReelsScreen, line 378)
// Vertical TikTok-style reel with overlay UI.
export const Route = createFileRoute("/new/reels")({
  component: ReelsPage,
});

const REELS = [
  {
    who: "Sara",
    at: "Lupa Notte",
    color: TOKENS.accent1,
    caption: "the pasta. the lighting. unreal.",
  },
  { who: "Mike", at: "Skinny Dennis", color: TOKENS.accent3, caption: "$3 frozen marg energy." },
  { who: "Ren", at: "Daughter", color: TOKENS.accent2, caption: "best espresso in BK fight me." },
];

const chipStyle: React.CSSProperties = {
  padding: "6px 12px",
  border: `2px solid ${TOKENS.paper}`,
  borderRadius: 999,
  background: "rgba(0,0,0,0.35)",
  fontFamily: TOKENS.ui,
  fontSize: 12,
  fontWeight: 800,
  color: TOKENS.paper,
  backdropFilter: "blur(6px)",
  whiteSpace: "nowrap" as const,
};

function ReelsPage() {
  const navigate = useNavigate();
  const [i, setI] = useState(0);
  const [addedToast, setAddedToast] = useState(false);
  const r = REELS[i];
  const next = () => {
    setAddedToast(false);
    setI((n) => (n + 1) % REELS.length);
  };

  const handleAddStop = (e: React.MouseEvent) => {
    e.stopPropagation();
    togglePinnedVenue({
      venue_name: r.at,
      venue_slug: r.at.toLowerCase().replace(/\s+/g, "-"),
      category: null,
      neighborhood: null,
      snippet: null,
      outing: "reels",
    });
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2000);
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        background: "#0a0a0a",
        padding: 24,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "min(420px, 100%)",
          height: "min(874px, calc(100dvh - 48px))",
          overflow: "hidden",
          borderRadius: 28,
          background: r.color,
          boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
          cursor: "pointer",
        }}
        onClick={next}
      >
        {/* fake video area */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(180deg, transparent 0%, transparent 50%, rgba(0,0,0,0.55) 100%), ${r.color}`,
          }}
        />

        {/* Top bar */}
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            right: 16,
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate({ to: "/new/hub" });
            }}
            style={{
              appearance: "none",
              cursor: "pointer",
              padding: "6px 12px",
              borderRadius: 999,
              border: `2px solid ${TOKENS.paper}`,
              background: "rgba(0,0,0,0.4)",
              color: TOKENS.paper,
              fontFamily: TOKENS.mono,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: ".12em",
              backdropFilter: "blur(8px)",
            }}
          >
            ← back
          </button>
          <div
            style={{
              display: "flex",
              gap: 4,
            }}
          >
            {REELS.map((_, j) => (
              <span
                key={j}
                style={{
                  width: j === i ? 22 : 4,
                  height: 4,
                  borderRadius: 999,
                  background: j === i ? TOKENS.paper : "rgba(255,255,255,0.4)",
                  transition: "all .25s",
                }}
              />
            ))}
          </div>
          <span style={{ width: 60 }} />
        </div>

        {/* Bottom overlay */}
        <div
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            bottom: 24,
            zIndex: 2,
            color: TOKENS.paper,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "5px 10px",
              border: `2px solid ${TOKENS.paper}`,
              borderRadius: 999,
              background: "rgba(0,0,0,0.4)",
              fontFamily: TOKENS.mono,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: ".12em",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: TOKENS.accent1,
                animation: "cf-pulse 1.2s infinite",
              }}
            />
            {r.who} · {r.at}
          </div>
          <div
            style={{
              fontFamily: TOKENS.display,
              fontWeight: 900,
              fontSize: 26,
              letterSpacing: "-0.03em",
              marginTop: 12,
              lineHeight: 1.1,
              textShadow: "0 2px 12px rgba(0,0,0,0.4)",
            }}
          >
            {r.caption}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            {["💬 79", "♥ 412"].map((t) => (
              <span key={t} style={chipStyle}>
                {t}
              </span>
            ))}
            <button
              onClick={handleAddStop}
              style={{
                ...chipStyle,
                cursor: "pointer",
                appearance: "none" as const,
                background: addedToast ? TOKENS.accent2 : "rgba(0,0,0,0.35)",
                color: addedToast ? TOKENS.ink : TOKENS.paper,
                border: addedToast ? `2px solid ${TOKENS.ink}` : `2px solid ${TOKENS.paper}`,
                transition: "all 0.2s",
              }}
            >
              {addedToast ? "✓ added!" : "📍 add stop"}
            </button>
          </div>
        </div>

        {/* Tap hint */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            right: 18,
            zIndex: 1,
            transform: "translateY(-50%)",
            fontFamily: TOKENS.mono,
            fontSize: 9,
            fontWeight: 800,
            color: TOKENS.paper,
            opacity: 0.55,
            letterSpacing: ".18em",
            writingMode: "vertical-rl",
          }}
        >
          TAP TO ADVANCE
        </div>
      </div>
    </div>
  );
}
