import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { DotsBg, Frame, TopBar, TOKENS } from "@/components/new-confetti/shell";

// Ported from prototype confetti-code/info-bits.jsx
// Small reusable utility components — permissions, trust, tier, toasts, etc.
// The route page is a living style-guide / demo of all sub-components.
export const Route = createFileRoute("/new/info-bits")({ component: InfoBitsPage });

// ────────────────────────────────────────────────────────────────
// PermissionsSheet — explains why we ask before the OS prompt
// ────────────────────────────────────────────────────────────────
type PermKind = "location" | "contacts" | "camera" | "notifs";

interface PermCopy {
  e: string;
  t: string;
  w: string[];
  no: string;
}

const PERM_COPY: Record<PermKind, PermCopy> = {
  location: {
    e: "📍",
    t: "allow location?",
    w: [
      "pick venues near you, not 2 hours away",
      "calculate walking time + transit",
      "auto-check-in when you arrive (you control this)",
    ],
    no: "never sold, never shared with venues",
  },
  contacts: {
    e: "👥",
    t: "find your crew?",
    w: [
      "see which friends are already on Confetti",
      "invite them with one tap",
      "no auto-imports — you pick who",
    ],
    no: "names + numbers only, deleted on signout",
  },
  camera: {
    e: "📷",
    t: "use camera?",
    w: [
      "drop a photo at each check-in",
      "scan venue QR for fast check-in",
      "make a confetti cam recap",
    ],
    no: "kids' faces auto-blur in family mode",
  },
  notifs: {
    e: "🔔",
    t: "turn on push?",
    w: [
      "nudges when your stop is 10 min out",
      "crew pings when friends are nearby",
      "next-day recap when ready",
    ],
    no: "you can mute by type in settings",
  },
};

export function PermissionsSheet({
  open,
  kind = "location",
  onAllow,
  onSkip,
}: {
  open: boolean;
  kind?: PermKind;
  onAllow: () => void;
  onSkip: () => void;
}) {
  if (!open) return null;
  const c = PERM_COPY[kind];

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 60,
        background: "rgba(19,11,13,0.6)",
        display: "flex",
        alignItems: "flex-end",
        animation: "cf-fadein 0.2s ease-out",
      }}
      onClick={onSkip}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          background: TOKENS.paper,
          border: `3px solid ${TOKENS.ink}`,
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          padding: "22px 22px 24px",
          boxShadow: `0 -6px 0 ${TOKENS.ink}`,
          animation: "cf-slideup 0.3s cubic-bezier(.2,.8,.2,1)",
        }}
      >
        <span style={{ fontSize: 40, lineHeight: 1, display: "block" }}>{c.e}</span>
        <h2
          style={{
            fontFamily: TOKENS.display,
            fontWeight: 900,
            fontSize: 26,
            letterSpacing: "-0.035em",
            margin: "8px 0 4px",
            color: TOKENS.ink,
          }}
        >
          {c.t}
        </h2>
        <p
          style={{
            fontFamily: TOKENS.mono,
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: ".14em",
            opacity: 0.55,
            margin: "0 0 12px",
            textTransform: "uppercase",
            color: TOKENS.ink,
          }}
        >
          HERE'S WHY
        </p>
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: "0 0 12px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {c.w.map((line, i) => (
            <li
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                fontFamily: TOKENS.ui,
                fontSize: 13,
                fontWeight: 600,
                color: TOKENS.ink,
                lineHeight: 1.4,
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  width: 16,
                  height: 16,
                  marginTop: 2,
                  borderRadius: 4,
                  border: `2px solid ${TOKENS.ink}`,
                  background: TOKENS.accent2,
                  fontFamily: TOKENS.display,
                  fontSize: 11,
                  fontWeight: 900,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: TOKENS.ink,
                }}
              >
                ✓
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
        <div
          style={{
            padding: "8px 10px",
            marginBottom: 14,
            background: "rgba(43,182,115,0.18)",
            border: `1.5px dashed ${TOKENS.ink}`,
            borderRadius: 8,
            fontFamily: TOKENS.mono,
            fontSize: 10,
            fontWeight: 700,
            color: TOKENS.ink,
            letterSpacing: ".06em",
          }}
        >
          🔒 {c.no}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onSkip}
            style={{
              flex: 1,
              padding: "12px 14px",
              appearance: "none",
              cursor: "pointer",
              border: `2.5px solid ${TOKENS.ink}`,
              borderRadius: 12,
              background: TOKENS.paper,
              color: TOKENS.ink,
              fontFamily: TOKENS.ui,
              fontWeight: 800,
              fontSize: 13,
              boxShadow: `3px 3px 0 ${TOKENS.ink}`,
            }}
          >
            not now
          </button>
          <button
            onClick={onAllow}
            style={{
              flex: 2,
              padding: "12px 14px",
              appearance: "none",
              cursor: "pointer",
              border: `2.5px solid ${TOKENS.ink}`,
              borderRadius: 12,
              background: TOKENS.accent1,
              color: TOKENS.ink,
              fontFamily: TOKENS.display,
              fontWeight: 900,
              fontSize: 14,
              letterSpacing: "-0.02em",
              boxShadow: `3px 3px 0 ${TOKENS.ink}`,
            }}
          >
            allow
          </button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// TrustBadge — "how booking works" expandable disclosure
