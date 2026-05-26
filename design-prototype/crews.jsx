// crews.jsx — Crews tab + Night Together (collab plan)
// CrewsScreen — friends + groups list (proper destination for crew tab)
// NightTogetherScreen — multi-user plan creation with realtime votes

const { useState: useStateCr, useEffect: useEffectCr } = React;

// ─── Sample crew data ──────────────────────────────────────────
const MY_CREWS = [
  { id: 'c1', name: 'The 4',     n: 3, c: 'var(--accent-1)',
    last: '3d ago · Lupa night',
    members: ['maya', 'devon', 'sam'], live: 2 },
  { id: 'c2', name: 'Date · Sam', n: 1, c: 'var(--accent-3)',
    last: '11d · LES jazz',
    members: ['sam'], live: 0 },
  { id: 'c3', name: 'Sun brunch', n: 2, c: 'var(--accent-2)',
    last: '6d · Park Slope',
    members: ['rio', 'alex'], live: 0 },
  { id: 'c4', name: 'Bach · maya', n: 5, c: 'var(--accent-1)',
    last: 'planning Jun 14',
    members: ['maya', 'devon', 'rio', 'alex', 'sam'], live: 5,
    planning: true },
];

// ═════════════════════════════════════════════════════════════════
// 1. CrewsScreen — proper destination for the "crew" tab
// ═════════════════════════════════════════════════════════════════
function CrewsScreen({ onBack, onOpenNightTogether, onOpenCrew }) {
  return (
    <div className="cf-screen" style={{
      position: 'relative', height: '100%',
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      padding: '56px 22px 76px', overflow: 'hidden',
    }}>
      <DotsBg opacity={0.06} />
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
        <button style={{
          appearance: 'none', cursor: 'pointer',
          width: 36, height: 36, borderRadius: 999,
          border: '2.5px solid var(--ink)', background: 'var(--paper)',
          fontSize: 16, fontWeight: 900,
          boxShadow: '3px 3px 0 var(--ink)',
        }}>+</button>
      </div>

      <div style={{ position: 'relative', zIndex: 2, flex: 1,
                    overflowY: 'auto', scrollbarWidth: 'none',
                    marginRight: -22, paddingRight: 22 }}>
        <h2 style={{
          fontFamily: 'var(--cf-display)', fontWeight: 900,
          fontSize: 36, lineHeight: 0.95, letterSpacing: '-0.04em',
          margin: '0 0 4px',
        }}>Your crews.</h2>
        <p style={{
          fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 600,
          opacity: 0.65, margin: '0 0 16px',
        }}>Plan together. Vote on stops. Show up to the same place.</p>

        {/* Night together CTA */}
        <button onClick={onOpenNightTogether} style={{
          appearance: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
          padding: 14, marginBottom: 18,
          border: '3px solid var(--ink)', borderRadius: 16,
          background: 'var(--accent-1)', color: 'var(--ink)',
          boxShadow: '5px 5px 0 var(--ink)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{
            fontSize: 28, width: 50, height: 50, borderRadius: 12,
            background: 'var(--paper)', border: '2.5px solid var(--ink)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>👯</span>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
              letterSpacing: '.14em', opacity: 0.7,
            }}>COLLAB · LIVE</div>
            <div style={{
              fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 20,
              letterSpacing: '-0.025em', lineHeight: 1, marginTop: 2,
            }}>Start a Night Together</div>
            <div style={{
              fontFamily: 'var(--cf-ui)', fontSize: 11, fontWeight: 700,
              opacity: 0.75, marginTop: 3,
            }}>everyone votes on stops · pass prints when crew says yes</div>
          </div>
          <span style={{ fontSize: 20, fontWeight: 900 }}>›</span>
        </button>

        <SectionLabel>your crews · 4 active</SectionLabel>
        {MY_CREWS.map(c => (
          <button key={c.id} onClick={() => onOpenCrew?.(c)} style={{
            appearance: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
            display: 'flex', alignItems: 'center', gap: 12,
            padding: 12, marginBottom: 8,
            border: '2.5px solid var(--ink)', borderRadius: 14,
            background: c.planning ? 'var(--accent-2)' : 'var(--paper)',
            boxShadow: '4px 4px 0 var(--ink)',
          }}>
            <div style={{
              width: 50, height: 50, borderRadius: 12,
              border: '2.5px solid var(--ink)', background: c.c,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 18,
              color: 'var(--ink)', flexShrink: 0,
            }}>{c.name[0]}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{
                  fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 17,
                  letterSpacing: '-0.025em',
                }}>{c.name}</span>
                {c.live > 0 && (
                  <span style={{
                    padding: '2px 7px',
                    background: 'var(--accent-1)', color: 'var(--ink)',
                    border: '1.5px solid var(--ink)', borderRadius: 999,
                    fontFamily: 'var(--cf-mono)', fontSize: 8, fontWeight: 800,
                    letterSpacing: '.1em', display: 'inline-flex',
                    alignItems: 'center', gap: 4,
                  }}>
                    <span style={{
                      width: 5, height: 5, borderRadius: 999, background: 'var(--ink)',
                      animation: 'cf-pulse 1.2s infinite',
                    }} />
                    {c.live} LIVE
                  </span>
                )}
                {c.planning && (
                  <span style={{
                    padding: '2px 7px',
                    background: 'var(--ink)', color: 'var(--paper)',
                    borderRadius: 999,
                    fontFamily: 'var(--cf-mono)', fontSize: 8, fontWeight: 800,
                    letterSpacing: '.1em',
                  }}>PLANNING</span>
                )}
              </div>
              <div style={{
                fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
                opacity: 0.6, marginTop: 3, letterSpacing: '.06em',
                textTransform: 'uppercase',
              }}>{c.n + 1} PPL · {c.last}</div>
              <div style={{ display: 'flex', marginTop: 6 }}>
                {c.members.slice(0, 4).map((m, i) => (
                  <span key={m} style={{
                    width: 22, height: 22, borderRadius: 999,
                    border: '2px solid var(--ink)',
                    background: ['var(--accent-1)', 'var(--accent-2)', 'var(--accent-3)', 'var(--accent-4)'][i % 4],
                    marginLeft: i > 0 ? -6 : 0,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 9,
                    color: 'var(--ink)',
                  }}>{m[0].toUpperCase()}</span>
                ))}
              </div>
            </div>
            <span style={{ fontSize: 18, fontWeight: 900, opacity: 0.55 }}>›</span>
          </button>
        ))}

        <SectionLabel>friends · 14 on confetti</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { who: 'maya', c: 'var(--accent-1)', status: '@Westlight · live' },
            { who: 'devon', c: 'var(--accent-3)', status: 'on the L train' },
            { who: 'sam', c: 'var(--accent-2)', status: '@Lupa Notte' },
            { who: 'rio', c: 'var(--accent-1)', status: 'planning sun' },
          ].map(f => (
            <div key={f.who} style={{
              padding: 10,
              border: '2px solid var(--ink)', borderRadius: 12,
              background: 'var(--paper)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{
                width: 32, height: 32, borderRadius: 999,
                border: '2px solid var(--ink)', background: f.c,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 12,
                color: f.c === 'var(--accent-3)' ? 'var(--paper)' : 'var(--ink)',
              }}>{f.who[0].toUpperCase()}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 800,
                }}>@{f.who}</div>
                <div style={{
                  fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 700,
                  opacity: 0.55, marginTop: 1,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{f.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// 2. NightTogetherScreen — collaborative plan w/ votes
// ═════════════════════════════════════════════════════════════════
function NightTogetherScreen({ onBack, onPrint }) {
  const [phase, setPhase] = useStateCr('setup'); // setup | voting | ready
  const [invited, setInvited] = useStateCr(['maya', 'devon']);
  const [vibes, setVibes] = useStateCr(['foodie', 'walkable']);

  if (phase === 'voting') return <VotingPhase onPrint={onPrint} onBack={() => setPhase('setup')} />;

  return (
    <div className="cf-screen" style={{
      position: 'relative', height: '100%',
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      padding: '56px 22px 22px', overflow: 'hidden',
    }}>
      <DotsBg opacity={0.06} />

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
        <Stamp color="var(--accent-1)" rotate={-2}>night together</Stamp>
        <span style={{ width: 36 }} />
      </div>

      <div style={{ position: 'relative', zIndex: 2, flex: 1,
                    overflowY: 'auto', scrollbarWidth: 'none' }}>
        <h2 style={{
          fontFamily: 'var(--cf-display)', fontWeight: 900,
          fontSize: 32, lineHeight: 0.95, letterSpacing: '-0.04em',
          margin: '0 0 6px',
        }}>Plan it together.</h2>
        <p style={{
          fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 700,
          opacity: 0.65, margin: '0 0 18px',
        }}>Invite your crew. Sparkle drafts 3 stops. Everyone votes. Pass prints when 60% say yes.</p>

        {/* Who's in */}
        <SectionLabel>1 · who's in</SectionLabel>
        <div style={{
          padding: 12, marginBottom: 18,
          border: '2.5px solid var(--ink)', borderRadius: 14,
          background: 'var(--paper)', boxShadow: '3px 3px 0 var(--ink)',
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            <CrewChip name="me · jess" me />
            {invited.map(n => <CrewChip key={n} name={n}
              onRemove={() => setInvited(invited.filter(x => x !== n))} />)}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button style={{
              appearance: 'none', cursor: 'pointer', flex: 1,
              padding: '8px 10px',
              border: '2px dashed var(--ink)', borderRadius: 10,
              background: 'transparent',
              fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 800,
            }}>＋ from contacts</button>
            <button style={{
              appearance: 'none', cursor: 'pointer', flex: 1,
              padding: '8px 10px',
              border: '2px dashed var(--ink)', borderRadius: 10,
              background: 'transparent',
              fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 800,
            }}>🔗 share invite link</button>
          </div>
        </div>

        {/* Shared vibes */}
        <SectionLabel>2 · what we're up for</SectionLabel>
        <div style={{
          padding: 12, marginBottom: 18,
          border: '2.5px solid var(--ink)', borderRadius: 14,
          background: 'var(--paper)', boxShadow: '3px 3px 0 var(--ink)',
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {['foodie', 'walkable', 'chill', 'hype', 'cheap', 'date-friendly', 'late'].map(v => {
              const on = vibes.includes(v);
              return (
                <button key={v} onClick={() => setVibes(on ? vibes.filter(x => x !== v) : [...vibes, v])}
                  style={{
                    appearance: 'none', cursor: 'pointer',
                    padding: '6px 12px',
                    border: '2px solid var(--ink)', borderRadius: 999,
                    background: on ? 'var(--accent-1)' : 'var(--paper)',
                    fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 800,
                    boxShadow: on ? '2px 2px 0 var(--ink)' : 'none',
                  }}>{v}</button>
              );
            })}
          </div>
          <div style={{
            marginTop: 10, padding: '8px 10px',
            background: 'var(--bg)', borderRadius: 8,
            fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
            opacity: 0.65, lineHeight: 1.4, letterSpacing: '.04em',
          }}>
            ✣ sparkle will blend everyone's taste graphs · maya's foodie + devon's hype + yours
          </div>
        </div>

        {/* Rules */}
        <SectionLabel>3 · how to decide</SectionLabel>
        <div style={{
          padding: 12, marginBottom: 18,
          border: '2.5px solid var(--ink)', borderRadius: 14,
          background: 'var(--paper)', boxShadow: '3px 3px 0 var(--ink)',
        }}>
          <RuleRow icon="✓" k="vote rule" v="majority · 60% must say yes" />
          <RuleRow icon="⏱" k="vote window" v="closes in 30 min" />
          <RuleRow icon="💸" k="budget cap" v="$45/pp · pool $135" />
          <RuleRow icon="📍" k="meet" v="midpoint between everyone" last />
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 2, paddingTop: 14 }}>
        <ChunkyButton variant="accent" onClick={() => setPhase('voting')} icon={Icons.arrow}>
          send to crew · start voting
        </ChunkyButton>
      </div>
    </div>
  );
}

function CrewChip({ name, me, onRemove }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 10px',
      border: '2px solid var(--ink)', borderRadius: 999,
      background: me ? 'var(--ink)' : 'var(--accent-2)',
      color: me ? 'var(--paper)' : 'var(--ink)',
      fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 800,
    }}>
      <span style={{
        width: 18, height: 18, borderRadius: 999,
        background: me ? 'var(--accent-1)' : 'var(--paper)',
        color: 'var(--ink)',
        border: '1.5px solid currentColor',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 9,
      }}>{name[0].toUpperCase()}</span>
      {name}
      {onRemove && (
        <button onClick={onRemove} style={{
          appearance: 'none', cursor: 'pointer',
          background: 'transparent', border: 'none', padding: 0,
          marginLeft: 2, fontSize: 11, fontWeight: 900, opacity: 0.6,
        }}>✕</button>
      )}
    </span>
  );
}

function RuleRow({ icon, k, v, last }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 0',
      borderBottom: last ? 'none' : '1px dashed rgba(0,0,0,0.15)',
    }}>
      <span style={{ width: 22, fontSize: 14 }}>{icon}</span>
      <span style={{
        fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
        letterSpacing: '.12em', opacity: 0.55, textTransform: 'uppercase',
        width: 90,
      }}>{k}</span>
      <span style={{
        fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 800, flex: 1,
      }}>{v}</span>
      <button style={{
        appearance: 'none', cursor: 'pointer',
        background: 'transparent', border: 'none', padding: 0,
        fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
        opacity: 0.55, textDecoration: 'underline',
      }}>edit</button>
    </div>
  );
}

