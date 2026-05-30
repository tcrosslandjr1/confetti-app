import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Frame, TOKENS } from "@/components/new-confetti/shell";

// Ported from design/new-confetti/project/confetti-code/signals.jsx (WhatsHotScreen)
export const Route = createFileRoute("/new/whats-hot")({ component: WhatsHotPage });

// ─── Signal type registry ─────────────────────────────────────────
const SIGNAL_TYPES: Record<string, { icon: string; label: string; c: string; fg: string }> = {
  trending: { icon:"🔥", label:"TRENDING",      c:TOKENS.accent1, fg:TOKENS.ink   },
  popular:  { icon:"⭐", label:"POPULAR",       c:TOKENS.accent2, fg:TOKENS.ink   },
  new:      { icon:"🆕", label:"JUST OPENED",   c:TOKENS.accent4, fg:TOKENS.paper },
  lowkey:   { icon:"🤫", label:"LOW KEY",       c:TOKENS.accent3, fg:TOKENS.paper },
  unique:   { icon:"✨", label:"UNIQUE",        c:TOKENS.ink,     fg:TOKENS.paper },
  faded:    { icon:"📈", label:"HAD A MOMENT",  c:TOKENS.paper,   fg:TOKENS.ink   },
};

// ─── Hot venue data ───────────────────────────────────────────────
interface HotVenue {
  id: string; name: string; tag: string; nbhd: string;
  signal: string; sub: string; why: string; color: string; top_post: string;
}
const HOT_VENUES: HotVenue[] = [
  { id:"h1", name:"Westlight rooftop", tag:"rooftop bar", nbhd:"Williamsburg · 0.8 mi",
    signal:"trending", sub:"240 posts this wk",
    why:'Trending on TikTok — sunset cocktail clips are blowing up. Matches your "rooftop" taste.',
    color:TOKENS.accent1, top_post:'@maya.brooklyn · 142k views · "sunset hit different"' },
  { id:"h2", name:"Eavesdrop", tag:"jazz · phones off", nbhd:"Bed-Stuy · 1.2 mi",
    signal:"lowkey", sub:"38 posts · all 5★",
    why:"Quiet TikTok footprint but every post is a love letter. Your speakeasy taste maps here.",
    color:TOKENS.accent3, top_post:'@dim_lit_only · 8.2k views · "the most underrated room"' },
  { id:"h3", name:"Mole Mama", tag:"oaxacan · just opened", nbhd:"Crown Hgts · 1.4 mi",
    signal:"new", sub:"opened 8 days ago",
    why:"Brand new — first dozen Yelp reviews are 5★. Chef is ex-Cosme.",
    color:TOKENS.accent4, top_post:'@bk.eats · 24k views · "soft launch but already perfect"' },
  { id:"h4", name:"Joe's Steam Rice Roll", tag:"cantonese · ny times", nbhd:"LES · 3.2 mi",
    signal:"popular", sub:"6.2k posts · 60 days",
    why:"#1 for Cantonese small bites in NYC TikTok. Crowded but worth it.",
    color:TOKENS.accent2, top_post:'@food.kid · 280k views · "this is the rice roll"' },
  { id:"h5", name:"Le Crocodile · backyard", tag:"french · backyard only", nbhd:"Williamsburg · 0.6 mi",
    signal:"unique", sub:"only-in-spring",
    why:"Backyard-only menu, 6 weeks a year, vinyl jazz only. There is nothing like it.",
    color:TOKENS.ink, top_post:"@nyc.brunch · 56k views · \"you won't believe this exists\"" },
];

function RailBtn({ icon, label, color, onClick }:
  { icon: string; label?: string; color?: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{ appearance:"none", cursor:"pointer",
      background:"transparent", border:"none", padding:0,
      color:TOKENS.paper, textAlign:"center" as const }}>
      <div style={{ width:44, height:44, borderRadius:999,
        border:`2px solid ${TOKENS.paper}`,
        background:color || "rgba(0,0,0,0.4)",
        color:color ? TOKENS.ink : TOKENS.paper,
        backdropFilter:"blur(10px)",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:18, fontWeight:900 }}>{icon}</div>
      {label && <div style={{ fontFamily:TOKENS.mono, fontSize:9, fontWeight:800, marginTop:3 }}>{label}</div>}
    </button>
  );
}

