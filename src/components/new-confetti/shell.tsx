// New Confetti shared shell — primitives ported from
// design/new-confetti/project/components.jsx (lines 6-244) plus the
// keyframes block from design/new-confetti/project/index.html
// (lines 69-128). Used by every /new/* screen so each port is a
// clean composition of these chunky brutalist primitives.

import { useState, type CSSProperties, type ReactNode } from "react";

/* ── Palette tokens (warm) ─────────────────────────────────────────── */
export const TOKENS = {
  bg: "#f8f0dd",
  paper: "#fffaf0",
  ink: "#130b0d",
  accent1: "#ff5b3d", // coral
  accent2: "#f7c83b", // yellow
  accent3: "#5b45d9", // purple
  accent4: "#2bb673", // green
  // Accessible muted ink shades — use instead of `opacity` on text.
  // inkMuted: ~6.4:1 contrast on cream (body secondary text, any size)
  // inkHint:  ~4.6:1 contrast on cream (labels/captions, bold ≥12px only)
  inkMuted: "#5c5350",
  inkHint: "#6e6460",
  // Muted text on dark (ink-coloured) backgrounds — still 8:1+ contrast
  paperMuted: "#c8bfbc",
  display: "'Bricolage Grotesque', 'Inter', system-ui, sans-serif",
  ui: "'Inter', system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
} as const;

/**
 * Returns TOKENS.ink or TOKENS.paper — whichever is more legible — for text
 * placed over `bgHex`. Uses the WCAG relative-luminance approximation.
 * Works with any 6-digit hex string (e.g. "#ff5b3d").
 */
export function contrastText(bgHex: string): string {
  const r = parseInt(bgHex.slice(1, 3), 16);
  const g = parseInt(bgHex.slice(3, 5), 16);
  const b = parseInt(bgHex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? TOKENS.ink : TOKENS.paper;
}

/* ── Keyframes (injected once per page via Frame) ──────────────────── */
const KEYFRAMES = `
@keyframes cf-float { 0%,100%{transform:translateY(0) rotate(0)} 50%{transform:translateY(-18px) rotate(12deg)} }
@keyframes cf-spin { to { transform: rotate(360deg) } }
@keyframes cf-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.7)} }
@keyframes cf-print { 0%{transform:translateY(-8px)} 50%,90%{transform:translateY(0)} 100%{transform:translateY(-8px)} }
@keyframes cf-route { 0%,12%{transform:translateY(-50%) scaleX(0)} 55%,100%{transform:translateY(-50%) scaleX(1)} }
@keyframes cf-pop { 0%{opacity:0;transform:scale(.85)} 100%{opacity:1;transform:scale(1)} }
@keyframes cf-bubble { 0%{transform:scale(.4);opacity:0} 60%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
@keyframes cf-screen-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
.cf-screen { animation: cf-screen-in .32s cubic-bezier(.2,.8,.2,1); }
`;

/* ── iPhone-sized frame on a dark backdrop ─────────────────────────── */
/**
 * Wrap a new-confetti screen. Sets the warm palette CSS vars on the
 * container so helpers using var(--ink), var(--accent-1) etc. resolve
 * correctly even outside the design's global scope.
 */
export function Frame({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{KEYFRAMES}</style>
      <div
        style={
          {
            width: "100%",
            minHeight: "100dvh",
            background: TOKENS.bg,
            color: TOKENS.ink,
            fontFamily: TOKENS.ui,
            ["--cf-display" as string]: TOKENS.display,
            ["--cf-ui" as string]: TOKENS.ui,
            ["--cf-mono" as string]: TOKENS.mono,
            ["--bg" as string]: TOKENS.bg,
            ["--paper" as string]: TOKENS.paper,
            ["--ink" as string]: TOKENS.ink,
            ["--accent-1" as string]: TOKENS.accent1,
            ["--accent-2" as string]: TOKENS.accent2,
            ["--accent-3" as string]: TOKENS.accent3,
            ["--accent-4" as string]: TOKENS.accent4,
          } as CSSProperties
        }
      >
        {children}
      </div>
    </>
  );
}

/* ── Back button ──────────────────────────────────────────────────── */
/**
 * Chunky circle back button — used in the top-left of inner screens.
 * Accepts an `onClick` handler (typically `() => navigate({ to: ... })`).
 */
export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
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
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        color: TOKENS.ink,
      }}
    >
      ←
    </button>
  );
}

/* ── Top bar (back + brand + spacer) ─────────────────────────────── */
/**
 * Standard top bar layout: BackButton | BrandMark | 36px spacer.
 * Drop this at the top of any inner screen for consistent nav.
 */
