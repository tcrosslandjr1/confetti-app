// auth.jsx — Sign in, Sign up, Parking sheet, Geofence auto-check-in, Settings

const { useState: useStateA, useEffect: useEffectA } = React;

// ═════════════════════════════════════════════════════════════════
// 1. Sign In
// ═════════════════════════════════════════════════════════════════
function SignInScreen({ onSignIn, onSignUp }) {
  const [email, setEmail] = useStateA('jess@brooklyn.com');
  const [sent, setSent] = useStateA(false);

  return (
    <div className="cf-screen" style={{
      position: 'relative', height: '100%',
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      padding: '70px 28px 36px',
      overflow: 'hidden',
    }}>
      <DotsBg opacity={0.06} />
      <FloatingTickets density={4} />

      <div style={{ position: 'relative', zIndex: 2 }}>
        <BrandMark size={20} spin />
      </div>

      <div style={{
        position: 'relative', zIndex: 2,
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', gap: 18,
      }}>
        <Stamp color="var(--accent-2)" rotate={-3}
               style={{ alignSelf: 'flex-start' }}>welcome back</Stamp>
        <h1 style={{
          fontFamily: 'var(--cf-display)', fontWeight: 900,
          fontSize: 44, lineHeight: 0.95, letterSpacing: '-0.04em',
          color: 'var(--ink)', margin: 0,
        }}>
          Pick up<br/>where you left.
        </h1>

        {!sent ? (
          <>
            <div>
              <div style={{
                fontFamily: 'var(--cf-mono)', fontSize: 11, fontWeight: 800,
                letterSpacing: '.14em', opacity: 0.55, textTransform: 'uppercase',
                marginBottom: 8,
              }}>email · we'll text you a magic link</div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '14px 16px',
                border: '2.5px solid var(--ink)', borderRadius: 14,
                background: 'var(--paper)',
                boxShadow: '4px 4px 0 var(--ink)',
              }}>
                <span style={{ color: 'var(--accent-1)' }}>✉</span>
                <input value={email} onChange={e => setEmail(e.target.value)}
                       style={{
                         appearance: 'none', border: 'none', outline: 'none',
                         background: 'transparent', flex: 1,
                         fontFamily: 'var(--cf-ui)', fontSize: 16, fontWeight: 700,
                         color: 'var(--ink)',
                       }} />
              </div>
            </div>
            <ChunkyButton variant="accent" onClick={() => setSent(true)} icon={Icons.arrow}>
              send magic link
            </ChunkyButton>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
              opacity: 0.5, letterSpacing: '.12em', margin: '4px 0',
            }}>
              <div style={{ flex: 1, height: 2, background: 'var(--ink)', opacity: 0.15 }} />
              OR ONE-TAP
              <div style={{ flex: 1, height: 2, background: 'var(--ink)', opacity: 0.15 }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <SSOTile label="Apple" glyph={<AppleGlyph/>}
                       bg="var(--ink)" fg="var(--paper)" />
              <SSOTile label="Google" glyph="G"
                       bg="var(--paper)" fg="var(--ink)" />
              <SSOTile label="TikTok" glyph={<TikTokGlyph/>}
                       bg="var(--ink)" fg="var(--paper)" />
              <SSOTile label="Instagram" glyph={<IGGlyph/>}
                       bg="var(--accent-3)" fg="var(--paper)" />
              <SSOTile label="X" glyph={<XGlyph/>}
                       bg="var(--ink)" fg="var(--paper)" />
              <SSOTile label="Spotify" glyph="♫"
                       bg="#1DB954" fg="var(--ink)" />
            </div>
            <button style={{
              appearance: 'none', cursor: 'pointer', width: '100%',
              padding: '12px 14px',
              border: '2px dashed var(--ink)', borderRadius: 12,
              background: 'transparent',
              fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 800,
              color: 'var(--ink)', marginTop: 8,
            }}>📱 continue with phone</button>
          </>
        ) : (
          <div style={{
            padding: 20,
            border: '3px solid var(--ink)', borderRadius: 18,
            background: 'var(--accent-2)',
            boxShadow: '5px 5px 0 var(--ink)',
          }}>
            <div style={{
              fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
              letterSpacing: '.14em', textTransform: 'uppercase', opacity: 0.7,
            }}>CHECK YOUR INBOX</div>
            <div style={{
              fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 22,
              letterSpacing: '-0.025em', marginTop: 6, lineHeight: 1.1,
            }}>We sent a link to<br/>{email}.</div>
            <button onClick={onSignIn} style={{
              appearance: 'none', cursor: 'pointer',
              marginTop: 14, padding: '10px 16px',
              border: '2.5px solid var(--ink)', borderRadius: 999,
              background: 'var(--ink)', color: 'var(--paper)',
              fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 800,
            }}>simulate click →</button>
          </div>
        )}
      </div>

      <div style={{
        position: 'relative', zIndex: 2,
        textAlign: 'center',
        fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 600,
        color: 'var(--ink)', opacity: 0.7,
      }}>
        new here?{' '}
        <button onClick={onSignUp} style={{
          appearance: 'none', cursor: 'pointer', background: 'transparent',
          border: 'none', padding: 0, fontFamily: 'inherit', fontSize: 'inherit',
          fontWeight: 900, color: 'var(--accent-1)',
          textDecoration: 'underline', textUnderlineOffset: 3,
        }}>print your first night →</button>
      </div>
    </div>
  );
}

