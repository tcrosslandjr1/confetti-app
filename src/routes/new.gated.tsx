import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ReactNode, CSSProperties } from "react";
import {
  BackButton,
  BrandMark,
  ChunkyButton,
  DotsBg,
  FloatingTickets,
  Frame,
  Icons,
  Stamp,
  TOKENS,
} from "@/components/new-confetti/shell";

// Ported from design_extracted/new-confetti/project/confetti-code/gated.jsx
// Route-level page: free users see blurred content + paywall card.
// Also exports GatedOverlay / FreeTierBanner / MemberPill for use in other routes.
export const Route = createFileRoute("/new/gated")({
  component: GatedPage,
  validateSearch: (s: Record<string, unknown>) => ({
    feature: typeof s.feature === "string" ? s.feature : "unlimited",
  }),
});

// ── Feature registry ─────────────────────────────────────────────────────
export const GATED_FEATURES: Record<string, { label: string; desc: string }> = {
  "family-mode":    { label: "Family Mode",           desc: "kid-friendly plans + age filters" },
  "kids-party":     { label: "Kids Party planner",    desc: "venue + theme + RSVP tracker" },
  "memory-kit":     { label: "Party Memory Kit",      desc: "auto-captions + recap reel" },
  "unlimited":      { label: "Unlimited plans",       desc: "free is capped at 3/week" },
  "stripe-deposit": { label: "One-tap booking",       desc: "stripe + ticketmaster + opentable" },
  "reels-stops":    { label: "Per-stop clone",        desc: "grab any stop from any reel" },
  "taste-graph":    { label: "TikTok taste sync",     desc: "reads your saves to plan smarter" },
  "crew-vote":      { label: "Night Together vote",   desc: "live group voting + auto-print" },
  "reveal-intel":   { label: "Flipcard intel",        desc: "live crowd · dress · pro tips" },
  "parking":        { label: "Parking + valet",       desc: "pre-arrival valet · EV chargers" },
};

// ── Inline lock pill ─────────────────────────────────────────────────────
export function MemberPill({
  onUpgrade,
}: {
  feature?: string;
  onUpgrade: () => void;
}) {
  return (
    <button
      onClick={onUpgrade}
      style={{
        appearance: "none",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 8px",
        background: TOKENS.ink,
        color: TOKENS.paper,
        border: `1.5px solid ${TOKENS.ink}`,
        borderRadius: 999,
        fontFamily: TOKENS.mono,
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: ".1em",
      }}
    >
      <span style={{ color: TOKENS.accent1 }}>✣</span>
      MEMBER · $9.99
    </button>
  );
}

// ── Free tier banner ─────────────────────────────────────────────────────
export function FreeTierBanner({
  left = 2,
  onUpgrade,
}: {
  left?: number;
  onUpgrade: () => void;
}) {
  return (
    <div
      style={{
        padding: "10px 14px",
        marginBottom: 12,
        background: TOKENS.accent2,
        border: `2px solid ${TOKENS.ink}`,
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <span
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: TOKENS.ink,
          color: TOKENS.paper,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: TOKENS.display,
          fontWeight: 900,
          fontSize: 14,
          flexShrink: 0,
        }}
      >
        {left}
      </span>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontFamily: TOKENS.mono,
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: ".14em",
            opacity: 0.6,
            textTransform: "uppercase",
          }}
        >
          FREE TIER
        </div>
        <div style={{ fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 800 }}>
          {left} plans left this week · resets sunday
        </div>
      </div>
      <button
        onClick={onUpgrade}
        style={{
          appearance: "none",
          cursor: "pointer",
          padding: "6px 12px",
          background: TOKENS.accent1,
          color: TOKENS.ink,
          border: `2px solid ${TOKENS.ink}`,
          borderRadius: 999,
          fontFamily: TOKENS.ui,
          fontSize: 11,
          fontWeight: 900,
          whiteSpace: "nowrap",
        }}
      >
        go unlimited →
      </button>
    </div>
  );
}

