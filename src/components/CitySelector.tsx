import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ExternalLink,
  MapPin,
  Navigation,
  RefreshCw,
} from "lucide-react";
import {
  CITIES,
  DEFAULT_CITY,
  getSelectedCity,
  setSelectedCity,
  subscribeSelectedCity,
  type City,
} from "@/lib/cities";
import {
  requestUserLocationDetailed,
  clearStoredLocation,
  type LocationError,
} from "@/lib/location";
import { toast } from "sonner";

type LocError = { error: LocationError; message: string; attempts: number };

type Props = {
  /** Tighter visual style for use in dense headers. */
  compact?: boolean;
  className?: string;
};

export function CitySelector({ compact = false, className = "" }: Props) {
  const [city, setCity] = useState<City>(DEFAULT_CITY);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<LocError | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCity(getSelectedCity() ?? DEFAULT_CITY);
    return subscribeSelectedCity(() => setCity(getSelectedCity() ?? DEFAULT_CITY));
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function pick(c: City) {
    setSelectedCity(c.slug);
    setOpen(false);
    setQuery("");
    toast.success(`Now showing ${c.name}`, {
      description: "Quick Picks and the wizard will use this city.",
    });
  }

  async function useMyLocation() {
    setLocating(true);
    try {
      const result = await requestUserLocationDetailed({
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 60_000,
      });
      if (!result.ok) {
        setLocError((prev) => ({
          error: result.error,
          message: result.message,
          attempts: (prev?.attempts ?? 0) + 1,
        }));
        return;
      }
      const loc = result.location;
      setLocError(null);
      // Snap to the nearest city in our registry.
      const nearest = CITIES.reduce(
        (best, c) => {
          const d = Math.hypot(c.lat - loc.lat, c.lng - loc.lng);
          return d < best.d ? { c, d } : best;
        },
        { c: DEFAULT_CITY, d: Number.POSITIVE_INFINITY },
      ).c;
      setSelectedCity(nearest.slug);
      setOpen(false);
      toast.success(`Snapped to ${nearest.name}`);
    } finally {
      setLocating(false);
    }
  }

  function clear() {
    setSelectedCity(null);
    clearStoredLocation();
    setLocError(null);
    setOpen(false);
    toast.message("Cleared city. Pick any major metro from the list.");
  }

  const filtered = query.trim()
    ? CITIES.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.region.toLowerCase().includes(query.toLowerCase()) ||
          c.slug.toLowerCase().includes(query.toLowerCase()),
      )
    : CITIES;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Change city (current: ${city.name})`}
        className={`inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-cream font-mono font-bold uppercase tracking-widest text-ink shadow-brut transition-pop hover:-translate-y-0.5 hover:bg-coral/10 ${
          compact ? "h-9 px-3 text-[10px]" : "h-10 px-4 text-xs"
        }`}
      >
        <MapPin className="h-3.5 w-3.5 text-coral" aria-hidden />
        <span className="max-w-[8rem] truncate">{city.name}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-ink/60 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Pick a city"
          className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border-2 border-ink bg-cream shadow-brut-lg"
          style={{ animation: "reveal-up 0.2s ease-out forwards" }}
        >
          <div className="border-b-2 border-dashed border-ink/30 p-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search cities…"
              className="h-9 w-full rounded-full border-2 border-ink bg-cream px-3 font-mono text-xs text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-coral"
              autoFocus
            />
          </div>

          <button
            type="button"
            onClick={useMyLocation}
            disabled={locating}
            className="flex w-full items-center gap-2 border-b-2 border-dashed border-ink/30 px-4 py-2.5 text-left font-mono text-[11px] font-bold uppercase tracking-widest text-ink hover:bg-coral/10 disabled:opacity-50"
          >
            <Navigation className={`h-3.5 w-3.5 text-coral ${locating ? "animate-spin" : ""}`} />
            {locating
              ? "Finding nearest city…"
              : locError
                ? "Try location again"
                : "Use my location"}
          </button>

          {locError && !locating && (
            <div className="border-b-2 border-dashed border-ink/30 bg-coral/10 px-4 py-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-coral" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink">
                    {locError.error === "permission_denied"
                      ? "Permission blocked"
                      : locError.error === "iframe_blocked"
                        ? "Blocked in preview"
                        : locError.error === "timeout"
                          ? "Took too long"
                          : locError.error === "unsupported"
                            ? "Not supported"
                            : "Location unavailable"}
                    {locError.attempts > 1 && (
                      <span className="ml-1 text-ink/50">· tried {locError.attempts}×</span>
                    )}
                  </p>
                  <p className="mt-1 font-mono text-[11px] leading-snug text-ink/70">
                    {locError.message}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {locError.error !== "unsupported" && (
                      <button
                        type="button"
                        onClick={useMyLocation}
                        className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-cream px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-ink shadow-brut transition-pop hover:-translate-y-0.5 hover:bg-coral hover:text-cream"
                      >
                        <RefreshCw className="h-3 w-3" aria-hidden /> Retry
                      </button>
                    )}
                    {locError.error === "iframe_blocked" && typeof window !== "undefined" && (
                      <a
                        href={window.location.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-cream px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-ink shadow-brut transition-pop hover:-translate-y-0.5 hover:bg-coral hover:text-cream"
                      >
                        <ExternalLink className="h-3 w-3" aria-hidden /> Open in new tab
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setLocError(null)}
                      className="font-mono text-[10px] uppercase tracking-widest text-ink/50 hover:text-ink"
                    >
                      Dismiss
                    </button>
                  </div>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-ink/50">
                    Or pick a city below ↓
                  </p>
                </div>
              </div>
            </div>
          )}

          <ul className="max-h-72 overflow-y-auto">
            {filtered.map((c) => {
              const active = c.slug === city.slug;
              return (
                <li key={c.slug}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => pick(c)}
                    className={`flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left transition-colors hover:bg-coral/10 ${
                      active ? "bg-gold/30" : ""
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span aria-hidden className="text-base">
                        {c.emoji}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-display text-sm font-bold text-ink">
                          {c.name}
                        </span>
                        <span className="block truncate font-mono text-[10px] uppercase tracking-widest text-ink/60">
                          {c.region}
                        </span>
                      </span>
                    </span>
                    {active && <Check className="h-4 w-4 shrink-0 text-coral" aria-hidden />}
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-4 py-3 font-mono text-[11px] uppercase tracking-widest text-ink/50">
                No cities match.
              </li>
            )}
          </ul>

          <button
            type="button"
            onClick={clear}
            className="block w-full border-t-2 border-dashed border-ink/30 px-4 py-2 text-left font-mono text-[10px] uppercase tracking-widest text-ink/60 hover:bg-coral/10 hover:text-ink"
          >
            Reset to default
          </button>
        </div>
      )}
    </div>
  );
}
