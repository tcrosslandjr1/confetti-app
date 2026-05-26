// extras.jsx — Explainer, Hub, Chat, OnMyWay, Push notifications, TabBar

const { useState: useStateX, useEffect: useEffectX, useRef: useRefX } = React;

// ═════════════════════════════════════════════════════════════════════
// 0. TabBar — persistent bottom navigation
// ═════════════════════════════════════════════════════════════════════
function TabBar({ active, onChange, dark = false }) {
  const tabs = [
    { id: 'hub',   label: 'home', icon:
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 9l7-6 7 6v8a1 1 0 0 1-1 1h-4v-5h-4v5H4a1 1 0 0 1-1-1z"
              stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      </svg> },
    { id: 'plan',  label: 'plan', icon:
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 1l2 6h6l-5 4 2 7-7-4-7 4 2-7-5-4h6z"
              stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="currentColor" fillOpacity="0.18"/>
      </svg> },
    { id: 'feed',  label: 'feed', icon:
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="3" width="14" height="14" rx="2.5" stroke="currentColor" strokeWidth="2"/>
        <path d="M7 8h6M7 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg> },
    { id: 'crew',  label: 'crew', icon:
      <svg width="22" height="20" viewBox="0 0 22 20" fill="none">
        <circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="2"/>
        <circle cx="15" cy="7" r="3" stroke="currentColor" strokeWidth="2"/>
        <path d="M1 18c0-3 2.7-5 6-5s6 2 6 5M9 18c0-3 2.7-5 6-5s6 2 6 5"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg> },
    { id: 'you',   label: 'you', icon:
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="6" r="3.5" stroke="currentColor" strokeWidth="2"/>
        <path d="M2 19c0-4 3.5-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg> },
  ];
  const bg = dark ? 'rgba(10,10,10,0.65)' : 'rgba(255,250,240,0.82)';
  const border = dark ? 'var(--paper)' : 'var(--ink)';
  return (
    <div style={{
      position: 'absolute', left: 16, right: 16, bottom: 12, zIndex: 30,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 10px',
      border: `2.5px solid ${border}`, borderRadius: 999,
      background: bg,
      backdropFilter: 'blur(24px) saturate(160%)',
      WebkitBackdropFilter: 'blur(24px) saturate(160%)',
      boxShadow: dark ? '3px 3px 0 var(--accent-1)' : '4px 4px 0 var(--ink)',
    }}>
      {tabs.map(t => {
        const on = active === t.id;
        return (
          <button key={t.id} onClick={() => onChange(t.id)} style={{
            appearance: 'none', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: on ? '6px 12px' : 6,
            border: 'none', borderRadius: 999,
            background: on ? (dark ? 'var(--paper)' : 'var(--ink)') : 'transparent',
            color: on ? (dark ? 'var(--ink)' : 'var(--paper)') : (dark ? 'var(--paper)' : 'var(--ink)'),
            fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 800,
            transition: 'all .18s cubic-bezier(.3,.7,.4,1)',
          }}>
            <span style={{ display: 'inline-flex' }}>{t.icon}</span>
            {on && <span>{t.label}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// 1. Explainer — 3-panel "how it works" carousel
// ═════════════════════════════════════════════════════════════════════
function ExplainerScreen({ onDone }) {
  const [page, setPage] = useStateX(0);
  const panels = [
    {
      stamp: 'step 01', title: 'Tell us a vibe.',
      body: 'Foodie + walkable + low-key. Or chat it out. We learn how your nights actually run.',
      anim: <AnimVibes />,
      color: 'var(--accent-1)',
    },
    {
      stamp: 'step 02', title: 'We print a pass.',
      body: '3 stops, real venues, real timing, with a budget on it. Swap any stop you don\'t like.',
      anim: <AnimPrinting />,
      color: 'var(--accent-2)',
    },
    {
      stamp: 'step 03', title: 'Show up. Share.',
      body: 'Check in at every stop. Auto-clip a 9-sec reel for TikTok. Crew sees you live.',
      anim: <AnimShare />,
      color: 'var(--accent-3)',
    },
  ];
  const p = panels[page];

  return (
    <div className="cf-screen" style={{
      position: 'relative', height: '100%', overflow: 'hidden',
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      padding: '60px 24px 28px',
    }}>
      <DotsBg opacity={0.07} />

      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <BrandMark size={17} />
        <button onClick={onDone} style={{
          appearance: 'none', cursor: 'pointer', background: 'transparent',
          border: 'none', padding: 6,
          fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 800,
          color: 'var(--ink)', opacity: 0.55,
        }}>skip →</button>
      </div>

      <div style={{
        position: 'relative', zIndex: 2,
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        gap: 18, paddingTop: 16,
      }}>
        {/* Animated illustration container */}
        <div key={page} style={{
          height: 240,
          border: '3px solid var(--ink)', borderRadius: 22,
          background: p.color,
          boxShadow: '7px 7px 0 var(--ink)',
          position: 'relative', overflow: 'hidden',
          animation: 'cf-pop 0.35s cubic-bezier(.2,1.4,.4,1)',
        }}>
          {p.anim}
        </div>

        <Stamp color="var(--paper)" rotate={-2}
               style={{ alignSelf: 'flex-start' }}>
          {p.stamp}
        </Stamp>

        <h1 key={'h' + page} style={{
          fontFamily: 'var(--cf-display)', fontWeight: 900,
          fontSize: 38, lineHeight: 0.95, letterSpacing: '-0.04em',
          color: 'var(--ink)', margin: 0,
          animation: 'cf-slideup-text 0.4s',
        }}>{p.title}</h1>

        <p key={'b' + page} style={{
          fontFamily: 'var(--cf-ui)', fontSize: 15, fontWeight: 500,
          color: 'var(--ink)', opacity: 0.75, margin: 0, maxWidth: 320,
          lineHeight: 1.4, animation: 'cf-slideup-text 0.5s',
        }}>{p.body}</p>
      </div>

      {/* Dots + button */}
      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          {panels.map((_, i) => (
            <span key={i} style={{
              width: i === page ? 28 : 8, height: 8, borderRadius: 999,
              background: i === page ? 'var(--ink)' : 'rgba(0,0,0,0.18)',
              border: i === page ? '0' : '0',
              transition: 'all .25s',
            }} />
          ))}
        </div>
        <ChunkyButton variant="primary" icon={Icons.arrow}
          onClick={() => page < 2 ? setPage(page + 1) : onDone()}>
          {page < 2 ? 'next' : 'let\'s plan one'}
        </ChunkyButton>
      </div>
    </div>
  );
}

// ─── Illustration animations for the explainer ────────────────────
function AnimVibes() {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexWrap: 'wrap', gap: 8, padding: 30, alignContent: 'center',
    }}>
      {['🌿 chill', '⚡ hype', '🍜 foodie', '🌳 outdoorsy', '🍷 romantic', '🎭 culture'].map((v, i) => (
        <span key={i} style={{
          padding: '8px 14px',
          border: '2.5px solid var(--ink)', borderRadius: 999,
          background: i === 2 || i === 0 ? 'var(--paper)' : 'rgba(255,255,255,0.45)',
          fontFamily: 'var(--cf-ui)', fontSize: 14, fontWeight: 800,
          boxShadow: i === 2 || i === 0 ? '3px 3px 0 var(--ink)' : 'none',
          transform: i === 2 || i === 0 ? 'translate(-1px,-1px)' : 'none',
          animation: `cf-vibe-pop 0.5s ${i * 0.08}s both`,
        }}>{v}</span>
      ))}
    </div>
  );
}

function AnimPrinting() {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'grid', placeItems: 'center', overflow: 'hidden',
    }}>
      <div style={{
        width: 160, padding: 12, background: 'var(--paper)',
        border: '2.5px solid var(--ink)', borderRadius: 12,
        boxShadow: '4px 4px 0 var(--ink)',
        animation: 'cf-print-anim 2.4s infinite ease-in-out',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontFamily: 'var(--cf-mono)', fontSize: 8, fontWeight: 800,
          letterSpacing: '.14em', color: 'var(--ink)',
        }}>
          <span>YOUR PASS</span><span>#A7K2</span>
        </div>
        <div style={{ marginTop: 8, marginBottom: 8 }}>
          <RouteDots progress={1} size={12} />
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontFamily: 'var(--cf-mono)', fontSize: 8, fontWeight: 800,
          letterSpacing: '.14em', color: 'var(--ink)',
        }}>
          <span>3 STOPS</span><span>~$92</span>
        </div>
      </div>
      {/* Print slot */}
      <div style={{
        position: 'absolute', top: 6, left: 16, right: 16,
        height: 12, background: 'var(--ink)', borderRadius: 4,
      }}>
        <div style={{
          position: 'absolute', top: 4, left: 12, right: 12,
          height: 3, background: 'var(--paper)', borderRadius: 999,
        }} />
      </div>
    </div>
  );
}

function AnimShare() {
  const checks = [
    { c: 'var(--accent-2)', r: -8, t: 30, l: 30 },
    { c: 'var(--paper)',    r:  4, t: 80, l: 130 },
    { c: 'var(--accent-1)', r: -3, t: 130, l: 60 },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {checks.map((ch, i) => (
        <div key={i} style={{
          position: 'absolute', top: ch.t, left: ch.l,
          width: 90, padding: 6, background: ch.c,
          border: '2.5px solid var(--ink)', borderRadius: 8,
          transform: `rotate(${ch.r}deg)`,
          boxShadow: '3px 3px 0 var(--ink)',
          animation: `cf-vibe-pop 0.4s ${i * 0.12 + 0.2}s both`,
        }}>
          <div style={{
            aspectRatio: '4/3',
            background: 'rgba(0,0,0,0.18)',
            border: '1.5px solid var(--ink)',
            backgroundImage: `repeating-linear-gradient(135deg, rgba(0,0,0,0.15) 0 4px, transparent 4px 8px)`,
          }} />
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontFamily: 'var(--cf-mono)', fontSize: 7, fontWeight: 800,
            marginTop: 4, opacity: 0.7,
          }}>
            <span>@maya</span><span>{2 + i}m</span>
          </div>
        </div>
      ))}
      <div style={{
        position: 'absolute', top: 90, right: 24,
        width: 56, height: 56, borderRadius: 999,
        border: '3px solid var(--ink)', background: 'var(--ink)', color: 'var(--paper)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'cf-pop 0.4s 0.5s both',
        boxShadow: '4px 4px 0 var(--paper)',
      }}>
        <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
          <path d="M14 2v2.4a4 4 0 0 0 3.8 3.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M14 2v10a4 4 0 1 1-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// 2. Hub — portal/dashboard
// ═════════════════════════════════════════════════════════════════════
function HubScreen({ onGo, planState }) {
  return (
    <div className="cf-screen" style={{
      position: 'relative', height: '100%',
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      padding: '56px 22px 76px',
      overflow: 'hidden',
    }}>
      <DotsBg opacity={0.06} />

      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 14,
      }}>
        <BrandMark size={18} />
        <button style={{
          appearance: 'none', cursor: 'pointer',
          width: 38, height: 38, borderRadius: 999,
          border: '2.5px solid var(--ink)', background: 'var(--accent-2)',
          fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 14,
          color: 'var(--ink)',
          boxShadow: '3px 3px 0 var(--ink)',
        }}>JS</button>
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
          Hey, Jess.
        </h2>
        <p style={{
          fontFamily: 'var(--cf-ui)', fontSize: 14, fontWeight: 600,
          color: 'var(--ink)', opacity: 0.6, margin: '0 0 18px',
        }}>
          Saturday's wide open. Print one?
        </p>

        {/* Big planner CTA — two paths */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10, marginBottom: 18 }}>
          <button onClick={() => onGo('chat')} style={{
            appearance: 'none', cursor: 'pointer', textAlign: 'left',
            padding: '16px 14px',
            border: '3px solid var(--ink)', borderRadius: 18,
            background: 'var(--accent-1)', color: 'var(--ink)',
            boxShadow: '5px 5px 0 var(--ink)',
            display: 'flex', flexDirection: 'column', gap: 6,
            minHeight: 130,
          }}>
            <span style={{
              fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
              letterSpacing: '.14em', opacity: 0.7,
            }}>NEW · BETA</span>
            <span style={{
              fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 22,
              letterSpacing: '-0.03em', lineHeight: 0.95,
            }}>chat with<br/>confetti</span>
            <span style={{
              fontFamily: 'var(--cf-ui)', fontSize: 11, fontWeight: 700,
              opacity: 0.75, marginTop: 'auto',
            }}>talk it out, get a pass</span>
          </button>
          <button onClick={() => onGo('plan')} style={{
            appearance: 'none', cursor: 'pointer', textAlign: 'left',
            padding: '16px 14px',
            border: '3px solid var(--ink)', borderRadius: 18,
            background: 'var(--paper)', color: 'var(--ink)',
            boxShadow: '5px 5px 0 var(--ink)',
            display: 'flex', flexDirection: 'column', gap: 6,
            minHeight: 130,
          }}>
            <span style={{
              fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
              letterSpacing: '.14em', opacity: 0.55,
            }}>CLASSIC</span>
            <span style={{
              fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 22,
              letterSpacing: '-0.03em', lineHeight: 0.95,
            }}>vibe<br/>form</span>
            <span style={{
              fontFamily: 'var(--cf-ui)', fontSize: 11, fontWeight: 700,
              opacity: 0.55, marginTop: 'auto',
            }}>chips + sliders</span>
          </button>
        </div>

        {/* Tonight pass (active) */}
        <SectionLabel>tonight</SectionLabel>
        <button onClick={() => onGo('night')} style={{
          appearance: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
          padding: 0, border: 'none', background: 'transparent',
          marginBottom: 18,
        }}>
          <Ticket color="var(--paper)" notch={false} style={{ padding: 14 }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 8,
            }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 8px', background: 'var(--accent-1)',
                border: '2px solid var(--ink)', borderRadius: 999,
                fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
                letterSpacing: '.14em',
              }}>
                <span style={{
                  width: 5, height: 5, borderRadius: 999, background: 'var(--ink)',
                  animation: 'cf-pulse 1.2s infinite',
                }} />
                IN PROGRESS · STOP 2/3
              </span>
              <span style={{
                fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
                opacity: 0.55, letterSpacing: '.12em',
              }}>#A7K2</span>
            </div>
            <div style={{
              fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 22,
              letterSpacing: '-0.03em', lineHeight: 1,
            }}>Lupa Notte</div>
            <div style={{
              fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 700,
              opacity: 0.6, marginTop: 3,
            }}>8:30 PM · italian · 88 N 6th St</div>
            <div style={{ marginTop: 10 }}>
              <RouteDots progress={0.5} size={14} />
            </div>
            <div style={{
              marginTop: 6, paddingTop: 10, borderTop: '2px dashed rgba(0,0,0,0.15)',
              display: 'flex', alignItems: 'center', gap: 8,
              fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 800,
            }}>
              <span>→</span><span>Heading back to the live view</span>
            </div>
          </Ticket>
        </button>

        {/* Quick portals row */}
        <SectionLabel>portals</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 18 }}>
          <Portal icon="🗺" label="explore" sub="venues nearby" onClick={() => onGo('explore')} />
          <Portal icon="🎬" label="crew reels" sub="3 new" onClick={() => onGo('feed')} />
          <Portal icon="📍" label="crew map" sub="3 live now" onClick={() => onGo('crew-map')} />
          <Portal icon="📅" label="this week" sub="3 ideas" onClick={() => onGo('plan')} />
          <Portal icon="💳" label="wallet" sub="1 active" onClick={() => onGo('wallet')} />
          <Portal icon="🎲" label="surprise me" sub="full random" onClick={() => onGo('loader')} />
        </div>

        {/* Recent passes */}
        <SectionLabel>your scrapbook · 18 nights</SectionLabel>
        <div style={{
          display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none',
          marginRight: -22, paddingRight: 22, marginBottom: 18,
        }}>
          {[
            { date: 'fri may 16', n: 'Bushwick crawl', cost: '$48', color: 'var(--accent-2)' },
            { date: 'sat may 10', n: 'Date night LES', cost: '$92', color: 'var(--accent-1)' },
            { date: 'thu may 1', n: 'Solo culture',   cost: '$26', color: 'var(--accent-3)' },
            { date: 'fri apr 25', n: 'Weird brunch',   cost: '$54', color: 'var(--accent-2)' },
          ].map((p, i) => (
            <div key={i} style={{
              flexShrink: 0, width: 130,
              border: '2.5px solid var(--ink)', borderRadius: 12,
              background: p.color, padding: 10,
              boxShadow: '3px 3px 0 var(--ink)',
              transform: `rotate(${[-2, 1, -1, 2][i]}deg)`,
            }}>
              <div style={{
                fontFamily: 'var(--cf-mono)', fontSize: 8, fontWeight: 800,
                letterSpacing: '.14em', opacity: 0.6,
              }}>{p.date.toUpperCase()}</div>
              <div style={{
                fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 15,
                letterSpacing: '-0.02em', marginTop: 4, lineHeight: 1.05,
              }}>{p.n}</div>
              <div style={{
                fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
                opacity: 0.7, marginTop: 6,
              }}>{p.cost} · 3 stops</div>
            </div>
          ))}
        </div>

        {/* Crew live preview */}
        <SectionLabel>crew live now</SectionLabel>
        <CrewMiniFeed onClick={() => onGo('feed')} />

        <div style={{ height: 8 }} />
      </div>
    </div>
  );
}