function SSOButton({ label, icon, bg, fg }) {
  return (
    <button style={{
      appearance: 'none', cursor: 'pointer', width: '100%',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      padding: '14px 18px',
      border: '2.5px solid var(--ink)', borderRadius: 14,
      background: bg, color: fg,
      fontFamily: 'var(--cf-ui)', fontSize: 15, fontWeight: 800,
      boxShadow: '4px 4px 0 var(--ink)',
    }}>
      {icon && <span style={{
        width: 22, height: 22, borderRadius: 999,
        background: fg, color: bg,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 12,
      }}>{icon}</span>}
      {label}
    </button>
  );
}

function SSOTile({ label, glyph, bg, fg }) {
  return (
    <button style={{
      appearance: 'none', cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      padding: '12px 10px',
      border: '2.5px solid var(--ink)', borderRadius: 12,
      background: bg, color: fg,
      fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 900,
      boxShadow: '3px 3px 0 var(--ink)',
    }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 18, height: 18,
        fontFamily: typeof glyph === 'string' ? 'var(--cf-display)' : 'inherit',
        fontWeight: 900, fontSize: 14,
      }}>{glyph}</span>
      {label}
    </button>
  );
}

const AppleGlyph = () => (
  <svg width="14" height="16" viewBox="0 0 14 16" fill="currentColor">
    <path d="M11.6 8.5c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9s-1.8-.9-3-.9C2.2 3.3.6 4.2-.3 5.6c-1.3 2.2-.3 5.5 1 7.3.6.9 1.3 1.9 2.3 1.9s1.3-.6 2.5-.6 1.5.6 2.5.6 1.7-.9 2.3-1.8c.7-1 1-2 1-2.1-.1 0-2-.8-2-3zM9.4 1.6C9.9.9 10.3-.1 10.2-1c-.8 0-1.9.6-2.5 1.2-.5.6-1 1.5-.9 2.4.9.1 1.9-.4 2.6-1z" transform="translate(1 1)"/>
  </svg>
);
const TikTokGlyph = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M9.8 1.4v1.7a2.8 2.8 0 0 0 2.7 2.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M9.8 1.4v7a2.8 2.8 0 1 1-2.8-2.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IGGlyph = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="1.5" y="1.5" width="11" height="11" rx="3" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="10.3" cy="3.8" r="0.8" fill="currentColor"/>
  </svg>
);
const XGlyph = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M2 2l9 9M11 2l-9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// ═════════════════════════════════════════════════════════════════
// 2. Sign up — multi-step (phone → vibe quiz → permissions)
// ═════════════════════════════════════════════════════════════════
function SignUpScreen({ onDone, onSignIn }) {
  const [step, setStep] = useStateA(0);
  const [data, setData] = useStateA({
    name: '', phone: '',
    city: 'Brooklyn, NY',
    vibeRanks: {},
    perms: { location: false, push: false, contacts: false },
  });

  const steps = ['who', 'where', 'vibe', 'connect', 'permissions'];
  const next = () => step < steps.length - 1 ? setStep(step + 1) : onDone(data);
  const back = () => step > 0 ? setStep(step - 1) : onSignIn();

  return (
    <div className="cf-screen" style={{
      position: 'relative', height: '100%',
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      padding: '60px 24px 28px',
      overflow: 'hidden',
    }}>
      <DotsBg opacity={0.06} />

      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18,
      }}>
        <button onClick={back} style={{
          appearance: 'none', cursor: 'pointer',
          width: 36, height: 36, borderRadius: 999,
          border: '2.5px solid var(--ink)', background: 'var(--paper)',
          fontSize: 14, fontWeight: 900,
          boxShadow: '3px 3px 0 var(--ink)',
        }}>←</button>
        <div style={{ flex: 1, display: 'flex', gap: 4 }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 6, borderRadius: 999,
              background: i <= step ? 'var(--accent-1)' : 'rgba(0,0,0,0.12)',
              border: '1.5px solid var(--ink)',
              transition: 'background .2s',
            }} />
          ))}
        </div>
        <span style={{
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
          letterSpacing: '.14em', opacity: 0.55,
        }}>{step + 1}/{steps.length}</span>
      </div>

      <div style={{
        position: 'relative', zIndex: 2,
        flex: 1, display: 'flex', flexDirection: 'column', gap: 16,
        overflowY: 'auto', overflowX: 'hidden',
        marginRight: -24, paddingRight: 24, scrollbarWidth: 'none',
      }}>
        {step === 0 && <SignupWho data={data} setData={setData} />}
        {step === 1 && <SignupWhere data={data} setData={setData} />}
        {step === 2 && <SignupVibe data={data} setData={setData} />}
        {step === 3 && <SignupConnect data={data} setData={setData} />}
        {step === 4 && <SignupPerms data={data} setData={setData} />}
      </div>

      <div style={{ position: 'relative', zIndex: 2, paddingTop: 14 }}>
        <ChunkyButton variant="accent" onClick={next} icon={Icons.arrow}>
          {step === steps.length - 1 ? 'finish — print my first night' : 'next'}
        </ChunkyButton>
      </div>
    </div>
  );
}

