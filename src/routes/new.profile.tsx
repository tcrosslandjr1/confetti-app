import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Frame,
  DotsBg,
  TOKENS,
  RouteDots,
} from "@/components/new-confetti/shell";

export const Route = createFileRoute("/new/profile")({ component: ProfilePage });

// ─── QR code art ─────────────────────────────────────────────
function QRCodeArt() {
  const cells: [number, number][] = [];
  for (let y = 0; y < 12; y++) {
    for (let x = 0; x < 12; x++) {
      const corner = (x < 3 && y < 3) || (x > 8 && y < 3) || (x < 3 && y > 8);
      if (corner) {
        const edge =
          ((x === 0 || x === 2 || y === 0 || y === 2) && x < 3 && y < 3) ||
          ((x === 9 || x === 11 || y === 0 || y === 2) && x > 8 && y < 3) ||
          ((x === 0 || x === 2 || y === 9 || y === 11) && x < 3 && y > 8);
        const center = (x === 1 && y === 1) || (x === 10 && y === 1) || (x === 1 && y === 10);
        if (edge || center) cells.push([x, y]);
      } else {
        if (((x * 7 + y * 13 + x * y) % 5) < 2) cells.push([x, y]);
      }
    }
  }
  return (
    <div style={{ width: 84, height: 84, padding: 4, background: "#fff", borderRadius: 6, display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 1 }}>
      {Array.from({ length: 144 }).map((_, i) => {
        const x = i % 12, y = (i / 12) | 0;
        const on = cells.some(([a, b]) => a === x && b === y);
        return <div key={i} style={{ background: on ? "#000" : "transparent", aspectRatio: "1" }} />;
      })}
    </div>
  );
}

