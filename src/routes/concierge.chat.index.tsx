import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { MessageCircle, Plus, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/concierge/chat/")({
  head: () => ({ meta: [{ title: "Chats — Concierge" }] }),
  component: ChatList,
});

type Thread = { id: string; title: string; last_message_at: string };

function ChatList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("threads")
      .select("id,title,last_message_at")
      .eq("user_id", user.id)
      .order("last_message_at", { ascending: false });
    setThreads((data ?? []) as Thread[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const newChat = async () => {
    if (!user) return;
    const { data } = await supabase.from("threads").insert({ user_id: user.id }).select().single();
    if (data) navigate({ to: "/concierge/chat/$threadId", params: { threadId: data.id } });
  };

  const remove = async (id: string) => {
    await supabase.from("threads").delete().eq("id", id);
    setThreads((t) => t.filter((x) => x.id !== id));
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

      <div className="mt-6 space-y-2">
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : threads.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/50 p-8 text-center">
            <MessageCircle className="mx-auto h-8 w-8 text-muted-foreground" />
            <div className="mt-3 font-semibold">No chats yet</div>
            <div className="mt-1 text-xs text-muted-foreground">Start one to plan your night.</div>
            <button
              onClick={newChat}
              className="mt-4 inline-flex rounded-full bg-gradient-vibe px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Start chatting
            </button>
          </div>
        ) : (
          threads.map((t) => (
            <div
              key={t.id}
              className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card"
            >
              <Link
                to="/concierge/chat/$threadId"
                params={{ threadId: t.id }}
                className="flex flex-1 items-center gap-3"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-cool text-primary-foreground">
                  <MessageCircle className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{t.title}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(t.last_message_at), { addSuffix: true })}
                  </div>
                </div>
              </Link>
              <button
                onClick={() => remove(t.id)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-destructive"
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
