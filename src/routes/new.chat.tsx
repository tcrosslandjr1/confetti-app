import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  BrandMark, ChunkyButton, Frame, Icons, TOKENS,
} from "@/components/new-confetti/shell";

// Slim port — design/new-confetti/project/extras.jsx (ChatScreen, line 589)
export const Route = createFileRoute("/new/chat")({
  component: ChatPage,
});

interface Msg { who: "you" | "confetti"; text: string }

const SEED: Msg[] = [
  { who: "confetti", text: "hey jess, saturday's wide open. tell me a vibe." },
  { who: "you", text: "low-key date night in brooklyn, walkable, foodie" },
  { who: "confetti", text: "got it — i'll line up 3 stops. wine bar opener, a small italian, late dessert. give me 4 mins." },
];

function ChatPage() {
  const navigate = useNavigate();
  const [msgs, setMsgs] = useState<Msg[]>(SEED);
  const [input, setInput] = useState("");

  function send() {
    const t = input.trim();
    if (!t) return;
    setMsgs((m) => [...m, { who: "you", text: t }]);
    setInput("");
    setTimeout(() => setMsgs((m) => [...m, { who: "confetti", text: "locked in. printing your pass." }]), 600);
    setTimeout(() => navigate({ to: "/new/printing" }), 1400);
  }

  return (
    <Frame>
      <div style={{
        position: "relative", height: "100%", background: TOKENS.bg,
        display: "flex", flexDirection: "column",
        padding: "56px 18px 18px",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <button onClick={() => navigate({ to: "/new/hub" })} style={backBtn()}>←</button>
          <BrandMark size={17} />
          <span style={{ width: 36 }} />
        </div>

        <div style={{
          flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10,
          marginRight: -18, paddingRight: 18, scrollbarWidth: "none",
        }}>
          {msgs.map((m, i) => (
            <div key={i} style={{
              alignSelf: m.who === "you" ? "flex-end" : "flex-start",
              maxWidth: "80%",
              padding: "10px 14px",
              border: `2.5px solid ${TOKENS.ink}`,
              borderRadius: 18,
              background: m.who === "you" ? TOKENS.ink : TOKENS.paper,
              color: m.who === "you" ? TOKENS.paper : TOKENS.ink,
              boxShadow: `3px 3px 0 ${TOKENS.ink}`,
              fontFamily: TOKENS.ui, fontSize: 14, fontWeight: 600, lineHeight: 1.4,
            }}>{m.text}</div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, paddingTop: 12 }}>
          <input value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="say a vibe…"
            style={{
              flex: 1, appearance: "none",
              padding: "14px 16px",
              border: `2.5px solid ${TOKENS.ink}`, borderRadius: 14,
              background: TOKENS.paper, outline: "none",
              fontFamily: TOKENS.ui, fontSize: 15, fontWeight: 700, color: TOKENS.ink,
              boxShadow: `3px 3px 0 ${TOKENS.ink}`,
            }} />
          <ChunkyButton variant="accent" onClick={send} full={false} icon={Icons.arrow}>
            send
          </ChunkyButton>
        </div>
      </div>
    </Frame>
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