// ────────────────────────────────────────────────────────────────
type TrustKind = "booking" | "payment";

interface TrustCopy {
  label: string;
  lines: string[];
}

const TRUST_COPY: Record<TrustKind, TrustCopy> = {
  booking: {
    label: "how booking works",
    lines: [
      "No charge until the venue confirms.",
      "Cancel free until 4h before.",
      "Confetti makes $0 from your booking — we get paid by venues for the referral.",
    ],
  },
  payment: {
    label: "safe to pay",
    lines: [
      "Card stored by Stripe, never us.",
      "Refunds within 24h, no questions.",
      "Free trial cancels instantly — no charge if you forget.",
    ],
  },
};

export function TrustBadge({ kind = "booking" }: { kind?: TrustKind }) {
  const [open, setOpen] = useState(false);
  const c = TRUST_COPY[kind];
  return (
    <div
      style={{
        border: `1.5px dashed ${TOKENS.ink}`,
        borderRadius: 10,
        background: "rgba(255,255,255,0.4)",
        padding: open ? "10px 12px" : "8px 12px",
        transition: "padding .2s",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          appearance: "none",
          cursor: "pointer",
          width: "100%",
          background: "transparent",
          border: "none",
          padding: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily: TOKENS.mono,
          fontSize: 10,
          fontWeight: 800,
          color: TOKENS.ink,
          letterSpacing: ".12em",
          textTransform: "uppercase",
        }}
      >
        <span>🔒 {c.label}</span>
        <span style={{ opacity: 0.5 }}>{open ? "▴" : "▾"}</span>
      </button>
      {open && (
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: "8px 0 0",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            fontFamily: TOKENS.ui,
            fontSize: 11,
            fontWeight: 600,
            color: TOKENS.ink,
            opacity: 0.8,
            lineHeight: 1.4,
          }}
        >
          {c.lines.map((l, i) => (
            <li key={i}>· {l}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// TierBadge — Free or All-Access stamp
// ────────────────────────────────────────────────────────────────
export function TierBadge({
  tier = "free",
  onUpgrade,
}: {
  tier?: "free" | "all-access";
  onUpgrade?: () => void;
}) {
  const isPaid = tier === "all-access";
  return (
    <button
      onClick={onUpgrade}
      disabled={isPaid}
      style={{
        appearance: "none",
        cursor: isPaid ? "default" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        border: `2.5px solid ${TOKENS.ink}`,
        borderRadius: 999,
        background: isPaid ? TOKENS.accent3 : TOKENS.paper,
        color: isPaid ? TOKENS.paper : TOKENS.ink,
        fontFamily: TOKENS.mono,
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: ".14em",
        boxShadow: `2px 2px 0 ${TOKENS.ink}`,
        textTransform: "uppercase",
      }}
    >
      {isPaid ? <>✦ ALL-ACCESS</> : <>FREE TIER · UPGRADE</>}
    </button>
  );
}

// ────────────────────────────────────────────────────────────────
// TasteToast — micro-toast after a check-in
// ────────────────────────────────────────────────────────────────
export function TasteToast({
  open,
  signals = [],
  onClose,
}: {
  open: boolean;
  signals?: string[];
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, 2400);
    return () => clearTimeout(t);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        top: 80,
        zIndex: 70,
        padding: "10px 14px",
        background: "rgba(43,182,115,0.95)",
        border: `2.5px solid ${TOKENS.ink}`,
        borderRadius: 12,
        boxShadow: `4px 4px 0 ${TOKENS.ink}`,
        fontFamily: TOKENS.mono,
        fontSize: 11,
        fontWeight: 800,
        color: TOKENS.ink,
        letterSpacing: ".06em",
        animation: "cf-push-in 0.35s cubic-bezier(.2,.8,.2,1)",
      }}
    >
      ✦ TASTE LEARNED: {signals.map((s) => `+${s}`).join(" · ")}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// SafetyBadge — kids/family privacy stamp
// ────────────────────────────────────────────────────────────────
type SafetyKind = "kids" | "family" | "coppa";

const SAFETY_COPY: Record<SafetyKind, { e: string; l: string; d: string }> = {
  kids: { e: "🛡", l: "kids-safe", d: "faces auto-blur, no public posts" },
  family: { e: "👨‍👩‍👧", l: "family mode", d: "all-ages venues, no alcohol stops" },
  coppa: { e: "🔒", l: "coppa-verified", d: "parental consent on file" },
};

export function SafetyBadge({ kind = "kids" }: { kind?: SafetyKind }) {
  const c = SAFETY_COPY[kind];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 8px",
        background: "rgba(43,182,115,0.2)",
        border: `1.5px dashed ${TOKENS.ink}`,
        borderRadius: 999,
        fontFamily: TOKENS.mono,
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: ".1em",
        color: TOKENS.ink,
        textTransform: "uppercase",
      }}
      title={c.d}
    >
      {c.e} {c.l}
    </span>
  );
}

// ────────────────────────────────────────────────────────────────
// SparkleError — Claude failure state with retry
// ────────────────────────────────────────────────────────────────
export function SparkleError({
  message,
  onRetry,
  onSkip,
}: {
  message?: string;
  onRetry: () => void;
  onSkip?: () => void;
}) {
  return (
    <div
      style={{
        padding: 16,
        border: `3px solid ${TOKENS.ink}`,
        borderRadius: 16,
        background: TOKENS.accent1,
        boxShadow: `5px 5px 0 ${TOKENS.ink}`,
      }}
    >
      <div
        style={{
          fontFamily: TOKENS.mono,
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: ".14em",
          opacity: 0.7,
          marginBottom: 4,
          color: TOKENS.ink,
        }}
      >
        ⚠ SPARKLE HICCUP
      </div>
      <div
        style={{
          fontFamily: TOKENS.display,
          fontWeight: 900,
          fontSize: 18,
          letterSpacing: "-0.02em",
          marginBottom: 4,
          color: TOKENS.ink,
        }}
      >
        Couldn't print that.
      </div>
      <div
        style={{
          fontFamily: TOKENS.ui,
          fontSize: 12,
          fontWeight: 600,
          opacity: 0.8,
          marginBottom: 12,
          color: TOKENS.ink,
          lineHeight: 1.4,
        }}
      >
        {message ||
          "Sparkle is overloaded right now. The connection blipped or the request needed more time."}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={onRetry}
          style={{
            flex: 2,
            padding: "10px 12px",
            appearance: "none",
            cursor: "pointer",
            border: `2.5px solid ${TOKENS.ink}`,
            borderRadius: 10,
            background: TOKENS.ink,
            color: TOKENS.paper,
            fontFamily: TOKENS.display,
            fontWeight: 900,
            fontSize: 13,
            letterSpacing: "-0.02em",
            boxShadow: `3px 3px 0 ${TOKENS.paper}`,
          }}
        >
          ↻ try again
        </button>
        {onSkip && (
          <button
            onClick={onSkip}
            style={{
              flex: 1,
              padding: "10px 12px",
              appearance: "none",
              cursor: "pointer",
              border: `2.5px solid ${TOKENS.ink}`,
              borderRadius: 10,
              background: TOKENS.paper,
              color: TOKENS.ink,
              fontFamily: TOKENS.ui,
              fontWeight: 800,
              fontSize: 12,
              boxShadow: `3px 3px 0 ${TOKENS.ink}`,
            }}
          >
            skip
          </button>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Coachmark — first-time tooltip overlay
// ────────────────────────────────────────────────────────────────
export function Coachmark({
  open,
  x = "50%",
  y = "50%",
  arrow = "up",
  title,
  body,
  onDone,
}: {
  open: boolean;
  x?: string;
  y?: string;
  arrow?: "up" | "down";
  title: string;
  body: string;
  onDone: () => void;
}) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 65,
        pointerEvents: "none",
        animation: "cf-fadein 0.25s",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(19,11,13,0.45)",
          pointerEvents: "auto",
        }}
        onClick={onDone}
      />
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          transform: "translate(-50%, 0)",
          maxWidth: 240,
          pointerEvents: "auto",
        }}
      >
        {arrow === "up" && (
          <span
            style={{
              position: "absolute",
              left: "50%",
              top: -10,
              transform: "translateX(-50%) rotate(45deg)",
              width: 16,
              height: 16,
              background: TOKENS.accent2,
              border: `2.5px solid ${TOKENS.ink}`,
              borderRight: "none",
              borderBottom: "none",
            }}
          />
        )}
        <div
          style={{
            padding: "12px 14px",
            background: TOKENS.accent2,
            border: `2.5px solid ${TOKENS.ink}`,
            borderRadius: 14,
            boxShadow: `4px 4px 0 ${TOKENS.ink}`,
          }}
        >
          <div
            style={{
              fontFamily: TOKENS.mono,
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: ".14em",
              opacity: 0.6,
              marginBottom: 2,
              color: TOKENS.ink,
            }}
          >
            TIP
          </div>
          <div
            style={{
              fontFamily: TOKENS.display,
              fontWeight: 900,
              fontSize: 15,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              marginBottom: 4,
              color: TOKENS.ink,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontFamily: TOKENS.ui,
              fontSize: 11.5,
              fontWeight: 600,
              color: TOKENS.ink,
              opacity: 0.85,
              lineHeight: 1.35,
            }}
          >
            {body}
          </div>
          <button
            onClick={onDone}
            style={{
              marginTop: 8,
              padding: "6px 10px",
              appearance: "none",
              cursor: "pointer",
              border: `2px solid ${TOKENS.ink}`,
              borderRadius: 999,
              background: TOKENS.paper,
              color: TOKENS.ink,
              fontFamily: TOKENS.mono,
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: ".12em",
              boxShadow: `2px 2px 0 ${TOKENS.ink}`,
            }}
          >
            GOT IT
          </button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// BigBurst — reusable celebratory confetti
// ────────────────────────────────────────────────────────────────
export function BigBurst({ active, density = 36 }: { active: boolean; density?: number }) {
  if (!active) return null;
  const pieces = Array.from({ length: density }, (_, i) => i);
  const colors = [TOKENS.accent1, TOKENS.accent2, TOKENS.accent3, TOKENS.accent4, TOKENS.paper];
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 80,
        overflow: "hidden",
      }}
    >
      {pieces.map((i) => {
        const left = (i * 47) % 100;
        const delay = (i % 9) * 50;
        const size = 5 + (i % 4) * 2;
        const dur = 1100 + (i % 6) * 200;
        const rot = (i * 53) % 360;
        return (
          <span
            key={i}
            style={{
              position: "absolute",
              left: `${left}%`,
              top: "40%",
              width: size,
              height: size * 1.4,
              background: colors[i % colors.length],
              border: `1.5px solid ${TOKENS.ink}`,
              transform: `rotate(${rot}deg)`,
              animation: `cf-fr-confetti ${dur}ms ${delay}ms cubic-bezier(.2,.7,.3,1) forwards`,
              opacity: 0,
            }}
          />
        );
      })}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// KidsBadge — venue-level family/kids-welcome stamp