function Portal({ icon, label, sub, onClick }) {
  return (
    <button onClick={onClick} style={{
      appearance: 'none', cursor: 'pointer', textAlign: 'left',
      padding: 10,
      border: '2.5px solid var(--ink)', borderRadius: 12,
      background: 'var(--paper)', color: 'var(--ink)',
      boxShadow: '3px 3px 0 var(--ink)',
      display: 'flex', flexDirection: 'column', gap: 2,
    }}>
      <span style={{ fontSize: 22, marginBottom: 2 }}>{icon}</span>
      <span style={{
        fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 900,
        letterSpacing: '-0.01em',
      }}>{label}</span>
      <span style={{
        fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 700,
        opacity: 0.55, letterSpacing: '.06em',
      }}>{sub}</span>
    </button>
  );
}

function CrewMiniFeed({ onClick }) {
  const items = [
    { who: 'maya', t: 'is at', v: 'Westlight rooftop', m: 2,  c: 'var(--accent-1)' },
    { who: 'devon', t: 'just left', v: 'a karaoke spot', m: 8, c: 'var(--accent-3)' },
    { who: 'sam', t: 'planning', v: 'a sunday brunch',   m: 14, c: 'var(--accent-2)' },
  ];
  return (
    <div onClick={onClick} style={{ cursor: 'pointer' }}>
      {items.map((it, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', marginBottom: 8,
          border: '2px solid var(--ink)', borderRadius: 12,
          background: 'var(--paper)',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 999,
            border: '2px solid var(--ink)', background: it.c,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 14,
          }}>{it.who[0].toUpperCase()}</div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 700,
              color: 'var(--ink)', lineHeight: 1.2,
            }}>
              <strong>@{it.who}</strong> {it.t} <strong>{it.v}</strong>
            </div>
            <div style={{
              fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 700,
              opacity: 0.5, marginTop: 2, letterSpacing: '.08em',
            }}>{it.m}M AGO</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontFamily: 'var(--cf-mono)', fontSize: 11, fontWeight: 800,
      letterSpacing: '.16em', textTransform: 'uppercase',
      color: 'var(--ink)', opacity: 0.5,
      marginBottom: 10, marginTop: 4,
    }}>{children}</div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// 3. Chat — Conversational planner
