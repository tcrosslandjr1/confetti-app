// New Confetti Welcome screen — ported 1:1 from the design handoff at
// new-confetti/project/screens.jsx (WelcomeScreen) + helpers from
// components.jsx. Inline styles match the prototype pixel-for-pixel
// (warm palette: cream paper bg, ink, coral, yellow, purple).
//
// Mounted as /welcome — does NOT replace the existing landing yet so
// nothing else breaks. Swap once you're happy with the look.

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, type CSSProperties, type ReactNode } from "react";

export const Route = createFileRoute("/welcome")({
  component: WelcomePage,
});

const TOKENS = {
  bg: "#f8f0dd",
  paper: "#fffaf0",
  ink: "#130b0d",
  accent1: "#ff5b3d", // coral
  accent2: "#f7c83b", // yellow
  accent3: "#5b45d9", // purple
  accent4: "#2bb673", // green
  display: "'Bricolage Grotesque', 'Inter', system-ui, sans-serif",
  ui: "'Inter', system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
};

function WelcomePage() {
  const navigate = useNavigate();
  const onStart = () => navigate({ to: "/app" });

  // Wash the page in the warm palette while this route is mounted.
  useEffect(() => {
    const prevBg = document.body.style.background;
    const prevColor = document.body.style.color;
    document.body.style.background = "#2b1410";
    document.body.style.color = TOKENS.ink;
    return () => {
      document.body.style.background = prevBg;
      document.body.style.color = prevColor;
    };
  }, []);

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        background: "#2b1410",
        padding: 24,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "min(420px, 100%)",
          height: "min(874px, calc(100dvh - 48px))",
          overflow: "hidden",
          borderRadius: 28,
          background: TOKENS.bg,
          color: TOKENS.ink,
          boxShadow: "0 24px 60px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.05)",
          fontFamily: TOKENS.ui,
        }}
      >
        <WelcomeScreen onStart={onStart} />
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/*  Welcome screen — verbatim from screens.jsx (WelcomeScreen function)   */
/* ────────────────────────────────────────────────────────────────────── */

