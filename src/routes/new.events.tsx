import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BrandMark, DotsBg, Frame, Stamp, TOKENS } from "@/components/new-confetti/shell";

// Slim port — design/new-confetti/project/more.jsx (EventsListScreen, line 906)
export const Route = createFileRoute("/new/events")({
  component: EventsPage,
});

const EVENTS = [
  {
    date: "FRI MAY 30",
    time: "8:00 PM",
    title: "Loft Disco · Brooklyn Warehouse",
    tag: "music",
    color: TOKENS.accent3,
    fg: TOKENS.paper,
    price: "$22",
  },
  {
    date: "SAT MAY 31",
    time: "11:00 AM",
    title: "Morning Market · McCarren Park",
    tag: "outdoor",
    color: TOKENS.accent2,
    price: "free",
  },
  {
    date: "SAT MAY 31",
    time: "9:00 PM",
    title: "Roof Cinema · Sunset Park",
    tag: "film",
    color: TOKENS.accent1,
    price: "$15",
  },
  {
    date: "SUN JUN 01",
    time: "7:30 PM",
    title: "Comedy Basement · LES",
    tag: "comedy",
    color: TOKENS.paper,
    price: "$18",
  },
  {
    date: "TUE JUN 03",
    time: "8:00 PM",
    title: "Jazz Night · Joe's Tavern",
    tag: "live",
    color: TOKENS.accent2,
    price: "no cover",
  },
];

function EventsPage() {
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
          padding: "56px 20px 20px",
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

        <div style={{ position: "relative", zIndex: 2 }}>
          <Stamp
            color={TOKENS.accent2}
            rotate={-3}
            style={{ alignSelf: "flex-start", marginBottom: 10 }}
          >
            this week
          </Stamp>
          <h2
            style={{
              fontFamily: TOKENS.display,
              fontWeight: 900,
              fontSize: 36,
              lineHeight: 0.95,
              letterSpacing: "-0.04em",
              margin: "0 0 12px",
            }}
          >
            What's
            <br />
            happening.
          </h2>
        </div>

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
          {EVENTS.map((e, i) => (
            <button
              key={i}
              onClick={() => navigate({ to: "/new/event-detail" })}
              style={{
                appearance: "none",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                display: "flex",
                gap: 12,
                padding: 12,
                marginBottom: 10,
                border: `2.5px solid ${TOKENS.ink}`,
                borderRadius: 14,
                background: TOKENS.paper,
                boxShadow: `4px 4px 0 ${TOKENS.ink}`,
              }}
            >
              <div
                style={{
                  width: 64,
                  padding: "8px 6px",
                  border: `2.5px solid ${TOKENS.ink}`,
                  borderRadius: 10,
                  background: e.color,
                  color: e.fg ?? TOKENS.ink,
                  display: "grid",
                  placeItems: "center",
                  fontFamily: TOKENS.display,
                  fontWeight: 900,
                  fontSize: 10,
                  letterSpacing: ".06em",
                  textAlign: "center",
                  lineHeight: 1.1,
                }}
              >
                {e.date.split(" ").join("\n")}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontFamily: TOKENS.mono,
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: ".12em",
                    opacity: 0.55,
                  }}
                >
                  {e.time} · {e.tag.toUpperCase()}
                </div>
                <div
                  style={{
                    fontFamily: TOKENS.display,
                    fontWeight: 900,
                    fontSize: 15,
                    letterSpacing: "-0.02em",
                    marginTop: 2,
                    lineHeight: 1.15,
                  }}
                >
                  {e.title}
                </div>
                <div
                  style={{
                    fontFamily: TOKENS.mono,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: ".06em",
                    marginTop: 4,
                  }}
                >
                  {e.price}
                </div>
              </div>
            </button>
          ))}
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
