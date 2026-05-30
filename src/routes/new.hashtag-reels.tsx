import { createFileRoute } from "@tanstack/react-router";
import { DotsBg, Frame, TopBar, TOKENS } from "@/components/new-confetti/shell";
import { useNavigate } from "@tanstack/react-router";

// Ported from prototype confetti-code/hashtag-reels.jsx
// Live #venue hashtag reel strip — shown per stop / on boarding pass back
export const Route = createFileRoute("/new/hashtag-reels")({ component: HashtagReelsPage });

interface Clip {
  who: string;
  views: string;
  c: string;
  cap: string;
}

// Sample hashtag corpus — keyed by venue name.
// In production replace with: /api/hashtag-reels?tag=<slug>
const HASHTAG_CLIPS: Record<string, Clip[]> = {
  "Skinny Pete's": [
    { who: "@dee.bartender", views: "42k", c: TOKENS.accent2, cap: "pickle martini hour @ pete's" },
    { who: "@brooklyn.dive", views: "18k", c: TOKENS.accent1, cap: "this jukebox is undefeated" },
    { who: "@maya.brooklyn", views: "8k", c: TOKENS.accent3, cap: "pete's for the warm-up always" },
  ],
  "Lupa Notte": [
    { who: "@bk.eats", views: "142k", c: TOKENS.accent1, cap: "counter seats at lupa = best move in BK" },
    { who: "@nyc.pasta", views: "88k", c: TOKENS.accent2, cap: "the carbonara conversation is over" },
    { who: "@maya.brooklyn", views: "32k", c: TOKENS.accent3, cap: "ask for marco's section" },
    { who: "@food.kid", views: "24k", c: TOKENS.accent1, cap: "pricey but worth it" },
  ],
  "Quartz Room": [
    { who: "@indieshows.nyc", views: "67k", c: TOKENS.accent3, cap: "pearl charles set tonight 11pm" },
    { who: "@bk.music", views: "34k", c: TOKENS.accent1, cap: "sticky floor energy" },
    { who: "@devon.eats", views: "11k", c: TOKENS.accent2, cap: "merch table left of stage" },
  ],
};

const DEMO_VENUES = Object.keys(HASHTAG_CLIPS);