// ────────────────────────────────────────────────────────────────
type KidsBadgeKind = "menu" | "welcome" | "21+";

const KIDS_COPY: Record<KidsBadgeKind, { e: string; l: string; bg: string; fg?: string }> = {
  menu: { e: "🍽", l: "kids menu", bg: TOKENS.accent4 },
  welcome: { e: "👶", l: "kid-welcome", bg: TOKENS.accent2 },
  "21+": { e: "🍸", l: "21+ only", bg: TOKENS.ink, fg: TOKENS.paper },
};

export function KidsBadge({
  kind,
  size = "sm",
}: {
  kind?: KidsBadgeKind | null;
  size?: "sm" | "md";
}) {
  if (!kind) return null;
  const c = KIDS_COPY[kind];
  if (!c) return null;
  const small = size === "sm";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: small ? "2px 7px" : "4px 10px",
        background: c.bg,
        color: c.fg || TOKENS.ink,
        border: `1.5px solid ${TOKENS.ink}`,
        borderRadius: 999,
        fontFamily: TOKENS.mono,
        fontSize: small ? 8.5 : 10,
        fontWeight: 800,
        letterSpacing: ".08em",
        textTransform: "uppercase",
        flexShrink: 0,
      }}
    >
      {c.e} {c.l}
    </span>
  );
}