function SignupWho({ data, setData }) {
  return (
    <>
      <Stamp color="var(--accent-1)" rotate={-3} style={{ alignSelf: 'flex-start' }}>
        step 01 · who
      </Stamp>
      <h2 style={{
        fontFamily: 'var(--cf-display)', fontWeight: 900,
        fontSize: 34, lineHeight: 0.95, letterSpacing: '-0.04em',
        color: 'var(--ink)', margin: 0,
      }}>Who should we put on the pass?</h2>
      <SignupField label="name" placeholder="jess s."
        value={data.name}
        onChange={v => setData({ ...data, name: v })} />
      <SignupField label="phone · so crew can find you"
        placeholder="(347) 555-0182"
        value={data.phone}
        onChange={v => setData({ ...data, phone: v })} />
      <div style={{
        padding: '10px 12px',
        background: 'var(--paper)',
        border: '2px dashed var(--ink)', borderRadius: 10,
        fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
        opacity: 0.7, lineHeight: 1.5, letterSpacing: '.04em',
      }}>
        🔒 we'll never spam. crew check-ins go via twilio, opt out any time.
      </div>
    </>
  );
}

function SignupWhere({ data, setData }) {
  const cities = ['Brooklyn, NY', 'Manhattan, NY', 'Queens, NY',
    'Los Angeles', 'San Francisco', 'CDMX', 'London'];
  return (
    <>
      <Stamp color="var(--accent-2)" rotate={2} style={{ alignSelf: 'flex-start' }}>
        step 02 · where
      </Stamp>
      <h2 style={{
        fontFamily: 'var(--cf-display)', fontWeight: 900,
        fontSize: 34, lineHeight: 0.95, letterSpacing: '-0.04em',
        color: 'var(--ink)', margin: 0,
      }}>What's your default city?</h2>
      <p style={{
        fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 600,
        color: 'var(--ink)', opacity: 0.65, margin: 0,
      }}>You can change this per pass.</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {cities.map(c => (
          <Chip key={c} selected={data.city === c}
            color="var(--accent-2)"
            onClick={() => setData({ ...data, city: c })}>{c}</Chip>
        ))}
      </div>
    </>
  );
}

function SignupVibe({ data, setData }) {
  const vibes = [
    { id: 'foodie',   label: '🍜 foodie',   c: 'var(--accent-1)' },
    { id: 'romantic', label: '🍷 romantic', c: 'var(--accent-3)' },
    { id: 'chill',    label: '🌿 chill',    c: 'var(--accent-2)' },
    { id: 'hype',     label: '⚡ hype',     c: 'var(--accent-1)' },
    { id: 'weird',    label: '👁 weird',    c: 'var(--accent-3)' },
    { id: 'culture',  label: '🎭 culture',  c: 'var(--accent-2)' },
    { id: 'outdoors', label: '🌳 outside',  c: 'var(--accent-1)' },
    { id: 'date',     label: '✨ date night', c: 'var(--accent-3)' },
  ];
  const rank = data.vibeRanks;
  const ranked = Object.keys(rank).sort((a, b) => rank[a] - rank[b]);
  const toggle = (id) => {
    if (rank[id] != null) {
      const { [id]: _, ...rest } = rank;
      const re = {};
      Object.keys(rest).forEach((k, i) => re[k] = i);
      setData({ ...data, vibeRanks: re });
    } else if (ranked.length < 5) {
      setData({ ...data, vibeRanks: { ...rank, [id]: ranked.length } });
    }
  };

  return (
    <>
      <Stamp color="var(--accent-3)" rotate={-2}
             style={{ alignSelf: 'flex-start', color: 'var(--paper)' }}>
        step 03 · vibe
      </Stamp>
      <h2 style={{
        fontFamily: 'var(--cf-display)', fontWeight: 900,
        fontSize: 32, lineHeight: 0.95, letterSpacing: '-0.04em',
        color: 'var(--ink)', margin: 0,
      }}>Tap your top 5 vibes,<br/>in order.</h2>
      <p style={{
        fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 700,
        color: 'var(--ink)', opacity: 0.65, margin: 0,
      }}>Feeds the planner agent. Tweak any time.</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {vibes.map(v => {
          const r = rank[v.id];
          return (
            <button key={v.id} onClick={() => toggle(v.id)} style={{
              appearance: 'none', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 14px',
              border: '2.5px solid var(--ink)', borderRadius: 999,
              background: r != null ? v.c : 'var(--paper)',
              color: 'var(--ink)',
              fontFamily: 'var(--cf-ui)', fontSize: 14, fontWeight: 800,
              boxShadow: r != null ? '3px 3px 0 var(--ink)' : 'none',
              transform: r != null ? 'translate(-1px,-1px)' : 'none',
              transition: 'all .12s',
            }}>
              {r != null && (
                <span style={{
                  width: 22, height: 22, borderRadius: 999,
                  background: 'var(--ink)', color: 'var(--paper)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 11,
                }}>{r + 1}</span>
              )}
              {v.label}
            </button>
          );
        })}
      </div>
    </>
  );
}