// ─── Wallet pass screen ───────────────────────────────────────
function WalletPassScreen({ onBack }: { onBack: () => void }) {
  const [activeStop, setActiveStop] = useState(0);
  const stops = [
    { time: "7:30", short: "Pete's",  name: "Skinny Pete's", tag: "dive bar",  addr: "14 Wythe Ave",     booking: "walk-in", status: "ready", perk: "comp first round" },
    { time: "8:30", short: "Lupa",    name: "Lupa Notte",    tag: "italian",   addr: "88 N 6th St",      booking: "deposit", status: "held",  perk: "$10 hold refundable til 6 PM" },
    { time: "10:30", short: "Quartz", name: "Quartz Room",   tag: "live show", addr: "146 Metropolitan", booking: "ticket",  status: "paid",  perk: "GA · Pearl Charles 11 PM" },
  ];
  const current = stops[activeStop];

  return (
    <div className="cf-screen" style={{ position: "relative", height: "100%", background: "#000", color: "#fff", overflow: "hidden", fontFamily: '-apple-system, "SF Pro", system-ui, sans-serif', display: "flex", flexDirection: "column" }}>
      {/* iOS header */}
      <div style={{ padding: "56px 16px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={onBack} style={{ appearance: "none", cursor: "pointer", background: "transparent", border: "none", color: "#0a84ff", fontFamily: "inherit", fontSize: 17, fontWeight: 600 }}>‹ Back</button>
        <span style={{ fontSize: 17, fontWeight: 600 }}>Wallet</span>
        <button style={{ appearance: "none", cursor: "pointer", background: "transparent", border: "none", color: "#0a84ff", fontFamily: "inherit", fontSize: 17, fontWeight: 600 }}>⋯</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 14px 100px", scrollbarWidth: "none" }}>
        {/* Pass card */}
        <div style={{ borderRadius: 16, background: "linear-gradient(160deg, #ff5b3d 0%, #ff8a5b 38%, #f7c83b 100%)", boxShadow: "0 14px 40px rgba(255,91,61,0.4), 0 2px 8px rgba(0,0,0,0.2)", overflow: "hidden", color: "#15110e" }}>
          <div style={{ padding: "14px 18px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: TOKENS.display, fontWeight: 900, fontSize: 15, letterSpacing: "-0.02em" }}><span>✣</span><span>confetti</span></div>
            <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.7 }}>#A7K2</span>
          </div>

          <div style={{ padding: "0 18px 14px" }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", opacity: 0.62 }}>TONIGHT PASS · SAT MAY 23</div>
            <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.05, marginTop: 2 }}>Brooklyn date night.</div>
          </div>

          {/* Stop strip */}
          <div style={{ padding: "12px 18px", background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "stretch", justifyContent: "space-between", gap: 8 }}>
            {stops.map((s, i) => (
              <div key={i} style={{ display: "contents" }}>
                <button onClick={() => setActiveStop(i)} style={{ flex: 1, appearance: "none", cursor: "pointer", textAlign: "center", background: "transparent", border: i === activeStop ? "2px solid #15110e" : "2px solid transparent", borderRadius: 8, padding: "6px 4px", color: "#15110e" }}>
                  <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".08em", opacity: 0.6, textTransform: "uppercase" }}>{s.time} PM</div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginTop: 1 }}>{s.short}</div>
                  <div style={{ fontSize: 8, fontWeight: 700, marginTop: 3, color: s.status === "paid" ? "#0a8a00" : s.status === "held" ? "#b8860b" : "#15110e", opacity: 0.85 }}>
                    {s.status === "paid" ? "✓ PAID" : s.status === "held" ? "⏱ HELD" : "🚶 WALK-IN"}
                  </div>
                </button>
                {i < 2 && <div style={{ width: 1, background: "#15110e", opacity: 0.2 }} />}
              </div>
            ))}
          </div>

          {/* Perforation */}
          <div style={{ position: "relative", height: 24, display: "flex", alignItems: "center" }}>
            <div style={{ position: "absolute", left: -12, top: "50%", transform: "translateY(-50%)", width: 24, height: 24, borderRadius: 999, background: "#000" }} />
            <div style={{ position: "absolute", right: -12, top: "50%", transform: "translateY(-50%)", width: 24, height: 24, borderRadius: 999, background: "#000" }} />
            <div style={{ flex: 1, borderTop: "1.5px dashed rgba(21,17,14,0.35)", margin: "0 18px" }} />
          </div>

          {/* Active stop QR */}
          <div style={{ padding: "8px 18px 18px", display: "flex", alignItems: "center", gap: 14 }}>
            <QRCodeArt />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".08em", opacity: 0.62, textTransform: "uppercase" }}>NOW SHOWING · STOP {activeStop + 1}</div>
              <div style={{ fontSize: 17, fontWeight: 700, marginTop: 3, lineHeight: 1.1, letterSpacing: "-0.01em" }}>{current.name}</div>
              <div style={{ fontSize: 11, fontWeight: 600, marginTop: 4, opacity: 0.75, lineHeight: 1.4 }}>{current.perk}</div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 16 }}>
          <button style={{ appearance: "none", cursor: "pointer", padding: "12px 14px", background: "rgba(255,255,255,0.12)", color: "#fff", border: "0", borderRadius: 12, fontFamily: "inherit", fontSize: 14, fontWeight: 600 }}>↗ Share</button>
          <button style={{ appearance: "none", cursor: "pointer", padding: "12px 14px", background: "#fff", color: "#000", border: "0", borderRadius: 12, fontFamily: "inherit", fontSize: 14, fontWeight: 600 }}>Open in Confetti</button>
        </div>

        {/* Per-stop list */}
        <div style={{ marginTop: 22, padding: "0 4px" }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".1em", opacity: 0.55, textTransform: "uppercase", marginBottom: 10 }}>TONIGHT'S STOPS · TAP TO SHOW QR</div>
          {stops.map((s, i) => (
            <button key={i} onClick={() => setActiveStop(i)} style={{
              appearance: "none", cursor: "pointer", width: "100%", textAlign: "left",
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 14px", marginBottom: 8, borderRadius: 12,
              background: i === activeStop ? "rgba(255,91,61,0.18)" : "rgba(255,255,255,0.06)",
              border: i === activeStop ? "1.5px solid rgba(255,91,61,0.65)" : "1.5px solid rgba(255,255,255,0.1)",
              color: "#fff",
            }}>
              <span style={{ width: 32, height: 32, borderRadius: 999, background: ["#f7c83b", "#ff5b3d", "#5b45d9"][i], color: "#15110e", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: TOKENS.display, fontWeight: 900, fontSize: 14, border: "2px solid #fff" }}>{i + 1}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.55, letterSpacing: ".06em", textTransform: "uppercase" }}>{s.time} PM · {s.tag}</div>
                <div style={{ fontFamily: TOKENS.display, fontWeight: 800, fontSize: 16, letterSpacing: "-0.02em", marginTop: 1 }}>{s.name}</div>
                <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.55, marginTop: 2 }}>{s.addr}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, padding: "3px 7px", borderRadius: 999, background: s.status === "paid" ? "#0a8a00" : s.status === "held" ? "#b8860b" : "#444", color: "#fff" }}>
                  {s.status === "paid" ? "✓ PAID" : s.status === "held" ? "⏱ HELD" : "🚶 WALK-IN"}
                </div>
                <div style={{ fontSize: 9, fontWeight: 600, opacity: 0.5, marginTop: 4, letterSpacing: ".06em" }}>{i === activeStop ? "SHOWING QR" : "TAP TO SHOW"}</div>
              </div>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 14, padding: "12px 14px", background: "rgba(255,255,255,0.06)", borderRadius: 12, fontSize: 11, fontWeight: 600, opacity: 0.7, lineHeight: 1.5 }}>
          🔒 Apple Wallet pass auto-refreshes throughout the night. Lock-screen swipe shows the next stop. Geofence-aware — pops up when you arrive.
        </div>
      </div>
    </div>
  );
}

