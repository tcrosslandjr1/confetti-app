import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { firstNameOrFriend } from "@/lib/user-name";
import { Check, MessageCircle, Pencil, Plus, Search, Trash2, X } from "lucide-react";
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

  return (
    <div className="px-5 pt-10">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Your chats</div>
          <h1 className="mt-1 font-display text-3xl font-bold">Concierge</h1>
        </div>
        <button
          onClick={newChat}
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-vibe px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-pop active:scale-95"
        >
          <Plus className="h-4 w-4" /> New
        </button>
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

      <div className="mt-5 space-y-5">
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          threads.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card/50 p-8 text-center">
              <MessageCircle className="mx-auto h-8 w-8 text-muted-foreground" />
              <div className="mt-3 font-semibold">No chats yet</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Start one to plan your night.
              </div>
              <button
                onClick={newChat}
                className="mt-4 inline-flex rounded-full bg-gradient-vibe px-4 py-2 text-sm font-semibold text-primary-foreground"
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
                <div className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {label}
                </div>
                <div className="space-y-2">
                  {grouped[label].map((t) => (
                    <div
                      key={t.id}
                      className="group flex items-center gap-2 rounded-2xl border border-border bg-card p-3 shadow-card"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-cool text-primary-foreground">
                        <MessageCircle className="h-4 w-4" />
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
                            <div className="truncate text-sm font-semibold">
                              {t.title || "Untitled"}
                            </div>
                            {MOCK_PREVIEWS[t.id] && (
                              <div className="truncate text-xs text-muted-foreground">
                                {MOCK_PREVIEWS[t.id]}
                              </div>
                            )}
                            <div className="text-[11px] text-muted-foreground">
                              {formatDistanceToNow(new Date(t.last_message_at), {
                                addSuffix: true,
                              })}
                            </div>
                          </Link>
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
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ) : null,
          )
        )}
      </div>
    </div>
  );
}
