import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DotsBg, Frame, TOKENS } from "@/components/new-confetti/shell";

// Port of ReferralsScreen (dashboard) — design/new-confetti/project/new-screens-1.jsx
// Note: new.referral.tsx is the referral *landing/capture* page; this is the user's
// referral *management dashboard* (earnings, status, share code).

export const Route = createFileRoute("/new/referrals")({
  component: ReferralsPage,
});

type ReferralStatus = "paying" | "trial" | "free" | "canceled";

interface Referral {
  name: string;
  status: ReferralStatus;
  joined: string;
  monthly: number;
}

const REFERRALS: Referral[] = [
  { name: "Maya C.", status: "paying", joined: "apr 18", monthly: 10 },
  { name: "Devon J.", status: "paying", joined: "feb 02", monthly: 10 },
  { name: "Sam R.", status: "paying", joined: "may 12", monthly: 10 },
  { name: "Alex T.", status: "trial", joined: "may 22", monthly: 0 },
  { name: "Riley P.", status: "free", joined: "may 24", monthly: 0 },
  { name: "Jordan W.", status: "canceled", joined: "jan 04", monthly: 0 },
];

const statusCfg: Record<ReferralStatus, { c: string; l: string }> = {
  paying: { c: TOKENS.accent4, l: "PAYING · $10/MO" },
  trial: { c: TOKENS.accent2, l: "TRIAL · DAY 4/7" },
  free: { c: TOKENS.paper, l: "FREE · NOT PAYING" },
  canceled: { c: "rgba(19,11,13,0.1)", l: "CANCELED · $0" },
};

function ReferralsPage() {
  const navigate = useNavigate();

  const monthly = REFERRALS.reduce((s, r) => s + r.monthly, 0);
  const lifetime = monthly * 4 + 35;
  const paying = REFERRALS.filter((r) => r.status === "paying").length;

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
          <button onClick={() => navigate({ to: "/new/profile" })} style={backBtn}>
            ←
          </button>
          <h2 style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 22, letterSpacing: "-0.035em", margin: 0 }}>
            your invites
          </h2>
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
          }}
        >
          {/* Earnings hero */}
          <div
            style={{
              padding: 18,
              marginBottom: 14,
              border: `3px solid ${TOKENS.ink}`,
              borderRadius: 18,
              background: TOKENS.accent1,
              boxShadow: `6px 6px 0 ${TOKENS.ink}`,
            }}
          >
            <div style={{ fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800, letterSpacing: ".14em", color: TOKENS.inkMuted }}>
              EARNING THIS MONTH
            </div>
            <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 56, letterSpacing: "-0.05em", lineHeight: 0.9, marginTop: 4 }}>
              ${monthly}
            </div>
            <div style={{ fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 700, color: TOKENS.inkMuted, marginTop: 4 }}>
              {paying} active subscribers · $10/each/month
            </div>
            <div
              style={{
                marginTop: 10,
                padding: "6px 10px",
                background: TOKENS.paper,
                border: `2px solid ${TOKENS.ink}`,
                borderRadius: 8,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontFamily: TOKENS.mono,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: ".06em",
              }}
            >
              💸 next payout: jun 1 · ${monthly} gift card
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
            {([
              ["$" + lifetime, "lifetime"],
              [REFERRALS.length, "invited"],
              [paying + "/" + REFERRALS.length, "converted"],
            ] as const).map(([n, l]) => (
              <div
                key={l}
                style={{
                  padding: "10px 8px",
                  border: `2px solid ${TOKENS.ink}`,
                  borderRadius: 10,
                  background: TOKENS.paper,
                  boxShadow: `2px 2px 0 ${TOKENS.ink}`,
                }}
              >
                <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 18, letterSpacing: "-0.025em", lineHeight: 1 }}>
                  {n}
                </div>
                <div style={{ fontFamily: TOKENS.mono, fontSize: 8.5, fontWeight: 800, letterSpacing: ".1em", color: TOKENS.inkHint, marginTop: 3, textTransform: "uppercase" }}>
                  {l}
                </div>
              </div>
            ))}
          </div>

          {/* Share code card */}
          <div
            style={{
              padding: 14,
              marginBottom: 14,
              border: `2.5px solid ${TOKENS.ink}`,
              borderRadius: 14,
              background: TOKENS.paper,
              boxShadow: `4px 4px 0 ${TOKENS.ink}`,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                border: `2px solid ${TOKENS.ink}`,
                background: TOKENS.accent2,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: TOKENS.display,
                fontWeight: 900,
                fontSize: 22,
              }}
            >
              ✣
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".12em", color: TOKENS.inkHint }}>
                YOUR CODE
              </div>
              <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 20, letterSpacing: "-0.025em" }}>
                JESS-08
              </div>
            </div>
            <button
              style={{
                appearance: "none",
                cursor: "pointer",
                padding: "8px 14px",
                border: `2px solid ${TOKENS.ink}`,
                borderRadius: 999,
                background: TOKENS.ink,
                color: TOKENS.paper,
                fontFamily: TOKENS.mono,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: ".1em",
              }}
            >
              SHARE
            </button>
          </div>

          {/* Referral list */}
          <div style={{ fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800, letterSpacing: ".14em", color: TOKENS.inkHint, marginBottom: 8, textTransform: "uppercase" }}>
            your referrals · {REFERRALS.length}
          </div>

          {REFERRALS.map((r, i) => {
            const cfg = statusCfg[r.status];
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  marginBottom: 6,
                  border: `2px solid ${TOKENS.ink}`,
                  borderRadius: 10,
                  background: TOKENS.paper,
                }}
              >
                <span
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    border: `2px solid ${TOKENS.ink}`,
                    background: cfg.c,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: TOKENS.display,
                    fontWeight: 900,
                    fontSize: 12,
                    flexShrink: 0,
                  }}
                >
                  {r.name[0]}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 13, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                    {r.name}
                  </div>
                  <div style={{ fontFamily: TOKENS.mono, fontSize: 8.5, fontWeight: 800, letterSpacing: ".1em", color: TOKENS.inkHint, marginTop: 2 }}>
                    {cfg.l} · JOINED {r.joined.toUpperCase()}
                  </div>
                </div>
                <span
                  style={{
                    fontFamily: TOKENS.display,
                    fontWeight: 900,
                    fontSize: 14,
                    color: r.monthly > 0 ? TOKENS.accent4 : TOKENS.ink,
                    opacity: r.monthly > 0 ? 1 : 0.3,
                  }}
                >
                  {r.monthly > 0 ? "+$" + r.monthly : "—"}
                </span>
              </div>
            );
          })}
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
