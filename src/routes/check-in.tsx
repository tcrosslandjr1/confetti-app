import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Sparkles, Ticket, AlertTriangle } from "lucide-react";
import { checkInStop, getActiveLoop, type CheckInResult } from "@/lib/loop-store";
import { logActivity } from "@/lib/activity-log";
import { recordCheckInAttribution } from "@/lib/attribution";

export const Route = createFileRoute("/check-in")({
  head: () => ({
    meta: [{ title: "Check in — Confetti" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    loop: typeof s.loop === "string" ? s.loop : undefined,
    stop: typeof s.stop === "string" ? s.stop : undefined,
  }),
  component: CheckInPage,
});

function CheckInPage() {
  const { loop: loopParam, stop: stopParam } = useSearch({ from: "/check-in" });
  const [state, setState] = useState<
    | { status: "idle" }
    | { status: "missing"; reason: string }
    | { status: "ok"; result: CheckInResult }
  >({ status: "idle" });

  useEffect(() => {
    if (!loopParam || !stopParam) {
      setState({ status: "missing", reason: "Missing plan or stop in the link." });
      return;
    }
    const active = getActiveLoop();
    if (!active || active.id !== loopParam) {
      setState({
        status: "missing",
        reason: "We can't find this trip on this device. Open the link on the guest's phone.",
      });
      return;
    }
    const result = checkInStop(stopParam);
    if (!result) {
      setState({ status: "missing", reason: "That stop isn't on this trip." });
      return;
    }
    if (!result.alreadyAwarded) {
      logActivity({
        tripId: result.loop.id,
        actor: "Scanner",
        kind: "check_in",
        message: `Checked in at ${result.stop.name}`,
        detail: `+${result.awarded} Confetti`,
      });
      // Fire-and-forget attribution — writes to attribution_events and
      // triggers venue_quality_scores recompute so recommendations improve.
      void recordCheckInAttribution({
        itineraryId: result.loop.id,
        stopId: result.stop.id,
        venueId: result.stop.venueId ?? result.stop.id,
        venueName: result.stop.name,
        cityCode: result.loop.city ?? undefined,
      });
    }
    setState({ status: "ok", result });
  }, [loopParam, stopParam]);

  return (
    <main className="min-h-screen bg-cream text-ink grid place-items-center p-6">
      <div className="w-full max-w-md rounded-3xl border-2 border-ink bg-cream p-6 shadow-brut-lg">
        {state.status === "idle" && (
          <p className="font-mono text-xs uppercase tracking-widest text-cream/60">
            Verifying check-in…
          </p>
        )}

        {state.status === "missing" && (
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-gold px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest">
              <AlertTriangle className="h-3 w-3" /> Can't check in
            </span>
            <h1 className="font-display text-3xl font-extrabold leading-tight">
              Hmm — <span className="font-serif italic font-normal text-coral">no match.</span>
            </h1>
            <p className="text-sm text-cream/70">{state.reason}</p>
            <Link
              to="/"
              className="mt-2 inline-flex items-center gap-2 rounded-full border-2 border-ink bg-ink px-4 py-2 text-sm font-bold text-cream shadow-brut transition-pop hover:-translate-y-0.5"
            >
              Back to Confetti
            </Link>
          </div>
        )}

        {state.status === "ok" && (
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-coral px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-cream">
              <Ticket className="h-3 w-3" /> {state.result.loop.id}
            </span>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-1 h-10 w-10 shrink-0 text-emerald-600" />
              <div>
                <h1 className="font-display text-3xl font-extrabold leading-tight">
                  {state.result.alreadyAwarded ? (
                    <>
                      You're{" "}
                      <span className="font-serif italic font-normal text-coral">already</span> in.
                    </>
                  ) : (
                    <>
                      You're <span className="font-serif italic font-normal text-coral">in.</span>
                    </>
                  )}
                </h1>
                <p className="mt-1 text-sm text-cream/70">
                  Stop · <span className="font-bold">{state.result.stop.name}</span>
                  {state.result.stop.area ? ` · ${state.result.stop.area}` : ""}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border-2 border-ink bg-background p-4">
              <div className="font-mono text-[10px] uppercase tracking-widest text-cream/60">
                Confetti reward
              </div>
              <div className="mt-1 flex items-center gap-2 font-display text-3xl font-extrabold">
                <Sparkles className="h-6 w-6 text-coral" />
                {state.result.alreadyAwarded ? "0" : `+${state.result.awarded}`}
              </div>
              {state.result.alreadyAwarded && (
                <p className="mt-1 text-xs text-cream/60">
                  Already awarded earlier — no double-dipping 🎉
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                to="/app/plan"
                className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-coral px-4 py-2 text-sm font-bold text-cream shadow-brut transition-pop hover:-translate-y-0.5"
              >
                Back to boarding pass
              </Link>
              <Link
                to="/app/profile"
                className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-cream px-4 py-2 text-sm font-bold shadow-brut transition-pop hover:-translate-y-0.5 hover:bg-gold"
              >
                See my Confetti
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
