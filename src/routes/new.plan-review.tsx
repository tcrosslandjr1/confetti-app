import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Frame, TOKENS, DotsBg } from "@/components/new-confetti/shell";

// Ported from design/new-confetti/project/confetti-code/plan-review.jsx (PlanReviewScreen)
export const Route = createFileRoute("/new/plan-review")({ component: PlanReviewPage });

// ─── Mock plan data (in production, passed via route state / store) ─
interface PlanStop { name: string; kind?: string; tag?: string; time?: string; }
interface GeneratedPlan { stops: PlanStop[]; totalCost?: string; duration?: string; }
interface PlanState { city?: string; vibes?: string[]; budget?: string; }

const DEFAULT_PLAN: GeneratedPlan = {
  stops: [
    { name:"Westlight rooftop", tag:"rooftop · $$$", time:"6:30 PM" },
    { name:"Lupa Notte",        tag:"italian · counter", time:"8:00 PM" },
    { name:"Skinny Dennis",     tag:"dive nightcap", time:"10:30 PM" },
  ],
  totalCost:"~$84",
  duration:"4h",
};
const DEFAULT_STATE: PlanState = { city:"Brooklyn", vibes:["rooftop","date","foodie"], budget:"$$" };

function PlanReviewPage() {
  const navigate = useNavigate();
  const [shuffling, setShuffling] = useState(false);

  const generatedPlan = DEFAULT_PLAN;
  const planState = DEFAULT_STATE;
  const stops = generatedPlan.stops;

  const handleShuffle = () => {
    setShuffling(true);
    setTimeout(() => { setShuffling(false); }, 600);
  };

  return (
    <Frame>
      <div className="cf-screen" style={{ position:"relative", height:"100dvh", overflow:"hidden",
        background:TOKENS.bg, display:"flex", flexDirection:"column", padding:"56px 22px 28px" }}>
        <DotsBg opacity={0.06}/>

        {/* Header */}
        <div style={{ position:"relative", zIndex:2, marginBottom:14 }}>
          <span style={{ fontFamily:TOKENS.mono, fontSize:10, fontWeight:800,
            letterSpacing:".14em", opacity:0.55, color:TOKENS.ink }}>
            SPARKLE PRESENTS · REVIEW
          </span>
          <h1 style={{ fontFamily:TOKENS.display, fontWeight:900, fontSize:32, lineHeight:0.94,
            letterSpacing:"-0.04em", color:TOKENS.ink, margin:"8px 0 6px" }}>
            Here's what<br/>I made.
          </h1>
          <p style={{ fontFamily:TOKENS.ui, fontSize:12, fontWeight:600, opacity:0.6,
            margin:0, color:TOKENS.ink }}>
            {generatedPlan.totalCost || "~$84"} · {generatedPlan.duration || "4h"} · {planState.city || "Brooklyn"}
          </p>
        </div>

        {/* Summary card */}
        <div style={{ position:"relative", zIndex:2, padding:14, marginBottom:14,
          border:`3px solid ${TOKENS.ink}`, borderRadius:18,
          background:TOKENS.paper, boxShadow:`5px 5px 0 ${TOKENS.ink}`,
          opacity:shuffling ? 0.4 : 1, transition:"opacity .25s" }}>
          {stops.map((s,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:12,
              padding:"10px 0",
              borderTop:i ? `1.5px dashed ${TOKENS.ink}` : "none" }}>
              <span style={{ flexShrink:0, width:26, height:26, borderRadius:"50%",
                border:`2px solid ${TOKENS.ink}`,
                background:[TOKENS.accent1, TOKENS.accent2, TOKENS.accent3][i % 3],
                color:i===2 ? TOKENS.paper : TOKENS.ink,
                fontFamily:TOKENS.display, fontWeight:900, fontSize:13,
                display:"inline-flex", alignItems:"center", justifyContent:"center" }}>
                {i + 1}
              </span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:TOKENS.display, fontWeight:900, fontSize:16,
                  letterSpacing:"-0.02em", lineHeight:1.05 }}>{s.name}</div>
                <div style={{ fontFamily:TOKENS.mono, fontSize:9, fontWeight:700,
                  letterSpacing:".1em", opacity:0.55, marginTop:2, textTransform:"uppercase" as const }}>
                  {s.kind || s.tag} · {s.time || ""}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* "Chosen because" transparency */}
        <div style={{ position:"relative", zIndex:2, padding:"10px 12px", marginBottom:14,
          background:"rgba(19,11,13,0.04)", border:`1.5px dashed ${TOKENS.ink}`, borderRadius:10,
          fontFamily:TOKENS.mono, fontSize:10, fontWeight:600,
          color:TOKENS.ink, opacity:0.75, lineHeight:1.5 }}>
          ↳ chosen for: {(planState.vibes || []).join(" · ") || "your taste"} · {planState.budget || "$$"} budget · walking distance
        </div>

        {/* Action stack */}
        <div style={{ position:"relative", zIndex:2,
          display:"flex", flexDirection:"column", gap:8, marginTop:"auto" }}>
          <button onClick={() => navigate({ to:"/new/pass" })} style={{ appearance:"none", cursor:"pointer",
            padding:"14px 16px", border:`3px solid ${TOKENS.ink}`, borderRadius:14,
            background:TOKENS.accent1, color:TOKENS.ink, fontFamily:TOKENS.display, fontWeight:900,
            fontSize:17, letterSpacing:"-0.02em", boxShadow:`5px 5px 0 ${TOKENS.ink}`,
            display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            ✓ keep — print the pass
          </button>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            <button onClick={handleShuffle} disabled={shuffling} style={{ appearance:"none",
              cursor:"pointer", padding:"12px 12px", border:`2.5px solid ${TOKENS.ink}`,
              borderRadius:12, background:TOKENS.paper, color:TOKENS.ink,
              fontFamily:TOKENS.ui, fontWeight:800, fontSize:12,
              boxShadow:`3px 3px 0 ${TOKENS.ink}`,
              display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              {shuffling ? "↻ shuffling…" : "↻ shuffle all"}
            </button>
            <button onClick={() => navigate({ to:"/new/chat" })} style={{ appearance:"none",
              cursor:"pointer", padding:"12px 12px", border:`2.5px solid ${TOKENS.ink}`,
              borderRadius:12, background:TOKENS.accent2, color:TOKENS.ink,
              fontFamily:TOKENS.ui, fontWeight:800, fontSize:12,
              boxShadow:`3px 3px 0 ${TOKENS.ink}`,
              display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              ✦ tweak with sparkle
            </button>
          </div>
        </div>
      </div>
    </Frame>
  );
}
