import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { firstNameOrFriend } from "@/lib/user-name";
import {
  Check,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
  Utensils,
  PartyPopper,
  Music,
  Wine,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/concierge/chat/")({
  head: () => ({ meta: [{ title: "Chats — Confetti" }] }),
  component: ChatList,
});

type Thread = { id: string; title: string; last_message_at: string };

const MOCK_THREADS: Thread[] = [
  {
    id: "mock-rooftop",
    title: "Rooftop drinks tonight",
    last_message_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "mock-birthday",
    title: "Birthday dinner for 8",
    last_message_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
  },
];

const MOCK_PREVIEWS: Record<string, string> = {
  "mock-rooftop": "I found 3 rooftop options with open tables tonight...",
  "mock-birthday": "Here's a private dining shortlist for May 17...",
};

function bucket(d: Date): "Today" | "This week" | "Earlier" {
  const now = new Date();
  const day = 86_400_000;
  const diff = now.getTime() - d.getTime();
  if (diff < day && d.getDate() === now.getDate()) return "Today";
  if (diff < 7 * day) return "This week";
  return "Earlier";
}

function ChatList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [profile, setProfile] = useState<{ display_name: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("threads")
      .select("id,title,last_message_at")
      .eq("user_id", user.id)
      .order("last_message_at", { ascending: false });
    const rows = (data ?? []) as Thread[];
    setThreads(rows.length > 0 ? rows : MOCK_THREADS);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setProfile(data as any));
  }, [user]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return threads;
    return threads.filter((t) => (t.title || "").toLowerCase().includes(needle));
  }, [threads, q]);

  const grouped = useMemo(() => {
    const map: Record<string, Thread[]> = { Today: [], "This week": [], Earlier: [] };
    for (const t of filtered) map[bucket(new Date(t.last_message_at))].push(t);
    return map;
  }, [filtered]);

  const newChat = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("threads")
      .insert({ user_id: user.id })
      .select()
      .single();
    if (error) {
      toast.error("Couldn't start a chat");
      return;
    }
    if (data) navigate({ to: "/concierge/chat/$threadId", params: { threadId: data.id } });
  };

  const remove = async (id: string) => {
    const prev = threads;
    setThreads((t) => t.filter((x) => x.id !== id));
    setConfirmId(null);
    const { error } = await supabase.from("threads").delete().eq("id", id);
    if (error) {
      setThreads(prev);
      toast.error("Couldn't delete");
    } else {
      toast.success("Chat deleted");
    }
  };

  const startEdit = (t: Thread) => {
    setEditingId(t.id);
    setEditValue(t.title || "");
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const newTitle = editValue.trim() || "Untitled";
    const id = editingId;
    setThreads((arr) => arr.map((t) => (t.id === id ? { ...t, title: newTitle } : t)));
    setEditingId(null);
    const { error } = await supabase.from("threads").update({ title: newTitle }).eq("id", id);
    if (error) toast.error("Couldn't rename");
  };

  const prompts = [
    { icon: Wine, label: "Rooftop drinks tonight", tint: "from-coral/20 to-coral/5" },
    { icon: Utensils, label: "Dinner for 4 nearby", tint: "from-gold/25 to-gold/5" },
    { icon: PartyPopper, label: "Birthday plan", tint: "from-pink-400/20 to-pink-400/5" },
    { icon: Music, label: "Live music this weekend", tint: "from-indigo-400/20 to-indigo-400/5" },
  ];

  const startFromPrompt = async (text: string) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("threads")
      .insert({ user_id: user.id, title: text })
      .select()
      .single();
    if (error) {
      toast.error("Couldn't start a chat");
      return;
    }
    if (data) navigate({ to: "/concierge/chat/$threadId", params: { threadId: data.id } });
  };

  return (
    <div className="px-5 pt-8 pb-32">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-coral/15 via-cream to-gold/10 p-5 shadow-card">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-coral/20 blur-3xl" />
        <div className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-gold/20 blur-3xl" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-background/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ink/70 backdrop-blur">
              <Sparkles className="h-3 w-3 text-coral" />
              Hey {firstNameOrFriend(user, profile)}
            </div>
            <h1 className="mt-2 font-display text-3xl font-black leading-tight">Concierge</h1>
            <p className="mt-1 max-w-xs text-xs text-ink/60">
              Ask anything — I'll curate the night, book the table, and rally the crew.
            </p>
          </div>
          <button
            onClick={newChat}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-vibe px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-pop active:scale-95"
          >
            <Plus className="h-4 w-4" /> New
          </button>
        </div>

        <div className="relative mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {prompts.map((p) => (
            <button
              key={p.label}
              onClick={() => void startFromPrompt(p.label)}
              className={`group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/60 bg-gradient-to-br ${p.tint} px-3 py-1.5 text-xs font-semibold text-ink shadow-sm transition active:scale-95 hover:shadow-pop`}
            >
              <p.icon className="h-3.5 w-3.5" />
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {threads.length > 0 && (
        <div className="mt-5 flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 shadow-card">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search chats"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              aria-label="Clear"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          { k: "Chats", v: threads.length },
          { k: "Today", v: grouped.Today?.length ?? 0 },
          { k: "This week", v: (grouped.Today?.length ?? 0) + (grouped["This week"]?.length ?? 0) },
        ].map((s) => (
          <div
            key={s.k}
            className="rounded-2xl border border-border bg-card px-3 py-2 text-center shadow-card"
          >
            <div className="font-display text-xl font-black text-ink">{s.v}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {s.k}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-5">
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-2xl border border-border bg-card/60"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          threads.length === 0 ? (
            <div className="relative overflow-hidden rounded-3xl border border-dashed border-coral/40 bg-gradient-to-br from-coral/10 via-cream to-gold/10 p-8 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-vibe text-primary-foreground shadow-pop">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="mt-4 font-display text-lg font-bold">Your concierge is ready</div>
              <div className="mt-1 text-xs text-ink/60">
                Start a chat — or tap a quick prompt above.
              </div>
              <button
                onClick={newChat}
                className="mt-5 inline-flex rounded-full bg-gradient-vibe px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-pop active:scale-95"
              >
                Start chatting
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
              No chats match "{q}"
            </div>
          )
        ) : (
          (["Today", "This week", "Earlier"] as const).map((label) =>
            grouped[label].length > 0 ? (
              <section key={label}>
                <div className="mb-2 flex items-center gap-2 px-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {label}
                  </span>
                  <span className="rounded-full bg-muted px-1.5 text-[10px] font-bold text-ink/60">
                    {grouped[label].length}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="space-y-2">
                  {grouped[label].map((t, idx) => {
                    const tints = [
                      "from-coral to-pink-500",
                      "from-indigo-500 to-purple-500",
                      "from-gold to-amber-500",
                      "from-emerald-500 to-teal-500",
                      "from-sky-500 to-blue-600",
                    ];
                    const tint = tints[(t.id.charCodeAt(0) + idx) % tints.length];
                    const isToday = label === "Today";
                    return (
                      <div
                        key={t.id}
                        className="group relative flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-card transition hover:-translate-y-0.5 hover:shadow-pop"
                      >
                        <span
                          className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${tint} text-white shadow-sm`}
                        >
                          <MessageCircle className="h-4 w-4" />
                          {isToday && (
                            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-coral ring-2 ring-card" />
                          )}
                        </span>
                        {editingId === t.id ? (
                          <div className="flex flex-1 items-center gap-2">
                            <input
                              autoFocus
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") void saveEdit();
                                if (e.key === "Escape") setEditingId(null);
                              }}
                              className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2 py-1 text-sm outline-none focus:border-primary"
                            />
                            <button
                              onClick={saveEdit}
                              className="rounded-lg p-1.5 text-primary hover:bg-muted"
                              aria-label="Save"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                              aria-label="Cancel"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <Link
                              to="/concierge/chat/$threadId"
                              params={{ threadId: t.id }}
                              className="min-w-0 flex-1"
                            >
                              <div className="flex items-center gap-2">
                                <div className="truncate text-sm font-bold text-ink">
                                  {t.title || "Untitled"}
                                </div>
                                <div className="ml-auto shrink-0 text-[10px] font-medium text-muted-foreground">
                                  {formatDistanceToNow(new Date(t.last_message_at), {
                                    addSuffix: false,
                                  })}
                                </div>
                              </div>
                              {MOCK_PREVIEWS[t.id] && (
                                <div className="mt-0.5 truncate text-xs text-ink/60">
                                  {MOCK_PREVIEWS[t.id]}
                                </div>
                              )}
                            </Link>
                            <div className="flex items-center opacity-0 transition group-hover:opacity-100">
                              <button
                                onClick={() => startEdit(t)}
                                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                                aria-label="Rename"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              {confirmId === t.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => void remove(t.id)}
                                    className="rounded-lg bg-destructive px-2 py-1 text-[11px] font-semibold text-destructive-foreground"
                                  >
                                    Delete
                                  </button>
                                  <button
                                    onClick={() => setConfirmId(null)}
                                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                                    aria-label="Cancel"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmId(t.id)}
                                  className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-destructive"
                                  aria-label="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null,
          )
        )}
      </div>
    </div>
  );
}
