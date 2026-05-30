import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { DotsBg, Frame, Ticket, TOKENS } from "@/components/new-confetti/shell";

export const Route = createFileRoute("/new/flipcard")({ component: FlipCardPage });

type StopData = {
  id: number; name: string; time: string; tag: string; sub: string;
  cost: string; dur: string; color: string; vibe?: string; mustOrder?: string; walkNext?: string;
};

const DEMO_STOPS: StopData[] = [
  {
    id: 1, name: "Skinny Pete's",  time: "7:30", tag: "dive bar",  sub: "wythe ave · williamsburg",
    cost: "$0", dur: "60m", color: TOKENS.accent2,
    vibe: "casual · no dress code · local",
    walkNext: "7 min walk to Lupa Notte",
  },
  {
    id: 2, name: "Lupa Notte",     time: "9:00", tag: "Italian",   sub: "waverly pl · w village",
    cost: "$55", dur: "90m", color: TOKENS.accent1,
    mustOrder: "bucatini all'amatriciana · house Barolo",
    walkNext: "3 min walk to Quartz Room",
  },
  {
    id: 3, name: "Quartz Room",    time: "11:00", tag: "live music", sub: "bedford ave · wburg",
    cost: "$15", dur: "2h", color: TOKENS.accent3,
    vibe: "standing room · loud · crowd",
  },
];

type Intel = {
  yelp: string; reviews: number; photos: string[];
  crowd: string; wait: string; dress: string; bath: string; parking: string; tip: string; tikSaves: number;
};

const INTEL: Record<number, Intel> = {
  1: { yelp: "4.4", reviews: 612, photos: ["🍺","🥨","🎸"],
       crowd: "~30% full", wait: "0 min", dress: "Whatever · no dress code",
       bath: "2 unisex · clean", parking: "Wythe Ave free parking",
       tip: "Bartender's name is Dee. Tell her Maya sent you.", tikSaves: 18 },
  2: { yelp: "4.7", reviews: 380, photos: ["🍝","🕯","🍷"],
       crowd: "~74% full · packed by 9 PM", wait: "12 min if walk-in",
       dress: "Smart casual · no shorts", bath: "1 floor up · narrow stairs",
       parking: "Valet $35 · L2 charger",
       tip: "Counter seats > tables. Ask for Marco's section.", tikSaves: 247 },
  3: { yelp: "4.4", reviews: 1620, photos: ["🎤","🎸","🥁"],
       crowd: "Doors at 10 · set 11", wait: "Standing room · arrive 10:45",
       dress: "Comfortable · closed-toe", bath: "Down a flight · long lines",
       parking: "Street only · 0.2 mi",
       tip: "Pearl Charles plays 35 min · merch table to left of stage.", tikSaves: 64 },
};

function DetailRow({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "baseline", padding: "4px 0", fontFamily: TOKENS.ui, fontSize: 12 }}>
      <span style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".12em", color: TOKENS.paper, opacity: 0.65, textTransform: "uppercase" as const, width: 70, flexShrink: 0 }}>{k}</span>
      <span style={{ fontWeight: 700, flex: 1, color: TOKENS.paper, opacity: 0.95 }}>{v}</span>
    </div>
  );
}