// ─── Voting phase ─────────────────────────────────────────────
function VotingPhase({ onPrint, onBack }) {
  const [votes, setVotes] = useStateCr({
    A: { maya: 'yes', devon: 'pending', sam: 'yes', me: 'yes' },
    B: { maya: 'no', devon: 'yes', sam: 'pending', me: 'pending' },
    C: { maya: 'pending', devon: 'no', sam: 'no', me: 'pending' },
  });
  const opts = [
    { id: 'A', n: 'Brewery + tacos', stops: 'Threes · Oxomoco · Quartz', cost: '$42/pp' },
    { id: 'B', n: 'Pasta + jazz', stops: 'Lupa · Eavesdrop', cost: '$48/pp' },
    { id: 'C', n: 'Rooftop crawl', stops: 'Westlight · Loosie · Brooklyn Brewery', cost: '$55/pp' },
  ];
  const myVote = (id, v) => setVotes({
    ...votes, [id]: { ...votes[id], me: v },
  });
  const tally = (id) => Object.values(votes[id]).filter(v => v === 'yes').length;
  const winning = opts.reduce((w, o) => tally(o.id) > tally(w.id) ? o : w, opts[0]);

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
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 12px',
          background: 'var(--accent-1)', color: 'var(--ink)',
          border: '2px solid var(--ink)', borderRadius: 999,
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
          letterSpacing: '.14em',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: 999, background: 'var(--ink)',
            animation: 'cf-pulse 1.2s infinite',
          }} />
          VOTING · 22m LEFT
        </span>
        <span style={{ width: 36 }} />
      </div>

      <h2 style={{
        position: 'relative', zIndex: 2,
        fontFamily: 'var(--cf-display)', fontWeight: 900,
        fontSize: 28, lineHeight: 0.95, letterSpacing: '-0.04em',
        margin: '0 0 4px',
      }}>3 drafts · vote any.</h2>
      <p style={{
        position: 'relative', zIndex: 2,
        fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
        opacity: 0.55, letterSpacing: '.12em', textTransform: 'uppercase',
        margin: '0 0 14px',
      }}>SPARKLE BLENDED 4 TASTE GRAPHS · CLAUDE</p>

      <div style={{ position: 'relative', zIndex: 2, flex: 1,
                    overflowY: 'auto', scrollbarWidth: 'none' }}>
        {opts.map(o => {
          const yesN = tally(o.id);
          const isWin = o.id === winning.id && yesN >= 3;
          return (
            <div key={o.id} style={{
              padding: 14, marginBottom: 10,
              border: '2.5px solid var(--ink)', borderRadius: 14,
              background: isWin ? 'var(--accent-1)' : 'var(--paper)',
              boxShadow: '4px 4px 0 var(--ink)',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 4,
              }}>
                <div style={{
                  fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
                  letterSpacing: '.14em', opacity: 0.6,
                }}>OPTION {o.id} · {o.cost}</div>
                {isWin && <span style={{
                  padding: '2px 8px', background: 'var(--ink)', color: 'var(--paper)',
                  border: '1.5px solid var(--ink)', borderRadius: 999,
                  fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
                  letterSpacing: '.14em',
                }}>LEADING</span>}
              </div>
              <div style={{
                fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 18,
                letterSpacing: '-0.025em', lineHeight: 1.05,
              }}>{o.n}</div>
              <div style={{
                fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 700,
                opacity: 0.7, marginTop: 4,
              }}>{o.stops}</div>

              {/* Vote tally */}
              <div style={{ display: 'flex', gap: 5, marginTop: 10 }}>
                {['maya', 'devon', 'sam', 'me'].map(p => {
                  const v = votes[o.id][p];
                  return (
                    <span key={p} style={{
                      flex: 1, padding: '5px 6px', textAlign: 'center',
                      background: v === 'yes' ? 'var(--accent-4)' :
                                  v === 'no' ? '#d32323' : 'var(--bg)',
                      color: v === 'pending' ? 'var(--ink)' : 'var(--paper)',
                      border: '1.5px solid var(--ink)', borderRadius: 6,
                      fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
                      letterSpacing: '.06em',
                    }}>
                      {p === 'me' ? 'YOU' : p.toUpperCase()}
                      <br/>
                      {v === 'yes' ? '✓' : v === 'no' ? '✕' : '—'}
                    </span>
                  );
                })}
              </div>

              {/* Your vote buttons */}
              {votes[o.id].me === 'pending' && (
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  <button onClick={() => myVote(o.id, 'yes')} style={{
                    appearance: 'none', cursor: 'pointer', flex: 1,
                    padding: '8px 10px',
                    border: '2px solid var(--ink)', borderRadius: 10,
                    background: 'var(--accent-4)', color: 'var(--paper)',
                    fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 900,
                  }}>✓ yes</button>
                  <button onClick={() => myVote(o.id, 'no')} style={{
                    appearance: 'none', cursor: 'pointer', flex: 1,
                    padding: '8px 10px',
                    border: '2px solid var(--ink)', borderRadius: 10,
                    background: 'var(--paper)', color: 'var(--ink)',
                    fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 900,
                  }}>✕ no</button>
                </div>
              )}
            </div>
          );
        })}

        <div style={{
          padding: '10px 12px', marginBottom: 12,
          background: 'var(--ink)', color: 'var(--paper)',
          border: '2px solid var(--ink)', borderRadius: 10,
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
          letterSpacing: '.06em', lineHeight: 1.5,
        }}>
          ✣ once 60% say yes to any option, sparkle prints the pass. push notifs go out auto.
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 2, paddingTop: 12 }}>
        <ChunkyButton variant="accent" onClick={onPrint} icon={Icons.arrow}>
          force-print leading option
        </ChunkyButton>
      </div>
    </div>
  );
}

Object.assign(window, { CrewsScreen, NightTogetherScreen, MY_CREWS });
