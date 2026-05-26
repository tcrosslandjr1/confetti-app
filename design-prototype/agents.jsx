// agents.jsx — Claude-as-conductor + specialist agents
// The user just says the vibe. Claude routes intent to the right specialist,
// each does its job, and the ticket prints.

const { useState: useStateAg, useEffect: useEffectAg, useRef: useRefAg } = React;

// ─── Specialist agents ──────────────────────────────────────────
const AGENT_SPECIALISTS = [
  { id: 'night',  label: 'Night Out',  icon: '🌃',
    blurb: 'restaurants, bars, rooftops, reservations',
    keywords: ['night', 'bar', 'rooftop', 'date', 'dinner', 'drinks', 'cocktail',
      'restaurant', 'happy hour', 'show', 'concert'] },
  { id: 'family', label: 'Family',     icon: '👨‍👩‍👧',
    blurb: 'parks, museums, libraries, kid-friendly outings',
    keywords: ['family', 'kid', 'kids', 'park', 'museum', 'library', 'stroller',
      'toddler', 'play', 'nap'] },
  { id: 'party',  label: 'Party',      icon: '🎂',
    blurb: 'birthdays, jump places, themes, RSVP',
    keywords: ['birthday', 'party', 'jump', 'bounce', 'bash', 'bach', 'rsvp', 'theme'] },
  { id: 'host',   label: 'Hosting',    icon: '🍽',
    blurb: 'BBQ, crabs, dinner parties, grocery lists',
    keywords: ['host', 'hosting', 'bbq', 'cookout', 'crab', 'dinner party',
      'wine night', 'game night', 'home', 'grocery', 'backyard'] },
  { id: 'social', label: 'Social',     icon: '💬',
    blurb: 'captions, hashtags, recap posts',
    keywords: ['caption', 'post', 'tiktok', 'instagram', 'recap', 'reel',
      'hashtag', 'share'] },
  { id: 'route',  label: 'Route',      icon: '🗺',
    blurb: 'walk · transit · rideshare · parking',
    keywords: ['walk', 'lyft', 'uber', 'route', 'transit', 'parking', 'train',
      'subway', 'drive'] },
  { id: 'budget', label: 'Budget',     icon: '💸',
    blurb: 'total cost, per-person, deposits, savings',
    keywords: ['budget', 'cheap', 'under', 'cost', 'split', 'deposit', 'free'] },
];

// ─── Status lines per specialist (used in the printing loader) ───
const AGENT_STATUS = {
  night:  [
    "Reading the vibe...",
    "Checking what's open near you...",
    "Filtering by your past 18 nights...",
    "Booking holds on stops 1 + 3...",
  ],
  family: [
    "Reading kid ages + nap window...",
    "Checking stroller-friendly venues...",
    "Pulling library story-time today...",
    "Building pack list + parent checklist...",
  ],
  party: [
    "Reading group size + age range...",
    "Comparing 12 party venues...",
    "Drafting RSVP + invite copy...",
    "Building supply list + budget...",
  ],
  host: [
    "Reading guest count + dietary needs...",
    "Building grocery list...",
    "Setting prep timeline (T-6h to door)...",
    "Drafting menu + playlist...",
  ],
  social: [
    "Reading the night's vibe...",
    "Drafting 3 captions + hashtags...",
    "Cutting 9-sec recap reel...",
    "Holding for your review...",
  ],
  route: [
    "Pulling walk/transit/rideshare times...",
    "Cross-checking parking availability...",
    "Rerouting around the L closure...",
    "Setting check-in geofences...",
  ],
  budget: [
    "Estimating per-stop spend...",
    "Splitting across crew...",
    "Surfacing 2 cheaper alternatives...",
    "Locking the cap at your limit...",
  ],
};

