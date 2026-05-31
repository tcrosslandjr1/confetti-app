import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Frame, TopBar, TOKENS, Chip } from "@/components/new-confetti/shell";

export const Route = createFileRoute("/new/vibe-mode")({ component: VibeModeScreen });

const VIBES = [
  {
    id: "game-night",
    emoji: "🎮",
    title: "Game Night",
    subtitle: "Play hard, laugh harder",
    tags: ["Group-friendly", "Interactive", "Chill"],
    gradient: `linear-gradient(135deg, ${TOKENS.accent3} 0%, #3d2fa8 100%)`,
    route: "/new/game-night" as const,
    lightText: true,
  },
  {
    id: "pizza-night",
    emoji: "🍕",
    title: "Pizza Night",
    subtitle: "Comfort food, good vibes",
    tags: ["Comfort", "Casual", "Food-first"],
    gradient: `linear-gradient(135deg, ${TOKENS.accent1} 0%, #c93a1e 100%)`,
    route: "/new/pizza-night" as const,
    lightText: true,
  },
  {
    id: "sports-night",
    emoji: "🏈",
    title: "Sports Night",
    subtitle: "Your team. Your bar. Your night.",
    tags: ["High-energy", "Event-based", "Crowd vibe"],
    gradient: `linear-gradient(135deg, ${TOKENS.accent4} 0%, #1a7a4a 100%)`,
    route: "/new/sports-night" as const,
    lightText: true,
  },
] as const;

function VibeModeScreen() {
  const navigate = useNavigate();

  return (
    <Frame>
      <div className="cf-screen" style={{ minHeight: "100dvh", padding: "0 0 32px" }}>
        <div style={{ padding: "16px 20px 0" }}>
          <TopBar onBack={() => navigate({ to: "/new/hub" })} />
        </div>

        <div style={{ padding: "0 20px 24px" }}>
          <p style={{
            fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 800,
            letterSpacing: ".14em", textTransform: "uppercase",
            color: TOKENS.accent1, margin: "0 0 6px",
          }}>
            vibe selector
          </p>
          <h1 style={{
            fontFamily: TOKENS.display, fontSize: 28, fontWeight: 900,
            letterSpacing: "-0.03em", color: TOKENS.ink, margin: 0, lineHeight: 1.15,
          }}>
            Tonight,<br />what's the vibe?
          </h1>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "0 20px" }}>
          {VIBES.map((vibe) => (
            <button
              key={vibe.id}
              onClick={() => navigate({ to: vibe.route })}
              style={{
                appearance: "none", cursor: "pointer",
                position: "relative", overflow: "hidden",
                background: vibe.gradient,
                border: `3px solid ${TOKENS.ink}`,
                borderRadius: 24,
                boxShadow: `5px 5px 0 ${TOKENS.ink}`,
                padding: "28px 24px",
                textAlign: "left",
                transition: "transform .12s, box-shadow .12s",
              }}
              onMouseDown={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translate(2px,2px)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = `3px 3px 0 ${TOKENS.ink}`;
              }}
              onMouseUp={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = `5px 5px 0 ${TOKENS.ink}`;
              }}
            >
              {/* Decorative dots pattern */}
              <div style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                backgroundImage: `radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)`,
                backgroundSize: "20px 20px",
              }} />

              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 44, lineHeight: 1 }}>{vibe.emoji}</span>
                  <span style={{
                    fontSize: 22, color: "rgba(255,255,255,0.7)",
                    fontWeight: 900, lineHeight: 1, paddingTop: 8,
                  }}>→</span>
                </div>
                <h2 style={{
                  fontFamily: TOKENS.display, fontSize: 26, fontWeight: 900,
                  letterSpacing: "-0.03em", color: TOKENS.paper,
                  margin: "0 0 4px", lineHeight: 1.1,
                }}>
                  {vibe.title}
                </h2>
                <p style={{
                  fontFamily: TOKENS.ui, fontSize: 14, fontWeight: 500,
                  color: "rgba(255,250,240,0.75)", margin: "0 0 14px",
                }}>
                  {vibe.subtitle}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {vibe.tags.map((tag) => (
                    <span key={tag} style={{
                      padding: "5px 11px",
                      border: "2px solid rgba(255,250,240,0.5)",
                      borderRadius: 999,
                      fontFamily: TOKENS.ui, fontSize: 11, fontWeight: 800,
                      color: TOKENS.paper, letterSpacing: ".04em",
                      background: "rgba(255,255,255,0.1)",
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div style={{ padding: "20px 20px 0", display: "flex", justifyContent: "center" }}>
          <Chip onClick={() => navigate({ to: "/new/plan" })}>
            ✦ build a custom plan instead
          </Chip>
        </div>
      </div>
    </Frame>
  );
}
