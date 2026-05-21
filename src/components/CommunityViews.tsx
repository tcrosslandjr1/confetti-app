/**
 * Community UI Components
 * Explore feed, plan detail, experience sharing, reputation profile
 */
import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Star,
  Heart,
  MapPin,
  Clock,
  Users,
  Share2,
  Bookmark,
  Shuffle,
  Send,
  Camera,
  Trophy,
  Flame,
  TrendingUp,
  ChevronDown,
  X,
  Check,
  Sparkles,
  MessageCircle,
  ThumbsUp,
  Eye,
  Navigation,
} from "lucide-react";
import {
  getCommunityFeed,
  getSharedPlan,
  getPlanReviews,
  getUserSharedPlans,
  getUserReputation,
  getReputationTierInfo,
  getAllTiers,
  getAIInsights,
  getCommunityStats,
  seedCommunityDemo,
  sharePlan,
  remixPlan,
  submitReview,
  savePlanToCollection,
  type SharedPlan,
  type SharedPlanStop,
  type ExperienceReview,
  type UserReputation,
  type CommunityBadge,
  type CommunityFeedQuery,
  type AIInsight,
  type ReputationTier,
  type ReviewType,
  type StopRating,
} from "../lib/agents";

/* ─── Shared layout primitives ─────────────────────────────── */

function Page({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`page ${className || ""}`}>{children}</div>;
}

function Header({ eyebrow, title, right }: { eyebrow: string; title: string; right?: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <header className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="Back">
          ←
        </button>
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
        </div>
      </div>
      {right}
    </header>
  );
}

const spring = { type: "spring" as const, stiffness: 400, damping: 28 };

/* ─── Tier badge helper ─────────────────────────────────────── */

function TierBadge({ tier, size = "sm" }: { tier: ReputationTier; size?: "sm" | "md" }) {
  const info = getReputationTierInfo(tier);
  const sz = size === "sm" ? { font: 10, pad: "2px 6px" } : { font: 12, pad: "3px 8px" };
  return (
    <span
      style={{
        fontSize: sz.font,
        padding: sz.pad,
        borderRadius: 12,
        background: "rgba(139,92,246,0.15)",
        border: "1px solid rgba(139,92,246,0.3)",
        color: "#c4b5fd",
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        whiteSpace: "nowrap",
      }}
    >
      {info.icon} {info.label}
    </span>
  );
}

/* ─── Star rating display ──────────────────────────────────── */

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{
            width: size,
            height: size,
            fill: i <= Math.round(rating) ? "#FFD700" : "transparent",
            color: i <= Math.round(rating) ? "#FFD700" : "rgba(255,255,255,0.2)",
          }}
        />
      ))}
    </span>
  );
}

/* ─── Interactive star rating input ────────────────────────── */

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <span style={{ display: "inline-flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.button
          key={i}
          whileTap={{ scale: 0.85 }}
          onClick={() => onChange(i)}
          style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
        >
          <Star
            style={{
              width: 28,
              height: 28,
              fill: i <= value ? "#FFD700" : "transparent",
              color: i <= value ? "#FFD700" : "rgba(255,255,255,0.25)",
              transition: "all 0.15s",
            }}
          />
        </motion.button>
      ))}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   COMMUNITY EXPLORE — Map-based feed with plan cards
   ═══════════════════════════════════════════════════════════════ */

