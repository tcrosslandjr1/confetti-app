import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  BrandMark, Chip, ChunkyButton, Frame, Icons, Stamp, Ticket, TOKENS,
} from "@/components/new-confetti/shell";

// Slim port — design/new-confetti/project/crews.jsx (NightTogetherScreen, line 218)
export const Route = createFileRoute("/new/night-together")({
  component: NightTogetherPage,
});

const CREW = [
  { who: "Jess", c: TOKENS.accent2, me: true,  status: "in" },
  { who: "Sara", c: TOKENS.accent1, status: "in" },
  { who: "Mike", c: TOKENS.accent3, status: "in" },
  { who: "Ren",  c: TOKENS.accent2, status: "maybe" },
];

const VIBES = ["dinner first", "loud later", "no lines", "rooftop", "$ split"];

function NightTogetherPage() {
  const navigate = useNavigate();
  const [vibes, setVibes] = useState<string[]>(["dinner first", "no lines"]);

  const toggle = (v: string) =>
    setVibes((a) => a.includes(v) ? a.filter((x) => x !== v) : [...a, v]);

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
          <button onClick={() => navigate({ to: "/new/crews" })} style={backBtn()}>←</button>
          <BrandMark size={17} />
          <span style={{ width: 36 }} />
        </div>

        <Stamp color={TOKENS.accent1} rotate={-3} style={{ alignSelf: "flex-start" }}>the regulars · tonight</Stamp>
        <h1 style={{
          fontFamily: TOKENS.display, fontWeight: 900,
          fontSize: 36, lineHeight: 0.92, letterSpacing: "-0.04em",
          margin: "10px 0 14px",
        }}>One night.<br/>Four people.</h1>

        <div style={{
          flex: 1, overflowY: "auto", scrollbarWidth: "none",
          marginRight: -20, paddingRight: 20,
        }}>
          {/* Crew check-in */}
          <Ticket color={TOKENS.paper} notch style={{ padding: 14, marginBottom: 14 }}>
            <div style={{
              fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800,
              letterSpacing: ".14em", opacity: 0.55, marginBottom: 8,
            }}>WHO'S IN</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {CREW.map((m) => (
                <div key={m.who} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "6px 0",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 999,
                      background: m.c, border: `2px solid ${TOKENS.ink}`,
                      display: "grid", placeItems: "center",
                      fontFamily: TOKENS.display, fontWeight: 900, fontSize: 11,
                    }}>{m.who[0]}</div>
                    <div style={{
                      fontFamily: TOKENS.display, fontWeight: 900, fontSize: 14,
                      letterSpacing: "-0.01em",
                    }}>{m.who}{m.me ? " (you)" : ""}</div>
                  </div>
                  <span style={{
                    padding: "3px 10px", borderRadius: 999,
                    border: `2px solid ${TOKENS.ink}`,
                    background: m.status === "in" ? TOKENS.accent2 : TOKENS.bg,
                    fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800,
                    letterSpacing: ".12em", textTransform: "uppercase",
                  }}>{m.status}</span>
                </div>
              ))}
            </div>
          </Ticket>

          {/* Shared vibes */}
          <div style={{
            fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800,
            letterSpacing: ".16em", opacity: 0.55, marginBottom: 8,
            textTransform: "uppercase",
          }}>shared vibes · pick 3 max</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {VIBES.map((v) => (
              <Chip key={v} dense selected={vibes.includes(v)} color={TOKENS.accent2}
                onClick={() => toggle(v)}>{v}</Chip>
            ))}
          </div>

          {/* Money rule */}
          <Ticket color={TOKENS.accent3} notch={false} style={{ padding: 14 }}>
            <div style={{ color: TOKENS.paper }}>
              <div style={{
                fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800,
                letterSpacing: ".14em", opacity: 0.85,
              }}>SPLIT RULE</div>
              <div style={{
                fontFamily: TOKENS.display, fontWeight: 900, fontSize: 16,
                letterSpacing: "-0.02em", marginTop: 4, lineHeight: 1.2,
              }}>4-way split on stops · drinks self-pay</div>
            </div>
          </Ticket>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <ChunkyButton variant="ghost" onClick={() => navigate({ to: "/new/crews" })}>back</ChunkyButton>
          <ChunkyButton variant="accent" onClick={() => navigate({ to: "/new/printing" })}
            icon={Icons.arrow}>print our night</ChunkyButton>
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
