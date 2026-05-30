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

// Slim port — design/new-confetti/project/taste.jsx (TasteProfileScreen, line 42)
export const Route = createFileRoute("/new/taste")({
  component: TastePage,
});

const LOVES = [
  "pasta",
  "negronis",
  "live music",
  "rooftops",
  "tiny bars",
  "small plates",
  "disco",
  "wine",
  "bbq",
  "ramen",
];
const AVOIDS = ["loud", "long lines", "tourist traps", "tasting menus"];
const SOURCES = [
  { name: "Spotify", sub: "we read your playlists", color: TOKENS.accent2 },
  { name: "Instagram", sub: "saves + tagged places", color: TOKENS.accent1 },
  { name: "Google", sub: "ratings you've given", color: TOKENS.accent3 },
  { name: "TikTok", sub: "creators you follow", color: TOKENS.paper },
];

function TastePage() {
  const navigate = useNavigate();
  const [loves, setLoves] = useState<string[]>(["pasta", "negronis", "disco"]);
  const [avoids, setAvoids] = useState<string[]>(["tourist traps"]);
  const [sources, setSources] = useState<Record<string, boolean>>({
    Spotify: true,
    Instagram: true,
  });

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
          <button onClick={() => navigate({ to: "/new/profile" })} style={backBtn()}>
            ←
          </button>
          <BrandMark size={17} />
          <span style={{ width: 36 }} />
        </div>

        <Stamp color={TOKENS.accent2} rotate={-3} style={{ alignSelf: "flex-start" }}>
          your taste
        </Stamp>
        <h1
          style={{
            fontFamily: TOKENS.display,
            fontWeight: 900,
            fontSize: 36,
            lineHeight: 0.92,
            letterSpacing: "-0.04em",
            margin: "10px 0 14px",
            position: "relative",
            zIndex: 2,
          }}
        >
          Teach us
          <br />
          your night.
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
          <Label>you love</Label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {LOVES.map((v) => (
              <Chip
                key={v}
                dense
                selected={loves.includes(v)}
                color={TOKENS.accent2}
                onClick={() => toggle(loves, v, setLoves)}
              >
                {v}
              </Chip>
            ))}
          </div>

          <Label>you skip</Label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {AVOIDS.map((v) => (
              <Chip
                key={v}
                dense
                selected={avoids.includes(v)}
                color={TOKENS.accent1}
                onClick={() => toggle(avoids, v, setAvoids)}
              >
                {v}
              </Chip>
            ))}
          </div>

          <Label>signals we listen to</Label>
          {SOURCES.map((s) => (
            <div
              key={s.name}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                marginBottom: 6,
                border: `2.5px solid ${TOKENS.ink}`,
                borderRadius: 14,
                background: TOKENS.paper,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    background: s.color,
                    border: `1.5px solid ${TOKENS.ink}`,
                  }}
                />
                <div>
                  <div
                    style={{
                      fontFamily: TOKENS.display,
                      fontWeight: 900,
                      fontSize: 13,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {s.name}
                  </div>
                  <div
                    style={{
                      fontFamily: TOKENS.mono,
                      fontSize: 9,
                      fontWeight: 700,
                      opacity: 0.55,
                      marginTop: 2,
                      letterSpacing: ".06em",
                    }}
                  >
                    {s.sub}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSources((p) => ({ ...p, [s.name]: !p[s.name] }))}
                style={{
                  appearance: "none",
                  cursor: "pointer",
                  padding: "4px 10px",
                  borderRadius: 999,
                  border: `2px solid ${TOKENS.ink}`,
                  background: sources[s.name] ? TOKENS.accent2 : TOKENS.bg,
                  fontFamily: TOKENS.mono,
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: ".1em",
                }}
              >
                {sources[s.name] ? "ON" : "OFF"}
              </button>
            </div>
          ))}

          <Ticket color={TOKENS.accent3} notch={false} style={{ padding: 14, marginTop: 14 }}>
            <div style={{ color: TOKENS.paper }}>
              <div
                style={{
                  fontFamily: TOKENS.mono,
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: ".14em",
                  opacity: 0.85,
                }}
              >
                YOUR TASTE READING
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
                Foodie disco-bro with a soft spot for tiny wine bars. We're keeping it real.
              </div>
            </div>
          </Ticket>
        </div>

        <div style={{ marginTop: 12 }}>
          <ChunkyButton
            variant="accent"
            onClick={() => navigate({ to: "/new/profile" })}
            icon={Icons.check}
          >
            save taste
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