// ─── routeIntent — keyword-based router (Claude would do this for real) ───
function routeIntent(text = '') {
  const t = text.toLowerCase();
  let best = { id: 'night', score: 0 };
  AGENT_SPECIALISTS.forEach(a => {
    const score = a.keywords.reduce((n, k) => n + (t.includes(k) ? 1 : 0), 0);
    if (score > best.score) best = { id: a.id, score };
  });
  return AGENT_SPECIALISTS.find(a => a.id === best.id);
}

// ═════════════════════════════════════════════════════════════════
// 1. AgentRouter — small visible badge in the loader / chat
// ═════════════════════════════════════════════════════════════════
function AgentRouter({ leader, active, compact }) {
  if (compact) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '3px 8px',
        background: 'var(--accent-1)', color: 'var(--ink)',
        border: '2px solid var(--ink)', borderRadius: 999,
        fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
        letterSpacing: '.1em', textTransform: 'uppercase',
      }}>
        <span style={{ fontSize: 11 }}>{leader.icon}</span>
        {leader.label}
      </span>
    );
  }
  return (
    <div style={{
      padding: 10,
      border: '2.5px solid var(--ink)', borderRadius: 12,
      background: 'var(--paper)',
      boxShadow: '3px 3px 0 var(--ink)',
      display: 'flex', alignItems: 'center', gap: 10, color: 'var(--ink)',
    }}>
      <span style={{
        width: 36, height: 36, borderRadius: 8,
        border: '2px solid var(--ink)', background: 'var(--accent-1)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, flexShrink: 0,
      }}>{leader.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
          letterSpacing: '.14em', opacity: 0.55, textTransform: 'uppercase',
        }}>
          <span style={{ color: 'var(--accent-1)' }}>✣</span>
          CLAUDE ROUTED TO
        </div>
        <div style={{
          fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 16,
          letterSpacing: '-0.025em', marginTop: 1,
        }}>Sparkle → {leader.label} Agent</div>
      </div>
      {/* Active specialists pinging */}
      <div style={{ display: 'flex', gap: 3 }}>
        {active.map((a, i) => (
          <span key={a.id} title={a.label}
            style={{
              width: 8, height: 8, borderRadius: 999,
              background: 'var(--accent-1)',
              animation: `cf-pulse 1.2s ${i * 0.2}s infinite`,
            }} />
        ))}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// 2. AgentTrace — expandable "show the math" trace
// ═════════════════════════════════════════════════════════════════
function AgentTrace({ leader, intent }) {
  const [open, setOpen] = useStateAg(false);
  const supporting = AGENT_SPECIALISTS.filter(a => a.id !== leader.id).slice(0, 3);

  return (
    <div style={{
      padding: 12,
      border: '2px dashed var(--ink)', borderRadius: 12,
      background: 'var(--paper)',
    }}>
      <button onClick={() => setOpen(!open)} style={{
        appearance: 'none', cursor: 'pointer', width: '100%',
        background: 'transparent', border: 'none', padding: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        textAlign: 'left',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
          letterSpacing: '.14em', opacity: 0.7, textTransform: 'uppercase',
          color: 'var(--ink)',
        }}>
          <span style={{ color: 'var(--accent-1)' }}>✣</span>
          AGENT TRACE · {open ? 'HIDE' : 'SHOW'}
        </div>
        <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--ink)' }}>
          {open ? '−' : '+'}
        </span>
      </button>
      {open && (
        <div style={{ marginTop: 10 }}>
          <TraceLine icon="✣" who="Claude"
            body={`parsed intent: "${intent || 'date night, brooklyn, $80'}"`}
            route={`→ routing to ${leader.label} Agent`} />
          <TraceLine icon={leader.icon} who={leader.label}
            body="taking the lead. pulling 42 candidates from venue DB + Yelp."
            t="0.34s" />
          {supporting.map((a, i) => (
            <TraceLine key={a.id} icon={a.icon} who={a.label}
              body={a.blurb} t={`0.${4 + i}s`} sub />
          ))}
          <TraceLine icon="✓" who="plan-gen"
            body="composed pass: 3 stops · 4h · $92"
            t="1.42s" final />
        </div>
      )}
    </div>
  );
}

