// more.jsx — Additional pages from the sitemap
// Trips list · QR check-in · Checkout return · Referral capture
// About · Privacy · Events (list + detail) · Influencer · For-business

const { useState: useStateM, useEffect: useEffectM } = React;

// ═════════════════════════════════════════════════════════════════
// 1. Trips list (/trips)
// ═════════════════════════════════════════════════════════════════
function TripsListScreen({ onBack, onOpen }) {
  const [filter, setFilter] = useStateM('all');
  const trips = [
    { id: 'A7K2', date: 'Sat May 23', n: "Brooklyn date night",
      stops: 3, cost: 92, status: 'active', vibe: 'foodie · chill',
      c: 'var(--accent-1)' },
    { id: 'J3M1', date: 'Fri May 16', n: "Bushwick crawl",
      stops: 4, cost: 48, status: 'past', vibe: 'hype · weird',
      c: 'var(--accent-2)' },
    { id: 'R8X2', date: 'Sat May 10', n: "LES date night",
      stops: 3, cost: 92, status: 'past', vibe: 'romantic',
      c: 'var(--accent-1)' },
    { id: 'P9N4', date: 'Thu May 1', n: "Solo culture day",
      stops: 2, cost: 26, status: 'past', vibe: 'cultural',
      c: 'var(--accent-3)' },
    { id: 'X4K9', date: 'Fri Jun 5', n: "Crew night out",
      stops: 4, cost: 0, status: 'draft', vibe: 'tbd',
      c: 'var(--accent-2)' },
  ];
  const visible = filter === 'all' ? trips : trips.filter(t => t.status === filter);

  return (
    <div className="cf-screen" style={{
      position: 'relative', height: '100%',
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      padding: '56px 22px 24px',
      overflow: 'hidden',
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
        <BrandMark size={16} />
        <span style={{ width: 36 }} />
      </div>

      <h2 style={{
        position: 'relative', zIndex: 2,
        fontFamily: 'var(--cf-display)', fontWeight: 900,
        fontSize: 36, lineHeight: 0.95, letterSpacing: '-0.04em',
        margin: '0 0 4px',
      }}>Your trips.</h2>
      <div style={{
        position: 'relative', zIndex: 2,
        fontFamily: 'var(--cf-mono)', fontSize: 11, fontWeight: 700,
        opacity: 0.55, letterSpacing: '.12em',
        marginBottom: 12, textTransform: 'uppercase',
      }}>18 NIGHTS · 1 ACTIVE · 1 DRAFT</div>

      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', gap: 6, marginBottom: 14,
      }}>
        {['all', 'active', 'past', 'draft'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            appearance: 'none', cursor: 'pointer', flex: 1,
            padding: '8px 6px',
            border: '2px solid var(--ink)', borderRadius: 999,
            background: filter === f ? 'var(--ink)' : 'var(--paper)',
            color: filter === f ? 'var(--paper)' : 'var(--ink)',
            fontFamily: 'var(--cf-ui)', fontSize: 11, fontWeight: 800,
            textTransform: 'uppercase',
          }}>{f}</button>
        ))}
      </div>

      <div style={{
        position: 'relative', zIndex: 2,
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        marginRight: -22, paddingRight: 22, scrollbarWidth: 'none',
      }}>
        {visible.map(t => (
          <button key={t.id} onClick={() => onOpen(t)} style={{
            appearance: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
            display: 'flex', gap: 12,
            padding: 14, marginBottom: 10,
            border: '2.5px solid var(--ink)', borderRadius: 14,
            background: t.status === 'draft' ? 'var(--paper)' : t.c,
            boxShadow: '4px 4px 0 var(--ink)',
            position: 'relative',
          }}>
            {t.status === 'draft' && (
              <div style={{
                position: 'absolute', inset: 0, borderRadius: 14,
                backgroundImage: `repeating-linear-gradient(135deg, rgba(0,0,0,0.04) 0 8px, transparent 8px 16px)`,
                pointerEvents: 'none',
              }} />
            )}
            <div style={{
              fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 26,
              letterSpacing: '-0.025em', color: 'var(--ink)',
              minWidth: 36, textAlign: 'center', alignSelf: 'flex-start',
            }}>{t.date.split(' ')[2]}</div>
            <div style={{ flex: 1, color: 'var(--ink)' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
                letterSpacing: '.14em', opacity: 0.65, textTransform: 'uppercase',
              }}>
                {t.status === 'active' && <span style={{
                  width: 5, height: 5, borderRadius: 999, background: 'var(--ink)',
                  animation: 'cf-pulse 1.2s infinite',
                }} />}
                {t.date.split(' ').slice(0, 2).join(' ')} · {t.status}
                {' · #'}{t.id}
              </div>
              <div style={{
                fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 18,
                letterSpacing: '-0.025em', marginTop: 3, lineHeight: 1.1,
              }}>{t.n}</div>
              <div style={{
                fontFamily: 'var(--cf-ui)', fontSize: 11, fontWeight: 700,
                opacity: 0.7, marginTop: 3,
              }}>{t.vibe}</div>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
                letterSpacing: '.1em', marginTop: 8,
              }}>
                <span>{t.stops} STOPS</span>
                <span>{t.cost ? `$${t.cost}` : 'DRAFT'}</span>
              </div>
            </div>
            <span style={{ alignSelf: 'center', opacity: 0.5, fontSize: 18, fontWeight: 900 }}>›</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// 2. QR Check-in (/check-in)
// ═════════════════════════════════════════════════════════════════
function QRCheckInScreen({ onBack, onScanned }) {
  const [scanning, setScanning] = useStateM(true);
  const [success, setSuccess] = useStateM(false);

  useEffectM(() => {
    if (!scanning) return;
    const t = setTimeout(() => {
      setSuccess(true);
      setScanning(false);
      setTimeout(() => onScanned?.(), 1800);
    }, 3000);
    return () => clearTimeout(t);
  }, [scanning, onScanned]);

  return (
    <div className="cf-screen" style={{
      position: 'relative', height: '100%',
      background: 'var(--ink)', color: 'var(--paper)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 56, left: 0, right: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px',
      }}>
        <button onClick={onBack} style={{
          appearance: 'none', cursor: 'pointer',
          width: 38, height: 38, borderRadius: 999,
          border: '2px solid var(--paper)',
          background: 'rgba(0,0,0,0.4)', color: 'var(--paper)',
          fontSize: 16, fontWeight: 900,
        }}>←</button>
        <span style={{
          fontFamily: 'var(--cf-mono)', fontSize: 11, fontWeight: 800,
          letterSpacing: '.14em',
        }}>SCAN TO CHECK IN</span>
        <button style={{
          appearance: 'none', cursor: 'pointer',
          width: 38, height: 38, borderRadius: 999,
          border: '2px solid var(--paper)',
          background: 'rgba(0,0,0,0.4)', color: 'var(--paper)',
          fontSize: 14, fontWeight: 900,
        }}>⚡</button>
      </div>

      {/* "Camera view" */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at 50% 40%, #2a1a1a 0%, #0a0808 80%)',
        opacity: 0.85,
      }} />
      {/* Stylized environment hint */}
      <svg width="100%" height="100%" viewBox="0 0 100 175"
           preserveAspectRatio="xMidYMid slice"
           style={{ position: 'absolute', inset: 0, opacity: 0.18 }}>
        <rect x="20" y="80" width="60" height="55" fill="var(--accent-1)"/>
        <rect x="25" y="85" width="20" height="20" fill="rgba(0,0,0,0.3)"/>
        <rect x="50" y="85" width="20" height="30" fill="rgba(0,0,0,0.3)"/>
      </svg>

      <div style={{
        position: 'relative', zIndex: 2,
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: 24,
      }}>
        {scanning ? (
          <>
            {/* Reticle */}
            <div style={{
              position: 'relative',
              width: 240, height: 240,
            }}>
              {/* corners */}
              {['tl', 'tr', 'bl', 'br'].map(c => (
                <div key={c} style={{
                  position: 'absolute',
                  width: 36, height: 36,
                  borderTop: c.startsWith('t') ? '4px solid var(--paper)' : 'none',
                  borderBottom: c.startsWith('b') ? '4px solid var(--paper)' : 'none',
                  borderLeft: c.endsWith('l') ? '4px solid var(--paper)' : 'none',
                  borderRight: c.endsWith('r') ? '4px solid var(--paper)' : 'none',
                  top: c.startsWith('t') ? 0 : 'auto',
                  bottom: c.startsWith('b') ? 0 : 'auto',
                  left: c.endsWith('l') ? 0 : 'auto',
                  right: c.endsWith('r') ? 0 : 'auto',
                }} />
              ))}
              {/* scan line */}
              <div style={{
                position: 'absolute', left: 8, right: 8, height: 3,
                background: 'var(--accent-1)',
                boxShadow: '0 0 12px var(--accent-1)',
                animation: 'cf-scan 2.5s infinite ease-in-out',
              }} />
              {/* Faux QR preview being captured */}
              <div style={{
                position: 'absolute', inset: 30,
                display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 1,
                opacity: 0.55,
              }}>
                {Array.from({ length: 100 }).map((_, i) =>
                  <div key={i} style={{
                    background: Math.random() > 0.55 ? 'var(--paper)' : 'transparent',
                    aspectRatio: '1',
                  }} />
                )}
              </div>
            </div>
            <div style={{ marginTop: 26, textAlign: 'center' }}>
              <div style={{
                fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 26,
                letterSpacing: '-0.03em',
              }}>Hold the code in frame.</div>
              <div style={{
                fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 700,
                opacity: 0.65, marginTop: 6, maxWidth: 280,
              }}>Look for a Confetti placard at the host stand. Scanning…</div>
            </div>
          </>
        ) : (
          <>
            <div style={{
              width: 110, height: 110, borderRadius: 999,
              border: '4px solid var(--accent-1)',
              background: 'var(--accent-1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 56,
              color: 'var(--ink)',
              animation: 'cf-pop 0.4s cubic-bezier(.2,1.4,.4,1)',
            }}>✓</div>
            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <div style={{
                fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 32,
                letterSpacing: '-0.035em', lineHeight: 1,
              }}>Checked in at<br/>Lupa Notte.</div>
              <div style={{
                fontFamily: 'var(--cf-mono)', fontSize: 11, fontWeight: 800,
                letterSpacing: '.12em', opacity: 0.65, marginTop: 10,
              }}>FIRST ROUND COMP'D · POSTED TO CREW</div>
            </div>
          </>
        )}
      </div>

      {scanning && (
        <div style={{
          position: 'relative', zIndex: 2,
          padding: '0 24px 36px',
          display: 'flex', gap: 8,
        }}>
          <button style={{
            appearance: 'none', cursor: 'pointer', flex: 1,
            padding: '12px 14px',
            border: '2.5px solid var(--paper)', borderRadius: 12,
            background: 'rgba(255,250,240,0.1)', color: 'var(--paper)',
            fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 800,
            backdropFilter: 'blur(10px)',
          }}>enter code manually</button>
          <button style={{
            appearance: 'none', cursor: 'pointer',
            padding: '12px 14px',
            border: '2.5px solid var(--paper)', borderRadius: 12,
            background: 'rgba(255,250,240,0.1)', color: 'var(--paper)',
            fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 800,
          }}>📷 gallery</button>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// 3. Checkout return (/checkout/return) — Stripe success
// ═════════════════════════════════════════════════════════════════
function CheckoutReturnScreen({ onContinue, onBack }) {
  return (
    <div className="cf-screen" style={{
      position: 'relative', height: '100%',
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      padding: '60px 24px 28px',
      overflow: 'hidden',
    }}>
      <DotsBg opacity={0.06} />
      <FloatingTickets density={4} />

      <div style={{ position: 'relative', zIndex: 2 }}>
        <BrandMark size={17} />
      </div>

      <div style={{
        position: 'relative', zIndex: 2,
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 18, textAlign: 'center',
      }}>
        <div style={{
          width: 100, height: 100, borderRadius: 999,
          border: '4px solid var(--ink)', background: 'var(--accent-1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 50,
          color: 'var(--ink)',
          boxShadow: '5px 5px 0 var(--ink)',
          animation: 'cf-pop 0.4s cubic-bezier(.2,1.4,.4,1)',
        }}>✓</div>

        <Stamp color="var(--accent-2)" rotate={-3}>
          deposit secured
        </Stamp>

        <h1 style={{
          fontFamily: 'var(--cf-display)', fontWeight: 900,
          fontSize: 38, lineHeight: 0.95, letterSpacing: '-0.04em',
          color: 'var(--ink)', margin: 0,
        }}>You're<br/>on the list.</h1>

        <Ticket color="var(--paper)" notch={false} style={{
          padding: 14, textAlign: 'left', width: '100%',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingBottom: 10, borderBottom: '2px dashed rgba(0,0,0,0.18)',
          }}>
            <span style={{
              fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
              letterSpacing: '.14em', opacity: 0.55,
            }}>STRIPE · paid</span>
            <span style={{
              fontFamily: 'var(--cf-mono)', fontSize: 11, fontWeight: 800,
              letterSpacing: '.06em',
            }}>$10.00</span>
          </div>
          <div style={{ paddingTop: 10 }}>
            <div style={{
              fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 18,
              letterSpacing: '-0.025em',
            }}>Westlight rooftop · 9 PM</div>
            <div style={{
              fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
              opacity: 0.65, marginTop: 4, letterSpacing: '.08em',
            }}>HELD UNTIL 9:30 · REFUNDABLE TIL 6 PM</div>
          </div>
          <div style={{
            marginTop: 10, padding: '8px 10px',
            background: 'var(--bg)', borderRadius: 8,
            fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
            display: 'flex', justifyContent: 'space-between',
            opacity: 0.7, letterSpacing: '.04em',
          }}>
            <span>RECEIPT · pi_3OXk2eL...</span>
            <span style={{ textDecoration: 'underline' }}>email me</span>
          </div>
        </Ticket>

        <p style={{
          fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 700,
          color: 'var(--ink)', opacity: 0.7, margin: 0, lineHeight: 1.4,
          maxWidth: 320,
        }}>Confetti added this stop to your tonight pass automatically. We'll buzz you 30 min before.</p>
      </div>

      <div style={{ position: 'relative', zIndex: 2, display: 'flex', gap: 8 }}>
        <ChunkyButton variant="paper" onClick={onBack}>back to pass</ChunkyButton>
        <ChunkyButton variant="accent" onClick={onContinue} icon={Icons.arrow}>
          add to wallet
        </ChunkyButton>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// 4. Referral capture (/p/:code)
// ═════════════════════════════════════════════════════════════════
function ReferralScreen({ onSignUp, onBack }) {
  return (
    <div className="cf-screen" style={{
      position: 'relative', height: '100%',
      background: 'var(--accent-1)',
      display: 'flex', flexDirection: 'column',
      padding: '60px 28px 28px',
      overflow: 'hidden',
      color: 'var(--ink)',
    }}>
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.15,
        backgroundImage: `radial-gradient(var(--ink) 1px, transparent 1px)`,
        backgroundSize: '22px 22px',
      }} />
      <FloatingTickets density={6} />

      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <BrandMark size={18} />
        <button onClick={onBack} style={{
          appearance: 'none', cursor: 'pointer',
          background: 'transparent', border: 'none',
          fontSize: 22, fontWeight: 900,
        }}>✕</button>
      </div>

      <div style={{
        position: 'relative', zIndex: 2,
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', gap: 18,
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          padding: '8px 14px',
          background: 'var(--ink)', color: 'var(--paper)',
          border: '3px solid var(--ink)', borderRadius: 999,
          fontFamily: 'var(--cf-mono)', fontSize: 11, fontWeight: 800,
          letterSpacing: '.14em', alignSelf: 'flex-start',
          boxShadow: '3px 3px 0 var(--paper)',
        }}>
          INVITE · #MAYA-12
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          marginBottom: 4,
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: 999,
            border: '3px solid var(--ink)', background: 'var(--accent-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 24,
            boxShadow: '4px 4px 0 var(--ink)',
          }}>M</div>
          <div>
            <div style={{
              fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
              letterSpacing: '.14em', opacity: 0.7,
            }}>@MAYA SENT YOU</div>
            <div style={{
              fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 18,
              letterSpacing: '-0.025em', marginTop: 2,
            }}>your first pass on me.</div>
          </div>
        </div>

        <h1 style={{
          fontFamily: 'var(--cf-display)', fontWeight: 900,
          fontSize: 60, lineHeight: 0.88, letterSpacing: '-0.045em',
          margin: 0,
        }}>
          $20 off<br/>your first<br/>night.
        </h1>

        <p style={{
          fontFamily: 'var(--cf-ui)', fontSize: 15, fontWeight: 600,
          color: 'var(--ink)', opacity: 0.85, margin: 0, lineHeight: 1.4,
          maxWidth: 320,
        }}>
          Tell us a vibe, get a 3-stop pass — real venues, real timing,
          credit applied at first booking. 4 minutes from chat to door.
        </p>

        <div style={{
          padding: 14,
          background: 'var(--paper)',
          border: '3px solid var(--ink)', borderRadius: 14,
          boxShadow: '5px 5px 0 var(--ink)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 8,
            border: '2.5px solid var(--ink)', background: 'var(--accent-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 18,
          }}>✣</div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
              letterSpacing: '.12em', opacity: 0.6, textTransform: 'uppercase',
            }}>CODE</div>
            <div style={{
              fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 22,
              letterSpacing: '-0.025em', marginTop: 2,
            }}>MAYA-12</div>
          </div>
          <span style={{
            padding: '5px 10px',
            background: 'var(--accent-1)', color: 'var(--ink)',
            border: '2px solid var(--ink)', borderRadius: 6,
            fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
            letterSpacing: '.1em',
          }}>APPLIED</span>
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 2 }}>
        <button onClick={onSignUp} style={{
          appearance: 'none', cursor: 'pointer', width: '100%',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          padding: '18px 22px',
          border: '3px solid var(--ink)', borderRadius: 16,
          background: 'var(--ink)', color: 'var(--paper)',
          fontFamily: 'var(--cf-ui)', fontSize: 17, fontWeight: 900,
          boxShadow: '5px 5px 0 var(--paper)',
        }}>
          claim my pass {Icons.arrow}
        </button>
        <div style={{
          marginTop: 12, textAlign: 'center',
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
          opacity: 0.65, letterSpacing: '.08em',
        }}>NO CARD REQUIRED · CREDIT VALID 14 DAYS</div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// 5. About (/about)
