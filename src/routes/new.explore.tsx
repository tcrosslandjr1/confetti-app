import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { Frame, TOKENS, ChunkyButton, Icons } from "@/components/new-confetti/shell";

export const Route = createFileRoute("/new/explore")({ component: ExplorePage });

// ─── Yelp-style star rating ──────────────────────────────────────
function YelpStars({ rating, reviews }: { rating: string; reviews: string }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"4px 8px",
      border:`2px solid ${TOKENS.ink}`, borderRadius:6, background:"#d32323", color:"#fff" }}>
      <span style={{ fontFamily:TOKENS.display, fontWeight:900, fontSize:11, letterSpacing:"-0.02em" }}>yelp</span>
      <span style={{ fontFamily:TOKENS.mono, fontSize:10, fontWeight:800, letterSpacing:".04em" }}>{rating} · {reviews}</span>
    </span>
  );
}

// ─── Ticketmaster badge ──────────────────────────────────────────
function TicketmasterBadge({ price }: { price: number }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"4px 8px",
      border:`2px solid ${TOKENS.ink}`, borderRadius:6, background:"#026CDF", color:"#fff" }}>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M1 3v4l4 2 4-2V3L5 1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
      <span style={{ fontFamily:TOKENS.mono, fontSize:9, fontWeight:800, letterSpacing:".08em" }}>FROM ${price}</span>
    </span>
  );
}

// ─── Kids badge ──────────────────────────────────────────────────
function KidsBadge({ kind }: { kind: "21+" | "menu" | "welcome" | null }) {
  if (!kind) return null;
  const map: Record<string, { bg: string; label: string }> = {
    "21+":    { bg: TOKENS.ink,    label: "🍺 21+" },
    menu:     { bg: TOKENS.accent4, label: "🧒 kids menu" },
    welcome:  { bg: TOKENS.accent2, label: "✓ family ok" },
  };
  const s = map[kind];
  return (
    <span style={{ padding:"4px 8px", background:s.bg,
      color: s.bg === TOKENS.ink ? TOKENS.paper : TOKENS.ink,
      border:`2px solid ${TOKENS.ink}`, borderRadius:6,
      fontFamily:TOKENS.mono, fontSize:10, fontWeight:800, letterSpacing:".06em" }}>
      {s.label}
    </span>
  );
}

// ─── Types ───────────────────────────────────────────────────────
interface Venue {
  id: string; name: string; tag: string; nbhd: string; blurb: string; color: string;
  yelp: string; reviews: string; price: string; tags: string[]; why: string; booking: string;
  ticketPrice?: number; adultsOnly?: boolean; ageMin?: number;
  kidsMenu?: boolean; kidsWelcome?: boolean;
  hashtags?: string[]; hotItems?: string[];
  tiktokReels?: { user: string; views: string; heat?: string }[];
}
interface Stop { name: string; tag: string; color: string; cost: string; time?: string; }
interface ReelItem {
  kind: "clip" | "aipass"; who?: string; venue?: string; stop?: number; vibe?: string;
  caption?: string; color: string; likes?: number; comments?: number;
  title?: string; nbhd?: string; badge?: string; matchPct?: number;
  reason?: string; total?: string; stops: Stop[];
}

// ─── Data ────────────────────────────────────────────────────────
const VENUES: Venue[] = [
  { id:"rooftop", name:"Westlight", tag:"rooftop bar", nbhd:"Williamsburg · 0.8 mi",
    blurb:"22nd-floor cocktails, Manhattan skyline, no cover until 9.",
    color:TOKENS.accent1, yelp:"4.5", reviews:"2.1k", price:"$$$",
    tags:["romantic","hype","view"], why:'Matches your "rooftop + sunset" pattern from 3 prior passes.',
    booking:"stripe", adultsOnly:true, ageMin:21,
    hashtags:["#westlightbk","#bkrooftop","#williamsburgsunset"],
    hotItems:["old fashioned · $18","chili crisp burger · $24","lemonade spritz · $14"],
    tiktokReels:[{user:"maya.brk",views:"24.1k",heat:"🔥"},{user:"devstrolls",views:"12.3k"},{user:"samis.cooked",views:"8.4k"}] },
  { id:"jazz", name:"Eavesdrop", tag:"jazz + small plates", nbhd:"Bed-Stuy · 1.2 mi",
    blurb:"Vinyl-only, no phones past 10. Reservation only.",
    color:TOKENS.accent3, yelp:"4.7", reviews:"380", price:"$$",
    tags:["date","low-key","cultural"], why:'Devon saved this 2 weeks ago. Quiet enough for your "first-date" filter.',
    booking:"opentable", adultsOnly:true, ageMin:18,
    hashtags:["#eavesdropbedstuy","#vinylbar","#nophonesinside"],
    hotItems:["gem lettuce · $16","duck rillette · $22","sherry flight · $28"],
    tiktokReels:[{user:"jazz.head",views:"6.2k",heat:"🔥"},{user:"wax.diary",views:"4.1k"},{user:"noahin.bk",views:"2.8k"}] },
  { id:"show", name:"Baby's All Right", tag:"live music", nbhd:"Williamsburg · 0.5 mi",
    blurb:'Indie 4-piece "Pearl Charles" tonight. Doors 10, set 11.',
    color:TOKENS.accent2, yelp:"4.4", reviews:"1.6k", price:"$$",
    tags:["hype","foodie","late"], why:"3 friends are going. Ticketmaster has 8 tickets left.",
    booking:"ticketmaster", ticketPrice:26, adultsOnly:true, ageMin:21,
    hashtags:["#babysallright","#pearlcharles","#bkindie"],
    hotItems:["pearl charles set @ 11pm","opener: ruby waters","spicy marg · $14"],
    tiktokReels:[{user:"pearl.fan",views:"48.3k",heat:"🔥"},{user:"showthread",views:"18.9k"},{user:"fri.list",views:"7.1k"}] },
];

