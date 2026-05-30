import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { DotsBg, Frame, TOKENS } from "@/components/new-confetti/shell";

export const Route = createFileRoute("/new/booking")({ component: BookingPage });

type BookingType = "walk-in" | "deposit" | "ticket" | "reservation";

const BOOKING_TYPES: Record<BookingType, {
  icon: string; label: string; sub: string; c: string; fg: string; cost: number; action: boolean; via?: string;
}> = {
  "walk-in":     { icon: "🚶", label: "walk-in friendly",    sub: "no booking needed",  c: TOKENS.accent4, fg: TOKENS.paper, cost: 0,  action: false },
  "deposit":     { icon: "⏱",  label: "holds spot · $10 dep", sub: "cancel by 6 PM",   c: TOKENS.accent2, fg: TOKENS.ink,   cost: 10, action: true, via: "Stripe" },
  "ticket":      { icon: "🎟", label: "ticket required",      sub: "non-refundable",    c: TOKENS.accent3, fg: TOKENS.paper, cost: 26, action: true, via: "Ticketmaster" },
  "reservation": { icon: "📅", label: "free reservation",     sub: "30 min grace",      c: TOKENS.accent1, fg: TOKENS.ink,   cost: 0,  action: true, via: "OpenTable" },
};

type Stop = { id: number; name: string; booking: BookingType; color: string };

const DEMO_STOPS: Stop[] = [
  { id: 1, name: "Skinny Pete's",  booking: "walk-in",     color: TOKENS.accent2 },
  { id: 2, name: "Lupa Notte",     booking: "reservation", color: TOKENS.accent1 },
  { id: 3, name: "Quartz Room",    booking: "ticket",      color: TOKENS.accent3 },
];

function BookingPill({ type, booked }: { type: BookingType; booked?: boolean }) {
  const t = BOOKING_TYPES[type];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 9px",
      border: `1.5px solid ${TOKENS.ink}`, borderRadius: 6,
      background: booked ? TOKENS.accent4 : t.c,
      color: booked ? TOKENS.paper : t.fg,
      fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".08em",
    }}>
      <span style={{ fontSize: 11 }}>{booked ? "✓" : t.icon}</span>
      {booked ? "BOOKED" : t.label.toUpperCase()}
    </span>
  );
}

type BookPhase = "confirm" | "booking" | "done";

