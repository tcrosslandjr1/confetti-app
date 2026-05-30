import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, type CSSProperties } from "react";
import {
  Frame,
  DotsBg,
  BrandMark,
  TOKENS,
  Chip,
  ChunkyButton,
  Icons,
  RouteDots,
} from "@/components/new-confetti/shell";

export const Route = createFileRoute("/new/social")({ component: SocialPage });

// ─── Social glyphs ───────────────────────────────────────────
const SocialIcons = {
  tiktok: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M14 2v2.4a4 4 0 0 0 3.8 3.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M14 2v10a4 4 0 1 1-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  insta: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="2" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="2"/>
      <circle cx="10" cy="10" r="3.5" stroke="currentColor" strokeWidth="2"/>
      <circle cx="14.5" cy="5.5" r="1" fill="currentColor"/>
    </svg>
  ),
  x: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 3l14 14M17 3 3 17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  ),
  snap: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 1.5c3 0 4.5 2 4.5 5 0 1.5-.2 3-.2 3.5s.5.8 1.3 1c.6.2 1.4.3 1.4.8 0 .8-2 1.4-2.5 2-.2.2.3 1.2-.4 1.4-.6.2-1.3-.4-2 .2s-1.2 2-2.2 2.1c-1 .1-1.5-1-3-1s-2 1.1-3 1c-1-.1-1.5-1.5-2.2-2.1-.7-.6-1.4 0-2-.2-.7-.2-.2-1.2-.4-1.4-.5-.6-2.5-1.2-2.5-2 0-.5.8-.6 1.4-.8.8-.2 1.3-.5 1.3-1s-.2-2-.2-3.5c0-3 1.5-5 4.5-5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" transform="scale(0.95) translate(0.5 0.5)"/>
    </svg>
  ),
  imessage: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 4h14v9H7l-4 3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    </svg>
  ),
  link: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M8 12a3 3 0 0 0 4 0l3-3a3 3 0 0 0-4-4l-1 1M12 8a3 3 0 0 0-4 0l-3 3a3 3 0 0 0 4 4l1-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  camera: (
    <svg width="22" height="20" viewBox="0 0 22 20" fill="none">
      <path d="M2 6h3l2-2h8l2 2h3v11H2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <circle cx="11" cy="11" r="3.5" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
};

// ─── Types ───────────────────────────────────────────────────
interface FeedItem {
  who: string;
  venue: string;
  mins: number;
  photoColor: string;
  caption: string;
  reactions: string[];
}

interface StopInfo {
  name: string;
  tag: string;
  idx: number;
  color: string;
}

interface CheckIn {
  caption: string;
  tagged: string[];
  targets: { feed: boolean; tiktok: boolean; ig: boolean; x: boolean };
  photoColor: string;
}

// ─── Sample feed ─────────────────────────────────────────────
const SAMPLE_FEED: FeedItem[] = [
  { who: "maya",  venue: "pretzel + IPA", mins: 2, photoColor: "#ff5b3d", caption: "first round, she's late ☔", reactions: ["🔥", "🍻"] },
  { who: "devon", venue: "on the L",      mins: 4, photoColor: "#5b45d9", caption: "two stops out",              reactions: ["🚇"] },
  { who: "sam",   venue: "at lupa",       mins: 8, photoColor: "#f7c83b", caption: "this carbonara, dude",       reactions: ["🍝", "😮‍💨", "🔥"] },
];

const SAMPLE_STOPS: StopInfo[] = [
  { name: "Skinny Pete's", tag: "dive bar",  idx: 0, color: TOKENS.accent1 },
  { name: "Lupa Notte",    tag: "italian",   idx: 1, color: TOKENS.accent2 },
  { name: "Quartz Room",   tag: "live show", idx: 2, color: TOKENS.accent3 },
];

