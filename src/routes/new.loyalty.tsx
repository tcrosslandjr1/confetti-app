import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Frame,
  DotsBg,
  BrandMark,
  TOKENS,
} from "@/components/new-confetti/shell";

export const Route = createFileRoute("/new/loyalty")({ component: LoyaltyPage });

// ─── Tier definitions ─────────────────────────────────────────
const TIERS = [
  { id: "silver",   label: "Silver",   min: 0,    c: "#c8c5b9" },
  { id: "gold",     label: "Gold",     min: 1000, c: TOKENS.accent2 },
  { id: "platinum", label: "Platinum", min: 5000, c: TOKENS.accent3 },
] as const;

type TierObj = { id: string; label: string; min: number; c: string; next?: { id: string; label: string; min: number; c: string } };

function tierFor(pts: number): TierObj {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (pts >= TIERS[i].min) {
      return { ...TIERS[i], next: TIERS[i + 1] };
    }
  }
  return { ...TIERS[0] };
}

const DEMO_USER = {
  points: 3420,
  recentEarnings: [
    { what: "Check-in · Westlight",          pts: 25,  when: "2h ago", type: "checkin" },
    { what: "Booking confirmed · Lupa",      pts: 100, when: "yest",   type: "book" },
    { what: "Reel shared · \"carbonara\"",   pts: 10,  when: "yest",   type: "reel" },
    { what: "@maya joined via your invite",  pts: 50,  when: "3d",     type: "invite" },
    { what: "Plan saved · \"Bushwick crawl\"",pts: 5,  when: "5d",     type: "save" },
  ],
};

// ─── Points pill ─────────────────────────────────────────────
function PointsPill({ points = DEMO_USER.points, onClick }: { points?: number; onClick?: () => void }) {
  const t = tierFor(points);
  return (
    <button onClick={onClick} style={{
      appearance: "none", cursor: "pointer",
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "5px 11px 5px 5px",
      border: `2.5px solid ${TOKENS.ink}`, borderRadius: 999,
      background: TOKENS.paper, color: TOKENS.ink,
      boxShadow: `3px 3px 0 ${TOKENS.ink}`,
    }}>
      <span style={{ width: 22, height: 22, borderRadius: 999, background: t.c, border: `2px solid ${TOKENS.ink}`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: TOKENS.display, fontWeight: 900, fontSize: 11, color: TOKENS.ink }}>{t.label[0]}</span>
      <span style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 13, letterSpacing: "-0.01em" }}>{points.toLocaleString()}</span>
      <span style={{ fontFamily: TOKENS.mono, fontSize: 8, fontWeight: 800, letterSpacing: ".12em", opacity: 0.6 }}>PTS</span>
    </button>
  );
}