const REELS: ReelItem[] = [
  { kind:"clip", who:"maya", venue:"Westlight rooftop", stop:1, vibe:"romantic",
    caption:"sunset hit different tonight 🌅", color:TOKENS.accent1, likes:142, comments:18,
    stops:[
      {name:"Westlight rooftop",tag:"rooftop · $$$",color:TOKENS.accent1,cost:"$48"},
      {name:"Roebling Tea Room",tag:"date dinner",color:TOKENS.accent2,cost:"$72"},
      {name:"Skinny Dennis",tag:"dive nightcap",color:TOKENS.accent3,cost:"$22"},
    ]},
  { kind:"aipass", title:"your friday, plotted", nbhd:"williamsburg · 0.6mi from you",
    badge:"AI BOARDING PASS", matchPct:92, reason:"matches your italian + rooftop saves",
    total:"~$92 · 4h", color:TOKENS.accent2,
    stops:[
      {name:"Westlight rooftop",tag:"sunset cocktail",color:TOKENS.accent1,cost:"$24",time:"6:30"},
      {name:"Lupa Notte",tag:"italian · counter",color:TOKENS.accent2,cost:"$52",time:"8:00"},
      {name:"Skinny Dennis",tag:"dive nightcap",color:TOKENS.accent3,cost:"$16",time:"10:30"},
    ]},
  { kind:"clip", who:"devon", venue:"Quartz Room show", stop:3, vibe:"hype",
    caption:"pearl charles is unreal live", color:TOKENS.accent3, likes:89, comments:6,
    stops:[
      {name:"Threes Brewing",tag:"beer warm-up",color:TOKENS.accent2,cost:"$18"},
      {name:"Oxomoco",tag:"tacos · loud",color:TOKENS.accent1,cost:"$58"},
      {name:"Quartz Room",tag:"live show",color:TOKENS.accent3,cost:"$26"},
    ]},
  { kind:"aipass", title:"a loud one,\nstart to finish",
    nbhd:"bushwick + ridgewood · L train friendly",
    badge:"AI BOARDING PASS", matchPct:87, reason:"built from 3 reels you saved this week",
    total:"~$74 · 5h", color:TOKENS.accent3,
    stops:[
      {name:"Threes Brewing",tag:"beer + tacos warm-up",color:TOKENS.accent2,cost:"$22",time:"7:00"},
      {name:"Bossa Nova Civic Club",tag:"dance floor",color:TOKENS.accent1,cost:"$28",time:"9:30"},
      {name:"Quartz Room",tag:"late live show",color:TOKENS.accent3,cost:"$24",time:"11:30"},
    ]},
  { kind:"clip", who:"sam", venue:"Lupa Notte", stop:2, vibe:"foodie",
    caption:"this carbonara healed me", color:TOKENS.accent2, likes:312, comments:42,
    stops:[
      {name:"Skinny Pete's",tag:"dive warm-up",color:TOKENS.accent2,cost:"$14"},
      {name:"Lupa Notte",tag:"italian · ★ counter",color:TOKENS.accent1,cost:"$52"},
      {name:"Eavesdrop",tag:"jazz nightcap",color:TOKENS.accent3,cost:"$32"},
    ]},
];

