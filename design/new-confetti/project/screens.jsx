// screens.jsx — Confetti app screens

const { useState, useEffect, useRef } = React;

// ─── 1. Welcome ─────────────────────────────────────────────────────────
function WelcomeScreen({ onStart }) {
  return (
    <div className="cf-screen" style={{
      position: 'relative', height: '100%', overflow: 'hidden',
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      padding: '70px 24px 36px',
    }}>
      <DotsBg />
      <FloatingTickets density={5} />

      <div style={{ position: 'relative', zIndex: 2 }}>
        <BrandMark size={20} spin />
      </div>

      <div style={{
        position: 'relative', zIndex: 2,
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        gap: 18,
      }}>
        {/* Sample peeking pass */}
        <div style={{
          position: 'absolute', top: 6, right: -30,
          transform: 'rotate(-8deg)', opacity: 0.95,
          width: 180,
        }}>
          <Ticket color="var(--accent-2)" notch={false} style={{
            padding: 12, boxShadow: '5px 5px 0 var(--ink)',
          }}>
            <div style={{
              fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 700,
              letterSpacing: '.14em', display: 'flex', justifyContent: 'space-between',
            }}>
              <span>FRI PASS</span><span>#J3M1</span>
            </div>
            <div style={{ marginTop: 10 }}>
              <RouteDots progress={1} size={14} />
            </div>
            <div style={{
              fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 700,
              letterSpacing: '.14em', display: 'flex', justifyContent: 'space-between',
            }}>
              <span>BUSHWICK</span><span>5H</span>
            </div>
          </Ticket>
        </div>
        <div style={{
          position: 'absolute', top: 0, right: -50,
          transform: 'rotate(-8deg)', opacity: 0.95,
          width: 156, zIndex: 1, pointerEvents: 'none',
        }}>
          <Ticket color="var(--accent-2)" notch={false} style={{
            padding: 10, boxShadow: '5px 5px 0 var(--ink)',
          }}>
            <div style={{
              fontFamily: 'var(--cf-mono)', fontSize: 8, fontWeight: 700,
              letterSpacing: '.14em', display: 'flex', justifyContent: 'space-between',
            }}>
              <span>FRI PASS</span><span>#J3M1</span>
            </div>
            <div style={{ marginTop: 8 }}>
              <RouteDots progress={1} size={12} />
            </div>
            <div style={{
              fontFamily: 'var(--cf-mono)', fontSize: 8, fontWeight: 700,
              letterSpacing: '.14em', display: 'flex', justifyContent: 'space-between',
            }}>
              <span>BUSHWICK</span><span>5H</span>
            </div>
          </Ticket>
        </div>

        <h1 style={{
          position: 'relative', zIndex: 2,
          fontFamily: 'var(--cf-display)', fontWeight: 900,
          fontSize: 48, lineHeight: 0.92, letterSpacing: '-0.045em',
          color: 'var(--ink)', margin: '120px 0 0',
          textWrap: 'balance',
        }}>
          Plan a <span style={{ color: 'var(--accent-1)' }}>night.</span><br/>
          Or a day.<br/>
          Or whatever.
        </h1>
        <p style={{
          position: 'relative', zIndex: 2,
          fontFamily: 'var(--cf-ui)', fontSize: 14, fontWeight: 500,
          color: 'var(--ink)', opacity: 0.7, margin: '12px 0 0', maxWidth: 320,
          lineHeight: 1.45,
        }}>
          Tell us a vibe — date night, family Saturday, BBQ, recharge day. We build a 3-stop pass with venues, timing, route, and budget. Ready in 4 minutes.
        </p>

        {/* Plan-type chip row */}
        <div style={{
          position: 'relative', zIndex: 2, marginTop: 14,
          display: 'flex', gap: 6, overflowX: 'auto',
          scrollbarWidth: 'none',
          marginRight: -24, paddingRight: 24,
        }}>
          {[
            { l: '🌹 date night', c: 'var(--accent-1)' },
            { l: '🌳 family day',  c: 'var(--accent-2)' },
            { l: '🔥 cookout',     c: 'var(--paper)' },
            { l: '🎂 kids party',  c: 'var(--accent-2)' },
            { l: '🗽 tourist',     c: 'var(--paper)' },
            { l: '🌿 recharge',    c: 'var(--accent-3)' },
          ].map((c, i) => (
            <span key={i} style={{
              flexShrink: 0,
              padding: '6px 12px',
              border: '2px solid var(--ink)', borderRadius: 999,
              background: c.c, color: c.c === 'var(--accent-3)' ? 'var(--paper)' : 'var(--ink)',
              fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 800,
            }}>{c.l}</span>
          ))}
        </div>

        <div style={{
          position: 'relative', zIndex: 2,
          marginTop: 14, display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr', gap: 8,
        }}>
          {[
            ['4 min',   'to plan a night'],
            ['3 stops', 'every pass'],
            ['12',      'cities live'],
          ].map(([n, l]) => (
            <div key={l} style={{
              padding: '10px 12px',
              border: '2.5px solid var(--ink)', borderRadius: 12,
              background: 'var(--paper)',
              boxShadow: '3px 3px 0 var(--ink)',
            }}>
              <div style={{
                fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 22,
                letterSpacing: '-0.03em', lineHeight: 1, color: 'var(--ink)',
              }}>{n}</div>
              <div style={{
                fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
                letterSpacing: '.12em', opacity: 0.55, marginTop: 4,
                textTransform: 'uppercase',
              }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 2 }}>
        <ChunkyButton variant="accent" onClick={onStart} icon={Icons.arrow}>
          Plan something
        </ChunkyButton>
        <div style={{
          marginTop: 12, textAlign: 'center',
          fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 600,
          color: 'var(--ink)',
        }}>
          already in?
          <button onClick={onStart} style={{
            appearance: 'none', cursor: 'pointer',
            background: 'transparent', border: 'none', padding: '0 0 0 6px',
            fontFamily: 'inherit', fontSize: 'inherit',
            fontWeight: 900, color: 'var(--accent-1)',
            textDecoration: 'underline', textUnderlineOffset: 3,
          }}>sign in</button>
        </div>
        <div style={{
          marginTop: 10, textAlign: 'center',
          fontFamily: 'var(--cf-ui)', fontSize: 11, fontWeight: 600,
          color: 'var(--ink)', opacity: 0.5, letterSpacing: '.02em',
        }}>
          230,418 passes printed this week · 12 cities live
        </div>
      </div>
    </div>
  );
}

// ─── 2. Plan ────────────────────────────────────────────────────────────
const VIBE_OPTIONS = [
  { id: 'chill',    label: 'chill',     emoji: '🌿' },
  { id: 'hype',     label: 'hype',      emoji: '⚡' },
  { id: 'romantic', label: 'romantic',  emoji: '🍷' },
  { id: 'foodie',   label: 'foodie',    emoji: '🍜' },
  { id: 'weird',    label: 'weird',     emoji: '👁' },
  { id: 'outside',  label: 'outdoorsy', emoji: '🌳' },
  { id: 'culture',  label: 'culture',   emoji: '🎭' },
  { id: 'lowkey',   label: 'low-key',   emoji: '☕' },
];

function PlanScreen({ onPlan, state, setState }) {
  const toggleVibe = (id) => {
    const next = state.vibes.includes(id)
      ? state.vibes.filter(v => v !== id)
      : state.vibes.length < 3 ? [...state.vibes, id] : state.vibes;
    setState({ ...state, vibes: next });
  };
  const canPlan = state.vibes.length > 0;

  return (
    <div className="cf-screen" style={{
      position: 'relative', height: '100%',
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      padding: '60px 22px 24px',
      overflow: 'hidden',
    }}>
      <DotsBg opacity={0.06} />

      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 18,
      }}>
        <BrandMark size={17} />
        <button onClick={() => onPlan('back')} style={{
          appearance: 'none', cursor: 'pointer', background: 'transparent',
          border: 'none', padding: 6,
          fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 800,
          color: 'var(--ink)', opacity: 0.55,
        }}>← back</button>
      </div>

      <div style={{
        position: 'relative', zIndex: 2,
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        marginRight: -22, paddingRight: 22,
        scrollbarWidth: 'none',
      }}>
        <h2 style={{
          fontFamily: 'var(--cf-display)', fontWeight: 900,
          fontSize: 38, lineHeight: 0.95, letterSpacing: '-0.04em',
          color: 'var(--ink)', margin: '0 0 24px',
        }}>
          What's the<br/>vibe?
        </h2>

        {/* Where */}
        <div style={{ marginBottom: 22 }}>
          <Label>Where</Label>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '14px 16px',
            border: '2.5px solid var(--ink)', borderRadius: 14,
            background: 'var(--paper)',
            boxShadow: '4px 4px 0 var(--ink)',
          }}>
            <span style={{ color: 'var(--accent-1)' }}>{Icons.pin}</span>
            <input
              value={state.city}
              onChange={e => setState({ ...state, city: e.target.value })}
              style={{
                appearance: 'none', border: 'none', outline: 'none',
                background: 'transparent', flex: 1,
                fontFamily: 'var(--cf-ui)', fontSize: 16, fontWeight: 700,
                color: 'var(--ink)',
              }}
            />
            <span style={{
              fontFamily: 'var(--cf-mono)', fontSize: 11, fontWeight: 700,
              opacity: 0.5, letterSpacing: '.1em',
            }}>{state.city ? '40.71° N' : ''}</span>
          </div>
        </div>

        {/* When */}
        <div style={{ marginBottom: 22 }}>
          <Label>When</Label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['Now', 'Tonight', 'Tomorrow', 'This weekend'].map(t => (
              <Chip key={t} selected={state.when === t}
                    color="var(--accent-2)"
                    onClick={() => setState({ ...state, when: t })}>{t}</Chip>
            ))}
          </div>
        </div>

        {/* Vibe */}
        <div style={{ marginBottom: 22 }}>
          <Label>
            Vibe
            <span style={{
              fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
              opacity: 0.5, marginLeft: 8,
            }}>PICK UP TO 3</span>
          </Label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {VIBE_OPTIONS.map(v => (
              <Chip key={v.id}
                    selected={state.vibes.includes(v.id)}
                    color="var(--accent-1)"
                    icon={v.emoji}
                    onClick={() => toggleVibe(v.id)}>{v.label}</Chip>
            ))}
          </div>
        </div>

        {/* Budget */}
        <div style={{ marginBottom: 22 }}>
          <Label>Budget</Label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { id: '$',   sub: 'under $40' },
              { id: '$$',  sub: '$40–80' },
              { id: '$$$', sub: '$80–150' },
              { id: '💸',  sub: 'no cap' },
            ].map(b => (
              <button key={b.id}
                onClick={() => setState({ ...state, budget: b.id })}
                style={{
                  appearance: 'none', cursor: 'pointer', flex: 1,
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 2, padding: '10px 6px',
                  border: '2.5px solid var(--ink)', borderRadius: 14,
                  background: state.budget === b.id ? 'var(--accent-3)' : 'var(--paper)',
                  color: state.budget === b.id ? 'var(--paper)' : 'var(--ink)',
                  fontFamily: 'var(--cf-ui)', fontWeight: 900,
                  boxShadow: state.budget === b.id ? '3px 3px 0 var(--ink)' : '0 0 0 var(--ink)',
                  transform: state.budget === b.id ? 'translate(-1px,-1px)' : 'none',
                  transition: 'all .12s',
                }}>
                <span style={{ fontSize: 16 }}>{b.id}</span>
                <span style={{ fontSize: 9, fontWeight: 700, opacity: 0.7,
                               letterSpacing: '.04em', textTransform: 'uppercase' }}>{b.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Group */}
        <div style={{ marginBottom: 22 }}>
          <Label>Crew</Label>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '12px 18px',
            border: '2.5px solid var(--ink)', borderRadius: 14,
            background: 'var(--paper)',
            boxShadow: '4px 4px 0 var(--ink)',
          }}>
            <span style={{ color: 'var(--ink)' }}>{Icons.people}</span>
            <Stepper
              value={state.crew}
              onChange={n => setState({ ...state, crew: n })}
              min={1} max={12}
            />
            <span style={{
              fontFamily: 'var(--cf-ui)', fontSize: 14, fontWeight: 700,
              opacity: 0.6,
            }}>{state.crew === 1 ? 'just me' : `${state.crew} ppl`}</span>
          </div>
        </div>

        {/* Extras */}
        <div style={{ marginBottom: 28 }}>
          <Label>Add-ons</Label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[
              { id: 'walk',   label: 'walkable',  emoji: '👟' },
              { id: 'late',   label: 'open late', emoji: '🌙' },
              { id: 'snack',  label: 'snacks',    emoji: '🥨' },
              { id: 'patio',  label: 'patio',     emoji: '☀' },
            ].map(a => (
              <Chip key={a.id} dense
                    selected={state.addons.includes(a.id)}
                    color="var(--accent-2)"
                    icon={a.emoji}
                    onClick={() => setState({
                      ...state,
                      addons: state.addons.includes(a.id)
                        ? state.addons.filter(x => x !== a.id)
                        : [...state.addons, a.id]
                    })}>{a.label}</Chip>
            ))}
          </div>
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 2, paddingTop: 12 }}>
        <ChunkyButton
          variant={canPlan ? 'accent' : 'paper'}
          disabled={!canPlan}
          onClick={() => canPlan && onPlan('next')}
          icon={Icons.arrow}>
          {canPlan ? 'Generate my plan' : 'Pick a vibe first'}
        </ChunkyButton>
      </div>
    </div>
  );
}

