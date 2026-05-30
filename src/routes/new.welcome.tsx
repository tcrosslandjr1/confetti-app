import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  BrandMark,
  DotsBg,
  FloatingTickets,
  Frame,
  TOKENS,
} from "@/components/new-confetti/shell";

// Ported from Claude Design hub-one-job-PR / screens.jsx WelcomeScreen
// "We plan it. You just show up." — the app's unauthenticated entry point.
export const Route = createFileRoute("/new/welcome")({ component: WelcomePage });

const USE_CASES = [
  {
    id: "date",
    title: "date night",
    sub: "dinner → drinks → vibe",
    example: "fri pass · LES · 3 stops · $$",
    bg: TOKENS.accent1,
    fg: TOKENS.ink,
    emoji: "🌹",
  },
  {
    id: "kids",
    title: "kids party",
    sub: "ages 3-12, the whole shebang",
    example: "mia turns 5 · sat 2pm · 18 rsvps",
    bg: TOKENS.accent2,
    fg: TOKENS.ink,
    emoji: "🎂",
  },
  {
    id: "family",
    title: "family day",
    sub: "park → lunch → library",
    example: "sun · prospect park · all ages",
    bg: TOKENS.paper,
    fg: TOKENS.ink,
    emoji: "🌳",
  },
  {
    id: "multi",
    title: "with other families",
    sub: "group plans, one schedule",
    example: "2 families · BBQ · 6 kids",
    bg: TOKENS.accent3,
    fg: TOKENS.paper,
    emoji: "👨‍👩‍👧‍👦",
  },
] as const;

