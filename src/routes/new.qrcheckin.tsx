import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BrandMark, ChunkyButton, Icons, Stamp, TOKENS } from "@/components/new-confetti/shell";

// Slim port — design/new-confetti/project/more.jsx (QRCheckInScreen, line 155)
export const Route = createFileRoute("/new/qrcheckin")({
  component: QRCheckInPage,
});

function QRCheckInPage() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        background: "#0a0a0a",
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
          background: TOKENS.ink,
          boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
          color: TOKENS.paper,
          padding: 24,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
          }}
        >
          <button
            onClick={() => navigate({ to: "/new/night" })}
            style={{
              appearance: "none",
              cursor: "pointer",
              width: 36,
              height: 36,
              borderRadius: 999,
              border: `2px solid ${TOKENS.paper}`,
              background: "rgba(0,0,0,0.4)",
              color: TOKENS.paper,
              fontSize: 14,
              fontWeight: 900,
              backdropFilter: "blur(8px)",
            }}
          >
            ←
          </button>
          <div style={{ color: TOKENS.paper }}>
            <BrandMark size={17} />
          </div>
          <span style={{ width: 36 }} />
        </div>

        <Stamp color={TOKENS.accent1} rotate={-3} style={{ alignSelf: "flex-start" }}>
          scan to check in
        </Stamp>

        {/* Big text */}
        <h1
          style={{
            fontFamily: TOKENS.display,
            fontWeight: 900,
            fontSize: 36,
            lineHeight: 0.92,
            letterSpacing: "-0.04em",
            margin: "10px 0 4px",
          }}
        >
          Point your
          <br />
          camera here.
        </h1>
        <p
          style={{
            fontFamily: TOKENS.ui,
            fontSize: 13,
            fontWeight: 700,
            opacity: 0.7,
            margin: 0,
          }}
        >
          Door staff or Confetti Cam frames this code.
        </p>

        {/* Viewfinder */}
        <div
          style={{
            flex: 1,
            display: "grid",
            placeItems: "center",
            margin: "20px 0",
          }}
        >
          <div
            style={{
              position: "relative",
              width: 240,
              height: 240,
              border: `3px solid ${TOKENS.paper}`,
              borderRadius: 24,
              background: TOKENS.paper,
              display: "grid",
              placeItems: "center",
              overflow: "hidden",
            }}
          >
            {/* fake QR mosaic */}
            <svg
              width="200"
              height="200"
              viewBox="0 0 20 20"
              style={{ imageRendering: "pixelated" }}
            >
              {Array.from({ length: 20 * 20 }).map((_, k) => {
                const x = k % 20,
                  y = Math.floor(k / 20);
                const corner = (x < 3 && y < 3) || (x > 16 && y < 3) || (x < 3 && y > 16);
                const fill = corner ? 1 : Math.random() > 0.55 ? 1 : 0;
                return fill ? (
                  <rect key={k} x={x} y={y} width="1" height="1" fill={TOKENS.ink} />
                ) : null;
              })}
            </svg>
            {/* corner brackets */}
            {(
              [
                ["tl", { top: -3, left: -3, borderTop: 4, borderLeft: 4 }],
                ["tr", { top: -3, right: -3, borderTop: 4, borderRight: 4 }],
                ["bl", { bottom: -3, left: -3, borderBottom: 4, borderLeft: 4 }],
                ["br", { bottom: -3, right: -3, borderBottom: 4, borderRight: 4 }],
              ] as const
            ).map(([k, s]) => (
              <span
                key={k}
                style={{
                  position: "absolute",
                  width: 32,
                  height: 32,
                  borderColor: TOKENS.accent1,
                  borderStyle: "solid",
                  borderWidth: 0,
                  ...(Object.fromEntries(
                    Object.entries(s).map(([kk, vv]) =>
                      typeof vv === "number" && kk.startsWith("border")
                        ? [kk + "Width", vv + "px"]
                        : [kk, vv],
                    ),
                  ) as React.CSSProperties),
                }}
              />
            ))}
          </div>
        </div>

        {/* Pass meta */}
        <div
          style={{
            padding: 12,
            borderRadius: 14,
            background: "rgba(255,255,255,0.08)",
            border: `2px solid rgba(255,255,255,0.2)`,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              fontFamily: TOKENS.mono,
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: ".14em",
              opacity: 0.6,
            }}
          >
            STOP 1 OF 3
          </div>
          <div
            style={{
              fontFamily: TOKENS.display,
              fontWeight: 900,
              fontSize: 18,
              letterSpacing: "-0.02em",
              marginTop: 2,
            }}
          >
            Lupa Notte · 8:00 PM
          </div>
        </div>

        <ChunkyButton
          variant="accent"
          onClick={() => navigate({ to: "/new/night" })}
          icon={Icons.check}
        >
          checked in
        </ChunkyButton>
      </div>
    </div>
  );
}
