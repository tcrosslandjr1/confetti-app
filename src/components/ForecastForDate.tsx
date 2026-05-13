import { Loader2, CloudOff, Droplets } from "lucide-react";
import { describeWeather, useWeather } from "@/lib/weather";

interface Props {
  city: string;
  date: string;
  variant?: "card" | "inline";
}

/**
 * Compact forecast block for the user's selected city + date.
 * Open-Meteo gives us up to 16 days; beyond that we say "too far out".
 */
export function ForecastForDate({ city, date, variant = "card" }: Props) {
  const { loading, error, forDate, outOfRange, daily } = useWeather(city, date);

  const wrap =
    variant === "card"
      ? "rounded-2xl border-2 border-ink/15 bg-card p-3"
      : "rounded-xl bg-cream/60 p-2.5";

  if (loading) {
    return (
      <div className={`${wrap} flex items-center gap-2 text-xs text-muted-foreground`}>
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking forecast for {city}…
      </div>
    );
  }

  if (error || (!forDate && !outOfRange)) {
    return (
      <div className={`${wrap} flex items-center gap-2 text-xs text-muted-foreground`}>
        <CloudOff className="h-3.5 w-3.5" /> Forecast unavailable right now
      </div>
    );
  }

  if (outOfRange) {
    return (
      <div className={`${wrap} flex items-center gap-2 text-xs text-muted-foreground`}>
        <CloudOff className="h-3.5 w-3.5" /> Forecast not ready yet — picks {daily.length} days out.
      </div>
    );
  }

  if (!forDate) return null;

  const w = describeWeather(forDate.code);
  const dateLabel = new Date(forDate.date + "T12:00:00").toLocaleDateString(undefined, {
    weekday: "short", month: "short", day: "numeric",
  });
  const wet = forDate.precipProb >= 50;

  return (
    <div className={wrap}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-2xl shrink-0" aria-hidden>{w.emoji}</span>
          <div className="min-w-0">
            <div className="font-mono text-[9px] font-bold uppercase tracking-widest text-ink/60">
              Forecast · {dateLabel}
            </div>
            <div className="font-display text-sm font-bold leading-tight truncate">
              {w.label} · {forDate.tMax}° / {forDate.tMin}°F
            </div>
          </div>
        </div>
        <div
          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${
            wet ? "bg-coral/15 text-coral" : "bg-ink/5 text-ink/70"
          }`}
          title="Chance of precipitation"
        >
          <Droplets className="h-3 w-3" /> {forDate.precipProb}%
        </div>
      </div>
      {wet && (
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          Rain likely — we'll favor indoor stops & covered patios.
        </p>
      )}
    </div>
  );
}