function SignupConnect({ data, setData }) {
  const socials = data.socials || {};
  const toggle = (k) => setData({
    ...data,
    socials: { ...socials, [k]: !socials[k] },
  });
  const providers = [
    { k: 'tiktok',    label: 'TikTok',    sub: 'skip the vibe quiz · we\'ll read your taste', bg: 'var(--ink)', fg: 'var(--paper)' },
    { k: 'instagram', label: 'Instagram', sub: 'pull venues from your tagged posts', bg: 'var(--accent-3)', fg: 'var(--paper)' },
    { k: 'spotify',   label: 'Spotify',   sub: 'soundtrack each pass + suggest shows', bg: '#1DB954', fg: 'var(--ink)' },
    { k: 'apple',     label: 'Apple Music', sub: 'same — your music, your vibe', bg: 'var(--ink)', fg: 'var(--paper)' },
    { k: 'x',         label: 'X / Twitter', sub: 'optional — used only for sign-in', bg: 'var(--ink)', fg: 'var(--paper)' },
    { k: 'google',    label: 'Google Cal', sub: 'block plans on busy nights', bg: 'var(--paper)', fg: 'var(--ink)' },
  ];
  return (
    <>
      <Stamp color="var(--accent-2)" rotate={-2} style={{ alignSelf: 'flex-start' }}>
        step 04 · connect
      </Stamp>
      <h2 style={{
        fontFamily: 'var(--cf-display)', fontWeight: 900,
        fontSize: 30, lineHeight: 0.95, letterSpacing: '-0.04em',
        color: 'var(--ink)', margin: 0,
      }}>Connect what you<br/>already use.</h2>
      <p style={{
        fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 600,
        color: 'var(--ink)', opacity: 0.65, margin: 0,
      }}>We never auto-post. Connecting just prefills your vibe profile so plans are smarter on day one.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {providers.map(p => {
          const on = !!socials[p.k];
          return (
            <button key={p.k} onClick={() => toggle(p.k)} style={{
              appearance: 'none', cursor: 'pointer', textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px',
              border: '2.5px solid var(--ink)', borderRadius: 14,
              background: on ? p.bg : 'var(--paper)',
              color: on ? p.fg : 'var(--ink)',
              boxShadow: on ? '4px 4px 0 var(--ink)' : 'none',
              transform: on ? 'translate(-1px,-1px)' : 'none',
              transition: 'all .12s',
            }}>
              <span style={{
                width: 36, height: 36, borderRadius: 8,
                border: '2px solid currentColor',
                background: on ? 'currentColor' : p.bg,
                color: on ? p.bg : p.fg,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 13,
                flexShrink: 0,
              }}>{p.label[0]}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 16,
                  letterSpacing: '-0.02em',
                }}>{p.label}</div>
                <div style={{
                  fontFamily: 'var(--cf-ui)', fontSize: 11, fontWeight: 700,
                  opacity: 0.75, marginTop: 2, lineHeight: 1.3,
                }}>{p.sub}</div>
              </div>
              <span style={{
                padding: '4px 10px',
                border: '2px solid currentColor', borderRadius: 999,
                fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
                letterSpacing: '.1em', textTransform: 'uppercase',
              }}>{on ? 'on' : 'connect'}</span>
            </button>
          );
        })}
      </div>
      <div style={{
        padding: '10px 12px', marginTop: 4,
        background: 'var(--paper)',
        border: '2px dashed var(--ink)', borderRadius: 10,
        fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
        opacity: 0.7, lineHeight: 1.5, letterSpacing: '.04em',
      }}>
        🔒 Read-only. We never post for you. Disconnect any time from Settings.
      </div>
    </>
  );
}

function SignupPerms({ data, setData }) {
  const set = (k, v) => setData({ ...data, perms: { ...data.perms, [k]: v } });
  const items = [
    { k: 'location', icon: '📍', t: 'location',
      sub: "auto check-ins when you're 1 mi from a stop",
      c: 'var(--accent-1)' },
    { k: 'push', icon: '🔔', t: 'push notifications',
      sub: 'crew is here · pass updates · wallet alerts',
      c: 'var(--accent-2)' },
    { k: 'contacts', icon: '👥', t: 'contacts',
      sub: 'find friends already on confetti (no spam invites)',
      c: 'var(--accent-3)' },
  ];
  return (
    <>
      <Stamp color="var(--accent-1)" rotate={3}
             style={{ alignSelf: 'flex-start' }}>
        step 04 · permissions
      </Stamp>
      <h2 style={{
        fontFamily: 'var(--cf-display)', fontWeight: 900,
        fontSize: 30, lineHeight: 0.95, letterSpacing: '-0.04em',
        color: 'var(--ink)', margin: 0,
      }}>3 toggles that make<br/>confetti actually work.</h2>
      {items.map(it => (
        <button key={it.k} onClick={() => set(it.k, !data.perms[it.k])} style={{
          appearance: 'none', cursor: 'pointer', textAlign: 'left',
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 16px',
          border: '2.5px solid var(--ink)', borderRadius: 14,
          background: data.perms[it.k] ? it.c : 'var(--paper)',
          color: it.k === 'contacts' && data.perms[it.k] ? 'var(--paper)' : 'var(--ink)',
          boxShadow: '4px 4px 0 var(--ink)',
        }}>
          <span style={{ fontSize: 22 }}>{it.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 17,
              letterSpacing: '-0.02em',
            }}>{it.t}</div>
            <div style={{
              fontFamily: 'var(--cf-ui)', fontSize: 11, fontWeight: 700,
              opacity: 0.75, marginTop: 2, lineHeight: 1.3,
            }}>{it.sub}</div>
          </div>
          <span style={{
            width: 32, height: 18, borderRadius: 999,
            background: data.perms[it.k] ? 'var(--ink)' : 'rgba(0,0,0,0.15)',
            position: 'relative', flexShrink: 0,
            transition: 'background .15s',
          }}>
            <span style={{
              position: 'absolute', top: 2, left: data.perms[it.k] ? 16 : 2,
              width: 14, height: 14, borderRadius: 999,
              background: 'var(--paper)',
              transition: 'left .15s',
            }} />
          </span>
        </button>
      ))}
    </>
  );
}

