import { useEffect, useMemo, useState } from "react";
import { Loader2, MapPin, Search, Sparkles, X } from "lucide-react";
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

/** Unified shape produced by either the curated KB or the AI suggester. */
export interface PickedVenue {
  id: string;
  name: string;
  /** Cuisine label (from KB) or category (from AI). */
  cuisine: string;
  neighborhood: string;
  address: string;
  lat: number;
  lng: number;
  /** Human-readable price tier, e.g. "$$$". */
  price: string;
  /** Numeric price 1-4 (or 0 if unknown). */
  priceLevel: number;
  source: "curated" | "ai";
  /** Only set for AI picks — Claude's "why this for you" sentence. */
  reason?: string;
  photo?: string | null;
  vibe?: string | null;
  rating?: number | null;
}

interface AiRec {
  id: string;
  venue: string;
  category: string;
  vibe: string;
  reason: string;
  address?: string;
  neighborhood?: string;
  rating?: number;
  priceLevel?: number | null;
  photo?: string | null;
  lat?: number;
  lng?: number;
}

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
  onPick: (venue: PickedVenue) => void;
  /** Names of stops already in the plan — passed to the AI for de-duplication. */
  existingStopNames?: string[];
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function kbToPicked(v: VenueKnowledge): PickedVenue {
  return {
    id: v.id,
    name: v.name,
    cuisine: v.cuisine || "venue",
    neighborhood: v.neighborhood,
    address: v.address,
    lat: v.lat,
    lng: v.lng,
    price: v.price,
    priceLevel: v.priceLevel,
    source: "curated",
    vibe: v.vibeNotes,
  };
}

const PRICE_LABEL: Record<number, string> = { 1: "$", 2: "$$", 3: "$$$", 4: "$$$$" };

