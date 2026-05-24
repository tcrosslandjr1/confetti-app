import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { getActiveHangout, subscribeActiveHangout, type ActiveHangout } from "@/lib/hangout-store";
import { HangoutPass } from "@/components/hangout/HangoutPass";

export const Route = createFileRoute("/hangout")({
  component: HangoutPage,
});

function HangoutPage() {
  const [hangout, setHangout] = useState<ActiveHangout | null>(null);

  useEffect(() => {
    setHangout(getActiveHangout());
    return subscribeActiveHangout(() => setHangout(getActiveHangout()));
  }, []);

  if (!hangout) {
    return (
      <div className="grid min-h-[60vh] place-items-center px-4">
        <div className="rounded-2xl border-2 border-dashed border-ink/20 bg-cream/40 px-8 py-12 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-ink/30" />
          <p className="mt-3 font-display text-lg font-bold">No hangout planned</p>
          <p className="mt-1 text-sm text-ink/60">
            Build one from the planner — crabs, game night, picnic, anything.
          </p>
          <Link
            to="/app/plan"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-coral px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-widest text-cream shadow-brut hover:-translate-y-0.5 transition-pop"
          >
            Plan a hangout
          </Link>
        </div>
      </div>
    );
  }

  return <HangoutPass hangout={hangout} />;
}
