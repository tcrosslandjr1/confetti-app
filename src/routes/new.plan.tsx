import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  BrandMark, Chip, ChunkyButton, DotsBg, Frame, Icons, TOKENS,
} from "@/components/new-confetti/shell";
import { useNewAuth } from "@/hooks/useNewAuth";
import { generateAiPlan } from "@/lib/generate-plan-client";
import { setActiveLoop } from "@/lib/loop-store";
import { getSelectedCity } from "@/lib/cities";
import { useNightBuilder, clearPinnedVenues } from "@/lib/night-builder-store";

// Ported from design/new-confetti/project/screens.jsx (PlanScreen, line 195)
export const Route = createFileRoute("/new/plan")({
  component: PlanPage,
});

const VIBE_OPTIONS = [
  { id: "chill",    label: "chill",     emoji: "🌿" },
  { id: "hype",     label: "hype",      emoji: "⚡" },
  { id: "romantic", label: "romantic",  emoji: "🍷" },
  { id: "foodie",   label: "foodie",    emoji: "🍜" },
  { id: "weird",    label: "weird",     emoji: "👁" },
  { id: "outside",  label: "outdoorsy", emoji: "🌳" },
  { id: "culture",  label: "culture",   emoji: "🎭" },
  { id: "lowkey",   label: "low-key",   emoji: "☕" },
];

interface PlanState {
  city: string;
  when: string;
  vibes: string[];
  budget: string;
  crew: number;
  addons: string[];
  surpriseMode: boolean;
  localsMode: boolean;
  trendingMode: boolean;
}

