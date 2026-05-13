import { useEffect, useState } from "react";
import { Shield, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import {
  getPickAnalyticsConsent,
  setPickAnalyticsConsent,
  subscribePickAnalyticsConsent,
  type PickAnalyticsConsent,
} from "@/lib/pick-analytics";

/**
 * Privacy consent toggle for the "Why this pick" analytics pipeline.
 * Opt-out disables tracking AND wipes any locally stored pick events.
 */
export function PickAnalyticsToggle({ className = "" }: { className?: string }) {
  const [consent, setConsent] = useState<PickAnalyticsConsent>("granted");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setConsent(getPickAnalyticsConsent());
    setHydrated(true);
    return subscribePickAnalyticsConsent(setConsent);
  }, []);

  function toggle() {
    const next: PickAnalyticsConsent = consent === "granted" ? "denied" : "granted";
    setPickAnalyticsConsent(next);
    setConsent(next);
    toast.success(
      next === "granted"
        ? "Pick analytics enabled — helping us improve recommendations."
        : "Pick analytics disabled — local history cleared.",
    );
  }

  const granted = consent === "granted";

  return (
    <div
      className={`flex items-start justify-between gap-4 rounded-2xl border-2 border-ink bg-card p-4 shadow-brut ${className}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {granted ? (
            <Shield className="h-4 w-4 text-coral" />
          ) : (
            <ShieldOff className="h-4 w-4 text-ink/50" />
          )}
          <h3 className="font-display text-sm font-bold">Pick analytics</h3>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Tracks which trust signals (trending, most-booked, most-saved) lead you to tap a
          pick. Stored locally in your browser, never sold. Turn off to disable tracking and
          clear stored events.
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={granted}
        aria-label="Toggle pick analytics tracking"
        onClick={toggle}
        disabled={!hydrated}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border-2 border-ink transition-colors ${
          granted ? "bg-coral" : "bg-cream"
        } disabled:opacity-50`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full border-2 border-ink bg-cream transition-transform ${
            granted ? "translate-x-6" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
