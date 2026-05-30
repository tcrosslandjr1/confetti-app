import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { DotsBg, Frame, Stamp, TOKENS } from "@/components/new-confetti/shell";

export const Route = createFileRoute("/new/learn-explore")({ component: LearnExplorePage });

// ─── Data ──────────────────────────────────────────────────────
const LEARN_PORTALS = [
  { id: "l-story",   icon: "📖", label: "library story time", sub: "free · ages 0-5" },
  { id: "l-rainy",   icon: "🌧", label: "rainy learn day",    sub: "indoor backup" },
  { id: "l-museum",  icon: "🏛", label: "museum + lunch",     sub: "half-day · ages 4+" },
  { id: "l-stem",    icon: "🔬", label: "STEM saturday",      sub: "ages 6-12" },
  { id: "l-summer",  icon: "☀",  label: "summer reading",     sub: "20 books · free" },
  { id: "l-after",   icon: "🎒", label: "after-school",       sub: "tutoring + snack" },
  { id: "l-home",    icon: "🏡", label: "homeschool trip",    sub: "field-day" },
  { id: "l-grand",   icon: "👵", label: "grandparent edu",    sub: "low energy" },
  { id: "l-free",    icon: "🆓", label: "free family day",    sub: "this week" },
  { id: "l-nature",  icon: "🦋", label: "nature + library",   sub: "walk + read" },
  { id: "l-book",    icon: "📚", label: "bookstore picnic",   sub: "park lunch" },
  { id: "l-art",     icon: "🎨", label: "art class drop-in",  sub: "no signup" },
];

type Library = {
  id: string; name: string; branch: string; hours: string;
  storyTimes: { day: string; time: string; age: string }[];
  kidsArea: string; upcoming: string[]; parking: string; quiet: string;
  free: boolean; c: string;
};

const LIBRARIES: Library[] = [
  {
    id: "bpl-central", name: "BPL Central", branch: "Grand Army Plaza · 0.4 mi",
    hours: "Open · closes 8 PM",
    storyTimes: [
      { day: "today", time: "10:30 AM", age: "0-2 babies" },
      { day: "today", time: "11:30 AM", age: "2-5 toddlers" },
      { day: "sat",   time: "11:00 AM", age: "family · sign" },
    ],
    kidsArea: "Youth Wing · 2nd floor · big",
    upcoming: ["LEGO build · sun 2 PM", "Author reading: Mac Barnett · thu"],
    parking: "15-min street + paid lot", quiet: "medium", free: true, c: TOKENS.accent1,
  },
  {
    id: "bpl-park-slope", name: "Park Slope Branch", branch: "6th Ave · 1.1 mi",
    hours: "Open · closes 6 PM",
    storyTimes: [
      { day: "today", time: "10:00 AM", age: "0-3" },
      { day: "wed",   time: "4:00 PM",  age: "after-school" },
    ],
    kidsArea: "Cozy nook · small but bright",
    upcoming: ["Homework help · weekdays 3-5", "Summer reading kickoff · jun 1"],
    parking: "street only · tough", quiet: "high", free: true, c: TOKENS.accent2,
  },
  {
    id: "bpl-bcl", name: "Brooklyn Children's Library", branch: "BedStuy · 1.8 mi",
    hours: "Open · closes 7 PM",
    storyTimes: [
      { day: "today", time: "11:00 AM", age: "3-5 · spanish" },
      { day: "today", time: "2:00 PM",  age: "k-2 readers" },
    ],
    kidsArea: "Entire library is kids",
    upcoming: ["Coding for kids · sat 1 PM · free", "Art class drop-in · sun all day"],
    parking: "free lot · 20 spots", quiet: "low", free: true, c: TOKENS.accent3,
  },
];

type EduVenue = {
  id: string; name: string; type: string; age: string; price: string;
  schedule: string; reg: string; effort: string;
  kids: string; parents: string; learning: string; c: string;
};