function WelcomePage() {
  const navigate = useNavigate();

  const onTry = () => navigate({ to: "/new/chat" });
  const onSignUp = () => navigate({ to: "/new/signup" });
  const onSignIn = () => navigate({ to: "/new/signin" });

  return (
    <Frame>
      <div
        style={{
          position: "relative",
          height: "100%",
          overflow: "hidden",
          background: TOKENS.bg,
          display: "flex",
          flexDirection: "column",
          padding: "46px 22px 24px",
        }}
      >
        <DotsBg opacity={0.06} />
        <FloatingTickets density={3} />

        {/* Top bar */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <BrandMark size={18} spin />
          <button
            onClick={onSignIn}
            style={{
              appearance: "none",
              cursor: "pointer",
              padding: "6px 12px",
              background: "transparent",
              border: `2px solid ${TOKENS.ink}`,
              borderRadius: 999,
              fontFamily: TOKENS.mono,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: ".14em",
              color: TOKENS.ink,
            }}
          >
            SIGN IN
          </button>
        </div>

        {/* Scrollable content */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            marginRight: -22,
            paddingRight: 22,
            scrollbarWidth: "none",
          }}
        >
          {/* Hero */}
          <h1
            style={{
              fontFamily: TOKENS.display,
              fontWeight: 900,
              fontSize: 40,
              lineHeight: 0.92,
              letterSpacing: "-0.045em",
              color: TOKENS.ink,
              margin: "8px 0 8px",
            }}
          >
            We plan it.
            <br />
            You <span style={{ color: TOKENS.accent1 }}>just show up.</span>
          </h1>
          <p
            style={{
              fontFamily: TOKENS.ui,
              fontSize: 13.5,
              fontWeight: 600,
              color: TOKENS.ink,
              opacity: 0.7,
              margin: "0 0 16px",
              maxWidth: 340,
              lineHeight: 1.45,
            }}
          >
            Sparkle, our AI, prints a 3-stop pass with venues, timing, route &
            budget. Date night, kids party, family day, or a hangout with other
            families — pick one:
          </p>

          {/* 4 use-case cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              marginBottom: 18,
            }}
          >
            {USE_CASES.map((u) => (
              <button
                key={u.id}
                onClick={onTry}
                style={{
                  appearance: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  padding: "12px 12px",
                  border: `2.5px solid ${TOKENS.ink}`,
                  borderRadius: 14,
                  background: u.bg,
                  color: u.fg,
                  boxShadow: `4px 4px 0 ${TOKENS.ink}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  minHeight: 130,
                }}
              >
                <span style={{ fontSize: 24, lineHeight: 1 }}>{u.emoji}</span>
                <span
                  style={{
                    fontFamily: TOKENS.display,
                    fontWeight: 900,
                    fontSize: 17,
                    letterSpacing: "-0.025em",
                    lineHeight: 1,
                    marginTop: 4,
                  }}
                >
                  {u.title}
                </span>
                <span
                  style={{
                    fontFamily: TOKENS.ui,
                    fontSize: 11,
                    fontWeight: 700,
                    lineHeight: 1.3,
                    opacity: 0.78,
                  }}
                >
                  {u.sub}
                </span>
                <span
                  style={{
                    fontFamily: TOKENS.mono,
                    fontSize: 8.5,
                    fontWeight: 700,
                    letterSpacing: ".1em",
                    opacity: 0.65,
                    marginTop: "auto",
                    textTransform: "uppercase",
                    lineHeight: 1.2,
                  }}
                >
                  ↳ {u.example}
                </span>
              </button>
            ))}
          </div>

          {/* How it works */}
          <div
            style={{
              padding: "10px 12px",
              marginBottom: 14,
              background: "rgba(255,255,255,0.5)",
              border: `1.5px dashed ${TOKENS.ink}`,
              borderRadius: 10,
            }}
          >
            <div
              style={{
                fontFamily: TOKENS.mono,
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: ".14em",
                opacity: 0.6,
                marginBottom: 6,
              }}
            >
              HOW IT WORKS
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 8,
                fontFamily: TOKENS.mono,
                fontSize: 10,
                fontWeight: 700,
                color: TOKENS.ink,
                lineHeight: 1.3,
                letterSpacing: ".04em",
              }}
            >
              <div>01 · tell sparkle a vibe</div>
              <div>02 · she prints a pass</div>
              <div>03 · check in, earn pts</div>
            </div>
          </div>

          {/* Stats row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 8,
              marginBottom: 8,
            }}
          >
            {(
              [
                ["4 min", "to plan a night"],
                ["230k+", "passes this wk"],
                ["12", "cities live"],
              ] as const
            ).map(([n, l]) => (
              <div
                key={l}
                style={{
                  padding: "8px 10px",
                  border: `2px solid ${TOKENS.ink}`,
                  borderRadius: 10,
                  background: TOKENS.paper,
                  boxShadow: `2px 2px 0 ${TOKENS.ink}`,
                }}
              >
                <div
                  style={{
                    fontFamily: TOKENS.display,
                    fontWeight: 900,
                    fontSize: 18,
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                    color: TOKENS.ink,
                  }}
                >
                  {n}
                </div>
                <div
                  style={{
                    fontFamily: TOKENS.mono,
                    fontSize: 8.5,
                    fontWeight: 800,
                    letterSpacing: ".1em",
                    opacity: 0.55,
                    marginTop: 3,
                    textTransform: "uppercase",
                  }}
                >
                  {l}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTAs */}
        <div style={{ position: "relative", zIndex: 2, paddingTop: 12 }}>
          <button
            onClick={onTry}
            style={{
              appearance: "none",
              cursor: "pointer",
              width: "100%",
              padding: "15px 16px",
              marginBottom: 8,
              border: `3px solid ${TOKENS.ink}`,
              borderRadius: 14,
              background: TOKENS.accent1,
              color: TOKENS.ink,
              fontFamily: TOKENS.display,
              fontWeight: 900,
              fontSize: 18,
              letterSpacing: "-0.02em",
              boxShadow: `5px 5px 0 ${TOKENS.ink}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            ✣ try it free — no signup
          </button>
          <button
            onClick={onSignUp}
            style={{
              appearance: "none",
              cursor: "pointer",
              width: "100%",
              padding: "12px 14px",
              border: `2.5px solid ${TOKENS.ink}`,
              borderRadius: 12,
              background: TOKENS.paper,
              color: TOKENS.ink,
              fontFamily: TOKENS.ui,
              fontWeight: 800,
              fontSize: 13,
              boxShadow: `3px 3px 0 ${TOKENS.ink}`,
            }}
          >
            create an account →
          </button>
          <div
            style={{
              marginTop: 10,
              textAlign: "center",
              fontFamily: TOKENS.mono,
              fontSize: 9,
              fontWeight: 700,
              color: TOKENS.ink,
              opacity: 0.4,
              letterSpacing: ".12em",
              textTransform: "uppercase",
            }}
          >
            230,418 passes printed this week
          </div>
        </div>
      </div>
    </Frame>
  );
}