function BookEverythingSheet({
  open, stops, bookedIds, onClose, onComplete,
}: {
  open: boolean; stops: Stop[]; bookedIds: Set<number>;
  onClose: () => void; onComplete: (ids: number[]) => void;
}) {
  const [phase, setPhase] = useState<BookPhase>("confirm");
  const [progress, setProgress] = useState<Record<number, "done">>({});

  const needs = stops.filter((s) => BOOKING_TYPES[s.booking].action && !bookedIds.has(s.id));
  const total = needs.reduce((n, s) => n + BOOKING_TYPES[s.booking].cost, 0);

  useEffect(() => {
    if (phase !== "booking") return;
    let active = true;
    needs.forEach((s, i) => {
      setTimeout(() => { if (active) setProgress((p) => ({ ...p, [s.id]: "done" })); }, 800 + i * 700);
    });
    const t = setTimeout(() => { if (active) setPhase("done"); }, 800 + needs.length * 700 + 400);
    return () => { active = false; clearTimeout(t); };
  }, [phase]);

  if (!open) return null;

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 70,
      display: "flex", alignItems: "flex-end",
    }}>
      <div onClick={phase !== "booking" ? onClose : undefined} style={{
        position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)",
      }} />
      <div style={{
        position: "relative", width: "100%",
        background: TOKENS.bg, color: TOKENS.ink,
        borderRadius: "26px 26px 0 0",
        borderTop: `3px solid ${TOKENS.ink}`,
        boxShadow: `0 -10px 0 ${TOKENS.ink}`,
        padding: "12px 20px 24px",
        maxHeight: "92%", overflowY: "auto", scrollbarWidth: "none",
      }}>
        <div style={{
          width: 44, height: 5, borderRadius: 999,
          background: TOKENS.ink, opacity: 0.25, margin: "0 auto 14px",
        }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800, letterSpacing: ".16em", color: TOKENS.ink, opacity: 0.55, textTransform: "uppercase" as const }}>
              {phase === "done" ? "NIGHT LOCKED IN" : "BOOK EVERYTHING"}
            </div>
            <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 24, letterSpacing: "-0.03em", color: TOKENS.ink, marginTop: 2 }}>
              {phase === "done" ? "You're all set." : phase === "booking" ? "Booking 3 stops in parallel…" : "One tap. Three bookings."}
            </div>
          </div>
          {phase !== "booking" && (
            <button onClick={onClose} style={{
              appearance: "none", cursor: "pointer",
              width: 34, height: 34, borderRadius: 999,
              border: `2.5px solid ${TOKENS.ink}`, background: TOKENS.paper,
              fontSize: 14, fontWeight: 900, color: TOKENS.ink,
            }}>✕</button>
          )}
        </div>
        <div style={{ marginBottom: 14 }}>
          {stops.map((s) => {
            const t = BOOKING_TYPES[s.booking];
            const done = progress[s.id] === "done" || phase === "done";
            const needsAction = t.action;
            return (
              <div key={s.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: 12, marginBottom: 8,
                border: `2.5px solid ${TOKENS.ink}`, borderRadius: 12,
                background: done && needsAction ? TOKENS.accent4 : TOKENS.paper,
                color: done && needsAction ? TOKENS.paper : TOKENS.ink,
                boxShadow: `3px 3px 0 ${TOKENS.ink}`,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 999,
                  border: "2.5px solid currentColor", background: s.color, color: TOKENS.ink,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: TOKENS.display, fontWeight: 900, fontSize: 14, flexShrink: 0,
                }}>{done && needsAction ? "✓" : t.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 15, letterSpacing: "-0.02em" }}>{s.name}</div>
                  <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 700, opacity: 0.7, marginTop: 2, letterSpacing: ".06em" }}>
                    {!needsAction ? "WALK-IN · NO BOOKING" :
                     done ? `BOOKED VIA ${t.via!.toUpperCase()}` :
                     phase === "booking" ? `BOOKING VIA ${t.via!.toUpperCase()}…` :
                     `${t.via!.toUpperCase()} · $${t.cost}`}
                  </div>
                </div>
                {needsAction && phase === "confirm" && (
                  <span style={{ fontFamily: TOKENS.mono, fontSize: 11, fontWeight: 800 }}>${t.cost}</span>
                )}
              </div>
            );
          })}
        </div>
        {phase === "confirm" && (
          <>
            <div style={{
              padding: "10px 14px", marginBottom: 14,
              background: TOKENS.paper, border: `2px dashed ${TOKENS.ink}`, borderRadius: 12,
              display: "flex", justifyContent: "space-between",
              fontFamily: TOKENS.display, fontWeight: 900, fontSize: 17, color: TOKENS.ink,
            }}>
              <span>Charge now</span><span>${total}</span>
            </div>
            <button onClick={() => setPhase("booking")} style={{
              appearance: "none", cursor: "pointer", width: "100%",
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10,
              padding: "16px 20px", border: `3px solid ${TOKENS.ink}`, borderRadius: 16,
              background: TOKENS.accent1, color: TOKENS.ink,
              fontFamily: TOKENS.ui, fontSize: 16, fontWeight: 900,
              boxShadow: `5px 5px 0 ${TOKENS.ink}`,
            }}>book everything · ${total} →</button>
          </>
        )}
        {phase === "done" && (
          <button onClick={() => { onComplete(needs.map((s) => s.id)); onClose(); }} style={{
            appearance: "none", cursor: "pointer", width: "100%",
            padding: "16px 20px", border: `3px solid ${TOKENS.ink}`, borderRadius: 16,
            background: TOKENS.accent4, color: TOKENS.paper,
            fontFamily: TOKENS.ui, fontSize: 16, fontWeight: 900,
            boxShadow: `5px 5px 0 ${TOKENS.ink}`,
          }}>back to my pass →</button>
        )}
        <div style={{
          marginTop: 14, padding: "10px 12px",
          background: TOKENS.paper, border: `1.5px dashed ${TOKENS.ink}`, borderRadius: 10,
          fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 700, color: TOKENS.ink,
          opacity: 0.7, lineHeight: 1.4, letterSpacing: ".04em",
        }}>🔒 We hit Stripe + OpenTable + Ticketmaster in parallel. If one fails the rest still book.</div>
      </div>
    </div>
  );
}

