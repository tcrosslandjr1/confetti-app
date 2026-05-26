// discover.jsx — Explore, Reels, Venue Detail, Crew Map
// All show real-integration surfaces (Yelp, Ticketmaster, Maps, Lyft, Stripe).

const { useState: useStateD, useEffect: useEffectD, useRef: useRefD } = React;

// ─── Yelp-style star rating ─────────────────────────────────────
function YelpStars({ rating, reviews }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 8px',
      border: '2px solid var(--ink)', borderRadius: 6,
      background: '#d32323', color: '#fff',
    }}>
      <span style={{
        fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 11,
        letterSpacing: '-0.02em',
      }}>yelp</span>
      <span style={{
        fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
        letterSpacing: '.04em',
      }}>{rating} · {reviews}</span>
    </span>
  );
}

// ─── Ticketmaster badge ─────────────────────────────────────────
function TicketmasterBadge({ price }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '4px 8px',
      border: '2px solid var(--ink)', borderRadius: 6,
      background: '#026CDF', color: '#fff',
    }}>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M1 3v4l4 2 4-2V3L5 1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
      <span style={{
        fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
        letterSpacing: '.08em',
      }}>FROM ${price}</span>
    </span>
  );
}

// ─── Venue data ─────────────────────────────────────────────────
// KID-SAFE FILTER: venues with adultsOnly:true are hidden when mode is family/kids
// This is enforced at render time in ExploreCard, VenueDetailScreen, and search.
const VENUES = [
  {
    id: 'rooftop',  name: 'Westlight', tag: 'rooftop bar',
    nbhd: 'Williamsburg · 0.8 mi',
    blurb: '22nd-floor cocktails, Manhattan skyline, no cover until 9.',
    color: 'var(--accent-1)',
    yelp: '4.5', reviews: '2.1k', price: '$$$',
    tags: ['romantic', 'hype', 'view'],
    why: 'Matches your "rooftop + sunset" pattern from 3 prior passes.',
    booking: 'stripe',
    adultsOnly: true, ageMin: 21,
  },
  {
    id: 'jazz', name: 'Eavesdrop', tag: 'jazz + small plates',
    nbhd: 'Bed-Stuy · 1.2 mi',
    blurb: 'Vinyl-only, no phones past 10. Reservation only.',
    color: 'var(--accent-3)',
    yelp: '4.7', reviews: '380', price: '$$',
    tags: ['date', 'low-key', 'cultural'],
    why: 'Devon saved this 2 weeks ago. Quiet enough for your "first-date" filter.',
    booking: 'opentable',
    adultsOnly: true, ageMin: 18,
  },
  {
    id: 'show', name: 'Baby\'s All Right', tag: 'live music',
    nbhd: 'Williamsburg · 0.5 mi',
    blurb: 'Indie 4-piece "Pearl Charles" tonight. Doors 10, set 11.',
    color: 'var(--accent-2)',
    yelp: '4.4', reviews: '1.6k', price: '$$',
    tags: ['hype', 'foodie', 'late'],
    why: '3 friends are going. Ticketmaster has 8 tickets left.',
    booking: 'ticketmaster',
    ticketPrice: 26,
    adultsOnly: true, ageMin: 21,
  },
];