// ── Inline gated overlay — wraps a content section ──────────────────────
export function GatedOverlay({
  feature = "unlimited",
  member,
  onUpgrade,
  preview = true,
  children,
}: {
  feature?: string;
  member: boolean;
  onUpgrade: () => void;
  preview?: boolean;
  children: ReactNode;
}) {
  if (member) return <>{children}</>;
  const f = GATED_FEATURES[feature] ?? GATED_FEATURES["unlimited"];
  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          filter: preview ? "blur(6px) saturate(0.7)" : "none",
          opacity: preview ? 0.55 : 0,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {children}
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <div
          style={{
            padding: 14,
            background: TOKENS.ink,
            color: TOKENS.paper,
            border: `2.5px solid ${TOKENS.paper}`,
            borderRadius: 14,
            boxShadow: `5px 5px 0 ${TOKENS.accent1}`,
            maxWidth: 320,
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily: TOKENS.mono,
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: ".14em",
              opacity: 0.7,
            }}
          >
            <span style={{ color: TOKENS.accent1 }}>🔒</span>
            ALL-ACCESS · $9.99/MO
          </div>
          <div
            style={{
              fontFamily: TOKENS.display,
              fontWeight: 900,
              fontSize: 18,
              letterSpacing: "-0.025em",
              marginTop: 4,
              lineHeight: 1.15,
            }}
          >
            {f.label} is members-only.
          </div>
          <div
            style={{
              fontFamily: TOKENS.ui,
              fontSize: 12,
              fontWeight: 700,
              opacity: 0.8,
              marginTop: 4,
              lineHeight: 1.35,
            }}
          >
            {f.desc}
          </div>
          <button
            onClick={onUpgrade}
            style={{
              appearance: "none",
              cursor: "pointer",
              width: "100%",
              marginTop: 10,
              padding: "10px 14px",
              border: `2.5px solid ${TOKENS.paper}`,
              borderRadius: 10,
              background: TOKENS.accent1,
              color: TOKENS.ink,
              fontFamily: TOKENS.ui,
              fontSize: 13,
              fontWeight: 900,
            }}
          >
            💳 add card · start 7-day trial →
          </button>
          <div
            style={{
              marginTop: 6,
              textAlign: "center",
              fontFamily: TOKENS.mono,
              fontSize: 8.5,
              fontWeight: 700,
              opacity: 0.55,
              letterSpacing: ".1em",
            }}
          >
            $0 TODAY · CANCEL ANYTIME
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Member feature comparison grid ───────────────────────────────────────
export function MemberFeatureGrid({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div
      style={{
        padding: 14,
        border: `2.5px solid ${TOKENS.ink}`,
        borderRadius: 14,
        background: TOKENS.paper,
        boxShadow: `4px 4px 0 ${TOKENS.ink}`,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 60px 80px",
          gap: 8,
          paddingBottom: 8,
          borderBottom: `2px solid ${TOKENS.ink}`,
          fontFamily: TOKENS.mono,
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: ".14em",
          opacity: 0.55,
          textTransform: "uppercase",
        }}
      >
        <span>FEATURE</span>
        <span style={{ textAlign: "center" }}>FREE</span>
        <span style={{ textAlign: "center" }}>ALL-ACCESS</span>
      </div>
      {Object.entries(GATED_FEATURES).map(([k, f]) => (
        <div
          key={k}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 60px 80px",
            gap: 8,
            padding: "8px 0",
            borderBottom: "1px dashed rgba(0,0,0,0.15)",
            fontFamily: TOKENS.ui,
            fontSize: 12,
            fontWeight: 700,
            alignItems: "center",
          }}
        >
          <span>{f.label}</span>
          <span
            style={{
              textAlign: "center",
              fontFamily: TOKENS.mono,
              fontSize: 11,
              fontWeight: 800,
              opacity: 0.4,
            }}
          >
            —
          </span>
          <span
            style={{
              textAlign: "center",
              color: TOKENS.accent4,
              fontFamily: TOKENS.display,
              fontWeight: 900,
              fontSize: 14,
            }}
          >
            ✓
          </span>
        </div>
      ))}
      <button
        onClick={onUpgrade}
        style={{
          appearance: "none",
          cursor: "pointer",
          width: "100%",
          marginTop: 12,
          padding: "12px 16px",
          background: TOKENS.accent1,
          color: TOKENS.ink,
          border: `2.5px solid ${TOKENS.ink}`,
          borderRadius: 12,
          fontFamily: TOKENS.ui,
          fontSize: 14,
          fontWeight: 900,
          boxShadow: `3px 3px 0 ${TOKENS.ink}`,
        }}
      >
        unlock all-access · $9.99/mo →
      </button>
    </div>
  );
}

