import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { BrandMark, DotsBg, Frame, TOKENS } from "@/components/new-confetti/shell";
import { useAuth } from "@/lib/auth-context";

// Slim port — design/new-confetti/project/auth.jsx (SettingsScreen, line 1026)
export const Route = createFileRoute("/new/settings")({
  component: SettingsPage,
});

type Toggle = { label: string; sub: string };
const TOGGLES: Record<string, Toggle[]> = {
  notifications: [
    { label: "night reminders",  sub: "ping me 1hr before pass starts" },
    { label: "crew activity",    sub: "when sara/mike/ren are out" },
    { label: "weekly drops",     sub: "fresh picks every thursday" },
  ],
  privacy: [
    { label: "share my scrapbook", sub: "let crew see your nights" },
    { label: "anon reviews",       sub: "hide your name on venue reviews" },
  ],
};

const LINKS: { label: string; sub: string; danger?: boolean }[] = [
  { label: "manage subscription", sub: "all-access · yearly" },
  { label: "connected accounts",  sub: "spotify · google · instagram" },
  { label: "help & feedback",     sub: "we read everything" },
  { label: "log out",              sub: "see you tomorrow",  danger: true },
];

function SettingsPage() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLinkClick = async (label: string) => {
    switch (label) {
      case "manage subscription":
        navigate({ to: "/new/all-access" });
        break;
      case "connected accounts":
        navigate({ to: "/new/socials" });
        break;
      case "help & feedback":
        // Opens default mail client — production-grade placeholder
        window.open("mailto:hello@confetti.app?subject=Feedback", "_blank");
        break;
      case "log out":
        await signOut();
        navigate({ to: "/new/signin" });
        break;
    }
  };

  const [state, setState] = useState<Record<string, boolean>>({
    "night reminders": true,
    "crew activity": true,
    "weekly drops": false,
    "share my scrapbook": true,
    "anon reviews": false,
  });

  return (
    <Frame>
      <div style={{
        position: "relative", height: "100%", background: TOKENS.bg,
        display: "flex", flexDirection: "column",
        padding: "56px 20px 22px", overflow: "hidden",
      }}>
        <DotsBg opacity={0.05} />

        <div style={{
          position: "relative", zIndex: 2,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 14,
        }}>
          <button onClick={() => navigate({ to: "/new/profile" })} style={backBtn()}>←</button>
          <BrandMark size={17} />
          <span style={{ width: 36 }} />
        </div>

        <h1 style={{
          fontFamily: TOKENS.display, fontWeight: 900,
          fontSize: 38, lineHeight: 0.92, letterSpacing: "-0.04em",
          margin: "0 0 14px", position: "relative", zIndex: 2,
        }}>Settings.</h1>

        <div style={{
          position: "relative", zIndex: 2,
          flex: 1, overflowY: "auto", scrollbarWidth: "none",
          marginRight: -20, paddingRight: 20,
        }}>
          {Object.entries(TOGGLES).map(([group, items]) => (
            <div key={group} style={{ marginBottom: 18 }}>
              <div style={{
                fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800,
                letterSpacing: ".16em", opacity: 0.55, marginBottom: 8,
                textTransform: "uppercase",
              }}>{group}</div>
              {items.map((t) => (
                <Row key={t.label} label={t.label} sub={t.sub}
                  on={state[t.label]}
                  onChange={(v) => setState((s) => ({ ...s, [t.label]: v }))} />
              ))}
            </div>
          ))}

          <div style={{
            fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800,
            letterSpacing: ".16em", opacity: 0.55, marginBottom: 8,
            textTransform: "uppercase",
          }}>account</div>
          {LINKS.map((l) => (
            <button key={l.label} onClick={() => handleLinkClick(l.label)} style={{
              appearance: "none", cursor: "pointer", textAlign: "left", width: "100%",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 14px", marginBottom: 6,
              border: `2.5px solid ${TOKENS.ink}`, borderRadius: 14,
              background: TOKENS.paper,
              color: l.danger ? TOKENS.accent1 : TOKENS.ink,
            }}>
              <div>
                <div style={{
                  fontFamily: TOKENS.display, fontWeight: 900, fontSize: 14,
                  letterSpacing: "-0.01em",
                }}>{l.label}</div>
                <div style={{
                  fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 700,
                  opacity: 0.55, marginTop: 2, letterSpacing: ".06em",
                  color: TOKENS.ink,
                }}>{l.sub}</div>
              </div>
              <span style={{ fontSize: 16, fontWeight: 900 }}>›</span>
            </button>
          ))}
        </div>
      </div>
    </Frame>
  );
}

function Row({ label, sub, on, onChange }: {
  label: string; sub: string; on: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 14px", marginBottom: 6,
      border: `2.5px solid ${TOKENS.ink}`, borderRadius: 14,
      background: TOKENS.paper,
    }}>
      <div style={{ minWidth: 0, marginRight: 12 }}>
        <div style={{
          fontFamily: TOKENS.display, fontWeight: 900, fontSize: 13,
          letterSpacing: "-0.01em",
        }}>{label}</div>
        <div style={{
          fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 700,
          opacity: 0.55, marginTop: 2, letterSpacing: ".06em",
        }}>{sub}</div>
      </div>
      <button onClick={() => onChange(!on)} aria-pressed={on} style={{
        appearance: "none", cursor: "pointer",
        width: 48, height: 28, borderRadius: 999,
        border: `2.5px solid ${TOKENS.ink}`,
        background: on ? TOKENS.accent2 : TOKENS.bg,
        position: "relative", flexShrink: 0,
        boxShadow: `2px 2px 0 ${TOKENS.ink}`,
      }}>
        <span style={{
          position: "absolute", top: 1, left: on ? 21 : 1,
          width: 20, height: 20, borderRadius: 999,
          background: TOKENS.ink, transition: "left .15s",
        }} />
      </button>
    </div>
  );
}

function backBtn(): React.CSSProperties {
  return {
    appearance: "none", cursor: "pointer",
    width: 36, height: 36, borderRadius: 999,
    border: `2.5px solid ${TOKENS.ink}`, background: TOKENS.paper,
    fontSize: 14, fontWeight: 900, boxShadow: `3px 3px 0 ${TOKENS.ink}`,
  };
}
