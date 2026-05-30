import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BrandMark, DotsBg, Frame, Stamp, TOKENS } from "@/components/new-confetti/shell";
import { useNewAuth } from "@/hooks/useNewAuth";

// Slim port — design/new-confetti/project/more.jsx (TripsListScreen, line 10)
export const Route = createFileRoute("/new/trips")({
  component: TripsPage,
});

const TRIPS = [
  {
    date: "FRI MAY 30",
    title: "Disco Night · Brooklyn",
    when: "Tonight · 8 PM",
    status: "live",
    color: TOKENS.accent1,
    stops: ["Lupa Notte", "Loft Disco", "Joe's Tavern"],
  },
  {
    date: "SAT JUN 7",
    title: "Date Night · LES",
    when: "Sat · 7 PM",
    status: "upcoming",
    color: TOKENS.accent3,
    stops: ["Cafe Mogador", "Pianos", "Roof Cinema"],
  },
  {
    date: "SAT MAY 16",
    title: "Italian Crawl · Williamsburg",
    when: "2 weeks ago",
    status: "done",
    color: TOKENS.accent2,
    stops: ["Lilia", "Misi", "Lupa Notte"],
  },
];

function TripsPage() {
  const { ready } = useNewAuth();
  const navigate = useNavigate();

  if (!ready) {
    return (
      <Frame>
        <div
          style={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: TOKENS.bg,
            fontFamily: TOKENS.display,
            fontSize: 24,
            fontWeight: 900,
            color: TOKENS.inkMuted,
          }}
        >
          loading...
        </div>
      </Frame>
    );
  }

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
          your passes
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
          Every
          <br />
          night.
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
          {TRIPS.map((t, i) => (
            <button
              key={i}
              onClick={() => navigate({ to: t.status === "live" ? "/new/night" : "/new/pass" })}
              style={{
                appearance: "none",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                padding: 14,
                marginBottom: 10,
                border: `2.5px solid ${TOKENS.ink}`,
                borderRadius: 16,
                background: TOKENS.paper,
                boxShadow: `4px 4px 0 ${TOKENS.ink}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    fontFamily: TOKENS.mono,
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: ".14em",
                    opacity: 0.55,
                  }}
                >
                  {t.date}
                </div>
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 999,
                    border: `2px solid ${TOKENS.ink}`,
                    background:
                      t.status === "live"
                        ? TOKENS.accent1
                        : t.status === "upcoming"
                          ? TOKENS.accent2
                          : TOKENS.bg,
                    fontFamily: TOKENS.mono,
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: ".12em",
                    textTransform: "uppercase",
                    color: t.status === "live" ? TOKENS.paper : TOKENS.ink,
                  }}
                >
                  {t.status}
                </span>
              </div>
              <div
                style={{
                  fontFamily: TOKENS.display,
                  fontWeight: 900,
                  fontSize: 19,
                  letterSpacing: "-0.02em",
                  marginTop: 4,
                }}
              >
                {t.title}
              </div>
              <div
                style={{
                  fontFamily: TOKENS.mono,
                  fontSize: 10,
                  fontWeight: 700,
                  opacity: 0.6,
                  marginTop: 2,
                  letterSpacing: ".06em",
                }}
              >
                {t.when}
              </div>

              {/* stop dots */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 12,
                }}
              >
                {t.stops.map((s, j) => (
                  <div key={j} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        background: t.color,
                        border: `1.5px solid ${TOKENS.ink}`,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: TOKENS.ui,
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {s}
                    </span>
                    {j < t.stops.length - 1 && (
                      <span
                        style={{
                          width: 10,
                          height: 0,
                          borderTop: `1.5px dashed ${TOKENS.ink}`,
                        }}
                      />
                    )}
                  </div>
                ))}
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
