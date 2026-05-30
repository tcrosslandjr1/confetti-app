import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  BrandMark,
  ChunkyButton,
  DotsBg,
  Frame,
  FloatingTickets,
  Stamp,
  Ticket,
  TOKENS,
} from "@/components/new-confetti/shell";

// Slim port — design/new-confetti/project/more.jsx (AboutScreen, line 574)
export const Route = createFileRoute("/new/about")({
  component: AboutPage,
});

const TENETS = [
  { ico: "🎟️", h: "every night is a ticket", b: "passes, stops, stamps. real, not theoretical." },
  {
    ico: "🤖",
    h: "AI does the boring part",
    b: "we pick. you go. no spreadsheets, no group chats.",
  },
  { ico: "🫂", h: "your crew, your call", b: "co-plan, live-share, split — only when you want." },
  { ico: "🔒", h: "privacy first", b: "we never sell taste data. ever." },
];

function AboutPage() {
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
        <FloatingTickets density={6} />
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

        <Stamp color={TOKENS.accent1} rotate={-3} style={{ alignSelf: "flex-start" }}>
          about confetti
        </Stamp>
        <h1
          style={{
            fontFamily: TOKENS.display,
            fontWeight: 900,
            fontSize: 42,
            lineHeight: 0.92,
            letterSpacing: "-0.04em",
            margin: "10px 0 14px",
            position: "relative",
            zIndex: 2,
          }}
        >
          Confetti
          <br />
          prints
          <br />
          nights.
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
          <Ticket color={TOKENS.accent2} notch={false} style={{ padding: 14, marginBottom: 14 }}>
            <div
              style={{
                fontFamily: TOKENS.ui,
                fontSize: 14,
                fontWeight: 700,
                lineHeight: 1.4,
              }}
            >
              We're a small team in Brooklyn building the night-out app we always wanted: print a
              great night in one tap, walk out the door, remember it forever.
            </div>
          </Ticket>

          {TENETS.map((t) => (
            <div
              key={t.h}
              style={{
                display: "flex",
                gap: 12,
                padding: 12,
                marginBottom: 8,
                border: `2.5px solid ${TOKENS.ink}`,
                borderRadius: 14,
                background: TOKENS.paper,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: TOKENS.accent2,
                  border: `2.5px solid ${TOKENS.ink}`,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 20,
                  flexShrink: 0,
                }}
              >
                {t.ico}
              </div>
              <div>
                <div
                  style={{
                    fontFamily: TOKENS.display,
                    fontWeight: 900,
                    fontSize: 14,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {t.h}
                </div>
                <div
                  style={{
                    fontFamily: TOKENS.ui,
                    fontSize: 12,
                    fontWeight: 700,
                    opacity: 0.65,
                    marginTop: 4,
                    lineHeight: 1.4,
                  }}
                >
                  {t.b}
                </div>
              </div>
            </div>
          ))}
        </div>

        <ChunkyButton variant="accent" onClick={() => navigate({ to: "/new/hub" })}>
          back to printing
        </ChunkyButton>
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