export function CommunityExplore() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SharedPlan[]>([]);
  const [sortBy, setSortBy] = useState<CommunityFeedQuery["sortBy"]>("popular");
  const [activeVibe, setActiveVibe] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalPlans: 0, totalReviews: 0, activeUsers: 0 });
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [seeded, setSeeded] = useState(false);

  const loadFeed = useCallback(() => {
    const query: CommunityFeedQuery = {
      city: "Washington",
      sortBy,
      limit: 20,
    };
    if (activeVibe) query.vibeTags = [activeVibe];
    setPlans(getCommunityFeed(query));
    const s = getCommunityStats();
    setStats({ totalPlans: s.totalPlans, totalReviews: s.totalReviews, activeUsers: s.totalUsers });
    setInsights(getAIInsights("Washington", 3));
  }, [sortBy, activeVibe]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const handleSeed = () => {
    seedCommunityDemo();
    setSeeded(true);
    loadFeed();
  };

  const vibeFilters = ["Romantic", "Foodie", "Celebration", "Late Night", "Chill", "Upscale"];
  const sortOptions: Array<{ value: CommunityFeedQuery["sortBy"]; label: string; icon: React.ReactNode }> = [
    { value: "popular", label: "Popular", icon: <Flame style={{ width: 14, height: 14 }} /> },
    { value: "newest", label: "Newest", icon: <Sparkles style={{ width: 14, height: 14 }} /> },
    { value: "top_rated", label: "Top Rated", icon: <Star style={{ width: 14, height: 14 }} /> },
    { value: "nearby", label: "Nearby", icon: <Navigation style={{ width: 14, height: 14 }} /> },
  ];

  return (
    <Page>
      <Header
        eyebrow="Explore"
        title="Community"
        right={
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => navigate("/community/reputation")}
            style={{
              background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(6,214,160,0.2))",
              border: "1px solid rgba(139,92,246,0.3)",
              borderRadius: 20,
              padding: "6px 12px",
              color: "#c4b5fd",
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Trophy style={{ width: 14, height: 14 }} /> My Rep
          </motion.button>
        }
      />

      <div style={{ padding: "0 20px 120px" }}>
        {/* Community stats banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: "flex",
            justifyContent: "space-around",
            padding: "14px 0",
            marginBottom: 16,
            borderRadius: 16,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{stats.totalPlans}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>Plans</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{stats.totalReviews}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>Reviews</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{stats.activeUsers}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>Members</div>
          </div>
        </motion.div>

        {/* Seed demo if empty */}
        {plans.length === 0 && !seeded && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSeed}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: 16,
              background: "linear-gradient(135deg, #8B5CF6, #06D6A0)",
              border: "none",
              color: "#fff",
              fontWeight: 600,
              fontSize: 15,
              marginBottom: 20,
            }}
          >
            🎉 Load Community Demo
          </motion.button>
        )}

        {/* Sort tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 12, overflowX: "auto", paddingBottom: 4 }}>
          {sortOptions.map((opt) => (
            <motion.button
              key={opt.value}
              whileTap={{ scale: 0.93 }}
              onClick={() => setSortBy(opt.value)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "7px 14px",
                borderRadius: 20,
                border: sortBy === opt.value ? "1px solid rgba(139,92,246,0.5)" : "1px solid rgba(255,255,255,0.08)",
                background: sortBy === opt.value ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.04)",
                color: sortBy === opt.value ? "#c4b5fd" : "rgba(255,255,255,0.6)",
                fontSize: 12,
                fontWeight: 500,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {opt.icon} {opt.label}
            </motion.button>
          ))}
        </div>

        {/* Vibe filter chips */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
          {vibeFilters.map((v) => (
            <motion.button
              key={v}
              whileTap={{ scale: 0.93 }}
              onClick={() => setActiveVibe(activeVibe === v ? null : v)}
              style={{
                padding: "5px 12px",
                borderRadius: 16,
                border: activeVibe === v ? "1px solid rgba(6,214,160,0.5)" : "1px solid rgba(255,255,255,0.06)",
                background: activeVibe === v ? "rgba(6,214,160,0.12)" : "transparent",
                color: activeVibe === v ? "#06D6A0" : "rgba(255,255,255,0.5)",
                fontSize: 11,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {v}
            </motion.button>
          ))}
        </div>

        {/* AI Insights */}
        {insights.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>
              🧠 AI Insights from the community
            </div>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
              {insights.map((ins, i) => (
                <div
                  key={i}
                  style={{
                    minWidth: 200,
                    padding: "10px 14px",
                    borderRadius: 14,
                    background: "rgba(139,92,246,0.08)",
                    border: "1px solid rgba(139,92,246,0.15)",
                    fontSize: 12,
                    color: "rgba(255,255,255,0.7)",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: 9,
                      padding: "2px 6px",
                      borderRadius: 8,
                      background:
                        ins.category === "trending"
                          ? "rgba(255,107,107,0.15)"
                          : ins.category === "hidden_gem"
                          ? "rgba(6,214,160,0.15)"
                          : "rgba(255,255,255,0.08)",
                      color:
                        ins.category === "trending"
                          ? "#FF6B6B"
                          : ins.category === "hidden_gem"
                          ? "#06D6A0"
                          : "rgba(255,255,255,0.5)",
                      marginBottom: 6,
                      display: "inline-block",
                    }}
                  >
                    {ins.category.replace("_", " ")}
                  </span>
                  <div style={{ marginTop: 4 }}>{ins.insight}</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>
                    Based on {ins.basedOnReviews} reviews
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Map preview — simplified route visualization */}
        {plans.length > 0 && (
          <div
            style={{
              height: 180,
              borderRadius: 20,
              background: "linear-gradient(135deg, rgba(26,16,37,0.9), rgba(26,16,37,0.7))",
              border: "1px solid rgba(255,255,255,0.06)",
              marginBottom: 20,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Stylized map dots for plan routes */}
            {plans.slice(0, 6).map((plan, pi) => (
              <motion.div
                key={plan.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: pi * 0.08, ...spring }}
                onClick={() => navigate(`/community/plan/${plan.id}`)}
                style={{
                  position: "absolute",
                  left: `${15 + ((pi * 47 + 23) % 70)}%`,
                  top: `${15 + ((pi * 31 + 17) % 60)}%`,
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    background: `linear-gradient(135deg, ${["#FF6B6B", "#8B5CF6", "#06D6A0", "#4CC9F0", "#EE5A9D", "#FFD700"][pi % 6]}, rgba(0,0,0,0.3))`,
                    display: "grid",
                    placeItems: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                  }}
                >
                  {plan.totalStops}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    color: "rgba(255,255,255,0.6)",
                    textAlign: "center",
                    marginTop: 2,
                    maxWidth: 60,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {plan.title.split(" ").slice(0, 2).join(" ")}
                </div>
              </motion.div>
            ))}
            <div
              style={{
                position: "absolute",
                bottom: 10,
                left: 0,
                right: 0,
                textAlign: "center",
                fontSize: 10,
                color: "rgba(255,255,255,0.35)",
              }}
            >
              Tap a route to explore
            </div>
          </div>
        )}

        {/* Plan cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {plans.map((plan, i) => (
            <PlanCard key={plan.id} plan={plan} index={i} />
          ))}
        </div>

        {plans.length === 0 && seeded && (
          <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.4)" }}>
            No plans match your filters. Try different vibes!
          </div>
        )}
      </div>
    </Page>
  );
}

/* ─── Plan Card (used in explore feed) ─────────────────────── */

function PlanCard({ plan, index }: { plan: SharedPlan; index: number }) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, ...spring }}
      onClick={() => navigate(`/community/plan/${plan.id}`)}
      style={{
        borderRadius: 20,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.06)",
        overflow: "hidden",
        cursor: "pointer",
      }}
    >
      {/* Route preview strip */}
      <div
        style={{
          height: 4,
          background: `linear-gradient(90deg, #FF6B6B 0%, #8B5CF6 ${100 / Math.max(plan.totalStops, 1)}%, #06D6A0 100%)`,
        }}
      />

      <div style={{ padding: "14px 16px" }}>
        {/* Author row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              background: "linear-gradient(135deg, #8B5CF6, #EE5A9D)",
              display: "grid",
              placeItems: "center",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {plan.authorName[0]}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{plan.authorName}</div>
            <TierBadge tier={plan.authorTier} />
          </div>
          <span
            style={{
              fontSize: 9,
              padding: "2px 7px",
              borderRadius: 8,
              background:
                plan.origin === "custom"
                  ? "rgba(6,214,160,0.12)"
                  : plan.origin === "ai_generated"
                  ? "rgba(139,92,246,0.12)"
                  : "rgba(255,107,107,0.12)",
              color:
                plan.origin === "custom"
                  ? "#06D6A0"
                  : plan.origin === "ai_generated"
                  ? "#c4b5fd"
                  : "#FF6B6B",
            }}
          >
            {plan.origin === "custom" ? "Original" : plan.origin === "ai_generated" ? "AI" : "Remix"}
          </span>
        </div>

        {/* Title */}
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px" }}>{plan.title}</h3>

        {/* Stops preview */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
          {plan.stops.slice(0, 3).map((stop, si) => (
            <span key={stop.id} style={{ display: "flex", alignItems: "center", gap: 2 }}>
              <span
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.5)",
                  maxWidth: 90,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {stop.name}
              </span>
              {si < Math.min(plan.stops.length, 3) - 1 && (
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>→</span>
              )}
            </span>
          ))}
          {plan.stops.length > 3 && (
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
              +{plan.stops.length - 3} more
            </span>
          )}
        </div>

        {/* Tags */}
        <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
          {plan.vibeTags.slice(0, 3).map((t) => (
            <span
              key={t}
              style={{
                fontSize: 9,
                padding: "2px 7px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.5)",
              }}
            >
              {t}
            </span>
          ))}
          {plan.occasionTags.slice(0, 2).map((t) => (
            <span
              key={t}
              style={{
                fontSize: 9,
                padding: "2px 7px",
                borderRadius: 8,
                background: "rgba(238,90,157,0.1)",
                color: "#EE5A9D",
              }}
            >
              {t}
            </span>
          ))}
        </div>

        {/* Stats bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 11,
            color: "rgba(255,255,255,0.45)",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <MapPin style={{ width: 12, height: 12 }} /> {plan.totalStops} stops
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <Clock style={{ width: 12, height: 12 }} /> {plan.totalDurationHours}h
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <Stars rating={plan.avgRating} size={10} />{" "}
            <span>{plan.avgRating > 0 ? plan.avgRating.toFixed(1) : "—"}</span>
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <Bookmark style={{ width: 12, height: 12 }} /> {plan.saves}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PLAN DETAIL — Full view with reviews, remix, save
   ═══════════════════════════════════════════════════════════════ */

export function CommunityPlanDetail() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<SharedPlan | null>(null);
  const [reviews, setReviews] = useState<ExperienceReview[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!planId) return;
    const p = getSharedPlan(planId);
    if (p) {
      setPlan(p);
      setReviews(getPlanReviews(planId));
    }
  }, [planId]);

  const handleSave = () => {
    if (!plan) return;
    savePlanToCollection(plan.id, "demo-user");
    setSaved(true);
  };

  const handleRemix = async () => {
    if (!plan) return;
    const remixed = await remixPlan(plan, "demo-user", {});
    if (remixed) navigate(`/community/plan/${remixed.id}`);
  };

  if (!plan) {
    return (
      <Page>
        <Header eyebrow="Community" title="Plan Not Found" />
        <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
          This plan doesn't exist or has been removed.
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <Header eyebrow="Community Plan" title="" />

      <div style={{ padding: "0 20px 120px" }}>
        {/* Plan header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>{plan.title}</h2>

          {/* Author */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                background: "linear-gradient(135deg, #8B5CF6, #EE5A9D)",
                display: "grid",
                placeItems: "center",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              {plan.authorName[0]}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{plan.authorName}</div>
              <TierBadge tier={plan.authorTier} />
            </div>
          </div>

          {plan.description && (
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", margin: "0 0 14px", lineHeight: 1.5 }}>
              {plan.description}
            </p>
          )}

          {/* Tags */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
            {plan.vibeTags.map((t) => (
              <span
                key={t}
                style={{
                  fontSize: 11,
                  padding: "3px 10px",
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                {t}
              </span>
            ))}
            {plan.occasionTags.map((t) => (
              <span
                key={t}
                style={{
                  fontSize: 11,
                  padding: "3px 10px",
                  borderRadius: 12,
                  background: "rgba(238,90,157,0.1)",
                  color: "#EE5A9D",
                }}
              >
                {t}
              </span>
            ))}
          </div>

          {/* Stats */}
          <div
            style={{
              display: "flex",
              gap: 16,
              padding: "12px 16px",
              borderRadius: 14,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
              marginBottom: 16,
              fontSize: 12,
              color: "rgba(255,255,255,0.6)",
            }}
          >
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>{plan.saves}</div>
              <div>Saves</div>
            </div>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>{plan.completions}</div>
              <div>Completed</div>
            </div>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>
                {plan.avgRating > 0 ? plan.avgRating.toFixed(1) : "—"}
              </div>
              <div>Rating</div>
            </div>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>{plan.remixCount}</div>
              <div>Remixes</div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={handleSave}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: 14,
                background: saved ? "rgba(6,214,160,0.15)" : "rgba(255,255,255,0.06)",
                border: saved ? "1px solid rgba(6,214,160,0.3)" : "1px solid rgba(255,255,255,0.08)",
                color: saved ? "#06D6A0" : "#fff",
                fontWeight: 600,
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              {saved ? <Check style={{ width: 16, height: 16 }} /> : <Bookmark style={{ width: 16, height: 16 }} />}
              {saved ? "Saved!" : "Save"}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={handleRemix}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: 14,
                background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(238,90,157,0.2))",
                border: "1px solid rgba(139,92,246,0.3)",
                color: "#c4b5fd",
                fontWeight: 600,
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Shuffle style={{ width: 16, height: 16 }} /> Remix
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.94 }}
              style={{
                width: 48,
                padding: "12px",
                borderRadius: 14,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#fff",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Share2 style={{ width: 16, height: 16 }} />
            </motion.button>
          </div>
        </motion.div>

        {/* ─── Stops ──────────────────────────────────────── */}
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 12 }}>
          Route ({plan.totalStops} stops · ~{plan.totalDurationHours}h)
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: 24 }}>
          {plan.stops.map((stop, si) => (
            <div key={stop.id}>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: si * 0.06 }}
                style={{
                  display: "flex",
                  gap: 12,
                  padding: "12px 0",
                }}
              >
                {/* Stop number */}
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    background: si === 0 ? "linear-gradient(135deg, #FF6B6B, #EE5A9D)" : si === plan.stops.length - 1 ? "linear-gradient(135deg, #06D6A0, #4CC9F0)" : "rgba(255,255,255,0.1)",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {si + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{stop.name}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                    {stop.category}
                    {stop.city ? ` · ${stop.city}` : ""}
                  </div>
                  {stop.authorTip && (
                    <div
                      style={{
                        fontSize: 11,
                        color: "#06D6A0",
                        marginTop: 4,
                        fontStyle: "italic",
                      }}
                    >
                      💡 "{stop.authorTip}"
                    </div>
                  )}
                  {stop.avgRating !== undefined && stop.avgRating > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                      <Stars rating={stop.avgRating} size={10} />
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
                        ({stop.reviewCount} reviews)
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
              {si < plan.stops.length - 1 && (
                <div
                  style={{
                    width: 1,
                    height: 16,
                    background: "rgba(255,255,255,0.1)",
                    marginLeft: 14,
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* ─── Reviews ────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.5)", margin: 0 }}>
            Reviews ({reviews.length})
          </h3>
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => setShowReviewForm(true)}
            style={{
              fontSize: 12,
              padding: "6px 12px",
              borderRadius: 12,
              background: "linear-gradient(135deg, #8B5CF6, #06D6A0)",
              border: "none",
              color: "#fff",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Star style={{ width: 12, height: 12 }} /> Write Review
          </motion.button>
        </div>

        {reviews.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "24px",
              borderRadius: 16,
              background: "rgba(255,255,255,0.03)",
              color: "rgba(255,255,255,0.35)",
              fontSize: 13,
            }}
          >
            No reviews yet. Be the first to share your experience!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>

      {/* Review form modal */}
      <AnimatePresence>
        {showReviewForm && plan && (
          <ReviewFormModal plan={plan} onClose={() => setShowReviewForm(false)} onSubmit={(r) => {
            setReviews((prev) => [r, ...prev]);
            setShowReviewForm(false);
          }} />
        )}
      </AnimatePresence>
    </Page>
  );
}

/* ─── Review Card ──────────────────────────────────────────── */

function ReviewCard({ review }: { review: ExperienceReview }) {
  const typeLabel =
    review.reviewType === "full_story"
      ? "📝 Story"
      : review.reviewType === "stop_rating"
      ? "⭐ Rating"
      : "📍 Auto-tracked";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        padding: "14px 16px",
        borderRadius: 16,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Author */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            background: "linear-gradient(135deg, #4CC9F0, #06D6A0)",
            display: "grid",
            placeItems: "center",
            fontSize: 10,
            fontWeight: 700,
          }}
        >
          {review.userName[0]}
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>{review.userName}</span>
          <span style={{ marginLeft: 6 }}>
            <TierBadge tier={review.userTier} />
          </span>
        </div>
        <span
          style={{
            fontSize: 9,
            padding: "2px 6px",
            borderRadius: 8,
            background: "rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.4)",
          }}
        >
          {typeLabel}
        </span>
      </div>

      {/* Rating */}
      <div style={{ marginBottom: 6 }}>
        <Stars rating={review.overallRating} size={14} />
      </div>

      {/* Story content */}
      {review.title && <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{review.title}</div>}
      {review.body && (
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: "0 0 8px", lineHeight: 1.5 }}>
          {review.body}
        </p>
      )}

      {/* Highlight */}
      {review.highlight && (
        <div
          style={{
            fontSize: 11,
            color: "#06D6A0",
            fontStyle: "italic",
            marginBottom: 6,
          }}
        >
          ✨ {review.highlight}
        </div>
      )}

      {/* Stop ratings summary */}
      {review.stopRatings.length > 0 && (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
          {review.stopRatings.map((sr) => (
            <span
              key={sr.stopId}
              style={{
                fontSize: 10,
                padding: "2px 6px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.5)",
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              {sr.stopName}: <Stars rating={sr.rating} size={8} />
            </span>
          ))}
        </div>
      )}

      {/* Bottom row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
          {new Date(review.createdAt).toLocaleDateString()}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: review.wouldRecommend ? "#06D6A0" : "rgba(255,255,255,0.3)" }}>
          {review.wouldRecommend ? <ThumbsUp style={{ width: 10, height: 10 }} /> : null}
          {review.wouldRecommend ? "Recommends" : ""}
        </span>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   REVIEW FORM MODAL — Write stop ratings or full story
   ═══════════════════════════════════════════════════════════════ */

function ReviewFormModal({
  plan,
  onClose,
  onSubmit,
}: {
  plan: SharedPlan;
  onClose: () => void;
  onSubmit: (r: ExperienceReview) => void;
}) {
  const [reviewType, setReviewType] = useState<ReviewType>("stop_rating");
  const [overallRating, setOverallRating] = useState(0);
  const [stopRatings, setStopRatings] = useState<Map<string, { rating: number; note: string }>>(new Map());
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [highlight, setHighlight] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleStopRate = (stopId: string, rating: number) => {
    setStopRatings((prev) => {
      const next = new Map(prev);
      const existing = next.get(stopId) || { rating: 0, note: "" };
      next.set(stopId, { ...existing, rating });
      return next;
    });
  };

  const handleSubmit = async () => {
    if (overallRating === 0) return;
    setSubmitting(true);

    const ratings: StopRating[] = [];
    stopRatings.forEach((val, stopId) => {
      const stop = plan.stops.find((s) => s.id === stopId);
      if (val.rating > 0) {
        ratings.push({ stopId, stopName: stop?.name || "", rating: val.rating, note: val.note || undefined });
      }
    });

    const review = await submitReview({
      userId: "demo-user",
      userName: "Tyrone",
      userTier: "newcomer",
      planId: plan.id,
      reviewType,
      overallRating,
      wouldRecommend,
      stopRatings: ratings,
      title: reviewType === "full_story" ? title : undefined,
      body: reviewType === "full_story" ? body : undefined,
      highlight: highlight || undefined,
    });

    onSubmit(review);
    setSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(10px)",
        overflowY: "auto",
      }}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={spring}
        style={{
          marginTop: 60,
          minHeight: "calc(100vh - 60px)",
          borderRadius: "24px 24px 0 0",
          background: "#1A1025",
          padding: "20px",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Share Your Experience</h3>
          <motion.button whileTap={{ scale: 0.9 }} onClick={onClose} style={{ background: "none", border: "none", color: "#fff" }}>
            <X style={{ width: 20, height: 20 }} />
          </motion.button>
        </div>

        {/* Review type selector */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          {[
            { type: "stop_rating" as ReviewType, label: "Quick Ratings", icon: "⭐" },
            { type: "full_story" as ReviewType, label: "Full Story", icon: "📝" },
          ].map((opt) => (
            <motion.button
              key={opt.type}
              whileTap={{ scale: 0.94 }}
              onClick={() => setReviewType(opt.type)}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: 14,
                border: reviewType === opt.type ? "1px solid rgba(139,92,246,0.5)" : "1px solid rgba(255,255,255,0.08)",
                background: reviewType === opt.type ? "rgba(139,92,246,0.12)" : "rgba(255,255,255,0.04)",
                color: reviewType === opt.type ? "#c4b5fd" : "rgba(255,255,255,0.5)",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {opt.icon} {opt.label}
            </motion.button>
          ))}
        </div>

        {/* Overall rating */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 6 }}>
            Overall Rating
          </label>
          <StarInput value={overallRating} onChange={setOverallRating} />
        </div>

        {/* Per-stop ratings */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 8 }}>
            Rate Each Stop
          </label>
          {plan.stops.map((stop) => (
            <div
              key={stop.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <span style={{ fontSize: 13, maxWidth: "50%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {stop.name}
              </span>
              <StarInput
                value={stopRatings.get(stop.id)?.rating || 0}
                onChange={(r) => handleStopRate(stop.id, r)}
              />
            </div>
          ))}
        </div>

        {/* Full story fields */}
        {reviewType === "full_story" && (
          <>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 6 }}>
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your experience a title..."
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#fff",
                  fontSize: 14,
                  outline: "none",
                }}
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 6 }}>
                Your Story
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Tell the community about your experience..."
                rows={4}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#fff",
                  fontSize: 13,
                  outline: "none",
                  resize: "vertical",
                  lineHeight: 1.5,
                }}
              />
            </div>
          </>
        )}

        {/* Highlight */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 6 }}>
            One-line takeaway (optional)
          </label>
          <input
            type="text"
            value={highlight}
            onChange={(e) => setHighlight(e.target.value)}
            placeholder="Best part of the night was..."
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#fff",
              fontSize: 13,
              outline: "none",
            }}
          />
        </div>

        {/* Would recommend */}
        <div
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, padding: "10px 0" }}
        >
          <span style={{ fontSize: 13 }}>Would you recommend this plan?</span>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setWouldRecommend(!wouldRecommend)}
            style={{
              width: 48,
              height: 28,
              borderRadius: 14,
              background: wouldRecommend ? "#06D6A0" : "rgba(255,255,255,0.15)",
              border: "none",
              position: "relative",
            }}
          >
            <motion.div
              animate={{ x: wouldRecommend ? 22 : 2 }}
              transition={spring}
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                background: "#fff",
                position: "absolute",
                top: 2,
              }}
            />
          </motion.button>
        </div>

        {/* Submit */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSubmit}
          disabled={overallRating === 0 || submitting}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 16,
            background:
              overallRating === 0
                ? "rgba(255,255,255,0.08)"
                : "linear-gradient(135deg, #8B5CF6, #06D6A0)",
            border: "none",
            color: overallRating === 0 ? "rgba(255,255,255,0.3)" : "#fff",
            fontWeight: 700,
            fontSize: 15,
          }}
        >
          {submitting ? "Submitting..." : "Share Review"}
        </motion.button>

        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textAlign: "center", marginTop: 8 }}>
          {reviewType === "full_story" ? "Earn 30 rep + 15 Confetti" : "Earn 10 rep + 5 Confetti per stop rated"}
        </p>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   REPUTATION PROFILE — Tier, badges, stats
   ═══════════════════════════════════════════════════════════════ */

