import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Circle, Loader2, RefreshCw, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CHECKLIST,
  setChecklistItem,
  useAutoChecker,
  useChecklist,
} from "@/lib/launch-checklist";

export const Route = createFileRoute("/admin/launch")({
  head: () => ({
    meta: [
      { title: "Launch checklist — Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: LaunchChecklistPage,
});

function LaunchChecklistPage() {
  const state = useChecklist();
  const { running, run } = useAutoChecker();
  const completed = CHECKLIST.filter((i) => state[i.id]?.done).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Pre-launch
          </p>
          <h1 className="font-display text-3xl font-bold leading-tight flex items-center gap-2">
            <Rocket className="h-7 w-7" /> Launch checklist
          </h1>
          <p className="text-sm text-muted-foreground">
            {completed} of {CHECKLIST.length} complete · auto-detects when integrations come
            online.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => void run()} disabled={running}>
          {running ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="mr-1 h-3.5 w-3.5" />
          )}
          Re-check
        </Button>
      </header>

      <ul className="space-y-3">
        {CHECKLIST.map((item) => {
          const entry = state[item.id];
          const done = !!entry?.done;
          return (
            <li
              key={item.id}
              className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-card"
            >
              <button
                onClick={() => setChecklistItem(item.id, !done)}
                className="mt-0.5 shrink-0"
                aria-label={done ? "Mark incomplete" : "Mark complete"}
              >
                {done ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                ) : (
                  <Circle className="h-6 w-6 text-muted-foreground" />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h3 className="font-display text-base font-bold">{item.title}</h3>
                  {item.autoCheck ? (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      auto
                    </span>
                  ) : null}
                  {done && entry?.at ? (
                    <span className="text-xs text-muted-foreground">
                      ✓ {new Date(entry.at).toLocaleString()}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