// ═════════════════════════════════════════════════════════════════
function AboutScreen({ onBack }) {
  return (
    <div className="cf-screen" style={{
      position: 'relative', height: '100%',
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      padding: '56px 0 24px',
      overflow: 'hidden',
    }}>
      <DotsBg opacity={0.05} />

      <div style={{
        position: 'relative', zIndex: 2,
        padding: '0 22px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button onClick={onBack} style={{
          appearance: 'none', cursor: 'pointer',
          width: 36, height: 36, borderRadius: 999,
          border: '2.5px solid var(--ink)', background: 'var(--paper)',
          fontSize: 14, fontWeight: 900,
          boxShadow: '3px 3px 0 var(--ink)',
        }}>←</button>
        <BrandMark size={16} />
        <span style={{ width: 36 }} />
      </div>

      <div style={{
        position: 'relative', zIndex: 2,
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        padding: '0 22px', scrollbarWidth: 'none',
      }}>
        <Stamp color="var(--accent-1)" rotate={-3} style={{ marginBottom: 14 }}>
          founded 2025 · brooklyn
        </Stamp>
        <h1 style={{
          fontFamily: 'var(--cf-display)', fontWeight: 900,
          fontSize: 44, lineHeight: 0.92, letterSpacing: '-0.045em',
          color: 'var(--ink)', margin: '0 0 18px',
        }}>Going out<br/>shouldn't take<br/><span style={{ color: 'var(--accent-1)' }}>two hours of<br/>texting.</span></h1>

        <p style={{
          fontFamily: 'var(--cf-ui)', fontSize: 15, fontWeight: 600,
          color: 'var(--ink)', opacity: 0.8, lineHeight: 1.5, margin: '0 0 18px',
        }}>
          We built Confetti because nights out collapse under choice overload.
          One person picks a bar, someone vetoes it, the group chat splinters,
          you end up at the same spot for the fourth time this month.
        </p>
        <p style={{
          fontFamily: 'var(--cf-ui)', fontSize: 15, fontWeight: 600,
          color: 'var(--ink)', opacity: 0.8, lineHeight: 1.5, margin: '0 0 22px',
        }}>
          Confetti is six AI agents that read your vibe, rank 40+ venues,
          enforce your budget, write a "why" for each pick, and print a pass
          you can actually follow. Like a boarding pass for the night.
        </p>

        {/* Stat callouts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 22 }}>
          {[
            ['230k', 'passes printed'],
            ['12 cities', 'live'],
            ['4m 18s', 'plan time avg'],
            ['82%', 'completion rate'],
          ].map(([n, l]) => (
            <div key={n} style={{
              padding: 14,
              border: '2.5px solid var(--ink)', borderRadius: 12,
              background: 'var(--paper)',
              boxShadow: '3px 3px 0 var(--ink)',
            }}>
              <div style={{
                fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 26,
                letterSpacing: '-0.03em',
              }}>{n}</div>
              <div style={{
                fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
                opacity: 0.55, marginTop: 2, letterSpacing: '.1em',
                textTransform: 'uppercase',
              }}>{l}</div>
            </div>
          ))}
        </div>

        <SectionLabel>built by</SectionLabel>
        <div style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
          {[
            { n: 'jess l.', r: 'founder · ex-resy', c: 'var(--accent-2)' },
            { n: 'amir k.', r: 'cto · ex-spotify', c: 'var(--accent-3)' },
            { n: 'rio v.', r: 'design · ex-airbnb', c: 'var(--accent-1)' },
          ].map(p => (
            <div key={p.n} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                width: '100%', aspectRatio: '1',
                border: '2.5px solid var(--ink)', borderRadius: 999,
                background: p.c, marginBottom: 6,
                boxShadow: '3px 3px 0 var(--ink)',
              }} />
              <div style={{
                fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 13,
                letterSpacing: '-0.02em',
              }}>{p.n}</div>
              <div style={{
                fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 700,
                opacity: 0.55, marginTop: 2,
              }}>{p.r}</div>
            </div>
          ))}
        </div>

        <SectionLabel>backed by</SectionLabel>
        <div style={{
          display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22,
        }}>
          {['a16z scout', 'precursor', 'angellist', '8 angels'].map(b => (
            <span key={b} style={{
              padding: '6px 12px',
              border: '2px solid var(--ink)', borderRadius: 8,
              background: 'var(--paper)',
              fontFamily: 'var(--cf-ui)', fontSize: 11, fontWeight: 800,
            }}>{b}</span>
          ))}
        </div>

        <SectionLabel>links</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
          {[
            ['careers', 'we\'re hiring · 4 roles'],
            ['press', 'recent: bk mag, eater'],
            ['for venues', 'partner with us'],
            ['privacy & terms', ''],
          ].map(([l, s]) => (
            <div key={l} style={{
              padding: '12px 14px',
              border: '2px solid var(--ink)', borderRadius: 10,
              background: 'var(--paper)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{
                  fontFamily: 'var(--cf-ui)', fontSize: 14, fontWeight: 800,
                }}>{l}</div>
                {s && <div style={{
                  fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
                  opacity: 0.55, marginTop: 1,
                }}>{s}</div>}
              </div>
              <span style={{ opacity: 0.5, fontWeight: 900 }}>›</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// 6. Privacy & Terms (/privacy)
// ═════════════════════════════════════════════════════════════════
function PrivacyScreen({ onBack }) {
  const [tab, setTab] = useStateM('privacy');
  return (
    <div className="cf-screen" style={{
      position: 'relative', height: '100%',
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <DotsBg opacity={0.05} />
      <div style={{
        position: 'relative', zIndex: 2,
        padding: '56px 22px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button onClick={onBack} style={{
          appearance: 'none', cursor: 'pointer',
          width: 36, height: 36, borderRadius: 999,
          border: '2.5px solid var(--ink)', background: 'var(--paper)',
          fontSize: 14, fontWeight: 900,
          boxShadow: '3px 3px 0 var(--ink)',
        }}>←</button>
        <span style={{
          fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 17,
          letterSpacing: '-0.025em',
        }}>Privacy & Terms</span>
        <span style={{ width: 36 }} />
      </div>

      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', gap: 4, padding: '0 22px 12px',
        borderBottom: '2.5px solid var(--ink)',
      }}>
        {['privacy', 'terms', 'cookies'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            appearance: 'none', cursor: 'pointer',
            padding: '8px 14px',
            border: '2px solid var(--ink)', borderRadius: 999,
            background: tab === t ? 'var(--ink)' : 'var(--paper)',
            color: tab === t ? 'var(--paper)' : 'var(--ink)',
            fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 800,
          }}>{t}</button>
        ))}
      </div>

      <div style={{
        position: 'relative', zIndex: 2,
        flex: 1, overflowY: 'auto',
        padding: '16px 22px 30px', scrollbarWidth: 'none',
      }}>
        <div style={{
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
          opacity: 0.55, letterSpacing: '.12em',
          marginBottom: 10, textTransform: 'uppercase',
        }}>LAST UPDATED · MAY 12, 2026 · V4.2</div>

        {tab === 'privacy' && (
          <>
            <PSection h="What we collect">
              <PItem k="email + phone" v="for sign-in and crew check-ins via Twilio. Optional after sign-up." />
              <PItem k="location" v="only when you have an active pass. Auto-purged 24h after the night ends. Off by default outside active passes." />
              <PItem k="vibe + ranking history" v="trains the planner agent on what you actually like. You can clear it." />
              <PItem k="payment tokens" v="held by Stripe; we never see card numbers." />
            </PSection>
            <PSection h="Who we share with">
              <PItem k="venues you book" v="just the booking name + party size + estimated arrival." />
              <PItem k="ai providers" v="OpenAI & Anthropic on contractual no-train terms; prompts are scrubbed before send." />
              <PItem k="never" v="no data sold to advertisers. No social-graph crawls. No browser fingerprinting." />
            </PSection>
            <PSection h="Your controls">
              <PItem k="export" v="ZIP of every pass, check-in, photo, and AI conversation. 10 min." />
              <PItem k="delete" v="instant. Tombstones live 30 days for compliance, then gone." />
            </PSection>
          </>
        )}
        {tab === 'terms' && (
          <>
            <PSection h="Using Confetti">
              <PItem k="you must be 18+" v="some stops in passes are 21+; we surface this on the pass." />
              <PItem k="passes are non-binding" v="venues hold spots on goodwill. If you no-show repeatedly we'll throttle bookings." />
              <PItem k="reels & check-ins" v="your photos stay yours. We get a license to render them in your shareable passport." />
            </PSection>
            <PSection h="Refunds">
              <PItem k="stripe deposits" v="full refund up to 6 hours before your scheduled arrival. After, venue policy applies." />
              <PItem k="ticket purchases" v="handled by Ticketmaster's policy directly." />
            </PSection>
          </>
        )}
        {tab === 'cookies' && (
          <>
            <PSection h="What we set">
              <PItem k="session" v="just to keep you signed in. Strictly necessary." />
              <PItem k="preferences" v="palette, language. Local-only." />
              <PItem k="anonymized analytics" v="opt-out from settings. We use Plausible, not Google." />
            </PSection>
          </>
        )}

        <button style={{
          appearance: 'none', cursor: 'pointer', marginTop: 14,
          width: '100%', padding: '12px 14px',
          border: '2.5px solid var(--ink)', borderRadius: 12,
          background: 'var(--paper)',
          fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 800,
          boxShadow: '3px 3px 0 var(--ink)',
        }}>📄 download as PDF</button>
      </div>
    </div>
  );
}

function PSection({ h, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <h3 style={{
        fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 22,
        letterSpacing: '-0.025em', margin: '0 0 10px',
      }}>{h}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {children}
      </div>
    </div>
  );
}

function PItem({ k, v }) {
  return (
    <div style={{
      padding: '10px 12px',
      border: '2px solid var(--ink)', borderRadius: 10,
      background: 'var(--paper)',
    }}>
      <div style={{
        fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
        letterSpacing: '.14em', opacity: 0.55, textTransform: 'uppercase',
        marginBottom: 4,
      }}>{k}</div>
      <div style={{
        fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 700,
        lineHeight: 1.4, opacity: 0.85,
      }}>{v}</div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// 7. Events list (/events) + Event detail (/events/:id)
// ═════════════════════════════════════════════════════════════════
const EVENTS = [
  { id: 'e1', date: 'sat may 23', time: '10:00 PM', n: 'Pearl Charles',
    venue: 'Baby\'s All Right', tag: 'indie · live show',
    price: 26, src: 'ticketmaster',
    color: 'var(--accent-1)', sold: 0.62 },
  { id: 'e2', date: 'sat may 23', time: '7:00 PM', n: 'Wong Kar-Wai marathon',
    venue: 'Nitehawk Williamsburg', tag: 'cinema · 35mm',
    price: 18, src: 'partner',
    color: 'var(--accent-3)', sold: 0.94 },
  { id: 'e3', date: 'sun may 24', time: '11:00 AM', n: 'Smorgasburg pop-up',
    venue: 'Marsha P. Johnson Pk.', tag: 'food festival',
    price: 0, src: 'free',
    color: 'var(--accent-2)', sold: 0.32 },
  { id: 'e4', date: 'sun may 24', time: '8:30 PM', n: 'Comedy at Union Hall',
    venue: 'Union Hall', tag: 'stand-up · 21+',
    price: 14, src: 'partner',
    color: 'var(--accent-1)', sold: 0.45 },
  { id: 'e5', date: 'mon may 25', time: '7:30 PM', n: 'Vinyl listening party',
    venue: 'Eavesdrop', tag: 'jazz · phones off',
    price: 35, src: 'partner',
    color: 'var(--accent-3)', sold: 0.81 },
];

function EventsListScreen({ onBack, onOpen }) {
  const [filter, setFilter] = useStateM('all');
  return (
    <div className="cf-screen" style={{
      position: 'relative', height: '100%',
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      padding: '56px 22px 24px',
      overflow: 'hidden',
    }}>
      <DotsBg opacity={0.05} />
      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <button onClick={onBack} style={{
          appearance: 'none', cursor: 'pointer',
          width: 36, height: 36, borderRadius: 999,
          border: '2.5px solid var(--ink)', background: 'var(--paper)',
          fontSize: 14, fontWeight: 900,
          boxShadow: '3px 3px 0 var(--ink)',
        }}>←</button>
        <BrandMark size={16} />
        <span style={{ width: 36 }} />
      </div>

      <h2 style={{
        position: 'relative', zIndex: 2,
        fontFamily: 'var(--cf-display)', fontWeight: 900,
        fontSize: 38, lineHeight: 0.95, letterSpacing: '-0.04em',
        margin: '0 0 4px',
      }}>What's on.</h2>
      <div style={{
        position: 'relative', zIndex: 2,
        fontFamily: 'var(--cf-mono)', fontSize: 11, fontWeight: 700,
        opacity: 0.55, letterSpacing: '.12em', textTransform: 'uppercase',
        marginBottom: 14,
      }}>BROOKLYN · {EVENTS.length} EVENTS · LIVE FROM TICKETMASTER + PARTNERS</div>

      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none',
        marginRight: -22, paddingRight: 22, marginBottom: 12,
      }}>
        {['all', 'tonight', 'this weekend', 'music', 'food', 'comedy', 'free'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            appearance: 'none', cursor: 'pointer', flexShrink: 0,
            padding: '8px 14px',
            border: '2px solid var(--ink)', borderRadius: 999,
            background: filter === f ? 'var(--ink)' : 'var(--paper)',
            color: filter === f ? 'var(--paper)' : 'var(--ink)',
            fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 800,
          }}>{f}</button>
        ))}
      </div>

      <div style={{
        position: 'relative', zIndex: 2,
        flex: 1, overflowY: 'auto',
        marginRight: -22, paddingRight: 22, scrollbarWidth: 'none',
      }}>
        {EVENTS.map(e => (
          <button key={e.id} onClick={() => onOpen(e)} style={{
            appearance: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
            display: 'flex', gap: 12,
            padding: 12, marginBottom: 10,
            border: '2.5px solid var(--ink)', borderRadius: 14,
            background: 'var(--paper)',
            boxShadow: '4px 4px 0 var(--ink)',
          }}>
            <div style={{
              width: 64, flexShrink: 0,
              aspectRatio: '1',
              border: '2px solid var(--ink)', borderRadius: 8,
              background: e.color,
              backgroundImage: `repeating-linear-gradient(135deg, rgba(0,0,0,0.07) 0 6px, transparent 6px 12px)`,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              color: 'var(--ink)',
            }}>
              <span style={{
                fontFamily: 'var(--cf-mono)', fontSize: 8, fontWeight: 800,
                letterSpacing: '.12em', opacity: 0.7,
              }}>{e.date.split(' ')[0].toUpperCase()}</span>
              <span style={{
                fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 22,
                letterSpacing: '-0.025em',
              }}>{e.date.split(' ')[2]}</span>
              <span style={{
                fontFamily: 'var(--cf-mono)', fontSize: 8, fontWeight: 800,
                opacity: 0.7,
              }}>{e.time}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
                letterSpacing: '.14em', opacity: 0.55, textTransform: 'uppercase',
              }}>{e.tag}</div>
              <div style={{
                fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 17,
                letterSpacing: '-0.02em', marginTop: 3, lineHeight: 1.1,
              }}>{e.n}</div>
              <div style={{
                fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 700,
                opacity: 0.65, marginTop: 3,
              }}>@ {e.venue}</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6 }}>
                {e.price === 0 ? (
                  <span style={{
                    padding: '3px 8px', background: 'var(--accent-4, #2bb673)',
                    color: 'var(--paper)',
                    border: '1.5px solid var(--ink)', borderRadius: 4,
                    fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
                    letterSpacing: '.1em',
                  }}>FREE</span>
                ) : (
                  <span style={{
                    padding: '3px 8px', background: e.src === 'ticketmaster' ? '#026CDF' : 'var(--ink)',
                    color: 'var(--paper)',
                    border: '1.5px solid var(--ink)', borderRadius: 4,
                    fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
                    letterSpacing: '.06em',
                  }}>${e.price}</span>
                )}
                <div style={{ flex: 1,
                              height: 5, border: '1.5px solid var(--ink)', borderRadius: 999,
                              background: 'var(--bg)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${e.sold * 100}%`,
                    background: e.sold > 0.85 ? '#d32323' : 'var(--accent-1)',
                  }} />
                </div>
                <span style={{
                  fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 700,
                  opacity: 0.55, letterSpacing: '.06em',
                }}>{Math.round(e.sold * 100)}%</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function EventDetailScreen({ event, onBack, onAdd }) {
  const e = event || EVENTS[0];
  return (
    <div className="cf-screen" style={{
      position: 'relative', height: '100%',
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Hero */}
      <div style={{
        position: 'relative', height: 260, flexShrink: 0,
        background: e.color,
        backgroundImage: `repeating-linear-gradient(135deg, rgba(0,0,0,0.08) 0 14px, transparent 14px 28px)`,
        borderBottom: '3px solid var(--ink)',
      }}>
        <svg width="100%" height="100%" viewBox="0 0 100 60"
             preserveAspectRatio="xMidYMid slice"
             style={{ position: 'absolute', inset: 0, opacity: 0.4 }}>
          <circle cx="40" cy="32" r="14" fill="rgba(0,0,0,0.3)"/>
          <path d="M 0 55 L 18 35 L 35 45 L 55 25 L 78 30 L 100 18 L 100 60 L 0 60 Z" fill="rgba(0,0,0,0.4)"/>
        </svg>
        <button onClick={onBack} style={{
          position: 'absolute', top: 56, left: 16,
          appearance: 'none', cursor: 'pointer',
          width: 36, height: 36, borderRadius: 999,
          border: '2.5px solid var(--ink)', background: 'var(--paper)',
          fontSize: 16, fontWeight: 900,
          boxShadow: '3px 3px 0 var(--ink)',
        }}>←</button>
        <button style={{
          position: 'absolute', top: 56, right: 16,
          appearance: 'none', cursor: 'pointer',
          padding: '6px 12px',
          border: '2.5px solid var(--ink)', borderRadius: 999,
          background: 'var(--paper)',
          fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 800,
          boxShadow: '3px 3px 0 var(--ink)',
        }}>↗ share</button>
        <div style={{
          position: 'absolute', bottom: 14, left: 16,
          padding: '6px 12px',
          background: 'var(--ink)', color: 'var(--paper)',
          border: '2px solid var(--paper)', borderRadius: 999,
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
          letterSpacing: '.12em',
        }}>{e.date.toUpperCase()} · {e.time}</div>
      </div>

      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '14px 22px 24px',
        scrollbarWidth: 'none',
      }}>
        <div style={{
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
          letterSpacing: '.14em', opacity: 0.55, textTransform: 'uppercase',
        }}>{e.tag}</div>
        <h2 style={{
          fontFamily: 'var(--cf-display)', fontWeight: 900,
          fontSize: 32, letterSpacing: '-0.04em', lineHeight: 0.95,
          margin: '4px 0 8px',
        }}>{e.n}</h2>
        <div style={{
          fontFamily: 'var(--cf-ui)', fontSize: 14, fontWeight: 700,
          opacity: 0.7, marginBottom: 14,
        }}>@ {e.venue} · 146 Metropolitan Ave</div>

        {/* Tickets card */}
        <div style={{
          padding: 14,
          background: e.src === 'ticketmaster' ? '#026CDF' : 'var(--ink)',
          color: '#fff',
          border: '2.5px solid var(--ink)', borderRadius: 14,
          boxShadow: '4px 4px 0 var(--ink)', marginBottom: 14,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{
                fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
                letterSpacing: '.14em', opacity: 0.85,
              }}>{e.src === 'ticketmaster' ? 'TICKETMASTER · 38% LEFT' : 'CONFETTI PARTNER'}</div>
              <div style={{
                fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 24,
                marginTop: 4, letterSpacing: '-0.02em',
              }}>${e.price} · GA</div>
            </div>
            <button style={{
              appearance: 'none', cursor: 'pointer',
              padding: '10px 16px',
              border: '2.5px solid #fff', borderRadius: 999,
              background: '#fff', color: e.src === 'ticketmaster' ? '#026CDF' : 'var(--ink)',
              fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 900,
            }}>buy →</button>
          </div>
        </div>

        <SectionLabel>about</SectionLabel>
        <p style={{
          fontFamily: 'var(--cf-ui)', fontSize: 14, fontWeight: 600,
          lineHeight: 1.45, opacity: 0.85, margin: '0 0 18px',
        }}>
          Pearl Charles brings her cosmic country sound to Baby's. Set's around 11.
          Doors at 10 — get there early if you want a sightline; this room's deep.
        </p>

        {/* Pair with a pass CTA */}
        <div style={{
          padding: 14, marginBottom: 18,
          border: '2.5px solid var(--ink)', borderRadius: 14,
          background: 'var(--accent-2)',
          boxShadow: '4px 4px 0 var(--ink)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
            letterSpacing: '.14em', opacity: 0.65, textTransform: 'uppercase',
            marginBottom: 4,
          }}><span style={{ color: 'var(--accent-1)' }}>✣</span> pair with a pass</div>
          <div style={{
            fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 18,
            letterSpacing: '-0.025em',
          }}>Drinks + dinner before the show?</div>
          <div style={{
            fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 700,
            opacity: 0.75, marginTop: 4,
          }}>Confetti can route you through 2 walkable stops, all back here by 10:30.</div>
          <button onClick={onAdd} style={{
            appearance: 'none', cursor: 'pointer', marginTop: 10,
            padding: '8px 14px',
            border: '2.5px solid var(--ink)', borderRadius: 999,
            background: 'var(--ink)', color: 'var(--paper)',
            fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 800,
          }}>build the pass →</button>
        </div>

        <SectionLabel>3 friends going</SectionLabel>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', marginBottom: 18,
          border: '2px solid var(--ink)', borderRadius: 12,
          background: 'var(--paper)',
        }}>
          <div style={{ display: 'flex' }}>
            {['var(--accent-1)', 'var(--accent-3)', 'var(--accent-2)'].map((c, i) => (
              <span key={i} style={{
                width: 32, height: 32, borderRadius: 999,
                border: '2.5px solid var(--ink)', background: c,
                marginLeft: i > 0 ? -10 : 0,
                color: c === 'var(--accent-3)' ? 'var(--paper)' : 'var(--ink)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 13,
              }}>{['M','D','S'][i]}</span>
            ))}
          </div>
          <div style={{
            fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 800,
            flex: 1,
          }}>@maya · @devon · @sam</div>
          <button style={{
            appearance: 'none', cursor: 'pointer',
            padding: '5px 10px',
            border: '2px solid var(--ink)', borderRadius: 999,
            background: 'var(--accent-1)',
            fontFamily: 'var(--cf-ui)', fontSize: 11, fontWeight: 800,
          }}>+ join</button>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// 8. Influencer recruit (/influencer)