const EDU_VENUES: EduVenue[] = [
  { id: "ed-bcm", name: "BK Children's Museum", type: "museum", age: "2-10", price: "$16/kid · $12 adult",
    schedule: "Wed-Sun · 10-5", reg: "walk-in", effort: "low",
    kids: "sensory rooms, water play, climbable map",
    parents: "café, restrooms every floor, stroller parking",
    learning: "sensory + social skills · light science", c: TOKENS.accent3 },
  { id: "ed-stem", name: "Code Ninjas Williamsburg", type: "STEM · coding", age: "7-14", price: "$32/class",
    schedule: "sat 10 AM · 90m", reg: "required · drop-off", effort: "low",
    kids: "minecraft + scratch coding · earn belts",
    parents: "café next door · drop and go",
    learning: "logic, sequence, problem-solving", c: TOKENS.accent1 },
  { id: "ed-art", name: "Tiny Picassos · Cobble Hill", type: "art class", age: "3-7", price: "$28 · drop-in ok",
    schedule: "mon/wed/fri · 4 PM", reg: "walk-in", effort: "medium · parent stays",
    kids: "real paint, real mess, take work home",
    parents: "open studio · join in",
    learning: "fine motor, creative confidence", c: TOKENS.accent2 },
  { id: "ed-nature", name: "Prospect Park Audubon", type: "nature center", age: "all", price: "free",
    schedule: "daily · 12-4", reg: "walk-in", effort: "low",
    kids: "live turtles, birds, scavenger hunt sheet",
    parents: "restrooms, shaded picnic, parking nearby",
    learning: "biology · stewardship · observation", c: TOKENS.accent1 },
  { id: "ed-dance", name: "Mark Morris Kids", type: "dance", age: "3-12", price: "$240/8wk",
    schedule: "mon-thu · varies", reg: "semester signup", effort: "low · drop-off",
    kids: "real studio, real teachers, recital at end",
    parents: "observation week 4 + 8",
    learning: "rhythm, coordination, performance", c: TOKENS.accent2 },
];

const TYPE_ICONS: Record<string, string> = {
  museum: "🏛", "STEM · coding": "🔬", "art class": "🎨",
  "nature center": "🦋", dance: "💃",
};

// ─── Sub-components ────────────────────────────────────────────
function Pill({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <span style={{
      padding: "4px 10px", background: bg, color: TOKENS.ink,
      border: `2px solid ${TOKENS.ink}`, borderRadius: 999,
      fontFamily: TOKENS.ui, fontSize: 11, fontWeight: 800,
    }}>{children}</span>
  );
}

function WhyRow({ icon, label, body, bold }: { icon: string; label: string; body: string; bold?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 8, padding: "3px 0", fontFamily: TOKENS.ui, fontSize: 12 }}>
      <span style={{ fontSize: 13, lineHeight: 1.2, width: 16 }}>{icon}</span>
      <div style={{ flex: 1, lineHeight: 1.35 }}>
        <span style={{
          fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800,
          letterSpacing: ".12em", color: TOKENS.ink, opacity: 0.55,
          textTransform: "uppercase" as const, marginRight: 6,
        }}>{label}</span>
        <span style={{ fontWeight: bold ? 900 : 700, color: TOKENS.ink }}>{body}</span>
      </div>
    </div>
  );
}

