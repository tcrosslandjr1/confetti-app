// flipcard.jsx — Per-stop flipcard with fetched details on the back
// Tap the stop to flip; back shows live intel from Yelp/TikTok/Google/Sparkle

const { useState: useStateFc } = React;

function StopFlipCard({ stop, index, isLast }) {
  const [flipped, setFlipped] = useStateFc(false);

  return (
    <div style={{
      display: 'flex', gap: 12,
      paddingBottom: isLast ? 0 : 14,
      marginBottom: isLast ? 0 : 14,
      borderBottom: isLast ? 'none' : '1.5px dashed rgba(0,0,0,0.15)',
    }}>
      {/* Number rail */}
      <div style={{
        width: 36, display: 'flex', flexDirection: 'column',
        alignItems: 'center', flexShrink: 0,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 999,
          border: '2.5px solid var(--ink)', background: stop.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 18,
          color: 'var(--ink)',
        }}>{index + 1}</div>
        {!isLast && (
          <div style={{
            flex: 1, width: 3, marginTop: 6, marginBottom: -8,
            background: `repeating-linear-gradient(180deg, var(--ink) 0, var(--ink) 3px, transparent 3px, transparent 7px)`,
          }} />
        )}
      </div>

      {/* Flipping card */}
      <div style={{
        flex: 1, minWidth: 0, perspective: 1000,
      }}>
        <div style={{
          position: 'relative', width: '100%',
          transformStyle: 'preserve-3d',
          transition: 'transform .6s cubic-bezier(.4,1.2,.4,1)',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0)',
        }}>
          {/* FRONT */}
          <button onClick={() => setFlipped(true)} style={{
            appearance: 'none', cursor: 'pointer', width: '100%',
            background: 'transparent', border: 'none', padding: 0,
            textAlign: 'left', backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}>
            <FrontFace stop={stop} />
          </button>

          {/* BACK */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}>
            <BackFace stop={stop} onFlip={() => setFlipped(false)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function FrontFace({ stop }) {
  return (
    <div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', gap: 8,
        alignItems: 'flex-start',
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            display: 'flex', alignItems: 'baseline', gap: 8,
            fontFamily: 'var(--cf-mono)', fontSize: 11, fontWeight: 800,
            letterSpacing: '.1em', opacity: 0.6,
          }}>
            <span>{stop.time} PM</span>
            <span>·</span>
            <span style={{ textTransform: 'uppercase' }}>{stop.tag}</span>
          </div>
          <div style={{
            fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 20,
            letterSpacing: '-0.025em', color: 'var(--ink)', marginTop: 2,
          }}>{stop.name}</div>
          <div style={{
            fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 600,
            color: 'var(--ink)', opacity: 0.65, marginTop: 2,
          }}>{stop.sub}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{
            fontFamily: 'var(--cf-mono)', fontSize: 11, fontWeight: 800,
          }}>{stop.cost}</div>
          <div style={{
            fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
            opacity: 0.5, marginTop: 2,
          }}>{stop.dur}</div>
        </div>
      </div>

      {stop.booking && typeof BookingPill !== 'undefined' && (
        <div style={{ marginTop: 6 }}>
          <BookingPill type={stop.booking} status="unbooked" />
        </div>
      )}

      {stop.vibe && (
        <div style={{
          marginTop: 8,
          display: 'flex', flexWrap: 'wrap', gap: 4,
        }}>
          {stop.vibe.split(' · ').map(v => (
            <span key={v} style={{
              padding: '2px 7px',
              background: 'var(--bg)',
              border: '1.5px solid var(--ink)', borderRadius: 4,
              fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
              letterSpacing: '.06em', color: 'var(--ink)',
            }}>{v}</span>
          ))}
        </div>
      )}

      {stop.mustOrder && (
        <div style={{
          marginTop: 8, padding: '6px 10px',
          background: 'var(--accent-2)',
          border: '1.5px solid var(--ink)', borderRadius: 8,
          fontFamily: 'var(--cf-ui)', fontSize: 11, fontWeight: 800,
          color: 'var(--ink)', lineHeight: 1.35,
        }}>
          <span style={{
            fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
            letterSpacing: '.12em', opacity: 0.6, textTransform: 'uppercase',
            marginRight: 5,
          }}>★ must-order</span>
          {stop.mustOrder}
        </div>
      )}

      <div style={{
        marginTop: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 8,
      }}>
        {stop.walkNext ? (
          <div style={{
            fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
            color: 'var(--ink)', opacity: 0.65, letterSpacing: '.04em',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ color: 'var(--accent-1)' }}>↓</span>
            <span>{stop.walkNext}</span>
          </div>
        ) : <span />}
        <span style={{
          padding: '3px 9px',
          background: 'var(--paper)',
          border: '1.5px solid var(--ink)', borderRadius: 999,
          fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
          letterSpacing: '.1em', textTransform: 'uppercase',
          display: 'inline-flex', alignItems: 'center', gap: 4,
        }}>tap for intel ↻</span>
      </div>
    </div>
  );
}

