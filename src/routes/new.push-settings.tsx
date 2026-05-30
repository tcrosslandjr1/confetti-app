import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { DotsBg, Frame, TOKENS } from "@/components/new-confetti/shell";

// Port of PushSettingsScreen — design/new-confetti/project/new-screens-4.jsx

export const Route = createFileRoute("/new/push-settings")({
  component: PushSettingsPage,
});

type PrefKey = "crew" | "plan" | "omw" | "rewards" | "venue" | "referral" | "marketing";

const GROUPS: Array<{
  label: string;
  items: Array<{ id: PrefKey; l: string; sub: string; ex: string }>;
}> = [
  {
    label: "crew",
    items: [
      { id: "crew", l: "crew pings", sub: "live: @friend is at venue X", ex: "@maya is at Westlight rooftop" },
      { id: "omw", l: "they're on the way", sub: "eta + transit updates", ex: "devon is 6 min out via L train" },
    ],
  },
  {
    label: "your plan",
    items: [
      { id: "plan", l: "plan nudges", sub: "stop reminders, late warnings", ex: "you're 10 min from Lupa Notte" },
      { id: "venue", l: "venue updates", sub: "table ready, pre-order pings", ex: "Lupa Notte saved your table" },
    ],
  },
  {
    label: "rewards + program",
    items: [
      { id: "rewards", l: "points + tier", sub: "check-in rewards + tier-ups", ex: "+125 points · Lupa Notte" },
      { id: "referral", l: "referral payouts", sub: "when invited friends subscribe", ex: "maya joined · $10 earned" },
      { id: "marketing", l: "marketing", sub: "new features, weekly digest", ex: "this week in bk" },
    ],
  },
];

function PushSettingsPage() {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<Record<PrefKey, boolean>>({
    crew: true, plan: true, omw: true, rewards: true,
    venue: true, referral: true, marketing: false,
  });
  const [quietHours, setQuietHours] = useState(true);
  const [quietFrom] = useState("11p");
  const [quietTo] = useState("8a");

  const toggle = (k: PrefKey) => setPrefs((p) => ({ ...p, [k]: !p[k] }));

  return (
    <Frame>
      <div
        style={{
          position: "relative",
          height: "100dvh",
          background: TOKENS.bg,
          display: "flex",
          flexDirection: "column",
          padding: "56px 0 24px",
          overflow: "hidden",
        }}
      >
        <DotsBg opacity={0.05} />

        {/* Header */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            padding: "0 22px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <button onClick={() => navigate({ to: "/new/settings" })} style={backBtn}>←</button>
          <h2 style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 20, letterSpacing: "-0.035em", margin: 0 }}>notifications</h2>
          <span style={{ width: 36 }} />
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 2,
            flex: 1,
            overflowY: "auto",
            padding: "0 22px 12px",
            scrollbarWidth: "none",
          }}
        >
          {GROUPS.map((g) => (
            <div key={g.label} style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".14em", color: TOKENS.inkHint, marginBottom: 8, textTransform: "uppercase" }}>{g.label}</div>
              {g.items.map((it) => (
                <div
                  key={it.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 14px",
                    marginBottom: 6,
                    border: `2px solid ${TOKENS.ink}`,
                    borderRadius: 12,
                    background: TOKENS.paper,
                    boxShadow: `2px 2px 0 ${TOKENS.ink}`,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 13, letterSpacing: "-0.02em" }}>{it.l}</div>
                    <div style={{ fontFamily: TOKENS.ui, fontSize: 10.5, fontWeight: 600, color: TOKENS.inkMuted, marginTop: 1, lineHeight: 1.3 }}>{it.sub}</div>
                    <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 700, color: TOKENS.inkHint, marginTop: 3, letterSpacing: ".04em" }}>ex: "{it.ex}"</div>
                  </div>
                  <Toggle on={prefs[it.id]} onToggle={() => toggle(it.id)} />
                </div>
              ))}
            </div>
          ))}

          {/* Quiet hours */}
          <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".14em", color: TOKENS.inkHint, marginBottom: 8, textTransform: "uppercase" }}>quiet hours</div>
          <div
            style={{
              padding: 14,
              marginBottom: 10,
              border: `2.5px solid ${TOKENS.ink}`,
              borderRadius: 14,
              background: quietHours ? TOKENS.accent2 : TOKENS.paper,
              boxShadow: `3px 3px 0 ${TOKENS.ink}`,
              transition: "background .25s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: quietHours ? 10 : 0 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 15, letterSpacing: "-0.02em" }}>silence at night</div>
                <div style={{ fontFamily: TOKENS.ui, fontSize: 11, fontWeight: 600, color: TOKENS.inkMuted, marginTop: 1 }}>mute non-urgent · keep crew + on-my-way</div>
              </div>
              <Toggle on={quietHours} onToggle={() => setQuietHours((v) => !v)} />
            </div>
            {quietHours && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: TOKENS.mono, fontSize: 12, fontWeight: 800, letterSpacing: ".04em", color: TOKENS.ink }}>
                from{" "}
                <span style={{ padding: "4px 10px", background: TOKENS.paper, border: `2px solid ${TOKENS.ink}`, borderRadius: 8 }}>{quietFrom}</span>
                {" "}to{" "}
                <span style={{ padding: "4px 10px", background: TOKENS.paper, border: `2px solid ${TOKENS.ink}`, borderRadius: 8 }}>{quietTo}</span>
              </div>
            )}
          </div>

          {/* Footnote */}
          <div
            style={{
              padding: "8px 10px",
              background: "rgba(255,255,255,0.5)",
              border: `1.5px dashed ${TOKENS.ink}`,
              borderRadius: 8,
              fontFamily: TOKENS.mono,
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: ".04em",
              lineHeight: 1.4,
              color: TOKENS.inkMuted,
            }}
          >
            🔒 We never send what you've muted, even by mistake.
            Critical safety pings (kids · medical) always come through.
          </div>
        </div>
      </div>
    </Frame>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        appearance: "none",
        cursor: "pointer",
        width: 44,
        height: 26,
        borderRadius: 999,
        border: `2px solid ${TOKENS.ink}`,
        background: on ? TOKENS.accent4 : TOKENS.bg,
        position: "relative",
        flexShrink: 0,
        transition: "background .2s",
      }}
    >
      <span
        style={{
          position: "absolute",
          left: on ? 20 : 2,
          top: 2,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: TOKENS.paper,
          border: `1.5px solid ${TOKENS.ink}`,
          transition: "left .2s",
        }}
      />
    </button>
  );
}

const backBtn: React.CSSProperties = {
  appearance: "none",
  cursor: "pointer",
  width: 36,
  height: 36,
  borderRadius: 999,
  border: `2.5px solid ${TOKENS.ink}`,
  background: TOKENS.paper,
  fontSize: 14,
  fontWeight: 900,
  boxShadow: `3px 3px 0 ${TOKENS.ink}`,
};
