// stripe.jsx — Stripe-styled subscription checkout
// 3 phases: card entry → processing → success
// Honors the existing brutalist palette but borrows Stripe's chrome cues

const { useState: useStateSt, useEffect: useEffectSt } = React;

function StripeCheckoutScreen({ plan = 'yearly', onBack, onSuccess }) {
  const [phase, setPhase] = useStateSt('card'); // card | processing | success
  const [card, setCard] = useStateSt({ num: '', mmyy: '', cvc: '', zip: '' });
  const [email, setEmail] = useStateSt('jess@brooklyn.com');
  const [method, setMethod] = useStateSt('card');

  const priceLabel = plan === 'yearly' ? '$99.00' : '$9.99';
  const planLabel = plan === 'yearly' ? '1 year of All-Access' : '1 month of All-Access';
  const renewLabel = plan === 'yearly' ? 'auto-renews May 24, 2027 · $99/yr'
                                       : 'auto-renews Jun 24, 2026 · $9.99/mo';

  const submit = () => {
    setPhase('processing');
    setTimeout(() => setPhase('success'), 2200);
  };

  if (phase === 'success') {
    return (
      <div className="cf-screen" style={{
        position: 'relative', height: '100%',
        background: 'var(--bg)',
        display: 'flex', flexDirection: 'column',
        padding: '70px 24px 36px', overflow: 'hidden',
      }}>
        <DotsBg opacity={0.06} />
        <FloatingTickets density={4} />
        <div style={{
          position: 'relative', zIndex: 2,
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 18, textAlign: 'center',
        }}>
          <div style={{
            width: 100, height: 100, borderRadius: 999,
            border: '4px solid var(--ink)', background: 'var(--accent-1)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 50,
            boxShadow: '5px 5px 0 var(--ink)',
            animation: 'cf-pop 0.4s cubic-bezier(.2,1.4,.4,1)',
          }}>✓</div>
          <Stamp color="var(--accent-2)" rotate={-3}>all-access · active</Stamp>
          <h1 style={{
            fontFamily: 'var(--cf-display)', fontWeight: 900,
            fontSize: 40, lineHeight: 0.92, letterSpacing: '-0.04em',
            color: 'var(--ink)', margin: 0,
          }}>You're in.</h1>
          <Ticket color="var(--paper)" notch={false} style={{
            padding: 14, textAlign: 'left', width: '100%',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              paddingBottom: 10, borderBottom: '2px dashed rgba(0,0,0,0.18)',
            }}>
              <div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
                  letterSpacing: '.14em', opacity: 0.55,
                }}>
                  <svg width="32" height="14" viewBox="0 0 60 24" fill="none">
                    <rect width="60" height="24" rx="3" fill="#635BFF"/>
                    <text x="6" y="17" fontFamily="Helvetica" fontWeight="900" fontSize="13" fill="#fff">stripe</text>
                  </svg>
                  · PAID
                </div>
                <div style={{
                  fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 18,
                  letterSpacing: '-0.025em', marginTop: 4,
                }}>{planLabel}</div>
              </div>
              <div style={{
                fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 22,
                letterSpacing: '-0.03em',
              }}>{priceLabel}</div>
            </div>
            <div style={{
              marginTop: 10,
              fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
              opacity: 0.65, lineHeight: 1.4, letterSpacing: '.04em',
            }}>
              {renewLabel}<br/>
              receipt · pi_3OXk2eL19jp · email sent
            </div>
          </Ticket>
          <ChunkyButton variant="accent" onClick={onSuccess} icon={Icons.arrow}>
            start planning
          </ChunkyButton>
        </div>
      </div>
    );
  }

  if (phase === 'processing') {
    return (
      <div className="cf-screen" style={{
        position: 'relative', height: '100%',
        background: 'var(--bg)',
        display: 'flex', flexDirection: 'column',
        padding: '70px 24px 36px', overflow: 'hidden',
      }}>
        <DotsBg opacity={0.06} />
        <div style={{
          position: 'relative', zIndex: 2,
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 18, textAlign: 'center',
        }}>
          <svg width="60" height="24" viewBox="0 0 60 24" fill="none">
            <rect width="60" height="24" rx="3" fill="#635BFF"/>
            <text x="6" y="17" fontFamily="Helvetica" fontWeight="900" fontSize="13" fill="#fff">stripe</text>
          </svg>
          <div style={{
            fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 28,
            letterSpacing: '-0.04em',
          }}>Processing…</div>
          <div style={{ display: 'inline-flex', gap: 6 }}>
            {[0, 1, 2].map(i => (
              <span key={i} style={{
                width: 10, height: 10, borderRadius: 999, background: 'var(--ink)',
                animation: `cf-typing 1s ${i * 0.15}s infinite`,
              }} />
            ))}
          </div>
          <div style={{
            fontFamily: 'var(--cf-mono)', fontSize: 11, fontWeight: 700,
            opacity: 0.55, letterSpacing: '.1em', maxWidth: 260,
          }}>SECURE · 3D-SECURE VERIFIED · PCI-DSS</div>
        </div>
      </div>
    );
  }

  return (
    <div className="cf-screen" style={{
      position: 'relative', height: '100%',
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      padding: '56px 22px 22px', overflow: 'hidden',
    }}>
      <DotsBg opacity={0.05} />
      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 14,
      }}>
        <button onClick={onBack} style={{
          appearance: 'none', cursor: 'pointer',
          width: 36, height: 36, borderRadius: 999,
          border: '2.5px solid var(--ink)', background: 'var(--paper)',
          fontSize: 14, fontWeight: 900,
          boxShadow: '3px 3px 0 var(--ink)',
        }}>←</button>
        <svg width="60" height="24" viewBox="0 0 60 24" fill="none">
          <rect width="60" height="24" rx="3" fill="#635BFF"/>
          <text x="6" y="17" fontFamily="Helvetica" fontWeight="900" fontSize="13" fill="#fff">stripe</text>
        </svg>
        <span style={{
          padding: '4px 10px',
          background: 'var(--accent-4)', color: 'var(--paper)',
          border: '2px solid var(--ink)', borderRadius: 999,
          fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
          letterSpacing: '.12em',
        }}>🔒 SECURE</span>
      </div>

      <div style={{
        position: 'relative', zIndex: 2, flex: 1,
        overflowY: 'auto', scrollbarWidth: 'none',
      }}>
        {/* Plan summary */}
        <div style={{
          padding: 14, marginBottom: 16,
          border: '2.5px solid var(--ink)', borderRadius: 14,
          background: 'var(--accent-1)', color: 'var(--ink)',
          boxShadow: '4px 4px 0 var(--ink)',
        }}>
          <div style={{
            fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
            letterSpacing: '.14em', opacity: 0.7, textTransform: 'uppercase',
          }}>CONFETTI ALL-ACCESS</div>
          <div style={{
            display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
            marginTop: 4,
          }}>
            <div style={{
              fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 28,
              letterSpacing: '-0.035em', lineHeight: 1,
            }}>{planLabel}</div>
            <div style={{
              fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 32,
              letterSpacing: '-0.04em',
            }}>{priceLabel}</div>
          </div>
          <div style={{
            fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
            opacity: 0.75, marginTop: 8, letterSpacing: '.06em',
          }}>7-day free trial · charged {plan === 'yearly' ? 'May 31' : 'May 31'} unless cancelled</div>
        </div>

        {/* Payment method tabs */}
        <div style={{
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
          letterSpacing: '.14em', opacity: 0.55, textTransform: 'uppercase',
          marginBottom: 8,
        }}>PAY WITH</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {[
            { id: 'apple', l: '🍎 Apple Pay', bg: 'var(--ink)', fg: 'var(--paper)' },
            { id: 'gpay',  l: 'G Pay',        bg: 'var(--paper)', fg: 'var(--ink)' },
            { id: 'card',  l: '💳 Card',      bg: 'var(--paper)', fg: 'var(--ink)' },
            { id: 'link',  l: '· Link',       bg: 'var(--paper)', fg: 'var(--ink)' },
          ].map(p => (
            <button key={p.id} onClick={() => setMethod(p.id)} style={{
              appearance: 'none', cursor: 'pointer', flex: 1,
              padding: '10px 6px',
              border: '2.5px solid var(--ink)', borderRadius: 12,
              background: method === p.id ? (p.id === 'apple' ? 'var(--ink)' : 'var(--accent-2)') : p.bg,
              color: method === p.id && p.id !== 'apple' ? 'var(--ink)' : p.fg,
              fontFamily: 'var(--cf-ui)', fontSize: 11, fontWeight: 800,
              boxShadow: method === p.id ? '3px 3px 0 var(--ink)' : 'none',
              transform: method === p.id ? 'translate(-1px,-1px)' : 'none',
              transition: 'all .12s',
            }}>{p.l}</button>
          ))}
        </div>

        {method === 'card' && (
          <>
            {/* Card form */}
            <StripeField label="email" value={email} onChange={setEmail}
              placeholder="receipt goes here" />
            <StripeField label="card number" value={card.num}
              onChange={v => setCard({ ...card, num: v })}
              placeholder="1234 5678 9012 3456"
              suffix={<CardBrands />} />
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <StripeField label="MM / YY" value={card.mmyy}
                  onChange={v => setCard({ ...card, mmyy: v })}
                  placeholder="08 / 28" />
              </div>
              <div style={{ flex: 1 }}>
                <StripeField label="CVC" value={card.cvc}
                  onChange={v => setCard({ ...card, cvc: v })}
                  placeholder="•••" />
              </div>
              <div style={{ flex: 1 }}>
                <StripeField label="ZIP" value={card.zip}
                  onChange={v => setCard({ ...card, zip: v })}
                  placeholder="11211" />
              </div>
            </div>

            <label style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', marginTop: 4, marginBottom: 14,
              border: '2px solid var(--ink)', borderRadius: 10,
              background: 'var(--paper)', cursor: 'pointer',
            }}>
              <span style={{
                width: 22, height: 22, borderRadius: 6,
                border: '2px solid var(--ink)', background: 'var(--accent-1)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 900, color: 'var(--ink)', flexShrink: 0,
              }}>✓</span>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 800,
                }}>Save card for future passes</div>
                <div style={{
                  fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 700,
                  opacity: 0.55, marginTop: 2, letterSpacing: '.06em',
                }}>STRIPE TOKENIZED · WE NEVER SEE NUMBERS</div>
              </div>
            </label>
          </>
        )}

        {method !== 'card' && (
          <div style={{
            padding: 20, marginBottom: 14,
            border: '2.5px dashed var(--ink)', borderRadius: 14,
            background: 'var(--paper)', textAlign: 'center',
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>
              {method === 'apple' ? '🍎' : method === 'gpay' ? 'G' : '·'}
            </div>
            <div style={{
              fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 18,
              letterSpacing: '-0.025em',
            }}>Tap to confirm with {method === 'apple' ? 'Apple Pay' : method === 'gpay' ? 'Google Pay' : 'Stripe Link'}</div>
            <div style={{
              fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
              opacity: 0.6, marginTop: 6, letterSpacing: '.06em',
            }}>FACE ID · NO CARD ENTRY NEEDED</div>
          </div>
        )}

        {/* Total */}
        <div style={{
          padding: 14, marginBottom: 14,
          border: '2px dashed var(--ink)', borderRadius: 12,
          background: 'var(--paper)',
        }}>
          {[
            ['All-Access · ' + (plan === 'yearly' ? 'yearly' : 'monthly'), priceLabel],
            ['7-day free trial credit', '-' + priceLabel],
            ['Tax (NY)', '$0.00'],
          ].map((row, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '5px 0', fontFamily: 'var(--cf-ui)', fontSize: 13,
              fontWeight: i === 1 ? 700 : 600,
              color: i === 1 ? 'var(--accent-4, #2bb673)' : 'var(--ink)',
            }}>
              <span>{row[0]}</span><span style={{ fontFamily: 'var(--cf-mono)' }}>{row[1]}</span>
            </div>
          ))}
          <div style={{
            marginTop: 6, paddingTop: 8,
            borderTop: '2px solid var(--ink)',
            display: 'flex', justifyContent: 'space-between',
            fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 18,
          }}>
            <span>Today</span><span>$0.00</span>
          </div>
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 2, paddingTop: 12 }}>
        <button onClick={submit} style={{
          appearance: 'none', cursor: 'pointer', width: '100%',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '16px 20px',
          border: '3px solid var(--ink)', borderRadius: 16,
          background: '#635BFF', color: 'var(--paper)',
          fontFamily: 'var(--cf-ui)', fontSize: 16, fontWeight: 900,
          boxShadow: '5px 5px 0 var(--ink)',
        }}>
          {method === 'apple' ? '🍎  Pay with Apple Pay'
           : method === 'gpay' ? 'Pay with G Pay'
           : `Start free trial · then ${priceLabel}/${plan === 'yearly' ? 'yr' : 'mo'}`}
        </button>
        <div style={{
          marginTop: 10, textAlign: 'center',
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
          opacity: 0.6, letterSpacing: '.06em',
        }}>🔒 STRIPE · 3D-SECURE · CANCEL FROM SETTINGS · TERMS APPLY</div>
      </div>
    </div>
  );
}

