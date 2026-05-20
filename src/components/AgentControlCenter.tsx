/**
 * Agent Control Center — Full admin page
 *
 * Shows all 33 agents organized into 6 functional teams with:
 *  - Team cards with agent status indicators
 *  - Live comms feed (agent-to-agent messages)
 *  - Kanban task board (backlog → in progress → review → done)
 *  - KPI bar (total, active, idle, errors)
 */

import { useEffect, useState, useCallback } from "react";
import {
  ArrowLeft,
  Bot,
  ChevronDown,
  ChevronRight,
  Circle,
  MessageSquare,
  Columns3,
  RefreshCw,
  Zap,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Send,
  ArrowRightLeft,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
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

// ═══════════════════════════════════════════════════════════
// Status helpers
// ═══════════════════════════════════════════════════════════

const statusColor: Record<string, string> = {
  active: "#10b981",
  idle: "#94a3b8",
  error: "#ef4444",
  disabled: "#475569",
};

const statusLabel: Record<string, string> = {
  active: "Active",
  idle: "Idle",
  error: "Error",
  disabled: "Off",
};

const priorityColor: Record<string, string> = {
  critical: "#ef4444",
  high: "#f59e0b",
  medium: "#3b82f6",
  low: "#94a3b8",
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

// ═══════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════

export default function AgentControlCenter() {
  const [view, setView] = useState<ControlCenterView | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"teams" | "feed" | "board">("teams");
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getControlCenterView();
      setView(data);
    } catch (err) {
      console.error("Failed to load control center:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSeedDemo = async () => {
    await seedControlCenterDemo();
    await loadData();
  };

  if (loading || !view) {
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <Link to="/admin" style={styles.backBtn}><ArrowLeft size={20} /></Link>
          <div>
            <div style={styles.eyebrow}>Admin</div>
            <h1 style={styles.title}>Agent Control Center</h1>
          </div>
        </div>
        <div style={styles.loadingBox}>
          <RefreshCw size={24} style={{ animation: "spin 1s linear infinite" }} />
          <span>Loading agents...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <Link to="/admin" style={styles.backBtn}><ArrowLeft size={20} /></Link>
        <div style={{ flex: 1 }}>
          <div style={styles.eyebrow}>Admin</div>
          <h1 style={styles.title}>Agent Control Center</h1>
        </div>
        <button onClick={loadData} style={styles.refreshBtn} title="Refresh">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* KPI Bar */}
      <div style={styles.kpiGrid}>
        <div style={styles.kpi}>
          <Bot size={18} style={{ color: "#8b5cf6" }} />
          <b>{view.totalAgents}</b>
          <span>Total</span>
        </div>
        <div style={styles.kpi}>
          <Zap size={18} style={{ color: "#10b981" }} />
          <b>{view.activeAgents}</b>
          <span>Active</span>
        </div>
        <div style={styles.kpi}>
          <Clock size={18} style={{ color: "#94a3b8" }} />
          <b>{view.totalAgents - view.activeAgents - view.errorAgents}</b>
          <span>Idle</span>
        </div>
        <div style={styles.kpi}>
          <AlertTriangle size={18} style={{ color: "#ef4444" }} />
          <b>{view.errorAgents}</b>
          <span>Errors</span>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={styles.tabBar}>
        {([
          ["teams", "Teams", Bot],
          ["feed", "Live Feed", MessageSquare],
          ["board", "Task Board", Columns3],
        ] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            style={{
              ...styles.tabBtn,
              ...(tab === key ? styles.tabBtnActive : {}),
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={styles.content}>
        {tab === "teams" && (
          <TeamsView
            teams={view.teams}
            expandedTeam={expandedTeam}
            onToggle={(id) => setExpandedTeam(expandedTeam === id ? null : id)}
          />
        )}
        {tab === "feed" && <FeedView messages={view.recentMessages} />}
        {tab === "board" && <BoardView board={view.taskBoard} />}
      </div>

      {/* Seed Demo Button (dev only) */}
      {view.totalAgents === 0 || view.recentMessages.length === 0 ? (
        <div style={styles.seedBox}>
          <button onClick={handleSeedDemo} style={styles.seedBtn}>
            <Zap size={14} /> Load Demo Data
          </button>
        </div>
      ) : null}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Teams View
// ═══════════════════════════════════════════════════════════

function TeamsView({
  teams,
  expandedTeam,
  onToggle,
}: {
  teams: AgentTeam[];
  expandedTeam: string | null;
  onToggle: (id: string) => void;
}) {
  return (
    <div style={styles.teamsList}>
      {teams.map((team) => {
        const isOpen = expandedTeam === team.id;
        const activeCount = team.agents.filter((a) => a.status === "active").length;
        const errorCount = team.agents.filter((a) => a.status === "error").length;

        return (
          <div key={team.id} style={styles.teamCard}>
            <button onClick={() => onToggle(team.id)} style={styles.teamHeader}>
              <span style={{ ...styles.teamIcon, background: `${team.color}18` }}>
                {team.icon}
              </span>
              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={styles.teamName}>{team.name}</div>
                <div style={styles.teamMeta}>
                  {team.agents.length} agents
                  {activeCount > 0 && <span style={{ color: "#10b981" }}> · {activeCount} active</span>}
                  {errorCount > 0 && <span style={{ color: "#ef4444" }}> · {errorCount} error</span>}
                </div>
              </div>
              {isOpen ? <ChevronDown size={16} style={{ opacity: 0.4 }} /> : <ChevronRight size={16} style={{ opacity: 0.4 }} />}
            </button>

            {isOpen && (
              <div style={styles.agentList}>
                {team.agents.map((agent) => (
                  <AgentRow key={agent.id} agent={agent} teamColor={team.color} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AgentRow({ agent, teamColor }: { agent: AgentRecord; teamColor: string }) {
  return (
    <div style={styles.agentRow}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Circle
          size={8}
          fill={statusColor[agent.status]}
          stroke="none"
        />
        <div>
          <div style={styles.agentName}>{agent.name}</div>
          <div style={styles.agentDesc}>{agent.description}</div>
        </div>
      </div>
      <div style={styles.agentMeta}>
        <span style={{
          ...styles.statusBadge,
          background: `${statusColor[agent.status]}15`,
          color: statusColor[agent.status],
        }}>
          {statusLabel[agent.status]}
        </span>
        <span style={styles.layerBadge}>
          {agent.layer === "backend" ? "⚡ Backend" : "🖥 Frontend"}
        </span>
      </div>
      {agent.last_task && (
        <div style={styles.lastTask}>
          <Clock size={10} style={{ opacity: 0.4 }} />
          <span>{agent.last_task}</span>
          <span style={{ opacity: 0.4, fontSize: 10 }}>{timeAgo(agent.last_active)}</span>
        </div>
      )}
      {agent.tasks_completed > 0 && (
        <div style={styles.taskCount}>
          <CheckCircle2 size={10} style={{ color: "#10b981" }} />
          {agent.tasks_completed} tasks completed
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Live Feed View
// ═══════════════════════════════════════════════════════════

function FeedView({ messages }: { messages: AgentMessage[] }) {
  if (messages.length === 0) {
    return (
      <div style={styles.emptyState}>
        <MessageSquare size={32} style={{ opacity: 0.2 }} />
        <p>No agent messages yet</p>
      </div>
    );
  }

  return (
    <div style={styles.feedList}>
      {messages.map((msg) => (
        <div key={msg.id} style={styles.feedItem}>
          <div style={styles.feedHeader}>
            <span style={styles.feedIcon}>{msgTypeIcon[msg.msg_type] || "·"}</span>
            <span style={styles.feedFrom}>{msg.from_name || msg.from_agent}</span>
            {(msg.to_name || msg.to_agent) && (
              <>
                <ArrowRightLeft size={10} style={{ opacity: 0.3 }} />
                <span style={styles.feedTo}>{msg.to_name || msg.to_agent}</span>
              </>
            )}
            {msg.team_name && (
              <>
                <Send size={10} style={{ opacity: 0.3 }} />
                <span style={styles.feedTo}>{msg.team_name}</span>
              </>
            )}
            <span style={styles.feedTime}>{timeAgo(msg.created_at)}</span>
          </div>
          <div style={styles.feedSubject}>{msg.subject}</div>
          {msg.body && <div style={styles.feedBody}>{msg.body}</div>}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Task Board View (Kanban)
// ═══════════════════════════════════════════════════════════

function BoardView({ board }: { board: ControlCenterView["taskBoard"] }) {
  const columns: { key: TaskStatus; label: string; color: string }[] = [
    { key: "backlog", label: "Backlog", color: "#94a3b8" },
    { key: "in_progress", label: "In Progress", color: "#3b82f6" },
    { key: "review", label: "Review", color: "#f59e0b" },
    { key: "done", label: "Done", color: "#10b981" },
  ];

  const isEmpty = Object.values(board).every((col) => col.length === 0);
  if (isEmpty) {
    return (
      <div style={styles.emptyState}>
        <Columns3 size={32} style={{ opacity: 0.2 }} />
        <p>No agent tasks yet</p>
      </div>
    );
  }

  return (
    <div style={styles.boardScroll}>
      <div style={styles.boardGrid}>
        {columns.map((col) => (
          <div key={col.key} style={styles.boardCol}>
            <div style={styles.colHeader}>
              <Circle size={8} fill={col.color} stroke="none" />
              <span>{col.label}</span>
              <span style={styles.colCount}>{board[col.key].length}</span>
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
    <div style={styles.taskCard}>
      <div style={styles.taskTitle}>{task.title}</div>
      {task.description && (
        <div style={styles.taskDesc}>{task.description}</div>
      )}
      <div style={styles.taskFooter}>
        <span style={{
          ...styles.priorityDot,
          background: priorityColor[task.priority],
        }}>
          {task.priority}
        </span>
        {task.assigned_name && (
          <span style={styles.taskAssignee}>
            <Bot size={10} /> {task.assigned_name}
          </span>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Styles (inline, matching your existing admin pattern)
// ═══════════════════════════════════════════════════════════

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#0a0a0f",
    color: "#e2e8f0",
    paddingBottom: 80,
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "16px 20px 8px",
  },
  backBtn: {
    color: "#e2e8f0",
    display: "flex",
    alignItems: "center",
    textDecoration: "none",
  },
  eyebrow: {
    fontSize: 11,
    textTransform: "uppercase" as const,
    letterSpacing: 1.2,
    color: "#8b5cf6",
    fontWeight: 600,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    margin: 0,
    background: "linear-gradient(135deg, #c084fc, #818cf8)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  refreshBtn: {
    background: "rgba(255,255,255,0.06)",
    border: "none",
    borderRadius: 8,
    padding: 8,
    color: "#94a3b8",
    cursor: "pointer",
  },
  loadingBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 60,
    color: "#64748b",
    fontSize: 14,
  },

  // KPI
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 8,
    padding: "12px 20px",
  },
  kpi: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 2,
    padding: "12px 8px",
    borderRadius: 12,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    fontSize: 11,
    color: "#94a3b8",
  },

  // Tabs
  tabBar: {
    display: "flex",
    gap: 4,
    padding: "4px 20px 12px",
  },
  tabBtn: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "10px 0",
    border: "none",
    borderRadius: 10,
    background: "rgba(255,255,255,0.04)",
    color: "#64748b",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  tabBtnActive: {
    background: "rgba(139,92,246,0.15)",
    color: "#c084fc",
  },

  content: {
    padding: "0 16px",
  },

  // Teams
  teamsList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
  },
  teamCard: {
    borderRadius: 14,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    overflow: "hidden",
  },
  teamHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: "100%",
    padding: "14px 16px",
    border: "none",
    background: "none",
    color: "#e2e8f0",
    cursor: "pointer",
    textAlign: "left" as const,
  },
  teamIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
  },
  teamName: {
    fontSize: 14,
    fontWeight: 600,
  },
  teamMeta: {
    fontSize: 11,
    color: "#64748b",
  },

  // Agent rows
  agentList: {
    borderTop: "1px solid rgba(255,255,255,0.04)",
    padding: "4px 0",
  },
  agentRow: {
    padding: "10px 16px 10px 64px",
    borderBottom: "1px solid rgba(255,255,255,0.02)",
  },
  agentName: {
    fontSize: 13,
    fontWeight: 600,
  },
  agentDesc: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 1,
  },
  agentMeta: {
    display: "flex",
    gap: 6,
    marginTop: 6,
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: 6,
  },
  layerBadge: {
    fontSize: 10,
    fontWeight: 500,
    padding: "2px 8px",
    borderRadius: 6,
    background: "rgba(255,255,255,0.04)",
    color: "#94a3b8",
  },
  lastTask: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    fontSize: 11,
    color: "#94a3b8",
  },
  taskCount: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    fontSize: 10,
    color: "#64748b",
  },

  // Feed
  feedList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 4,
  },
  feedItem: {
    padding: "12px 14px",
    borderRadius: 12,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  feedHeader: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap" as const,
    fontSize: 11,
    marginBottom: 4,
  },
  feedIcon: {
    fontSize: 12,
    opacity: 0.5,
  },
  feedFrom: {
    fontWeight: 600,
    color: "#c084fc",
  },
  feedTo: {
    fontWeight: 600,
    color: "#818cf8",
  },
  feedTime: {
    marginLeft: "auto",
    fontSize: 10,
    color: "#475569",
  },
  feedSubject: {
    fontSize: 13,
    fontWeight: 500,
  },
  feedBody: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 4,
    lineHeight: 1.4,
  },

  // Board
  boardScroll: {
    overflowX: "auto" as const,
    paddingBottom: 12,
  },
  boardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(200px, 1fr))",
    gap: 8,
    minWidth: 700,
  },
  boardCol: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
  },
  colHeader: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    fontWeight: 600,
    padding: "8px 10px",
    borderRadius: 8,
    background: "rgba(255,255,255,0.03)",
  },
  colCount: {
    marginLeft: "auto",
    fontSize: 10,
    color: "#64748b",
    background: "rgba(255,255,255,0.06)",
    borderRadius: 4,
    padding: "1px 6px",
  },
  taskCard: {
    padding: "10px 12px",
    borderRadius: 10,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  taskTitle: {
    fontSize: 12,
    fontWeight: 600,
    lineHeight: 1.3,
  },
  taskDesc: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 4,
  },
  taskFooter: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  priorityDot: {
    fontSize: 9,
    fontWeight: 700,
    textTransform: "uppercase" as const,
    padding: "2px 6px",
    borderRadius: 4,
    color: "#fff",
  },
  taskAssignee: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    fontSize: 10,
    color: "#94a3b8",
    marginLeft: "auto",
  },

  // Empty & seed
  emptyState: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 8,
    padding: 40,
    color: "#475569",
    fontSize: 13,
  },
  seedBox: {
    display: "flex",
    justifyContent: "center",
    padding: 20,
  },
  seedBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "10px 20px",
    borderRadius: 10,
    border: "1px solid rgba(139,92,246,0.3)",
    background: "rgba(139,92,246,0.1)",
    color: "#c084fc",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
};
