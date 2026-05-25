// loyalty.jsx — Points, tiers, redemption UI
// The three-sided loop made visible:
// customer earns → redeems at venue → venue boosts → AI surfaces → customer earns

const { useState: useStateLy } = React;

// ─── Tier definitions ───────────────────────────────────────────
const TIERS = [
  { id: 'silver',   label: 'Silver',   min: 0,    c: '#c8c5b9' },
  { id: 'gold',     label: 'Gold',     min: 1000, c: '#f7c83b' },
  { id: 'platinum', label: 'Platinum', min: 5000, c: '#5b45d9' },
];

function tierFor(pts) {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (pts >= TIERS[i].min) return { ...TIERS[i], next: TIERS[i + 1] };
  }
  return TIERS[0];
}

// ─── Sample user state — would come from confetti_ledger ────────
const DEMO_USER = {
  points: 3420,
  recentEarnings: [
    { what: 'Check-in · Westlight',          pts: 25,  when: '2h ago',  type: 'checkin' },
    { what: 'Booking confirmed · Lupa',      pts: 100, when: 'yest',    type: 'book' },
    { what: 'Reel shared · "carbonara"',     pts: 10,  when: 'yest',    type: 'reel' },
    { what: '@maya joined via your invite',  pts: 50,  when: '3d',      type: 'invite' },
    { what: 'Plan saved · "Bushwick crawl"', pts: 5,   when: '5d',      type: 'save' },
  ],
};

// ═════════════════════════════════════════════════════════════════
// 1. PointsPill — top-of-screen balance pill
// ═════════════════════════════════════════════════════════════════
function PointsPill({ points = DEMO_USER.points, onClick }) {
  const t = tierFor(points);
  return (
    <button onClick={onClick} style={{
      appearance: 'none', cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 11px 5px 5px',
      border: '2.5px solid var(--ink)', borderRadius: 999,
      background: 'var(--paper)', color: 'var(--ink)',
      boxShadow: '3px 3px 0 var(--ink)',
    }}>
      <span style={{
        width: 22, height: 22, borderRadius: 999,
        background: t.c, border: '2px solid var(--ink)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 11,
        color: 'var(--ink)',
      }}>{t.label[0]}</span>
      <span style={{
        fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 13,
        letterSpacing: '-0.01em',
      }}>{points.toLocaleString()}</span>
      <span style={{
        fontFamily: 'var(--cf-mono)', fontSize: 8, fontWeight: 800,
        letterSpacing: '.12em', opacity: 0.6,
      }}>PTS</span>
    </button>
  );
}

