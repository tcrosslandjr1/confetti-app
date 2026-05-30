/**
 * WaitlistButton — "Notify Me" button that joins a venue waitlist.
 * Shows party size selector and optional preferred date/time.
 */

import { useState } from "react";
import { Bell, BellOff, Users, Check } from "lucide-react";
import { toast } from "sonner";

export function WaitlistButton({
  venueId,
  venueName,
  onJoin,
  onLeave,
  isOnWaitlist = false,
}: {
  venueId: string;
  venueName: string;
  onJoin?: (data: {
    venueId: string;
    partySize: number;
    preferredDate?: string;
    preferredTime?: string;
  }) => void;
  onLeave?: (venueId: string) => void;
  isOnWaitlist?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [partySize, setPartySize] = useState(2);
  const [joined, setJoined] = useState(isOnWaitlist);

  function handleJoin() {
    setJoined(true);
    setExpanded(false);
    onJoin?.({ venueId, partySize });
    toast.success(`You're on the waitlist for ${venueName}!`);
  }

  function handleLeave() {
    setJoined(false);
    onLeave?.(venueId);
    toast("Removed from waitlist");
  }

  if (joined) {
    return (
      <button
        type="button"
        onClick={handleLeave}
        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
      >
        <Check className="h-3.5 w-3.5" /> On waitlist
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-cream px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-cream shadow-brut transition hover:-translate-y-0.5"
      >
        <Bell className="h-3.5 w-3.5" /> Notify me
      </button>

      {expanded && (
        <div className="absolute right-0 top-full z-10 mt-2 flex flex-col gap-3 rounded-xl border-2 border-ink bg-white p-4 shadow-brut">
          <span className="font-display text-sm font-bold text-cream">Join waitlist</span>

          <div>
            <label className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-widest text-cream/60">
              Party size
            </label>
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-cream/40" />
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPartySize(n)}
                  className={`grid h-7 w-7 place-items-center rounded-full font-mono text-[11px] font-bold transition ${
                    partySize === n
                      ? "bg-ink text-cream"
                      : "border border-cream/15 text-cream/60 hover:border-ink/30"
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPartySize(Math.min(partySize + 1, 20))}
                className="grid h-7 w-7 place-items-center rounded-full border border-cream/15 font-mono text-[11px] font-bold text-cream/60 hover:border-ink/30"
              >
                {partySize > 6 ? partySize : "7+"}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleJoin}
            className="inline-flex items-center justify-center gap-1.5 rounded-full border-2 border-ink bg-coral px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-widest text-cream shadow-brut transition hover:-translate-y-0.5"
          >
            <Bell className="h-3.5 w-3.5" /> Join waitlist
          </button>
        </div>
      )}
    </div>
  );
}
