// family.jsx — Family Mode add-on layer
// A mode switcher (Adults / Family / Kids / All) that re-skins the planner
// with kid-friendly extras: age, stroller, nap, supplies, parent checklist.
// Keeps the same Confetti visual identity — tickets, stamps, route lines.

const { useState: useStateF, useEffect: useEffectF } = React;

// ═════════════════════════════════════════════════════════════════
// 1. ModePill — top-level mode switcher used on Hub
// ═════════════════════════════════════════════════════════════════
const MODES = [
  { id: 'adults', label: 'Adults', icon: '🍷', c: 'var(--accent-3)' },
  { id: 'family', label: 'Family', icon: '👨‍👩‍👧', c: 'var(--accent-1)' },
  { id: 'kids',   label: 'Kids',   icon: '🧸', c: 'var(--accent-2)' },
  { id: 'all',    label: 'All ages', icon: '✣', c: 'var(--ink)' },
];

function ModePill({ value, onChange, compact = false }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 2,
      padding: 3,
      border: '2.5px solid var(--ink)', borderRadius: 999,
      background: 'var(--paper)',
      boxShadow: '3px 3px 0 var(--ink)',
    }}>
      {MODES.map(m => {
        const on = value === m.id;
        return (
          <button key={m.id} onClick={() => onChange(m.id)} style={{
            appearance: 'none', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: compact ? '4px 8px' : '6px 10px',
            border: 'none', borderRadius: 999,
            background: on ? m.c : 'transparent',
            color: on && m.c === 'var(--ink)' ? 'var(--paper)' : 'var(--ink)',
            fontFamily: 'var(--cf-ui)', fontSize: compact ? 11 : 12, fontWeight: 800,
            letterSpacing: '-0.01em',
            transition: 'all .12s',
          }}>
            <span style={{ fontSize: compact ? 12 : 13 }}>{m.icon}</span>
            {!compact && m.label}
          </button>
        );
      })}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// 2. FamilyBanner — shown in Hub when mode is family/kids
