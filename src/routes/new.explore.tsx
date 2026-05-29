import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useRef } from "react";
import { BrandMark, DotsBg, Frame, TOKENS } from "@/components/new-confetti/shell";
import { useNewAuth } from "@/hooks/useNewAuth";
import { getSelectedCity } from "@/lib/cities";

export const Route = createFileRoute("/new/explore")({
  component: ExplorePage,
});

// ── Outing taxonomy — curated 25 across 5 groups ─────────────

const GROUPS = [
  {
    id: "social",
    label: "Social",
    emoji: "👯",
    outings: [
      { id: "Girls Night",        emoji: "💅" },
      { id: "Guys Night",         emoji: "🎱" },
      { id: "Couples Night",      emoji: "💑" },
      { id: "Birthday Night",     emoji: "🎂" },
      { id: "Best Friends Night", emoji: "🤝" },
      { id: "Group Night Out",    emoji: "🥳" },
    ],
  },
  {
    id: "nightlife",
    label: "Turn Up",
    emoji: "🔥",
    outings: [
      { id: "Turn-Up Night",      emoji: "🔥" },
      { id: "Club Night",         emoji: "🎉" },
      { id: "Rooftop Night",      emoji: "🌆" },
      { id: "Bar Hop",            emoji: "🍻" },
      { id: "After-Hours Night",  emoji: "🌃" },
      { id: "Lounge Night",       emoji: "🌙" },
    ],
  },
  {
    id: "chill",
    label: "Chill",
    emoji: "😌",
    outings: [
      { id: "Wine Night",             emoji: "🍷" },
      { id: "Jazz Night",             emoji: "🎷" },
      { id: "Coffee Night",           emoji: "☕" },
      { id: "Chill Night",            emoji: "😌" },
      { id: "Waterfront Chill Night", emoji: "🌊" },
      { id: "Brunch Night",           emoji: "🥂" },
    ],
  },
  {
    id: "food",
    label: "Food",
    emoji: "🍽️",
    outings: [
      { id: "Dinner Night",      emoji: "🍽️" },
      { id: "Fine Dining Night", emoji: "✨" },
      { id: "Seafood Night",     emoji: "🦞" },
      { id: "Happy Hour",        emoji: "🍹" },
      { id: "Live Music Night",  emoji: "🎸" },
    ],
  },
  {
    id: "luxury",
    label: "Luxury",
    emoji: "💎",
    outings: [
      { id: "Soft Life Night",      emoji: "💎" },
      { id: "Luxury Dinner Night",  emoji: "🥂" },
      { id: "VIP Night",            emoji: "🌟" },
      { id: "Anniversary Night",    emoji: "💍" },
      { id: "Spa Night",            emoji: "🧖" },
    ],
  },
];

// ── Venue type ────────────────────────────────────────────────

interface Venue {
  venue_name: string;
  venue_slug: string;
  category: string | null;
  neighborhood: string | null;
  snippet: string | null;
  engagement_score: number;
  signal_type: string;
  platform: string;
}

// ── Edge function URL ─────────────────────────────────────────