// ─── Scrapbook tab ────────────────────────────────────────────
function ScrapbookTab({ onOpenWallet }: { onOpenWallet: () => void }) {
  const passes = [
    { date: "sat may 23", n: "Brooklyn date night", cost: "$92",  stops: 3, color: TOKENS.accent1, vibe: "foodie · chill",   active: true },
    { date: "fri may 16", n: "Bushwick crawl",       cost: "$48",  stops: 4, color: TOKENS.accent2, vibe: "hype · weird" },
    { date: "sat may 10", n: "LES date night",       cost: "$92",  stops: 3, color: TOKENS.accent1, vibe: "romantic" },
    { date: "thu may 1",  n: "Solo culture day",     cost: "$26",  stops: 2, color: TOKENS.accent3, vibe: "cultural" },
    { date: "fri apr 25", n: "Weird brunch",         cost: "$54",  stops: 3, color: TOKENS.accent2, vibe: "weird · foodie" },
  ];
  return (
    <div>
      {passes.map((p, i) => (
        <div key={i} onClick={p.active ? onOpenWallet : undefined} style={{
          cursor: p.active ? "pointer" : "default",
          display: "flex", gap: 12,
          padding: "14px 14px", marginBottom: 10,
          border: `2.5px solid ${TOKENS.ink}`, borderRadius: 14,
          background: p.color, boxShadow: `4px 4px 0 ${TOKENS.ink}`,
          transform: `rotate(${i % 2 === 0 ? -0.4 : 0.5}deg)`,
        }}>
          <div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".16em", opacity: 0.6, textTransform: "uppercase", color: TOKENS.ink, alignSelf: "flex-start" }}>{p.date}</div>
          <div style={{ flex: 1, color: TOKENS.ink }}>
            <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 18, letterSpacing: "-0.025em", lineHeight: 1.05 }}>{p.n}</div>
            <div style={{ fontFamily: TOKENS.ui, fontSize: 11, fontWeight: 700, opacity: 0.65, marginTop: 3 }}>{p.vibe}</div>
            <div style={{ marginTop: 8 }}>
              <RouteDots size={11} progress={1} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800, letterSpacing: ".12em", marginTop: 6 }}>
              <span>{p.stops} STOPS</span>
              <span>{p.cost}</span>
              {p.active && <span style={{ color: TOKENS.paper, background: TOKENS.ink, padding: "0 6px", borderRadius: 4 }}>IN WALLET ↗</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Stamps tab ───────────────────────────────────────────────
function StampsTab() {
  const stamps = [
    { id: "foodie",     tier: "gold",   ct: 12, color: TOKENS.accent2 },
    { id: "rooftop",    tier: "silver", ct: 4,  color: TOKENS.accent1 },
    { id: "late nite",  tier: "gold",   ct: 9,  color: TOKENS.accent3 },
    { id: "walker",     tier: "silver", ct: 6,  color: TOKENS.accent2 },
    { id: "first date", tier: "bronze", ct: 2,  color: TOKENS.accent1 },
    { id: "solo",       tier: "bronze", ct: 3,  color: TOKENS.accent3 },
    { id: "patio",      tier: "gold",   ct: 8,  color: TOKENS.accent2 },
    { id: "weird",      tier: "silver", ct: 4,  color: TOKENS.accent1 },
    { id: "cheap",      tier: "bronze", ct: 5,  color: TOKENS.accent3 },
  ];
  // deterministic rotations
  const rotations = [-1.2, 1.8, -0.7, 1.3, -1.9, 0.6, -1.4, 1.1, -0.9];
  return (
    <div>
      <p style={{ fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 700, color: TOKENS.ink, opacity: 0.65, margin: "0 0 14px" }}>One stamp per pass type. Unlock new ones by trying new vibes.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {stamps.map((s, idx) => (
          <div key={s.id} style={{
            padding: "12px 8px",
            border: `2.5px solid ${TOKENS.ink}`, borderRadius: 14,
            background: s.color, color: TOKENS.ink,
            boxShadow: `3px 3px 0 ${TOKENS.ink}`,
            textAlign: "center",
            transform: `rotate(${rotations[idx]}deg)`,
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 999, border: `2.5px solid ${TOKENS.ink}`, background: TOKENS.paper, margin: "0 auto 6px", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: TOKENS.display, fontWeight: 900, fontSize: 18 }}>{s.ct}</div>
            <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 13, letterSpacing: "-0.02em" }}>{s.id}</div>
            <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".12em", opacity: 0.65, marginTop: 2, textTransform: "uppercase" }}>{s.tier}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Crew tab ─────────────────────────────────────────────────
function CrewTab() {
  const crew = [
    { who: "maya",  shared: 12, last: "sat may 23", c: TOKENS.accent1 },
    { who: "devon", shared: 8,  last: "fri may 16", c: TOKENS.accent3 },
    { who: "sam",   shared: 6,  last: "sat may 10", c: TOKENS.accent2 },
    { who: "alex",  shared: 3,  last: "fri apr 11", c: TOKENS.accent2 },
  ];
  return (
    <div>
      {crew.map((p) => (
        <div key={p.who} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", marginBottom: 8, border: `2px solid ${TOKENS.ink}`, borderRadius: 12, background: TOKENS.paper }}>
          <div style={{ width: 44, height: 44, borderRadius: 999, border: `2.5px solid ${TOKENS.ink}`, background: p.c, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: TOKENS.display, fontWeight: 900, fontSize: 17 }}>{p.who[0].toUpperCase()}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: TOKENS.ui, fontSize: 14, fontWeight: 800, color: TOKENS.ink }}>@{p.who}</div>
            <div style={{ fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 700, opacity: 0.55, marginTop: 2, letterSpacing: ".06em" }}>{p.shared} SHARED NIGHTS · LAST {p.last}</div>
          </div>
          <button style={{ appearance: "none", cursor: "pointer", padding: "6px 12px", border: `2px solid ${TOKENS.ink}`, borderRadius: 999, background: TOKENS.accent1, color: TOKENS.ink, fontFamily: TOKENS.ui, fontSize: 11, fontWeight: 800 }}>+ plan</button>
        </div>
      ))}
    </div>
  );
}