// ─── Photo placeholder block ──────────────────────────────────
function PhotoBlock({
  aspect = "4/5",
  color = TOKENS.accent2,
  label,
  children,
  style = {},
}: {
  aspect?: string;
  color?: string;
  label?: string;
  children?: React.ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        position: "relative",
        aspectRatio: aspect,
        background: color,
        border: `2px solid ${TOKENS.ink}`,
        overflow: "hidden",
        backgroundImage: "repeating-linear-gradient(135deg, rgba(0,0,0,0.07) 0 7px, transparent 7px 14px)",
        ...style,
      }}
    >
      {children}
      {label && (
        <div
          style={{
            position: "absolute", bottom: 6, left: 8,
            padding: "2px 6px", background: TOKENS.ink, color: TOKENS.paper,
            fontFamily: TOKENS.mono, fontSize: 8, fontWeight: 800,
            letterSpacing: ".14em", textTransform: "uppercase",
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}

// ─── Feed card ────────────────────────────────────────────────
function FeedCard({ who, venue, mins, photoColor, caption, reactions }: FeedItem) {
  return (
    <div
      style={{
        flexShrink: 0, width: 138,
        border: `2.5px solid ${TOKENS.paper}`, borderRadius: 10,
        background: "rgba(255,255,255,0.06)", overflow: "hidden",
        boxShadow: "3px 3px 0 rgba(255,91,61,0.4)",
      }}
    >
      <PhotoBlock color={photoColor} aspect="4/5" label={venue} style={{ border: "none", borderBottom: `2.5px solid ${TOKENS.paper}` }}>
        <svg width="100%" height="100%" viewBox="0 0 100 125" preserveAspectRatio="xMidYMid slice"
          style={{ position: "absolute", inset: 0, opacity: 0.35 }}>
          <circle cx="50" cy="48" r="18" fill="rgba(0,0,0,0.4)"/>
          <path d="M20 125 C 20 95, 35 78, 50 78 S 80 95, 80 125 Z" fill="rgba(0,0,0,0.4)"/>
        </svg>
        <span style={{
          position: "absolute", top: 6, right: 6,
          padding: "2px 6px", background: TOKENS.accent1, color: TOKENS.ink,
          fontFamily: TOKENS.mono, fontSize: 8, fontWeight: 900,
          letterSpacing: ".12em", border: `1.5px solid ${TOKENS.ink}`,
        }}>{mins}M</span>
      </PhotoBlock>
      <div style={{ padding: "8px 10px" }}>
        <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, color: TOKENS.paper, opacity: 0.6, letterSpacing: ".08em" }}>@{who}</div>
        <div style={{
          fontFamily: TOKENS.ui, fontSize: 11, fontWeight: 700, marginTop: 3,
          lineHeight: 1.3, color: TOKENS.paper,
          overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        } as CSSProperties}>{caption}</div>
        {reactions.length > 0 && (
          <div style={{ display: "flex", gap: 4, marginTop: 6, fontSize: 11 }}>
            {reactions.map((r, i) => (
              <span key={i} style={{
                padding: "1px 5px", background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.2)", borderRadius: 999,
              }}>{r} 1</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Live feed strip ─────────────────────────────────────────
function LiveFeed({ items = SAMPLE_FEED }: { items?: FeedItem[] }) {
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800,
          letterSpacing: ".16em", color: TOKENS.paper, opacity: 0.85,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: TOKENS.accent1, animation: "cf-pulse 1.2s infinite", display: "block" }} />
          CREW LIVE · {items.length}
        </span>
        <span style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 700, color: TOKENS.paper, opacity: 0.5, cursor: "pointer" }}>see all →</span>
      </div>
      <div style={{ display: "flex", gap: 10, overflowX: "auto", scrollbarWidth: "none", marginRight: -22, paddingRight: 22, paddingBottom: 4 }}>
        {items.map((it, i) => <FeedCard key={i} {...it} />)}
      </div>
    </div>
  );
}

// ─── Post toggle ─────────────────────────────────────────────
function PostToggle({
  on, label, icon, onColor, onToggle,
}: {
  on: boolean; label: string; icon: React.ReactNode; onColor: string; onToggle: () => void;
}) {
  const isDark = onColor === TOKENS.ink || onColor === TOKENS.accent3;
  return (
    <button
      onClick={onToggle}
      style={{
        appearance: "none", cursor: "pointer",
        display: "flex", alignItems: "center", gap: 8,
        padding: "11px 12px",
        border: `2.5px solid ${TOKENS.ink}`, borderRadius: 12,
        background: on ? onColor : TOKENS.paper,
        color: on ? (isDark ? TOKENS.paper : TOKENS.ink) : TOKENS.ink,
        fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 800,
        boxShadow: on ? `3px 3px 0 ${TOKENS.ink}` : "none",
        transform: on ? "translate(-1px,-1px)" : "none",
        transition: "all .12s",
        textAlign: "left",
      }}
    >
      <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{icon}</span>
      <span style={{ flex: 1, lineHeight: 1.1 }}>{label}</span>
      <span style={{
        flexShrink: 0, width: 16, height: 16, borderRadius: 999,
        border: "2px solid currentColor",
        background: on ? "currentColor" : "transparent",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
      }}>
        {on && <span style={{ width: 6, height: 6, borderRadius: 999, background: isDark ? TOKENS.paper : TOKENS.ink }} />}
      </span>
    </button>
  );
}

// ─── Check-in sheet (bottom sheet) ──────────────────────────
function CheckInSheet({
  open, stop, crew = ["maya", "devon", "sam"], onClose, onPost,
}: {
  open: boolean; stop: StopInfo; crew?: string[];
  onClose: () => void; onPost: (c: CheckIn) => void;
}) {
  const [caption, setCaption] = useState("");
  const [tagged, setTagged] = useState<string[]>([]);
  const [targets, setTargets] = useState({ feed: true, tiktok: false, ig: false, x: false });
  const [photoSwatch, setPhotoSwatch] = useState(0);

  useEffect(() => {
    if (open) {
      setCaption(`live from ${stop.name.toLowerCase()}`);
      setTagged([]);
      setTargets({ feed: true, tiktok: false, ig: false, x: false });
    }
  }, [open, stop]);

  if (!open) return null;

  const photoColors = [TOKENS.accent1, TOKENS.accent2, TOKENS.accent3, "#f8a05c"];
  const toggleTarget = (k: keyof typeof targets) => setTargets({ ...targets, [k]: !targets[k] });
  const toggleTag = (n: string) =>
    setTagged(tagged.includes(n) ? tagged.filter((t) => t !== n) : [...tagged, n]);

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 60, display: "flex", alignItems: "flex-end", animation: "cf-fadein 0.2s" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }} />
      <div style={{
        position: "relative", width: "100%",
        background: TOKENS.bg, color: TOKENS.ink,
        borderRadius: "26px 26px 0 0",
        borderTop: `3px solid ${TOKENS.ink}`,
        boxShadow: `0 -10px 0 ${TOKENS.ink}`,
        padding: "12px 20px 24px",
        maxHeight: "92%", overflowY: "auto",
        animation: "cf-slideup 0.32s cubic-bezier(.2,.9,.2,1)",
        scrollbarWidth: "none",
      }}>
        <div style={{ width: 44, height: 5, borderRadius: 999, background: TOKENS.ink, opacity: 0.25, margin: "0 auto 12px" }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800, letterSpacing: ".16em", opacity: 0.55 }}>CHECK IN AT</div>
            <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 22, letterSpacing: "-0.03em", marginTop: 2 }}>{stop.name}</div>
          </div>
          <button onClick={onClose} style={{
            appearance: "none", cursor: "pointer",
            width: 34, height: 34, borderRadius: 999,
            border: `2.5px solid ${TOKENS.ink}`, background: TOKENS.paper,
            fontSize: 14, fontWeight: 900, color: TOKENS.ink,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>

        {/* Photo composer */}
        <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
          <PhotoBlock color={photoColors[photoSwatch]} aspect="4/5" label={stop.tag} style={{ flex: 1, border: `3px solid ${TOKENS.ink}`, boxShadow: `4px 4px 0 ${TOKENS.ink}` }}>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, color: TOKENS.ink }}>
              <span style={{ opacity: 0.5 }}>{SocialIcons.camera}</span>
              <span style={{ fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800, letterSpacing: ".12em", opacity: 0.6, textTransform: "uppercase" }}>tap to snap</span>
            </div>
            <span style={{
              position: "absolute", top: 8, left: 8,
              padding: "3px 7px", background: TOKENS.paper, color: TOKENS.ink,
              border: `2px solid ${TOKENS.ink}`,
              fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800,
              letterSpacing: ".12em", textTransform: "uppercase",
            }}>STOP {stop.idx + 1}/3</span>
          </PhotoBlock>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, width: 64 }}>
            {photoColors.map((c, i) => (
              <button key={i} onClick={() => setPhotoSwatch(i)} style={{
                appearance: "none", cursor: "pointer",
                width: "100%", aspectRatio: "1", borderRadius: 8,
                border: `2.5px solid ${TOKENS.ink}`, background: c,
                boxShadow: i === photoSwatch ? `3px 3px 0 ${TOKENS.ink}` : "none",
                transform: i === photoSwatch ? "translate(-1px,-1px)" : "none",
                transition: "all .12s", position: "relative",
                backgroundImage: "repeating-linear-gradient(135deg, rgba(0,0,0,0.06) 0 4px, transparent 4px 8px)",
              }}>
                {i === photoSwatch && (
                  <span style={{
                    position: "absolute", top: 3, right: 3,
                    width: 12, height: 12, borderRadius: 999,
                    background: TOKENS.ink, color: TOKENS.paper,
                    fontSize: 8, fontWeight: 900,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>✓</span>
                )}
              </button>
            ))}
            <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 700, letterSpacing: ".1em", textAlign: "center", opacity: 0.5, marginTop: -2 }}>FILTER</div>
          </div>
        </div>

        {/* Caption */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800, letterSpacing: ".14em", opacity: 0.55, textTransform: "uppercase", marginBottom: 6 }}>caption</div>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={2} maxLength={140}
            style={{
              width: "100%", resize: "none",
              padding: "10px 14px",
              border: `2.5px solid ${TOKENS.ink}`, borderRadius: 12,
              background: TOKENS.paper, color: TOKENS.ink,
              fontFamily: TOKENS.ui, fontSize: 14, fontWeight: 700,
              outline: "none", boxShadow: `3px 3px 0 ${TOKENS.ink}`,
              boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 700, opacity: 0.5, marginTop: 4 }}>{caption.length}/140</div>
        </div>

        {/* Tag crew */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800, letterSpacing: ".14em", opacity: 0.55, textTransform: "uppercase", marginBottom: 8 }}>tag crew</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {crew.map((n) => (
              <Chip key={n} selected={tagged.includes(n)} color={TOKENS.accent1} onClick={() => toggleTag(n)} dense>@{n}</Chip>
            ))}
          </div>
        </div>

        {/* Post to */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800, letterSpacing: ".14em", opacity: 0.55, textTransform: "uppercase", marginBottom: 8 }}>post to</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <PostToggle on={targets.feed}   label="confetti feed"      icon={<span style={{ color: TOKENS.accent1 }}>✣</span>} onColor={TOKENS.accent1} onToggle={() => toggleTarget("feed")} />
            <PostToggle on={targets.tiktok} label="auto-clip → tiktok" icon={SocialIcons.tiktok} onColor={TOKENS.ink} onToggle={() => toggleTarget("tiktok")} />
            <PostToggle on={targets.ig}     label="instagram story"    icon={SocialIcons.insta}  onColor={TOKENS.accent3} onToggle={() => toggleTarget("ig")} />
            <PostToggle on={targets.x}      label="x / twitter"        icon={SocialIcons.x}      onColor={TOKENS.accent2} onToggle={() => toggleTarget("x")} />
          </div>
        </div>

        <ChunkyButton variant="accent" onClick={() => onPost({ caption, tagged, targets, photoColor: photoColors[photoSwatch] })} icon={Icons.arrow}>
          post check-in
        </ChunkyButton>
        <div style={{ marginTop: 10, textAlign: "center", fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 700, opacity: 0.55 }}>
          + earns you a stamp toward this month's pass
        </div>
      </div>
    </div>
  );
}

