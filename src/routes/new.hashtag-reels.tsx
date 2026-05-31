import { createFileRoute } from "@tanstack/react-router";
import { DotsBg, Frame, TopBar, TOKENS } from "@/components/new-confetti/shell";
import { useNavigate } from "@tanstack/react-router";
import { useCitySignals, useVenueSignals, SIGNAL_COLOR, type VenueSignal } from "@/lib/social-signals";
import { getSelectedCity } from "@/lib/cities";

export const Route = createFileRoute("/new/hashtag-reels")({ component: HashtagReelsPage });

const PLATFORM_LABEL: Record<string, string> = {
  tiktok: "♪ TT",
  instagram: "IG",
  x: "✕",
};

function hashtagFor(name: string): string {
  return "#" + name.toLowerCase().replace(/['\s]/g, "");
}

function engagementLabel(score: number): string {
  if (score >= 1000) return `${(score / 1000).toFixed(1)}k`;
  return String(score);
}

// ── ReelClip — single thumbnail card ─────────────────────────────────────────
function ReelClip({ sig, dark }: { sig: VenueSignal; dark: boolean }) {
  const color = SIGNAL_COLOR[sig.signal_type] ?? TOKENS.accent1;
  const textColor = dark ? "#fff" : TOKENS.ink;

  return (
    <button style={{
      appearance: "none", cursor: "pointer", flexShrink: 0,
      padding: 0, border: "none", background: "transparent", width: 88,
    }}>
      <div style={{
        width: "100%", aspectRatio: "9/16",
        border: `2px solid ${dark ? "#fff" : TOKENS.ink}`,
        borderRadius: 8, overflow: "hidden", background: color,
        position: "relative",
        backgroundImage: "repeating-linear-gradient(135deg, rgba(0,0,0,0.1) 0 8px, transparent 8px 16px)",
      }}>
        {/* Platform pill */}
        <span style={{
          position: "absolute", top: 4, left: 4,
          padding: "1px 5px", background: TOKENS.ink, color: "#fff",
          borderRadius: 3, fontFamily: TOKENS.mono, fontSize: 7, fontWeight: 900, letterSpacing: ".08em",
        }}>
          {PLATFORM_LABEL[sig.platform] ?? sig.platform.slice(0, 2).toUpperCase()}
        </span>

        {/* Engagement count */}
        <span style={{
          position: "absolute", top: 4, right: 4,
          padding: "1px 5px", background: "rgba(0,0,0,0.55)", color: "#fff",
          border: "1px solid #fff", borderRadius: 3,
          fontFamily: TOKENS.mono, fontSize: 7, fontWeight: 800,
        }}>
          ▶ {engagementLabel(sig.engagement_score)}
        </span>

        {/* Play button */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          width: 22, height: 22, borderRadius: 999,
          background: "rgba(0,0,0,0.55)", border: "1.5px solid #fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: 9,
        }}>▶</div>

        {/* Bottom gradient */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "50%",
          background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.8))",
        }} />

        {/* Caption */}
        <div style={{
          position: "absolute", bottom: 4, left: 4, right: 4,
          color: "#fff", fontFamily: TOKENS.ui, fontSize: 8, fontWeight: 700,
          lineHeight: 1.2, overflow: "hidden",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        } as React.CSSProperties}>
          {sig.snippet ?? sig.venue_name}
        </div>
      </div>

      {/* Handle below card */}
      <div style={{
        fontFamily: TOKENS.mono, fontSize: 8, fontWeight: 700, marginTop: 4,
        letterSpacing: ".04em", color: textColor, opacity: 0.65,
        textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {hashtagFor(sig.venue_name)}
      </div>
    </button>
  );
}