// ═════════════════════════════════════════════════════════════════
function InfluencerScreen({ onBack, onApply }) {
  return (
    <div className="cf-screen" style={{
      position: 'relative', height: '100%',
      background: 'var(--ink)', color: 'var(--paper)',
      display: 'flex', flexDirection: 'column',
      padding: '56px 0 24px',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.15,
        backgroundImage: `radial-gradient(var(--paper) 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
      }} />

      <div style={{
        position: 'relative', zIndex: 2,
        padding: '0 22px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button onClick={onBack} style={{
          appearance: 'none', cursor: 'pointer',
          width: 36, height: 36, borderRadius: 999,
          border: '2px solid var(--paper)',
          background: 'rgba(0,0,0,0.4)', color: 'var(--paper)',
          fontSize: 14, fontWeight: 900,
        }}>←</button>
        <span style={{ display: 'inline-flex', gap: 7, alignItems: 'center',
                       fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 16,
                       letterSpacing: '-0.025em' }}>
          <span style={{ color: 'var(--accent-1)' }}>✣</span>confetti<span style={{ opacity: 0.5 }}>/promoters</span>
        </span>
        <span style={{ width: 36 }} />
      </div>

      <div style={{
        position: 'relative', zIndex: 2,
        flex: 1, overflowY: 'auto',
        padding: '0 22px 24px', scrollbarWidth: 'none',
      }}>
        <div style={{
          display: 'inline-block',
          padding: '5px 11px',
          background: 'var(--accent-1)', color: 'var(--ink)',
          border: '2.5px solid var(--paper)', borderRadius: 999,
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
          letterSpacing: '.14em',
          marginBottom: 14,
        }}>INVITE-ONLY · APPLY BELOW</div>
        <h1 style={{
          fontFamily: 'var(--cf-display)', fontWeight: 900,
          fontSize: 46, lineHeight: 0.92, letterSpacing: '-0.045em',
          margin: '0 0 18px',
        }}>Make money<br/><span style={{ color: 'var(--accent-1)' }}>printing<br/>nights.</span></h1>
        <p style={{
          fontFamily: 'var(--cf-ui)', fontSize: 15, fontWeight: 600,
          opacity: 0.8, lineHeight: 1.45, margin: '0 0 22px',
        }}>You curate one Confetti pass a week — your perfect night, your taste.
          Friends print it. We pay you when they show up.</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
          {[
            ['$8', 'per pass printed'],
            ['$22', 'per night completed'],
            ['72h', 'payout via stripe'],
            ['NYC, LA, SF', 'live'],
          ].map(([n, l]) => (
            <div key={n} style={{
              padding: 12,
              border: '2.5px solid var(--paper)', borderRadius: 12,
              background: 'rgba(255,250,240,0.08)',
            }}>
              <div style={{
                fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 24,
                letterSpacing: '-0.03em',
              }}>{n}</div>
              <div style={{
                fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
                opacity: 0.7, marginTop: 2, letterSpacing: '.08em',
                textTransform: 'uppercase',
              }}>{l}</div>
            </div>
          ))}
        </div>

        <div style={{
          fontFamily: 'var(--cf-mono)', fontSize: 11, fontWeight: 800,
          letterSpacing: '.14em', opacity: 0.55, textTransform: 'uppercase',
          marginBottom: 10,
        }}>HOW IT WORKS</div>
        {[
          ['01', 'apply', 'IG/TikTok handle + 1 sample night'],
          ['02', 'design a pass', 'in the app, like normal — name it'],
          ['03', 'share your code', 'every friend who prints earns you'],
          ['04', 'get paid', 'stripe weekly · 1099 at year-end'],
        ].map(([n, h, s], i) => (
          <div key={n} style={{
            display: 'flex', gap: 12, alignItems: 'center',
            padding: '12px 14px', marginBottom: 8,
            border: '2px solid var(--paper)', borderRadius: 12,
            background: 'rgba(255,250,240,0.05)',
          }}>
            <span style={{
              width: 36, height: 36, borderRadius: 999,
              border: '2.5px solid var(--paper)',
              background: 'var(--accent-1)', color: 'var(--ink)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 14,
              flexShrink: 0,
            }}>{n}</span>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 16,
                letterSpacing: '-0.02em',
              }}>{h}</div>
              <div style={{
                fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 600,
                opacity: 0.7, marginTop: 2,
              }}>{s}</div>
            </div>
          </div>
        ))}

        <button onClick={onApply} style={{
          appearance: 'none', cursor: 'pointer', width: '100%',
          marginTop: 18,
          padding: '18px 22px',
          border: '3px solid var(--paper)', borderRadius: 16,
          background: 'var(--accent-1)', color: 'var(--ink)',
          fontFamily: 'var(--cf-ui)', fontSize: 17, fontWeight: 900,
          boxShadow: '5px 5px 0 var(--paper)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>apply now {Icons.arrow}</button>
        <div style={{
          marginTop: 12, textAlign: 'center',
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
          opacity: 0.6, letterSpacing: '.12em',
        }}>1,200+ PROMOTERS · AVG $640 / WK</div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// 9. For Business landing (/for-business)
// ═════════════════════════════════════════════════════════════════
function ForBusinessScreen({ onBack, onSignUp }) {
  return (
    <div className="cf-screen" style={{
      position: 'relative', height: '100%',
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <DotsBg opacity={0.06} />

      <div style={{
        position: 'relative', zIndex: 2,
        padding: '56px 22px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button onClick={onBack} style={{
          appearance: 'none', cursor: 'pointer',
          width: 36, height: 36, borderRadius: 999,
          border: '2.5px solid var(--ink)', background: 'var(--paper)',
          fontSize: 14, fontWeight: 900,
          boxShadow: '3px 3px 0 var(--ink)',
        }}>←</button>
        <span style={{ fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 16,
                       letterSpacing: '-0.025em' }}>
          <span style={{ color: 'var(--accent-1)' }}>✣</span>confetti<span style={{ opacity: 0.55 }}>/biz</span>
        </span>
        <button onClick={onSignUp} style={{
          appearance: 'none', cursor: 'pointer',
          padding: '6px 12px',
          border: '2px solid var(--ink)', borderRadius: 999,
          background: 'var(--ink)', color: 'var(--paper)',
          fontFamily: 'var(--cf-ui)', fontSize: 11, fontWeight: 800,
        }}>sign in</button>
      </div>

      <div style={{
        position: 'relative', zIndex: 2,
        flex: 1, overflowY: 'auto',
        padding: '0 22px 24px', scrollbarWidth: 'none',
      }}>
        <Stamp color="var(--accent-2)" rotate={-3} style={{ marginBottom: 14 }}>
          for venues
        </Stamp>
        <h1 style={{
          fontFamily: 'var(--cf-display)', fontWeight: 900,
          fontSize: 44, lineHeight: 0.92, letterSpacing: '-0.045em',
          margin: '0 0 14px',
        }}>Fill the<br/>tables that<br/><span style={{ color: 'var(--accent-1)' }}>wouldn't<br/>have come.</span></h1>
        <p style={{
          fontFamily: 'var(--cf-ui)', fontSize: 15, fontWeight: 600,
          opacity: 0.75, lineHeight: 1.45, margin: '0 0 18px',
        }}>Confetti routes ready-to-spend customers through 3-stop passes.
          You set the slot. We send the people who fit. Auto-confirmed.</p>

        {/* Hero example */}
        <div style={{
          padding: 14,
          border: '2.5px solid var(--ink)', borderRadius: 14,
          background: 'var(--paper)',
          boxShadow: '5px 5px 0 var(--ink)', marginBottom: 18,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 10,
          }}>
            <span style={{
              fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
              letterSpacing: '.14em', opacity: 0.55,
            }}>SAT MAY 23 · LUPA NOTTE</span>
            <span style={{
              padding: '3px 8px', background: 'var(--accent-4, #2bb673)',
              color: 'var(--paper)',
              border: '1.5px solid var(--ink)', borderRadius: 4,
              fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
              letterSpacing: '.1em',
            }}>+$612</span>
          </div>
          <div style={{
            fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 22,
            letterSpacing: '-0.025em', lineHeight: 1,
          }}>12 covers from confetti.</div>
          <div style={{
            fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 700,
            opacity: 0.7, marginTop: 4,
          }}>11 new customers · 8 avg party · all pre-paid via Stripe deposit</div>
        </div>

        {/* Pricing tile */}
        <div style={{
          padding: 14, marginBottom: 18,
          border: '2.5px solid var(--ink)', borderRadius: 14,
          background: 'var(--accent-1)',
          boxShadow: '5px 5px 0 var(--ink)',
        }}>
          <div style={{
            fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
            letterSpacing: '.14em', opacity: 0.7, textTransform: 'uppercase',
          }}>SIMPLE PRICING</div>
          <div style={{
            fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 32,
            letterSpacing: '-0.035em', lineHeight: 1, marginTop: 4,
          }}>3% per cover.</div>
          <div style={{
            fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 700,
            marginTop: 6,
          }}>No subscription. No setup. No fee unless people actually show up.</div>
        </div>

        <SectionLabel>partners we love</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
          {[
            ['Lupa Notte', 'italian · 4.7★'],
            ['Westlight', 'rooftop · 4.5★'],
            ['Eavesdrop', 'jazz · 4.7★'],
            ['Baby\'s All Right', 'venue · 4.4★'],
          ].map(([n, t]) => (
            <div key={n} style={{
              padding: 10,
              border: '2px solid var(--ink)', borderRadius: 10,
              background: 'var(--paper)',
            }}>
              <div style={{
                fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 13,
                letterSpacing: '-0.02em',
              }}>{n}</div>
              <div style={{
                fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 700,
                opacity: 0.55, marginTop: 2,
              }}>{t}</div>
            </div>
          ))}
        </div>

        <button onClick={onSignUp} style={{
          appearance: 'none', cursor: 'pointer', width: '100%',
          marginTop: 8,
          padding: '18px 22px',
          border: '3px solid var(--ink)', borderRadius: 16,
          background: 'var(--ink)', color: 'var(--paper)',
          fontFamily: 'var(--cf-ui)', fontSize: 16, fontWeight: 900,
          boxShadow: '5px 5px 0 var(--accent-1)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>claim your venue {Icons.arrow}</button>
        <div style={{
          marginTop: 12, textAlign: 'center',
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
          opacity: 0.55, letterSpacing: '.1em',
        }}>OR EMAIL HELLO@CONFETTI.APP · WE'LL ONBOARD YOU IN 30 MIN</div>
      </div>
    </div>
  );
}

// Provide a top-level SectionLabel for files that don't have one in scope
function SectionLabel({ children }) {
  return (
    <div style={{
      fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
      letterSpacing: '.16em', textTransform: 'uppercase',
      opacity: 0.55, marginBottom: 10,
    }}>{children}</div>
  );
}

Object.assign(window, {
  TripsListScreen, QRCheckInScreen, CheckoutReturnScreen,
  ReferralScreen, AboutScreen, PrivacyScreen,
  EventsListScreen, EventDetailScreen,
  InfluencerScreen, ForBusinessScreen,
});
