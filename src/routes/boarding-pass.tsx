import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Play } from "lucide-react";
import { BoardingPass } from "@/components/loop/BoardingPass";
import { getActiveLoop, makeDemoLoop, setActiveLoop, type ActiveLoop } from "@/lib/loop-store";

export const Route = createFileRoute("/boarding-pass")({
  head: () => ({ meta: [{ title: "Boarding Pass — Confetti" }] }),
  component: BoardingPassPage,
});

function BoardingPassPage() {
  const [loop, setLoop] = useState<ActiveLoop | null>(null);
  useEffect(() => {
    const existing = getActiveLoop();
    if (existing) setLoop(existing);
    else {
      const demo = makeDemoLoop();
      setActiveLoop(demo);
      setLoop(demo);
    }
  }, []);

  if (!loop)
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Loading…
      </div>
    );

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="mx-auto max-w-md px-4 pt-6">
        <Link
          to="/portal"
          className="inline-flex items-center gap-1 font-mono text-xs font-bold uppercase tracking-widest text-ink/70 hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>
        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight">
          Your plan is ready
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Show this at each stop. Earn Confetti as you go.
        </p>
      </div>
      <div className="mt-6 px-4">
        <BoardingPass loop={loop} />
        <div className="mx-auto mt-5 max-w-md">
          <Link
            to="/active-loop"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-coral px-4 py-3 font-display text-sm font-bold uppercase tracking-wide text-cream shadow-brut transition-pop hover:-translate-y-0.5"
          >
            <Play className="h-4 w-4" /> Start the Plan
          </Link>
        </div>
      </div>
    </div>
  );
}
