// hashtag-reels.jsx — Live #venue hashtag reel strip
// Fetches clips by hashtag for each venue on the boarding pass.
// Shown under each stop on Wallet + on the back of flipcards.

const { useState: useStateHr } = React;

// Sample hashtag corpus — keyed by venue name. In production, replace with
// a backend call: /api/hashtag-reels?tag=skinnypetes
const HASHTAG_CLIPS = {
  "Skinny Pete's": [
    { who: '@dee.bartender', views: '42k', c: 'var(--accent-2)', cap: 'pickle martini hour @ pete\'s' },
    { who: '@brooklyn.dive',  views: '18k', c: 'var(--accent-1)', cap: 'this jukebox is undefeated' },
    { who: '@maya.brooklyn',  views: '8k',  c: 'var(--accent-3)', cap: 'pete\'s for the warm-up always' },
  ],
  'Lupa Notte': [
    { who: '@bk.eats',        views: '142k', c: 'var(--accent-1)', cap: 'counter seats at lupa = best move in BK' },
    { who: '@nyc.pasta',      views: '88k',  c: 'var(--accent-2)', cap: 'the carbonara conversation is over' },
    { who: '@maya.brooklyn',  views: '32k',  c: 'var(--accent-3)', cap: 'ask for marco\'s section' },
    { who: '@food.kid',       views: '24k',  c: 'var(--accent-1)', cap: 'pricey but worth it' },
  ],
  'Quartz Room': [
    { who: '@indieshows.nyc', views: '67k',  c: 'var(--accent-3)', cap: 'pearl charles set tonight 11pm' },
    { who: '@bk.music',       views: '34k',  c: 'var(--accent-1)', cap: 'sticky floor energy' },
    { who: '@devon.eats',     views: '11k',  c: 'var(--accent-2)', cap: 'merch table left of stage' },
  ],
};

function hashtagFor(name) {
  return '#' + name.toLowerCase().replace(/['\s]/g, '');
}

function HashtagReels({ venueName, dark = false }) {
  const clips = HASHTAG_CLIPS[venueName] || [];
  if (!clips.length) return null;
  const tag = hashtagFor(venueName);

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 8,
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
          letterSpacing: '.12em',
          color: dark ? '#fff' : 'var(--ink)',
          opacity: 0.65,
        }}>
          <span style={{
            width: 5, height: 5, borderRadius: 999,
            background: 'var(--accent-1)',
            animation: 'cf-pulse 1.2s infinite',
          }} />
          LIVE FROM TIKTOK · {tag.toUpperCase()} · {clips.length}
        </div>
        <span style={{
          fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 700,
          opacity: 0.5,
          color: dark ? '#fff' : 'var(--ink)',
        }}>see all ›</span>
      </div>

      <div style={{
        display: 'flex', gap: 6, overflowX: 'auto',
        scrollbarWidth: 'none', paddingBottom: 2,
      }}>
        {clips.map((c, i) => (
          <button key={i} style={{
            appearance: 'none', cursor: 'pointer', flexShrink: 0,
            padding: 0, border: 'none', background: 'transparent',
            width: 88, position: 'relative',
          }}>
            <div style={{
              width: '100%', aspectRatio: '9/16',
              border: `2px solid ${dark ? '#fff' : 'var(--ink)'}`,
              borderRadius: 8, overflow: 'hidden',
              background: c.c, position: 'relative',
              backgroundImage: `repeating-linear-gradient(135deg, rgba(0,0,0,0.1) 0 8px, transparent 8px 16px)`,
            }}>
              {/* Source pill */}
              <span style={{
                position: 'absolute', top: 4, left: 4,
                padding: '1px 5px', background: 'var(--ink)', color: '#fff',
                borderRadius: 3,
                fontFamily: 'var(--cf-mono)', fontSize: 7, fontWeight: 900,
                letterSpacing: '.08em',
              }}>♪ TT</span>
              {/* Views */}
              <span style={{
                position: 'absolute', top: 4, right: 4,
                padding: '1px 5px', background: 'rgba(0,0,0,0.55)', color: '#fff',
                border: '1px solid #fff', borderRadius: 3,
                fontFamily: 'var(--cf-mono)', fontSize: 7, fontWeight: 800,
              }}>▶ {c.views}</span>
              {/* Play */}
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%,-50%)',
                width: 22, height: 22, borderRadius: 999,
                background: 'rgba(0,0,0,0.55)', border: '1.5px solid #fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 9,
              }}>▶</div>
              {/* Dark gradient */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%',
                background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.8))',
              }} />
              {/* Caption */}
              <div style={{
                position: 'absolute', bottom: 4, left: 4, right: 4,
                color: '#fff', fontFamily: 'var(--cf-ui)', fontSize: 8,
                fontWeight: 700, lineHeight: 1.2,
                overflow: 'hidden', display: '-webkit-box',
                WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              }}>{c.cap}</div>
            </div>
            <div style={{
              fontFamily: 'var(--cf-mono)', fontSize: 8, fontWeight: 700,
              marginTop: 4, letterSpacing: '.04em',
              color: dark ? '#fff' : 'var(--ink)', opacity: 0.7,
              textAlign: 'left',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{c.who}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { HashtagReels, HASHTAG_CLIPS });
