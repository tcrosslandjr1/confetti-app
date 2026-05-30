import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { DotsBg, Frame, TOKENS } from "@/components/new-confetti/shell";

// Port of PaymentScreen — design/new-confetti/project/new-screens-2.jsx

export const Route = createFileRoute("/new/payment")({
  component: PaymentPage,
  validateSearch: (s: Record<string, unknown>) => ({
    amount: Number(s.amount ?? 99),
    label: String(s.label ?? "all-access · yearly"),
    returnTo: String(s.returnTo ?? "/new/hub"),
  }),
});

type Phase = "entry" | "processing" | "done";

function PaymentPage() {
  const navigate = useNavigate();
  const { amount, label, returnTo } = useSearch({ from: "/new/payment" });
  const [phase, setPhase] = useState<Phase>("entry");

  const pay = () => {
    setPhase("processing");
    setTimeout(() => setPhase("done"), 1600);
  };

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
          <button onClick={() => navigate({ to: returnTo as never })} style={backBtn}>←</button>
          <span style={{ fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800, letterSpacing: ".14em", color: TOKENS.inkHint }}>
            🔒 SECURE · STRIPE
          </span>
          <span style={{ width: 36 }} />
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 2,
            flex: 1,
            overflowY: "auto",
            padding: "0 22px 12px",
            scrollbarWidth: "none",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {phase === "entry" && (
            <>
              <h1 style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 28, letterSpacing: "-0.04em", margin: "0 0 14px" }}>
                ${amount}.00
              </h1>
              <div style={{ fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 700, color: TOKENS.inkHint, marginBottom: 18 }}>
                {label}
              </div>

              {/* Card fields */}
              <FieldRow label="card number" placeholder="4242 4242 4242 4242" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <FieldRow label="exp" placeholder="MM/YY" />
                <FieldRow label="cvc" placeholder="123" />
                <FieldRow label="zip" placeholder="11211" />
              </div>

              {/* Divider */}
              <div style={{ margin: "10px 0", display: "flex", alignItems: "center", gap: 10, fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 700, color: TOKENS.inkHint, letterSpacing: ".12em" }}>
                <div style={{ flex: 1, height: 2, background: TOKENS.ink, opacity: 0.15 }} />
                OR ONE-TAP
                <div style={{ flex: 1, height: 2, background: TOKENS.ink, opacity: 0.15 }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <button style={{ appearance: "none", cursor: "pointer", padding: "14px 12px", border: `2.5px solid ${TOKENS.ink}`, borderRadius: 12, background: TOKENS.ink, color: TOKENS.paper, fontFamily: TOKENS.display, fontWeight: 900, fontSize: 16, letterSpacing: "-0.02em", boxShadow: `3px 3px 0 ${TOKENS.ink}` }}>
                   Pay
                </button>
                <button style={{ appearance: "none", cursor: "pointer", padding: "14px 12px", border: `2.5px solid ${TOKENS.ink}`, borderRadius: 12, background: TOKENS.paper, color: TOKENS.ink, fontFamily: TOKENS.display, fontWeight: 900, fontSize: 16, letterSpacing: "-0.02em", boxShadow: `3px 3px 0 ${TOKENS.ink}` }}>
                  G Pay
                </button>
              </div>

              {/* Trust strip */}
              <div style={{ marginTop: 16, padding: "8px 10px", background: TOKENS.paper, border: `1.5px dashed ${TOKENS.ink}`, borderRadius: 8, fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 700, letterSpacing: ".08em", color: TOKENS.inkHint, textAlign: "center" }}>
                🔒 256-bit SSL · STRIPE PCI-DSS · NO CARD STORED
              </div>
            </>
          )}

          {phase === "processing" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 14 }}>
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 80, height: 80, borderRadius: "50%", background: TOKENS.accent1, border: `3px solid ${TOKENS.ink}`, boxShadow: `4px 4px 0 ${TOKENS.ink}`, animation: "cf-spin 1.4s linear infinite", fontFamily: TOKENS.display, fontWeight: 900, fontSize: 32 }}>✣</span>
              <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 22, letterSpacing: "-0.035em" }}>processing…</div>
              <div style={{ fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 700, letterSpacing: ".12em", color: TOKENS.inkHint }}>STRIPE · DON'T REFRESH</div>
            </div>
          )}

          {phase === "done" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 14 }}>
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 88, height: 88, borderRadius: "50%", background: TOKENS.accent4, border: `3px solid ${TOKENS.ink}`, boxShadow: `5px 5px 0 ${TOKENS.ink}`, fontSize: 44, color: TOKENS.ink, animation: "cf-pop 0.45s ease-out" }}>
                ✓
              </span>
              <h2 style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 32, letterSpacing: "-0.04em", margin: 0 }}>paid!</h2>
              <div style={{ fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 700, color: TOKENS.inkMuted, maxWidth: 260, lineHeight: 1.4 }}>
                ${amount} charged to visa •••• 4242. Receipt sent to your email.
              </div>
              <button onClick={() => navigate({ to: returnTo as never })} style={{ appearance: "none", cursor: "pointer", padding: "14px 24px", border: `3px solid ${TOKENS.ink}`, borderRadius: 14, background: TOKENS.accent1, color: TOKENS.ink, fontFamily: TOKENS.display, fontWeight: 900, fontSize: 15, letterSpacing: "-0.02em", boxShadow: `5px 5px 0 ${TOKENS.ink}` }}>
                continue →
              </button>
            </div>
          )}
        </div>

        {phase === "entry" && (
          <div style={{ position: "relative", zIndex: 2, padding: "12px 22px 0" }}>
            <button onClick={pay} style={{ appearance: "none", cursor: "pointer", width: "100%", padding: "14px 16px", border: `3px solid ${TOKENS.ink}`, borderRadius: 14, background: TOKENS.accent1, color: TOKENS.ink, fontFamily: TOKENS.display, fontWeight: 900, fontSize: 17, letterSpacing: "-0.02em", boxShadow: `5px 5px 0 ${TOKENS.ink}` }}>
              pay ${amount} →
            </button>
          </div>
        )}
      </div>
    </Frame>
  );
}

function FieldRow({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".14em", color: TOKENS.inkHint, marginBottom: 4 }}>
        {label.toUpperCase()}
      </div>
      <input
        placeholder={placeholder}
        style={{ width: "100%", padding: "11px 12px", border: `2.5px solid ${TOKENS.ink}`, borderRadius: 10, background: TOKENS.paper, fontFamily: TOKENS.mono, fontSize: 13, fontWeight: 700, color: TOKENS.ink, boxSizing: "border-box", outline: "none" }}
      />
    </div>
  );
}

const backBtn: React.CSSProperties = { appearance: "none", cursor: "pointer", width: 36, height: 36, borderRadius: 999, border: `2.5px solid ${TOKENS.ink}`, background: TOKENS.paper, fontSize: 14, fontWeight: 900, boxShadow: `3px 3px 0 ${TOKENS.ink}` };
