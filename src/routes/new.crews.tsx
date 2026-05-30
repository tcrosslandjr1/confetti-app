import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  BrandMark,
  ChunkyButton,
  DotsBg,
  Frame,
  Icons,
  Stamp,
  Ticket,
  TOKENS,
} from "@/components/new-confetti/shell";

// Slim port — design/new-confetti/project/crews.jsx (CrewsScreen, line 27)
export const Route = createFileRoute("/new/crews")({
  component: CrewsPage,
});

const CREWS = [
  {
    name: "the regulars",
    sub: "5 nights together",
    members: [
      { who: "Jess", c: TOKENS.accent2, me: true },
      { who: "Sara", c: TOKENS.accent1 },
      { who: "Mike", c: TOKENS.accent3 },
      { who: "Ren", c: TOKENS.accent2 },
    ],
    next: "tonight · 8 PM",
  },
  {
    name: "brunch ppl",
    sub: "1 night together",
    members: [
      { who: "Jess", c: TOKENS.accent2, me: true },
      { who: "Maya", c: TOKENS.accent1 },
      { who: "Eli", c: TOKENS.accent3 },
    ],
    next: "sat may 31 · 11 AM",
  },
];

function CrewsPage() {
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
          your crews
        </Stamp>
        <h1
          style={{
            fontFamily: TOKENS.display,
            fontWeight: 900,
            fontSize: 38,
            lineHeight: 0.92,
            letterSpacing: "-0.04em",
            margin: "10px 0 14px",
            position: "relative",
            zIndex: 2,
          }}
        >
          People who
          <br />
          show up.
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
          {CREWS.map((c, i) => (
            <Ticket key={i} color={TOKENS.paper} notch style={{ padding: 14, marginBottom: 12 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                }}
              >
                <div
                  style={{
                    fontFamily: TOKENS.display,
                    fontWeight: 900,
                    fontSize: 19,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {c.name}
                </div>
                <div
                  style={{
                    fontFamily: TOKENS.mono,
                    fontSize: 9,
                    fontWeight: 700,
                    opacity: 0.55,
                    letterSpacing: ".1em",
                  }}
                >
                  {c.sub.toUpperCase()}
                </div>
              </div>

              {/* Avatar stack */}
              <div style={{ display: "flex", marginTop: 10 }}>
                {c.members.map((m, j) => (
                  <div
                    key={m.who}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 999,
                      background: m.c,
                      border: `2.5px solid ${TOKENS.ink}`,
                      display: "grid",
                      placeItems: "center",
                      fontFamily: TOKENS.display,
                      fontWeight: 900,
                      fontSize: 12,
                      marginLeft: j === 0 ? 0 : -8,
                      outline: m.me ? `2px solid ${TOKENS.ink}` : "none",
                    }}
                  >
                    {m.who[0]}
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 12,
                }}
              >
                <div
                  style={{
                    fontFamily: TOKENS.mono,
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: ".12em",
                    color: TOKENS.accent1,
                  }}
                >
                  NEXT · {c.next.toUpperCase()}
                </div>
                <button
                  onClick={() => navigate({ to: "/new/night-together" })}
                  style={{
                    appearance: "none",
                    cursor: "pointer",
                    padding: "5px 12px",
                    borderRadius: 999,
                    border: `2.5px solid ${TOKENS.ink}`,
                    background: TOKENS.accent2,
                    fontFamily: TOKENS.mono,
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: ".1em",
                  }}
                >
                  OPEN →
                </button>
              </div>
            </Ticket>
          ))}

          <div
            style={{
              padding: "14px 16px",
              borderRadius: 14,
              border: `2.5px dashed ${TOKENS.ink}`,
              background: "transparent",
              textAlign: "center",
              fontFamily: TOKENS.display,
              fontWeight: 900,
              fontSize: 14,
              letterSpacing: "-0.01em",
              opacity: 0.55,
              cursor: "pointer",
            }}
          >
            + start a new crew
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <ChunkyButton
            variant="accent"
            onClick={() => navigate({ to: "/new/night-together" })}
            icon={Icons.arrow}
          >
            plan tonight together
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
