import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { DotsBg, Frame, TOKENS } from "@/components/new-confetti/shell";
import { useSubscription } from "@/hooks/useSubscription";
import { cancelSubscription, createPortalSession } from "@/lib/checkout.functions";
import { getStripeEnvironment } from "@/lib/stripe-env";

// Manage plan — real subscription row, real Stripe cancel + billing portal.
// (Replaces the design-mockup version that faked plan data and only
// pretended to cancel.)

export const Route = createFileRoute("/new/manage-subscription")({
  component: ManageSubscriptionPage,
});

type Phase = "main" | "reason" | "confirm" | "gone";

const REASONS = [
  { id: "cost", l: "Too expensive" },
  { id: "unused", l: "Not using it enough" },
  { id: "features", l: "Don't need the features" },
  { id: "bugs", l: "App issues / bugs" },
  { id: "moved", l: "Moved out of the city" },
  { id: "other", l: "Other" },
] as const;

const PLAN_LABEL: Record<string, string> = {
  consumer_plus_monthly: "confetti plus",
  consumer_crew_monthly: "crew",
  user_unlimited_monthly: "unlimited",
  user_vip_monthly: "vip",
};

function fmtDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ManageSubscriptionPage() {
  const navigate = useNavigate();
  const { subscription, isActive, loading, refetch } = useSubscription();
  const [phase, setPhase] = useState<Phase>("main");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessUntil, setAccessUntil] = useState<string | null>(null);

  const doCancel = useServerFn(cancelSubscription);
  const openPortal = useServerFn(createPortalSession);

  const planName =
    (subscription?.price_id && PLAN_LABEL[subscription.price_id]) ||
    subscription?.tier ||
    "your plan";
  const renewDate = fmtDate(subscription?.current_period_end);

  const handlePortal = async () => {
    setBusy(true);
    setError(null);
    try {
      const url = await openPortal({
        data: {
          environment: getStripeEnvironment(),
          returnUrl: typeof window !== "undefined" ? window.location.href : undefined,
        },
      });
      window.location.href = url;
    } catch {
      setError("Couldn't open the billing portal. Try again in a minute.");
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await doCancel({ data: { environment: getStripeEnvironment() } });
      setAccessUntil(fmtDate(res.accessUntil));
      await refetch();
      setPhase("gone");
    } catch {
      setError("Cancel didn't go through. Nothing was changed — try again or email support@confettiplan.com.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <Frame>
        <Screen>
          <Centered>
            <p style={mutedText}>loading your plan…</p>
          </Centered>
        </Screen>
      </Frame>
    );
  }

  // ─── No active plan ──────────────────────────
  if (!isActive && phase !== "gone") {
    return (
      <Frame>
        <Screen>
          <Header onBack={() => navigate({ to: "/new/settings" })} title="manage plan" />
          <Centered>
            <h2 style={bigTitle}>no active plan.</h2>
            <p style={{ ...mutedText, maxWidth: 280, textAlign: "center" }}>
              You're on the free tier. Upgrade any time — cancel any time.
            </p>
            <button onClick={() => navigate({ to: "/new/all-access" })} style={primaryBtn}>
              see all-access →
            </button>
          </Centered>
        </Screen>
      </Frame>
    );
  }

  // ─── Cancelled state ─────────────────────────
  if (phase === "gone") {
    return (
      <Frame>
        <Screen>
          <Centered>
            <span style={bigBadge}>✓</span>
            <h2 style={bigTitle}>cancelled.</h2>
            <p style={{ ...mutedText, maxWidth: 280, textAlign: "center", lineHeight: 1.45 }}>
              {accessUntil
                ? <>You keep your plan until <b>{accessUntil}</b>, then you move to the free tier. No further charges.</>
                : <>Your plan won't renew. You move to the free tier at the end of the paid period.</>}
            </p>
            <button onClick={() => navigate({ to: "/new/settings" })} style={secondaryBtn}>
              back to settings
            </button>
          </Centered>
        </Screen>
      </Frame>
    );
  }

  // ─── Reason picker ────────────────────────────
  if (phase === "reason") {
    return (
      <Frame>
        <Screen>
          <Header onBack={() => setPhase("main")} title="before you go…" />
          <p style={{ ...mutedText, margin: "0 0 18px" }}>Why are you cancelling? It helps us improve.</p>
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
            {REASONS.map((r) => (
              <button key={r.id} onClick={() => setPhase("confirm")} style={listBtn}>
                {r.l} →
              </button>
            ))}
          </div>
        </Screen>
      </Frame>
    );
  }

  // ─── Confirm cancel ───────────────────────────
  if (phase === "confirm") {
    return (
      <Frame>
        <Screen>
          <Header onBack={() => setPhase("reason")} title="confirm cancel" />
          <p style={{ ...mutedText, margin: "0 0 14px", lineHeight: 1.5 }}>
            Your plan stays active until {renewDate ?? "the end of the paid period"}, then it
            won't renew. Your saves, plans, and check-ins stay with you on the free tier.
          </p>
          {error && <p style={errorText}>{error}</p>}
          <div style={{ marginTop: "auto" }}>
            <button onClick={handleCancel} disabled={busy} style={{ ...dangerBtn, opacity: busy ? 0.6 : 1 }}>
              {busy ? "cancelling…" : `yes, cancel ${planName}`}
            </button>
            <button onClick={() => setPhase("main")} disabled={busy} style={{ ...secondaryBtn, width: "100%", marginTop: 8 }}>
              keep my plan
            </button>
          </div>
        </Screen>
      </Frame>
    );
  }

  // ─── Main view ────────────────────────────────
  return (
    <Frame>
      <Screen>
        <Header onBack={() => navigate({ to: "/new/settings" })} title="manage plan" />
        <div style={{ flex: 1, overflowY: "auto" }}>
          <div style={planCard}>
            <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".16em", opacity: 0.85 }}>
              YOUR PLAN · {(subscription?.status ?? "active").toUpperCase()}
            </div>
            <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 28, letterSpacing: "-0.04em", marginTop: 6, lineHeight: 1 }}>
              ✦ {planName}
            </div>
            {renewDate && (
              <div style={{ fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 700, opacity: 0.85, marginTop: 6 }}>
                {subscription?.cancel_at_period_end ? `ends ${renewDate} · won't renew` : `renews ${renewDate}`}
              </div>
            )}
          </div>

          {error && <p style={errorText}>{error}</p>}

          <button onClick={handlePortal} disabled={busy} style={{ ...listBtn, width: "100%", marginBottom: 8 }}>
            💳 payment method, invoices &amp; history →
          </button>
          <p style={{ ...mutedText, fontSize: 10, margin: "0 0 16px" }}>
            Opens Stripe's secure billing portal — Confetti never sees your card.
          </p>

          {!subscription?.cancel_at_period_end && (
            <button onClick={() => setPhase("reason")} style={ghostBtn}>
              pause or cancel subscription
            </button>
          )}
        </div>
      </Screen>
    </Frame>
  );
}

