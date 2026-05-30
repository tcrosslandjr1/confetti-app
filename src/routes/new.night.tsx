import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  BrandMark,
  ChunkyButton,
  Frame,
  Icons,
  RouteDots,
  Ticket,
  TOKENS,
} from "@/components/new-confetti/shell";
import { getActiveLoop } from "@/lib/loop-store";

// Slim "Night Of" port — design/new-confetti/project/screens.jsx
// (NightOfScreen, line 1009). Full 5-component composition (OnMyWay,
// PostedCard, LiveFeed, CheckInSheet, SocialIcons) is a follow-up
// polish — this captures the visual layer + flow continuity.
export const Route = createFileRoute("/new/night")({
  component: NightPage,
});

function NightPage() {
  const navigate = useNavigate();
  const [toast, setToast] = useState<string | null>(null);
  const loop = getActiveLoop();
  const stops = loop?.stops ?? [];
  const currentStop = stops.find((s) => !s.done) ?? stops[0];
  const nextStop = (() => {
    const idx = stops.indexOf(currentStop!);
    return idx >= 0 && idx < stops.length - 1 ? stops[idx + 1] : null;
  })();

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  if (loop === null) {
    return (
      <Frame>
        <div
          style={{
            position: "relative",
            height: "100%",
            background: TOKENS.ink,
            color: TOKENS.paper,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "56px 22px 22px",
            gap: 16,
          }}
        >
          <div
            style={{
              fontFamily: TOKENS.display,
              fontWeight: 900,
              fontSize: 28,
              letterSpacing: "-0.03em",
              textAlign: "center",
              lineHeight: 1.1,
            }}
          >
            No active loop.
          </div>
          <div
            style={{
              fontFamily: TOKENS.ui,
              fontSize: 14,
              fontWeight: 700,
              color: TOKENS.paperMuted,
              textAlign: "center",
            }}
          >
            Head back and print a night.
          </div>
          <button
            onClick={() => navigate({ to: "/new/hub" })}
            style={{
              appearance: "none",
              cursor: "pointer",
              padding: "12px 20px",
              border: `2px solid ${TOKENS.paper}`,
              borderRadius: 12,
              background: "transparent",
              color: TOKENS.paper,
              fontFamily: TOKENS.ui,
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            ← back to hub
          </button>
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
          background: TOKENS.ink,
          color: TOKENS.paper,
          display: "flex",
          flexDirection: "column",
          padding: "56px 22px 22px",
          overflow: "hidden",
        }}
      >
        {/* Dim radial wash */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: `radial-gradient(circle at 30% 20%, ${TOKENS.accent1}33 0%, transparent 35%),
                       radial-gradient(circle at 80% 80%, ${TOKENS.accent3}44 0%, transparent 35%)`,
          }}
        />

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
          <button
            onClick={() => navigate({ to: "/new/hub" })}
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
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              background: TOKENS.accent1,
              border: `2px solid ${TOKENS.ink}`,
              borderRadius: 999,
              fontFamily: TOKENS.mono,
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: ".14em",
              color: TOKENS.ink,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: TOKENS.ink,
                animation: "cf-pulse 1.2s infinite",
              }}
            />
            {`LIVE · STOP ${stops.findIndex((s) => !s.done) + 1 || stops.length}/${stops.length}`}
          </span>
        </div>

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
          <div
            style={{
              fontFamily: TOKENS.mono,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: ".18em",
              color: TOKENS.paperMuted,
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            YOU ARE HERE
          </div>
          <h2
            style={{
              fontFamily: TOKENS.display,
              fontWeight: 900,
              fontSize: 44,
              lineHeight: 0.95,
              letterSpacing: "-0.04em",
              color: TOKENS.paper,
              margin: "0 0 6px",
            }}
          >
            {currentStop?.name ?? "Your stop"}.
          </h2>
          <p
            style={{
              fontFamily: TOKENS.ui,
              fontSize: 14,
              fontWeight: 700,
              color: TOKENS.paperMuted,
              margin: "0 0 18px",
            }}
          >
            {currentStop?.time ?? ""}
            {currentStop?.address
              ? ` · ${currentStop.address}`
              : currentStop?.area
                ? ` · ${currentStop.area}`
                : ""}
            {currentStop?.detail ? ` · ${currentStop.detail}` : ""}
          </p>

          <Ticket color={TOKENS.paper} notch={false} style={{ padding: 14, marginBottom: 14 }}>
            <div
              style={{
                fontFamily: TOKENS.mono,
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: ".14em",
                color: TOKENS.inkHint,
              }}
            >
              WHAT TO DO HERE
            </div>
            <div
              style={{
                fontFamily: TOKENS.display,
                fontWeight: 900,
                fontSize: 18,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                marginTop: 4,
                color: TOKENS.ink,
              }}
            >
              {currentStop?.rationale || currentStop?.detail || "Enjoy the experience."}
            </div>
            <div style={{ marginTop: 12 }}>
              <RouteDots
                progress={
                  stops.length > 0 ? (stops.findIndex((s) => !s.done) + 1) / stops.length : 0.5
                }
                size={16}
              />
            </div>
            <div
              style={{
                marginTop: 8,
                fontFamily: TOKENS.mono,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: ".1em",
                color: TOKENS.inkHint,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              {stops.map((s, idx) => (
                <span key={s.id}>
                  {idx + 1} · {s.name.toUpperCase()}
                  {s.done ? " ✓" : ""}
                </span>
              ))}
            </div>
          </Ticket>

          {/* Quick actions */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}
          >
            {toast && (
              <div
                style={{
                  gridColumn: "1 / -1",
                  marginBottom: 4,
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: TOKENS.accent2,
                  border: `2px solid ${TOKENS.ink}`,
                  fontFamily: TOKENS.ui,
                  fontSize: 13,
                  fontWeight: 700,
                  color: TOKENS.ink,
                }}
              >
                {toast}
              </div>
            )}
            <button onClick={() => navigate({ to: "/new/check-in" })} style={action()}>
              📸 check in
            </button>
            <button
              onClick={() => {
                const dest = nextStop?.name || nextStop?.area || "";
                const addr = nextStop?.address || "";
                const uberUrl = `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=${encodeURIComponent(addr || dest)}`;
                if (dest) window.open(uberUrl, "_blank");
                else showToast("No next stop found on your pass.");
              }}
              style={action()}
            >
              🚖 ride to next
            </button>
            <button
              onClick={() => {
                const phone = currentStop?.phone;
                if (phone) {
                  window.open(`tel:${phone}`, "_blank");
                } else showToast("No phone number on file for this stop.");
              }}
              style={action()}
            >
              📞 call ahead
            </button>
            <button onClick={() => navigate({ to: "/new/plan" })} style={action()}>
              ↻ revise plan
            </button>
          </div>

          {/* Crew live preview */}
          <div
            style={{
              fontFamily: TOKENS.mono,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: ".18em",
              color: TOKENS.paperMuted,
              textTransform: "uppercase",
              marginBottom: 8,
              marginTop: 6,
            }}
          >
            crew is on it
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              overflowX: "auto",
              scrollbarWidth: "none",
              marginRight: -22,
              paddingRight: 22,
              marginBottom: 18,
            }}
          >
            {[
              { who: "Sara", at: "Daughter ✓", color: TOKENS.accent2 },
              { who: "Mike", at: "en route", color: TOKENS.accent1 },
              { who: "Ren", at: "5 min out", color: TOKENS.accent3 },
            ].map((c, i) => (
              <div
                key={i}
                style={{
                  flexShrink: 0,
                  width: 130,
                  border: `2.5px solid ${TOKENS.paper}`,
                  borderRadius: 12,
                  background: TOKENS.ink,
                  padding: 10,
                }}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 999,
                    background: c.color,
                    border: `2px solid ${TOKENS.paper}`,
                    display: "grid",
                    placeItems: "center",
                    fontFamily: TOKENS.display,
                    fontWeight: 900,
                    fontSize: 11,
                    color: TOKENS.ink,
                  }}
                >
                  {c.who[0]}
                </div>
                <div
                  style={{
                    fontFamily: TOKENS.display,
                    fontWeight: 900,
                    fontSize: 14,
                    letterSpacing: "-0.02em",
                    marginTop: 6,
                    color: TOKENS.paper,
                  }}
                >
                  {c.who}
                </div>
                <div
                  style={{
                    fontFamily: TOKENS.mono,
                    fontSize: 9,
                    fontWeight: 700,
                    color: TOKENS.paperMuted,
                    marginTop: 4,
                  }}
                >
                  {c.at}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 2 }}>
          <ChunkyButton
            variant="accent"
            onClick={() => navigate({ to: "/new/finished" })}
            icon={Icons.arrow}
          >
            Wrap up the night
          </ChunkyButton>
        </div>
      </div>
    </Frame>
  );
}

function action() {
  return {
    appearance: "none" as const,
    cursor: "pointer",
    padding: "12px 14px",
    border: `2.5px solid ${TOKENS.paper}`,
    borderRadius: 12,
    background: "transparent",
    color: TOKENS.paper,
    fontFamily: TOKENS.ui,
    fontSize: 13,
    fontWeight: 800,
    textAlign: "left" as const,
    letterSpacing: "-0.01em",
  };
}
