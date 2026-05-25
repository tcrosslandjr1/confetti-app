// signals.jsx — Social signal layer
// SignalBadge component + WhatsHotScreen (TikTok-style vertical feed with social proof)

const { useState: useStateSg, useEffect: useEffectSg, useRef: useRefSg } = React;

// ─── Signal type registry ─────────────────────────────────────
const SIGNAL_TYPES = {
  trending: { icon: '🔥', label: 'TRENDING',   c: 'var(--accent-1)', fg: 'var(--ink)'   },
  popular:  { icon: '⭐', label: 'POPULAR',    c: 'var(--accent-2)', fg: 'var(--ink)'   },
  new:      { icon: '🆕', label: 'JUST OPENED', c: 'var(--accent-4)', fg: 'var(--paper)' },
  lowkey:   { icon: '🤫', label: 'LOW KEY',    c: 'var(--accent-3)', fg: 'var(--paper)' },
  unique:   { icon: '✨', label: 'UNIQUE',     c: 'var(--ink)',      fg: 'var(--paper)' },
  faded:    { icon: '📈', label: 'HAD A MOMENT', c: 'var(--paper)',  fg: 'var(--ink)'   },
};

function SignalBadge({ type, sub, compact }) {
  const t = SIGNAL_TYPES[type] || SIGNAL_TYPES.trending;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: compact ? '2px 7px' : '4px 10px',
      background: t.c, color: t.fg,
      border: `${compact ? '1.5px' : '2px'} solid var(--ink)`,
      borderRadius: compact ? 4 : 6,
      fontFamily: 'var(--cf-mono)',
      fontSize: compact ? 9 : 10, fontWeight: 800,
      letterSpacing: '.1em', textTransform: 'uppercase',
    }}>
      <span style={{ fontSize: compact ? 10 : 12 }}>{t.icon}</span>
      {t.label}
      {sub && <span style={{ opacity: 0.7, marginLeft: 2 }}>· {sub}</span>}
    </span>
  );
}

// ─── Hot venue data (mocks Bright Data TikTok feed → classified) ────
const HOT_VENUES = [
  { id: 'h1', name: 'Westlight rooftop', tag: 'rooftop bar',
    nbhd: 'Williamsburg · 0.8 mi',
    signal: 'trending', sub: '240 posts this wk',
    why: 'Trending on TikTok — sunset cocktail clips are blowing up. Matches your "rooftop" taste.',
    color: 'var(--accent-1)',
    top_post: '@maya.brooklyn · 142k views · "sunset hit different"' },
  { id: 'h2', name: 'Eavesdrop', tag: 'jazz · phones off',
    nbhd: 'Bed-Stuy · 1.2 mi',
    signal: 'lowkey', sub: '38 posts · all 5★',
    why: 'Quiet TikTok footprint but every post is a love letter. Your speakeasy taste maps here.',
    color: 'var(--accent-3)',
    top_post: '@dim_lit_only · 8.2k views · "the most underrated room"' },
  { id: 'h3', name: 'Mole Mama', tag: 'oaxacan · just opened',
    nbhd: 'Crown Hgts · 1.4 mi',
    signal: 'new', sub: 'opened 8 days ago',
    why: 'Brand new — first dozen Yelp reviews are 5★. Chef is ex-Cosme.',
    color: 'var(--accent-4)',
    top_post: '@bk.eats · 24k views · "soft launch but already perfect"' },
  { id: 'h4', name: 'Joe\'s Steam Rice Roll', tag: 'cantonese · ny times',
    nbhd: 'LES · 3.2 mi',
    signal: 'popular', sub: '6.2k posts · 60 days',
    why: '#1 for Cantonese small bites in NYC TikTok. Crowded but worth it.',
    color: 'var(--accent-2)',
    top_post: '@food.kid · 280k views · "this is the rice roll"' },
  { id: 'h5', name: 'Le Crocodile · backyard', tag: 'french · backyard only',
    nbhd: 'Williamsburg · 0.6 mi',
    signal: 'unique', sub: 'only-in-spring',
    why: 'Backyard-only menu, 6 weeks a year, vinyl jazz only. There is nothing like it.',
    color: 'var(--ink)',
    top_post: '@nyc.brunch · 56k views · "you won\'t believe this exists"' },
];

// ═════════════════════════════════════════════════════════════════
// WhatsHotScreen — TikTok-style vertical scroll w/ social proof
// ═════════════════════════════════════════════════════════════════
function WhatsHotScreen({ onBack, onAddToPlan }) {
  const [idx, setIdx] = useStateSg(0);
  const onScroll = (e) => {
    const top = e.target.scrollTop;
    const h = e.target.clientHeight;
    setIdx(Math.round(top / h));
  };
  return (
    <div className="cf-screen" style={{
      position: 'relative', height: '100%',
      background: 'var(--ink)', color: 'var(--paper)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        position: 'absolute', top: 56, left: 16, right: 16, zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button onClick={onBack} style={{
          appearance: 'none', cursor: 'pointer',
          width: 38, height: 38, borderRadius: 999,
          border: '2px solid var(--paper)',
          background: 'rgba(0,0,0,0.4)', color: 'var(--paper)',
          fontSize: 16, fontWeight: 900,
          backdropFilter: 'blur(20px)',
        }}>←</button>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '7px 13px',
          border: '2px solid var(--paper)', borderRadius: 999,
          background: 'rgba(0,0,0,0.45)',
          fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 14,
          backdropFilter: 'blur(20px)',
        }}>
          🔥 What's Hot
        </div>
        <span style={{
          padding: '6px 10px',
          border: '2px solid var(--paper)', borderRadius: 999,
          background: 'rgba(0,0,0,0.45)',
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
          letterSpacing: '.12em',
          backdropFilter: 'blur(20px)',
        }}>NYC</span>
      </div>

      {/* Dots rail */}
      <div style={{
        position: 'absolute', right: 10, top: '50%',
        transform: 'translateY(-50%)', zIndex: 20,
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        {HOT_VENUES.map((_, i) => (
          <div key={i} style={{
            width: 3, height: i === idx ? 22 : 6, borderRadius: 999,
            background: i === idx ? 'var(--accent-1)' : 'rgba(255,255,255,0.4)',
            transition: 'all .25s',
          }} />
        ))}
      </div>

      <div onScroll={onScroll} style={{
        height: '100%', overflowY: 'auto',
        scrollSnapType: 'y mandatory', scrollbarWidth: 'none',
      }}>
        {HOT_VENUES.map((v, i) => (
          <HotCard key={v.id} v={v} onAdd={() => onAddToPlan(v)} />
        ))}
      </div>
    </div>
  );
}