function Label({ children }) {
  return (
    <div style={{
      fontFamily: 'var(--cf-mono)', fontSize: 11, fontWeight: 700,
      letterSpacing: '.14em', textTransform: 'uppercase',
      color: 'var(--ink)', opacity: 0.55,
      marginBottom: 10,
      display: 'flex', alignItems: 'center',
    }}>{children}</div>
  );
}

function Stepper({ value, onChange, min = 1, max = 99 }) {
  const btn = (label, onClick, disabled) => (
    <button onClick={onClick} disabled={disabled} style={{
      appearance: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
      width: 28, height: 28, borderRadius: 999,
      border: '2px solid var(--ink)', background: 'var(--bg)',
      fontFamily: 'var(--cf-ui)', fontSize: 16, fontWeight: 900,
      color: 'var(--ink)', opacity: disabled ? 0.3 : 1,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      lineHeight: 1,
    }}>{label}</button>
  );
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      {btn('−', () => onChange(Math.max(min, value - 1)), value <= min)}
      <span style={{
        minWidth: 22, textAlign: 'center',
        fontFamily: 'var(--cf-display)', fontSize: 22, fontWeight: 900,
        color: 'var(--ink)', fontVariantNumeric: 'tabular-nums',
      }}>{value}</span>
      {btn('+', () => onChange(Math.min(max, value + 1)), value >= max)}
    </div>
  );
}

