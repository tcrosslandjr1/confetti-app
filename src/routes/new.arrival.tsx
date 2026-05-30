import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Frame, TOKENS, DotsBg, Icons } from "@/components/new-confetti/shell";

// Ported from design/new-confetti/project/confetti-code/arrival.jsx
export const Route = createFileRoute("/new/arrival")({ component: ArrivalPage });

// ─── ArrivalRow ───────────────────────────────────────────────────
function ArrivalRow({ on, setOn, icon, tag, tagColor, tagFg = TOKENS.ink,
  label, sub, children }: {
  on: boolean; setOn: (v: boolean) => void;
  icon: string; tag: string; tagColor: string; tagFg?: string;
  label: string; sub: string; children?: React.ReactNode;
}) {
  return (
    <div style={{ padding:12, marginBottom:10,
      border:`2.5px solid ${TOKENS.ink}`, borderRadius:14,
      background:on ? TOKENS.paper : "rgba(255,250,240,0.5)",
      boxShadow:on ? `4px 4px 0 ${TOKENS.ink}` : "none",
      transition:"all .12s" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ width:36, height:36, borderRadius:8,
          border:`2px solid ${TOKENS.ink}`, background:tagColor, color:tagFg,
          display:"inline-flex", alignItems:"center", justifyContent:"center",
          fontSize:18, flexShrink:0 }}>{icon}</span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:TOKENS.mono, fontSize:9, fontWeight:800, letterSpacing:".14em",
            opacity:0.6, textTransform:"uppercase" as const }}>{tag}</div>
          <div style={{ fontFamily:TOKENS.ui, fontSize:13, fontWeight:800, color:TOKENS.ink,
            lineHeight:1.2, marginTop:1 }}>{label}</div>
          <div style={{ fontFamily:TOKENS.ui, fontSize:11, fontWeight:600,
            opacity:0.6, marginTop:2, lineHeight:1.3 }}>{sub}</div>
        </div>
        <button onClick={() => setOn(!on)} style={{ appearance:"none", cursor:"pointer",
          width:38, height:22, borderRadius:999,
          background:on ? TOKENS.accent1 : "rgba(0,0,0,0.15)",
          border:`2px solid ${TOKENS.ink}`, position:"relative", flexShrink:0, padding:0 }}>
          <span style={{ position:"absolute", top:1, left:on?17:1, width:16, height:16,
            borderRadius:999, background:TOKENS.paper, border:`1.5px solid ${TOKENS.ink}`,
            transition:"left .15s" }}/>
        </button>
      </div>
      {on && children}
    </div>
  );
}

// ─── Chargerlet ───────────────────────────────────────────────────
function Chargerlet({ label, sub, highlight }: { label: string; sub?: string; highlight?: boolean }) {
  return (
    <div style={{ flex:1, padding:8, textAlign:"center" as const,
      border:`2px solid ${TOKENS.ink}`, borderRadius:8,
      background:highlight ? TOKENS.accent2 : TOKENS.paper,
      boxShadow:highlight ? `2px 2px 0 ${TOKENS.ink}` : "none", cursor:"pointer" }}>
      <div style={{ fontFamily:TOKENS.ui, fontSize:11, fontWeight:800 }}>{label}</div>
      {sub && <div style={{ fontFamily:TOKENS.mono, fontSize:9, fontWeight:700, opacity:0.6, marginTop:2 }}>{sub}</div>}
    </div>
  );
}

