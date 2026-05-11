import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import type { LoopStop } from "@/lib/loop-store";

type Props = {
  stops: LoopStop[];
  currentIdx: number;
  onJump: (stopId: string) => void;
  className?: string;
  placeholder?: string;
};

/** Searchable typeahead that jumps the map/itinerary to a chosen stop. */
export function StopSearchBox({
  stops,
  currentIdx,
  onJump,
  className = "",
  placeholder = "Search stops…",
}: Props) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return stops;
    return stops.filter((s) =>
      [s.name, s.area, s.address, s.type].filter(Boolean).join(" ").toLowerCase().includes(term)
    );
  }, [q, stops]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function pick(stopId: string) {
    onJump(stopId);
    setOpen(false);
    setQ("");
  }

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <div className="flex items-center gap-2 rounded-full border-2 border-ink bg-cream/95 px-3 py-1.5 shadow-brut">
        <Search className="h-3.5 w-3.5 text-ink/60" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && matches[0]) pick(matches[0].id);
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder={placeholder}
          className="w-full bg-transparent font-mono text-[12px] uppercase tracking-wider text-ink placeholder:text-ink/40 focus:outline-none"
          aria-label="Search stops"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            className="grid h-5 w-5 place-items-center rounded-full text-ink/60 hover:bg-ink/10"
            aria-label="Clear"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {open && matches.length > 0 && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full z-40 mt-1 max-h-64 overflow-auto rounded-2xl border-2 border-ink bg-cream shadow-brut"
        >
          {matches.map((s, i) => {
            const idx = stops.findIndex((x) => x.id === s.id);
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => pick(s.id)}
                  className="flex w-full items-center gap-2 border-b border-ink/10 px-3 py-2 text-left last:border-b-0 hover:bg-coral/10"
                >
                  <span
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-ink font-mono text-[10px] font-bold ${
                      idx === currentIdx ? "bg-gold" : s.done ? "bg-coral text-cream" : "bg-cream"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold leading-tight">
                      {s.name}
                    </span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {[s.area, s.type].filter(Boolean).join(" · ") || "Stop"}
                    </span>
                  </span>
                  <span className="font-mono text-[10px] text-ink/50">{s.time}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
