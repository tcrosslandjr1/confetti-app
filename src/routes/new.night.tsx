import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  BrandMark, ChunkyButton, Frame, Icons, RouteDots, Ticket, TOKENS,
} from "@/components/new-confetti/shell";

// Slim "Night Of" port — design/new-confetti/project/screens.jsx
// (NightOfScreen, line 1009). Full 5-component composition (OnMyWay,
// PostedCard, LiveFeed, CheckInSheet, SocialIcons) is a follow-up
// polish — this captures the visual layer + flow continuity.
export const Route = createFileRoute("/new/night")({
  component: NightPage,
});

function NightPage() {
  const navigate = useNavigate();

  return (
    <Frame>
      <div style={{
        position: "relative", height: "100%",
        background: TOKENS.ink,
        color: TOKENS.paper,
        display: "flex", flexDirection: "column",
        padding: "56px 22px 22px",
        overflow: "hidden",
      }}>
        {/* Dim radial wash */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: `radial-gradient(circle at 30% 20%, ${TOKENS.accent1}33 0%, transparent 35%),
                       radial-gradient(circle at 80% 80%, ${TOKENS.accent3}44 0%, transparent 35%)`,
        }} />

        <div style={{
          position: "relative", zIndex: 2,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 14,
        }}>
          <button onClick={() => navigate({ to: "/new/hub" })} style={{
            appearance: "none", cursor: "pointer",
            width: 36, height: 36, borderRadius: 999,
            border: `2px solid ${TOKENS.paper}`, background: "rgba(0,0,0,0.4)",
            color: TOKENS.paper, fontSize: 14, fontWeight: 900,
            backdropFilter: "blur(8px)",
          }}>←</button>
          <div style={{ color: TOKENS.paper }}>
            <BrandMark size={17} />
          </div>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 10px", background: TOKENS.accent1,
            border: `2px solid ${TOKENS.ink}`, borderRadius: 999,
            fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800,
            letterSpacing: ".14em", color: TOKENS.ink,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: 999, background: TOKENS.ink,
              animation: "cf-pulse 1.2s infinite",
            }} />
            LIVE · STOP 2/3
          </span>
        </div>

        <div style={{
          position: "relative", zIndex: 2,
          flex: 1, overflowY: "auto", overflowX: "hidden",
          marginRight: -22, paddingRight: 22,
          scrollbarWidth: "none",
        }}>
          <div style={{
            fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800,
            letterSpacing: ".18em", opacity: 0.6,
            textTransform: "uppercase", marginBottom: 6,
          }}>YOU ARE HERE</div>
          <h2 style={{
            fontFamily: TOKENS.display, fontWeight: 900,
            fontSize: 44, lineHeight: 0.95, letterSpacing: "-0.04em",
            color: TOKENS.paper, margin: "0 0 6px",
          }}>Lupa Notte.</h2>
          <p style={{
            fontFamily: TOKENS.ui, fontSize: 14, fontWeight: 700,
            color: TOKENS.paper, opacity: 0.75, margin: "0 0 18px",
          }}>8:30 PM · 88 N 6th St · ask for table 12</p>

          <Ticket color={TOKENS.paper} notch={false} style={{ padding: 14, marginBottom: 14 }}>
            <div style={{
              fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800,
              letterSpacing: ".14em", opacity: 0.6, color: TOKENS.ink,
            }}>WHAT TO DO HERE</div>
            <div style={{
              fontFamily: TOKENS.display, fontWeight: 900, fontSize: 18,
              letterSpacing: "-0.02em", lineHeight: 1.1, marginTop: 4, color: TOKENS.ink,
            }}>Order the cacio e pepe + house red.<br/>Save room for tiramisu.</div>
            <div style={{ marginTop: 12 }}>
              <RouteDots progress={0.5} size={16} />
            </div>
            <div style={{
              marginTop: 8, fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800,
              letterSpacing: ".1em", opacity: 0.7, color: TOKENS.ink,
              display: "flex", justifyContent: "space-between",
            }}>
              <span>1 · DAUGHTER ✓</span><span>2 · LUPA NOTTE</span><span>3 · SKINNY DENNIS</span>
            </div>
          </Ticket>

          {/* Quick actions */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
            <button style={action()}>📸 check in</button>
            <button style={action()}>🚖 ride to next</button>
            <button style={action()}>📞 call ahead</button>
            <button style={action()}>↻ revise plan</button>
          </div>

          {/* Crew live preview */}
          <div style={{
            fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800,
            letterSpacing: ".18em", color: TOKENS.paper, opacity: 0.55,
            textTransform: "uppercase", marginBottom: 8, marginTop: 6,
          }}>crew is on it</div>
          <div style={{
            display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none",
            marginRight: -22, paddingRight: 22, marginBottom: 18,
          }}>
            {[
              { who: "Sara", at: "Daughter ✓", color: TOKENS.accent2 },
              { who: "Mike", at: "en route", color: TOKENS.accent1 },
              { who: "Ren",  at: "5 min out", color: TOKENS.accent3 },
            ].map((c, i) => (
              <div key={i} style={{
                flexShrink: 0, width: 130,
                border: `2.5px solid ${TOKENS.paper}`, borderRadius: 12,
                background: TOKENS.ink, padding: 10,
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 999,
                  background: c.color, border: `2px solid ${TOKENS.paper}`,
                  display: "grid", placeItems: "center",
                  fontFamily: TOKENS.display, fontWeight: 900, fontSize: 11,
                  color: TOKENS.ink,
                }}>{c.who[0]}</div>
                <div style={{
                  fontFamily: TOKENS.display, fontWeight: 900, fontSize: 14,
                  letterSpacing: "-0.02em", marginTop: 6, color: TOKENS.paper,
                }}>{c.who}</div>
                <div style={{
                  fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 700,
                  opacity: 0.65, marginTop: 4, color: TOKENS.paper,
                }}>{c.at}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 2 }}>
          <ChunkyButton variant="accent" onClick={() => navigate({ to: "/new/finished" })} icon={Icons.arrow}>
            Wrap up the night
          </ChunkyButton>
        </div>
      </div>
    </Frame>
  );
}

function action() {
  return {
    appearance: "none" as const,
    cursor: "pointer",
    padding: "12px 14px",
    border: `2.5px solid ${TOKENS.paper}`,
    borderRadius: 12,
    background: "transparent",
    color: TOKENS.paper,
    fontFamily: TOKENS.ui,
    fontSize: 13,
    fontWeight: 800,
    textAlign: "left" as const,
    letterSpacing: "-0.01em",
  };
}