// ─── 3. Loader (w/ 6-agent AI pipeline transparency) ──────────────────
const AGENTS = [
  { id: 'context',  label: 'context',   blurb: 'reading your last 18 passes' },
  { id: 'planner',  label: 'planner',   blurb: 'sketching 3 route shapes' },
  { id: 'ranking',  label: 'ranking',   blurb: 'scoring 42 venues by fit' },
  { id: 'filter',   label: 'filter',    blurb: 'enforcing budget + walkable' },
  { id: 'explainer', label: 'explainer', blurb: 'writing the "why" for each pick' },
  { id: 'plangen',  label: 'plan-gen',  blurb: 'composing the pass' },
];

function LoaderScreen({ onDone, agentLeader = 'night' }) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const leader = (typeof AGENT_SPECIALISTS !== 'undefined')
    ? AGENT_SPECIALISTS.find(a => a.id === agentLeader) || AGENT_SPECIALISTS[0]
    : null;
  const active = (typeof AGENT_SPECIALISTS !== 'undefined')
    ? AGENT_SPECIALISTS.filter(a => a.id !== agentLeader).slice(0, 3)
    : [];

  useEffect(() => {
    const start = Date.now();
    const TOTAL = 6800;
    let raf;
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / TOTAL);
      setProgress(t);
      setStep(Math.min(AGENTS.length - 1, Math.floor(t * AGENTS.length)));
      if (t < 1) raf = requestAnimationFrame(tick);
      else setTimeout(onDone, 400);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const messages = AGENTS.map(a => `${a.label}: ${a.blurb}`);

  return (
    <div className="cf-screen" style={{
      position: 'relative', height: '100%', overflow: 'hidden',
      background: 'var(--bg)',
      display: 'grid', placeItems: 'center',
      padding: '60px 24px 36px',
    }}>
      <DotsBg />
      <FloatingTickets density={6} />

      {/* Radial wash */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(circle at 20% 22%, color-mix(in oklab, var(--accent-1) 30%, transparent) 0%, transparent 30%),
                     radial-gradient(circle at 80% 75%, color-mix(in oklab, var(--accent-2) 40%, transparent) 0%, transparent 32%)`,
      }} />

      <div style={{
        position: 'relative', zIndex: 2,
        width: '100%', maxWidth: 340, textAlign: 'center',
      }}>
        <div style={{ marginBottom: 14 }}>
          <BrandMark size={22} spin />
        </div>

        {leader && typeof AgentRouter !== 'undefined' && (
          <div style={{ marginBottom: 16 }}>
            <AgentRouter leader={leader} active={active} />
          </div>
        )}

        {/* Mini ticket machine */}
        <div style={{
          border: '3px solid var(--ink)', borderRadius: 22,
          background: 'var(--paper)',
          boxShadow: '7px 7px 0 var(--ink)',
          overflow: 'hidden',
          textAlign: 'left',
        }}>
          {/* Machine top */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '11px 16px',
            borderBottom: '3px solid var(--ink)',
            background: 'var(--accent-1)',
            fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
            letterSpacing: '.16em', color: 'var(--ink)',
          }}>
            <span>6-AGENT PIPELINE</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: 'var(--ink)',
                animation: 'cf-pulse 1.2s infinite',
              }} />
              RUNNING
            </span>
          </div>

          <div style={{
            margin: 18, padding: 16,
            border: '3px solid var(--ink)', borderRadius: 16,
            background: 'var(--bg)',
            animation: 'cf-print 2.4s infinite ease-in-out',
            transformOrigin: 'top center',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
              letterSpacing: '.14em',
            }}>
              <span>YOUR PASS</span>
              <span>#A7K2</span>
            </div>
            <RouteDots progress={progress} size={18} />
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 4,
              minHeight: 130, justifyContent: 'center',
            }}>
              {AGENTS.map((a, i) => {
                const t = progress * AGENTS.length;
                const active = t > i && t < i + 1;
                const done = t >= i + 1;
                return (
                  <div key={a.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '3px 6px',
                    background: active ? 'var(--accent-2)' : 'transparent',
                    border: active ? '2px solid var(--ink)' : '2px solid transparent',
                    borderRadius: 8,
                    transition: 'all .25s',
                    opacity: done || active ? 1 : 0.35,
                  }}>
                    <span style={{
                      width: 14, height: 14, flexShrink: 0,
                      borderRadius: 999,
                      border: '2px solid var(--ink)',
                      background: done ? 'var(--accent-1)' : active ? 'var(--paper)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 8, fontWeight: 900,
                      color: 'var(--ink)',
                    }}>{done ? '✓' : ''}</span>
                    <span style={{
                      fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
                      letterSpacing: '.06em', color: 'var(--ink)',
                      minWidth: 64,
                    }}>{a.label}</span>
                    <span style={{
                      fontFamily: 'var(--cf-ui)', fontSize: 10, fontWeight: 600,
                      color: 'var(--ink)', opacity: 0.7, flex: 1,
                      textAlign: 'left', whiteSpace: 'nowrap',
                      overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{a.blurb}</span>
                    {active && (
                      <span style={{
                        display: 'inline-flex', gap: 2,
                      }}>
                        {[0, 1, 2].map(j => (
                          <span key={j} style={{
                            width: 3, height: 3, borderRadius: 999,
                            background: 'var(--ink)',
                            animation: `cf-typing 1s ${j * 0.15}s infinite`,
                          }} />
                        ))}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
              letterSpacing: '.14em', marginTop: 4,
            }}>
              <span>3 STOPS</span><span>~4H</span><span>~$92</span>
            </div>
          </div>
        </div>

        <h1 style={{
          fontFamily: 'var(--cf-display)', fontWeight: 900,
          fontSize: 44, lineHeight: 0.95, letterSpacing: '-0.04em',
          color: 'var(--ink)', margin: '24px 0 6px',
        }}>
          Printing your night.
        </h1>

        <div style={{
          position: 'relative', minHeight: 24,
          fontFamily: 'var(--cf-ui)', fontSize: 15, fontWeight: 700,
          color: 'var(--ink)', opacity: 0.85,
        }}>
          {messages.map((m, i) => (
            <span key={i} style={{
              position: 'absolute', inset: 0,
              opacity: i === step ? 1 : 0,
              transform: i === step ? 'translateY(0)' : 'translateY(6px)',
              transition: 'all .4s',
            }}>{m}</span>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{
          marginTop: 22,
          height: 10, border: '2.5px solid var(--ink)', borderRadius: 999,
          background: 'var(--paper)', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: `${progress * 100}%`,
            background: `linear-gradient(90deg, var(--accent-1), var(--accent-2), var(--accent-3))`,
            transition: 'width .2s linear',
          }} />
        </div>
      </div>
    </div>
  );
}

// ─── 4. Pass (results) ──────────────────────────────────────────────────
const SAMPLE_STOPS = [
  { id: 1, time: '7:30', name: 'Skinny Pete\'s', tag: 'dive bar',
    sub: 'a beer + pretzel warm-up', addr: '14 Wythe Ave', dur: '45m',
    cost: '$14', color: 'var(--accent-2)',
    vibe: 'low-lit · loud-ish · jukebox',
    mustOrder: 'jalapeño-pickle martini',
    dress: 'whatever', noise: 'medium',
    walkNext: '6 min walk · 0.3 mi south',
    booking: 'walk-in' },
  { id: 2, time: '8:30', name: 'Lupa Notte', tag: 'italian',
    sub: 'handmade pasta, candles', addr: '88 N 6th St', dur: '90m',
    cost: '$52', color: 'var(--accent-1)',
    vibe: 'romantic · counter seats · packed by 9',
    mustOrder: 'carbonara · burrata · house red',
    dress: 'smart casual', noise: 'medium-loud',
    walkNext: '8 min walk · 0.4 mi · past the L stop',
    booking: 'deposit' },
  { id: 3, time: '10:30', name: 'Quartz Room', tag: 'live show',
    sub: 'indie 4-piece, doors at 10', addr: '146 Metropolitan', dur: '90m',
    cost: '$26', color: 'var(--accent-3)',
    vibe: 'loud · standing room · cash bar',
    mustOrder: 'Pearl Charles set @ 11 · arrive by 10:45',
    dress: 'comfortable', noise: 'loud',
    walkNext: null,
    booking: 'ticket' },
];

function PassScreen({ onStart, planState }) {
  const [expanded, setExpanded] = useState(null);
  const [stops, setStops] = useState(SAMPLE_STOPS);
  const [bookedIds, setBookedIds] = useState(new Set());
  const [bookOpen, setBookOpen] = useState(false);

  const replace = (i) => {
    const alt = {
      0: { name: 'Joe\'s Tavern', tag: 'cocktail bar', sub: 'low light, jazz vinyl',
           addr: '22 Berry St', dur: '60m', cost: '$22', color: 'var(--accent-2)' },
      1: { name: 'Misi', tag: 'pasta hall', sub: 'tasting menu, walk-ins',
           addr: '329 Kent Ave', dur: '90m', cost: '$48', color: 'var(--accent-1)' },
      2: { name: 'Union Pool', tag: 'patio + tacos', sub: 'late-night DJ, taco truck',
           addr: '484 Union Ave', dur: '90m', cost: '$18', color: 'var(--accent-3)' },
    }[i];
    setStops(stops.map((s, j) => j === i ? { ...s, ...alt, time: s.time } : s));
  };

  return (
    <div className="cf-screen" style={{
      position: 'relative', height: '100%',
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      padding: '56px 22px 22px',
      overflow: 'hidden',
    }}>
      <DotsBg opacity={0.06} />

      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 14,
      }}>
        <BrandMark size={17} />
        <span style={{
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
          letterSpacing: '.14em', opacity: 0.55,
        }}>PASS · #A7K2</span>
      </div>

      <div style={{
        position: 'relative', zIndex: 2,
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        marginRight: -22, paddingRight: 22,
        scrollbarWidth: 'none',
      }}>
        <h2 style={{
          fontFamily: 'var(--cf-display)', fontWeight: 900,
          fontSize: 38, lineHeight: 0.95, letterSpacing: '-0.04em',
          color: 'var(--ink)', margin: '0 0 4px',
        }}>
          Your night,<br/>printed.
        </h2>
        <p style={{
          fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 600,
          color: 'var(--ink)', opacity: 0.55, margin: '0 0 16px',
        }}>
          {planState.city} · {planState.when.toLowerCase()} · {(planState.vibes[0] || 'chill')} mix
        </p>

        {/* Pass ticket */}
        <Ticket color="var(--paper)" notch={false} style={{
          padding: '18px 18px 16px',
        }}>
          {/* Top header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            paddingBottom: 14, borderBottom: '2.5px dashed var(--ink)',
            opacity: 1,
          }}>
            <div>
              <div style={{
                fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
                letterSpacing: '.14em', opacity: 0.55,
              }}>SUMMARY</div>
              <div style={{
                fontFamily: 'var(--cf-display)', fontWeight: 900,
                fontSize: 26, letterSpacing: '-0.03em', lineHeight: 1,
                marginTop: 4,
              }}>3 stops · 4h</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
                letterSpacing: '.14em', opacity: 0.55,
              }}>TOTAL</div>
              <div style={{
                fontFamily: 'var(--cf-display)', fontWeight: 900,
                fontSize: 26, letterSpacing: '-0.03em', lineHeight: 1,
                marginTop: 4,
              }}>~$92</div>
            </div>
          </div>

          {/* Stops */}
          <div style={{ paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 0 }}>
            {stops.map((s, i) => (
              typeof StopFlipCard !== 'undefined' ? (
                <StopFlipCard key={s.id} stop={s} index={i}
                              isLast={i === stops.length - 1} />
              ) : (
                <StopRow key={s.id} stop={s} index={i}
                         expanded={expanded === i}
                         booked={bookedIds.has(s.id)}
                         onToggle={() => setExpanded(expanded === i ? null : i)}
                         onReplace={() => replace(i)}
                         isLast={i === stops.length - 1} />
              )
            ))}
          </div>

          {/* Book everything summary row */}
          {typeof BookingSummary !== 'undefined' && (
            <BookingSummary stops={stops} bookedIds={bookedIds}
                            onBookAll={() => setBookOpen(true)} />
          )}

          {/* Bottom stamps */}
          <div style={{
            marginTop: 14, paddingTop: 14, borderTop: '2.5px dashed var(--ink)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6,
          }}>
            <Stamp color="var(--accent-2)" rotate={-2}>
              {planState.vibes[0] || 'chill'}
            </Stamp>
            {planState.vibes[1] && (
              <Stamp color="var(--accent-1)" rotate={2}>{planState.vibes[1]}</Stamp>
            )}
            {planState.addons[0] === 'walk' && (
              <Stamp color="var(--accent-3)" rotate={-2} style={{ color: 'var(--paper)' }}>
                walkable
              </Stamp>
            )}
            <span style={{
              fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
              letterSpacing: '.14em', opacity: 0.5, marginLeft: 'auto',
            }}>#A7K2</span>
          </div>
        </Ticket>

        {/* Secondary actions */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <SecondaryBtn icon={Icons.refresh}>reshuffle</SecondaryBtn>
          <SecondaryBtn icon="✎">edit vibe</SecondaryBtn>
          <SecondaryBtn icon="↗">share</SecondaryBtn>
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 2, paddingTop: 14 }}>
        <ChunkyButton variant="accent" onClick={onStart} icon={Icons.arrow}>
          Start the night
        </ChunkyButton>
      </div>
      {typeof BookEverythingSheet !== 'undefined' && (
        <BookEverythingSheet
          open={bookOpen}
          stops={stops}
          bookedIds={bookedIds}
          onClose={() => setBookOpen(false)}
          onComplete={(ids) => setBookedIds(new Set([...bookedIds, ...ids]))}
        />
      )}
    </div>
  );
}

function SecondaryBtn({ children, icon, onClick }) {
  return (
    <button onClick={onClick} style={{
      appearance: 'none', cursor: 'pointer', flex: 1,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      padding: '10px 8px',
      border: '2.5px solid var(--ink)', borderRadius: 12,
      background: 'var(--paper)', color: 'var(--ink)',
      fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 800,
      boxShadow: '3px 3px 0 var(--ink)',
    }}>
      <span style={{ fontSize: 13 }}>{icon}</span>
      {children}
    </button>
  );
}

function StopRow({ stop, index, expanded, onToggle, onReplace, isLast, booked }) {
  return (
    <div style={{
      display: 'flex', gap: 12,
      paddingBottom: isLast ? 0 : 14,
      marginBottom: isLast ? 0 : 14,
      borderBottom: isLast ? 'none' : '1.5px dashed rgba(0,0,0,0.15)',
    }}>
      {/* Rail w/ number */}
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
      <div style={{ flex: 1, minWidth: 0 }}>
        <button onClick={onToggle} style={{
          appearance: 'none', cursor: 'pointer', background: 'transparent',
          border: 'none', padding: 0, textAlign: 'left', width: '100%',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          gap: 8,
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
            {stop.booking && typeof BookingPill !== 'undefined' && (
              <div style={{ marginTop: 6 }}>
                <BookingPill type={stop.booking}
                             status={booked ? 'booked' : 'unbooked'} />
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
            {stop.walkNext && (
              <div style={{
                marginTop: 8,
                fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
                color: 'var(--ink)', opacity: 0.65, letterSpacing: '.04em',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{ color: 'var(--accent-1)' }}>↓</span>
                <span>{stop.walkNext}</span>
              </div>
            )}
          </div>
          <div style={{
            fontFamily: 'var(--cf-mono)', fontSize: 11, fontWeight: 800,
            letterSpacing: '.06em', color: 'var(--ink)',
            textAlign: 'right', flexShrink: 0,
          }}>
            <div>{stop.cost}</div>
            <div style={{ opacity: 0.5, marginTop: 2 }}>{stop.dur}</div>
          </div>
        </button>
        {expanded && (
          <div style={{
            marginTop: 10, padding: 12,
            border: '2px solid var(--ink)', borderRadius: 10,
            background: 'var(--bg)',
          }}>
            <div style={{
              fontFamily: 'var(--cf-mono)', fontSize: 11, fontWeight: 700,
              opacity: 0.7,
            }}>📍 {stop.addr}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <button onClick={(e) => { e.stopPropagation(); onReplace(); }} style={{
                appearance: 'none', cursor: 'pointer',
                padding: '6px 10px', border: '2px solid var(--ink)',
                borderRadius: 999, background: 'var(--paper)',
                fontFamily: 'var(--cf-ui)', fontSize: 11, fontWeight: 800,
              }}>↻ swap</button>
              <button style={{
                appearance: 'none', cursor: 'pointer',
                padding: '6px 10px', border: '2px solid var(--ink)',
                borderRadius: 999, background: 'var(--paper)',
                fontFamily: 'var(--cf-ui)', fontSize: 11, fontWeight: 800,
              }}>+ 30m</button>
              <button style={{
                appearance: 'none', cursor: 'pointer',
                padding: '6px 10px', border: '2px solid var(--ink)',
                borderRadius: 999, background: 'var(--paper)',
                fontFamily: 'var(--cf-ui)', fontSize: 11, fontWeight: 800,
              }}>book</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 5. Night of (active) ───────────────────────────────────────────────
function NightOfScreen({ onRestart, planState, onNotify }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [checkins, setCheckins] = useState([null, null, null]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [transit, setTransit] = useState(false);
  const stops = SAMPLE_STOPS;
  const current = stops[activeIdx];
  const next = stops[activeIdx + 1];
  const checkedIn = checkins[activeIdx] != null;
  const done = activeIdx >= stops.length;

  // Auto-fire a check-in nudge ~3s after entering each stop
  useEffect(() => {
    if (done) return;
    if (checkedIn) return;
    const t = setTimeout(() => {
      onNotify?.({
        kind: 'check-in',
        title: `You're at ${current.name}`,
        body: 'Tap to drop a photo + caption — crew will see it.',
        onAccept: () => setSheetOpen(true),
      });
    }, 1800);
    return () => clearTimeout(t);
  }, [activeIdx, checkedIn, done]);

  const postCheckin = (data) => {
    const next = [...checkins];
    next[activeIdx] = { ...data, when: 'just now' };
    setCheckins(next);
    setSheetOpen(false);
  };

  const goNext = () => {
    if (!next) {
      setActiveIdx(activeIdx + 1);
      return;
    }
    setTransit(true);
  };

  if (done) {
    return <NightFinished onRestart={onRestart} checkins={checkins} />;
  }

  if (transit && next) {
    return <OnMyWayScreen
      fromStop={current}
      toStop={next}
      onCancel={() => setTransit(false)}
      onArrived={() => {
        setTransit(false);
        setActiveIdx(activeIdx + 1);
        onNotify?.({
          kind: 'omw',
          title: `Crew is heading to ${next.name}`,
          body: 'maya + devon shared their ETA — open to see them on the route.',
        });
      }}
    />;
  }

  return (
    <div className="cf-screen" style={{
      position: 'relative', height: '100%',
      background: 'var(--ink)',
      color: 'var(--paper)',
      display: 'flex', flexDirection: 'column',
      padding: '56px 22px 22px',
      overflow: 'hidden',
    }}>
      {/* Star pattern */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.16,
        backgroundImage: `radial-gradient(var(--paper) 1px, transparent 1px),
                          radial-gradient(var(--paper) 1px, transparent 1px)`,
        backgroundSize: '32px 32px, 26px 26px',
        backgroundPosition: '0 0, 13px 13px',
      }} />

      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 14,
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          fontFamily: 'var(--cf-display)', fontWeight: 900,
          fontSize: 16, letterSpacing: '-0.03em', color: 'var(--paper)',
        }}>
          <span style={{ color: 'var(--accent-1)' }}>✣</span>
          confetti<span style={{ color: 'var(--accent-1)' }}>.</span>
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 10px',
          border: '2px solid var(--paper)', borderRadius: 999,
          fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
          letterSpacing: '.14em',
        }}>
          <span style={{
            width: 5, height: 5, borderRadius: '50%',
            background: 'var(--accent-1)',
            animation: 'cf-pulse 1.2s infinite',
          }} />
          LIVE · 9:47 PM
        </span>
      </div>

      {/* Progress rail */}
      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 6px', marginBottom: 18,
      }}>
        <div style={{
          position: 'absolute', left: 18, right: 18, top: 13,
          height: 2, background: 'rgba(255,255,255,0.2)',
        }} />
        <div style={{
          position: 'absolute', left: 18, top: 13,
          height: 3, background: 'var(--accent-1)',
          width: `calc((100% - 36px) * ${activeIdx / (stops.length - 1)})`,
          transition: 'width .4s',
        }} />
        {stops.map((s, i) => {
          const isCurrent = i === activeIdx;
          const isChecked = checkins[i] != null;
          const isPast = i < activeIdx;
          return (
            <div key={i} style={{
              position: 'relative', zIndex: 1,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            }}>
              <div style={{
                width: isCurrent ? 30 : 26, height: isCurrent ? 30 : 26, borderRadius: 999,
                border: '2.5px solid var(--paper)',
                background: isChecked || isPast ? 'var(--accent-1)' : isCurrent ? 'var(--paper)' : 'var(--ink)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: isCurrent ? 15 : 13,
                color: isCurrent && !isChecked ? 'var(--ink)' : isChecked || isPast ? 'var(--ink)' : 'var(--paper)',
                boxShadow: isCurrent ? '0 0 0 3px var(--accent-1)' : 'none',
                transition: 'all .3s',
              }}>{isChecked ? '✓' : i + 1}</div>
              <span style={{
                fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 700,
                letterSpacing: '.1em', opacity: 0.7,
              }}>{s.time}</span>
            </div>
          );
        })}
      </div>

      {/* Scrollable content */}
      <div style={{
        position: 'relative', zIndex: 2, flex: 1, overflowY: 'auto',
        marginRight: -22, paddingRight: 22, scrollbarWidth: 'none',
      }}>
        <div style={{
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
          letterSpacing: '.16em', opacity: 0.7, marginBottom: 8,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: 999,
            background: 'var(--accent-1)',
            animation: 'cf-pulse 1.2s infinite',
          }} />
          {checkedIn ? 'CHECKED IN' : "YOU'RE HERE NOW"}
        </div>

        <Ticket color="var(--paper)" notch={false} style={{
          padding: 18, color: 'var(--ink)',
          boxShadow: '6px 6px 0 var(--accent-1)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            gap: 12, marginBottom: 8,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'inline-block',
                padding: '4px 8px', background: current.color,
                border: '2px solid var(--ink)', borderRadius: 999,
                fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
                letterSpacing: '.12em', textTransform: 'uppercase',
              }}>STOP {activeIdx + 1} · {current.tag}</div>
              <div style={{
                fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 30,
                letterSpacing: '-0.035em', lineHeight: 1, marginTop: 10,
              }}>{current.name}</div>
              <div style={{
                fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 600,
                opacity: 0.65, marginTop: 4,
              }}>{current.sub}</div>
            </div>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            gap: 0, marginTop: 14,
            border: '2.5px solid var(--ink)', borderRadius: 10,
            overflow: 'hidden',
          }}>
            {[
              { lbl: 'arrive', val: current.time + ' PM' },
              { lbl: 'stay',   val: current.dur },
              { lbl: 'budget', val: current.cost },
            ].map((m, i) => (
              <div key={m.lbl} style={{
                padding: '10px 8px', textAlign: 'center',
                borderLeft: i > 0 ? '2px solid var(--ink)' : 'none',
                background: i === 1 ? 'var(--bg)' : 'var(--paper)',
              }}>
                <div style={{
                  fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
                  letterSpacing: '.14em', opacity: 0.55, textTransform: 'uppercase',
                }}>{m.lbl}</div>
                <div style={{
                  fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 16,
                  marginTop: 2,
                }}>{m.val}</div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: 12, padding: '10px 12px',
            border: '2px dashed var(--ink)', borderRadius: 10,
            fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ color: 'var(--accent-1)' }}>{Icons.pin}</span>
            <span style={{ flex: 1 }}>{current.addr}</span>
            <button style={{
              appearance: 'none', cursor: 'pointer',
              padding: '4px 8px',
              border: '2px solid var(--ink)', borderRadius: 999,
              background: 'var(--accent-2)',
              fontFamily: 'var(--cf-ui)', fontSize: 10, fontWeight: 800,
              letterSpacing: '.04em', textTransform: 'uppercase',
            }}>open map</button>
          </div>

          {/* My check-in posted card */}
          {checkedIn && (
            <PostedCard check={checkins[activeIdx]} stop={current} />
          )}
        </Ticket>

        {/* Live crew feed */}
        <LiveFeed />

        {/* Next-up preview */}
        {next && (
          <div style={{
            marginTop: 16, padding: '14px 16px',
            border: '2px dashed rgba(255,255,255,0.35)', borderRadius: 14,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
              letterSpacing: '.14em', opacity: 0.6,
              writingMode: 'vertical-rl', transform: 'rotate(180deg)',
            }}>NEXT</div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
                letterSpacing: '.12em', opacity: 0.65,
              }}>{next.time} PM · {next.tag.toUpperCase()}</div>
              <div style={{
                fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 18,
                letterSpacing: '-0.025em', marginTop: 2,
              }}>{next.name}</div>
            </div>
            <span style={{
              fontFamily: 'var(--cf-mono)', fontSize: 11, fontWeight: 800,
              opacity: 0.75,
            }}>8 min walk</span>
          </div>
        )}

        <div style={{ height: 10 }} />
      </div>

      {/* Action button */}
      <div style={{ position: 'relative', zIndex: 2, paddingTop: 12, display: 'flex', gap: 8 }}>
        {!checkedIn ? (
          <button onClick={() => setSheetOpen(true)} style={{
            appearance: 'none', cursor: 'pointer', flex: 1,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '16px 18px',
            border: '3px solid var(--paper)', borderRadius: 16,
            background: 'var(--accent-1)', color: 'var(--ink)',
            fontFamily: 'var(--cf-ui)', fontSize: 15, fontWeight: 900,
            boxShadow: '4px 4px 0 var(--paper)',
          }}>
            <span style={{ display: 'inline-flex' }}>{SocialIcons.camera}</span>
            check in & share
          </button>
        ) : (
          <button onClick={goNext} style={{
            appearance: 'none', cursor: 'pointer', flex: 1,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '16px 18px',
            border: '3px solid var(--paper)', borderRadius: 16,
            background: 'var(--accent-1)', color: 'var(--ink)',
            fontFamily: 'var(--cf-ui)', fontSize: 15, fontWeight: 900,
            boxShadow: '4px 4px 0 var(--paper)',
          }}>
            {next ? `i'm on my way to ${next.name.split(' ')[0]}` : 'wrap the night'}
            <span style={{ display: 'inline-flex' }}>{Icons.arrow}</span>
          </button>
        )}
      </div>

      <CheckInSheet
        open={sheetOpen}
        stop={{ ...current, idx: activeIdx }}
        onClose={() => setSheetOpen(false)}
        onPost={postCheckin}
      />
    </div>
  );
}