// ── Full-frame gated wrapper (used in other screens via composition) ──────
export function GatedScreen({
  member,
  feature = "unlimited",
  onUpgrade,
  onBack,
  children,
}: {
  member: boolean;
  feature?: string;
  onUpgrade: () => void;
  onBack?: () => void;
  children: ReactNode;
}) {
  if (member) return <>{children}</>;
  const f = GATED_FEATURES[feature] ?? GATED_FEATURES["unlimited"];
  return (
    <div style={{ position: "relative", height: "100%", overflow: "hidden" }}>
      {/* Blurred preview */}
      <div
        style={{
          height: "100%",
          filter: "blur(7px) saturate(0.7)",
          opacity: 0.5,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {children}
      </div>
      {/* Dim layer */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 90,
          background: "rgba(19,11,13,0.4)",
          backdropFilter: "blur(2px)",
        }}
      />
      {/* Back button escape hatch */}
      {onBack && (
        <button
          onClick={onBack}
          style={{
            position: "absolute",
            top: 56,
            left: 16,
            zIndex: 100,
            appearance: "none",
            cursor: "pointer",
            width: 36,
            height: 36,
            borderRadius: 999,
            border: `2.5px solid ${TOKENS.paper}`,
            background: "rgba(0,0,0,0.55)",
            color: TOKENS.paper,
            fontSize: 14,
            fontWeight: 900,
            backdropFilter: "blur(10px)",
          } as CSSProperties}
        >
          ←
        </button>
      )}
      {/* Center lock card */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 99,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <div
          style={{
            padding: 18,
            background: TOKENS.ink,
            color: TOKENS.paper,
            border: `3px solid ${TOKENS.paper}`,
            borderRadius: 18,
            boxShadow: `6px 6px 0 ${TOKENS.accent1}`,
            maxWidth: 320,
            width: "100%",
            animation: "cf-pop 0.4s cubic-bezier(.2,.8,.2,1)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily: TOKENS.mono,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: ".14em",
              opacity: 0.7,
            }}
          >
            <span style={{ color: TOKENS.accent1 }}>🔒</span>
            ALL-ACCESS · $9.99/MO
          </div>
          <div
            style={{
              fontFamily: TOKENS.display,
              fontWeight: 900,
              fontSize: 24,
              letterSpacing: "-0.035em",
              marginTop: 8,
              lineHeight: 1.05,
            }}
          >
            {f.label}
            <br />
            is members-only.
          </div>
          <div
            style={{
              fontFamily: TOKENS.ui,
              fontSize: 13,
              fontWeight: 700,
              opacity: 0.8,
              marginTop: 6,
              lineHeight: 1.4,
            }}
          >
            {f.desc}
          </div>
          <div
            style={{
              marginTop: 12,
              padding: "8px 10px",
              background: "rgba(255,250,240,0.1)",
              border: `1.5px dashed ${TOKENS.paper}`,
              borderRadius: 8,
              fontFamily: TOKENS.mono,
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: ".04em",
              lineHeight: 1.4,
              opacity: 0.85,
            }}
          >
            ✓ all-access unlocks every gated feature<br />
            ✓ card required · $0 today · charged day 8
          </div>
          <button
            onClick={onUpgrade}
            style={{
              appearance: "none",
              cursor: "pointer",
              width: "100%",
              marginTop: 12,
              padding: "12px 16px",
              border: `2.5px solid ${TOKENS.paper}`,
              borderRadius: 12,
              background: TOKENS.accent1,
              color: TOKENS.ink,
              fontFamily: TOKENS.display,
              fontWeight: 900,
              fontSize: 15,
              letterSpacing: "-0.02em",
            }}
          >
            💳 add card · start 7-day trial →
          </button>
          <div
            style={{
              marginTop: 6,
              textAlign: "center",
              fontFamily: TOKENS.mono,
              fontSize: 9,
              fontWeight: 700,
              opacity: 0.55,
              letterSpacing: ".1em",
            }}
          >
            $0 TODAY · CANCEL ANYTIME BEFORE DAY 8
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Route page ────────────────────────────────────────────────────────────
// /new/gated?feature=<key>  — standalone full-screen upgrade prompt
function GatedPage() {
  const navigate = useNavigate();
  const { feature } = Route.useSearch();
  const f = GATED_FEATURES[feature] ?? GATED_FEATURES["unlimited"];

  return (
    <Frame>
      <div
        style={{
          position: "relative",
          minHeight: "100dvh",
          background: TOKENS.bg,
          display: "flex",
          flexDirection: "column",
          padding: "56px 22px 24px",
          overflow: "hidden",
        }}
      >
        <DotsBg opacity={0.06} />
        <FloatingTickets density={4} />

        {/* Top bar */}
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
          <BackButton onClick={() => navigate({ to: "/new/hub" })} />
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
          }}
        >
          <Stamp color={TOKENS.accent1} rotate={-3} style={{ marginBottom: 12 }}>
            pick a path
          </Stamp>
          <h1
            style={{
              fontFamily: TOKENS.display,
              fontWeight: 900,
              fontSize: 38,
              lineHeight: 0.92,
              letterSpacing: "-0.04em",
              margin: "0 0 6px",
            }}
          >
            {f.label}<br />is members-only.
          </h1>
          <p
            style={{
              fontFamily: TOKENS.ui,
              fontSize: 14,
              fontWeight: 700,
              opacity: 0.65,
              margin: "0 0 20px",
              lineHeight: 1.4,
            }}
          >
            {f.desc}. Upgrade to All-Access and unlock every feature — plus unlimited plans, Family Mode, and Party Memory Kit.
          </p>

          <MemberFeatureGrid onUpgrade={() => navigate({ to: "/new/all-access" })} />

          <div
            style={{
              marginTop: 16,
              padding: "10px 12px",
              background: TOKENS.paper,
              border: `2px dashed ${TOKENS.ink}`,
              borderRadius: 10,
              fontFamily: TOKENS.mono,
              fontSize: 10,
              fontWeight: 700,
              opacity: 0.7,
              lineHeight: 1.5,
              letterSpacing: ".04em",
            }}
          >
            🔒 No charge during the 7-day trial. Cancel any time in Settings. We use Stripe.
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 2, display: "flex", gap: 8, marginTop: 12 }}>
          <ChunkyButton variant="ghost" full={false} onClick={() => navigate({ to: "/new/hub" })}>
            maybe later
          </ChunkyButton>
          <ChunkyButton
            variant="accent"
            onClick={() => navigate({ to: "/new/all-access" })}
            icon={Icons.arrow}
          >
            get all-access
          </ChunkyButton>
        </div>
      </div>
    </Frame>
  );
}

