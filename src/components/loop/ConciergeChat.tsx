// Confetti AI Concierge — floating chat panel
// Lets users tweak their itinerary via natural language conversation with Claude.

import { useState, useRef, useEffect, useCallback } from "react";
import {
  type ChatMessage,
  type ConciergeResponse,
  sendConciergeMessage,
  msgId,
} from "@/lib/chat-concierge-client";
import { type ActiveLoop, getActiveLoop, subscribeActiveLoop } from "@/lib/loop-store";
import { MessageCircle, Send, X, Sparkles, AlertCircle } from "lucide-react";

// ─── Component ──────────────────────────────────────────────────────

export function ConciergeChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loop, setLoop] = useState<ActiveLoop | null>(getActiveLoop);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep loop in sync with localStorage changes
  useEffect(() => {
    const unsub = subscribeActiveLoop(() => setLoop(getActiveLoop()));
    return unsub;
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading || !loop) return;

    setInput("");
    setError(null);

    const userMsg: ChatMessage = {
      id: msgId(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const resp: ConciergeResponse = await sendConciergeMessage(
        text,
        loop,
        messages,
        true, // auto-apply edits
      );

      const assistantMsg: ChatMessage = {
        id: msgId(),
        role: "assistant",
        content: resp.reply,
        edits: resp.edits,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setError((err as Error).message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [input, loading, loop, messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Don't render if no active loop
  if (!loop) return null;

  // ─── Floating button (closed state) ─────────────────────────────

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-5 py-3 shadow-lg transition-transform hover:scale-105 active:scale-95"
        style={{
          background: "linear-gradient(135deg, #5B45D9 0%, #FF5B3D 100%)",
          color: "#F8F0DD",
        }}
        aria-label="Open Confetti Concierge"
      >
        <MessageCircle size={20} />
        <span className="text-sm font-semibold">Concierge</span>
      </button>
    );
  }

  // ─── Open chat panel ────────────────────────────────────────────

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col overflow-hidden rounded-2xl shadow-2xl"
      style={{
        width: "min(380px, calc(100vw - 48px))",
        height: "min(560px, calc(100vh - 96px))",
        background: "#F8F0DD",
        border: "1px solid rgba(43, 20, 16, 0.12)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ background: "#2B1410" }}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={18} style={{ color: "#F7C83B" }} />
          <span className="text-sm font-bold" style={{ color: "#F8F0DD" }}>
            Confetti Concierge
          </span>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="rounded-full p-1 transition-colors hover:bg-white/10"
          aria-label="Close chat"
        >
          <X size={18} style={{ color: "#F8F0DD" }} />
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-60 px-4">
            <Sparkles size={32} style={{ color: "#5B45D9" }} className="mb-3" />
            <p className="text-sm font-medium" style={{ color: "#2B1410" }}>
              Ask me anything about your night
            </p>
            <p className="text-xs mt-1" style={{ color: "#2B1410" }}>
              "Make stop 2 quieter" · "Add a dessert spot" · "What should I wear?"
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {loading && (
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: "#5B45D9", animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: "#5B45D9", animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: "#5B45D9", animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs" style={{ background: "#FF5B3D20", color: "#FF5B3D" }}>
            <AlertCircle size={14} />
            {error}
          </div>
        )}
      </div>

      {/* Input */}
      <div
        className="flex items-center gap-2 px-3 py-3"
        style={{ borderTop: "1px solid rgba(43, 20, 16, 0.08)" }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask your concierge..."
          disabled={loading}
          className="flex-1 rounded-full px-4 py-2 text-sm outline-none transition-shadow focus:ring-2"
          style={{
            background: "#FFFFFF",
            color: "#2B1410",
            border: "1px solid rgba(43, 20, 16, 0.12)",
            // @ts-expect-error CSS custom property
            "--tw-ring-color": "#5B45D9",
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="flex items-center justify-center rounded-full p-2 transition-opacity disabled:opacity-40"
          style={{ background: "#5B45D9", color: "#F8F0DD" }}
          aria-label="Send message"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── Message Bubble ─────────────────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
        style={
          isUser
            ? { background: "#5B45D9", color: "#F8F0DD" }
            : { background: "#FFFFFF", color: "#2B1410", border: "1px solid rgba(43, 20, 16, 0.08)" }
        }
      >
        <p className="whitespace-pre-wrap">{message.content}</p>

        {/* Edit badge */}
        {message.edits && message.edits.length > 0 && (
          <div
            className="mt-2 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
            style={{ background: "#F7C83B30", color: "#2B1410" }}
          >
            <Sparkles size={12} style={{ color: "#F7C83B" }} />
            Plan updated · {message.edits.length} {message.edits.length === 1 ? "change" : "changes"}
          </div>
        )}
      </div>
    </div>
  );
}

export default ConciergeChat;
