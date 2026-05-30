import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { TOKENS } from "@/components/new-confetti/shell";

// Slim port — design/new-confetti/project/confetti-cam.jsx (ConfettiCamScreen, line 6)
export const Route = createFileRoute("/new/confetti-cam")({
  component: ConfettiCamPage,
});

const FILTERS = ["raw", "noir", "saturate", "bloom", "ticket"];

function ConfettiCamPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("ticket");

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
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            right: 16,
            zIndex: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <button
            onClick={() => navigate({ to: "/new/night" })}
            style={{
              appearance: "none",
              cursor: "pointer",
              padding: "6px 12px",
              borderRadius: 999,
              border: `2px solid ${TOKENS.paper}`,
              background: "rgba(0,0,0,0.4)",
              color: TOKENS.paper,
              fontFamily: TOKENS.mono,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: ".1em",
              backdropFilter: "blur(8px)",
            }}
          >
            ← close
          </button>
          <span
            style={{
              padding: "5px 10px",
              borderRadius: 999,
              border: `2px solid ${TOKENS.accent1}`,
              background: "rgba(0,0,0,0.5)",
              fontFamily: TOKENS.mono,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: ".14em",
              color: TOKENS.paper,
            }}
          >
            ● CAM
          </span>
          <span style={{ width: 80 }} />
        </div>

        {/* Viewfinder */}
        <div
          style={{
            flex: 1,
            position: "relative",
            overflow: "hidden",
            background:
              filter === "noir"
                ? `linear-gradient(180deg, #555, #111)`
                : filter === "saturate"
                  ? `linear-gradient(135deg, ${TOKENS.accent1}, ${TOKENS.accent3})`
                  : filter === "bloom"
                    ? `radial-gradient(circle at 50% 40%, ${TOKENS.accent2}66, #1a0e10)`
                    : filter === "ticket"
                      ? `linear-gradient(180deg, ${TOKENS.accent1} 0%, ${TOKENS.accent3} 100%)`
                      : `linear-gradient(180deg, #2b1410, #0a0a0a)`,
          }}
        >
          {/* fake "scene" */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              fontFamily: TOKENS.display,
              fontWeight: 900,
              fontSize: 80,
              opacity: 0.15,
            }}
          >
            📷
          </div>

          {/* Ticket overlay for ticket filter */}
          {filter === "ticket" && (
            <div
              style={{
                position: "absolute",
                left: 20,
                right: 20,
                bottom: 120,
                padding: 14,
                border: `3px solid ${TOKENS.ink}`,
                borderRadius: 18,
                background: TOKENS.paper,
                color: TOKENS.ink,
                boxShadow: `6px 6px 0 ${TOKENS.ink}`,
                transform: "rotate(-2deg)",
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
                LUPA NOTTE · FRI MAY 30
              </div>
              <div
                style={{
                  fontFamily: TOKENS.display,
                  fontWeight: 900,
                  fontSize: 18,
                  letterSpacing: "-0.02em",
                  marginTop: 4,
                }}
              >
                night stamp
              </div>
            </div>
          )}
        </div>

        {/* Filter rail */}
        <div
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            bottom: 100,
            zIndex: 3,
            display: "flex",
            gap: 6,
            justifyContent: "center",
          }}
        >
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                appearance: "none",
                cursor: "pointer",
                padding: "5px 12px",
                borderRadius: 999,
                border: `2px solid ${TOKENS.paper}`,
                background: filter === f ? TOKENS.paper : "rgba(0,0,0,0.4)",
                color: filter === f ? TOKENS.ink : TOKENS.paper,
                fontFamily: TOKENS.mono,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: ".1em",
                backdropFilter: "blur(6px)",
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Shutter */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 24,
            zIndex: 3,
            display: "grid",
            placeItems: "center",
          }}
        >
          <button
            onClick={() => navigate({ to: "/new/finished" })}
            aria-label="shoot"
            style={{
              appearance: "none",
              cursor: "pointer",
              width: 72,
              height: 72,
              borderRadius: 999,
              background: TOKENS.paper,
              border: `4px solid ${TOKENS.accent1}`,
              boxShadow: `0 0 0 3px ${TOKENS.paper}, 0 12px 30px rgba(0,0,0,0.5)`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
