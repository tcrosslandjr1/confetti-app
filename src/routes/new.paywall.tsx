import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  BrandMark,
  DotsBg,
  FloatingTickets,
  Frame,
  Stamp,
  TOKENS,
} from "@/components/new-confetti/shell";

// Ported from design/new-confetti/project/auth-flow.jsx (PaywallGateScreen, line 670)
export const Route = createFileRoute("/new/paywall")({
  component: PaywallPage,
});

const PAID_FEATURES = [
  "Unlimited plans",
  "Family Mode",
  "Kids parties",
  "Hosting plans",
  "Boarding passes",
  "Party Memory Kit",
  "RSVP tracker",
  "Confetti rewards",
];

function PaywallPage() {
  const navigate = useNavigate();
  const onPaid = () => navigate({ to: "/new/stripe", search: { plan: "monthly" } });
  const onFree = () => navigate({ to: "/new/hub" });

  return (
    <Frame>
      <div
        style={{
          position: "relative",
          height: "100%",
          background: TOKENS.bg,
          display: "flex",
          flexDirection: "column",
          padding: "56px 22px 24px",
          overflow: "hidden",
        }}
      >
        <DotsBg opacity={0.06} />
        <FloatingTickets density={4} />

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
          <button
            onClick={() => navigate({ to: "/new/hub" })}
            style={{
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
            }}
          >
            ←
          </button>
          <BrandMark size={17} />
          <span style={{ width: 36 }} />
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 2,
            flex: 1,
            overflowY: "auto",
            scrollbarWidth: "none",
          }}
        >
          <Stamp
            color={TOKENS.accent1}
            rotate={-3}
            style={{ alignSelf: "flex-start", marginBottom: 12 }}
          >
            pick a path
          </Stamp>
          <h1
            style={{
              fontFamily: TOKENS.display,
              fontWeight: 900,
              fontSize: 38,
              lineHeight: 0.92,
              letterSpacing: "-0.04em",
              margin: "0 0 6px",
            }}
          >
            One plan.
            <br />
            Every kind of plan.
          </h1>
          <p
            style={{
              fontFamily: TOKENS.ui,
              fontSize: 14,
              fontWeight: 700,
              opacity: 0.65,
              margin: "0 0 18px",
            }}
          >
            Start free. Upgrade when you want unlimited plans + Family Mode + Party Memory Kit.
          </p>

          {/* All-Access */}
          <button
            onClick={onPaid}
            style={{
              appearance: "none",
              cursor: "pointer",
              textAlign: "left",
              width: "100%",
              padding: 18,
              marginBottom: 12,
              border: `3px solid ${TOKENS.ink}`,
              borderRadius: 18,
              background: TOKENS.accent1,
              color: TOKENS.ink,
              boxShadow: `6px 6px 0 ${TOKENS.ink}`,
              position: "relative",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: -10,
                right: 14,
                padding: "3px 10px",
                background: TOKENS.ink,
                color: TOKENS.paper,
                border: `2px solid ${TOKENS.ink}`,
                borderRadius: 999,
                fontFamily: TOKENS.mono,
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: ".14em",
              }}
            >
              RECOMMENDED · 7-DAY FREE
            </span>
            <div
              style={{
                fontFamily: TOKENS.mono,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: ".14em",
                opacity: 0.7,
                textTransform: "uppercase",
              }}
            >
              ALL-ACCESS
            </div>
            <div
              style={{
                fontFamily: TOKENS.display,
                fontWeight: 900,
                fontSize: 38,
                letterSpacing: "-0.04em",
                lineHeight: 1,
                marginTop: 4,
              }}
            >
              $9.99 <span style={{ fontSize: 16, opacity: 0.6 }}>/mo</span>
            </div>
            <div
              style={{
                fontFamily: TOKENS.ui,
                fontSize: 12,
                fontWeight: 700,
                opacity: 0.8,
                marginTop: 4,
              }}
            >
              Or $99/yr · save 17%
            </div>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: "12px 0 0",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "4px 10px",
                fontFamily: TOKENS.ui,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {PAID_FEATURES.map((f) => (
                <li key={f} style={{ display: "flex", gap: 5 }}>
                  ✓ {f}
                </li>
              ))}
            </ul>
          </button>

          {/* Free */}
          <button
            onClick={onFree}
            style={{
              appearance: "none",
              cursor: "pointer",
              textAlign: "left",
              width: "100%",
              padding: 16,
              border: `2.5px solid ${TOKENS.ink}`,
              borderRadius: 14,
              background: TOKENS.paper,
              color: TOKENS.ink,
              boxShadow: `4px 4px 0 ${TOKENS.ink}`,
            }}
          >
            <div
              style={{
                fontFamily: TOKENS.mono,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: ".14em",
                opacity: 0.55,
                textTransform: "uppercase",
              }}
            >
              FREE
            </div>
            <div
              style={{
                fontFamily: TOKENS.display,
                fontWeight: 900,
                fontSize: 28,
                letterSpacing: "-0.035em",
                lineHeight: 1,
                marginTop: 4,
              }}
            >
              $0
            </div>
            <div
              style={{
                fontFamily: TOKENS.ui,
                fontSize: 12,
                fontWeight: 700,
                opacity: 0.65,
                marginTop: 6,
              }}
            >
              3 plans/wk · adults mode only · ads on venue pages
            </div>
          </button>

          <div
            style={{
              marginTop: 16,
              padding: "10px 12px",
              background: TOKENS.paper,
              border: `2px dashed ${TOKENS.ink}`,
              borderRadius: 10,
              fontFamily: TOKENS.mono,
              fontSize: 10,
              fontWeight: 700,
              opacity: 0.7,
              lineHeight: 1.5,
              letterSpacing: ".04em",
            }}
          >
            🔒 No charge during the 7-day trial. Cancel any time in Settings. We use Stripe.
          </div>
        </div>
      </div>
    </Frame>
  );
}
