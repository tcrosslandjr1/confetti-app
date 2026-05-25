// gated.jsx — Member-only gating: feature lock overlay + paywall pill
// Free tier sees the feature blurred with a tap-to-upgrade overlay.

const { useState: useStateGt } = React;

// Features registry — what's gated for non-members
const GATED_FEATURES = {
  'family-mode':   { label: 'Family Mode',         desc: 'kid-friendly plans + age filters' },
  'kids-party':    { label: 'Kids Party planner',  desc: 'venue + theme + RSVP tracker' },
  'memory-kit':    { label: 'Party Memory Kit',    desc: 'auto-captions + recap reel' },
  'unlimited':     { label: 'Unlimited plans',     desc: 'free is capped at 3/week' },
  'stripe-deposit':{ label: 'One-tap booking',     desc: 'stripe + ticketmaster + opentable' },
  'reels-stops':   { label: 'Per-stop clone',      desc: 'grab any stop from any reel' },
  'taste-graph':   { label: 'TikTok taste sync',   desc: 'reads your saves to plan smarter' },
  'crew-vote':     { label: 'Night Together vote', desc: 'live group voting + auto-print' },
  'reveal-intel':  { label: 'Flipcard intel',      desc: 'live crowd · dress · pro tips' },
  'parking':       { label: 'Parking + valet',     desc: 'pre-arrival valet · EV chargers' },
};

// Inline lock pill — small, e.g. on a feature row
function MemberPill({ feature = 'unlimited', onUpgrade }) {
  const f = GATED_FEATURES[feature];
  return (
    <button onClick={onUpgrade} style={{
      appearance: 'none', cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 8px',
      background: 'var(--ink)', color: 'var(--paper)',
      border: '1.5px solid var(--ink)', borderRadius: 999,
      fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
      letterSpacing: '.1em',
    }}>
      <span style={{ color: 'var(--accent-1)' }}>✣</span>
      MEMBER · ${'9.99'}
    </button>
  );
}

// Full overlay — wraps a gated section
function GatedOverlay({ feature, member, onUpgrade, preview = true, children }) {
  if (member) return <>{children}</>;
  const f = GATED_FEATURES[feature] || GATED_FEATURES['unlimited'];
  return (
    <div style={{ position: 'relative' }}>
      {/* Blurred preview */}
      <div style={{
        filter: preview ? 'blur(6px) saturate(0.7)' : 'none',
        opacity: preview ? 0.55 : 0,
        pointerEvents: 'none',
        userSelect: 'none',
      }}>{children}</div>

      {/* Lock card */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}>
        <div style={{
          padding: 14,
          background: 'var(--ink)', color: 'var(--paper)',
          border: '2.5px solid var(--paper)', borderRadius: 14,
          boxShadow: '5px 5px 0 var(--accent-1)',
          maxWidth: 320, width: '100%',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
            letterSpacing: '.14em', opacity: 0.7,
          }}>
            <span style={{ color: 'var(--accent-1)' }}>🔒</span>
            ALL-ACCESS · $9.99/MO
          </div>
          <div style={{
            fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 18,
            letterSpacing: '-0.025em', marginTop: 4, lineHeight: 1.15,
          }}>{f.label} is members-only.</div>
          <div style={{
            fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 700,
            opacity: 0.8, marginTop: 4, lineHeight: 1.35,
          }}>{f.desc}</div>
          <button onClick={onUpgrade} style={{
            appearance: 'none', cursor: 'pointer', width: '100%',
            marginTop: 10, padding: '10px 14px',
            border: '2.5px solid var(--paper)', borderRadius: 10,
            background: 'var(--accent-1)', color: 'var(--ink)',
            fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 900,
          }}>start 7-day free trial →</button>
        </div>
      </div>
    </div>
  );
}

// Banner — at top of any gated screen for free users
function FreeTierBanner({ left = 2, onUpgrade }) {
  return (
    <div style={{
      padding: '10px 14px', marginBottom: 12,
      background: 'var(--accent-2)',
      border: '2px solid var(--ink)', borderRadius: 10,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span style={{
        width: 32, height: 32, borderRadius: 8,
        background: 'var(--ink)', color: 'var(--paper)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 14,
      }}>{left}</span>
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
          letterSpacing: '.14em', opacity: 0.6, textTransform: 'uppercase',
        }}>FREE TIER</div>
        <div style={{
          fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 800,
        }}>{left} plans left this week · resets sunday</div>
      </div>
      <button onClick={onUpgrade} style={{
        appearance: 'none', cursor: 'pointer',
        padding: '6px 12px',
        background: 'var(--accent-1)', color: 'var(--ink)',
        border: '2px solid var(--ink)', borderRadius: 999,
        fontFamily: 'var(--cf-ui)', fontSize: 11, fontWeight: 900,
      }}>go unlimited →</button>
    </div>
  );
}

// Members feature comparison — used on All-Access screen / paywall
function MemberFeatureGrid({ onUpgrade }) {
  return (
    <div style={{
      padding: 14,
      border: '2.5px solid var(--ink)', borderRadius: 14,
      background: 'var(--paper)',
      boxShadow: '4px 4px 0 var(--ink)',
    }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 60px 80px',
        gap: 8, paddingBottom: 8,
        borderBottom: '2px solid var(--ink)',
        fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
        letterSpacing: '.14em', opacity: 0.55, textTransform: 'uppercase',
      }}>
        <span>FEATURE</span><span style={{ textAlign: 'center' }}>FREE</span>
        <span style={{ textAlign: 'center' }}>ALL-ACCESS</span>
      </div>
      {Object.entries(GATED_FEATURES).map(([k, f]) => (
        <div key={k} style={{
          display: 'grid', gridTemplateColumns: '1fr 60px 80px',
          gap: 8, padding: '8px 0',
          borderBottom: '1px dashed rgba(0,0,0,0.15)',
          fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 700,
          alignItems: 'center',
        }}>
          <span>{f.label}</span>
          <span style={{
            textAlign: 'center', fontFamily: 'var(--cf-mono)',
            fontSize: 11, fontWeight: 800, opacity: 0.4,
          }}>—</span>
          <span style={{
            textAlign: 'center', color: 'var(--accent-4, #2bb673)',
            fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 14,
          }}>✓</span>
        </div>
      ))}
      <button onClick={onUpgrade} style={{
        appearance: 'none', cursor: 'pointer', width: '100%',
        marginTop: 12, padding: '12px 16px',
        background: 'var(--accent-1)', color: 'var(--ink)',
        border: '2.5px solid var(--ink)', borderRadius: 12,
        fontFamily: 'var(--cf-ui)', fontSize: 14, fontWeight: 900,
        boxShadow: '3px 3px 0 var(--ink)',
      }}>unlock all-access · $9.99/mo →</button>
    </div>
  );
}

Object.assign(window, {
  GATED_FEATURES, MemberPill, GatedOverlay, FreeTierBanner, MemberFeatureGrid,
});
