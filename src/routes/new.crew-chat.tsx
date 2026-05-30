import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { DotsBg, Frame, TOKENS } from "@/components/new-confetti/shell";

// Port of CrewChatScreen — design/new-confetti/project/new-screens-3.jsx

export const Route = createFileRoute("/new/crew-chat")({
  component: CrewChatPage,
});

interface Msg {
  from: string;
  text?: string;
  time: string;
  isMe?: boolean;
  c?: string;
  textColor?: string;
  kind?: "pass-share";
  planTitle?: string;
  stops?: string[];
  cost?: string;
}

const SEED: Msg[] = [
  { from: "maya", text: "okay sat night? rooftop vibes?", time: "4:12 PM", c: TOKENS.accent1 },
  { from: "devon", text: "down. who else?", time: "4:14 PM", c: TOKENS.accent3, textColor: TOKENS.paper },
  { from: "sam", text: "i'm in if we eat first", time: "4:20 PM", c: TOKENS.accent2 },
  { from: "me", text: "ok printing a pass — italian → rooftop → late drink?", time: "4:22 PM", isMe: true },
  {
    from: "system",
    kind: "pass-share",
    planTitle: "Sat Italian + Rooftop",
    stops: ["Lupa Notte", "Westlight", "Skinny Dennis"],
    cost: "$92",
    time: "4:23 PM",
  },
  { from: "maya", text: "oh perfect ✣", time: "4:25 PM", c: TOKENS.accent1 },
  { from: "sam", text: "votingggg", time: "4:25 PM", c: TOKENS.accent2 },
];

function CrewChatPage() {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>(SEED);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    setMessages((m) => [...m, { from: "me", text: input.trim(), time: "now", isMe: true }]);
    setInput("");
  };

  return (
    <Frame>
      <div
        style={{
          position: "relative",
          height: "100dvh",
          background: TOKENS.bg,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <DotsBg opacity={0.04} />

        {/* Header */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            padding: "52px 18px 12px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            borderBottom: `2px solid ${TOKENS.ink}`,
            background: TOKENS.paper,
          }}
        >
          <button onClick={() => navigate({ to: "/new/crews" })} style={backBtn}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 17, letterSpacing: "-0.025em" }}>WBG Hangs</div>
            <div style={{ fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, color: TOKENS.inkHint, letterSpacing: ".1em" }}>
              4 members · 3 online
            </div>
          </div>
          <button
            onClick={() => navigate({ to: "/new/plan" })}
            style={{ appearance: "none", cursor: "pointer", padding: "7px 12px", border: `2px solid ${TOKENS.ink}`, borderRadius: 999, background: TOKENS.accent1, color: TOKENS.ink, fontFamily: TOKENS.mono, fontSize: 10, fontWeight: 800, letterSpacing: ".1em" }}
          >
            ✣ PLAN
          </button>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          style={{
            position: "relative",
            zIndex: 2,
            flex: 1,
            overflowY: "auto",
            padding: "12px 18px",
            scrollbarWidth: "none",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {messages.map((m, i) => {
            if (m.kind === "pass-share") {
              return (
                <div
                  key={i}
                  style={{ alignSelf: "center", width: "100%", maxWidth: 300, padding: 12, border: `2.5px solid ${TOKENS.ink}`, borderRadius: 14, background: TOKENS.accent2, boxShadow: `4px 4px 0 ${TOKENS.ink}` }}
                >
                  <div style={{ fontFamily: TOKENS.mono, fontSize: 8.5, fontWeight: 800, letterSpacing: ".14em", color: TOKENS.inkMuted, marginBottom: 4 }}>
                    ✣ PASS SHARED · {m.time}
                  </div>
                  <div style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 15, letterSpacing: "-0.025em" }}>{m.planTitle}</div>
                  <div style={{ fontFamily: TOKENS.mono, fontSize: 9.5, fontWeight: 800, marginTop: 4, lineHeight: 1.5, letterSpacing: ".04em" }}>
                    {m.stops?.map((s, j) => <span key={j}>{j > 0 && " → "}{s}</span>)}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, alignItems: "center" }}>
                    <span style={{ fontFamily: TOKENS.display, fontWeight: 900, fontSize: 16, letterSpacing: "-0.02em" }}>{m.cost}</span>
                    <button
                      onClick={() => navigate({ to: "/new/pass" })}
                      style={{ appearance: "none", cursor: "pointer", padding: "6px 12px", border: `2px solid ${TOKENS.ink}`, borderRadius: 999, background: TOKENS.ink, color: TOKENS.paper, fontFamily: TOKENS.mono, fontSize: 9, fontWeight: 800, letterSpacing: ".1em" }}
                    >
                      VIEW PASS
                    </button>
                  </div>
                </div>
              );
            }

            if (m.isMe) {
              return (
                <div key={i} style={{ alignSelf: "flex-end", maxWidth: "75%" }}>
                  <div style={{ padding: "10px 14px", border: `2px solid ${TOKENS.ink}`, borderRadius: "18px 18px 4px 18px", background: TOKENS.ink, color: TOKENS.paper, fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 700, lineHeight: 1.35 }}>
                    {m.text}
                  </div>
                  <div style={{ fontFamily: TOKENS.mono, fontSize: 8.5, fontWeight: 700, color: TOKENS.inkHint, marginTop: 2, textAlign: "right" }}>{m.time}</div>
                </div>
              );
            }

            return (
              <div key={i} style={{ alignSelf: "flex-start", maxWidth: "75%" }}>
                <div style={{ fontFamily: TOKENS.mono, fontSize: 8.5, fontWeight: 800, color: TOKENS.inkHint, marginBottom: 2, letterSpacing: ".06em" }}>{m.from}</div>
                <div style={{ padding: "10px 14px", border: `2px solid ${TOKENS.ink}`, borderRadius: "4px 18px 18px 18px", background: m.c || TOKENS.paper, color: m.textColor || TOKENS.ink, fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 700, lineHeight: 1.35, boxShadow: `2px 2px 0 ${TOKENS.ink}` }}>
                  {m.text}
                </div>
                <div style={{ fontFamily: TOKENS.mono, fontSize: 8.5, fontWeight: 700, color: TOKENS.inkHint, marginTop: 2 }}>{m.time}</div>
              </div>
            );
          })}
        </div>

        {/* Input bar */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            padding: "10px 18px 28px",
            borderTop: `2px solid ${TOKENS.ink}`,
            background: TOKENS.paper,
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "10px 14px", border: `2.5px solid ${TOKENS.ink}`, borderRadius: 999, background: TOKENS.bg, boxShadow: `3px 3px 0 ${TOKENS.ink}` }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="message the crew…"
              style={{ flex: 1, appearance: "none", border: "none", outline: "none", background: "transparent", fontFamily: TOKENS.ui, fontSize: 13, fontWeight: 700, color: TOKENS.ink }}
            />
          </div>
          <button
            onClick={send}
            style={{ appearance: "none", cursor: "pointer", width: 44, height: 44, borderRadius: 999, border: `2.5px solid ${TOKENS.ink}`, background: input.trim() ? TOKENS.ink : TOKENS.paper, color: input.trim() ? TOKENS.paper : TOKENS.ink, fontFamily: TOKENS.display, fontSize: 20, fontWeight: 900, boxShadow: `3px 3px 0 ${TOKENS.ink}`, transition: "all .15s" }}
          >
            ↑
          </button>
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
  flexShrink: 0,
};