// ─── ParkOption ───────────────────────────────────────────────────
function ParkOption({ id, value, setValue, title, sub, rec, highlight }: {
  id: string; value: string; setValue: (v: string) => void;
  title: string; sub?: string; rec?: string; highlight?: boolean;
}) {
  const on = value === id;
  return (
    <button onClick={() => setValue(id)} style={{ appearance:"none", cursor:"pointer",
      textAlign:"left" as const, display:"flex", alignItems:"center", gap:10, padding:"10px 12px",
      border:`2px solid ${TOKENS.ink}`, borderRadius:10,
      background:on ? (highlight ? TOKENS.accent1 : TOKENS.accent2) : TOKENS.paper, color:TOKENS.ink,
      boxShadow:on ? `3px 3px 0 ${TOKENS.ink}` : "none",
      transform:on ? "translate(-1px,-1px)" : "none", transition:"all .12s" }}>
      <span style={{ width:18, height:18, borderRadius:999, border:`2px solid ${TOKENS.ink}`,
        background:on ? TOKENS.ink : "transparent",
        display:"inline-flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        {on && <span style={{ width:6, height:6, borderRadius:999, background:TOKENS.paper }}/>}
      </span>
      <div style={{ flex:1 }}>
        <div style={{ fontFamily:TOKENS.ui, fontSize:13, fontWeight:800 }}>{title}</div>
        {sub && <div style={{ fontFamily:TOKENS.mono, fontSize:10, fontWeight:700, opacity:0.6, marginTop:1, letterSpacing:".04em" }}>{sub}</div>}
      </div>
      {rec && (
        <span style={{ padding:"2px 7px", background:TOKENS.ink, color:TOKENS.paper,
          border:`1.5px solid ${TOKENS.ink}`, borderRadius:999,
          fontFamily:TOKENS.mono, fontSize:9, fontWeight:800,
          letterSpacing:".1em", textTransform:"uppercase" as const }}>{rec}</span>
      )}
    </button>
  );
}

// ─── ArrivalSheet ─────────────────────────────────────────────────
function ArrivalSheet({ onClose, onConfirm, venueName }: {
  onClose: () => void; onConfirm: () => void; venueName?: string;
}) {
  const [preorder, setPreorder] = useState(true);
  const [pingHost, setPingHost] = useState(true);
  const [valet, setValet] = useState("none");
  const vehicle = { kind:"ev", battery:42, range:88 };

  return (
    <div style={{ position:"absolute", inset:0, zIndex:65,
      display:"flex", alignItems:"flex-end", animation:"cf-fadein 0.2s" }}>
      <div onClick={onClose} style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.55)" }}/>
      <div style={{ position:"relative", width:"100%", background:TOKENS.bg, color:TOKENS.ink,
        borderRadius:"26px 26px 0 0", borderTop:`3px solid ${TOKENS.ink}`,
        boxShadow:`0 -10px 0 ${TOKENS.ink}`,
        padding:"12px 20px 24px", maxHeight:"94%", overflowY:"auto",
        scrollbarWidth:"none", animation:"cf-slideup 0.32s cubic-bezier(.2,.9,.2,1)" }}>
        <div style={{ width:44, height:5, borderRadius:999, background:TOKENS.ink, opacity:0.25,
          margin:"0 auto 14px" }}/>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <div style={{ flex:1 }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:6,
              padding:"4px 10px", marginBottom:8, background:TOKENS.accent1, color:TOKENS.ink,
              border:`2px solid ${TOKENS.ink}`, borderRadius:999,
              fontFamily:TOKENS.mono, fontSize:9, fontWeight:800, letterSpacing:".14em" }}>
              <span style={{ width:6, height:6, borderRadius:999, background:TOKENS.ink,
                animation:"cf-pulse 1.2s infinite" }}/>
              1 MI FROM {(venueName || "LUPA NOTTE").toUpperCase()}
            </div>
            <div style={{ fontFamily:TOKENS.display, fontWeight:900, fontSize:26,
              letterSpacing:"-0.03em", lineHeight:1.05 }}>Ready to land?</div>
            <div style={{ fontFamily:TOKENS.ui, fontSize:12, fontWeight:700, opacity:0.65, marginTop:4 }}>
              4 things Confetti can handle on the way.
            </div>
          </div>
          <button onClick={onClose} style={{ appearance:"none", cursor:"pointer",
            width:34, height:34, borderRadius:999, border:`2.5px solid ${TOKENS.ink}`,
            background:TOKENS.paper, fontSize:14, fontWeight:900 }}>✕</button>
        </div>

        {/* 1. Pre-order */}
        <ArrivalRow on={preorder} setOn={setPreorder}
          icon="🍝" tag="PRE-ORDER" tagColor={TOKENS.accent1}
          label="Send your usual to the kitchen"
          sub="carbonara · burrata · rosé · ready when you sit">
          <div style={{ marginTop:8, padding:10, background:TOKENS.bg, borderRadius:8,
            border:`1.5px dashed ${TOKENS.ink}` }}>
            <div style={{ display:"flex", justifyContent:"space-between",
              fontFamily:TOKENS.mono, fontSize:10, fontWeight:700,
              opacity:0.65, marginBottom:4, letterSpacing:".06em" }}>
              <span>YOUR USUAL · 3RD VISIT</span><span>$52</span>
            </div>
            <div style={{ fontFamily:TOKENS.ui, fontSize:12, fontWeight:700 }}>
              1× carbonara · 1× burrata · 1× rosé glass · share-style
            </div>
            <button style={{ appearance:"none", cursor:"pointer", marginTop:6,
              fontFamily:TOKENS.mono, fontSize:9, fontWeight:800,
              background:"transparent", border:"none", padding:0, opacity:0.6,
              letterSpacing:".08em", textDecoration:"underline" }}>EDIT ORDER →</button>
          </div>
        </ArrivalRow>

        {/* 2. Ping host */}
        <ArrivalRow on={pingHost} setOn={setPingHost}
          icon="📞" tag="HOST PING" tagColor={TOKENS.accent2}
          label="Let the restaurant know you're 1 mi out"
          sub="they'll prep the table + greet by name on arrival"/>

        {/* 3. EV battery */}
        <ArrivalRow on={true} setOn={() => {}}
          icon="⚡" tag="VEHICLE" tagColor={TOKENS.accent3} tagFg={TOKENS.paper}
          label="EV detected · 42% battery"
          sub="88 mi range · we can route through a charger if needed">
          <div style={{ marginTop:8 }}>
            <div style={{ height:16, border:`2px solid ${TOKENS.ink}`, borderRadius:4,
              background:TOKENS.paper, overflow:"hidden", position:"relative" }}>
              <div style={{ height:"100%", width:`${vehicle.battery}%`,
                background:vehicle.battery>50 ? TOKENS.accent4 :
                           vehicle.battery>20 ? TOKENS.accent2 : "#d32323",
                transition:"width .4s" }}/>
              <span style={{ position:"absolute", inset:0, display:"flex",
                alignItems:"center", justifyContent:"center",
                fontFamily:TOKENS.mono, fontSize:9, fontWeight:800, color:TOKENS.ink }}>
                ⚡ {vehicle.battery}% · {vehicle.range} mi
              </span>
            </div>
            <div style={{ display:"flex", gap:6, marginTop:8 }}>
              <Chargerlet label="🅿 valet w/ L2 charger" sub="+ $5" highlight/>
              <Chargerlet label="🔌 EVgo · 0.3 mi" sub="DC fast"/>
              <Chargerlet label="skip charge"/>
            </div>
            <div style={{ marginTop:8, padding:"7px 10px", background:TOKENS.ink,
              color:TOKENS.paper, border:`2px solid ${TOKENS.ink}`, borderRadius:8,
              fontFamily:TOKENS.mono, fontSize:10, fontWeight:700, letterSpacing:".06em", lineHeight:1.4 }}>
              ✣ Lupa's valet has 2 L2 chargers · we'll grab one. Adds $5 to ticket.
            </div>
          </div>
        </ArrivalRow>

        {/* 4. Parking */}
        <ArrivalRow on={valet !== "none"} setOn={() => {}}
          icon="🅿" tag="PARKING" tagColor={TOKENS.accent2}
          label="Where to leave the car"
          sub="claude pre-arranged · pick your move">
          <div style={{ marginTop:8, display:"flex", flexDirection:"column", gap:6 }}>
            <ParkOption id="valet"  value={valet} setValue={setValet}
              title="Valet at Lupa" sub="$35 · w/ L2 charger · 0 walk" rec="best for EV" highlight/>
            <ParkOption id="garage" value={valet} setValue={setValet}
              title="Wythe Garage · 0.1 mi" sub="$22 · 18 spots open · auto-pay"/>
            <ParkOption id="street" value={valet} setValue={setValet}
              title="N 6th St · free after 7 PM" sub="6 spots seen · 5 min walk"/>
            <ParkOption id="none"   value={valet} setValue={setValet} title="No car"/>
          </div>
        </ArrivalRow>

        {/* Confirm */}
        <button onClick={onConfirm} style={{ appearance:"none", cursor:"pointer", width:"100%",
          display:"inline-flex", alignItems:"center", justifyContent:"center", gap:10,
          padding:"16px 20px", marginTop:4, border:`3px solid ${TOKENS.ink}`, borderRadius:16,
          background:TOKENS.accent1, color:TOKENS.ink, fontFamily:TOKENS.ui, fontSize:16,
          fontWeight:900, boxShadow:`5px 5px 0 ${TOKENS.ink}` }}>
          ship it · 7 min eta {Icons.arrow}
        </button>

        <div style={{ marginTop:12, padding:"10px 12px", background:TOKENS.paper,
          border:`2px dashed ${TOKENS.ink}`, borderRadius:10,
          fontFamily:TOKENS.mono, fontSize:10, fontWeight:700, opacity:0.7,
          lineHeight:1.5, letterSpacing:".04em" }}>
          🔒 EV battery read via Apple CarKey / Android Auto · only while pass is active.
          You can disable in Settings → Vehicles.
        </div>
      </div>
    </div>
  );
}

