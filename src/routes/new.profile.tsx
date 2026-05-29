import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  BrandMark, ChunkyButton, DotsBg, FloatingTickets, Frame, Icons, Stamp, Ticket, TOKENS,
} from "@/components/new-confetti/shell";
import { useAuth } from "@/lib/auth-context";

// Slim port — design/new-confetti/project/profile.jsx (ProfileScreen, line 8)
export const Route = createFileRoute("/new/profile")({
  component: ProfilePage,
});

const TABS = ["scrapbook", "stamps", "crew"] as const;
type Tab = typeof TABS[number];

const SCRAPBOOK = [
  { who: "fri may 16", what: "Lupa Notte", rating: "★★★★★", color: TOKENS.accent1 },
  { who: "sat may 10", what: "Loft Disco", rating: "★★★★★", color: TOKENS.accent3 },
  { who: "thu may 8",  what: "Joe's Tavern", rating: "★★★★",  color: TOKENS.accent2 },
];

const STAMPS = [
  { ico: "🌃", label: "night owl",      sub: "10 late nights" },
  { ico: "🍝", label: "pasta hunter",   sub: "7 italian spots" },
  { ico: "🎟️", label: "first timer",   sub: "1 disco" },
  { ico: "💃", label: "crew captain",   sub: "led 4 nights" },
  { ico: "🌅", label: "till sunrise",   sub: "stayed past 4" },
  { ico: "🍷", label: "wine bar club",  sub: "5 wine bars" },
];

const CREW = [
  { who: "Sara",  c: TOKENS.accent1, last: "out tonight" },
  { who: "Mike",  c: TOKENS.accent3, last: "skinny dennis · 2h ago" },
  { who: "Ren",   c: TOKENS.accent2, last: "added you to crew" },
  { who: "Maya",  c: TOKENS.accent1, last: "rated lupa ★★★★★" },
];