function PlanPage() {
  const { ready } = useNewAuth();
  const navigate = useNavigate();
  const nightBuilder = useNightBuilder();
  const hasPinned = nightBuilder.count > 0;

  const [state, setState] = useState<PlanState>({
    city: getSelectedCity()?.name ?? "Washington DC",
    when: "Tonight",
    vibes: [], budget: "$$", crew: 2, addons: [],
    surpriseMode: false, localsMode: false, trendingMode: false,
  });
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleVibe = (id: string) => {
    const next = state.vibes.includes(id)
      ? state.vibes.filter((v) => v !== id)
      : state.vibes.length < 3 ? [...state.vibes, id] : state.vibes;
    setState({ ...state, vibes: next });
  };
  // Can plan if: has pinned venues OR surprise mode OR picked a vibe
  const canPlan = (hasPinned || state.surpriseMode || state.vibes.length > 0) && !generating;

  async function handleGenerate() {
    if (!canPlan) return;
    setGenerating(true);
    setError(null);
    try {
      const { loop } = await generateAiPlan({
        occasion: state.when.toLowerCase(),
        vibe: state.surpriseMode ? undefined : state.vibes.join(", ") || undefined,
        budget: state.budget,
        timeOfDay: state.when.toLowerCase(),
        groupSize: state.crew,
        surpriseMode: state.surpriseMode || undefined,
        localsMode: state.localsMode || undefined,
        trendBias: state.trendingMode || undefined,
        notes: state.addons.length > 0 ? `Preferences: ${state.addons.join(", ")}` : undefined,
        pinnedVenues: nightBuilder.pinned.length > 0 ? nightBuilder.pinned : undefined,
      });
      clearPinnedVenues(); // reset after generating
      setActiveLoop(loop);
      navigate({ to: "/new/printing" });
    } catch (err: any) {
      setError(err.message ?? "Something went wrong — try again.");
    } finally {
      setGenerating(false);
    }
  }

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

  return (
    <Frame>
      <div style={{
        position: "relative", height: "100%",
        background: TOKENS.bg,
        display: "flex", flexDirection: "column",
        padding: "60px 22px 24px",
        overflow: "hidden",
      }}>
        <DotsBg opacity={0.06} />

        <div style={{
          position: "relative", zIndex: 2,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 18,
        }}>
          <BrandMark size={17} />
          <button onClick={() => navigate({ to: "/new/hub" })} style={{
            appearance: "none", cursor: "pointer", background: "transparent",
            border: "none", padding: 6,
            fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 800,
            color: TOKENS.inkHint,
          }}>← back</button>
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
            color: TOKENS.ink, margin: "0 0 24px",
          }}>What's the<br/>vibe?</h2>

          {/* Pinned venues from Explore */}
          {hasPinned && (
            <div style={{
              marginBottom: 22, padding: "14px 16px",
              border: `2.5px solid ${TOKENS.accent1}`, borderRadius: 14,
              background: `${TOKENS.accent1}18`,
              boxShadow: `4px 4px 0 ${TOKENS.accent1}`,
            }}>
              <div style={{
                fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800,
                letterSpacing: ".14em", color: TOKENS.ink, marginBottom: 10,
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span>🎊 YOUR PICKS ({nightBuilder.count})</span>
                <button
                  onClick={() => nightBuilder.clear()}
                  style={{
                    appearance: "none", cursor: "pointer", background: "none",
                    border: "none", fontFamily: TOKENS.mono, fontSize: 9,
                    fontWeight: 700, opacity: 0.5, color: TOKENS.ink,
                    textDecoration: "underline",
                  }}
                >clear</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {nightBuilder.pinned.map((v, i) => (
                  <div key={v.venue_slug} style={{
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <span style={{
                      fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 900,
                      opacity: 0.4, width: 14,
                    }}>{i + 1}.</span>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontFamily: TOKENS.ui, fontSize: 14, fontWeight: 800,
                        color: TOKENS.ink, lineHeight: 1.1,
                      }}>{v.venue_name}</div>
                      {v.category && (
                        <div style={{
                          fontFamily: TOKENS.mono, fontSize: 8, fontWeight: 700,
                          opacity: 0.55, letterSpacing: ".06em",
                        }}>{v.category}{v.neighborhood ? ` · ${v.neighborhood}` : ""}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Where */}
          <div style={{ marginBottom: 22 }}>
            <Label>Where</Label>
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "14px 16px",
              border: `2.5px solid ${TOKENS.ink}`, borderRadius: 14,
              background: TOKENS.paper,
              boxShadow: `4px 4px 0 ${TOKENS.ink}`,
            }}>
              <span style={{ color: TOKENS.accent1 }}>{Icons.pin}</span>
              <input
                value={state.city}
                onChange={(e) => setState({ ...state, city: e.target.value })}
                style={{
                  appearance: "none", border: "none", outline: "none",
                  background: "transparent", flex: 1,
                  fontFamily: TOKENS.ui, fontSize: 16, fontWeight: 700,
                  color: TOKENS.ink,
                }}
              />
            </div>
          </div>

          {/* When */}
          <div style={{ marginBottom: 22 }}>
            <Label>When</Label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {["Now", "Tonight", "Tomorrow", "This weekend"].map((t) => (
                <Chip key={t} selected={state.when === t} color={TOKENS.accent2}
                      onClick={() => setState({ ...state, when: t })}>{t}</Chip>
              ))}
            </div>
          </div>

          {/* Vibe */}
          <div style={{ marginBottom: 22 }}>
            <Label>
              Vibe
              <span style={{
                fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 700,
                opacity: 0.5, marginLeft: 8,
              }}>PICK UP TO 3</span>
            </Label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {VIBE_OPTIONS.map((v) => (
                <Chip key={v.id} selected={state.vibes.includes(v.id)}
                      color={TOKENS.accent1} icon={v.emoji}
                      onClick={() => toggleVibe(v.id)}>{v.label}</Chip>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div style={{ marginBottom: 22 }}>
            <Label>Budget</Label>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { id: "$",   sub: "under $40" },
                { id: "$$",  sub: "$40–80" },
                { id: "$$$", sub: "$80–150" },
                { id: "💸",  sub: "no cap" },
              ].map((b) => (
                <button key={b.id}
                  onClick={() => setState({ ...state, budget: b.id })}
                  style={{
                    appearance: "none", cursor: "pointer", flex: 1,
                    display: "flex", flexDirection: "column", alignItems: "center",
                    gap: 2, padding: "10px 6px",
                    border: `2.5px solid ${TOKENS.ink}`, borderRadius: 14,
                    background: state.budget === b.id ? TOKENS.accent3 : TOKENS.paper,
                    color: state.budget === b.id ? TOKENS.paper : TOKENS.ink,
                    fontFamily: TOKENS.ui, fontWeight: 900,
                    boxShadow: state.budget === b.id ? `3px 3px 0 ${TOKENS.ink}` : `0 0 0 ${TOKENS.ink}`,
                    transform: state.budget === b.id ? "translate(-1px,-1px)" : "none",
                    transition: "all .12s",
                  }}>
                  <span style={{ fontSize: 16 }}>{b.id}</span>
                  <span style={{
                    fontSize: 9, fontWeight: 700, opacity: 0.7,
                    letterSpacing: ".04em", textTransform: "uppercase",
                  }}>{b.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Crew */}
          <div style={{ marginBottom: 22 }}>
            <Label>Crew</Label>
            <div style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "12px 18px",
              border: `2.5px solid ${TOKENS.ink}`, borderRadius: 14,
              background: TOKENS.paper,
              boxShadow: `4px 4px 0 ${TOKENS.ink}`,
            }}>
              <span style={{ color: TOKENS.ink }}>{Icons.people}</span>
              <Stepper value={state.crew}
                onChange={(n) => setState({ ...state, crew: n })}
                min={1} max={12} />
              <span style={{
                fontFamily: TOKENS.ui, fontSize: 14, fontWeight: 700, opacity: 0.6,
              }}>{state.crew === 1 ? "just me" : `${state.crew} ppl`}</span>
            </div>
          </div>

          {/* Add-ons */}
          <div style={{ marginBottom: 22 }}>
            <Label>Add-ons</Label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {[
                { id: "walk",  label: "walkable",  emoji: "👟" },
                { id: "late",  label: "open late", emoji: "🌙" },
                { id: "snack", label: "snacks",    emoji: "🥨" },
                { id: "patio", label: "patio",     emoji: "☀" },
              ].map((a) => (
                <Chip key={a.id} dense selected={state.addons.includes(a.id)}
                  color={TOKENS.accent2} icon={a.emoji}
                  onClick={() => setState({
                    ...state,
                    addons: state.addons.includes(a.id)
                      ? state.addons.filter((x) => x !== a.id)
                      : [...state.addons, a.id],
                  })}>{a.label}</Chip>
              ))}
            </div>
          </div>

          {/* Mode */}
          <div style={{ marginBottom: 28 }}>
            <Label>Mode</Label>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Surprise Me */}
              <ModeToggle
                emoji="🎲"
                label="Surprise me"
                sub="AI picks everything — no vibe needed"
                active={state.surpriseMode}
                color={TOKENS.accent1}
                onClick={() => setState({
                  ...state,
                  surpriseMode: !state.surpriseMode,
                  // clear vibes when surprise mode enabled — AI takes the wheel
                  vibes: !state.surpriseMode ? [] : state.vibes,
                })}
              />
              {/* Locals picks */}
              <ModeToggle
                emoji="🏠"
                label="Locals picks"
                sub="Hidden gems, zero tourist traps"
                active={state.localsMode}
                color={TOKENS.accent2}
                onClick={() => setState({ ...state, localsMode: !state.localsMode })}
              />
              {/* Trending */}
              <ModeToggle
                emoji="🔥"
                label="Trending now"
                sub="What's buzzing this week in the city"
                active={state.trendingMode}
                color={TOKENS.accent3}
                onClick={() => setState({ ...state, trendingMode: !state.trendingMode })}
              />
            </div>
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 2, paddingTop: 12 }}>
          {error && (
            <div style={{
              marginBottom: 10, padding: "10px 14px", borderRadius: 10,
              background: "#fee2e2", border: "2px solid #ef4444",
              fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 600, color: "#991b1b",
            }}>{error}</div>
          )}
          <ChunkyButton
            variant={canPlan ? "accent" : "ghost"}
            disabled={!canPlan}
            onClick={handleGenerate}
            icon={Icons.arrow}>
            {generating
              ? "Building your night…"
              : canPlan
                ? state.surpriseMode
                  ? "🎲 Surprise me"
                  : "Generate my plan"
                : "Pick a vibe first"}
          </ChunkyButton>
        </div>
      </div>
    </Frame>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <div style={{
      fontFamily: TOKENS.mono, fontSize: 11, fontWeight: 700,
      letterSpacing: ".14em", textTransform: "uppercase",
      color: TOKENS.ink, opacity: 0.55,
      marginBottom: 10,
      display: "flex", alignItems: "center",
    }}>{children}</div>
  );
}

function ModeToggle({
  emoji, label, sub, active, color, onClick,
}: {
  emoji: string; label: string; sub: string;
  active: boolean; color: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        appearance: "none", cursor: "pointer", width: "100%",
        display: "flex", alignItems: "center", gap: 14,
        padding: "13px 16px",
        border: `2.5px solid ${TOKENS.ink}`, borderRadius: 14,
        background: active ? color : TOKENS.paper,
        boxShadow: active ? `4px 4px 0 ${TOKENS.ink}` : `2px 2px 0 ${TOKENS.ink}`,
        transform: active ? "translate(-1px,-1px)" : "none",
        transition: "all .12s",
        textAlign: "left",
      }}
    >
      <span style={{ fontSize: 22, lineHeight: 1 }}>{emoji}</span>
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: TOKENS.ui, fontSize: 15, fontWeight: 900,
          color: active ? TOKENS.paper : TOKENS.ink,
          lineHeight: 1.1,
        }}>{label}</div>
        <div style={{
          fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 700,
          color: active ? TOKENS.paper : TOKENS.ink,
          opacity: active ? 0.8 : 0.5,
          letterSpacing: ".05em", textTransform: "uppercase",
          marginTop: 2,
        }}>{sub}</div>
      </div>
      <div style={{
        width: 22, height: 22, borderRadius: 999,
        border: `2.5px solid ${active ? TOKENS.paper : TOKENS.ink}`,
        background: active ? TOKENS.paper : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        transition: "all .12s",
      }}>
        {active && (
          <div style={{
            width: 10, height: 10, borderRadius: 999,
            background: color,
          }} />
        )}
      </div>
    </button>
  );
}

function Stepper({ value, onChange, min = 1, max = 99 }: {
  value: number; onChange: (n: number) => void; min?: number; max?: number;
}) {
  const btn = (label: string, onClick: () => void, disabled: boolean) => (
    <button onClick={onClick} disabled={disabled} style={{
      appearance: "none", cursor: disabled ? "not-allowed" : "pointer",
      width: 28, height: 28, borderRadius: 999,
      border: `2px solid ${TOKENS.ink}`, background: TOKENS.bg,
      fontFamily: TOKENS.ui, fontSize: 16, fontWeight: 900,
      color: TOKENS.ink, opacity: disabled ? 0.3 : 1,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      lineHeight: 1,
    }}>{label}</button>
  );
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      {btn("−", () => onChange(Math.max(min, value - 1)), value <= min)}
      <span style={{
        minWidth: 22, textAlign: "center",
        fontFamily: TOKENS.display, fontSize: 22, fontWeight: 900,
        color: TOKENS.ink, fontVariantNumeric: "tabular-nums",
      }}>{value}</span>
      {btn("+", () => onChange(Math.min(max, value + 1)), value >= max)}
    </div>
  );
}
