import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { DotsBg, Frame, TOKENS } from "@/components/new-confetti/shell";

export const Route = createFileRoute("/new/draft")({ component: DraftPage });

type DraftStop = {
  id: number; name: string; tag?: string; nbhd?: string; cost?: string; color: string;
};

const SAMPLE_STOPS: DraftStop[] = [
  { id: 1, name: "Skinny Pete's",  tag: "dive bar",  nbhd: "Williamsburg", cost: "$0",  color: TOKENS.accent2 },
  { id: 2, name: "Lupa Notte",     tag: "Italian",   nbhd: "WVillage",     cost: "$55", color: TOKENS.accent1 },
];

function DraftTrayPill({ stops, onOpen }: { stops: DraftStop[]; onOpen: () => void }) {
  if (!stops.length) return null;
  return (
    <button onClick={onOpen} style={{
      position: "absolute", left: "50%", bottom: 84, zIndex: 28,
      transform: "translateX(-50%)",
      appearance: "none", cursor: "pointer",
      display: "inline-flex", alignItems: "center", gap: 10,
      padding: "8px 8px 8px 14px",
      border: `2.5px solid ${TOKENS.ink}`, borderRadius: 999,
      background: TOKENS.accent1, color: TOKENS.ink,
      fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 900,
      boxShadow: `4px 4px 0 ${TOKENS.ink}`, animation: "cf-pop 0.3s",
    }}>
      <span style={{ display: "flex" }}>
        {stops.slice(0, 3).map((s, i) => (
          <span key={i} style={{
            width: 22, height: 22, borderRadius: 999,
            border: `2px solid ${TOKENS.ink}`, background: s.color,
            marginLeft: i > 0 ? -8 : 0,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontFamily: TOKENS.display, fontWeight: 900, fontSize: 10, color: TOKENS.ink,
          }}>{i + 1}</span>
        ))}
      </span>
      draft pass · {stops.length} stop{stops.length !== 1 ? "s" : ""}
      <span style={{
        padding: "4px 9px", background: TOKENS.ink, color: TOKENS.paper,
        borderRadius: 999, fontSize: 12, fontWeight: 900,
      }}>review →</span>
    </button>
  );
}

