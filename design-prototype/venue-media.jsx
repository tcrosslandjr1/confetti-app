// venue-media.jsx — Social media + reviews layer for Venue Detail
// Pulls "live" content from TikTok/IG (mocked) + Yelp/Google reviews

const { useState: useStateVm, useEffect: useEffectVm, useRef: useRefVm } = React;

// ─── Sample social clips ──────────────────────────────────────
const VENUE_CLIPS = [
  { src: 'tiktok', who: '@maya.brooklyn', followers: '240k',
    caption: 'sunset hit different tonight 🌅',
    views: '142k', likes: '8.2k', time: '2d ago',
    poster: 'var(--accent-1)' },
  { src: 'tiktok', who: '@bk.eats', followers: '86k',
    caption: 'tasting menu is unreal · sit at the counter',
    views: '64k', likes: '3.1k', time: '5d ago',
    poster: 'var(--accent-2)' },
  { src: 'instagram', who: '@dim_lit_only', followers: '14k',
    caption: 'the most underrated room in BK',
    views: '22k', likes: '1.8k', time: '1w ago',
    poster: 'var(--accent-3)' },
  { src: 'tiktok', who: '@devon.eats', followers: '3.1k',
    caption: 'my Confetti pass took me here · best night',
    views: '18k', likes: '910', time: '4d ago',
    poster: 'var(--accent-1)' },
];

// ─── Sample reviews ────────────────────────────────────────────
const VENUE_REVIEWS = [
  { who: '@maya.brooklyn', avatar: 'M', c: 'var(--accent-1)', stars: 5,
    time: '2d', source: 'confetti',
    text: 'Came on a pass — sat instantly, the carbonara was life-changing. Server brought us limoncello on the house when she heard it was an anniversary.',
    helpful: 42 },
  { who: 'Jess L.', avatar: 'J', c: 'var(--accent-2)', stars: 5,
    time: '1w', source: 'yelp',
    text: 'No reservations. Walked in at 7. Got the last 2 counter seats. Best pasta I\'ve had in Brooklyn — yes including Lilia.',
    helpful: 38 },
  { who: 'Marcus K.', avatar: 'M', c: 'var(--accent-3)', stars: 4,
    time: '3w', source: 'google',
    text: 'Carbonara → 10. Wine list → solid but pricey. Vibe → loud after 9, quiet before. Bring a date who can hear you.',
    helpful: 21 },
];

// ═════════════════════════════════════════════════════════════════
// 1. SocialMediaReel — auto-scrolling clip strip
// ═════════════════════════════════════════════════════════════════
function SocialMediaReel({ clips = VENUE_CLIPS, onOpenClip }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
          letterSpacing: '.14em', opacity: 0.55, textTransform: 'uppercase',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: 999, background: 'var(--accent-1)',
            animation: 'cf-pulse 1.2s infinite',
          }} />
          LIVE FROM TIKTOK · {clips.length} CLIPS THIS WEEK
        </div>
        <span style={{
          fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 700,
          opacity: 0.55, letterSpacing: '.06em',
        }}>SEE ALL ›</span>
      </div>

      <div style={{
        display: 'flex', gap: 10, overflowX: 'auto',
        scrollbarWidth: 'none',
        marginRight: -22, paddingRight: 22, paddingBottom: 4,
      }}>
        {clips.map((c, i) => (
          <button key={i} onClick={() => onOpenClip?.(c)} style={{
            appearance: 'none', cursor: 'pointer',
            flexShrink: 0, width: 130,
            border: '2.5px solid var(--ink)', borderRadius: 12,
            background: c.poster, position: 'relative',
            aspectRatio: '9/16',
            overflow: 'hidden',
            boxShadow: '3px 3px 0 var(--ink)',
            backgroundImage: `repeating-linear-gradient(135deg, rgba(0,0,0,0.08) 0 10px, transparent 10px 20px)`,
            padding: 0,
          }}>
            {/* "moving" content placeholder */}
            <svg width="100%" height="100%" viewBox="0 0 100 175"
                 preserveAspectRatio="xMidYMid slice"
                 style={{ position: 'absolute', inset: 0, opacity: 0.35 }}>
              <circle cx="50" cy="55" r="18" fill="rgba(0,0,0,0.35)"/>
              <path d="M20 175 C 20 130, 35 110, 50 110 S 80 130, 80 175 Z" fill="rgba(0,0,0,0.35)"/>
            </svg>
            {/* dark gradient overlay */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%',
              background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.85))',
            }} />
            {/* source pill */}
            <span style={{
              position: 'absolute', top: 6, left: 6,
              padding: '2px 6px',
              background: c.src === 'tiktok' ? 'var(--ink)' : 'var(--accent-3)',
              color: 'var(--paper)',
              border: '1.5px solid var(--paper)', borderRadius: 4,
              fontFamily: 'var(--cf-mono)', fontSize: 8, fontWeight: 800,
              letterSpacing: '.1em',
            }}>{c.src === 'tiktok' ? '♪ TT' : 'IG'}</span>
            {/* views */}
            <span style={{
              position: 'absolute', top: 6, right: 6,
              padding: '2px 6px',
              background: 'rgba(0,0,0,0.6)',
              color: 'var(--paper)',
              border: '1px solid var(--paper)', borderRadius: 4,
              fontFamily: 'var(--cf-mono)', fontSize: 8, fontWeight: 800,
              letterSpacing: '.06em',
            }}>▶ {c.views}</span>
            {/* play icon */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 32, height: 32, borderRadius: 999,
              background: 'rgba(0,0,0,0.5)',
              border: '2px solid var(--paper)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--paper)', fontSize: 14, fontWeight: 900,
              backdropFilter: 'blur(8px)',
            }}>▶</div>
            {/* author + caption */}
            <div style={{
              position: 'absolute', bottom: 8, left: 8, right: 8,
              color: 'var(--paper)', textAlign: 'left',
            }}>
              <div style={{
                fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
                letterSpacing: '.06em', opacity: 0.85,
              }}>{c.who}</div>
              <div style={{
                fontFamily: 'var(--cf-ui)', fontSize: 10, fontWeight: 700,
                marginTop: 2, lineHeight: 1.2,
                overflow: 'hidden', display: '-webkit-box',
                WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              }}>{c.caption}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// 2. ReviewsSection — Yelp + Google + Confetti reviews
