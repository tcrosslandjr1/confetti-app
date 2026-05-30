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

// Slim port — design/new-confetti/project/family.jsx (FamilyPassScreen, line 402)
export const Route = createFileRoute("/new/family-pass")({
  component: FamilyPassPage,
});

const STOPS = [
  { t: "10:00 AM", name: "Splash Lagoon", vibe: "easy walks + shade", icon: "🌊" },
  { t: "12:30 PM", name: "Kids' Cantina", vibe: "nuggets + nap-friendly", icon: "🌮" },
  { t: "2:00 PM", name: "Gentle Carousel", vibe: "all ages, no thrills", icon: "🎠" },
];

const PACK = ["sunscreen (SPF 50)", "spare onesie", "snack pouches", "stroller poncho"];

function FamilyPassPage() {
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
          <button onClick={() => navigate({ to: "/new/family-plan" })} style={backBtn()}>
            ←
          </button>
          <BrandMark size={17} />
          <span style={{ width: 36 }} />
        </div>

        <Stamp color={TOKENS.accent2} rotate={-3} style={{ alignSelf: "flex-start" }}>
          family pass
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
          Saturday,
          <br />
          printed.
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
          {STOPS.map((s, i) => (
            <Ticket key={i} color={TOKENS.paper} notch style={{ padding: 14, marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: TOKENS.accent2,
                    border: `2.5px solid ${TOKENS.ink}`,
                    display: "grid",
                    placeItems: "center",
                    fontSize: 22,
                  }}
                >
                  {s.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontFamily: TOKENS.mono,
                      fontSize: 9,
                      fontWeight: 800,
                      letterSpacing: ".14em",
                      opacity: 0.55,
                    }}
                  >
                    STOP {i + 1} · {s.t}
                  </div>
                  <div
                    style={{
                      fontFamily: TOKENS.display,
                      fontWeight: 900,
                      fontSize: 17,
                      letterSpacing: "-0.02em",
                      marginTop: 2,
                    }}
                  >
                    {s.name}
                  </div>
                  <div
                    style={{
                      fontFamily: TOKENS.ui,
                      fontSize: 12,
                      fontWeight: 700,
                      opacity: 0.6,
                      marginTop: 2,
                    }}
                  >
                    {s.vibe}
                  </div>
                </div>
              </div>
            </Ticket>
          ))}

          <div
            style={{
              fontFamily: TOKENS.mono,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: ".16em",
              opacity: 0.55,
              marginTop: 14,
              marginBottom: 8,
            }}
          >
            PACK LIST
          </div>
          <div
            style={{
              padding: 12,
              border: `2.5px solid ${TOKENS.ink}`,
              borderRadius: 14,
              background: TOKENS.paper,
            }}
          >
            {PACK.map((p) => (
              <div
                key={p}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "6px 0",
                  fontFamily: TOKENS.ui,
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                <span
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    border: `2px solid ${TOKENS.ink}`,
                  }}
                />
                {p}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <ChunkyButton variant="ghost" onClick={() => navigate({ to: "/new/trips" })}>
            save
          </ChunkyButton>
          <ChunkyButton
            variant="accent"
            onClick={() => navigate({ to: "/new/night" })}
            icon={Icons.arrow}
          >
            on our way
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