const EDGE_URL = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-venues-by-outing`
  : "https://zfeckvxkulreyapadanf.supabase.co/functions/v1/get-venues-by-outing";

const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";

// ── Category accent colours ───────────────────────────────────

const CAT_COLORS: Record<string, string> = {
  Rooftops:        TOKENS.accent1,
  Brunch:          TOKENS.accent2,
  Nightlife:       "#7C3AED",
  Cocktails:       TOKENS.accent3,
  Speakeasy:       "#1D4ED8",
  "Live Music":    "#DC2626",
  Jazz:            "#B45309",
  "Wine Bar":      "#9D174D",
  Café:            "#065F46",
  "Fine Dining":   "#1E3A5F",
  "Happy Hour":    "#92400E",
  "Late Night":    "#111827",
  Dining:          "#374151",
  Experience:      "#6D28D9",
  "Pop-Up":        "#BE185D",
  Seafood:         "#0369A1",
};

// ── Main component ────────────────────────────────────────────

function ExplorePage() {
  const { ready } = useNewAuth();
  const navigate = useNavigate();

  const citySlug = useMemo(() => getSelectedCity()?.slug ?? "dc", []);
  const cityLabel = useMemo(() => (getSelectedCity()?.name ?? "DC").replace(/,.*/, ""), []);

  const [activeGroup, setActiveGroup] = useState(GROUPS[0].id);
  const [selectedOuting, setSelectedOuting] = useState<string | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentGroup = GROUPS.find((g) => g.id === activeGroup) ?? GROUPS[0];

  // Fetch when outing selected
  useEffect(() => {
    if (!selectedOuting) return;
    let cancelled = false;
    setLoading(true);
    setVenues([]);

    (async () => {
      try {
        const res = await fetch(
          `${EDGE_URL}?city_slug=${citySlug}&outing=${encodeURIComponent(selectedOuting)}&limit=20`,
          { headers: { Authorization: `Bearer ${ANON_KEY}` } },
        );
        const data = await res.json();
        if (!cancelled) setVenues(data.venues ?? []);
      } catch {
        if (!cancelled) setVenues([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [selectedOuting, citySlug]);

  const handleGroupChange = (gid: string) => {
    setActiveGroup(gid);
    setSelectedOuting(null);
    setVenues([]);
  };

  if (!ready) {
    return (
      <Frame>
        <div style={{
          height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
          background: TOKENS.bg, fontFamily: TOKENS.display, fontSize: 24,
          fontWeight: 900, color: TOKENS.ink, opacity: 0.5,
        }}>loading...</div>
      </Frame>
    );
  }

  return (
    <Frame>
      <div style={{
        position: "relative", height: "100%", background: TOKENS.bg,
        display: "flex", flexDirection: "column",
        padding: "52px 0 0", overflow: "hidden",
      }}>
        <DotsBg opacity={0.05} />

        {/* Header */}
        <div style={{
          position: "relative", zIndex: 2,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 20px", marginBottom: 12,
        }}>
          <button onClick={() => navigate({ to: "/new/hub" })} style={backBtnStyle()}>←</button>
          <BrandMark size={17} />
          <span style={{ width: 36 }} />
        </div>

        {/* Headline */}
        <div style={{ position: "relative", zIndex: 2, padding: "0 20px", marginBottom: 14 }}>
          <h2 style={{
            fontFamily: TOKENS.display, fontWeight: 900,
            fontSize: 30, lineHeight: 0.95, letterSpacing: "-0.04em", margin: "0 0 3px",
          }}>
            {cityLabel}, tonight.
          </h2>
          <p style={{
            fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 700, opacity: 0.5, margin: 0,
          }}>
            {selectedOuting
              ? loading
                ? "finding your spots..."
                : `${venues.length} ${selectedOuting.toLowerCase()} spots`
              : "pick your vibe below"}
          </p>
        </div>

        {/* Group tabs */}
        <div style={{
          position: "relative", zIndex: 2,
          display: "flex", gap: 6, padding: "0 20px",
          overflowX: "auto", scrollbarWidth: "none", marginBottom: 10,
        }}>
          {GROUPS.map((g) => {
            const active = g.id === activeGroup;
            return (
              <button
                key={g.id}
                onClick={() => handleGroupChange(g.id)}
                style={{
                  appearance: "none", cursor: "pointer", flexShrink: 0,
                  padding: "5px 13px",
                  border: `2px solid ${TOKENS.ink}`, borderRadius: 999,
                  background: active ? TOKENS.ink : TOKENS.paper,
                  color: active ? TOKENS.paper : TOKENS.ink,
                  fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800,
                  letterSpacing: ".1em",
                  boxShadow: active ? "none" : `2px 2px 0 ${TOKENS.ink}`,
                  transition: "all 0.1s",
                }}
              >
                {g.emoji} {g.label.toUpperCase()}
              </button>
            );
          })}
        </div>

        {/* Outing chips */}
        <div style={{
          position: "relative", zIndex: 2,
          display: "flex", flexWrap: "wrap", gap: 7, padding: "0 20px", marginBottom: 14,
        }}>
          {currentGroup.outings.map((o) => {
            const active = selectedOuting === o.id;
            return (
              <button
                key={o.id}
                onClick={() => setSelectedOuting(active ? null : o.id)}
                style={{
                  appearance: "none", cursor: "pointer",
                  padding: "7px 14px",
                  border: `2.5px solid ${TOKENS.ink}`, borderRadius: 12,
                  background: active ? TOKENS.accent1 : TOKENS.paper,
                  color: TOKENS.ink,
                  fontFamily: TOKENS.ui, fontSize: 13, fontWeight: active ? 800 : 600,
                  boxShadow: active ? "none" : `3px 3px 0 ${TOKENS.ink}`,
                  transform: active ? "translate(2px,2px)" : "none",
                  transition: "all 0.1s",
                  display: "flex", alignItems: "center", gap: 5,
                }}
              >
                <span style={{ fontSize: 15 }}>{o.emoji}</span>
                {o.id}
              </button>
            );
          })}
        </div>

        {/* Results */}
        <div
          ref={scrollRef}
          style={{
            position: "relative", zIndex: 2,
            flex: 1, overflowY: "auto", scrollbarWidth: "none",
            padding: "0 20px 24px",
          }}
        >
          {!selectedOuting && <EmptyState cityLabel={cityLabel} />}
          {selectedOuting && loading && <LoadingState outing={selectedOuting} />}
          {selectedOuting && !loading && venues.length === 0 && (
            <NoResults outing={selectedOuting} cityLabel={cityLabel} />
          )}
          {venues.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {venues.map((v, i) => (
                <VenueCard key={`${v.venue_slug}-${i}`} venue={v} index={i} />
              ))}
              <div style={{ height: 16 }} />
            </div>
          )}
        </div>
      </div>
    </Frame>
  );
}

// ── Venue card ────────────────────────────────────────────────

function VenueCard({ venue, index }: { venue: Venue; index: number }) {
  const accent = CAT_COLORS[venue.category ?? ""] ??
    [TOKENS.accent1, TOKENS.accent2, TOKENS.accent3][index % 3];

  const signalLabel =
    venue.signal_type === "trending" ? "🔥 Trending" :
    venue.signal_type === "new"      ? "✨ New"       :
    venue.signal_type === "popular"  ? "⭐ Popular"   :
    venue.signal_type === "lowkey"   ? "🤫 Hidden Gem" :
    venue.signal_type === "unique"   ? "💎 Unique"    : "";

  const engagementBar = Math.round((venue.engagement_score ?? 0) * 10);
  const platformLabel = venue.platform === "tiktok" ? "TikTok" :
    venue.platform === "instagram" ? "Instagram" : "Social";

  return (
    <div style={{
      border: `2.5px solid ${TOKENS.ink}`, borderRadius: 16,
      background: TOKENS.paper, boxShadow: `4px 4px 0 ${TOKENS.ink}`,
      overflow: "hidden",
    }}>
      {/* Colour strip */}
      <div style={{ height: 6, background: accent, borderBottom: `2px solid ${TOKENS.ink}` }} />

      <div style={{ padding: "12px 14px" }}>
        {/* Name + signal */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <div style={{
            fontFamily: TOKENS.display, fontWeight: 900, fontSize: 17,
            letterSpacing: "-0.02em", lineHeight: 1.05, flex: 1,
          }}>
            {venue.venue_name}
          </div>
          {signalLabel && (
            <span style={{
              fontFamily: TOKENS.mono, fontSize: 8, fontWeight: 800,
              letterSpacing: ".1em", padding: "3px 7px",
              border: `1.5px solid ${TOKENS.ink}`, borderRadius: 999,
              background: TOKENS.bg, flexShrink: 0, whiteSpace: "nowrap",
            }}>
              {signalLabel}
            </span>
          )}
        </div>

        {/* Category + neighborhood */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
          {venue.category && (
            <span style={{
              fontFamily: TOKENS.mono, fontSize: 8, fontWeight: 800,
              letterSpacing: ".12em", padding: "2px 7px",
              background: accent, border: `1.5px solid ${TOKENS.ink}`,
              borderRadius: 4, color: TOKENS.ink,
            }}>
              {venue.category.toUpperCase()}
            </span>
          )}
          {venue.neighborhood && (
            <span style={{
              fontFamily: TOKENS.mono, fontSize: 8, fontWeight: 700,
              opacity: 0.55, letterSpacing: ".06em",
            }}>
              📍 {venue.neighborhood}
            </span>
          )}
        </div>

        {/* Snippet */}
        {venue.snippet && (
          <p style={{
            fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 500,
            lineHeight: 1.4, margin: "9px 0 0", opacity: 0.85, color: TOKENS.ink,
          }}>
            {venue.snippet}
          </p>
        )}

        {/* Footer */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10,
        }}>
          <span style={{
            fontFamily: TOKENS.mono, fontSize: 8, fontWeight: 700,
            opacity: 0.4, letterSpacing: ".1em",
          }}>
            via {platformLabel}
          </span>
          <div style={{ display: "flex", gap: 2 }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} style={{
                width: 5, height: 5, borderRadius: 1,
                background: i < engagementBar ? accent : TOKENS.bg,
                border: `1px solid ${TOKENS.ink}`, opacity: 0.7,
              }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── States ────────────────────────────────────────────────────

function EmptyState({ cityLabel }: { cityLabel: string }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", paddingTop: 48, gap: 10,
    }}>
      <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 48, lineHeight: 1 }}>
        🎊
      </div>
      <p style={{
        fontFamily: TOKENS.ui, fontWeight: 700, fontSize: 14,
        opacity: 0.6, textAlign: "center",
      }}>
        Pick a vibe and we'll find<br />the best spots in {cityLabel}.
      </p>
    </div>
  );
}

function LoadingState({ outing }: { outing: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{
          border: `2.5px solid ${TOKENS.ink}`, borderRadius: 16,
          background: TOKENS.paper, overflow: "hidden",
          boxShadow: `4px 4px 0 ${TOKENS.ink}`, opacity: 1 - i * 0.15,
        }}>
          <div style={{ height: 6, background: "#e5e5e5", borderBottom: `2px solid ${TOKENS.ink}` }} />
          <div style={{ padding: "14px 14px" }}>
            <div style={{ height: 18, background: "#f0f0f0", borderRadius: 4, marginBottom: 8, width: "65%" }} />
            <div style={{ height: 11, background: "#f0f0f0", borderRadius: 4, marginBottom: 10, width: "35%" }} />
            <div style={{ height: 13, background: "#f0f0f0", borderRadius: 4, width: "90%" }} />
            <div style={{ height: 13, background: "#f0f0f0", borderRadius: 4, marginTop: 4, width: "70%" }} />
          </div>
        </div>
      ))}
      <p style={{
        fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800,
        letterSpacing: ".14em", textAlign: "center", opacity: 0.4, marginTop: 4,
      }}>
        FINDING {outing.toUpperCase()} SPOTS...
      </p>
    </div>
  );
}

function NoResults({ outing, cityLabel }: { outing: string; cityLabel: string }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 48, gap: 10,
    }}>
      <div style={{ fontSize: 40 }}>🔍</div>
      <p style={{
        fontFamily: TOKENS.ui, fontWeight: 700, fontSize: 13,
        opacity: 0.5, textAlign: "center",
      }}>
        No {outing} spots indexed for {cityLabel} yet.<br />More venues coming soon.
      </p>
    </div>
  );
}

function backBtnStyle(): React.CSSProperties {
  return {
    appearance: "none", cursor: "pointer",
    width: 36, height: 36, borderRadius: 999,
    border: `2.5px solid ${TOKENS.ink}`, background: TOKENS.paper,
    fontSize: 14, fontWeight: 900, color: TOKENS.ink,
    boxShadow: `3px 3px 0 ${TOKENS.ink}`,
  };
}