function hashtagFor(name: string): string {
  return "#" + name.toLowerCase().replace(/['\s]/g, "");
}

// ── HashtagReels component — reusable per venue ───────────────────────
function HashtagReels({ venueName, dark = false }: { venueName: string; dark?: boolean }) {
  const clips = HASHTAG_CLIPS[venueName] || [];
  if (!clips.length) return null;
  const tag = hashtagFor(venueName);
  const textColor = dark ? "#fff" : TOKENS.ink;

  return (
    <div style={{ marginTop: 14 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontFamily: TOKENS.mono,
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: ".12em",
            color: textColor,
            opacity: 0.65,
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: 999,
              background: TOKENS.accent1,
              animation: "cf-pulse 1.2s infinite",
              display: "inline-block",
            }}
          />
          LIVE FROM TIKTOK · {tag.toUpperCase()} · {clips.length}
        </div>
        <span
          style={{
            fontFamily: TOKENS.mono,
            fontSize: 9,
            fontWeight: 700,
            opacity: 0.5,
            color: textColor,
          }}
        >
          see all ›
        </span>
      </div>

      <div
        style={{
          display: "flex",
          gap: 6,
          overflowX: "auto",
          scrollbarWidth: "none",
          paddingBottom: 2,
        }}
      >
        {clips.map((c, i) => (
          <button
            key={i}
            style={{
              appearance: "none",
              cursor: "pointer",
              flexShrink: 0,
              padding: 0,
              border: "none",
              background: "transparent",
              width: 88,
              position: "relative",
            }}
          >
            <div
              style={{
                width: "100%",
                aspectRatio: "9/16",
                border: `2px solid ${dark ? "#fff" : TOKENS.ink}`,
                borderRadius: 8,
                overflow: "hidden",
                background: c.c,
                position: "relative",
                backgroundImage:
                  "repeating-linear-gradient(135deg, rgba(0,0,0,0.1) 0 8px, transparent 8px 16px)",
              }}
            >
              {/* Source pill */}
              <span
                style={{
                  position: "absolute",
                  top: 4,
                  left: 4,
                  padding: "1px 5px",
                  background: TOKENS.ink,
                  color: "#fff",
                  borderRadius: 3,
                  fontFamily: TOKENS.mono,
                  fontSize: 7,
                  fontWeight: 900,
                  letterSpacing: ".08em",
                }}
              >
                ♪ TT
              </span>
              {/* Views */}
              <span
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  padding: "1px 5px",
                  background: "rgba(0,0,0,0.55)",
                  color: "#fff",
                  border: "1px solid #fff",
                  borderRadius: 3,
                  fontFamily: TOKENS.mono,
                  fontSize: 7,
                  fontWeight: 800,
                }}
              >
                ▶ {c.views}
              </span>
              {/* Play */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%,-50%)",
                  width: 22,
                  height: 22,
                  borderRadius: 999,
                  background: "rgba(0,0,0,0.55)",
                  border: "1.5px solid #fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 9,
                }}
              >
                ▶
              </div>
              {/* Dark gradient */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "50%",
                  background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.8))",
                }}
              />
              {/* Caption */}
              <div
                style={{
                  position: "absolute",
                  bottom: 4,
                  left: 4,
                  right: 4,
                  color: "#fff",
                  fontFamily: TOKENS.ui,
                  fontSize: 8,
                  fontWeight: 700,
                  lineHeight: 1.2,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                } as React.CSSProperties}
              >
                {c.cap}
              </div>
            </div>
            <div
              style={{
                fontFamily: TOKENS.mono,
                fontSize: 8,
                fontWeight: 700,
                marginTop: 4,
                letterSpacing: ".04em",
                color: textColor,
                opacity: 0.7,
                textAlign: "left",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {c.who}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Page wrapper — demos all venues with reels ────────────────────────
function HashtagReelsPage() {
  const navigate = useNavigate();

  return (
    <Frame>
      <div
        className="cf-screen"
        style={{
          position: "relative",
          minHeight: "100dvh",
          background: TOKENS.bg,
          display: "flex",
          flexDirection: "column",
          padding: "46px 22px 32px",
        }}
      >
        <DotsBg opacity={0.06} />
        <TopBar onBack={() => navigate({ to: "/new/welcome" })} />

        <div style={{ position: "relative", zIndex: 2 }}>
          <span
            style={{
              fontFamily: TOKENS.mono,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: ".14em",
              opacity: 0.55,
              color: TOKENS.ink,
            }}
          >
            LIVE FROM TIKTOK
          </span>
          <h1
            style={{
              fontFamily: TOKENS.display,
              fontWeight: 900,
              fontSize: 32,
              lineHeight: 0.94,
              letterSpacing: "-0.04em",
              color: TOKENS.ink,
              margin: "8px 0 4px",
            }}
          >
            What people are
            <br />
            saying tonight.
          </h1>
          <p
            style={{
              fontFamily: TOKENS.ui,
              fontSize: 12,
              fontWeight: 600,
              opacity: 0.6,
              margin: "0 0 20px",
              color: TOKENS.ink,
            }}
          >
            Real clips from TikTok at each stop on your pass.
          </p>

          {DEMO_VENUES.map((venue) => (
            <div
              key={venue}
              style={{
                marginBottom: 28,
                padding: "14px 14px 16px",
                border: `2.5px solid ${TOKENS.ink}`,
                borderRadius: 16,
                background: TOKENS.paper,
                boxShadow: `4px 4px 0 ${TOKENS.ink}`,
              }}
            >
              <div
                style={{
                  fontFamily: TOKENS.display,
                  fontWeight: 900,
                  fontSize: 18,
                  letterSpacing: "-0.025em",
                  color: TOKENS.ink,
                  marginBottom: 2,
                }}
              >
                {venue}
              </div>
              <div
                style={{
                  fontFamily: TOKENS.mono,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: ".1em",
                  opacity: 0.5,
                  color: TOKENS.ink,
                  textTransform: "uppercase",
                }}
              >
                {hashtagFor(venue)}
              </div>
              <HashtagReels venueName={venue} />
            </div>
          ))}
        </div>
      </div>
    </Frame>
  );
}

export { HashtagReels, HASHTAG_CLIPS };
