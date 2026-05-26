// draft.jsx — Draft pass tray (accumulate stops from Explore/Reels/Events)

const { useState: useStateDr, useEffect: useEffectDr } = React;

function DraftTrayPill({ stops = [], onOpen }) {
  if (!stops.length) return null;
  return (
    <button onClick={onOpen} style={{
      position: 'absolute', left: '50%', bottom: 84, zIndex: 28,
      transform: 'translateX(-50%)',
      appearance: 'none', cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', gap: 10,
      padding: '8px 8px 8px 14px',
      border: '2.5px solid var(--ink)', borderRadius: 999,
      background: 'var(--accent-1)', color: 'var(--ink)',
      fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 900,
      boxShadow: '4px 4px 0 var(--ink)',
      animation: 'cf-pop 0.3s',
    }}>
      <span style={{ display: 'flex' }}>
        {stops.slice(0, 3).map((s, i) => (
          <span key={i} style={{
            width: 22, height: 22, borderRadius: 999,
            border: '2px solid var(--ink)',
            background: s.color || ['var(--accent-2)', 'var(--accent-3)', 'var(--paper)'][i],
            marginLeft: i > 0 ? -8 : 0,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 10,
            color: 'var(--ink)',
          }}>{i + 1}</span>
        ))}
      </span>
      draft pass · {stops.length} stop{stops.length !== 1 ? 's' : ''}
      <span style={{
        padding: '4px 9px',
        background: 'var(--ink)', color: 'var(--paper)',
        borderRadius: 999, fontSize: 12, fontWeight: 900,
      }}>review →</span>
    </button>
  );
}

function DraftTraySheet({ open, stops, onClose, onRemove, onFillWithClaude, onClear }) {
  if (!open) return null;
  const total = stops.reduce((n, s) => n + (parseFloat((s.cost || '0').replace(/[^0-9.]/g, '')) || 0), 0);
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 70,
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
            }}>DRAFT PASS · {stops.length} stop{stops.length !== 1 ? 's' : ''}</div>
            <div style={{
              fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 22,
              letterSpacing: '-0.025em', marginTop: 2,
            }}>Building a night.</div>
          </div>
          <button onClick={onClose} style={{
            appearance: 'none', cursor: 'pointer',
            width: 34, height: 34, borderRadius: 999,
            border: '2.5px solid var(--ink)', background: 'var(--paper)',
            fontSize: 14, fontWeight: 900,
          }}>✕</button>
        </div>

        {/* Stops */}
        <div style={{
          padding: 14, marginBottom: 14,
          border: '2.5px solid var(--ink)', borderRadius: 14,
          background: 'var(--paper)',
          boxShadow: '4px 4px 0 var(--ink)',
        }}>
          {stops.map((s, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 0',
              borderBottom: i < stops.length - 1 ? '1.5px dashed rgba(0,0,0,0.15)' : 'none',
            }}>
              <span style={{
                width: 30, height: 30, borderRadius: 999,
                border: '2px solid var(--ink)',
                background: s.color || 'var(--accent-2)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 13,
                color: 'var(--ink)', flexShrink: 0,
              }}>{i + 1}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 14,
                  letterSpacing: '-0.02em', lineHeight: 1.1,
                }}>{s.name || s.n}</div>
                <div style={{
                  fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 700,
                  opacity: 0.55, marginTop: 2, letterSpacing: '.06em',
                  textTransform: 'uppercase',
                }}>{s.tag || s.nbhd || 'venue'}</div>
              </div>
              {s.cost && <span style={{
                fontFamily: 'var(--cf-mono)', fontSize: 11, fontWeight: 800,
              }}>{s.cost}</span>}
              <button onClick={() => onRemove?.(i)} style={{
                appearance: 'none', cursor: 'pointer',
                width: 22, height: 22, borderRadius: 999,
                border: '1.5px solid var(--ink)', background: 'var(--paper)',
                fontSize: 10, fontWeight: 900, color: 'var(--ink)',
              }}>✕</button>
            </div>
          ))}
        </div>

        {/* Status / advice */}
        <div style={{
          padding: 14, marginBottom: 14,
          border: '2.5px solid var(--ink)', borderRadius: 14,
          background: 'var(--accent-2)',
          boxShadow: '4px 4px 0 var(--ink)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
            letterSpacing: '.14em', opacity: 0.7, textTransform: 'uppercase',
            marginBottom: 4,
          }}><span style={{ color: 'var(--accent-1)' }}>✣</span> SPARKLE SAYS</div>
          <div style={{
            fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 800,
            lineHeight: 1.35,
          }}>
            {stops.length === 1 && 'Solid start. 2 more stops makes a real night.'}
            {stops.length === 2 && 'Almost there. One more stop balances the route and budget.'}
            {stops.length >= 3 && `${stops.length} stops, ~$${total || '92'} estimated. Ready to print.`}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={onFillWithClaude} style={{
            appearance: 'none', cursor: 'pointer', width: '100%',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '14px 18px',
            border: '3px solid var(--ink)', borderRadius: 14,
            background: 'var(--accent-1)', color: 'var(--ink)',
            fontFamily: 'var(--cf-ui)', fontSize: 15, fontWeight: 900,
            boxShadow: '4px 4px 0 var(--ink)',
          }}>
            ✣ fill the rest with sparkle →
          </button>
          <button onClick={onClear} style={{
            appearance: 'none', cursor: 'pointer',
            padding: '10px 14px',
            border: '2px solid var(--ink)', borderRadius: 12,
            background: 'var(--paper)',
            fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 800,
          }}>clear draft</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DraftTrayPill, DraftTraySheet });