function SignupField({ label, placeholder, value, onChange }) {
  return (
    <div>
      <div style={{
        fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
        letterSpacing: '.14em', opacity: 0.55, textTransform: 'uppercase',
        marginBottom: 6,
      }}>{label}</div>
      <input value={value} onChange={e => onChange(e.target.value)}
             placeholder={placeholder}
             style={{
               width: '100%',
               padding: '14px 16px',
               border: '2.5px solid var(--ink)', borderRadius: 14,
               background: 'var(--paper)',
               fontFamily: 'var(--cf-ui)', fontSize: 16, fontWeight: 700,
               color: 'var(--ink)',
               outline: 'none',
               boxShadow: '4px 4px 0 var(--ink)',
               boxSizing: 'border-box',
             }} />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// 3. Parking Instructions Sheet
// ═════════════════════════════════════════════════════════════════
function ParkingSheet({ open, venueName = "Lupa Notte", onClose }) {
  if (!open) return null;
  const options = [
    { type: 'lot', name: 'Wythe Garage', dist: '0.1 mi', cost: '$22 / 4h',
      avail: 'open · 18 spots', c: 'var(--accent-4, #2bb673)', good: true },
    { type: 'street', name: 'N 6th St', dist: '0.05 mi', cost: 'free after 7p',
      avail: 'meter expires 7 PM · ~6 spots seen', c: 'var(--accent-2)', good: true },
    { type: 'lot', name: 'SP+ 9th St', dist: '0.3 mi', cost: '$28 / 4h',
      avail: 'open · cheaper alt', c: 'var(--accent-2)' },
    { type: 'valet', name: 'Lupa valet', dist: 'at venue', cost: '$35 flat',
      avail: 'busy after 8 PM', c: 'var(--accent-1)' },
    { type: 'avoid', name: 'Berry St 8–11 PM', dist: '—', cost: 'avoid',
      avail: 'street cleaning · tow zone', c: '#d32323' },
  ];

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
        padding: '12px 20px 28px',
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
              letterSpacing: '.16em', opacity: 0.55,
            }}>PARKING · {venueName.toUpperCase()}</div>
            <div style={{
              fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 26,
              letterSpacing: '-0.03em', marginTop: 2,
            }}>Where to leave the car.</div>
          </div>
          <button onClick={onClose} style={{
            appearance: 'none', cursor: 'pointer',
            width: 34, height: 34, borderRadius: 999,
            border: '2.5px solid var(--ink)', background: 'var(--paper)',
            fontSize: 14, fontWeight: 900,
          }}>✕</button>
        </div>

        {/* AI suggested top */}
        <div style={{
          padding: 14, marginBottom: 14,
          border: '3px solid var(--ink)', borderRadius: 14,
          background: 'var(--accent-2)',
          boxShadow: '4px 4px 0 var(--ink)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
            letterSpacing: '.14em', textTransform: 'uppercase', opacity: 0.7,
            marginBottom: 4,
          }}>
            <span style={{ color: 'var(--accent-1)' }}>✣</span>
            confetti suggests
          </div>
          <div style={{
            fontFamily: 'var(--cf-ui)', fontSize: 14, fontWeight: 800,
            lineHeight: 1.3,
          }}>Take Wythe Garage. You'll be back near here at 10:30 for stop 3 — saves a re-park.</div>
        </div>

        {/* Parking options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {options.map((p, i) => (
            <div key={i} style={{
              display: 'grid',
              gridTemplateColumns: '36px 1fr auto',
              gap: 10, alignItems: 'center',
              padding: '12px 14px',
              border: '2px solid var(--ink)', borderRadius: 12,
              background: p.type === 'avoid' ? 'rgba(211, 35, 35, 0.08)' : 'var(--paper)',
              boxShadow: p.good ? '3px 3px 0 var(--ink)' : 'none',
            }}>
              <span style={{
                width: 32, height: 32, borderRadius: 8,
                border: '2px solid var(--ink)', background: p.c,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 900, color: 'var(--ink)',
              }}>{p.type === 'lot' ? 'P' : p.type === 'street' ? '⊟' : p.type === 'valet' ? 'V' : '⚠'}</span>
              <div>
                <div style={{
                  fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 15,
                  letterSpacing: '-0.02em',
                }}>{p.name}</div>
                <div style={{
                  fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 700,
                  opacity: 0.65, letterSpacing: '.08em', marginTop: 2,
                  textTransform: 'uppercase',
                }}>{p.dist} · {p.avail}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontFamily: 'var(--cf-mono)', fontSize: 12, fontWeight: 800,
                  letterSpacing: '.04em', color: p.type === 'avoid' ? '#d32323' : 'var(--ink)',
                }}>{p.cost}</div>
                {p.type !== 'avoid' && (
                  <button style={{
                    appearance: 'none', cursor: 'pointer', marginTop: 4,
                    padding: '3px 8px',
                    border: '1.5px solid var(--ink)', borderRadius: 999,
                    background: 'var(--bg)',
                    fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
                    letterSpacing: '.06em', textTransform: 'uppercase',
                  }}>navigate →</button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Other modes */}
        <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
          <ParkAlt icon="🚇" label="L train" sub="3 stops · 8m" />
          <ParkAlt icon="🚲" label="citi bike" sub="2 docks here" />
          <ParkAlt icon="L" label="lyft" sub="$9 · 5m" color="#FF00BF" />
        </div>
      </div>
    </div>
  );
}