function DraftSheet({
  open, stops, onClose, onRemove, onFillWithSparkle, onClear,
}: {
  open: boolean; stops: DraftStop[];
  onClose: () => void; onRemove: (i: number) => void;
  onFillWithSparkle: () => void; onClear: () => void;
}) {
  if (!open) return null;
  const total = stops.reduce((n, s) => n + parseFloat((s.cost || "0").replace(/[^0-9.]/g, "")) || 0, 0);

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 70,
      display: "flex", alignItems: "flex-end",
    }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }} />
      <div style={{
        position: "relative", width: "100%",
        background: TOKENS.bg, color: TOKENS.ink,
        borderRadius: "26px 26px 0 0", borderTop: `3px solid ${TOKENS.ink}`,
        boxShadow: `0 -10px 0 ${TOKENS.ink}`,
        padding: "12px 20px 24px", maxHeight: "92%", overflowY: "auto", scrollbarWidth: "none",
      }}>
        <div style={{ width: 44, height: 5, borderRadius: 999, background: TOKENS.ink, opacity: 0.25, margin: "0 auto 12px" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800, letterSpacing: ".16em", color: TOKENS.ink, opacity: 0.55, textTransform: "uppercase" as const }}>
              DRAFT PASS · {stops.length} stop{stops.length !== 1 ? "s" : ""}
            </div>
            <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 22, letterSpacing: "-0.025em", color: TOKENS.ink, marginTop: 2 }}>Building a night.</div>
          </div>
          <button onClick={onClose} style={{
            appearance: "none", cursor: "pointer", width: 34, height: 34, borderRadius: 999,
            border: `2.5px solid ${TOKENS.ink}`, background: TOKENS.paper,
            fontSize: 14, fontWeight: 900, color: TOKENS.ink,
          }}>✕</button>
        </div>
        {/* Stops list */}
        <div style={{ padding: 14, marginBottom: 14, border: `2.5px solid ${TOKENS.ink}`, borderRadius: 14, background: TOKENS.paper, boxShadow: `4px 4px 0 ${TOKENS.ink}` }}>
          {stops.map((s, i) => (
            <div key={s.id} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 0",
              borderBottom: i < stops.length - 1 ? "1.5px dashed rgba(0,0,0,0.15)" : "none",
            }}>
              <span style={{
                width: 30, height: 30, borderRadius: 999,
                border: `2px solid ${TOKENS.ink}`, background: s.color,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontFamily: TOKENS.display, fontWeight: 900, fontSize: 13, color: TOKENS.ink, flexShrink: 0,
              }}>{i + 1}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 14, letterSpacing: "-0.02em", lineHeight: 1.1, color: TOKENS.ink }}>{s.name}</div>
                <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 700, color: TOKENS.ink, opacity: 0.55, marginTop: 2, letterSpacing: ".06em", textTransform: "uppercase" as const }}>{s.tag || s.nbhd || "venue"}</div>
              </div>
              {s.cost && <span style={{ fontFamily: TOKENS.mono, fontSize: 11, fontWeight: 800, color: TOKENS.ink }}>{s.cost}</span>}
              <button onClick={() => onRemove(i)} style={{
                appearance: "none", cursor: "pointer", width: 22, height: 22, borderRadius: 999,
                border: `1.5px solid ${TOKENS.ink}`, background: TOKENS.paper,
                fontSize: 10, fontWeight: 900, color: TOKENS.ink,
              }}>✕</button>
            </div>
          ))}
        </div>
        {/* Sparkle advice */}
        <div style={{ padding: 14, marginBottom: 14, border: `2.5px solid ${TOKENS.ink}`, borderRadius: 14, background: TOKENS.accent2, boxShadow: `4px 4px 0 ${TOKENS.ink}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".14em", color: TOKENS.ink, opacity: 0.7, textTransform: "uppercase" as const, marginBottom: 4 }}>
            <span style={{ color: TOKENS.accent1 }}>✣</span> SPARKLE SAYS
          </div>
          <div style={{ fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 800, color: TOKENS.ink, lineHeight: 1.35 }}>
            {stops.length === 1 && "Solid start. 2 more stops makes a real night."}
            {stops.length === 2 && "Almost there. One more stop balances the route."}
            {stops.length >= 3 && `${stops.length} stops, ~$${total || 92} estimated. Ready to print.`}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
          <button onClick={onFillWithSparkle} style={{
            appearance: "none", cursor: "pointer", width: "100%",
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10,
            padding: "14px 18px", border: `3px solid ${TOKENS.ink}`, borderRadius: 14,
            background: TOKENS.accent1, color: TOKENS.ink,
            fontFamily: TOKENS.ui, fontSize: 15, fontWeight: 900, boxShadow: `4px 4px 0 ${TOKENS.ink}`,
          }}>✣ fill the rest with sparkle →</button>
          <button onClick={onClear} style={{
            appearance: "none", cursor: "pointer", padding: "10px 14px",
            border: `2px solid ${TOKENS.ink}`, borderRadius: 12,
            background: TOKENS.paper, color: TOKENS.ink,
            fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 800,
          }}>clear draft</button>
        </div>
      </div>
    </div>
  );
}

function DraftPage() {
  const navigate = useNavigate();
  const [stops, setStops] = useState<DraftStop[]>(SAMPLE_STOPS);
  const [sheetOpen, setSheetOpen] = useState(false);

  const remove = (i: number) => setStops(stops.filter((_, idx) => idx !== i));

  return (
    <Frame>
      <div className="cf-screen" style={{
        position: "relative", height: "100dvh", background: TOKENS.bg,
        display: "flex", flexDirection: "column", padding: "56px 22px 24px", overflow: "hidden",
      }}>
        <DotsBg opacity={0.05} />
        <div style={{
          position: "relative", zIndex: 2,
          display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14,
        }}>
          <button onClick={() => navigate({ to: "/new/explore" })} style={{
            appearance: "none", cursor: "pointer", width: 36, height: 36, borderRadius: 999,
            border: `2.5px solid ${TOKENS.ink}`, background: TOKENS.paper,
            fontSize: 14, fontWeight: 900, color: TOKENS.ink, boxShadow: `3px 3px 0 ${TOKENS.ink}`,
          }}>←</button>
          <h2 style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 22, letterSpacing: "-0.035em", margin: 0, color: TOKENS.ink }}>draft pass</h2>
          <span style={{ width: 36 }} />
        </div>

        <div style={{ position: "relative", zIndex: 2, flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
          <p style={{ fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 600, color: TOKENS.ink, opacity: 0.7, margin: "0 0 14px", lineHeight: 1.45 }}>
            Tap ＋ on any venue to add it here. When you're ready, fill the rest with Sparkle and print.
          </p>
          {stops.map((s, i) => (
            <div key={s.id} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: 14, marginBottom: 8,
              border: `2.5px solid ${TOKENS.ink}`, borderRadius: 14,
              background: [TOKENS.accent1, TOKENS.accent2, TOKENS.accent3, TOKENS.paper][i % 4],
              boxShadow: `4px 4px 0 ${TOKENS.ink}`,
            }}>
              <span style={{
                width: 36, height: 36, borderRadius: 999,
                border: `2.5px solid ${TOKENS.ink}`, background: s.color,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontFamily: TOKENS.display, fontWeight: 900, fontSize: 16, color: TOKENS.ink, flexShrink: 0,
              }}>{i + 1}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 16, letterSpacing: "-0.025em", color: TOKENS.ink }}>{s.name}</div>
                <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 700, color: TOKENS.ink, opacity: 0.6, marginTop: 2, letterSpacing: ".06em", textTransform: "uppercase" as const }}>{s.tag} · {s.nbhd}</div>
              </div>
              {s.cost && <span style={{ fontFamily: TOKENS.mono, fontSize: 12, fontWeight: 800, color: TOKENS.ink }}>{s.cost}</span>}
              <button onClick={() => remove(i)} style={{
                appearance: "none", cursor: "pointer", width: 24, height: 24, borderRadius: 999,
                border: `2px solid ${TOKENS.ink}`, background: TOKENS.paper,
                fontSize: 10, fontWeight: 900, color: TOKENS.ink,
              }}>✕</button>
            </div>
          ))}
          {stops.length === 0 && (
            <div style={{ textAlign: "center" as const, padding: "40px 0", opacity: 0.5 }}>
              <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 20, color: TOKENS.ink }}>No stops yet.</div>
              <div style={{ fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 600, color: TOKENS.ink, marginTop: 6 }}>Tap ＋ on any venue to start building.</div>
            </div>
          )}
        </div>

        {stops.length > 0 && (
          <div style={{ position: "relative", zIndex: 2, paddingTop: 12, display: "flex", flexDirection: "column" as const, gap: 8 }}>
            <button onClick={() => navigate({ to: "/new/chat" })} style={{
              appearance: "none", cursor: "pointer", width: "100%",
              padding: "14px 16px", border: `3px solid ${TOKENS.ink}`, borderRadius: 14,
              background: TOKENS.accent1, color: TOKENS.ink,
              fontFamily: TOKENS.ui, fontSize: 15, fontWeight: 900, boxShadow: `5px 5px 0 ${TOKENS.ink}`,
            }}>✣ fill the rest with sparkle →</button>
            <button onClick={() => setSheetOpen(true)} style={{
              appearance: "none", cursor: "pointer",
              padding: "10px 14px", border: `2px solid ${TOKENS.ink}`, borderRadius: 12,
              background: TOKENS.paper, color: TOKENS.ink,
              fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 800,
            }}>review draft ({stops.length} stop{stops.length !== 1 ? "s" : ""})</button>
          </div>
        )}

        <DraftTrayPill stops={stops} onOpen={() => setSheetOpen(true)} />
        <DraftSheet
          open={sheetOpen} stops={stops} onClose={() => setSheetOpen(false)}
          onRemove={remove}
          onFillWithSparkle={() => { setSheetOpen(false); navigate({ to: "/new/chat" }); }}
          onClear={() => { setStops([]); setSheetOpen(false); }}
        />
      </div>
    </Frame>
  );
}
