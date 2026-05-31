// TabBar — floating pill nav, ported from design/new-confetti/project/extras.jsx
// 5 tabs: home / plan / feed / crew / you
// Active tab: filled ink pill + label. Inactive: icon only.

import { useNavigate, useRouterState } from "@tanstack/react-router";
import { TOKENS } from "@/components/new-confetti/shell";
import { useAuth } from "@/lib/auth-context";

const TABS = [
  {
    id: "hub",
    label: "home",
    route: "/new/hub",
    matches: (p: string) => p === "/" || p === "/new/hub",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M3 9l7-6 7 6v8a1 1 0 0 1-1 1h-4v-5h-4v5H4a1 1 0 0 1-1-1z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "plan",
    label: "plan",
    route: "/new/plan",
    matches: (p: string) => p.startsWith("/new/plan") || p.startsWith("/new/family-plan"),
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M10 1l2 6h6l-5 4 2 7-7-4-7 4 2-7-5-4h6z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          fill="currentColor"
          fillOpacity="0.18"
        />
      </svg>
    ),
  },
  {
    id: "feed",
    label: "feed",
    route: "/new/explore",
    matches: (p: string) =>
      p.startsWith("/new/explore") ||
      p.startsWith("/new/reels") ||
      p.startsWith("/new/whats-hot"),
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="3" width="14" height="14" rx="2.5" stroke="currentColor" strokeWidth="2" />
        <path d="M7 8h6M7 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "crew",
    label: "crew",
    route: "/new/crews",
    matches: (p: string) =>
      p.startsWith("/new/crews") ||
      p.startsWith("/new/crew-map") ||
      p.startsWith("/new/night-together"),
    icon: (
      <svg width="22" height="20" viewBox="0 0 22 20" fill="none">
        <circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="2" />
        <circle cx="15" cy="7" r="3" stroke="currentColor" strokeWidth="2" />
        <path
          d="M1 18c0-3 2.7-5 6-5s6 2 6 5M9 18c0-3 2.7-5 6-5s6 2 6 5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "you",
    label: "you",
    route: "/new/profile",
    matches: (p: string) =>
      p.startsWith("/new/profile") ||
      p.startsWith("/new/trips") ||
      p.startsWith("/new/wallet") ||
      p.startsWith("/new/settings"),
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="6" r="3.5" stroke="currentColor" strokeWidth="2" />
        <path
          d="M2 19c0-4 3.5-7 8-7s8 3 8 7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
] as const;

// Routes where the tab bar should be hidden entirely
const HIDE_PREFIXES = [
  "/auth",
  "/admin",
  "/about",
  "/privacy",
  "/promoter",
  "/api",
  "/health",
  "/business",
  "/influencer",
  "/new/signin",
  "/new/signup",
  "/new/forgot-pw",
  "/new/email-verify",
  "/new/phone-verify",
  "/new/parental-consent",
  "/new/age-gate",
  "/new/2fa",
  "/new/about",
  "/new/all-access",
  "/new/explainer",
  "/new/finished",
  "/new/for-business",
  "/new/family-pass",
  "/new/family-plan",
  "/new/referral",
  "/new/learn-explore",
  "/new/firstrun",
  "/new/welcome",
  "/new/printing",
  "/new/night",
  "/new/gated",
  "/new/locked",
  "/new/paywall",
  "/new/checkout-return",
  "/new/qrcheckin",
  "/new/confetti-cam",
  "/new/command-center",
  "/new/stripe",
  "/new/night-together",
  "/new/chat",
  "/new/pass",
  "/new/plan-review",
  "/new/loader",
];

// Screens with dark background — tab bar uses frosted-dark style
const DARK_PREFIXES = ["/new/explore", "/new/reels", "/new/crew-map"];

export function TabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { effectiveRole } = useAuth();

  // Hide on non-customer roles and hidden routes
  if (effectiveRole === "business" || effectiveRole === "admin") return null;
  if (HIDE_PREFIXES.some((p) => pathname.startsWith(p))) return null;
  // Also hide on old (non-new) routes that have their own nav
  if (!pathname.startsWith("/new/") && pathname !== "/") return null;

  const dark = DARK_PREFIXES.some((p) => pathname.startsWith(p));
  const bg = dark ? "rgba(10,10,10,0.65)" : "rgba(255,250,240,0.88)";
  const borderColor = dark ? TOKENS.paper : TOKENS.ink;

  return (
    <div
      style={{
        position: "fixed",
        left: 16,
        right: 16,
        bottom: 12,
        zIndex: 50,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 10px",
        border: `2.5px solid ${borderColor}`,
        borderRadius: 999,
        background: bg,
        backdropFilter: "blur(24px) saturate(160%)",
        WebkitBackdropFilter: "blur(24px) saturate(160%)",
        boxShadow: dark ? `3px 3px 0 ${TOKENS.accent1}` : `4px 4px 0 ${TOKENS.ink}`,
        // Safe area support
        paddingBottom: `calc(8px + env(safe-area-inset-bottom, 0px))`,
        maxWidth: 600,
        margin: "0 auto",
        // Centre the pill on wide screens
        left: "max(16px, calc(50% - 300px + 16px))",
        right: "max(16px, calc(50% - 300px + 16px))",
      } as React.CSSProperties}
      role="navigation"
      aria-label="Primary navigation"
    >
      {TABS.map((tab) => {
        const active = tab.matches(pathname);
        const activeBg = dark ? TOKENS.paper : TOKENS.ink;
        const activeFg = dark ? TOKENS.ink : TOKENS.paper;
        const inactiveFg = dark ? TOKENS.paper : TOKENS.ink;

        return (
          <button
            key={tab.id}
            onClick={() => navigate({ to: tab.route })}
            aria-current={active ? "page" : undefined}
            aria-label={tab.label}
            style={{
              appearance: "none",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: active ? "6px 12px" : "6px",
              border: "none",
              borderRadius: 999,
              background: active ? activeBg : "transparent",
              color: active ? activeFg : inactiveFg,
              fontFamily: TOKENS.ui,
              fontSize: 12,
              fontWeight: 800,
              transition: "all .18s cubic-bezier(.3,.7,.4,1)",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center" }}>{tab.icon}</span>
            {active && <span>{tab.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