export function TopBar({ onBack, brandSize = 17 }: { onBack: () => void; brandSize?: number }) {
  return (
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
      <BackButton onClick={onBack} />
      <BrandMark size={brandSize} />
      <span style={{ width: 36 }} />
    </div>
  );
}

/* ── Brand mark ────────────────────────────────────────────────────── */
export function BrandMark({ size = 22, spin = false }: { size?: number; spin?: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        fontFamily: TOKENS.display,
        fontWeight: 900,
        fontSize: size,
        letterSpacing: "-0.03em",
        color: TOKENS.ink,
      }}
    >
      <span
        style={{
          color: TOKENS.accent1,
          fontSize: size * 1.05,
          display: "inline-block",
          animation: spin ? "cf-spin 3s linear infinite" : undefined,
          transformOrigin: "center",
        }}
      >
        ✣
      </span>
      <span>
        confetti<span style={{ color: TOKENS.accent1 }}>.</span>
      </span>
    </span>
  );
}

/* ── Background dot pattern ────────────────────────────────────────── */
export function DotsBg({ opacity = 0.08, size = 22 }: { opacity?: number; size?: number }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        backgroundImage: `radial-gradient(${TOKENS.ink} 1px, transparent 1px)`,
        backgroundSize: `${size}px ${size}px`,
        opacity,
      }}
    />
  );
}

/* ── Floating ticket dots ──────────────────────────────────────────── */
export function FloatingTickets({ density = 5 }: { density?: number }) {
  const positions = [
    { top: "12%", left: "8%", color: TOKENS.accent1, delay: 0 },
    { top: "20%", right: "10%", color: TOKENS.accent2, delay: 0.4 },
    { bottom: "24%", left: "12%", color: TOKENS.accent3, delay: 0.8 },
    { bottom: "14%", right: "14%", color: TOKENS.accent1, delay: 1.2 },
    { top: "50%", left: "4%", color: TOKENS.accent2, delay: 1.6 },
    { top: "62%", right: "6%", color: TOKENS.accent3, delay: 2.0 },
  ].slice(0, density);
  return (
    <>
      {positions.map((p, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            top: p.top,
            left: p.left,
            right: p.right,
            bottom: p.bottom,
            width: 12,
            height: 22,
            border: `2px solid ${TOKENS.ink}`,
            borderRadius: 3,
            background: p.color,
            animation: `cf-float 4s ${p.delay}s infinite ease-in-out`,
            pointerEvents: "none",
          }}
        />
      ))}
    </>
  );
}

/* ── Chunky chip ────────────────────────────────────────────────────── */
export function Chip({
  children,
  selected,
  onClick,
  color,
  icon,
  dense = false,
}: {
  children: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  color?: string;
  icon?: ReactNode;
  dense?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        appearance: "none",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: dense ? "7px 12px" : "10px 14px",
        border: `2.5px solid ${TOKENS.ink}`,
        borderRadius: 999,
        background: selected ? color || TOKENS.accent1 : TOKENS.paper,
        color: TOKENS.ink,
        fontFamily: TOKENS.ui,
        fontSize: dense ? 12 : 14,
        fontWeight: 800,
        letterSpacing: "-0.01em",
        boxShadow: selected ? `3px 3px 0 ${TOKENS.ink}` : `0 0 0 ${TOKENS.ink}`,
        transform: selected ? "translate(-1px, -1px)" : "none",
        transition: "transform .12s, box-shadow .12s, background .12s",
      }}
    >
      {icon && <span style={{ fontSize: dense ? 13 : 15 }}>{icon}</span>}
      {children}
    </button>
  );
}

/* ── Chunky CTA ────────────────────────────────────────────────────── */
export function ChunkyButton({
  children,
  onClick,
  disabled,
  variant = "primary",
  icon,
  full = true,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "accent" | "ghost";
  icon?: ReactNode;
  full?: boolean;
}) {
  const bg =
    variant === "primary" ? TOKENS.ink : variant === "accent" ? TOKENS.accent1 : TOKENS.paper;
  const fg = variant === "primary" ? TOKENS.paper : TOKENS.ink;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        appearance: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        width: full ? "100%" : undefined,
        padding: "18px 22px",
        border: `3px solid ${TOKENS.ink}`,
        borderRadius: 16,
        background: bg,
        color: fg,
        fontFamily: TOKENS.ui,
        fontSize: 17,
        fontWeight: 900,
        letterSpacing: "-0.01em",
        boxShadow: `5px 5px 0 ${TOKENS.ink}`,
        opacity: disabled ? 0.45 : 1,
        transition: "transform .12s, box-shadow .12s",
      }}
    >
      {children}
      {icon && <span style={{ display: "inline-flex", alignItems: "center" }}>{icon}</span>}
    </button>
  );
}

