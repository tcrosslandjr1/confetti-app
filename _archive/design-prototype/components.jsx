// components.jsx — shared chunky brutalist UI primitives for Confetti
// Reads colors from CSS custom props on `.cf-root`. Palettes are defined
// in index.html (warm / cool / mono) and swapped via the Tweaks panel.

// ─── Brand mark ────────────────────────────────────────────────────────
function BrandMark({ size = 22, spin = false }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      fontFamily: 'var(--cf-display)', fontWeight: 900,
      fontSize: size, letterSpacing: '-0.03em', color: 'var(--ink)',
    }}>
      <span style={{
        color: 'var(--accent-1)', fontSize: size * 1.05,
        display: 'inline-block',
        animation: spin ? 'cf-spin 3s linear infinite' : undefined,
        transformOrigin: 'center',
      }}>✣</span>
      <span>confetti<span style={{ color: 'var(--accent-1)' }}>.</span></span>
    </span>
  );
}

// ─── Background dot pattern ────────────────────────────────────────────
function DotsBg({ opacity = 0.08, size = 22 }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      backgroundImage: 'radial-gradient(var(--ink) 1px, transparent 1px)',
      backgroundSize: `${size}px ${size}px`, opacity,
    }} />
  );
}

// ─── Floating confetti tickets (5 dots) ────────────────────────────────
function FloatingTickets({ density = 5 }) {
  const positions = [
    { top: '12%', left: '8%',   color: 'var(--accent-1)', delay: 0 },
    { top: '20%', right: '10%', color: 'var(--accent-2)', delay: 0.4 },
    { bottom: '24%', left: '12%', color: 'var(--accent-3)', delay: 0.8 },
    { bottom: '14%', right: '14%', color: 'var(--accent-1)', delay: 1.2 },
    { top: '50%', left: '4%',   color: 'var(--accent-2)', delay: 1.6 },
    { top: '62%', right: '6%',  color: 'var(--accent-3)', delay: 2.0 },
  ].slice(0, density);
  return (
    <>
      {positions.map((p, i) => (
        <span key={i} style={{
          position: 'absolute', ...p,
          width: 12, height: 22, border: '2px solid var(--ink)',
          borderRadius: 3, background: p.color,
          animation: `cf-float 4s ${p.delay}s infinite ease-in-out`,
          pointerEvents: 'none',
        }} />
      ))}
    </>
  );
}

// ─── Chunky chip (used for vibe / time / budget selectors) ─────────────
function Chip({ children, selected, onClick, color, icon, dense = false }) {
  return (
    <button onClick={onClick} className="cf-chip" style={{
      appearance: 'none', cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: dense ? '7px 12px' : '10px 14px',
      border: '2.5px solid var(--ink)',
      borderRadius: 999,
      background: selected ? (color || 'var(--accent-1)') : 'var(--paper)',
      color: 'var(--ink)',
      fontFamily: 'var(--cf-ui)', fontSize: dense ? 12 : 14,
      fontWeight: 800, letterSpacing: '-0.01em',
      boxShadow: selected ? '3px 3px 0 var(--ink)' : '0 0 0 var(--ink)',
      transform: selected ? 'translate(-1px, -1px)' : 'none',
      transition: 'transform .12s, box-shadow .12s, background .12s',
    }}>
      {icon && <span style={{ fontSize: dense ? 13 : 15 }}>{icon}</span>}
      {children}
    </button>
  );
}

// ─── Chunky CTA button (big block with offset shadow) ──────────────────
function ChunkyButton({ children, onClick, disabled, variant = 'primary', icon, full = true }) {
  const bg = variant === 'primary' ? 'var(--ink)' :
             variant === 'accent'  ? 'var(--accent-1)' :
             'var(--paper)';
  const fg = variant === 'primary' ? 'var(--paper)' :
             variant === 'accent'  ? 'var(--ink)' :
             'var(--ink)';
  return (
    <button onClick={onClick} disabled={disabled} className="cf-btn" style={{
      appearance: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      gap: 10, width: full ? '100%' : undefined,
      padding: '18px 22px',
      border: '3px solid var(--ink)', borderRadius: 16,
      background: bg, color: fg,
      fontFamily: 'var(--cf-ui)', fontSize: 17, fontWeight: 900,
      letterSpacing: '-0.01em',
      boxShadow: '5px 5px 0 var(--ink)',
      opacity: disabled ? 0.45 : 1,
      transition: 'transform .12s, box-shadow .12s',
    }}>
      {children}
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
    </button>
  );
}