// ─── Posted card (after posting) ─────────────────────────────
function PostedCard({ check }: { check: CheckIn }) {
  return (
    <div style={{
      marginTop: 12,
      border: `2.5px solid ${TOKENS.accent1}`, borderRadius: 14,
      background: "rgba(255,91,61,0.08)",
      padding: 12, color: TOKENS.paper,
      display: "flex", gap: 12,
      animation: "cf-pop 0.4s cubic-bezier(.2,1.4,.4,1)",
    }}>
      <PhotoBlock color={check.photoColor} aspect="1" style={{ width: 70, height: 70, flexShrink: 0, border: `2.5px solid ${TOKENS.paper}` }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".14em", color: TOKENS.accent1 }}>POSTED · JUST NOW</div>
        <div style={{ fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 700, marginTop: 4, lineHeight: 1.3 }}>{check.caption}</div>
        <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
          {check.targets.feed   && <PostedBadge>confetti</PostedBadge>}
          {check.targets.tiktok && <PostedBadge>tiktok</PostedBadge>}
          {check.targets.ig     && <PostedBadge>ig story</PostedBadge>}
          {check.targets.x      && <PostedBadge>x</PostedBadge>}
          {check.tagged.length > 0 && <PostedBadge>@{check.tagged.join(" @")}</PostedBadge>}
        </div>
      </div>
    </div>
  );
}

