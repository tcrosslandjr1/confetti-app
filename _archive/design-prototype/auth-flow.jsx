// auth-flow.jsx — The missing auth screens for production
// Phone OTP, email verify, age gate, parental consent, forgot pw,
// 2FA setup, account locked, pricing gate

const { useState: useStateAF, useEffect: useEffectAF, useRef: useRefAF } = React;

// ═════════════════════════════════════════════════════════════════
// PhoneVerifyScreen — OTP entry
// ═════════════════════════════════════════════════════════════════
function PhoneVerifyScreen({ phone = '(347) 555-0182', onVerified, onBack }) {
  const [code, setCode] = useStateAF(['', '', '', '', '', '']);
  const [seconds, setSeconds] = useStateAF(38);
  const [error, setError] = useStateAF(null);
  const refs = useRefAF([]);

  useEffectAF(() => {
    if (seconds <= 0) return;
    const t = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [seconds]);

  useEffectAF(() => { refs.current[0]?.focus(); }, []);

  const setDigit = (i, val) => {
    const v = val.replace(/\D/g, '').slice(0, 1);
    const next = [...code]; next[i] = v;
    setCode(next);
    setError(null);
    if (v && i < 5) refs.current[i + 1]?.focus();
    if (next.every(d => d) && next.join('').length === 6) {
      // simulated verify
      if (next.join('') === '424242') setError('Wrong code. Try 123456.');
      else setTimeout(onVerified, 400);
    }
  };

  const onKey = (i, e) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) refs.current[i - 1]?.focus();
  };

  return (
    <div className="cf-screen" style={{
      position: 'relative', height: '100%',
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      padding: '70px 24px 36px', overflow: 'hidden',
    }}>
      <DotsBg opacity={0.06} />
      <div style={{ position: 'relative', zIndex: 2 }}>
        <button onClick={onBack} style={{
          appearance: 'none', cursor: 'pointer',
          width: 36, height: 36, borderRadius: 999,
          border: '2.5px solid var(--ink)', background: 'var(--paper)',
          fontSize: 14, fontWeight: 900,
          boxShadow: '3px 3px 0 var(--ink)',
        }}>←</button>
      </div>
      <div style={{
        position: 'relative', zIndex: 2,
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', gap: 22,
      }}>
        <Stamp color="var(--accent-2)" rotate={-3}
               style={{ alignSelf: 'flex-start' }}>
          step 02 · verify
        </Stamp>
        <h1 style={{
          fontFamily: 'var(--cf-display)', fontWeight: 900,
          fontSize: 40, lineHeight: 0.95, letterSpacing: '-0.04em',
          margin: 0,
        }}>Code sent to<br/>{phone}.</h1>
        <p style={{
          fontFamily: 'var(--cf-ui)', fontSize: 14, fontWeight: 700,
          opacity: 0.65, margin: 0,
        }}>Twilio · should arrive in &lt; 10 seconds. Try <strong>123456</strong>.</p>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {code.map((d, i) => (
            <input
              key={i}
              ref={el => refs.current[i] = el}
              value={d}
              onChange={e => setDigit(i, e.target.value)}
              onKeyDown={e => onKey(i, e)}
              inputMode="numeric" maxLength={1}
              style={{
                width: 44, height: 56, textAlign: 'center',
                border: '2.5px solid var(--ink)', borderRadius: 12,
                background: 'var(--paper)', color: 'var(--ink)',
                fontFamily: 'var(--cf-display)', fontSize: 26, fontWeight: 900,
                boxShadow: '3px 3px 0 var(--ink)', outline: 'none',
              }}
            />
          ))}
        </div>

        {error && (
          <div style={{
            padding: '10px 14px',
            background: '#d32323', color: '#fff',
            border: '2px solid var(--ink)', borderRadius: 10,
            fontFamily: 'var(--cf-mono)', fontSize: 11, fontWeight: 800,
            letterSpacing: '.08em',
          }}>⚠ {error}</div>
        )}

        <div style={{ textAlign: 'center' }}>
          {seconds > 0 ? (
            <span style={{
              fontFamily: 'var(--cf-mono)', fontSize: 11, fontWeight: 700,
              opacity: 0.55, letterSpacing: '.1em',
            }}>RESEND IN {seconds}S</span>
          ) : (
            <button onClick={() => setSeconds(38)} style={{
              appearance: 'none', cursor: 'pointer',
              background: 'transparent', border: 'none', padding: 6,
              fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 900,
              color: 'var(--accent-1)', textDecoration: 'underline',
            }}>resend code</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// EmailVerifyScreen — Magic link sent confirmation
// ═════════════════════════════════════════════════════════════════
function EmailVerifyScreen({ email = 'jess@brooklyn.com', onContinue, onBack }) {
  return (
    <div className="cf-screen" style={{
      position: 'relative', height: '100%',
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      padding: '70px 24px 36px', overflow: 'hidden',
    }}>
      <DotsBg opacity={0.06} />
      <FloatingTickets density={3} />
      <div style={{ position: 'relative', zIndex: 2 }}>
        <button onClick={onBack} style={{
          appearance: 'none', cursor: 'pointer',
          width: 36, height: 36, borderRadius: 999,
          border: '2.5px solid var(--ink)', background: 'var(--paper)',
          fontSize: 14, fontWeight: 900,
          boxShadow: '3px 3px 0 var(--ink)',
        }}>←</button>
      </div>
      <div style={{
        position: 'relative', zIndex: 2,
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        textAlign: 'center', gap: 18,
      }}>
        <div style={{
          width: 100, height: 100, borderRadius: 22,
          border: '3px solid var(--ink)', background: 'var(--accent-2)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 56, boxShadow: '6px 6px 0 var(--ink)',
          transform: 'rotate(-3deg)',
        }}>✉</div>
        <h1 style={{
          fontFamily: 'var(--cf-display)', fontWeight: 900,
          fontSize: 40, lineHeight: 0.95, letterSpacing: '-0.04em',
          margin: 0,
        }}>Check your inbox.</h1>
        <p style={{
          fontFamily: 'var(--cf-ui)', fontSize: 15, fontWeight: 700,
          opacity: 0.75, margin: 0, maxWidth: 300, lineHeight: 1.4,
        }}>We sent a magic link to<br/><strong>{email}</strong>. Tap it on this phone to finish.</p>
        <div style={{
          padding: '10px 14px', marginTop: 6,
          background: 'var(--paper)',
          border: '2px dashed var(--ink)', borderRadius: 10,
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
          opacity: 0.7, letterSpacing: '.04em', lineHeight: 1.5,
        }}>📨 link expires in 15 min · sent via SendGrid</div>
        <button onClick={onContinue} style={{
          appearance: 'none', cursor: 'pointer', marginTop: 14,
          padding: '12px 18px',
          border: '2.5px solid var(--ink)', borderRadius: 999,
          background: 'var(--ink)', color: 'var(--paper)',
          fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 800,
        }}>I clicked it →</button>
        <button style={{
          appearance: 'none', cursor: 'pointer',
          background: 'transparent', border: 'none', padding: 6,
          fontFamily: 'var(--cf-mono)', fontSize: 11, fontWeight: 700,
          opacity: 0.55, letterSpacing: '.08em',
          textDecoration: 'underline',
        }}>resend · use a different email</button>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// AgeGateScreen — required for Family / Kids mode (COPPA)
// ═════════════════════════════════════════════════════════════════
function AgeGateScreen({ onAdult, onUnder13, onBack }) {
  const [day, setDay] = useStateAF('');
  const [month, setMonth] = useStateAF('');
  const [year, setYear] = useStateAF('');

  const submit = () => {
    const y = parseInt(year, 10);
    if (!y) return;
    const age = 2026 - y;
    if (age < 13) onUnder13?.();
    else onAdult?.();
  };

  return (
    <div className="cf-screen" style={{
      position: 'relative', height: '100%',
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      padding: '70px 24px 36px', overflow: 'hidden',
    }}>
      <DotsBg opacity={0.06} />
      <div style={{ position: 'relative', zIndex: 2 }}>
        <button onClick={onBack} style={{
          appearance: 'none', cursor: 'pointer',
          width: 36, height: 36, borderRadius: 999,
          border: '2.5px solid var(--ink)', background: 'var(--paper)',
          fontSize: 14, fontWeight: 900,
          boxShadow: '3px 3px 0 var(--ink)',
        }}>←</button>
      </div>

      <div style={{
        position: 'relative', zIndex: 2,
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', gap: 20,
      }}>
        <Stamp color="var(--accent-3)" rotate={-2}
               style={{ alignSelf: 'flex-start', color: 'var(--paper)' }}>
          COPPA · required
        </Stamp>
        <h1 style={{
          fontFamily: 'var(--cf-display)', fontWeight: 900,
          fontSize: 36, lineHeight: 0.95, letterSpacing: '-0.04em',
          margin: 0,
        }}>How old are you?</h1>
        <p style={{
          fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 700,
          opacity: 0.7, margin: 0, lineHeight: 1.4,
        }}>Required by law for accounts that use Family or Kids mode. We don't share this with anyone.</p>

        <div style={{ display: 'flex', gap: 10 }}>
          <DateField label="MONTH" placeholder="MM" max={2}
            value={month} onChange={setMonth} />
          <DateField label="DAY" placeholder="DD" max={2}
            value={day} onChange={setDay} />
          <DateField label="YEAR" placeholder="YYYY" max={4} flex={1.4}
            value={year} onChange={setYear} />
        </div>

        <ChunkyButton variant="accent" onClick={submit}
          disabled={year.length !== 4} icon={Icons.arrow}>
          continue
        </ChunkyButton>

        <div style={{
          padding: '10px 12px',
          background: 'var(--paper)',
          border: '2px dashed var(--ink)', borderRadius: 10,
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
          opacity: 0.7, lineHeight: 1.5, letterSpacing: '.04em',
        }}>
          🔒 Under 13? You'll need a parent/guardian to confirm via email. Required by COPPA (US) and similar laws elsewhere.
        </div>
      </div>
    </div>
  );
}

function DateField({ label, placeholder, value, onChange, max, flex = 1 }) {
  return (
    <div style={{ flex }}>
      <div style={{
        fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
        letterSpacing: '.14em', opacity: 0.55, marginBottom: 6,
      }}>{label}</div>
      <input
        value={value}
        onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, max))}
        placeholder={placeholder}
        inputMode="numeric"
        style={{
          width: '100%', textAlign: 'center',
          padding: '14px 6px',
          border: '2.5px solid var(--ink)', borderRadius: 14,
          background: 'var(--paper)', color: 'var(--ink)',
          fontFamily: 'var(--cf-display)', fontSize: 22, fontWeight: 900,
          outline: 'none', boxShadow: '3px 3px 0 var(--ink)',
          boxSizing: 'border-box',
        }} />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// ParentalConsentScreen — under-13 parent-email collection
// ═════════════════════════════════════════════════════════════════
function ParentalConsentScreen({ onSent, onBack }) {
  const [parentEmail, setParentEmail] = useStateAF('');
  const [sent, setSent] = useStateAF(false);

  if (sent) {
    return (
      <div className="cf-screen" style={{
        position: 'relative', height: '100%', background: 'var(--bg)',
        display: 'flex', flexDirection: 'column',
        padding: '70px 24px 36px', overflow: 'hidden',
      }}>
        <DotsBg opacity={0.06} />
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', gap: 16, zIndex: 2, position: 'relative',
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: 999,
            border: '4px solid var(--ink)', background: 'var(--accent-1)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36, boxShadow: '5px 5px 0 var(--ink)',
          }}>👨‍👩‍👧</div>
          <h1 style={{
            fontFamily: 'var(--cf-display)', fontWeight: 900,
            fontSize: 32, lineHeight: 0.95, letterSpacing: '-0.04em',
            margin: 0,
          }}>Sent to {parentEmail}.</h1>
          <p style={{
            fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 700,
            opacity: 0.7, margin: 0, maxWidth: 290, lineHeight: 1.4,
          }}>Ask a parent or guardian to click the link in their inbox. Your account stays paused until they approve.</p>
          <button onClick={onSent} style={{
            appearance: 'none', cursor: 'pointer', marginTop: 8,
            padding: '12px 18px',
            border: '2.5px solid var(--ink)', borderRadius: 999,
            background: 'var(--ink)', color: 'var(--paper)',
            fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 800,
          }}>done — they got it</button>
        </div>
      </div>
    );
  }

  return (
    <div className="cf-screen" style={{
      position: 'relative', height: '100%', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      padding: '70px 24px 36px', overflow: 'hidden',
    }}>
      <DotsBg opacity={0.06} />
      <div style={{ position: 'relative', zIndex: 2 }}>
        <button onClick={onBack} style={{
          appearance: 'none', cursor: 'pointer',
          width: 36, height: 36, borderRadius: 999,
          border: '2.5px solid var(--ink)', background: 'var(--paper)',
          fontSize: 14, fontWeight: 900,
          boxShadow: '3px 3px 0 var(--ink)',
        }}>←</button>
      </div>
      <div style={{
        position: 'relative', zIndex: 2,
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', gap: 18,
      }}>
        <Stamp color="var(--accent-3)" rotate={-3}
               style={{ alignSelf: 'flex-start', color: 'var(--paper)' }}>
          parent · guardian consent
        </Stamp>
        <h1 style={{
          fontFamily: 'var(--cf-display)', fontWeight: 900,
          fontSize: 34, lineHeight: 0.95, letterSpacing: '-0.04em',
          margin: 0,
        }}>A grown-up has to<br/>say it's ok.</h1>
        <p style={{
          fontFamily: 'var(--cf-ui)', fontSize: 14, fontWeight: 700,
          opacity: 0.7, margin: 0, lineHeight: 1.4, maxWidth: 320,
        }}>Drop a parent or guardian's email. We'll send them a one-time approval link. Confetti can't be used until they accept.</p>
        <div>
          <div style={{
            fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
            letterSpacing: '.14em', opacity: 0.55, textTransform: 'uppercase',
            marginBottom: 6,
          }}>PARENT / GUARDIAN EMAIL</div>
          <input
            value={parentEmail} onChange={e => setParentEmail(e.target.value)}
            placeholder="grownup@home.com"
            style={{
              width: '100%', padding: '14px 16px',
              border: '2.5px solid var(--ink)', borderRadius: 14,
              background: 'var(--paper)', color: 'var(--ink)',
              fontFamily: 'var(--cf-ui)', fontSize: 16, fontWeight: 700,
              outline: 'none', boxShadow: '4px 4px 0 var(--ink)',
              boxSizing: 'border-box',
            }} />
        </div>
        <ChunkyButton variant="accent"
          onClick={() => parentEmail.includes('@') && setSent(true)}
          disabled={!parentEmail.includes('@')} icon={Icons.arrow}>
          send approval email
        </ChunkyButton>
        <div style={{
          padding: '10px 12px',
          background: 'var(--paper)',
          border: '2px dashed var(--ink)', borderRadius: 10,
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
          opacity: 0.7, lineHeight: 1.5, letterSpacing: '.04em',
        }}>
          🔒 COPPA · We never collect data from under-13s without parent consent.
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// ForgotPwScreen
// ═════════════════════════════════════════════════════════════════
function ForgotPwScreen({ onBack, onSent }) {
  const [email, setEmail] = useStateAF('');
  return (
    <div className="cf-screen" style={{
      position: 'relative', height: '100%', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      padding: '70px 24px 36px', overflow: 'hidden',
    }}>
      <DotsBg opacity={0.06} />
      <div style={{ position: 'relative', zIndex: 2 }}>
        <button onClick={onBack} style={{
          appearance: 'none', cursor: 'pointer',
          width: 36, height: 36, borderRadius: 999,
          border: '2.5px solid var(--ink)', background: 'var(--paper)',
          fontSize: 14, fontWeight: 900,
          boxShadow: '3px 3px 0 var(--ink)',
        }}>←</button>
      </div>
      <div style={{
        position: 'relative', zIndex: 2,
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', gap: 18,
      }}>
        <h1 style={{
          fontFamily: 'var(--cf-display)', fontWeight: 900,
          fontSize: 40, lineHeight: 0.95, letterSpacing: '-0.04em',
          margin: 0,
        }}>Locked out?<br/>No problem.</h1>
        <p style={{
          fontFamily: 'var(--cf-ui)', fontSize: 14, fontWeight: 700,
          opacity: 0.7, margin: 0,
        }}>Drop your email. We'll send a reset link.</p>
        <div>
          <input value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@inbox.com"
            style={{
              width: '100%', padding: '14px 16px',
              border: '2.5px solid var(--ink)', borderRadius: 14,
              background: 'var(--paper)', color: 'var(--ink)',
              fontFamily: 'var(--cf-ui)', fontSize: 16, fontWeight: 700,
              outline: 'none', boxShadow: '4px 4px 0 var(--ink)',
              boxSizing: 'border-box',
            }} />
        </div>
        <ChunkyButton variant="accent" onClick={onSent} icon={Icons.arrow}>
          send reset link
        </ChunkyButton>
        <div style={{ textAlign: 'center', marginTop: 6 }}>
          <button onClick={onBack} style={{
            appearance: 'none', cursor: 'pointer',
            background: 'transparent', border: 'none', padding: 6,
            fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 800,
            color: 'var(--ink)', opacity: 0.65,
            textDecoration: 'underline',
          }}>back to sign in</button>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// TwoFactorScreen — enabling 2FA
// ═════════════════════════════════════════════════════════════════
function TwoFactorScreen({ onBack, onEnabled }) {
  const [method, setMethod] = useStateAF('sms');
  return (
    <div className="cf-screen" style={{
      position: 'relative', height: '100%', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      padding: '56px 22px 24px', overflow: 'hidden',
    }}>
      <DotsBg opacity={0.05} />
      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
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
          letterSpacing: '-0.02em',
        }}>Two-factor</span>
      </div>
      <div style={{
        position: 'relative', zIndex: 2, flex: 1,
        overflowY: 'auto', scrollbarWidth: 'none',
      }}>
        <Stamp color="var(--accent-1)" rotate={-2}
               style={{ alignSelf: 'flex-start', marginBottom: 12 }}>
          recommended
        </Stamp>
        <h2 style={{
          fontFamily: 'var(--cf-display)', fontWeight: 900,
          fontSize: 32, lineHeight: 0.95, letterSpacing: '-0.04em',
          margin: '0 0 8px',
        }}>Lock down your<br/>Confetti account.</h2>
        <p style={{
          fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 700,
          opacity: 0.65, margin: '0 0 18px', lineHeight: 1.4,
        }}>You've got real money, real plans, and real check-ins in here. Two-factor takes 10 seconds.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
          <Method2FA id="sms" active={method} setActive={setMethod}
            icon="📱" label="Text message" sub="Twilio · (347) 555-0182"
            rec="quickest" />
          <Method2FA id="app" active={method} setActive={setMethod}
            icon="🔐" label="Authenticator app" sub="1Password · Authy · Google"
            rec="most secure" />
          <Method2FA id="key" active={method} setActive={setMethod}
            icon="🔑" label="Hardware key" sub="YubiKey · Titan"
            rec="strongest" />
        </div>

        {/* Backup codes preview */}
        <div style={{
          padding: 14, marginBottom: 18,
          border: '2.5px solid var(--ink)', borderRadius: 14,
          background: 'var(--ink)', color: 'var(--paper)',
        }}>
          <div style={{
            fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
            letterSpacing: '.14em', opacity: 0.7, marginBottom: 8,
          }}>BACKUP CODES · SAVE OR PRINT</div>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6,
            fontFamily: 'var(--cf-mono)', fontSize: 13, fontWeight: 700,
            letterSpacing: '.06em',
          }}>
            {['8K2D-9XQR', '7VLP-3MJN', 'F4HW-2RZB', '9YGT-X1KQ',
              '6CMP-NL83', 'WB52-DXH9'].map(c => (
              <div key={c} style={{
                padding: '6px 10px',
                background: 'rgba(255,250,240,0.08)',
                border: '1px solid rgba(255,250,240,0.25)',
                borderRadius: 6,
              }}>{c}</div>
            ))}
          </div>
        </div>

        <ChunkyButton variant="accent" onClick={onEnabled} icon={Icons.arrow}>
          enable 2-factor
        </ChunkyButton>
      </div>
    </div>
  );
}

function Method2FA({ id, active, setActive, icon, label, sub, rec }) {
  const on = active === id;
  return (
    <button onClick={() => setActive(id)} style={{
      appearance: 'none', cursor: 'pointer', textAlign: 'left',
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px',
      border: '2.5px solid var(--ink)', borderRadius: 14,
      background: on ? 'var(--accent-1)' : 'var(--paper)',
      boxShadow: on ? '4px 4px 0 var(--ink)' : 'none',
      transform: on ? 'translate(-1px,-1px)' : 'none',
      transition: 'all .12s',
    }}>
      <span style={{ fontSize: 22, width: 36 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 16,
          letterSpacing: '-0.02em',
        }}>{label}</div>
        <div style={{
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
          opacity: 0.65, marginTop: 2, letterSpacing: '.06em',
        }}>{sub}</div>
      </div>
      <span style={{
        padding: '3px 8px',
        background: on ? 'var(--ink)' : 'var(--bg)',
        color: on ? 'var(--paper)' : 'var(--ink)',
        border: '1.5px solid var(--ink)', borderRadius: 999,
        fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
        letterSpacing: '.1em', textTransform: 'uppercase',
      }}>{rec}</span>
    </button>
  );
}

// ═════════════════════════════════════════════════════════════════
// AccountLockedScreen — too many attempts
// ═════════════════════════════════════════════════════════════════
function AccountLockedScreen({ onRecover, onContactSupport }) {
  return (
    <div className="cf-screen" style={{
      position: 'relative', height: '100%',
      background: 'var(--ink)', color: 'var(--paper)',
      display: 'flex', flexDirection: 'column',
      padding: '70px 24px 36px', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.12,
        backgroundImage: `radial-gradient(var(--paper) 1px, transparent 1px)`,
        backgroundSize: '22px 22px',
      }} />
      <div style={{
        position: 'relative', zIndex: 2,
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', gap: 18, textAlign: 'left',
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: 16,
          border: '4px solid var(--paper)', background: '#d32323',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 38, alignSelf: 'flex-start',
          boxShadow: '5px 5px 0 var(--accent-1)',
        }}>🔒</div>
        <h1 style={{
          fontFamily: 'var(--cf-display)', fontWeight: 900,
          fontSize: 44, lineHeight: 0.92, letterSpacing: '-0.045em',
          margin: 0,
        }}>Account paused<br/>for safety.</h1>
        <p style={{
          fontFamily: 'var(--cf-ui)', fontSize: 14, fontWeight: 700,
          opacity: 0.8, margin: 0, lineHeight: 1.45, maxWidth: 320,
        }}>5 wrong code attempts in 10 minutes. We've locked sign-in for an hour. If this wasn't you, recover now.</p>
        <ChunkyButton variant="accent" onClick={onRecover} icon={Icons.arrow}>
          recover with email
        </ChunkyButton>
        <button onClick={onContactSupport} style={{
          appearance: 'none', cursor: 'pointer',
          background: 'transparent',
          border: '2px solid var(--paper)', borderRadius: 999,
          padding: '12px 18px',
          fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 800,
          color: 'var(--paper)',
        }}>contact support</button>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// PaywallGateScreen — free vs All-Access pick after signup
// ═════════════════════════════════════════════════════════════════
function PaywallGateScreen({ onFree, onPaid, onBack }) {
  return (
    <div className="cf-screen" style={{
      position: 'relative', height: '100%', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      padding: '56px 22px 24px', overflow: 'hidden',
    }}>
      <DotsBg opacity={0.06} />
      <FloatingTickets density={4} />
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
        <BrandMark size={17} />
        <span style={{ width: 36 }} />
      </div>
      <div style={{
        position: 'relative', zIndex: 2, flex: 1,
        overflowY: 'auto', scrollbarWidth: 'none',
      }}>
        <Stamp color="var(--accent-1)" rotate={-3}
               style={{ alignSelf: 'flex-start', marginBottom: 12 }}>
          pick a path
        </Stamp>
        <h1 style={{
          fontFamily: 'var(--cf-display)', fontWeight: 900,
          fontSize: 38, lineHeight: 0.92, letterSpacing: '-0.04em',
          margin: '0 0 6px',
        }}>One plan.<br/>Every kind of plan.</h1>
        <p style={{
          fontFamily: 'var(--cf-ui)', fontSize: 14, fontWeight: 700,
          opacity: 0.65, margin: '0 0 18px',
        }}>Start free. Upgrade when you want unlimited plans + Family Mode + Party Memory Kit.</p>

        {/* All-Access (recommended) */}
        <button onClick={onPaid} style={{
          appearance: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
          padding: 18, marginBottom: 12,
          border: '3px solid var(--ink)', borderRadius: 18,
          background: 'var(--accent-1)', color: 'var(--ink)',
          boxShadow: '6px 6px 0 var(--ink)',
          position: 'relative',
        }}>
          <span style={{
            position: 'absolute', top: -10, right: 14,
            padding: '3px 10px',
            background: 'var(--ink)', color: 'var(--paper)',
            border: '2px solid var(--ink)', borderRadius: 999,
            fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
            letterSpacing: '.14em',
          }}>RECOMMENDED · 7-DAY FREE</span>
          <div style={{
            fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
            letterSpacing: '.14em', opacity: 0.7, textTransform: 'uppercase',
          }}>ALL-ACCESS</div>
          <div style={{
            fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 38,
            letterSpacing: '-0.04em', lineHeight: 1, marginTop: 4,
          }}>$9.99 <span style={{ fontSize: 16, opacity: 0.6 }}>/mo</span></div>
          <div style={{
            fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 700,
            opacity: 0.8, marginTop: 4,
          }}>Or $99/yr · save 17%</div>
          <ul style={{
            listStyle: 'none', padding: 0, margin: '12px 0 0',
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 10px',
            fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 700,
          }}>
            {['Unlimited plans', 'Family Mode', 'Kids parties', 'Hosting plans',
              'Boarding passes', 'Party Memory Kit', 'RSVP tracker', 'Confetti rewards'].map(f => (
              <li key={f} style={{
                display: 'flex', gap: 5,
              }}>✓ {f}</li>
            ))}
          </ul>
        </button>

        {/* Free tier */}
        <button onClick={onFree} style={{
          appearance: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
          padding: 16,
          border: '2.5px solid var(--ink)', borderRadius: 14,
          background: 'var(--paper)', color: 'var(--ink)',
          boxShadow: '4px 4px 0 var(--ink)',
        }}>
          <div style={{
            fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
            letterSpacing: '.14em', opacity: 0.55, textTransform: 'uppercase',
          }}>FREE</div>
          <div style={{
            fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 28,
            letterSpacing: '-0.035em', lineHeight: 1, marginTop: 4,
          }}>$0</div>
          <div style={{
            fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 700,
            opacity: 0.65, marginTop: 6,
          }}>3 plans/wk · adults mode only · ads on venue pages</div>
        </button>

        <div style={{
          marginTop: 16, padding: '10px 12px',
          background: 'var(--paper)',
          border: '2px dashed var(--ink)', borderRadius: 10,
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
          opacity: 0.7, lineHeight: 1.5, letterSpacing: '.04em',
        }}>
          🔒 No charge during the 7-day trial. Cancel any time in Settings. We use Stripe.
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  PhoneVerifyScreen, EmailVerifyScreen,
  AgeGateScreen, ParentalConsentScreen,
  ForgotPwScreen, TwoFactorScreen,
  AccountLockedScreen, PaywallGateScreen,
});
