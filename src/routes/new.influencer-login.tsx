import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DotsBg, Frame, Stamp, TOKENS } from "@/components/new-confetti/shell";

// Port of InfluencerLoginScreen — design/new-confetti/project/new-screens-2.jsx

export const Route = createFileRoute("/new/influencer-login")({
  component: InfluencerLoginPage,
});

const SSO = [
  { l: "TikTok", bg: TOKENS.ink, fg: TOKENS.paper, e: "♪" },
  { l: "Instagram", bg: TOKENS.accent3, fg: TOKENS.paper, e: "◐" },
  { l: "YouTube", bg: "#FF0000", fg: "#fff", e: "▶" },
  { l: "Email", bg: TOKENS.paper, fg: TOKENS.ink, e: "✉" },
];

function InfluencerLoginPage() {
  const navigate = useNavigate();

  return (
    <Frame>
      <div
        style={{
          position: "relative",
          height: "100dvh",
          background: TOKENS.bg,
          display: "flex",
          flexDirection: "column",
          padding: "56px 22px 24px",
          overflow: "hidden",
        }}
      >
        <DotsBg opacity={0.05} />
        <div style={{ position: "relative", zIndex: 2 }}>
          <button onClick={() => navigate({ to: "/new/influencer" })} style={backBtn}>←</button>
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 2,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 14,
          }}
        >
          <Stamp color={TOKENS.accent1} rotate={-3} style={{ alignSelf: "flex-start" }}>
            creator portal
          </Stamp>
          <h1
            style={{
              fontFamily: TOKENS.display,
              fontWeight: 900,
              fontSize: 38,
              letterSpacing: "-0.045em",
              lineHeight: 0.94,
              margin: 0,
            }}
          >
            Welcome back, creator.
          </h1>
          <p
            style={{
              fontFamily: TOKENS.ui,
              fontSize: 13,
              fontWeight: 700,
              color: TOKENS.inkMuted,
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            Sign in with the social account you used to apply.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
            {SSO.map((s) => (
              <button
                key={s.l}
                onClick={() => navigate({ to: "/new/influencer-dashboard" })}
                style={{
                  appearance: "none",
                  cursor: "pointer",
                  padding: "14px 12px",
                  border: `2.5px solid ${TOKENS.ink}`,
                  borderRadius: 12,
                  background: s.bg,
                  color: s.fg,
                  fontFamily: TOKENS.display,
                  fontWeight: 900,
                  fontSize: 14,
                  letterSpacing: "-0.02em",
                  boxShadow: `3px 3px 0 ${TOKENS.ink}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <span style={{ fontSize: 16 }}>{s.e}</span>
                {s.l}
              </button>
            ))}
          </div>

          <button
            style={{
              appearance: "none",
              cursor: "pointer",
              marginTop: 8,
              padding: "10px 14px",
              border: `2px dashed ${TOKENS.ink}`,
              borderRadius: 10,
              background: "transparent",
              color: TOKENS.ink,
              fontFamily: TOKENS.mono,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: ".06em",
              opacity: 0.7,
            }}
          >
            haven't applied yet? request an invite →
          </button>
        </div>
      </div>
    </Frame>
  );
}

const backBtn: React.CSSProperties = {
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
