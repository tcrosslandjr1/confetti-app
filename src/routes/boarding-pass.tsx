import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { getActiveLoop, subscribeActiveLoop, type ActiveLoop } from "@/lib/loop-store";
import { BoardingPass } from "@/components/loop/BoardingPass";
import { ConciergeChat } from "@/components/loop/ConciergeChat";
import { MobileHeader, BottomNav } from "@/components/AppShell";
import { usePageview } from "@/lib/analytics";

export const Route = createFileRoute("/boarding-pass")({
  component: BoardingPassPage,
});

function BoardingPassPage() {
  usePageview("boarding_pass", "/boarding-pass");
  const [loop, setLoop] = useState<ActiveLoop | null>(() => getActiveLoop());

  useEffect(() => {
    // Re-read on mount in case it changed between render and effect
    setLoop(getActiveLoop());
    return subscribeActiveLoop(() => setLoop(getActiveLoop()));
  }, []);

  if (!loop) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-bold tracking-tight">No active plan</h1>
        <p className="text-muted-foreground">
          Build a night first, then come back to see your boarding pass.
        </p>
        <Link
          to="/app/plan"
          className="mt-2 inline-flex h-10 items-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105"
        >
          Plan my night
        </Link>
      </div>
    );
  }

  return (
    <div className="relative mx-auto min-h-screen w-full max-w-md bg-mocha-dark pb-24">
      <MobileHeader
        eyebrow="Boarding Pass"
        title={loop.experienceName || loop.to || "Your Night"}
        left={
          <Link to="/app" className="grid size-9 place-items-center rounded-full bg-muted">
            <ArrowLeft className="size-4" />
          </Link>
        }
      />
      <div className="px-4">
        <BoardingPass loop={loop} />
      </div>
      <BottomNav />
      <ConciergeChat />
    </div>
  );
}
