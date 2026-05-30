import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Frame, TOKENS } from "@/components/new-confetti/shell";

// Port of AdvertiseScreen — design/new-confetti/project/new-screens-2.jsx

export const Route = createFileRoute("/new/advertise")({
  component: AdvertisePage,
});

const PRODUCTS = [
  { id: "feat", e: "⭐", l: "Featured Listing", d: "appear higher in local recs · 3× tap rate" },
  { id: "boost", e: "🚀", l: "Event Boost", d: "promote happy hours, brunches, launches" },
  { id: "plan", e: "✣", l: "AI Plan Placement", d: "show up inside Sparkle-generated passes" },
  { id: "data", e: "📊", l: "Analytics", d: "views, saves, clicks, bookings" },
];

const TIERS = [
  { id: "silver", l: "Silver", price: 49, sub: "starter visibility", popular: false, feats: ["Featured listing in your neighborhood", "Basic analytics", "Verified ✓ badge"] },
  { id: "gold", l: "Gold", price: 149, sub: "most businesses pick this", popular: true, feats: ["Top 3 in Explore + city", "Event Boost (4/mo)", "AI Plan Placement", "Full analytics dashboard"] },
  { id: "platinum", l: "Platinum", price: 399, sub: "first-class placement", popular: false, feats: ["Sparkle auto-recommends", "Unlimited Event Boost", "Co-branded crew-of-the-week", "Dedicated rep + first-party data"] },
];

const AUDIENCE = [
  { e: "🌹", l: "date nights" },
  { e: "🎂", l: "birthdays" },
  { e: "🥞", l: "brunches" },
  { e: "🌙", l: "nightlife" },
  { e: "👯", l: "group plans" },
];

