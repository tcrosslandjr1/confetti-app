// social.jsx — Check-in sheet, live feed, share rail, auto-reel preview
// All styled in Confetti's brutalist aesthetic — no cloned platform UIs.

const { useState: useStateS, useEffect: useEffectS } = React;

// ─── Social glyphs (chunky line-icon style) ─────────────────────────
const SocialIcons = {
  tiktok: <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M14 2v2.4a4 4 0 0 0 3.8 3.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M14 2v10a4 4 0 1 1-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>,
  insta: <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <rect x="2" y="2" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="2"/>
    <circle cx="10" cy="10" r="3.5" stroke="currentColor" strokeWidth="2"/>
    <circle cx="14.5" cy="5.5" r="1" fill="currentColor"/>
  </svg>,
  x: <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M3 3l14 14M17 3 3 17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>,
  snap: <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10 1.5c3 0 4.5 2 4.5 5 0 1.5-.2 3-.2 3.5s.5.8 1.3 1c.6.2 1.4.3 1.4.8 0 .8-2 1.4-2.5 2-.2.2.3 1.2-.4 1.4-.6.2-1.3-.4-2 .2s-1.2 2-2.2 2.1c-1 .1-1.5-1-3-1s-2 1.1-3 1c-1-.1-1.5-1.5-2.2-2.1-.7-.6-1.4 0-2-.2-.7-.2-.2-1.2-.4-1.4-.5-.6-2.5-1.2-2.5-2 0-.5.8-.6 1.4-.8.8-.2 1.3-.5 1.3-1s-.2-2-.2-3.5c0-3 1.5-5 4.5-5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" transform="scale(0.95) translate(0.5 0.5)"/>
  </svg>,
  imessage: <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M3 4h14v9H7l-4 3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
  </svg>,
  link: <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M8 12a3 3 0 0 0 4 0l3-3a3 3 0 0 0-4-4l-1 1M12 8a3 3 0 0 0-4 0l-3 3a3 3 0 0 0 4 4l1-1"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>,
  camera: <svg width="22" height="20" viewBox="0 0 22 20" fill="none">
    <path d="M2 6h3l2-2h8l2 2h3v11H2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <circle cx="11" cy="11" r="3.5" stroke="currentColor" strokeWidth="2"/>
  </svg>,
  heart: <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 12L1.5 6.5a3 3 0 0 1 4.2-4.3L7 3.5l1.3-1.3a3 3 0 0 1 4.2 4.3z"
          fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>,
  fire: <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 1c1 2 3 3 3 6a3 3 0 1 1-6 0c0-1.5 1-2 1-3 0-1-.5-1.5-1-2 2 0 3 1 3-1z"
          fill="currentColor"/>
  </svg>,
};

// ─── PhotoBlock — styled placeholder ────────────────────────────────
function PhotoBlock({ aspect = '4/5', color = 'var(--accent-2)', label, children, style = {} }) {
  return (
    <div style={{
      position: 'relative',
      aspectRatio: aspect,
      background: color,
      border: '2px solid var(--ink)',
      overflow: 'hidden',
      backgroundImage: `repeating-linear-gradient(135deg, rgba(0,0,0,0.07) 0 7px, transparent 7px 14px)`,
      ...style,
    }}>
      {children}
      {label && (
        <div style={{
          position: 'absolute', bottom: 6, left: 8,
          padding: '2px 6px', background: 'var(--ink)', color: 'var(--paper)',
          fontFamily: 'var(--cf-mono)', fontSize: 8, fontWeight: 800,
          letterSpacing: '.14em', textTransform: 'uppercase',
        }}>{label}</div>
      )}
    </div>
  );
}

// ─── LiveFeed — horizontal strip of crew check-ins ──────────────────
const SAMPLE_FEED = [
  { who: 'maya',  venue: 'pretzel + IPA', when: 'now', mins: 2,
    photoColor: '#ff5b3d', caption: 'first round, she\'s late ☔',
    reactions: ['🔥', '🍻'] },
  { who: 'devon', venue: 'on the L',      when: 'now', mins: 4,
    photoColor: '#5b45d9', caption: 'two stops out',
    reactions: ['🚇'] },
  { who: 'sam',   venue: 'at lupa',       when: '8m ago', mins: 8,
    photoColor: '#f7c83b', caption: 'this carbonara, dude',
    reactions: ['🍝', '😮‍💨', '🔥'] },
];

