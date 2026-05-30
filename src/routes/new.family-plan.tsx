import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ChunkyButton,
  DotsBg,
  Frame,
  Icons,
  Stamp,
  TOKENS,
} from "@/components/new-confetti/shell";

export const Route = createFileRoute("/new/family-plan")({ component: FamilyPlanPage });

// ─── Data ──────────────────────────────────────────────────────
const FAMILY_PORTALS = [
  { id: "park",     icon: "🌳", label: "park day",      sub: "2-4h · outdoor" },
  { id: "museum",   icon: "🏛", label: "museum day",     sub: "indoor · stroller" },
  { id: "aquarium", icon: "🐠", label: "aquarium/zoo",   sub: "half-day" },
  { id: "story",    icon: "📖", label: "library hour",   sub: "free · quiet" },
  { id: "play",     icon: "🎪", label: "indoor play",    sub: "rainy backup" },
  { id: "tramp",    icon: "🤸", label: "trampoline",     sub: "5+ years" },
  { id: "splash",   icon: "💦", label: "splash pad",     sub: "hot day · free" },
  { id: "cook",     icon: "🥞", label: "kids cooking",   sub: "at home · 90m" },
  { id: "yard",     icon: "🎯", label: "backyard games", sub: "low effort" },
  { id: "bday",     icon: "🎂", label: "birthday party", sub: "full planner" },
  { id: "picnic",   icon: "🧺", label: "family picnic",  sub: "pack list inc." },
  { id: "movie",    icon: "🎬", label: "movie day",      sub: "wind-down" },
  { id: "rainy",    icon: "🌧", label: "rainy rescue",   sub: "today's plan" },
  { id: "school",   icon: "🎒", label: "school break",   sub: "5-day plan" },
  { id: "cousins",  icon: "👯", label: "cousins day",    sub: "mixed ages" },
  { id: "grand",    icon: "👵", label: "grandparents",   sub: "low energy" },
];

type CrewMember = { id: string; kind: "adult" | "kid"; label: string; age?: number };

const CREW_PRESETS = [
  { id: "just-me",      l: "just me",          e: "👤" },
  { id: "me-kids",      l: "me + kids",         e: "🧑‍🍼" },
  { id: "partner-kids", l: "partner + kids",    e: "💞" },
  { id: "coparents",    l: "co-parents + kids", e: "👪" },
  { id: "two-fams",     l: "another family",    e: "👯" },
  { id: "grand",        l: "with grandparents", e: "👵" },
];

const MUST_HAVES = [
  { id: "stroller",    label: "🛼 stroller-friendly" },
  { id: "restrooms",   label: "🚻 restrooms" },
  { id: "foodNearby",  label: "🍎 food nearby" },
  { id: "nap",         label: "😴 nap-time ok" },
  { id: "weather",     label: "🌦 weather backup" },
  { id: "parking",     label: "🅿 easy parking" },
];

// ─── Section label ───────────────────────────────────────────
function FamilyLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800,
      letterSpacing: ".14em", textTransform: "uppercase" as const,
      color: TOKENS.ink, opacity: 0.55, marginBottom: 8,
    }}>{children}</div>
  );
}

