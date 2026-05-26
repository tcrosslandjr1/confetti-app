import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { BrandMark, Chip, DotsBg, Frame, TOKENS } from "@/components/new-confetti/shell";
import { useNewAuth } from "@/hooks/useNewAuth";
import { supabase } from "@/integrations/supabase/client";
import { getSelectedCity } from "@/lib/cities";

// Slim port — design/new-confetti/project/discover.jsx (ExploreScreen, line 90)
export const Route = createFileRoute("/new/explore")({
  component: ExplorePage,
});

type Venue = {
  id: string;
  name: string;
  category: string | null;
  neighborhood: string | null;
  description: string | null;
  hero_image_url: string | null;
  image_url: string | null;
  price_band: string | null;
  rating: number | null;
  tags: string[] | null;
};

const FILTERS = ["near me", "open now", "walkable", "$", "$$", "rooftop", "cocktails", "weird"];

// Map filter labels to query logic
const TAG_FILTERS = ["rooftop", "cocktails", "weird", "walkable"];
const PRICE_MAP: Record<string, string> = { "$": "$", "$$": "$$" };

function ExplorePage() {
  const { ready } = useNewAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState<string[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const toggle = (f: string) =>
    setActive((a) => a.includes(f) ? a.filter((x) => x !== f) : [...a, f]);

  // Resolve city
  const city = useMemo(() => {
    const sel = getSelectedCity();
    return sel?.name ?? "Washington DC";
  }, []);

  // Fetch venues from Supabase
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;

    async function fetchVenues() {
      setLoading(true);
      let query = supabase
        .from("venues")
        .select("id,name,category,neighborhood,description,hero_image_url,image_url,price_band,rating,tags")
        .eq("active", true)
        .order("trending_score", { ascending: false, nullsFirst: false })
        .limit(20);

      // City filter
      const cityBase = city.replace(/,.*/, "").trim();
      if (cityBase) query = query.ilike("city", `%${cityBase}%`);

      // Price filter
      const priceFilters = active.filter((f) => f in PRICE_MAP);
      if (priceFilters.length === 1) {
        query = query.eq("price_band", PRICE_MAP[priceFilters[0]]);
      }

      // Tag filters (rooftop, cocktails, weird, walkable)
      const tagFilters = active.filter((f) => TAG_FILTERS.includes(f));
      if (tagFilters.length > 0) {
        query = query.overlaps("tags", tagFilters);
      }

      const { data, error } = await query;
      if (!cancelled && !error) {
        setVenues((data ?? []) as Venue[]);
      }
      if (!cancelled) setLoading(false);
    }

    fetchVenues();
    return () => { cancelled = true; };
  }, [ready, active, city]);

  if (!ready) {
    return (
      <Frame>
        <div style={{
          height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
          background: TOKENS.bg, fontFamily: TOKENS.display, fontSize: 24, fontWeight: 900,
          color: TOKENS.ink, opacity: 0.5,
        }}>loading...</div>
      </Frame>
    );
  }

  return (
    <Frame>
      <div style={{
        position: "relative", height: "100%", background: TOKENS.bg,
        display: "flex", flexDirection: "column",
        padding: "56px 20px 20px", overflow: "hidden",
      }}>
        <DotsBg opacity={0.05} />

        <div style={{
          position: "relative", zIndex: 2,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 14,
        }}>
          <button onClick={() => navigate({ to: "/new/hub" })} style={backBtn()}>←</button>
          <BrandMark size={17} />
          <span style={{ width: 36 }} />
        </div>

        <div style={{ position: "relative", zIndex: 2 }}>
          <h2 style={{
            fontFamily: TOKENS.display, fontWeight: 900,
            fontSize: 32, lineHeight: 0.95, letterSpacing: "-0.04em",
            margin: "0 0 4px",
          }}>{city.replace(/,.*/, "")},<br/>tonight.</h2>
          <p style={{
            fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 700, opacity: 0.55,
            margin: "0 0 12px",
          }}>{loading ? "searching..." : `${venues.length} spots found`}</p>
        </div>

        {/* Filter chips */}
        <div style={{
          position: "relative", zIndex: 2,
          display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none",
          marginRight: -20, paddingRight: 20, marginBottom: 14,
        }}>
          {FILTERS.map((f) => (
            <Chip key={f} dense selected={active.includes(f)} color={TOKENS.accent2}
              onClick={() => toggle(f)}>{f}</Chip>
          ))}
        </div>

        {/* Venue grid */}
        <div style={{
          position: "relative", zIndex: 2,
          flex: 1, overflowY: "auto", scrollbarWidth: "none",
          marginRight: -20, paddingRight: 20,
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {venues.map((v, i) => {
              const heatColors = [TOKENS.accent1, TOKENS.accent2, TOKENS.accent3];
              const heat = heatColors[i % heatColors.length];
              return (
                <button key={v.id} onClick={() => navigate({ to: "/new/venue/$id", params: { id: v.id } })} style={{
                  appearance: "none", cursor: "pointer", textAlign: "left",
                  padding: 0,
                  border: `2.5px solid ${TOKENS.ink}`, borderRadius: 14,
                  background: TOKENS.paper,
                  boxShadow: `4px 4px 0 ${TOKENS.ink}`,
                  overflow: "hidden",
                }}>
                  {v.hero_image_url || v.image_url ? (
                    <div style={{
                      height: 90, borderBottom: `2.5px solid ${TOKENS.ink}`,
                      overflow: "hidden",
                    }}>
                      <img src={v.hero_image_url ?? v.image_url ?? ""} alt={v.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  ) : (
                    <div style={{
                      height: 90, background: heat,
                      borderBottom: `2.5px solid ${TOKENS.ink}`,
                      display: "grid", placeItems: "center",
                      fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800,
                      letterSpacing: ".14em", opacity: 0.6, color: TOKENS.ink,
                    }}>{(v.category ?? "VENUE").toUpperCase()}</div>
                  )}
                  <div style={{ padding: "10px 12px" }}>
                    <div style={{
                      fontFamily: TOKENS.display, fontWeight: 900, fontSize: 15,
                      letterSpacing: "-0.02em", lineHeight: 1.05,
                    }}>{v.name}</div>
                    <div style={{
                      fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 700,
                      opacity: 0.6, marginTop: 4, letterSpacing: ".06em",
                    }}>{v.category}{v.price_band ? ` · ${v.price_band}` : ""}</div>
                    {v.neighborhood && (
                      <div style={{
                        fontFamily: TOKENS.mono, fontSize: 8, fontWeight: 700,
                        opacity: 0.45, marginTop: 2, letterSpacing: ".06em",
                      }}>📍 {v.neighborhood}</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <div style={{ height: 12 }} />
        </div>
      </div>
    </Frame>
  );
}

function backBtn(): React.CSSProperties {
  return {
    appearance: "none", cursor: "pointer",
    width: 36, height: 36, borderRadius: 999,
    border: `2.5px solid ${TOKENS.ink}`, background: TOKENS.paper,
    fontSize: 14, fontWeight: 900, boxShadow: `3px 3px 0 ${TOKENS.ink}`,
  };
}
