// booking.jsx — Book everything sheet + booking-status pills

const { useState: useStateBk, useEffect: useEffectBk } = React;

// Booking type registry
const BOOKING_TYPES = {
  'walk-in':     { icon: '🚶', label: 'walk-in friendly', sub: 'no booking needed', c: 'var(--accent-4)', fg: 'var(--paper)', cost: 0, action: false },
  'deposit':     { icon: '⏱', label: 'holds spot · $10 deposit', sub: 'cancel by 6 PM', c: 'var(--accent-2)', fg: 'var(--ink)', cost: 10, action: true, via: 'Stripe' },
  'ticket':      { icon: '🎟', label: 'ticket required', sub: 'non-refundable', c: 'var(--accent-3)', fg: 'var(--paper)', cost: 26, action: true, via: 'Ticketmaster' },
  'reservation': { icon: '📅', label: 'free reservation', sub: '30 min grace', c: 'var(--accent-1)', fg: 'var(--ink)', cost: 0, action: true, via: 'OpenTable' },
};

function BookingPill({ type, status }) {
  const t = BOOKING_TYPES[type] || BOOKING_TYPES['walk-in'];
  const booked = status === 'booked';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px',
      border: '1.5px solid var(--ink)', borderRadius: 6,
      background: booked ? 'var(--accent-4)' : t.c,
      color: booked ? 'var(--paper)' : t.fg,
      fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
      letterSpacing: '.08em',
    }}>
      <span style={{ fontSize: 11 }}>{booked ? '✓' : t.icon}</span>
      {booked ? 'BOOKED' : t.label.toUpperCase()}
    </span>
  );
}

function BookingSummary({ stops, onBookAll, bookedIds }) {
  const needs = stops.filter(s => BOOKING_TYPES[s.booking]?.action && !bookedIds.has(s.id));
  const total = needs.reduce((n, s) => n + (BOOKING_TYPES[s.booking]?.cost || 0), 0);
  if (!needs.length) {
    return (
      <div style={{
        padding: 12, margin: '14px 0',
        border: '2.5px solid var(--ink)', borderRadius: 12,
        background: 'var(--accent-4)', color: 'var(--paper)',
        boxShadow: '3px 3px 0 var(--ink)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 18 }}>✓</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 15 }}>
            All set · everything booked
          </div>
          <div style={{
            fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 700,
            opacity: 0.85, marginTop: 2, letterSpacing: '.08em',
          }}>JUST SHOW UP</div>
        </div>
      </div>
    );
  }
  return (
    <button onClick={onBookAll} style={{
      appearance: 'none', cursor: 'pointer', width: '100%',
      padding: 14, margin: '14px 0',
      border: '3px solid var(--ink)', borderRadius: 14,
      background: 'var(--ink)', color: 'var(--paper)',
      boxShadow: '5px 5px 0 var(--accent-1)',
      display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
    }}>
      <span style={{
        width: 44, height: 44, borderRadius: 999,
        background: 'var(--accent-1)', color: 'var(--ink)',
        border: '2px solid var(--paper)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 18,
        flexShrink: 0,
      }}>✣</span>
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
          letterSpacing: '.14em', opacity: 0.7,
        }}>{stops.length} STOPS · {needs.length} NEED ACTION</div>
        <div style={{
          fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 18,
          letterSpacing: '-0.025em', marginTop: 2,
        }}>Book everything · ${total}</div>
      </div>
      <span style={{ fontSize: 18, fontWeight: 900 }}>→</span>
    </button>
  );
}