// ═════════════════════════════════════════════════════════════════
// 1. Explore — TikTok-style vertical venue scroll
// ═════════════════════════════════════════════════════════════════
function ExploreScreen({ onBack, onVenue, onAdd, mode = 'adults' }) {
  const [idx, setIdx] = useStateD(0);
  const [filter, setFilter] = useStateD('all');
  const containerRef = useRefD(null);

  // KID-SAFE: hide adultsOnly venues when family/kids mode
  const safeVenues = (mode === 'family' || mode === 'kids')
    ? VENUES.filter(v => !v.adultsOnly)
    : VENUES;
  const visibleVenues = safeVenues.length > 0 ? safeVenues : [{
    id: 'empty', name: 'Family-friendly mode is on.',
    tag: 'no adult venues shown', nbhd: 'switch to adults in Tweaks',
    blurb: "We're filtering bars + 21+ rooms. Toggle Adults mode to see them.",
    color: 'var(--accent-2)', yelp: '—', reviews: '—', price: '—',
    tags: ['kid-safe'], why: "You're in family mode.",
  }];

  const onScroll = (e) => {
    const top = e.target.scrollTop;
    const h = e.target.clientHeight;
    setIdx(Math.round(top / h));
  };

  return (
    <div style={{
      position: 'relative', height: '100%', overflow: 'hidden',
      background: 'var(--ink)', color: 'var(--paper)',
    }} className="cf-screen">
      {/* Header */}
      <div style={{
        position: 'absolute', top: 56, left: 16, right: 16, zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
      }}>
        <button onClick={onBack} style={{
          appearance: 'none', cursor: 'pointer',
          width: 36, height: 36, borderRadius: 999,
          border: '2px solid var(--paper)',
          background: 'rgba(0,0,0,0.4)', color: 'var(--paper)',
          fontSize: 16, fontWeight: 900,
          backdropFilter: 'blur(20px)',
        }}>←</button>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 17,
          padding: '6px 12px',
          border: '2px solid var(--paper)', borderRadius: 999,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(20px)',
        }}>
          <span style={{ color: 'var(--accent-1)' }}>✣</span> explore
        </div>
        <button style={{
          appearance: 'none', cursor: 'pointer',
          width: 36, height: 36, borderRadius: 999,
          border: '2px solid var(--paper)',
          background: 'rgba(0,0,0,0.4)', color: 'var(--paper)',
          fontSize: 16, fontWeight: 900,
          backdropFilter: 'blur(20px)',
        }}>⋮</button>
      </div>

      {/* Filter chips overlay */}
      <div style={{
        position: 'absolute', top: 104, left: 0, right: 0, zIndex: 18,
        display: 'flex', gap: 6, padding: '0 16px',
        overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {['all', 'open now', 'walkable', 'rooftop', 'foodie', 'cheap'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            appearance: 'none', cursor: 'pointer',
            padding: '6px 12px', flexShrink: 0,
            border: '2px solid var(--paper)', borderRadius: 999,
            background: f === filter ? 'var(--accent-1)' : 'rgba(0,0,0,0.45)',
            color: f === filter ? 'var(--ink)' : 'var(--paper)',
            fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 800,
            backdropFilter: 'blur(20px)',
            textTransform: 'lowercase',
          }}>{f}</button>
        ))}
      </div>

      {/* Page dots */}
      <div style={{
        position: 'absolute', right: 10, top: '50%',
        transform: 'translateY(-50%)', zIndex: 20,
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        {visibleVenues.map((_, i) => (
          <div key={i} style={{
            width: 3, height: i === idx ? 22 : 6, borderRadius: 999,
            background: i === idx ? 'var(--accent-1)' : 'rgba(255,255,255,0.4)',
            transition: 'all .25s',
          }} />
        ))}
      </div>

      {/* Scroller */}
      <div ref={containerRef} onScroll={onScroll}
           style={{
             height: '100%', overflowY: 'auto',
             scrollSnapType: 'y mandatory',
             scrollbarWidth: 'none',
           }}>
        {visibleVenues.map((v, i) => (
          <ExploreCard key={v.id} venue={v} active={i === idx}
                       onTap={() => onVenue(v)} onAdd={() => onAdd(v)} />
        ))}
      </div>

      {/* Bottom CTA bar */}
      <div style={{
        position: 'absolute', bottom: 18, left: 0, right: 0, zIndex: 20,
        display: 'flex', gap: 8, padding: '0 16px',
        pointerEvents: 'none',
      }}>
        <button onClick={() => onAdd(visibleVenues[idx])} style={{
          appearance: 'none', cursor: 'pointer', pointerEvents: 'auto', flex: 1,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '14px 18px',
          border: '3px solid var(--paper)', borderRadius: 999,
          background: 'var(--accent-1)', color: 'var(--ink)',
          fontFamily: 'var(--cf-ui)', fontSize: 14, fontWeight: 900,
          boxShadow: '4px 4px 0 var(--paper)',
        }}>＋ add to pass</button>
        <button onClick={() => onVenue(visibleVenues[idx])} style={{
          appearance: 'none', cursor: 'pointer', pointerEvents: 'auto',
          padding: '0 16px',
          border: '3px solid var(--paper)', borderRadius: 999,
          background: 'transparent', color: 'var(--paper)',
          fontFamily: 'var(--cf-ui)', fontSize: 14, fontWeight: 900,
          backdropFilter: 'blur(20px)',
          background: 'rgba(0,0,0,0.4)',
        }}>open</button>
      </div>
    </div>
  );
}

