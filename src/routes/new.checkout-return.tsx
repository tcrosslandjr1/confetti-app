import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BrandMark, ChunkyButton, DotsBg, Frame, Icons, Stamp, Ticket, TOKENS,
} from "@/components/new-confetti/shell";
import { getCheckoutSession } from "@/lib/checkout.functions";
import { getStripeEnvironment } from "@/lib/stripe";

// Real checkout return — verifies session with Stripe
export const Route = createFileRoute("/new/checkout-return")({
  component: CheckoutReturnPage,
  validateSearch: (search: Record<string, unknown>) => ({
    session_id: (search.session_id as string) ?? "",
  }),
});

interface SessionResult {
  status: string;
  paymentStatus: string;
  customerEmail: string | null;
  amountTotal: number | null;
  currency: string | null;
  productName: string | null;
  subscription?: {
    id: string;
    status: string;
    currentPeriodEnd: number | null;
    trialEnd: number | null;
  } | null;
}

function CheckoutReturnPage() {
  const navigate = useNavigate();
  const { session_id } = useSearch({ from: "/new/checkout-return" });
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session_id) {
      setError("No session found — please try again.");
      setLoading(false);
      return;
    }

    async function verify() {
      try {
        const environment = getStripeEnvironment();
        const result = await getCheckoutSession({
          data: { sessionId: session_id, environment },
        });
        setSession(result as SessionResult);
      } catch (err: any) {
        setError(err.message ?? "Could not verify payment.");
      } finally {
        setLoading(false);
      }
    }

    verify();
  }, [session_id]);

  const paid = session?.status === "complete" && session?.paymentStatus === "paid";
  const trialing = session?.subscription?.trialEnd && session.subscription.trialEnd * 1000 > Date.now();
  const confirmed = paid || trialing;

  const formatAmount = () => {
    if (!session?.amountTotal || !session?.currency) return "";
    const amt = (session.amountTotal / 100).toFixed(2);
    return `${session.currency.toUpperCase()} ${amt}`;
  };

  return (
    <Frame>
      <div style={{
        position: "relative", height: "100%", background: TOKENS.bg,
        display: "flex", flexDirection: "column",
        padding: "56px 20px 22px", overflow: "hidden",
      }}>
        <DotsBg opacity={0.05} />

        <div style={{
          position: "relative", zIndex: 2,
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 24,
        }}>
          <BrandMark size={17} />
        </div>

        <div style={{
          position: "relative", zIndex: 2,
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "stretch", justifyContent: "center",
        }}>
          {loading ? (
            <>
              <div style={{ display: "grid", placeItems: "center", margin: "0 auto 24px" }}>
                <div style={{
                  width: 72, height: 72, borderRadius: 999,
                  border: `4px solid ${TOKENS.ink}`,
                  borderTopColor: "transparent",
                  animation: "cf-spin 1s linear infinite",
                }} />
              </div>
              <h1 style={{
                fontFamily: TOKENS.display, fontWeight: 900,
                fontSize: 32, lineHeight: 0.95, letterSpacing: "-0.04em",
                margin: 0, textAlign: "center",
              }}>Confirming<br/>your pass…</h1>
              <p style={{
                fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 700, opacity: 0.6,
                margin: "8px 0 0", textAlign: "center",
              }}>One sec — talking to Stripe.</p>
            </>
          ) : error ? (
            <>
              <div style={{ alignSelf: "flex-start", marginBottom: 8 }}>
                <Stamp color={TOKENS.accent1} rotate={-2}>error</Stamp>
              </div>
              <h1 style={{
                fontFamily: TOKENS.display, fontWeight: 900,
                fontSize: 34, lineHeight: 0.92, letterSpacing: "-0.04em",
                margin: "0 0 10px",
              }}>Something<br/>went wrong.</h1>
              <p style={{
                fontFamily: TOKENS.ui, fontSize: 14, fontWeight: 700, opacity: 0.7,
                margin: 0,
              }}>{error}</p>
            </>
          ) : confirmed ? (
            <>
              <div style={{ alignSelf: "flex-start", marginBottom: 8 }}>
                <Stamp color={TOKENS.accent2} rotate={-3}>
                  {trialing ? "trial · started" : "paid · confirmed"}
                </Stamp>
              </div>
              <h1 style={{
                fontFamily: TOKENS.display, fontWeight: 900,
                fontSize: 40, lineHeight: 0.92, letterSpacing: "-0.04em",
                margin: "0 0 14px",
              }}>You're<br/>locked in.</h1>

              <Ticket color={TOKENS.accent1} notch style={{ padding: 14 }}>
                <div style={{ color: TOKENS.paper }}>
                  <div style={{
                    fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800,
                    letterSpacing: ".14em", opacity: 0.85,
                  }}>RECEIPT · {session_id.slice(0, 12).toUpperCase()}</div>
                  <div style={{
                    fontFamily: TOKENS.display, fontWeight: 900, fontSize: 18,
                    letterSpacing: "-0.02em", marginTop: 6, lineHeight: 1.2,
                  }}>
                    {session?.productName ?? "Confetti All-Access"}
                    {session?.amountTotal ? (
                      <span style={{ display: "block", fontFamily: TOKENS.mono, fontSize: 13, fontWeight: 700, marginTop: 4 }}>
                        {formatAmount()}
                      </span>
                    ) : null}
                  </div>
                  {trialing && (
                    <div style={{
                      fontFamily: TOKENS.ui, fontSize: 11, fontWeight: 700,
                      opacity: 0.8, marginTop: 6,
                    }}>7-day free trial — no charge yet</div>
                  )}
                </div>
              </Ticket>

              <p style={{
                fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 700, opacity: 0.65,
                margin: "14px 0 0",
              }}>Your All-Access pass is active. Go explore!</p>
            </>
          ) : (
            <>
              <div style={{ alignSelf: "flex-start", marginBottom: 8 }}>
                <Stamp color={TOKENS.accent1} rotate={-2}>pending</Stamp>
              </div>
              <h1 style={{
                fontFamily: TOKENS.display, fontWeight: 900,
                fontSize: 34, lineHeight: 0.92, letterSpacing: "-0.04em",
                margin: "0 0 10px",
              }}>Payment<br/>processing.</h1>
              <p style={{
                fontFamily: TOKENS.ui, fontSize: 14, fontWeight: 700, opacity: 0.7,
                margin: 0,
              }}>Your payment is still being processed. Check back in a moment.</p>
            </>
          )}
        </div>

        <div style={{
          position: "relative", zIndex: 2,
          display: "flex", gap: 8,
        }}>
          {error ? (
            <ChunkyButton variant="accent" onClick={() => navigate({ to: "/new/paywall" })}
              icon={Icons.arrow}>try again</ChunkyButton>
          ) : (
            <>
              <ChunkyButton variant="ghost" onClick={() => navigate({ to: "/new/hub" })}>home</ChunkyButton>
              <ChunkyButton variant="accent" onClick={() => navigate({ to: "/new/hub" })}
                disabled={loading} icon={Icons.arrow}>
                {confirmed ? "let's go" : "home"}
              </ChunkyButton>
            </>
          )}
        </div>
      </div>
    </Frame>
  );
}
