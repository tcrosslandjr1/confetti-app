/**
 * Business Portal — Cream/Coral themed business management interface
 *
 * Full-featured portal matching confettiplan.lovable.app design language:
 *  - Cream background (#FFF8F0), coral/red accents (#E85D4A)
 *  - Serif italic headings, clean white cards, rounded corners
 *  - Sidebar nav: Dashboard, Campaigns, Coupons, Venue, Team, Analytics, Credits
 *
 * Wired to: boost-credits.ts + business-portal.ts agents
 */
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Megaphone,
  Ticket,
  MapPin,
  Users,
  BarChart3,
  CreditCard,
  Bell,
  LogOut,
  ChevronRight,
  Plus,
  Eye,
  MousePointerClick,
  TrendingUp,
  Settings,
  Check,
  X,
  Calendar,
  Clock,
  Star,
  Upload,
  Trash2,
  Edit3,
  Copy,
  Crown,
  Shield,
  UserPlus,
  DollarSign,
  Zap,
  Gift,
  Percent,
  ExternalLink,
  Camera,
  Menu as MenuIcon,
} from "lucide-react";
import {
  // Business
  getBusiness,
  BUSINESS_TIERS,
  purchaseCredits,
  updateBusinessTier,
  // Campaigns
  createCampaign,
  getBusinessCampaigns,
  getCampaignCoupon,
  // Coupons
  createCoupon,
  // Team
  inviteTeamMember,
  removeTeamMember,
  updateTeamMemberRole,
  getTeamMembers,
  // Analytics
  getBusinessAnalytics,
  getCampaignAnalytics,
  // Types
  type BusinessAccount,
  type BusinessTier,
  type TeamRole,
  type TeamMember,
  type BoostCampaign,
  type BoostAnalytics,
  type Coupon,
  type BusinessTierConfig,
} from "../lib/agents";
import {
  getPortalDashboard,
  getPortalNotifications,
  markNotificationsRead,
  getVenueProfile,
  upsertVenueProfile,
  addVenuePhoto,
  addMenuItem,
  removeMenuItem,
  seedPortalDemo,
  type PortalSection,
  type PortalDashboardData,
  type PortalNotification,
  type VenueProfile,
  type MenuItem as MenuItemType,
} from "../lib/agents/business-portal";

// ═══════════════════════════════════════════════════════════
// Design Tokens (matches confettiplan.lovable.app)
// ═══════════════════════════════════════════════════════════
const T = {
  bg: "#FFF8F0",
  card: "#FFFFFF",
  coral: "#E85D4A",
  coralHover: "#D14D3B",
  coralLight: "#FEF0EE",
  text: "#1A1A1A",
  textMuted: "#6B7280",
  textLight: "#9CA3AF",
  border: "#F0E6DB",
  borderLight: "#F5EDE4",
  accent: "#F59E0B",
  green: "#10B981",
  greenLight: "#D1FAE5",
  purple: "#8B5CF6",
  radius: 16,
  radiusSm: 10,
  shadow: "0 2px 12px rgba(0,0,0,0.06)",
  shadowLg: "0 8px 30px rgba(0,0,0,0.08)",
} as const;

// ═══════════════════════════════════════════════════════════
// Shared UI Primitives
// ═══════════════════════════════════════════════════════════

