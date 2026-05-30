import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BrandMark, Frame, Stamp, TOKENS } from "@/components/new-confetti/shell";

// Slim port — design/new-confetti/project/more.jsx (PrivacyScreen, line 734)
export const Route = createFileRoute("/new/privacy")({
  component: PrivacyPage,
});

const SECTIONS: { h: string; rows: { k: string; v: string }[] }[] = [
  {
    h: "what we collect",
    rows: [
      { k: "your name + email", v: "to log you in" },
      { k: "your taste chips", v: "to pick venues" },
      { k: "location (optional)", v: "to suggest near you" },
      { k: "passes you redeem", v: "to remember your night" },
    ],
  },
  {
    h: "what we don't",
    rows: [
      { k: "sell your data", v: "never. ever." },
      { k: "share with advertisers", v: "no ad networks" },
      { k: "read your messages", v: "we can't see chats" },
    ],
  },
  {
    h: "you can",
    rows: [
      { k: "export everything", v: "JSON download" },
      { k: "delete everything", v: "30s, no questions" },
      { k: "pause data sharing", v: "anytime in settings" },
    ],
  },
];

function PrivacyPage() {
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
          <button onClick={() => navigate({ to: "/new/settings" })} style={backBtn()}>
            ←
          </button>
          <BrandMark size={17} />
          <span style={{ width: 36 }} />
        </div>

        <Stamp color={TOKENS.accent2} rotate={-3} style={{ alignSelf: "flex-start" }}>
          plain english
        </Stamp>
        <h1
          style={{
            fontFamily: TOKENS.display,
            fontWeight: 900,
            fontSize: 38,
            lineHeight: 0.92,
            letterSpacing: "-0.04em",
            margin: "10px 0 16px",
          }}
        >
          Privacy.
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
          {SECTIONS.map((s) => (
            <div key={s.h} style={{ marginBottom: 18 }}>
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
                {s.h}
              </div>
              <div
                style={{
                  padding: "4px 14px",
                  border: `2.5px solid ${TOKENS.ink}`,
                  borderRadius: 14,
                  background: TOKENS.paper,
                }}
              >
                {s.rows.map((r, i) => (
                  <div
                    key={r.k}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 0",
                      borderTop: i === 0 ? "none" : `1.5px dashed ${TOKENS.ink}`,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: TOKENS.display,
                        fontWeight: 900,
                        fontSize: 13,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {r.k}
                    </span>
                    <span
                      style={{
                        fontFamily: TOKENS.mono,
                        fontSize: 11,
                        fontWeight: 700,
                        opacity: 0.6,
                        letterSpacing: ".06em",
                      }}
                    >
                      {r.v}
                    </span>
                  </div>
                ))}
              </div>
            </div>
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
