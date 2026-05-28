import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  BackButton, BrandMark, ChunkyButton, DotsBg, Frame, Icons, Stamp, TOKENS,
} from "@/components/new-confetti/shell";

// Ported from design/new-confetti/project/extras.jsx (ExplainerScreen, line 76)
export const Route = createFileRoute("/new/explainer")({
  component: ExplainerPage,
});

const PANELS = [
  { stamp: "step 01", title: "Tell us a vibe.",
    body: "Foodie + walkable + low-key. Or chat it out. We learn how your nights actually run.",
    color: TOKENS.accent1, glyph: "✣" },
  { stamp: "step 02", title: "We print a pass.",
    body: "3 stops, real venues, real timing, with a budget on it. Swap any stop you don't like.",
    color: TOKENS.accent2, glyph: "🎟" },
  { stamp: "step 03", title: "Show up. Share.",
    body: "Check in at every stop. Auto-clip a 9-sec reel for TikTok. Crew sees you live.",
    color: TOKENS.accent3, glyph: "🎬" },
];

function ExplainerPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const p = PANELS[page];
  const onDone = () => navigate({ to: "/new/hub" });

  return (
    <Frame>
      <div style={{
        position: "relative", height: "100%", overflow: "hidden",
        background: TOKENS.bg,
        display: "flex", flexDirection: "column",
        padding: "60px 24px 28px",
      }}>
        <DotsBg opacity={0.07} />

        <div style={{
          position: "relative", zIndex: 2,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <BackButton onClick={() => navigate({ to: "/new/hub" })} />
          <BrandMark size={17} />
          <button onClick={onDone} style={{
            appearance: "none", cursor: "pointer", background: "transparent",
            border: "none", padding: 6,
            fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 800,
            color: TOKENS.ink, opacity: 0.55,
          }}>skip →</button>
        </div>

        <div style={{
          position: "relative", zIndex: 2,
          flex: 1, display: "flex", flexDirection: "column",
          justifyContent: "center", gap: 18, paddingTop: 16,
        }}>
          {/* Illustration panel */}
          <div key={page} style={{
            height: 240,
            border: `3px solid ${TOKENS.ink}`, borderRadius: 22,
            background: p.color, color: p.color === TOKENS.accent3 ? TOKENS.paper : TOKENS.ink,
            boxShadow: `7px 7px 0 ${TOKENS.ink}`,
            position: "relative", overflow: "hidden",
            display: "grid", placeItems: "center",
            animation: "cf-pop 0.35s cubic-bezier(.2,1.4,.4,1)",
          }}>
            <div style={{
              fontFamily: TOKENS.display, fontSize: 120, fontWeight: 900,
              opacity: 0.85,
            }}>{p.glyph}</div>
          </div>

          <Stamp color={TOKENS.paper} rotate={-2} style={{ alignSelf: "flex-start" }}>{p.stamp}</Stamp>

          <h1 key={"h" + page} style={{
            fontFamily: TOKENS.display, fontWeight: 900,
            fontSize: 38, lineHeight: 0.95, letterSpacing: "-0.04em",
            color: TOKENS.ink, margin: 0,
          }}>{p.title}</h1>

          <p key={"b" + page} style={{
            fontFamily: TOKENS.ui, fontSize: 15, fontWeight: 500,
            color: TOKENS.ink, opacity: 0.75, margin: 0, maxWidth: 320, lineHeight: 1.4,
          }}>{p.body}</p>
        </div>

        <div style={{
          position: "relative", zIndex: 2,
          display: "flex", flexDirection: "column", gap: 14,
        }}>
          <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
            {PANELS.map((_, i) => (
              <span key={i} style={{
                width: i === page ? 28 : 8, height: 8, borderRadius: 999,
                background: i === page ? TOKENS.ink : "rgba(0,0,0,0.18)",
                transition: "all .25s",
              }} />
            ))}
          </div>
          <ChunkyButton variant="primary" icon={Icons.arrow}
            onClick={() => page < 2 ? setPage(page + 1) : onDone()}>
            {page < 2 ? "next" : "let's plan one"}
          </ChunkyButton>
        </div>
      </div>
    </Frame>
  );
}
