/**
 * Agent Calendar — month grid + upcoming list for agent tasks & ticket due dates.
 * Admin-only (RLS-gated). Reads from agent_tasks.due_at and support_tickets.due_date.
 */

import { useEffect, useMemo, useState } from "react";
import {
  Calendar as CalendarIcon,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  List,
  Grid3x3,
  Plus,
  RefreshCw,
  Ticket,
  Bot,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// ── types ──────────────────────────────────────────────────

type DueItem = {
  id: string;
  source: "task" | "ticket";
  title: string;
  due: Date;
  status: string;
  priority?: string;
  meta?: string;
};

const priorityTone: Record<string, string> = {
  critical: "bg-red-500 text-cream",
  high: "bg-coral text-cream",
  medium: "bg-gold text-ink",
  low: "bg-ink/10 text-ink/60",
  urgent: "bg-red-500 text-cream",
  normal: "bg-gold text-ink",
};

const statusTone: Record<string, string> = {
  backlog: "bg-ink/20 text-ink",
  in_progress: "bg-blue-500/15 text-blue-700 border-blue-500/40",
  review: "bg-gold/30 text-ink",
  done: "bg-emerald-500/15 text-emerald-700 border-emerald-500/40",
  open: "bg-coral/20 text-coral",
  resolved: "bg-emerald-500/15 text-emerald-700",
  dismissed: "bg-ink/10 text-ink/50",
};

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function fmtDay(d: Date) {
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
function fmtTime(d: Date) {
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

// ── component ──────────────────────────────────────────────

export default function AgentCalendar() {
  const [items, setItems] = useState<DueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<Date>(startOfMonth(new Date()));
  const [view, setView] = useState<"month" | "list">("month");
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showNew, setShowNew] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [tasksRes, ticketsRes] = await Promise.all([
        supabase
          .from("agent_tasks")
          .select("id,title,status,priority,due_at,assigned_to")
          .not("due_at", "is", null),
        supabase
          .from("support_tickets")
          .select("id,summary,status,severity,due_date,target_email")
          .not("due_date", "is", null),
      ]);
      if (tasksRes.error) throw tasksRes.error;
      if (ticketsRes.error) throw ticketsRes.error;
      const merged: DueItem[] = [
        ...(tasksRes.data || []).map((t) => ({
          id: t.id,
          source: "task" as const,
          title: t.title,
          due: new Date(t.due_at as string),
          status: t.status,
          priority: t.priority,
          meta: t.assigned_to || undefined,
        })),
        ...(ticketsRes.data || []).map((t) => ({
          id: t.id,
          source: "ticket" as const,
          title: t.summary,
          due: new Date(t.due_date as string),
          status: t.status,
          priority: t.severity,
          meta: t.target_email || undefined,
        })),
      ].sort((a, b) => a.due.getTime() - b.due.getTime());
      setItems(merged);
    } catch (err) {
      console.error("Failed to load calendar:", err);
      toast.error("Failed to load due items", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  // grid for month view
  const gridDays = useMemo(() => {
    const first = startOfMonth(cursor);
    const startWeekday = first.getDay();
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor]);

  const itemsByDay = useMemo(() => {
    const map = new Map<string, DueItem[]>();
    for (const it of items) {
      const key = `${it.due.getFullYear()}-${it.due.getMonth()}-${it.due.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    return map;
  }, [items]);

  const upcoming = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const cutoff = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const upcoming = items.filter((i) => i.due >= now && i.due <= cutoff);
    const groups = new Map<string, DueItem[]>();
    for (const it of upcoming) {
      const k = it.due.toDateString();
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k)!.push(it);
    }
    return Array.from(groups.entries()).map(([k, arr]) => ({
      date: new Date(k),
      items: arr,
    }));
  }, [items]);

  const monthLabel = cursor.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border-2 border-ink bg-cream p-3 shadow-brut">
        <button
          type="button"
          onClick={() => setCursor(addMonths(cursor, -1))}
          className="grid h-8 w-8 place-items-center rounded-lg border-2 border-ink bg-cream text-ink transition-pop hover:-translate-x-0.5 hover:-translate-y-0.5"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setCursor(startOfMonth(new Date()))}
          className="rounded-lg border-2 border-ink bg-cream px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-ink"
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => setCursor(addMonths(cursor, 1))}
          className="grid h-8 w-8 place-items-center rounded-lg border-2 border-ink bg-cream text-ink transition-pop hover:-translate-x-0.5 hover:-translate-y-0.5"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <div className="ml-1 font-display text-lg font-bold tracking-tight text-ink">
          {monthLabel}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border-2 border-ink">
            <button
              type="button"
              onClick={() => setView("month")}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                view === "month" ? "bg-coral text-cream" : "bg-cream text-ink/70"
              }`}
            >
              <Grid3x3 className="h-3 w-3" /> Month
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={`inline-flex items-center gap-1.5 border-l-2 border-ink px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                view === "list" ? "bg-coral text-cream" : "bg-cream text-ink/70"
              }`}
            >
              <List className="h-3 w-3" /> Upcoming
            </button>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="grid h-8 w-8 place-items-center rounded-lg border-2 border-ink bg-cream text-ink"
            aria-label="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => setShowNew(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-ink bg-gold px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-ink shadow-brut transition-pop hover:-translate-x-0.5 hover:-translate-y-0.5"
          >
            <Plus className="h-3 w-3" /> New task
          </button>
        </div>
      </div>

      {view === "month" ? (
        <MonthGrid
          gridDays={gridDays}
          itemsByDay={itemsByDay}
          cursor={cursor}
          onPickDay={(d) => setSelectedDay(d)}
        />
      ) : (
        <UpcomingList groups={upcoming} />
      )}

      {items.length === 0 && !loading && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-ink/30 bg-cream p-12 text-ink/50">
          <CalendarDays className="h-8 w-8 opacity-30" />
          <p className="font-mono text-xs uppercase tracking-wider">
            No due dates yet — add a task or set a due date on a ticket
          </p>
        </div>
      )}

      {selectedDay && (
        <DayDetail
          day={selectedDay}
          items={items.filter((i) => sameDay(i.due, selectedDay))}
          onClose={() => setSelectedDay(null)}
        />
      )}

      {showNew && (
        <NewTaskModal
          onClose={() => setShowNew(false)}
          onCreated={() => {
            setShowNew(false);
            void load();
          }}
        />
      )}
    </div>
  );
}

// ── month grid ─────────────────────────────────────────────

function MonthGrid({
  gridDays,
  itemsByDay,
  cursor,
  onPickDay,
}: {
  gridDays: (Date | null)[];
  itemsByDay: Map<string, DueItem[]>;
  cursor: Date;
  onPickDay: (d: Date) => void;
}) {
  const today = new Date();
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return (
    <div className="overflow-hidden rounded-2xl border-2 border-ink bg-cream shadow-brut">
      <div className="grid grid-cols-7 border-b-2 border-ink bg-ink/5">
        {weekdays.map((w) => (
          <div
            key={w}
            className="px-2 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-ink/60"
          >
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {gridDays.map((d, i) => {
          if (!d) {
            return (
              <div
                key={`empty-${i}`}
                className="h-24 border-b border-r border-dashed border-ink/15 bg-ink/[0.02]"
              />
            );
          }
          const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
          const dayItems = itemsByDay.get(key) || [];
          const isToday = sameDay(d, today);
          const inMonth = d.getMonth() === cursor.getMonth();
          return (
            <button
              key={key}
              type="button"
              onClick={() => onPickDay(d)}
              className={`group flex h-24 flex-col items-stretch gap-1 border-b border-r border-dashed border-ink/15 p-1.5 text-left transition-colors hover:bg-ink/[0.03] ${
                inMonth ? "" : "bg-ink/[0.02] opacity-60"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`grid h-5 min-w-[1.25rem] place-items-center rounded-md px-1 font-mono text-[10px] font-bold ${
                    isToday ? "bg-coral text-cream" : "text-ink/70"
                  }`}
                >
                  {d.getDate()}
                </span>
                {dayItems.length > 0 && (
                  <span className="font-mono text-[9px] text-ink/40">
                    {dayItems.length}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-0.5 overflow-hidden">
                {dayItems.slice(0, 2).map((it) => (
                  <span
                    key={it.id}
                    className={`truncate rounded-sm border px-1 py-0.5 text-[10px] leading-tight ${
                      it.source === "ticket"
                        ? "border-coral/40 bg-coral/10 text-coral"
                        : "border-ink/20 bg-ink/5 text-ink"
                    }`}
                  >
                    {it.source === "ticket" ? "🎫 " : "•"} {it.title}
                  </span>
                ))}
                {dayItems.length > 2 && (
                  <span className="font-mono text-[9px] text-ink/40">
                    +{dayItems.length - 2} more
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── upcoming list ──────────────────────────────────────────

function UpcomingList({
  groups,
}: {
  groups: { date: Date; items: DueItem[] }[];
}) {
  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-ink/30 bg-cream p-12 text-ink/50">
        <CalendarIcon className="h-8 w-8 opacity-30" />
        <p className="font-mono text-xs uppercase tracking-wider">
          Nothing due in the next 14 days
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {groups.map((g) => (
        <div
          key={g.date.toISOString()}
          className="overflow-hidden rounded-2xl border-2 border-ink bg-cream shadow-brut"
        >
          <div className="flex items-center justify-between border-b-2 border-dashed border-ink/30 bg-ink/5 px-4 py-2">
            <span className="font-display text-sm font-bold text-ink">
              {fmtDay(g.date)}
            </span>
            <span className="font-mono text-[10px] text-ink/50">
              {g.items.length} item{g.items.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="divide-y-2 divide-dashed divide-ink/15">
            {g.items.map((it) => (
              <ItemRow key={it.id} item={it} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ItemRow({ item }: { item: DueItem }) {
  return (
    <div className="flex items-center gap-3 p-3">
      <span className="grid h-8 w-8 place-items-center rounded-lg border-2 border-ink bg-cream">
        {item.source === "ticket" ? (
          <Ticket className="h-4 w-4 text-coral" />
        ) : (
          <Bot className="h-4 w-4 text-ink" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-ink">{item.title}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px]">
          <span className="font-mono text-ink/50">{fmtTime(item.due)}</span>
          {item.priority && (
            <span
              className={`rounded-md px-1.5 py-0.5 font-mono font-bold uppercase tracking-wider ${
                priorityTone[item.priority] || "bg-ink/10 text-ink/60"
              }`}
            >
              {item.priority}
            </span>
          )}
          <span
            className={`rounded-md border px-1.5 py-0.5 font-mono font-bold uppercase tracking-wider ${
              statusTone[item.status] || "border-ink/20 bg-ink/5 text-ink/60"
            }`}
          >
            {item.status.replace("_", " ")}
          </span>
          {item.meta && (
            <span className="truncate font-mono text-ink/40">· {item.meta}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── day detail modal ───────────────────────────────────────

function DayDetail({
  day,
  items,
  onClose,
}: {
  day: Date;
  items: DueItem[];
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border-2 border-ink bg-cream shadow-brut"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b-2 border-ink bg-coral px-4 py-3 text-cream">
          <div className="font-display text-base font-bold">{fmtDay(day)}</div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-lg border-2 border-cream/70 text-cream"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto divide-y-2 divide-dashed divide-ink/15">
          {items.length === 0 ? (
            <div className="p-6 text-center font-mono text-xs uppercase tracking-wider text-ink/50">
              Nothing due
            </div>
          ) : (
            items.map((it) => <ItemRow key={it.id} item={it} />)
          )}
        </div>
      </div>
    </div>
  );
}

// ── new task modal ─────────────────────────────────────────

function NewTaskModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueAt) return;
    setBusy(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const { error } = await supabase.from("agent_tasks").insert({
        title: title.trim(),
        due_at: new Date(dueAt).toISOString(),
        priority,
        status: "backlog",
        created_by: userRes.user?.id || "admin",
      });
      if (error) throw error;
      toast.success("Task created");
      onCreated();
    } catch (err) {
      toast.error("Could not create task", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
    setBusy(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-md overflow-hidden rounded-2xl border-2 border-ink bg-cream shadow-brut"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b-2 border-ink bg-gold px-4 py-3 text-ink">
          <div className="font-display text-base font-bold">New agent task</div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-lg border-2 border-ink text-ink"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex flex-col gap-3 p-4">
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink/60">
              Title
            </span>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Investigate failed logins"
              className="rounded-lg border-2 border-ink bg-cream px-3 py-2 text-sm text-ink"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink/60">
              Due date
            </span>
            <input
              type="datetime-local"
              required
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              className="rounded-lg border-2 border-ink bg-cream px-3 py-2 text-sm text-ink"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink/60">
              Priority
            </span>
            <select
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value as "low" | "medium" | "high" | "critical")
              }
              className="rounded-lg border-2 border-ink bg-cream px-3 py-2 text-sm text-ink"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t-2 border-dashed border-ink/30 bg-ink/5 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border-2 border-ink bg-cream px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-ink"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg border-2 border-ink bg-coral px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-cream shadow-brut disabled:opacity-50"
          >
            {busy ? "Creating…" : "Create task"}
          </button>
        </div>
      </form>
    </div>
  );
}