// ─── Layout + style helpers ─────────────────────
function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: "relative", height: "100dvh", background: TOKENS.bg, display: "flex", flexDirection: "column", padding: "56px 22px 24px", overflow: "hidden" }}>
      <DotsBg opacity={0.05} />
      <div style={{ position: "relative", zIndex: 2, flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>{children}</div>
    </div>
  );
}

function Header({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
      <button onClick={onBack} style={backBtn}>←</button>
      <h2 style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 22, letterSpacing: "-0.035em", margin: 0 }}>{title}</h2>
      <span style={{ width: 36 }} />
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
      {children}
    </div>
  );
}

const backBtn: React.CSSProperties = { appearance: "none", cursor: "pointer", width: 36, height: 36, borderRadius: 999, border: `2.5px solid ${TOKENS.ink}`, background: TOKENS.paper, fontSize: 14, fontWeight: 900, boxShadow: `3px 3px 0 ${TOKENS.ink}` };
const secondaryBtn: React.CSSProperties = { appearance: "none", cursor: "pointer", padding: "10px 14px", border: `2px solid ${TOKENS.ink}`, borderRadius: 999, background: TOKENS.accent1, color: TOKENS.ink, fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 800, boxShadow: `3px 3px 0 ${TOKENS.ink}` };
const primaryBtn: React.CSSProperties = { appearance: "none", cursor: "pointer", padding: "12px 18px", border: `3px solid ${TOKENS.ink}`, borderRadius: 14, background: TOKENS.ink, color: TOKENS.paper, fontFamily: TOKENS.display, fontWeight: 900, fontSize: 15, letterSpacing: "-0.02em", boxShadow: `4px 4px 0 ${TOKENS.ink}` };
const dangerBtn: React.CSSProperties = { appearance: "none", cursor: "pointer", width: "100%", padding: "14px 16px", border: `3px solid ${TOKENS.ink}`, borderRadius: 14, background: "#d32323", color: "#fff", fontFamily: TOKENS.display, fontWeight: 900, fontSize: 16, letterSpacing: "-0.02em", boxShadow: `5px 5px 0 ${TOKENS.ink}` };
const listBtn: React.CSSProperties = { appearance: "none", cursor: "pointer", textAlign: "left", padding: "14px 16px", border: `2.5px solid ${TOKENS.ink}`, borderRadius: 12, background: TOKENS.paper, fontFamily: TOKENS.ui, fontSize: 14, fontWeight: 800, color: TOKENS.ink, boxShadow: `3px 3px 0 ${TOKENS.ink}` };
const ghostBtn: React.CSSProperties = { appearance: "none", cursor: "pointer", width: "100%", padding: "12px 16px", border: `2px dashed ${TOKENS.ink}`, borderRadius: 12, background: "transparent", color: TOKENS.ink, fontFamily: TOKENS.mono, fontSize: 11, fontWeight: 800, letterSpacing: ".06em", opacity: 0.7 };
const bigTitle: React.CSSProperties = { fontFamily: TOKENS.display, fontWeight: 900, fontSize: 30, letterSpacing: "-0.04em", margin: 0 };
const bigBadge: React.CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 88, height: 88, borderRadius: "50%", background: TOKENS.accent2, border: `3px solid ${TOKENS.ink}`, boxShadow: `5px 5px 0 ${TOKENS.ink}`, fontSize: 38 };
const mutedText: React.CSSProperties = { fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 700, color: TOKENS.inkMuted, margin: 0 };
const errorText: React.CSSProperties = { fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 700, color: "#d32323", margin: "0 0 10px" };
const planCard: React.CSSProperties = { padding: 18, marginBottom: 14, border: `3px solid ${TOKENS.ink}`, borderRadius: 18, background: TOKENS.accent3, color: TOKENS.paper, boxShadow: `6px 6px 0 ${TOKENS.ink}` };