// ─── Profile screen ───────────────────────────────────────────
function ProfileScreen({ onBack, onOpenWallet }: { onBack: () => void; onOpenWallet: () => void }) {
  const [tab, setTab] = useState<"scrapbook" | "stamps" | "crew">("scrapbook");
  return (
    <div className="cf-screen" style={{ position: "relative", height: "100%", background: TOKENS.bg, color: TOKENS.ink, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <DotsBg opacity={0.06} />

      {/* Header */}
      <div style={{ position: "relative", zIndex: 2, padding: "56px 22px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={onBack} style={{ appearance: "none", cursor: "pointer", width: 36, height: 36, borderRadius: 999, border: `2.5px solid ${TOKENS.ink}`, background: TOKENS.paper, color: TOKENS.ink, fontSize: 14, fontWeight: 900, boxShadow: `3px 3px 0 ${TOKENS.ink}`, display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
        <span style={{ fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800, letterSpacing: ".16em", opacity: 0.55 }}>YOU · JOINED MAR '25</span>
        <button style={{ appearance: "none", cursor: "pointer", width: 36, height: 36, borderRadius: 999, border: `2.5px solid ${TOKENS.ink}`, background: TOKENS.paper, color: TOKENS.ink, fontSize: 16, fontWeight: 900, boxShadow: `3px 3px 0 ${TOKENS.ink}`, display: "flex", alignItems: "center", justifyContent: "center" }}>⚙</button>
      </div>

      {/* Hero card */}
      <div style={{ position: "relative", zIndex: 2, margin: "16px 22px 12px", padding: 16, border: `3px solid ${TOKENS.ink}`, borderRadius: 18, background: TOKENS.paper, boxShadow: `5px 5px 0 ${TOKENS.ink}` }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ width: 72, height: 72, borderRadius: 999, border: `3px solid ${TOKENS.ink}`, background: TOKENS.accent2, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: TOKENS.display, fontWeight: 900, fontSize: 28, color: TOKENS.ink, boxShadow: `4px 4px 0 ${TOKENS.ink}`, flexShrink: 0 }}>JS</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 24, letterSpacing: "-0.03em", lineHeight: 1, color: TOKENS.ink }}>Jess S.</div>
            <div style={{ fontFamily: TOKENS.mono, fontSize: 11, fontWeight: 700, opacity: 0.6, marginTop: 4, letterSpacing: ".08em" }}>@jess.s · brooklyn, ny</div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", marginTop: 6, background: TOKENS.accent1, color: TOKENS.ink, border: `2px solid ${TOKENS.ink}`, borderRadius: 999, fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".12em" }}>✣ MEMBER · NIGHT OWL TIER</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0, marginTop: 14, paddingTop: 12, borderTop: "2px dashed rgba(0,0,0,0.18)" }}>
          {([["18", "nights"], ["$1.4k", "spent"], ["52", "check-ins"]] as const).map(([n, l], i) => (
            <div key={i} style={{ textAlign: "center", borderRight: i < 2 ? "2px dashed rgba(0,0,0,0.18)" : "none" }}>
              <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 22, letterSpacing: "-0.02em", color: TOKENS.ink }}>{n}</div>
              <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".14em", opacity: 0.55, textTransform: "uppercase" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", gap: 4, padding: "0 22px", marginBottom: 12 }}>
        {(["scrapbook", "stamps", "crew"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            appearance: "none", cursor: "pointer", flex: 1, padding: "8px 6px",
            border: `2.5px solid ${TOKENS.ink}`, borderRadius: 999,
            background: tab === t ? TOKENS.ink : TOKENS.paper,
            color: tab === t ? TOKENS.paper : TOKENS.ink,
            fontFamily: TOKENS.ui, fontSize: 12, fontWeight: 800,
            boxShadow: tab === t ? `3px 3px 0 ${TOKENS.accent1}` : "none",
            transform: tab === t ? "translate(-1px,-1px)" : "none",
            transition: "all .12s", textTransform: "lowercase",
          }}>{t}</button>
        ))}
      </div>

      {/* Tab body */}
      <div style={{ position: "relative", zIndex: 2, flex: 1, overflowY: "auto", overflowX: "hidden", padding: "0 22px 24px", scrollbarWidth: "none" }}>
        {tab === "scrapbook" && <ScrapbookTab onOpenWallet={onOpenWallet} />}
        {tab === "stamps"    && <StampsTab />}
        {tab === "crew"      && <CrewTab />}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────
function ProfilePage() {
  const navigate = useNavigate();
  const [screen, setScreen] = useState<"profile" | "wallet">("profile");

  return (
    <Frame>
      <div style={{ position: "relative", height: "100dvh", overflow: "hidden" }}>
        {screen === "profile" && (
          <ProfileScreen
            onBack={() => navigate({ to: "/new/hub" })}
            onOpenWallet={() => setScreen("wallet")}
          />
        )}
        {screen === "wallet" && <WalletPassScreen onBack={() => setScreen("profile")} />}
      </div>
    </Frame>
  );
}