export function ReputationProfile() {
  const navigate = useNavigate();
  const [rep, setRep] = useState<UserReputation | null>(null);
  const [myPlans, setMyPlans] = useState<SharedPlan[]>([]);
  const allTiers = getAllTiers();

  useEffect(() => {
    setRep(getUserReputation("demo-user"));
    setMyPlans(getUserSharedPlans("demo-user"));
  }, []);

  if (!rep) {
    return (
      <Page>
        <Header eyebrow="Community" title="My Reputation" />
        <div style={{ padding: "40px 20px", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
          Start sharing plans and reviewing experiences to build your reputation!
        </div>
      </Page>
    );
  }

  const currentTierInfo = getReputationTierInfo(rep.tier);
  const tierIndex = allTiers.findIndex((t) => t.tier === rep.tier);
  const nextTier = allTiers[tierIndex + 1];
  const progress = nextTier
    ? ((rep.totalPoints - allTiers[tierIndex].minPoints) / (nextTier.minPoints - allTiers[tierIndex].minPoints)) * 100
    : 100;

  return (
    <Page>
      <Header eyebrow="Community" title="My Reputation" />

      <div style={{ padding: "0 20px 120px" }}>
        {/* Tier card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            padding: "24px",
            borderRadius: 24,
            background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,214,160,0.1))",
            border: "1px solid rgba(139,92,246,0.2)",
            textAlign: "center",
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 48 }}>{currentTierInfo.icon}</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: "8px 0 4px" }}>{currentTierInfo.label}</h2>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>{rep.totalPoints.toLocaleString()} reputation points</div>

          {/* Progress bar */}
          {nextTier && (
            <div style={{ marginTop: 16 }}>
              <div
                style={{
                  height: 6,
                  borderRadius: 3,
                  background: "rgba(255,255,255,0.1)",
                  overflow: "hidden",
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  style={{
                    height: "100%",
                    borderRadius: 3,
                    background: "linear-gradient(90deg, #8B5CF6, #06D6A0)",
                  }}
                />
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
                {nextTier.minPoints - rep.totalPoints} pts to {nextTier.label} {nextTier.icon}
              </div>
            </div>
          )}
        </motion.div>

        {/* Confetti earned */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "12px",
            borderRadius: 14,
            background: "rgba(255,107,107,0.08)",
            border: "1px solid rgba(255,107,107,0.15)",
            marginBottom: 20,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          🎊 {rep.confettiEarned} Confetti earned from community
        </div>

        {/* Stats grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
            marginBottom: 24,
          }}
        >
          {[
            { label: "Plans Shared", value: rep.plansShared, icon: "📤" },
            { label: "Reviews", value: rep.reviewsWritten, icon: "⭐" },
            { label: "Plans Done", value: rep.plansCompleted, icon: "✅" },
            { label: "Helpful Votes", value: rep.helpfulVotes, icon: "👍" },
            { label: "Day Streak", value: rep.currentStreak, icon: "🔥" },
            { label: "Member Since", value: new Date(rep.joinedAt).toLocaleDateString("en-US", { month: "short", year: "2-digit" }), icon: "📅" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                padding: "12px",
                borderRadius: 14,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 10, marginBottom: 2 }}>{stat.icon}</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{stat.value}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Badges */}
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 12 }}>
          Badges ({rep.badges.length})
        </h3>
        {rep.badges.length > 0 ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
            {rep.badges.map((badge) => (
              <motion.div
                key={badge.id}
                whileHover={{ scale: 1.05 }}
                style={{
                  padding: "10px 14px",
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  textAlign: "center",
                  minWidth: 80,
                }}
              >
                <div style={{ fontSize: 24 }}>{badge.icon}</div>
                <div style={{ fontSize: 10, fontWeight: 600, marginTop: 4 }}>{badge.name}</div>
                <div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{badge.description}</div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: "20px",
              borderRadius: 16,
              background: "rgba(255,255,255,0.03)",
              textAlign: "center",
              color: "rgba(255,255,255,0.35)",
              fontSize: 12,
              marginBottom: 24,
            }}
          >
            Share plans and write reviews to earn badges!
          </div>
        )}

        {/* Tier progression */}
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 12 }}>
          Tier Progression
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
          {allTiers.map((t) => {
            const isActive = t.tier === rep.tier;
            const isAchieved = rep.totalPoints >= t.minPoints;
            return (
              <div
                key={t.tier}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 14px",
                  borderRadius: 14,
                  background: isActive ? "rgba(139,92,246,0.1)" : "rgba(255,255,255,0.02)",
                  border: isActive ? "1px solid rgba(139,92,246,0.3)" : "1px solid rgba(255,255,255,0.04)",
                  opacity: isAchieved ? 1 : 0.4,
                }}
              >
                <span style={{ fontSize: 20 }}>{t.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{t.label}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{t.minPoints.toLocaleString()} pts</div>
                </div>
                {isActive && (
                  <span style={{ fontSize: 10, color: "#06D6A0", fontWeight: 600 }}>Current</span>
                )}
                {isAchieved && !isActive && (
                  <Check style={{ width: 14, height: 14, color: "#06D6A0" }} />
                )}
              </div>
            );
          })}
        </div>

        {/* My shared plans */}
        {myPlans.length > 0 && (
          <>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 12 }}>
              My Shared Plans ({myPlans.length})
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {myPlans.map((plan, i) => (
                <PlanCard key={plan.id} plan={plan} index={i} />
              ))}
            </div>
          </>
        )}
      </div>
    </Page>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SHARE PLAN FLOW — Share an existing trip as community plan
   ═══════════════════════════════════════════════════════════════ */

