import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { DotsBg, Frame, TOKENS } from "@/components/new-confetti/shell";

// Port of ManageSubscriptionScreen — design/new-confetti/project/new-screens-2.jsx

export const Route = createFileRoute("/new/manage-subscription")({
  component: ManageSubscriptionPage,
});

type Phase = "main" | "reason" | "offer" | "confirm" | "gone";

interface CancelReason {
  id: string;
  l: string;
  offer: "pause" | "downgrade" | "contact" | "survey";
}

const REASONS: CancelReason[] = [
  { id: "cost", l: "Too expensive", offer: "pause" },
  { id: "unused", l: "Not using it enough", offer: "pause" },
  { id: "features", l: "Don't need the features", offer: "downgrade" },
  { id: "bugs", l: "App issues / bugs", offer: "contact" },
  { id: "moved", l: "Moved out of city", offer: "pause" },
  { id: "other", l: "Other", offer: "survey" },
];

const USAGE = [
  { l: "plans made", v: "32", cap: "unlimited" },
  { l: "stops booked", v: "18", cap: "6 free" },
  { l: "saved this month", v: "$156", cap: "vs free tier" },
  { l: "points earned", v: "4,250", cap: "2× multiplier" },
];

const HISTORY = [
  { date: "May 1, 2026", desc: "all-access · yearly", amt: "$99.00" },
  { date: "May 1, 2025", desc: "all-access · yearly", amt: "$99.00" },
  { date: "Apr 1, 2025", desc: "all-access · monthly upgrade", amt: "$9.99" },
];

const OFFERS: Record<string, { e: string; t: string; d: string; cta: string }> = {
  pause: { e: "⏸", t: "Pause for 30 days", d: "Keep your data, no charges. Come back any time.", cta: "pause for 30 days" },
  downgrade: { e: "↓", t: "Try Lite tier", d: "$4.99/mo · unlimited plans + family mode only.", cta: "switch to lite" },
  contact: { e: "💬", t: "Talk to support", d: "A real human responds within 4 hours.", cta: "message support" },
  survey: { e: "📝", t: "50% off next month", d: "Give us 30 sec of feedback, get $5 off May.", cta: "take 30-sec survey" },
};

function ManageSubscriptionPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("main");
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");
  const [reason, setReason] = useState<CancelReason | null>(null);

  // ─── Cancelled state ─────────────────────────
  if (phase === "gone") {
    return (
      <Frame>
        <div style={{ position: "relative", height: "100dvh", background: TOKENS.bg, display: "flex", flexDirection: "column", padding: "56px 22px 24px", overflow: "hidden" }}>
          <DotsBg opacity={0.05} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 14 }}>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 88, height: 88, borderRadius: "50%", background: TOKENS.accent2, border: `3px solid ${TOKENS.ink}`, boxShadow: `5px 5px 0 ${TOKENS.ink}`, fontSize: 38 }}>✕</span>
            <h2 style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 30, letterSpacing: "-0.04em", margin: 0 }}>cancelled.</h2>
            <p style={{ fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 700, color: TOKENS.inkMuted, maxWidth: 280, margin: 0, lineHeight: 1.45 }}>
              You keep All-Access until <b>jun 1, 2026</b>. After that you'll be on the free tier — 3 plans/week, ads visible, family mode off.
            </p>
            <div style={{ padding: "10px 12px", background: TOKENS.paper, border: `2px solid ${TOKENS.ink}`, borderRadius: 10, fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 700, letterSpacing: ".06em", maxWidth: 280, lineHeight: 1.4 }}>
              📧 confirmation sent to jess@brooklyn.com<br />scrapbook + saves stay with you forever
            </div>
            <button onClick={() => setPhase("main")} style={secondaryBtn}>actually, keep me subscribed ↻</button>
            <button onClick={() => navigate({ to: "/new/settings" })} style={{ appearance: "none", cursor: "pointer", background: "transparent", border: "none", padding: 6, fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 700, color: TOKENS.inkHint, letterSpacing: ".1em" }}>BACK TO SETTINGS</button>
          </div>
        </div>
      </Frame>
    );
  }

  // ─── Reason picker ────────────────────────────
  if (phase === "reason") {
    return (
      <Frame>
        <div style={{ position: "relative", height: "100dvh", background: TOKENS.bg, display: "flex", flexDirection: "column", padding: "56px 22px 24px", overflow: "hidden" }}>
          <DotsBg opacity={0.05} />
          <div style={{ marginBottom: 14 }}><button onClick={() => setPhase("main")} style={backBtn}>←</button></div>
          <h2 style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 30, letterSpacing: "-0.04em", margin: "0 0 6px" }}>before you go…</h2>
          <p style={{ fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 700, color: TOKENS.inkMuted, margin: "0 0 18px", lineHeight: 1.4 }}>Why are you cancelling? It helps us improve.</p>
          <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", display: "flex", flexDirection: "column", gap: 8 }}>
            {REASONS.map((r) => (
              <button key={r.id} onClick={() => { setReason(r); setPhase("offer"); }} style={{ appearance: "none", cursor: "pointer", textAlign: "left", padding: "14px 16px", border: `2.5px solid ${TOKENS.ink}`, borderRadius: 12, background: reason?.id === r.id ? TOKENS.accent1 : TOKENS.paper, fontFamily: TOKENS.ui, fontSize: 14, fontWeight: 800, color: TOKENS.ink, boxShadow: `3px 3px 0 ${TOKENS.ink}` }}>
                {r.l} →
              </button>
            ))}
          </div>
        </div>
      </Frame>
    );
  }

  // ─── Retention offer ──────────────────────────
  if (phase === "offer" && reason) {
    const o = OFFERS[reason.offer];
    return (
      <Frame>
        <div style={{ position: "relative", height: "100dvh", background: TOKENS.bg, display: "flex", flexDirection: "column", padding: "56px 22px 24px", overflow: "hidden" }}>
          <DotsBg opacity={0.05} />
          <div style={{ marginBottom: 14 }}><button onClick={() => setPhase("reason")} style={backBtn}>←</button></div>
          <span style={{ fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800, letterSpacing: ".14em", color: TOKENS.inkHint }}>YOU SAID: {reason.l.toUpperCase()}</span>
          <h2 style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 28, letterSpacing: "-0.04em", margin: "6px 0 14px" }}>How about this instead?</h2>
          <div style={{ padding: 18, marginBottom: 14, border: `3px solid ${TOKENS.ink}`, borderRadius: 18, background: TOKENS.accent2, boxShadow: `6px 6px 0 ${TOKENS.ink}` }}>
            <span style={{ fontSize: 40, lineHeight: 1, display: "block" }}>{o.e}</span>
            <h3 style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 22, letterSpacing: "-0.03em", margin: "8px 0 4px" }}>{o.t}</h3>
            <p style={{ fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 700, color: TOKENS.inkMuted, margin: 0, lineHeight: 1.4 }}>{o.d}</p>
            <button onClick={() => setPhase("main")} style={{ appearance: "none", cursor: "pointer", width: "100%", marginTop: 12, padding: "12px 14px", border: `2.5px solid ${TOKENS.ink}`, borderRadius: 12, background: TOKENS.ink, color: TOKENS.paper, fontFamily: TOKENS.display, fontWeight: 900, fontSize: 14, letterSpacing: "-0.02em" }}>{o.cta}</button>
          </div>
          <button onClick={() => setPhase("confirm")} style={{ appearance: "none", cursor: "pointer", padding: "12px 14px", border: `2px dashed ${TOKENS.ink}`, borderRadius: 10, background: "transparent", color: TOKENS.ink, fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 700, letterSpacing: ".08em", opacity: 0.7 }}>
            no thanks — cancel anyway →
          </button>
        </div>
      </Frame>
    );
  }

  // ─── Confirm cancel ───────────────────────────
  if (phase === "confirm") {
    return (
      <Frame>
        <div style={{ position: "relative", height: "100dvh", background: TOKENS.bg, display: "flex", flexDirection: "column", padding: "56px 22px 24px", overflow: "hidden" }}>
          <DotsBg opacity={0.05} />
          <div style={{ marginBottom: 14 }}><button onClick={() => setPhase("offer")} style={backBtn}>←</button></div>
          <h2 style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 28, letterSpacing: "-0.04em", margin: "0 0 14px" }}>You'll lose these.</h2>
          <div style={{ padding: 12, marginBottom: 14, background: "rgba(211,35,35,0.1)", border: `2.5px solid ${TOKENS.ink}`, borderRadius: 12 }}>
            {["Unlimited plans (back to 3/week)", "Family Mode + kids parties", "Pre-order menus at verified venues", "2× points multiplier", "TikTok taste sync", "Per-stop reel cloning"].map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderTop: i ? "1px dashed rgba(0,0,0,0.15)" : "none", fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 700, color: TOKENS.ink }}>
                <span style={{ color: "#d32323", fontWeight: 900, fontSize: 14 }}>✕</span>{f}
              </div>
            ))}
          </div>
          <div style={{ padding: "10px 12px", marginBottom: 14, background: "rgba(43,182,115,0.18)", border: `1.5px dashed ${TOKENS.ink}`, borderRadius: 10, fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 700, letterSpacing: ".06em", lineHeight: 1.4 }}>
            ✓ Your scrapbook + saves + check-ins stay with you forever, free.
          </div>
          <div style={{ marginTop: "auto" }}>
            <button onClick={() => setPhase("gone")} style={{ appearance: "none", cursor: "pointer", width: "100%", padding: "14px 16px", border: `3px solid ${TOKENS.ink}`, borderRadius: 14, background: "#d32323", color: "#fff", fontFamily: TOKENS.display, fontWeight: 900, fontSize: 16, letterSpacing: "-0.02em", boxShadow: `5px 5px 0 ${TOKENS.ink}` }}>
              yes, cancel All-Access
            </button>
            <button onClick={() => setPhase("main")} style={{ appearance: "none", cursor: "pointer", width: "100%", marginTop: 8, padding: "12px 14px", border: `2.5px solid ${TOKENS.ink}`, borderRadius: 12, background: TOKENS.paper, color: TOKENS.ink, fontFamily: TOKENS.ui, fontWeight: 800, fontSize: 13 }}>
              keep my plan
            </button>
          </div>
        </div>
      </Frame>
    );
  }

  // ─── Main view ────────────────────────────────
  return (
    <Frame>
      <div style={{ position: "relative", height: "100dvh", background: TOKENS.bg, display: "flex", flexDirection: "column", padding: "56px 0 24px", overflow: "hidden" }}>
        <DotsBg opacity={0.05} />
        <div style={{ position: "relative", zIndex: 2, padding: "0 22px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => navigate({ to: "/new/settings" })} style={backBtn}>←</button>
          <h2 style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 22, letterSpacing: "-0.035em", margin: 0 }}>manage plan</h2>
          <span style={{ width: 36 }} />
        </div>

        <div style={{ position: "relative", zIndex: 2, flex: 1, overflowY: "auto", padding: "0 22px 12px", scrollbarWidth: "none" }}>
          {/* Current plan card */}
          <div style={{ padding: 18, marginBottom: 14, border: `3px solid ${TOKENS.ink}`, borderRadius: 18, background: TOKENS.accent3, color: TOKENS.paper, boxShadow: `6px 6px 0 ${TOKENS.ink}` }}>
            <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".16em", opacity: 0.85 }}>YOUR PLAN · ACTIVE</div>
            <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 28, letterSpacing: "-0.04em", marginTop: 6, lineHeight: 1 }}>✦ all-access</div>
            <div style={{ fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 700, opacity: 0.85, marginTop: 6 }}>renews jun 1 · $99/yr ($8.25/mo equiv)</div>
            <div style={{ marginTop: 12, padding: "6px 10px", background: "rgba(0,0,0,0.25)", border: "1.5px solid rgba(255,255,255,0.4)", borderRadius: 8, fontFamily: TOKENS.mono, fontSize: 9.5, fontWeight: 700, letterSpacing: ".06em", display: "inline-block" }}>
              visa •••• 4242 · expires 09/27
            </div>
          </div>

          {/* Usage */}
          <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".14em", color: TOKENS.inkHint, marginBottom: 8, textTransform: "uppercase" }}>your value · this month</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 16 }}>
            {USAGE.map((u, i) => (
              <div key={i} style={{ padding: 10, border: `2px solid ${TOKENS.ink}`, borderRadius: 10, background: TOKENS.paper, boxShadow: `2px 2px 0 ${TOKENS.ink}` }}>
                <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".12em", color: TOKENS.inkHint, textTransform: "uppercase" }}>{u.l}</div>
                <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 22, letterSpacing: "-0.03em", marginTop: 2 }}>{u.v}</div>
                <div style={{ fontFamily: TOKENS.mono, fontSize: 8.5, fontWeight: 700, color: TOKENS.inkHint, marginTop: 1, letterSpacing: ".04em" }}>{u.cap}</div>
              </div>
            ))}
          </div>

          {/* Billing cycle */}
          <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".14em", color: TOKENS.inkHint, marginBottom: 8, textTransform: "uppercase" }}>billing cycle</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
            {([["monthly", "monthly", "$9.99/mo", null], ["yearly", "yearly", "$99/yr", "save $20"]] as const).map(([id, l, p, save]) => (
              <button key={id} onClick={() => setBilling(id)} style={{ appearance: "none", cursor: "pointer", textAlign: "left", padding: 12, border: `2.5px solid ${TOKENS.ink}`, borderRadius: 12, background: billing === id ? TOKENS.accent1 : TOKENS.paper, color: TOKENS.ink, boxShadow: billing === id ? "none" : `3px 3px 0 ${TOKENS.ink}`, transition: "all .15s" }}>
                <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 16, letterSpacing: "-0.025em" }}>{l}</div>
                <div style={{ fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 700, marginTop: 2, letterSpacing: ".04em" }}>{p}</div>
                {save && <div style={{ marginTop: 4, display: "inline-block", padding: "2px 7px", background: TOKENS.accent4, border: `1.5px solid ${TOKENS.ink}`, borderRadius: 999, fontFamily: TOKENS.mono, fontSize: 8.5, fontWeight: 800, letterSpacing: ".06em" }}>{save}</div>}
              </button>
            ))}
          </div>

          {/* Billing history */}
          <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".14em", color: TOKENS.inkHint, marginBottom: 8, textTransform: "uppercase" }}>billing history</div>
          <div style={{ padding: 12, marginBottom: 16, border: `2.5px solid ${TOKENS.ink}`, borderRadius: 12, background: TOKENS.paper, boxShadow: `3px 3px 0 ${TOKENS.ink}` }}>
            {HISTORY.map((h, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderTop: i ? "1px dashed rgba(0,0,0,0.15)" : "none" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 800, color: TOKENS.ink }}>{h.desc}</div>
                  <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 700, color: TOKENS.inkHint, marginTop: 1, letterSpacing: ".04em" }}>{h.date} · receipt available</div>
                </div>
                <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 14 }}>{h.amt}</div>
              </div>
            ))}
          </div>

          <button onClick={() => navigate({ to: "/new/payment" })} style={{ appearance: "none", cursor: "pointer", width: "100%", padding: "14px 16px", marginBottom: 8, border: `2.5px solid ${TOKENS.ink}`, borderRadius: 12, background: TOKENS.paper, color: TOKENS.ink, fontFamily: TOKENS.ui, fontWeight: 800, fontSize: 13, boxShadow: `3px 3px 0 ${TOKENS.ink}` }}>
            💳 update payment method
          </button>
          <button onClick={() => setPhase("reason")} style={{ appearance: "none", cursor: "pointer", width: "100%", padding: "12px 16px", border: `2px dashed ${TOKENS.ink}`, borderRadius: 12, background: "transparent", color: TOKENS.ink, fontFamily: TOKENS.mono, fontSize: 11, fontWeight: 800, letterSpacing: ".06em", opacity: 0.7 }}>
            pause or cancel subscription
          </button>
        </div>
      </div>
    </Frame>
  );
}

const backBtn: React.CSSProperties = { appearance: "none", cursor: "pointer", width: 36, height: 36, borderRadius: 999, border: `2.5px solid ${TOKENS.ink}`, background: TOKENS.paper, fontSize: 14, fontWeight: 900, boxShadow: `3px 3px 0 ${TOKENS.ink}` };
const secondaryBtn: React.CSSProperties = { appearance: "none", cursor: "pointer", marginTop: 4, padding: "10px 14px", border: `2px solid ${TOKENS.ink}`, borderRadius: 999, background: TOKENS.accent1, color: TOKENS.ink, fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 800, boxShadow: `3px 3px 0 ${TOKENS.ink}` };