export function KidsFootnote({ style = {} }: { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        padding: "8px 10px",
        background: "rgba(255,255,255,0.45)",
        border: `1.5px dashed ${TOKENS.ink}`,
        borderRadius: 10,
        fontFamily: TOKENS.mono,
        fontSize: 9.5,
        fontWeight: 700,
        letterSpacing: ".04em",
        color: TOKENS.ink,
        opacity: 0.75,
        lineHeight: 1.4,
        ...style,
      }}
    >
      📝 kids welcome at every venue. <b>kids menu</b> badge just means they have a dedicated one —
      nice focal point with little ones.
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// VerifiedBusinessBadge — shows on listings + venue detail
// Tiers: 'verified' (basic), 'preferred' (paid), 'partner' (top)
// ────────────────────────────────────────────────────────────────
type VerifiedTier = "verified" | "preferred" | "partner";

const VERIFIED_CFG: Record<VerifiedTier, { e: string; l: string; bg: string; fg: string }> = {
  verified: { e: "✓", l: "verified", bg: TOKENS.accent4, fg: TOKENS.ink },
  preferred: { e: "★", l: "preferred partner", bg: TOKENS.accent2, fg: TOKENS.ink },
  partner: { e: "✦", l: "confetti partner", bg: TOKENS.ink, fg: TOKENS.paper },
};