function AdvertisePage() {
  const navigate = useNavigate();
  const [tier, setTier] = useState("gold");
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const selectedTier = TIERS.find((t) => t.id === tier)!;

  return (
    <Frame>
      <div
        style={{
          position: "relative",
          height: "100dvh",
          background: TOKENS.ink,
          color: TOKENS.paper,
          display: "flex",
          flexDirection: "column",
          padding: "56px 0 24px",
          overflow: "hidden",
        }}
      >
        {/* Dot pattern */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.12, backgroundImage: `radial-gradient(${TOKENS.paper} 1px, transparent 1px)`, backgroundSize: "24px 24px" }} />

        {/* Header */}
        <div style={{ position: "relative", zIndex: 2, padding: "0 22px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => navigate({ to: "/new/hub" })} style={{ appearance: "none", cursor: "pointer", width: 36, height: 36, borderRadius: 999, border: `2.5px solid ${TOKENS.paper}`, background: "transparent", color: TOKENS.paper, fontSize: 14, fontWeight: 900 }}>←</button>
          <span style={{ fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800, letterSpacing: ".16em", opacity: 0.7 }}>GROW WITH CONFETTI</span>
          <span style={{ width: 36 }} />
        </div>

        <div style={{ position: "relative", zIndex: 2, flex: 1, overflowY: "auto", padding: "0 22px 12px", scrollbarWidth: "none" }}>
          {/* Hero */}
          <h1 style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 34, lineHeight: 0.92, letterSpacing: "-0.045em", margin: "0 0 8px" }}>
            Get discovered<br />when people are{" "}
            <span style={{ color: TOKENS.accent1 }}>choosing</span> where to go.
          </h1>
          <p style={{ fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 600, opacity: 0.75, margin: "0 0 18px", lineHeight: 1.45 }}>
            Confetti recommends places at the exact moment 50k+ users are planning their night, day, or party — not search results, not feed ads. Pay flat. Cancel any time.
          </p>

          {/* Audience */}
          <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".14em", opacity: 0.6, marginBottom: 6 }}>WHO YOU'LL REACH</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
            {AUDIENCE.map((a) => (
              <span key={a.l} style={{ padding: "6px 12px", border: `2px solid ${TOKENS.paper}`, borderRadius: 999, background: "rgba(255,250,240,0.08)", color: TOKENS.paper, fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 800 }}>
                {a.e} {a.l}
              </span>
            ))}
          </div>

          {/* Products grid */}
          <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".14em", opacity: 0.6, marginBottom: 6 }}>WHAT YOU GET</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 18 }}>
            {PRODUCTS.map((p) => (
              <div key={p.id} style={{ padding: 12, background: "rgba(255,250,240,0.08)", border: `1.5px solid ${TOKENS.paper}`, borderRadius: 12 }}>
                <div style={{ fontSize: 20, lineHeight: 1, marginBottom: 4 }}>{p.e}</div>
                <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 13, letterSpacing: "-0.02em", lineHeight: 1.1 }}>{p.l}</div>
                <div style={{ fontFamily: TOKENS.ui, fontSize: 10.5, fontWeight: 700, opacity: 0.7, marginTop: 3, lineHeight: 1.3 }}>{p.d}</div>
              </div>
            ))}
          </div>

          {/* Tiers */}
          <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".14em", opacity: 0.6, marginBottom: 6 }}>PLANS</div>
          {TIERS.map((t) => (
            <button key={t.id} onClick={() => setTier(t.id)} style={{ appearance: "none", cursor: "pointer", textAlign: "left", width: "100%", position: "relative", padding: 14, marginBottom: 10, border: `2.5px solid ${TOKENS.paper}`, borderRadius: 14, background: tier === t.id ? TOKENS.accent1 : "rgba(255,250,240,0.06)", color: tier === t.id ? TOKENS.ink : TOKENS.paper, boxShadow: tier === t.id ? `5px 5px 0 ${TOKENS.paper}` : "none", transition: "all .15s" }}>
              {t.popular && (
                <span style={{ position: "absolute", top: -8, right: 10, padding: "3px 8px", background: TOKENS.accent4, color: TOKENS.ink, border: `2px solid ${TOKENS.ink}`, borderRadius: 999, fontFamily: TOKENS.mono, fontSize: 8.5, fontWeight: 800, letterSpacing: ".1em" }}>★ MOST POPULAR</span>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 22, letterSpacing: "-0.03em" }}>{t.l}</span>
                <span style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 22, letterSpacing: "-0.025em" }}>
                  ${t.price}<span style={{ fontSize: 11, opacity: 0.65, fontFamily: TOKENS.mono, letterSpacing: ".04em" }}>/mo</span>
                </span>
              </div>
              <div style={{ fontFamily: TOKENS.ui, fontSize: 11, fontWeight: 700, opacity: 0.75, marginBottom: 8 }}>{t.sub}</div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 3, fontFamily: TOKENS.mono, fontSize: 9.5, fontWeight: 700, letterSpacing: ".04em", opacity: 0.85 }}>
                {t.feats.map((f, i) => <li key={i}>· {f}</li>)}
              </ul>
            </button>
          ))}

          {/* Social proof */}
          <div style={{ padding: 12, marginBottom: 8, border: "1.5px dashed rgba(255,250,240,0.4)", borderRadius: 10, fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 700, letterSpacing: ".04em", opacity: 0.75, lineHeight: 1.5 }}>
            <div style={{ marginBottom: 4 }}><b>428 verified venues</b> · BK + Manhattan · avg conv: 11.2%</div>
            "32 new bookings the first week." <i>— Westlight rooftop</i><br />
            "Sold out our brunch in 3 hours." <i>— Olmsted</i>
          </div>

          {/* Lead form */}
          {showForm && !submitted && (
            <div style={{ padding: 14, marginTop: 10, background: "rgba(255,250,240,0.06)", border: `2px solid ${TOKENS.paper}`, borderRadius: 14 }}>
              <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 18, letterSpacing: "-0.025em", marginBottom: 10 }}>Tell us about you.</div>
              {[
                { l: "business name", ph: "Lupa Notte" },
                { l: "city", ph: "Brooklyn, NY" },
                { l: "instagram", ph: "@lupanotte" },
                { l: "contact email", ph: "hi@lupanotte.com" },
              ].map((f) => (
                <div key={f.l} style={{ marginBottom: 8 }}>
                  <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".14em", opacity: 0.65, marginBottom: 4, textTransform: "uppercase" }}>{f.l}</div>
                  <input placeholder={f.ph} style={{ width: "100%", padding: "10px 12px", border: `2px solid ${TOKENS.paper}`, borderRadius: 10, background: "rgba(0,0,0,0.4)", color: TOKENS.paper, fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 700, outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}
              <button onClick={() => setSubmitted(true)} style={{ appearance: "none", cursor: "pointer", width: "100%", marginTop: 6, padding: "12px 14px", border: `2.5px solid ${TOKENS.paper}`, borderRadius: 10, background: TOKENS.accent4, color: TOKENS.ink, fontFamily: TOKENS.display, fontWeight: 900, fontSize: 14, letterSpacing: "-0.02em" }}>
                send · we reply in 24h →
              </button>
            </div>
          )}

          {submitted && (
            <div style={{ padding: 14, marginTop: 10, background: "rgba(43,182,115,0.2)", border: `2px solid ${TOKENS.paper}`, borderRadius: 14, textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
              <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 18 }}>You're on the list!</div>
              <div style={{ fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 700, opacity: 0.8, marginTop: 6 }}>We'll reply within 24 hours with next steps.</div>
            </div>
          )}
        </div>

        {!submitted && (
          <div style={{ position: "relative", zIndex: 2, padding: "12px 22px 0" }}>
            <button onClick={() => setShowForm(true)} style={{ appearance: "none", cursor: "pointer", width: "100%", padding: "14px 16px", border: `3px solid ${TOKENS.paper}`, borderRadius: 14, background: TOKENS.accent1, color: TOKENS.ink, fontFamily: TOKENS.display, fontWeight: 900, fontSize: 17, letterSpacing: "-0.02em", boxShadow: `5px 5px 0 ${TOKENS.paper}` }}>
              start with {selectedTier.l} · ${selectedTier.price}/mo →
            </button>
            <div style={{ marginTop: 8, textAlign: "center", fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 700, opacity: 0.5, letterSpacing: ".12em" }}>
              FIRST 30 DAYS FREE · CANCEL ANY TIME
            </div>
          </div>
        )}
      </div>
    </Frame>
  );
}
