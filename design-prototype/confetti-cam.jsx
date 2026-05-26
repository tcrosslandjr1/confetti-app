// confetti-cam.jsx — branded promo content capture
// Confetti Cam: shoot a clip with the watermark + auto-caption + post

const { useState: useStateCC, useEffect: useEffectCC } = React;

function ConfettiCamScreen({ onBack, onPosted }) {
  const [phase, setPhase] = useStateCC('shoot'); // shoot | preview | caption | posted
  const [filter, setFilter] = useStateCC('classic');
  const [recording, setRecording] = useStateCC(false);
  const [seconds, setSeconds] = useStateCC(0);

  useEffectCC(() => {
    if (!recording) return;
    const t = setInterval(() => setSeconds(s => s + 0.1), 100);
    return () => clearInterval(t);
  }, [recording]);

  const filters = [
    { id: 'classic',  label: 'Classic', c: 'transparent' },
    { id: 'warm',     label: 'Warm',    c: 'rgba(255,91,61,0.18)' },
    { id: 'film',     label: 'Film',    c: 'rgba(247,200,59,0.16)' },
    { id: 'midnight', label: 'Midnight', c: 'rgba(11,18,32,0.36)' },
    { id: 'bw',       label: 'B&W',     c: 'rgba(0,0,0,0.35)' },
  ];

  if (phase === 'shoot') {
    return (
      <div className="cf-screen" style={{
        position: 'relative', height: '100%',
        background: '#0a0a0a', color: 'var(--paper)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* faux camera view */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at 50% 40%, #2a1a1a 0%, #0a0808 80%)',
        }} />
        <svg width="100%" height="100%" viewBox="0 0 100 175"
             preserveAspectRatio="xMidYMid slice"
             style={{ position: 'absolute', inset: 0, opacity: 0.25 }}>
          <circle cx="50" cy="60" r="22" fill="rgba(255,250,240,0.3)"/>
          <path d="M15 175 C 15 120, 30 95, 50 95 S 85 120, 85 175 Z" fill="rgba(255,250,240,0.3)"/>
          <rect x="60" y="120" width="15" height="10" fill="var(--accent-1)" opacity="0.4"/>
        </svg>
        {/* Filter overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: filters.find(f => f.id === filter).c,
          mixBlendMode: filter === 'bw' ? 'saturation' : 'normal',
        }} />

        {/* Top header */}
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
          }}>✕</button>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 12px',
            border: '2px solid var(--paper)', borderRadius: 999,
            background: 'rgba(0,0,0,0.45)',
            fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 14,
            backdropFilter: 'blur(20px)',
          }}>
            <span style={{ color: 'var(--accent-1)' }}>✣</span> confetti cam
          </div>
          <button style={{
            appearance: 'none', cursor: 'pointer',
            width: 38, height: 38, borderRadius: 999,
            border: '2px solid var(--paper)',
            background: 'rgba(0,0,0,0.4)', color: 'var(--paper)',
            fontSize: 16, fontWeight: 900,
          }}>↺</button>
        </div>

        {/* Recording timer */}
        {recording && (
          <div style={{
            position: 'absolute', top: 110, left: '50%',
            transform: 'translateX(-50%)', zIndex: 20,
            padding: '5px 12px',
            background: '#d32323', color: 'var(--paper)',
            border: '2px solid var(--paper)', borderRadius: 999,
            fontFamily: 'var(--cf-mono)', fontSize: 12, fontWeight: 800,
            letterSpacing: '.12em',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: 999, background: 'var(--paper)',
              animation: 'cf-pulse 1s infinite',
            }} />
            REC · {seconds.toFixed(1)}S
          </div>
        )}

        {/* Watermark preview */}
        <div style={{
          position: 'absolute', bottom: 200, left: 16, zIndex: 15,
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 11px',
          background: 'rgba(0,0,0,0.55)',
          border: '1.5px solid var(--paper)', borderRadius: 6,
          fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 14,
          letterSpacing: '-0.02em',
          backdropFilter: 'blur(10px)',
        }}>
          <span style={{ color: 'var(--accent-1)' }}>✣</span>
          confetti.app · #A7K2
        </div>

        {/* Filter strip */}
        <div style={{
          position: 'absolute', bottom: 130, left: 0, right: 0, zIndex: 15,
          display: 'flex', gap: 8, padding: '0 16px',
          overflowX: 'auto', scrollbarWidth: 'none',
        }}>
          {filters.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              appearance: 'none', cursor: 'pointer', flexShrink: 0,
              padding: '8px 14px',
              border: '2px solid var(--paper)', borderRadius: 999,
              background: filter === f.id ? 'var(--accent-1)' : 'rgba(0,0,0,0.45)',
              color: filter === f.id ? 'var(--ink)' : 'var(--paper)',
              fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 800,
              backdropFilter: 'blur(10px)',
            }}>{f.label}</button>
          ))}
        </div>

        {/* Capture controls */}
        <div style={{
          position: 'absolute', bottom: 40, left: 0, right: 0, zIndex: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 30px',
        }}>
          <button style={{
            appearance: 'none', cursor: 'pointer',
            width: 56, height: 56, borderRadius: 12,
            border: '2.5px solid var(--paper)',
            background: 'rgba(0,0,0,0.4)', color: 'var(--paper)',
            fontSize: 22, fontWeight: 900,
            backdropFilter: 'blur(10px)',
          }}>📷</button>

          <button onClick={() => {
            if (recording) { setRecording(false); setPhase('preview'); }
            else setRecording(true);
          }} style={{
            appearance: 'none', cursor: 'pointer',
            width: 84, height: 84, borderRadius: 999,
            border: '5px solid var(--paper)',
            background: recording ? '#d32323' : 'var(--accent-1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 0 4px rgba(255,250,240,0.2)',
          }}>
            <span style={{
              width: recording ? 22 : 64, height: recording ? 22 : 64,
              borderRadius: recording ? 4 : 999,
              background: 'var(--paper)',
              transition: 'all .2s',
            }} />
          </button>

          <button style={{
            appearance: 'none', cursor: 'pointer',
            width: 56, height: 56, borderRadius: 12,
            border: '2.5px solid var(--paper)',
            background: 'rgba(0,0,0,0.4)', color: 'var(--paper)',
            fontSize: 22, fontWeight: 900,
            backdropFilter: 'blur(10px)',
          }}>🖼</button>
        </div>
      </div>
    );
  }

  // Preview / caption
  return (
    <div className="cf-screen" style={{
      position: 'relative', height: '100%',
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      padding: '56px 22px 24px', overflow: 'hidden',
    }}>
      <DotsBg opacity={0.05} />
      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 14,
      }}>
        <button onClick={() => setPhase('shoot')} style={{
          appearance: 'none', cursor: 'pointer',
          width: 36, height: 36, borderRadius: 999,
          border: '2.5px solid var(--ink)', background: 'var(--paper)',
          fontSize: 14, fontWeight: 900,
          boxShadow: '3px 3px 0 var(--ink)',
        }}>←</button>
        <Stamp color="var(--accent-1)" rotate={-2}>preview · post</Stamp>
        <span style={{ width: 36 }} />
      </div>

      <div style={{ position: 'relative', zIndex: 2, flex: 1,
                    overflowY: 'auto', scrollbarWidth: 'none' }}>
        <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
          {/* 9:16 preview */}
          <div style={{
            width: 130, flexShrink: 0,
            aspectRatio: '9/16',
            border: '2.5px solid var(--ink)', borderRadius: 12,
            background: 'var(--accent-3)', overflow: 'hidden',
            position: 'relative',
            backgroundImage: `repeating-linear-gradient(135deg, rgba(0,0,0,0.1) 0 12px, transparent 12px 24px)`,
            boxShadow: '4px 4px 0 var(--ink)',
          }}>
            <div style={{
              position: 'absolute', bottom: 12, left: 8,
              padding: '4px 8px',
              background: 'rgba(0,0,0,0.55)', color: 'var(--paper)',
              border: '1.5px solid var(--paper)', borderRadius: 4,
              fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 9,
              letterSpacing: '-0.01em',
            }}><span style={{ color: 'var(--accent-1)' }}>✣</span> confetti.app · #A7K2</div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{
              fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 22,
              letterSpacing: '-0.025em', lineHeight: 1.1, margin: '0 0 6px',
            }}>2.4 sec clip ready.</h3>
            <div style={{
              fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
              opacity: 0.6, letterSpacing: '.08em', marginBottom: 10,
              textTransform: 'uppercase',
            }}>WARM FILTER · WATERMARKED · 9:16</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{
                padding: '4px 10px', background: 'var(--accent-2)',
                border: '2px solid var(--ink)', borderRadius: 999,
                fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
                letterSpacing: '.1em', alignSelf: 'flex-start',
              }}>STOP 2 · LUPA NOTTE</span>
              <span style={{
                padding: '4px 10px', background: 'var(--accent-1)',
                border: '2px solid var(--ink)', borderRadius: 999,
                fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
                letterSpacing: '.1em', alignSelf: 'flex-start',
              }}>+25 PTS WHEN POSTED</span>
            </div>
          </div>
        </div>

        {/* AI caption suggestions */}
        <div style={{
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
          letterSpacing: '.14em', opacity: 0.55, textTransform: 'uppercase',
          marginBottom: 8,
        }}>✣ CAPTION · SPARKLE WROTE 3 OPTIONS</div>
        {[
          { t: 'this carbonara healed me 🍝', tags: '#brooklynnight #confetti #lupa' },
          { t: 'we ate. we cried. we ate more.', tags: '#bk #datenight #carbonara' },
          { t: 'when the pass says lupa, you listen', tags: '#confettiapp #foodietok #brooklyn' },
        ].map((c, i) => (
          <div key={i} style={{
            padding: 12, marginBottom: 8,
            border: '2.5px solid var(--ink)', borderRadius: 12,
            background: i === 0 ? 'var(--accent-1)' : 'var(--paper)',
            boxShadow: i === 0 ? '3px 3px 0 var(--ink)' : 'none',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{
              width: 22, height: 22, borderRadius: 999,
              border: '2px solid var(--ink)',
              background: i === 0 ? 'var(--ink)' : 'var(--paper)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 900,
              color: i === 0 ? 'var(--paper)' : 'var(--ink)',
              flexShrink: 0,
            }}>{i === 0 ? '✓' : ''}</span>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 800,
              }}>{c.t}</div>
              <div style={{
                fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
                opacity: 0.6, marginTop: 2,
              }}>{c.tags}</div>
            </div>
          </div>
        ))}
        <button style={{
          appearance: 'none', cursor: 'pointer', width: '100%',
          padding: '10px 12px', marginBottom: 14,
          border: '2px dashed var(--ink)', borderRadius: 10,
          background: 'transparent',
          fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 800,
        }}>＋ write my own</button>

        {/* Privacy controls */}
        <div style={{
          padding: 12, marginBottom: 14,
          background: 'var(--paper)',
          border: '2px dashed var(--ink)', borderRadius: 10,
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
          letterSpacing: '.04em', lineHeight: 1.5,
        }}>
          🔒 Auto-blur faces of people not tagged · hide exact location · disable resharing
        </div>

        {/* Post-to */}
        <div style={{
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
          letterSpacing: '.14em', opacity: 0.55, textTransform: 'uppercase',
          marginBottom: 8,
        }}>POST TO</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { k: 'tiktok', label: 'TikTok', bg: 'var(--ink)', fg: 'var(--paper)', on: true },
            { k: 'ig',     label: 'Instagram', bg: 'var(--accent-3)', fg: 'var(--paper)', on: true },
            { k: 'feed',   label: 'Confetti feed', bg: 'var(--accent-1)', fg: 'var(--ink)', on: true },
            { k: 'save',   label: 'Save draft', bg: 'var(--paper)', fg: 'var(--ink)', on: false },
          ].map(p => (
            <button key={p.k} style={{
              appearance: 'none', cursor: 'pointer',
              padding: '11px 12px',
              border: '2.5px solid var(--ink)', borderRadius: 12,
              background: p.on ? p.bg : 'var(--paper)',
              color: p.on ? p.fg : 'var(--ink)',
              fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 800,
              boxShadow: p.on ? '3px 3px 0 var(--ink)' : 'none',
              transform: p.on ? 'translate(-1px,-1px)' : 'none',
              textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{
                width: 16, height: 16, borderRadius: 999,
                background: p.on ? 'currentColor' : 'transparent',
                border: '2px solid currentColor',
              }} />
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 2, paddingTop: 14 }}>
        <ChunkyButton variant="accent" onClick={onPosted} icon={Icons.arrow}>
          post + earn 25 pts
        </ChunkyButton>
      </div>
    </div>
  );
}

Object.assign(window, { ConfettiCamScreen });
