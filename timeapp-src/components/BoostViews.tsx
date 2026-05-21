/**
 * Boost Credits UI Components
 * CouponWallet, BoostBadge, CheckInFlow, ConfettiPop, BusinessDashboard
 */
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gift,
  QrCode,
  MapPin,
  Sparkles,
  TrendingUp,
  Eye,
  MousePointerClick,
  Users,
  Crown,
  Check,
  X,
  ChevronRight,
  Ticket,
  Star,
  Zap,
} from "lucide-react";
import {
  getUserSubscription,
  getUserCoupons,
  getUserCheckins,
  checkIn,
  redeemCoupon,
  upgradeToBlack,
  canCreateConfetti,
  seedBoostDemo,
  getCampaignAnalytics,
  getBusinessCampaigns,
  getBusinessAnalytics,
  getBusiness,
  getUserPasses,
  USER_TIER_CONFIG,
  type UserSubscription,
  type CouponRedemption,
  type Coupon,
  type UserCheckin,
  type BoostedVenue,
  type BoostAnalytics,
  type BoostCampaign,
  type BusinessAccount,
  type WalletPass,
} from "../lib/agents";

/* ─── Shared layout wrappers ──────────────────────────────── */
function Page({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`page ${className || ""}`}>{children}</div>;
}

function Header({ eyebrow, title }: { eyebrow: string; title: string }) {
  const navigate = useNavigate();
  return (
    <header className="page-header">
      <button className="back-btn" onClick={() => navigate(-1)} aria-label="Back">
        ←
      </button>
      <div>
        <p style={{ fontSize: 12, opacity: 0.5, textTransform: "uppercase", letterSpacing: 1 }}>
          {eyebrow}
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>{title}</h1>
      </div>
    </header>
  );
}

/* ═══════════════════════════════════════════════════════════
   Confetti Pop — celebration burst on Confetti earn
   ═══════════════════════════════════════════════════════════ */
export function ConfettiPop({
  amount,
  onDone,
}: {
  amount: number;
  onDone: () => void;
}) {
  const particles = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 260,
    y: -(Math.random() * 220 + 60),
    r: Math.random() * 360,
    color: ["#FFD700", "#FF6B6B", "#4ECDC4", "#A78BFA", "#F97316", "#34D399"][i % 6],
    size: Math.random() * 8 + 4,
  }));

  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ delay: 1.6, duration: 0.6 }}
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        pointerEvents: "none",
      }}
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }}
          animate={{
            x: p.x,
            y: p.y,
            rotate: p.r,
            scale: 0.3,
            opacity: 0,
          }}
          transition={{ duration: 1.4, ease: "easeOut" }}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size,
            borderRadius: p.size > 8 ? "50%" : 2,
            background: p.color,
          }}
        />
      ))}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
        style={{
          background: "rgba(0,0,0,0.85)",
          borderRadius: 20,
          padding: "20px 32px",
          textAlign: "center",
          backdropFilter: "blur(10px)",
        }}
      >
        <div style={{ fontSize: 36 }}>🎊</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#FFD700" }}>
          +{amount}
        </div>
        <div style={{ fontSize: 13, color: "#aaa" }}>Confetti earned!</div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Boost Badge — inline badge on venue cards
   ═══════════════════════════════════════════════════════════ */
