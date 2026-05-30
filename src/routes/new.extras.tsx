import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { BrandMark, DotsBg, Frame, TOKENS } from "@/components/new-confetti/shell";

export const Route = createFileRoute("/new/extras")({ component: ExtrasPage });

type TabId = "hub" | "plan" | "feed" | "crew" | "you";

function TabBar({ active, onChange }: { active: TabId; onChange: (id: TabId) => void }) {
  const tabs: { id: TabId; label: string }[] = [
    { id: "hub", label: "home" },
    { id: "plan", label: "plan" },
    { id: "feed", label: "feed" },
    { id: "crew", label: "crew" },
    { id: "you",  label: "you"  },
  ];
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
      display: "flex",
      background: TOKENS.bg,
      borderTop: `3px solid ${TOKENS.ink}`,
      padding: "8px 0 max(8px, env(safe-area-inset-bottom))",
    }}>
      {tabs.map((tab) => {
        const on = active === tab.id;
        return (
          <button key={tab.id} onClick={() => onChange(tab.id)} style={{
            appearance: "none", cursor: "pointer", flex: 1,
            display: "flex", flexDirection: "column" as const,
            alignItems: "center", gap: 4, padding: "4px 0",
            border: "none", background: "transparent",
            color: on ? TOKENS.ink : TOKENS.inkHint,
            fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800,
            letterSpacing: ".1em", textTransform: "uppercase" as const,
          }}>{tab.label}</button>
        );
      })}
    </div>
  );
}

function ExplainerScreen({ onBack, onTry }: { onBack: () => void; onTry: () => void }) {
  return (
    <div className="cf-screen" style={{
      position: "relative", height: "100dvh",
      background: TOKENS.accent1, color: TOKENS.ink,
      display: "flex", flexDirection: "column",
      padding: "56px 22px 24px", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", inset: 0, opacity: 0.12,
        backgroundImage: `radial-gradient(${TOKENS.ink} 1px, transparent 1px)`,
        backgroundSize: "22px 22px",
      }} />
      <div style={{
        position: "relative", zIndex: 2,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 20,
      }}>
        <button onClick={onBack} style={{
          appearance: "none", cursor: "pointer",
          width: 36, height: 36, borderRadius: 999,
          border: `2.5px solid ${TOKENS.ink}`, background: "rgba(255,250,240,0.3)",
          fontSize: 14, fontWeight: 900, color: TOKENS.ink,
        }}>←</button>
        <BrandMark size={16} />
        <span style={{ width: 36 }} />
      </div>
      <div style={{ position: "relative", zIndex: 2, flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
        <div style={{
          display: "inline-flex", alignItems: "center",
          padding: "4px 10px",
          background: TOKENS.ink, color: TOKENS.paper,
          border: `2px solid ${TOKENS.ink}`, borderRadius: 999,
          fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800,
          letterSpacing: ".14em", marginBottom: 12,
        }}>HOW CONFETTI WORKS</div>
        <h1 style={{
          fontFamily: TOKENS.display, fontWeight: 900,
          fontSize: 50, lineHeight: 0.88, letterSpacing: "-0.045em",
          margin: "0 0 18px", color: TOKENS.ink,
        }}>4 minutes.<br />A whole<br />night.</h1>
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 10, marginBottom: 22 }}>
          {[
            { n: "01", h: "tell sparkle a vibe",       b: "Date night, group hangout, birthday, family day — or just \"I don't know, surprise me.\"" },
            { n: "02", h: "she builds a 3-stop pass",  b: "Venue + timing + route + budget + why each pick is right for you. Printed like a boarding pass." },
            { n: "03", h: "book everything in one tap", b: "Reservation, deposit, ticket — hit one button. Sparkle books in parallel." },
            { n: "04", h: "check in, earn points",     b: "Show the pass at each stop. Staff see the booking. You earn Confetti points toward free nights." },
          ].map((step) => (
            <div key={step.n} style={{
              padding: 14, border: `2.5px solid ${TOKENS.ink}`, borderRadius: 14,
              background: TOKENS.paper, boxShadow: `4px 4px 0 ${TOKENS.ink}`,
            }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
                <span style={{ fontFamily: TOKENS.mono, fontSize: 12, fontWeight: 900, color: TOKENS.accent1, letterSpacing: ".06em" }}>{step.n}</span>
                <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 16, letterSpacing: "-0.025em", color: TOKENS.ink }}>{step.h}</div>
              </div>
              <div style={{ fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 600, color: TOKENS.ink, opacity: 0.75, lineHeight: 1.4 }}>{step.b}</div>
            </div>
          ))}
        </div>
      </div>
      <button onClick={onTry} style={{
        appearance: "none", cursor: "pointer", width: "100%",
        padding: "16px 20px", border: `3px solid ${TOKENS.ink}`, borderRadius: 16,
        background: TOKENS.ink, color: TOKENS.paper,
        fontFamily: TOKENS.ui, fontSize: 17, fontWeight: 900,
        boxShadow: `5px 5px 0 ${TOKENS.paper}`,
      }}>try it free →</button>
    </div>
  );
}