// ─── Tier progress card ───────────────────────────────────────
function TierProgress({ points = DEMO_USER.points }: { points?: number }) {
  const t = tierFor(points);
  const toNext = t.next ? t.next.min - points : 0;
  const fillPct = t.next ? (points - t.min) / (t.next.min - t.min) : 1;

  return (
    <div style={{ padding: 14, border: `2.5px solid ${TOKENS.ink}`, borderRadius: 14, background: t.c, boxShadow: `4px 4px 0 ${TOKENS.ink}`, color: t.id === "platinum" ? TOKENS.paper : TOKENS.ink }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".14em", opacity: 0.7, textTransform: "uppercase" }}>YOUR TIER</span>
        <span style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".12em", opacity: 0.7 }}>{points.toLocaleString()} PTS · ${Math.floor(points / 100)} VALUE</span>
      </div>
      <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 30, letterSpacing: "-0.035em", lineHeight: 1 }}>{t.label}</div>
      {t.next && (
        <>
          <div style={{ marginTop: 12, height: 10, border: `2px solid ${TOKENS.ink}`, borderRadius: 999, background: "rgba(255,250,240,0.4)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.min(100, fillPct * 100)}%`, background: TOKENS.ink, transition: "width .4s" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800, letterSpacing: ".06em" }}>
            <span>NOW</span>
            <span>{toNext.toLocaleString()} PTS TO {t.next.label.toUpperCase()}</span>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Earn guide ───────────────────────────────────────────────
function EarnGuide() {
  const ways = [
    { what: "Check in at a venue",   pts: "25",   icon: "📍" },
    { what: "Booking confirmed",     pts: "100",  icon: "📅" },
    { what: "Share a reel",          pts: "10",   icon: "🎬" },
    { what: "Invite a friend",       pts: "50",   icon: "✨", extra: "+ $25 gift card when they book" },
    { what: "Save a plan",           pts: "5",    icon: "☆" },
    { what: "Boost-window 2× day",   pts: "2×",   icon: "🔥", extra: "all earnings doubled" },
  ];
  return (
    <div style={{ padding: 14, border: `2.5px solid ${TOKENS.ink}`, borderRadius: 14, background: TOKENS.paper, boxShadow: `4px 4px 0 ${TOKENS.ink}` }}>
      <div style={{ fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800, letterSpacing: ".14em", opacity: 0.55, textTransform: "uppercase", marginBottom: 10 }}>HOW TO EARN POINTS</div>
      {ways.map((w, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: i < ways.length - 1 ? "1px dashed rgba(0,0,0,0.15)" : "none" }}>
          <span style={{ fontSize: 16, width: 22 }}>{w.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 800 }}>{w.what}</div>
            {w.extra && <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 700, opacity: 0.55, marginTop: 1, letterSpacing: ".06em" }}>{w.extra}</div>}
          </div>
          <span style={{ padding: "3px 9px", background: TOKENS.accent1, color: TOKENS.ink, border: `1.5px solid ${TOKENS.ink}`, borderRadius: 999, fontFamily: TOKENS.display, fontWeight: 900, fontSize: 12 }}>+{w.pts}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Points ledger ────────────────────────────────────────────
function PointsLedger({ items = DEMO_USER.recentEarnings }: { items?: typeof DEMO_USER.recentEarnings }) {
  const iconFor = (type: string) => ({ checkin: "📍", book: "📅", reel: "🎬", invite: "✨", save: "☆", redeem: "💸" }[type] ?? "·");
  return (
    <div style={{ padding: 14, border: `2.5px solid ${TOKENS.ink}`, borderRadius: 14, background: TOKENS.paper }}>
      <div style={{ fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800, letterSpacing: ".14em", opacity: 0.55, textTransform: "uppercase", marginBottom: 10 }}>LEDGER · CONFETTI_LEDGER</div>
      {items.map((it, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < items.length - 1 ? "1px dashed rgba(0,0,0,0.15)" : "none" }}>
          <span style={{ fontSize: 16, width: 22 }}>{iconFor(it.type)}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 800 }}>{it.what}</div>
            <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 700, opacity: 0.55, marginTop: 1, letterSpacing: ".06em", textTransform: "uppercase" }}>{it.when}</div>
          </div>
          <span style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 14, color: it.pts < 0 ? "#d32323" : TOKENS.accent4 }}>{it.pts > 0 ? "+" : ""}{it.pts}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Redemption card ─────────────────────────────────────────
function RedemptionCard({ verified = true, rate = 100, points = DEMO_USER.points, venueName = "Lupa Notte" }: {
  verified?: boolean; rate?: number; points?: number; venueName?: string;
}) {
  if (!verified) {
    return (
      <div style={{ padding: 14, marginBottom: 14, border: "2px dashed var(--ink)", borderRadius: 12, background: TOKENS.paper, opacity: 0.7 }}>
        <div style={{ fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800, letterSpacing: ".14em", opacity: 0.6, textTransform: "uppercase" }}>UNVERIFIED VENUE</div>
        <div style={{ fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 700, marginTop: 4, lineHeight: 1.4 }}>This spot hasn't claimed their listing yet — points can't be redeemed here. They'll appear in plans, but check-in rewards are paused.</div>
      </div>
    );
  }
  const dollarsOff = Math.floor(points / rate);
  return (
    <div style={{ padding: 14, marginBottom: 14, border: `2.5px solid ${TOKENS.ink}`, borderRadius: 14, background: TOKENS.accent1, color: TOKENS.ink, boxShadow: `4px 4px 0 ${TOKENS.ink}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".14em", opacity: 0.7, textTransform: "uppercase", marginBottom: 4 }}>
        <span>✓ VERIFIED</span><span>·</span><span>POINTS REDEEMABLE</span>
      </div>
      <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 22, letterSpacing: "-0.025em", lineHeight: 1.05 }}>You can redeem ${dollarsOff} off here.</div>
      <div style={{ fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 700, opacity: 0.75, marginTop: 4 }}>{points.toLocaleString()} pts on hand · {rate} pts = $1 at {venueName}. Staff scans your pass at check-in.</div>
    </div>
  );
}

// ─── Checkin reward overlay ───────────────────────────────────
function CheckinReward({ open, points = 125, billOff = 4, onClose }: { open: boolean; points?: number; billOff?: number; onClose: () => void }) {
  if (!open) return null;
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 80, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "rgba(0,0,0,0.65)", animation: "cf-fadein 0.25s" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 320, background: TOKENS.paper, color: TOKENS.ink, border: `3px solid ${TOKENS.ink}`, borderRadius: 22, boxShadow: `8px 8px 0 ${TOKENS.accent1}`, padding: 22, textAlign: "center", animation: "cf-pop 0.4s cubic-bezier(.2,1.4,.4,1)" }}>
        <div style={{ fontSize: 56, lineHeight: 1, marginBottom: 10 }}>🎉</div>
        <div style={{ fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800, letterSpacing: ".14em", opacity: 0.6, textTransform: "uppercase" }}>POINTS EARNED</div>
        <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 56, letterSpacing: "-0.045em", lineHeight: 1, margin: "4px 0", color: TOKENS.accent1 }}>+{points}</div>
        <div style={{ fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 700, opacity: 0.7 }}>Check-in + booking + 2× boost window.</div>
        <div style={{ marginTop: 14, padding: 10, background: TOKENS.accent2, border: `2px solid ${TOKENS.ink}`, borderRadius: 10 }}>
          <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".14em", opacity: 0.65, textTransform: "uppercase", marginBottom: 2 }}>REDEEMED AT THIS STOP</div>
          <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 18, letterSpacing: "-0.025em" }}>${billOff} off applied to bill</div>
        </div>
        <button onClick={onClose} style={{ appearance: "none", cursor: "pointer", width: "100%", marginTop: 16, padding: "12px 16px", border: `2.5px solid ${TOKENS.ink}`, borderRadius: 12, background: TOKENS.ink, color: TOKENS.paper, fontFamily: TOKENS.ui, fontSize: 14, fontWeight: 900 }}>nice — keep going →</button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────
function LoyaltyPage() {
  const navigate = useNavigate();
  const [rewardOpen, setRewardOpen] = useState(false);

  return (
    <Frame>
      <div className="cf-screen" style={{ position: "relative", height: "100dvh", background: TOKENS.bg, color: TOKENS.ink, display: "flex", flexDirection: "column", padding: "56px 22px 24px", overflow: "hidden" }}>
        <DotsBg opacity={0.06} />

        {/* Header */}
        <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <button onClick={() => navigate({ to: "/new/hub" })} style={{ appearance: "none", cursor: "pointer", width: 36, height: 36, borderRadius: 999, border: `2.5px solid ${TOKENS.ink}`, background: TOKENS.paper, fontSize: 14, fontWeight: 900, boxShadow: `3px 3px 0 ${TOKENS.ink}`, display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
          <BrandMark size={16} />
          <PointsPill onClick={() => setRewardOpen(true)} />
        </div>

        {/* Scrollable content */}
        <div style={{ position: "relative", zIndex: 2, flex: 1, overflowY: "auto", scrollbarWidth: "none", marginRight: -22, paddingRight: 22 }}>
          <h2 style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 32, lineHeight: 0.95, letterSpacing: "-0.04em", margin: "0 0 4px" }}>Points &amp; perks.</h2>
          <p style={{ fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 600, opacity: 0.65, margin: "0 0 16px" }}>Earn on every check-in. Spend at verified venues. Double during boost windows.</p>

          {/* 2× boost badge */}
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", background: TOKENS.ink, color: TOKENS.paper, border: `2px solid ${TOKENS.paper}`, borderRadius: 999, fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase" }}>
              <span style={{ color: TOKENS.accent1 }}>🔥</span>
              2× POINTS · UNTIL 11:30 PM TONIGHT
            </span>
          </div>

          {/* Tier progress */}
          <div style={{ marginBottom: 16 }}>
            <TierProgress />
          </div>

          {/* Redemption at current venue */}
          <RedemptionCard />

          {/* How to earn */}
          <div style={{ marginBottom: 16 }}>
            <EarnGuide />
          </div>

          {/* Ledger */}
          <div style={{ marginBottom: 16 }}>
            <PointsLedger />
          </div>

          {/* Tier benefits grid */}
          <div style={{ padding: 14, border: `2.5px solid ${TOKENS.ink}`, borderRadius: 14, background: TOKENS.paper, boxShadow: `4px 4px 0 ${TOKENS.ink}`, marginBottom: 16 }}>
            <div style={{ fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800, letterSpacing: ".14em", opacity: 0.55, textTransform: "uppercase", marginBottom: 10 }}>TIER BENEFITS</div>
            {[
              { tier: "Silver",   c: "#c8c5b9", perks: ["earn 25 pts/check-in", "basic redemptions", "crew invites"] },
              { tier: "Gold",     c: TOKENS.accent2, perks: ["earn 35 pts/check-in", "priority seating at partners", "2× boost Fri/Sat"] },
              { tier: "Platinum", c: TOKENS.accent3, perks: ["earn 50 pts/check-in", "concierge line", "free pass monthly", "vip access"] },
            ].map((row, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: i < 2 ? "1px dashed rgba(0,0,0,0.15)" : "none", alignItems: "flex-start" }}>
                <span style={{ width: 34, height: 34, borderRadius: 8, border: `2px solid ${TOKENS.ink}`, background: row.c, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: TOKENS.display, fontWeight: 900, fontSize: 11, color: row.tier === "Platinum" ? TOKENS.paper : TOKENS.ink, flexShrink: 0 }}>{row.tier[0]}</span>
                <div>
                  <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 15, letterSpacing: "-0.02em" }}>{row.tier}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                    {row.perks.map((p) => (
                      <span key={p} style={{ padding: "2px 8px", border: `1.5px solid ${TOKENS.ink}`, borderRadius: 999, fontFamily: TOKENS.mono, fontSize: 8, fontWeight: 800, letterSpacing: ".06em", background: TOKENS.bg }}>{p}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Checkin reward overlay */}
        <CheckinReward open={rewardOpen} onClose={() => setRewardOpen(false)} />
      </div>
    </Frame>
  );
}
