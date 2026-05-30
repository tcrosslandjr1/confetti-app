import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  BrandMark,
  Chip,
  ChunkyButton,
  DotsBg,
  Frame,
  Icons,
  Stamp,
  Ticket,
  TOKENS,
} from "@/components/new-confetti/shell";

// Slim port — design/new-confetti/project/family.jsx (FamilyPlanScreen, line 161)
export const Route = createFileRoute("/new/family-plan")({
  component: FamilyPlanPage,
});

const PORTAL_OPTIONS = ["theme park", "zoo", "beach day", "museum", "city tour"];
const VIBES = ["chill", "rides", "easy walks", "shaded", "stroller-friendly", "tween-mode"];
const AGES = ["babies", "toddlers", "kids", "tweens", "teens"];

function FamilyPlanPage() {
  const navigate = useNavigate();
  const [portal, setPortal] = useState("theme park");
  const [vibes, setVibes] = useState<string[]>(["easy walks"]);
  const [ages, setAges] = useState<string[]>(["kids"]);

  const toggle = (arr: string[], v: string, set: (a: string[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <Frame>
      <div
        style={{
          position: "relative",
          height: "100%",
          background: TOKENS.bg,
          display: "flex",
          flexDirection: "column",
          padding: "56px 20px 22px",
          overflow: "hidden",
        }}
      >
        <DotsBg opacity={0.05} />

        <div
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <button onClick={() => navigate({ to: "/new/hub" })} style={backBtn()}>
            ←
          </button>
          <BrandMark size={17} />
          <span style={{ width: 36 }} />
        </div>

        <Stamp color={TOKENS.accent2} rotate={-3} style={{ alignSelf: "flex-start" }}>
          family mode
        </Stamp>
        <h1
          style={{
            fontFamily: TOKENS.display,
            fontWeight: 900,
            fontSize: 38,
            lineHeight: 0.92,
            letterSpacing: "-0.04em",
            margin: "10px 0 16px",
            position: "relative",
            zIndex: 2,
          }}
        >
          Plan a<br />
          family day.
        </h1>

        <div
          style={{
            position: "relative",
            zIndex: 2,
            flex: 1,
            overflowY: "auto",
            scrollbarWidth: "none",
            marginRight: -20,
            paddingRight: 20,
          }}
        >
          <Label>day type</Label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {PORTAL_OPTIONS.map((p) => (
              <Chip
                key={p}
                dense
                selected={portal === p}
                color={TOKENS.accent1}
                onClick={() => setPortal(p)}
              >
                {p}
              </Chip>
            ))}
          </div>

          <Label>vibes</Label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {VIBES.map((v) => (
              <Chip
                key={v}
                dense
                selected={vibes.includes(v)}
                color={TOKENS.accent2}
                onClick={() => toggle(vibes, v, setVibes)}
              >
                {v}
              </Chip>
            ))}
          </div>

          <Label>who's coming</Label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {AGES.map((a) => (
              <Chip
                key={a}
                dense
                selected={ages.includes(a)}
                color={TOKENS.accent3}
                onClick={() => toggle(ages, a, setAges)}
              >
                {a}
              </Chip>
            ))}
          </div>

          <Ticket color={TOKENS.accent2} notch={false} style={{ padding: 14 }}>
            <div
              style={{
                fontFamily: TOKENS.mono,
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: ".14em",
                opacity: 0.7,
              }}
            >
              WHAT WE'LL PRINT
            </div>
            <div
              style={{
                fontFamily: TOKENS.display,
                fontWeight: 900,
                fontSize: 15,
                letterSpacing: "-0.02em",
                marginTop: 6,
                lineHeight: 1.2,
              }}
            >
              3-stop {portal} day with {ages.join(" + ")}, paced for {vibes.join(" + ") || "easy"}.
            </div>
          </Ticket>
        </div>

        <div style={{ marginTop: 12, position: "relative", zIndex: 2 }}>
          <ChunkyButton
            variant="accent"
            onClick={() => navigate({ to: "/new/family-pass" })}
            icon={Icons.arrow}
          >
            print our day
          </ChunkyButton>
        </div>
      </div>
    </Frame>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: TOKENS.mono,
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: ".16em",
        opacity: 0.55,
        marginBottom: 8,
        textTransform: "uppercase",
      }}
    >
      {children}
    </div>
  );
}

function backBtn(): React.CSSProperties {
  return {
    appearance: "none",
    cursor: "pointer",
    width: 36,
    height: 36,
    borderRadius: 999,
    border: `2.5px solid ${TOKENS.ink}`,
    background: TOKENS.paper,
    fontSize: 14,
    fontWeight: 900,
    boxShadow: `3px 3px 0 ${TOKENS.ink}`,
  };
}