function BookingPage() {
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [bookedIds, setBookedIds] = useState(new Set<number>());

  const needsAction = DEMO_STOPS.filter((s) => BOOKING_TYPES[s.booking].action && !bookedIds.has(s.id));
  const total = needsAction.reduce((n, s) => n + BOOKING_TYPES[s.booking].cost, 0);

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
          <button onClick={() => navigate({ to: "/new/pass" })} style={{
            appearance: "none", cursor: "pointer",
            width: 36, height: 36, borderRadius: 999,
            border: `2.5px solid ${TOKENS.ink}`, background: TOKENS.paper,
            fontSize: 14, fontWeight: 900, color: TOKENS.ink, boxShadow: `3px 3px 0 ${TOKENS.ink}`,
          }}>←</button>
          <h2 style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 22, letterSpacing: "-0.035em", margin: 0, color: TOKENS.ink }}>booking</h2>
          <span style={{ width: 36 }} />
        </div>

        <div style={{ position: "relative", zIndex: 2, flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
          {/* Summary CTA */}
          {needsAction.length > 0 ? (
            <button onClick={() => setSheetOpen(true)} style={{
              appearance: "none", cursor: "pointer", width: "100%",
              padding: 14, margin: "0 0 14px",
              border: `3px solid ${TOKENS.ink}`, borderRadius: 14,
              background: TOKENS.ink, color: TOKENS.paper,
              boxShadow: `5px 5px 0 ${TOKENS.accent1}`,
              display: "flex", alignItems: "center", gap: 12, textAlign: "left" as const,
            }}>
              <span style={{
                width: 44, height: 44, borderRadius: 999,
                background: TOKENS.accent1, color: TOKENS.ink,
                border: `2px solid ${TOKENS.paper}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: TOKENS.display, fontWeight: 900, fontSize: 18, flexShrink: 0,
              }}>✣</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".14em", opacity: 0.7 }}>
                  {DEMO_STOPS.length} STOPS · {needsAction.length} NEED ACTION
                </div>
                <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 18, letterSpacing: "-0.025em", marginTop: 2 }}>
                  Book everything · ${total}
                </div>
              </div>
              <span style={{ fontSize: 18, fontWeight: 900 }}>→</span>
            </button>
          ) : (
            <div style={{
              padding: 12, margin: "0 0 14px",
              border: `2.5px solid ${TOKENS.ink}`, borderRadius: 12,
              background: TOKENS.accent4, color: TOKENS.paper,
              boxShadow: `3px 3px 0 ${TOKENS.ink}`,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{ fontSize: 18 }}>✓</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 15 }}>All set · everything booked</div>
                <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 700, opacity: 0.85, marginTop: 2, letterSpacing: ".08em" }}>JUST SHOW UP</div>
              </div>
            </div>
          )}

          {/* Stop list */}
          {DEMO_STOPS.map((stop, i) => {
            const t = BOOKING_TYPES[stop.booking];
            const booked = bookedIds.has(stop.id);
            return (
              <div key={stop.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: 14, marginBottom: 8,
                border: `2.5px solid ${TOKENS.ink}`, borderRadius: 14,
                background: booked ? TOKENS.accent4 : TOKENS.paper,
                color: booked ? TOKENS.paper : TOKENS.ink,
                boxShadow: `4px 4px 0 ${TOKENS.ink}`,
              }}>
                <span style={{
                  width: 40, height: 40, borderRadius: 999, flexShrink: 0,
                  border: `2.5px solid ${booked ? TOKENS.paper : TOKENS.ink}`,
                  background: stop.color, color: TOKENS.ink,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontFamily: TOKENS.display, fontWeight: 900, fontSize: 16,
                }}>{booked ? "✓" : i + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 16, letterSpacing: "-0.02em" }}>{stop.name}</div>
                  <div style={{ marginTop: 4 }}>
                    <BookingPill type={stop.booking} booked={booked} />
                  </div>
                </div>
                {t.action && !booked && (
                  <span style={{ fontFamily: TOKENS.mono, fontSize: 12, fontWeight: 800 }}>${t.cost}</span>
                )}
              </div>
            );
          })}
        </div>

        <BookEverythingSheet
          open={sheetOpen}
          stops={DEMO_STOPS}
          bookedIds={bookedIds}
          onClose={() => setSheetOpen(false)}
          onComplete={(ids) => setBookedIds(new Set([...bookedIds, ...ids]))}
        />
      </div>
    </Frame>
  );
}
