// taste.jsx — TikTok → Claude taste-graph layer
// TasteProfileScreen + connect modal + "what changed this week" deltas

const { useState: useStateTs, useEffect: useEffectTs } = React;

// ─── Sample taste profile (would be derived from TikTok saves) ──
const TASTE_PROFILE = {
  source: { saves: 247, likes: 1182, follows: 38, lastSync: '6 min ago' },
  vibeWeights: [
    { k: 'foodie',     v: 0.91, delta: '+0.04' },
    { k: 'rooftop',    v: 0.82, delta: '+0.11' },
    { k: 'jazz',       v: 0.78, delta: '+0.22 ↑' },
    { k: 'romantic',   v: 0.71, delta: '+0.02' },
    { k: 'low-key',    v: 0.68, delta: '+0.05' },
    { k: 'small plates', v: 0.62, delta: '+0.18 ↑' },
    { k: 'walkable',   v: 0.59, delta: '0' },
    { k: 'live music', v: 0.41, delta: '+0.06' },
    { k: 'hype',       v: 0.18, delta: '-0.04' },
    { k: 'sports bar', v: 0.04, delta: '0' },
  ],
  inferred: [
    { from: '@darkroom · 6 saves', to: 'speakeasy / dim-lit bars' },
    { from: '@bk.eats · 14 saves', to: 'BK foodie cluster' },
    { from: '#sundayjazz · 9 likes', to: 'sunday jazz brunch' },
    { from: '@no.phones.allowed · follow', to: 'phones-off rooms' },
  ],
  watchOuts: ['loud bachelorette spots', '#spons content', 'lines > 30 min'],
  vetoed: ['hibachi · "fun but not me"'],
  socialRadius: { cluster: 'BK foodie · 28 overlapping follows',
    topOverlap: [
      { who: '@maya.brooklyn', overlap: 0.74 },
      { who: '@bk.eats',       overlap: 0.62 },
      { who: '@dim_lit_only',  overlap: 0.51 },
    ] },
  confidence: 0.84,
  weeklyDelta: "You've been saving more jazz + small-plates clips. We're routing more of those into your nights.",
};