// ═════════════════════════════════════════════════════════════════
// 2. TierProgress — full tier progress card
// ═════════════════════════════════════════════════════════════════
function TierProgress({ points = DEMO_USER.points }) {
  const t = tierFor(points);
  const toNext = t.next ? t.next.min - points : 0;
  const fillPct = t.next ? (points - t.min) / (t.next.min - t.min) : 1;

  return (
    <div style={{
      padding: 14,
      border: '2.5px solid var(--ink)', borderRadius: 14,
      background: t.c,
      boxShadow: '4px 4px 0 var(--ink)',
      color: t.id === 'platinum' ? 'var(--paper)' : 'var(--ink)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 6,
      }}>
        <span style={{
          fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
          letterSpacing: '.14em', opacity: 0.7, textTransform: 'uppercase',
        }}>YOUR TIER</span>
        <span style={{
          fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
          letterSpacing: '.12em', opacity: 0.7,
        }}>{points.toLocaleString()} PTS · ${(points / 100).toFixed(0)} VALUE</span>
      </div>
      <div style={{
        fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 30,
        letterSpacing: '-0.035em', lineHeight: 1,
      }}>{t.label}</div>
      {t.next && (
        <>
          <div style={{
            marginTop: 12, height: 10,
            border: '2px solid var(--ink)', borderRadius: 999,
            background: 'rgba(255,250,240,0.4)', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', width: `${Math.min(100, fillPct * 100)}%`,
              background: 'var(--ink)', transition: 'width .4s',
            }} />
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', marginTop: 6,
            fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
            letterSpacing: '.06em',
          }}>
            <span>NOW</span>
            <span>{toNext.toLocaleString()} PTS TO {t.next.label.toUpperCase()}</span>
          </div>
        </>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// 3. EarnGuide — how to earn (used in profile or modal)
// ═════════════════════════════════════════════════════════════════
function EarnGuide() {
  const ways = [
    { what: 'Check in at a venue',    pts: 25,  icon: '📍' },
    { what: 'Booking confirmed',      pts: 100, icon: '📅' },
    { what: 'Share a reel',           pts: 10,  icon: '🎬' },
    { what: 'Invite a friend',        pts: 50,  icon: '✨', extra: '+ $25 gift card when they book' },
    { what: 'Save a plan',            pts: 5,   icon: '☆' },
    { what: 'Boost-window 2× day',    pts: '2×', icon: '🔥', extra: 'all earnings doubled' },
  ];
  return (
    <div style={{
      padding: 14,
      border: '2.5px solid var(--ink)', borderRadius: 14,
      background: 'var(--paper)',
      boxShadow: '4px 4px 0 var(--ink)',
    }}>
      <div style={{
        fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
        letterSpacing: '.14em', opacity: 0.55, textTransform: 'uppercase',
        marginBottom: 10,
      }}>HOW TO EARN POINTS</div>
      {ways.map((w, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '7px 0',
          borderBottom: i < ways.length - 1 ? '1px dashed rgba(0,0,0,0.15)' : 'none',
        }}>
          <span style={{ fontSize: 16, width: 22 }}>{w.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 800,
            }}>{w.what}</div>
            {w.extra && <div style={{
              fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 700,
              opacity: 0.55, marginTop: 1, letterSpacing: '.06em',
            }}>{w.extra}</div>}
          </div>
          <span style={{
            padding: '3px 9px',
            background: 'var(--accent-1)', color: 'var(--ink)',
            border: '1.5px solid var(--ink)', borderRadius: 999,
            fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 12,
          }}>+{w.pts}</span>
        </div>
      ))}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// 4. PointsLedger — full activity feed
// ═════════════════════════════════════════════════════════════════
function PointsLedger({ items = DEMO_USER.recentEarnings }) {
  const iconFor = (type) => ({
    checkin: '📍', book: '📅', reel: '🎬',
    invite: '✨', save: '☆', redeem: '💸',
  }[type] || '·');
  return (
    <div style={{
      padding: 14,
      border: '2.5px solid var(--ink)', borderRadius: 14,
      background: 'var(--paper)',
    }}>
      <div style={{
        fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
        letterSpacing: '.14em', opacity: 0.55, textTransform: 'uppercase',
        marginBottom: 10,
      }}>LEDGER · CONFETTI_LEDGER</div>
      {items.map((it, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 0',
          borderBottom: i < items.length - 1 ? '1px dashed rgba(0,0,0,0.15)' : 'none',
        }}>
          <span style={{ fontSize: 16, width: 22 }}>{iconFor(it.type)}</span>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 800,
            }}>{it.what}</div>
            <div style={{
              fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 700,
              opacity: 0.55, marginTop: 1, letterSpacing: '.06em',
              textTransform: 'uppercase',
            }}>{it.when}</div>
          </div>
          <span style={{
            fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 14,
            color: it.pts < 0 ? '#d32323' : 'var(--accent-4, #2bb673)',
          }}>{it.pts > 0 ? '+' : ''}{it.pts}</span>
        </div>
      ))}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// 5. RedemptionCard — shown on Venue Detail (verified venues only)