export function SharePlanFlow() {
  const navigate = useNavigate();
  const [description, setDescription] = useState("");
  const [vibeTags, setVibeTags] = useState<string[]>([]);
  const [occasionTags, setOccasionTags] = useState<string[]>([]);
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);

  const vibeOptions = ["Romantic", "Foodie", "Chill", "Upscale", "Adventurous", "Late Night", "Celebration", "Cultural"];
  const occasionOptions = ["Date Night", "Birthday", "Anniversary", "Girls Night", "Guys Night", "Family", "Tourist", "Solo"];

  const toggleTag = (tag: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(tag) ? list.filter((t) => t !== tag) : [...list, tag]);
  };

  const handleShare = async () => {
    setSharing(true);
    // In production, this would use the user's actual trip plan
    // For demo, we simulate sharing
    setShared(true);
    setSharing(false);
  };

  if (shared) {
    return (
      <Page>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", padding: 20, textAlign: "center" }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={spring}
            style={{ fontSize: 64, marginBottom: 16 }}
          >
            🎉
          </motion.div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Plan Shared!</h2>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>
            You earned 50 rep points + 25 Confetti
          </p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/community")}
            style={{
              marginTop: 16,
              padding: "12px 32px",
              borderRadius: 14,
              background: "linear-gradient(135deg, #8B5CF6, #06D6A0)",
              border: "none",
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            View in Community
          </motion.button>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <Header eyebrow="Community" title="Share Your Plan" />

      <div style={{ padding: "0 20px 120px" }}>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 20 }}>
          Share this plan with the community and earn Confetti points when others save, complete, or remix it.
        </p>

        {/* Description */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 6 }}>
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a note about this plan — what makes it special?"
            rows={3}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#fff",
              fontSize: 13,
              outline: "none",
              resize: "vertical",
              lineHeight: 1.5,
            }}
          />
        </div>

        {/* Vibe tags */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 8 }}>
            Vibe Tags
          </label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {vibeOptions.map((v) => (
              <motion.button
                key={v}
                whileTap={{ scale: 0.93 }}
                onClick={() => toggleTag(v, vibeTags, setVibeTags)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 14,
                  border: vibeTags.includes(v) ? "1px solid rgba(139,92,246,0.5)" : "1px solid rgba(255,255,255,0.08)",
                  background: vibeTags.includes(v) ? "rgba(139,92,246,0.15)" : "transparent",
                  color: vibeTags.includes(v) ? "#c4b5fd" : "rgba(255,255,255,0.5)",
                  fontSize: 12,
                }}
              >
                {v}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Occasion tags */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 8 }}>
            Occasion Tags
          </label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {occasionOptions.map((o) => (
              <motion.button
                key={o}
                whileTap={{ scale: 0.93 }}
                onClick={() => toggleTag(o, occasionTags, setOccasionTags)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 14,
                  border: occasionTags.includes(o) ? "1px solid rgba(238,90,157,0.5)" : "1px solid rgba(255,255,255,0.08)",
                  background: occasionTags.includes(o) ? "rgba(238,90,157,0.12)" : "transparent",
                  color: occasionTags.includes(o) ? "#EE5A9D" : "rgba(255,255,255,0.5)",
                  fontSize: 12,
                }}
              >
                {o}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Points preview */}
        <div
          style={{
            padding: "14px 16px",
            borderRadius: 16,
            background: "rgba(139,92,246,0.08)",
            border: "1px solid rgba(139,92,246,0.15)",
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: "#c4b5fd" }}>You'll earn:</div>
          <div style={{ display: "flex", justifyContent: "space-around", fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>+50</div>
              <div>Rep Points</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>+25</div>
              <div>Confetti</div>
            </div>
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textAlign: "center", marginTop: 8 }}>
            Plus ongoing rewards when people save, complete, or remix your plan
          </div>
        </div>

        {/* Share button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleShare}
          disabled={sharing}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 16,
            background: "linear-gradient(135deg, #8B5CF6, #06D6A0)",
            border: "none",
            color: "#fff",
            fontWeight: 700,
            fontSize: 15,
          }}
        >
          {sharing ? "Sharing..." : "🎉 Share with Community"}
        </motion.button>
      </div>
    </Page>
  );
}
