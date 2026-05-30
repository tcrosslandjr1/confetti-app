import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ChunkyButton,
  DotsBg,
  Frame,
  Icons,
  Stamp,
  Ticket,
  TOKENS,
} from "@/components/new-confetti/shell";

export const Route = createFileRoute("/new/family-pass")({ component: FamilyPassPage });

type PassStop = {
  time: string; name: string; tag: string; dur: string; cost: string;
  icon: string; c: string; addr: string;
  badges: string[];
};

const PARK_STOPS: PassStop[] = [
  { time: "9:30",  name: "Prospect Park lawn",   tag: "open play",             dur: "90m", cost: "$0",  icon: "🌳", c: TOKENS.accent2, addr: "95 Prospect Park West",  badges: ["🌳 fenced", "🛼 stroller ok"] },
  { time: "11:30", name: "The Bluestone Lane",    tag: "kid menu + bathroom",   dur: "60m", cost: "$28", icon: "🥪", c: TOKENS.accent1, addr: "194 7th Ave",            badges: ["🚻 changing table", "🍝 kid menu"] },
  { time: "1:00",  name: "Carousel + library hr", tag: "wind-down",            dur: "90m", cost: "$8",  icon: "🎠", c: TOKENS.accent3, addr: "450 Flatbush Ave",        badges: ["😴 nap-friendly"] },
];

const MUSEUM_STOPS: PassStop[] = [
  { time: "10:00", name: "BK Children's Museum",  tag: "museum",               dur: "2h",  cost: "$32", icon: "🏛", c: TOKENS.accent3, addr: "145 Brooklyn Ave",       badges: ["🏛 sensory rooms", "🛼 stroller ok"] },
  { time: "12:30", name: "Pizza Moto",             tag: "kid menu",             dur: "1h",  cost: "$36", icon: "🍕", c: TOKENS.accent1, addr: "338 Hamilton Ave",       badges: ["🍕 kid menu", "🚻 clean restrooms"] },
  { time: "2:00",  name: "Prospect Park playground", tag: "free play",         dur: "90m", cost: "$0",  icon: "🌳", c: TOKENS.accent2, addr: "95 Prospect Park West",  badges: ["🌳 fenced", "😴 nap spot nearby"] },
];

const STATS = [
  { l: "cost", v: "$72", c: TOKENS.paper },
  { l: "energy", v: "medium", c: TOKENS.accent2 },
  { l: "effort", v: "low", c: TOKENS.accent1 },
  { l: "naps", v: "1", c: TOKENS.paper },
];

const PACK_LIST = [
  { e: "🧴", item: "Sunscreen SPF 50",     note: "reapply every 2h" },
  { e: "💧", item: "Water bottles × 3",    note: "32 oz each" },
  { e: "🍌", item: "Snack bag",             note: "fruits + crackers" },
  { e: "🧻", item: "Wipes × 2 packs",      note: "always" },
  { e: "👕", item: "Change of clothes",     note: "1 set per kid" },
  { e: "🩹", item: "First-aid kit",         note: "band-aids, antiseptic" },
  { e: "🎒", item: "Kids backpack",         note: "let them carry snacks" },
  { e: "💊", item: "Medication if needed",  note: "allergy meds, epipen" },
];

const CHECKLIST = [
  { e: "🛣", item: "Check route on maps before leaving" },
  { e: "🅿", item: "Bookmark parking garage" },
  { e: "📍", item: "Screenshot each venue address" },
  { e: "⏰", item: "Set nap-time alarm for 12:45 PM" },
  { e: "💰", item: "Cash for carousel + tips" },
  { e: "📱", item: "Charge phone — you'll take 400 photos" },
  { e: "🎠", item: "Check Carousel hours (closes 4 PM)" },
  { e: "🌦", item: "Monitor weather — backup is indoor play" },
];

