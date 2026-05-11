import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/chat")({
  head: () => ({ meta: [{ title: "Confetti AI Chat — Confetti" }] }),
  component: ChatPage,
});

type Msg = { id: number; role: "user" | "ai"; text: string; reveal?: boolean };

const SUGGESTIONS = ["Find me a rooftop", "Date night ideas", "What's trending"];

const REPLIES: Record<string, string> = {
  rooftop:
    "Aera Rooftop is having a moment — sunset cocktails, low waits before 7pm. Want me to add it to a plan?",
  date: "I'd start at Lila's Patio (small plates), walk to Mason St. Records for nat wine, end at Aera. Romantic, walkable, ~3hrs.",
  trending:
    "This week: Aera Rooftop, Mason St. Records, and the new Ethiopian spot in Shaw — all spiking on TikTok.",
};

function pickReply(text: string) {
  const t = text.toLowerCase();
  if (t.includes("rooftop")) return REPLIES.rooftop;
  if (t.includes("date") || t.includes("romantic")) return REPLIES.date;
  if (t.includes("trend") || t.includes("viral")) return REPLIES.trending;
  return "I can build you a plan for that. Tell me when, who's coming, and your budget.";
}

function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: 0,
      role: "ai",
      text: "Hey — I'm your Confetti concierge. What's the vibe tonight?",
      reveal: true,
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  function send(text: string) {
    if (!text.trim()) return;
    const userMsg: Msg = { id: Date.now(), role: "user", text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);
    setTimeout(
      () => {
        setTyping(false);
        setMessages((m) => [
          ...m,
          { id: Date.now() + 1, role: "ai", text: pickReply(text), reveal: true },
        ]);
      },
      900 + Math.random() * 600,
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      <header className="sticky top-0 z-10 border-b-2 border-ink bg-cream/95 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-md items-center gap-3 px-4">
          <Link
            to="/portal"
            className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-vibe text-cream">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <div className="font-display text-sm font-bold">Confetti AI</div>
            <div className="font-mono text-[9px] uppercase tracking-widest text-ink/60">Online</div>
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto flex max-w-md flex-col gap-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "ai" && (
                <span className="mr-2 mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-vibe text-cream">
                  <Sparkles className="h-3 w-3" />
                </span>
              )}
              <div
                className={`max-w-[78%] rounded-2xl border-2 border-ink px-3.5 py-2.5 text-sm shadow-brut ${
                  m.role === "user"
                    ? "rounded-br-sm bg-coral text-cream"
                    : "rounded-bl-sm bg-card text-ink"
                } ${m.reveal ? "animate-[reveal-up_0.5s_cubic-bezier(0.22,1,0.36,1)_forwards]" : ""}`}
              >
                <Typewriter text={m.text} animate={Boolean(m.reveal && m.role === "ai")} />
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex justify-start">
              <span className="mr-2 mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-vibe text-cream">
                <Sparkles className="h-3 w-3" />
              </span>
              <div className="rounded-2xl rounded-bl-sm border-2 border-ink bg-card px-4 py-3 shadow-brut">
                <TypingDots />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t-2 border-ink bg-cream px-4 pt-3 pb-3">
        <div className="mx-auto max-w-md">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border-2 border-ink bg-cream px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-ink hover:bg-gold"
              >
                {s}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 rounded-2xl border-2 border-ink bg-card px-3 py-2 shadow-brut focus-within:bg-cream"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-ink/40"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="grid h-9 w-9 place-items-center rounded-full bg-coral text-cream disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-ink/60"
          style={{ animation: `typing-bounce 1s ${i * 0.15}s infinite` }}
        />
      ))}
      <style>{`@keyframes typing-bounce { 0%, 60%, 100% { transform: translateY(0); opacity: 0.5; } 30% { transform: translateY(-4px); opacity: 1; } }`}</style>
    </div>
  );
}

function Typewriter({ text, animate }: { text: string; animate: boolean }) {
  const [shown, setShown] = useState(animate ? "" : text);
  useEffect(() => {
    if (!animate) {
      setShown(text);
      return;
    }
    setShown("");
    let i = 0;
    const id = setInterval(() => {
      i += 2;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, 18);
    return () => clearInterval(id);
  }, [text, animate]);
  return <span>{shown}</span>;
}
