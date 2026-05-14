import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeft, Copy, Loader2, RotateCcw, Send, Sparkles, Square, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { parseAssistantContent, VenueCard } from "@/components/concierge/VenueCard";
import { getSelectedCity, DEFAULT_CITY, subscribeSelectedCity, type City } from "@/lib/cities";
import { findCityLoose } from "@/lib/agents/city-context";

type Search = { seed?: string };

export const Route = createFileRoute("/concierge/chat/$threadId")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    seed: typeof s.seed === "string" ? s.seed : undefined,
  }),
  head: () => ({ meta: [{ title: "Chat — Concierge" }] }),
  component: ChatThread,
});

type Msg = { id: string; role: "user" | "assistant"; content: string };

function timeOfDayPrompts(city: City, d = new Date()): string[] {
  const ctx = findCityLoose(city.slug, city.name);
  const hoods = ctx?.neighborhoods?.map((n) => n.name) ?? [];
  const hood = (i: number) => hoods[i % Math.max(hoods.length, 1)] ?? "downtown";
  const cityName = city.name;
  const h = d.getHours();
  if (h < 11)
    return [
      `Best brunch spot to take my parents in ${cityName} on Sunday`,
      `Coffee + work spot in ${hood(0)} with good wifi`,
      `Where can I get great pastries right now in ${cityName}?`,
    ];
  if (h < 16)
    return [
      `Lunch under $25 in ${hood(0)} today`,
      `Patio with shade and good salads in ${hood(1)}`,
      `Where to take a client for a quick lunch in ${hood(2)}`,
    ];
  if (h < 21)
    return [
      "Romantic dinner under $80pp tonight, not too loud",
      `Build me a 3-stop date night starting in ${hood(0)}`,
      "Group dinner for 8 with strong cocktails — surprise me",
    ];
  return [
    `Late-night eats open past midnight in ${cityName}`,
    "Cocktail bar with seats right now — no scene",
    `Where's still serving food after 11 in ${hood(1)}?`,
  ];
}

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [city, setCity] = useState<City>(() => getSelectedCity() ?? DEFAULT_CITY);

  const [suggestions, setSuggestions] = useState<string[]>(() =>
    timeOfDayPrompts(getSelectedCity() ?? DEFAULT_CITY, new Date()),
  );

  useEffect(() => {
    const sync = () => {
      const c = getSelectedCity() ?? DEFAULT_CITY;
      setCity(c);
      setSuggestions(timeOfDayPrompts(c, new Date()));
    };
    sync();
    return subscribeSelectedCity(sync);
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const [{ data: t }, { data: msgs }] = await Promise.all([
        supabase.from("threads").select("title").eq("id", threadId).maybeSingle(),
        supabase
          .from("messages")
          .select("id,role,content")
          .eq("thread_id", threadId)
          .order("created_at"),
      ]);
      if (cancelled) return;
      if (t) setThread(t);
      setMessages((msgs ?? []) as Msg[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [threadId, user]);

  useEffect(() => {
    if (seededRef.current) return;
    if (!user || !seed) return;
    if (messages.length > 0) {
      seededRef.current = true;
      return;
    }
    seededRef.current = true;
    void send(seed);
    navigate({
      to: "/concierge/chat/$threadId",
      params: { threadId },
      search: {} as any,
      replace: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, seed, messages.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  // Keep composer focused
  useEffect(() => {
    if (!streaming) textareaRef.current?.focus();
  }, [streaming, threadId]);

  const send = async (
    text: string,
    opts?: { skipUserPersist?: boolean; replaceLastAssistant?: boolean },
  ) => {
    if (!user || !text.trim() || streaming) return;
    const trimmed = text.trim();

    let history: Msg[];
    if (opts?.replaceLastAssistant) {
      // Drop trailing assistant; keep history as-is for regenerate
      history = messages.filter((_, i, a) => !(i === a.length - 1 && a[i].role === "assistant"));
      setMessages(history);
    } else {
      const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: trimmed };
      history = [...messages, userMsg];
      setMessages(history);
      setInput("");
      if (!opts?.skipUserPersist) {
        void supabase.from("messages").insert({
          thread_id: threadId,
          user_id: user.id,
          role: "user",
          content: trimmed,
        });
      }
    }
    setStreaming(true);

    // Pull personalization context in parallel
    const [prefsRes, bookingsRes] = await Promise.all([
      supabase
        .from("user_preferences")
        .select("cuisines,activities,budget_min,budget_max,taste_profile,about_me")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("bookings")
        .select("venue_name,starts_at,party_size")
        .eq("user_id", user.id)
        .order("starts_at", { ascending: false })
        .limit(8),
    ]);

    if (messages.length === 0 && (!thread?.title || thread.title === "New chat")) {
      const newTitle = trimmed.slice(0, 60);
      void supabase
        .from("threads")
        .update({ title: newTitle, last_message_at: new Date().toISOString() })
        .eq("id", threadId);
      setThread({ title: newTitle });
    } else {
      void supabase
        .from("threads")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", threadId);
    }

    const assistantId = crypto.randomUUID();
    setMessages((m) => [...m, { id: assistantId, role: "assistant", content: "" }]);

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        signal: ac.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map(({ role, content }) => ({ role, content })),
          preferences: prefsRes.data ?? null,
          recentBookings: bookingsRes.data ?? [],
          now: new Date().toISOString(),
        }),
      });

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => "");
        if (res.status === 429) throw new Error("Rate limited — please slow down.");
        if (res.status === 402)
          throw new Error("AI credits exhausted. Add credits in Workspace settings.");
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

      if (acc) {
        void supabase.from("messages").insert({
          thread_id: threadId,
          user_id: user.id,
          role: "assistant",
          content: acc,
        });
      }
    } catch (e: any) {
      if (e?.name === "AbortError") {
        // Persist whatever streamed before stopping
        const partial = typeof window !== "undefined" ? null : null;
        void partial;
      } else {
        setMessages((m) =>
          m.map((msg) =>
            msg.id === assistantId
              ? { ...msg, content: `⚠️ ${e?.message ?? "Something went wrong"}` }
              : msg,
          ),
        );
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const stop = () => {
    abortRef.current?.abort();
  };

  const regenerate = () => {
    // Find last user message and resend
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    void send(lastUser.content, { skipUserPersist: true, replaceLastAssistant: true });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 -mx-px border-b border-border glass">
        <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-3">
          <Link
            to="/concierge/chat"
            className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-vibe">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{thread?.title ?? "Concierge"}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {streaming ? "Thinking..." : "Online · DMV insider"}
            </div>
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 && !streaming && (
          <div className="mt-6 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-gradient-vibe shadow-pop">
              <Sparkles className="h-7 w-7 text-primary-foreground" />
            </div>
            <h2 className="mt-4 font-display text-xl font-bold">What's the move tonight?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              I know the DMV. Tell me the vibe, budget, and crew — I'll plan it.
            </p>
            <div className="mt-6 grid gap-2 text-left">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-2xl border border-border bg-card p-3 text-left text-sm shadow-card transition-pop active:scale-[0.98] hover:bg-muted/40"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="space-y-5">
          {messages.map((m, i) => (
            <Bubble
              key={m.id}
              msg={m}
              isLast={i === messages.length - 1}
              streaming={streaming}
              onRegenerate={regenerate}
            />
          ))}
          {streaming && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> thinking...
            </div>
          )}
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        className="sticky bottom-20 mx-3 mb-3 flex items-end gap-2 rounded-3xl border border-border bg-card p-2 shadow-pop"
      >
        <textarea
          ref={textareaRef}
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
          autoFocus
          className="max-h-32 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
        />
        {streaming ? (
          <button
            type="button"
            onClick={stop}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-muted text-foreground shadow-pop transition-pop active:scale-90"
            aria-label="Stop"
          >
            <Square className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-vibe text-primary-foreground shadow-pop transition-pop active:scale-90 disabled:opacity-50"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        )}
      </form>
    </div>
  );
}

function Bubble({
  msg,
  isLast,
  streaming,
  onRegenerate,
}: {
  msg: Msg;
  isLast: boolean;
  streaming: boolean;
  onRegenerate: () => void;
}) {
  const [copied, setCopied] = useState(false);

  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-3xl rounded-br-md bg-gradient-vibe px-4 py-2.5 text-sm text-primary-foreground shadow-pop">
          {msg.content}
        </div>
      </div>
    );
  }

  const segments = parseAssistantContent(msg.content);
  const showActions = !streaming && msg.content && !msg.content.startsWith("⚠️");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(msg.content);
      setCopied(true);
      toast.success("Copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy");
    }
  };

  return (
    <div className="space-y-1">
      <div className="space-y-1.5">
        {segments.map((seg, i) =>
          seg.kind === "venue" ? (
            <VenueCard key={i} data={seg.data} />
          ) : seg.text.trim() ? (
            <div
              key={i}
              className="prose prose-sm prose-invert max-w-none text-foreground prose-p:my-2 prose-headings:mt-3 prose-headings:mb-1 prose-strong:text-foreground prose-ul:my-2"
            >
              <ReactMarkdown>{seg.text}</ReactMarkdown>
            </div>
          ) : null,
        )}
        {!msg.content && <div className="text-sm text-muted-foreground">...</div>}
      </div>
      {showActions && (
        <div className="flex items-center gap-1 pt-0.5">
          <button
            onClick={copy}
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
          {isLast && (
            <button
              onClick={onRegenerate}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" /> Regenerate
            </button>
          )}
        </div>
      )}
    </div>
  );
}