// ═════════════════════════════════════════════════════════════════
// TasteProfileScreen
// ═════════════════════════════════════════════════════════════════
function TasteProfileScreen({ onBack }) {
  const [tab, setTab] = useStateTs('vibes');
  const t = TASTE_PROFILE;
  return (
    <div className="cf-screen" style={{
      position: 'relative', height: '100%',
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      padding: '56px 22px 24px', overflow: 'hidden',
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
        <Stamp color="var(--accent-1)" rotate={-2}>your taste · derived</Stamp>
        <span style={{ width: 36 }} />
      </div>

      <div style={{ position: 'relative', zIndex: 2, flex: 1,
                    overflowY: 'auto', scrollbarWidth: 'none',
                    marginRight: -22, paddingRight: 22 }}>
        {/* Header */}
        <h2 style={{
          fontFamily: 'var(--cf-display)', fontWeight: 900,
          fontSize: 32, lineHeight: 0.95, letterSpacing: '-0.04em',
          margin: '0 0 4px',
        }}>Your real taste,<br/>read by Sparkle.</h2>
        <div style={{
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
          letterSpacing: '.14em', opacity: 0.55, textTransform: 'uppercase',
          marginBottom: 14,
        }}>FROM {t.source.saves} SAVES · {t.source.likes.toLocaleString()} LIKES ·
           {' '}{t.source.follows} FOLLOWS · SYNCED {t.source.lastSync.toUpperCase()}</div>

        {/* This-week delta callout */}
        <div style={{
          padding: 14, marginBottom: 16,
          border: '3px solid var(--ink)', borderRadius: 14,
          background: 'var(--accent-1)',
          boxShadow: '5px 5px 0 var(--ink)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
            letterSpacing: '.14em', opacity: 0.7, marginBottom: 4,
            textTransform: 'uppercase',
          }}><span>✣</span> CHANGED THIS WEEK</div>
          <div style={{
            fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 17,
            letterSpacing: '-0.025em', lineHeight: 1.25,
          }}>{t.weeklyDelta}</div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 14,
          overflowX: 'auto', scrollbarWidth: 'none',
          marginRight: -22, paddingRight: 22,
        }}>
          {[
            { id: 'vibes', l: 'vibes' },
            { id: 'inferred', l: 'inferences' },
            { id: 'crew', l: 'social radius' },
            { id: 'vetoes', l: 'vetoes' },
            { id: 'sources', l: 'sources' },
          ].map(x => (
            <button key={x.id} onClick={() => setTab(x.id)} style={{
              appearance: 'none', cursor: 'pointer', flexShrink: 0,
              padding: '7px 12px',
              border: '2.5px solid var(--ink)', borderRadius: 999,
              background: tab === x.id ? 'var(--ink)' : 'var(--paper)',
              color: tab === x.id ? 'var(--paper)' : 'var(--ink)',
              fontFamily: 'var(--cf-ui)', fontSize: 11, fontWeight: 800,
            }}>{x.l}</button>
          ))}
        </div>

        {tab === 'vibes' && (
          <div>
            {t.vibeWeights.map((v, i) => (
              <div key={v.k} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 0',
                borderBottom: i < t.vibeWeights.length - 1 ? '1px dashed rgba(0,0,0,0.15)' : 'none',
              }}>
                <span style={{
                  fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 800,
                  width: 110,
                }}>{v.k}</span>
                <div style={{
                  flex: 1, height: 12,
                  border: '2px solid var(--ink)', borderRadius: 999,
                  background: 'var(--paper)', overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', width: `${v.v * 100}%`,
                    background: v.v > 0.6 ? 'var(--accent-1)' :
                                v.v > 0.3 ? 'var(--accent-2)' : 'var(--accent-3)',
                  }} />
                </div>
                <span style={{
                  fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
                  width: 28, textAlign: 'right',
                }}>{Math.round(v.v * 100)}</span>
                <span style={{
                  fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 700,
                  opacity: v.delta === '0' ? 0.4 : 0.85,
                  color: v.delta.includes('↑') ? 'var(--accent-1)' :
                         v.delta.startsWith('-') ? 'var(--accent-3)' : 'var(--ink)',
                  width: 50, textAlign: 'right',
                }}>{v.delta}</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'inferred' && (
          <div>
            <div style={{
              fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
              letterSpacing: '.14em', opacity: 0.55, textTransform: 'uppercase',
              marginBottom: 10,
            }}>SIGNALS → INFERENCES</div>
            {t.inferred.map((row, i) => (
              <div key={i} style={{
                padding: '12px 14px', marginBottom: 8,
                border: '2px solid var(--ink)', borderRadius: 12,
                background: 'var(--paper)',
              }}>
                <div style={{
                  fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
                  opacity: 0.55, letterSpacing: '.06em',
                }}>{row.from}</div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6, marginTop: 4,
                  fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 16,
                  letterSpacing: '-0.02em',
                }}>
                  <span style={{ color: 'var(--accent-1)', fontSize: 12 }}>→</span>
                  {row.to}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'crew' && (
          <div>
            <div style={{
              padding: 14, marginBottom: 14,
              border: '2.5px solid var(--ink)', borderRadius: 14,
              background: 'var(--accent-2)',
              boxShadow: '3px 3px 0 var(--ink)',
            }}>
              <div style={{
                fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
                letterSpacing: '.14em', opacity: 0.7, textTransform: 'uppercase',
              }}>YOUR TIKTOK CLUSTER</div>
              <div style={{
                fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 18,
                letterSpacing: '-0.025em', marginTop: 4, lineHeight: 1.1,
              }}>{t.socialRadius.cluster}</div>
            </div>
            <div style={{
              fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
              letterSpacing: '.14em', opacity: 0.55, textTransform: 'uppercase',
              marginBottom: 8,
            }}>HIGHEST OVERLAP</div>
            {t.socialRadius.topOverlap.map((p, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', marginBottom: 8,
                border: '2px solid var(--ink)', borderRadius: 12,
                background: 'var(--paper)',
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 999,
                  border: '2.5px solid var(--ink)',
                  background: ['var(--accent-1)', 'var(--accent-2)', 'var(--accent-3)'][i],
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 13,
                  color: i === 2 ? 'var(--paper)' : 'var(--ink)',
                }}>{p.who[1].toUpperCase()}</div>
                <div style={{
                  fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 800,
                  flex: 1,
                }}>{p.who}</div>
                <span style={{
                  fontFamily: 'var(--cf-mono)', fontSize: 11, fontWeight: 800,
                  padding: '3px 8px',
                  background: 'var(--accent-1)',
                  border: '1.5px solid var(--ink)', borderRadius: 4,
                  letterSpacing: '.04em',
                }}>{Math.round(p.overlap * 100)}% MATCH</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'vetoes' && (
          <div>
            <div style={{
              fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
              letterSpacing: '.14em', opacity: 0.55, textTransform: 'uppercase',
              marginBottom: 10,
            }}>I SAVE THESE BUT DON'T GO</div>
            {t.vetoed.map(v => (
              <div key={v} style={{
                padding: '12px 14px', marginBottom: 8,
                border: '2px solid var(--ink)', borderRadius: 12,
                background: 'var(--paper)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{
                  fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 700,
                }}>{v}</span>
                <button style={{
                  appearance: 'none', cursor: 'pointer',
                  padding: '4px 10px',
                  border: '1.5px solid var(--ink)', borderRadius: 999,
                  background: 'var(--bg)',
                  fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
                  letterSpacing: '.08em',
                }}>VETOED</button>
              </div>
            ))}
            <div style={{
              fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
              letterSpacing: '.14em', opacity: 0.55, textTransform: 'uppercase',
              marginTop: 16, marginBottom: 10,
            }}>WATCH OUTS</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {t.watchOuts.map(w => (
                <span key={w} style={{
                  padding: '6px 12px',
                  border: '2px solid var(--ink)', borderRadius: 999,
                  background: '#d32323', color: 'var(--paper)',
                  fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
                  letterSpacing: '.06em',
                }}>✕ {w}</span>
              ))}
            </div>
          </div>
        )}

        {tab === 'sources' && (
          <div>
            <div style={{
              padding: 14, marginBottom: 12,
              border: '2.5px solid var(--ink)', borderRadius: 14,
              background: 'var(--ink)', color: 'var(--paper)',
            }}>
              <div style={{
                fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
                letterSpacing: '.14em', opacity: 0.7,
              }}>CONFIDENCE</div>
              <div style={{
                fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 36,
                letterSpacing: '-0.035em', marginTop: 4,
              }}>{Math.round(t.confidence * 100)}%</div>
              <div style={{
                fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 700,
                opacity: 0.8, marginTop: 4, lineHeight: 1.4,
              }}>Plenty of signal. Plans will lean confidently on this profile.</div>
            </div>

            <div style={{
              fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
              letterSpacing: '.14em', opacity: 0.55, textTransform: 'uppercase',
              marginBottom: 10,
            }}>CONNECTED SOURCES</div>

            <SourceRow icon="📺" name="TikTok" sub={`${t.source.saves} saves · ${t.source.likes} likes`} on />
            <SourceRow icon="📷" name="Instagram" sub="184 saved posts · 22 collections" on />
            <SourceRow icon="♫" name="Spotify" sub="weekly mood playlists" on />
            <SourceRow icon="✣" name="Confetti history" sub="18 passes · 52 check-ins" on />
            <SourceRow icon="📍" name="Google Maps · saved places" sub="not connected" />

            <button style={{
              appearance: 'none', cursor: 'pointer', width: '100%',
              padding: '12px 14px', marginTop: 14,
              border: '2.5px solid #d32323', borderRadius: 12,
              background: 'var(--paper)', color: '#d32323',
              fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 900,
            }}>⤓ export · 🗑 delete my taste graph</button>
          </div>
        )}
      </div>
    </div>
  );
}

function SourceRow({ icon, name, sub, on }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '11px 14px', marginBottom: 8,
      border: '2px solid var(--ink)', borderRadius: 12,
      background: 'var(--paper)',
      opacity: on ? 1 : 0.55,
    }}>
      <span style={{
        width: 32, height: 32, borderRadius: 8,
        border: '2px solid var(--ink)', background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16,
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
        padding: '3px 9px',
        background: on ? 'var(--accent-4)' : 'var(--bg)',
        color: on ? 'var(--paper)' : 'var(--ink)',
        border: '2px solid var(--ink)', borderRadius: 999,
        fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
        letterSpacing: '.1em', textTransform: 'uppercase',
      }}>{on ? 'reading' : 'connect'}</span>
    </div>
  );
}

Object.assign(window, { TASTE_PROFILE, TasteProfileScreen });