// ═════════════════════════════════════════════════════════════════
function RedemptionCard({ verified = true, rate = 100, points = DEMO_USER.points,
                          venueName = 'Lupa Notte' }) {
  if (!verified) {
    return (
      <div style={{
        padding: 14, marginBottom: 14,
        border: '2px dashed var(--ink)', borderRadius: 12,
        background: 'var(--paper)',
        opacity: 0.7,
      }}>
        <div style={{
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
          letterSpacing: '.14em', opacity: 0.6, textTransform: 'uppercase',
        }}>UNVERIFIED VENUE</div>
        <div style={{
          fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 700,
          marginTop: 4, lineHeight: 1.4,
        }}>This spot hasn't claimed their listing yet — points can't be redeemed here.
          They'll appear in plans, but check-in rewards are paused.</div>
      </div>
    );
  }

  const dollarsOff = Math.floor(points / rate);
  return (
    <div style={{
      padding: 14, marginBottom: 14,
      border: '2.5px solid var(--ink)', borderRadius: 14,
      background: 'var(--accent-1)', color: 'var(--ink)',
      boxShadow: '4px 4px 0 var(--ink)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
        letterSpacing: '.14em', opacity: 0.7, textTransform: 'uppercase',
        marginBottom: 4,
      }}>
        <span>✓ VERIFIED</span>
        <span>·</span>
        <span>POINTS REDEEMABLE</span>
      </div>
      <div style={{
        fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 22,
        letterSpacing: '-0.025em', lineHeight: 1.05,
      }}>You can redeem ${dollarsOff} off here.</div>
      <div style={{
        fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 700,
        opacity: 0.75, marginTop: 4,
      }}>{points.toLocaleString()} pts on hand · {rate} pts = $1 at {venueName}. Staff scans your pass at check-in.</div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// 6. BoostBadge — 2× points window callout
// ═════════════════════════════════════════════════════════════════
function BoostBadge({ until = '11:30 PM tonight' }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px',
      background: 'var(--ink)', color: 'var(--paper)',
      border: '2px solid var(--paper)', borderRadius: 999,
      fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
      letterSpacing: '.12em', textTransform: 'uppercase',
    }}>
      <span style={{ color: 'var(--accent-1)' }}>🔥</span>
      2× POINTS · UNTIL {until.toUpperCase()}
    </span>
  );
}

// ═════════════════════════════════════════════════════════════════
// 7. CheckinReward — "+125 pts" overlay after check-in
// ═════════════════════════════════════════════════════════════════
function CheckinReward({ open, points = 125, billOff = 4, onClose }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 80,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, background: 'rgba(0,0,0,0.65)',
      animation: 'cf-fadein 0.25s',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 320,
        background: 'var(--paper)', color: 'var(--ink)',
        border: '3px solid var(--ink)', borderRadius: 22,
        boxShadow: '8px 8px 0 var(--accent-1)',
        padding: 22, textAlign: 'center',
        animation: 'cf-pop 0.4s cubic-bezier(.2,1.4,.4,1)',
      }}>
        <div style={{
          fontSize: 56, lineHeight: 1, marginBottom: 10,
        }}>🎉</div>
        <div style={{
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
          letterSpacing: '.14em', opacity: 0.6, textTransform: 'uppercase',
        }}>POINTS EARNED</div>
        <div style={{
          fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 56,
          letterSpacing: '-0.045em', lineHeight: 1, margin: '4px 0',
          color: 'var(--accent-1)',
        }}>+{points}</div>
        <div style={{
          fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 700,
          opacity: 0.7,
        }}>Check-in + booking + 2× boost window.</div>

        <div style={{
          marginTop: 14, padding: 10,
          background: 'var(--accent-2)',
          border: '2px solid var(--ink)', borderRadius: 10,
        }}>
          <div style={{
            fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
            letterSpacing: '.14em', opacity: 0.65,
            textTransform: 'uppercase', marginBottom: 2,
          }}>REDEEMED AT THIS STOP</div>
          <div style={{
            fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 18,
            letterSpacing: '-0.025em',
          }}>${billOff} off applied to bill</div>
        </div>

        <button onClick={onClose} style={{
          appearance: 'none', cursor: 'pointer', width: '100%',
          marginTop: 16, padding: '12px 16px',
          border: '2.5px solid var(--ink)', borderRadius: 12,
          background: 'var(--ink)', color: 'var(--paper)',
          fontFamily: 'var(--cf-ui)', fontSize: 14, fontWeight: 900,
        }}>nice — keep going →</button>
      </div>
    </div>
  );
}

Object.assign(window, {
  TIERS, tierFor, DEMO_USER,
  PointsPill, TierProgress, EarnGuide, PointsLedger,
  RedemptionCard, BoostBadge, CheckinReward,
});
