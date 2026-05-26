// places.jsx — Add a Place sheet: search + manual add
// Lets users find a spot via Google Places-style search OR add one Confetti
// doesn't know about yet. Reusable from Explore, Plan, Pass screens.

const { useState: useStateP2, useEffect: useEffectP2 } = React;

// Sample search-result corpus (mocks Google Places / internal venue DB)
const PLACE_RESULTS = [
  { id: 'p1', n: "Skinny Pete's",      tag: 'dive bar',   nbhd: 'Williamsburg', dist: '0.4 mi', verified: true,  yelp: '4.4' },
  { id: 'p2', n: 'Skinny Dennis',      tag: 'dive · live music', nbhd: 'Williamsburg', dist: '0.5 mi', verified: true,  yelp: '4.3' },
  { id: 'p3', n: 'Skinny + the Wolves',tag: 'cafe',       nbhd: 'Bed-Stuy',     dist: '1.8 mi', verified: false, yelp: '4.6' },
  { id: 'p4', n: 'Skinhy Dip',         tag: 'cocktail',   nbhd: 'LES',          dist: '3.4 mi', verified: true,  yelp: '4.5' },
  { id: 'p5', n: 'Skinflint',          tag: 'thrift bar', nbhd: 'Bushwick',     dist: '1.2 mi', verified: false, yelp: '—'   },
];