function aiToPicked(rec: AiRec): PickedVenue {
  const priceLevel = typeof rec.priceLevel === "number" ? rec.priceLevel : 0;
  return {
    id: rec.id,
    name: rec.venue,
    cuisine: rec.category,
    neighborhood: rec.neighborhood ?? "",
    address: rec.address ?? "",
    lat: rec.lat ?? 0,
    lng: rec.lng ?? 0,
    price: PRICE_LABEL[priceLevel] ?? "",
    priceLevel,
    source: "ai",
    reason: rec.reason,
    photo: rec.photo ?? null,
    vibe: rec.vibe,
    rating: rec.rating ?? null,
  };
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
  existingStopNames,
}: VenuePickerModalProps) {
  const [mode, setMode] = useState<"curated" | "ai">("curated");
  const [query, setQuery] = useState("");
  const [activeCuisine, setActiveCuisine] = useState<string | null>(
    preferredCuisine ?? null,
  );
  const [aiState, setAiState] = useState<"idle" | "loading" | "success" | "error" | "empty">("idle");
  const [aiResults, setAiResults] = useState<AiRec[]>([]);

  const exclude = useMemo(() => new Set(excludeIds ?? []), [excludeIds]);

  const cityMatched = useMemo(() => {
    if (!city) return VENUE_KNOWLEDGE;
    const c = normalize(city);
    return VENUE_KNOWLEDGE.filter((v) => {
      const vc = normalize(v.city);
      return vc.includes(c) || c.includes(vc);
    });
  }, [city]);

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

  // Stable signature of the avoid-list so a new array reference each render
  // doesn't refire the AI fetch unnecessarily.
  const avoidKey = useMemo(
    () => (existingStopNames ?? []).join("|"),
    [existingStopNames],
  );

  // Fetch AI picks when entering AI mode or when city changes while in AI mode.
  useEffect(() => {
    if (!open || mode !== "ai") return;
    let cancelled = false;
    const avoid = avoidKey ? avoidKey.split("|") : undefined;
    async function load() {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      if (!url || !key) {
        setAiState("error");
        return;
      }
      setAiState("loading");
      try {
        const res = await fetch(`${url}/functions/v1/ai-recommend`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            city: city ?? null,
            sections: ["picks"],
            limit: 6,
            taste_profile: avoid ? { avoid } : undefined,
          }),
        });
        if (!res.ok) throw new Error(`AI ${res.status}`);
        const data = await res.json();
        const picks = (data.picks ?? []) as AiRec[];
        if (cancelled) return;
        if (picks.length === 0) {
          setAiState("empty");
          setAiResults([]);
        } else {
          setAiResults(picks);
          setAiState("success");
        }
      } catch {
        if (!cancelled) setAiState("error");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [open, mode, city, avoidKey]);

  function handlePickKb(v: VenueKnowledge) {
    onPick(kbToPicked(v));
  }
  function handlePickAi(rec: AiRec) {
    onPick(aiToPicked(rec));
  }

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
          {city && mode === "curated" && (
            <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink/50">
              {cityMatched.length} venues in {city}
            </div>
          )}
        </DialogHeader>

        {/* Mode toggle */}
        <div className="flex gap-2 px-4 pt-3">
          <button
            type="button"
            onClick={() => setMode("curated")}
            className={`flex-1 rounded-full border-2 border-ink px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors ${
              mode === "curated" ? "bg-ink text-cream" : "bg-cream hover:bg-gold"
            }`}
          >
            Browse curated
          </button>
          <button
            type="button"
            onClick={() => setMode("ai")}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border-2 border-ink px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors ${
              mode === "ai" ? "bg-purple text-cream" : "bg-cream hover:bg-purple/20"
            }`}
          >
            <Sparkles className="h-3 w-3" /> AI suggest
          </button>
        </div>

        {mode === "curated" ? (
          <>
            <div className="px-4 py-3 space-y-3">
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
                        onClick={() => handlePickKb(v)}
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
          </>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto border-t-2 border-ink/10 bg-purple/5 px-4 py-4">
            {aiState === "loading" && (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-ink/60">
                <Loader2 className="h-4 w-4 animate-spin" />
                Asking Claude for picks in {city ?? "your area"}…
              </div>
            )}
            {aiState === "error" && (
              <div className="py-10 text-center text-sm text-red-600">
                AI suggestions are unavailable right now. Try the curated list, or retry.
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setMode("curated")}
                    className="rounded-full border-2 border-ink bg-cream px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-gold"
                  >
                    Back to curated
                  </button>
                </div>
              </div>
            )}
            {aiState === "empty" && (
              <div className="py-10 text-center text-sm text-ink/60">
                Claude couldn't find new picks for this city. Try the curated list.
              </div>
            )}
            {aiState === "success" && (
              <ul className="space-y-3">
                {aiResults.map((rec) => (
                  <li key={rec.id}>
                    <button
                      type="button"
                      onClick={() => handlePickAi(rec)}
                      className="block w-full rounded-2xl border-2 border-purple/30 bg-cream p-3 text-left shadow-card hover:border-purple hover:bg-purple/8 transition-colors"
                    >
                      <div className="flex gap-3">
                        {rec.photo ? (
                          <img
                            src={rec.photo}
                            alt={rec.venue}
                            loading="lazy"
                            className="h-16 w-16 shrink-0 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-purple/10 text-purple">
                            <Sparkles className="h-5 w-5" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <div className="line-clamp-1 font-display text-sm font-bold tracking-tight text-ink">
                              {rec.venue}
                            </div>
                            {typeof rec.priceLevel === "number" && rec.priceLevel > 0 && (
                              <div className="shrink-0 font-mono text-[11px] font-bold text-ink/70">
                                {PRICE_LABEL[rec.priceLevel]}
                              </div>
                            )}
                          </div>
                          <div className="mt-0.5 line-clamp-1 font-mono text-[10px] uppercase tracking-wide text-ink/50">
                            {rec.category}
                            {rec.neighborhood ? ` · ${rec.neighborhood}` : ""}
                          </div>
                          {rec.reason && (
                            <p className="mt-1.5 line-clamp-2 text-[11px] italic text-ink/70">
                              "{rec.reason}"
                            </p>
                          )}
                          <div className="mt-1.5 inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest text-purple">
                            <Sparkles className="h-2.5 w-2.5" />
                            AI suggested
                          </div>
                        </div>
                      </div>
                      {rec.address && (
                        <div className="mt-2 flex items-center gap-1 text-[10px] text-ink/50">
                          <MapPin className="h-3 w-3" /> {rec.address}
                        </div>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Convert a PickedVenue into a LoopStop payload suitable for
 * `addStop` or `replaceStop`. Caller provides time/kind context.
 */
export function venueToStopPayload(
  v: PickedVenue,
  opts: { time: string; kind: "departure" | "layover" | "destination" },
) {
  return {
    name: v.name,
    type: v.cuisine || "venue",
    venueId: v.id,
    address: v.address,
    area: v.neighborhood,
    lat: v.lat || undefined,
    lng: v.lng || undefined,
    priceLevel: v.price || undefined,
    time: opts.time,
    kind: opts.kind,
    rationale: v.reason,
  };
}
