import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  BrandMark,
  ChunkyButton,
  Frame,
  Icons,
  Stamp,
  Ticket,
  TOKENS,
} from "@/components/new-confetti/shell";

// Slim port — design/new-confetti/project/more.jsx (ForBusinessScreen, line 1375)
export const Route = createFileRoute("/new/for-business")({
  component: ForBusinessPage,
});

const STATS = [
  { v: "+34%", l: "avg cover increase" },
  { v: "12 min", l: "median dwell-time bump" },
  { v: "1.7×", l: "repeat visit rate" },
  { v: "0", l: "ad spend required" },
];

const WHATYOUGET = [
  { ico: "🎟️", h: "we route ready-to-spend nights to your door" },
  { ico: "📊", h: "live dashboard: who's coming, when, why" },
  { ico: "📣", h: "no ads · we get paid when guests show up" },
  { ico: "🤝", h: "you set the perks: drink, dessert, table" },
];

function ForBusinessPage() {
  const navigate = useNavigate();
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
        <div
          style={{
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
          for venues
        </Stamp>
        <h1
          style={{
            fontFamily: TOKENS.display,
            fontWeight: 900,
            fontSize: 36,
            lineHeight: 0.92,
            letterSpacing: "-0.04em",
            margin: "10px 0 14px",
          }}
        >
          Fill seats.
          <br />
          Skip the ads.
        </h1>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            scrollbarWidth: "none",
            marginRight: -20,
            paddingRight: 20,
          }}
        >
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}
          >
            {STATS.map((s) => (
              <div
                key={s.l}
                style={{
                  padding: 12,
                  textAlign: "center",
                  border: `2.5px solid ${TOKENS.ink}`,
                  borderRadius: 14,
                  background: TOKENS.accent1,
                  color: TOKENS.paper,
                  boxShadow: `3px 3px 0 ${TOKENS.ink}`,
                }}
              >
                <div
                  style={{
                    fontFamily: TOKENS.display,
                    fontWeight: 900,
                    fontSize: 26,
                    letterSpacing: "-0.04em",
                  }}
                >
                  {s.v}
                </div>
                <div
                  style={{
                    fontFamily: TOKENS.mono,
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: ".12em",
                    opacity: 0.9,
                    marginTop: 2,
                    textTransform: "uppercase",
                  }}
                >
                  {s.l}
                </div>
              </div>
            ))}
          </div>

          <Ticket color={TOKENS.paper} notch style={{ padding: 14, marginBottom: 12 }}>
            {WHATYOUGET.map((w, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "8px 0",
                  borderTop: i === 0 ? "none" : `1.5px dashed ${TOKENS.ink}`,
                }}
              >
                <span style={{ fontSize: 18 }}>{w.ico}</span>
                <span
                  style={{
                    fontFamily: TOKENS.ui,
                    fontSize: 13,
                    fontWeight: 700,
                    lineHeight: 1.4,
                  }}
                >
                  {w.h}
                </span>
              </div>
            ))}
          </Ticket>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <ChunkyButton variant="ghost" onClick={() => navigate({ to: "/new/hub" })}>
            see demo
          </ChunkyButton>
          <ChunkyButton
            variant="accent"
            onClick={() => navigate({ to: "/new/signup" })}
            icon={Icons.arrow}
          >
            list your venue
          </ChunkyButton>
        </div>
      </div>
    </Frame>
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
