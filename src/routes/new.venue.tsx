import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import {
  BrandMark,
  ChunkyButton,
  Frame,
  Icons,
  Stamp,
  Ticket,
  TOKENS,
} from "@/components/new-confetti/shell";
import { getActiveLoop } from "@/lib/loop-store";
import { HashtagReels } from "@/routes/new.hashtag-reels";

// Dynamic venue detail — reads from the active loop stop identified by `stopId`.
// Ported from design/new-confetti/project/discover.jsx (VenueDetailScreen, line 603)
export const Route = createFileRoute("/new/venue")({
  validateSearch: (search: Record<string, unknown>) => ({
    stopId: typeof search.stopId === "string" ? search.stopId : undefined,
  }),
  component: VenuePage,
});

const ACCENT_COLORS = [TOKENS.accent2, TOKENS.accent1, TOKENS.accent3, TOKENS.accent4];

function VenuePage() {
  const navigate = useNavigate();
  const { stopId } = useSearch({ from: "/new/venue" });
  const [reelsOpen, setReelsOpen] = useState(false);

  const loop = getActiveLoop();
  const stop = stopId ? loop?.stops.find((s) => s.id === stopId) : null;
  const stopIdx = loop?.stops.findIndex((s) => s.id === stopId) ?? 0;
  const heroColor = ACCENT_COLORS[stopIdx % 4];

  // Build stats from the stop's rich fields
  const stats = [
    stop?.crowd && { l: "crowd", v: stop.crowd },
    stop?.priceLevel && { l: "price", v: stop.priceLevel },
    stop?.bestFor && { l: "best for", v: stop.bestFor },
    stop?.dressCode && { l: "dress", v: stop.dressCode },
    stop?.waitTime && { l: "wait", v: stop.waitTime },
    stop?.type && { l: "type", v: stop.type },
  ].filter(Boolean) as { l: string; v: string }[];

  // Fallback stats when stop has sparse data
  const displayStats =
    stats.length >= 2
      ? stats.slice(0, 4)
      : [
          { l: "type", v: stop?.type || "venue" },
          { l: "area", v: stop?.area || stop?.address || "tonight" },
        ];

  const hasReels = true; // always show — HashtagReels renders nothing if no signals

  if (!stop) {
    return (
      <Frame>
        <div
          style={{
            height: "100%",
            background: TOKENS.bg,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "56px 22px 22px",
            gap: 16,
          }}
        >
          <div style={{ fontSize: 40 }}>🎟️</div>
          <p
            style={{
              fontFamily: TOKENS.ui,
              fontWeight: 700,
              fontSize: 14,
              color: TOKENS.inkMuted,
              textAlign: "center",
            }}
          >
            Stop not found.
            <br />
            Head back to your pass.
          </p>
          <button
            onClick={() => navigate({ to: "/new/pass" })}
            style={{
              appearance: "none",
              cursor: "pointer",
              padding: "12px 20px",
              border: `2.5px solid ${TOKENS.ink}`,
              borderRadius: 12,
              background: TOKENS.accent1,
              color: TOKENS.ink,
              fontFamily: TOKENS.ui,
              fontWeight: 800,
              fontSize: 13,
              boxShadow: `3px 3px 0 ${TOKENS.ink}`,
            }}
          >
            ← back to pass
          </button>
        </div>
      </Frame>
    );
  }

  return (
    <Frame>
      <div
        style={{
          position: "relative",
          height: "100%",
          background: TOKENS.bg,
          display: "flex",
          flexDirection: "column",
          padding: "0 0 22px",
          overflow: "hidden",
        }}
      >
        {/* Hero */}
        <div
          style={{
            position: "relative",
            height: 220,
            background: heroColor,
            borderBottom: `3px solid ${TOKENS.ink}`,
            padding: "56px 20px 16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              onClick={() => navigate({ to: "/new/pass" })}
              style={{
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
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ←
            </button>
            <BrandMark size={17} />
            <span style={{ width: 36 }} />
          </div>
          <Stamp color={TOKENS.paper} rotate={-3} style={{ alignSelf: "flex-start" }}>
            {stop.type}
          </Stamp>
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 1,
            flex: 1,
            overflowY: "auto",
            scrollbarWidth: "none",
            padding: "16px 20px 0",
          }}
        >
          <h1
            style={{
              fontFamily: TOKENS.display,
              fontWeight: 900,
              fontSize: 38,
              lineHeight: 0.92,
              letterSpacing: "-0.04em",
              margin: "0 0 4px",
            }}
          >
            {stop.name}
          </h1>
          <div
            style={{
              fontFamily: TOKENS.mono,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: ".1em",
              color: TOKENS.inkHint,
            }}
          >
            {stop.address ? `📍 ${stop.address}` : stop.area ? `📍 ${stop.area}` : null}
            {stop.time && <span style={{ marginLeft: 10 }}>🕐 {stop.time}</span>}
          </div>

          {/* See the vibe button */}
          {hasReels && (
            <button
              onClick={() => setReelsOpen(true)}
              style={{
                appearance: "none",
                cursor: "pointer",
                marginTop: 12,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                background: TOKENS.accent1,
                border: `2px solid ${TOKENS.ink}`,
                borderRadius: 999,
                fontFamily: TOKENS.mono,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: ".1em",
                color: TOKENS.ink,
                boxShadow: `3px 3px 0 ${TOKENS.ink}`,
              }}
            >
              🎬 SEE THE VIBE
            </button>
          )}

          {/* Stats grid */}
          {displayStats.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                marginTop: 16,
              }}
            >
              {displayStats.map((s) => (
                <div
                  key={s.l}
                  style={{
                    padding: "10px 12px",
                    border: `2.5px solid ${TOKENS.ink}`,
                    borderRadius: 12,
                    background: TOKENS.paper,
                    boxShadow: `3px 3px 0 ${TOKENS.ink}`,
                  }}
                >
                  <div
                    style={{
                      fontFamily: TOKENS.mono,
                      fontSize: 9,
                      fontWeight: 800,
                      letterSpacing: ".14em",
                      color: TOKENS.inkHint,
                      textTransform: "uppercase",
                    }}
                  >
                    {s.l}
                  </div>
                  <div
                    style={{
                      fontFamily: TOKENS.ui,
                      fontSize: 13,
                      fontWeight: 800,
                      marginTop: 3,
                      letterSpacing: "-0.01em",
                      color: TOKENS.ink,
                    }}
                  >
                    {s.v}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Why we'd send you ticket */}
          {(stop.rationale || stop.detail || stop.signature) && (
            <Ticket color={TOKENS.accent2} notch={false} style={{ padding: 14, marginTop: 18 }}>
              <div
                style={{
                  fontFamily: TOKENS.mono,
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: ".14em",
                  color: TOKENS.inkHint,
                }}
              >
                WHY WE'D SEND YOU HERE
              </div>
              <div
                style={{
                  fontFamily: TOKENS.display,
                  fontWeight: 900,
                  fontSize: 17,
                  letterSpacing: "-0.02em",
                  marginTop: 6,
                  lineHeight: 1.15,
                  color: TOKENS.ink,
                }}
              >
                {stop.rationale || stop.detail}
              </div>
              {stop.signature && (
                <div
                  style={{
                    marginTop: 10,
                    paddingTop: 10,
                    borderTop: `1.5px dashed rgba(0,0,0,.2)`,
                    fontFamily: TOKENS.mono,
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: ".1em",
                    color: TOKENS.inkHint,
                  }}
                >
                  🍽️ ORDER THIS · {stop.signature}
                </div>
              )}
            </Ticket>
          )}

          {/* Hashtags / vibe tags */}
          {stop.hashtags && stop.hashtags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 16 }}>
              {stop.hashtags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontFamily: TOKENS.mono,
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: ".1em",
                    padding: "5px 10px",
                    border: `2px solid ${TOKENS.ink}`,
                    borderRadius: 999,
                    background: TOKENS.paper,
                    color: TOKENS.inkHint,
                    textTransform: "uppercase",
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div style={{ height: 14 }} />
        </div>

        {/* Bottom actions */}
        <div
          style={{ position: "relative", zIndex: 2, padding: "0 20px", display: "flex", gap: 8 }}
        >
          <ChunkyButton variant="ghost" onClick={() => navigate({ to: "/new/pass" })}>
            ← pass
          </ChunkyButton>
          <ChunkyButton
            variant="accent"
            onClick={() => navigate({ to: "/new/night" })}
            icon={Icons.arrow}
          >
            let's go
          </ChunkyButton>
        </div>

        {/* Reels / Social bottom drawer */}
        {reelsOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="See the vibe"
            onClick={() => setReelsOpen(false)}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 50,
              background: "rgba(19,11,13,.6)",
              display: "flex",
              alignItems: "flex-end",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                background: TOKENS.bg,
                borderRadius: "20px 20px 0 0",
                borderTop: `2.5px solid ${TOKENS.ink}`,
                padding: "20px 20px 28px",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 5,
                  borderRadius: 999,
                  background: "rgba(19,11,13,.2)",
                  margin: "0 auto 16px",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 14,
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: TOKENS.mono,
                      fontSize: 9,
                      fontWeight: 800,
                      letterSpacing: ".14em",
                      color: TOKENS.inkHint,
                      marginBottom: 3,
                    }}
                  >
                    THE VIBE
                  </div>
                  <div
                    style={{
                      fontFamily: TOKENS.display,
                      fontWeight: 900,
                      fontSize: 18,
                      letterSpacing: "-0.03em",
                      color: TOKENS.ink,
                    }}
                  >
                    {stop.name}
                  </div>
                </div>
                <button
                  onClick={() => setReelsOpen(false)}
                  style={{
                    appearance: "none",
                    cursor: "pointer",
                    width: 34,
                    height: 34,
                    borderRadius: 999,
                    border: `2.5px solid ${TOKENS.ink}`,
                    background: TOKENS.paper,
                    fontSize: 14,
                    fontWeight: 900,
                    boxShadow: `3px 3px 0 ${TOKENS.ink}`,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ✕
                </button>
              </div>
              {/* Live social signals for this venue */}
              <HashtagReels
                venueSlug={stop.name.toLowerCase().replace(/['\s]+/g, "-").replace(/[^a-z0-9-]/g, "")}
                venueName={stop.name}
              />

              {/* External search links as footer */}
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <a
                  href={`https://tiktok.com/search?q=${encodeURIComponent(stop.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1, background: TOKENS.ink, border: `2px solid ${TOKENS.ink}`,
                    borderRadius: 10, padding: "10px 12px", textDecoration: "none",
                    fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800,
                    letterSpacing: ".1em", color: TOKENS.paper, textAlign: "center",
                  }}
                >
                  ♪ TikTok ↗
                </a>
                <a
                  href={`https://instagram.com/explore/search/keyword/?q=${encodeURIComponent(stop.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1, background: "linear-gradient(135deg,#f97316,#ec4899,#8b5cf6)",
                    border: `2px solid ${TOKENS.ink}`, borderRadius: 10,
                    padding: "10px 12px", textDecoration: "none",
                    fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800,
                    letterSpacing: ".1em", color: "#fff", textAlign: "center",
                  }}
                >
                  IG ↗
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </Frame>
  );
}
