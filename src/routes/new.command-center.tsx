import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  BrandMark, ChunkyButton, Frame, Icons, Stamp, Ticket, TOKENS,
} from "@/components/new-confetti/shell";

// Slim port — design/new-confetti/project/adult.jsx (CommandCenterScreen, line 359)
export const Route = createFileRoute("/new/command-center")({
  component: CommandCenterPage,
});

const TABS = ["upcoming", "saved", "people", "vibes"] as const;
type Tab = typeof TABS[number];

const UPCOMING = [
  { d: "FRI MAY 30", t: "Disco Night",  who: "the regulars",  c: TOKENS.accent1 },
  { d: "SAT JUN 7",  t: "Date Night",   who: "Sara",          c: TOKENS.accent3 },
  { d: "TUE JUN 10", t: "Jazz Tuesday", who: "solo",          c: TOKENS.accent2 },
];

const SAVED = [
  { name: "Lupa Notte",   tag: "italian"  },
  { name: "Loft Disco",   tag: "music"    },
  { name: "Daughter",     tag: "coffee"   },
  { name: "Misi",         tag: "pasta"    },
];

const PEOPLE = [
  { who: "Sara", c: TOKENS.accent1, n: "12 nights" },
  { who: "Mike", c: TOKENS.accent3, n: "8 nights"  },
  { who: "Ren",  c: TOKENS.accent2, n: "5 nights"  },
];

function CommandCenterPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("upcoming");

  return (
    <Frame>
      <div style={{
        position: "relative", height: "100%", background: TOKENS.bg,
        display: "flex", flexDirection: "column",
        padding: "56px 20px 22px", overflow: "hidden",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 14,
        }}>
          <button onClick={() => navigate({ to: "/new/hub" })} style={backBtn()}>←</button>
          <BrandMark size={17} />
          <span style={{ width: 36 }} />
        </div>

        <Stamp color={TOKENS.accent3} rotate={-3} style={{ alignSelf: "flex-start" }}>command center</Stamp>
        <h1 style={{
          fontFamily: TOKENS.display, fontWeight: 900,
          fontSize: 36, lineHeight: 0.92, letterSpacing: "-0.04em",
          margin: "10px 0 14px",
        }}>Run your<br/>night life.</h1>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              appearance: "none", cursor: "pointer", flex: 1,
              padding: "8px 10px",
              border: `2.5px solid ${TOKENS.ink}`, borderRadius: 999,
              background: tab === t ? TOKENS.ink : TOKENS.paper,
              color: tab === t ? TOKENS.paper : TOKENS.ink,
              fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800,
              letterSpacing: ".12em", textTransform: "uppercase",
            }}>{t}</button>
          ))}
        </div>

        <div style={{
          flex: 1, overflowY: "auto", scrollbarWidth: "none",
          marginRight: -20, paddingRight: 20,
        }}>
          {tab === "upcoming" && UPCOMING.map((u, i) => (
            <Ticket key={i} color={TOKENS.paper} notch style={{ padding: 12, marginBottom: 8 }}>
              <div style={{
                fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800,
                letterSpacing: ".14em", opacity: 0.55,
              }}>{u.d}</div>
              <div style={{
                fontFamily: TOKENS.display, fontWeight: 900, fontSize: 17,
                letterSpacing: "-0.02em", marginTop: 2,
              }}>{u.t}</div>
              <div style={{
                fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 700,
                opacity: 0.6, marginTop: 2,
              }}>w/ {u.who}</div>
            </Ticket>
          ))}

          {tab === "saved" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {SAVED.map((s) => (
                <div key={s.name} style={{
                  padding: 12,
                  border: `2.5px solid ${TOKENS.ink}`, borderRadius: 14,
                  background: TOKENS.paper,
                  boxShadow: `3px 3px 0 ${TOKENS.ink}`,
                }}>
                  <div style={{
                    fontFamily: TOKENS.display, fontWeight: 900, fontSize: 14,
                    letterSpacing: "-0.01em",
                  }}>{s.name}</div>
                  <div style={{
                    fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 700,
                    opacity: 0.55, marginTop: 3, letterSpacing: ".06em",
                  }}>{s.tag}</div>
                </div>
              ))}
            </div>
          )}

          {tab === "people" && PEOPLE.map((p) => (
            <div key={p.who} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: 10, marginBottom: 6,
              border: `2.5px solid ${TOKENS.ink}`, borderRadius: 14,
              background: TOKENS.paper,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 999,
                background: p.c, border: `2.5px solid ${TOKENS.ink}`,
                display: "grid", placeItems: "center",
                fontFamily: TOKENS.display, fontWeight: 900, fontSize: 13,
              }}>{p.who[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: TOKENS.display, fontWeight: 900, fontSize: 14,
                  letterSpacing: "-0.01em",
                }}>{p.who}</div>
                <div style={{
                  fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 700,
                  opacity: 0.6, marginTop: 2, letterSpacing: ".06em",
                }}>{p.n}</div>
              </div>
            </div>
          ))}

          {tab === "vibes" && (
            <Ticket color={TOKENS.accent2} notch={false} style={{ padding: 14 }}>
              <div style={{
                fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800,
                letterSpacing: ".14em", opacity: 0.7,
              }}>YOUR VIBE PROFILE</div>
              <div style={{
                fontFamily: TOKENS.display, fontWeight: 900, fontSize: 16,
                letterSpacing: "-0.02em", marginTop: 6, lineHeight: 1.2,
              }}>Disco bro · pasta fiend · disappear-by-2 · cocktail nerd</div>
            </Ticket>
          )}
        </div>

        <div style={{ marginTop: 12 }}>
          <ChunkyButton variant="accent" onClick={() => navigate({ to: "/new/plan" })}
            icon={Icons.arrow}>plan tonight</ChunkyButton>
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