function PostedBadge({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      padding: "2px 8px",
      background: "rgba(255,255,255,0.12)",
      border: "1px solid rgba(255,255,255,0.25)", borderRadius: 999,
      fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 700,
      letterSpacing: ".08em", textTransform: "uppercase",
    }}>{children}</span>
  );
}

// ─── Reel preview ────────────────────────────────────────────
function ReelPreview({ stops, onPost }: { stops: StopInfo[]; onPost: () => void }) {
  const [playing, setPlaying] = useState(true);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setFrame((f) => (f + 1) % stops.length), 1200);
    return () => clearInterval(t);
  }, [playing, stops.length]);

  const current = stops[frame];

  return (
    <div style={{ border: `3px solid ${TOKENS.ink}`, borderRadius: 18, background: TOKENS.paper, padding: 14, boxShadow: `6px 6px 0 ${TOKENS.ink}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800, letterSpacing: ".14em", opacity: 0.55 }}>AUTO-RECAP</div>
          <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 22, letterSpacing: "-0.03em", marginTop: 1 }}>your reel · 9s</div>
        </div>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "5px 9px",
          border: `2px solid ${TOKENS.ink}`, borderRadius: 999,
          background: TOKENS.ink, color: TOKENS.paper,
          fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".14em",
        }}>
          <span>{SocialIcons.tiktok}</span>
          READY
        </span>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        {/* 9:16 viewer */}
        <div style={{
          width: 100, flexShrink: 0, aspectRatio: "9/16",
          border: `2.5px solid ${TOKENS.ink}`, borderRadius: 10,
          background: current.color, overflow: "hidden", position: "relative",
          backgroundImage: "repeating-linear-gradient(135deg, rgba(0,0,0,0.07) 0 7px, transparent 7px 14px)",
        }}>
          <div style={{ position: "absolute", top: 6, left: 6, right: 6, display: "flex", gap: 3 }}>
            {stops.map((_, i) => (
              <div key={i} style={{ flex: 1, height: 3, borderRadius: 999, background: "rgba(255,255,255,0.4)", border: "1px solid rgba(0,0,0,0.4)", overflow: "hidden" }}>
                <div style={{ height: "100%", background: TOKENS.ink, width: i < frame ? "100%" : i === frame ? "50%" : "0%", transition: "width 1.2s linear" }} />
              </div>
            ))}
          </div>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
            <span style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".14em", opacity: 0.7, padding: "2px 6px", background: TOKENS.ink, color: TOKENS.paper }}>STOP {frame + 1}</span>
            <span style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 13, textAlign: "center", padding: "0 6px", lineHeight: 1.1, color: TOKENS.ink, textShadow: `1px 1px 0 ${TOKENS.paper}` }}>{current.name}</span>
          </div>
          <div style={{ position: "absolute", bottom: 6, left: 6, right: 6, display: "flex", alignItems: "center", gap: 4, fontFamily: TOKENS.mono, fontSize: 8, fontWeight: 700, color: TOKENS.ink, opacity: 0.7 }}>
            <span style={{ color: TOKENS.accent1 }}>✣</span>
            <span>confetti.app</span>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 700, color: TOKENS.ink, opacity: 0.85, lineHeight: 1.35 }}>
            We strung together your 3 check-ins with chunky type cards + the route map. <strong>9 seconds. Captions and music auto-set.</strong>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
            {["#confetti", "#brooklynnight", "+ 4"].map((t) => (
              <span key={t} style={{ padding: "3px 8px", border: `1.5px solid ${TOKENS.ink}`, borderRadius: 999, background: TOKENS.bg, fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".04em", color: TOKENS.ink }}>{t}</span>
            ))}
          </div>
          <div style={{ marginTop: 10, fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 700, opacity: 0.55 }}>♫ track auto-picked from your vibe</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button onClick={() => setPlaying((p) => !p)} style={{ appearance: "none", cursor: "pointer", padding: "10px 14px", border: `2.5px solid ${TOKENS.ink}`, borderRadius: 12, background: TOKENS.paper, color: TOKENS.ink, fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 800 }}>
          {playing ? "⏸ pause" : "▶ play"}
        </button>
        <button onClick={onPost} style={{
          appearance: "none", cursor: "pointer", flex: 1,
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
          padding: "10px 14px",
          border: `2.5px solid ${TOKENS.ink}`, borderRadius: 12,
          background: TOKENS.ink, color: TOKENS.paper,
          fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 800,
          boxShadow: `3px 3px 0 ${TOKENS.accent1}`,
        }}>
          {SocialIcons.tiktok}
          post to tiktok
        </button>
      </div>
    </div>
  );
}

// ─── Share rail ───────────────────────────────────────────────
function ShareRail({ onShare }: { onShare: (k: string) => void }) {
  const items = [
    { k: "tiktok",   icon: SocialIcons.tiktok,   label: "tiktok", color: TOKENS.ink },
    { k: "insta",    icon: SocialIcons.insta,    label: "ig",     color: TOKENS.accent3 },
    { k: "snap",     icon: SocialIcons.snap,     label: "snap",   color: TOKENS.accent2 },
    { k: "x",        icon: SocialIcons.x,        label: "x",      color: TOKENS.ink },
    { k: "imessage", icon: SocialIcons.imessage, label: "msg",    color: TOKENS.accent1 },
    { k: "link",     icon: SocialIcons.link,     label: "link",   color: TOKENS.paper },
  ];
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "space-between" }}>
      {items.map((it) => (
        <button key={it.k} onClick={() => onShare(it.k)} style={{
          appearance: "none", cursor: "pointer", flex: 1,
          display: "flex", flexDirection: "column", alignItems: "center",
          gap: 4, padding: "10px 4px",
          border: `2.5px solid ${TOKENS.ink}`, borderRadius: 12,
          background: it.color,
          color: (it.color === TOKENS.ink || it.color === TOKENS.accent3) ? TOKENS.paper : TOKENS.ink,
          fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800,
          letterSpacing: ".06em", textTransform: "uppercase",
          boxShadow: `3px 3px 0 ${TOKENS.ink}`,
        }}>
          <span style={{ display: "inline-flex" }}>{it.icon}</span>
          <span>{it.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────
function SocialPage() {
  const navigate = useNavigate();
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [activeStop, setActiveStop] = useState(0);
  const [postedCheckin, setPostedCheckin] = useState<CheckIn | null>(null);

  const stop = SAMPLE_STOPS[activeStop];

  const handlePost = (checkin: CheckIn) => {
    setPostedCheckin(checkin);
    setCheckInOpen(false);
  };

  return (
    <Frame>
      <div className="cf-screen" style={{
        position: "relative", height: "100dvh",
        background: TOKENS.bg, color: TOKENS.ink,
        display: "flex", flexDirection: "column",
        padding: "56px 22px 24px", overflow: "hidden",
      }}>
        <DotsBg opacity={0.06} />

        {/* Header */}
        <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <button onClick={() => navigate({ to: "/new/hub" })} style={{ appearance: "none", cursor: "pointer", width: 36, height: 36, borderRadius: 999, border: `2.5px solid ${TOKENS.ink}`, background: TOKENS.paper, fontSize: 14, fontWeight: 900, boxShadow: `3px 3px 0 ${TOKENS.ink}`, display: "flex", alignItems: "center", justifyContent: "center", color: TOKENS.ink }}>←</button>
          <BrandMark size={16} />
          <button onClick={() => navigate({ to: "/new/crews" })} style={{ appearance: "none", cursor: "pointer", padding: "6px 12px", border: `2px solid ${TOKENS.ink}`, borderRadius: 999, background: TOKENS.paper, fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".12em" }}>CREW</button>
        </div>

        {/* Scrollable content */}
        <div style={{ position: "relative", zIndex: 2, flex: 1, overflowY: "auto", scrollbarWidth: "none", marginRight: -22, paddingRight: 22 }}>
          <h2 style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 32, lineHeight: 0.95, letterSpacing: "-0.04em", margin: "0 0 4px", color: TOKENS.ink }}>Share your night.</h2>
          <p style={{ fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 600, opacity: 0.65, margin: "0 0 16px" }}>Check in at each stop. Auto-reel when you finish.</p>

          {/* Stop selector */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto", scrollbarWidth: "none", marginRight: -22, paddingRight: 22 }}>
            {SAMPLE_STOPS.map((s, i) => (
              <button key={i} onClick={() => setActiveStop(i)} style={{
                appearance: "none", cursor: "pointer", flexShrink: 0,
                padding: "8px 14px",
                border: `2.5px solid ${TOKENS.ink}`, borderRadius: 999,
                background: i === activeStop ? TOKENS.ink : TOKENS.paper,
                color: i === activeStop ? TOKENS.paper : TOKENS.ink,
                fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 800,
                boxShadow: i === activeStop ? `3px 3px 0 ${TOKENS.accent1}` : "none",
              }}>stop {i + 1} · {s.name}</button>
            ))}
          </div>

          {/* Check-in CTA */}
          <button onClick={() => setCheckInOpen(true)} style={{
            appearance: "none", cursor: "pointer", width: "100%", textAlign: "left",
            padding: 16, marginBottom: 16,
            border: `3px solid ${TOKENS.ink}`, borderRadius: 16,
            background: stop.color,
            boxShadow: `5px 5px 0 ${TOKENS.ink}`,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <span style={{ fontSize: 28 }}>{SocialIcons.camera}</span>
            <div>
              <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".14em", opacity: 0.7 }}>CHECK IN AT</div>
              <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 20, letterSpacing: "-0.025em", lineHeight: 1 }}>{stop.name}</div>
            </div>
            <span style={{ marginLeft: "auto", fontSize: 22, fontWeight: 900, color: TOKENS.ink }}>›</span>
          </button>

          {/* Posted confirmation */}
          {postedCheckin && <PostedCard check={postedCheckin} />}

          {/* Live feed */}
          <div style={{ padding: 14, borderRadius: 16, background: TOKENS.ink, marginBottom: 16 }}>
            <LiveFeed />
          </div>

          {/* Reel preview */}
          <div style={{ marginBottom: 16 }}>
            <ReelPreview stops={SAMPLE_STOPS} onPost={() => alert("Posted to TikTok!")} />
          </div>

          {/* Share rail */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800, letterSpacing: ".14em", opacity: 0.55, textTransform: "uppercase", marginBottom: 8 }}>share your pass</div>
            <ShareRail onShare={(k) => console.log("share to", k)} />
          </div>

          <RouteDots progress={1} />
        </div>

        {/* Check-in sheet overlay */}
        <CheckInSheet
          open={checkInOpen}
          stop={stop}
          onClose={() => setCheckInOpen(false)}
          onPost={handlePost}
        />
      </div>
    </Frame>
  );
}
