// learn.jsx — Learn & Explore section for Family Mode
// Library days, STEM fun, museums, classes, and kid-friendly learning plans.

const { useState: useStateL } = React;

// ─── Library data ─────────────────────────────────────────────
const LIBRARIES = [
  {
    id: 'bpl-central', name: 'BPL Central',
    branch: 'Grand Army Plaza · 0.4 mi',
    hours: 'Open · closes 8 PM',
    storyTimes: [
      { day: 'today', time: '10:30 AM', age: '0-2 babies' },
      { day: 'today', time: '11:30 AM', age: '2-5 toddlers' },
      { day: 'sat', time: '11:00 AM', age: 'family · sign' },
    ],
    kidsArea: 'Youth Wing · 2nd floor · big',
    upcoming: [
      'LEGO build · sun 2 PM',
      'Author reading: Mac Barnett · thu',
    ],
    parking: '15-min street + paid lot',
    quiet: 'medium', // medium / high / low
    free: true,
    c: 'var(--accent-1)',
  },
  {
    id: 'bpl-park-slope', name: 'Park Slope Branch',
    branch: '6th Ave · 1.1 mi',
    hours: 'Open · closes 6 PM',
    storyTimes: [
      { day: 'today', time: '10:00 AM', age: '0-3' },
      { day: 'wed', time: '4:00 PM', age: 'after-school' },
    ],
    kidsArea: 'Cozy nook · small but bright',
    upcoming: [
      'Homework help · weekdays 3-5',
      'Summer reading kickoff · jun 1',
    ],
    parking: 'street only · tough',
    quiet: 'high',
    free: true,
    c: 'var(--accent-2)',
  },
  {
    id: 'bpl-bcl', name: 'Brooklyn Children\'s Library',
    branch: 'BedStuy · 1.8 mi',
    hours: 'Open · closes 7 PM',
    storyTimes: [
      { day: 'today', time: '11:00 AM', age: '3-5 · spanish' },
      { day: 'today', time: '2:00 PM', age: 'k-2 readers' },
    ],
    kidsArea: 'Entire library is kids',
    upcoming: [
      'Coding for kids · sat 1 PM · free',
      'Art class drop-in · sun all day',
    ],
    parking: 'free lot · 20 spots',
    quiet: 'low',
    free: true,
    c: 'var(--accent-3)',
  },
];

// ─── Education venue data ─────────────────────────────────────
const EDU_VENUES = [
  {
    id: 'ed-bcm', name: 'BK Children\'s Museum',
    type: 'museum', age: '2-10', price: '$16/kid · $12 adult',
    schedule: 'Wed-Sun · 10-5',
    reg: 'walk-in', effort: 'low',
    kids: 'sensory rooms, water play, climbable map',
    parents: 'café, restrooms every floor, stroller parking',
    learning: 'sensory + social skills · light science',
    c: 'var(--accent-3)',
  },
  {
    id: 'ed-stem', name: 'Code Ninjas Williamsburg',
    type: 'STEM · coding', age: '7-14', price: '$32/class',
    schedule: 'sat 10 AM · 90m',
    reg: 'required · drop-off', effort: 'low',
    kids: 'minecraft + scratch coding · earn belts',
    parents: 'café next door · drop and go',
    learning: 'logic, sequence, problem-solving',
    c: 'var(--accent-1)',
  },
  {
    id: 'ed-art', name: 'Tiny Picassos · Cobble Hill',
    type: 'art class', age: '3-7', price: '$28 · drop-in ok',
    schedule: 'mon/wed/fri · 4 PM',
    reg: 'walk-in', effort: 'medium · parent stays',
    kids: 'real paint, real mess, take work home',
    parents: 'open studio · join in',
    learning: 'fine motor, creative confidence',
    c: 'var(--accent-2)',
  },
  {
    id: 'ed-nature', name: 'Prospect Park Audubon',
    type: 'nature center', age: 'all', price: 'free',
    schedule: 'daily · 12-4',
    reg: 'walk-in', effort: 'low',
    kids: 'live turtles, birds, scavenger hunt sheet',
    parents: 'restrooms, shaded picnic, parking nearby',
    learning: 'biology · stewardship · observation',
    c: 'var(--accent-1)',
  },
  {
    id: 'ed-dance', name: 'Mark Morris Kids',
    type: 'dance', age: '3-12', price: '$240/8wk',
    schedule: 'mon-thu · varies',
    reg: 'semester signup', effort: 'low · drop-off',
    kids: 'real studio, real teachers, recital at end',
    parents: 'observation week 4 + 8',
    learning: 'rhythm, coordination, performance',
    c: 'var(--accent-2)',
  },
];

