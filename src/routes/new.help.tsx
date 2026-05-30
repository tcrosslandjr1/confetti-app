import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { DotsBg, Frame, TOKENS } from "@/components/new-confetti/shell";

// Port of HelpScreen — design/new-confetti/project/new-screens-3.jsx

export const Route = createFileRoute("/new/help")({
  component: HelpPage,
});

const FAQS = [
  { id: "plan", q: "How does Sparkle plan a night?", a: "Sparkle reads your vibes, taste graph, and city to pick 3 stops with timing, walking route, and budget. Tap any stop to swap it." },
  { id: "paid", q: "When am I charged?", a: "Nothing until you actually book a stop. Some venues hold a small deposit (auto-refunded if you show up)." },
  { id: "cancel", q: "How do I cancel a booking?", a: "Open your pass → tap the stop → 'cancel booking'. Free until 4h before. We push the cancellation to the venue automatically." },
  { id: "family", q: "Is Confetti safe for kids?", a: "Family Mode hides 21+ venues. Kids' faces auto-blur in any photo. We follow COPPA — under-13 needs parental consent." },
  { id: "data", q: "What about my data?", a: "We never sell to advertisers. Your taste is private. You can export everything in Settings → Data → Export." },
  { id: "crew", q: "Can my crew see my location?", a: "Only when you're sharing a live pass with them. You control who sees what, and can disable for any pass." },
  { id: "free", q: "What's the free tier?", a: "3 plans/week, ads on venue pages, adults mode only. All-Access ($9.99/mo) unlocks unlimited + Family + kids parties." },
  { id: "venue", q: "How do venues get verified?", a: "EIN check + in-person walkthrough by a Confetti rep. We confirm kids-menu, EV chargers, and stroller access on-site." },
];

function HelpPage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const visible = q
    ? FAQS.filter((f) => f.q.toLowerCase().includes(q.toLowerCase()) || f.a.toLowerCase().includes(q.toLowerCase()))
    : FAQS;

  return (
    <Frame>
      <div
        style={{
          position: "relative",
          height: "100dvh",
          background: TOKENS.bg,
          display: "flex",
          flexDirection: "column",
          padding: "56px 0 24px",
          overflow: "hidden",
        }}
      >
        <DotsBg opacity={0.05} />

        {/* Header */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            padding: "0 22px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <button onClick={() => navigate({ to: "/new/settings" })} style={backBtn}>←</button>
          <h2 style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 22, letterSpacing: "-0.035em", margin: 0 }}>help</h2>
          <span style={{ width: 36 }} />
        </div>

        {/* Search */}
        <div style={{ position: "relative", zIndex: 2, padding: "0 22px 8px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              border: `2.5px solid ${TOKENS.ink}`,
              borderRadius: 999,
              background: TOKENS.paper,
              boxShadow: `3px 3px 0 ${TOKENS.ink}`,
            }}
          >
            <span style={{ fontSize: 14 }}>🔍</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="search help…"
              style={{ flex: 1, appearance: "none", border: "none", outline: "none", background: "transparent", fontFamily: TOKENS.ui, fontSize: 14, fontWeight: 700, color: TOKENS.ink }}
            />
            {q && (
              <button onClick={() => setQ("")} style={{ appearance: "none", cursor: "pointer", background: "transparent", border: "none", fontSize: 14, fontWeight: 900, color: TOKENS.inkHint }}>✕</button>
            )}
          </div>
        </div>

        {/* FAQ list */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            flex: 1,
            overflowY: "auto",
            padding: "8px 22px 12px",
            scrollbarWidth: "none",
          }}
        >
          {visible.map((f) => {
            const isOpen = open === f.id;
            return (
              <div
                key={f.id}
                style={{
                  marginBottom: 6,
                  border: `2px solid ${TOKENS.ink}`,
                  borderRadius: 12,
                  background: isOpen ? TOKENS.accent2 : TOKENS.paper,
                  overflow: "hidden",
                  transition: "background .2s",
                }}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : f.id)}
                  style={{
                    appearance: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                    padding: "12px 14px",
                    background: "transparent",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontFamily: TOKENS.ui,
                    fontSize: 13,
                    fontWeight: 800,
                    color: TOKENS.ink,
                  }}
                >
                  <span style={{ flex: 1 }}>{f.q}</span>
                  <span style={{ fontSize: 16, color: TOKENS.inkMuted, marginLeft: 8 }}>{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && (
                  <div
                    style={{
                      padding: "0 14px 12px",
                      fontFamily: TOKENS.ui,
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: TOKENS.inkMuted,
                      lineHeight: 1.5,
                    }}
                  >
                    {f.a}
                  </div>
                )}
              </div>
            );
          })}

          {visible.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", fontFamily: TOKENS.mono, fontSize: 11, fontWeight: 700, color: TOKENS.inkHint, letterSpacing: ".06em" }}>
              nothing matches "{q}"
            </div>
          )}

          {/* Contact card */}
          <div
            style={{
              marginTop: 14,
              padding: 14,
              background: TOKENS.accent3,
              color: TOKENS.paper,
              border: `2.5px solid ${TOKENS.ink}`,
              borderRadius: 14,
              boxShadow: `4px 4px 0 ${TOKENS.ink}`,
            }}
          >
            <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".14em", opacity: 0.7 }}>STILL STUCK?</div>
            <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 18, letterSpacing: "-0.025em", marginTop: 2 }}>Talk to a human.</div>
            <div style={{ fontFamily: TOKENS.ui, fontSize: 11.5, fontWeight: 700, opacity: 0.8, marginTop: 4 }}>average reply: 27 min · 7am-11pm ET</div>
            <button
              style={{
                appearance: "none",
                cursor: "pointer",
                marginTop: 10,
                padding: "10px 14px",
                border: `2px solid ${TOKENS.paper}`,
                borderRadius: 10,
                background: TOKENS.paper,
                color: TOKENS.ink,
                fontFamily: TOKENS.display,
                fontWeight: 900,
                fontSize: 13,
                letterSpacing: "-0.02em",
              }}
            >
              📨 send a message
            </button>
          </div>

          {/* System status */}
          <div
            style={{
              marginTop: 10,
              padding: "8px 12px",
              background: "rgba(43,182,115,0.18)",
              border: `1.5px dashed ${TOKENS.ink}`,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: TOKENS.accent4, animation: "cf-pulse 1.4s infinite", flexShrink: 0 }} />
            <span style={{ fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800, letterSpacing: ".06em" }}>
              all systems operational · last incident: 14 days ago
            </span>
          </div>
        </div>
      </div>
    </Frame>
  );
}

const backBtn: React.CSSProperties = {
  appearance: "none",
  cursor: "pointer",
  width: 36,
  height: 36,
  borderRadius: 999,
  border: `2.5px solid ${TOKENS.ink}`,
  background: TOKENS.paper,
  fontSize: 14,
  fontWeight: 900,
  boxShadow: `3px 3px 0 ${TOKENS.ink}`,
};
