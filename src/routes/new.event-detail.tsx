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

// Slim port — design/new-confetti/project/more.jsx (EventDetailScreen, line 1052)
export const Route = createFileRoute("/new/event-detail")({
  component: EventDetailPage,
});

const LINEUP = [
  { name: "DJ Saoco", set: "10 — 12" },
  { name: "Honey Dijon", set: "12 — 2" },
  { name: "open b2b", set: "2 — 4" },
];

function EventDetailPage() {
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
          padding: "0 0 22px",
          overflow: "hidden",
        }}
      >
        {/* Hero */}
        <div
          style={{
            position: "relative",
            height: 240,
            background: TOKENS.accent3,
            borderBottom: `3px solid ${TOKENS.ink}`,
            padding: "56px 20px 16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            color: TOKENS.paper,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              onClick={() => navigate({ to: "/new/events" })}
              style={{
                appearance: "none",
                cursor: "pointer",
                width: 36,
                height: 36,
                borderRadius: 999,
                border: `2.5px solid ${TOKENS.ink}`,
                background: TOKENS.paper,
                color: TOKENS.ink,
                fontSize: 14,
                fontWeight: 900,
                boxShadow: `3px 3px 0 ${TOKENS.ink}`,
              }}
            >
              ←
            </button>
            <div style={{ color: TOKENS.paper }}>
              <BrandMark size={17} />
            </div>
            <span style={{ width: 36 }} />
          </div>
          <div>
            <Stamp color={TOKENS.accent2} rotate={-3} style={{ alignSelf: "flex-start" }}>
              fri may 30 · disco
            </Stamp>
            <h1
              style={{
                fontFamily: TOKENS.display,
                fontWeight: 900,
                fontSize: 40,
                lineHeight: 0.92,
                letterSpacing: "-0.04em",
                margin: "10px 0 0",
                color: TOKENS.paper,
                textShadow: "0 2px 0 rgba(0,0,0,0.15)",
              }}
            >
              Loft Disco.
            </h1>
          </div>
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 1,
            flex: 1,
            overflowY: "auto",
            scrollbarWidth: "none",
            padding: "16px 20px 0",
          }}
        >
          <div
            style={{
              fontFamily: TOKENS.mono,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: ".1em",
              opacity: 0.6,
            }}
          >
            📍 89 BOGART · BUSHWICK · 8 PM – 4 AM
          </div>

          {/* Tickets ticket */}
          <Ticket color={TOKENS.accent1} notch={false} style={{ padding: 14, marginTop: 14 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
              }}
            >
              <div
                style={{
                  fontFamily: TOKENS.mono,
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: ".14em",
                  opacity: 0.7,
                }}
              >
                EARLY BIRD
              </div>
              <div
                style={{
                  fontFamily: TOKENS.display,
                  fontWeight: 900,
                  fontSize: 24,
                  letterSpacing: "-0.02em",
                }}
              >
                $22
              </div>
            </div>
            <div
              style={{
                fontFamily: TOKENS.ui,
                fontSize: 12,
                fontWeight: 700,
                marginTop: 4,
                opacity: 0.85,
              }}
            >
              $32 at door · 200 left
            </div>
          </Ticket>

          {/* Lineup */}
          <div
            style={{
              fontFamily: TOKENS.mono,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: ".16em",
              opacity: 0.55,
              marginTop: 18,
              marginBottom: 8,
            }}
          >
            LINEUP
          </div>
          {LINEUP.map((dj) => (
            <div
              key={dj.name}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 12px",
                marginBottom: 6,
                border: `2px solid ${TOKENS.ink}`,
                borderRadius: 12,
                background: TOKENS.paper,
              }}
            >
              <div
                style={{
                  fontFamily: TOKENS.display,
                  fontWeight: 900,
                  fontSize: 15,
                  letterSpacing: "-0.02em",
                }}
              >
                {dj.name}
              </div>
              <div
                style={{
                  fontFamily: TOKENS.mono,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: ".06em",
                  opacity: 0.6,
                }}
              >
                {dj.set}
              </div>
            </div>
          ))}

          {/* Why */}
          <Ticket color={TOKENS.accent2} notch={false} style={{ padding: 14, marginTop: 18 }}>
            <div
              style={{
                fontFamily: TOKENS.mono,
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: ".14em",
                opacity: 0.7,
              }}
            >
              WHY YOU'LL LOVE IT
            </div>
            <div
              style={{
                fontFamily: TOKENS.display,
                fontWeight: 900,
                fontSize: 16,
                letterSpacing: "-0.02em",
                marginTop: 6,
                lineHeight: 1.2,
              }}
            >
              You rated 3 disco nights ★★★★★ this year. Honey Dijon's set is the closer — you'll
              want to be there.
            </div>
          </Ticket>

          <div style={{ height: 14 }} />
        </div>

        <div
          style={{ position: "relative", zIndex: 2, padding: "0 20px", display: "flex", gap: 8 }}
        >
          <ChunkyButton variant="ghost" onClick={() => navigate({ to: "/new/events" })}>
            save
          </ChunkyButton>
          <ChunkyButton
            variant="accent"
            onClick={() => navigate({ to: "/new/pass" })}
            icon={Icons.arrow}
          >
            grab ticket
          </ChunkyButton>
        </div>
      </div>
    </Frame>
  );
}