// ═════════════════════════════════════════════════════════════════
// Filter bar
// ═════════════════════════════════════════════════════════════════
const LEARN_FILTERS = {
  age: ['0-2', '3-5', '6-8', '9-12'],
  cost: ['free', 'paid'],
  setting: ['indoor', 'outdoor'],
  when: ['today', 'this wkend', 'after school'],
  drop: ['drop-in', 'register', 'drop-off ok'],
  needs: ['stroller ok', 'sensory-friendly', 'quiet'],
};

function LearnFilters({ active, onToggle }) {
  return (
    <div style={{
      display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none',
      marginRight: -22, paddingRight: 22, marginBottom: 14,
    }}>
      {Object.entries(LEARN_FILTERS).flatMap(([cat, vals]) =>
        vals.map(v => {
          const key = `${cat}:${v}`;
          const on = active.includes(key);
          return (
            <button key={key} onClick={() => onToggle(key)} style={{
              appearance: 'none', cursor: 'pointer', flexShrink: 0,
              padding: '6px 12px',
              border: '2px solid var(--ink)', borderRadius: 999,
              background: on ? 'var(--accent-1)' : 'var(--paper)',
              color: 'var(--ink)',
              fontFamily: 'var(--cf-ui)', fontSize: 11, fontWeight: 800,
            }}>{v}</button>
          );
        })
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// LearnExploreScreen
// ═════════════════════════════════════════════════════════════════
function LearnExploreScreen({ onBack, onPickPortal, onOpenLibrary, onOpenVenue }) {
  const [tab, setTab] = useStateL('plans');
  const [filters, setFilters] = useStateL([]);
  const toggleFilter = (k) =>
    setFilters(filters.includes(k) ? filters.filter(x => x !== k) : [...filters, k]);

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
        <Stamp color="var(--accent-2)" rotate={-2}>family · learn</Stamp>
        <span style={{ width: 36 }} />
      </div>

      <h2 style={{
        position: 'relative', zIndex: 2,
        fontFamily: 'var(--cf-display)', fontWeight: 900,
        fontSize: 36, lineHeight: 0.95, letterSpacing: '-0.04em',
        color: 'var(--ink)', margin: '0 0 4px',
      }}>Learn & Explore.</h2>
      <p style={{
        position: 'relative', zIndex: 2,
        fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 600,
        color: 'var(--ink)', opacity: 0.7, margin: '0 0 14px', maxWidth: 320,
      }}>Library days, STEM fun, museums, classes, and kid-friendly learning plans — without the search spiral.</p>

      {/* Tabs */}
      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', gap: 4, marginBottom: 12,
      }}>
        {[
          { id: 'plans',     l: 'plans' },
          { id: 'libraries', l: 'libraries' },
          { id: 'classes',   l: 'classes' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            appearance: 'none', cursor: 'pointer', flex: 1,
            padding: '8px 6px',
            border: '2.5px solid var(--ink)', borderRadius: 999,
            background: tab === t.id ? 'var(--ink)' : 'var(--paper)',
            color: tab === t.id ? 'var(--paper)' : 'var(--ink)',
            fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 800,
            boxShadow: tab === t.id ? '3px 3px 0 var(--accent-1)' : 'none',
            transform: tab === t.id ? 'translate(-1px,-1px)' : 'none',
            transition: 'all .12s',
          }}>{t.l}</button>
        ))}
      </div>

      <div style={{
        position: 'relative', zIndex: 2,
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        marginRight: -22, paddingRight: 22, scrollbarWidth: 'none',
      }}>
        {(tab === 'libraries' || tab === 'classes') && (
          <LearnFilters active={filters} onToggle={toggleFilter} />
        )}

        {tab === 'plans' && (
          <>
            <div style={{
              fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
              letterSpacing: '.16em', textTransform: 'uppercase',
              color: 'var(--ink)', opacity: 0.55,
              marginBottom: 10,
            }}>11 PLAN TYPES · BUILT FOR PARENTS</div>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14,
            }}>
              {LEARN_PORTALS.map(p => (
                <button key={p.id} onClick={() => onPickPortal(p)} style={{
                  appearance: 'none', cursor: 'pointer', textAlign: 'left',
                  padding: 12,
                  border: '2.5px solid var(--ink)', borderRadius: 14,
                  background: 'var(--paper)', color: 'var(--ink)',
                  boxShadow: '4px 4px 0 var(--ink)',
                  display: 'flex', flexDirection: 'column', gap: 2,
                  minHeight: 90,
                }}>
                  <span style={{ fontSize: 24, marginBottom: 2 }}>{p.icon}</span>
                  <span style={{
                    fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 15,
                    letterSpacing: '-0.025em', lineHeight: 1.05,
                  }}>{p.label}</span>
                  <span style={{
                    fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
                    opacity: 0.55, letterSpacing: '.08em', marginTop: 'auto',
                    textTransform: 'uppercase',
                  }}>{p.sub}</span>
                </button>
              ))}
            </div>

            {/* Highlight: free family learning day */}
            <div style={{
              padding: 14, marginBottom: 8,
              border: '3px solid var(--ink)', borderRadius: 14,
              background: 'var(--accent-2)',
              boxShadow: '4px 4px 0 var(--ink)',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
                letterSpacing: '.14em', opacity: 0.7, textTransform: 'uppercase',
                marginBottom: 4,
              }}><span style={{ color: 'var(--accent-1)' }}>✣</span> auto-plan for this saturday</div>
              <div style={{
                fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 19,
                letterSpacing: '-0.025em', lineHeight: 1,
              }}>Free Family Learning Day</div>
              <div style={{
                fontFamily: 'var(--cf-ui)', fontSize: 13, fontWeight: 700,
                opacity: 0.75, marginTop: 4, lineHeight: 1.4,
              }}>Library story time → nature center → picnic at Prospect Park.
                4h · $0 · 1.6 mi walkable.</div>
              <button onClick={() => onPickPortal({ id: 'l-free' })} style={{
                appearance: 'none', cursor: 'pointer', marginTop: 10,
                padding: '7px 12px',
                border: '2.5px solid var(--ink)', borderRadius: 999,
                background: 'var(--ink)', color: 'var(--paper)',
                fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 800,
              }}>print this pass →</button>
            </div>
          </>
        )}

        {tab === 'libraries' && (
          <>
            <div style={{
              fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
              letterSpacing: '.16em', textTransform: 'uppercase',
              color: 'var(--ink)', opacity: 0.55,
              marginBottom: 10,
            }}>3 LIBRARIES NEAR YOU · ALL FREE</div>
            {LIBRARIES.map(lib => (
              <LibraryCard key={lib.id} lib={lib} onOpen={() => onOpenLibrary(lib)} />
            ))}
          </>
        )}

        {tab === 'classes' && (
          <>
            <div style={{
              fontFamily: 'var(--cf-mono)', fontSize: 10, fontWeight: 800,
              letterSpacing: '.16em', textTransform: 'uppercase',
              color: 'var(--ink)', opacity: 0.55,
              marginBottom: 10,
            }}>5 PROGRAMS · STEM · ART · MUSIC · NATURE · DANCE</div>
            {EDU_VENUES.map(v => (
              <EduVenueCard key={v.id} v={v} onOpen={() => onOpenVenue(v)} />
            ))}
          </>
        )}

        <div style={{ height: 8 }} />
      </div>
    </div>
  );
}

