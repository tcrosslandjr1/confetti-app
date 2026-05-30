import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import {
  BrandMark, DotsBg, Frame, RouteDots, Ticket, TOKENS,
} from "@/components/new-confetti/shell";
import { useNewAuth } from "@/hooks/useNewAuth";
import { getActiveLoop } from "@/lib/loop-store";
import { toast } from "sonner";

export const Route = createFileRoute("/new/hub")({
  component: HubPage,
  validateSearch: (s: Record<string, unknown>) => ({
    message: typeof s.message === "string" ? s.message : undefined,
  }),
});

function HubPage() {
  const { ready, user } = useNewAuth();
  const navigate = useNavigate();
  const { message } = Route.useSearch();

  useEffect(() => {
    if (message) toast.info(message);
  }, [message]);

  // ── Real user display name & initials ───────────────────────────
  const rawName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "hey";
  const firstName = rawName.split(/[\s_\.]+/)[0];
  const greeting = firstName.charAt(0).toUpperCase() + firstName.slice(1);
  const initials = (user?.user_metadata?.display_name || user?.email || "?")
    .split(/[\s@_\.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w: string) => w[0].toUpperCase())
    .join("") || "?";

  // ── Dynamic day / time of day ────────────────────────────────────
  const dayLabel = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const h = new Date().getHours();
  const timeLabel = h < 12 ? "morning" : h < 17 ? "afternoon" : "wide open";

  // ── Active loop ──────────────────────────────────────────────────
  const activeLoop = getActiveLoop();
  const currentStop = activeLoop?.stops?.find(s => !s.done) ?? activeLoop?.stops?.[0];
  const completedCount = activeLoop?.stops?.filter(s => s.done).length ?? 0;
  const totalStops = activeLoop?.stops?.length ?? 0;

  if (!ready) {
    return (
      <Frame>
        <div style={{
          height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
          background: TOKENS.bg, fontFamily: TOKENS.display, fontSize: 24, fontWeight: 900,
          color: TOKENS.inkMuted,
        }}>loading...</div>
      </Frame>
    );
  }
  const onGo = (target: string) => {
    if (target === "chat") navigate({ to: "/new/chat" });
    else if (target === "plan") navigate({ to: "/new/plan" });
    else if (target === "night") navigate({ to: "/new/night" });
    else if (target === "loader" || target === "surprise") navigate({ to: "/new/printing" });
    else if (target === "explore") navigate({ to: "/new/explore" });
    else if (target === "feed") navigate({ to: "/new/reels" });
    else if (target === "crew-map") navigate({ to: "/new/crew-map" });
    else if (target === "wallet") navigate({ to: "/new/wallet" });
  };

  return (
    <Frame>
      <div style={{
        position: "relative", height: "100%",
        background: TOKENS.bg,
        display: "flex", flexDirection: "column",
        padding: "56px 22px 76px",
        overflow: "hidden",
      }}>
        <DotsBg opacity={0.06} />

        {/* Top bar */}
        <div style={{
          position: "relative", zIndex: 2,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 14,
        }}>
          <BrandMark size={18} />
          <button
            onClick={() => navigate({ to: "/new/profile" })}
            style={{
              appearance: "none", cursor: "pointer",
              width: 38, height: 38, borderRadius: 999,
              border: `2.5px solid ${TOKENS.ink}`, background: TOKENS.accent2,
              fontFamily: TOKENS.display, fontWeight: 900, fontSize: 14,
              color: TOKENS.ink,
              boxShadow: `3px 3px 0 ${TOKENS.ink}`,
            }}>{initials}</button>
        </div>

        <div style={{
          position: "relative", zIndex: 2,
          flex: 1, overflowY: "auto", overflowX: "hidden",
          marginRight: -22, paddingRight: 22,
          scrollbarWidth: "none",
        }}>
          <h2 style={{
            fontFamily: TOKENS.display, fontWeight: 900,
            fontSize: 38, lineHeight: 0.95, letterSpacing: "-0.04em",
            color: TOKENS.ink, margin: "0 0 4px",
          }}>Hey, {greeting}.</h2>
          <p style={{
            fontFamily: TOKENS.ui, fontSize: 14, fontWeight: 600,
            color: TOKENS.inkMuted, margin: "0 0 18px",
          }}>{dayLabel}'s {timeLabel}. Print one?</p>

          {/* Big planner CTAs — two paths */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 10, marginBottom: 18 }}>
            <button onClick={() => onGo("chat")} style={{
              appearance: "none", cursor: "pointer", textAlign: "left",
              padding: "16px 14px",
              border: `3px solid ${TOKENS.ink}`, borderRadius: 18,
              background: TOKENS.accent1, color: TOKENS.ink,
              boxShadow: `5px 5px 0 ${TOKENS.ink}`,
              display: "flex", flexDirection: "column", gap: 6,
              minHeight: 130,
            }}>
              <span style={{
                fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800,
                letterSpacing: ".14em", color: TOKENS.inkMuted,
              }}>NEW · BETA</span>
              <span style={{
                fontFamily: TOKENS.display, fontWeight: 900, fontSize: 22,
                letterSpacing: "-0.03em", lineHeight: 0.95,
              }}>chat with<br/>confetti</span>
              <span style={{
                fontFamily: TOKENS.ui, fontSize: 11, fontWeight: 700,
                color: TOKENS.inkHint, marginTop: "auto",
              }}>talk it out, get a pass</span>
            </button>
            <button onClick={() => onGo("plan")} style={{
              appearance: "none", cursor: "pointer", textAlign: "left",
              padding: "16px 14px",
              border: `3px solid ${TOKENS.ink}`, borderRadius: 18,
              background: TOKENS.paper, color: TOKENS.ink,
              boxShadow: `5px 5px 0 ${TOKENS.ink}`,
              display: "flex", flexDirection: "column", gap: 6,
              minHeight: 130,
            }}>
              <span style={{
                fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800,
                letterSpacing: ".14em", color: TOKENS.inkHint,
              }}>CLASSIC</span>
              <span style={{
                fontFamily: TOKENS.display, fontWeight: 900, fontSize: 22,
                letterSpacing: "-0.03em", lineHeight: 0.95,
              }}>vibe<br/>form</span>
              <span style={{
                fontFamily: TOKENS.ui, fontSize: 11, fontWeight: 700,
                color: TOKENS.inkHint, marginTop: "auto",
              }}>chips + sliders</span>
            </button>
          </div>

          {/* Tonight pass — conditional on active loop */}
          <SectionLabel>tonight</SectionLabel>
          {activeLoop ? (
            <button onClick={() => onGo("night")} style={{
              appearance: "none", cursor: "pointer", textAlign: "left", width: "100%",
              padding: 0, border: "none", background: "transparent",
              marginBottom: 18,
            }}>
              <Ticket color={TOKENS.paper} notch={false} style={{ padding: 14 }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: 8,
                }}>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "4px 8px", background: TOKENS.accent1,
                    border: `2px solid ${TOKENS.ink}`, borderRadius: 999,
                    fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800,
                    letterSpacing: ".14em",
                  }}>
                    <span style={{
                      width: 5, height: 5, borderRadius: 999, background: TOKENS.ink,
                      animation: "cf-pulse 1.2s infinite",
                    }} />
                    IN PROGRESS · STOP {completedCount + 1}/{totalStops}
                  </span>
                  <span style={{
                    fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800,
                    color: TOKENS.inkHint, letterSpacing: ".12em",
                  }}>{activeLoop.id}</span>
                </div>
                <div style={{
                  fontFamily: TOKENS.display, fontWeight: 900, fontSize: 22,
                  letterSpacing: "-0.03em", lineHeight: 1,
                }}>{currentStop?.name ?? activeLoop.to}</div>
                <div style={{
                  fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 700,
                  color: TOKENS.inkMuted, marginTop: 3,
                }}>
                  {[currentStop?.time, currentStop?.type, currentStop?.address || currentStop?.area]
                    .filter(Boolean).join(" · ")}
                </div>
                <div style={{ marginTop: 10 }}>
                  <RouteDots
                    progress={totalStops > 0 ? (completedCount + 1) / totalStops : 0.5}
                    size={14}
                  />
                </div>
                <div style={{
                  marginTop: 6, paddingTop: 10, borderTop: "2px dashed rgba(0,0,0,0.15)",
                  display: "flex", alignItems: "center", gap: 8,
                  fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 800,
                }}>
                  <span>→</span><span>Tap to open live view</span>
                </div>
              </Ticket>
            </button>
          ) : (
            <button onClick={() => onGo("chat")} style={{
              appearance: "none", cursor: "pointer", textAlign: "left", width: "100%",
              padding: 0, border: "none", background: "transparent",
              marginBottom: 18,
            }}>
              <Ticket color={TOKENS.paper} notch={false} style={{ padding: 14 }}>
                <div style={{
                  fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800,
                  letterSpacing: ".14em", color: TOKENS.inkHint, marginBottom: 8,
                }}>NO ACTIVE PASS</div>
                <div style={{
                  fontFamily: TOKENS.display, fontWeight: 900, fontSize: 22,
                  letterSpacing: "-0.03em", lineHeight: 1,
                }}>Nothing printed yet.</div>
                <div style={{
                  fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 700,
                  color: TOKENS.inkMuted, marginTop: 3,
                }}>Chat with Confetti to build your night →</div>
              </Ticket>
            </button>
          )}

          {/* Portals */}
          <SectionLabel>portals</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 18 }}>
            <Portal icon="🗺" label="explore" sub="venues nearby" onClick={() => onGo("explore")} />
            <Portal icon="🎬" label="crew reels" sub="3 new" onClick={() => onGo("feed")} />
            <Portal icon="📍" label="crew map" sub="3 live now" onClick={() => onGo("crew-map")} />
            <Portal icon="📅" label="this week" sub="3 ideas" onClick={() => onGo("plan")} />
            <Portal icon="💳" label="wallet" sub="1 active" onClick={() => onGo("wallet")} />
            <Portal icon="🎲" label="surprise me" sub="full random" onClick={() => onGo("loader")} />
          </div>

          {/* Scrapbook */}
          <SectionLabel>your scrapbook</SectionLabel>
          <div style={{
            display: "flex", gap: 10, overflowX: "auto", scrollbarWidth: "none",
            marginRight: -22, paddingRight: 22, marginBottom: 18,
          }}>
            {[
              { date: "fri may 16", n: "Bushwick crawl", cost: "$48", color: TOKENS.accent2 },
              { date: "sat may 10", n: "Date night LES", cost: "$92", color: TOKENS.accent1 },
              { date: "thu may 1",  n: "Solo culture",   cost: "$26", color: TOKENS.accent3 },
              { date: "fri apr 25", n: "Weird brunch",   cost: "$54", color: TOKENS.accent2 },
            ].map((p, i) => (
              <div key={i} style={{
                flexShrink: 0, width: 130,
                border: `2.5px solid ${TOKENS.ink}`, borderRadius: 12,
                background: p.color, padding: 10,
                boxShadow: `3px 3px 0 ${TOKENS.ink}`,
                transform: `rotate(${[-2, 1, -1, 2][i]}deg)`,
                color: p.color === TOKENS.accent3 ? TOKENS.paper : TOKENS.ink,
              }}>
                <div style={{
                  fontFamily: TOKENS.mono, fontSize: 8, fontWeight: 800,
                  letterSpacing: ".14em", color: TOKENS.inkHint,
                }}>{p.date.toUpperCase()}</div>
                <div style={{
                  fontFamily: TOKENS.display, fontWeight: 900, fontSize: 15,
                  letterSpacing: "-0.02em", marginTop: 4, lineHeight: 1.05,
                }}>{p.n}</div>
                <div style={{
                  fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800,
                  color: TOKENS.inkHint, marginTop: 6,
                }}>{p.cost} · 3 stops</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Frame>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div style={{
      fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800,
      letterSpacing: ".18em", textTransform: "uppercase",
      color: TOKENS.inkHint,
      marginBottom: 10,
    }}>{children}</div>
  );
}

function Portal({ icon, label, sub, onClick }: { icon: string; label: string; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      appearance: "none", cursor: "pointer", textAlign: "left",
      padding: 10,
      border: `2.5px solid ${TOKENS.ink}`, borderRadius: 12,
      background: TOKENS.paper, color: TOKENS.ink,
      boxShadow: `3px 3px 0 ${TOKENS.ink}`,
      display: "flex", flexDirection: "column", gap: 2,
    }}>
      <span style={{ fontSize: 22, marginBottom: 2 }}>{icon}</span>
      <span style={{
        fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 900,
        letterSpacing: "-0.01em",
      }}>{label}</span>
      <span style={{
        fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 700,
        color: TOKENS.inkHint, letterSpacing: ".06em",
      }}>{sub}</span>
    </button>
  );
}
