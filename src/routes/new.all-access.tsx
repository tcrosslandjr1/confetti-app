import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  BrandMark,
  ChunkyButton,
  DotsBg,
  FloatingTickets,
  Frame,
  Icons,
  Stamp,
  Ticket,
  TOKENS,
} from "@/components/new-confetti/shell";

// All-Access subscription detail page. Slim faithful port of the
// $9.99/mo upgrade pitch — composes the Paywall pattern with deeper
// feature spec + plan toggle.
export const Route = createFileRoute("/new/all-access")({
  component: AllAccessPage,
});

const FEATURES = [
  { icon: "♾", label: "Unlimited plans", sub: "no weekly cap" },
  { icon: "👨‍👩‍👧", label: "Family Mode", sub: "kid-safe + multigen" },
  { icon: "🎂", label: "Kids Parties", sub: "guest list + favors" },
  { icon: "🔥", label: "Hosting plans", sub: "BBQ, potluck, game night" },
  { icon: "💳", label: "Boarding passes", sub: "Apple Wallet + share" },
  { icon: "🎁", label: "Memory Kit", sub: "photo book auto-gen" },
  { icon: "📋", label: "RSVP tracker", sub: "with reminders" },
  { icon: "✨", label: "2× Confetti points", sub: "every check-in" },
];

function AllAccessPage() {
  const navigate = useNavigate();
  const [plan, setPlan] = useState<"monthly" | "yearly">("yearly");

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
        <FloatingTickets density={5} />

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
            marginRight: -22,
            paddingRight: 22,
          }}
        >
          <Stamp
            color={TOKENS.accent2}
            rotate={-4}
            style={{ alignSelf: "flex-start", marginBottom: 12 }}
          >
            7-day free trial
          </Stamp>
          <h1
            style={{
              fontFamily: TOKENS.display,
              fontWeight: 900,
              fontSize: 42,
              lineHeight: 0.92,
              letterSpacing: "-0.04em",
              margin: "0 0 8px",
            }}
          >
            All-Access.
            <br />
            Every <span style={{ color: TOKENS.accent1 }}>everything</span>.
          </h1>
          <p
            style={{
              fontFamily: TOKENS.ui,
              fontSize: 14,
              fontWeight: 600,
              opacity: 0.65,
              margin: "0 0 18px",
            }}
          >
            Unlock the full Confetti toolkit. Cancel any time in Settings.
          </p>

          {/* Pricing pill toggle */}
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            <button onClick={() => setPlan("monthly")} style={pricingBtn(plan === "monthly")}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".12em", opacity: 0.7 }}>
                MONTHLY
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, marginTop: 2 }}>$9.99</div>
              <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.6 }}>/mo</div>
            </button>
            <button onClick={() => setPlan("yearly")} style={pricingBtn(plan === "yearly")}>
              <div
                style={{
                  position: "absolute",
                  top: -10,
                  right: 8,
                  padding: "2px 8px",
                  background: TOKENS.accent2,
                  color: TOKENS.ink,
                  border: `2px solid ${TOKENS.ink}`,
                  borderRadius: 999,
                  fontFamily: TOKENS.mono,
                  fontSize: 8,
                  fontWeight: 800,
                  letterSpacing: ".14em",
                }}
              >
                SAVE 17%
              </div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".12em", opacity: 0.7 }}>
                YEARLY
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, marginTop: 2 }}>$99</div>
              <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.6 }}>/yr · $8.25/mo</div>
            </button>
          </div>

          {/* Feature grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              marginBottom: 18,
            }}
          >
            {FEATURES.map((f) => (
              <div
                key={f.label}
                style={{
                  border: `2.5px solid ${TOKENS.ink}`,
                  borderRadius: 12,
                  background: TOKENS.paper,
                  padding: "10px 12px",
                  boxShadow: `3px 3px 0 ${TOKENS.ink}`,
                }}
              >
                <div style={{ fontSize: 20 }}>{f.icon}</div>
                <div
                  style={{
                    fontFamily: TOKENS.ui,
                    fontSize: 13,
                    fontWeight: 900,
                    letterSpacing: "-0.01em",
                    marginTop: 4,
                  }}
                >
                  {f.label}
                </div>
                <div
                  style={{
                    fontFamily: TOKENS.mono,
                    fontSize: 9,
                    fontWeight: 700,
                    opacity: 0.55,
                    marginTop: 2,
                    letterSpacing: ".04em",
                  }}
                >
                  {f.sub}
                </div>
              </div>
            ))}
          </div>

          {/* Testimonial ticket */}
          <Ticket
            color={TOKENS.accent3}
            notch={false}
            style={{
              padding: 14,
              marginBottom: 18,
              color: TOKENS.paper,
            }}
          >
            <div
              style={{
                fontFamily: TOKENS.mono,
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: ".14em",
                opacity: 0.7,
              }}
            >
              WHY PEOPLE UPGRADE
            </div>
            <div
              style={{
                fontFamily: TOKENS.display,
                fontWeight: 900,
                fontSize: 18,
                letterSpacing: "-0.02em",
                marginTop: 6,
                lineHeight: 1.15,
              }}
            >
              "Family Mode saved Saturdays. Used to dread them."
            </div>
            <div
              style={{
                fontFamily: TOKENS.ui,
                fontSize: 11,
                fontWeight: 700,
                opacity: 0.75,
                marginTop: 6,
              }}
            >
              — Maya · DMV mom of 2
            </div>
          </Ticket>

          <div style={{ height: 8 }} />
        </div>

        <div style={{ position: "relative", zIndex: 2, paddingTop: 12 }}>
          <ChunkyButton
            variant="accent"
            onClick={() => navigate({ to: "/new/stripe", search: { plan } })}
            icon={Icons.arrow}
          >
            Start 7-day free trial
          </ChunkyButton>
          <div
            style={{
              marginTop: 10,
              textAlign: "center",
              fontFamily: TOKENS.mono,
              fontSize: 10,
              fontWeight: 700,
              opacity: 0.55,
              letterSpacing: ".06em",
            }}
          >
            🔒 No charge for 7 days · Cancel any time
          </div>
        </div>
      </div>
    </Frame>
  );
}

function pricingBtn(selected: boolean): React.CSSProperties {
  return {
    appearance: "none",
    cursor: "pointer",
    flex: 1,
    position: "relative",
    padding: "14px 12px",
    border: `2.5px solid ${TOKENS.ink}`,
    borderRadius: 14,
    background: selected ? TOKENS.accent1 : TOKENS.paper,
    color: TOKENS.ink,
    fontFamily: TOKENS.ui,
    textAlign: "center",
    boxShadow: selected ? `4px 4px 0 ${TOKENS.ink}` : "none",
    transform: selected ? "translate(-1px,-1px)" : "none",
    transition: "all .12s",
  };
}
