/**
 * Agent Control Center — brutalist, unified to Confetti site theme
 *
 *  - Coral / cream / ink palette, shadow-brut, border-2 border-ink
 *  - Teams · Live Feed · Task Board · Chat (NEW — talk to all agents or any one)
 */

import { useEffect, useState, useCallback, useRef } from "react";
import {
  ArrowLeft,
  Bot,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Columns3,
  RefreshCw,
  Zap,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Send,
  ArrowRightLeft,
  Sparkles,
  X,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  getControlCenterView,
  seedControlCenterDemo,
  type ControlCenterView,
  type AgentRecord,
  type AgentTeam,
  type AgentMessage,
  type AgentTask,
  type TaskStatus,
} from "../lib/agents/agent-registry";
import { chatWithAgents } from "@/lib/agents-chat.functions";

// ── helpers ─────────────────────────────────────────────────

const statusDot: Record<string, string> = {
  active: "bg-emerald-500",
  idle: "bg-ink/30",
  error: "bg-red-500",
  disabled: "bg-ink/20",
};

const statusBadge: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-700 border-emerald-500/40",
  idle: "bg-ink/5 text-ink/60 border-ink/20",
  error: "bg-red-500/15 text-red-700 border-red-500/40",
  disabled: "bg-ink/5 text-ink/40 border-ink/10",
};

const priorityBadge: Record<string, string> = {
  critical: "bg-red-500 text-cream",
  high: "bg-coral text-cream",
  medium: "bg-gold text-ink",
  low: "bg-ink/10 text-ink/60",
};

const msgTypeIcon: Record<string, string> = {
  task_handoff: "→",
  status_update: "↻",
  alert: "⚠",
  request: "?",
  response: "✓",
  broadcast: "📢",
};

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── component ───────────────────────────────────────────────

type Tab = "teams" | "feed" | "board" | "chat";

