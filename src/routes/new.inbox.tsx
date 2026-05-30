import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { DotsBg, Frame, TOKENS } from "@/components/new-confetti/shell";

// Port of InboxScreen — design/new-confetti/project/new-screens-1.jsx

export const Route = createFileRoute("/new/inbox")({
  component: InboxPage,
});

type NotifKind = "crew" | "plan" | "rewards" | "venue" | "referral";

interface Notif {
  id: number;
  kind: NotifKind;
  time: string;
  icon: string;
  title: string;
  body: string;
  unread?: boolean;
  color: string;
}

const NOTIFS: Notif[] = [
  {
    id: 1,
    kind: "crew",
    time: "6m",
    icon: "📍",
    title: "@maya is at Westlight rooftop",
    body: "2 stops from your route. View her live pass?",
    unread: true,
    color: TOKENS.accent1,
  },
  {
    id: 2,
    kind: "plan",
    time: "14m",
    icon: "✣",
    title: "Sparkle prepped Friday",
    body: "Italian + jazz + rooftop nightcap — tap to review.",
    unread: true,
    color: TOKENS.accent2,
  },
  {
    id: 3,
    kind: "rewards",
    time: "1h",
    icon: "💰",
    title: "+125 points · Lupa Notte check-in",
    body: "You're 60 pts from Night Owl tier.",
    color: TOKENS.paper,
  },
  {
    id: 4,
    kind: "crew",
    time: "2h",
    icon: "🚇",
    title: "@devon is OMW",
    body: "6 min out via L train. Tap to share your ETA back.",
    color: TOKENS.accent3,
  },
  {
    id: 5,
    kind: "venue",
    time: "4h",
    icon: "🍝",
    title: "Lupa Notte saved your table",
    body: "Booth #4 · 8:30 PM · tap to pre-order.",
    color: TOKENS.accent2,
  },
  {
    id: 6,
    kind: "referral",
    time: "1d",
    icon: "🎟",
    title: "Maya joined All-Access",
    body: "You earned $10 gift card · ledger updated.",
    color: TOKENS.accent4,
  },
  {
    id: 7,
    kind: "plan",
    time: "2d",
    icon: "🌹",
    title: "Want last Friday's plan again?",
    body: "Same crew, same neighborhood, fresh stops.",
    color: TOKENS.paper,
  },
  {
    id: 8,
    kind: "rewards",
    time: "3d",
    icon: "🏆",
    title: "Night Owl tier unlocked!",
    body: "2x points on weekend stops · 4-month perk.",
    color: TOKENS.accent1,
  },
];

const FILTERS: Array<"all" | NotifKind> = [
  "all",
  "crew",
  "plan",
  "rewards",
  "venue",
  "referral",
];

function InboxPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | NotifKind>("all");

  const visible =
    filter === "all" ? NOTIFS : NOTIFS.filter((n) => n.kind === filter);
  const unreadCount = NOTIFS.filter((n) => n.unread).length;

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
          <button onClick={() => navigate({ to: "/new/hub" })} style={backBtn}>
            ←
          </button>
          <h2
            style={{
              fontFamily: TOKENS.display,
              fontWeight: 900,
              fontSize: 24,
              letterSpacing: "-0.035em",
              margin: 0,
            }}
          >
            inbox
          </h2>
          <span
            style={{
              padding: "4px 10px",
              background: TOKENS.accent1,
              color: TOKENS.ink,
              border: `2px solid ${TOKENS.ink}`,
              borderRadius: 999,
              fontFamily: TOKENS.mono,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: ".1em",
            }}
          >
            {unreadCount} NEW
          </span>
        </div>

        {/* Filter tabs */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            padding: "0 22px 12px",
            display: "flex",
            gap: 6,
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
        >
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                appearance: "none",
                cursor: "pointer",
                flexShrink: 0,
                padding: "6px 12px",
                border: `2.5px solid ${TOKENS.ink}`,
                borderRadius: 999,
                background: filter === f ? TOKENS.ink : TOKENS.paper,
                color: filter === f ? TOKENS.paper : TOKENS.ink,
                fontFamily: TOKENS.ui,
                fontSize: 11,
                fontWeight: 800,
                boxShadow: filter === f ? "none" : `2px 2px 0 ${TOKENS.ink}`,
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* List */}
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
          {visible.length === 0 && (
            <div
              style={{
                padding: "40px 16px",
                textAlign: "center",
                fontFamily: TOKENS.mono,
                fontSize: 11,
                fontWeight: 700,
                color: TOKENS.inkHint,
                letterSpacing: ".08em",
              }}
            >
              no notifications in this filter
            </div>
          )}
          {visible.map((n) => (
            <button
              key={n.id}
              style={{
                appearance: "none",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                display: "flex",
                gap: 12,
                padding: "12px 14px",
                marginBottom: 8,
                border: `2.5px solid ${TOKENS.ink}`,
                borderRadius: 14,
                background: n.unread ? n.color : TOKENS.paper,
                boxShadow: n.unread ? `3px 3px 0 ${TOKENS.ink}` : "none",
                transition: "all .15s",
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  border: `2px solid ${TOKENS.ink}`,
                  background: TOKENS.paper,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                }}
              >
                {n.icon}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: 6,
                    marginBottom: 2,
                  }}
                >
                  <span
                    style={{
                      fontFamily: TOKENS.display,
                      fontWeight: 900,
                      fontSize: 14,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.15,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      color: TOKENS.ink,
                    }}
                  >
                    {n.title}
                  </span>
                  <span
                    style={{
                      flexShrink: 0,
                      fontFamily: TOKENS.mono,
                      fontSize: 9,
                      fontWeight: 700,
                      color: TOKENS.inkHint,
                      letterSpacing: ".04em",
                    }}
                  >
                    {n.time}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: TOKENS.ui,
                    fontSize: 11.5,
                    fontWeight: 600,
                    lineHeight: 1.35,
                    color: TOKENS.inkMuted,
                  }}
                >
                  {n.body}
                </div>
              </div>
              {n.unread && (
                <span
                  style={{
                    flexShrink: 0,
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: TOKENS.ink,
                    alignSelf: "center",
                  }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </Frame>
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
