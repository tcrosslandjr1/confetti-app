import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  BrandMark, Chip, ChunkyButton, DotsBg, Frame, Icons, TOKENS,
} from "@/components/new-confetti/shell";

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
}

function PlanPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<PlanState>({
    city: "Brooklyn, NY", when: "Tonight",
    vibes: ["foodie", "chill"], budget: "$$", crew: 2, addons: ["walk"],
  });
  const toggleVibe = (id: string) => {
    const next = state.vibes.includes(id)
      ? state.vibes.filter((v) => v !== id)
      : state.vibes.length < 3 ? [...state.vibes, id] : state.vibes;
    setState({ ...state, vibes: next });
  };
  const canPlan = state.vibes.length > 0;

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
            color: TOKENS.ink, opacity: 0.55,
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
          <div style={{ marginBottom: 28 }}>
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
        </div>

        <div style={{ position: "relative", zIndex: 2, paddingTop: 12 }}>
          <ChunkyButton
            variant={canPlan ? "accent" : "ghost"}
            disabled={!canPlan}
            onClick={() => canPlan && navigate({ to: "/new/printing" })}
            icon={Icons.arrow}>
            {canPlan ? "Generate my plan" : "Pick a vibe first"}
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
