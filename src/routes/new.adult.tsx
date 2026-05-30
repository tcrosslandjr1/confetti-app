import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Frame, TOKENS, DotsBg, Stamp } from "@/components/new-confetti/shell";

// Ported from design/new-confetti/project/confetti-code/adult.jsx
export const Route = createFileRoute("/new/adult")({ component: AdultPage });

// ─── Life Mode chips ──────────────────────────────────────────────
const LIFE_MODES = [
  { id:"go-out",     icon:"🌃", label:"go out" },
  { id:"stay-in",    icon:"🏠", label:"stay in" },
  { id:"host",       icon:"🍽", label:"host" },
  { id:"recharge",   icon:"🌿", label:"recharge" },
  { id:"date",       icon:"🌹", label:"date" },
  { id:"friends",    icon:"👯", label:"friends" },
  { id:"celebrate",  icon:"🎉", label:"celebrate" },
  { id:"productive", icon:"✏", label:"productive" },
  { id:"try-new",    icon:"✨", label:"try new" },
] as const;

// ─── Adult plan sections ──────────────────────────────────────────
interface Portal { id: string; icon: string; label: string; sub: string; }
interface Section {
  id: string; icon: string; label: string; sub: string;
  color: string; portals: Portal[];
}

const ADULT_SECTIONS: Section[] = [
  { id:"tonight", icon:"🌙", label:"Tonight",
    sub:"right-sized for your mood, weather, budget", color:TOKENS.accent1,
    portals:[
      {id:"date-night", icon:"🌹", label:"date night",  sub:"walkable · romantic"},
      {id:"happy-hour", icon:"🍸", label:"happy hour",  sub:"5-8 PM · 2-stop"},
      {id:"live-music", icon:"🎷", label:"live music",  sub:"tonight's sets"},
      {id:"sports-bar", icon:"🏈", label:"sports bar",  sub:"game on, food good"},
      {id:"comedy",     icon:"🎤", label:"comedy show", sub:"cheap, dive vibe"},
      {id:"first-date", icon:"👋", label:"first date",  sub:"low pressure · 2h"},
    ] },
  { id:"tourist", icon:"🗽", label:"Tourist",
    sub:'you or visiting friends · "playing tourist"', color:TOKENS.accent2,
    portals:[
      {id:"first-time",  icon:"🗽", label:"first time NYC",   sub:"classics · 1 day"},
      {id:"visiting",    icon:"✈",  label:"visiting friends",  sub:"hosting guests"},
      {id:"iconic",      icon:"🏛", label:"iconic landmarks",  sub:"top 10 in 6h"},
      {id:"hidden-tour", icon:"🤫", label:"hidden city",       sub:"what locals do"},
      {id:"foodie-tour", icon:"🍜", label:"foodie tour",       sub:"5 stops · neighborhood"},
      {id:"archi-walk",  icon:"🏙", label:"architecture",      sub:"walking tour"},
      {id:"sunset-spots",icon:"🌅", label:"sunset spots",      sub:"best views"},
      {id:"rainy-tourist",icon:"🌧",label:"rainy day",         sub:"indoor only"},
      {id:"kid-tourist", icon:"🧒", label:"with kids",         sub:"family · stroller"},
    ] },
  { id:"host", icon:"🍽", label:"Host",
    sub:"a clean house, good food, and people you love", color:TOKENS.accent2,
    portals:[
      {id:"dinner-party",icon:"🍝", label:"dinner party",    sub:"4-8 guests · 3h"},
      {id:"cookout",     icon:"🔥", label:"cookout / BBQ",   sub:"backyard, 6h"},
      {id:"crabs",       icon:"🦀", label:"crab boil",       sub:"newspaper · mallet"},
      {id:"wine-night",  icon:"🍷", label:"wine night",      sub:"6 bottles · 4 friends"},
      {id:"game-night",  icon:"🎲", label:"game night",      sub:"right-sized to group"},
      {id:"bday-home",   icon:"🎂", label:"birthday @ home", sub:"full planner"},
    ] },
  { id:"recharge", icon:"🌿", label:"Recharge",
    sub:"solo day, spa, walk, bookstore, slow coffee", color:TOKENS.accent3,
    portals:[
      {id:"solo",        icon:"🧘", label:"solo recharge",      sub:"3 stops, no pressure"},
      {id:"spa",         icon:"💆", label:"spa day",             sub:"half-day plan"},
      {id:"gym-smoothie",icon:"💪", label:"gym + smoothie",      sub:"90m · fast"},
      {id:"book-coffee", icon:"📚", label:"bookstore + coffee",  sub:"sat morning"},
      {id:"walk",        icon:"🚶", label:"long walk",           sub:"route + podcast"},
      {id:"quiet-dinner",icon:"🕯", label:"quiet dinner",        sub:"solo or pair"},
    ] },
  { id:"culture", icon:"🎭", label:"Culture",
    sub:"museums, theater, galleries, talks, classes", color:TOKENS.accent1,
    portals:[
      {id:"museum",     icon:"🏛", label:"museum + lunch",  sub:"half-day"},
      {id:"gallery",    icon:"🖼", label:"gallery hop",     sub:"walkable district"},
      {id:"theater",    icon:"🎭", label:"theater night",   sub:"pre-show meal"},
      {id:"cocktail-c", icon:"🍹", label:"cocktail class",  sub:"date-friendly"},
      {id:"cook-class", icon:"👨‍🍳", label:"cooking class",  sub:"pasta · sushi · etc"},
      {id:"art-night",  icon:"🎨", label:"art night",       sub:"sip + paint"},
    ] },
  { id:"social", icon:"👯", label:"Social",
    sub:"friends night, brunch, group hangs, doubles", color:TOKENS.accent2,
    portals:[
      {id:"girls-night", icon:"💋", label:"girls night",  sub:"3-stop, dressed up"},
      {id:"guys-night",  icon:"🍺", label:"guys night",   sub:"wings + game"},
      {id:"double-date", icon:"👫", label:"double date",  sub:"low-key · 3h"},
      {id:"brunch",      icon:"🥞", label:"brunch",       sub:"walk-in friendly"},
      {id:"group-hang",  icon:"👥", label:"group hang",   sub:"8+ people"},
      {id:"network",     icon:"🤝", label:"networking",   sub:"quiet, low alc"},
    ] },
  { id:"milestones", icon:"🎉", label:"Milestones",
    sub:"anniversaries, birthdays, weddings, retirements", color:TOKENS.accent3,
    portals:[
      {id:"anniversary", icon:"💍", label:"anniversary",        sub:"their favorites"},
      {id:"birthday-d",  icon:"🎂", label:"birthday dinner",    sub:"reserve early"},
      {id:"proposal",    icon:"💎", label:"proposal night",     sub:"photographer opt."},
      {id:"bachelor",    icon:"🎲", label:"bach party",         sub:"1 or 2 day"},
      {id:"wedding-wk",  icon:"👰", label:"wedding wkend",      sub:"OOT guest plan"},
      {id:"retirement",  icon:"🥂", label:"retirement",         sub:"send-off plan"},
      {id:"tailgate",    icon:"🏟", label:"tailgate",           sub:"pack list inc."},
      {id:"parents-no",  icon:"👨‍👩‍👧", label:"parents' night out", sub:"sitter arranged"},
      {id:"empty-nest",  icon:"🌅", label:"empty-nester",       sub:"rediscover day"},
    ] },
];