// ─── ExploreCard ─────────────────────────────────────────────────
function ExploreCard({ venue, active, onTap, onAdd }:
  { venue: Venue; active: boolean; onTap: () => void; onAdd: () => void }) {
  return (
    <div onClick={onTap} style={{ scrollSnapAlign:"start", scrollSnapStop:"always",
      height:"100%", position:"relative", cursor:"pointer", background:venue.color,
      backgroundImage:"repeating-linear-gradient(135deg, rgba(0,0,0,0.07) 0 12px, transparent 12px 24px)" }}>
      <svg width="100%" height="100%" viewBox="0 0 100 175" preserveAspectRatio="xMidYMid slice"
           style={{ position:"absolute", inset:0, opacity:0.4 }}>
        <rect x="0" y="0" width="100" height="175" fill="rgba(0,0,0,0.18)"/>
        <path d="M0 130 L20 110 L40 120 L60 95 L80 105 L100 90 L100 175 L0 175Z" fill="rgba(0,0,0,0.3)"/>
        <path d="M0 150 L25 135 L45 145 L70 125 L100 135 L100 175 L0 175Z" fill="rgba(0,0,0,0.5)"/>
      </svg>
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"70%",
        background:"linear-gradient(180deg, transparent, rgba(0,0,0,0.85))" }}/>
      {/* Top-right badges */}
      <div style={{ position:"absolute", top:158, right:16, zIndex:5,
        display:"flex", flexDirection:"column", gap:6, alignItems:"flex-end" }}>
        <YelpStars rating={venue.yelp} reviews={venue.reviews}/>
        {venue.ticketPrice && <TicketmasterBadge price={venue.ticketPrice}/>}
        <span style={{ padding:"4px 8px", background:TOKENS.paper, color:TOKENS.ink,
          border:`2px solid ${TOKENS.ink}`, borderRadius:6, fontFamily:TOKENS.mono,
          fontSize:10, fontWeight:800, letterSpacing:".06em" }}>{venue.price}</span>
        <KidsBadge kind={venue.adultsOnly ? "21+" : venue.kidsMenu ? "menu" : venue.kidsWelcome ? "welcome" : null}/>
      </div>
      {/* Main content */}
      <div style={{ position:"absolute", bottom:100, left:16, right:80, zIndex:5, color:TOKENS.paper }}>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8 }}>
          {venue.tags.map(t => (
            <span key={t} style={{ padding:"3px 8px", border:`2px solid ${TOKENS.paper}`,
              borderRadius:999, fontFamily:TOKENS.mono, fontSize:9, fontWeight:800,
              letterSpacing:".1em", textTransform:"uppercase",
              background:"rgba(0,0,0,0.3)", backdropFilter:"blur(10px)" }}>{t}</span>
          ))}
        </div>
        <div style={{ fontFamily:TOKENS.mono, fontSize:10, fontWeight:800, letterSpacing:".14em",
          textTransform:"uppercase", opacity:0.85 }}>{venue.tag} · {venue.nbhd}</div>
        <h2 style={{ fontFamily:TOKENS.display, fontWeight:900, fontSize:38, lineHeight:0.95,
          letterSpacing:"-0.04em", margin:"4px 0 8px" }}>{venue.name}</h2>
        <p style={{ fontFamily:TOKENS.ui, fontSize:14, fontWeight:600, lineHeight:1.35,
          margin:"0 0 10px", opacity:0.92 }}>{venue.blurb}</p>
        <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"7px 10px",
          background:"rgba(255,250,240,0.12)", border:"1.5px solid rgba(255,250,240,0.35)",
          borderRadius:8, fontFamily:TOKENS.ui, fontSize:11, fontWeight:700, backdropFilter:"blur(10px)" }}>
          <span style={{ fontFamily:TOKENS.display, fontSize:13, color:TOKENS.accent1 }}>✣</span>
          <span style={{ opacity:0.92 }}>{venue.why}</span>
        </div>
        {venue.hotItems && venue.hotItems.length > 0 && (
          <div style={{ marginTop:10 }}>
            <div style={{ fontFamily:TOKENS.mono, fontSize:9, fontWeight:800, letterSpacing:".14em",
              opacity:0.7, marginBottom:5, textTransform:"uppercase",
              display:"flex", alignItems:"center", gap:5 }}>🔥 hottest at this spot</div>
            <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
              {venue.hotItems.slice(0,3).map((it,i) => (
                <span key={i} style={{ padding:"4px 9px",
                  background: i===0 ? TOKENS.accent1 : "rgba(255,250,240,0.15)",
                  border:`1.5px solid ${i===0 ? TOKENS.ink : "rgba(255,250,240,0.4)"}`,
                  color: i===0 ? TOKENS.ink : TOKENS.paper, borderRadius:999,
                  fontFamily:TOKENS.ui, fontSize:10.5, fontWeight:800, backdropFilter:"blur(8px)" }}>
                  {i===0 && "★ "}{it}
                </span>
              ))}
            </div>
          </div>
        )}
        {venue.tiktokReels && venue.tiktokReels.length > 0 && (
          <div style={{ marginTop:10 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:5 }}>
              <div style={{ fontFamily:TOKENS.mono, fontSize:9, fontWeight:800, letterSpacing:".14em",
                opacity:0.7, textTransform:"uppercase" }}>
                ▶ from tiktok · {venue.hashtags?.[0] || `#${venue.id}`}
              </div>
              <span style={{ fontFamily:TOKENS.mono, fontSize:8.5, fontWeight:700, opacity:0.55, letterSpacing:".1em" }}>SEE ALL ›</span>
            </div>
            <div style={{ display:"flex", gap:6 }}>
              {venue.tiktokReels.slice(0,3).map((r,i) => (
                <div key={i} style={{ flex:1, padding:5, background:"rgba(0,0,0,0.4)",
                  border:"1.5px solid rgba(255,250,240,0.35)", borderRadius:8, backdropFilter:"blur(10px)" }}>
                  <div style={{ aspectRatio:"4/5",
                    background:`linear-gradient(135deg, ${venue.color}, rgba(0,0,0,0.6))`,
                    backgroundImage:"repeating-linear-gradient(135deg, rgba(255,255,255,0.06) 0 5px, transparent 5px 10px)",
                    border:"1px solid rgba(255,255,255,0.2)", borderRadius:4, marginBottom:4, position:"relative" }}>
                    {r.heat && <span style={{ position:"absolute", top:2, right:2, fontSize:10 }}>{r.heat}</span>}
                    <span style={{ position:"absolute", bottom:3, right:4, fontFamily:TOKENS.mono, fontSize:7.5,
                      fontWeight:800, letterSpacing:".04em", color:TOKENS.paper,
                      textShadow:"0 1px 2px rgba(0,0,0,0.8)" }}>{r.views}</span>
                  </div>
                  <div style={{ fontFamily:TOKENS.mono, fontSize:8, fontWeight:700, letterSpacing:".04em",
                    opacity:0.85, color:TOKENS.paper, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                    @{r.user}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Side rail */}
      <div style={{ position:"absolute", bottom:100, right:12, zIndex:5,
        display:"flex", flexDirection:"column", gap:16, alignItems:"center" }}>
        {[{icon:"♡",label:"24"},{icon:"💬",label:"8"},{icon:"↗",label:"share"},{icon:"☆",label:"save"}].map(a => (
          <button key={a.icon} style={{ appearance:"none", cursor:"pointer", background:"transparent",
            border:"none", padding:0, color:TOKENS.paper, textAlign:"center" }}>
            <div style={{ width:42, height:42, borderRadius:999, border:`2px solid ${TOKENS.paper}`,
              background:"rgba(0,0,0,0.4)", backdropFilter:"blur(10px)",
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:900 }}>
              {a.icon}
            </div>
            <div style={{ fontFamily:TOKENS.mono, fontSize:9, fontWeight:800, marginTop:3 }}>{a.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── ReelPassCard ─────────────────────────────────────────────────
function ReelPassCard({ pass, onAddStop }: { pass: ReelItem; onAddStop?: (s: Stop) => void }) {
  const [printed, setPrinted] = useState(false);
  return (
    <div style={{ scrollSnapAlign:"start", scrollSnapStop:"always", height:"100%", position:"relative",
      background:pass.color,
      backgroundImage:"repeating-linear-gradient(135deg, rgba(0,0,0,0.08) 0 14px, transparent 14px 28px)",
      display:"flex", flexDirection:"column", padding:"110px 16px 110px", color:TOKENS.ink }}>
      <div style={{ display:"inline-flex", alignSelf:"flex-start", alignItems:"center", gap:6,
        padding:"5px 10px", marginBottom:10, background:TOKENS.ink, color:TOKENS.paper,
        border:`2px solid ${TOKENS.ink}`, borderRadius:999, fontFamily:TOKENS.mono,
        fontSize:9, fontWeight:800, letterSpacing:".16em" }}>
        <span style={{ color:TOKENS.accent1 }}>✣</span>{pass.badge}
      </div>
      <div style={{ position:"relative", background:TOKENS.paper, border:`3px solid ${TOKENS.ink}`,
        borderRadius:18, boxShadow:`6px 6px 0 ${TOKENS.ink}`, overflow:"hidden", flexShrink:0 }}>
        <div style={{ background:TOKENS.ink, color:TOKENS.paper, padding:"8px 14px",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          fontFamily:TOKENS.mono, fontSize:9, fontWeight:800, letterSpacing:".14em" }}>
          <span>CONFETTI · TONIGHT</span>
          <span style={{ display:"inline-flex", alignItems:"center", gap:5 }}>
            <span style={{ width:6, height:6, borderRadius:999, background:TOKENS.accent1,
              animation:"cf-pulse 1.2s infinite" }}/>
            {pass.matchPct}% MATCH
          </span>
        </div>
        <div style={{ padding:"14px 16px 0" }}>
          <h2 style={{ fontFamily:TOKENS.display, fontWeight:900, fontSize:30, letterSpacing:"-0.04em",
            lineHeight:0.94, margin:"0 0 4px", whiteSpace:"pre-line" }}>{pass.title}</h2>
          <div style={{ fontFamily:TOKENS.ui, fontSize:12, fontWeight:700, opacity:0.65, marginBottom:8 }}>{pass.nbhd}</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
            <span style={{ padding:"3px 8px", border:`2px solid ${TOKENS.ink}`, borderRadius:999,
              background:TOKENS.bg, fontFamily:TOKENS.mono, fontSize:9, fontWeight:800, letterSpacing:".08em" }}>
              {pass.total}
            </span>
            <span style={{ padding:"3px 8px", border:`2px solid ${TOKENS.ink}`, borderRadius:999,
              background:TOKENS.accent1, fontFamily:TOKENS.mono, fontSize:9, fontWeight:800, letterSpacing:".08em" }}>
              {pass.stops.length} STOPS
            </span>
          </div>
        </div>
        <div style={{ margin:"4px 0", borderTop:"2px dashed rgba(0,0,0,0.2)", position:"relative" }}>
          <span style={{ position:"absolute", left:-8, top:-8, width:16, height:16, borderRadius:999,
            background:pass.color, border:`2px solid ${TOKENS.ink}` }}/>
          <span style={{ position:"absolute", right:-8, top:-8, width:16, height:16, borderRadius:999,
            background:pass.color, border:`2px solid ${TOKENS.ink}` }}/>
        </div>
        <div style={{ padding:"8px 14px 12px", display:"flex", flexDirection:"column", gap:6 }}>
          {pass.stops.map((s,i) => (
            <div key={i} onClick={() => onAddStop?.(s)} style={{ display:"flex", alignItems:"center",
              gap:10, padding:"8px 10px", border:`2px solid ${TOKENS.ink}`, borderRadius:10,
              background:TOKENS.bg, cursor:"pointer" }}>
              <span style={{ width:28, height:28, borderRadius:999, background:s.color,
                border:`2px solid ${TOKENS.ink}`, display:"flex", alignItems:"center",
                justifyContent:"center", fontFamily:TOKENS.display, fontWeight:900, fontSize:13,
                color:TOKENS.ink, flexShrink:0 }}>{i+1}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:TOKENS.ui, fontSize:13, fontWeight:900, letterSpacing:"-0.01em",
                  lineHeight:1.15, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{s.name}</div>
                <div style={{ fontFamily:TOKENS.mono, fontSize:9, fontWeight:700, opacity:0.6,
                  marginTop:1, letterSpacing:".04em" }}>{s.time} · {s.tag}</div>
              </div>
              <span style={{ fontFamily:TOKENS.mono, fontSize:10, fontWeight:800,
                letterSpacing:".04em", flexShrink:0 }}>{s.cost}</span>
            </div>
          ))}
        </div>
        <div style={{ margin:"0 14px 12px", padding:"8px 10px", background:TOKENS.bg,
          border:`2px solid ${TOKENS.ink}`, borderRadius:8, fontFamily:TOKENS.mono,
          fontSize:9.5, fontWeight:700, letterSpacing:".04em", lineHeight:1.4, opacity:0.78 }}>
          <span style={{ color:TOKENS.accent1, fontWeight:800 }}>WHY · </span>{pass.reason}
        </div>
      </div>
      <button onClick={() => setPrinted(true)} style={{ appearance:"none", cursor:"pointer", marginTop:14,
        display:"inline-flex", alignItems:"center", justifyContent:"center", gap:8,
        padding:"14px 18px", border:`3px solid ${TOKENS.ink}`, borderRadius:14,
        background:printed ? TOKENS.accent4 : TOKENS.ink, color:TOKENS.paper,
        fontFamily:TOKENS.ui, fontSize:14, fontWeight:900,
        boxShadow:`5px 5px 0 ${TOKENS.paper}`, width:"100%" }}>
        {printed ? <>✓ printed · check your pass</> : <>print this pass →</>}
      </button>
      <div style={{ position:"absolute", bottom:110, right:12,
        display:"flex", flexDirection:"column", gap:14, alignItems:"center" }}>
        {[{icon:"♥",n:"—"},{icon:"☆",n:"save"},{icon:"↗",n:"share"},{icon:"✕",n:"hide"}].map((a,i) => (
          <div key={i} style={{ textAlign:"center" }}>
            <div style={{ width:42, height:42, borderRadius:999, background:"rgba(0,0,0,0.4)",
              border:`2px solid ${TOKENS.paper}`, color:TOKENS.paper, display:"flex",
              alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:900,
              backdropFilter:"blur(10px)" }}>{a.icon}</div>
            <div style={{ fontFamily:TOKENS.mono, fontSize:9, fontWeight:800, marginTop:3,
              color:TOKENS.paper, textShadow:"0 1px 2px rgba(0,0,0,0.6)" }}>{a.n}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ReelCard ─────────────────────────────────────────────────────
function ReelCard({ reel, onAddStop }: { reel: ReelItem; onAddStop?: (s: Stop) => void }) {
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const addStop = (s: Stop) => { onAddStop?.(s); setAddedIds(p => new Set([...p, s.name])); };
  return (
    <div style={{ scrollSnapAlign:"start", scrollSnapStop:"always", height:"100%", position:"relative",
      background:reel.color,
      backgroundImage:"repeating-linear-gradient(135deg, rgba(0,0,0,0.07) 0 14px, transparent 14px 28px)" }}>
      <svg width="100%" height="100%" viewBox="0 0 100 175" preserveAspectRatio="xMidYMid slice"
           style={{ position:"absolute", inset:0, opacity:0.45 }}>
        <circle cx="50" cy="60" r="22" fill="rgba(0,0,0,0.4)"/>
        <path d="M15 175 C 15 120, 30 95, 50 95 S 85 120, 85 175 Z" fill="rgba(0,0,0,0.4)"/>
        <rect x="40" y="35" width="20" height="14" fill="rgba(0,0,0,0.5)"/>
      </svg>
      <div style={{ position:"absolute", top:110, left:16, zIndex:5, padding:"5px 10px",
        background:"rgba(0,0,0,0.55)", border:`2px solid ${TOKENS.paper}`, borderRadius:999,
        fontFamily:TOKENS.mono, fontSize:9, fontWeight:800, letterSpacing:".14em",
        color:TOKENS.paper, backdropFilter:"blur(10px)" }}>
        STOP {reel.stop}/3 · {reel.vibe?.toUpperCase()}
      </div>
      <div style={{ position:"absolute", bottom:0, left:0, right:0,
        background:"linear-gradient(transparent, rgba(0,0,0,0.85))", padding:"60px 14px 32px" }}>
        <div style={{ display:"flex", alignItems:"flex-end", gap:12 }}>
          <div style={{ flex:1 }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:8, marginBottom:8 }}>
              <div style={{ width:36, height:36, borderRadius:999, border:`2.5px solid ${TOKENS.paper}`,
                background:reel.color, display:"flex", alignItems:"center", justifyContent:"center",
                fontFamily:TOKENS.display, fontWeight:900, fontSize:16 }}>
                {(reel.who?.[0] || "?").toUpperCase()}
              </div>
              <div>
                <div style={{ fontFamily:TOKENS.display, fontWeight:900, fontSize:15, color:TOKENS.paper }}>@{reel.who}</div>
                <div style={{ fontFamily:TOKENS.mono, fontSize:10, fontWeight:700, opacity:0.8 }}>at {reel.venue}</div>
              </div>
              <button style={{ marginLeft:8, padding:"5px 12px", appearance:"none", cursor:"pointer",
                border:`2px solid ${TOKENS.paper}`, borderRadius:999, background:TOKENS.accent1,
                color:TOKENS.ink, fontFamily:TOKENS.ui, fontSize:11, fontWeight:800 }}>follow</button>
            </div>
            <div style={{ fontFamily:TOKENS.ui, fontSize:14, fontWeight:700, color:TOKENS.paper, lineHeight:1.3 }}>
              {reel.caption}
            </div>
            <button style={{ marginTop:12, padding:"8px 14px", appearance:"none", cursor:"pointer",
              border:`2.5px solid ${TOKENS.paper}`, borderRadius:999, background:"rgba(0,0,0,0.5)",
              color:TOKENS.paper, fontFamily:TOKENS.ui, fontSize:12, fontWeight:800,
              backdropFilter:"blur(10px)", display:"inline-flex", alignItems:"center", gap:6 }}>
              <span style={{ color:TOKENS.accent1 }}>✣</span>
              plan their night → 4h · $86
            </button>
            {reel.stops && (
              <div style={{ marginTop:10 }}>
                <div style={{ fontFamily:TOKENS.mono, fontSize:9, fontWeight:800, letterSpacing:".12em",
                  opacity:0.7, textTransform:"uppercase", marginBottom:6 }}>or grab just one stop</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {reel.stops.map((s,i) => {
                    const added = addedIds.has(s.name);
                    return (
                      <button key={i} onClick={() => addStop(s)} disabled={added} style={{
                        appearance:"none", cursor:added?"default":"pointer",
                        display:"inline-flex", alignItems:"center", gap:5,
                        padding:"5px 9px 5px 5px", border:`2px solid ${TOKENS.paper}`, borderRadius:999,
                        background:added ? TOKENS.accent4 : "rgba(0,0,0,0.45)",
                        color:TOKENS.paper, fontFamily:TOKENS.ui, fontSize:11, fontWeight:800,
                        backdropFilter:"blur(10px)" }}>
                        <span style={{ width:18, height:18, borderRadius:999, background:s.color,
                          color:TOKENS.ink, display:"inline-flex", alignItems:"center",
                          justifyContent:"center", fontFamily:TOKENS.display, fontWeight:900,
                          fontSize:9, border:`1.5px solid ${TOKENS.paper}` }}>
                          {added ? "✓" : i+1}
                        </span>
                        {added ? "added" : `＋ ${s.name.split(" ")[0]}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:14, alignItems:"center", color:TOKENS.paper }}>
            {[{icon:"♥",n:reel.likes,on:true,c:undefined as string|undefined},
              {icon:"💬",n:reel.comments,on:false,c:undefined},
              {icon:"✣",n:"4",on:false,c:TOKENS.accent1},
              {icon:"↗",n:"",on:false,c:undefined}].map((a,i) => (
              <div key={i} style={{ textAlign:"center" }}>
                <div style={{ width:42, height:42, borderRadius:999,
                  background:a.on ? TOKENS.accent1 : "rgba(0,0,0,0.4)",
                  border:`2px solid ${TOKENS.paper}`,
                  color:a.c || (a.on ? TOKENS.ink : TOKENS.paper),
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:18, fontWeight:900, backdropFilter:"blur(10px)" }}>{a.icon}</div>
                {a.n !== "" && <div style={{ fontFamily:TOKENS.mono, fontSize:9, fontWeight:800, marginTop:3 }}>{a.n}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Venue Detail helpers ─────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily:TOKENS.mono, fontSize:10, fontWeight:800, letterSpacing:".16em",
      textTransform:"uppercase", color:TOKENS.ink, opacity:0.55, marginBottom:8, marginTop:4 }}>
      {children}
    </div>
  );
}
function ActionBtn({ icon, label, sub, color, textLight }:
  { icon: React.ReactNode; label: string; sub: string; color?: string; textLight?: boolean }) {
  return (
    <button style={{ appearance:"none", cursor:"pointer", textAlign:"left", padding:"10px 12px",
      border:`2.5px solid ${TOKENS.ink}`, borderRadius:12, background:color||TOKENS.paper,
      color:textLight?TOKENS.paper:TOKENS.ink, boxShadow:`3px 3px 0 ${TOKENS.ink}`,
      display:"flex", alignItems:"center", gap:10 }}>
      <span style={{ fontSize:18, display:"inline-flex" }}>{icon}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontFamily:TOKENS.ui, fontSize:12, fontWeight:900, lineHeight:1.1 }}>{label}</div>
        <div style={{ fontFamily:TOKENS.mono, fontSize:9, fontWeight:700, opacity:0.6, marginTop:2 }}>{sub}</div>
      </div>
    </button>
  );
}

function VenueDetailScreen({ venue, onBack, onAdd }:
  { venue: Venue; onBack: () => void; onAdd: (v: Venue) => void }) {
  const v = venue;
  return (
    <div className="cf-screen" style={{ position:"relative", height:"100%", background:TOKENS.bg,
      display:"flex", flexDirection:"column", overflow:"hidden" }}>
      <div style={{ position:"relative", height:240, flexShrink:0, background:v.color,
        backgroundImage:"repeating-linear-gradient(135deg, rgba(0,0,0,0.08) 0 14px, transparent 14px 28px)",
        borderBottom:`3px solid ${TOKENS.ink}` }}>
        <svg width="100%" height="100%" viewBox="0 0 100 60" preserveAspectRatio="xMidYMid slice"
             style={{ position:"absolute", inset:0, opacity:0.45 }}>
          <path d="M0 50 L20 30 L40 38 L60 22 L80 30 L100 18 L100 60 L0 60Z" fill="rgba(0,0,0,0.4)"/>
        </svg>
        <button onClick={onBack} style={{ position:"absolute", top:56, left:16, appearance:"none",
          cursor:"pointer", width:36, height:36, borderRadius:999, border:`2.5px solid ${TOKENS.ink}`,
          background:TOKENS.paper, color:TOKENS.ink, fontSize:16, fontWeight:900,
          boxShadow:`3px 3px 0 ${TOKENS.ink}` }}>←</button>
        <button style={{ position:"absolute", top:56, right:16, appearance:"none", cursor:"pointer",
          padding:"6px 12px", border:`2.5px solid ${TOKENS.ink}`, borderRadius:999,
          background:TOKENS.paper, color:TOKENS.ink, fontFamily:TOKENS.ui, fontSize:12, fontWeight:800,
          boxShadow:`3px 3px 0 ${TOKENS.ink}`, display:"inline-flex", alignItems:"center", gap:4 }}>
          ☆ save
        </button>
        <span style={{ position:"absolute", bottom:12, right:14, padding:"4px 8px",
          background:"rgba(0,0,0,0.55)", color:TOKENS.paper, border:`1.5px solid ${TOKENS.paper}`,
          borderRadius:6, fontFamily:TOKENS.mono, fontSize:10, fontWeight:700, letterSpacing:".1em" }}>
          📷 1/18
        </span>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"14px 18px 100px", scrollbarWidth:"none" }}>
        <div style={{ fontFamily:TOKENS.mono, fontSize:10, fontWeight:800, letterSpacing:".14em",
          color:TOKENS.ink, opacity:0.55, textTransform:"uppercase" }}>{v.tag} · {v.nbhd}</div>
        <h2 style={{ fontFamily:TOKENS.display, fontWeight:900, fontSize:34, letterSpacing:"-0.04em",
          lineHeight:0.95, margin:"4px 0 8px", color:TOKENS.ink }}>{v.name}</h2>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
          <YelpStars rating={v.yelp} reviews={v.reviews}/>
          {v.ticketPrice && <TicketmasterBadge price={v.ticketPrice}/>}
          <span style={{ padding:"4px 8px", background:TOKENS.ink, color:TOKENS.paper,
            border:`2px solid ${TOKENS.ink}`, borderRadius:6, fontFamily:TOKENS.mono,
            fontSize:10, fontWeight:800, letterSpacing:".06em" }}>OPEN · CLOSES 2A</span>
          <span style={{ padding:"4px 8px", border:`2px solid ${TOKENS.ink}`, borderRadius:6,
            background:TOKENS.paper, fontFamily:TOKENS.mono, fontSize:10, fontWeight:800 }}>{v.price}</span>
          <KidsBadge kind={v.adultsOnly ? "21+" : v.kidsMenu ? "menu" : v.kidsWelcome ? "welcome" : null}/>
        </div>
        <div style={{ padding:12, marginBottom:14, border:`2.5px solid ${TOKENS.ink}`, borderRadius:12,
          background:TOKENS.accent2, boxShadow:`3px 3px 0 ${TOKENS.ink}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, fontFamily:TOKENS.mono, fontSize:9,
            fontWeight:800, letterSpacing:".14em", color:TOKENS.ink, opacity:0.7,
            textTransform:"uppercase", marginBottom:4 }}>
            <span style={{ color:TOKENS.accent1, fontSize:12, animation:"cf-spin 3s linear infinite",
              display:"inline-block" }}>✣</span>
            why confetti picked this · from your tiktok
          </div>
          <div style={{ fontFamily:TOKENS.ui, fontSize:13, fontWeight:700, color:TOKENS.ink, lineHeight:1.35 }}>{v.why}</div>
          <div style={{ marginTop:8, paddingTop:8, borderTop:"1.5px dashed rgba(0,0,0,0.18)",
            fontFamily:TOKENS.mono, fontSize:10, fontWeight:700, color:TOKENS.ink, opacity:0.65, lineHeight:1.4 }}>
            📺 6 saves from @darkroom · 14 from @bk.eats · matches your speakeasy weight (0.82)
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
          <ActionBtn icon="🗺" label="open in maps" sub="Google Maps"/>
          <ActionBtn icon={<span style={{ fontFamily:TOKENS.display, fontWeight:900, fontSize:15 }}>L</span>}
            label="lyft here" sub="6 min · $9" color="#FF00BF" textLight/>
          <ActionBtn icon="🚇" label="L → Bedford" sub="11 min"/>
          <ActionBtn icon="✆" label="call venue" sub="(718) 555-0124"/>
        </div>
        {v.booking === "ticketmaster" && (
          <div style={{ padding:"12px 14px", marginBottom:14, border:`2.5px solid ${TOKENS.ink}`,
            borderRadius:12, background:"#026CDF", color:"#fff", boxShadow:`3px 3px 0 ${TOKENS.ink}`,
            display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:TOKENS.mono, fontSize:10, fontWeight:800, letterSpacing:".14em", opacity:0.85 }}>
                TICKETMASTER · 8 LEFT</div>
              <div style={{ fontFamily:TOKENS.display, fontWeight:900, fontSize:18, marginTop:2 }}>
                ${v.ticketPrice} · GA standing</div>
            </div>
            <button style={{ appearance:"none", cursor:"pointer", padding:"10px 14px",
              border:"2.5px solid #fff", borderRadius:999, background:"#fff", color:"#026CDF",
              fontFamily:TOKENS.ui, fontSize:13, fontWeight:900 }}>buy →</button>
          </div>
        )}
        {v.booking === "stripe" && (
          <div style={{ padding:"12px 14px", marginBottom:14, border:`2.5px solid ${TOKENS.ink}`,
            borderRadius:12, background:TOKENS.paper, boxShadow:`3px 3px 0 ${TOKENS.ink}`,
            display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:TOKENS.mono, fontSize:10, fontWeight:800, letterSpacing:".14em",
                color:TOKENS.ink, opacity:0.55, display:"flex", alignItems:"center", gap:4 }}>
                <svg width="22" height="11" viewBox="0 0 60 30" fill="none">
                  <rect width="60" height="30" rx="3" fill="#635BFF"/>
                  <text x="6" y="20" fontFamily="Helvetica" fontWeight="900" fontSize="14" fill="#fff">stripe</text>
                </svg>
                · HOLD A SPOT
              </div>
              <div style={{ fontFamily:TOKENS.display, fontWeight:900, fontSize:18, color:TOKENS.ink, marginTop:2 }}>
                $10 deposit · refundable</div>
            </div>
            <button style={{ appearance:"none", cursor:"pointer", padding:"10px 14px",
              border:`2.5px solid ${TOKENS.ink}`, borderRadius:999, background:TOKENS.ink,
              color:TOKENS.paper, fontFamily:TOKENS.ui, fontSize:13, fontWeight:900 }}>reserve →</button>
          </div>
        )}
        <SectionLabel>about</SectionLabel>
        <p style={{ fontFamily:TOKENS.ui, fontSize:14, fontWeight:600, color:TOKENS.ink,
          opacity:0.85, margin:"0 0 14px", lineHeight:1.45 }}>{v.blurb}</p>
        <SectionLabel>route from your last stop</SectionLabel>
        <div style={{ position:"relative", height:130, marginBottom:16,
          border:`2.5px solid ${TOKENS.ink}`, borderRadius:12, background:"#e8e6d8",
          overflow:"hidden", boxShadow:`3px 3px 0 ${TOKENS.ink}` }}>
          <div style={{ position:"absolute", inset:0, opacity:0.5,
            backgroundImage:`linear-gradient(rgba(0,0,0,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.2) 1px, transparent 1px)`,
            backgroundSize:"20px 20px" }}/>
          <svg viewBox="0 0 350 120" style={{ position:"absolute", inset:0 }}>
            <path d="M 30 90 Q 100 40, 180 60 T 320 30" stroke={TOKENS.accent1} strokeWidth="4" fill="none"/>
            <circle cx="30" cy="90" r="9" fill={TOKENS.accent2} stroke={TOKENS.ink} strokeWidth="2.5"/>
            <circle cx="320" cy="30" r="11" fill={TOKENS.accent1} stroke={TOKENS.ink} strokeWidth="2.5"/>
            <text x="40" y="84" fontFamily="JetBrains Mono" fontWeight="700" fontSize="9">FROM</text>
            <text x="290" y="48" fontFamily="JetBrains Mono" fontWeight="700" fontSize="9">HERE</text>
          </svg>
          <span style={{ position:"absolute", bottom:8, right:10, padding:"3px 8px",
            background:TOKENS.paper, border:`1.5px solid ${TOKENS.ink}`, borderRadius:6,
            fontFamily:TOKENS.mono, fontSize:10, fontWeight:800 }}>Google Maps</span>
        </div>
        <SectionLabel>2 friends have been</SectionLabel>
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", marginBottom:14,
          border:`2px solid ${TOKENS.ink}`, borderRadius:12, background:TOKENS.paper }}>
          <div style={{ display:"flex" }}>
            {[TOKENS.accent1,TOKENS.accent3].map((c,i) => (
              <span key={i} style={{ width:32, height:32, borderRadius:999, border:`2.5px solid ${TOKENS.ink}`,
                background:c, marginLeft:i>0?-10:0, display:"flex", alignItems:"center",
                justifyContent:"center", fontFamily:TOKENS.display, fontWeight:900, fontSize:13, color:TOKENS.ink }}>
                {["M","D"][i]}
              </span>
            ))}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:TOKENS.ui, fontSize:12, fontWeight:800, color:TOKENS.ink }}>
              @maya · "best mezcal flight in BK"</div>
            <div style={{ fontFamily:TOKENS.mono, fontSize:10, fontWeight:700, opacity:0.55, marginTop:1 }}>
              2 WEEKS AGO · ★★★★★</div>
          </div>
        </div>
      </div>
      <div style={{ position:"absolute", bottom:12, left:16, right:16, zIndex:20 }}>
        <ChunkyButton variant="accent" onClick={() => onAdd(v)} icon={Icons.arrow}>
          add to tonight's pass
        </ChunkyButton>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────
type Tab = "explore" | "reels" | "venue";

function ExplorePage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("explore");
  const [exploreIdx, setExploreIdx] = useState(0);
  const [exploreFilter, setExploreFilter] = useState("all");
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const onBack = () => navigate({ to: "/new/hub" });
  const onExploreScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const t = e.target as HTMLDivElement;
    setExploreIdx(Math.round(t.scrollTop / t.clientHeight));
  };

  if (tab === "venue" && selectedVenue) {
    return (
      <Frame>
        <div style={{ height:"100dvh", position:"relative" }}>
          <VenueDetailScreen venue={selectedVenue} onBack={() => setTab("explore")}
            onAdd={() => navigate({ to:"/new/plan-review" })}/>
        </div>
      </Frame>
    );
  }

  return (
    <Frame>
      <div className="cf-screen" style={{ height:"100dvh", position:"relative", overflow:"hidden",
        background:TOKENS.ink, color:TOKENS.paper }}>
        {tab === "explore" && (
          <>
            <div style={{ position:"absolute", top:56, left:16, right:16, zIndex:20,
              display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
              <button onClick={onBack} style={{ appearance:"none", cursor:"pointer", width:36, height:36,
                borderRadius:999, border:`2px solid ${TOKENS.paper}`, background:"rgba(0,0,0,0.4)",
                color:TOKENS.paper, fontSize:16, fontWeight:900, backdropFilter:"blur(20px)" }}>←</button>
              <div style={{ display:"inline-flex", alignItems:"center", gap:6, fontFamily:TOKENS.display,
                fontWeight:900, fontSize:17, padding:"6px 12px", border:`2px solid ${TOKENS.paper}`,
                borderRadius:999, background:"rgba(0,0,0,0.45)", backdropFilter:"blur(20px)" }}>
                <span style={{ color:TOKENS.accent1 }}>✣</span>explore
              </div>
              <button onClick={() => setTab("reels")} style={{ appearance:"none", cursor:"pointer",
                padding:"7px 12px", borderRadius:999, border:`2px solid ${TOKENS.paper}`,
                background:"rgba(0,0,0,0.4)", color:TOKENS.paper, fontFamily:TOKENS.ui,
                fontSize:11, fontWeight:800, backdropFilter:"blur(20px)" }}>reels ▶</button>
            </div>
            <div style={{ position:"absolute", top:104, left:0, right:0, zIndex:18,
              display:"flex", gap:6, padding:"0 16px", overflowX:"auto", scrollbarWidth:"none" }}>
              {["all","open now","walkable","rooftop","foodie","cheap"].map(f => (
                <button key={f} onClick={() => setExploreFilter(f)} style={{ appearance:"none",
                  cursor:"pointer", padding:"6px 12px", flexShrink:0,
                  border:`2px solid ${TOKENS.paper}`, borderRadius:999,
                  background:f===exploreFilter?TOKENS.accent1:"rgba(0,0,0,0.45)",
                  color:f===exploreFilter?TOKENS.ink:TOKENS.paper,
                  fontFamily:TOKENS.ui, fontSize:12, fontWeight:800,
                  backdropFilter:"blur(20px)", textTransform:"lowercase" as const }}>{f}</button>
              ))}
            </div>
            <div style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)",
              zIndex:20, display:"flex", flexDirection:"column", gap:6 }}>
              {VENUES.map((_,i) => (
                <div key={i} style={{ width:3, height:i===exploreIdx?22:6, borderRadius:999,
                  background:i===exploreIdx?TOKENS.accent1:"rgba(255,255,255,0.4)",
                  transition:"all .25s" }}/>
              ))}
            </div>
            <div ref={containerRef} onScroll={onExploreScroll} style={{ height:"100%",
              overflowY:"auto", scrollSnapType:"y mandatory", scrollbarWidth:"none" }}>
              {VENUES.map((v,i) => (
                <ExploreCard key={v.id} venue={v} active={i===exploreIdx}
                  onTap={() => { setSelectedVenue(v); setTab("venue"); }}
                  onAdd={() => navigate({ to:"/new/plan-review" })}/>
              ))}
            </div>
            <div style={{ position:"absolute", bottom:18, left:0, right:0, zIndex:20,
              display:"flex", gap:8, padding:"0 16px", pointerEvents:"none" }}>
              <button onClick={() => navigate({ to:"/new/plan-review" })} style={{ appearance:"none",
                cursor:"pointer", pointerEvents:"auto", flex:1, display:"inline-flex",
                alignItems:"center", justifyContent:"center", gap:8, padding:"14px 18px",
                border:`3px solid ${TOKENS.paper}`, borderRadius:999, background:TOKENS.accent1,
                color:TOKENS.ink, fontFamily:TOKENS.ui, fontSize:14, fontWeight:900,
                boxShadow:`4px 4px 0 ${TOKENS.paper}` }}>＋ add to pass</button>
              <button onClick={() => { setSelectedVenue(VENUES[exploreIdx]); setTab("venue"); }}
                style={{ appearance:"none", cursor:"pointer", pointerEvents:"auto", padding:"0 16px",
                  border:`3px solid ${TOKENS.paper}`, borderRadius:999, background:"rgba(0,0,0,0.4)",
                  color:TOKENS.paper, fontFamily:TOKENS.ui, fontSize:14, fontWeight:900,
                  backdropFilter:"blur(20px)" }}>open</button>
            </div>
          </>
        )}
        {tab === "reels" && (
          <>
            <div style={{ position:"absolute", top:56, left:16, right:16, zIndex:20,
              display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <button onClick={() => setTab("explore")} style={{ appearance:"none", cursor:"pointer",
                width:36, height:36, borderRadius:999, border:`2px solid ${TOKENS.paper}`,
                background:"rgba(0,0,0,0.4)", color:TOKENS.paper, fontSize:16, fontWeight:900,
                backdropFilter:"blur(20px)" }}>←</button>
              <div style={{ display:"flex", gap:14, fontFamily:TOKENS.display, fontWeight:900,
                fontSize:15, color:TOKENS.paper }}>
                <span style={{ opacity:0.5 }}>For you</span>
                <span style={{ position:"relative" }}>
                  Following
                  <div style={{ position:"absolute", bottom:-6, left:0, right:0, height:2, background:TOKENS.accent1 }}/>
                </span>
              </div>
              <button style={{ appearance:"none", cursor:"pointer", width:36, height:36, borderRadius:999,
                border:`2px solid ${TOKENS.paper}`, background:"rgba(0,0,0,0.4)", color:TOKENS.paper,
                fontSize:16, fontWeight:900, backdropFilter:"blur(20px)" }}>⌕</button>
            </div>
            <div style={{ height:"100%", overflowY:"auto", scrollSnapType:"y mandatory", scrollbarWidth:"none" }}>
              {REELS.map((r,i) => r.kind === "aipass"
                ? <ReelPassCard key={i} pass={r} onAddStop={() => {}}/>
                : <ReelCard key={i} reel={r} onAddStop={() => {}}/>
              )}
            </div>
          </>
        )}
      </div>
    </Frame>
  );
}
