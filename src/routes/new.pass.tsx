import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  BackButton,
  BrandMark,
  ChunkyButton,
  DotsBg,
  Frame,
  Icons,
  RouteDots,
  Ticket,
  TOKENS,
} from "@/components/new-confetti/shell";
import { getActiveLoop } from "@/lib/loop-store";

// Ported from design/new-confetti/project/screens.jsx (PassScreen, line 677)
// Slim port: header + 3 stops + book CTA. Drop-flip card animation
// is a follow-up polish — visual fidelity holds without it.
export const Route = createFileRoute("/new/pass")({
  component: PassPage,
});

function PassPage() {
  const navigate = useNavigate();

  const loop = getActiveLoop();
  const stops = (loop?.stops ?? []).map((s, i) => ({
    id: s.id,
    time: s.time,
    name: s.name,
    tag: s.type,
    sub: s.detail || s.type,
    addr: s.address || s.area || "",
    cost: s.priceLevel || "",
    color: [TOKENS.accent2, TOKENS.accent1, TOKENS.accent3, TOKENS.accent4][i % 4],
  }));
  const passCode = loop?.id ?? "—";
  const stopCount = stops.length;
  const dateLabel = loop?.date
    ? loop.date.toUpperCase()
    : new Date()
        .toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
        .toUpperCase();
  const vibeLabel = [loop?.occasion, loop?.vibe].filter(Boolean).join(" · ") || "your night";
  const areaLabel = loop?.gate || loop?.to || "tonight";

  return (
    <Frame>
      <div
        style={{
          position: "relative",
          height: "100%",
          background: TOKENS.bg,
          display: "flex",
          flexDirection: "column",
          padding: "56px 22px 22px",
          overflow: "hidden",
        }}
      >
        <DotsBg opacity={0.06} />

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
          <BackButton onClick={() => navigate({ to: "/new/hub" })} />
          <BrandMark size={17} />
          <span
            style={{
              fontFamily: TOKENS.mono,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: ".14em",
              color: TOKENS.inkHint,
            }}
          >
            PASS · {passCode}
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
          <h2
            style={{
              fontFamily: TOKENS.display,
              fontWeight: 900,
              fontSize: 38,
              lineHeight: 0.95,
              letterSpacing: "-0.04em",
              color: TOKENS.ink,
              margin: "0 0 4px",
            }}
          >
            Your night,
            <br />
            printed.
          </h2>
          <p
            style={{
              fontFamily: TOKENS.ui,
              fontSize: 13,
              fontWeight: 600,
              color: TOKENS.inkMuted,
              margin: "0 0 16px",
            }}
          >
            {areaLabel} · tonight · {vibeLabel}
          </p>

          {/* Pass ticket header */}
          <Ticket
            color={TOKENS.paper}
            notch={false}
            style={{ padding: "18px 18px 16px", marginBottom: 14 }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingBottom: 14,
                borderBottom: `2.5px dashed ${TOKENS.ink}`,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: TOKENS.mono,
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: ".14em",
                    color: TOKENS.inkHint,
                  }}
                >
                  TONIGHT · {areaLabel.toUpperCase()}
                </div>
                <div
                  style={{
                    fontFamily: TOKENS.display,
                    fontWeight: 900,
                    fontSize: 22,
                    letterSpacing: "-0.03em",
                    marginTop: 2,
                  }}
                >
                  {stopCount} stop{stopCount !== 1 ? "s" : ""} · {vibeLabel}
                </div>
              </div>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  border: `2.5px solid ${TOKENS.ink}`,
                  background: TOKENS.accent2,
                  display: "grid",
                  placeItems: "center",
                  fontFamily: TOKENS.display,
                  fontWeight: 900,
                  fontSize: 11,
                  letterSpacing: ".12em",
                  color: TOKENS.ink,
                  lineHeight: 1,
                  textAlign: "center",
                }}
              >
                {dateLabel}
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <RouteDots progress={1} size={18} />
            </div>
          </Ticket>

          {/* Stops */}
          {loop === null ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                paddingTop: 40,
                gap: 14,
              }}
            >
              <div style={{ fontSize: 40 }}>🎟️</div>
              <p
                style={{
                  fontFamily: TOKENS.ui,
                  fontWeight: 700,
                  fontSize: 14,
                  color: TOKENS.inkMuted,
                  textAlign: "center",
                }}
              >
                No active plan yet.
                <br />
                Go print your first night.
              </p>
              <button
                onClick={() => navigate({ to: "/new/hub" })}
                style={{
                  appearance: "none",
                  cursor: "pointer",
                  padding: "12px 20px",
                  border: `2.5px solid ${TOKENS.ink}`,
                  borderRadius: 12,
                  background: TOKENS.accent1,
                  color: TOKENS.ink,
                  fontFamily: TOKENS.ui,
                  fontWeight: 800,
                  fontSize: 13,
                  boxShadow: `3px 3px 0 ${TOKENS.ink}`,
                }}
              >
                ← back to hub
              </button>
            </div>
          ) : (
            stops.map((s, i) => (
              <div
                key={i}
                onClick={() => navigate({ to: "/new/venue", search: { stopId: s.id } })}
                style={{
                  border: `2.5px solid ${TOKENS.ink}`,
                  borderRadius: 16,
                  background: TOKENS.paper,
                  padding: 14,
                  marginBottom: 10,
                  boxShadow: `4px 4px 0 ${TOKENS.ink}`,
                  position: "relative",
                  cursor: "pointer",
                  transition: "transform .1s, box-shadow .1s",
                }}
                onMouseDown={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translate(2px,2px)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `2px 2px 0 ${TOKENS.ink}`;
                }}
                onMouseUp={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = "";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `4px 4px 0 ${TOKENS.ink}`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = "";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `4px 4px 0 ${TOKENS.ink}`;
                }}
              >
                {/* Stop number badge */}
                <span
                  style={{
                    position: "absolute",
                    top: -10,
                    left: -10,
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    background: s.color,
                    border: `2.5px solid ${TOKENS.ink}`,
                    display: "grid",
                    placeItems: "center",
                    fontFamily: TOKENS.display,
                    fontWeight: 900,
                    fontSize: 13,
                    color: TOKENS.ink,
                  }}
                >
                  {i + 1}
                </span>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                  <span
                    style={{
                      fontFamily: TOKENS.mono,
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: ".14em",
                      color: TOKENS.ink,
                    }}
                  >
                    {s.time}
                  </span>
                  <span
                    style={{
                      fontFamily: TOKENS.mono,
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: ".1em",
                      color: TOKENS.inkHint,
                    }}
                  >
                    · {s.tag}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: TOKENS.display,
                    fontWeight: 900,
                    fontSize: 22,
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                  }}
                >
                  {s.name}
                </div>
                <div
                  style={{
                    fontFamily: TOKENS.ui,
                    fontSize: 12,
                    fontWeight: 700,
                    color: TOKENS.inkHint,
                    marginTop: 4,
                  }}
                >
                  {s.sub}
                </div>
                <div
                  style={{
                    marginTop: 10,
                    paddingTop: 10,
                    borderTop: "1.5px dashed rgba(0,0,0,0.15)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 8,
                    fontFamily: TOKENS.mono,
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: ".1em",
                    color: TOKENS.inkHint,
                  }}
                >
                  <span style={{ display: "flex", gap: 12 }}>
                    {s.addr && <span>📍 {s.addr}</span>}
                    {s.cost && <span>💸 {s.cost}</span>}
                  </span>
                  <span style={{ fontSize: 9, opacity: 0.5 }}>tap to explore →</span>
                </div>
              </div>
            ))
          )}

          <div style={{ height: 12 }} />
        </div>

        <div style={{ position: "relative", zIndex: 2 }}>
          <ChunkyButton
            variant="accent"
            onClick={() => navigate({ to: "/new/night" })}
            icon={Icons.arrow}
          >
            Let's go →
          </ChunkyButton>
        </div>
      </div>
    </Frame>
  );
}