// ─── BizValetPanel ────────────────────────────────────────────────
function ValetField({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding:"10px 12px", border:`2px solid ${TOKENS.ink}`, borderRadius:10, background:TOKENS.bg }}>
      <div style={{ fontFamily:TOKENS.mono, fontSize:9, fontWeight:800, letterSpacing:".14em",
        opacity:0.55, textTransform:"uppercase" as const }}>{label}</div>
      <div style={{ fontFamily:TOKENS.display, fontWeight:900, fontSize:16,
        letterSpacing:"-0.02em", marginTop:2 }}>{value}</div>
    </div>
  );
}

function BizValetPanel() {
  return (
    <div style={{ padding:18, border:`2.5px solid ${TOKENS.ink}`, borderRadius:16,
      background:TOKENS.paper, boxShadow:`5px 5px 0 ${TOKENS.ink}` }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
        <h3 style={{ margin:0, fontFamily:TOKENS.display, fontWeight:900, fontSize:18, letterSpacing:"-0.02em" }}>
          Valet & EV charging service
        </h3>
        <span style={{ padding:"4px 10px", background:TOKENS.accent1, color:TOKENS.ink,
          border:`2px solid ${TOKENS.ink}`, borderRadius:999,
          fontFamily:TOKENS.mono, fontSize:10, fontWeight:800, letterSpacing:".14em" }}>PREMIUM</span>
      </div>
      <p style={{ fontFamily:TOKENS.ui, fontSize:13, fontWeight:700, opacity:0.7,
        margin:"0 0 14px", lineHeight:1.45 }}>
        Fine-dining customers expect their car handled. Confetti routes valet pre-arrival, reads EV battery,
        and reserves chargers — no scrambling at the door.
      </p>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
        <ValetField label="Valet rate"     value="$35 flat"/>
        <ValetField label="Capacity"       value="22 cars"/>
        <ValetField label="L2 chargers"    value="2 stalls · $5 add-on"/>
        <ValetField label="DC fast nearby" value="EVgo · 0.3 mi"/>
        <ValetField label="Pre-arrival ping" value="ON · 1 mi"/>
        <ValetField label="Avg pickup"     value="4 min"/>
      </div>
      <div style={{ marginTop:14, padding:"10px 12px", border:`2px dashed ${TOKENS.ink}`,
        borderRadius:10, background:TOKENS.bg, fontFamily:TOKENS.mono, fontSize:10,
        fontWeight:700, opacity:0.75, letterSpacing:".04em", lineHeight:1.5 }}>
        ⚡ 14 EV pre-arrivals this week · 6 used your chargers · +$84 added to ticket avg.
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────
function ArrivalPage() {
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(true);
  const [confirmed, setConfirmed] = useState(false);

  return (
    <Frame>
      <div style={{ position:"relative", height:"100dvh", background:TOKENS.bg,
        display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <DotsBg opacity={0.05}/>

        {/* Top bar */}
        <div style={{ position:"relative", zIndex:2, display:"flex", alignItems:"center",
          justifyContent:"space-between", padding:"56px 22px 12px" }}>
          <button onClick={() => navigate({ to:"/new/pass" })} style={{ appearance:"none",
            cursor:"pointer", width:36, height:36, borderRadius:999,
            border:`2.5px solid ${TOKENS.ink}`, background:TOKENS.paper,
            fontSize:14, fontWeight:900, boxShadow:`3px 3px 0 ${TOKENS.ink}` }}>←</button>
          <span style={{ fontFamily:TOKENS.mono, fontSize:10, fontWeight:800,
            letterSpacing:".14em", opacity:0.55, textTransform:"uppercase" as const }}>
            ARRIVAL MODE
          </span>
          <span style={{ width:36 }}/>
        </div>

        {/* Body — shows BizValetPanel when sheet is dismissed */}
        <div style={{ position:"relative", zIndex:2, flex:1, overflowY:"auto",
          padding:"0 22px 24px", scrollbarWidth:"none" }}>
          {confirmed ? (
            <div style={{ padding:18, border:`3px solid ${TOKENS.ink}`, borderRadius:18,
              background:TOKENS.accent1, boxShadow:`5px 5px 0 ${TOKENS.ink}`, marginBottom:14 }}>
              <div style={{ fontFamily:TOKENS.mono, fontSize:10, fontWeight:800,
                letterSpacing:".14em", opacity:0.7, textTransform:"uppercase" as const }}>
                ✓ ALL SET · ETA 7 MIN
              </div>
              <div style={{ fontFamily:TOKENS.display, fontWeight:900, fontSize:26,
                letterSpacing:"-0.03em", lineHeight:1.05, marginTop:6 }}>
                Kitchen notified.<br/>Valet reserved.<br/>Pre-order sent.
              </div>
              <div style={{ fontFamily:TOKENS.ui, fontSize:13, fontWeight:700, opacity:0.85, marginTop:10 }}>
                Lupa Notte · pass #A7K2 · table for 2
              </div>
            </div>
          ) : (
            <button onClick={() => setSheetOpen(true)} style={{ appearance:"none", cursor:"pointer",
              width:"100%", padding:"14px 16px", border:`3px solid ${TOKENS.ink}`, borderRadius:14,
              background:TOKENS.accent1, color:TOKENS.ink, fontFamily:TOKENS.display, fontWeight:900,
              fontSize:17, letterSpacing:"-0.02em", boxShadow:`5px 5px 0 ${TOKENS.ink}`,
              display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:18 }}>
              ⚡ arrival check-in
            </button>
          )}
          <BizValetPanel/>
        </div>

        {/* Arrival sheet overlay */}
        {sheetOpen && !confirmed && (
          <ArrivalSheet
            venueName="Lupa Notte"
            onClose={() => setSheetOpen(false)}
            onConfirm={() => { setConfirmed(true); setSheetOpen(false); }}
          />
        )}
      </div>
    </Frame>
  );
}