// ─── Stamp pill (used in loader & pass) ────────────────────────────────
function Stamp({ children, color, rotate = -3, style = {} }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '7px 12px',
      border: '2.5px solid var(--ink)', borderRadius: 999,
      background: color || 'var(--paper)',
      color: 'var(--ink)',
      fontFamily: 'var(--cf-ui)', fontSize: 11, fontWeight: 900,
      letterSpacing: '.12em', textTransform: 'uppercase',
      transform: `rotate(${rotate}deg)`,
      ...style,
    }}>{children}</span>
  );
}

// ─── Ticket (perforated card with sidescuts) ───────────────────────────
function Ticket({ children, color = 'var(--paper)', notch = true, animate, style = {} }) {
  return (
    <div className="cf-ticket" style={{
      position: 'relative',
      border: '3px solid var(--ink)', borderRadius: 22,
      background: color, color: 'var(--ink)',
      boxShadow: '7px 7px 0 var(--ink)',
      ...style,
    }}>
      {notch && (
        <>
          <span style={{
            position: 'absolute', left: -9, top: '50%',
            width: 18, height: 18, borderRadius: '50%',
            background: 'var(--bg)', border: '3px solid var(--ink)',
            transform: 'translateY(-50%)',
            clipPath: 'inset(0 0 0 50%)',
          }} />
          <span style={{
            position: 'absolute', right: -9, top: '50%',
            width: 18, height: 18, borderRadius: '50%',
            background: 'var(--bg)', border: '3px solid var(--ink)',
            transform: 'translateY(-50%)',
            clipPath: 'inset(0 50% 0 0)',
          }} />
        </>
      )}
      {children}
    </div>
  );
}

// ─── Tick row inside ticket (dashed separator) ─────────────────────────
function Perf({ vertical = false }) {
  return (
    <div style={{
      borderTop: vertical ? 'none' : '2.5px dashed var(--ink)',
      borderLeft: vertical ? '2.5px dashed var(--ink)' : 'none',
      opacity: 0.5,
      margin: vertical ? '0' : '14px 0',
      width: vertical ? 0 : 'auto',
    }} />
  );
}

// ─── Route dots (3 colored stops connected by a line) ──────────────────
function RouteDots({ progress = 1, animate = false, size = 18 }) {
  return (
    <div style={{
      position: 'relative', display: 'flex',
      justifyContent: 'space-between', alignItems: 'center',
      margin: '18px 4px',
    }}>
      <span style={{
        position: 'absolute', top: '50%', left: size / 2, right: size / 2,
        height: 3, background: 'var(--ink)',
        transform: `translateY(-50%) scaleX(${progress})`, transformOrigin: 'left',
        animation: animate ? 'cf-route 2.8s infinite ease-in-out' : undefined,
      }} />
      {['var(--accent-2)', 'var(--accent-1)', 'var(--accent-3)'].map((c, i) => (
        <span key={i} style={{
          position: 'relative', zIndex: 1, width: size, height: size,
          border: '3px solid var(--ink)', borderRadius: 999, background: c,
        }} />
      ))}
    </div>
  );
}

// ─── Icon set (drawn with SVG, monoweight) ─────────────────────────────
const Icons = {
  arrow: <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
    <path d="M1 7h15m0 0L10 1m6 6l-6 6" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"/>
  </svg>,
  pin: <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
    <path d="M7 1c3.3 0 6 2.7 6 6 0 4.5-6 8-6 8s-6-3.5-6-8c0-3.3 2.7-6 6-6z"
          fill="currentColor" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="7" cy="7" r="2" fill="var(--paper)"/>
  </svg>,
  clock: <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="2"/>
    <path d="M7 3.5V7l2.5 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>,
  money: <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M9.5 4.5C9.5 3 8 2 6.5 2S3.5 2.5 3.5 4c0 3 6 1 6 4s-2 2-3 2-3-.5-3-2"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M6.5 1v2m0 8v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>,
  people: <svg width="16" height="14" viewBox="0 0 16 14" fill="none">
    <circle cx="5" cy="4" r="2.5" stroke="currentColor" strokeWidth="2"/>
    <circle cx="11" cy="4" r="2.5" stroke="currentColor" strokeWidth="2"/>
    <path d="M1 13c0-2.2 1.8-4 4-4s4 1.8 4 4M7 13c0-2.2 1.8-4 4-4s4 1.8 4 4"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>,
  spark: <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 1l1.5 4.5L13 7l-4.5 1.5L7 13l-1.5-4.5L1 7l4.5-1.5L7 1z"
          fill="currentColor"/>
  </svg>,
  check: <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2 7l3.5 3.5L12 4" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"/>
  </svg>,
  refresh: <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M12 7a5 5 0 1 1-1.5-3.5M12 1.5V4H9.5" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>,
  close: <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>,
};

Object.assign(window, {
  BrandMark, DotsBg, FloatingTickets, Chip, ChunkyButton,
  Stamp, Ticket, Perf, RouteDots, Icons,
});
