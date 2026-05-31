import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { TOKENS } from "@/components/new-confetti/shell";
import { togglePinnedVenue } from "@/lib/night-builder-store";
import { useCitySignals, SIGNAL_COLOR } from "@/lib/social-signals";

export const Route = createFileRoute("/new/reels")({
  component: ReelsPage,
});

const PLATFORM_LABEL: Record<string, string> = {
  tiktok: "♪ TT",
  instagram: "IG",
  x: "✕ X",
};

const SIGNAL_LABEL: Record<string, string> = {
  trending: "🔥 trending",
  popular: "⭐ popular",
  new: "✨ new spot",
  lowkey: "🤫 lowkey",
  unique: "💎 unique",
};

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
  whiteSpace: "nowrap",
};

function ReelsPage() {
  const navigate = useNavigate();
  const { signals, loading } = useCitySignals(20);
  const [idx, setIdx] = useState(0);
  const [addedToast, setAddedToast] = useState(false);
  const touchStartY = useRef<number | null>(null);

  const r = signals[idx];
  const color = r ? (SIGNAL_COLOR[r.signal_type] ?? TOKENS.accent1) : TOKENS.accent1;

  const goNext = () => { setAddedToast(false); setIdx((n) => (n + 1) % signals.length); };
  const goPrev = () => { setAddedToast(false); setIdx((n) => (n - 1 + signals.length) % signals.length); };

  const handleTouchStart = (e: React.TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const delta = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(delta) > 40) delta > 0 ? goNext() : goPrev();
    touchStartY.current = null;
  };

  const handleAddStop = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!r) return;
    togglePinnedVenue({
      venue_name: r.venue_name,
      venue_slug: r.venue_slug,
      category: r.category,
      neighborhood: r.neighborhood,
      snippet: r.snippet,
      outing: "reels",
    });
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2000);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center", background: "#0a0a0a" }}>
        <div style={{ fontFamily: TOKENS.mono, fontSize: 11, fontWeight: 800, letterSpacing: ".14em", color: TOKENS.paper, opacity: 0.5 }}>
          LOADING…
        </div>
      </div>
    );
  }

  if (!r) return null;

  return (
    <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center", background: "#0a0a0a", padding: 24 }}>
      <div
        style={{
          position: "relative",
          width: "min(420px, 100%)",
          height: "min(874px, calc(100dvh - 48px))",
          overflow: "hidden",
          borderRadius: 28,
          background: color,
          boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
          cursor: "pointer",
        }}
        onClick={goNext}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Gradient + texture overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(180deg, transparent 0%, transparent 45%, rgba(0,0,0,0.65) 100%)`,
          backgroundImage: "repeating-linear-gradient(135deg, rgba(0,0,0,0.07) 0 12px, transparent 12px 24px)",
        }} />

        {/* Top bar */}
        <div style={{ position: "absolute", top: 16, left: 16, right: 16, zIndex: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button
            onClick={(e) => { e.stopPropagation(); navigate({ to: "/new/hub" }); }}
            style={{
              appearance: "none", cursor: "pointer", padding: "6px 12px", borderRadius: 999,
              border: `2px solid ${TOKENS.paper}`, background: "rgba(0,0,0,0.4)",
              color: TOKENS.paper, fontFamily: TOKENS.mono, fontSize: 11, fontWeight: 800,
              letterSpacing: ".12em", backdropFilter: "blur(8px)",
            }}
          >
            ← back
          </button>

          {/* Progress dots */}
          <div style={{ display: "flex", gap: 4 }}>
            {signals.slice(0, 12).map((_, j) => (
              <span key={j} style={{
                width: j === idx ? 18 : 4, height: 4, borderRadius: 999,
                background: j === idx ? TOKENS.paper : "rgba(255,255,255,0.3)",
                transition: "all .25s",
              }} />
            ))}
          </div>

          {/* Platform badge */}
          <span style={{
            padding: "4px 8px", borderRadius: 6, background: TOKENS.ink, color: TOKENS.paper,
            fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 900, letterSpacing: ".1em",
          }}>
            {PLATFORM_LABEL[r.platform] ?? r.platform.toUpperCase()}
          </span>
        </div>

        {/* Signal type badge */}
        <div style={{ position: "absolute", top: 68, left: 16, zIndex: 2 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px",
            borderRadius: 999, background: "rgba(0,0,0,0.45)", border: `1.5px solid ${TOKENS.paper}`,
            fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".1em",
            color: TOKENS.paper, backdropFilter: "blur(6px)",
          }}>
            {SIGNAL_LABEL[r.signal_type] ?? r.signal_type}
          </span>
        </div>

        {/* Bottom overlay */}
        <div style={{ position: "absolute", left: 16, right: 16, bottom: 24, zIndex: 2, color: TOKENS.paper }}>
          {/* Venue + neighborhood pill */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "5px 10px", border: `2px solid ${TOKENS.paper}`, borderRadius: 999,
            background: "rgba(0,0,0,0.4)", fontFamily: TOKENS.mono, fontSize: 10,
            fontWeight: 800, letterSpacing: ".12em", backdropFilter: "blur(6px)",
          }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: TOKENS.accent1, animation: "cf-pulse 1.2s infinite" }} />
            {r.venue_name}{r.neighborhood ? ` · ${r.neighborhood}` : ""}
          </div>

          {/* Caption / snippet */}
          <div style={{
            fontFamily: TOKENS.display, fontWeight: 900, fontSize: 26,
            letterSpacing: "-0.03em", marginTop: 12, lineHeight: 1.1,
            textShadow: "0 2px 12px rgba(0,0,0,0.4)",
          }}>
            {r.snippet ?? r.venue_name}
          </div>

          {/* Hashtags */}
          {r.hashtags.length > 0 && (
            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              {r.hashtags.slice(0, 3).map((tag) => (
                <span key={tag} style={{ ...chipStyle, fontSize: 10, padding: "4px 9px", opacity: 0.75 }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <span style={chipStyle}>❤ {Math.round(r.engagement_score / 3)}</span>
            <span style={chipStyle}>💬 {Math.round(r.engagement_score / 7)}</span>
            <button
              onClick={handleAddStop}
              style={{
                ...chipStyle, cursor: "pointer", appearance: "none",
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

        {/* Swipe / tap hint */}
        <div style={{
          position: "absolute", top: "50%", right: 18, zIndex: 1,
          transform: "translateY(-50%)", fontFamily: TOKENS.mono, fontSize: 9,
          fontWeight: 800, color: TOKENS.paper, opacity: 0.4, letterSpacing: ".18em",
          writingMode: "vertical-rl",
        }}>
          SWIPE OR TAP
        </div>
      </div>
    </div>
  );
}