// ═════════════════════════════════════════════════════════════════════
const CHAT_SCRIPT = [
  { from: 'bot', text: "hey, jess. i'm sparkle — confetti's planner (powered by claude). what are you up for?", chips: ['date night', 'family park day', 'cookout for 8', 'kids birthday', 'tourist day in NYC', 'crew of 6'] },
  { from: 'user', text: 'date night, brooklyn, $80 budget' },
  { from: 'bot', text: "got it. romantic, foodie, or weird-cool?", chips: ['romantic', 'foodie', 'weird-cool', 'all 3'] },
  { from: 'user', text: 'foodie w/ a twist' },
  { from: 'bot', text: "lovely. start with drinks somewhere unfussy, then a counter-seat tasting?", chips: ['yes', 'no — dinner first', 'add a show after'] },
  { from: 'user', text: 'add a show after' },
  { from: 'bot', text: "perfect. 3 stops, 4.5 hrs, ~$88. shall i print it?", chips: ['print it', 'tweak it', 'try again'] },
];

function ChatScreen({ onPlan, onBack }) {
  const [step, setStep] = useStateX(1);   // how many scripted messages shown
  const [typing, setTyping] = useStateX(false);
  const [input, setInput] = useStateX('');
  const [extra, setExtra] = useStateX([]); // free-text messages beyond script
  const scrollRef = useRefX(null);

  useEffectX(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [step, typing, extra]);

  const visible = [...CHAT_SCRIPT.slice(0, step), ...extra];
  const last = visible[visible.length - 1];

  useEffectX(() => {
    if (step >= CHAT_SCRIPT.length) return;
    const next = CHAT_SCRIPT[step];
    if (next.from === 'bot') {
      setTyping(true);
      const t = setTimeout(() => {
        setTyping(false);
        setStep(s => s + 1);
      }, 1100);
      return () => clearTimeout(t);
    }
  }, [step]);

  const handleChip = (chip) => {
    if (chip === 'print it') return onPlan('next');
    if (step < CHAT_SCRIPT.length && CHAT_SCRIPT[step].from === 'user') {
      setStep(s => s + 1);
    }
  };

  const sendInput = async () => {
    if (!input.trim() || typing) return;
    const userMsg = { from: 'user', text: input.trim() };
    setExtra(e => [...e, userMsg]);
    setInput('');
    setTyping(true);
    try {
      const history = [...CHAT_SCRIPT.slice(0, step), ...extra, userMsg]
        .map(m => `${m.from === 'user' ? 'User' : 'Sparkle'}: ${m.text}`).join('\n');
      const reply = await window.claude.complete({
        messages: [{
          role: 'user',
          content: `You are Sparkle, Confetti's planning agent (powered by Claude on the backend). You help plan nights out, family days, parties, BBQs, tourist days. You're warm, casual, lowercase, brief — under 30 words per reply. Ask ONE smart follow-up at a time. Once you have enough (vibe + location + size + budget), say "i can print this. ready?" and stop asking.

Conversation:
${history}

Respond as Sparkle. Just the message — no labels.`,
        }],
      });
      const text = (reply || '').trim();
      const wantsPrint = /ready\?|print this|i can print/i.test(text);
      setExtra(e => [...e, {
        from: 'bot', text,
        chips: wantsPrint ? ['print it', 'tweak it', 'one more thing'] : null,
      }]);
    } catch (e) {
      setExtra(e2 => [...e2, { from: 'bot', text: "lost the thread for a sec. say it again?" }]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <div className="cf-screen" style={{
      position: 'relative', height: '100%',
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      padding: '60px 0 0',
      overflow: 'hidden',
    }}>
      <DotsBg opacity={0.05} />

      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '0 22px 14px', borderBottom: '2.5px solid var(--ink)',
        background: 'var(--bg)',
      }}>
        <button onClick={onBack} style={{
          appearance: 'none', cursor: 'pointer',
          width: 32, height: 32, borderRadius: 999,
          border: '2.5px solid var(--ink)', background: 'var(--paper)',
          fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 14,
          color: 'var(--ink)',
        }}>←</button>
        <div style={{
          width: 38, height: 38, borderRadius: 999,
          border: '2.5px solid var(--ink)', background: 'var(--accent-1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 18,
          color: 'var(--ink)',
        }}>✣</div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 16,
            letterSpacing: '-0.02em', color: 'var(--ink)',
          }}>sparkle</div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
            letterSpacing: '.14em', opacity: 0.55,
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: 999, background: 'var(--accent-1)',
              animation: 'cf-pulse 1.2s infinite',
            }} />
            CLAUDE · ONLINE
          </div>
        </div>
        <button style={{
          appearance: 'none', cursor: 'pointer',
          width: 32, height: 32, borderRadius: 999,
          border: '2.5px solid var(--ink)', background: 'var(--paper)',
          fontFamily: 'var(--cf-ui)', fontSize: 14, fontWeight: 900,
        }}>⋯</button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{
        position: 'relative', zIndex: 2,
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        padding: '18px 22px 12px',
        display: 'flex', flexDirection: 'column', gap: 10,
        scrollbarWidth: 'none',
      }}>
        <div style={{
          alignSelf: 'center',
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
          opacity: 0.45, letterSpacing: '.14em',
          padding: '4px 10px', background: 'var(--paper)',
          border: '2px solid var(--ink)', borderRadius: 999,
        }}>SAT · 4:21 PM</div>

        {visible.map((m, i) => (
          <ChatBubble key={i} from={m.from} delay={i * 0.04}>{m.text}</ChatBubble>
        ))}
        {typing && (
          <div style={{
            alignSelf: 'flex-start',
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '12px 14px',
            border: '2.5px solid var(--ink)', borderRadius: '18px 18px 18px 6px',
            background: 'var(--paper)',
          }}>
            {[0, 1, 2].map(i => (
              <span key={i} style={{
                width: 6, height: 6, borderRadius: 999, background: 'var(--ink)',
                animation: `cf-typing 1.2s ${i * 0.15}s infinite`,
              }} />
            ))}
          </div>
        )}
      </div>

      {/* Quick-reply chips */}
      {!typing && last?.from === 'bot' && last?.chips && (
        <div style={{
          position: 'relative', zIndex: 2,
          padding: '10px 22px',
          display: 'flex', gap: 6, flexWrap: 'wrap',
          borderTop: '2px dashed rgba(0,0,0,0.18)',
          background: 'var(--bg)',
        }}>
          {last.chips.map(c => (
            <button key={c} onClick={() => handleChip(c)} style={{
              appearance: 'none', cursor: 'pointer',
              padding: '8px 14px',
              border: '2.5px solid var(--ink)', borderRadius: 999,
              background: c === 'print it' ? 'var(--accent-1)' : 'var(--paper)',
              fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 800,
              color: 'var(--ink)',
              boxShadow: c === 'print it' ? '3px 3px 0 var(--ink)' : 'none',
            }}>{c}</button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{
        position: 'relative', zIndex: 2,
        padding: '12px 16px 18px',
        display: 'flex', gap: 8, alignItems: 'center',
        background: 'var(--paper)',
        borderTop: '2.5px solid var(--ink)',
      }}>
        <button style={{
          appearance: 'none', cursor: 'pointer',
          width: 38, height: 38, borderRadius: 999,
          border: '2.5px solid var(--ink)', background: 'var(--bg)',
          fontSize: 18, fontWeight: 900,
        }}>+</button>
        <input value={input} onChange={e => setInput(e.target.value)}
               onKeyDown={e => e.key === 'Enter' && sendInput()}
               placeholder="say it your way…"
               style={{
                 flex: 1, padding: '10px 14px',
                 border: '2.5px solid var(--ink)', borderRadius: 999,
                 background: 'var(--bg)', outline: 'none',
                 fontFamily: 'var(--cf-ui)', fontSize: 14, fontWeight: 700,
                 color: 'var(--ink)',
               }} />
        <button onClick={sendInput} disabled={!input.trim() || typing} style={{
          appearance: 'none', cursor: input.trim() && !typing ? 'pointer' : 'not-allowed',
          width: 38, height: 38, borderRadius: 999,
          border: '2.5px solid var(--ink)',
          background: input.trim() && !typing ? 'var(--accent-1)' : 'var(--bg)',
          color: 'var(--ink)', fontSize: 16, fontWeight: 900,
          opacity: input.trim() && !typing ? 1 : 0.4,
        }}>↑</button>
      </div>
    </div>
  );
}

function ChatBubble({ from, children, delay = 0 }) {
  const isUser = from === 'user';
  return (
    <div style={{
      alignSelf: isUser ? 'flex-end' : 'flex-start',
      maxWidth: '78%',
      padding: '12px 16px',
      border: '2.5px solid var(--ink)',
      borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
      background: isUser ? 'var(--accent-1)' : 'var(--paper)',
      color: 'var(--ink)',
      fontFamily: 'var(--cf-ui)', fontSize: 14, fontWeight: 700,
      lineHeight: 1.35,
      boxShadow: '3px 3px 0 var(--ink)',
      animation: `cf-bubble 0.4s ${delay}s both`,
    }}>{children}</div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// 4. OnMyWay — between-stop transit
// ═════════════════════════════════════════════════════════════════════
function OnMyWayScreen({ fromStop, toStop, onArrived, onCancel }) {
  const [mode, setMode] = useStateX('walk');
  const [eta, setEta] = useStateX(8);
  const [progress, setProgress] = useStateX(0.32);

  useEffectX(() => {
    const t = setInterval(() => {
      setProgress(p => Math.min(1, p + 0.04));
      setEta(e => Math.max(0, e - 0.5));
    }, 1200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="cf-screen" style={{
      position: 'relative', height: '100%',
      background: 'var(--ink)', color: 'var(--paper)',
      display: 'flex', flexDirection: 'column',
      padding: '56px 22px 22px',
      overflow: 'hidden',
    }}>
      {/* Star bg */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.15,
        backgroundImage: `radial-gradient(var(--paper) 1px, transparent 1px)`,
        backgroundSize: '28px 28px',
      }} />

      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 20,
      }}>
        <button onClick={onCancel} style={{
          appearance: 'none', cursor: 'pointer', background: 'transparent',
          border: 'none', padding: 6, color: 'var(--paper)',
          fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 800,
          opacity: 0.7,
        }}>← back to stop</button>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 10px',
          border: '2px solid var(--paper)', borderRadius: 999,
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
          letterSpacing: '.14em',
        }}>
          <span style={{ width: 5, height: 5, borderRadius: 999,
                         background: 'var(--accent-1)',
                         animation: 'cf-pulse 1.2s infinite' }} />
          ON THE MOVE
        </span>
      </div>

      <div style={{ position: 'relative', zIndex: 2, flex: 1,
                    display: 'flex', flexDirection: 'column' }}>
        {/* Big ETA */}
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <div style={{
            fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
            letterSpacing: '.18em', opacity: 0.6,
          }}>ETA</div>
          <div style={{
            fontFamily: 'var(--cf-display)', fontWeight: 900,
            fontSize: 88, lineHeight: 0.9, letterSpacing: '-0.06em',
            marginTop: 4,
          }}>{Math.ceil(eta)}<span style={{
            fontSize: 32, letterSpacing: '-0.04em', opacity: 0.7,
          }}>min</span></div>
        </div>

        {/* Stylized map / route */}
        <div style={{
          position: 'relative',
          border: '3px solid var(--paper)', borderRadius: 18,
          background: 'rgba(255,250,240,0.04)',
          padding: 16, marginBottom: 14,
          overflow: 'hidden',
        }}>
          {/* grid bg */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.25,
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)`,
            backgroundSize: '22px 22px',
          }} />
          {/* path SVG */}
          <svg viewBox="0 0 300 110" style={{
            position: 'relative', width: '100%', height: 110, display: 'block',
          }}>
            <path d="M 20 80 Q 80 30, 150 55 T 280 30"
                  stroke="var(--paper)" strokeWidth="3" strokeDasharray="6 6"
                  fill="none" opacity="0.5"/>
            <path d="M 20 80 Q 80 30, 150 55 T 280 30"
                  stroke="var(--accent-1)" strokeWidth="3.5"
                  fill="none" strokeDasharray="900"
                  strokeDashoffset={900 - 900 * progress}
                  style={{ transition: 'stroke-dashoffset 1.2s linear' }}/>
            {/* From dot */}
            <circle cx="20" cy="80" r="8" fill="var(--accent-2)" stroke="var(--paper)" strokeWidth="3"/>
            {/* To dot */}
            <circle cx="280" cy="30" r="8" fill="var(--accent-3)" stroke="var(--paper)" strokeWidth="3"/>
            {/* You */}
            <g transform={`translate(${20 + (280 - 20) * progress},${80 - (80 - 30) * progress})`}>
              <circle r="11" fill="var(--accent-1)" stroke="var(--paper)" strokeWidth="3"/>
              <circle r="3.5" fill="var(--paper)"/>
            </g>
          </svg>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
            letterSpacing: '.12em', marginTop: 6, opacity: 0.7,
          }}>
            <span>{fromStop.name.toUpperCase()}</span>
            <span>↓ {toStop.name.toUpperCase()}</span>
          </div>
        </div>

        {/* Mode picker */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {[
            { id: 'walk',  icon: '👟', label: 'walk',  eta: '8m' },
            { id: 'bike',  icon: '🚲', label: 'bike',  eta: '4m' },
            { id: 'train', icon: '🚇', label: 'train', eta: '11m' },
            { id: 'car',   icon: '🚗', label: 'lyft',  eta: '6m · $8' },
          ].map(m => (
            <button key={m.id} onClick={() => setMode(m.id)} style={{
              appearance: 'none', cursor: 'pointer', flex: 1,
              padding: '10px 6px',
              border: '2.5px solid var(--paper)', borderRadius: 12,
              background: mode === m.id ? 'var(--paper)' : 'transparent',
              color: mode === m.id ? 'var(--ink)' : 'var(--paper)',
              fontFamily: 'var(--cf-ui)', fontWeight: 800, fontSize: 11,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              boxShadow: mode === m.id ? '3px 3px 0 var(--accent-1)' : 'none',
              transform: mode === m.id ? 'translate(-1px,-1px)' : 'none',
              transition: 'all .14s',
            }}>
              <span style={{ fontSize: 18 }}>{m.icon}</span>
              <span>{m.label}</span>
              <span style={{
                fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 700,
                opacity: 0.7,
              }}>{m.eta}</span>
            </button>
          ))}
        </div>

        {/* Crew status */}
        <div style={{
          padding: '10px 14px',
          border: '2px dashed rgba(255,250,240,0.4)', borderRadius: 12,
          fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 8,
          marginBottom: 12,
        }}>
          <div style={{ display: 'flex' }}>
            {['var(--accent-1)', 'var(--accent-2)'].map((c, i) => (
              <span key={i} style={{
                width: 22, height: 22, borderRadius: 999,
                border: '2px solid var(--ink)', background: c,
                marginLeft: i > 0 ? -8 : 0,
              }} />
            ))}
          </div>
          <span style={{ flex: 1, opacity: 0.85 }}>
            <strong>maya</strong> + <strong>devon</strong> are already there
          </span>
        </div>

        {/* I'm here button */}
        <button onClick={onArrived} style={{
          appearance: 'none', cursor: 'pointer', width: '100%',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          padding: '18px 22px',
          border: '3px solid var(--paper)', borderRadius: 16,
          background: 'var(--accent-1)', color: 'var(--ink)',
          fontFamily: 'var(--cf-ui)', fontSize: 17, fontWeight: 900,
          boxShadow: '5px 5px 0 var(--paper)',
          marginTop: 'auto',
        }}>
          i'm here
          {Icons.arrow}
        </button>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// 5. Push notification — iOS-style banner
// ═════════════════════════════════════════════════════════════════════
function PushNotification({ open, title, body, kind = 'check-in', onAccept, onDismiss }) {
  useEffectX(() => {
    if (!open) return;
    const t = setTimeout(() => onDismiss?.(), 8000);
    return () => clearTimeout(t);
  }, [open, onDismiss]);

  if (!open) return null;

  const accentMap = {
    'check-in':  'var(--accent-1)',
    'crew-ping': 'var(--accent-3)',
    'omw':       'var(--accent-2)',
  };

  return (
    <div style={{
      position: 'absolute', top: 56, left: 12, right: 12, zIndex: 70,
      animation: 'cf-push-in 0.45s cubic-bezier(.2,1.2,.4,1)',
    }}>
      <div style={{
        padding: 12, gap: 12, display: 'flex', alignItems: 'flex-start',
        background: 'rgba(20,15,15,0.92)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        border: '2px solid var(--paper)', borderRadius: 18,
        color: 'var(--paper)',
        boxShadow: '0 12px 30px rgba(0,0,0,0.4), 4px 4px 0 ' + accentMap[kind],
      }}>
        <div style={{
          width: 36, height: 36, flexShrink: 0,
          borderRadius: 8, background: accentMap[kind],
          border: '2px solid var(--paper)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 18,
          color: 'var(--ink)',
        }}>✣</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
            letterSpacing: '.16em', opacity: 0.75,
          }}>
            <span>CONFETTI</span>
            <span>now</span>
          </div>
          <div style={{
            fontFamily: 'var(--cf-ui)', fontSize: 14, fontWeight: 900,
            marginTop: 2, lineHeight: 1.2,
          }}>{title}</div>
          <div style={{
            fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 600,
            marginTop: 3, opacity: 0.85, lineHeight: 1.3,
          }}>{body}</div>
          {(onAccept || onDismiss) && (
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              {onAccept && (
                <button onClick={onAccept} style={{
                  appearance: 'none', cursor: 'pointer',
                  padding: '6px 12px',
                  border: '2px solid var(--paper)', borderRadius: 999,
                  background: accentMap[kind], color: 'var(--ink)',
                  fontFamily: 'var(--cf-ui)', fontSize: 11, fontWeight: 800,
                }}>
                  {kind === 'check-in' ? 'check in' : kind === 'omw' ? "i'm omw" : 'open'}
                </button>
              )}
              <button onClick={onDismiss} style={{
                appearance: 'none', cursor: 'pointer',
                padding: '6px 12px',
                border: '2px solid rgba(255,250,240,0.4)', borderRadius: 999,
                background: 'transparent', color: 'var(--paper)',
                fontFamily: 'var(--cf-ui)', fontSize: 11, fontWeight: 800,
                opacity: 0.7,
              }}>later</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  TabBar, ExplainerScreen, HubScreen, ChatScreen, OnMyWayScreen, PushNotification,
});
