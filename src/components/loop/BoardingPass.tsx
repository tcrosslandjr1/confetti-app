import { Plane, Check, Wallet, Apple, ChevronRight, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useState } from "react";
import type { ActiveLoop, LoopStop } from "@/lib/loop-store";

export function BoardingPass({ loop }: { loop: ActiveLoop }) {
  const [googleLoading, setGoogleLoading] = useState(false);

  async function addToGoogleWallet() {
    setGoogleLoading(true);
    try {
      const res = await fetch("/api/public/wallet/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loopId: loop.id,
          passenger: loop.passenger,
          from: loop.from,
          to: loop.to,
          date: loop.date,
          gate: loop.gate,
          boardingTime: loop.boardingTime,
          stops: loop.stops.map((s) => ({
            id: s.id,
            name: s.name,
            type: s.type,
            time: s.time,
            area: s.area,
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 503) {
        toast("Google Wallet launching soon", {
          description: "We're finalizing our Wallet issuer setup before launch.",
        });
        return;
      }
      if (!res.ok) {
        toast.error(data.error || "Could not generate Google Wallet pass");
        return;
      }
      window.open(data.saveUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error("Network error talking to Wallet service");
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="relative rounded-3xl border-2 border-ink bg-cream shadow-brut-lg overflow-hidden">
        {/* Header */}
        <div className="bg-ink px-6 py-5 text-cream">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plane className="h-4 w-4 -rotate-45" />
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.25em]">
                Boarding Pass
              </span>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-widest opacity-70">
              {loop.id}
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between gap-3">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-widest opacity-60">
                Passenger
              </div>
              <div className="font-display text-lg font-bold uppercase tracking-wide">
                {loop.passenger}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[9px] uppercase tracking-widest opacity-60">
                Date · Party
              </div>
              <div className="font-display text-sm font-bold">
                {loop.date} · {loop.groupSize}
              </div>
            </div>
          </div>
        </div>

        {/* Route */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-display text-3xl font-extrabold leading-none tracking-tight">
                {loop.from}
              </div>
              <div className="mt-1 font-mono text-[9px] uppercase tracking-widest text-ink/50">
                Departure
              </div>
            </div>
            <div className="flex flex-1 items-center justify-center gap-1 px-2">
              <div className="h-px flex-1 border-t-2 border-dashed border-ink/30" />
              <Plane className="h-5 w-5 text-coral rotate-90" />
              <div className="h-px flex-1 border-t-2 border-dashed border-ink/30" />
            </div>
            <div className="text-right">
              <div className="font-display text-3xl font-extrabold leading-none tracking-tight">
                {loop.to}
              </div>
              <div className="mt-1 font-mono text-[9px] uppercase tracking-widest text-ink/50">
                Arrival
              </div>
            </div>
          </div>

          {/* Gate / Boarding / Seat */}
          <div className="mt-6 grid grid-cols-3 gap-3 rounded-2xl border-2 border-ink bg-gold/30 p-3">
            <Field label="Gate" value={loop.gate} />
            <Field label="Boarding" value={loop.boardingTime} />
            <Field label="Seat" value={`${loop.groupSize}P`} />
          </div>
        </div>

        {/* Perforation */}
        <div className="relative">
          <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-background border-2 border-ink" />
          <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-background border-2 border-ink" />
          <div className="border-t-2 border-dashed border-ink/40 mx-6" />
        </div>

        {/* Itinerary timeline */}
        <div className="px-6 py-5">
          <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60 mb-3">
            Itinerary · {loop.stops.length} stops
          </div>
          <ol className="relative space-y-3 pl-7">
            <span className="absolute left-2.5 top-2 bottom-2 w-px border-l-2 border-dashed border-ink/30" />
            {loop.stops.map((s, i) => (
              <li key={s.id} className="relative">
                <span
                  className={`absolute -left-7 top-0 grid h-6 w-6 place-items-center rounded-full border-2 border-ink ${s.done ? "bg-coral text-cream" : "bg-cream"}`}
                >
                  {s.done ? (
                    <Check className="h-3 w-3" strokeWidth={3} />
                  ) : (
                    <span className="font-mono text-[10px] font-bold">{i + 1}</span>
                  )}
                </span>
                <StopRow stop={s} />
              </li>
            ))}
          </ol>
        </div>

        {/* Barcode */}
        <div className="px-6 pb-5">
          <div className="rounded-xl border-2 border-ink bg-cream p-3">
            <div className="flex h-12 items-center gap-[2px]">
              {Array.from({ length: 60 }).map((_, i) => (
                <span
                  key={i}
                  className="bg-ink"
                  style={{ width: i % 3 === 0 ? 3 : i % 5 === 0 ? 4 : 1, height: "100%" }}
                />
              ))}
            </div>
            <div className="mt-2 text-center font-mono text-[10px] tracking-[0.3em] text-ink/60">
              {loop.id} · CONFETTI
            </div>
          </div>
        </div>
      </div>

      {/* Wallet buttons */}
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <button
          onClick={() => toast.success("Apple Wallet pass coming soon")}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-ink px-4 py-3 text-sm font-bold text-cream shadow-brut transition-pop hover:-translate-y-0.5"
        >
          <Apple className="h-4 w-4" /> Add to Apple Wallet
        </button>
        <button
          onClick={addToGoogleWallet}
          disabled={googleLoading}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-cream px-4 py-3 text-sm font-bold text-ink shadow-brut transition-pop hover:-translate-y-0.5 disabled:opacity-60"
        >
          {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
          Add to Google Wallet
        </button>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[9px] font-bold uppercase tracking-widest text-ink/60">
        {label}
      </div>
      <div className="mt-0.5 font-display text-base font-extrabold tracking-tight">{value}</div>
    </div>
  );
}

function StopRow({ stop }: { stop: LoopStop }) {
  const inner = (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-ink/15 bg-card p-3 transition-pop group-hover:-translate-y-0.5 group-hover:border-ink/40 group-hover:shadow-pop">
      <div className="min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <div className="font-display text-sm font-bold truncate">{stop.name}</div>
          <span className="font-mono text-[10px] font-bold text-ink/60 shrink-0">{stop.time}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {stop.type}
          {stop.area ? ` · ${stop.area}` : ""}
        </div>
      </div>
      {stop.venueId && <ChevronRight className="h-4 w-4 text-ink/40 shrink-0" />}
    </div>
  );
  if (!stop.venueId) return inner;
  return (
    <Link to="/venue/$id" params={{ id: stop.venueId }} className="group block focus:outline-none">
      {inner}
    </Link>
  );
}