function ParkAlt({ icon, label, sub, color }) {
  return (
    <div style={{
      flex: 1, textAlign: 'center',
      padding: 10,
      border: '2px solid var(--ink)', borderRadius: 12,
      background: color || 'var(--paper)',
      color: color ? 'var(--paper)' : 'var(--ink)',
    }}>
      <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 2 }}>{icon}</div>
      <div style={{
        fontFamily: 'var(--cf-ui)', fontSize: 11, fontWeight: 900,
      }}>{label}</div>
      <div style={{
        fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 700,
        opacity: 0.7, marginTop: 1, letterSpacing: '.05em',
      }}>{sub}</div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// 4. Auto Check-In Geofence Prompt (1-mile detection)
// ═════════════════════════════════════════════════════════════════
function AutoCheckInPrompt({ open, stop, distance = 0.4, onCheckIn, onCancel, onDisable }) {
  const [countdown, setCountdown] = useStateA(20);

  useEffectA(() => {
    if (!open) return;
    setCountdown(20);
    const t = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(t);
          onCheckIn?.();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [open, onCheckIn]);

  if (!open) return null;

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 70,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
      background: 'rgba(0,0,0,0.6)',
      animation: 'cf-fadein 0.25s',
    }}>
      <div style={{
        width: '100%', maxWidth: 340,
        background: 'var(--paper)', color: 'var(--ink)',
        border: '3px solid var(--ink)', borderRadius: 22,
        boxShadow: '8px 8px 0 var(--accent-1)',
        padding: 20,
        animation: 'cf-pop 0.35s cubic-bezier(.2,1.4,.4,1)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '5px 10px', alignSelf: 'flex-start',
          background: 'var(--accent-1)', color: 'var(--ink)',
          border: '2px solid var(--ink)', borderRadius: 999,
          fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
          letterSpacing: '.16em', textTransform: 'uppercase',
          marginBottom: 12, width: 'fit-content',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: 999, background: 'var(--ink)',
            animation: 'cf-pulse 1.2s infinite',
          }} />
          GEOFENCE TRIGGERED
        </div>

        <h3 style={{
          fontFamily: 'var(--cf-display)', fontWeight: 900,
          fontSize: 26, letterSpacing: '-0.03em', lineHeight: 1, margin: 0,
        }}>You're {distance} mi from {stop?.name || 'Lupa Notte'}.</h3>

        <p style={{
          fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 700,
          color: 'var(--ink)', opacity: 0.7, margin: '8px 0 12px', lineHeight: 1.4,
        }}>
          Auto-checking you in. Crew will see it live. Want to drop a photo + caption first?
        </p>

        {/* Radar viz */}
        <div style={{
          position: 'relative',
          height: 90, marginBottom: 14,
          border: '2.5px solid var(--ink)', borderRadius: 12,
          background: 'var(--bg)',
          overflow: 'hidden',
        }}>
          <svg viewBox="0 0 300 90" preserveAspectRatio="none"
               style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            {/* concentric arcs (you = center-left) */}
            {[80, 60, 40, 20].map((r, i) => (
              <circle key={i} cx="50" cy="45" r={r}
                      stroke="var(--ink)" strokeWidth="1.5"
                      strokeDasharray="3 3" fill="none"
                      opacity={0.3 - i * 0.05} />
            ))}
            {/* radar sweep */}
            <path d="M 50 45 L 130 5 A 90 90 0 0 1 130 85 Z"
                  fill="var(--accent-1)" opacity="0.15"/>
            {/* you dot */}
            <circle cx="50" cy="45" r="6"
                    fill="var(--accent-1)" stroke="var(--ink)" strokeWidth="2"/>
            <circle cx="50" cy="45" r="14" fill="none"
                    stroke="var(--accent-1)" strokeWidth="2"
                    opacity="0.5">
              <animate attributeName="r" from="6" to="22" dur="1.5s" repeatCount="indefinite"/>
              <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite"/>
            </circle>
            {/* venue dot */}
            <circle cx="230" cy="45" r="8"
                    fill="var(--accent-2)" stroke="var(--ink)" strokeWidth="2.5"/>
            <text x="232" y="38" fontFamily="JetBrains Mono" fontSize="8" fontWeight="800">
              LUPA
            </text>
          </svg>
          <span style={{
            position: 'absolute', bottom: 6, left: 8,
            fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
            letterSpacing: '.14em', opacity: 0.55,
          }}>YOU</span>
          <span style={{
            position: 'absolute', bottom: 6, right: 8,
            fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
            letterSpacing: '.14em', opacity: 0.7,
          }}>{distance} MI</span>
        </div>

        {/* Countdown */}
        <div style={{
          padding: '10px 14px', marginBottom: 14,
          border: '2px dashed var(--ink)', borderRadius: 10,
          background: 'var(--bg)',
          display: 'flex', alignItems: 'center', gap: 10,
          fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 700,
        }}>
          <span style={{
            width: 38, height: 38, borderRadius: 999,
            border: '2.5px solid var(--ink)',
            background: 'var(--accent-1)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 17,
          }}>{countdown}</span>
          <span>Auto check-in in <strong>{countdown}s</strong>. Pause if you want.</span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCheckIn} style={{
            appearance: 'none', cursor: 'pointer', flex: 1,
            padding: '12px 14px',
            border: '2.5px solid var(--ink)', borderRadius: 12,
            background: 'var(--accent-1)', color: 'var(--ink)',
            fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 900,
            boxShadow: '3px 3px 0 var(--ink)',
          }}>check in now</button>
          <button onClick={onCancel} style={{
            appearance: 'none', cursor: 'pointer', flex: 1,
            padding: '12px 14px',
            border: '2.5px solid var(--ink)', borderRadius: 12,
            background: 'var(--paper)', color: 'var(--ink)',
            fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 800,
          }}>not yet</button>
        </div>
        <button onClick={onDisable} style={{
          appearance: 'none', cursor: 'pointer',
          background: 'transparent', border: 'none', padding: 6,
          marginTop: 10, width: '100%',
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
          opacity: 0.55, letterSpacing: '.08em',
          textDecoration: 'underline',
        }}>turn off auto check-in</button>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// 5. Settings / Account Screen
