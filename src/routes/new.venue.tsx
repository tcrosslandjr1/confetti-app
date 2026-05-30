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

// Slim port — design/new-confetti/project/discover.jsx (VenueDetailScreen, line 603)
export const Route = createFileRoute("/new/venue")({
  component: VenuePage,
});

const STATS = [
  { l: "vibe", v: "intimate · loud · romantic" },
  { l: "price", v: "$$" },
  { l: "best for", v: "date night · pasta" },
  { l: "open until", v: "11 PM tonight" },
];

const REVIEWS = [
  { who: "Maya", body: "the cacio e pepe is unreal. sit at the bar." },
  { who: "Tyler", body: "house red was perfect, bartender knew the answer to every question." },
];

function VenuePage() {
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
            height: 220,
            background: TOKENS.accent1,
            borderBottom: `3px solid ${TOKENS.ink}`,
            padding: "56px 20px 16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              onClick={() => navigate({ to: "/new/explore" })}
              style={{
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
              }}
            >
              ←
            </button>
            <BrandMark size={17} />
            <span style={{ width: 36 }} />
          </div>
          <Stamp color={TOKENS.paper} rotate={-3} style={{ alignSelf: "flex-start" }}>
            italian · wine bar
          </Stamp>
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
          <h1
            style={{
              fontFamily: TOKENS.display,
              fontWeight: 900,
              fontSize: 42,
              lineHeight: 0.92,
              letterSpacing: "-0.04em",
              margin: "0 0 4px",
            }}
          >
            Lupa Notte
          </h1>
          <div
            style={{
              fontFamily: TOKENS.mono,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: ".1em",
              opacity: 0.6,
            }}
          >
            📍 88 N 6th St · Williamsburg
          </div>

          {/* Stats grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              marginTop: 18,
            }}
          >
            {STATS.map((s) => (
              <div
                key={s.l}
                style={{
                  padding: "10px 12px",
                  border: `2.5px solid ${TOKENS.ink}`,
                  borderRadius: 12,
                  background: TOKENS.paper,
                  boxShadow: `3px 3px 0 ${TOKENS.ink}`,
                }}
              >
                <div
                  style={{
                    fontFamily: TOKENS.mono,
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: ".14em",
                    opacity: 0.55,
                    textTransform: "uppercase",
                  }}
                >
                  {s.l}
                </div>
                <div
                  style={{
                    fontFamily: TOKENS.ui,
                    fontSize: 13,
                    fontWeight: 800,
                    marginTop: 3,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {s.v}
                </div>
              </div>
            ))}
          </div>

          {/* Why we'd send you ticket */}
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
              WHY WE'D SEND YOU HERE
            </div>
            <div
              style={{
                fontFamily: TOKENS.display,
                fontWeight: 900,
                fontSize: 17,
                letterSpacing: "-0.02em",
                marginTop: 6,
                lineHeight: 1.15,
              }}
            >
              You love foodie + walkable. This is the heart of Williamsburg, 2 mins from your last 3
              cocktail stops.
            </div>
          </Ticket>

          {/* Reviews */}
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
            WHAT REAL PEOPLE SAID
          </div>
          {REVIEWS.map((r) => (
            <div
              key={r.who}
              style={{
                border: `2px solid ${TOKENS.ink}`,
                borderRadius: 12,
                background: TOKENS.paper,
                padding: 12,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  fontFamily: TOKENS.ui,
                  fontSize: 13,
                  fontWeight: 700,
                  lineHeight: 1.4,
                }}
              >
                "{r.body}"
              </div>
              <div
                style={{
                  fontFamily: TOKENS.mono,
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: ".14em",
                  opacity: 0.55,
                  marginTop: 6,
                }}
              >
                — {r.who.toUpperCase()}
              </div>
            </div>
          ))}

          <div style={{ height: 14 }} />
        </div>

        <div
          style={{ position: "relative", zIndex: 2, padding: "0 20px", display: "flex", gap: 8 }}
        >
          <ChunkyButton variant="ghost" onClick={() => navigate({ to: "/new/explore" })}>
            save
          </ChunkyButton>
          <ChunkyButton
            variant="accent"
            onClick={() => navigate({ to: "/new/pass" })}
            icon={Icons.arrow}
          >
            add to pass
          </ChunkyButton>
        </div>
      </div>
    </Frame>
  );
}