/* ── Stamp pill ────────────────────────────────────────────────────── */
export function Stamp({
  children,
  color,
  rotate = -3,
  style = {},
}: {
  children: ReactNode;
  color?: string;
  rotate?: number;
  style?: CSSProperties;
}) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "7px 12px",
        border: `2.5px solid ${TOKENS.ink}`,
        borderRadius: 999,
        background: color || TOKENS.paper,
        color: TOKENS.ink,
        fontFamily: TOKENS.ui,
        fontSize: 11,
        fontWeight: 900,
        letterSpacing: ".12em",
        textTransform: "uppercase",
        transform: `rotate(${rotate}deg)`,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/* ── Ticket (perforated card) ──────────────────────────────────────── */
export function Ticket({
  children,
  color = TOKENS.paper,
  notch = true,
  style = {},
}: {
  children: ReactNode;
  color?: string;
  notch?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        position: "relative",
        border: `3px solid ${TOKENS.ink}`,
        borderRadius: 22,
        background: color,
        color: TOKENS.ink,
        boxShadow: `7px 7px 0 ${TOKENS.ink}`,
        ...style,
      }}
    >
      {notch && (
        <>
          <span
            style={{
              position: "absolute",
              left: -9,
              top: "50%",
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: TOKENS.bg,
              border: `3px solid ${TOKENS.ink}`,
              transform: "translateY(-50%)",
              clipPath: "inset(0 0 0 50%)",
            }}
          />
          <span
            style={{
              position: "absolute",
              right: -9,
              top: "50%",
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: TOKENS.bg,
              border: `3px solid ${TOKENS.ink}`,
              transform: "translateY(-50%)",
              clipPath: "inset(0 50% 0 0)",
            }}
          />
        </>
      )}
      {children}
    </div>
  );
}

/* ── Perf (dashed separator) ───────────────────────────────────────── */
export function Perf({ vertical = false }: { vertical?: boolean }) {
  return (
    <div
      style={{
        borderTop: vertical ? "none" : `2.5px dashed ${TOKENS.ink}`,
        borderLeft: vertical ? `2.5px dashed ${TOKENS.ink}` : "none",
        opacity: 0.5,
        margin: vertical ? "0" : "14px 0",
        width: vertical ? 0 : "auto",
      }}
    />
  );
}

/* ── Route dots ────────────────────────────────────────────────────── */
export function RouteDots({
  progress = 1,
  animate = false,
  size = 18,
}: {
  progress?: number;
  animate?: boolean;
  size?: number;
}) {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        margin: "18px 4px",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "50%",
          left: size / 2,
          right: size / 2,
          height: 3,
          background: TOKENS.ink,
          transform: `translateY(-50%) scaleX(${progress})`,
          transformOrigin: "left",
          animation: animate ? "cf-route 2.8s infinite ease-in-out" : undefined,
        }}
      />
      {[TOKENS.accent2, TOKENS.accent1, TOKENS.accent3].map((c, i) => (
        <span
          key={i}
          style={{
            position: "relative",
            zIndex: 1,
            width: size,
            height: size,
            border: `3px solid ${TOKENS.ink}`,
            borderRadius: 999,
            background: c,
          }}
        />
      ))}
    </div>
  );
}

/* ── ModePill ──────────────────────────────────────────────────────── */
// Ported from design/new-confetti/project/family.jsx — ModePill component

export type AppMode = "adults" | "family" | "kids" | "all";

const MODES: { id: AppMode; label: string; icon: string; c: string }[] = [
  { id: "adults", label: "Adults",   icon: "🍷", c: TOKENS.accent3 },
  { id: "family", label: "Family",   icon: "👨‍👩‍👧", c: TOKENS.accent1 },
  { id: "kids",   label: "Kids",     icon: "🧸", c: TOKENS.accent2 },
  { id: "all",    label: "All ages", icon: "✣", c: TOKENS.ink },
];

