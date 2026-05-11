import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Circle, Loader2, RefreshCw, Rocket } from "lucide-react";
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
  const pct = Math.round((completed / CHECKLIST.length) * 100);

  return (
    <div className="space-y-8 text-ink">
      {/* Header — brutalist eyebrow + display headline like landing */}
      <header className="rounded-2xl border-2 border-ink bg-cream p-6 shadow-brut-lg">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-ink/60">
              / pre-launch
            </span>
            <h1 className="mt-2 font-display text-5xl font-extrabold leading-[0.9] tracking-tight sm:text-6xl">
              Launch <span className="font-serif italic font-normal text-coral">checklist.</span>
            </h1>
            <p className="mt-3 max-w-xl text-base leading-snug">
              <span className="font-display font-extrabold">{completed}</span> of{" "}
              <span className="font-display font-extrabold">{CHECKLIST.length}</span> ready ·{" "}
              <span className="font-serif italic">auto-detects when integrations come online.</span>
            </p>
          </div>
          <button
            onClick={() => void run()}
            disabled={running}
            className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-ink bg-ink px-5 text-sm font-bold uppercase tracking-wider text-cream shadow-brut transition-pop hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brut-lg disabled:opacity-60"
          >
            {running ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Re-check
          </button>
        </div>

        {/* progress bar */}
        <div className="mt-6 flex items-center gap-3">
          <div className="relative h-3 flex-1 overflow-hidden rounded-full border-2 border-ink bg-background">
            <div
              className="h-full bg-coral transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="font-mono text-[11px] font-bold uppercase tracking-widest">
            {pct}%
          </span>
          <Rocket className="h-5 w-5 text-coral" />
        </div>
      </header>

      {/* Checklist as receipt-style cards */}
      <ul className="space-y-4">
        {CHECKLIST.map((item, i) => {
          const entry = state[item.id];
          const done = !!entry?.done;
          const accent =
            i % 3 === 0 ? "bg-coral" : i % 3 === 1 ? "bg-gold" : "bg-purple";
          return (
            <li
              key={item.id}
              className="group flex items-start gap-4 rounded-2xl border-2 border-ink bg-cream p-5 shadow-brut transition-pop hover:-translate-y-1 hover:shadow-brut-lg"
            >
              <button
                onClick={() => setChecklistItem(item.id, !done)}
                aria-label={done ? "Mark incomplete" : "Mark complete"}
                className={`grid h-12 w-12 shrink-0 place-items-center rounded-lg border-2 border-ink ${
                  done ? "bg-coral text-cream" : "bg-background"
                } shadow-brut transition-pop hover:-translate-y-0.5`}
              >
                {done ? (
                  <CheckCircle2 className="h-6 w-6" />
                ) : (
                  <Circle className="h-6 w-6 text-ink/40" />
                )}
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`font-mono text-[10px] font-bold uppercase tracking-widest ${accent === "bg-gold" ? "text-ink" : "text-cream"} rounded-full border-2 border-ink ${accent} px-2 py-0.5`}
                  >
                    step {String(i + 1).padStart(2, "0")}
                  </span>
                  {item.autoCheck ? (
                    <span className="rounded-full border-2 border-ink bg-background px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest">
                      auto
                    </span>
                  ) : null}
                  {done ? (
                    <span className="rounded-full bg-ink px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-cream">
                      booked ✓
                    </span>
                  ) : null}
                </div>

                <h3 className="mt-2 font-display text-xl font-extrabold leading-tight">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm leading-snug text-ink/70">
                  {item.description}
                </p>

                {done && entry?.at ? (
                  <p className="mt-2 font-mono text-[11px] uppercase tracking-widest text-ink/50">
                    ✓ {new Date(entry.at).toLocaleString()}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
