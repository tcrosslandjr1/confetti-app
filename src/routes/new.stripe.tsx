import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { Suspense } from "react";
import { BrandMark, Frame, Stamp, TOKENS } from "@/components/new-confetti/shell";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { useNewAuth } from "@/hooks/useNewAuth";

// Real Stripe Embedded Checkout — replaces the fake card form
export const Route = createFileRoute("/new/stripe")({
  component: StripePage,
  validateSearch: (search: Record<string, unknown>) => ({
    plan: (search.plan as string) ?? "monthly",
  }),
});

const PRICE_MAP: Record<string, string> = {
  monthly: "consumer_plus_monthly",
  yearly: "consumer_plus_yearly",
};

function StripePage() {
  const navigate = useNavigate();
  const { plan } = useSearch({ from: "/new/stripe" });
  const { ready, user } = useNewAuth();

  const priceId = PRICE_MAP[plan] ?? "consumer_plus_monthly";
  const returnUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/new/checkout-return?session_id={CHECKOUT_SESSION_ID}`;

  if (!ready) {
    return (
      <Frame>
        <div
          style={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: TOKENS.bg,
            fontFamily: TOKENS.display,
            fontSize: 24,
            fontWeight: 900,
            color: TOKENS.ink,
            opacity: 0.5,
          }}
        >
          loading...
        </div>
      </Frame>
    );
  }

  return (
    <Frame>
      <div
        style={{
          position: "relative",
          height: "100%",
          background: TOKENS.bg,
          display: "flex",
          flexDirection: "column",
          padding: "56px 20px 22px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <button onClick={() => navigate({ to: "/new/paywall" })} style={backBtn()}>
            ←
          </button>
          <BrandMark size={17} />
          <span style={{ width: 36 }} />
        </div>

        <Stamp color={TOKENS.accent2} rotate={-3} style={{ alignSelf: "flex-start" }}>
          secure · stripe
        </Stamp>
        <h1
          style={{
            fontFamily: TOKENS.display,
            fontWeight: 900,
            fontSize: 36,
            lineHeight: 0.92,
            letterSpacing: "-0.04em",
            margin: "10px 0 14px",
          }}
        >
          One last
          <br />
          tap.
        </h1>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            scrollbarWidth: "none",
            marginRight: -20,
            paddingRight: 20,
          }}
        >
          <Suspense
            fallback={
              <div
                style={{
                  display: "grid",
                  placeItems: "center",
                  minHeight: 400,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 999,
                    border: `3px solid ${TOKENS.ink}`,
                    borderTopColor: "transparent",
                    animation: "cf-spin 1s linear infinite",
                  }}
                />
              </div>
            }
          >
            <StripeEmbeddedCheckout
              variant={{ kind: "price", priceId, accountType: "user" }}
              customerEmail={user?.email ?? undefined}
              returnUrl={returnUrl}
            />
          </Suspense>
        </div>

        <div
          style={{
            fontFamily: TOKENS.mono,
            fontSize: 10,
            fontWeight: 700,
            opacity: 0.6,
            marginTop: 10,
            letterSpacing: ".06em",
            textAlign: "center",
          }}
        >
          🔒 stripe handles your card. confetti never sees it.
        </div>
      </div>
    </Frame>
  );
}

function backBtn(): React.CSSProperties {
  return {
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
}