function StopFlipCard({ stop, index, isLast }: { stop: StopData; index: number; isLast: boolean }) {
  const [flipped, setFlipped] = useState(false);
  const intel = INTEL[stop.id];

  return (
    <div style={{
      display: "flex", gap: 12,
      paddingBottom: isLast ? 0 : 14,
      marginBottom: isLast ? 0 : 14,
      borderBottom: isLast ? "none" : "1.5px dashed rgba(0,0,0,0.15)",
    }}>
      {/* Number rail */}
      <div style={{ width: 36, display: "flex", flexDirection: "column" as const, alignItems: "center", flexShrink: 0 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 999,
          border: `2.5px solid ${TOKENS.ink}`, background: stop.color,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: TOKENS.display, fontWeight: 900, fontSize: 18, color: TOKENS.ink,
        }}>{index + 1}</div>
        {!isLast && (
          <div style={{
            flex: 1, width: 3, marginTop: 6, marginBottom: -8,
            background: `repeating-linear-gradient(180deg, ${TOKENS.ink} 0, ${TOKENS.ink} 3px, transparent 3px, transparent 7px)`,
          }} />
        )}
      </div>
      {/* Card with 3D flip */}
      <div style={{ flex: 1, minWidth: 0, perspective: 1000 }}>
        <div style={{
          position: "relative" as const, width: "100%",
          transformStyle: "preserve-3d",
          transition: "transform .6s cubic-bezier(.4,1.2,.4,1)",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0)",
        }}>
          {/* FRONT */}
          <button onClick={() => setFlipped(true)} style={{
            appearance: "none", cursor: "pointer", width: "100%",
            background: "transparent", border: "none", padding: 0,
            textAlign: "left" as const, backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontFamily: TOKENS.mono, fontSize: 11, fontWeight: 800, letterSpacing: ".1em", color: TOKENS.ink, opacity: 0.6 }}>
                    {stop.time} PM · <span style={{ textTransform: "uppercase" as const }}>{stop.tag}</span>
                  </div>
                  <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 20, letterSpacing: "-0.025em", color: TOKENS.ink, marginTop: 2 }}>{stop.name}</div>
                  <div style={{ fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 600, color: TOKENS.ink, opacity: 0.65, marginTop: 2 }}>{stop.sub}</div>
                </div>
                <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                  <div style={{ fontFamily: TOKENS.mono, fontSize: 11, fontWeight: 800, color: TOKENS.ink }}>{stop.cost}</div>
                  <div style={{ fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 700, color: TOKENS.ink, opacity: 0.5, marginTop: 2 }}>{stop.dur}</div>
                </div>
              </div>
              {stop.vibe && (
                <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap" as const, gap: 4 }}>
                  {stop.vibe.split(" · ").map((v) => (
                    <span key={v} style={{
                      padding: "2px 7px", background: TOKENS.bg,
                      border: `1.5px solid ${TOKENS.ink}`, borderRadius: 4,
                      fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".06em", color: TOKENS.ink,
                    }}>{v}</span>
                  ))}
                </div>
              )}
              {stop.mustOrder && (
                <div style={{
                  marginTop: 8, padding: "6px 10px", background: TOKENS.accent2,
                  border: `1.5px solid ${TOKENS.ink}`, borderRadius: 8,
                  fontFamily: TOKENS.ui, fontSize: 11, fontWeight: 800, color: TOKENS.ink, lineHeight: 1.35,
                }}>
                  <span style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".12em", color: TOKENS.ink, opacity: 0.6, textTransform: "uppercase" as const, marginRight: 5 }}>★ must-order</span>
                  {stop.mustOrder}
                </div>
              )}
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                {stop.walkNext ? (
                  <div style={{ fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 700, color: TOKENS.ink, opacity: 0.65, letterSpacing: ".04em", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: TOKENS.accent1 }}>↓</span><span>{stop.walkNext}</span>
                  </div>
                ) : <span />}
                <span style={{
                  padding: "3px 9px", background: TOKENS.paper,
                  border: `1.5px solid ${TOKENS.ink}`, borderRadius: 999,
                  fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".1em", color: TOKENS.ink,
                  textTransform: "uppercase" as const, display: "inline-flex", alignItems: "center", gap: 4,
                }}>tap for intel ↻</span>
              </div>
            </div>
          </button>
          {/* BACK */}
          <div style={{
            position: "absolute" as const, top: 0, left: 0, right: 0,
            backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}>
            <div style={{
              padding: 12, background: TOKENS.ink, color: TOKENS.paper,
              border: `2.5px solid ${TOKENS.ink}`, borderRadius: 14, boxShadow: `3px 3px 0 ${TOKENS.accent1}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div>
                  <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".14em", opacity: 0.7 }}>FETCHED INTEL · {stop.name.toUpperCase()}</div>
                  <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 17, letterSpacing: "-0.025em", marginTop: 2 }}>What you'll actually find.</div>
                </div>
                <button onClick={() => setFlipped(false)} style={{
                  appearance: "none", cursor: "pointer", width: 30, height: 30, borderRadius: 999,
                  border: `2px solid ${TOKENS.paper}`, background: "transparent",
                  color: TOKENS.paper, fontSize: 11, fontWeight: 900,
                }}>↺</button>
              </div>
              {/* Source badges */}
              <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" as const }}>
                <span style={{ padding: "2px 7px", background: "#d32323", color: "#fff", border: `1.5px solid ${TOKENS.paper}`, borderRadius: 4, fontFamily: TOKENS.mono, fontSize: 8, fontWeight: 900 }}>YELP {intel.yelp} · {intel.reviews}</span>
                <span style={{ padding: "2px 7px", background: TOKENS.ink, color: TOKENS.paper, border: `1.5px solid ${TOKENS.paper}`, borderRadius: 4, fontFamily: TOKENS.mono, fontSize: 8, fontWeight: 900 }}>♪ TT · {intel.tikSaves} SAVES</span>
                <span style={{ padding: "2px 7px", background: TOKENS.accent2, color: TOKENS.ink, border: `1.5px solid ${TOKENS.paper}`, borderRadius: 4, fontFamily: TOKENS.mono, fontSize: 8, fontWeight: 900 }}>GOOGLE · LIVE</span>
              </div>
              {/* Photo strip */}
              <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
                {intel.photos.map((p, i) => (
                  <div key={i} style={{
                    flex: 1, aspectRatio: "1",
                    background: [TOKENS.accent1, TOKENS.accent2, TOKENS.accent3][i],
                    border: `1.5px solid ${TOKENS.paper}`, borderRadius: 6,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                  }}>{p}</div>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 5 }}>
                <DetailRow k="crowd"    v={intel.crowd} />
                <DetailRow k="wait"     v={intel.wait} />
                <DetailRow k="dress"    v={intel.dress} />
                <DetailRow k="bathrooms" v={intel.bath} />
                <DetailRow k="parking"  v={intel.parking} />
              </div>
              <div style={{ marginTop: 10, padding: "8px 10px", background: TOKENS.accent1, color: TOKENS.ink, border: `1.5px solid ${TOKENS.paper}`, borderRadius: 8 }}>
                <div style={{ fontFamily: TOKENS.mono, fontSize: 8, fontWeight: 800, letterSpacing: ".12em", opacity: 0.7 }}>✣ SPARKLE TIP</div>
                <div style={{ fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 800, marginTop: 2, lineHeight: 1.35 }}>{intel.tip}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FlipCardPage() {
  const navigate = useNavigate();
  return (
    <Frame>
      <div className="cf-screen" style={{
        position: "relative", height: "100dvh", background: TOKENS.bg,
        display: "flex", flexDirection: "column", padding: "56px 22px 24px", overflow: "hidden",
      }}>
        <DotsBg opacity={0.05} />
        <div style={{
          position: "relative", zIndex: 2,
          display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14,
        }}>
          <button onClick={() => navigate({ to: "/new/pass" })} style={{
            appearance: "none", cursor: "pointer", width: 36, height: 36, borderRadius: 999,
            border: `2.5px solid ${TOKENS.ink}`, background: TOKENS.paper,
            fontSize: 14, fontWeight: 900, color: TOKENS.ink, boxShadow: `3px 3px 0 ${TOKENS.ink}`,
          }}>←</button>
          <h2 style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 22, letterSpacing: "-0.035em", margin: 0, color: TOKENS.ink }}>tonight's stops</h2>
          <span style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, color: TOKENS.ink, opacity: 0.5, letterSpacing: ".14em" }}>TAP TO FLIP</span>
        </div>
        <div style={{
          position: "relative", zIndex: 2,
          fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800,
          letterSpacing: ".14em", color: TOKENS.ink, opacity: 0.55,
          textTransform: "uppercase" as const, marginBottom: 10,
        }}>3 STOPS · BROOKLYN DATE NIGHT · #A7K2</div>
        <Ticket color={TOKENS.paper} notch style={{ padding: 14, position: "relative", zIndex: 2, flex: 1, overflowY: "auto" }}>
          {DEMO_STOPS.map((stop, i) => (
            <StopFlipCard key={stop.id} stop={stop} index={i} isLast={i === DEMO_STOPS.length - 1} />
          ))}
        </Ticket>
      </div>
    </Frame>
  );
}
