// auth-patch.jsx — Drop-in replacements for SignInScreen + SignUpScreen
// that use real Supabase auth. Replace the existing component bodies
// in auth.jsx with these versions once real-auth.jsx is loaded.

const { useState: useStateAP, useEffect: useEffectAP } = React;

// ═════════════════════════════════════════════════════════════════
// SignInScreen · real Supabase auth (password + SSO + magic link)
// ═════════════════════════════════════════════════════════════════
function SignInScreen({ onSignIn, onSignUp }) {
  const [email, setEmail] = useStateAP('admin@confetti.com');
  const [password, setPassword] = useStateAP('');
  const [mode, setMode] = useStateAP('password'); // password | magic
  const [loading, setLoading] = useStateAP(false);
  const [error, setError] = useStateAP(null);
  const [sent, setSent] = useStateAP(false);

  // Check if already signed in
  useEffectAP(() => {
    window.getCurrentUser?.().then(u => u && onSignIn?.());
  }, []);

  const submit = async () => {
    setError(null); setLoading(true);
    try {
      if (mode === 'password') {
        await window.realSignIn({ email, password });
        onSignIn?.();
      } else {
        await window.realSignIn({ email });
        setSent(true);
      }
    } catch (e) {
      setError(e.message || 'sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const sso = async (provider) => {
    try { await window.realSignInWithProvider(provider); }
    catch (e) { setError(e.message); }
  };

  return (
    <div className="cf-screen" style={{
      position: 'relative', height: '100%', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      padding: '70px 28px 36px', overflow: 'hidden',
    }}>
      <DotsBg opacity={0.06} />
      <FloatingTickets density={4} />
      <div style={{ position: 'relative', zIndex: 2 }}><BrandMark size={20} spin /></div>

      <div style={{
        position: 'relative', zIndex: 2, flex: 1,
        display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16,
      }}>
        <Stamp color="var(--accent-2)" rotate={-3} style={{ alignSelf: 'flex-start' }}>
          welcome back
        </Stamp>
        <h1 style={{
          fontFamily: 'var(--cf-display)', fontWeight: 900,
          fontSize: 40, lineHeight: 0.95, letterSpacing: '-0.04em',
          color: 'var(--ink)', margin: 0,
        }}>Pick up<br/>where you left.</h1>

        {!sent ? (
          <>
            {/* Mode toggle */}
            <div style={{ display: 'flex', gap: 6 }}>
              {['password', 'magic'].map(m => (
                <button key={m} onClick={() => setMode(m)} style={{
                  appearance: 'none', cursor: 'pointer', flex: 1,
                  padding: '7px 10px',
                  border: '2px solid var(--ink)', borderRadius: 999,
                  background: mode === m ? 'var(--ink)' : 'var(--paper)',
                  color: mode === m ? 'var(--paper)' : 'var(--ink)',
                  fontFamily: 'var(--cf-ui)', fontSize: 11, fontWeight: 800,
                }}>{m === 'password' ? 'password' : 'magic link'}</button>
              ))}
            </div>

            <div>
              <div style={{
                fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
                letterSpacing: '.14em', opacity: 0.55, marginBottom: 6,
                textTransform: 'uppercase',
              }}>email</div>
              <input value={email} onChange={e => setEmail(e.target.value)}
                style={{
                  width: '100%', padding: '12px 16px',
                  border: '2.5px solid var(--ink)', borderRadius: 14,
                  background: 'var(--paper)', color: 'var(--ink)',
                  fontFamily: 'var(--cf-ui)', fontSize: 15, fontWeight: 700,
                  outline: 'none', boxShadow: '4px 4px 0 var(--ink)',
                  boxSizing: 'border-box',
                }} />
            </div>

            {mode === 'password' && (
              <div>
                <div style={{
                  fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
                  letterSpacing: '.14em', opacity: 0.55, marginBottom: 6,
                  textTransform: 'uppercase',
                }}>password</div>
                <input type="password" value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submit()}
                  placeholder="Demo1234!"
                  style={{
                    width: '100%', padding: '12px 16px',
                    border: '2.5px solid var(--ink)', borderRadius: 14,
                    background: 'var(--paper)', color: 'var(--ink)',
                    fontFamily: 'var(--cf-ui)', fontSize: 15, fontWeight: 700,
                    outline: 'none', boxShadow: '4px 4px 0 var(--ink)',
                    boxSizing: 'border-box',
                  }} />
              </div>
            )}

            {error && (
              <div style={{
                padding: '10px 14px',
                background: '#d32323', color: '#fff',
                border: '2px solid var(--ink)', borderRadius: 10,
                fontFamily: 'var(--cf-mono)', fontSize: 11, fontWeight: 800,
                letterSpacing: '.06em',
              }}>⚠ {error}</div>
            )}

            <ChunkyButton variant="accent" onClick={submit} disabled={loading}
              icon={Icons.arrow}>
              {loading ? 'signing in…' :
               mode === 'password' ? 'sign in' : 'send magic link'}
            </ChunkyButton>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
              opacity: 0.5, letterSpacing: '.12em',
            }}>
              <div style={{ flex: 1, height: 2, background: 'var(--ink)', opacity: 0.15 }} />
              OR ONE-TAP
              <div style={{ flex: 1, height: 2, background: 'var(--ink)', opacity: 0.15 }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <SSOTile label="Apple" glyph={<AppleGlyph/>}
                bg="var(--ink)" fg="var(--paper)" onClick={() => sso('apple')} />
              <SSOTile label="Google" glyph="G"
                bg="var(--paper)" fg="var(--ink)" onClick={() => sso('google')} />
            </div>
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
              letterSpacing: '-0.025em', marginTop: 6,
            }}>We sent a link to {email}.</div>
            <div style={{
              fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
              opacity: 0.7, marginTop: 8, letterSpacing: '.04em',
            }}>Click it on this phone. Link expires in 15 min.</div>
          </div>
        )}
      </div>

      <div style={{
        position: 'relative', zIndex: 2, textAlign: 'center',
        fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 600,
        color: 'var(--ink)', opacity: 0.7,
      }}>
        new here?{' '}
        <button onClick={onSignUp} style={{
          appearance: 'none', cursor: 'pointer', background: 'transparent',
          border: 'none', padding: 0, fontWeight: 900, color: 'var(--accent-1)',
          fontFamily: 'inherit', fontSize: 'inherit',
          textDecoration: 'underline', textUnderlineOffset: 3,
        }}>print your first night →</button>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// SignUpScreen · real Supabase signUp + public.users row
