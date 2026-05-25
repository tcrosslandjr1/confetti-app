import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  BrandMark, ChunkyButton, Frame, Icons, Stamp, Ticket, TOKENS,
} from "@/components/new-confetti/shell";

// Slim port — design/new-confetti/project/stripe.jsx (StripeCheckoutScreen, line 7)
export const Route = createFileRoute("/new/stripe")({
  component: StripePage,
});

function StripePage() {
  const navigate = useNavigate();
  const [plan, setPlan] = useState<"monthly" | "yearly">("yearly");
  const [card, setCard] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [zip, setZip] = useState("");

  const total = plan === "yearly" ? "$96 / yr" : "$10 / mo";

  return (
    <Frame>
      <div style={{
        position: "relative", height: "100%", background: TOKENS.bg,
        display: "flex", flexDirection: "column",
        padding: "56px 20px 22px", overflow: "hidden",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 14,
        }}>
          <button onClick={() => navigate({ to: "/new/all-access" })} style={backBtn()}>←</button>
          <BrandMark size={17} />
          <span style={{ width: 36 }} />
        </div>

        <Stamp color={TOKENS.accent2} rotate={-3} style={{ alignSelf: "flex-start" }}>secure · stripe</Stamp>
        <h1 style={{
          fontFamily: TOKENS.display, fontWeight: 900,
          fontSize: 36, lineHeight: 0.92, letterSpacing: "-0.04em",
          margin: "10px 0 14px",
        }}>One last<br/>tap.</h1>

        {/* Plan toggle */}
        <Ticket color={TOKENS.paper} notch style={{ padding: 12, marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {(["monthly", "yearly"] as const).map((p) => (
              <button key={p} onClick={() => setPlan(p)} style={{
                appearance: "none", cursor: "pointer", flex: 1,
                padding: "10px 12px", borderRadius: 12,
                border: `2.5px solid ${TOKENS.ink}`,
                background: plan === p ? TOKENS.accent2 : TOKENS.bg,
                fontFamily: TOKENS.mono, fontSize: 11, fontWeight: 800,
                letterSpacing: ".12em", textTransform: "uppercase",
              }}>{p} · {p === "yearly" ? "$96" : "$10"}</button>
            ))}
          </div>
        </Ticket>

        <div style={{
          flex: 1, overflowY: "auto", scrollbarWidth: "none",
          marginRight: -20, paddingRight: 20,
        }}>
          <Field label="card number" placeholder="1234 5678 9012 3456"
            value={card} onChange={setCard} />
          <div style={{ display: "flex", gap: 8 }}>
            <Field label="exp" placeholder="MM/YY" value={exp} onChange={setExp} />
            <Field label="cvc" placeholder="123" value={cvc} onChange={setCvc} />
          </div>
          <Field label="zip" placeholder="11211" value={zip} onChange={setZip} />

          <div style={{
            fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 700,
            opacity: 0.6, marginTop: 14, letterSpacing: ".06em", textAlign: "center",
          }}>🔒 stripe handles your card. confetti never sees it.</div>
        </div>

        <div style={{ marginTop: 12 }}>
          <ChunkyButton variant="accent" onClick={() => navigate({ to: "/new/checkout-return" })}
            icon={Icons.arrow}>pay {total}</ChunkyButton>
        </div>
      </div>
    </Frame>
  );
}

function Field({ label, placeholder, value, onChange }: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div style={{ flex: 1, marginBottom: 10 }}>
      <div style={{
        fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800,
        letterSpacing: ".14em", opacity: 0.55, marginBottom: 4,
        textTransform: "uppercase",
      }}>{label}</div>
      <input
        value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{
          width: "100%", padding: "12px 14px", boxSizing: "border-box",
          border: `2.5px solid ${TOKENS.ink}`, borderRadius: 12,
          background: TOKENS.paper, color: TOKENS.ink,
          fontFamily: TOKENS.mono, fontSize: 14, fontWeight: 700,
          letterSpacing: ".04em", outline: "none",
        }}
      />
    </div>
  );
}

function backBtn(): React.CSSProperties {
  return {
    appearance: "none", cursor: "pointer",
    width: 36, height: 36, borderRadius: 999,
    border: `2.5px solid ${TOKENS.ink}`, background: TOKENS.paper,
    fontSize: 14, fontWeight: 900, boxShadow: `3px 3px 0 ${TOKENS.ink}`,
  };
}