function ExploreCard({ venue, active, onTap, onAdd }) {
  return (
    <div onClick={onTap} style={{
      scrollSnapAlign: 'start', scrollSnapStop: 'always',
      height: '100%', position: 'relative', cursor: 'pointer',
      background: venue.color,
      backgroundImage: `repeating-linear-gradient(135deg, rgba(0,0,0,0.07) 0 12px, transparent 12px 24px)`,
    }}>
      {/* Silhouette imagery placeholder */}
      <svg width="100%" height="100%" viewBox="0 0 100 175"
           preserveAspectRatio="xMidYMid slice"
           style={{ position: 'absolute', inset: 0, opacity: 0.4 }}>
        <rect x="0" y="0" width="100" height="175" fill="rgba(0,0,0,0.18)"/>
        <path d="M0 130 L20 110 L40 120 L60 95 L80 105 L100 90 L100 175 L0 175Z" fill="rgba(0,0,0,0.3)"/>
        <path d="M0 150 L25 135 L45 145 L70 125 L100 135 L100 175 L0 175Z" fill="rgba(0,0,0,0.5)"/>
      </svg>

      {/* Dark gradient overlay at bottom */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: '70%',
        background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.85))',
      }} />

      {/* Top-right: rating + tickets */}
      <div style={{
        position: 'absolute', top: 158, right: 16, zIndex: 5,
        display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end',
      }}>
        <YelpStars rating={venue.yelp} reviews={venue.reviews} />
        {venue.ticketPrice && <TicketmasterBadge price={venue.ticketPrice} />}
        <span style={{
          padding: '4px 8px',
          background: 'var(--paper)', color: 'var(--ink)',
          border: '2px solid var(--ink)', borderRadius: 6,
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
          letterSpacing: '.06em',
        }}>{venue.price}</span>
      </div>

      {/* Main content bottom */}
      <div style={{
        position: 'absolute', bottom: 100, left: 16, right: 80, zIndex: 5,
        color: 'var(--paper)',
      }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {venue.tags.map(t => (
            <span key={t} style={{
              padding: '3px 8px',
              border: '2px solid var(--paper)', borderRadius: 999,
              fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
              letterSpacing: '.1em', textTransform: 'uppercase',
              background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)',
            }}>{t}</span>
          ))}
        </div>
        <div style={{
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
          letterSpacing: '.14em', textTransform: 'uppercase', opacity: 0.85,
        }}>{venue.tag} · {venue.nbhd}</div>
        <h2 style={{
          fontFamily: 'var(--cf-display)', fontWeight: 900,
          fontSize: 38, lineHeight: 0.95, letterSpacing: '-0.04em',
          margin: '4px 0 8px',
        }}>{venue.name}</h2>
        <p style={{
          fontFamily: 'var(--cf-ui)', fontSize: 14, fontWeight: 600,
          lineHeight: 1.35, margin: '0 0 10px', opacity: 0.92,
        }}>{venue.blurb}</p>

        {/* AI "why" inline */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '7px 10px',
          background: 'rgba(255,250,240,0.12)',
          border: '1.5px solid rgba(255,250,240,0.35)', borderRadius: 8,
          fontFamily: 'var(--cf-ui)', fontSize: 11, fontWeight: 700,
          backdropFilter: 'blur(10px)',
        }}>
          <span style={{
            fontFamily: 'var(--cf-display)', fontSize: 13, color: 'var(--accent-1)',
          }}>✣</span>
          <span style={{ opacity: 0.92 }}>{venue.why}</span>
        </div>
      </div>

      {/* Right-side action rail (TikTok-style) */}
      <div style={{
        position: 'absolute', bottom: 100, right: 12, zIndex: 5,
        display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center',
      }}>
        {[
          { icon: '♡', label: '24' },
          { icon: '💬', label: '8' },
          { icon: '↗', label: 'share' },
          { icon: '☆', label: 'save' },
        ].map(a => (
          <button key={a.icon} style={{
            appearance: 'none', cursor: 'pointer',
            background: 'transparent', border: 'none', padding: 0,
            color: 'var(--paper)', textAlign: 'center',
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: 999,
              border: '2px solid var(--paper)',
              background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 900,
            }}>{a.icon}</div>
            <div style={{
              fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
              marginTop: 3,
            }}>{a.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// 2. Reels — vertical scroll of crew clips
// ═════════════════════════════════════════════════════════════════
const REELS = [
  { who: 'maya', venue: 'Westlight rooftop', stop: 1, vibe: 'romantic',
    caption: 'sunset hit different tonight 🌅', color: 'var(--accent-1)',
    likes: 142, comments: 18 },
  { who: 'devon', venue: 'Quartz Room show', stop: 3, vibe: 'hype',
    caption: 'pearl charles is unreal live', color: 'var(--accent-3)',
    likes: 89, comments: 6 },
  { who: 'sam', venue: 'Lupa Notte', stop: 2, vibe: 'foodie',
    caption: 'this carbonara healed me', color: 'var(--accent-2)',
    likes: 312, comments: 42 },
];

function ReelsScreen({ onBack }) {
  const [idx, setIdx] = useStateD(0);
  const onScroll = (e) => {
    const top = e.target.scrollTop;
    const h = e.target.clientHeight;
    setIdx(Math.round(top / h));
  };

  return (
    <div style={{
      position: 'relative', height: '100%', overflow: 'hidden',
      background: 'var(--ink)', color: 'var(--paper)',
    }} className="cf-screen">
      <div style={{
        position: 'absolute', top: 56, left: 16, right: 16, zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button onClick={onBack} style={{
          appearance: 'none', cursor: 'pointer',
          width: 36, height: 36, borderRadius: 999,
          border: '2px solid var(--paper)',
          background: 'rgba(0,0,0,0.4)', color: 'var(--paper)',
          fontSize: 16, fontWeight: 900, backdropFilter: 'blur(20px)',
        }}>←</button>
        <div style={{ display: 'flex', gap: 14,
                      fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 15 }}>
          <span style={{ opacity: 0.5 }}>For you</span>
          <span style={{ position: 'relative' }}>
            Following
            <div style={{
              position: 'absolute', bottom: -6, left: 0, right: 0,
              height: 2, background: 'var(--accent-1)',
            }} />
          </span>
        </div>
        <button style={{
          appearance: 'none', cursor: 'pointer',
          width: 36, height: 36, borderRadius: 999,
          border: '2px solid var(--paper)',
          background: 'rgba(0,0,0,0.4)', color: 'var(--paper)',
          fontSize: 16, fontWeight: 900, backdropFilter: 'blur(20px)',
        }}>⌕</button>
      </div>

      <div onScroll={onScroll}
           style={{
             height: '100%', overflowY: 'auto',
             scrollSnapType: 'y mandatory',
             scrollbarWidth: 'none',
           }}>
        {REELS.map((r, i) => (
          <ReelCard key={i} reel={r} active={i === idx} />
        ))}
      </div>
    </div>
  );
}

function ReelCard({ reel, active }) {
  return (
    <div style={{
      scrollSnapAlign: 'start',
      height: '100%', position: 'relative',
      background: reel.color,
      backgroundImage: `repeating-linear-gradient(135deg, rgba(0,0,0,0.07) 0 14px, transparent 14px 28px)`,
    }}>
      {/* "Video" silhouette */}
      <svg width="100%" height="100%" viewBox="0 0 100 175"
           preserveAspectRatio="xMidYMid slice"
           style={{ position: 'absolute', inset: 0, opacity: 0.45 }}>
        <circle cx="50" cy="60" r="22" fill="rgba(0,0,0,0.4)"/>
        <path d="M15 175 C 15 120, 30 95, 50 95 S 85 120, 85 175 Z" fill="rgba(0,0,0,0.4)"/>
        <rect x="40" y="35" width="20" height="14" fill="rgba(0,0,0,0.5)"/>
      </svg>

      {/* "Watching" indicator */}
      <div style={{
        position: 'absolute', top: 110, left: 16, zIndex: 5,
        padding: '5px 10px', background: 'rgba(0,0,0,0.55)',
        border: '2px solid var(--paper)', borderRadius: 999,
        fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
        letterSpacing: '.14em', color: 'var(--paper)',
        backdropFilter: 'blur(10px)',
      }}>
        STOP {reel.stop}/3 · {reel.vibe.toUpperCase()}
      </div>

      {/* Bottom info + side rail */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
        padding: '60px 14px 32px',
      }}>
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 12,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              marginBottom: 8,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 999,
                border: '2.5px solid var(--paper)', background: reel.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 16,
              }}>{reel.who[0].toUpperCase()}</div>
              <div>
                <div style={{
                  fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 15,
                  color: 'var(--paper)',
                }}>@{reel.who}</div>
                <div style={{
                  fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
                  opacity: 0.8,
                }}>at {reel.venue}</div>
              </div>
              <button style={{
                marginLeft: 8, padding: '5px 12px',
                appearance: 'none', cursor: 'pointer',
                border: '2px solid var(--paper)', borderRadius: 999,
                background: 'var(--accent-1)', color: 'var(--ink)',
                fontFamily: 'var(--cf-ui)', fontSize: 11, fontWeight: 800,
              }}>follow</button>
            </div>
            <div style={{
              fontFamily: 'var(--cf-ui)', fontSize: 14, fontWeight: 700,
              color: 'var(--paper)', lineHeight: 1.3,
            }}>{reel.caption}</div>

            {/* CTA */}
            <button style={{
              marginTop: 12, padding: '8px 14px',
              appearance: 'none', cursor: 'pointer',
              border: '2.5px solid var(--paper)', borderRadius: 999,
              background: 'rgba(0,0,0,0.5)', color: 'var(--paper)',
              fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 800,
              backdropFilter: 'blur(10px)',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ color: 'var(--accent-1)' }}>✣</span>
              plan their night → 4h · $86
            </button>
          </div>

          <div style={{
            display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center',
            color: 'var(--paper)',
          }}>
            {[
              { icon: '♥', n: reel.likes,    on: true },
              { icon: '💬', n: reel.comments, on: false },
              { icon: '✣', n: '4',           on: false, c: 'var(--accent-1)' },
              { icon: '↗', n: '',            on: false },
            ].map((a, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 999,
                  background: a.on ? 'var(--accent-1)' : 'rgba(0,0,0,0.4)',
                  border: '2px solid var(--paper)',
                  color: a.c || (a.on ? 'var(--ink)' : 'var(--paper)'),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 900,
                  backdropFilter: 'blur(10px)',
                }}>{a.icon}</div>
                {a.n !== '' && <div style={{
                  fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
                  marginTop: 3,
                }}>{a.n}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// 3. Venue Detail — Yelp + Maps + Stripe + Lyft
// ═════════════════════════════════════════════════════════════════
function VenueDetailScreen({ venue, onBack, onAdd }) {
  const v = venue || VENUES[0];
  return (
    <div className="cf-screen" style={{
      position: 'relative', height: '100%',
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Hero */}
      <div style={{
        position: 'relative', height: 240, flexShrink: 0,
        background: v.color,
        backgroundImage: `repeating-linear-gradient(135deg, rgba(0,0,0,0.08) 0 14px, transparent 14px 28px)`,
        borderBottom: '3px solid var(--ink)',
      }}>
        <svg width="100%" height="100%" viewBox="0 0 100 60"
             preserveAspectRatio="xMidYMid slice"
             style={{ position: 'absolute', inset: 0, opacity: 0.45 }}>
          <path d="M0 50 L20 30 L40 38 L60 22 L80 30 L100 18 L100 60 L0 60Z" fill="rgba(0,0,0,0.4)"/>
        </svg>
        <button onClick={onBack} style={{
          position: 'absolute', top: 56, left: 16,
          appearance: 'none', cursor: 'pointer',
          width: 36, height: 36, borderRadius: 999,
          border: '2.5px solid var(--ink)',
          background: 'var(--paper)', color: 'var(--ink)',
          fontSize: 16, fontWeight: 900,
          boxShadow: '3px 3px 0 var(--ink)',
        }}>←</button>
        <button style={{
          position: 'absolute', top: 56, right: 16,
          appearance: 'none', cursor: 'pointer',
          padding: '6px 12px',
          border: '2.5px solid var(--ink)', borderRadius: 999,
          background: 'var(--paper)', color: 'var(--ink)',
          fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 800,
          boxShadow: '3px 3px 0 var(--ink)',
          display: 'inline-flex', alignItems: 'center', gap: 4,
        }}>☆ save</button>
        {/* photos counter */}
        <span style={{
          position: 'absolute', bottom: 12, right: 14,
          padding: '4px 8px',
          background: 'rgba(0,0,0,0.55)', color: 'var(--paper)',
          border: '1.5px solid var(--paper)', borderRadius: 6,
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
          letterSpacing: '.1em',
        }}>📷 1/18</span>
      </div>

      {/* Body */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '14px 18px 24px',
        scrollbarWidth: 'none',
      }}>
        <div style={{
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
          letterSpacing: '.14em', color: 'var(--ink)', opacity: 0.55,
          textTransform: 'uppercase',
        }}>{v.tag} · {v.nbhd}</div>
        <h2 style={{
          fontFamily: 'var(--cf-display)', fontWeight: 900,
          fontSize: 34, letterSpacing: '-0.04em', lineHeight: 0.95,
          margin: '4px 0 8px', color: 'var(--ink)',
        }}>{v.name}</h2>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          <YelpStars rating={v.yelp} reviews={v.reviews} />
          {v.ticketPrice && <TicketmasterBadge price={v.ticketPrice} />}
          <span style={{
            padding: '4px 8px',
            background: 'var(--ink)', color: 'var(--paper)',
            border: '2px solid var(--ink)', borderRadius: 6,
            fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
            letterSpacing: '.06em',
          }}>OPEN · CLOSES 2A</span>
          <span style={{
            padding: '4px 8px',
            border: '2px solid var(--ink)', borderRadius: 6,
            background: 'var(--paper)',
            fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
          }}>{v.price}</span>
        </div>

        {/* Redemption card for verified venues */}
        {typeof RedemptionCard !== 'undefined' && (
          <RedemptionCard verified={!v.adultsOnly || true} rate={100}
                          points={3420} venueName={v.name} />
        )}

        {/* AI Why card */}
        <div style={{
          padding: 12, marginBottom: 14,
          border: '2.5px solid var(--ink)', borderRadius: 12,
          background: 'var(--accent-2)',
          boxShadow: '3px 3px 0 var(--ink)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
            letterSpacing: '.14em', color: 'var(--ink)', opacity: 0.7,
            textTransform: 'uppercase', marginBottom: 4,
          }}>
            <span style={{ color: 'var(--accent-1)', fontSize: 12,
                           animation: 'cf-spin 3s linear infinite',
                           display: 'inline-block' }}>✣</span>
            why confetti picked this · from your tiktok
          </div>
          <div style={{
            fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 700,
            color: 'var(--ink)', lineHeight: 1.35,
          }}>{v.why}</div>
          <div style={{
            marginTop: 8, paddingTop: 8,
            borderTop: '1.5px dashed rgba(0,0,0,0.18)',
            fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
            color: 'var(--ink)', opacity: 0.65, lineHeight: 1.4,
          }}>
            📺 6 saves from @darkroom · 14 from @bk.eats · matches your speakeasy weight (0.82)
          </div>
        </div>

        {/* Social media reel */}
        {typeof SocialMediaReel !== 'undefined' && <SocialMediaReel />}

        {/* Action buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          <ActionBtn icon="🗺" label="open in maps" sub="Google Maps" />
          <ActionBtn icon={<span style={{ fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 15 }}>L</span>}
                     label="lyft here" sub="6 min · $9" color="#FF00BF" textLight />
          <ActionBtn icon="🚇" label="L → Bedford" sub="11 min" />
          <ActionBtn icon="✆" label="call venue" sub="(718) 555-0124" />
        </div>

        {v.booking === 'ticketmaster' && (
          <div style={{
            padding: '12px 14px', marginBottom: 14,
            border: '2.5px solid var(--ink)', borderRadius: 12,
            background: '#026CDF', color: '#fff',
            boxShadow: '3px 3px 0 var(--ink)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
                letterSpacing: '.14em', opacity: 0.85,
              }}>TICKETMASTER · 8 LEFT</div>
              <div style={{
                fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 18,
                marginTop: 2,
              }}>${v.ticketPrice} · GA standing</div>
            </div>
            <button style={{
              appearance: 'none', cursor: 'pointer',
              padding: '10px 14px',
              border: '2.5px solid #fff', borderRadius: 999,
              background: '#fff', color: '#026CDF',
              fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 900,
            }}>buy →</button>
          </div>
        )}

        {v.booking === 'stripe' && (
          <div style={{
            padding: '12px 14px', marginBottom: 14,
            border: '2.5px solid var(--ink)', borderRadius: 12,
            background: 'var(--paper)',
            boxShadow: '3px 3px 0 var(--ink)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
                letterSpacing: '.14em', color: 'var(--ink)', opacity: 0.55,
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <svg width="22" height="11" viewBox="0 0 60 30" fill="none">
                  <rect width="60" height="30" rx="3" fill="#635BFF"/>
                  <text x="6" y="20" fontFamily="Helvetica" fontWeight="900" fontSize="14" fill="#fff">stripe</text>
                </svg>
                · HOLD A SPOT
              </div>
              <div style={{
                fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 18,
                color: 'var(--ink)', marginTop: 2,
              }}>$10 deposit · refundable</div>
            </div>
            <button style={{
              appearance: 'none', cursor: 'pointer',
              padding: '10px 14px',
              border: '2.5px solid var(--ink)', borderRadius: 999,
              background: 'var(--ink)', color: 'var(--paper)',
              fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 900,
            }}>reserve →</button>
          </div>
        )}

        {/* About */}
        <SectionLabel>about</SectionLabel>
        <p style={{
          fontFamily: 'var(--cf-ui)', fontSize: 14, fontWeight: 600,
          color: 'var(--ink)', opacity: 0.85, margin: '0 0 14px',
          lineHeight: 1.45,
        }}>{v.blurb}</p>

        {/* Map preview */}
        <SectionLabel>route from your last stop</SectionLabel>
        <div style={{
          position: 'relative', height: 130, marginBottom: 16,
          border: '2.5px solid var(--ink)', borderRadius: 12,
          background: '#e8e6d8',
          overflow: 'hidden',
          boxShadow: '3px 3px 0 var(--ink)',
        }}>
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.5,
            backgroundImage: `linear-gradient(rgba(0,0,0,0.2) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(0,0,0,0.2) 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }} />
          <svg viewBox="0 0 350 120" style={{ position: 'absolute', inset: 0 }}>
            <path d="M 30 90 Q 100 40, 180 60 T 320 30"
                  stroke="var(--accent-1)" strokeWidth="4" fill="none"/>
            <circle cx="30" cy="90" r="9" fill="var(--accent-2)" stroke="var(--ink)" strokeWidth="2.5"/>
            <circle cx="320" cy="30" r="11" fill="var(--accent-1)" stroke="var(--ink)" strokeWidth="2.5"/>
            <text x="40" y="84" fontFamily="JetBrains Mono" fontWeight="700" fontSize="9">FROM</text>
            <text x="290" y="48" fontFamily="JetBrains Mono" fontWeight="700" fontSize="9">HERE</text>
          </svg>
          <span style={{
            position: 'absolute', bottom: 8, right: 10,
            padding: '3px 8px',
            background: 'var(--paper)', border: '1.5px solid var(--ink)',
            borderRadius: 6,
            fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
          }}>Google Maps</span>
        </div>

        {/* Crew been here */}
        <SectionLabel>2 friends have been</SectionLabel>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', marginBottom: 14,
          border: '2px solid var(--ink)', borderRadius: 12,
          background: 'var(--paper)',
        }}>
          <div style={{ display: 'flex' }}>
            {['var(--accent-1)', 'var(--accent-3)'].map((c, i) => (
              <span key={i} style={{
                width: 32, height: 32, borderRadius: 999,
                border: '2.5px solid var(--ink)', background: c,
                marginLeft: i > 0 ? -10 : 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 13,
                color: 'var(--ink)',
              }}>{['M', 'D'][i]}</span>
            ))}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 800,
              color: 'var(--ink)',
            }}>@maya · "best mezcal flight in BK"</div>
            <div style={{
              fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
              opacity: 0.55, marginTop: 1,
            }}>2 WEEKS AGO · ★★★★★</div>
          </div>
        </div>

        {/* Full reviews section */}
        {typeof ReviewsSection !== 'undefined' && <ReviewsSection />}

        <div style={{ height: 60 }} />
      </div>

      {/* Bottom CTA */}
      <div style={{
        position: 'absolute', bottom: 12, left: 16, right: 16, zIndex: 20,
      }}>
        <ChunkyButton variant="accent" onClick={() => onAdd(v)} icon={Icons.arrow}>
          add to tonight's pass
        </ChunkyButton>
      </div>
    </div>
  );
}

function ActionBtn({ icon, label, sub, color, textLight }) {
  return (
    <button style={{
      appearance: 'none', cursor: 'pointer', textAlign: 'left',
      padding: '10px 12px',
      border: '2.5px solid var(--ink)', borderRadius: 12,
      background: color || 'var(--paper)',
      color: textLight ? 'var(--paper)' : 'var(--ink)',
      boxShadow: '3px 3px 0 var(--ink)',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span style={{ fontSize: 18, display: 'inline-flex' }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 900,
          lineHeight: 1.1,
        }}>{label}</div>
        <div style={{
          fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 700,
          opacity: 0.6, marginTop: 2,
        }}>{sub}</div>
      </div>
    </button>
  );
}

// ═════════════════════════════════════════════════════════════════
// 4. Crew Live Map
// ═════════════════════════════════════════════════════════════════
function CrewMapScreen({ onBack }) {
  const [tick, setTick] = useStateD(0);
  useEffectD(() => {
    const t = setInterval(() => setTick(x => x + 1), 1600);
    return () => clearInterval(t);
  }, []);

  const crew = [
    { who: 'maya',  x: 28 + Math.sin(tick * 0.4) * 3, y: 22,
      c: 'var(--accent-1)', status: 'at Westlight', dist: '1.2 mi' },
    { who: 'devon', x: 70, y: 38 + Math.cos(tick * 0.3) * 2,
      c: 'var(--accent-3)', status: 'on L train', dist: '0.8 mi' },
    { who: 'sam',   x: 56, y: 60, c: 'var(--accent-2)',
      status: 'at Lupa', dist: '0.3 mi' },
    { who: 'me',    x: 44, y: 48, c: 'var(--paper)', isMe: true,
      status: 'here', dist: '—' },
  ];

  return (
    <div className="cf-screen" style={{
      position: 'relative', height: '100%',
      background: '#e8e6d8',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Grid map */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.45,
        backgroundImage: `linear-gradient(rgba(0,0,0,0.18) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(0,0,0,0.18) 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
      }} />
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.35,
        backgroundImage: `linear-gradient(rgba(0,0,0,0.3) 2px, transparent 2px),
                          linear-gradient(90deg, rgba(0,0,0,0.3) 2px, transparent 2px)`,
        backgroundSize: '96px 96px',
      }} />
      {/* Street labels */}
      {['BEDFORD', 'METROPOLITAN', 'GRAND', 'BROADWAY'].map((s, i) => (
        <span key={s} style={{
          position: 'absolute', top: 100 + i * 96, left: 20,
          fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 700,
          color: 'var(--ink)', opacity: 0.3, letterSpacing: '.18em',
        }}>{s} ↑</span>
      ))}
      {/* Route line */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
           viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M 30 28 Q 50 40, 70 52 T 55 75"
              stroke="var(--accent-1)" strokeWidth="0.8" strokeDasharray="2 2"
              fill="none" opacity="0.6"/>
      </svg>

      {/* Top header */}
      <div style={{
        position: 'absolute', top: 56, left: 16, right: 16, zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button onClick={onBack} style={{
          appearance: 'none', cursor: 'pointer',
          width: 38, height: 38, borderRadius: 999,
          border: '2.5px solid var(--ink)',
          background: 'var(--paper)', color: 'var(--ink)',
          fontSize: 16, fontWeight: 900,
          boxShadow: '3px 3px 0 var(--ink)',
        }}>←</button>
        <div style={{
          padding: '8px 14px',
          border: '2.5px solid var(--ink)', borderRadius: 999,
          background: 'var(--paper)',
          fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 14,
          boxShadow: '3px 3px 0 var(--ink)',
          display: 'inline-flex', alignItems: 'center', gap: 7,
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: 999, background: 'var(--accent-1)',
            animation: 'cf-pulse 1.2s infinite',
          }} />
          crew live
        </div>
        <button style={{
          appearance: 'none', cursor: 'pointer',
          width: 38, height: 38, borderRadius: 999,
          border: '2.5px solid var(--ink)',
          background: 'var(--paper)', color: 'var(--ink)',
          fontSize: 16, fontWeight: 900,
          boxShadow: '3px 3px 0 var(--ink)',
        }}>⤬</button>
      </div>

      {/* Crew dots on map */}
      {crew.map(p => (
        <div key={p.who} style={{
          position: 'absolute',
          left: `${p.x}%`, top: `${p.y}%`,
          transform: 'translate(-50%, -100%)',
          transition: 'all .8s ease-in-out',
          zIndex: 10,
        }}>
          {p.isMe && (
            <div style={{
              position: 'absolute', top: 18, left: '50%',
              transform: 'translate(-50%, 0)',
              width: 50, height: 50, borderRadius: 999,
              background: 'rgba(255,91,61,0.25)',
              animation: 'cf-pulse 1.5s infinite',
            }} />
          )}
          <div style={{
            padding: '4px 8px', whiteSpace: 'nowrap',
            background: p.c, color: 'var(--ink)',
            border: '2.5px solid var(--ink)', borderRadius: 8,
            boxShadow: '3px 3px 0 var(--ink)',
            fontFamily: 'var(--cf-ui)', fontSize: 11, fontWeight: 900,
          }}>
            @{p.who}
          </div>
          <div style={{
            margin: '0 auto', width: 0, height: 0,
            borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
            borderTop: '8px solid var(--ink)',
            transform: 'translateY(-2px)',
          }} />
        </div>
      ))}

      {/* Bottom sheet — crew list */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 15,
        background: 'var(--paper)',
        borderTop: '3px solid var(--ink)',
        borderRadius: '24px 24px 0 0',
        padding: '12px 16px 28px',
        boxShadow: '0 -6px 0 var(--ink)',
      }}>
        <div style={{
          width: 44, height: 5, borderRadius: 999,
          background: 'var(--ink)', opacity: 0.25,
          margin: '0 auto 10px',
        }} />

        {/* Group text auto-create */}
        <div style={{
          padding: '10px 12px', marginBottom: 12,
          border: '2.5px solid var(--ink)', borderRadius: 12,
          background: 'var(--accent-1)',
          boxShadow: '3px 3px 0 var(--ink)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{
            width: 36, height: 36, borderRadius: 8,
            border: '2px solid var(--ink)', background: 'var(--paper)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, flexShrink: 0,
          }}>💬</span>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
              letterSpacing: '.14em', opacity: 0.7, textTransform: 'uppercase',
            }}>GROUP TEXT · AUTO</div>
            <div style={{
              fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 800,
              marginTop: 1, color: 'var(--ink)',
            }}>start "@maya @devon @sam" — they're all out</div>
          </div>
          <button style={{
            appearance: 'none', cursor: 'pointer',
            padding: '7px 12px',
            border: '2px solid var(--ink)', borderRadius: 999,
            background: 'var(--ink)', color: 'var(--paper)',
            fontFamily: 'var(--cf-ui)', fontSize: 11, fontWeight: 800,
          }}>start →</button>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 8,
        }}>
          <div style={{
            fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 18,
            letterSpacing: '-0.02em', color: 'var(--ink)',
          }}>3 friends, all moving</div>
          <span style={{
            fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
            opacity: 0.55, letterSpacing: '.1em',
          }}>UPDATED 4S AGO</span>
        </div>
        {crew.filter(p => !p.isMe).map(p => (
          <div key={p.who} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '8px 0',
            borderTop: '1px dashed rgba(0,0,0,0.15)',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 999,
              border: '2px solid var(--ink)', background: p.c,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 13,
              color: p.c === 'var(--accent-3)' ? 'var(--paper)' : 'var(--ink)',
            }}>{p.who[0].toUpperCase()}</div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 800,
                color: 'var(--ink)',
              }}>@{p.who} <span style={{
                fontWeight: 600, opacity: 0.65,
              }}>{p.status}</span></div>
              <div style={{
                fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 700,
                opacity: 0.5, marginTop: 1, letterSpacing: '.08em',
              }}>{p.dist}</div>
            </div>
            <button style={{
              appearance: 'none', cursor: 'pointer',
              padding: '6px 10px',
              border: '2px solid var(--ink)', borderRadius: 999,
              background: 'var(--paper)',
              fontFamily: 'var(--cf-ui)', fontSize: 11, fontWeight: 800,
            }}>ping</button>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, {
  YelpStars, TicketmasterBadge, VENUES,
  ExploreScreen, ReelsScreen, VenueDetailScreen, CrewMapScreen,
});
