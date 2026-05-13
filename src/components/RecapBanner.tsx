import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, X } from "lucide-react";
import { findPendingRecap, type RecapItinerary } from "@/lib/recap";

const DISMISS_KEY = "confetti.recap.dismissed";

/**
 * Auto-surfaces a "rate last night" prompt the morning after a completed plan.
 * Renders nothing if there's no pending recap or the user already dismissed it.
 */
export function RecapBanner() {
  const [pending, setPending] = useState<RecapItinerary | null>(null);

  useEffect(() => {
    let alive = true;
    findPendingRecap()
      .then((r) => {
        if (!alive || !r) return;
        const dismissed =
          typeof window !== "undefined" ? localStorage.getItem(DISMISS_KEY) : null;
        if (dismissed === r.id) return;
        setPending(r);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!pending) return null;

  return (
    <div className="mx-auto mt-4 max-w-md px-4">
      <div className="relative flex items-center gap-3 rounded-2xl border-2 border-ink bg-gold p-3 shadow-brut">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-ink bg-cream">
          <Sparkles className="h-4 w-4 text-coral" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/70">
            Morning recap ready
          </div>
          <div className="truncate font-display text-sm font-extrabold text-ink">
            How was {pending.title}?
          </div>
        </div>
        <Link
          to="/recap/$itineraryId"
          params={{ itineraryId: pending.id }}
          className="inline-flex items-center rounded-full border-2 border-ink bg-coral px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-cream"
        >
          Rate
        </Link>
        <button
          aria-label="Dismiss"
          onClick={() => {
            localStorage.setItem(DISMISS_KEY, pending.id);
            setPending(null);
          }}
          className="ml-1 grid h-6 w-6 place-items-center rounded-full text-ink/60 hover:bg-ink/5"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