export default function AgentControlCenter() {
  const [view, setView] = useState<ControlCenterView | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("teams");
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [chatTarget, setChatTarget] = useState<AgentRecord | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      setView(await getControlCenterView());
    } catch (err) {
      console.error("Failed to load control center:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSeed = async () => {
    await seedControlCenterDemo();
    await loadData();
  };

  const openChat = (agent: AgentRecord | null) => {
    setChatTarget(agent);
    setTab("chat");
  };

  if (loading || !view) {
    return (
      <div className="min-h-screen bg-cream text-ink">
        <Header />
        <div className="flex items-center justify-center gap-3 p-16 text-ink/60">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span className="font-mono text-sm uppercase tracking-wider">Loading agents…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pb-24 text-ink">
      <Header onRefresh={loadData} />

      {/* KPI strip */}
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3 px-4 sm:grid-cols-4 sm:px-6">
        <Kpi icon={<Bot className="h-4 w-4" />} value={view.totalAgents} label="Total" tone="ink" />
        <Kpi icon={<Zap className="h-4 w-4" />} value={view.activeAgents} label="Active" tone="emerald" />
        <Kpi
          icon={<Clock className="h-4 w-4" />}
          value={view.totalAgents - view.activeAgents - view.errorAgents}
          label="Idle"
          tone="ink"
        />
        <Kpi icon={<AlertTriangle className="h-4 w-4" />} value={view.errorAgents} label="Errors" tone="coral" />
      </div>

      {/* Tabs */}
      <div className="mx-auto mt-5 flex max-w-5xl flex-wrap gap-2 px-4 sm:px-6">
        {(
          [
            ["teams", "Teams", Bot],
            ["feed", "Live Feed", MessageSquare],
            ["board", "Task Board", Columns3],
            ["chat", "Chat", Sparkles],
          ] as const
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              if (key !== "chat") setChatTarget(null);
              setTab(key);
            }}
            className={`inline-flex items-center gap-2 rounded-xl border-2 px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-pop ${
              tab === key
                ? "border-ink bg-coral text-cream shadow-brut"
                : "border-ink/30 bg-cream text-ink/70 hover:border-ink hover:text-ink"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => openChat(null)}
          className="ml-auto inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-gold px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-ink shadow-brut transition-pop hover:-translate-x-0.5 hover:-translate-y-0.5"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Talk to all agents
        </button>
      </div>

      <div className="mx-auto mt-5 max-w-5xl px-4 sm:px-6">
        {tab === "teams" && (
          <TeamsView
            teams={view.teams}
            expandedTeam={expandedTeam}
            onToggle={(id) => setExpandedTeam(expandedTeam === id ? null : id)}
            onChat={openChat}
          />
        )}
        {tab === "feed" && <FeedView messages={view.recentMessages} />}
        {tab === "board" && <BoardView board={view.taskBoard} />}
        {tab === "chat" && (
          <ChatView
            target={chatTarget}
            onPickAgent={() => setTab("teams")}
            onClose={() => setChatTarget(null)}
          />
        )}

        {view.totalAgents === 0 && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleSeed}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-coral px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-cream shadow-brut transition-pop hover:-translate-x-0.5 hover:-translate-y-0.5"
            >
              <Zap className="h-4 w-4" /> Load demo data
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── header ──────────────────────────────────────────────────

function Header({ onRefresh }: { onRefresh?: () => void }) {
  return (
    <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 pb-5 pt-6 sm:px-6">
      <Link
        to="/admin"
        className="grid h-9 w-9 place-items-center rounded-lg border-2 border-ink bg-cream text-ink shadow-brut transition-pop hover:-translate-x-0.5 hover:-translate-y-0.5"
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-coral">
          / admin / agents
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Agent Control Center
        </h1>
      </div>
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          className="grid h-9 w-9 place-items-center rounded-lg border-2 border-ink bg-cream text-ink shadow-brut transition-pop hover:-translate-x-0.5 hover:-translate-y-0.5"
          aria-label="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function Kpi({
  icon,
  value,
  label,
  tone,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  tone: "ink" | "emerald" | "coral";
}) {
  const accent =
    tone === "emerald"
      ? "text-emerald-700"
      : tone === "coral"
        ? "text-coral"
        : "text-ink";
  return (
    <div className="flex items-center gap-3 rounded-xl border-2 border-ink bg-cream p-3 shadow-brut">
      <span className={`grid h-9 w-9 place-items-center rounded-lg border-2 border-ink bg-cream ${accent}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <div className={`font-display text-xl font-bold leading-none ${accent}`}>{value}</div>
        <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-ink/60">{label}</div>
      </div>
    </div>
  );
}

// ── Teams ───────────────────────────────────────────────────

function TeamsView({
  teams,
  expandedTeam,
  onToggle,
  onChat,
}: {
  teams: AgentTeam[];
  expandedTeam: string | null;
  onToggle: (id: string) => void;
  onChat: (a: AgentRecord) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {teams.map((team) => {
        const isOpen = expandedTeam === team.id;
        const activeCount = team.agents.filter((a) => a.status === "active").length;
        const errorCount = team.agents.filter((a) => a.status === "error").length;
        return (
          <div key={team.id} className="overflow-hidden rounded-2xl border-2 border-ink bg-cream shadow-brut">
            <button
              type="button"
              onClick={() => onToggle(team.id)}
              className="flex w-full items-center gap-3 p-4 text-left"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl border-2 border-ink bg-gold text-lg">
                {team.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-display text-base font-bold tracking-tight text-ink">{team.name}</div>
                <div className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-ink/60">
                  {team.agents.length} agents
                  {activeCount > 0 && <span className="text-emerald-700"> · {activeCount} active</span>}
                  {errorCount > 0 && <span className="text-coral"> · {errorCount} error</span>}
                </div>
              </div>
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-ink/40" />
              ) : (
                <ChevronRight className="h-4 w-4 text-ink/40" />
              )}
            </button>
            {isOpen && (
              <div className="border-t-2 border-dashed border-ink/30 divide-y-2 divide-dashed divide-ink/15">
                {team.agents.map((agent) => (
                  <AgentRow key={agent.id} agent={agent} onChat={() => onChat(agent)} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AgentRow({ agent, onChat }: { agent: AgentRecord; onChat: () => void }) {
  return (
    <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex flex-1 items-start gap-3">
        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${statusDot[agent.status]}`} />
        <div className="min-w-0">
          <div className="font-semibold text-ink">{agent.name}</div>
          <div className="text-xs text-ink/60">{agent.description}</div>
          {agent.last_task && (
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-ink/50">
              <Clock className="h-3 w-3" />
              <span className="truncate">{agent.last_task}</span>
              <span className="opacity-60">· {timeAgo(agent.last_active)}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${statusBadge[agent.status]}`}
        >
          {agent.status}
        </span>
        <span className="rounded-md border border-ink/15 bg-ink/5 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-ink/60">
          {agent.layer}
        </span>
        {agent.tasks_completed > 0 && (
          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-ink/50">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            {agent.tasks_completed}
          </span>
        )}
        <button
          type="button"
          onClick={onChat}
          className="inline-flex items-center gap-1 rounded-lg border-2 border-ink bg-cream px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-ink shadow-brut transition-pop hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-coral hover:text-cream"
        >
          <MessageSquare className="h-3 w-3" />
          Chat
        </button>
      </div>
    </div>
  );
}

// ── Feed ────────────────────────────────────────────────────

function FeedView({ messages }: { messages: AgentMessage[] }) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-ink/30 bg-cream p-12 text-ink/50">
        <MessageSquare className="h-8 w-8 opacity-30" />
        <p className="font-mono text-xs uppercase tracking-wider">No agent messages yet</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {messages.map((msg) => (
        <div key={msg.id} className="rounded-xl border-2 border-ink bg-cream p-3 shadow-brut">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-ink/40">{msgTypeIcon[msg.msg_type] || "·"}</span>
            <span className="font-bold text-coral">{msg.from_name || msg.from_agent}</span>
            {(msg.to_name || msg.to_agent) && (
              <>
                <ArrowRightLeft className="h-3 w-3 text-ink/30" />
                <span className="font-bold text-ink">{msg.to_name || msg.to_agent}</span>
              </>
            )}
            {msg.team_name && (
              <>
                <Send className="h-3 w-3 text-ink/30" />
                <span className="font-bold text-ink">{msg.team_name}</span>
              </>
            )}
            <span className="ml-auto font-mono text-[10px] text-ink/40">{timeAgo(msg.created_at)}</span>
          </div>
          <div className="mt-1.5 text-sm font-semibold text-ink">{msg.subject}</div>
          {msg.body && <div className="mt-1 text-xs leading-relaxed text-ink/70">{msg.body}</div>}
        </div>
      ))}
    </div>
  );
}

// ── Board ───────────────────────────────────────────────────

function BoardView({ board }: { board: ControlCenterView["taskBoard"] }) {
  const cols: { key: TaskStatus; label: string; color: string }[] = [
    { key: "backlog", label: "Backlog", color: "bg-ink/30" },
    { key: "in_progress", label: "In Progress", color: "bg-blue-500" },
    { key: "review", label: "Review", color: "bg-gold" },
    { key: "done", label: "Done", color: "bg-emerald-500" },
  ];
  const isEmpty = Object.values(board).every((c) => c.length === 0);
  if (isEmpty) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-ink/30 bg-cream p-12 text-ink/50">
        <Columns3 className="h-8 w-8 opacity-30" />
        <p className="font-mono text-xs uppercase tracking-wider">No agent tasks yet</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto pb-2">
      <div className="grid min-w-[720px] grid-cols-4 gap-3">
        {cols.map((col) => (
          <div key={col.key} className="flex flex-col gap-2">
            <div className="flex items-center gap-2 rounded-xl border-2 border-ink bg-cream px-3 py-2 shadow-brut">
              <span className={`h-2 w-2 rounded-full ${col.color}`} />
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink">{col.label}</span>
              <span className="ml-auto rounded-md bg-ink/10 px-1.5 py-0.5 font-mono text-[10px] text-ink/60">
                {board[col.key].length}
              </span>
            </div>
            {board[col.key].map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function TaskCard({ task }: { task: AgentTask }) {
  return (
    <div className="rounded-xl border-2 border-ink bg-cream p-3 shadow-brut">
      <div className="text-sm font-semibold leading-tight text-ink">{task.title}</div>
      {task.description && <div className="mt-1.5 text-xs text-ink/60">{task.description}</div>}
      <div className="mt-2.5 flex items-center gap-2">
        <span
          className={`rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${priorityBadge[task.priority]}`}
        >
          {task.priority}
        </span>
        {task.assigned_name && (
          <span className="ml-auto inline-flex items-center gap-1 font-mono text-[10px] text-ink/60">
            <Bot className="h-3 w-3" />
            {task.assigned_name}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Chat ────────────────────────────────────────────────────

type ChatMsg = { role: "user" | "assistant"; content: string };

function ChatView({
  target,
  onPickAgent,
  onClose,
}: {
  target: AgentRecord | null;
  onPickAgent: () => void;
  onClose: () => void;
}) {
  const chat = useServerFn(chatWithAgents);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset thread when target changes
  useEffect(() => {
    setMessages([]);
    setError(null);
  }, [target?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setError(null);
    const next: ChatMsg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await chat({
        data: { targetAgentId: target?.id, messages: next },
      });
      setMessages([...next, { role: "assistant", content: res.reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Agent failed to reply");
    } finally {
      setBusy(false);
    }
  };

  const prompts = target
    ? [
        `What's your current status?`,
        `What can you do for the admin team?`,
        `Who do you hand off to?`,
      ]
    : [
        `What's happening across all agents right now?`,
        `Which agent should I talk to about Stripe?`,
        `Give me a 1-sentence status per team.`,
      ];

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-ink bg-cream shadow-brut">
      {/* Header */}
      <div className="flex items-center gap-3 border-b-2 border-ink bg-coral px-4 py-3 text-cream">
        <span className="grid h-9 w-9 place-items-center rounded-xl border-2 border-ink bg-cream text-ink">
          {target ? <Bot className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-cream/80">
            {target ? "Direct chat" : "Orchestrator"}
          </div>
          <div className="font-display text-lg font-bold tracking-tight">
            {target ? target.name : "Talk to all agents"}
          </div>
        </div>
        {target ? (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-lg border-2 border-ink bg-cream px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-ink shadow-brut"
          >
            <X className="h-3 w-3" />
            Exit agent
          </button>
        ) : (
          <button
            type="button"
            onClick={onPickAgent}
            className="inline-flex items-center gap-1 rounded-lg border-2 border-ink bg-cream px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-ink shadow-brut"
          >
            Pick agent
          </button>
        )}
      </div>

      {/* Transcript */}
      <div
        ref={scrollRef}
        className="max-h-[460px] min-h-[280px] overflow-y-auto bg-cream px-4 py-4"
      >
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-ink/70">
              {target
                ? `Ask ${target.name} anything — status, capabilities, recent work, who they hand off to.`
                : `Coordinate the whole agent crew from one place. Ask about status, hand off tasks, or just check the vibe.`}
            </p>
            <div className="flex flex-wrap gap-2">
              {prompts.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setInput(p)}
                  className="rounded-lg border-2 border-ink bg-cream px-3 py-1.5 text-xs font-semibold text-ink shadow-brut transition-pop hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-gold"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="space-y-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-xl border-2 border-ink px-3 py-2 text-sm shadow-brut ${
                  m.role === "user" ? "bg-ink text-cream" : "bg-gold/40 text-ink"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex justify-start">
              <div className="rounded-xl border-2 border-ink bg-cream px-3 py-2 text-sm font-mono uppercase tracking-wider text-ink/60 shadow-brut">
                {(target?.name ?? "Orchestrator")} is thinking…
              </div>
            </div>
          )}
        </div>
        {error && (
          <div className="mt-3 rounded-lg border-2 border-red-500 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t-2 border-ink bg-cream p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder={
              target
                ? `Message ${target.name}…`
                : "Ask the agent crew anything…"
            }
            rows={2}
            className="flex-1 resize-none rounded-xl border-2 border-ink bg-cream p-3 text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-coral"
          />
          <button
            type="button"
            onClick={send}
            disabled={busy || !input.trim()}
            className="inline-flex h-[60px] items-center gap-1.5 rounded-xl border-2 border-ink bg-coral px-4 font-bold uppercase tracking-wider text-cream shadow-brut transition-pop hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            <span className="hidden text-xs sm:inline">Send</span>
          </button>
        </div>
        <div className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-ink/40">
          Enter to send · Shift+Enter for newline
        </div>
      </div>
    </div>
  );
}