export function BoostBadge({ venue }: { venue: BoostedVenue }) {
  if (!venue.boostBadge) return null;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: "linear-gradient(135deg, #FFD700 0%, #F97316 100%)",
        color: "#000",
        fontSize: 11,
        fontWeight: 700,
        padding: "3px 8px",
        borderRadius: 20,
        letterSpacing: 0.3,
      }}
    >
      <span>{venue.boostBadge}</span>
      {venue.couponPreview && (
        <span style={{ fontWeight: 500, opacity: 0.8 }}>• {venue.couponPreview}</span>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Check-In Flow — GPS-verify + earn Confetti
   ═══════════════════════════════════════════════════════════ */
export function CheckInFlow({
  venue,
  userId,
  onComplete,
  onClose,
}: {
  venue: BoostedVenue;
  userId: string;
  onComplete: (confetti: number, couponId?: string) => void;
  onClose: () => void;
}) {
  const [stage, setStage] = useState<"confirm" | "verifying" | "done">("confirm");
  const [result, setResult] = useState<UserCheckin | null>(null);
  const [error, setError] = useState<string | null>(null);

  const doCheckIn = useCallback(async () => {
    setStage("verifying");
    try {
      // Get GPS
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 8000,
        })
      );

      const checkinResult = checkIn(
        userId,
        venue.id,
        pos.coords.latitude,
        pos.coords.longitude,
        "gps",
        venue.campaignId
      );

      if (checkinResult) {
        setResult(checkinResult);
        setStage("done");
        onComplete(checkinResult.confettiEarned, checkinResult.couponUnlocked ?? undefined);
      } else {
        setError("Could not verify your location. Make sure you're at the venue.");
        setStage("confirm");
      }
    } catch {
      setError("Location access needed. Please enable GPS and try again.");
      setStage("confirm");
    }
  }, [userId, venue, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 100,
        padding: 16,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 200 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#1a1a1a",
          borderRadius: 24,
          padding: 28,
          width: "100%",
          maxWidth: 400,
          textAlign: "center",
        }}
      >
        {stage === "confirm" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{venue.emoji || "📍"}</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{venue.name}</h3>
            <p style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>
              Check in to earn{" "}
              <span style={{ color: "#FFD700", fontWeight: 700 }}>
                {venue.confettiReward || 50} Confetti
              </span>
            </p>
            {venue.couponPreview && (
              <div
                style={{
                  background: "#262626",
                  borderRadius: 12,
                  padding: "10px 14px",
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Gift size={16} color="#F97316" />
                <span style={{ fontSize: 13 }}>{venue.couponPreview}</span>
              </div>
            )}
            {error && (
              <p style={{ fontSize: 12, color: "#EF4444", marginBottom: 12 }}>{error}</p>
            )}
            <button
              onClick={doCheckIn}
              style={{
                width: "100%",
                padding: "14px 0",
                borderRadius: 14,
                border: "none",
                background: "linear-gradient(135deg, #FFD700, #F97316)",
                color: "#000",
                fontWeight: 700,
                fontSize: 15,
                cursor: "pointer",
              }}
            >
              <MapPin size={16} style={{ display: "inline", marginRight: 6 }} />
              Check In with GPS
            </button>
            <button
              onClick={onClose}
              style={{
                marginTop: 10,
                background: "none",
                border: "none",
                color: "#666",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </>
        )}

        {stage === "verifying" && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
            style={{ fontSize: 48, margin: "20px 0" }}
          >
            📡
          </motion.div>
        )}

        {stage === "done" && result && (
          <>
            <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>You're in!</h3>
            <p style={{ fontSize: 14, color: "#FFD700", fontWeight: 700 }}>
              +{result.confettiEarned} Confetti
            </p>
            {result.couponUnlocked && (
              <p style={{ fontSize: 13, color: "#4ECDC4", marginTop: 8 }}>
                🎁 Coupon unlocked! Check your wallet.
              </p>
            )}
            <button
              onClick={onClose}
              style={{
                marginTop: 16,
                width: "100%",
                padding: "12px 0",
                borderRadius: 14,
                border: "1px solid #333",
                background: "transparent",
                color: "#fff",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Done
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Coupon Wallet — user's coupon collection + redeem
   ═══════════════════════════════════════════════════════════ */
export function CouponWallet({ userId }: { userId: string }) {
  const [sub, setSub] = useState<UserSubscription | null>(null);
  const [coupons, setCoupons] = useState<(CouponRedemption & { coupon: Coupon })[]>([]);
  const [checkins, setCheckins] = useState<UserCheckin[]>([]);
  const [tab, setTab] = useState<"coupons" | "history">("coupons");

  useEffect(() => {
    setSub(getUserSubscription(userId));
    setCoupons(getUserCoupons(userId));
    setCheckins(getUserCheckins(userId));
  }, [userId]);

  const handleRedeem = (redemptionId: string) => {
    const result = redeemCoupon(redemptionId);
    if (result) {
      setCoupons(getUserCoupons(userId));
      setSub(getUserSubscription(userId));
    }
  };

  if (!sub) return null;

  const availableCoupons = coupons.filter((c) => c.status === "available" || c.status === "claimed");
  const usedCoupons = coupons.filter((c) => c.status === "redeemed");

  return (
    <Page>
      <Header eyebrow="Rewards" title="My Wallet" />

      {/* Confetti Balance */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          background: "linear-gradient(135deg, #1a1a2e, #16213e)",
          borderRadius: 20,
          padding: 24,
          margin: "0 16px 20px",
          textAlign: "center",
          border: "1px solid #333",
        }}
      >
        <div style={{ fontSize: 42, marginBottom: 4 }}>🎊</div>
        <div style={{ fontSize: 36, fontWeight: 800, color: "#FFD700" }}>
          {sub.confettiBalance.toLocaleString()}
        </div>
        <div style={{ fontSize: 13, color: "#888" }}>Confetti Balance</div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 24,
            marginTop: 16,
            fontSize: 12,
            color: "#666",
          }}
        >
          <span>
            <strong style={{ color: "#aaa" }}>{sub.totalCheckIns}</strong> check-ins
          </span>
          <span>
            <strong style={{ color: "#aaa" }}>{sub.totalCouponsRedeemed}</strong> redeemed
          </span>
        </div>

        {sub.tier === "free" && (
          <button
            onClick={() => {
              upgradeToBlack(userId);
              setSub(getUserSubscription(userId));
            }}
            style={{
              marginTop: 16,
              padding: "10px 24px",
              borderRadius: 12,
              border: "none",
              background: "linear-gradient(135deg, #A78BFA, #7C3AED)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Crown size={14} />
            Upgrade to Confetti Black — $4.99/mo
          </button>
        )}
        {sub.tier === "black" && (
          <div
            style={{
              marginTop: 12,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "#7C3AED",
              padding: "6px 14px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <Crown size={12} />
            Confetti Black Member
          </div>
        )}
      </motion.div>

      {/* Black Perks: Outing Credit + Prime Reservations */}
      {sub.tier === "black" && (
        <div
          style={{
            display: "flex",
            gap: 12,
            margin: "0 16px 20px",
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            style={{
              flex: 1,
              background: "linear-gradient(135deg, #0f3d0f, #1a3a1a)",
              borderRadius: 16,
              padding: 16,
              textAlign: "center",
              border: "1px solid #2a5a2a",
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 4 }}>💵</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#4ade80" }}>
              ${sub.outingCreditBalance.toFixed(2)}
            </div>
            <div style={{ fontSize: 11, color: "#6b8a6b", marginTop: 2 }}>
              Outing Credit
            </div>
            <div style={{ fontSize: 10, color: "#4a6a4a", marginTop: 4 }}>
              ${sub.outingCreditUsedThisMonth.toFixed(2)} used this month
            </div>
          </motion.div>

          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              flex: 1,
              background: "linear-gradient(135deg, #2d1b4e, #1f1338)",
              borderRadius: 16,
              padding: 16,
              textAlign: "center",
              border: "1px solid #4a2d6e",
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 4 }}>⭐</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#c084fc" }}>
              {sub.primeReservations}
            </div>
            <div style={{ fontSize: 11, color: "#8b6aae", marginTop: 2 }}>
              Prime Reservations
            </div>
            <div style={{ fontSize: 10, color: "#6b4e8a", marginTop: 4 }}>
              {sub.primeReservationsUsedThisMonth} used this month
            </div>
          </motion.div>
        </div>
      )}

      {/* Wallet Pass CTA for Black members */}
      {sub.tier === "black" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ margin: "0 16px 20px" }}
        >
          <button
            onClick={() => window.location.hash = "#/wallet/passes"}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "12px 16px",
              background: "linear-gradient(135deg, #2C1B69, #1e1b4b)",
              border: "1px solid rgba(167,139,250,0.3)",
              borderRadius: 12,
              color: "#a78bfa",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <QrCode size={16} />
            View Confetti Black Wallet Pass
            <ChevronRight size={14} style={{ marginLeft: "auto" }} />
          </button>
        </motion.div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 0,
          margin: "0 16px 16px",
          background: "#1a1a1a",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {(["coupons", "history"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: "10px 0",
              border: "none",
              background: tab === t ? "#333" : "transparent",
              color: tab === t ? "#fff" : "#666",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {t === "coupons" ? `🎁 Coupons (${availableCoupons.length})` : `📋 History`}
          </button>
        ))}
      </div>

      {/* Coupon List */}
      {tab === "coupons" && (
        <div style={{ padding: "0 16px" }}>
          {availableCoupons.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#666" }}>
              <Ticket size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
              <p style={{ fontSize: 14 }}>No coupons yet</p>
              <p style={{ fontSize: 12 }}>Visit boosted venues to unlock rewards!</p>
            </div>
          ) : (
            availableCoupons.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  background: "#1a1a1a",
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 10,
                  border: "1px solid #2a2a2a",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: "linear-gradient(135deg, #FFD700, #F97316)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    flexShrink: 0,
                  }}
                >
                  🎁
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{c.coupon.title}</div>
                  <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                    {c.coupon.description}
                  </div>
                  {c.expiresAt && (
                    <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>
                      Expires {new Date(c.expiresAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
                {c.status === "available" && (
                  <button
                    onClick={() => handleRedeem(c.id)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 10,
                      border: "none",
                      background: "#4ECDC4",
                      color: "#000",
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    Use
                  </button>
                )}
                {c.status === "claimed" && (
                  <span
                    style={{
                      padding: "6px 10px",
                      borderRadius: 8,
                      background: "#333",
                      color: "#aaa",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    Claimed
                  </span>
                )}
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Check-in History */}
      {tab === "history" && (
        <div style={{ padding: "0 16px" }}>
          {checkins.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#666" }}>
              <MapPin size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
              <p style={{ fontSize: 14 }}>No check-ins yet</p>
            </div>
          ) : (
            checkins.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                style={{
                  background: "#1a1a1a",
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <MapPin size={16} color="#4ECDC4" />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{c.venueId}</div>
                    <div style={{ fontSize: 11, color: "#666" }}>
                      {new Date(c.verifiedAt).toLocaleDateString()} •{" "}
                      {c.method.toUpperCase()}
                    </div>
                  </div>
                </div>
                <div style={{ color: "#FFD700", fontWeight: 700, fontSize: 13 }}>
                  +{c.confettiEarned}
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </Page>
  );
}

/* ═══════════════════════════════════════════════════════════
   Confetti Subscription Card — inline subscription status
   ═══════════════════════════════════════════════════════════ */
export function ConfettiSubscriptionCard({ userId }: { userId: string }) {
  const sub = getUserSubscription(userId);
  const plansLeft = sub.confettiLimit === -1 ? "∞" : sub.confettiLimit - sub.confettisUsedThisMonth;
  const isBlack = sub.tier === "black";
  const passes = getUserPasses(userId);
  const activePass = passes.find((p: WalletPass) => p.status === "active");

  return (
    <div
      style={{
        background: isBlack
          ? "linear-gradient(135deg, #1a0a2e, #2d1b69)"
          : "#1a1a1a",
        borderRadius: 16,
        padding: 16,
        border: `1px solid ${isBlack ? "#7C3AED" : "#2a2a2a"}`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: isBlack
                ? "linear-gradient(135deg, #A78BFA, #7C3AED)"
                : "#333",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isBlack ? <Crown size={18} color="#fff" /> : <Star size={18} color="#888" />}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>
              Confetti {isBlack ? "Black" : "Free"}
            </div>
            <div style={{ fontSize: 12, color: "#888" }}>
              {plansLeft} plans left this month
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#FFD700" }}>
            🎊 {sub.confettiBalance}
          </div>
          {isBlack && (
            <div style={{ fontSize: 10, color: "#aaa", marginTop: 2 }}>
              ${sub.outingCreditBalance.toFixed(2)} credit · {sub.primeReservations} res
            </div>
          )}
        </div>
      </div>

      {/* Wallet Pass Status */}
      {isBlack && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: "1px solid #ffffff15",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Ticket size={14} color={activePass ? "#4ECDC4" : "#555"} />
            <span style={{ fontSize: 12, color: activePass ? "#4ECDC4" : "#888" }}>
              {activePass
                ? `Wallet Pass Active · $${activePass.creditBalance.toFixed(2)} balance`
                : "No wallet pass"}
            </span>
          </div>
          {activePass ? (
            <span
              style={{
                fontSize: 10,
                padding: "2px 8px",
                borderRadius: 8,
                background: "#065f4620",
                color: "#34D399",
                fontWeight: 600,
              }}
            >
              {activePass.platform === "apple" ? "Apple" : "Google"}
            </span>
          ) : (
            <button
              onClick={() => (window.location.hash = "#/wallet/passes")}
              style={{
                fontSize: 11,
                padding: "4px 12px",
                borderRadius: 8,
                background: "#7C3AED",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Add to Wallet
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Business Dashboard — campaign stats overview
   ═══════════════════════════════════════════════════════════ */
export function BusinessDashboard({ businessId }: { businessId: string }) {
  const [biz, setBiz] = useState<BusinessAccount | null>(null);
  const [campaigns, setCampaigns] = useState<BoostCampaign[]>([]);
  const [analytics, setAnalytics] = useState<BoostAnalytics | null>(null);

  useEffect(() => {
    const b = getBusiness(businessId);
    setBiz(b);
    if (b) {
      setCampaigns(getBusinessCampaigns(b.id));
      setAnalytics(getBusinessAnalytics(b.id));
    }
  }, [businessId]);

  if (!biz) {
    return (
      <Page>
        <Header eyebrow="Business" title="Dashboard" />
        <div style={{ textAlign: "center", padding: 40, color: "#666" }}>
          Business not found
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <Header eyebrow={biz.tier.toUpperCase()} title={biz.businessName} />

      {/* Credits Balance */}
      <div
        style={{
          margin: "0 16px 20px",
          background: "linear-gradient(135deg, #0f2027, #203a43)",
          borderRadius: 20,
          padding: 24,
          textAlign: "center",
          border: "1px solid #2a4a5a",
        }}
      >
        <div style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>Credit Balance</div>
        <div style={{ fontSize: 40, fontWeight: 800, color: "#4ECDC4" }}>
          {biz.creditBalance.toLocaleString()}
        </div>
        <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
          {biz.totalCreditsUsed.toLocaleString()} credits used total
        </div>
      </div>

      {/* KPI Row */}
      {analytics && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
            gap: 8,
            margin: "0 16px 20px",
          }}
        >
          {[
            { label: "Views", value: analytics.impressions, icon: Eye, color: "#A78BFA" },
            { label: "Clicks", value: analytics.clickThroughs, icon: MousePointerClick, color: "#4ECDC4" },
            { label: "Visits", value: analytics.checkIns, icon: MapPin, color: "#FFD700" },
            { label: "Redeemed", value: analytics.couponRedemptions, icon: Gift, color: "#F97316" },
          ].map((kpi) => (
            <div
              key={kpi.label}
              style={{
                background: "#1a1a1a",
                borderRadius: 12,
                padding: 12,
                textAlign: "center",
              }}
            >
              <kpi.icon size={16} color={kpi.color} style={{ marginBottom: 4 }} />
              <div style={{ fontSize: 18, fontWeight: 800 }}>{kpi.value}</div>
              <div style={{ fontSize: 10, color: "#666" }}>{kpi.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Credit Usage Analytics */}
      {analytics && (
        <div
          style={{
            margin: "0 16px 20px",
            background: "#1a1a1a",
            borderRadius: 16,
            padding: 20,
            border: "1px solid #2a2a2a",
          }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
            <Users size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
            Credit Usage
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ background: "#111", borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Unique Visitors</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#4ECDC4" }}>
                {analytics.checkIns}
              </div>
              <div style={{ fontSize: 10, color: "#555" }}>checked in via app</div>
            </div>
            <div style={{ background: "#111", borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Coupons Redeemed</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#F97316" }}>
                {analytics.couponRedemptions}
              </div>
              <div style={{ fontSize: 10, color: "#555" }}>total redemptions</div>
            </div>
            <div style={{ background: "#111", borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Credits Spent</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#A78BFA" }}>
                {analytics.creditsSpent.toLocaleString()}
              </div>
              <div style={{ fontSize: 10, color: "#555" }}>of {((biz?.totalCreditsUsed ?? 0) + (biz?.creditBalance ?? 0)).toLocaleString()} purchased</div>
            </div>
            <div style={{ background: "#111", borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Conversion Rate</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#FFD700" }}>
                {(analytics.conversionRate * 100).toFixed(1)}%
              </div>
              <div style={{ fontSize: 10, color: "#555" }}>clicks → visits</div>
            </div>
          </div>
          {analytics.roi > 0 && (
            <div
              style={{
                marginTop: 12,
                padding: "10px 14px",
                borderRadius: 10,
                background: "linear-gradient(135deg, #065f4610, #065f4620)",
                border: "1px solid #065f4640",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <TrendingUp size={14} color="#34D399" />
              <span style={{ fontSize: 12, color: "#34D399", fontWeight: 600 }}>
                {analytics.roi.toFixed(1)}x ROI on boost credits
              </span>
            </div>
          )}
        </div>
      )}

      {/* Campaigns List */}
      <div style={{ padding: "0 16px" }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
          Campaigns ({campaigns.length})
        </h3>
        {campaigns.map((c) => (
          <div
            key={c.id}
            style={{
              background: "#1a1a1a",
              borderRadius: 14,
              padding: 16,
              marginBottom: 10,
              border: "1px solid #2a2a2a",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700 }}>{c.name}</div>
              <span
                style={{
                  padding: "3px 10px",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600,
                  background:
                    c.status === "active"
                      ? "#065f4620"
                      : c.status === "paused"
                      ? "#78350f20"
                      : "#1a1a1a",
                  color:
                    c.status === "active"
                      ? "#34D399"
                      : c.status === "paused"
                      ? "#FBBF24"
                      : "#888",
                }}
              >
                {c.status}
              </span>
            </div>
            <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#888" }}>
              <span>{c.impressions} views</span>
              <span>{c.clickThroughs} clicks</span>
              <span>{c.checkIns} check-ins</span>
              <span>{c.totalCreditsSpent} credits used</span>
            </div>
            {c.targetVibes.length > 0 && (
              <div style={{ marginTop: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
                {c.targetVibes.map((v) => (
                  <span
                    key={v}
                    style={{
                      padding: "2px 8px",
                      borderRadius: 8,
                      background: "#262626",
                      fontSize: 11,
                      color: "#aaa",
                    }}
                  >
                    {v}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </Page>
  );
}