function BookEverythingSheet({ open, stops, bookedIds, onClose, onComplete }) {
  const [phase, setPhase] = useStateBk('confirm'); // confirm | booking | done
  const [progress, setProgress] = useStateBk({});

  const needs = stops.filter(s => BOOKING_TYPES[s.booking]?.action && !bookedIds?.has?.(s.id));
  const total = needs.reduce((n, s) => n + (BOOKING_TYPES[s.booking]?.cost || 0), 0);

  useEffectBk(() => {
    if (phase !== 'booking') return;
    let active = true;
    needs.forEach((s, i) => {
      setTimeout(() => {
        if (active) setProgress(p => ({ ...p, [s.id]: 'done' }));
      }, 800 + i * 700);
    });
    const t = setTimeout(() => active && setPhase('done'),
      800 + needs.length * 700 + 400);
    return () => { active = false; clearTimeout(t); };
  }, [phase]);

  if (!open) return null;

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 70,
      display: 'flex', alignItems: 'flex-end',
      animation: 'cf-fadein 0.2s',
    }}>
      <div onClick={phase !== 'booking' ? onClose : undefined} style={{
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
          margin: '0 auto 14px',
        }} />

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 14,
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
              letterSpacing: '.16em', opacity: 0.55, textTransform: 'uppercase',
            }}>{phase === 'done' ? 'NIGHT LOCKED IN' : 'BOOK EVERYTHING'}</div>
            <div style={{
              fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 24,
              letterSpacing: '-0.03em', marginTop: 2,
            }}>{phase === 'done' ? "You're all set."
              : phase === 'booking' ? 'Booking 3 stops in parallel…'
              : 'One tap. Three bookings.'}</div>
          </div>
          {phase !== 'booking' && (
            <button onClick={onClose} style={{
              appearance: 'none', cursor: 'pointer',
              width: 34, height: 34, borderRadius: 999,
              border: '2.5px solid var(--ink)', background: 'var(--paper)',
              fontSize: 14, fontWeight: 900,
            }}>✕</button>
          )}
        </div>

        {/* List of stops */}
        <div style={{ marginBottom: 14 }}>
          {stops.map(s => {
            const t = BOOKING_TYPES[s.booking];
            const done = progress[s.id] === 'done' || phase === 'done';
            const needsAction = t?.action;
            return (
              <div key={s.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: 12, marginBottom: 8,
                border: '2.5px solid var(--ink)', borderRadius: 12,
                background: done && needsAction ? 'var(--accent-4)' : 'var(--paper)',
                color: done && needsAction ? 'var(--paper)' : 'var(--ink)',
                boxShadow: '3px 3px 0 var(--ink)',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 999,
                  border: '2.5px solid currentColor',
                  background: s.color, color: 'var(--ink)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 14,
                  flexShrink: 0,
                }}>{done && needsAction ? '✓' : t?.icon || '·'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 15,
                    letterSpacing: '-0.02em',
                  }}>{s.name}</div>
                  <div style={{
                    fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 700,
                    opacity: 0.7, marginTop: 2, letterSpacing: '.06em',
                  }}>
                    {!needsAction ? 'WALK-IN · NO BOOKING' :
                     done ? `BOOKED VIA ${t.via.toUpperCase()}` :
                     phase === 'booking' ? `BOOKING VIA ${t.via.toUpperCase()}…` :
                     `${t.via.toUpperCase()} · $${t.cost}`}
                  </div>
                </div>
                {phase === 'booking' && needsAction && !done && (
                  <div style={{ display: 'inline-flex', gap: 3 }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{
                        width: 5, height: 5, borderRadius: 999, background: 'currentColor',
                        animation: `cf-typing 1s ${i * 0.15}s infinite`,
                      }} />
                    ))}
                  </div>
                )}
                {needsAction && t && phase === 'confirm' && (
                  <span style={{
                    fontFamily: 'var(--cf-mono)', fontSize: 11, fontWeight: 800,
                  }}>${t.cost}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Total */}
        {phase === 'confirm' && (
          <div style={{
            padding: '10px 14px', marginBottom: 14,
            background: 'var(--paper)',
            border: '2px dashed var(--ink)', borderRadius: 12,
            display: 'flex', justifyContent: 'space-between',
            fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 17,
          }}>
            <span>Charge now</span><span>${total}</span>
          </div>
        )}

        {/* CTA */}
        {phase === 'confirm' && (
          <button onClick={() => setPhase('booking')} style={{
            appearance: 'none', cursor: 'pointer', width: '100%',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '16px 20px',
            border: '3px solid var(--ink)', borderRadius: 16,
            background: 'var(--accent-1)', color: 'var(--ink)',
            fontFamily: 'var(--cf-ui)', fontSize: 16, fontWeight: 900,
            boxShadow: '5px 5px 0 var(--ink)',
          }}>book everything · ${total} →</button>
        )}

        {phase === 'done' && (
          <button onClick={() => { onComplete?.(needs.map(s => s.id)); onClose(); }} style={{
            appearance: 'none', cursor: 'pointer', width: '100%',
            padding: '16px 20px',
            border: '3px solid var(--ink)', borderRadius: 16,
            background: 'var(--accent-4)', color: 'var(--paper)',
            fontFamily: 'var(--cf-ui)', fontSize: 16, fontWeight: 900,
            boxShadow: '5px 5px 0 var(--ink)',
          }}>back to my pass →</button>
        )}

        <div style={{
          marginTop: 14, padding: '10px 12px',
          background: 'var(--paper)',
          border: '1.5px dashed var(--ink)', borderRadius: 10,
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
          opacity: 0.7, lineHeight: 1.4, letterSpacing: '.04em',
        }}>
          🔒 We hit Stripe + OpenTable + Ticketmaster in parallel. If one fails the rest still book — Sparkle tells you what to do next.
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  BOOKING_TYPES, BookingPill, BookingSummary, BookEverythingSheet,
});
