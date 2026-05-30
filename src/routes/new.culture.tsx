import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { DotsBg, Frame, TOKENS } from "@/components/new-confetti/shell";

export const Route = createFileRoute("/new/culture")({ component: CulturePage });

// ─── Data ──────────────────────────────────────────────────────
type CultureCat = {
  id: string; l: string; e: string; color: string; light?: boolean; items: string[];
};

const CULTURE: CultureCat[] = [
  { id: "southern-food", l: "Southern Food + BBQ", e: "🍗", color: TOKENS.accent1,
    items: ["BBQ tasting crawl","Hot chicken challenge","Soul food brunch","Seafood boil","Catfish fry","Peach cobbler dessert run","Sweet tea tasting","Food truck rodeo","Southern cookout"] },
  { id: "music-dance", l: "Music + Dance", e: "🎶", color: TOKENS.accent2,
    items: ["Go-go band night","Blues bar","Southern soul night","Trap karaoke","Line dancing","Country swing","House music brunch","Deep house warehouse","R&B night","Southern hip-hop club"] },
  { id: "water-boat", l: "Water + Beach + Boat", e: "🌊", color: TOKENS.accent3, light: true,
    items: ["Yacht day","Pontoon rental","Jet skis","Beach picnic","Sand volleyball","Paddle boarding","Sunset cruise","Fishing charter","Lake day cookout","Parasailing","Snorkeling","Beach bonfire","Beach bar crawl"] },
  { id: "country-life", l: "Country + Southern Lifestyle", e: "🐎", color: TOKENS.paper,
    items: ["Rodeo","Monster truck show","County fair","State fair","Tractor pull","Mud bogging","ATV riding","Horseback ride","Bonfire night","Camping","River tubing"] },
  { id: "tiktok-fun", l: "TikTok-Friendly Fun", e: "🎯", color: TOKENS.accent2,
    items: ["Axe throwing","Bowling + wings","Arcade bars","Go-karts","Escape rooms","Roller skating","Drive-in movie","Neon mini golf","Mechanical bull","Shooting range","Thrift store run","Farmers market","Candle making","Pottery class","Photo walk","Rooftop sunset"] },
  { id: "drinks", l: "Drink Spots", e: "🥃", color: TOKENS.accent1,
    items: ["Bourbon tasting","Whiskey flights","Moonshine tasting","Brewery tour","Daiquiri shop","Cigar lounge","Speakeasy"] },
  { id: "nightlife", l: "Nightlife", e: "🎤", color: TOKENS.accent3, light: true,
    items: ["Hookah lounge","Rooftop lounge","Live band bar","Silent headphone party","Country bar","House music lounge","Go-go club","Afrobeat + R&B blend"] },
  { id: "group", l: "Group / Birthday", e: "🏆", color: TOKENS.accent2,
    items: ["Spades tournament","Dominoes night","Private karaoke","Private bowling","Sprinter nightlife tour","Backyard movie","Private chef dinner","Game night lounge"] },
  { id: "extreme", l: "Extreme + Adrenaline", e: "🚚", color: TOKENS.ink, light: true,
    items: ["Monster truck rally","Demolition derby","Drag strip","Dirt bike trails","Off-road Jeep","Archery range"] },
];

type TierPlan = {
  id: string; l: string; e: string; color: string; light?: boolean;
  cheap: string[]; mid: string[]; high: string[];
};

