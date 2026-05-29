import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  BackButton, BrandMark, ChunkyButton, DotsBg, FloatingTickets, Frame, Icons, Stamp, Ticket, TOKENS,
} from "@/components/new-confetti/shell";
import { getActiveLoop } from "@/lib/loop-store";

// Ported from design/new-confetti/project/screens.jsx (NightFinished, line 1336)
export const Route = createFileRoute("/new/finished")({
  component: FinishedPage,
});

const STOP_COLORS = [TOKENS.accent2, TOKENS.accent1, TOKENS.accent3];

function FinishedPage() {
  const navigate = useNavigate();
  const [shared, setShared] = useState<string | null>(null);

  const loop = getActiveLoop();
  const stops = (loop?.stops?.slice(0, 3) ?? []).map((s, i) => ({
    time: s.time,
    name: s.name,
    cost: s.priceLevel || "—",
    color: STOP_COLORS[i % 3],
  }));
  const passCode = loop?.id ?? "—";

  return (
    <Frame>
      <div style={{
        position: "relative", height: "100%",
        background: TOKENS.bg,
        display: "flex", flexDirection: "column",
        padding: "56px 22px 22px",
        overflow: "hidden",
      }}>
        <DotsBg opacity={0.06} />
        <FloatingTickets density={4} />

        <div style={{
          position: "relative", zIndex: 2,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 12,
        }}>
          <BackButton onClick={() => navigate({ to: "/new/hub" })} />
          <BrandMark size={17} />
          <span style={{
            fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800,
            letterSpacing: ".14em", color: TOKENS.inkHint,
          }}>PASS · {passCode} · CLOSED</span>
        </div>

        <div style={{
          position: "relative", zIndex: 2, flex: 1,
          overflowY: "auto", marginRight: -22, paddingRight: 22,
          scrollbarWidth: "none",
        }}>
          <Stamp color={TOKENS.accent2} rotate={-4} style={{ alignSelf: "flex-start", fontSize: 13, marginBottom: 12 }}>
            night complete
          </Stamp>
          <h1 style={{
            fontFamily: TOKENS.display, fontWeight: 900,
            fontSize: 50, lineHeight: 0.92, letterSpacing: "-0.045em",
            color: TOKENS.ink, margin: "0 0 18px",
          }}>That was<br/><span style={{ color: TOKENS.accent1 }}>a night.</span></h1>

          {/* Reel preview — 3 polaroid-ish frames */}
          <div style={{
            display: "flex", gap: 8, marginBottom: 18,
          }}>
            {stops.map((s, i) => (
              <div key={i} style={{
                flex: 1, aspectRatio: "3 / 4",
                border: `2.5px solid ${TOKENS.ink}`, borderRadius: 10,
                background: s.color,
                boxShadow: `3px 3px 0 ${TOKENS.ink}`,
                transform: `rotate(${[-3, 1, -1][i % 3]}deg)`,
                display: "flex", flexDirection: "column", justifyContent: "flex-end",
                padding: 8,
              }}>
                <div style={{
                  fontFamily: TOKENS.mono, fontSize: 8, fontWeight: 800,
                  letterSpacing: ".14em", color: TOKENS.inkHint,
                }}>{s.time}</div>
                <div style={{
                  fontFamily: TOKENS.display, fontWeight: 900, fontSize: 12,
                  letterSpacing: "-0.02em", color: TOKENS.ink, lineHeight: 1.1,
                }}>{s.name}</div>
              </div>
            ))}
          </div>

          {/* Share rail */}
          <div style={{
            fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800,
            letterSpacing: ".16em", color: TOKENS.inkHint, marginBottom: 10,
          }}>SHARE</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["tiktok", "ig", "imessage", "copy"].map((k) => (
              <button key={k} onClick={() => setShared(k)} style={{
                appearance: "none", cursor: "pointer",
                padding: "8px 14px",
                border: `2.5px solid ${TOKENS.ink}`, borderRadius: 999,
                background: TOKENS.paper, color: TOKENS.ink,
                fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 800,
                boxShadow: `3px 3px 0 ${TOKENS.ink}`,
                textTransform: "uppercase", letterSpacing: ".06em",
              }}>{k}</button>
            ))}
          </div>
          {shared && (
            <div style={{
              marginTop: 10, padding: "8px 12px",
              background: TOKENS.ink, color: TOKENS.paper,
              border: `2px solid ${TOKENS.ink}`, borderRadius: 999,
              fontFamily: TOKENS.mono, fontSize: 11, fontWeight: 800,
              letterSpacing: ".1em", textAlign: "center",
              animation: "cf-bubble 0.3s",
            }}>✓ SHARED TO {shared.toUpperCase()}</div>
          )}

          {/* Receipt */}
          <div style={{
            fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800,
            letterSpacing: ".16em", color: TOKENS.inkHint, marginBottom: 10, marginTop: 18,
          }}>RECEIPT</div>
          <Ticket color={TOKENS.paper} notch={false} style={{ padding: 16 }}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800,
              letterSpacing: ".12em", marginBottom: 10, color: TOKENS.inkMuted,
            }}>
              <span>{loop?.date?.toUpperCase() ?? "TONIGHT"}</span><span>{passCode}</span>
            </div>
            {stops.map((s, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", gap: 10,
                padding: "6px 0",
                borderBottom: i < stops.length - 1 ? "1.5px dashed rgba(0,0,0,0.15)" : "none",
                fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 700,
              }}>
                <span style={{
                  fontFamily: TOKENS.mono, fontSize: 10,
                  color: TOKENS.inkHint, width: 64,
                }}>{s.time}</span>
                <span style={{ flex: 1 }}>{s.name}</span>
                <span style={{ fontFamily: TOKENS.mono, fontWeight: 800 }}>{s.cost}</span>
              </div>
            ))}
            <div style={{
              marginTop: 12, paddingTop: 10,
              borderTop: `2.5px solid ${TOKENS.ink}`,
              display: "flex", justifyContent: "space-between",
              fontFamily: TOKENS.display, fontWeight: 900, fontSize: 18,
            }}>
              <span>TOTAL</span><span>{loop?.estimatedSpend ?? "—"}</span>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              <Stamp color={TOKENS.accent2} rotate={-3} style={{ fontSize: 10 }}>foodie</Stamp>
              <Stamp color={TOKENS.accent1} rotate={2} style={{ fontSize: 10 }}>chill</Stamp>
              <Stamp color={TOKENS.accent3} rotate={-2} style={{ fontSize: 10, color: TOKENS.paper }}>walkable</Stamp>
            </div>
          </Ticket>

          <div style={{ height: 14 }} />
        </div>

        <div style={{ position: "relative", zIndex: 2, display: "flex", gap: 8, paddingTop: 12 }}>
          <ChunkyButton variant="ghost" onClick={() => navigate({ to: "/new/hub" })}>scrapbook</ChunkyButton>
          <ChunkyButton variant="accent" onClick={() => navigate({ to: "/new/plan" })} icon={Icons.refresh}>plan another</ChunkyButton>
        </div>
      </div>
    </Frame>
  );
}