function Card({
  children,
  style,
  onClick,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: T.card,
        borderRadius: T.radius,
        padding: 24,
        border: `1px solid ${T.border}`,
        boxShadow: T.shadow,
        cursor: onClick ? "pointer" : undefined,
        transition: "box-shadow 0.2s, transform 0.2s",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  sub?: string;
}) {
  return (
    <Card style={{ textAlign: "center", padding: 20 }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: `${color}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 12px",
        }}
      >
        <Icon size={20} color={color} />
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: T.text }}>{value}</div>
      <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: T.textLight, marginTop: 2 }}>{sub}</div>}
    </Card>
  );
}

function Btn({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled,
  icon: Icon,
  style,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  icon?: React.ElementType;
  style?: React.CSSProperties;
}) {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    border: "none",
    borderRadius: T.radiusSm,
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    transition: "all 0.15s",
    fontSize: size === "sm" ? 13 : size === "lg" ? 16 : 14,
    padding: size === "sm" ? "8px 14px" : size === "lg" ? "14px 28px" : "10px 20px",
    ...(variant === "primary"
      ? { background: T.coral, color: "#fff" }
      : variant === "secondary"
      ? { background: T.coralLight, color: T.coral, border: `1px solid ${T.coral}30` }
      : { background: "transparent", color: T.textMuted }),
    ...style,
  };

  return (
    <button style={base} onClick={onClick} disabled={disabled}>
      {Icon && <Icon size={size === "sm" ? 14 : 16} />}
      {children}
    </button>
  );
}

function Badge({
  children,
  color = T.coral,
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 700,
        background: `${color}15`,
        color,
        textTransform: "uppercase",
        letterSpacing: 0.5,
      }}
    >
      {children}
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: 22,
        fontWeight: 700,
        color: T.text,
        fontFamily: "'Georgia', 'Times New Roman', serif",
        fontStyle: "italic",
        marginBottom: 20,
      }}
    >
      {children}
    </h2>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  multiline?: boolean;
}) {
  const shared: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: T.radiusSm,
    border: `1px solid ${T.border}`,
    fontSize: 14,
    background: T.bg,
    color: T.text,
    outline: "none",
    fontFamily: "inherit",
  };
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.textMuted, marginBottom: 6 }}>
        {label}
      </label>
      {multiline ? (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ ...shared, resize: "vertical" }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={shared}
        />
      )}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.textMuted, marginBottom: 6 }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "10px 14px",
          borderRadius: T.radiusSm,
          border: `1px solid ${T.border}`,
          fontSize: 14,
          background: T.bg,
          color: T.text,
          outline: "none",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Sidebar Navigation
// ═══════════════════════════════════════════════════════════

const NAV_ITEMS: { key: PortalSection; label: string; icon: React.ElementType }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "campaigns", label: "Campaigns", icon: Megaphone },
  { key: "coupons", label: "Coupons", icon: Ticket },
  { key: "venue", label: "Venue", icon: MapPin },
  { key: "team", label: "Team", icon: Users },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "credits", label: "Credits", icon: CreditCard },
];

function Sidebar({
  active,
  onNav,
  businessName,
  tier,
  onLogout,
  mobileOpen,
  onCloseMobile,
}: {
  active: PortalSection;
  onNav: (s: PortalSection) => void;
  businessName: string;
  tier: BusinessTier;
  onLogout: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const tierColors: Record<BusinessTier, string> = {
    starter: T.textMuted,
    featured: T.coral,
    spotlight: T.accent,
  };

  return (
    <>
      {/* mobile overlay */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.3)",
            zIndex: 998,
          }}
        />
      )}
      <aside
        style={{
          width: 260,
          background: T.card,
          borderRight: `1px solid ${T.border}`,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          position: mobileOpen ? "fixed" : undefined,
          left: mobileOpen ? 0 : undefined,
          top: mobileOpen ? 0 : undefined,
          zIndex: mobileOpen ? 999 : undefined,
          boxShadow: mobileOpen ? T.shadowLg : undefined,
          transition: "transform 0.2s",
        }}
      >
        {/* Brand */}
        <div style={{ padding: "28px 24px 20px", borderBottom: `1px solid ${T.borderLight}` }}>
          <div
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontStyle: "italic",
              fontSize: 24,
              fontWeight: 700,
              color: T.coral,
              marginBottom: 6,
            }}
          >
            Confetti
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{businessName}</div>
          <Badge color={tierColors[tier]}>{tier}</Badge>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: "16px 12px", overflowY: "auto" }}>
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
            const isActive = active === key;
            return (
              <button
                key={key}
                onClick={() => {
                  onNav(key);
                  onCloseMobile();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: T.radiusSm,
                  border: "none",
                  background: isActive ? T.coralLight : "transparent",
                  color: isActive ? T.coral : T.textMuted,
                  fontSize: 14,
                  fontWeight: isActive ? 700 : 500,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  marginBottom: 2,
                  textAlign: "left",
                }}
              >
                <Icon size={18} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: "16px 12px", borderTop: `1px solid ${T.borderLight}` }}>
          <button
            onClick={onLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "100%",
              padding: "10px 16px",
              borderRadius: T.radiusSm,
              border: "none",
              background: "transparent",
              color: T.textMuted,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// Portal Header
// ═══════════════════════════════════════════════════════════

function PortalHeader({
  title,
  subtitle,
  notifications,
  onNotificationClick,
  onMenuClick,
}: {
  title: string;
  subtitle?: string;
  notifications: number;
  onNotificationClick: () => void;
  onMenuClick: () => void;
}) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 32px",
        borderBottom: `1px solid ${T.border}`,
        background: T.card,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <button
          onClick={onMenuClick}
          style={{
            display: "none",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: T.textMuted,
            padding: 4,
          }}
          className="portal-mobile-menu"
        >
          <MenuIcon size={24} />
        </button>
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: T.text,
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontStyle: "italic",
              margin: 0,
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: 13, color: T.textMuted, margin: "4px 0 0" }}>{subtitle}</p>
          )}
        </div>
      </div>
      <button
        onClick={onNotificationClick}
        style={{
          position: "relative",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 8,
          borderRadius: 10,
          color: T.textMuted,
        }}
      >
        <Bell size={22} />
        {notifications > 0 && (
          <span
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: T.coral,
              color: "#fff",
              fontSize: 10,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {notifications}
          </span>
        )}
      </button>
    </header>
  );
}

// ═══════════════════════════════════════════════════════════
// Dashboard View
// ═══════════════════════════════════════════════════════════

function DashboardView({ data }: { data: PortalDashboardData }) {
  return (
    <div>
      <SectionTitle>Welcome back</SectionTitle>

      {/* Quick Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 28 }}>
        <StatCard icon={CreditCard} label="Credit Balance" value={data.quickStats.creditBalance.toLocaleString()} color={T.coral} />
        <StatCard icon={Eye} label="Impressions" value={data.quickStats.totalImpressions.toLocaleString()} color={T.purple} />
        <StatCard icon={MapPin} label="Check-ins" value={data.quickStats.totalCheckIns} color={T.green} />
        <StatCard
          icon={TrendingUp}
          label="Conversion"
          value={`${(data.quickStats.conversionRate * 100).toFixed(1)}%`}
          color={T.accent}
        />
      </div>

      {/* Active Campaigns */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0 }}>Active Campaigns</h3>
          <Badge color={T.green}>{data.activeCampaigns.length} live</Badge>
        </div>
        {data.activeCampaigns.length === 0 ? (
          <p style={{ color: T.textMuted, fontSize: 14 }}>No active campaigns. Create one to start reaching diners.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {data.activeCampaigns.slice(0, 5).map((c) => (
              <div
                key={c.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  background: T.bg,
                  borderRadius: T.radiusSm,
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: T.textMuted }}>
                    {c.targetVibes.join(", ")} &middot; {c.dailyCreditBudget} credits/view
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.coral }}>{c.impressions}</div>
                  <div style={{ fontSize: 11, color: T.textMuted }}>impressions</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recent Notifications */}
      <Card>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 16 }}>Notifications</h3>
        {data.notifications.length === 0 ? (
          <p style={{ color: T.textMuted, fontSize: 14 }}>All caught up!</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.notifications.slice(0, 5).map((n) => (
              <div
                key={n.id}
                style={{
                  display: "flex",
                  gap: 12,
                  padding: "10px 14px",
                  background: n.isRead ? "transparent" : T.coralLight,
                  borderRadius: T.radiusSm,
                  alignItems: "flex-start",
                }}
              >
                <Bell size={14} color={n.isRead ? T.textLight : T.coral} style={{ marginTop: 3, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: n.isRead ? 500 : 700, color: T.text }}>{n.title}</div>
                  <div style={{ fontSize: 12, color: T.textMuted }}>{n.message}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Campaigns View
// ═══════════════════════════════════════════════════════════

function CampaignsView({ businessId }: { businessId: string }) {
  const [campaigns, setCampaigns] = useState<BoostCampaign[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [vibes, setVibes] = useState("");
  const [credits, setCredits] = useState("5");
  const [budget, setBudget] = useState("500");

  useEffect(() => {
    setCampaigns(getBusinessCampaigns(businessId));
  }, [businessId]);

  const biz = getBusiness(businessId);

  function handleCreate() {
    if (!biz || !name || biz.venueIds.length === 0) return;
    const c = createCampaign(businessId, biz.venueIds[0], name, {
      targetVibes: vibes.split(",").map((v) => v.trim()).filter(Boolean),
      dailyCreditBudget: parseInt(credits) || 5,
    });
    if (c) {
      setCampaigns(getBusinessCampaigns(businessId));
      setShowCreate(false);
      setName("");
      setVibes("");
    }
  }

  const statusColors: Record<string, string> = {
    active: T.green,
    paused: T.accent,
    draft: T.textMuted,
    ended: T.textLight,
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <SectionTitle>Campaigns</SectionTitle>
        <Btn icon={Plus} onClick={() => setShowCreate(!showCreate)}>
          New Campaign
        </Btn>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <Card style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Create Campaign</h3>
              <Input label="Campaign Name" value={name} onChange={setName} placeholder="e.g. Summer Rooftop Special" />
              <Input label="Target Vibes (comma separated)" value={vibes} onChange={setVibes} placeholder="rooftop, date-night, upscale" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Input label="Credits per View" value={credits} onChange={setCredits} type="number" />
                <Input label="Daily Budget" value={budget} onChange={setBudget} type="number" />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <Btn onClick={handleCreate} disabled={!name}>Launch Campaign</Btn>
                <Btn variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Btn>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Campaign list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {campaigns.length === 0 ? (
          <Card>
            <p style={{ textAlign: "center", color: T.textMuted, padding: 20 }}>
              No campaigns yet. Create your first campaign to boost visibility.
            </p>
          </Card>
        ) : (
          campaigns.map((c) => {
            const coupon = getCampaignCoupon(c.id);
            return (
              <Card key={c.id}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{c.name}</span>
                      <Badge color={statusColors[c.status]}>{c.status}</Badge>
                    </div>
                    <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 8 }}>
                      Vibes: {c.targetVibes.join(", ")} &middot; {c.dailyCreditBudget} credits/view
                    </div>
                    {coupon && (
                      <div style={{ fontSize: 12, color: T.coral, display: "flex", alignItems: "center", gap: 6 }}>
                        <Gift size={12} /> Coupon attached: {coupon.title}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: T.text }}>{c.impressions}</div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>impressions</div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Coupons View
// ═══════════════════════════════════════════════════════════

function CouponsView({ businessId }: { businessId: string }) {
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [couponType, setCouponType] = useState("percent_off");
  const [discValue, setDiscValue] = useState("20");
  const [maxRedemptions, setMaxRedemptions] = useState("100");
  const [minSpend, setMinSpend] = useState("0");
  const [campaigns, setCampaigns] = useState<BoostCampaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState("");

  useEffect(() => {
    setCampaigns(getBusinessCampaigns(businessId));
  }, [businessId]);

  function handleCreate() {
    if (!selectedCampaign || !title) return;
    const biz = getBusiness(businessId);
    if (!biz || biz.venueIds.length === 0) return;
    const c = createCoupon(businessId, biz.venueIds[0], {
      campaignId: selectedCampaign,
      title,
      description: title,
      type: couponType as any,
      value: parseFloat(discValue) || 20,
      maxRedemptions: parseInt(maxRedemptions) || 100,
      minSpend: parseFloat(minSpend) || 0,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
    if (c) {
      setShowCreate(false);
      setTitle("");
    }
  }

  // Gather all coupons across campaigns
  const allCoupons: (Coupon & { campaignName: string })[] = [];
  for (const camp of campaigns) {
    const coup = getCampaignCoupon(camp.id);
    if (coup) allCoupons.push({ ...coup, campaignName: camp.name });
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <SectionTitle>Coupons</SectionTitle>
        <Btn icon={Plus} onClick={() => setShowCreate(!showCreate)}>
          Create Coupon
        </Btn>
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <Card style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Create Coupon</h3>
              <Select
                label="Attach to Campaign"
                value={selectedCampaign}
                onChange={setSelectedCampaign}
                options={[{ value: "", label: "Select campaign..." }, ...campaigns.map((c) => ({ value: c.id, label: c.name }))]}
              />
              <Input label="Coupon Title" value={title} onChange={setTitle} placeholder="e.g. 20% Off Your First Visit" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Select
                  label="Type"
                  value={couponType}
                  onChange={setCouponType}
                  options={[
                    { value: "percent_off", label: "Percent Off" },
                    { value: "dollar_off", label: "Dollar Off" },
                    { value: "free_item", label: "Free Item" },
                    { value: "bogo", label: "BOGO" },
                    { value: "experience", label: "Experience" },
                  ]}
                />
                <Input label="Value" value={discValue} onChange={setDiscValue} type="number" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Input label="Max Redemptions" value={maxRedemptions} onChange={setMaxRedemptions} type="number" />
                <Input label="Min Spend ($)" value={minSpend} onChange={setMinSpend} type="number" />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <Btn onClick={handleCreate} disabled={!selectedCampaign || !title}>Create Coupon</Btn>
                <Btn variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Btn>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {allCoupons.length === 0 ? (
        <Card>
          <p style={{ textAlign: "center", color: T.textMuted, padding: 20 }}>
            No coupons created yet. Attach a coupon to a campaign to drive visits.
          </p>
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {allCoupons.map((c) => (
            <Card key={c.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: T.coralLight,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ticket size={18} color={T.coral} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{c.title}</div>
                  <div style={{ fontSize: 11, color: T.textMuted }}>for {c.campaignName}</div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: T.textMuted }}>
                <span>Type: {c.type.replace("_", " ")}</span>
                <span>Value: {c.type === "percent_off" ? `${c.value}%` : `$${c.value}`}</span>
              </div>
              <div
                style={{
                  marginTop: 10,
                  padding: "8px 12px",
                  background: T.bg,
                  borderRadius: 8,
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                }}
              >
                <span style={{ color: T.textMuted }}>Redeemed: {c.currentRedemptions}/{c.maxRedemptions}</span>
                <span style={{ color: c.isActive ? T.green : T.textLight, fontWeight: 600 }}>
                  {c.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Credits / Pricing View
// ═══════════════════════════════════════════════════════════

function CreditsView({ businessId }: { businessId: string }) {
  const [biz, setBiz] = useState<BusinessAccount | null>(null);
  const [buyAmount, setBuyAmount] = useState("1000");

  useEffect(() => {
    setBiz(getBusiness(businessId));
  }, [businessId]);

  function handlePurchase() {
    const result = purchaseCredits(businessId, parseInt(buyAmount) || 1000);
    if (result) setBiz({ ...result });
  }

  function handleUpgrade(tier: BusinessTier) {
    const result = updateBusinessTier(businessId, tier);
    if (result) setBiz({ ...result });
  }

  return (
    <div>
      <SectionTitle>Credits & Plans</SectionTitle>

      {/* Current balance */}
      {biz && (
        <Card
          style={{
            marginBottom: 28,
            background: `linear-gradient(135deg, ${T.coral}, #D14D3B)`,
            border: "none",
            color: "#fff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 13, opacity: 0.8 }}>Credit Balance</div>
              <div style={{ fontSize: 42, fontWeight: 800 }}>{biz.creditBalance.toLocaleString()}</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>{biz.totalCreditsUsed.toLocaleString()} used total</div>
            </div>
            <CreditCard size={48} strokeWidth={1} style={{ opacity: 0.3 }} />
          </div>
        </Card>
      )}

      {/* Buy credits */}
      <Card style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Buy Credits</h3>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <Input label="Amount" value={buyAmount} onChange={setBuyAmount} type="number" />
          </div>
          <Btn onClick={handlePurchase} style={{ marginBottom: 16 }}>Purchase</Btn>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[500, 1000, 2500, 5000].map((amt) => (
            <button
              key={amt}
              onClick={() => setBuyAmount(String(amt))}
              style={{
                padding: "6px 16px",
                borderRadius: 20,
                border: `1px solid ${T.border}`,
                background: buyAmount === String(amt) ? T.coralLight : "transparent",
                color: buyAmount === String(amt) ? T.coral : T.textMuted,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {amt.toLocaleString()}
            </button>
          ))}
        </div>
      </Card>

      {/* Tier cards */}
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Plans</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        {BUSINESS_TIERS.map((t: BusinessTierConfig) => {
          const isCurrent = biz?.tier === t.tier;
          return (
            <Card
              key={t.tier}
              style={{
                border: isCurrent ? `2px solid ${T.coral}` : `1px solid ${T.border}`,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {t.tier === "featured" && (
                <div
                  style={{
                    position: "absolute",
                    top: 12,
                    right: -30,
                    background: T.coral,
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 800,
                    padding: "4px 36px",
                    transform: "rotate(45deg)",
                    textTransform: "uppercase",
                  }}
                >
                  Popular
                </div>
              )}
              <div style={{ fontSize: 18, fontWeight: 700, color: T.text, textTransform: "capitalize", marginBottom: 4 }}>
                {t.tier}
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: T.coral, marginBottom: 4 }}>
                ${t.monthlyPrice}<span style={{ fontSize: 14, fontWeight: 500, color: T.textMuted }}>/mo</span>
              </div>
              <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 16 }}>
                {t.monthlyCredits.toLocaleString()} credits/mo &middot; {t.maxCampaigns} campaign{t.maxCampaigns !== 1 ? "s" : ""}
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px" }}>
                {t.features.map((f, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: T.textMuted, marginBottom: 8 }}>
                    <Check size={14} color={T.green} />
                    {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <Btn variant="secondary" disabled style={{ width: "100%", justifyContent: "center" }}>
                  Current Plan
                </Btn>
              ) : (
                <Btn
                  onClick={() => handleUpgrade(t.tier as BusinessTier)}
                  variant={t.tier === "featured" ? "primary" : "secondary"}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  {t.monthlyPrice === 0 ? "Downgrade" : "Upgrade"}
                </Btn>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Venue Editor View
// ═══════════════════════════════════════════════════════════

function VenueView({ businessId }: { businessId: string }) {
  const biz = getBusiness(businessId);
  const venueId = biz?.venueIds[0] ?? "";
  const [profile, setProfile] = useState<VenueProfile | null>(null);
  const [editing, setEditing] = useState(false);

  // Editable fields
  const [vName, setVName] = useState("");
  const [desc, setDesc] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [priceRange, setPriceRange] = useState("$$");

  // New menu item form
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [menuName, setMenuName] = useState("");
  const [menuPrice, setMenuPrice] = useState("");
  const [menuCategory, setMenuCategory] = useState("cocktails");
  const [menuDesc, setMenuDesc] = useState("");

  useEffect(() => {
    if (!venueId) return;
    let p = getVenueProfile(venueId);
    if (!p && biz) {
      p = seedPortalDemo(businessId);
    }
    if (p) {
      setProfile(p);
      setVName(p.name);
      setDesc(p.description);
      setAddress(p.address);
      setPhone(p.phone);
      setWebsite(p.website ?? "");
      setPriceRange(p.priceRange);
    }
  }, [venueId, businessId]);

  function handleSave() {
    if (!venueId) return;
    const updated = upsertVenueProfile(businessId, venueId, {
      name: vName,
      description: desc,
      address,
      phone,
      website: website || undefined,
      priceRange: priceRange as VenueProfile["priceRange"],
    });
    setProfile(updated);
    setEditing(false);
  }

  function handleAddMenuItem() {
    if (!venueId || !menuName) return;
    addMenuItem(venueId, {
      name: menuName,
      description: menuDesc || undefined,
      price: parseFloat(menuPrice) || 0,
      category: menuCategory,
      isPopular: false,
    });
    setProfile(getVenueProfile(venueId));
    setShowAddMenu(false);
    setMenuName("");
    setMenuPrice("");
    setMenuDesc("");
  }

  function handleRemoveItem(itemId: string) {
    if (!venueId) return;
    removeMenuItem(venueId, itemId);
    setProfile(getVenueProfile(venueId));
  }

  if (!profile) {
    return (
      <div>
        <SectionTitle>Venue</SectionTitle>
        <Card><p style={{ color: T.textMuted, textAlign: "center", padding: 20 }}>No venue found. Add a venue ID to your business account.</p></Card>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <SectionTitle>Venue Profile</SectionTitle>
        {!editing && <Btn icon={Edit3} variant="secondary" onClick={() => setEditing(true)}>Edit</Btn>}
      </div>

      {/* Photos */}
      {profile.photos.length > 0 && (
        <div style={{ display: "flex", gap: 12, marginBottom: 24, overflowX: "auto" }}>
          {profile.photos.map((p) => (
            <div
              key={p.id}
              style={{
                width: 200,
                height: 140,
                borderRadius: T.radius,
                overflow: "hidden",
                flexShrink: 0,
                position: "relative",
                border: p.isPrimary ? `2px solid ${T.coral}` : `1px solid ${T.border}`,
              }}
            >
              <img src={p.url} alt={p.caption ?? "venue"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              {p.isPrimary && (
                <span
                  style={{
                    position: "absolute",
                    top: 8,
                    left: 8,
                    background: T.coral,
                    color: "#fff",
                    fontSize: 9,
                    fontWeight: 800,
                    padding: "2px 8px",
                    borderRadius: 6,
                    textTransform: "uppercase",
                  }}
                >
                  Primary
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Profile details */}
      <Card style={{ marginBottom: 24 }}>
        {editing ? (
          <div>
            <Input label="Name" value={vName} onChange={setVName} />
            <Input label="Description" value={desc} onChange={setDesc} multiline />
            <Input label="Address" value={address} onChange={setAddress} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Input label="Phone" value={phone} onChange={setPhone} />
              <Input label="Website" value={website} onChange={setWebsite} />
            </div>
            <Select
              label="Price Range"
              value={priceRange}
              onChange={setPriceRange}
              options={[
                { value: "$", label: "$" },
                { value: "$$", label: "$$" },
                { value: "$$$", label: "$$$" },
                { value: "$$$$", label: "$$$$" },
              ]}
            />
            <div style={{ display: "flex", gap: 12 }}>
              <Btn onClick={handleSave}>Save Changes</Btn>
              <Btn variant="ghost" onClick={() => setEditing(false)}>Cancel</Btn>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: 0 }}>{profile.name}</h3>
              <Badge>{profile.priceRange}</Badge>
            </div>
            <p style={{ fontSize: 14, color: T.textMuted, marginBottom: 12, lineHeight: 1.5 }}>{profile.description}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 13, color: T.textMuted }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><MapPin size={14} /> {profile.address}, {profile.city}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Clock size={14} /> {profile.phone}</span>
              {profile.website && (
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}><ExternalLink size={14} /> {profile.website}</span>
              )}
            </div>
            {profile.amenities.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
                {profile.amenities.map((a) => (
                  <span
                    key={a}
                    style={{
                      padding: "4px 12px",
                      borderRadius: 20,
                      background: T.bg,
                      fontSize: 12,
                      color: T.textMuted,
                      border: `1px solid ${T.border}`,
                    }}
                  >
                    {a}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Menu Items */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Menu Highlights</h3>
        <Btn icon={Plus} variant="secondary" size="sm" onClick={() => setShowAddMenu(!showAddMenu)}>
          Add Item
        </Btn>
      </div>

      <AnimatePresence>
        {showAddMenu && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <Card style={{ marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 16 }}>
                <Input label="Item Name" value={menuName} onChange={setMenuName} placeholder="e.g. Wagyu Sliders" />
                <Input label="Price ($)" value={menuPrice} onChange={setMenuPrice} type="number" />
                <Select
                  label="Category"
                  value={menuCategory}
                  onChange={setMenuCategory}
                  options={[
                    { value: "cocktails", label: "Cocktails" },
                    { value: "small plates", label: "Small Plates" },
                    { value: "mains", label: "Mains" },
                    { value: "desserts", label: "Desserts" },
                  ]}
                />
              </div>
              <Input label="Description (optional)" value={menuDesc} onChange={setMenuDesc} />
              <div style={{ display: "flex", gap: 12 }}>
                <Btn size="sm" onClick={handleAddMenuItem} disabled={!menuName}>Add</Btn>
                <Btn size="sm" variant="ghost" onClick={() => setShowAddMenu(false)}>Cancel</Btn>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
        {profile.menuItems.map((item) => (
          <Card key={item.id} style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>
                {item.name}
                {item.isPopular && <Star size={12} color={T.accent} style={{ marginLeft: 6, verticalAlign: -1 }} />}
              </div>
              <div style={{ fontSize: 12, color: T.textMuted }}>{item.category} &middot; ${item.price}</div>
              {item.description && <div style={{ fontSize: 12, color: T.textLight, marginTop: 2 }}>{item.description}</div>}
            </div>
            <button
              onClick={() => handleRemoveItem(item.id)}
              style={{ background: "none", border: "none", color: T.textLight, cursor: "pointer", padding: 4 }}
            >
              <Trash2 size={14} />
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Team Manager View
// ═══════════════════════════════════════════════════════════

function TeamView({ businessId }: { businessId: string }) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [invEmail, setInvEmail] = useState("");
  const [invName, setInvName] = useState("");
  const [invRole, setInvRole] = useState<TeamRole>("staff");

  const reload = useCallback(() => {
    setMembers(getTeamMembers(businessId));
  }, [businessId]);

  useEffect(reload, [reload]);

  function handleInvite() {
    if (!invEmail || !invName) return;
    inviteTeamMember(businessId, invEmail, invName, invRole);
    reload();
    setShowInvite(false);
    setInvEmail("");
    setInvName("");
  }

  function handleRemove(memberId: string) {
    removeTeamMember(businessId, memberId);
    reload();
  }

  function handleRoleChange(memberId: string, newRole: TeamRole) {
    updateTeamMemberRole(businessId, memberId, newRole);
    reload();
  }

  const roleIcons: Record<TeamRole, React.ElementType> = {
    owner: Crown,
    manager: Shield,
    staff: Users,
  };

  const roleColors: Record<TeamRole, string> = {
    owner: T.accent,
    manager: T.purple,
    staff: T.textMuted,
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <SectionTitle>Team</SectionTitle>
        <Btn icon={UserPlus} onClick={() => setShowInvite(!showInvite)}>
          Invite Member
        </Btn>
      </div>

      <AnimatePresence>
        {showInvite && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <Card style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Invite Team Member</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Input label="Full Name" value={invName} onChange={setInvName} placeholder="Jane Doe" />
                <Input label="Email" value={invEmail} onChange={setInvEmail} placeholder="jane@company.com" type="email" />
              </div>
              <Select
                label="Role"
                value={invRole}
                onChange={(v) => setInvRole(v as TeamRole)}
                options={[
                  { value: "staff", label: "Staff — view only" },
                  { value: "manager", label: "Manager — create campaigns" },
                ]}
              />
              <div style={{ display: "flex", gap: 12 }}>
                <Btn onClick={handleInvite} disabled={!invEmail || !invName}>Send Invite</Btn>
                <Btn variant="ghost" onClick={() => setShowInvite(false)}>Cancel</Btn>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {members.map((m) => {
          const RoleIcon = roleIcons[m.role];
          return (
            <Card key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: `${roleColors[m.role]}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <RoleIcon size={18} color={roleColors[m.role]} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: T.textMuted }}>{m.email}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Badge color={roleColors[m.role]}>{m.role}</Badge>
                {!m.acceptedAt && (
                  <Badge color={T.accent}>Pending</Badge>
                )}
                {m.role !== "owner" && (
                  <button
                    onClick={() => handleRemove(m.id)}
                    style={{ background: "none", border: "none", color: T.textLight, cursor: "pointer", padding: 4 }}
                    title="Remove member"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Analytics View
// ═══════════════════════════════════════════════════════════

function AnalyticsView({ businessId }: { businessId: string }) {
  const [analytics, setAnalytics] = useState<BoostAnalytics | null>(null);
  const [campaigns, setCampaigns] = useState<(BoostCampaign & { analytics?: BoostAnalytics | null })[]>([]);

  useEffect(() => {
    setAnalytics(getBusinessAnalytics(businessId));
    const camps = getBusinessCampaigns(businessId);
    setCampaigns(
      camps.map((c) => ({
        ...c,
        analytics: getCampaignAnalytics(c.id),
      }))
    );
  }, [businessId]);

  if (!analytics) {
    return <Card><p style={{ textAlign: "center", color: T.textMuted, padding: 20 }}>No analytics data yet.</p></Card>;
  }

  return (
    <div>
      <SectionTitle>Analytics</SectionTitle>

      {/* Top-level metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 28 }}>
        <StatCard icon={Eye} label="Total Impressions" value={analytics.impressions.toLocaleString()} color={T.purple} />
        <StatCard icon={MousePointerClick} label="Click-throughs" value={analytics.clickThroughs} color={T.coral} />
        <StatCard icon={MapPin} label="Check-ins" value={analytics.checkIns} color={T.green} />
        <StatCard icon={Ticket} label="Coupons Redeemed" value={analytics.couponRedemptions} color={T.accent} />
        <StatCard icon={DollarSign} label="Credits Spent" value={analytics.creditsSpent.toLocaleString()} color={T.text} />
        <StatCard
          icon={TrendingUp}
          label="ROI"
          value={`${analytics.roi.toFixed(1)}x`}
          color={analytics.roi >= 1 ? T.green : T.coral}
        />
      </div>

      {/* Per-campaign breakdown */}
      <Card>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: T.text }}>Campaign Performance</h3>
        {campaigns.length === 0 ? (
          <p style={{ color: T.textMuted }}>No campaigns to analyze.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {["Campaign", "Status", "Impressions", "Clicks", "Check-ins", "Conv. Rate"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: T.textMuted, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                    <td style={{ padding: "12px", fontWeight: 600, color: T.text }}>{c.name}</td>
                    <td style={{ padding: "12px" }}>
                      <Badge color={c.status === "active" ? T.green : T.textMuted}>{c.status}</Badge>
                    </td>
                    <td style={{ padding: "12px", color: T.text }}>{c.impressions}</td>
                    <td style={{ padding: "12px", color: T.text }}>{c.analytics?.clickThroughs ?? 0}</td>
                    <td style={{ padding: "12px", color: T.text }}>{c.analytics?.checkIns ?? 0}</td>
                    <td style={{ padding: "12px", color: T.coral, fontWeight: 700 }}>
                      {((c.analytics?.conversionRate ?? 0) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Main Portal Component
// ═══════════════════════════════════════════════════════════

export function BusinessPortal({ businessId }: { businessId: string }) {
  const [section, setSection] = useState<PortalSection>("dashboard");
  const [dashData, setDashData] = useState<PortalDashboardData | null>(null);
  const [notifCount, setNotifCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const biz = getBusiness(businessId);

  useEffect(() => {
    if (!biz) return;
    // Seed demo data if needed
    const venueId = biz.venueIds[0];
    if (venueId && !getVenueProfile(venueId)) {
      seedPortalDemo(businessId);
    }
    const d = getPortalDashboard(businessId);
    setDashData(d);
    const unread = getPortalNotifications(businessId, true);
    setNotifCount(unread.length);
  }, [businessId, section]);

  if (!biz) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: T.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Georgia', serif",
          fontStyle: "italic",
          color: T.textMuted,
          fontSize: 18,
        }}
      >
        Business not found
      </div>
    );
  }

  const sectionTitles: Record<PortalSection, string> = {
    dashboard: "Dashboard",
    campaigns: "Campaigns",
    coupons: "Coupons",
    venue: "Venue Profile",
    team: "Team Management",
    analytics: "Analytics",
    credits: "Credits & Plans",
    settings: "Settings",
  };

  function handleNotificationClick() {
    const unread = getPortalNotifications(businessId, true);
    if (unread.length > 0) {
      markNotificationsRead(unread.map((n) => n.id));
      setNotifCount(0);
    }
    setSection("dashboard");
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: T.bg,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: T.text,
      }}
    >
      {/* Sidebar */}
      <Sidebar
        active={section}
        onNav={setSection}
        businessName={biz.businessName}
        tier={biz.tier}
        onLogout={() => navigate("/")}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <PortalHeader
          title={sectionTitles[section]}
          subtitle={section === "dashboard" ? `${biz.businessName} — ${biz.tier} plan` : undefined}
          notifications={notifCount}
          onNotificationClick={handleNotificationClick}
          onMenuClick={() => setMobileMenuOpen(true)}
        />
        <div style={{ flex: 1, padding: 32, overflowY: "auto" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={section}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              {section === "dashboard" && dashData && <DashboardView data={dashData} />}
              {section === "campaigns" && <CampaignsView businessId={businessId} />}
              {section === "coupons" && <CouponsView businessId={businessId} />}
              {section === "venue" && <VenueView businessId={businessId} />}
              {section === "team" && <TeamView businessId={businessId} />}
              {section === "analytics" && <AnalyticsView businessId={businessId} />}
              {section === "credits" && <CreditsView businessId={businessId} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Responsive styles injected */}
      <style>{`
        @media (max-width: 768px) {
          .portal-mobile-menu { display: block !important; }
        }
      `}</style>
    </div>
  );
}

/** Route wrapper — reads :id from URL params */
export function PortalRoute() {
  const { id } = useParams<{ id: string }>();
  return <BusinessPortal businessId={id ?? ""} />;
}