function BackFace({ stop, onFlip }) {
  // Per-stop fetched detail (mocked — would come from Yelp + Google + TikTok)
  const intel = {
    1: { // Skinny Pete's
      yelp: '4.4', reviews: 612, photos: ['🍺', '🥨', '🎸'],
      crowd: '~30% full', wait: '0 min',
      dress: 'Whatever · no dress code',
      bath: '2 unisex · clean',
      parking: 'Wythe Ave free parking',
      tip: "Bartender's name is Dee. Tell her Maya sent you.",
      tikSaves: 18,
    },
    2: { // Lupa Notte
      yelp: '4.7', reviews: 380, photos: ['🍝', '🕯', '🍷'],
      crowd: '~74% full · packed by 9 PM',
      wait: '12 min if walk-in',
      dress: 'Smart casual · no shorts',
      bath: '1 floor up · narrow stairs',
      parking: 'Valet $35 · L2 charger',
      tip: "Counter seats > tables. Ask for Marco's section.",
      tikSaves: 247,
    },
    3: { // Quartz Room
      yelp: '4.4', reviews: 1620, photos: ['🎤', '🎸', '🥁'],
      crowd: 'Doors at 10 · set 11',
      wait: 'Standing room · arrive 10:45',
      dress: 'Comfortable · closed-toe',
      bath: 'Down a flight · long lines',
      parking: 'Street only · 0.2 mi',
      tip: 'Pearl Charles plays 35 min · merch table to left of stage.',
      tikSaves: 64,
    },
  }[stop.id] || {};

  return (
    <div style={{
      padding: 12,
      background: 'var(--ink)', color: 'var(--paper)',
      border: '2.5px solid var(--ink)', borderRadius: 14,
      boxShadow: '3px 3px 0 var(--accent-1)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <div>
          <div style={{
            fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
            letterSpacing: '.14em', opacity: 0.7,
          }}>FETCHED INTEL · {stop.name.toUpperCase()}</div>
          <div style={{
            fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 17,
            letterSpacing: '-0.025em', marginTop: 2,
          }}>What you'll actually find.</div>
        </div>
        <button onClick={onFlip} style={{
          appearance: 'none', cursor: 'pointer',
          width: 30, height: 30, borderRadius: 999,
          border: '2px solid var(--paper)', background: 'transparent',
          color: 'var(--paper)', fontSize: 11, fontWeight: 900,
        }}>↺</button>
      </div>

      {/* Sources row */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        <span style={{
          padding: '2px 7px', background: '#d32323', color: '#fff',
          border: '1.5px solid var(--paper)', borderRadius: 4,
          fontFamily: 'var(--cf-mono)', fontSize: 8, fontWeight: 900,
        }}>YELP {intel.yelp} · {intel.reviews}</span>
        <span style={{
          padding: '2px 7px', background: 'var(--ink)', color: 'var(--paper)',
          border: '1.5px solid var(--paper)', borderRadius: 4,
          fontFamily: 'var(--cf-mono)', fontSize: 8, fontWeight: 900,
        }}>♪ TT · {intel.tikSaves} SAVES</span>
        <span style={{
          padding: '2px 7px', background: 'var(--accent-2)', color: 'var(--ink)',
          border: '1.5px solid var(--paper)', borderRadius: 4,
          fontFamily: 'var(--cf-mono)', fontSize: 8, fontWeight: 900,
        }}>GOOGLE · LIVE</span>
      </div>

      {/* Photo strip */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 10,
      }}>
        {intel.photos?.map((p, i) => (
          <div key={i} style={{
            flex: 1, aspectRatio: '1',
            background: ['var(--accent-1)', 'var(--accent-2)', 'var(--accent-3)'][i],
            border: '1.5px solid var(--paper)', borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
            backgroundImage: `repeating-linear-gradient(135deg, rgba(0,0,0,0.1) 0 6px, transparent 6px 12px)`,
          }}>{p}</div>
        ))}
      </div>

      {/* Detail rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <DetailRow k="crowd" v={intel.crowd} />
        <DetailRow k="wait" v={intel.wait} />
        <DetailRow k="dress" v={intel.dress} />
        <DetailRow k="bathrooms" v={intel.bath} />
        <DetailRow k="parking" v={intel.parking} />
      </div>

      {/* Pro tip */}
      <div style={{
        marginTop: 10, padding: '8px 10px',
        background: 'var(--accent-1)', color: 'var(--ink)',
        border: '1.5px solid var(--paper)', borderRadius: 8,
      }}>
        <div style={{
          fontFamily: 'var(--cf-mono)', fontSize: 8, fontWeight: 800,
          letterSpacing: '.12em', opacity: 0.7,
        }}>✣ SPARKLE TIP</div>
        <div style={{
          fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 800,
          marginTop: 2, lineHeight: 1.35,
        }}>{intel.tip}</div>
      </div>
    </div>
  );
}

function DetailRow({ k, v }) {
  return (
    <div style={{
      display: 'flex', gap: 8, alignItems: 'baseline',
      padding: '4px 0',
      fontFamily: 'var(--cf-ui)', fontSize: 12,
    }}>
      <span style={{
        fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
        letterSpacing: '.12em', opacity: 0.65, textTransform: 'uppercase',
        width: 70, flexShrink: 0,
      }}>{k}</span>
      <span style={{ fontWeight: 700, flex: 1, opacity: 0.95 }}>{v}</span>
    </div>
  );
}

Object.assign(window, { StopFlipCard });
