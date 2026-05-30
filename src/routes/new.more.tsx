import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  BrandMark, DotsBg, FloatingTickets, Frame, Icons,
  Stamp, Ticket, TOKENS,
} from "@/components/new-confetti/shell";

export const Route = createFileRoute("/new/more")({ component: MorePage });

// ─── Trips list ───────────────────────────────────────────────
type Trip = { id: string; date: string; n: string; stops: number; cost: number; status: string; vibe: string; c: string };
const TRIPS: Trip[] = [
  { id: "A7K2", date: "Sat May 23", n: "Brooklyn date night",  stops: 3, cost: 92, status: "active", vibe: "foodie · chill",  c: TOKENS.accent1 },
  { id: "J3M1", date: "Fri May 16", n: "Bushwick crawl",       stops: 4, cost: 48, status: "past",   vibe: "hype · weird",   c: TOKENS.accent2 },
  { id: "R8X2", date: "Sat May 10", n: "LES date night",       stops: 3, cost: 92, status: "past",   vibe: "romantic",       c: TOKENS.accent1 },
  { id: "P9N4", date: "Thu May 1",  n: "Solo culture day",     stops: 2, cost: 26, status: "past",   vibe: "cultural",       c: TOKENS.accent3 },
  { id: "X4K9", date: "Fri Jun 5",  n: "Crew night out",       stops: 4, cost: 0,  status: "draft",  vibe: "tbd",            c: TOKENS.accent2 },
];

// ─── Section label ────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800,
      letterSpacing: ".14em", textTransform: "uppercase" as const,
      color: TOKENS.ink, opacity: 0.55, margin: "16px 0 8px",
    }}>{children}</div>
  );
}

// ─── Page tabs ────────────────────────────────────────────────
type Tab = "trips" | "referral" | "about";

function MorePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("trips");
  const [tripFilter, setTripFilter] = useState("all");

  const visibleTrips = tripFilter === "all" ? TRIPS : TRIPS.filter((t) => t.status === tripFilter);

  return (
    <Frame>
      <div className="cf-screen" style={{
        position: "relative", height: "100dvh",
        background: TOKENS.bg,
        display: "flex", flexDirection: "column",
        padding: "56px 22px 24px", overflow: "hidden",
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
            width: 36, height: 36, borderRadius: 999,
            border: `2.5px solid ${TOKENS.ink}`, background: TOKENS.paper,
            fontSize: 14, fontWeight: 900, color: TOKENS.ink,
            boxShadow: `3px 3px 0 ${TOKENS.ink}`,
          }}>←</button>
          <h2 style={{
            fontFamily: TOKENS.display, fontWeight: 900, fontSize: 22,
            letterSpacing: "-0.035em", margin: 0, color: TOKENS.ink,
          }}>more</h2>
          <span style={{ width: 36 }} />
        </div>

        {/* Top tabs */}
        <div style={{ position: "relative", zIndex: 2, display: "flex", gap: 6, marginBottom: 12 }}>
          {(["trips", "referral", "about"] as const).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              appearance: "none", cursor: "pointer", flex: 1,
              padding: "8px 6px",
              border: `2.5px solid ${TOKENS.ink}`, borderRadius: 999,
              background: activeTab === t ? TOKENS.ink : TOKENS.paper,
              color: activeTab === t ? TOKENS.paper : TOKENS.ink,
              fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 800,
            }}>{t}</button>
          ))}
        </div>

        <div style={{
          position: "relative", zIndex: 2,
          flex: 1, overflowY: "auto", scrollbarWidth: "none",
        }}>
          {/* ── Trips tab ── */}
          {activeTab === "trips" && (
            <>
              {/* Filter pills */}
              <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                {["all","active","past","draft"].map((f) => (
                  <button key={f} onClick={() => setTripFilter(f)} style={{
                    appearance: "none", cursor: "pointer",
                    padding: "6px 12px",
                    border: `2px solid ${TOKENS.ink}`, borderRadius: 999,
                    background: tripFilter === f ? TOKENS.ink : TOKENS.paper,
                    color: tripFilter === f ? TOKENS.paper : TOKENS.ink,
                    fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800,
                    letterSpacing: ".1em",
                  }}>{f.toUpperCase()}</button>
                ))}
              </div>

              {visibleTrips.map((trip) => (
                <button key={trip.id} onClick={() => navigate({ to: "/new/pass" })} style={{
                  appearance: "none", cursor: "pointer", width: "100%", textAlign: "left" as const,
                  display: "flex", alignItems: "center", gap: 12,
                  padding: 14, marginBottom: 8,
                  border: `2.5px solid ${TOKENS.ink}`, borderRadius: 14,
                  background: trip.c,
                  boxShadow: `4px 4px 0 ${TOKENS.ink}`,
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 10,
                    border: `2.5px solid ${TOKENS.ink}`, background: TOKENS.paper,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: TOKENS.mono, fontSize: 12, fontWeight: 900, color: TOKENS.ink,
                    flexShrink: 0,
                  }}>#{trip.id}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: TOKENS.display, fontWeight: 900, fontSize: 17,
                      letterSpacing: "-0.025em", lineHeight: 1.1, color: TOKENS.ink,
                    }}>{trip.n}</div>
                    <div style={{
                      fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800,
                      color: TOKENS.ink, opacity: 0.7, marginTop: 3, letterSpacing: ".08em",
                    }}>{trip.date} · {trip.stops} STOPS · ${trip.cost}</div>
                    <div style={{
                      fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 700,
                      color: TOKENS.ink, opacity: 0.55, marginTop: 2, letterSpacing: ".06em",
                    }}>{trip.vibe}</div>
                  </div>
                  <div style={{
                    padding: "3px 8px",
                    background: trip.status === "active" ? TOKENS.accent4 : trip.status === "draft" ? TOKENS.accent2 : TOKENS.paper,
                    color: trip.status === "active" ? TOKENS.paper : TOKENS.ink,
                    border: `1.5px solid ${TOKENS.ink}`, borderRadius: 4,
                    fontFamily: TOKENS.mono, fontSize: 8, fontWeight: 800, letterSpacing: ".08em",
                    textTransform: "uppercase" as const,
                  }}>{trip.status}</div>
                </button>
              ))}
            </>
          )}

          {/* ── Referral tab ── */}
          {activeTab === "referral" && (
            <div style={{
              flex: 1, display: "flex", flexDirection: "column" as const, gap: 14,
            }}>
              <FloatingTickets density={4} />
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                padding: "8px 14px",
                background: TOKENS.ink, color: TOKENS.paper,
                border: `3px solid ${TOKENS.ink}`, borderRadius: 999,
                fontFamily: TOKENS.mono, fontSize: 11, fontWeight: 800,
                letterSpacing: ".14em", alignSelf: "flex-start" as const,
                boxShadow: `3px 3px 0 ${TOKENS.paper}`,
              }}>INVITE · #MAYA-12</div>
              <h1 style={{
                fontFamily: TOKENS.display, fontWeight: 900,
                fontSize: 54, lineHeight: 0.88, letterSpacing: "-0.045em",
                margin: 0, color: TOKENS.ink,
              }}>$20 off<br/>your first<br/>night.</h1>
              <p style={{
                fontFamily: TOKENS.ui, fontSize: 14, fontWeight: 600,
                color: TOKENS.ink, opacity: 0.88, margin: 0, lineHeight: 1.4, maxWidth: 340,
              }}>Tell Sparkle a vibe, get a 3-stop pass — credit applies at first booking. 4 minutes from chat to door.</p>
              {/* Referral steps */}
              <div style={{
                padding: 14, background: TOKENS.paper,
                border: `3px solid ${TOKENS.ink}`, borderRadius: 14, boxShadow: `5px 5px 0 ${TOKENS.ink}`,
              }}>
                <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".16em", color: TOKENS.ink, opacity: 0.6, marginBottom: 8 }}>HOW THE REFERRAL WORKS</div>
                {[
                  { n: "1", c: TOKENS.accent2, h: "You get $20 off first booking", s: "credit auto-applies at checkout · participating venues only" },
                  { n: "2", c: TOKENS.accent1, h: "Subscribe to All-Access ($9.99/mo)", s: "unlimited plans, family mode, kids parties, 7-day free trial" },
                  { n: "3", c: TOKENS.accent4, h: "@maya earns a $10 gift card", s: "every month, while you stay subscribed" },
                ].map((step) => (
                  <div key={step.n} style={{
                    display: "flex", alignItems: "flex-start", gap: 10, padding: "6px 0",
                    borderTop: step.n !== "1" ? `1.5px dashed ${TOKENS.ink}` : "none",
                  }}>
                    <span style={{
                      flexShrink: 0, width: 26, height: 26, borderRadius: "50%",
                      border: `2px solid ${TOKENS.ink}`, background: step.c, color: TOKENS.ink,
                      fontFamily: TOKENS.display, fontWeight: 900, fontSize: 13,
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                    }}>{step.n}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 14, letterSpacing: "-0.02em", lineHeight: 1.1, color: TOKENS.ink }}>{step.h}</div>
                      <div style={{ fontFamily: TOKENS.mono, fontSize: 9.5, fontWeight: 700, color: TOKENS.ink, opacity: 0.65, marginTop: 2, lineHeight: 1.3, letterSpacing: ".04em" }}>{step.s}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate({ to: "/new/signup" })} style={{
                appearance: "none", cursor: "pointer", width: "100%",
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10,
                padding: "18px 22px",
                border: `3px solid ${TOKENS.ink}`, borderRadius: 16,
                background: TOKENS.ink, color: TOKENS.paper,
                fontFamily: TOKENS.ui, fontSize: 17, fontWeight: 900,
                boxShadow: `5px 5px 0 ${TOKENS.accent1}`,
              }}>claim my pass {Icons.arrow}</button>
            </div>
          )}

          {/* ── About tab ── */}
          {activeTab === "about" && (
            <>
              <Stamp color={TOKENS.accent1} rotate={-3} style={{ marginBottom: 14 }}>founded 2025 · brooklyn</Stamp>
              <h1 style={{
                fontFamily: TOKENS.display, fontWeight: 900,
                fontSize: 40, lineHeight: 0.92, letterSpacing: "-0.045em",
                color: TOKENS.ink, margin: "0 0 18px",
              }}>Going out<br/>shouldn't take<br/><span style={{ color: TOKENS.accent1 }}>two hours of<br/>texting.</span></h1>
              <p style={{
                fontFamily: TOKENS.ui, fontSize: 15, fontWeight: 600,
                color: TOKENS.ink, opacity: 0.8, lineHeight: 1.5, margin: "0 0 18px",
              }}>We built Confetti because nights out collapse under choice overload. Confetti is six AI agents that read your vibe, rank 40+ venues, enforce your budget, and print a pass you can actually follow.</p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 22 }}>
                {[["230k","passes printed"],["12 cities","live"],["4m 18s","plan time avg"],["82%","completion rate"]].map(([n, l]) => (
                  <div key={n} style={{
                    padding: 14, border: `2.5px solid ${TOKENS.ink}`, borderRadius: 12,
                    background: TOKENS.paper, boxShadow: `3px 3px 0 ${TOKENS.ink}`,
                  }}>
                    <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 26, letterSpacing: "-0.03em", color: TOKENS.ink }}>{n}</div>
                    <div style={{ fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 700, color: TOKENS.ink, opacity: 0.55, marginTop: 2, letterSpacing: ".1em", textTransform: "uppercase" as const }}>{l}</div>
                  </div>
                ))}
              </div>

              <SectionLabel>links</SectionLabel>
              {[["careers","we're hiring · 4 roles"],["press","recent: bk mag, eater"],["for venues","partner with us"],["privacy & terms",""]].map(([l, s]) => (
                <div key={l} style={{
                  padding: "12px 14px", marginBottom: 6,
                  border: `2px solid ${TOKENS.ink}`, borderRadius: 10,
                  background: TOKENS.paper,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <div>
                    <div style={{ fontFamily: TOKENS.ui, fontSize: 14, fontWeight: 800, color: TOKENS.ink }}>{l}</div>
                    {s && <div style={{ fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 700, color: TOKENS.ink, opacity: 0.55, marginTop: 1 }}>{s}</div>}
                  </div>
                  <span style={{ color: TOKENS.ink, opacity: 0.5, fontWeight: 900 }}>›</span>
                </div>
              ))}
              <div style={{ height: 8 }} />
            </>
          )}
        </div>
      </div>
    </Frame>
  );
}