// ═════════════════════════════════════════════════════════════════
function FamilyBanner({ mode, onUpgrade, onGo }) {
  if (mode !== 'family' && mode !== 'kids') return null;
  return (
    <div style={{
      padding: 14, marginBottom: 14,
      border: '2.5px solid var(--ink)', borderRadius: 14,
      background: 'var(--accent-1)',
      boxShadow: '4px 4px 0 var(--ink)',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        fontSize: 32, width: 48, height: 48, borderRadius: 999,
        border: '2.5px solid var(--ink)', background: 'var(--paper)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>{mode === 'family' ? '👨‍👩‍👧' : '🧸'}</div>
      <div style={{ flex: 1, color: 'var(--ink)' }}>
        <div style={{
          fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
          letterSpacing: '.14em', opacity: 0.65, textTransform: 'uppercase',
        }}>CONFETTI ALL-ACCESS</div>
        <div style={{
          fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 18,
          letterSpacing: '-0.025em', lineHeight: 1.05, marginTop: 2,
        }}>One plan. Every kind of plan.</div>
        <button onClick={onUpgrade} style={{
          appearance: 'none', cursor: 'pointer', marginTop: 8,
          padding: '5px 10px',
          border: '2px solid var(--ink)', borderRadius: 999,
          background: 'var(--ink)', color: 'var(--paper)',
          fontFamily: 'var(--cf-ui)', fontSize: 11, fontWeight: 800,
        }}>upgrade · $9.99/mo →</button>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// 3. Family portal grid — replaces "portals" row in family mode
// ═════════════════════════════════════════════════════════════════
const FAMILY_PORTALS = [
  { id: 'park',     icon: '🌳', label: 'park day',     sub: '2-4h · outdoor' },
  { id: 'museum',   icon: '🏛', label: 'museum day',    sub: 'indoor · stroller' },
  { id: 'aquarium', icon: '🐠', label: 'aquarium/zoo',  sub: 'half-day' },
  { id: 'story',    icon: '📖', label: 'library hour',  sub: 'free · quiet' },
  { id: 'play',     icon: '🎪', label: 'indoor play',   sub: 'rainy backup' },
  { id: 'tramp',    icon: '🤸', label: 'trampoline',    sub: '5+ years' },
  { id: 'splash',   icon: '💦', label: 'splash pad',    sub: 'hot day · free' },
  { id: 'cook',     icon: '🥞', label: 'kids cooking',  sub: 'at home · 90m' },
  { id: 'yard',     icon: '🎯', label: 'backyard games', sub: 'low effort' },
  { id: 'bday',     icon: '🎂', label: 'birthday party', sub: 'full planner' },
  { id: 'picnic',   icon: '🧺', label: 'family picnic', sub: 'pack list inc.' },
  { id: 'movie',    icon: '🎬', label: 'movie day',     sub: 'wind-down' },
  { id: 'rainy',    icon: '🌧', label: 'rainy rescue',  sub: 'today\'s plan' },
  { id: 'school',   icon: '🎒', label: 'school break',  sub: '5-day plan' },
  { id: 'cousins',  icon: '👯', label: 'cousins day',   sub: 'mixed ages' },
  { id: 'grand',    icon: '👵', label: 'grandparents',  sub: 'low energy' },
];

// ─── Learn & Explore portals (educational) ──────────────────────
const LEARN_PORTALS = [
  { id: 'l-story',   icon: '📖', label: 'library story time', sub: 'free · ages 0-5' },
  { id: 'l-rainy',   icon: '🌧', label: 'rainy learn day', sub: 'indoor backup' },
  { id: 'l-museum',  icon: '🏛', label: 'museum + lunch', sub: 'half-day · ages 4+' },
  { id: 'l-stem',    icon: '🔬', label: 'STEM saturday', sub: 'ages 6-12' },
  { id: 'l-summer',  icon: '☀', label: 'summer reading', sub: '20 books · free' },
  { id: 'l-after',   icon: '🎒', label: 'after-school', sub: 'tutoring + snack' },
  { id: 'l-home',    icon: '🏡', label: 'homeschool trip', sub: 'field-day' },
  { id: 'l-grand',   icon: '👵', label: 'grandparent edu', sub: 'low energy' },
  { id: 'l-free',    icon: '🆓', label: 'free family day', sub: 'this week' },
  { id: 'l-nature',  icon: '🦋', label: 'nature + library', sub: 'walk + read' },
  { id: 'l-book',    icon: '📚', label: 'bookstore picnic', sub: 'park lunch' },
  { id: 'l-art',     icon: '🎨', label: 'art class drop-in', sub: 'no signup' },
];

function FamilyPortals({ onPick }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8,
    }}>
      {FAMILY_PORTALS.map(p => (
        <button key={p.id} onClick={() => onPick(p)} style={{
          appearance: 'none', cursor: 'pointer', textAlign: 'left',
          padding: 10,
          border: '2.5px solid var(--ink)', borderRadius: 12,
          background: 'var(--paper)', color: 'var(--ink)',
          boxShadow: '3px 3px 0 var(--ink)',
          display: 'flex', flexDirection: 'column', gap: 2,
          minHeight: 80,
        }}>
          <span style={{ fontSize: 22, marginBottom: 2 }}>{p.icon}</span>
          <span style={{
            fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 900,
            letterSpacing: '-0.01em', lineHeight: 1.1,
          }}>{p.label}</span>
          <span style={{
            fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 700,
            opacity: 0.55, letterSpacing: '.06em', marginTop: 'auto',
          }}>{p.sub}</span>
        </button>
      ))}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// 4. Family Plan — kid-specific plan builder
// ═════════════════════════════════════════════════════════════════
function FamilyPlanScreen({ mode, onBack, onPlan, portalType = 'park' }) {
  const [crew, setCrew] = useStateF([
    { id: 'a1', kind: 'adult', label: 'me' },
    { id: 'a2', kind: 'adult', label: 'partner' },
    { id: 'k1', kind: 'kid',   age: 4, label: 'Mia' },
  ]);
  const [filters, setFilters] = useStateF({
    indoor: 'either', stroller: true, nap: false,
    parking: 'easy', restrooms: true, foodNearby: true,
    budget: '$$', effort: 'low', weather: true, noise: 'any',
  });
  const portal = FAMILY_PORTALS.find(p => p.id === portalType) || FAMILY_PORTALS[0];
  const kidAges = crew.filter(c => c.kind === 'kid').map(c => c.age);

  const addKid = () => setCrew([...crew, {
    id: 'k' + Date.now(), kind: 'kid', age: 6, label: 'Kid ' + (crew.filter(c => c.kind === 'kid').length + 1),
  }]);
  const removeMember = (id) => setCrew(crew.filter(c => c.id !== id));
  const setKidAge = (id, age) => setCrew(crew.map(c => c.id === id ? { ...c, age } : c));

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
          background: 'transparent', border: 'none', padding: 6,
          fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 800,
          color: 'var(--ink)', opacity: 0.6,
        }}>← back</button>
        <Stamp color="var(--accent-1)" rotate={-2}>family mode</Stamp>
        <span style={{ width: 36 }} />
      </div>

      <div style={{
        position: 'relative', zIndex: 2,
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        marginRight: -22, paddingRight: 22, scrollbarWidth: 'none',
      }}>
        <h2 style={{
          fontFamily: 'var(--cf-display)', fontWeight: 900,
          fontSize: 34, lineHeight: 0.95, letterSpacing: '-0.04em',
          margin: '0 0 6px',
        }}>{portal.icon} {portal.label}</h2>
        <p style={{
          fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 700,
          opacity: 0.65, margin: '0 0 18px',
        }}>{portal.sub} · stroller-friendly, restrooms verified</p>

        {/* Who's coming */}
        <FamilyLabel>who's coming</FamilyLabel>
        <div style={{
          padding: 12, marginBottom: 16,
          border: '2.5px solid var(--ink)', borderRadius: 14,
          background: 'var(--paper)',
          boxShadow: '3px 3px 0 var(--ink)',
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            {crew.map(c => (
              <div key={c.id} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 5px 5px 10px',
                border: '2px solid var(--ink)', borderRadius: 999,
                background: c.kind === 'kid' ? 'var(--accent-2)' : 'var(--bg)',
              }}>
                <span style={{ fontSize: 14 }}>{c.kind === 'kid' ? '🧒' : '🧑'}</span>
                <span style={{
                  fontFamily: 'var(--cf-ui)', fontSize: 11, fontWeight: 800,
                }}>{c.label}{c.kind === 'kid' ? ` · ${c.age}` : ''}</span>
                {c.kind === 'kid' && (
                  <select value={c.age} onChange={e => setKidAge(c.id, Number(e.target.value))}
                          style={{
                            appearance: 'none', border: 'none', background: 'transparent',
                            fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
                            cursor: 'pointer', padding: 0,
                          }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(a =>
                      <option key={a} value={a}>{a}y</option>)}
                  </select>
                )}
                <button onClick={() => removeMember(c.id)} style={{
                  appearance: 'none', cursor: 'pointer',
                  width: 18, height: 18, borderRadius: 999,
                  border: '1.5px solid var(--ink)', background: 'var(--paper)',
                  fontSize: 9, fontWeight: 900,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>✕</button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={addKid} style={{
              appearance: 'none', cursor: 'pointer', flex: 1,
              padding: '8px 10px',
              border: '2px dashed var(--ink)', borderRadius: 10,
              background: 'transparent',
              fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 800,
            }}>＋ add kid</button>
            <button style={{
              appearance: 'none', cursor: 'pointer', flex: 1,
              padding: '8px 10px',
              border: '2px dashed var(--ink)', borderRadius: 10,
              background: 'transparent',
              fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 800,
            }}>＋ add adult</button>
          </div>
        </div>

        {/* Indoor/outdoor */}
        <FamilyLabel>indoor / outdoor</FamilyLabel>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {[
            { id: 'indoor', label: '🏠 indoor', sub: 'a/c, no rain' },
            { id: 'outdoor', label: '🌳 outdoor', sub: 'fresh air' },
            { id: 'either', label: '↕ either', sub: 'mix it' },
          ].map(o => (
            <button key={o.id} onClick={() => setFilters({ ...filters, indoor: o.id })}
              style={{
                appearance: 'none', cursor: 'pointer', flex: 1,
                padding: '10px 6px',
                border: '2.5px solid var(--ink)', borderRadius: 12,
                background: filters.indoor === o.id ? 'var(--accent-1)' : 'var(--paper)',
                color: 'var(--ink)',
                fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 800,
                boxShadow: filters.indoor === o.id ? '3px 3px 0 var(--ink)' : 'none',
                transform: filters.indoor === o.id ? 'translate(-1px,-1px)' : 'none',
                transition: 'all .12s',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              }}>
              <span style={{ fontSize: 14 }}>{o.label}</span>
              <span style={{
                fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 700,
                opacity: 0.65,
              }}>{o.sub}</span>
            </button>
          ))}
        </div>

        {/* Must-haves */}
        <FamilyLabel>must-haves</FamilyLabel>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {[
            { id: 'stroller', label: '🛼 stroller-friendly' },
            { id: 'restrooms', label: '🚻 restrooms' },
            { id: 'foodNearby', label: '🍎 food nearby' },
            { id: 'nap',       label: '😴 nap-time ok' },
            { id: 'weather',   label: '🌦 weather backup' },
            { id: 'parking',   label: '🅿 easy parking' },
          ].map(f => {
            const on = filters[f.id];
            return (
              <button key={f.id}
                onClick={() => setFilters({ ...filters, [f.id]: !on })}
                style={{
                  appearance: 'none', cursor: 'pointer',
                  padding: '7px 12px',
                  border: '2.5px solid var(--ink)', borderRadius: 999,
                  background: on ? 'var(--accent-2)' : 'var(--paper)',
                  fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 800,
                  boxShadow: on ? '3px 3px 0 var(--ink)' : 'none',
                  transform: on ? 'translate(-1px,-1px)' : 'none',
                  transition: 'all .12s',
                }}>{f.label}</button>
            );
          })}
        </div>

        {/* Energy / effort */}
        <FamilyLabel>parent effort</FamilyLabel>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {['low', 'medium', 'we got energy'].map(e => (
            <button key={e} onClick={() => setFilters({ ...filters, effort: e })}
              style={{
                appearance: 'none', cursor: 'pointer', flex: 1,
                padding: '10px 8px',
                border: '2.5px solid var(--ink)', borderRadius: 12,
                background: filters.effort === e ? 'var(--accent-3)' : 'var(--paper)',
                color: filters.effort === e ? 'var(--paper)' : 'var(--ink)',
                fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 800,
                boxShadow: filters.effort === e ? '3px 3px 0 var(--ink)' : 'none',
                transform: filters.effort === e ? 'translate(-1px,-1px)' : 'none',
                transition: 'all .12s',
              }}>{e}</button>
          ))}
        </div>

        {/* Best time */}
        <FamilyLabel>best time</FamilyLabel>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
          {['☀ morning', '🥪 lunchtime', '🌤 afternoon', '🌅 sunset', '🌙 late'].map(t => (
            <button key={t} style={{
              appearance: 'none', cursor: 'pointer',
              padding: '7px 12px',
              border: '2.5px solid var(--ink)', borderRadius: 999,
              background: t === '🌤 afternoon' ? 'var(--accent-1)' : 'var(--paper)',
              fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 800,
              boxShadow: t === '🌤 afternoon' ? '3px 3px 0 var(--ink)' : 'none',
              transform: t === '🌤 afternoon' ? 'translate(-1px,-1px)' : 'none',
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 2, paddingTop: 12 }}>
        <ChunkyButton variant="accent" onClick={() => onPlan(portal, crew, filters)} icon={Icons.arrow}>
          print our family pass
        </ChunkyButton>
        <div style={{
          marginTop: 8, textAlign: 'center',
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
          opacity: 0.55, letterSpacing: '.08em',
        }}>FOR {crew.length} · {kidAges.length} KID{kidAges.length !== 1 ? 'S' : ''} AGED {kidAges.join(', ')}</div>
      </div>
    </div>
  );
}

function FamilyLabel({ children }) {
  return (
    <div style={{
      fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
      letterSpacing: '.14em', textTransform: 'uppercase',
      opacity: 0.55, marginBottom: 8,
    }}>{children}</div>
  );
}

// ═════════════════════════════════════════════════════════════════
// 5. Family Pass — kid pass with timeline, supplies, parent checklist
// ═════════════════════════════════════════════════════════════════
function FamilyPassScreen({ onBack, onStart, portalType = 'park' }) {
  const [tab, setTab] = useStateF('plan');
  const portal = FAMILY_PORTALS.find(p => p.id === portalType) || FAMILY_PORTALS[0];

  // Sample data — would come from plan-generator agent in real app
  const stops = portalType === 'museum' ? [
    { time: '10:00', name: 'BK Children\'s Museum', tag: 'museum', dur: '2h', cost: '$32', icon: '🏛', c: 'var(--accent-3)' },
    { time: '12:30', name: 'Pizza Moto', tag: 'kid menu', dur: '1h', cost: '$36', icon: '🍕', c: 'var(--accent-1)' },
    { time: '2:00', name: 'Prospect Park playground', tag: 'free play', dur: '90m', cost: '$0', icon: '🌳', c: 'var(--accent-2)' },
  ] : [
    { time: '9:30', name: 'Prospect Park lawn', tag: 'open play', dur: '90m', cost: '$0', icon: '🌳', c: 'var(--accent-2)' },
    { time: '11:30', name: 'The Bluestone Lane', tag: 'kid menu + bathroom', dur: '60m', cost: '$28', icon: '🥪', c: 'var(--accent-1)' },
    { time: '1:00', name: 'Carousel + library hour', tag: 'wind-down', dur: '90m', cost: '$8', icon: '🎠', c: 'var(--accent-3)' },
  ];

  return (
    <div className="cf-screen" style={{
      position: 'relative', height: '100%',
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      padding: '56px 22px 22px',
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
        <Stamp color="var(--accent-1)" rotate={2}>family pass</Stamp>
        <span style={{
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
          letterSpacing: '.12em', opacity: 0.55,
        }}>#FK·8M2</span>
      </div>

      <div style={{
        position: 'relative', zIndex: 2,
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        marginRight: -22, paddingRight: 22, scrollbarWidth: 'none',
      }}>
        <h2 style={{
          fontFamily: 'var(--cf-display)', fontWeight: 900,
          fontSize: 36, lineHeight: 0.95, letterSpacing: '-0.04em',
          margin: '0 0 6px',
        }}>{portal.icon} {portal.label.replace(/\b\w/g, c => c.toUpperCase())}</h2>
        <div style={{
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
          letterSpacing: '.12em', opacity: 0.55, textTransform: 'uppercase',
          marginBottom: 14,
        }}>SAT · 3 STOPS · 4h 30m · 1 KID AGE 4 · 2 ADULTS</div>

        {/* Top stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6, marginBottom: 14 }}>
          {[
            { l: 'cost', v: '$72', c: 'var(--paper)' },
            { l: 'energy', v: 'medium', c: 'var(--accent-2)' },
            { l: 'effort', v: 'low', c: 'var(--accent-1)' },
            { l: 'naps', v: '1', c: 'var(--paper)' },
          ].map((m, i) => (
            <div key={i} style={{
              padding: '8px 6px', textAlign: 'center',
              border: '2px solid var(--ink)', borderRadius: 10,
              background: m.c,
            }}>
              <div style={{
                fontFamily: 'var(--cf-mono)', fontSize: 8, fontWeight: 800,
                letterSpacing: '.12em', opacity: 0.6, textTransform: 'uppercase',
              }}>{m.l}</div>
              <div style={{
                fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 14,
                letterSpacing: '-0.02em', marginTop: 1,
              }}>{m.v}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
          {[
            { id: 'plan', label: 'Plan' },
            { id: 'pack', label: 'Pack list' },
            { id: 'check', label: 'Checklist' },
            { id: 'backup', label: 'Backup' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              appearance: 'none', cursor: 'pointer', flex: 1,
              padding: '6px 4px',
              border: '2px solid var(--ink)', borderRadius: 999,
              background: tab === t.id ? 'var(--ink)' : 'var(--paper)',
              color: tab === t.id ? 'var(--paper)' : 'var(--ink)',
              fontFamily: 'var(--cf-ui)', fontSize: 11, fontWeight: 800,
            }}>{t.label}</button>
          ))}
        </div>

        {tab === 'plan' && (
          <Ticket color="var(--paper)" notch={false} style={{ padding: 14, marginBottom: 14 }}>
            {stops.map((s, i) => (
              <div key={i} style={{
                display: 'flex', gap: 12,
                paddingBottom: i < stops.length - 1 ? 14 : 0,
                marginBottom: i < stops.length - 1 ? 14 : 0,
                borderBottom: i < stops.length - 1 ? '1.5px dashed rgba(0,0,0,0.15)' : 'none',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 999, flexShrink: 0,
                  border: '2.5px solid var(--ink)', background: s.c,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22,
                }}>{s.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
                    letterSpacing: '.12em', opacity: 0.6, textTransform: 'uppercase',
                  }}>{s.time} · {s.tag}</div>
                  <div style={{
                    fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 18,
                    letterSpacing: '-0.025em', marginTop: 2,
                  }}>{s.name}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    {(i === 1) && <KidBadge color="var(--accent-2)">🚻 changing table</KidBadge>}
                    {(i === 1) && <KidBadge color="var(--accent-1)">🍝 kid menu</KidBadge>}
                    {(i === 0) && <KidBadge color="var(--accent-3)">🌳 fenced</KidBadge>}
                    {(i === 0) && <KidBadge color="var(--accent-2)">🛼 stroller ok</KidBadge>}
                    {(i === 2) && <KidBadge color="var(--accent-2)">😴 nap-friendly</KidBadge>}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{
                    fontFamily: 'var(--cf-mono)', fontSize: 11, fontWeight: 800,
                  }}>{s.cost}</div>
                  <div style={{
                    fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 700,
                    opacity: 0.5, marginTop: 2,
                  }}>{s.dur}</div>
                </div>
              </div>
            ))}
          </Ticket>
        )}

        {tab === 'pack' && <PackListTab portalType={portalType} />}
        {tab === 'check' && <ChecklistTab />}
        {tab === 'backup' && <BackupTab />}

        {/* Snacks/meals */}
        {tab === 'plan' && (
          <Ticket color="var(--accent-2)" notch={false} style={{ padding: 14, marginBottom: 14 }}>
            <div style={{
              fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
              letterSpacing: '.14em', opacity: 0.6, marginBottom: 6,
              textTransform: 'uppercase',
            }}>🍎 SNACKS + MEALS</div>
            {[
              ['10:30', 'cheerios + apple slices', '(brought)'],
              ['12:30', 'pizza + milk at Pizza Moto', 'kid menu'],
              ['2:30', 'goldfish + water', '(brought)'],
            ].map(([t, n, s], i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '6px 0',
                borderBottom: i < 2 ? '1px dashed rgba(0,0,0,0.18)' : 'none',
                fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 700,
              }}>
                <span style={{ fontFamily: 'var(--cf-mono)', opacity: 0.55, width: 50 }}>{t}</span>
                <span style={{ flex: 1 }}>{n}</span>
                <span style={{
                  fontFamily: 'var(--cf-mono)', fontSize: 10, opacity: 0.55,
                }}>{s}</span>
              </div>
            ))}
          </Ticket>
        )}
      </div>

      <div style={{ position: 'relative', zIndex: 2, paddingTop: 12 }}>
        <ChunkyButton variant="accent" onClick={onStart} icon={Icons.arrow}>
          start the day
        </ChunkyButton>
      </div>
    </div>
  );
}

function KidBadge({ children, color }) {
  return (
    <span style={{
      padding: '2px 7px',
      background: color,
      border: '1.5px solid var(--ink)', borderRadius: 4,
      fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
      letterSpacing: '.04em',
      color: color === 'var(--accent-3)' ? 'var(--paper)' : 'var(--ink)',
    }}>{children}</span>
  );
}

// ─── Pack list tab
function PackListTab({ portalType }) {
  const [done, setDone] = useStateF(new Set(['water', 'sunscreen']));
  const toggle = (k) => {
    const n = new Set(done);
    n.has(k) ? n.delete(k) : n.add(k);
    setDone(n);
  };
  const items = [
    { k: 'water',     icon: '💧', t: 'Water bottles · 2L' },
    { k: 'sunscreen', icon: '🧴', t: 'Sunscreen SPF 50' },
    { k: 'hat',       icon: '👒', t: "Mia's bucket hat" },
    { k: 'snacks',    icon: '🥨', t: 'Cheerios + apple slices' },
    { k: 'wipes',     icon: '🧻', t: 'Wipes + diapers (3)' },
    { k: 'changes',   icon: '👕', t: 'Spare outfit' },
    { k: 'stroller',  icon: '🛼', t: 'Stroller + rain cover' },
    { k: 'bandaids',  icon: '🩹', t: 'Mini first-aid' },
    { k: 'wallet',    icon: '💳', t: 'Wallet + member card' },
  ];
  const completed = done.size;
  return (
    <Ticket color="var(--paper)" notch={false} style={{ padding: 14, marginBottom: 14 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 8,
      }}>
        <div style={{
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
          letterSpacing: '.14em', opacity: 0.6, textTransform: 'uppercase',
        }}>🎒 WHAT TO PACK · {completed}/{items.length}</div>
        <div style={{
          flex: 1, height: 6, marginLeft: 10,
          border: '1.5px solid var(--ink)', borderRadius: 999,
          background: 'var(--bg)', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: `${(completed / items.length) * 100}%`,
            background: 'var(--accent-1)', transition: 'width .25s',
          }} />
        </div>
      </div>
      {items.map((it, i) => {
        const on = done.has(it.k);
        return (
          <button key={it.k} onClick={() => toggle(it.k)} style={{
            appearance: 'none', cursor: 'pointer', width: '100%',
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 0', textAlign: 'left',
            border: 'none', background: 'transparent',
            borderBottom: i < items.length - 1 ? '1px dashed rgba(0,0,0,0.15)' : 'none',
          }}>
            <span style={{
              width: 22, height: 22, borderRadius: 6,
              border: '2px solid var(--ink)',
              background: on ? 'var(--accent-1)' : 'var(--paper)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 900, color: 'var(--ink)',
              flexShrink: 0,
            }}>{on ? '✓' : ''}</span>
            <span style={{ fontSize: 16, width: 22 }}>{it.icon}</span>
            <span style={{
              fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 700,
              textDecoration: on ? 'line-through' : 'none', opacity: on ? 0.55 : 1,
              color: 'var(--ink)',
            }}>{it.t}</span>
          </button>
        );
      })}
    </Ticket>
  );
}

// ─── Parent checklist tab
function ChecklistTab() {
  const items = [
    { t: '30m before', s: 'apply sunscreen, fill water bottles' },
    { t: 'leaving',    s: 'phone, wallet, member card, stroller in car' },
    { t: 'at park',    s: 'check shaded benches first — east side' },
    { t: '12 PM',      s: 'reserve table at Pizza Moto on the way' },
    { t: 'pre-lunch',  s: 'hand-wipes + bathroom break' },
    { t: 'naptime',    s: 'carousel is gentle, won\'t over-stim' },
    { t: 'leaving',    s: 'gather toys, parking ticket in app' },
  ];
  return (
    <Ticket color="var(--paper)" notch={false} style={{ padding: 14, marginBottom: 14 }}>
      <div style={{
        fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
        letterSpacing: '.14em', opacity: 0.6, textTransform: 'uppercase',
        marginBottom: 8,
      }}>📝 PARENT CHECKLIST</div>
      {items.map((it, i) => (
        <div key={i} style={{
          display: 'flex', gap: 10, padding: '8px 0',
          borderBottom: i < items.length - 1 ? '1px dashed rgba(0,0,0,0.15)' : 'none',
        }}>
          <span style={{
            padding: '2px 6px', minWidth: 70, height: 'fit-content',
            background: 'var(--accent-2)', border: '1.5px solid var(--ink)', borderRadius: 4,
            fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
            letterSpacing: '.08em', textAlign: 'center',
          }}>{it.t.toUpperCase()}</span>
          <span style={{
            flex: 1,
            fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 700,
            opacity: 0.85, lineHeight: 1.3,
          }}>{it.s}</span>
        </div>
      ))}
    </Ticket>
  );
}

// ─── Backup plan tab
function BackupTab() {
  return (
    <>
      <Ticket color="var(--accent-3)" notch={false} style={{
        padding: 14, marginBottom: 10, color: 'var(--paper)',
      }}>
        <div style={{
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
          letterSpacing: '.14em', opacity: 0.85, textTransform: 'uppercase',
          marginBottom: 6,
        }}>🌧 RAINY-DAY SWAP</div>
        <div style={{
          fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 18,
          letterSpacing: '-0.025em',
        }}>Park → BK Children's Museum (covered)</div>
        <div style={{
          fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 700,
          opacity: 0.85, marginTop: 4,
        }}>Auto-swaps stop 1 if NWS rain ≥ 60% by 9 AM. 0.8 mi from your starting spot, free parking lot.</div>
      </Ticket>
      <Ticket color="var(--accent-2)" notch={false} style={{ padding: 14, marginBottom: 10 }}>
        <div style={{
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
          letterSpacing: '.14em', opacity: 0.65, textTransform: 'uppercase',
          marginBottom: 6,
        }}>🥱 EARLY-MELTDOWN ESCAPE</div>
        <div style={{
          fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 17,
          letterSpacing: '-0.025em',
        }}>If Mia's done by 12, skip carousel — head home for wind-down.</div>
        <div style={{
          fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 700,
          opacity: 0.75, marginTop: 4,
        }}>Pizza Moto does takeout in 12 min. Cost drops to $48.</div>
      </Ticket>
      <Ticket color="var(--paper)" notch={false} style={{ padding: 14 }}>
        <div style={{
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
          letterSpacing: '.14em', opacity: 0.6, textTransform: 'uppercase',
          marginBottom: 6,
        }}>📞 SAFETY NOTES</div>
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 4,
          fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 700,
        }}>
          <div>📍 Nearest urgent care · Bushwick UC · 0.6 mi</div>
          <div>📞 Pediatrician on call · (718) 555-2210</div>
          <div>🚸 Park entrance gates close at 5 PM</div>
        </div>
      </Ticket>
    </>
  );
}

// ═════════════════════════════════════════════════════════════════
// 6. Confetti All-Access — $9.99/mo unified paywall
// ═════════════════════════════════════════════════════════════════
const ALLACCESS_FEATURES = [
  { icon: '🌙', h: 'Nights out',         s: 'date nights, crew nights, weird nights' },
  { icon: '👨‍👩‍👧', h: 'Family Mode',       s: 'park days, museum days, library hours' },
  { icon: '🎂', h: 'Kids parties',        s: 'venue + theme + invite copy' },
  { icon: '🛝', h: 'Jump places & party venues', s: 'curated, age-tagged' },
  { icon: '🎨', h: 'Party theme builder', s: 'color, decor, music, snacks' },
  { icon: '🔥', h: 'BBQs + cookouts',     s: 'menu, supplies, timing' },
  { icon: '🎲', h: 'Game nights',         s: 'right-sized for the group' },
  { icon: '🧺', h: 'Park lunches + backyard hangs', s: 'pack list included' },
  { icon: '🛒', h: 'Grocery + supply lists', s: 'auto-built per plan' },
  { icon: '🗓', h: 'Itinerary builder',   s: 'minute-by-minute timing' },
  { icon: '📕', h: 'Booking + reservation links', s: 'OpenTable / Resy / Stripe deposits' },
  { icon: '🗺', h: 'Route planning',      s: 'walk / bike / lyft / transit' },
  { icon: '💸', h: 'Budget estimates',    s: 'per person, per stop' },
  { icon: '🌦', h: 'Weather-aware backup', s: 'auto-swap if rain hits' },
  { icon: '💾', h: 'Saved + shared plans', s: 'reuse, gift, hand off' },
  { icon: '🎟', h: 'Boarding passes',     s: 'Apple + Google Wallet' },
  { icon: '🎪', h: 'Event discovery',     s: 'Ticketmaster + partners' },
  { icon: '☆',  h: 'Venue saves',         s: 'lists, tags, share with crew' },
  { icon: '📝', h: 'Parent checklists',   s: 'minute-by-minute reminders' },
  { icon: '✉',  h: 'RSVP tracker',        s: 'real-time guest list' },
  { icon: '💌', h: 'Invitation copy',     s: 'AI-drafted in your voice' },
  { icon: '🙏', h: 'Thank-you notes',     s: 'templates per occasion' },
  { icon: '🏆', h: 'Confetti rewards',    s: 'stamps, tiers, perks at venues' },
  { icon: '✣',  h: 'Unlimited AI plans',  s: 'all 6 agents, no caps' },
];

function KidsPassUpgradeScreen({ onBack, onSubscribe }) {
  const [billing, setBilling] = useStateF('yearly');
  return (
    <div className="cf-screen" style={{
      position: 'relative', height: '100%',
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      padding: '60px 0 28px',
      overflow: 'hidden',
      color: 'var(--ink)',
    }}>
      <DotsBg opacity={0.07} />
      <FloatingTickets density={5} />

      <div style={{
        position: 'relative', zIndex: 2,
        padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 14,
      }}>
        <BrandMark size={18} />
        <button onClick={onBack} style={{
          appearance: 'none', cursor: 'pointer',
          background: 'transparent', border: 'none',
          fontSize: 22, fontWeight: 900, color: 'var(--ink)',
        }}>✕</button>
      </div>

      <div style={{
        position: 'relative', zIndex: 2,
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        padding: '0 24px', scrollbarWidth: 'none',
      }}>
        {/* Hero ticket */}
        <div style={{
          position: 'relative',
          background: 'var(--paper)',
          border: '3px solid var(--ink)', borderRadius: 22,
          boxShadow: '7px 7px 0 var(--ink)',
          padding: 0, overflow: 'hidden', marginBottom: 18,
        }}>
          <div style={{
            background: 'var(--accent-1)', color: 'var(--ink)',
            padding: '10px 16px',
            borderBottom: '3px solid var(--ink)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
            letterSpacing: '.16em',
          }}>
            <span>CONFETTI ALL-ACCESS</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span style={{
                width: 6, height: 6, borderRadius: 999, background: 'var(--ink)',
                animation: 'cf-pulse 1.2s infinite',
              }} />
              ONE PLAN
            </span>
          </div>
          <div style={{ padding: '16px 18px 18px' }}>
            <Stamp color="var(--accent-2)" rotate={-3}
                   style={{ alignSelf: 'flex-start', marginBottom: 10 }}>
              every kind of plan
            </Stamp>
            <h1 style={{
              fontFamily: 'var(--cf-display)', fontWeight: 900,
              fontSize: 36, lineHeight: 0.92, letterSpacing: '-0.045em',
              margin: '0 0 8px',
            }}>One plan.<br/>
              <span style={{ color: 'var(--accent-1)' }}>Every kind<br/>of plan.</span></h1>
            <p style={{
              fontFamily: 'var(--cf-ui)', fontSize: 14, fontWeight: 700,
              margin: '0 0 4px', lineHeight: 1.3,
            }}>$9.99/month.</p>
            <p style={{
              fontFamily: 'var(--cf-ui)', fontSize: 14, fontWeight: 600,
              opacity: 0.75, margin: 0, lineHeight: 1.4,
            }}>Nights out, family days, kids parties, cookouts, game nights,
              backyard hangs, special occasions.</p>

            {/* Billing toggle */}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <PriceTier
                label="monthly" price="$9.99" sub="/mo · cancel any time"
                active={billing === 'monthly'}
                onClick={() => setBilling('monthly')} />
              <PriceTier
                label="yearly" price="$99" sub="/yr · save 17%"
                hot
                active={billing === 'yearly'}
                onClick={() => setBilling('yearly')} />
            </div>
          </div>
        </div>

        {/* What's included */}
        <div style={{
          fontFamily: 'var(--cf-mono)', fontSize: 11, fontWeight: 800,
          letterSpacing: '.16em', opacity: 0.55, textTransform: 'uppercase',
          marginBottom: 10,
        }}>WHAT'S INCLUDED · 24 BENEFITS</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
          {ALLACCESS_FEATURES.map((f, i) => (
            <div key={i} style={{
              display: 'flex', gap: 10, alignItems: 'flex-start',
              padding: '10px 12px',
              border: '2px solid var(--ink)', borderRadius: 10,
              background: 'var(--paper)',
            }}>
              <span style={{ fontSize: 18, lineHeight: 1, width: 22, flexShrink: 0 }}>{f.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 900,
                  letterSpacing: '-0.01em', lineHeight: 1.2,
                }}>{f.h}</div>
                <div style={{
                  fontFamily: 'var(--cf-ui)', fontSize: 11, fontWeight: 700,
                  opacity: 0.6, marginTop: 1,
                }}>{f.s}</div>
              </div>
              <span style={{
                fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 14,
                color: 'var(--accent-1)', marginTop: 2,
              }}>✓</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 2, padding: '0 24px' }}>
        <button onClick={onSubscribe} style={{
          appearance: 'none', cursor: 'pointer', width: '100%',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          padding: '18px 22px',
          border: '3px solid var(--ink)', borderRadius: 16,
          background: 'var(--accent-1)', color: 'var(--ink)',
          fontFamily: 'var(--cf-ui)', fontSize: 17, fontWeight: 900,
          boxShadow: '5px 5px 0 var(--ink)',
        }}>
          start planning · {billing === 'yearly' ? '$99/yr' : '$9.99/mo'}
          {Icons.arrow}
        </button>
        <div style={{
          marginTop: 10, textAlign: 'center',
          fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 700,
          opacity: 0.6, letterSpacing: '.08em',
        }}>7-DAY FREE TRIAL · STRIPE · CANCEL FROM SETTINGS</div>
      </div>
    </div>
  );
}

function PriceTier({ label, price, sub, hot, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      appearance: 'none', cursor: 'pointer', textAlign: 'left',
      flex: 1, padding: 12,
      border: '3px solid var(--ink)', borderRadius: 14,
      background: active ? (hot ? 'var(--accent-2)' : 'var(--accent-1)') : 'var(--paper)',
      boxShadow: active ? '4px 4px 0 var(--ink)' : '0 0 0 var(--ink)',
      transform: active ? 'translate(-1px,-1px)' : 'none',
      transition: 'all .12s',
      position: 'relative', color: 'var(--ink)',
    }}>
      {hot && (
        <span style={{
          position: 'absolute', top: -10, right: 10,
          padding: '2px 10px',
          background: 'var(--ink)', color: 'var(--paper)',
          border: '2px solid var(--ink)', borderRadius: 999,
          fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
          letterSpacing: '.14em',
        }}>SAVE 17%</span>
      )}
      <div style={{
        fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
        letterSpacing: '.14em', opacity: 0.6, textTransform: 'uppercase',
      }}>{label}</div>
      <div style={{
        fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 28,
        letterSpacing: '-0.035em', lineHeight: 1, marginTop: 4,
      }}>{price}</div>
      <div style={{
        fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 700,
        opacity: 0.65, marginTop: 4, letterSpacing: '.04em',
      }}>{sub}</div>
    </button>
  );
}

Object.assign(window, {
  ModePill, MODES, FamilyBanner, FamilyPortals,
  FAMILY_PORTALS, FamilyPlanScreen, FamilyPassScreen,
  KidsPassUpgradeScreen,
});