function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div
      className="cf-screen"
      style={{
        position: "relative",
        height: "100%",
        overflow: "hidden",
        background: TOKENS.bg,
        display: "flex",
        flexDirection: "column",
        padding: "70px 24px 36px",
      }}
    >
      <DotsBg />
      <FloatingTickets density={5} />

      <div style={{ position: "relative", zIndex: 2 }}>
        <BrandMark size={20} spin />
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 2,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 18,
        }}
      >
        {/* Sample peeking pass */}
        <div
          style={{
            position: "absolute",
            top: 6,
            right: -30,
            transform: "rotate(-8deg)",
            opacity: 0.95,
            width: 180,
          }}
        >
          <Ticket color={TOKENS.accent2} style={{ padding: 12, boxShadow: `5px 5px 0 ${TOKENS.ink}` }}>
            <div
              style={{
                fontFamily: TOKENS.mono,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: ".14em",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>FRI PASS</span>
              <span>#J3M1</span>
            </div>
            <div style={{ marginTop: 10 }}>
              <RouteDots progress={1} size={14} />
            </div>
            <div
              style={{
                fontFamily: TOKENS.mono,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: ".14em",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>BUSHWICK</span>
              <span>5H</span>
            </div>
          </Ticket>
        </div>
        <div
          style={{
            position: "absolute",
            top: 0,
            right: -50,
            transform: "rotate(-8deg)",
            opacity: 0.95,
            width: 156,
            zIndex: 1,
            pointerEvents: "none",
          }}
        >
          <Ticket color={TOKENS.accent2} style={{ padding: 10, boxShadow: `5px 5px 0 ${TOKENS.ink}` }}>
            <div
              style={{
                fontFamily: TOKENS.mono,
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: ".14em",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>FRI PASS</span>
              <span>#J3M1</span>
            </div>
            <div style={{ marginTop: 8 }}>
              <RouteDots progress={1} size={12} />
            </div>
            <div
              style={{
                fontFamily: TOKENS.mono,
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: ".14em",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>BUSHWICK</span>
              <span>5H</span>
            </div>
          </Ticket>
        </div>

        <h1
          style={{
            position: "relative",
            zIndex: 2,
            fontFamily: TOKENS.display,
            fontWeight: 900,
            fontSize: 48,
            lineHeight: 0.92,
            letterSpacing: "-0.045em",
            color: TOKENS.ink,
            margin: "120px 0 0",
            textWrap: "balance",
          }}
        >
          Plan a <span style={{ color: TOKENS.accent1 }}>night.</span>
          <br />
          Or a day.
          <br />
          Or whatever.
        </h1>
        <p
          style={{
            position: "relative",
            zIndex: 2,
            fontFamily: TOKENS.ui,
            fontSize: 14,
            fontWeight: 500,
            color: TOKENS.ink,
            opacity: 0.7,
            margin: "12px 0 0",
            maxWidth: 320,
            lineHeight: 1.45,
          }}
        >
          Tell us a vibe — date night, family Saturday, BBQ, recharge day. We build a 3-stop pass with venues, timing, route, and budget. Ready in 4 minutes.
        </p>

        {/* Plan-type chip row */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            marginTop: 14,
            display: "flex",
            gap: 6,
            overflowX: "auto",
            scrollbarWidth: "none",
            marginRight: -24,
            paddingRight: 24,
          }}
        >
          {[
            { l: "🌹 date night", c: TOKENS.accent1, fg: TOKENS.ink },
            { l: "🌳 family day", c: TOKENS.accent2, fg: TOKENS.ink },
            { l: "🔥 cookout", c: TOKENS.paper, fg: TOKENS.ink },
            { l: "🎂 kids party", c: TOKENS.accent2, fg: TOKENS.ink },
            { l: "🗽 tourist", c: TOKENS.paper, fg: TOKENS.ink },
            { l: "🌿 recharge", c: TOKENS.accent3, fg: TOKENS.paper },
          ].map((c, i) => (
            <span
              key={i}
              style={{
                flexShrink: 0,
                padding: "6px 12px",
                border: `2px solid ${TOKENS.ink}`,
                borderRadius: 999,
                background: c.c,
                color: c.fg,
                fontFamily: TOKENS.ui,
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {c.l}
            </span>
          ))}
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 2,
            marginTop: 14,
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
          }}
        >
          {[
            ["4 min", "to plan a night"],
            ["3 stops", "every pass"],
            ["12", "cities live"],
          ].map(([n, l]) => (
            <div
              key={l}
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
                  fontFamily: TOKENS.display,
                  fontWeight: 900,
                  fontSize: 22,
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
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: ".12em",
                  opacity: 0.55,
                  marginTop: 4,
                  textTransform: "uppercase",
                }}
              >
                {l}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: "relative", zIndex: 2 }}>
        <ChunkyButton onClick={onStart} icon="arrow">
          Plan something
        </ChunkyButton>
        <div
          style={{
            marginTop: 12,
            textAlign: "center",
            fontFamily: TOKENS.ui,
            fontSize: 13,
            fontWeight: 600,
            color: TOKENS.ink,
          }}
        >
          already in?
          <button
            onClick={onStart}
            style={{
              appearance: "none",
              cursor: "pointer",
              background: "transparent",
              border: "none",
              padding: "0 0 0 6px",
              fontFamily: "inherit",
              fontSize: "inherit",
              fontWeight: 900,
              color: TOKENS.accent1,
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            sign in
          </button>
        </div>
        <div
          style={{
            marginTop: 10,
            textAlign: "center",
            fontFamily: TOKENS.ui,
            fontSize: 11,
            fontWeight: 600,
            color: TOKENS.ink,
            opacity: 0.5,
            letterSpacing: ".02em",
          }}
        >
          230,418 passes printed this week · 12 cities live
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/*  Helper components — derived from components.jsx + index.html keyframes */
/* ────────────────────────────────────────────────────────────────────── */

/** Faint dot-grid background — every Welcome backdrop has this. */
function DotsBg() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `radial-gradient(${TOKENS.ink} 1px, transparent 1px)`,
        backgroundSize: "22px 22px",
        opacity: 0.08,
        pointerEvents: "none",
      }}
    />
  );
}

/** A handful of floating ticket-stub blocks for ambient brand texture. */
function FloatingTickets({ density = 5 }: { density?: number }) {
  const dots = [
    { top: "18%", left: "14%", bg: TOKENS.accent1, delay: "0s" },
    { top: "25%", right: "18%", bg: TOKENS.accent2, delay: ".4s" },
    { bottom: "22%", left: "22%", bg: TOKENS.accent3, delay: ".8s" },
    { bottom: "18%", right: "24%", bg: TOKENS.accent1, delay: "1.2s" },
    { top: "54%", left: "8%", bg: TOKENS.accent2, delay: "1.6s" },
  ].slice(0, density);
  return (
    <>
      <style>{`@keyframes cfFloat{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-18px) rotate(12deg)}}`}</style>
      {dots.map((d, i) => (
        <span
          key={i}
          aria-hidden
          style={{
            position: "absolute",
            width: 12,
            height: 22,
            border: `2px solid ${TOKENS.ink}`,
            borderRadius: 3,
            animation: `cfFloat 4s ${d.delay} infinite ease-in-out`,
            top: d.top,
            left: d.left,
            right: d.right,
            bottom: d.bottom,
            background: d.bg,
            zIndex: 0,
          }}
        />
      ))}
    </>
  );
}

/** Spinning ✣ + "confetti." wordmark in the corner. */
function BrandMark({ size = 20, spin = false }: { size?: number; spin?: boolean }) {
  return (
    <>
      <style>{`@keyframes cfSpin{to{transform:rotate(360deg)}}`}</style>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          fontSize: size + 4,
          fontWeight: 900,
          fontFamily: TOKENS.display,
          letterSpacing: "-0.02em",
          color: TOKENS.ink,
        }}
      >
        <span
          style={{
            color: TOKENS.accent1,
            fontSize: size,
            display: "inline-block",
            animation: spin ? "cfSpin 2.5s linear infinite" : undefined,
          }}
        >
          ✣
        </span>
        <span>
          confetti<span style={{ color: TOKENS.accent1 }}>.</span>
        </span>
      </div>
    </>
  );
}

/** Ticket card with chunky border + offset shadow. */
function Ticket({
  color,
  children,
  style,
}: {
  color: string;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        background: color,
        border: `3px solid ${TOKENS.ink}`,
        borderRadius: 16,
        boxShadow: `4px 4px 0 ${TOKENS.ink}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Three-dot route line with a connecting bar — the brand's signature. */
function RouteDots({ progress = 1, size = 14 }: { progress?: number; size?: number }) {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        height: size,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "50%",
          left: size / 2,
          right: size / 2,
          height: 2,
          background: TOKENS.ink,
          transform: `translateY(-50%) scaleX(${progress})`,
          transformOrigin: "left center",
        }}
      />
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            position: "relative",
            zIndex: 1,
            width: size,
            height: size,
            borderRadius: "50%",
            border: `2px solid ${TOKENS.ink}`,
            background: i === 0 ? TOKENS.accent1 : i === 1 ? TOKENS.accent2 : TOKENS.accent3,
          }}
        />
      ))}
    </div>
  );
}

/** Chunky CTA — coral fill, ink border, offset shadow. */
function ChunkyButton({
  children,
  onClick,
  icon,
}: {
  children: ReactNode;
  onClick: () => void;
  icon?: "arrow";
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        appearance: "none",
        cursor: "pointer",
        padding: "16px 20px",
        background: TOKENS.accent1,
        color: TOKENS.paper,
        border: `3px solid ${TOKENS.ink}`,
        borderRadius: 16,
        boxShadow: `5px 5px 0 ${TOKENS.ink}`,
        fontFamily: TOKENS.display,
        fontWeight: 900,
        fontSize: 20,
        letterSpacing: "-0.01em",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        transition: "transform 0.08s ease, box-shadow 0.08s ease",
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = "translate(3px,3px)";
        e.currentTarget.style.boxShadow = `2px 2px 0 ${TOKENS.ink}`;
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = `5px 5px 0 ${TOKENS.ink}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = `5px 5px 0 ${TOKENS.ink}`;
      }}
    >
      <span>{children}</span>
      {icon === "arrow" && (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      )}
    </button>
  );
}