// (replace step 1 of the existing wizard with this; keep steps 2-4)
// ═════════════════════════════════════════════════════════════════
function SignupWho({ data, setData, onCommit }) {
  const [pw, setPw] = useStateAP('');
  const [error, setError] = useStateAP(null);
  const [loading, setLoading] = useStateAP(false);

  const commit = async () => {
    if (!data.email || !pw || !data.name) {
      setError('email + password + name required');
      return;
    }
    setLoading(true); setError(null);
    try {
      const user = await window.realSignUp({
        email: data.email, password: pw,
        name: data.name, city: data.city, phone: data.phone,
      });
      onCommit?.(user);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stamp color="var(--accent-1)" rotate={-3} style={{ alignSelf: 'flex-start' }}>
        step 01 · who
      </Stamp>
      <h2 style={{
        fontFamily: 'var(--cf-display)', fontWeight: 900,
        fontSize: 34, lineHeight: 0.95, letterSpacing: '-0.04em', margin: 0,
      }}>Who should we put on the pass?</h2>

      <SignupField label="email" placeholder="you@inbox.com"
        value={data.email || ''} onChange={v => setData({ ...data, email: v })} />
      <SignupField label="password · 8+ chars" placeholder="••••••••"
        value={pw} onChange={setPw} />
      <SignupField label="name" placeholder="jess s."
        value={data.name} onChange={v => setData({ ...data, name: v })} />
      <SignupField label="phone · so crew can find you"
        placeholder="(347) 555-0182"
        value={data.phone} onChange={v => setData({ ...data, phone: v })} />

      {error && (
        <div style={{
          padding: '10px 14px',
          background: '#d32323', color: '#fff',
          border: '2px solid var(--ink)', borderRadius: 10,
          fontFamily: 'var(--cf-mono)', fontSize: 11, fontWeight: 800,
        }}>⚠ {error}</div>
      )}

      <button onClick={commit} disabled={loading} style={{
        appearance: 'none', cursor: loading ? 'wait' : 'pointer',
        padding: '12px 16px',
        border: '2.5px solid var(--ink)', borderRadius: 12,
        background: 'var(--accent-1)', color: 'var(--ink)',
        fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 900,
        boxShadow: '3px 3px 0 var(--ink)', opacity: loading ? 0.6 : 1,
      }}>{loading ? 'creating account…' : 'create account →'}</button>

      <div style={{
        padding: '10px 12px',
        background: 'var(--paper)',
        border: '2px dashed var(--ink)', borderRadius: 10,
        fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
        opacity: 0.7, lineHeight: 1.5, letterSpacing: '.04em',
      }}>
        🔒 Supabase auth · we never store passwords in plain text.
        Crew check-ins go via Twilio · opt out any time.
      </div>
    </>
  );
}

Object.assign(window, { SignInScreen, SignupWho });
