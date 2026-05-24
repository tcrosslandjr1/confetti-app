import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import {
  VENUE_KNOWLEDGE,
  type VenueKnowledge,
} from "@/lib/agents/venue-knowledge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface VenuePickerModalProps {
  open: boolean;
  onClose: () => void;
  /** City to filter venues by (matches loose; if blank/null, all cities shown). */
  city?: string | null;
  /** Optional cuisine substring filter, applied on top of city. */
  preferredCuisine?: string | null;
  /** Venue ids to hide (e.g. already-in-loop venues). */
  excludeIds?: string[];
  /** Heading text. */
  title?: string;
  /** Sub-heading text. */
  description?: string;
  /** Called when the user picks a venue. The modal does NOT close itself — caller decides. */
  onPick: (venue: VenueKnowledge) => void;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function VenuePickerModal({
  open,
  onClose,
  city,
  preferredCuisine,
  excludeIds,
  title = "Pick a venue",
  description,
  onPick,
}: VenuePickerModalProps) {
  const [query, setQuery] = useState("");
  const [activeCuisine, setActiveCuisine] = useState<string | null>(
    preferredCuisine ?? null,
  );

  const exclude = useMemo(() => new Set(excludeIds ?? []), [excludeIds]);

  const cityMatched = useMemo(() => {
    if (!city) return VENUE_KNOWLEDGE;
    const c = normalize(city);
    return VENUE_KNOWLEDGE.filter((v) => {
      const vc = normalize(v.city);
      return vc.includes(c) || c.includes(vc);
    });
  }, [city]);

  // Top cuisines for filter chips (from city-matched set, capped at 8)
  const cuisineOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const v of cityMatched) {
      if (!v.cuisine) continue;
      counts[v.cuisine] = (counts[v.cuisine] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([c]) => c);
  }, [cityMatched]);

  const results = useMemo(() => {
    const q = normalize(query);
    return cityMatched
      .filter((v) => !exclude.has(v.id))
      .filter((v) => !activeCuisine || v.cuisine === activeCuisine)
      .filter((v) => {
        if (!q) return true;
        return (
          normalize(v.name).includes(q) ||
          normalize(v.neighborhood).includes(q) ||
          normalize(v.cuisine).includes(q) ||
          v.cuisineTags.some((t) => normalize(t).includes(q)) ||
          v.vibeTags.some((t) => normalize(t).includes(q))
        );
      })
      .slice(0, 60);
  }, [cityMatched, query, activeCuisine, exclude]);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <DialogHeader className="border-b-2 border-ink/10 bg-cream px-4 py-3">
          <DialogTitle className="font-display text-lg font-extrabold tracking-tight">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-xs text-ink/60">
              {description}
            </DialogDescription>
          )}
          {city && (
            <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink/50">
              {cityMatched.length} venues in {city}
            </div>
          )}
        </DialogHeader>

        <div className="px-4 py-3 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/40" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, neighborhood, or cuisine"
              className="w-full rounded-full border-2 border-ink/20 bg-cream pl-9 pr-9 py-2 text-sm focus:border-ink focus:outline-none"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Cuisine chips */}
          {cuisineOptions.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setActiveCuisine(null)}
                className={`rounded-full border-2 border-ink px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  activeCuisine === null
                    ? "bg-ink text-cream"
                    : "bg-cream hover:bg-gold"
                }`}
              >
                All
              </button>
              {cuisineOptions.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setActiveCuisine((prev) => (prev === c ? null : c))}
                  className={`rounded-full border-2 border-ink px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors ${
                    activeCuisine === c
                      ? "bg-ink text-cream"
                      : "bg-cream hover:bg-gold"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results list */}
        <div className="max-h-[55vh] overflow-y-auto border-t-2 border-ink/10 bg-cream/40">
          {results.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-ink/60">
              No venues match. Try a different search or cuisine.
            </div>
          ) : (
            <ul className="divide-y divide-ink/8">
              {results.map((v) => (
                <li key={v.id}>
                  <button
                    type="button"
                    onClick={() => onPick(v)}
                    className="block w-full px-4 py-2.5 text-left hover:bg-gold/30 transition-colors"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="line-clamp-1 font-display text-sm font-bold tracking-tight text-ink">
                          {v.name}
                        </div>
                        <div className="mt-0.5 line-clamp-1 font-mono text-[10px] uppercase tracking-wide text-ink/50">
                          {v.cuisine}
                          {v.neighborhood ? ` · ${v.neighborhood}` : ""}
                        </div>
                      </div>
                      <div className="shrink-0 font-mono text-[11px] font-bold text-ink/70">
                        {v.price}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Convert a VenueKnowledge entry into a LoopStop payload suitable for
 * `addStop` or `replaceStop`. Caller provides time/kind context.
 */
export function venueToStopPayload(
  v: VenueKnowledge,
  opts: { time: string; kind: "departure" | "layover" | "destination" },
) {
  const priceMap: Record<number, string> = { 1: "$", 2: "$$", 3: "$$$", 4: "$$$$" };
  return {
    name: v.name,
    type: v.cuisine || "venue",
    venueId: v.id,
    address: v.address,
    area: v.neighborhood,
    lat: v.lat,
    lng: v.lng,
    priceLevel: priceMap[v.priceLevel] ?? v.price,
    time: opts.time,
    kind: opts.kind,
  };
}