// ═════════════════════════════════════════════════════════════════
function SettingsScreen({ onBack }) {
  const [s, setS] = useStateA({
    autoCheckin: true, geofenceMi: 1,
    push: true, sms: true, email: false,
    crewLocation: true, parkingHints: true,
    walletAuto: true, language: 'en',
  });
  const set = (k, v) => setS({ ...s, [k]: v });

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
        padding: '56px 22px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '2.5px solid var(--ink)',
      }}>
        <button onClick={onBack} style={{
          appearance: 'none', cursor: 'pointer',
          width: 36, height: 36, borderRadius: 999,
          border: '2.5px solid var(--ink)', background: 'var(--paper)',
          fontSize: 14, fontWeight: 900,
          boxShadow: '3px 3px 0 var(--ink)',
        }}>←</button>
        <div style={{
          fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 20,
          letterSpacing: '-0.025em',
        }}>Settings</div>
        <div style={{ width: 36 }} />
      </div>

      <div style={{
        position: 'relative', zIndex: 2,
        flex: 1, overflowY: 'auto',
        padding: '14px 22px 30px', scrollbarWidth: 'none',
      }}>
        {/* Account header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: 14, marginBottom: 18,
          border: '2.5px solid var(--ink)', borderRadius: 14,
          background: 'var(--paper)',
          boxShadow: '4px 4px 0 var(--ink)',
        }}>
          <div style={{
            width: 50, height: 50, borderRadius: 999,
            border: '2.5px solid var(--ink)', background: 'var(--accent-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 18,
          }}>JS</div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 18,
              letterSpacing: '-0.025em',
            }}>Jess S.</div>
            <div style={{
              fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
              opacity: 0.55, marginTop: 2, letterSpacing: '.08em',
            }}>JESS@BROOKLYN.COM</div>
          </div>
          <button style={{
            appearance: 'none', cursor: 'pointer',
            padding: '5px 10px',
            border: '2px solid var(--ink)', borderRadius: 999,
            background: 'var(--bg)',
            fontFamily: 'var(--cf-ui)', fontSize: 11, fontWeight: 800,
          }}>edit</button>
        </div>

        <SettingsGroup label="Location & auto check-in">
          <SettingRow icon="📍" label="Auto check-in"
            sub="Triggers when you're within the radius"
            on={s.autoCheckin} onChange={v => set('autoCheckin', v)} />
          <SettingRow icon="◉" label={`Radius · ${s.geofenceMi} mi`}
            sub="0.5 mi to 2 mi"
            slider
            value={s.geofenceMi}
            onChange={v => set('geofenceMi', v)} />
          <SettingRow icon="🅿" label="Parking hints"
            sub="Lots, street rules, valet — shown on your route"
            on={s.parkingHints} onChange={v => set('parkingHints', v)} />
          <SettingRow icon="👥" label="Share my live location with crew"
            sub="Only during an active pass"
            on={s.crewLocation} onChange={v => set('crewLocation', v)} />
        </SettingsGroup>

        <SettingsGroup label="Notifications">
          <SettingRow icon="🔔" label="Push notifications"
            sub="Firebase · per-stop check-in nudges + crew pings"
            on={s.push} onChange={v => set('push', v)} />
          <SettingRow icon="✉" label="Email digests"
            sub="SendGrid · weekly scrapbook recap"
            on={s.email} onChange={v => set('email', v)} />
          <SettingRow icon="💬" label="SMS"
            sub="Twilio · crew check-ins · 1 per night max"
            on={s.sms} onChange={v => set('sms', v)} />
        </SettingsGroup>

        <SettingsGroup label="Wallet & payments">
          <SettingRow icon="💳" label="Auto-add passes to Apple Wallet"
            sub="Boarding-pass style card per pass"
            on={s.walletAuto} onChange={v => set('walletAuto', v)} />
          <SettingsLink icon="$" label="Payment methods"
            sub="Stripe · Apple Pay default · 1 card on file" />
          <SettingsLink icon="🧾" label="Past receipts"
            sub="18 nights · $1,438 total" />
        </SettingsGroup>

        <SettingsGroup label="Connected">
          <ConnectedRow icon="📺" name="TikTok" sub="auto-clip on" connected />
          <ConnectedRow icon="📷" name="Instagram" sub="story prompts" connected />
          <ConnectedRow icon="L" name="Lyft" sub="deep-link rides" connected color="#FF00BF" />
          <ConnectedRow icon="U" name="Uber" sub="not connected" />
          <ConnectedRow icon="🍎" name="Apple Wallet" sub="2 passes saved" connected />
        </SettingsGroup>

        <SettingsGroup label="Legal & data">
          <SettingsLink icon="✣" label="Your taste graph" sub="derived from TikTok · see + edit" />
          <SettingsLink icon="⌥" label="Privacy" sub="What we collect, why" />
          <SettingsLink icon="📜" label="Terms" sub="" />
          <SettingsLink icon="⤓" label="Export my data" sub="ZIP of every pass + check-in" />
          <SettingsLink icon="✕" label="Delete account" sub="" danger />
        </SettingsGroup>

        <div style={{
          textAlign: 'center', marginTop: 22,
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
          opacity: 0.45, letterSpacing: '.14em',
        }}>CONFETTI v4.2.1 · iOS</div>
      </div>
    </div>
  );
}

function SettingsGroup({ label, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
        letterSpacing: '.16em', textTransform: 'uppercase',
        color: 'var(--ink)', opacity: 0.5,
        marginBottom: 8, paddingLeft: 4,
      }}>{label}</div>
      <div style={{
        border: '2.5px solid var(--ink)', borderRadius: 14,
        background: 'var(--paper)',
        overflow: 'hidden',
        boxShadow: '3px 3px 0 var(--ink)',
      }}>{children}</div>
    </div>
  );
}

function SettingRow({ icon, label, sub, on, onChange, slider, value }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px',
      borderBottom: '1.5px dashed rgba(0,0,0,0.15)',
    }}>
      <span style={{
        width: 30, height: 30, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16,
      }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--cf-ui)', fontSize: 14, fontWeight: 800,
          color: 'var(--ink)', lineHeight: 1.2,
        }}>{label}</div>
        {sub && <div style={{
          fontFamily: 'var(--cf-ui)', fontSize: 11, fontWeight: 600,
          opacity: 0.55, marginTop: 2, lineHeight: 1.3,
        }}>{sub}</div>}
        {slider && (
          <input type="range" min={0.5} max={2} step={0.5} value={value}
                 onChange={e => onChange(Number(e.target.value))}
                 style={{ width: '100%', marginTop: 6 }} />
        )}
      </div>
      {!slider && (
        <button onClick={() => onChange(!on)} style={{
          appearance: 'none', cursor: 'pointer',
          width: 38, height: 22, borderRadius: 999,
          background: on ? 'var(--accent-1)' : 'rgba(0,0,0,0.15)',
          border: '2px solid var(--ink)', position: 'relative', flexShrink: 0,
          padding: 0,
        }}>
          <span style={{
            position: 'absolute', top: 1, left: on ? 17 : 1,
            width: 16, height: 16, borderRadius: 999,
            background: 'var(--paper)', border: '1.5px solid var(--ink)',
            transition: 'left .15s',
          }} />
        </button>
      )}
    </div>
  );
}

function SettingsLink({ icon, label, sub, danger }) {
  return (
    <button style={{
      appearance: 'none', cursor: 'pointer', textAlign: 'left',
      display: 'flex', alignItems: 'center', gap: 12, width: '100%',
      padding: '12px 14px',
      border: 'none', borderBottom: '1.5px dashed rgba(0,0,0,0.15)',
      background: 'transparent',
      color: danger ? '#d32323' : 'var(--ink)',
    }}>
      <span style={{
        width: 30, height: 30, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 15,
      }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--cf-ui)', fontSize: 14, fontWeight: 800,
        }}>{label}</div>
        {sub && <div style={{
          fontFamily: 'var(--cf-ui)', fontSize: 11, fontWeight: 600,
          opacity: 0.55, marginTop: 2,
        }}>{sub}</div>}
      </div>
      <span style={{ opacity: 0.35, fontSize: 16, fontWeight: 900 }}>›</span>
    </button>
  );
}

function ConnectedRow({ icon, name, sub, connected, color }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '11px 14px',
      borderBottom: '1.5px dashed rgba(0,0,0,0.15)',
    }}>
      <span style={{
        width: 30, height: 30, flexShrink: 0,
        borderRadius: 8,
        border: '2px solid var(--ink)',
        background: color || 'var(--paper)',
        color: color ? '#fff' : 'var(--ink)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 13,
      }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 800,
        }}>{name}</div>
        <div style={{
          fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 700,
          opacity: 0.55, marginTop: 2, letterSpacing: '.06em',
          textTransform: 'uppercase',
        }}>{sub}</div>
      </div>
      <span style={{
        padding: '3px 10px',
        border: '2px solid var(--ink)', borderRadius: 999,
        background: connected ? 'var(--accent-1)' : 'var(--paper)',
        fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
        letterSpacing: '.1em', textTransform: 'uppercase',
      }}>{connected ? 'on' : 'connect'}</span>
    </div>
  );
}

Object.assign(window, {
  SignInScreen, SignUpScreen,
  ParkingSheet, AutoCheckInPrompt,
  SettingsScreen,
});