function LiveFeed({ items = SAMPLE_FEED }) {
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
          letterSpacing: '.16em', color: 'var(--paper)', opacity: 0.85,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-1)',
            animation: 'cf-pulse 1.2s infinite',
          }} />
          CREW LIVE · {items.length}
        </span>
        <span style={{
          fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 700,
          color: 'var(--paper)', opacity: 0.5, cursor: 'pointer',
        }}>see all →</span>
      </div>
      <div style={{
        display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none',
        marginRight: -22, paddingRight: 22, paddingBottom: 4,
      }}>
        {items.map((it, i) => <FeedCard key={i} {...it} />)}
      </div>
    </div>
  );
}

function FeedCard({ who, venue, mins, photoColor, caption, reactions = [] }) {
  return (
    <div style={{
      flexShrink: 0, width: 138,
      border: '2.5px solid var(--paper)', borderRadius: 10,
      background: 'rgba(255,255,255,0.06)',
      overflow: 'hidden',
      boxShadow: '3px 3px 0 rgba(255,91,61,0.4)',
    }}>
      <PhotoBlock color={photoColor} aspect="4/5" label={venue} style={{
        border: 'none', borderBottom: '2.5px solid var(--paper)',
      }}>
        {/* fake "person" silhouette */}
        <svg width="100%" height="100%" viewBox="0 0 100 125" preserveAspectRatio="xMidYMid slice"
             style={{ position: 'absolute', inset: 0, opacity: 0.35 }}>
          <circle cx="50" cy="48" r="18" fill="rgba(0,0,0,0.4)"/>
          <path d="M20 125 C 20 95, 35 78, 50 78 S 80 95, 80 125 Z" fill="rgba(0,0,0,0.4)"/>
        </svg>
        <span style={{
          position: 'absolute', top: 6, right: 6,
          padding: '2px 6px', background: 'var(--accent-1)', color: 'var(--ink)',
          fontFamily: 'var(--cf-mono)', fontSize: 8, fontWeight: 900,
          letterSpacing: '.12em', border: '1.5px solid var(--ink)',
        }}>{mins}M</span>
      </PhotoBlock>
      <div style={{ padding: '8px 10px' }}>
        <div style={{
          fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
          color: 'var(--paper)', opacity: 0.6, letterSpacing: '.08em',
        }}>@{who}</div>
        <div style={{
          fontFamily: 'var(--cf-ui)', fontSize: 11, fontWeight: 700,
          marginTop: 3, lineHeight: 1.3, color: 'var(--paper)',
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>{caption}</div>
        {reactions.length > 0 && (
          <div style={{
            display: 'flex', gap: 4, marginTop: 6,
            fontSize: 11,
          }}>
            {reactions.map((r, i) => (
              <span key={i} style={{
                padding: '1px 5px', background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.2)', borderRadius: 999,
              }}>{r} 1</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CheckInSheet — bottom sheet for posting a check-in ─────────────
function CheckInSheet({ open, stop, crew = ['maya', 'devon', 'sam'], onClose, onPost }) {
  const [caption, setCaption] = useStateS('');
  const [tagged, setTagged] = useStateS([]);
  const [targets, setTargets] = useStateS({ feed: true, tiktok: false, ig: false, x: false });
  const [photoSwatch, setPhotoSwatch] = useStateS(0);

  useEffectS(() => {
    if (open) {
      setCaption(`live from ${stop.name.toLowerCase()}`);
      setTagged([]);
      setTargets({ feed: true, tiktok: false, ig: false, x: false });
    }
  }, [open, stop]);

  if (!open) return null;

  const toggleTarget = (k) => setTargets({ ...targets, [k]: !targets[k] });
  const toggleTag = (n) => setTagged(tagged.includes(n)
    ? tagged.filter(t => t !== n) : [...tagged, n]);

  const photoColors = ['var(--accent-1)', 'var(--accent-2)', 'var(--accent-3)', '#f8a05c'];

  const post = () => {
    onPost({ caption, tagged, targets, photoColor: photoColors[photoSwatch] });
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 60,
      display: 'flex', alignItems: 'flex-end',
      animation: 'cf-fadein 0.2s',
    }}>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)',
      }} />
      <div style={{
        position: 'relative', width: '100%',
        background: 'var(--bg)', color: 'var(--ink)',
        borderRadius: '26px 26px 0 0',
        borderTop: '3px solid var(--ink)',
        boxShadow: '0 -10px 0 var(--ink)',
        padding: '12px 20px 24px',
        maxHeight: '92%', overflowY: 'auto',
        animation: 'cf-slideup 0.32s cubic-bezier(.2,.9,.2,1)',
        scrollbarWidth: 'none',
      }}>
        {/* drag handle */}
        <div style={{
          width: 44, height: 5, borderRadius: 999,
          background: 'var(--ink)', opacity: 0.25,
          margin: '0 auto 12px',
        }} />

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 14,
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
              letterSpacing: '.16em', opacity: 0.55,
            }}>CHECK IN AT</div>
            <div style={{
              fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 22,
              letterSpacing: '-0.03em', marginTop: 2,
            }}>{stop.name}</div>
          </div>
          <button onClick={onClose} style={{
            appearance: 'none', cursor: 'pointer',
            width: 34, height: 34, borderRadius: 999,
            border: '2.5px solid var(--ink)', background: 'var(--paper)',
            fontSize: 14, fontWeight: 900, color: 'var(--ink)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        {/* Photo composer */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
          <PhotoBlock color={photoColors[photoSwatch]} aspect="4/5"
                      label={stop.tag} style={{
            flex: 1, border: '3px solid var(--ink)',
            boxShadow: '4px 4px 0 var(--ink)',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 6, color: 'var(--ink)',
            }}>
              <span style={{ opacity: 0.5 }}>{SocialIcons.camera}</span>
              <span style={{
                fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
                letterSpacing: '.12em', opacity: 0.6, textTransform: 'uppercase',
              }}>tap to snap</span>
            </div>
            <span style={{
              position: 'absolute', top: 8, left: 8,
              padding: '3px 7px', background: 'var(--paper)', color: 'var(--ink)',
              border: '2px solid var(--ink)',
              fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
              letterSpacing: '.12em', textTransform: 'uppercase',
            }}>STOP {stop.idx + 1}/3</span>
          </PhotoBlock>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8,
                        width: 64 }}>
            {photoColors.map((c, i) => (
              <button key={i} onClick={() => setPhotoSwatch(i)}
                style={{
                  appearance: 'none', cursor: 'pointer',
                  width: '100%', aspectRatio: '1', borderRadius: 8,
                  border: '2.5px solid var(--ink)', background: c,
                  boxShadow: i === photoSwatch ? '3px 3px 0 var(--ink)' : 'none',
                  transform: i === photoSwatch ? 'translate(-1px,-1px)' : 'none',
                  transition: 'all .12s',
                  position: 'relative',
                  backgroundImage: `repeating-linear-gradient(135deg, rgba(0,0,0,0.06) 0 4px, transparent 4px 8px)`,
                }}>
                {i === photoSwatch && (
                  <span style={{
                    position: 'absolute', top: 3, right: 3,
                    width: 12, height: 12, borderRadius: 999,
                    background: 'var(--ink)', color: 'var(--paper)',
                    fontSize: 8, fontWeight: 900,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>✓</span>
                )}
              </button>
            ))}
            <div style={{
              fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 700,
              letterSpacing: '.1em', textAlign: 'center', opacity: 0.5,
              marginTop: -2,
            }}>FILTER</div>
          </div>
        </div>

        {/* Caption */}
        <div style={{ marginBottom: 14 }}>
          <div style={{
            fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
            letterSpacing: '.14em', opacity: 0.55, textTransform: 'uppercase',
            marginBottom: 6,
          }}>caption</div>
          <textarea value={caption} onChange={e => setCaption(e.target.value)}
            rows={2} maxLength={140}
            style={{
              width: '100%', resize: 'none',
              padding: '10px 14px',
              border: '2.5px solid var(--ink)', borderRadius: 12,
              background: 'var(--paper)', color: 'var(--ink)',
              fontFamily: 'var(--cf-ui)', fontSize: 14, fontWeight: 700,
              outline: 'none', boxShadow: '3px 3px 0 var(--ink)',
              boxSizing: 'border-box',
            }} />
          <div style={{
            display: 'flex', justifyContent: 'flex-end',
            fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 700,
            opacity: 0.5, marginTop: 4,
          }}>{caption.length}/140</div>
        </div>

        {/* Tag crew */}
        <div style={{ marginBottom: 14 }}>
          <div style={{
            fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
            letterSpacing: '.14em', opacity: 0.55, textTransform: 'uppercase',
            marginBottom: 8,
          }}>tag crew</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {crew.map(n => (
              <Chip key={n} selected={tagged.includes(n)}
                    color="var(--accent-1)"
                    onClick={() => toggleTag(n)} dense>
                @{n}
              </Chip>
            ))}
          </div>
        </div>

        {/* Post to */}
        <div style={{ marginBottom: 18 }}>
          <div style={{
            fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
            letterSpacing: '.14em', opacity: 0.55, textTransform: 'uppercase',
            marginBottom: 8,
          }}>post to</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <PostToggle on={targets.feed}    label="confetti feed" icon={<span style={{ color: 'var(--accent-1)' }}>✣</span>}
                        on_color="var(--accent-1)" onToggle={() => toggleTarget('feed')} />
            <PostToggle on={targets.tiktok}  label="auto-clip → tiktok" icon={SocialIcons.tiktok}
                        on_color="var(--ink)" onToggle={() => toggleTarget('tiktok')} />
            <PostToggle on={targets.ig}      label="instagram story"  icon={SocialIcons.insta}
                        on_color="var(--accent-3)" onToggle={() => toggleTarget('ig')} />
            <PostToggle on={targets.x}       label="x / twitter" icon={SocialIcons.x}
                        on_color="var(--accent-2)" onToggle={() => toggleTarget('x')} />
          </div>
        </div>

        <ChunkyButton variant="accent" onClick={post} icon={Icons.arrow}>
          post check-in
        </ChunkyButton>
        <div style={{
          marginTop: 10, textAlign: 'center',
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
          opacity: 0.55,
        }}>
          + earns you a stamp toward this month's pass
        </div>
      </div>
    </div>
  );
}

function PostToggle({ on, label, icon, on_color, onToggle }) {
  return (
    <button onClick={onToggle} style={{
      appearance: 'none', cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '11px 12px',
      border: '2.5px solid var(--ink)', borderRadius: 12,
      background: on ? on_color : 'var(--paper)',
      color: on
        ? (on_color === 'var(--ink)' || on_color === 'var(--accent-3)' ? 'var(--paper)' : 'var(--ink)')
        : 'var(--ink)',
      fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 800,
      boxShadow: on ? '3px 3px 0 var(--ink)' : 'none',
      transform: on ? 'translate(-1px,-1px)' : 'none',
      transition: 'all .12s',
      textAlign: 'left',
    }}>
      <span style={{
        flexShrink: 0,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}>{icon}</span>
      <span style={{ flex: 1, lineHeight: 1.1 }}>{label}</span>
      <span style={{
        flexShrink: 0,
        width: 16, height: 16, borderRadius: 999,
        border: '2px solid currentColor',
        background: on ? 'currentColor' : 'transparent',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {on && <span style={{
          width: 6, height: 6, borderRadius: 999,
          background: on_color === 'var(--ink)' || on_color === 'var(--accent-3)' ? 'var(--paper)' : 'var(--ink)',
        }} />}
      </span>
    </button>
  );
}

// ─── PostedCard — shows your own check-in after posting ─────────────
function PostedCard({ check, stop }) {
  return (
    <div style={{
      marginTop: 12,
      border: '2.5px solid var(--accent-1)', borderRadius: 14,
      background: 'rgba(255,91,61,0.08)',
      padding: 12, color: 'var(--paper)',
      display: 'flex', gap: 12,
      animation: 'cf-pop 0.4s cubic-bezier(.2,1.4,.4,1)',
    }}>
      <PhotoBlock color={check.photoColor} aspect="1" style={{
        width: 70, height: 70, flexShrink: 0,
        border: '2.5px solid var(--paper)',
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
          letterSpacing: '.14em', color: 'var(--accent-1)',
        }}>POSTED · JUST NOW</div>
        <div style={{
          fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 700,
          marginTop: 4, lineHeight: 1.3,
        }}>{check.caption}</div>
        <div style={{
          display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap',
        }}>
          {check.targets.feed && <PostedBadge>confetti</PostedBadge>}
          {check.targets.tiktok && <PostedBadge>tiktok</PostedBadge>}
          {check.targets.ig && <PostedBadge>ig story</PostedBadge>}
          {check.targets.x && <PostedBadge>x</PostedBadge>}
          {check.tagged.length > 0 && (
            <PostedBadge>@{check.tagged.join(' @')}</PostedBadge>
          )}
        </div>
      </div>
    </div>
  );
}

function PostedBadge({ children }) {
  return (
    <span style={{
      padding: '2px 8px',
      background: 'rgba(255,255,255,0.12)',
      border: '1px solid rgba(255,255,255,0.25)',
      borderRadius: 999,
      fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 700,
      letterSpacing: '.08em', textTransform: 'uppercase',
    }}>{children}</span>
  );
}

// ─── ReelPreview — auto-cut TikTok-style vertical recap ─────────────
function ReelPreview({ stops, checkins, onPost }) {
  const [playing, setPlaying] = useStateS(true);
  const [frame, setFrame] = useStateS(0);
  const frames = stops.length;

  useEffectS(() => {
    if (!playing) return;
    const t = setInterval(() => setFrame(f => (f + 1) % frames), 1200);
    return () => clearInterval(t);
  }, [playing, frames]);

  const current = stops[frame];
  const check = checkins[frame];

  return (
    <div style={{
      border: '3px solid var(--ink)', borderRadius: 18,
      background: 'var(--paper)',
      padding: 14,
      boxShadow: '6px 6px 0 var(--ink)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <div>
          <div style={{
            fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
            letterSpacing: '.14em', opacity: 0.55,
          }}>AUTO-RECAP</div>
          <div style={{
            fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 22,
            letterSpacing: '-0.03em', marginTop: 1,
          }}>your reel · 9s</div>
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 9px',
          border: '2px solid var(--ink)', borderRadius: 999,
          background: 'var(--ink)', color: 'var(--paper)',
          fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
          letterSpacing: '.14em',
        }}>
          <span>{SocialIcons.tiktok}</span>
          READY
        </span>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        {/* 9:16 viewer */}
        <div style={{
          width: 100, flexShrink: 0,
          aspectRatio: '9/16',
          border: '2.5px solid var(--ink)', borderRadius: 10,
          background: check ? check.photoColor : current.color,
          overflow: 'hidden', position: 'relative',
          backgroundImage: `repeating-linear-gradient(135deg, rgba(0,0,0,0.07) 0 7px, transparent 7px 14px)`,
        }}>
          <div style={{
            position: 'absolute', top: 6, left: 6, right: 6,
            display: 'flex', gap: 3,
          }}>
            {stops.map((_, i) => (
              <div key={i} style={{
                flex: 1, height: 3, borderRadius: 999,
                background: 'rgba(255,255,255,0.4)',
                border: '1px solid rgba(0,0,0,0.4)',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  background: 'var(--ink)',
                  width: i < frame ? '100%' : i === frame ? '50%' : '0%',
                  transition: 'width 1.2s linear',
                }} />
              </div>
            ))}
          </div>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 4,
          }}>
            <span style={{
              fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
              letterSpacing: '.14em', opacity: 0.7,
              padding: '2px 6px', background: 'var(--ink)', color: 'var(--paper)',
            }}>STOP {frame + 1}</span>
            <span style={{
              fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 13,
              textAlign: 'center', padding: '0 6px', lineHeight: 1.1,
              color: 'var(--ink)',
              textShadow: '1px 1px 0 var(--paper)',
            }}>{current.name}</span>
          </div>
          <div style={{
            position: 'absolute', bottom: 6, left: 6, right: 6,
            display: 'flex', alignItems: 'center', gap: 4,
            fontFamily: 'var(--cf-mono)', fontSize: 8, fontWeight: 700,
            color: 'var(--ink)', opacity: 0.7,
          }}>
            <span style={{ color: 'var(--accent-1)' }}>✣</span>
            <span>confetti.app</span>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 700,
            color: 'var(--ink)', opacity: 0.85, lineHeight: 1.35,
          }}>
            We strung together your 3 check-ins with chunky type cards + the route
            map. <strong>9 seconds. Captions and music auto-set.</strong>
          </div>
          <div style={{
            display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap',
          }}>
            <ReelTag>#confetti</ReelTag>
            <ReelTag>#brooklynnight</ReelTag>
            <ReelTag>+ 4</ReelTag>
          </div>
          <div style={{
            marginTop: 10,
            fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 700,
            opacity: 0.55,
          }}>♫ track auto-picked from your vibe</div>
        </div>
      </div>

      {/* CTA row */}
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button onClick={() => setPlaying(p => !p)} style={{
          appearance: 'none', cursor: 'pointer',
          padding: '10px 14px',
          border: '2.5px solid var(--ink)', borderRadius: 12,
          background: 'var(--paper)', color: 'var(--ink)',
          fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 800,
        }}>{playing ? '⏸ pause' : '▶ play'}</button>
        <button onClick={onPost} style={{
          appearance: 'none', cursor: 'pointer', flex: 1,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '10px 14px',
          border: '2.5px solid var(--ink)', borderRadius: 12,
          background: 'var(--ink)', color: 'var(--paper)',
          fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 800,
          boxShadow: '3px 3px 0 var(--accent-1)',
        }}>
          {SocialIcons.tiktok}
          post to tiktok
        </button>
      </div>
    </div>
  );
}

function ReelTag({ children }) {
  return (
    <span style={{
      padding: '3px 8px',
      border: '1.5px solid var(--ink)', borderRadius: 999,
      background: 'var(--bg)',
      fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
      letterSpacing: '.04em', color: 'var(--ink)',
    }}>{children}</span>
  );
}

// ─── ShareRail — row of social share buttons ───────────────────────
function ShareRail({ onShare }) {
  const items = [
    { k: 'tiktok',   icon: SocialIcons.tiktok,   label: 'tiktok', color: 'var(--ink)' },
    { k: 'insta',    icon: SocialIcons.insta,    label: 'ig',     color: 'var(--accent-3)' },
    { k: 'snap',     icon: SocialIcons.snap,     label: 'snap',   color: 'var(--accent-2)' },
    { k: 'x',        icon: SocialIcons.x,        label: 'x',      color: 'var(--ink)' },
    { k: 'imessage', icon: SocialIcons.imessage, label: 'msg',    color: 'var(--accent-1)' },
    { k: 'link',     icon: SocialIcons.link,     label: 'link',   color: 'var(--paper)' },
  ];
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between' }}>
      {items.map(it => (
        <button key={it.k} onClick={() => onShare(it.k)} style={{
          appearance: 'none', cursor: 'pointer', flex: 1,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 4, padding: '10px 4px',
          border: '2.5px solid var(--ink)', borderRadius: 12,
          background: it.color,
          color: (it.color === 'var(--ink)' || it.color === 'var(--accent-3)') ? 'var(--paper)' : 'var(--ink)',
          fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
          letterSpacing: '.06em', textTransform: 'uppercase',
          boxShadow: '3px 3px 0 var(--ink)',
        }}>
          <span style={{ display: 'inline-flex' }}>{it.icon}</span>
          <span>{it.label}</span>
        </button>
      ))}
    </div>
  );
}

Object.assign(window, {
  SocialIcons, PhotoBlock, LiveFeed, CheckInSheet,
  PostedCard, ReelPreview, ShareRail,
});