const BACKUP = [
  { e: "🎪", name: "Brooklyn Children's Museum indoor",  why: "If rain — same area, $16/kid" },
  { e: "📚", name: "BPL Central story hour",             why: "2 PM slot · totally free" },
  { e: "🎳", name: "Lucky Strike Bowling",               why: "Bumpers for kids · all ages" },
  { e: "🍦", name: "Van Leeuwen + Prospect walk",        why: "Short loop, low energy" },
];

function KidBadge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "3px 8px",
      background: color,
      border: `1.5px solid ${TOKENS.ink}`, borderRadius: 6,
      fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800,
      letterSpacing: ".08em", color: TOKENS.ink,
    }}>{children}</span>
  );
}

function FamilyPassPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("plan");
  const [flippedIdx, setFlippedIdx] = useState<number | null>(null);
  const stops = PARK_STOPS;

  return (
    <Frame>
      <div className="cf-screen" style={{
        position: "relative", height: "100dvh",
        background: TOKENS.bg,
        display: "flex", flexDirection: "column",
        padding: "56px 22px 22px",
        overflow: "hidden",
      }}>
        <DotsBg opacity={0.05} />

        {/* Header */}
        <div style={{
          position: "relative", zIndex: 2,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 14,
        }}>
          <button onClick={() => navigate({ to: "/new/family-plan" })} style={{
            appearance: "none", cursor: "pointer",
            width: 36, height: 36, borderRadius: 999,
            border: `2.5px solid ${TOKENS.ink}`, background: TOKENS.paper,
            fontSize: 14, fontWeight: 900, color: TOKENS.ink,
            boxShadow: `3px 3px 0 ${TOKENS.ink}`,
          }}>←</button>
          <Stamp color={TOKENS.accent1} rotate={2}>family pass</Stamp>
          <span style={{
            fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800,
            letterSpacing: ".12em", color: TOKENS.ink, opacity: 0.55,
          }}>#FK·8M2</span>
        </div>

        <div style={{
          position: "relative", zIndex: 2,
          flex: 1, overflowY: "auto", overflowX: "hidden",
          marginRight: -22, paddingRight: 22, scrollbarWidth: "none",
        }}>
          <h2 style={{
            fontFamily: TOKENS.display, fontWeight: 900,
            fontSize: 36, lineHeight: 0.95, letterSpacing: "-0.04em",
            margin: "0 0 6px", color: TOKENS.ink,
          }}>🌳 Park Day</h2>
          <div style={{
            fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800,
            letterSpacing: ".12em", color: TOKENS.ink, opacity: 0.55,
            textTransform: "uppercase" as const, marginBottom: 14,
          }}>SAT · 3 STOPS · 4h 30m · 1 KID AGE 4 · 2 ADULTS</div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 14 }}>
            {STATS.map((m) => (
              <div key={m.l} style={{
                padding: "8px 6px", textAlign: "center" as const,
                border: `2px solid ${TOKENS.ink}`, borderRadius: 10,
                background: m.c,
              }}>
                <div style={{
                  fontFamily: TOKENS.mono, fontSize: 8, fontWeight: 800,
                  letterSpacing: ".12em", color: TOKENS.ink, opacity: 0.6,
                  textTransform: "uppercase" as const,
                }}>{m.l}</div>
                <div style={{
                  fontFamily: TOKENS.display, fontWeight: 900, fontSize: 14,
                  letterSpacing: "-0.02em", color: TOKENS.ink, marginTop: 1,
                }}>{m.v}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
            {["plan", "pack", "check", "backup"].map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{
                appearance: "none", cursor: "pointer", flex: 1,
                padding: "6px 4px",
                border: `2px solid ${TOKENS.ink}`, borderRadius: 999,
                background: tab === t ? TOKENS.ink : TOKENS.paper,
                color: tab === t ? TOKENS.paper : TOKENS.ink,
                fontFamily: TOKENS.ui, fontSize: 11, fontWeight: 800,
              }}>{t === "check" ? "checklist" : t === "pack" ? "pack list" : t === "backup" ? "backup" : "plan"}</button>
            ))}
          </div>

          {/* Plan tab */}
          {tab === "plan" && (
            <Ticket color={TOKENS.paper} notch={false} style={{ padding: 14, marginBottom: 14 }}>
              {stops.map((s, i) => (
                <div key={i} onClick={() => setFlippedIdx(flippedIdx === i ? null : i)} style={{
                  paddingBottom: i < stops.length - 1 ? 14 : 0,
                  marginBottom: i < stops.length - 1 ? 14 : 0,
                  borderBottom: i < stops.length - 1 ? `1.5px dashed rgba(0,0,0,0.15)` : "none",
                  cursor: "pointer",
                }}>
                  {flippedIdx !== i ? (
                    <div style={{ display: "flex", gap: 12 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 999, flexShrink: 0,
                        border: `2.5px solid ${TOKENS.ink}`, background: s.c,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 22,
                      }}>{s.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800,
                          letterSpacing: ".12em", color: TOKENS.ink, opacity: 0.6,
                          textTransform: "uppercase" as const,
                        }}>{s.time} · {s.tag}</div>
                        <div style={{
                          fontFamily: TOKENS.display, fontWeight: 900, fontSize: 18,
                          letterSpacing: "-0.025em", color: TOKENS.ink, marginTop: 2,
                        }}>{s.name}</div>
                        <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" as const }}>
                          {s.badges.map((b) => <KidBadge key={b} color={TOKENS.accent2}>{b}</KidBadge>)}
                          <KidBadge color={TOKENS.paper}>🅿 street · free wknds</KidBadge>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                        <div style={{ fontFamily: TOKENS.mono, fontSize: 11, fontWeight: 800, color: TOKENS.ink }}>{s.cost}</div>
                        <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 700, color: TOKENS.ink, opacity: 0.5, marginTop: 2 }}>{s.dur}</div>
                        <div style={{
                          fontFamily: TOKENS.mono, fontSize: 8.5, fontWeight: 800,
                          letterSpacing: ".08em", color: TOKENS.ink, opacity: 0.5, marginTop: 4,
                        }}>flip ↻</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      padding: 12,
                      background: TOKENS.ink, color: TOKENS.paper,
                      border: `2px solid ${TOKENS.ink}`, borderRadius: 12,
                      boxShadow: `3px 3px 0 ${TOKENS.accent1}`,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 16, letterSpacing: "-0.025em" }}>
                          🅿 Parking · {s.name}
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setFlippedIdx(null); }} style={{
                          appearance: "none", cursor: "pointer",
                          background: "transparent", border: `1.5px solid ${TOKENS.paper}`,
                          borderRadius: 999, color: TOKENS.paper,
                          fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800,
                          padding: "2px 8px",
                        }}>↺</button>
                      </div>
                      <div style={{ fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 700, opacity: 0.85, lineHeight: 1.4 }}>
                        Free street parking weekends. Loop closed Sat-Sun — park near 9th St entrance.
                      </div>
                      <div style={{
                        marginTop: 8, padding: "6px 8px",
                        background: TOKENS.accent1, color: TOKENS.ink,
                        border: `1.5px solid ${TOKENS.paper}`, borderRadius: 6,
                        fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".08em",
                      }}>🔋 No EV chargers nearby · nearest L2 is 0.4 mi</div>
                    </div>
                  )}
                </div>
              ))}
            </Ticket>
          )}

          {/* Pack list tab */}
          {tab === "pack" && (
            <div>
              <div style={{
                fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800,
                letterSpacing: ".14em", color: TOKENS.ink, opacity: 0.55,
                textTransform: "uppercase" as const, marginBottom: 10,
              }}>{PACK_LIST.length} ITEMS · SPARKLE BUILT THIS LIST</div>
              {PACK_LIST.map((p, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 14px", marginBottom: 8,
                  border: `2px solid ${TOKENS.ink}`, borderRadius: 12,
                  background: TOKENS.paper,
                  boxShadow: `3px 3px 0 ${TOKENS.ink}`,
                }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{p.e}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 15, letterSpacing: "-0.02em", color: TOKENS.ink }}>{p.item}</div>
                    <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 700, color: TOKENS.ink, opacity: 0.55, marginTop: 2, letterSpacing: ".06em" }}>{p.note}</div>
                  </div>
                  <div style={{
                    width: 22, height: 22, borderRadius: 999,
                    border: `2px solid ${TOKENS.ink}`, background: TOKENS.bg,
                    flexShrink: 0,
                  }} />
                </div>
              ))}
            </div>
          )}

          {/* Checklist tab */}
          {tab === "check" && (
            <div>
              <div style={{
                fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800,
                letterSpacing: ".14em", color: TOKENS.ink, opacity: 0.55,
                textTransform: "uppercase" as const, marginBottom: 10,
              }}>BEFORE YOU LEAVE · {CHECKLIST.length} ITEMS</div>
              {CHECKLIST.map((c, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 14px", marginBottom: 8,
                  border: `2px solid ${TOKENS.ink}`, borderRadius: 12,
                  background: TOKENS.paper,
                  boxShadow: `3px 3px 0 ${TOKENS.ink}`,
                }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{c.e}</span>
                  <div style={{ flex: 1, fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 800, color: TOKENS.ink }}>{c.item}</div>
                  <div style={{
                    width: 22, height: 22, borderRadius: 999,
                    border: `2px solid ${TOKENS.ink}`, background: TOKENS.bg,
                    flexShrink: 0,
                  }} />
                </div>
              ))}
            </div>
          )}

          {/* Backup tab */}
          {tab === "backup" && (
            <div>
              <div style={{
                fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800,
                letterSpacing: ".14em", color: TOKENS.ink, opacity: 0.55,
                textTransform: "uppercase" as const, marginBottom: 10,
              }}>IF PLANS CHANGE · SPARKLE'S BACKUP PICKS</div>
              {BACKUP.map((b, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: 14, marginBottom: 8,
                  border: `2.5px solid ${TOKENS.ink}`, borderRadius: 12,
                  background: [TOKENS.accent1, TOKENS.accent2, TOKENS.paper, TOKENS.accent3][i] || TOKENS.paper,
                  boxShadow: `3px 3px 0 ${TOKENS.ink}`,
                }}>
                  <span style={{ fontSize: 24, flexShrink: 0 }}>{b.e}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 15, letterSpacing: "-0.02em", color: TOKENS.ink }}>{b.name}</div>
                    <div style={{ fontFamily: TOKENS.mono, fontSize: 9.5, fontWeight: 700, color: TOKENS.ink, opacity: 0.65, marginTop: 2, letterSpacing: ".04em" }}>{b.why}</div>
                  </div>
                  <span style={{ fontSize: 16, color: TOKENS.ink, opacity: 0.5 }}>›</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ height: 8 }} />
        </div>

        {/* CTA */}
        <div style={{ position: "relative", zIndex: 2, paddingTop: 12, display: "flex", gap: 8 }}>
          <button onClick={() => navigate({ to: "/new/family-plan" })} style={{
            appearance: "none", cursor: "pointer",
            padding: "14px 16px",
            border: `2.5px solid ${TOKENS.ink}`, borderRadius: 14,
            background: TOKENS.paper, color: TOKENS.ink,
            fontFamily: TOKENS.ui, fontSize: 14, fontWeight: 800,
            boxShadow: `3px 3px 0 ${TOKENS.ink}`,
          }}>← edit plan</button>
          <ChunkyButton variant="accent" onClick={() => navigate({ to: "/new/booking" })} icon={Icons.arrow}>
            book + go
          </ChunkyButton>
        </div>
      </div>
    </Frame>
  );
}