// ── HashtagReels — reusable horizontal strip for one venue ────────────────────
// Accepts venueSlug (DB lookup) + venueName (display). Falls back silently.
export function HashtagReels({
  venueSlug,
  venueName,
  dark = false,
}: {
  venueSlug: string;
  venueName: string;
  dark?: boolean;
}) {
  const { signals, loading } = useVenueSignals(venueSlug);
  const textColor = dark ? "#fff" : TOKENS.ink;

  if (loading) return (
    <div style={{ marginTop: 10, fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".1em", color: textColor, opacity: 0.35 }}>
      LOADING…
    </div>
  );
  if (!signals.length) return null;

  const tag = hashtagFor(venueName);

  return (
    <div style={{ marginTop: 14 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800,
          letterSpacing: ".12em", color: textColor, opacity: 0.65,
        }}>
          <span style={{
            width: 5, height: 5, borderRadius: 999, background: TOKENS.accent1,
            animation: "cf-pulse 1.2s infinite", display: "inline-block",
          }} />
          SOCIAL BUZZ · {tag.toUpperCase()} · {signals.length}
        </div>
        <span style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 700, opacity: 0.45, color: textColor }}>
          see all ›
        </span>
      </div>

      {/* Horizontal scroll strip */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 2 }}>
        {signals.map((sig) => <ReelClip key={sig.id} sig={sig} dark={dark} />)}
      </div>
    </div>
  );
}

// ── Full page — city-level social buzz ────────────────────────────────────────
function HashtagReelsPage() {
  const navigate = useNavigate();
  const city = getSelectedCity();
  const { signals: citySignals, loading } = useCitySignals(30);

  // Deduplicate to get unique venues
  const venues: { slug: string; name: string }[] = [];
  const seen = new Set<string>();
  citySignals.forEach((s) => {
    if (!seen.has(s.venue_slug)) {
      seen.add(s.venue_slug);
      venues.push({ slug: s.venue_slug, name: s.venue_name });
    }
  });

  return (
    <Frame>
      <div
        className="cf-screen"
        style={{
          position: "relative", minHeight: "100dvh", background: TOKENS.bg,
          display: "flex", flexDirection: "column", padding: "46px 22px 32px",
        }}
      >
        <DotsBg opacity={0.06} />
        <TopBar onBack={() => navigate({ to: "/new/welcome" })} />

        <div style={{ position: "relative", zIndex: 2 }}>
          <span style={{
            fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800,
            letterSpacing: ".14em", opacity: 0.55, color: TOKENS.ink,
          }}>
            SOCIAL BUZZ · {(city?.name ?? "DC").toUpperCase()}
          </span>
          <h1 style={{
            fontFamily: TOKENS.display, fontWeight: 900, fontSize: 32,
            lineHeight: 0.94, letterSpacing: "-0.04em", color: TOKENS.ink, margin: "8px 0 4px",
          }}>
            What people are<br />saying tonight.
          </h1>
          <p style={{
            fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 600,
            opacity: 0.6, margin: "0 0 20px", color: TOKENS.ink,
          }}>
            Real signals from TikTok &amp; Instagram at each stop.
          </p>

          {loading ? (
            <div style={{ fontFamily: TOKENS.mono, fontSize: 11, fontWeight: 800, letterSpacing: ".12em", opacity: 0.4, color: TOKENS.ink }}>
              FETCHING SIGNALS…
            </div>
          ) : (
            venues.map(({ slug, name }) => (
              <div key={slug} style={{
                marginBottom: 28, padding: "14px 14px 16px",
                border: `2.5px solid ${TOKENS.ink}`, borderRadius: 16,
                background: TOKENS.paper, boxShadow: `4px 4px 0 ${TOKENS.ink}`,
              }}>
                <div style={{
                  fontFamily: TOKENS.display, fontWeight: 900, fontSize: 18,
                  letterSpacing: "-0.025em", color: TOKENS.ink, marginBottom: 2,
                }}>
                  {name}
                </div>
                <div style={{
                  fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 700,
                  letterSpacing: ".1em", opacity: 0.5, color: TOKENS.ink, textTransform: "uppercase",
                }}>
                  {hashtagFor(name)}
                </div>
                <HashtagReels venueSlug={slug} venueName={name} />
              </div>
            ))
          )}
        </div>
      </div>
    </Frame>
  );
}