function HotCard({ v, onAdd }: { v: HotVenue; onAdd: () => void }) {
  const sig = SIGNAL_TYPES[v.signal] || SIGNAL_TYPES.trending;
  return (
    <div style={{ scrollSnapAlign:"start", scrollSnapStop:"always",
      height:"100%", position:"relative",
      background:v.color,
      backgroundImage:"repeating-linear-gradient(135deg, rgba(0,0,0,0.08) 0 14px, transparent 14px 28px)" }}>
      <svg width="100%" height="100%" viewBox="0 0 100 175" preserveAspectRatio="xMidYMid slice"
           style={{ position:"absolute", inset:0, opacity:0.4 }}>
        <rect width="100" height="175" fill="rgba(0,0,0,0.18)"/>
        <path d="M0 140 L25 115 L50 130 L75 105 L100 120 L100 175 L0 175Z" fill="rgba(0,0,0,0.4)"/>
      </svg>
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"70%",
        background:"linear-gradient(180deg, transparent, rgba(0,0,0,0.88))" }}/>
      <div style={{ position:"absolute", top:130, left:16, zIndex:5 }}>
        <span style={{ display:"inline-flex", alignItems:"center", gap:6,
          padding:"6px 12px", background:sig.c, color:sig.fg,
          border:`2.5px solid ${TOKENS.ink}`, borderRadius:999,
          fontFamily:TOKENS.mono, fontSize:11, fontWeight:800, letterSpacing:".14em",
          boxShadow:`3px 3px 0 ${TOKENS.ink}` }}>
          <span style={{ fontSize:14 }}>{sig.icon}</span>
          {sig.label}
          <span style={{ opacity:0.7 }}>· {v.sub}</span>
        </span>
      </div>
      <div style={{ position:"absolute", bottom:24, left:16, right:80, zIndex:5, color:TOKENS.paper }}>
        <div style={{ fontFamily:TOKENS.mono, fontSize:10, fontWeight:800, letterSpacing:".14em",
          textTransform:"uppercase" as const, opacity:0.85 }}>{v.tag} · {v.nbhd}</div>
        <h2 style={{ fontFamily:TOKENS.display, fontWeight:900, fontSize:40, lineHeight:0.95,
          letterSpacing:"-0.04em", margin:"4px 0 10px" }}>{v.name}</h2>
        <div style={{ padding:"8px 10px", marginBottom:10, background:"rgba(255,250,240,0.12)",
          border:"1.5px solid rgba(255,250,240,0.35)", borderRadius:8,
          fontFamily:TOKENS.ui, fontSize:12, fontWeight:700, backdropFilter:"blur(10px)", lineHeight:1.35 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4,
            fontFamily:TOKENS.mono, fontSize:9, fontWeight:800, letterSpacing:".14em", opacity:0.7 }}>
            <span style={{ color:TOKENS.accent1 }}>✣</span>
            WHY CONFETTI SURFACED THIS
          </div>
          <div>{v.why}</div>
        </div>
        <div style={{ padding:"7px 10px", background:"rgba(0,0,0,0.5)",
          border:`1.5px solid ${TOKENS.paper}`, borderRadius:6,
          fontFamily:TOKENS.mono, fontSize:9, fontWeight:700, letterSpacing:".04em", lineHeight:1.3,
          backdropFilter:"blur(10px)" }}>
          📺 TOP CLIP: {v.top_post}
        </div>
      </div>
      <div style={{ position:"absolute", bottom:100, right:12, zIndex:5,
        display:"flex", flexDirection:"column", gap:14, alignItems:"center" }}>
        <RailBtn icon="✣" label="add" color={TOKENS.accent1} onClick={onAdd}/>
        <RailBtn icon="♡" label="save"/>
        <RailBtn icon="↗" label="share"/>
        <RailBtn icon="⋯"/>
      </div>
    </div>
  );
}

function WhatsHotPage() {
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const t = e.target as HTMLDivElement;
    setIdx(Math.round(t.scrollTop / t.clientHeight));
  };
  return (
    <Frame>
      <div className="cf-screen" style={{ position:"relative", height:"100dvh",
        background:TOKENS.ink, color:TOKENS.paper, overflow:"hidden" }}>
        <div style={{ position:"absolute", top:56, left:16, right:16, zIndex:20,
          display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <button onClick={() => navigate({ to:"/new/hub" })} style={{ appearance:"none", cursor:"pointer",
            width:38, height:38, borderRadius:999, border:`2px solid ${TOKENS.paper}`,
            background:"rgba(0,0,0,0.4)", color:TOKENS.paper, fontSize:16, fontWeight:900,
            backdropFilter:"blur(20px)" }}>←</button>
          <div style={{ display:"inline-flex", alignItems:"center", gap:6,
            padding:"7px 13px", border:`2px solid ${TOKENS.paper}`, borderRadius:999,
            background:"rgba(0,0,0,0.45)", fontFamily:TOKENS.display, fontWeight:900, fontSize:14,
            backdropFilter:"blur(20px)" }}>🔥 What's Hot</div>
          <span style={{ padding:"6px 10px", border:`2px solid ${TOKENS.paper}`, borderRadius:999,
            background:"rgba(0,0,0,0.45)", fontFamily:TOKENS.mono, fontSize:10, fontWeight:800,
            letterSpacing:".12em", backdropFilter:"blur(20px)" }}>NYC</span>
        </div>
        <div style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)",
          zIndex:20, display:"flex", flexDirection:"column", gap:6 }}>
          {HOT_VENUES.map((_,i) => (
            <div key={i} style={{ width:3, height:i===idx?22:6, borderRadius:999,
              background:i===idx?TOKENS.accent1:"rgba(255,255,255,0.4)",
              transition:"all .25s" }}/>
          ))}
        </div>
        <div onScroll={onScroll} style={{ height:"100%", overflowY:"auto",
          scrollSnapType:"y mandatory", scrollbarWidth:"none" }}>
          {HOT_VENUES.map(v => (
            <HotCard key={v.id} v={v} onAdd={() => navigate({ to:"/new/plan-review" })}/>
          ))}
        </div>
      </div>
    </Frame>
  );
}