type LifeModeId = typeof LIFE_MODES[number]["id"];
const FOCUS_MAP: Record<LifeModeId, string[]> = {
  "go-out":     ["tonight","social","culture"],
  "stay-in":    ["host","recharge"],
  "host":       ["host","milestones"],
  "recharge":   ["recharge","culture"],
  "date":       ["tonight","milestones"],
  "friends":    ["social","tonight"],
  "celebrate":  ["milestones","host"],
  "productive": ["recharge"],
  "try-new":    ["culture","tonight"],
};

// ─── LifeModeChips ────────────────────────────────────────────────
function LifeModeChips({ value, onChange }: { value: LifeModeId; onChange: (id: LifeModeId) => void }) {
  return (
    <div style={{ display:"flex", gap:6, overflowX:"auto", scrollbarWidth:"none",
      marginRight:-22, paddingRight:22, paddingBottom:2 }}>
      {LIFE_MODES.map(m => {
        const on = value === m.id;
        return (
          <button key={m.id} onClick={() => onChange(m.id)} style={{ appearance:"none",
            cursor:"pointer", flexShrink:0, display:"inline-flex", alignItems:"center", gap:5,
            padding:"7px 12px", border:`2.5px solid ${TOKENS.ink}`, borderRadius:999,
            background:on ? TOKENS.accent1 : TOKENS.paper, color:TOKENS.ink,
            fontFamily:TOKENS.ui, fontSize:12, fontWeight:800,
            boxShadow:on ? `3px 3px 0 ${TOKENS.ink}` : "none",
            transform:on ? "translate(-1px,-1px)" : "none", transition:"all .12s" }}>
            <span style={{ fontSize:14 }}>{m.icon}</span>{m.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── AdultSection ─────────────────────────────────────────────────
function AdultSection({ section, focused, picked, onPick }:
  { section: Section; focused: boolean; picked: string[]; onPick: (p: Portal, s: Section) => void }) {
  const portals = focused ? section.portals : section.portals.slice(0,3);
  return (
    <div style={{ marginBottom:18, opacity:focused?1:0.85 }}>
      <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", marginBottom:8 }}>
        <h3 style={{ margin:0, fontFamily:TOKENS.display, fontWeight:900, fontSize:22,
          letterSpacing:"-0.03em", display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ width:30, height:30, borderRadius:8,
            border:`2px solid ${TOKENS.ink}`, background:section.color,
            display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>
            {section.icon}
          </span>
          {section.label}
        </h3>
        <span style={{ fontFamily:TOKENS.mono, fontSize:9, fontWeight:700, opacity:0.55,
          letterSpacing:".1em", textAlign:"right" as const }}>{section.portals.length} PLAN TYPES</span>
      </div>
      <div style={{ fontFamily:TOKENS.ui, fontSize:12, fontWeight:600,
        opacity:0.65, marginBottom:10, lineHeight:1.3 }}>{section.sub}</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
        {portals.map(p => {
          const on = picked.includes(p.label);
          return (
            <button key={p.id} onClick={() => onPick(p, section)} style={{ appearance:"none",
              cursor:"pointer", textAlign:"left" as const, padding:10,
              border:`2.5px solid ${TOKENS.ink}`, borderRadius:12,
              background:on ? TOKENS.accent1 : TOKENS.paper, color:TOKENS.ink,
              boxShadow:on ? `4px 4px 0 ${TOKENS.ink}` : `3px 3px 0 ${TOKENS.ink}`,
              transform:on ? "translate(-1px,-1px)" : "none", transition:"all .12s",
              display:"flex", flexDirection:"column", gap:2, minHeight:78, position:"relative" }}>
              {on && (
                <span style={{ position:"absolute", top:6, right:6, width:18, height:18,
                  borderRadius:999, background:TOKENS.ink, color:TOKENS.paper,
                  display:"inline-flex", alignItems:"center", justifyContent:"center",
                  fontSize:11, fontWeight:900 }}>✓</span>
              )}
              <span style={{ fontSize:20, marginBottom:2 }}>{p.icon}</span>
              <span style={{ fontFamily:TOKENS.ui, fontSize:12, fontWeight:900,
                letterSpacing:"-0.01em", lineHeight:1.05 }}>{p.label}</span>
              <span style={{ fontFamily:TOKENS.mono, fontSize:9, fontWeight:700, opacity:0.55,
                letterSpacing:".05em", marginTop:"auto" }}>{p.sub}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Command Center tab panels ────────────────────────────────────
function CCSavedSpots() {
  const lists = [
    {name:"Date-night rooftops",n:6,color:TOKENS.accent1},
    {name:"Quiet brunch",n:8,color:TOKENS.accent2},
    {name:"Always good",n:12,color:TOKENS.accent3},
    {name:"Walking distance",n:4,color:TOKENS.accent2},
  ];
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
      {lists.map((l,i) => (
        <div key={i} style={{ padding:12, border:`2.5px solid ${TOKENS.ink}`, borderRadius:14,
          background:l.color, color:TOKENS.ink, boxShadow:`3px 3px 0 ${TOKENS.ink}` }}>
          <div style={{ fontFamily:TOKENS.mono, fontSize:9, fontWeight:800, letterSpacing:".14em",
            opacity:0.7, textTransform:"uppercase" as const }}>LIST · {l.n} SPOTS</div>
          <div style={{ fontFamily:TOKENS.display, fontWeight:900, fontSize:16,
            letterSpacing:"-0.025em", marginTop:4, lineHeight:1.05 }}>{l.name}</div>
        </div>
      ))}
      <button style={{ appearance:"none", cursor:"pointer", padding:12, gridColumn:"1 / -1",
        border:`2.5px dashed ${TOKENS.ink}`, borderRadius:14, background:"transparent",
        fontFamily:TOKENS.ui, fontSize:13, fontWeight:800 }}>＋ new list</button>
    </div>
  );
}

function CCPeople() {
  const crews = [
    {name:"The 4",members:["maya","devon","sam"],color:TOKENS.accent1,lastSeen:"3d",favVibe:"foodie · loud"},
    {name:"Date · Sam",members:["sam"],color:TOKENS.accent3,lastSeen:"11d",favVibe:"jazz · low light"},
    {name:"Sun brunch",members:["rio","alex"],color:TOKENS.accent2,lastSeen:"6d",favVibe:"brunch · walk"},
  ];
  return (
    <div>
      {crews.map((c,i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:12, marginBottom:8,
          border:`2.5px solid ${TOKENS.ink}`, borderRadius:14, background:TOKENS.paper,
          boxShadow:`3px 3px 0 ${TOKENS.ink}` }}>
          <div style={{ width:44, height:44, borderRadius:999, border:`2.5px solid ${TOKENS.ink}`,
            background:c.color, display:"flex", alignItems:"center", justifyContent:"center",
            fontFamily:TOKENS.display, fontWeight:900, fontSize:16, color:TOKENS.ink }}>
            {c.name[0]}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:TOKENS.display, fontWeight:900, fontSize:16, letterSpacing:"-0.025em" }}>{c.name}</div>
            <div style={{ fontFamily:TOKENS.mono, fontSize:10, fontWeight:700, opacity:0.55, marginTop:2,
              letterSpacing:".06em", textTransform:"uppercase" as const }}>
              {c.members.length} ppl · last {c.lastSeen} · {c.favVibe}
            </div>
          </div>
          <button style={{ appearance:"none", cursor:"pointer", padding:"6px 10px",
            border:`2px solid ${TOKENS.ink}`, borderRadius:999, background:TOKENS.accent1,
            fontFamily:TOKENS.ui, fontSize:11, fontWeight:800 }}>+ plan</button>
        </div>
      ))}
    </div>
  );
}

function PrefBlock({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ padding:12, border:`2.5px solid ${TOKENS.ink}`, borderRadius:12,
      background:TOKENS.paper, boxShadow:`3px 3px 0 ${TOKENS.ink}` }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ fontFamily:TOKENS.display, fontWeight:900, fontSize:15, letterSpacing:"-0.02em" }}>{title}</div>
        <button style={{ appearance:"none", cursor:"pointer", background:"transparent", border:"none",
          fontFamily:TOKENS.mono, fontSize:11, fontWeight:800, opacity:0.55, textDecoration:"underline" }}>edit</button>
      </div>
      <div style={{ fontFamily:TOKENS.ui, fontSize:12, fontWeight:700, opacity:0.75, marginTop:4, lineHeight:1.4 }}>{body}</div>
    </div>
  );
}

function CCPrefs() {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <PrefBlock title="Budget" body="$$ default · cap $150/night · split with crew on"/>
      <PrefBlock title="Dietary" body="pescatarian · gluten-flexible · 1 nut allergy (Sam)"/>
      <PrefBlock title="Date night" body="Always: rooftop ok · low-fi music · later than 9 · split bill"/>
      <PrefBlock title="Hosting" body="Default 6 ppl · BYOB · playlist auto · phones off after 9"/>
      <PrefBlock title="Energy" body="Tonight: medium · weekend: high · sundays: solo recharge"/>
    </div>
  );
}

function CCHostTemplates() {
  const tmpl = [
    {n:"Dinner for 6",  sub:"3-course · 4h · $180",icon:"🍝",c:TOKENS.accent1},
    {n:"Wine night · 4",sub:"6 bottles · 3h",       icon:"🍷",c:TOKENS.accent3},
    {n:"Crab boil · 8", sub:"newspaper · butter",   icon:"🦀",c:TOKENS.accent2},
    {n:"Game night · 10",sub:"4 games · pizza",     icon:"🎲",c:TOKENS.accent2},
    {n:"Birthday at home",sub:"cake, drinks, 12 ppl",icon:"🎂",c:TOKENS.accent1},
  ];
  return (
    <div>
      {tmpl.map((t,i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:12, marginBottom:8,
          border:`2.5px solid ${TOKENS.ink}`, borderRadius:12, background:t.c, color:TOKENS.ink,
          boxShadow:`3px 3px 0 ${TOKENS.ink}` }}>
          <span style={{ width:40, height:40, borderRadius:8, border:`2px solid ${TOKENS.ink}`,
            background:TOKENS.paper, display:"inline-flex", alignItems:"center",
            justifyContent:"center", fontSize:20 }}>{t.icon}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:TOKENS.display, fontWeight:900, fontSize:15, letterSpacing:"-0.02em" }}>{t.n}</div>
            <div style={{ fontFamily:TOKENS.mono, fontSize:10, fontWeight:700, opacity:0.7, marginTop:2,
              letterSpacing:".08em", textTransform:"uppercase" as const }}>{t.sub}</div>
          </div>
          <button style={{ appearance:"none", cursor:"pointer", padding:"6px 12px",
            border:`2px solid ${TOKENS.ink}`, borderRadius:999, background:TOKENS.paper,
            fontFamily:TOKENS.ui, fontSize:11, fontWeight:800 }}>use →</button>
        </div>
      ))}
    </div>
  );
}

function CCUpcoming() {
  return (
    <div>
      <div style={{ padding:14, marginBottom:10, border:`3px solid ${TOKENS.ink}`, borderRadius:14,
        background:TOKENS.accent1, boxShadow:`4px 4px 0 ${TOKENS.ink}` }}>
        <div style={{ fontFamily:TOKENS.mono, fontSize:10, fontWeight:800, letterSpacing:".14em", opacity:0.7 }}>TONIGHT · 8:00 PM</div>
        <div style={{ fontFamily:TOKENS.display, fontWeight:900, fontSize:22, letterSpacing:"-0.03em", marginTop:2, lineHeight:1.05 }}>Date night · Sam</div>
        <div style={{ fontFamily:TOKENS.ui, fontSize:12, fontWeight:700, opacity:0.85, marginTop:4 }}>Lupa Notte · Quartz Room · pass #A7K2</div>
      </div>
      {[
        {d:"NEXT FRI",t:"Game night @ home · 8 ppl",sub:"TEMPLATE: game night · 10"},
        {d:"JUN 14",  t:"Maya's bach weekend",      sub:"NASHVILLE · 12 RSVP'D"},
        {d:"JUN 22",  t:"Anniversary · Sam",         sub:"BOOKED · LE COUCOU"},
      ].map((u,i) => (
        <div key={i} style={{ padding:12, marginBottom:8, border:`2px solid ${TOKENS.ink}`, borderRadius:12, background:TOKENS.paper }}>
          <div style={{ fontFamily:TOKENS.mono, fontSize:9, fontWeight:800, letterSpacing:".14em", opacity:0.55 }}>{u.d}</div>
          <div style={{ fontFamily:TOKENS.display, fontWeight:900, fontSize:16, letterSpacing:"-0.02em", marginTop:2 }}>{u.t}</div>
          <div style={{ fontFamily:TOKENS.mono, fontSize:10, fontWeight:700, opacity:0.55, marginTop:2, letterSpacing:".06em" }}>{u.sub}</div>
        </div>
      ))}
    </div>
  );
}

function CCVibeProfile() {
  const bars = [
    {l:"romantic",v:0.78},{l:"social",v:0.62},{l:"culture",v:0.55},{l:"foodie",v:0.91},
    {l:"hype",v:0.34},{l:"recharge",v:0.46},{l:"productive",v:0.28},{l:"walkable",v:0.82},
  ];
  return (
    <div>
      <div style={{ padding:14, marginBottom:14, border:`3px solid ${TOKENS.ink}`, borderRadius:14,
        background:TOKENS.accent2, boxShadow:`4px 4px 0 ${TOKENS.ink}` }}>
        <div style={{ fontFamily:TOKENS.mono, fontSize:10, fontWeight:800, letterSpacing:".14em",
          opacity:0.7, textTransform:"uppercase" as const }}>FROM 18 PASSES · 6-MO ROLLING</div>
        <div style={{ fontFamily:TOKENS.display, fontWeight:900, fontSize:22, letterSpacing:"-0.03em",
          marginTop:4, lineHeight:1.05 }}>
          You're a foodie who walks everywhere, mostly with a partner, on warmer nights.
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {bars.map(b => (
          <div key={b.l} style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontFamily:TOKENS.ui, fontSize:12, fontWeight:800, width:90 }}>{b.l}</span>
            <div style={{ flex:1, height:14, border:`2px solid ${TOKENS.ink}`, borderRadius:999,
              background:TOKENS.paper, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${b.v * 100}%`, background:TOKENS.accent1 }}/>
            </div>
            <span style={{ fontFamily:TOKENS.mono, fontSize:11, fontWeight:800, width:32, textAlign:"right" as const }}>
              {Math.round(b.v * 100)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

type CCTab = "saved" | "people" | "prefs" | "host" | "upcoming" | "vibe";

function CommandCenterScreen({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<CCTab>("saved");
  return (
    <div className="cf-screen" style={{ position:"relative", height:"100%",
      background:TOKENS.bg, display:"flex", flexDirection:"column",
      padding:"56px 22px 24px", overflow:"hidden" }}>
      <DotsBg opacity={0.05}/>
      <div style={{ position:"relative", zIndex:2, display:"flex", alignItems:"center",
        justifyContent:"space-between", marginBottom:12 }}>
        <button onClick={onBack} style={{ appearance:"none", cursor:"pointer",
          width:36, height:36, borderRadius:999, border:`2.5px solid ${TOKENS.ink}`,
          background:TOKENS.paper, fontSize:14, fontWeight:900,
          boxShadow:`3px 3px 0 ${TOKENS.ink}` }}>←</button>
        <Stamp color={TOKENS.accent1} rotate={-2}>command center</Stamp>
        <span style={{ width:36 }}/>
      </div>
      <h2 style={{ position:"relative", zIndex:2, fontFamily:TOKENS.display, fontWeight:900,
        fontSize:32, lineHeight:0.95, letterSpacing:"-0.04em", color:TOKENS.ink,
        margin:"0 0 4px" }}>Your adult life,<br/>at a glance.</h2>
      <p style={{ position:"relative", zIndex:2, fontFamily:TOKENS.ui, fontSize:13, fontWeight:600,
        opacity:0.65, margin:"0 0 14px" }}>
        Saved spots, crews, prefs, templates, vibe profile.
      </p>
      <div style={{ position:"relative", zIndex:2, display:"flex", gap:4, marginBottom:12,
        overflowX:"auto", scrollbarWidth:"none", marginRight:-22, paddingRight:22 }}>
        {([
          {id:"saved" as CCTab,    l:"saved spots"},
          {id:"people" as CCTab,   l:"people"},
          {id:"prefs" as CCTab,    l:"prefs"},
          {id:"host" as CCTab,     l:"host templates"},
          {id:"upcoming" as CCTab, l:"upcoming"},
          {id:"vibe" as CCTab,     l:"vibe profile"},
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ appearance:"none", cursor:"pointer",
            flexShrink:0, padding:"7px 12px", border:`2.5px solid ${TOKENS.ink}`, borderRadius:999,
            background:tab===t.id ? TOKENS.ink : TOKENS.paper,
            color:tab===t.id ? TOKENS.paper : TOKENS.ink,
            fontFamily:TOKENS.ui, fontSize:11, fontWeight:800 }}>{t.l}</button>
        ))}
      </div>
      <div style={{ position:"relative", zIndex:2, flex:1, overflowY:"auto",
        marginRight:-22, paddingRight:22, scrollbarWidth:"none" }}>
        {tab==="saved"    && <CCSavedSpots/>}
        {tab==="people"   && <CCPeople/>}
        {tab==="prefs"    && <CCPrefs/>}
        {tab==="host"     && <CCHostTemplates/>}
        {tab==="upcoming" && <CCUpcoming/>}
        {tab==="vibe"     && <CCVibeProfile/>}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────
type View = "hub" | "command";

function AdultPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>("hub");
  const [lifeMode, setLifeMode] = useState<LifeModeId>("go-out");
  const [picked, setPicked] = useState<string[]>([]);

  const togglePick = (label: string) => {
    setPicked(prev => prev.includes(label)
      ? prev.filter(p => p !== label)
      : [...prev, label].slice(0,5));
  };

  const focus = FOCUS_MAP[lifeMode] || ["tonight"];

  if (view === "command") {
    return (
      <Frame>
        <div style={{ height:"100dvh", position:"relative" }}>
          <CommandCenterScreen onBack={() => setView("hub")}/>
        </div>
      </Frame>
    );
  }

  return (
    <Frame>
      <div className="cf-screen" style={{ position:"relative", height:"100dvh",
        background:TOKENS.bg, overflow:"hidden", display:"flex", flexDirection:"column" }}>
        <DotsBg opacity={0.05}/>

        {/* Top bar */}
        <div style={{ position:"relative", zIndex:2, display:"flex", alignItems:"center",
          justifyContent:"space-between", padding:"56px 22px 0" }}>
          <button onClick={() => navigate({ to:"/new/hub" })} style={{ appearance:"none",
            cursor:"pointer", width:36, height:36, borderRadius:999,
            border:`2.5px solid ${TOKENS.ink}`, background:TOKENS.paper,
            fontSize:14, fontWeight:900, boxShadow:`3px 3px 0 ${TOKENS.ink}` }}>←</button>
          <span style={{ fontFamily:TOKENS.mono, fontSize:10, fontWeight:800,
            letterSpacing:".14em", opacity:0.55, textTransform:"uppercase" as const }}>
            ADULT LIFE HUB
          </span>
          <span style={{ width:36 }}/>
        </div>

        {/* Scrollable content */}
        <div style={{ position:"relative", zIndex:2, flex:1, overflowY:"auto",
          padding:"14px 22px 24px", scrollbarWidth:"none" }}>
          {/* Life mode chips */}
          <div style={{ fontFamily:TOKENS.mono, fontSize:10, fontWeight:800, letterSpacing:".16em",
            textTransform:"uppercase" as const, color:TOKENS.ink, opacity:0.55, marginBottom:8 }}>
            WHAT KIND OF DAY?
          </div>
          <div style={{ marginBottom:16 }}>
            <LifeModeChips value={lifeMode} onChange={setLifeMode}/>
          </div>

          {/* Command center button */}
          <button onClick={() => setView("command")} style={{ appearance:"none", cursor:"pointer",
            width:"100%", display:"flex", alignItems:"center", gap:12,
            padding:"12px 14px", marginBottom:18, border:`2.5px solid ${TOKENS.ink}`,
            borderRadius:14, background:TOKENS.ink, color:TOKENS.paper,
            boxShadow:`4px 4px 0 ${TOKENS.accent1}`, textAlign:"left" as const }}>
            <span style={{ fontSize:22, width:36, height:36, borderRadius:999,
              background:TOKENS.accent1, color:TOKENS.ink,
              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>✣</span>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:TOKENS.mono, fontSize:9, fontWeight:800,
                letterSpacing:".16em", opacity:0.7 }}>YOUR ADULT LIFE</div>
              <div style={{ fontFamily:TOKENS.display, fontWeight:900, fontSize:16,
                letterSpacing:"-0.025em", marginTop:1 }}>Command center</div>
            </div>
            <span style={{ fontSize:18, opacity:0.7, fontWeight:900 }}>›</span>
          </button>

          {/* Sections */}
          {[...ADULT_SECTIONS]
            .sort((a,b) => focus.indexOf(b.id) - focus.indexOf(a.id))
            .map(section => (
              <AdultSection key={section.id} section={section}
                focused={focus.includes(section.id)} picked={picked}
                onPick={(p) => togglePick(p.label)}/>
            ))}
        </div>

        {/* Sticky bottom CTA when items picked */}
        {picked.length > 0 && (
          <div style={{ position:"relative", zIndex:10, padding:"12px 22px",
            background:TOKENS.bg, borderTop:`1.5px solid ${TOKENS.ink}` }}>
            <button onClick={() => navigate({ to:"/new/plan-review" })} style={{ appearance:"none",
              cursor:"pointer", width:"100%", display:"flex", alignItems:"center", gap:12,
              padding:"14px 18px", border:`3px solid ${TOKENS.ink}`, borderRadius:14,
              background:TOKENS.accent1, color:TOKENS.ink, boxShadow:`5px 5px 0 ${TOKENS.ink}`,
              textAlign:"left" as const }}>
              <span style={{ width:36, height:36, borderRadius:999, background:TOKENS.ink,
                color:TOKENS.paper, display:"inline-flex", alignItems:"center",
                justifyContent:"center", fontFamily:TOKENS.display, fontWeight:900, fontSize:16 }}>
                {picked.length}
              </span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:TOKENS.mono, fontSize:9, fontWeight:800,
                  letterSpacing:".14em", opacity:0.7 }}>{picked.length} PICKED · MULTI-PLAN</div>
                <div style={{ fontFamily:TOKENS.display, fontWeight:900, fontSize:16,
                  letterSpacing:"-0.025em", marginTop:1,
                  whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                  build with {picked.join(" · ")}
                </div>
              </div>
              <span style={{ fontSize:18, fontWeight:900 }}>→</span>
            </button>
          </div>
        )}
      </div>
    </Frame>
  );
}
