import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, ArrowLeft, MapPin, Star } from "lucide-react";
import { sendMessageLocal } from "../lib/agents/chat-agent";
import type { ChatResponse } from "../lib/agents/chat-agent";
import type { DiscoveredVenue } from "../lib/agents/venue-discovery";

export const Route = createFileRoute("/chat")({
  head: () => ({ meta: [{ title: "Confetti AI Chat — Confetti" }] }),
  component: ChatPage,
});

type Msg = {
  id: number;
  role: "user" | "ai";
  text: string;
  reveal?: boolean;
  venues?: DiscoveredVenue[];
  chips?: string[];
};

const DEFAULT_CHIPS = [
  "Find me a rooftop",
  "Date night ideas",
  "What's trending",
  "Surprise me",
];

function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: 0,
      role: "ai",
      text: "Hey — I'm your Confetti concierge. What's the vibe tonight?",
      reveal: true,
      chips: DEFAULT_CHIPS,
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [chips, setChips] = useState<string[]>(DEFAULT_CHIPS);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  async function send(text: string) {
    if (!text.trim() || typing) return;
    const userMsg: Msg = { id: Date.now(), role: "user", text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);

    try {
      const response: ChatResponse = await sendMessageLocal(text);
      setTyping(false);
      setMessages((m) => [
        ...m,
        {
          id: Date.now() + 1,
          role: "ai",
          text: response.message,
          reveal: true,
          venues: response.venues,
          chips: response.suggestedChips,
        },
      ]);
      if (response.suggestedChips?.length) {
        setChips(response.suggestedChips);
      }
    } catch {
      setTyping(false);
      setMessages((m) => [
        ...m,
        {
          id: Date.now() + 1,
          role: "ai",
          text: "I'm having a moment — let me try that again. What kind of vibe are you feeling tonight?",
          reveal: true,
        },
      ]);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      <header className="sticky top-0 z-10 border-b-2 border-ink bg-cream/95 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-md items-center gap-3 px-4">
          <Link
            to="/app"
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
                {m.venues && m.venues.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1.5">
                    {m.venues.map((v, vi) => (
                      <div
                        key={vi}
                        className="rounded-lg border border-ink/20 bg-cream/50 px-2.5 py-2"
                      >
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-coral" />
                          <span className="font-display text-xs font-bold">{v.name}</span>
                          {v.rating && (
                            <span className="ml-auto flex items-center gap-0.5 text-[10px] text-ink/60">
                              <Star className="h-2.5 w-2.5 fill-gold text-gold" />
                              {v.rating}
                            </span>
                          )}
                        </div>
                        {v.vibeTags?.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {v.vibeTags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-gold/20 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
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
            {chips.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                disabled={typing}
                className="rounded-full border-2 border-ink bg-cream px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-ink hover:bg-gold disabled:opacity-40"
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