function HotCard({ v, onAdd }) {
  const sig = SIGNAL_TYPES[v.signal];
  return (
    <div style={{
      scrollSnapAlign: 'start', scrollSnapStop: 'always',
      height: '100%', position: 'relative',
      background: v.color,
      backgroundImage: `repeating-linear-gradient(135deg, rgba(0,0,0,0.08) 0 14px, transparent 14px 28px)`,
    }}>
      {/* "Video frame" placeholder */}
      <svg width="100%" height="100%" viewBox="0 0 100 175"
           preserveAspectRatio="xMidYMid slice"
           style={{ position: 'absolute', inset: 0, opacity: 0.4 }}>
        <rect width="100" height="175" fill="rgba(0,0,0,0.18)"/>
        <path d="M0 140 L25 115 L50 130 L75 105 L100 120 L100 175 L0 175Z" fill="rgba(0,0,0,0.4)"/>
      </svg>

      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%',
        background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.88))',
      }} />

      {/* Big signal badge */}
      <div style={{
        position: 'absolute', top: 130, left: 16, zIndex: 5,
      }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 12px',
          background: sig.c, color: sig.fg,
          border: '2.5px solid var(--ink)', borderRadius: 999,
          fontFamily: 'var(--cf-mono)', fontSize: 11, fontWeight: 800,
          letterSpacing: '.14em',
          boxShadow: '3px 3px 0 var(--ink)',
        }}>
          <span style={{ fontSize: 14 }}>{sig.icon}</span>
          {sig.label}
          <span style={{ opacity: 0.7 }}>· {v.sub}</span>
        </span>
      </div>

      {/* Bottom content */}
      <div style={{
        position: 'absolute', bottom: 24, left: 16, right: 80, zIndex: 5,
        color: 'var(--paper)',
      }}>
        <div style={{
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
          letterSpacing: '.14em', textTransform: 'uppercase', opacity: 0.85,
        }}>{v.tag} · {v.nbhd}</div>
        <h2 style={{
          fontFamily: 'var(--cf-display)', fontWeight: 900,
          fontSize: 40, lineHeight: 0.95, letterSpacing: '-0.04em',
          margin: '4px 0 10px',
        }}>{v.name}</h2>

        {/* AI explainer with citation */}
        <div style={{
          padding: '8px 10px', marginBottom: 10,
          background: 'rgba(255,250,240,0.12)',
          border: '1.5px solid rgba(255,250,240,0.35)', borderRadius: 8,
          fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 700,
          backdropFilter: 'blur(10px)', lineHeight: 1.35,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4,
            fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
            letterSpacing: '.14em', opacity: 0.7,
          }}>
            <span style={{ color: 'var(--accent-1)' }}>✣</span>
            WHY CONFETTI SURFACED THIS
          </div>
          <div>{v.why}</div>
        </div>

        {/* Top TikTok post citation */}
        <div style={{
          padding: '7px 10px',
          background: 'rgba(0,0,0,0.5)',
          border: '1.5px solid var(--paper)', borderRadius: 6,
          fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 700,
          letterSpacing: '.04em', lineHeight: 1.3,
          backdropFilter: 'blur(10px)',
        }}>
          📺 TOP CLIP: {v.top_post}
        </div>
      </div>

      {/* Side rail */}
      <div style={{
        position: 'absolute', bottom: 100, right: 12, zIndex: 5,
        display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center',
      }}>
        <RailBtn icon="✣" label="add" color="var(--accent-1)" onClick={onAdd} />
        <RailBtn icon="♡" label="save" />
        <RailBtn icon="↗" label="share" />
        <RailBtn icon="⋯" label="" />
      </div>
    </div>
  );
}

function RailBtn({ icon, label, color, onClick }) {
  return (
    <button onClick={onClick} style={{
      appearance: 'none', cursor: 'pointer',
      background: 'transparent', border: 'none', padding: 0,
      color: 'var(--paper)', textAlign: 'center',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 999,
        border: '2px solid var(--paper)',
        background: color || 'rgba(0,0,0,0.4)',
        color: color ? 'var(--ink)' : 'var(--paper)',
        backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, fontWeight: 900,
      }}>{icon}</div>
      {label && <div style={{
        fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
        marginTop: 3,
      }}>{label}</div>}
    </button>
  );
}

Object.assign(window, {
  SIGNAL_TYPES, SignalBadge, HOT_VENUES, WhatsHotScreen,
});