function LibraryCard({ lib, onAdd }: { lib: Library; onAdd: () => void }) {
  const todayStories = lib.storyTimes.filter((s) => s.day === "today");
  const upcomingStories = lib.storyTimes.filter((s) => s.day !== "today").slice(0, 1);
  return (
    <div style={{
      padding: 14, marginBottom: 10,
      border: `2.5px solid ${TOKENS.ink}`, borderRadius: 14,
      background: TOKENS.paper, boxShadow: `4px 4px 0 ${TOKENS.ink}`,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 44, height: 44, flexShrink: 0, borderRadius: 10,
          border: `2.5px solid ${TOKENS.ink}`, background: lib.c,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
        }}>📚</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 17, letterSpacing: "-0.025em", color: TOKENS.ink }}>{lib.name}</div>
          <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, color: TOKENS.ink, opacity: 0.6, marginTop: 2, letterSpacing: ".08em", textTransform: "uppercase" as const }}>{lib.branch}</div>
        </div>
        <span style={{
          padding: "3px 8px", background: TOKENS.accent4, color: TOKENS.paper,
          border: `2px solid ${TOKENS.ink}`, borderRadius: 4,
          fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".08em",
        }}>FREE</span>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const, marginBottom: 10 }}>
        <Pill bg={TOKENS.paper}>{lib.hours}</Pill>
        <Pill bg={TOKENS.accent2}>📖 {lib.kidsArea.split(" · ")[0]}</Pill>
        <Pill bg={TOKENS.paper}>🔉 {lib.quiet} quiet</Pill>
        <Pill bg={TOKENS.paper}>🅿 {lib.parking.split(" · ")[0]}</Pill>
      </div>
      {/* Story times */}
      <div style={{
        padding: 10, background: TOKENS.bg,
        border: `2px dashed ${TOKENS.ink}`, borderRadius: 10, marginBottom: 10,
      }}>
        <div style={{
          fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".14em",
          color: TOKENS.ink, opacity: 0.55, textTransform: "uppercase" as const, marginBottom: 6,
        }}>STORY TIME · TODAY</div>
        {todayStories.map((s, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "4px 0",
            fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 700, color: TOKENS.ink,
          }}>
            <span style={{ fontFamily: TOKENS.mono, fontWeight: 800, fontSize: 11, width: 64 }}>{s.time}</span>
            <span style={{ flex: 1 }}>{s.age}</span>
            <span style={{
              padding: "2px 7px", background: TOKENS.accent1,
              border: `1.5px solid ${TOKENS.ink}`, borderRadius: 999,
              fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".08em",
            }}>signup</span>
          </div>
        ))}
        {upcomingStories.map((s, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "4px 0",
            opacity: 0.6, fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 700, color: TOKENS.ink,
            borderTop: `1px dashed rgba(0,0,0,0.15)`, marginTop: 4, paddingTop: 8,
          }}>
            <span style={{ fontFamily: TOKENS.mono, fontWeight: 800, fontSize: 11, width: 64 }}>{s.day} · {s.time}</span>
            <span style={{ flex: 1 }}>{s.age}</span>
          </div>
        ))}
      </div>
      {/* Upcoming */}
      <div style={{ marginBottom: 12 }}>
        <div style={{
          fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".14em",
          color: TOKENS.ink, opacity: 0.55, textTransform: "uppercase" as const, marginBottom: 4,
        }}>UPCOMING · FREE</div>
        {lib.upcoming.map((u, i) => (
          <div key={i} style={{ fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 700, color: TOKENS.ink, padding: "3px 0" }}>· {u}</div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onAdd} style={{
          appearance: "none", cursor: "pointer", flex: 1,
          padding: "9px 12px", border: `2.5px solid ${TOKENS.ink}`, borderRadius: 12,
          background: TOKENS.accent1, color: TOKENS.ink,
          fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 900,
          boxShadow: `3px 3px 0 ${TOKENS.ink}`,
        }}>+ add to plan</button>
        <button style={{
          appearance: "none", cursor: "pointer",
          padding: "9px 12px", border: `2.5px solid ${TOKENS.ink}`, borderRadius: 12,
          background: TOKENS.paper, color: TOKENS.ink,
          fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 800,
        }}>↗ open</button>
      </div>
    </div>
  );
}

function EduVenueCard({ v, onAdd }: { v: EduVenue; onAdd: () => void }) {
  return (
    <div style={{
      padding: 14, marginBottom: 10,
      border: `2.5px solid ${TOKENS.ink}`, borderRadius: 14,
      background: TOKENS.paper, boxShadow: `4px 4px 0 ${TOKENS.ink}`,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 44, height: 44, flexShrink: 0, borderRadius: 10,
          border: `2.5px solid ${TOKENS.ink}`, background: v.c,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
        }}>{TYPE_ICONS[v.type] || "📚"}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 17, letterSpacing: "-0.025em", color: TOKENS.ink }}>{v.name}</div>
          <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, color: TOKENS.ink, opacity: 0.6, marginTop: 2, letterSpacing: ".1em", textTransform: "uppercase" as const }}>{v.type}</div>
        </div>
        <div style={{ textAlign: "right" as const }}>
          <div style={{ fontFamily: TOKENS.mono, fontSize: 11, fontWeight: 800, color: TOKENS.ink }}>{v.price.split(" · ")[0]}</div>
          <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 700, color: TOKENS.ink, opacity: 0.55, marginTop: 2, letterSpacing: ".06em" }}>AGE {v.age}</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const, marginBottom: 10 }}>
        <Pill bg={TOKENS.accent2}>📅 {v.schedule}</Pill>
        <Pill bg={TOKENS.paper}>📝 {v.reg}</Pill>
        <Pill bg={TOKENS.paper}>💪 {v.effort.split(" · ")[0]} effort</Pill>
      </div>
      <div style={{ padding: 10, marginBottom: 10, border: `2px dashed ${TOKENS.ink}`, borderRadius: 10, background: TOKENS.bg }}>
        <WhyRow icon="🧒" label="kids"    body={v.kids} />
        <WhyRow icon="👨‍👩‍👧" label="parents" body={v.parents} />
        <WhyRow icon="🧠" label="learning" body={v.learning} bold />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onAdd} style={{
          appearance: "none", cursor: "pointer", flex: 1,
          padding: "9px 12px", border: `2.5px solid ${TOKENS.ink}`, borderRadius: 12,
          background: TOKENS.accent1, color: TOKENS.ink,
          fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 900,
          boxShadow: `3px 3px 0 ${TOKENS.ink}`,
        }}>+ add to plan</button>
        <button style={{
          appearance: "none", cursor: "pointer",
          padding: "9px 12px", border: `2.5px solid ${TOKENS.ink}`, borderRadius: 12,
          background: TOKENS.paper, color: TOKENS.ink,
          fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 800,
        }}>☆ save</button>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────