// ─── 6. Night finished — receipt + auto-reel + share rail ────────────
function NightFinished({ onRestart, checkins = [] }) {
  const [shared, setShared] = useState(null);

  return (
    <div className="cf-screen" style={{
      position: 'relative', height: '100%',
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      padding: '56px 22px 22px',
      overflow: 'hidden',
    }}>
      <DotsBg opacity={0.06} />
      <FloatingTickets density={4} />

      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <BrandMark size={17} />
        <span style={{
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
          letterSpacing: '.14em', opacity: 0.55,
        }}>PASS · #A7K2 · CLOSED</span>
      </div>

      <div style={{
        position: 'relative', zIndex: 2, flex: 1,
        overflowY: 'auto', marginRight: -22, paddingRight: 22,
        scrollbarWidth: 'none',
      }}>
        <Stamp color="var(--accent-2)" rotate={-4}
               style={{ alignSelf: 'flex-start', fontSize: 13, marginBottom: 12 }}>
          night complete
        </Stamp>
        <h1 style={{
          fontFamily: 'var(--cf-display)', fontWeight: 900,
          fontSize: 50, lineHeight: 0.92, letterSpacing: '-0.045em',
          color: 'var(--ink)', margin: '0 0 18px',
        }}>
          That was<br/>
          <span style={{ color: 'var(--accent-1)' }}>a night.</span>
        </h1>

        {/* Reel preview */}
        <ReelPreview
          stops={SAMPLE_STOPS}
          checkins={checkins.map((c, i) =>
            c || { photoColor: SAMPLE_STOPS[i].color, caption: '' }
          )}
          onPost={() => setShared('tiktok')}
        />

        {/* Share rail */}
        <div style={{ marginTop: 18 }}>
          <div style={{
            fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
            letterSpacing: '.16em', opacity: 0.55, marginBottom: 10,
          }}>SHARE</div>
          <ShareRail onShare={(k) => setShared(k)} />
          {shared && (
            <div style={{
              marginTop: 10, padding: '8px 12px',
              background: 'var(--ink)', color: 'var(--paper)',
              border: '2px solid var(--ink)', borderRadius: 999,
              fontFamily: 'var(--cf-mono)', fontSize: 11, fontWeight: 800,
              letterSpacing: '.1em', textAlign: 'center',
              animation: 'cf-bubble 0.3s',
            }}>✓ SHARED TO {shared.toUpperCase()}</div>
          )}
        </div>

        {/* Receipt */}
        <div style={{
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
          letterSpacing: '.16em', opacity: 0.55, marginBottom: 10, marginTop: 18,
        }}>RECEIPT</div>
        <Ticket color="var(--paper)" notch={false} style={{ padding: 16 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
            letterSpacing: '.12em', marginBottom: 10, opacity: 0.6,
          }}>
            <span>SAT MAY 23 · BROOKLYN</span><span>#A7K2</span>
          </div>
          {SAMPLE_STOPS.map((s, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', gap: 10,
              padding: '6px 0',
              borderBottom: i < 2 ? '1.5px dashed rgba(0,0,0,0.15)' : 'none',
              fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 700,
            }}>
              <span style={{
                fontFamily: 'var(--cf-mono)', fontSize: 10,
                opacity: 0.55, width: 64,
              }}>{s.time} PM</span>
              <span style={{ flex: 1 }}>{s.name}</span>
              <span style={{ fontFamily: 'var(--cf-mono)', fontWeight: 800 }}>{s.cost}</span>
            </div>
          ))}
          <div style={{
            marginTop: 12, paddingTop: 10,
            borderTop: '2.5px solid var(--ink)',
            display: 'flex', justifyContent: 'space-between',
            fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 18,
          }}>
            <span>TOTAL</span><span>$92</span>
          </div>
          <div style={{
            display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap',
          }}>
            <Stamp color="var(--accent-2)" rotate={-3} style={{ fontSize: 10 }}>foodie</Stamp>
            <Stamp color="var(--accent-1)" rotate={2} style={{ fontSize: 10 }}>chill</Stamp>
            <Stamp color="var(--accent-3)" rotate={-2} style={{ fontSize: 10, color: 'var(--paper)' }}>walkable</Stamp>
          </div>
        </Ticket>

        <div style={{ height: 14 }} />
      </div>

      <div style={{ position: 'relative', zIndex: 2, display: 'flex', gap: 8, paddingTop: 12 }}>
        <ChunkyButton variant="paper" onClick={onRestart}>scrapbook</ChunkyButton>
        <ChunkyButton variant="accent" onClick={onRestart} icon={Icons.refresh}>plan another</ChunkyButton>
      </div>
    </div>
  );
}

Object.assign(window, {
  WelcomeScreen, PlanScreen, LoaderScreen, PassScreen, NightOfScreen, NightFinished,
});
