import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  BrandMark,
  ChunkyButton,
  DotsBg,
  FloatingTickets,
  Frame,
  Icons,
  Stamp,
  Ticket,
  TOKENS,
} from "@/components/new-confetti/shell";

// Slim port — design/new-confetti/project/more.jsx (ReferralScreen, line 430).
// "your friend Jess invited you — first pass on us" pattern.
export const Route = createFileRoute("/new/referral")({
  component: ReferralPage,
});

function ReferralPage() {
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
          padding: "60px 24px 28px",
          overflow: "hidden",
        }}
      >
        <DotsBg opacity={0.06} />
        <FloatingTickets density={5} />

        <div
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <button
            onClick={() => navigate({ to: "/new/signin" })}
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

        <div
          style={{
            position: "relative",
            zIndex: 2,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 16,
            paddingTop: 14,
          }}
        >
          <Stamp color={TOKENS.accent2} rotate={-3} style={{ alignSelf: "flex-start" }}>
            your invite
          </Stamp>

          <Ticket color={TOKENS.paper} notch={false} style={{ padding: 18 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 999,
                  background: TOKENS.accent1,
                  border: `2.5px solid ${TOKENS.ink}`,
                  display: "grid",
                  placeItems: "center",
                  fontFamily: TOKENS.display,
                  fontWeight: 900,
                  fontSize: 18,
                }}
              >
                JS
              </div>
              <div>
                <div
                  style={{
                    fontFamily: TOKENS.mono,
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: ".14em",
                    opacity: 0.55,
                  }}
                >
                  INVITED BY
                </div>
                <div
                  style={{
                    fontFamily: TOKENS.display,
                    fontWeight: 900,
                    fontSize: 18,
                    letterSpacing: "-0.02em",
                  }}
                >
                  Jess from Brooklyn
                </div>
              </div>
            </div>
            <p
              style={{
                fontFamily: TOKENS.ui,
                fontSize: 13,
                fontWeight: 700,
                margin: 0,
                opacity: 0.75,
                lineHeight: 1.4,
              }}
            >
              "I've been using this to plan every Saturday. The pass thing is unreal — try it."
            </p>
          </Ticket>

          <h1
            style={{
              fontFamily: TOKENS.display,
              fontWeight: 900,
              fontSize: 38,
              lineHeight: 0.95,
              letterSpacing: "-0.04em",
              margin: 0,
            }}
          >
            Your first
            <br />
            pass is <span style={{ color: TOKENS.accent1 }}>on us.</span>
          </h1>

          <p
            style={{
              fontFamily: TOKENS.ui,
              fontSize: 14,
              fontWeight: 600,
              opacity: 0.7,
              margin: 0,
              lineHeight: 1.45,
              maxWidth: 320,
            }}
          >
            Sign up with Jess's code and your first 3-stop pass + 500 Confetti points are unlocked.
          </p>

          {/* Reward chips */}
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            {[
              { label: "1 free pass", color: TOKENS.accent2 },
              { label: "+500 pts", color: TOKENS.accent1 },
              { label: "All-Access trial", color: TOKENS.accent3, fg: TOKENS.paper },
            ].map((c) => (
              <span
                key={c.label}
                style={{
                  flex: 1,
                  padding: "10px 8px",
                  textAlign: "center",
                  border: `2.5px solid ${TOKENS.ink}`,
                  borderRadius: 12,
                  background: c.color,
                  color: c.fg ?? TOKENS.ink,
                  fontFamily: TOKENS.ui,
                  fontSize: 11,
                  fontWeight: 900,
                  boxShadow: `3px 3px 0 ${TOKENS.ink}`,
                }}
              >
                {c.label}
              </span>
            ))}
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 2 }}>
          <ChunkyButton
            variant="accent"
            onClick={() => navigate({ to: "/new/signup" })}
            icon={Icons.arrow}
          >
            Claim my invite
          </ChunkyButton>
          <div
            style={{
              marginTop: 10,
              textAlign: "center",
              fontFamily: TOKENS.mono,
              fontSize: 10,
              fontWeight: 700,
              opacity: 0.5,
              letterSpacing: ".1em",
            }}
          >
            Code: JESS-2026 · expires in 7 days
          </div>
        </div>
      </div>
    </Frame>
  );
}
