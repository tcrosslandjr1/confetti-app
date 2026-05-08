import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeft, Loader2, Send, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

type Search = { seed?: string };

export const Route = createFileRoute("/concierge/chat/$threadId")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    seed: typeof s.seed === "string" ? s.seed : undefined,
  }),
  head: () => ({ meta: [{ title: "Chat — Concierge" }] }),
  component: ChatThread,
});

type Msg = { id: string; role: "user" | "assistant"; content: string };

function ChatThread() {
  const { threadId } = Route.useParams();
  const { seed } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [thread, setThread] = useState<{ title: string } | null>(null);
  const seededRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load thread + messages
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const [{ data: t }, { data: msgs }] = await Promise.all([
        supabase.from("threads").select("title").eq("id", threadId).maybeSingle(),
        supabase.from("messages").select("id,role,content").eq("thread_id", threadId).order("created_at"),
      ]);
      if (cancelled) return;
      if (t) setThread(t);
      setMessages((msgs ?? []) as Msg[]);
    })();
    return () => { cancelled = true; };
  }, [threadId, user]);

  // Seed first message if provided via search and the thread is empty
  useEffect(() => {
    if (seededRef.current) return;
    if (!user || !seed) return;
    if (messages.length > 0) { seededRef.current = true; return; }
    seededRef.current = true;
    void send(seed);
    // Strip the seed from the URL so it doesn't re-fire
    navigate({ to: "/concierge/chat/$threadId", params: { threadId }, search: {} as any, replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, seed, messages.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  const send = async (text: string) => {
    if (!user || !text.trim() || streaming) return;
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: text.trim() };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setStreaming(true);

    // Persist user message
    void supabase.from("messages").insert({
      thread_id: threadId,
      user_id: user.id,
      role: "user",
      content: userMsg.content,
    });

    // Get prefs for context
    const { data: prefs } = await supabase
      .from("user_preferences")
      .select("cuisines,activities,budget_min,budget_max")
      .eq("user_id", user.id)
      .maybeSingle();

    // Update thread title from first user message if still default
    if (messages.length === 0 && thread?.title && (thread.title === "New chat" || !thread.title)) {
      const newTitle = text.trim().slice(0, 60);
      void supabase.from("threads").update({ title: newTitle, last_message_at: new Date().toISOString() }).eq("id", threadId);
      setThread({ title: newTitle });
    } else {
      void supabase.from("threads").update({ last_message_at: new Date().toISOString() }).eq("id", threadId);
    }

    const assistantId = crypto.randomUUID();
    setMessages((m) => [...m, { id: assistantId, role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map(({ role, content }) => ({ role, content })),
          preferences: prefs ?? null,
        }),
      });

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => "");
        if (res.status === 429) throw new Error("Rate limited — please slow down.");
        if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Workspace settings.");
        throw new Error(errText || `Request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) =>
          m.map((msg) => (msg.id === assistantId ? { ...msg, content: acc } : msg)),
        );
      }

      // Persist final assistant message
      if (acc) {
        void supabase.from("messages").insert({
          thread_id: threadId,
          user_id: user.id,
          role: "assistant",
          content: acc,
        });
      }
    } catch (e: any) {
      setMessages((m) =>
        m.map((msg) =>
          msg.id === assistantId
            ? { ...msg, content: `⚠️ ${e?.message ?? "Something went wrong"}` }
            : msg,
        ),
      );
    } finally {
      setStreaming(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 -mx-px border-b border-border glass">
        <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-3">
          <Link to="/concierge/chat" className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-vibe">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{thread?.title ?? "Concierge"}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {streaming ? "Thinking..." : "Online"}
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 && !streaming && (
          <div className="mt-10 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-gradient-vibe shadow-pop">
              <Sparkles className="h-7 w-7 text-primary-foreground" />
            </div>
            <h2 className="mt-4 font-display text-xl font-bold">Where to tonight?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Ask anything — date spots, dive bars, late eats.
            </p>
            <div className="mt-6 grid gap-2 text-left">
              {[
                "Where should I take someone on a first date in Georgetown?",
                "Find a rooftop with live music under $50",
                "Best Ethiopian spot in DC right now?",
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-2xl border border-border bg-card p-3 text-left text-sm shadow-card active:scale-[0.98]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="space-y-5">
          {messages.map((m) => (
            <Bubble key={m.id} msg={m} />
          ))}
          {streaming && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> thinking...
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <form onSubmit={onSubmit} className="sticky bottom-20 mx-3 mb-3 flex items-end gap-2 rounded-3xl border border-border bg-card p-2 shadow-pop">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send(input);
            }
          }}
          placeholder="Ask the concierge..."
          rows={1}
          className="max-h-32 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          disabled={!input.trim() || streaming}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-vibe text-primary-foreground shadow-pop transition-pop active:scale-90 disabled:opacity-50"
          aria-label="Send"
        >
          {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
    </div>
  );
}

function Bubble({ msg }: { msg: Msg }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-3xl rounded-br-md bg-gradient-vibe px-4 py-2.5 text-sm text-primary-foreground shadow-pop">
          {msg.content}
        </div>
      </div>
    );
  }
  return (
    <div className="prose prose-sm prose-invert max-w-none text-foreground prose-p:my-2 prose-headings:mt-3 prose-headings:mb-1 prose-strong:text-foreground prose-ul:my-2">
      <ReactMarkdown>{msg.content || "..."}</ReactMarkdown>
    </div>
  );
}
