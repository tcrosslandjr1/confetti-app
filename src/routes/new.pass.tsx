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
import { getActiveLoop, type LoopStop } from "@/lib/loop-store";

// Ported from design/new-confetti/project/screens.jsx (PassScreen, line 677)
// Slim port: header + 3 stops + book CTA. Drop-flip card animation
// is a follow-up polish — visual fidelity holds without it.
export const Route = createFileRoute("/new/pass")({
  component: PassPage,
});

function PassPage() {
  const navigate = useNavigate();

  const loop = getActiveLoop();
  const rawStops = loop?.stops ?? [];
  const STOP_COLORS = [TOKENS.accent2, TOKENS.accent1, TOKENS.accent3, TOKENS.accent4];
  const passCode = loop?.id ?? "—";
  const stopCount = rawStops.length;
  const totalPoints = loop?.confettiPoints;
  const vibeChips = (
    loop?.vibes && loop.vibes.length ? loop.vibes : loop?.vibe ? [loop.vibe] : []
  ).slice(0, 3);
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
                  {loop?.occasionEmoji ? ` ${loop.occasionEmoji}` : ""}
                </div>
                {(vibeChips.length > 0 || totalPoints) && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 7 }}>
                    {vibeChips.map((v) => (
                      <span
                        key={v}
                        style={{
                          fontFamily: TOKENS.ui,
                          fontSize: 9,
                          fontWeight: 800,
                          background: TOKENS.accent2,
                          border: `2px solid ${TOKENS.ink}`,
                          borderRadius: 999,
                          padding: "2px 7px",
                        }}
                      >
                        {v}
                      </span>
                    ))}
                    {totalPoints ? (
                      <span
                        style={{
                          fontFamily: TOKENS.ui,
                          fontSize: 9,
                          fontWeight: 800,
                          background: TOKENS.paper,
                          border: `2px solid ${TOKENS.ink}`,
                          borderRadius: 999,
                          padding: "2px 7px",
                        }}
                      >
                        ✦ {totalPoints} pts
                      </span>
                    ) : null}
                  </div>
                )}
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
            rawStops.map((s, i) => (
              <StopCard
                key={s.id}
                stop={s}
                index={i}
                color={STOP_COLORS[i % STOP_COLORS.length]}
                onClick={() => navigate({ to: "/new/venue", search: { stopId: s.id } })}
              />
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

// Enriched stop card — renders every available LoopStop field, each hidden
// when empty so the card stays clean for sparse plans and fills out as the
// generator / venue lookups attach more intel.
function StopCard({
  stop,
  index,
  color,
  onClick,
}: {
  stop: LoopStop;
  index: number;
  color: string;
  onClick: () => void;
}) {
  const twistMatch = stop.detail?.match(/\[TWIST:\s*([^\]]+)\]/i);
  const twist = twistMatch?.[1]?.trim();
  const why = (stop.detail ?? "").replace(/\s*\[TWIST:[^\]]+\]/i, "").trim();
  const durationTag = stop.tags?.find((t) => t.variant === "time")?.label;
  const place = stop.address || stop.area || "";

  const meta = [
    stop.rating != null
      ? `★ ${stop.rating}${stop.userRatingCount ? ` (${stop.userRatingCount.toLocaleString()})` : ""}`
      : null,
    stop.priceLevel || null,
    stop.crowd || null,
    stop.bestFor ? `best for ${stop.bestFor}` : null,
  ].filter(Boolean) as string[];

  const chips = [
    stop.dressCode ? `👗 ${stop.dressCode}` : null,
    stop.waitTime ? `⏱ ${stop.waitTime}` : null,
    durationTag ? `🕘 ${durationTag}` : null,
    stop.driveAfter ? `🚶 ${stop.driveAfter.minutes} min to next` : null,
  ].filter(Boolean) as string[];

  const showProTip =
    stop.rationale && stop.rationale !== why && stop.rationale !== stop.signature;

  return (
    <div
      onClick={onClick}
      style={{
        border: `2.5px solid ${TOKENS.ink}`,
        borderRadius: 16,
        background: TOKENS.paper,
        padding: 14,
        marginBottom: 14,
        marginLeft: 4,
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
      <span
        style={{
          position: "absolute",
          top: -10,
          left: -10,
          width: 28,
          height: 28,
          borderRadius: 999,
          background: color,
          border: `2.5px solid ${TOKENS.ink}`,
          display: "grid",
          placeItems: "center",
          fontFamily: TOKENS.display,
          fontWeight: 900,
          fontSize: 13,
          color: TOKENS.ink,
        }}
      >
        {index + 1}
      </span>

      {(stop.verified || stop.sponsored) && (
        <span style={{ position: "absolute", top: -9, right: 10, display: "flex", gap: 4 }}>
          {stop.sponsored && (
            <span
              style={{
                fontFamily: TOKENS.mono,
                fontSize: 8,
                fontWeight: 800,
                letterSpacing: ".08em",
                background: TOKENS.accent3,
                color: TOKENS.paper,
                border: `2px solid ${TOKENS.ink}`,
                borderRadius: 999,
                padding: "2px 7px",
              }}
            >
              {stop.partnerLabel ?? "PARTNER"}
            </span>
          )}
          {stop.verified && (
            <span
              style={{
                fontFamily: TOKENS.mono,
                fontSize: 8,
                fontWeight: 800,
                letterSpacing: ".08em",
                background: TOKENS.accent4,
                color: TOKENS.paper,
                border: `2px solid ${TOKENS.ink}`,
                borderRadius: 999,
                padding: "2px 7px",
              }}
            >
              ✓ VERIFIED
            </span>
          )}
        </span>
      )}

      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 3 }}>
        <span
          style={{
            fontFamily: TOKENS.mono,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: ".14em",
            color: TOKENS.ink,
          }}
        >
          {stop.time}
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
          · {stop.type}
          {stop.emoji ? ` ${stop.emoji}` : ""}
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
        {stop.name}
      </div>

      {meta.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 5,
            fontFamily: TOKENS.ui,
            fontSize: 11,
            fontWeight: 800,
          }}
        >
          {meta.map((m, k) => (
            <span key={k} style={{ color: m.startsWith("★") ? "#854f0b" : TOKENS.inkMuted }}>
              {k > 0 ? "· " : ""}
              {m}
            </span>
          ))}
        </div>
      )}

      {why && (
        <div
          style={{
            fontFamily: TOKENS.ui,
            fontSize: 12,
            fontWeight: 600,
            fontStyle: "italic",
            color: TOKENS.inkMuted,
            marginTop: 7,
            lineHeight: 1.35,
          }}
        >
          {why}
        </div>
      )}

      {twist && (
        <div
          style={{
            marginTop: 9,
            padding: "8px 10px",
            background: `${TOKENS.accent3}1f`,
            border: `1.5px solid ${TOKENS.accent3}`,
            borderRadius: 8,
            fontFamily: TOKENS.ui,
            fontSize: 11,
            fontWeight: 700,
            color: TOKENS.ink,
          }}
        >
          ✨ Twist: {twist}
        </div>
      )}

      {chips.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 9 }}>
          {chips.map((c, k) => (
            <span
              key={k}
              style={{
                fontFamily: TOKENS.mono,
                fontSize: 9,
                fontWeight: 800,
                background: "#f1efe8",
                borderRadius: 6,
                padding: "3px 7px",
                color: TOKENS.ink,
              }}
            >
              {c}
            </span>
          ))}
        </div>
      )}

      {stop.signature && (
        <div
          style={{
            marginTop: 9,
            padding: "8px 10px",
            background: `${TOKENS.accent1}14`,
            border: `1.5px solid ${TOKENS.accent1}`,
            borderRadius: 8,
            fontFamily: TOKENS.ui,
            fontSize: 11,
            fontWeight: 700,
            color: TOKENS.ink,
          }}
        >
          🍸 Insider: {stop.signature}
        </div>
      )}

      {showProTip && (
        <div
          style={{
            fontFamily: TOKENS.ui,
            fontSize: 11,
            fontWeight: 600,
            color: TOKENS.inkHint,
            marginTop: 7,
          }}
        >
          💡 {stop.rationale}
        </div>
      )}

      {stop.hashtags && stop.hashtags.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginTop: 8,
            fontFamily: TOKENS.mono,
            fontSize: 9,
            fontWeight: 700,
            color: TOKENS.accent3,
          }}
        >
          {stop.hashtags.slice(0, 4).map((h) => (
            <span key={h}>{h.startsWith("#") ? h : `#${h}`}</span>
          ))}
        </div>
      )}

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
          letterSpacing: ".08em",
          color: TOKENS.inkHint,
        }}
      >
        <span style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {place && <span>📍 {place}</span>}
          {stop.phone && (
            <a
              href={`tel:${stop.phone}`}
              onClick={(e) => e.stopPropagation()}
              style={{ color: "#185fa5", textDecoration: "none" }}
            >
              📞 call
            </a>
          )}
          {stop.points != null && <span style={{ color: "#3b6d11" }}>✦ {stop.points} pts</span>}
        </span>
        <span style={{ fontSize: 9, opacity: 0.5 }}>tap to explore →</span>
      </div>
    </div>
  );
}