function LearnExplorePage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"plans" | "libraries" | "classes">("plans");
  const [filters, setFilters] = useState<string[]>([]);

  const FILTER_CHIPS = ["0-2","3-5","6-8","9-12","free","paid","indoor","outdoor","today","this wkend","after school","drop-in","register","drop-off ok","stroller ok","sensory-friendly","quiet"];
  const toggle = (k: string) =>
    setFilters(filters.includes(k) ? filters.filter((x) => x !== k) : [...filters, k]);

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
          marginBottom: 12,
        }}>
          <button onClick={() => navigate({ to: "/new/hub" })} style={{
            appearance: "none", cursor: "pointer",
            width: 36, height: 36, borderRadius: 999,
            border: `2.5px solid ${TOKENS.ink}`, background: TOKENS.paper,
            fontSize: 14, fontWeight: 900, color: TOKENS.ink,
            boxShadow: `3px 3px 0 ${TOKENS.ink}`,
          }}>←</button>
          <Stamp color={TOKENS.accent2} rotate={-2}>family · learn</Stamp>
          <span style={{ width: 36 }} />
        </div>

        <h2 style={{
          position: "relative", zIndex: 2,
          fontFamily: TOKENS.display, fontWeight: 900,
          fontSize: 36, lineHeight: 0.95, letterSpacing: "-0.04em",
          color: TOKENS.ink, margin: "0 0 4px",
        }}>Learn & Explore.</h2>
        <p style={{
          position: "relative", zIndex: 2,
          fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 600,
          color: TOKENS.ink, opacity: 0.7, margin: "0 0 14px", maxWidth: 320,
        }}>Library days, STEM fun, museums, classes — without the search spiral.</p>

        {/* Tabs */}
        <div style={{ position: "relative", zIndex: 2, display: "flex", gap: 4, marginBottom: 12 }}>
          {([["plans","plans"],["libraries","libraries"],["classes","classes"]] as const).map(([id, l]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              appearance: "none", cursor: "pointer", flex: 1,
              padding: "8px 6px",
              border: `2.5px solid ${TOKENS.ink}`, borderRadius: 999,
              background: tab === id ? TOKENS.ink : TOKENS.paper,
              color: tab === id ? TOKENS.paper : TOKENS.ink,
              fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 800,
              boxShadow: tab === id ? `3px 3px 0 ${TOKENS.accent1}` : "none",
              transform: tab === id ? "translate(-1px,-1px)" : "none",
              transition: "all .12s",
            }}>{l}</button>
          ))}
        </div>

        <div style={{
          position: "relative", zIndex: 2,
          flex: 1, overflowY: "auto", overflowX: "hidden",
          marginRight: -22, paddingRight: 22, scrollbarWidth: "none",
        }}>
          {/* Filter bar */}
          {(tab === "libraries" || tab === "classes") && (
            <div style={{
              display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none",
              marginRight: -22, paddingRight: 22, marginBottom: 14,
            }}>
              {FILTER_CHIPS.map((v) => (
                <button key={v} onClick={() => toggle(v)} style={{
                  appearance: "none", cursor: "pointer", flexShrink: 0,
                  padding: "6px 12px",
                  border: `2px solid ${TOKENS.ink}`, borderRadius: 999,
                  background: filters.includes(v) ? TOKENS.accent1 : TOKENS.paper, color: TOKENS.ink,
                  fontFamily: TOKENS.ui, fontSize: 11, fontWeight: 800,
                }}>{v}</button>
              ))}
            </div>
          )}

          {tab === "plans" && (
            <>
              <div style={{
                fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800,
                letterSpacing: ".16em", textTransform: "uppercase" as const,
                color: TOKENS.ink, opacity: 0.55, marginBottom: 10,
              }}>11 PLAN TYPES · BUILT FOR PARENTS</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                {LEARN_PORTALS.map((p) => (
                  <button key={p.id} onClick={() => navigate({ to: "/new/family-plan" })} style={{
                    appearance: "none", cursor: "pointer", textAlign: "left" as const,
                    padding: 12,
                    border: `2.5px solid ${TOKENS.ink}`, borderRadius: 14,
                    background: TOKENS.paper, color: TOKENS.ink,
                    boxShadow: `4px 4px 0 ${TOKENS.ink}`,
                    display: "flex", flexDirection: "column" as const, gap: 2, minHeight: 90,
                  }}>
                    <span style={{ fontSize: 24, marginBottom: 2 }}>{p.icon}</span>
                    <span style={{
                      fontFamily: TOKENS.display, fontWeight: 900, fontSize: 15,
                      letterSpacing: "-0.025em", lineHeight: 1.05, color: TOKENS.ink,
                    }}>{p.label}</span>
                    <span style={{
                      fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800,
                      color: TOKENS.ink, opacity: 0.55, letterSpacing: ".08em",
                      marginTop: "auto", textTransform: "uppercase" as const,
                    }}>{p.sub}</span>
                  </button>
                ))}
              </div>
              {/* Auto-plan highlight */}
              <div style={{
                padding: 14, marginBottom: 8,
                border: `3px solid ${TOKENS.ink}`, borderRadius: 14,
                background: TOKENS.accent2, boxShadow: `4px 4px 0 ${TOKENS.ink}`,
              }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800,
                  letterSpacing: ".14em", color: TOKENS.ink, opacity: 0.7,
                  textTransform: "uppercase" as const, marginBottom: 4,
                }}><span style={{ color: TOKENS.accent1 }}>✣</span> auto-plan for this saturday</div>
                <div style={{
                  fontFamily: TOKENS.display, fontWeight: 900, fontSize: 19,
                  letterSpacing: "-0.025em", lineHeight: 1, color: TOKENS.ink,
                }}>Free Family Learning Day</div>
                <div style={{
                  fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 700,
                  color: TOKENS.ink, opacity: 0.75, marginTop: 4, lineHeight: 1.4,
                }}>Library story time → nature center → picnic at Prospect Park. 4h · $0 · 1.6 mi walkable.</div>
                <button onClick={() => navigate({ to: "/new/family-pass" })} style={{
                  appearance: "none", cursor: "pointer", marginTop: 10,
                  padding: "7px 12px",
                  border: `2.5px solid ${TOKENS.ink}`, borderRadius: 999,
                  background: TOKENS.ink, color: TOKENS.paper,
                  fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 800,
                }}>print this pass →</button>
              </div>
            </>
          )}

          {tab === "libraries" && (
            <>
              <div style={{
                fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800,
                letterSpacing: ".16em", textTransform: "uppercase" as const,
                color: TOKENS.ink, opacity: 0.55, marginBottom: 10,
              }}>3 LIBRARIES NEAR YOU · ALL FREE</div>
              {LIBRARIES.map((lib) => (
                <LibraryCard key={lib.id} lib={lib} onAdd={() => {}} />
              ))}
            </>
          )}

          {tab === "classes" && (
            <>
              <div style={{
                fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800,
                letterSpacing: ".16em", textTransform: "uppercase" as const,
                color: TOKENS.ink, opacity: 0.55, marginBottom: 10,
              }}>5 PROGRAMS · STEM · ART · MUSIC · NATURE · DANCE</div>
              {EDU_VENUES.map((v) => (
                <EduVenueCard key={v.id} v={v} onAdd={() => {}} />
              ))}
            </>
          )}

          <div style={{ height: 8 }} />
        </div>
      </div>
    </Frame>
  );
}