function ProfilePage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("scrapbook");

  // Logged-out state
  if (!loading && !user) {
    return (
      <Frame>
        <div style={{
          position: "relative", height: "100%", background: TOKENS.bg,
          display: "flex", flexDirection: "column",
          padding: "70px 28px 36px", overflow: "hidden",
        }}>
          <DotsBg opacity={0.06} />
          <FloatingTickets density={3} />

          <div style={{ position: "relative", zIndex: 2 }}><BrandMark size={17} spin /></div>

          <div style={{
            position: "relative", zIndex: 2,
            flex: 1, display: "flex", flexDirection: "column",
            justifyContent: "center", gap: 20,
          }}>
            <Stamp color={TOKENS.accent1} rotate={-3} style={{ alignSelf: "flex-start" }}>your profile</Stamp>

            <h1 style={{
              fontFamily: TOKENS.display, fontWeight: 900,
              fontSize: 44, lineHeight: 0.92, letterSpacing: "-0.04em",
              color: TOKENS.ink, margin: 0,
            }}>Sign in to<br/>print nights.</h1>

            <p style={{
              fontFamily: TOKENS.ui, fontSize: 14, fontWeight: 600,
              color: TOKENS.ink, opacity: 0.6, margin: 0, lineHeight: 1.5,
            }}>
              Save your scrapbook, earn stamps,<br/>and keep up with your crew.
            </p>

            {/* Teaser stamp grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {[
                { ico: "🌃", label: "night owl" },
                { ico: "🍝", label: "pasta hunter" },
                { ico: "🎟️", label: "first timer" },
              ].map((s) => (
                <div key={s.label} style={{
                  padding: "12px 8px",
                  border: `2.5px solid ${TOKENS.ink}`, borderRadius: 14,
                  background: TOKENS.paper,
                  boxShadow: `3px 3px 0 ${TOKENS.ink}`,
                  textAlign: "center", opacity: 0.45, filter: "grayscale(0.3)",
                }}>
                  <div style={{ fontSize: 26 }}>{s.ico}</div>
                  <div style={{
                    fontFamily: TOKENS.display, fontWeight: 900, fontSize: 11,
                    letterSpacing: "-0.01em", marginTop: 4,
                  }}>{s.label}</div>
                </div>
              ))}
            </div>

            <ChunkyButton variant="accent" icon={Icons.arrow}
              onClick={() => navigate({ to: "/new/signin" })}>
              sign in
            </ChunkyButton>

            <button onClick={() => navigate({ to: "/new/signup" })} style={{
              appearance: "none", cursor: "pointer", width: "100%",
              padding: "14px",
              border: `2.5px dashed ${TOKENS.ink}`, borderRadius: 14,
              background: "transparent",
              fontFamily: TOKENS.ui, fontSize: 14, fontWeight: 800,
              color: TOKENS.ink,
            }}>
              new here? print your first night →
            </button>
          </div>
        </div>
      </Frame>
    );
  }

  return (
    <Frame>
      <div style={{
        position: "relative", height: "100%", background: TOKENS.bg,
        display: "flex", flexDirection: "column",
        padding: "56px 20px 22px", overflow: "hidden",
      }}>
        <DotsBg opacity={0.05} />

        <div style={{
          position: "relative", zIndex: 2,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 14,
        }}>
          <button onClick={() => navigate({ to: "/new/hub" })} style={backBtn()}>←</button>
          <BrandMark size={17} />
          <button onClick={() => navigate({ to: "/new/settings" })} style={backBtn()}>⚙</button>
        </div>

        {/* Big name + stamp */}
        <div style={{ position: "relative", zIndex: 2 }}>
          <Stamp color={TOKENS.accent1} rotate={-3} style={{ alignSelf: "flex-start", marginBottom: 10 }}>nyc · since '24</Stamp>
          <h1 style={{
            fontFamily: TOKENS.display, fontWeight: 900,
            fontSize: 44, lineHeight: 0.92, letterSpacing: "-0.04em",
            margin: "0 0 6px",
          }}>Jess.</h1>
          <p style={{
            fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 700, opacity: 0.55,
            margin: 0,
          }}>32 nights printed · 18 stamps · 4 in crew</p>
        </div>

        {/* Wallet pass ticket */}
        <div onClick={() => navigate({ to: "/new/wallet" })}
          style={{ position: "relative", zIndex: 2, marginTop: 14, cursor: "pointer" }}>
          <Ticket color={TOKENS.accent2} notch style={{ padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{
                  fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800,
                  letterSpacing: ".14em", opacity: 0.7,
                }}>WALLET</div>
                <div style={{
                  fontFamily: TOKENS.display, fontWeight: 900, fontSize: 22,
                  letterSpacing: "-0.02em", marginTop: 2,
                }}>1,420 confetti</div>
              </div>
              <div style={{
                fontFamily: TOKENS.mono, fontSize: 11, fontWeight: 800,
                letterSpacing: ".14em",
              }}>OPEN →</div>
            </div>
          </Ticket>
        </div>

        {/* Tabs */}
        <div style={{
          position: "relative", zIndex: 2,
          display: "flex", gap: 6, marginTop: 16, marginBottom: 12,
        }}>
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              appearance: "none", cursor: "pointer", flex: 1,
              padding: "8px 10px",
              border: `2.5px solid ${TOKENS.ink}`, borderRadius: 999,
              background: tab === t ? TOKENS.ink : TOKENS.paper,
              color: tab === t ? TOKENS.paper : TOKENS.ink,
              fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800,
              letterSpacing: ".14em", textTransform: "uppercase",
            }}>{t}</button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{
          position: "relative", zIndex: 2,
          flex: 1, overflowY: "auto", scrollbarWidth: "none",
          marginRight: -20, paddingRight: 20,
        }}>
          {tab === "scrapbook" && SCRAPBOOK.map((s, i) => (
            <div key={i} style={{
              display: "flex", gap: 10, padding: 10, marginBottom: 8,
              border: `2.5px solid ${TOKENS.ink}`, borderRadius: 14,
              background: TOKENS.paper,
              boxShadow: `3px 3px 0 ${TOKENS.ink}`,
            }}>
              <div style={{
                width: 50, height: 50, borderRadius: 10,
                border: `2.5px solid ${TOKENS.ink}`, background: s.color,
              }} />
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800,
                  letterSpacing: ".14em", opacity: 0.55, textTransform: "uppercase",
                }}>{s.who}</div>
                <div style={{
                  fontFamily: TOKENS.display, fontWeight: 900, fontSize: 16,
                  letterSpacing: "-0.02em", marginTop: 2,
                }}>{s.what}</div>
                <div style={{
                  fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 700, marginTop: 2,
                }}>{s.rating}</div>
              </div>
            </div>
          ))}

          {tab === "stamps" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {STAMPS.map((s) => (
                <div key={s.label} style={{
                  padding: "12px 8px",
                  border: `2.5px solid ${TOKENS.ink}`, borderRadius: 14,
                  background: TOKENS.paper,
                  boxShadow: `3px 3px 0 ${TOKENS.ink}`,
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 26 }}>{s.ico}</div>
                  <div style={{
                    fontFamily: TOKENS.display, fontWeight: 900, fontSize: 11,
                    letterSpacing: "-0.01em", marginTop: 4,
                  }}>{s.label}</div>
                  <div style={{
                    fontFamily: TOKENS.mono, fontSize: 8, fontWeight: 700,
                    opacity: 0.55, marginTop: 2, letterSpacing: ".06em",
                  }}>{s.sub}</div>
                </div>
              ))}
            </div>
          )}

          {tab === "crew" && (
            <>
              {CREW.map((c) => (
                <div key={c.who} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: 10, marginBottom: 6,
                  border: `2.5px solid ${TOKENS.ink}`, borderRadius: 14,
                  background: TOKENS.paper,
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 999,
                    background: c.c, border: `2.5px solid ${TOKENS.ink}`,
                    display: "grid", placeItems: "center",
                    fontFamily: TOKENS.display, fontWeight: 900, fontSize: 14,
                  }}>{c.who[0]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: TOKENS.display, fontWeight: 900, fontSize: 14,
                      letterSpacing: "-0.01em",
                    }}>{c.who}</div>
                    <div style={{
                      fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 700,
                      opacity: 0.55, marginTop: 2, letterSpacing: ".06em",
                    }}>{c.last}</div>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 8 }}>
                <ChunkyButton variant="ghost" onClick={() => navigate({ to: "/new/crew-map" })}>see crew map</ChunkyButton>
              </div>
            </>
          )}
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