const TIER_PLANS: TierPlan[] = [
  { id: "southern", l: "Southern Day + Night", e: "🍗", color: TOKENS.accent1,
    cheap: ["BBQ plates","thrift store run","blues bar"],
    mid:   ["Soul food dinner","line dancing","whiskey bar"],
    high:  ["Upscale Southern","bourbon tasting","VIP jazz lounge"] },
  { id: "yacht", l: "Yacht + Beach Day", e: "🌊", color: TOKENS.accent3, light: true,
    cheap: ["Beach picnic","volleyball","ice cream"],
    mid:   ["Jet skis","beach bar","sunset photos"],
    high:  ["Yacht day","catered food","rooftop after-party"] },
  { id: "rodeo", l: "Monster Truck / Rodeo", e: "🐎", color: TOKENS.accent2,
    cheap: ["BBQ","monster truck show","milkshakes"],
    mid:   ["Southern dinner","rodeo","country bar"],
    high:  ["Steakhouse","VIP rodeo box","speakeasy"] },
  { id: "house", l: "House Music Night", e: "🎶", color: TOKENS.accent3, light: true,
    cheap: ["Street food","dive bar DJ","diner"],
    mid:   ["Trendy dinner","house lounge","rooftop"],
    high:  ["Upscale dinner","VIP house event","after-hours"] },
  { id: "gogo", l: "Go-Go Night · DMV", e: "🎤", color: TOKENS.ink, light: true,
    cheap: ["Carryout","bar w/ go-go playlist","—"],
    mid:   ["Soul food","live go-go band","—"],
    high:  ["Upscale dinner","VIP go-go","after-party"] },
];