// ─── Page ─────────────────────────────────────────────────────
function FamilyPlanPage() {
  const navigate = useNavigate();
  const [activePortal, setActivePortal] = useState("park");
  const [crew, setCrew] = useState<CrewMember[]>([
    { id: "a1", kind: "adult", label: "me" },
    { id: "a2", kind: "adult", label: "partner" },
    { id: "k1", kind: "kid", age: 4, label: "Mia" },
  ]);
  const [must, setMust] = useState<Record<string, boolean>>({
    stroller: true, restrooms: true, foodNearby: true,
    nap: false, weather: true, parking: false,
  });
  const [indoor, setIndoor] = useState("either");
  const [effort, setEffort] = useState("low");
  const [time, setTime] = useState("🌤 afternoon");

  const portal = FAMILY_PORTALS.find((p) => p.id === activePortal) || FAMILY_PORTALS[0];
  const kids = crew.filter((c) => c.kind === "kid");

  const addKid = () =>
    setCrew([...crew, { id: "k" + Date.now(), kind: "kid", age: 6, label: `kid ${kids.length + 1}` }]);
  const addAdult = () =>
    setCrew([...crew, { id: "a" + Date.now(), kind: "adult", label: `adult ${crew.filter(c => c.kind === "adult").length + 1}` }]);
  const removeMember = (id: string) => setCrew(crew.filter((c) => c.id !== id));
  const setKidAge = (id: string, age: number) =>
    setCrew(crew.map((c) => (c.id === id ? { ...c, age } : c)));

  return (
    <Frame>
      <div className="cf-screen" style={{
        position: "relative", height: "100dvh",
        background: TOKENS.bg,
        display: "flex", flexDirection: "column",
        padding: "56px 22px 24px",
        overflow: "hidden",
      }}>
        <DotsBg opacity={0.05} />

        {/* Header */}
        <div style={{
          position: "relative", zIndex: 2,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 14,
        }}>
          <button onClick={() => navigate({ to: "/new/hub" })} style={{
            appearance: "none", cursor: "pointer",
            background: "transparent", border: "none",
            fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 800,
            color: TOKENS.ink, opacity: 0.6,
          }}>← back</button>
          <Stamp color={TOKENS.accent1} rotate={-2}>family mode</Stamp>
          <span style={{ width: 36 }} />
        </div>

        <div style={{
          position: "relative", zIndex: 2,
          flex: 1, overflowY: "auto", overflowX: "hidden",
          marginRight: -22, paddingRight: 22, scrollbarWidth: "none",
        }}>
          {/* Portal picker */}
          <h2 style={{
            fontFamily: TOKENS.display, fontWeight: 900,
            fontSize: 34, lineHeight: 0.95, letterSpacing: "-0.04em",
            margin: "0 0 6px", color: TOKENS.ink,
          }}>{portal.icon} {portal.label}</h2>
          <p style={{
            fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 700,
            color: TOKENS.ink, opacity: 0.65, margin: "0 0 14px",
          }}>{portal.sub} · stroller-friendly, restrooms verified</p>

          {/* Portal grid */}
          <FamilyLabel>activity type</FamilyLabel>
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16,
          }}>
            {FAMILY_PORTALS.map((p) => (
              <button key={p.id} onClick={() => setActivePortal(p.id)} style={{
                appearance: "none", cursor: "pointer", textAlign: "left" as const,
                padding: 10,
                border: `2.5px solid ${TOKENS.ink}`, borderRadius: 12,
                background: activePortal === p.id ? TOKENS.accent1 : TOKENS.paper,
                color: TOKENS.ink,
                boxShadow: activePortal === p.id ? `3px 3px 0 ${TOKENS.ink}` : "none",
                transform: activePortal === p.id ? "translate(-1px,-1px)" : "none",
                transition: "all .12s",
                display: "flex", flexDirection: "column" as const, gap: 2, minHeight: 80,
              }}>
                <span style={{ fontSize: 22, marginBottom: 2 }}>{p.icon}</span>
                <span style={{
                  fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 900,
                  letterSpacing: "-0.01em", lineHeight: 1.1,
                }}>{p.label}</span>
                <span style={{
                  fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 700,
                  opacity: 0.55, letterSpacing: ".06em", marginTop: "auto",
                }}>{p.sub}</span>
              </button>
            ))}
          </div>

          {/* Crew presets */}
          <FamilyLabel>crew preset</FamilyLabel>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const, marginBottom: 12 }}>
            {CREW_PRESETS.map((cp) => (
              <button key={cp.id} style={{
                appearance: "none", cursor: "pointer",
                padding: "6px 12px",
                border: `2px solid ${TOKENS.ink}`, borderRadius: 999,
                background: TOKENS.paper, color: TOKENS.ink,
                fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 800,
              }}>{cp.e} {cp.l}</button>
            ))}
          </div>

          {/* Who's coming */}
          <FamilyLabel>who's coming</FamilyLabel>
          <div style={{
            padding: 12, marginBottom: 16,
            border: `2.5px solid ${TOKENS.ink}`, borderRadius: 14,
            background: TOKENS.paper,
            boxShadow: `3px 3px 0 ${TOKENS.ink}`,
          }}>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8, marginBottom: 10 }}>
              {crew.map((c) => (
                <div key={c.id} style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "5px 5px 5px 10px",
                  border: `2px solid ${TOKENS.ink}`, borderRadius: 999,
                  background: c.kind === "kid" ? TOKENS.accent2 : TOKENS.bg,
                }}>
                  <span style={{ fontSize: 14 }}>{c.kind === "kid" ? "🧒" : "🧑"}</span>
                  <span style={{ fontFamily: TOKENS.ui, fontSize: 11, fontWeight: 800 }}>
                    {c.label}{c.kind === "kid" ? ` · ${c.age}` : ""}
                  </span>
                  {c.kind === "kid" && (
                    <select
                      value={c.age}
                      onChange={(e) => setKidAge(c.id, Number(e.target.value))}
                      style={{
                        appearance: "none" as const, border: "none", background: "transparent",
                        fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800, cursor: "pointer",
                      }}
                    >
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map((a) => (
                        <option key={a} value={a}>{a}y</option>
                      ))}
                    </select>
                  )}
                  <button onClick={() => removeMember(c.id)} style={{
                    appearance: "none", cursor: "pointer",
                    width: 18, height: 18, borderRadius: 999,
                    border: `1.5px solid ${TOKENS.ink}`, background: TOKENS.paper,
                    fontSize: 9, fontWeight: 900, color: TOKENS.ink,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                  }}>✕</button>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={addKid} style={{
                appearance: "none", cursor: "pointer", flex: 1,
                padding: "8px 10px",
                border: `2px dashed ${TOKENS.ink}`, borderRadius: 10,
                background: "transparent",
                fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 800, color: TOKENS.ink,
              }}>＋ add kid</button>
              <button onClick={addAdult} style={{
                appearance: "none", cursor: "pointer", flex: 1,
                padding: "8px 10px",
                border: `2px dashed ${TOKENS.ink}`, borderRadius: 10,
                background: "transparent",
                fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 800, color: TOKENS.ink,
              }}>＋ add adult</button>
            </div>
          </div>

          {/* Indoor/outdoor */}
          <FamilyLabel>indoor / outdoor</FamilyLabel>
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            {[
              { id: "indoor", label: "🏠 indoor", sub: "a/c, no rain" },
              { id: "outdoor", label: "🌳 outdoor", sub: "fresh air" },
              { id: "either", label: "↕ either", sub: "mix it" },
            ].map((o) => (
              <button key={o.id} onClick={() => setIndoor(o.id)} style={{
                appearance: "none", cursor: "pointer", flex: 1,
                padding: "10px 6px",
                border: `2.5px solid ${TOKENS.ink}`, borderRadius: 12,
                background: indoor === o.id ? TOKENS.accent1 : TOKENS.paper,
                color: TOKENS.ink,
                fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 800,
                boxShadow: indoor === o.id ? `3px 3px 0 ${TOKENS.ink}` : "none",
                transform: indoor === o.id ? "translate(-1px,-1px)" : "none",
                transition: "all .12s",
                display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 2,
              }}>
                <span style={{ fontSize: 14 }}>{o.label}</span>
                <span style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 700, opacity: 0.65 }}>{o.sub}</span>
              </button>
            ))}
          </div>

          {/* Must-haves */}
          <FamilyLabel>must-haves</FamilyLabel>
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6, marginBottom: 16 }}>
            {MUST_HAVES.map((f) => (
              <button key={f.id} onClick={() => setMust({ ...must, [f.id]: !must[f.id] })} style={{
                appearance: "none", cursor: "pointer",
                padding: "7px 12px",
                border: `2.5px solid ${TOKENS.ink}`, borderRadius: 999,
                background: must[f.id] ? TOKENS.accent2 : TOKENS.paper, color: TOKENS.ink,
                fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 800,
                boxShadow: must[f.id] ? `3px 3px 0 ${TOKENS.ink}` : "none",
                transform: must[f.id] ? "translate(-1px,-1px)" : "none",
                transition: "all .12s",
              }}>{f.label}</button>
            ))}
          </div>

          {/* Effort */}
          <FamilyLabel>parent effort</FamilyLabel>
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            {["low", "medium", "we got energy"].map((e) => (
              <button key={e} onClick={() => setEffort(e)} style={{
                appearance: "none", cursor: "pointer", flex: 1,
                padding: "10px 8px",
                border: `2.5px solid ${TOKENS.ink}`, borderRadius: 12,
                background: effort === e ? TOKENS.accent3 : TOKENS.paper,
                color: effort === e ? TOKENS.paper : TOKENS.ink,
                fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 800,
                boxShadow: effort === e ? `3px 3px 0 ${TOKENS.ink}` : "none",
                transform: effort === e ? "translate(-1px,-1px)" : "none",
                transition: "all .12s",
              }}>{e}</button>
            ))}
          </div>

          {/* Best time */}
          <FamilyLabel>best time</FamilyLabel>
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6, marginBottom: 18 }}>
            {["☀ morning", "🥪 lunchtime", "🌤 afternoon", "🌅 sunset", "🌙 late"].map((t) => (
              <button key={t} onClick={() => setTime(t)} style={{
                appearance: "none", cursor: "pointer",
                padding: "7px 12px",
                border: `2.5px solid ${TOKENS.ink}`, borderRadius: 999,
                background: time === t ? TOKENS.accent1 : TOKENS.paper, color: TOKENS.ink,
                fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 800,
                boxShadow: time === t ? `3px 3px 0 ${TOKENS.ink}` : "none",
                transform: time === t ? "translate(-1px,-1px)" : "none",
                transition: "all .12s",
              }}>{t}</button>
            ))}
          </div>

          <div style={{ height: 8 }} />
        </div>

        {/* CTA */}
        <div style={{ position: "relative", zIndex: 2, paddingTop: 12 }}>
          <ChunkyButton variant="accent" onClick={() => navigate({ to: "/new/family-pass" })} icon={Icons.arrow}>
            build our family pass
          </ChunkyButton>
          <div style={{
            marginTop: 8, textAlign: "center" as const,
            fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 700,
            color: TOKENS.ink, opacity: 0.55, letterSpacing: ".08em",
          }}>
            FOR {crew.length} · {kids.length} KID{kids.length !== 1 ? "S" : ""} AGED {kids.map((k) => k.age).join(", ")}
          </div>
        </div>
      </div>
    </Frame>
  );
}