// ─── Library card ───────────────────────────────────────────────
function LibraryCard({ lib, onOpen }) {
  return (
    <div style={{
      padding: 14, marginBottom: 10,
      border: '2.5px solid var(--ink)', borderRadius: 14,
      background: 'var(--paper)',
      boxShadow: '4px 4px 0 var(--ink)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        gap: 10, marginBottom: 10,
      }}>
        <div style={{
          width: 44, height: 44, flexShrink: 0,
          borderRadius: 10, border: '2.5px solid var(--ink)',
          background: lib.c,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22,
        }}>📚</div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 17,
            letterSpacing: '-0.025em', lineHeight: 1.05,
          }}>{lib.name}</div>
          <div style={{
            fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
            opacity: 0.6, marginTop: 2, letterSpacing: '.08em',
            textTransform: 'uppercase',
          }}>{lib.branch}</div>
        </div>
        <span style={{
          padding: '3px 8px',
          background: 'var(--accent-4, #2bb673)', color: 'var(--paper)',
          border: '2px solid var(--ink)', borderRadius: 4,
          fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
          letterSpacing: '.08em',
        }}>FREE</span>
      </div>

      <div style={{
        display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10,
      }}>
        <Pill bg="var(--paper)">{lib.hours}</Pill>
        <Pill bg="var(--accent-2)">📖 {lib.kidsArea.split(' · ')[0]}</Pill>
        <Pill bg="var(--paper)">🔉 {lib.quiet} quiet</Pill>
        <Pill bg="var(--paper)">🅿 {lib.parking.split(' · ')[0]}</Pill>
      </div>

      {/* Today's story times */}
      <div style={{
        padding: 10,
        background: 'var(--bg)',
        border: '2px dashed var(--ink)', borderRadius: 10,
        marginBottom: 10,
      }}>
        <div style={{
          fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
          letterSpacing: '.14em', opacity: 0.55,
          textTransform: 'uppercase', marginBottom: 6,
        }}>STORY TIME · TODAY</div>
        {lib.storyTimes.filter(s => s.day === 'today').map((s, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '4px 0',
            fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 700,
          }}>
            <span style={{
              fontFamily: 'var(--cf-mono)', fontWeight: 800, fontSize: 11,
              width: 64,
            }}>{s.time}</span>
            <span style={{ flex: 1 }}>{s.age}</span>
            <span style={{
              padding: '2px 7px',
              background: 'var(--accent-1)',
              border: '1.5px solid var(--ink)', borderRadius: 999,
              fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
              letterSpacing: '.08em',
            }}>signup</span>
          </div>
        ))}
        {lib.storyTimes.filter(s => s.day !== 'today').slice(0, 1).map((s, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '4px 0', opacity: 0.6,
            fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 700,
            borderTop: '1px dashed rgba(0,0,0,0.15)', marginTop: 4, paddingTop: 8,
          }}>
            <span style={{
              fontFamily: 'var(--cf-mono)', fontWeight: 800, fontSize: 11,
              width: 64,
            }}>{s.day} · {s.time}</span>
            <span style={{ flex: 1 }}>{s.age}</span>
          </div>
        ))}
      </div>

      {/* Upcoming events */}
      <div style={{ marginBottom: 12 }}>
        <div style={{
          fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
          letterSpacing: '.14em', opacity: 0.55,
          textTransform: 'uppercase', marginBottom: 4,
        }}>UPCOMING · FREE</div>
        {lib.upcoming.map((u, i) => (
          <div key={i} style={{
            fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 700,
            padding: '3px 0',
            color: 'var(--ink)',
          }}>· {u}</div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onOpen} style={{
          appearance: 'none', cursor: 'pointer', flex: 1,
          padding: '9px 12px',
          border: '2.5px solid var(--ink)', borderRadius: 12,
          background: 'var(--accent-1)', color: 'var(--ink)',
          fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 900,
          boxShadow: '3px 3px 0 var(--ink)',
        }}>+ add to plan</button>
        <button style={{
          appearance: 'none', cursor: 'pointer',
          padding: '9px 12px',
          border: '2.5px solid var(--ink)', borderRadius: 12,
          background: 'var(--paper)',
          fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 800,
        }}>↗ open</button>
      </div>
    </div>
  );
}