export function ModePill({
  value,
  onChange,
  compact = false,
}: {
  value: AppMode;
  onChange: (m: AppMode) => void;
  compact?: boolean;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 2,
        padding: 3,
        border: `2.5px solid ${TOKENS.ink}`,
        borderRadius: 999,
        background: TOKENS.paper,
        boxShadow: `3px 3px 0 ${TOKENS.ink}`,
      }}
    >
      {MODES.map((m) => {
        const on = value === m.id;
        return (
          <button
            key={m.id}
            onClick={() => onChange(m.id)}
            style={{
              appearance: "none",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: compact ? "4px 8px" : "6px 10px",
              border: "none",
              borderRadius: 999,
              background: on ? m.c : "transparent",
              color: on && m.c === TOKENS.ink ? TOKENS.paper : TOKENS.ink,
              fontFamily: TOKENS.ui,
              fontSize: compact ? 11 : 12,
              fontWeight: 800,
              letterSpacing: "-0.01em",
              transition: "all .12s",
            }}
          >
            <span style={{ fontSize: compact ? 12 : 13 }}>{m.icon}</span>
            {!compact && m.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── PointsPill ────────────────────────────────────────────────────── */
// Ported from design/new-confetti/project/loyalty.jsx — PointsPill component

const TIERS = [
  { id: "silver",   label: "Silver",   min: 0,    c: "#c8c5b9" },
  { id: "gold",     label: "Gold",     min: 1000, c: TOKENS.accent2 },
  { id: "platinum", label: "Platinum", min: 5000, c: TOKENS.accent3 },
];

function tierFor(pts: number) {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (pts >= TIERS[i].min) return { ...TIERS[i], next: TIERS[i + 1] };
  }
  return { ...TIERS[0], next: TIERS[1] };
}

export function PointsPill({
  points = 0,
  onClick,
}: {
  points?: number;
  onClick?: () => void;
}) {
  const t = tierFor(points);
  return (
    <button
      onClick={onClick}
      style={{
        appearance: "none",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 11px 5px 5px",
        border: `2.5px solid ${TOKENS.ink}`,
        borderRadius: 999,
        background: TOKENS.paper,
        color: TOKENS.ink,
        boxShadow: `3px 3px 0 ${TOKENS.ink}`,
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: 999,
          background: t.c,
          border: `2px solid ${TOKENS.ink}`,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: TOKENS.display,
          fontWeight: 900,
          fontSize: 11,
          color: TOKENS.ink,
          flexShrink: 0,
        }}
      >
        {t.label[0]}
      </span>
      <span
        style={{
          fontFamily: TOKENS.display,
          fontWeight: 900,
          fontSize: 13,
          letterSpacing: "-0.01em",
        }}
      >
        {points.toLocaleString()}
      </span>
      <span
        style={{
          fontFamily: TOKENS.mono,
          fontSize: 8,
          fontWeight: 800,
          letterSpacing: ".12em",
          opacity: 0.6,
        }}
      >
        PTS
      </span>
    </button>
  );
}

/* ── useAppMode ────────────────────────────────────────────────────── */
// Persistent mode stored in localStorage so it survives navigation.
export function useAppMode(): [AppMode, (m: AppMode) => void] {
  const [mode, setModeState] = useState<AppMode>(() => {
    try {
      return (localStorage.getItem("cf_mode") as AppMode) || "adults";
    } catch {
      return "adults";
    }
  });
  const setMode = (m: AppMode) => {
    try { localStorage.setItem("cf_mode", m); } catch { /* noop */ }
    setModeState(m);
  };
  return [mode, setMode];
}

/* ── Icon set ──────────────────────────────────────────────────────── */
export const Icons = {
  arrow: (
    <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
      <path
        d="M1 7h15m0 0L10 1m6 6l-6 6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  pin: (
    <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
      <path
        d="M7 1c3.3 0 6 2.7 6 6 0 4.5-6 8-6 8s-6-3.5-6-8c0-3.3 2.7-6 6-6z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="7" cy="7" r="2" fill={TOKENS.paper} />
    </svg>
  ),
  clock: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="2" />
      <path d="M7 3.5V7l2.5 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  money: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M9.5 4.5C9.5 3 8 2 6.5 2S3.5 2.5 3.5 4c0 3 6 1 6 4s-2 2-3 2-3-.5-3-2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M6.5 1v2m0 8v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  people: (
    <svg width="16" height="14" viewBox="0 0 16 14" fill="none">
      <circle cx="5" cy="4" r="2.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="11" cy="4" r="2.5" stroke="currentColor" strokeWidth="2" />
      <path
        d="M1 13c0-2.2 1.8-4 4-4s4 1.8 4 4M7 13c0-2.2 1.8-4 4-4s4 1.8 4 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  spark: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 1l1.5 4.5L13 7l-4.5 1.5L7 13l-1.5-4.5L1 7l4.5-1.5L7 1z" fill="currentColor" />
    </svg>
  ),
  check: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M2 7l3.5 3.5L12 4"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  refresh: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M12 7a5 5 0 1 1-1.5-3.5M12 1.5V4H9.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ),
  close: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),
};
