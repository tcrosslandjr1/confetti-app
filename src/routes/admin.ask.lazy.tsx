import { createLazyFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Bot, RefreshCw, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { AdminSkeleton } from "@/components/AdminSkeleton";
import {
  getControlCenterView,
  type AgentRecord,
  type ControlCenterView,
} from "@/lib/agents/agent-registry";
import { ChatView } from "@/components/AgentControlCenter";

export const Route = createLazyFileRoute("/admin/ask")({
  component: AdminAskPage,
});

function AdminAskPage() {
  const { agentId } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [view, setView] = useState<ControlCenterView | null>(null);
  const [target, setTarget] = useState<AgentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const v = await getControlCenterView();
      setView(v);
      if (agentId) {
        const found = v.teams.flatMap((t) => t.agents).find((a) => a.id === agentId);
        if (found) setTarget(found);
      }
    } catch (e) {
      setLoadError(true);
      toast.error("Failed to load agents", {
        description: e instanceof Error ? e.message : "Unknown error",
        action: { label: "Retry", onClick: () => void load() },
      });
      console.error("Failed to load agents:", e);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!agentId) {
      setTarget(null);
      return;
    }
    if (view) {
      const found = view.teams.flatMap((t) => t.agents).find((a) => a.id === agentId);
      setTarget(found ?? null);
    }
  }, [agentId, view]);

  const allAgents: AgentRecord[] =
    view?.teams.flatMap((t) => t.agents) ?? [];

  const selectAgent = (id: string | null) => {
    navigate({ search: (prev: Record<string, unknown>) => ({ ...prev, agentId: id ?? undefined }) });
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 pb-5 pt-6 sm:px-6">
        <Link
          to="/admin"
          className="grid h-9 w-9 place-items-center rounded-lg border-2 border-ink bg-cream text-ink shadow-brut transition-pop hover:-translate-x-0.5 hover:-translate-y-0.5"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-coral">
            / admin / ask
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Talk to the agent crew
          </h1>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="grid h-9 w-9 place-items-center rounded-lg border-2 border-ink bg-cream text-ink shadow-brut transition-pop hover:-translate-x-0.5 hover:-translate-y-0.5"
          aria-label="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="mx-auto grid max-w-5xl gap-5 px-4 pb-12 sm:px-6 lg:grid-cols-[260px_1fr]">
        {/* Agent picker */}
        <aside className="rounded-2xl border-2 border-ink bg-cream p-3 shadow-brut">
          <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-ink/60">
            Target
          </div>
          <button
            type="button"
            onClick={() => selectAgent(null)}
            className={`mb-2 flex w-full items-center gap-2 rounded-xl border-2 border-ink px-3 py-2 text-left text-sm font-semibold shadow-brut transition-pop hover:-translate-x-0.5 hover:-translate-y-0.5 ${
              target === null ? "bg-coral text-cream" : "bg-cream text-ink"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            All agents
          </button>

          <div className="mt-3 max-h-[70vh] space-y-1 overflow-y-auto pr-1">
            {loading && (
              <div className="flex items-center gap-2 py-2 font-mono text-[10px] uppercase tracking-wider text-ink/40">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Loading…
              </div>
            )}
            {loadError && (
              <button
                type="button"
                onClick={() => void load()}
                className="flex w-full items-center gap-2 rounded-xl border-2 border-red-500 bg-red-50 px-3 py-2 text-left text-xs font-semibold text-red-700 shadow-brut transition-pop hover:-translate-x-0.5 hover:-translate-y-0.5"
              >
                <RotateCcw className="h-4 w-4" />
                Retry loading agents
              </button>
            )}
            {!loading && !loadError && allAgents.length === 0 && (
              <div className="font-mono text-[10px] uppercase tracking-wider text-ink/40">
                No agents found. Visit /admin/agents to seed.
              </div>
            )}
            {allAgents.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => selectAgent(a.id)}
                className={`flex w-full items-center gap-2 rounded-lg border-2 border-ink px-2.5 py-1.5 text-left text-xs font-semibold transition-pop hover:-translate-x-0.5 hover:-translate-y-0.5 ${
                  target?.id === a.id
                    ? "bg-ink text-cream shadow-brut"
                    : "bg-cream text-ink"
                }`}
              >
                <Bot className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{a.name}</span>
              </button>
            ))}
          </div>
        </aside>

        <ChatView
          target={target}
          onPickAgent={() => selectAgent(null)}
          onClose={() => selectAgent(null)}
        />
      </div>
    </div>
  );
}