function StripeField({ label, value, onChange, placeholder, suffix }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{
        fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
        letterSpacing: '.14em', opacity: 0.55, textTransform: 'uppercase',
        marginBottom: 4,
      }}>{label}</div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 12px',
        border: '2.5px solid var(--ink)', borderRadius: 12,
        background: 'var(--paper)',
        boxShadow: '3px 3px 0 var(--ink)',
      }}>
        <input value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            flex: 1, appearance: 'none', border: 'none',
            outline: 'none', background: 'transparent',
            fontFamily: 'var(--cf-ui)', fontSize: 14, fontWeight: 700,
            color: 'var(--ink)', minWidth: 0,
          }} />
        {suffix}
      </div>
    </div>
  );
}

function CardBrands() {
  return (
    <div style={{ display: 'inline-flex', gap: 4 }}>
      {[
        { l: 'VISA',  c: '#1A1F71' },
        { l: 'MC',    c: '#EB001B' },
        { l: 'AMEX',  c: '#006FCF' },
      ].map(b => (
        <span key={b.l} style={{
          padding: '2px 5px',
          background: b.c, color: '#fff',
          border: '1.5px solid var(--ink)', borderRadius: 3,
          fontFamily: 'Helvetica', fontSize: 8, fontWeight: 900,
          letterSpacing: '.02em',
        }}>{b.l}</span>
      ))}
    </div>
  );
}

Object.assign(window, { StripeCheckoutScreen });