export function VerifiedBusinessBadge({
  tier = "verified",
  size = "sm",
}: {
  tier?: VerifiedTier;
  size?: "sm" | "md";
}) {
  const c = VERIFIED_CFG[tier] || VERIFIED_CFG.verified;
  const small = size === "sm";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: small ? "3px 8px" : "5px 11px",
        background: c.bg,
        color: c.fg,
        border: `1.5px solid ${TOKENS.ink}`,
        borderRadius: 999,
        fontFamily: TOKENS.mono,
        fontSize: small ? 8.5 : 10,
        fontWeight: 800,
        letterSpacing: ".1em",
        textTransform: "uppercase",
        flexShrink: 0,
      }}
    >
      {c.e} {c.l}
    </span>
  );
}

// ────────────────────────────────────────────────────────────────
// Page — living demo of all info-bits components
// ────────────────────────────────────────────────────────────────
function InfoBitsPage() {
  const navigate = useNavigate();
  const [permOpen, setPermOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);

  return (
    <Frame>
      <div
        className="cf-screen"
        style={{
          position: "relative",
          minHeight: "100dvh",
          background: TOKENS.bg,
          display: "flex",
          flexDirection: "column",
          padding: "46px 22px 40px",
        }}
      >
        <DotsBg opacity={0.06} />
        <TopBar onBack={() => navigate({ to: "/new/welcome" })} />

        {/* Toast is absolutely positioned inside this relative container */}
        <TasteToast
          open={toastOpen}
          signals={["italian", "rooftop"]}
          onClose={() => setToastOpen(false)}
        />
        <PermissionsSheet
          open={permOpen}
          kind="location"
          onAllow={() => setPermOpen(false)}
          onSkip={() => setPermOpen(false)}
        />
        <Coachmark
          open={coachOpen}
          x="50%"
          y="40%"
          title="Swipe to flip"
          body="Each stop card flips to show hashtag reels from TikTok."
          onDone={() => setCoachOpen(false)}
        />

        <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", gap: 24 }}>
          <div>
            <span
              style={{
                fontFamily: TOKENS.mono,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: ".14em",
                opacity: 0.55,
                color: TOKENS.ink,
              }}
            >
              COMPONENT LIBRARY
            </span>
            <h1
              style={{
                fontFamily: TOKENS.display,
                fontWeight: 900,
                fontSize: 28,
                lineHeight: 0.96,
                letterSpacing: "-0.04em",
                color: TOKENS.ink,
                margin: "6px 0 0",
              }}
            >
              Info Bits
            </h1>
          </div>

          {/* Trust badges */}
          <section>
            <div
              style={{
                fontFamily: TOKENS.mono,
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: ".14em",
                opacity: 0.5,
                marginBottom: 8,
                color: TOKENS.ink,
              }}
            >
              TRUST BADGES
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <TrustBadge kind="booking" />
              <TrustBadge kind="payment" />
            </div>
          </section>

          {/* Tier badges */}
          <section>
            <div
              style={{
                fontFamily: TOKENS.mono,
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: ".14em",
                opacity: 0.5,
                marginBottom: 8,
                color: TOKENS.ink,
              }}
            >
              TIER BADGES
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <TierBadge tier="free" />
              <TierBadge tier="all-access" />
            </div>
          </section>

          {/* Safety + kids badges */}
          <section>
            <div
              style={{
                fontFamily: TOKENS.mono,
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: ".14em",
                opacity: 0.5,
                marginBottom: 8,
                color: TOKENS.ink,
              }}
            >
              SAFETY BADGES
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
              <SafetyBadge kind="kids" />
              <SafetyBadge kind="family" />
              <SafetyBadge kind="coppa" />
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
              <KidsBadge kind="menu" />
              <KidsBadge kind="welcome" />
              <KidsBadge kind="21+" />
            </div>
            <KidsFootnote />
          </section>

          {/* Verified badges */}
          <section>
            <div
              style={{
                fontFamily: TOKENS.mono,
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: ".14em",
                opacity: 0.5,
                marginBottom: 8,
                color: TOKENS.ink,
              }}
            >
              VERIFIED BUSINESS BADGES
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <VerifiedBusinessBadge tier="verified" />
              <VerifiedBusinessBadge tier="preferred" />
              <VerifiedBusinessBadge tier="partner" />
            </div>
          </section>

          {/* SparkleError */}
          <section>
            <div
              style={{
                fontFamily: TOKENS.mono,
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: ".14em",
                opacity: 0.5,
                marginBottom: 8,
                color: TOKENS.ink,
              }}
            >
              ERROR STATE
            </div>
            <SparkleError onRetry={() => {}} onSkip={() => {}} />
          </section>

          {/* Interactive demos */}
          <section>
            <div
              style={{
                fontFamily: TOKENS.mono,
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: ".14em",
                opacity: 0.5,
                marginBottom: 8,
                color: TOKENS.ink,
              }}
            >
              INTERACTIVE
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                onClick={() => setPermOpen(true)}
                style={{
                  appearance: "none",
                  cursor: "pointer",
                  padding: "12px 14px",
                  border: `2.5px solid ${TOKENS.ink}`,
                  borderRadius: 12,
                  background: TOKENS.paper,
                  color: TOKENS.ink,
                  fontFamily: TOKENS.ui,
                  fontWeight: 800,
                  fontSize: 13,
                  boxShadow: `3px 3px 0 ${TOKENS.ink}`,
                  textAlign: "left",
                }}
              >
                📍 open permissions sheet →
              </button>
              <button
                onClick={() => setToastOpen(true)}
                style={{
                  appearance: "none",
                  cursor: "pointer",
                  padding: "12px 14px",
                  border: `2.5px solid ${TOKENS.ink}`,
                  borderRadius: 12,
                  background: TOKENS.paper,
                  color: TOKENS.ink,
                  fontFamily: TOKENS.ui,
                  fontWeight: 800,
                  fontSize: 13,
                  boxShadow: `3px 3px 0 ${TOKENS.ink}`,
                  textAlign: "left",
                }}
              >
                ✦ trigger taste toast →
              </button>
              <button
                onClick={() => setCoachOpen(true)}
                style={{
                  appearance: "none",
                  cursor: "pointer",
                  padding: "12px 14px",
                  border: `2.5px solid ${TOKENS.ink}`,
                  borderRadius: 12,
                  background: TOKENS.paper,
                  color: TOKENS.ink,
                  fontFamily: TOKENS.ui,
                  fontWeight: 800,
                  fontSize: 13,
                  boxShadow: `3px 3px 0 ${TOKENS.ink}`,
                  textAlign: "left",
                }}
              >
                💬 show coachmark →
              </button>
            </div>
          </section>
        </div>
      </div>
    </Frame>
  );
}