function PushSettingsScreen({ onBack }: { onBack: () => void }) {
  const [settings, setSettings] = useState({
    pretrip: true, booking: true, crew: true, points: false,
    weekly: true, newVenues: false, marketing: false,
  });
  const toggle = (k: keyof typeof settings) => setSettings({ ...settings, [k]: !settings[k] });
  const rows = [
    { k: "pretrip" as const,   l: "Pre-trip reminders",    s: "30 min before each stop" },
    { k: "booking" as const,   l: "Booking confirmations", s: "when we lock your spot" },
    { k: "crew" as const,      l: "Crew updates",          s: "join requests, location pings" },
    { k: "points" as const,    l: "Points + rewards",      s: "milestones, perks unlocked" },
    { k: "weekly" as const,    l: "Weekly vibes",          s: "what's hot this weekend" },
    { k: "newVenues" as const, l: "New venues near you",   s: "when we add a new spot" },
    { k: "marketing" as const, l: "Offers + promotions",   s: "partner deals, sponsored" },
  ];
  return (
    <div className="cf-screen" style={{
      position: "relative", height: "100dvh", background: TOKENS.bg,
      display: "flex", flexDirection: "column", padding: "56px 22px 24px", overflow: "hidden",
    }}>
      <DotsBg opacity={0.05} />
      <div style={{
        position: "relative", zIndex: 2,
        display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14,
      }}>
        <button onClick={onBack} style={{
          appearance: "none", cursor: "pointer",
          width: 36, height: 36, borderRadius: 999,
          border: `2.5px solid ${TOKENS.ink}`, background: TOKENS.paper,
          fontSize: 14, fontWeight: 900, color: TOKENS.ink, boxShadow: `3px 3px 0 ${TOKENS.ink}`,
        }}>←</button>
        <h2 style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 20, letterSpacing: "-0.025em", margin: 0, color: TOKENS.ink }}>notifications</h2>
        <span style={{ width: 36 }} />
      </div>
      <div style={{ position: "relative", zIndex: 2, flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
        {rows.map((row) => (
          <div key={row.k} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 0", borderBottom: "1.5px dashed rgba(0,0,0,0.15)",
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: TOKENS.ui, fontSize: 14, fontWeight: 800, color: TOKENS.ink }}>{row.l}</div>
              <div style={{ fontFamily: TOKENS.mono, fontSize: 9.5, fontWeight: 700, color: TOKENS.ink, opacity: 0.55, marginTop: 2, letterSpacing: ".06em" }}>{row.s}</div>
            </div>
            <button onClick={() => toggle(row.k)} style={{
              appearance: "none", cursor: "pointer", flexShrink: 0,
              width: 48, height: 26, borderRadius: 999,
              border: `2.5px solid ${TOKENS.ink}`,
              background: settings[row.k] ? TOKENS.accent1 : TOKENS.paper,
              position: "relative", transition: "background .2s",
            }}>
              <span style={{
                position: "absolute", top: 2,
                left: settings[row.k] ? 22 : 2,
                width: 18, height: 18, borderRadius: 999,
                background: TOKENS.ink, transition: "left .2s",
              }} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

type SubPage = "menu" | "explainer" | "push";

function ExtrasPage() {
  const navigate = useNavigate();
  const [sub, setSub] = useState<SubPage>("menu");
  const [activeTab, setActiveTab] = useState<TabId>("hub");

  if (sub === "explainer") return (
    <Frame><ExplainerScreen onBack={() => setSub("menu")} onTry={() => navigate({ to: "/new/chat" })} /></Frame>
  );
  if (sub === "push") return (
    <Frame><PushSettingsScreen onBack={() => setSub("menu")} /></Frame>
  );

  const menuItems = [
    { e: "💡", l: "How Confetti works",   s: "4-step explainer",        target: "explainer" as SubPage, bg: TOKENS.accent1 },
    { e: "🔔", l: "Notifications",        s: "push + email prefs",      target: "push" as SubPage,      bg: TOKENS.accent2 },
    { e: "🌍", l: "Culture + activities", s: "9 categories · 90+ picks",target: null, bg: TOKENS.accent3 },
    { e: "🎟", l: "Draft pass",           s: "builds as you browse",    target: null, bg: TOKENS.accent2 },
    { e: "📷", l: "Confetti Cam",         s: "branded clip + post",     target: null, bg: TOKENS.accent1 },
    { e: "📍", l: "Add a place",          s: "suggest a spot we're missing", target: null, bg: TOKENS.paper },
  ];

  return (
    <Frame>
      <div className="cf-screen" style={{
        position: "relative", height: "100dvh", background: TOKENS.bg,
        display: "flex", flexDirection: "column",
        padding: "56px 22px 84px", overflow: "hidden",
      }}>
        <DotsBg opacity={0.05} />
        <div style={{
          position: "relative", zIndex: 2,
          display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14,
        }}>
          <h2 style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 22, letterSpacing: "-0.035em", margin: 0, color: TOKENS.ink }}>extras</h2>
          <span style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, color: TOKENS.ink, opacity: 0.5, letterSpacing: ".14em" }}>MORE</span>
        </div>
        <div style={{ position: "relative", zIndex: 2, flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
          {menuItems.map((item, i) => (
            <button key={i} onClick={item.target ? () => setSub(item.target!) : undefined} style={{
              appearance: "none", cursor: "pointer", width: "100%", textAlign: "left" as const,
              display: "flex", alignItems: "center", gap: 14,
              padding: "14px 0", background: "transparent", border: "none",
              borderBottom: "1.5px dashed rgba(0,0,0,0.15)",
            }}>
              <span style={{
                width: 44, height: 44, borderRadius: 12,
                border: `2.5px solid ${TOKENS.ink}`, background: item.bg,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, flexShrink: 0, boxShadow: `3px 3px 0 ${TOKENS.ink}`,
              }}>{item.e}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: TOKENS.ui, fontSize: 14, fontWeight: 800, color: TOKENS.ink }}>{item.l}</div>
                <div style={{ fontFamily: TOKENS.mono, fontSize: 9.5, fontWeight: 700, color: TOKENS.ink, opacity: 0.55, marginTop: 2, letterSpacing: ".06em" }}>{item.s}</div>
              </div>
              <span style={{ color: TOKENS.ink, opacity: 0.4, fontSize: 18, fontWeight: 900 }}>›</span>
            </button>
          ))}
        </div>
        <TabBar active={activeTab} onChange={(id) => {
          setActiveTab(id);
          const dest: Record<TabId, string> = { hub: "/new/hub", plan: "/new/plan", feed: "/new/reels", crew: "/new/crews", you: "/new/profile" };
          navigate({ to: dest[id] });
        }} />
      </div>
    </Frame>
  );
}