// ─── Page ──────────────────────────────────────────────────────
function CulturePage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"plans" | "activities">("plans");
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [activePlan, setActivePlan] = useState<string | null>(null);
  const [tier, setTier] = useState<"cheap" | "mid" | "high">("mid");

  // Plan detail view
  if (activePlan) {
    const p = TIER_PLANS.find((x) => x.id === activePlan)!;
    const stops = p[tier];
    return (
      <Frame>
        <div className="cf-screen" style={{
          position: "relative", height: "100dvh",
          background: TOKENS.bg,
          display: "flex", flexDirection: "column",
          padding: "56px 22px 24px", overflow: "hidden",
        }}>
          <DotsBg opacity={0.05} />
          <div style={{
            position: "relative", zIndex: 2,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 14,
          }}>
            <button onClick={() => setActivePlan(null)} style={{
              appearance: "none", cursor: "pointer",
              width: 36, height: 36, borderRadius: 999,
              border: `2.5px solid ${TOKENS.ink}`, background: TOKENS.paper,
              fontSize: 14, fontWeight: 900, color: TOKENS.ink,
              boxShadow: `3px 3px 0 ${TOKENS.ink}`,
            }}>←</button>
            <span style={{
              fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800,
              letterSpacing: ".14em", color: TOKENS.ink, opacity: 0.55,
            }}>3-TIER PLAN</span>
            <span style={{ width: 36 }} />
          </div>
          <div style={{
            position: "relative", zIndex: 2,
            flex: 1, overflowY: "auto", scrollbarWidth: "none",
          }}>
            <div style={{ fontSize: 56, lineHeight: 1, marginBottom: 4 }}>{p.e}</div>
            <h2 style={{
              fontFamily: TOKENS.display, fontWeight: 900, fontSize: 32,
              letterSpacing: "-0.04em", lineHeight: 0.94, margin: "0 0 18px",
              color: TOKENS.ink,
            }}>{p.l}</h2>
            {/* Tier picker */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 14 }}>
              {([["cheap","$","cheap"],["mid","$$","mid"],["high","$$$","high-end"]] as const).map(([id, l, sub]) => (
                <button key={id} onClick={() => setTier(id)} style={{
                  appearance: "none", cursor: "pointer",
                  padding: "10px 6px",
                  border: `2.5px solid ${TOKENS.ink}`, borderRadius: 12,
                  background: tier === id ? TOKENS.accent1 : TOKENS.paper,
                  color: TOKENS.ink,
                  boxShadow: tier === id ? "none" : `3px 3px 0 ${TOKENS.ink}`,
                  transform: tier === id ? "translate(2px,2px)" : "none",
                }}>
                  <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 18 }}>{l}</div>
                  <div style={{
                    fontFamily: TOKENS.mono, fontSize: 8.5, fontWeight: 800,
                    opacity: 0.6, letterSpacing: ".08em", marginTop: 1, textTransform: "uppercase" as const,
                  }}>{sub}</div>
                </button>
              ))}
            </div>
            {stops.map((s, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: 14, marginBottom: 8,
                border: `2.5px solid ${TOKENS.ink}`, borderRadius: 14,
                background: [TOKENS.accent1, TOKENS.accent2, TOKENS.paper][i] || TOKENS.paper,
                boxShadow: `4px 4px 0 ${TOKENS.ink}`,
                opacity: s === "—" ? 0.4 : 1,
              }}>
                <span style={{
                  flexShrink: 0, width: 32, height: 32, borderRadius: "50%",
                  border: `2.5px solid ${TOKENS.ink}`, background: TOKENS.paper,
                  fontFamily: TOKENS.display, fontWeight: 900, fontSize: 15, color: TOKENS.ink,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                }}>{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: TOKENS.display, fontWeight: 900, fontSize: 17,
                    letterSpacing: "-0.025em", lineHeight: 1.1, color: TOKENS.ink,
                  }}>{s}</div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => navigate({ to: "/new/plan" })} style={{
            appearance: "none", cursor: "pointer",
            padding: "14px 16px", marginTop: 12,
            border: `3px solid ${TOKENS.ink}`, borderRadius: 14,
            background: TOKENS.accent1, color: TOKENS.ink,
            fontFamily: TOKENS.display, fontWeight: 900, fontSize: 16,
            letterSpacing: "-0.02em", boxShadow: `5px 5px 0 ${TOKENS.ink}`,
          }}>✣ print this {tier} pass</button>
        </div>
      </Frame>
    );
  }

  // Category detail view
  if (activeCat) {
    const c = CULTURE.find((x) => x.id === activeCat)!;
    return (
      <Frame>
        <div className="cf-screen" style={{
          position: "relative", height: "100dvh",
          background: c.color, color: c.light ? TOKENS.paper : TOKENS.ink,
          display: "flex", flexDirection: "column",
          padding: "56px 22px 24px", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", inset: 0, opacity: 0.1,
            backgroundImage: "repeating-linear-gradient(135deg, currentColor 0 8px, transparent 8px 16px)",
          }} />
          <div style={{
            position: "relative", zIndex: 2,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 18,
          }}>
            <button onClick={() => setActiveCat(null)} style={{
              appearance: "none", cursor: "pointer",
              width: 36, height: 36, borderRadius: 999,
              border: "2.5px solid currentColor", background: "transparent",
              color: "inherit", fontSize: 14, fontWeight: 900,
            }}>←</button>
            <span style={{
              fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800,
              letterSpacing: ".16em", opacity: 0.75,
            }}>{c.items.length} ACTIVITIES</span>
          </div>
          <div style={{ position: "relative", zIndex: 2, flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
            <div style={{ fontSize: 60, lineHeight: 1, marginBottom: 4 }}>{c.e}</div>
            <h2 style={{
              fontFamily: TOKENS.display, fontWeight: 900, fontSize: 36,
              letterSpacing: "-0.045em", lineHeight: 0.92, margin: "0 0 18px",
            }}>{c.l}</h2>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
              {c.items.map((it) => (
                <button key={it} style={{
                  appearance: "none", cursor: "pointer",
                  padding: "8px 14px",
                  border: "2.5px solid currentColor", borderRadius: 999,
                  background: "rgba(255,250,240,0.15)",
                  color: "inherit",
                  fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 800,
                  backdropFilter: "blur(8px)",
                }}>{it}</button>
              ))}
            </div>
          </div>
        </div>
      </Frame>
    );
  }

  // Main view
  return (
    <Frame>
      <div className="cf-screen" style={{
        position: "relative", height: "100dvh",
        background: TOKENS.bg,
        display: "flex", flexDirection: "column",
        padding: "56px 0 24px", overflow: "hidden",
      }}>
        <DotsBg opacity={0.05} />
        <div style={{
          position: "relative", zIndex: 2, padding: "0 22px 14px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <button onClick={() => navigate({ to: "/new/hub" })} style={{
            appearance: "none", cursor: "pointer",
            width: 36, height: 36, borderRadius: 999,
            border: `2.5px solid ${TOKENS.ink}`, background: TOKENS.paper,
            fontSize: 14, fontWeight: 900, color: TOKENS.ink,
            boxShadow: `3px 3px 0 ${TOKENS.ink}`,
          }}>←</button>
          <h2 style={{
            fontFamily: TOKENS.display, fontWeight: 900, fontSize: 22,
            letterSpacing: "-0.035em", margin: 0, color: TOKENS.ink,
          }}>culture</h2>
          <span style={{ width: 36 }} />
        </div>

        {/* Tabs */}
        <div style={{ position: "relative", zIndex: 2, padding: "0 22px 10px", display: "flex", gap: 6 }}>
          {([["plans","tier plans"],["activities","all activities"]] as const).map(([id, l]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              appearance: "none", cursor: "pointer", flex: 1,
              padding: "8px 12px",
              border: `2.5px solid ${TOKENS.ink}`, borderRadius: 999,
              background: tab === id ? TOKENS.ink : TOKENS.paper,
              color: tab === id ? TOKENS.paper : TOKENS.ink,
              fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 800,
              boxShadow: tab === id ? "none" : `2px 2px 0 ${TOKENS.ink}`,
            }}>{l}</button>
          ))}
        </div>

        <div style={{
          position: "relative", zIndex: 2, flex: 1, overflowY: "auto",
          padding: "0 22px 12px", scrollbarWidth: "none",
        }}>
          <p style={{
            fontFamily: TOKENS.ui, fontSize: 12.5, fontWeight: 600,
            color: TOKENS.ink, opacity: 0.7, margin: "4px 0 14px", lineHeight: 1.45,
          }}>
            {tab === "plans"
              ? "3-tier plans for any city — pick cheap / mid / high-end and sparkle prints it."
              : "Tap a category to pick a specific activity. We mix them into your pass."}
          </p>

          {tab === "plans" && TIER_PLANS.map((p) => (
            <button key={p.id} onClick={() => setActivePlan(p.id)} style={{
              appearance: "none", cursor: "pointer", textAlign: "left" as const, width: "100%",
              display: "flex", alignItems: "center", gap: 12,
              padding: 14, marginBottom: 8,
              border: `2.5px solid ${TOKENS.ink}`, borderRadius: 14,
              background: p.color, color: p.light ? TOKENS.paper : TOKENS.ink,
              boxShadow: `4px 4px 0 ${TOKENS.ink}`,
            }}>
              <span style={{ fontSize: 32, lineHeight: 1, flexShrink: 0 }}>{p.e}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: TOKENS.display, fontWeight: 900, fontSize: 17,
                  letterSpacing: "-0.025em", lineHeight: 1.1,
                }}>{p.l}</div>
                <div style={{
                  fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 700,
                  opacity: 0.7, marginTop: 2, lineHeight: 1.4, letterSpacing: ".04em",
                }}>$ {p.cheap[0]}  ·  $$ {p.mid[0]}  ·  $$$ {p.high[0]}</div>
              </div>
              <span style={{ fontSize: 16, opacity: 0.65 }}>›</span>
            </button>
          ))}

          {tab === "activities" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {CULTURE.map((c) => (
                <button key={c.id} onClick={() => setActiveCat(c.id)} style={{
                  appearance: "none", cursor: "pointer", textAlign: "left" as const,
                  padding: 12,
                  border: `2.5px solid ${TOKENS.ink}`, borderRadius: 14,
                  background: c.color, color: c.light ? TOKENS.paper : TOKENS.ink,
                  boxShadow: `4px 4px 0 ${TOKENS.ink}`,
                  display: "flex", flexDirection: "column" as const, gap: 4, minHeight: 120,
                }}>
                  <span style={{ fontSize: 28, lineHeight: 1 }}>{c.e}</span>
                  <span style={{
                    fontFamily: TOKENS.display, fontWeight: 900, fontSize: 14,
                    letterSpacing: "-0.025em", lineHeight: 1.1, marginTop: 4,
                  }}>{c.l}</span>
                  <span style={{
                    fontFamily: TOKENS.mono, fontSize: 8.5, fontWeight: 800,
                    letterSpacing: ".1em", opacity: 0.7, marginTop: "auto",
                    textTransform: "uppercase" as const,
                  }}>{c.items.length} ACTIVITIES</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Frame>
  );
}