function AddPlaceSheet({ open, onClose, onPick }) {
  const [q, setQ] = useStateP2('');
  const [phase, setPhase] = useStateP2('search'); // search | adding | added
  const [draft, setDraft] = useStateP2({ name: '', tag: '', addr: '', note: '' });

  useEffectP2(() => {
    if (open) { setQ(''); setPhase('search'); setDraft({ name: '', tag: '', addr: '', note: '' }); }
  }, [open]);

  if (!open) return null;

  const results = q
    ? PLACE_RESULTS.filter(p => p.n.toLowerCase().includes(q.toLowerCase()))
    : PLACE_RESULTS.slice(0, 4);

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 65,
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
        scrollbarWidth: 'none',
        animation: 'cf-slideup 0.32s cubic-bezier(.2,.9,.2,1)',
      }}>
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
              letterSpacing: '.16em', opacity: 0.55, textTransform: 'uppercase',
            }}>{phase === 'added' ? 'ADDED TO YOUR LIST' : 'ADD A PLACE'}</div>
            <div style={{
              fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 22,
              letterSpacing: '-0.025em', marginTop: 2,
            }}>{phase === 'adding' ? 'New place details'
               : phase === 'added' ? draft.name || 'Saved.'
               : 'Search or add a spot.'}</div>
          </div>
          <button onClick={onClose} style={{
            appearance: 'none', cursor: 'pointer',
            width: 34, height: 34, borderRadius: 999,
            border: '2.5px solid var(--ink)', background: 'var(--paper)',
            fontSize: 14, fontWeight: 900,
          }}>✕</button>
        </div>

        {phase === 'search' && (
          <>
            {/* Search bar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 14px',
              border: '2.5px solid var(--ink)', borderRadius: 14,
              background: 'var(--paper)',
              boxShadow: '4px 4px 0 var(--ink)',
              marginBottom: 14,
            }}>
              <span style={{ fontSize: 16, opacity: 0.6 }}>⌕</span>
              <input
                autoFocus value={q} onChange={e => setQ(e.target.value)}
                placeholder="venue name · neighborhood · cuisine"
                style={{
                  flex: 1, appearance: 'none', border: 'none',
                  outline: 'none', background: 'transparent',
                  fontFamily: 'var(--cf-ui)', fontSize: 14, fontWeight: 700,
                  color: 'var(--ink)',
                }} />
              {q && (
                <button onClick={() => setQ('')} style={{
                  appearance: 'none', cursor: 'pointer',
                  width: 20, height: 20, borderRadius: 999,
                  border: '1.5px solid var(--ink)',
                  background: 'var(--bg)', fontSize: 10, fontWeight: 900,
                }}>✕</button>
              )}
              <span style={{
                fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 700,
                opacity: 0.5, letterSpacing: '.08em',
              }}>GOOGLE · YELP</span>
            </div>

            {/* Source filters */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {['all sources', 'verified only', 'crew saved', 'near me', 'open now'].map(f => (
                <button key={f} style={{
                  appearance: 'none', cursor: 'pointer',
                  padding: '6px 12px',
                  border: '2px solid var(--ink)', borderRadius: 999,
                  background: f === 'all sources' ? 'var(--ink)' : 'var(--paper)',
                  color: f === 'all sources' ? 'var(--paper)' : 'var(--ink)',
                  fontFamily: 'var(--cf-ui)', fontSize: 11, fontWeight: 800,
                }}>{f}</button>
              ))}
            </div>

            {/* Results */}
            <div style={{
              fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
              letterSpacing: '.14em', opacity: 0.55, textTransform: 'uppercase',
              marginBottom: 8,
            }}>{results.length} RESULTS {q ? `· "${q}"` : ''}</div>

            {results.map(p => (
              <button key={p.id} onClick={() => { onPick?.(p); onClose(); }}
                style={{
                  appearance: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', marginBottom: 8,
                  border: '2.5px solid var(--ink)', borderRadius: 12,
                  background: 'var(--paper)',
                  boxShadow: '3px 3px 0 var(--ink)',
                }}>
                <span style={{
                  width: 38, height: 38, borderRadius: 8,
                  border: '2px solid var(--ink)',
                  background: p.verified ? 'var(--accent-1)' : 'var(--accent-2)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18,
                }}>📍</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 15,
                    letterSpacing: '-0.02em',
                  }}>
                    {p.n}
                    {p.verified && <span style={{
                      padding: '1px 6px',
                      background: 'var(--accent-4)', color: 'var(--paper)',
                      border: '1px solid var(--ink)', borderRadius: 4,
                      fontFamily: 'var(--cf-mono)', fontSize: 8, fontWeight: 800,
                      letterSpacing: '.08em',
                    }}>VERIFIED</span>}
                  </div>
                  <div style={{
                    fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 700,
                    opacity: 0.6, marginTop: 2, letterSpacing: '.08em',
                    textTransform: 'uppercase',
                  }}>{p.tag} · {p.nbhd} · {p.dist}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{
                    padding: '2px 6px',
                    background: '#d32323', color: '#fff',
                    border: '1.5px solid var(--ink)', borderRadius: 4,
                    fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
                    letterSpacing: '.04em',
                  }}>★ {p.yelp}</span>
                </div>
              </button>
            ))}

            {/* Add-new prompt */}
            <button onClick={() => { setPhase('adding'); setDraft({ ...draft, name: q }); }}
              style={{
                appearance: 'none', cursor: 'pointer', width: '100%',
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 14px', marginTop: 6,
                border: '2.5px dashed var(--ink)', borderRadius: 14,
                background: 'transparent',
                fontFamily: 'var(--cf-ui)', fontSize: 14, fontWeight: 800,
                color: 'var(--ink)', textAlign: 'left',
              }}>
              <span style={{
                width: 36, height: 36, borderRadius: 8,
                border: '2px dashed var(--ink)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontWeight: 900, color: 'var(--ink)',
              }}>＋</span>
              <div style={{ flex: 1 }}>
                <div>Can't find {q ? `"${q}"` : 'it'}?</div>
                <div style={{
                  fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
                  opacity: 0.6, marginTop: 2, letterSpacing: '.06em',
                }}>ADD IT TO YOUR LIST · WE'LL FIND THE REST</div>
              </div>
              <span style={{ fontSize: 18, fontWeight: 900, opacity: 0.5 }}>›</span>
            </button>
          </>
        )}

        {phase === 'adding' && (
          <>
            <PlaceField label="name" placeholder="e.g. Aunt Vivian's diner"
              value={draft.name} onChange={v => setDraft({ ...draft, name: v })} />
            <PlaceField label="type" placeholder="diner · gallery · backyard · etc."
              value={draft.tag} onChange={v => setDraft({ ...draft, tag: v })} />
            <PlaceField label="address or area" placeholder="148 Plymouth St · Dumbo"
              value={draft.addr} onChange={v => setDraft({ ...draft, addr: v })} />
            <PlaceField label="why you like it" textarea
              placeholder="vibe · what to order · best time to go"
              value={draft.note} onChange={v => setDraft({ ...draft, note: v })} />

            <div style={{
              padding: '10px 12px', marginBottom: 14,
              background: 'var(--paper)',
              border: '2px dashed var(--ink)', borderRadius: 10,
              fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
              opacity: 0.7, lineHeight: 1.5, letterSpacing: '.04em',
            }}>
              ✣ Claude will auto-pull hours, photos, and the menu when you save.
              Your note feeds the planner so it surfaces this spot at the right time.
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setPhase('search')} style={{
                appearance: 'none', cursor: 'pointer', flex: 1,
                padding: '12px 14px',
                border: '2.5px solid var(--ink)', borderRadius: 12,
                background: 'var(--paper)',
                fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 800,
              }}>← back to search</button>
              <button onClick={() => { setPhase('added'); setTimeout(onClose, 1400); }}
                disabled={!draft.name} style={{
                  appearance: 'none',
                  cursor: !draft.name ? 'not-allowed' : 'pointer',
                  flex: 1.4, padding: '12px 14px',
                  border: '2.5px solid var(--ink)', borderRadius: 12,
                  background: 'var(--accent-1)', color: 'var(--ink)',
                  fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 900,
                  boxShadow: '3px 3px 0 var(--ink)',
                  opacity: !draft.name ? 0.5 : 1,
                }}>save place →</button>
            </div>
          </>
        )}

        {phase === 'added' && (
          <div style={{ textAlign: 'center', padding: '20px 0 12px' }}>
            <div style={{
              width: 80, height: 80, borderRadius: 999,
              border: '4px solid var(--ink)', background: 'var(--accent-1)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 40,
              animation: 'cf-pop 0.4s cubic-bezier(.2,1.4,.4,1)',
              boxShadow: '5px 5px 0 var(--ink)',
            }}>✓</div>
            <div style={{
              fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 22,
              letterSpacing: '-0.025em', marginTop: 14,
            }}>{draft.name} added.</div>
            <div style={{
              fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 700,
              opacity: 0.65, marginTop: 4,
            }}>Confetti is pulling hours + photos now. You'll see it in your saved spots.</div>
          </div>
        )}
      </div>
    </div>
  );
}

function PlaceField({ label, placeholder, value, onChange, textarea }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
        letterSpacing: '.14em', opacity: 0.55, textTransform: 'uppercase',
        marginBottom: 6,
      }}>{label}</div>
      {textarea ? (
        <textarea value={value} onChange={e => onChange(e.target.value)}
          rows={2} placeholder={placeholder}
          style={{
            width: '100%', resize: 'none',
            padding: '12px 14px',
            border: '2.5px solid var(--ink)', borderRadius: 12,
            background: 'var(--paper)', color: 'var(--ink)',
            fontFamily: 'var(--cf-ui)', fontSize: 14, fontWeight: 700,
            outline: 'none', boxShadow: '3px 3px 0 var(--ink)',
            boxSizing: 'border-box',
          }} />
      ) : (
        <input value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '12px 14px',
            border: '2.5px solid var(--ink)', borderRadius: 12,
            background: 'var(--paper)', color: 'var(--ink)',
            fontFamily: 'var(--cf-ui)', fontSize: 14, fontWeight: 700,
            outline: 'none', boxShadow: '3px 3px 0 var(--ink)',
            boxSizing: 'border-box',
          }} />
      )}
    </div>
  );
}

Object.assign(window, { AddPlaceSheet });