// ─── Edu venue card ───────────────────────────────────────────
function EduVenueCard({ v, onOpen }) {
  return (
    <div style={{
      padding: 14, marginBottom: 10,
      border: '2.5px solid var(--ink)', borderRadius: 14,
      background: 'var(--paper)',
      boxShadow: '4px 4px 0 var(--ink)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10,
      }}>
        <div style={{
          width: 44, height: 44, flexShrink: 0,
          borderRadius: 10, border: '2.5px solid var(--ink)',
          background: v.c,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22,
        }}>{ {museum: '🏛', 'STEM · coding': '🔬', 'art class': '🎨',
               'nature center': '🦋', dance: '💃' }[v.type] || '📚' }</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--cf-display)', fontWeight: 900, fontSize: 17,
            letterSpacing: '-0.025em', lineHeight: 1.05,
          }}>{v.name}</div>
          <div style={{
            fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
            opacity: 0.6, marginTop: 2, letterSpacing: '.1em',
            textTransform: 'uppercase',
          }}>{v.type}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontFamily: 'var(--cf-mono)', fontSize: 11, fontWeight: 800,
          }}>{v.price.split(' · ')[0]}</div>
          <div style={{
            fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 700,
            opacity: 0.55, marginTop: 2, letterSpacing: '.06em',
          }}>AGE {v.age}</div>
        </div>
      </div>

      <div style={{
        display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10,
      }}>
        <Pill bg="var(--accent-2)">📅 {v.schedule}</Pill>
        <Pill bg="var(--paper)">📝 {v.reg}</Pill>
        <Pill bg="var(--paper)">💪 {v.effort.split(' · ')[0]} effort</Pill>
      </div>

      <div style={{
        padding: 10, marginBottom: 10,
        border: '2px dashed var(--ink)', borderRadius: 10,
        background: 'var(--bg)',
      }}>
        <WhyRow icon="🧒" label="kids" body={v.kids} />
        <WhyRow icon="👨‍👩‍👧" label="parents" body={v.parents} />
        <WhyRow icon="🧠" label="learning" body={v.learning} bold />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onOpen} style={{
          appearance: 'none', cursor: 'pointer', flex: 1,
          padding: '9px 12px',
          border: '2.5px solid var(--ink)', borderRadius: 12,
          background: 'var(--accent-1)', color: 'var(--ink)',
          fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 900,
          boxShadow: '3px 3px 0 var(--ink)',
        }}>+ add to plan</button>
        <button style={{
          appearance: 'none', cursor: 'pointer',
          padding: '9px 12px',
          border: '2.5px solid var(--ink)', borderRadius: 12,
          background: 'var(--paper)',
          fontFamily: 'var(--cf-ui)', fontSize: 12, fontWeight: 800,
        }}>☆ save</button>
      </div>
    </div>
  );
}

function WhyRow({ icon, label, body, bold }) {
  return (
    <div style={{
      display: 'flex', gap: 8, padding: '3px 0',
      fontFamily: 'var(--cf-ui)', fontSize: 12,
    }}>
      <span style={{ fontSize: 13, lineHeight: 1.2, width: 16 }}>{icon}</span>
      <div style={{ flex: 1, lineHeight: 1.35 }}>
        <span style={{
          fontFamily: 'var(--cf-mono)', fontSize: 9, fontWeight: 800,
          letterSpacing: '.12em', opacity: 0.55, textTransform: 'uppercase',
          marginRight: 6,
        }}>{label}</span>
        <span style={{ fontWeight: bold ? 900 : 700 }}>{body}</span>
      </div>
    </div>
  );
}

function Pill({ bg, children }) {
  return (
    <span style={{
      padding: '4px 10px',
      background: bg, color: 'var(--ink)',
      border: '2px solid var(--ink)', borderRadius: 999,
      fontFamily: 'var(--cf-ui)', fontSize: 11, fontWeight: 800,
    }}>{children}</span>
  );
}

Object.assign(window, {
  LEARN_PORTALS, LIBRARIES, EDU_VENUES,
  LearnExploreScreen, LibraryCard, EduVenueCard,
});