// ═════════════════════════════════════════════════════════════════
function ReviewsSection({ reviews = VENUE_REVIEWS }) {
  const [filter, setFilter] = useStateVm('all');
  const visible = filter === 'all' ? reviews : reviews.filter(r => r.source === filter);
  const avgStars = (reviews.reduce((a, r) => a + r.stars, 0) / reviews.length).toFixed(1);

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
        letterSpacing: '.16em', textTransform: 'uppercase',
        opacity: 0.55, marginBottom: 10,
      }}>WHAT PEOPLE SAY · {reviews.length} REVIEWS</div>

      {/* Star summary */}
      <div style={{
        padding: 14, marginBottom: 10,
        border: '2.5px solid var(--ink)', borderRadius: 14,
        background: 'var(--paper)',
        boxShadow: '4px 4px 0 var(--ink)',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 44,
          letterSpacing: '-0.04em', lineHeight: 1,
        }}>{avgStars}<span style={{ fontSize: 18, opacity: 0.5 }}>/5</span></div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 800,
          }}>★★★★★</div>
          <div style={{
            fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 700,
            opacity: 0.55, marginTop: 3, letterSpacing: '.06em',
            textTransform: 'uppercase',
          }}>YELP 4.7 · GOOGLE 4.6 · CONFETTI 4.9</div>
        </div>
      </div>

      {/* Source filter chips */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {[
          { id: 'all', l: 'all sources', c: 'var(--ink)' },
          { id: 'confetti', l: '✣ confetti', c: 'var(--accent-1)' },
          { id: 'yelp', l: 'yelp', c: '#d32323' },
          { id: 'google', l: 'google', c: 'var(--accent-3)' },
        ].map(s => (
          <button key={s.id} onClick={() => setFilter(s.id)} style={{
            appearance: 'none', cursor: 'pointer',
            padding: '5px 10px',
            border: '2px solid var(--ink)', borderRadius: 999,
            background: filter === s.id ? s.c : 'var(--paper)',
            color: filter === s.id ? 'var(--paper)' : 'var(--ink)',
            fontFamily: 'var(--cf-ui)', fontSize: 11, fontWeight: 800,
          }}>{s.l}</button>
        ))}
      </div>

      {/* Review cards */}
      {visible.map((r, i) => (
        <div key={i} style={{
          padding: 14, marginBottom: 10,
          border: '2.5px solid var(--ink)', borderRadius: 14,
          background: 'var(--paper)',
          boxShadow: '3px 3px 0 var(--ink)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            marginBottom: 8,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 999,
              border: '2.5px solid var(--ink)', background: r.c,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 14,
              color: r.c === 'var(--accent-3)' ? 'var(--paper)' : 'var(--ink)',
              flexShrink: 0,
            }}>{r.avatar}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 800,
                lineHeight: 1.1,
              }}>{r.who}</div>
              <div style={{
                fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 700,
                opacity: 0.55, marginTop: 3, letterSpacing: '.06em',
                textTransform: 'uppercase',
              }}>{r.time} · {r.source}</div>
            </div>
            <span style={{
              fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 14,
              color: '#f7c83b',
            }}>{'★'.repeat(r.stars)}</span>
          </div>
          <p style={{
            fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 700,
            lineHeight: 1.45, margin: 0,
          }}>{r.text}</p>
          <div style={{
            display: 'flex', gap: 14, marginTop: 10,
            paddingTop: 8, borderTop: '1.5px dashed rgba(0,0,0,0.15)',
            fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
            opacity: 0.65,
          }}>
            <span>👍 helpful · {r.helpful}</span>
            <span>↗ share</span>
            <span style={{ marginLeft: 'auto' }}>· · ·</span>
          </div>
        </div>
      ))}

      {/* AI summary callout */}
      <div style={{
        padding: 12, marginTop: 8,
        background: 'var(--accent-2)',
        border: '2.5px solid var(--ink)', borderRadius: 12,
        boxShadow: '3px 3px 0 var(--ink)',
      }}>
        <div style={{
          fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
          letterSpacing: '.14em', opacity: 0.7, textTransform: 'uppercase',
          marginBottom: 4,
        }}>✣ SPARKLE SUMMARIZED 247 REVIEWS</div>
        <div style={{
          fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 800,
          lineHeight: 1.4,
        }}>People come for the <strong>carbonara</strong>, stay for the <strong>counter seats</strong>, and warn that it gets loud after 9. Bring an early-eater if you want to actually talk.</div>
      </div>
    </div>
  );
}

Object.assign(window, {
  VENUE_CLIPS, VENUE_REVIEWS, SocialMediaReel, ReviewsSection,
});