function TraceLine({ icon, who, body, route, t, sub, final }) {
  return (
    <div style={{
      display: 'flex', gap: 8, padding: '6px 0',
      borderTop: '1px dashed rgba(0,0,0,0.12)',
      opacity: sub ? 0.75 : 1,
    }}>
      <span style={{
        fontSize: 15, lineHeight: 1.4, width: 22, flexShrink: 0,
        color: final ? 'var(--accent-4, #2bb673)' : 'var(--ink)',
      }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
          letterSpacing: '.12em', opacity: 0.6, textTransform: 'uppercase',
        }}>{who}{t ? ` · ${t}` : ''}</div>
        <div style={{
          fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 700,
          marginTop: 1, lineHeight: 1.35,
        }}>{body}</div>
        {route && (
          <div style={{
            fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
            color: 'var(--accent-1)', marginTop: 2,
          }}>{route}</div>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// 3. ReviseSheet — natural-language revision (calls Claude)
// ═════════════════════════════════════════════════════════════════
function ReviseSheet({ open, planSummary, onClose, onRevised }) {
  const [text, setText] = useStateAg('');
  const [loading, setLoading] = useStateAg(false);
  const [response, setResponse] = useStateAg(null);

  if (!open) return null;

  const quickRevisions = [
    'make it cheaper', 'closer to me', 'less loud',
    'more kid-friendly', 'make it indoors', 'add food',
    'turn this into a birthday', 'add a social post',
    'one more stop', 'earlier in the day',
  ];

  const submit = async (q) => {
    const prompt = q || text;
    if (!prompt) return;
    setLoading(true);
    setResponse(null);
    try {
      const planSummaryText = planSummary || 'A 3-stop Brooklyn date-night pass: 7:30 Skinny Pete\'s (dive bar, $14, 45m), 8:30 Lupa Notte (Italian, $52, 90m), 10:30 Quartz Room (indie show, $26, 90m). Total $92, 4h.';
      const out = await window.claude.complete({
        messages: [{
          role: 'user',
          content: `You are the Confetti AI conductor. The user wants to revise their plan. Current plan:\n${planSummaryText}\n\nRevision request: "${prompt}"\n\nReply in 3 parts: (1) ONE sentence acknowledging what you'll change, in lowercase, casual. (2) A bulleted list "- old → new" of 1-3 concrete swaps. (3) ONE sentence with the new total/duration. Keep total response under 80 words. Don't add extras.`
        }]
      });
      setResponse(out);
    } catch (e) {
      setResponse("Couldn't reach the planner — try again in a sec.");
    } finally {
      setLoading(false);
    }
  };

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
        padding: '12px 20px 24px',
        maxHeight: '92%', overflowY: 'auto',
        scrollbarWidth: 'none',
        animation: 'cf-slideup 0.32s cubic-bezier(.2,.9,.2,1)',
      }}>
        <div style={{
          width: 44, height: 5, borderRadius: 999,
          background: 'var(--ink)', opacity: 0.25,
          margin: '0 auto 12px',
        }} />

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 12,
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
              letterSpacing: '.16em', opacity: 0.55, textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ color: 'var(--accent-1)' }}>✣</span>
              ASK CLAUDE TO REVISE
            </div>
            <div style={{
              fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 22,
              letterSpacing: '-0.025em', marginTop: 2,
            }}>Change anything.</div>
          </div>
          <button onClick={onClose} style={{
            appearance: 'none', cursor: 'pointer',
            width: 34, height: 34, borderRadius: 999,
            border: '2.5px solid var(--ink)', background: 'var(--paper)',
            fontSize: 14, fontWeight: 900,
          }}>✕</button>
        </div>

        {/* Quick chips */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12,
        }}>
          {quickRevisions.map(q => (
            <button key={q} onClick={() => { setText(q); submit(q); }}
              style={{
                appearance: 'none', cursor: 'pointer',
                padding: '6px 12px',
                border: '2px solid var(--ink)', borderRadius: 999,
                background: 'var(--paper)',
                fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 800,
              }}>{q}</button>
          ))}
        </div>

        {/* Custom input */}
        <div style={{
          display: 'flex', gap: 8, alignItems: 'center',
          padding: '4px 4px 4px 14px',
          border: '2.5px solid var(--ink)', borderRadius: 14,
          background: 'var(--paper)',
          boxShadow: '4px 4px 0 var(--ink)',
          marginBottom: 12,
        }}>
          <input
            value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="or say it your way…"
            style={{
              flex: 1, appearance: 'none', border: 'none',
              outline: 'none', background: 'transparent',
              padding: '12px 0',
              fontFamily: 'var(--cf-ui)', fontSize: 14, fontWeight: 700,
              color: 'var(--ink)',
            }} />
          <button onClick={() => submit()} disabled={loading || !text}
            style={{
              appearance: 'none', cursor: 'pointer',
              padding: '10px 14px',
              border: '2.5px solid var(--ink)', borderRadius: 10,
              background: loading ? 'var(--paper)' : 'var(--accent-1)',
              color: 'var(--ink)',
              fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 900,
              opacity: !text ? 0.5 : 1,
            }}>
            {loading ? '…' : 'go'}
          </button>
        </div>

        {/* Response */}
        {loading && <ClaudeThinking />}
        {response && !loading && (
          <div style={{
            padding: 14,
            border: '2.5px solid var(--ink)', borderRadius: 12,
            background: 'var(--accent-2)',
            boxShadow: '4px 4px 0 var(--ink)',
            animation: 'cf-bubble 0.4s',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
              letterSpacing: '.14em', opacity: 0.7, textTransform: 'uppercase',
              marginBottom: 8,
            }}>
              <span style={{ color: 'var(--accent-1)' }}>✣</span>
              CLAUDE · REVISED
            </div>
            <div style={{
              fontFamily: 'var(--cf-ui)', fontSize: 14, fontWeight: 700,
              whiteSpace: 'pre-wrap', lineHeight: 1.5,
            }}>{response}</div>
            <button onClick={() => { onRevised?.(response); onClose(); }} style={{
              appearance: 'none', cursor: 'pointer', marginTop: 12,
              padding: '8px 14px',
              border: '2.5px solid var(--ink)', borderRadius: 999,
              background: 'var(--ink)', color: 'var(--paper)',
              fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 800,
            }}>apply to pass →</button>
          </div>
        )}

        <div style={{
          marginTop: 14, padding: '10px 12px',
          background: 'var(--paper)',
          border: '1.5px dashed var(--ink)', borderRadius: 10,
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
          opacity: 0.7, lineHeight: 1.4,
        }}>
          🔒 Claude runs on the backend. We never expose API keys.
          Your prefs and crew are sent only with your request.
        </div>
      </div>
    </div>
  );
}

function ClaudeThinking() {
  const phases = [
    "Reading your request...",
    "Routing to specialist agent...",
    "Pulling fresh venue data...",
    "Re-balancing budget...",
    "Drafting changes...",
  ];
  const [step, setStep] = useStateAg(0);
  useEffectAg(() => {
    const t = setInterval(() => setStep(s => (s + 1) % phases.length), 700);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{
      padding: 12,
      border: '2px dashed var(--ink)', borderRadius: 12,
      background: 'var(--paper)',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{ display: 'inline-flex', gap: 3 }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: 5, height: 5, borderRadius: 999, background: 'var(--accent-1)',
            animation: `cf-typing 1s ${i * 0.15}s infinite`,
          }} />
        ))}
      </div>
      <div style={{
        fontFamily: 'var(--cf-mono)', fontSize: 11, fontWeight: 800,
        letterSpacing: '.08em', flex: 1,
      }}>{phases[step]}</div>
    </div>
  );
}

Object.assign(window, {
  AGENT_SPECIALISTS, AGENT_STATUS, routeIntent,
  AgentRouter, AgentTrace, ReviseSheet, ClaudeThinking,
});
