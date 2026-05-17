import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { LayoutList, Map as MapIcon, MapPin, Star, Loader2, Search, X, Sparkles, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PullToRefresh } from "@/components/PullToRefresh";
import { useCallback } from "react";
import { SAMPLE_VENUES as SAMPLE_DATA, type SampleCategory } from "@/lib/sample-venues";

const discoverSearchSchema = z.object({
  venueId: fallback(z.string().optional(), undefined),
});

export const Route = createFileRoute("/discover")({
  validateSearch: zodValidator(discoverSearchSchema),
  head: () => ({
    meta: [
      { title: "Discover Nearby — Confetti" },
      {
        name: "description",
        content:
          "Browse trending Confetti venues near you, in list or map view.",
      },
      { property: "og:title", content: "Discover Nearby — Confetti" },
      { property: "og:description", content: "Browse trending venues near you, in list or map view." },
    ],
  }),
  component: DiscoverPage,
});

type VenueRow = {
  id: string;
  name: string;
  neighborhood: string | null;
  address: string | null;
  photo: string | null;
  rating: number | null;
  price?: string;
  tags?: string[];
  category?: Category;
  aiPick?: boolean;
  gradient?: string;
  description?: string;
  /** Approx position on the stylized DC map placeholder, as % of container (x=left, y=top). */
  coords?: { x: number; y: number };
};

type Category = SampleCategory;
const CATEGORIES: Array<"All" | Category> = ["All", "Dining", "Nightlife", "Rooftops", "Live Music", "Cocktails"];

const SAMPLE_VENUES: VenueRow[] = SAMPLE_DATA.map((v) => ({
  id: v.id,
  name: v.name,
  neighborhood: v.neighborhood,
  address: v.address,
  photo: null,
  rating: v.rating,
  price: v.price,
  tags: v.tags,
  category: v.category,
  aiPick: v.aiPick,
  gradient: v.gradient,
  description: v.description,
  coords: v.coords,
}));

function DiscoverPage() {
  const [view, setView] = useState<"list" | "map">("list");
  const [rows, setRows] = useState<VenueRow[] | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("All");
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [mapSelected, setMapSelected] = useState<VenueRow | null>(null);

  useEffect(() => {
    setMapSelected(null);
  }, [view, cat, q]);

  const filtered = useMemo(() => {
    if (!rows) return rows;
    const term = q.trim().toLowerCase();
    let out = rows;
    if (cat !== "All") out = out.filter((r) => r.category === cat);
    if (term) {
      out = out.filter((r) =>
        [r.name, r.neighborhood, r.address].filter(Boolean).join(" ").toLowerCase().includes(term)
      );
    }
    return out;
  }, [rows, q, cat]);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("viral_venues")
      .select("id,venue_name,neighborhood,address,photo_url,rating")
      .eq("verified", true)
      .order("trend_score", { ascending: false })
      .limit(60);
    const dbRows: VenueRow[] = (data ?? []).map((r) => ({
      id: r.id,
      name: r.venue_name,
      neighborhood: r.neighborhood,
      address: r.address,
      photo: r.photo_url,
      rating: r.rating != null ? Number(r.rating) : null,
    }));
    setRows([...SAMPLE_VENUES, ...dbRows]);
    setRefreshNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await load();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  return (
    <PullToRefresh onRefresh={load}>
    <div className="min-h-screen bg-background pb-32">
      <div className="mx-auto max-w-2xl px-4 pt-6">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Discover Nearby</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Trending spots curated for your city.
        </p>

        <div className="mt-4 inline-flex rounded-full border-2 border-ink bg-cream p-1 shadow-brut">
          <button
            onClick={() => setView("list")}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest transition ${
              view === "list" ? "bg-ink text-cream" : "text-ink/70"
            }`}
          >
            <LayoutList className="h-3.5 w-3.5" /> List
          </button>
          <button
            onClick={() => setView("map")}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest transition ${
              view === "map" ? "bg-ink text-cream" : "text-ink/70"
            }`}
          >
            <MapIcon className="h-3.5 w-3.5" /> Map
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-full border-2 border-ink bg-cream px-3 py-2 shadow-brut">
          <Search className="h-4 w-4 text-ink/60" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search venues, neighborhoods, addresses…"
            className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink/40 focus:outline-none"
            aria-label="Search venues"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="grid h-6 w-6 place-items-center rounded-full text-ink/60 hover:bg-ink/10"
              aria-label="Clear"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="mt-3 -mx-4 overflow-x-auto px-4">
          <div className="flex gap-2 pb-1">
            {CATEGORIES.map((c) => {
              const active = cat === c;
              return (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`shrink-0 rounded-full border-2 px-3.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest transition ${
                    active
                      ? "border-transparent bg-gradient-to-r from-coral to-violet-500 text-white shadow-brut"
                      : "border-ink/30 bg-cream/60 text-ink/70 hover:border-ink hover:bg-cream"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Aurora background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-20 h-72 w-72 rounded-full bg-coral/20 blur-3xl" />
        <div className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-violet-400/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl" />
      </div>

      <div className="mx-auto mt-5 max-w-2xl px-4">
        {filtered === null ? (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading venues…
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            {q ? `No venues match "${q}".` : "No venues in this category yet."}
          </div>
        ) : view === "list" ? (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filtered.map((v) => (
              <li
                key={v.id}
                className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/60 shadow-card backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-brut"
              >
                <Link to="/venue/$id" params={{ id: v.id }} className="block">
                  <div className="relative h-32 w-full overflow-hidden">
                    {v.photo ? (
                      <img src={v.photo} alt={v.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className={`h-full w-full bg-gradient-to-br ${v.gradient ?? "from-slate-500 via-slate-700 to-slate-900"}`}>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_55%)]" />
                      </div>
                    )}
                    {v.aiPick && (
                      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full border border-white/40 bg-black/50 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-amber-200 backdrop-blur">
                        <Sparkles className="h-2.5 w-2.5" /> AI Pick
                      </span>
                    )}
                    {v.price && (
                      <span className="absolute right-2 top-2 rounded-full border border-white/40 bg-black/40 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-200 backdrop-blur">
                        {v.price}
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate font-display text-base font-bold leading-tight text-ink">{v.name}</div>
                        <div className="truncate text-xs text-ink/60">{v.neighborhood ?? v.address ?? "Nearby"}</div>
                        {v.description && (
                          <div className="mt-0.5 truncate text-[11px] italic leading-snug text-ink/45">{v.description}</div>
                        )}
                      </div>
                      {v.rating != null && (
                        <div className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ink/5 px-2 py-0.5 text-xs font-semibold text-ink">
                          <Star className="h-3 w-3 fill-gold text-gold" /> {v.rating.toFixed(1)}
                        </div>
                      )}
                    </div>
                    {v.tags && v.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {v.tags.slice(0, 3).map((t) => (
                          <span key={t} className="rounded-full border border-ink/15 bg-cream/70 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-ink/70">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <DiscoverMap key={refreshNonce} rows={filtered} selected={mapSelected} onSelect={setMapSelected} />
        )}
      </div>
    </div>
    </PullToRefresh>
  );
}

function DiscoverMap({
  rows,
  selected,
  onSelect,
}: {
  rows: VenueRow[];
  selected: VenueRow | null;
  onSelect: (row: VenueRow | null) => void;
}) {
  const navigate = useNavigate();
  // Spread out venues without coords on a soft grid so the map always has pins.
  const pinned = useMemo(() => {
    return rows.map((r, i) => {
      if (r.coords) return { row: r, x: r.coords.x, y: r.coords.y };
      const cols = 4;
      const col = i % cols;
      const rowIdx = Math.floor(i / cols);
      return { row: r, x: 18 + col * 20, y: 22 + rowIdx * 18 };
    });
  }, [rows]);

  return (
    <div className="relative h-[70vh] overflow-hidden rounded-3xl border border-white/40 bg-gradient-to-br from-cream/90 via-white/60 to-coral/10 shadow-card backdrop-blur-xl">
      {/* Stylized DC map placeholder */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="river" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#9ec9e8" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#6fa8d6" stopOpacity="0.7" />
          </linearGradient>
          <pattern id="grid" width="6" height="6" patternUnits="userSpaceOnUse">
            <path d="M6 0H0V6" fill="none" stroke="rgba(26,20,16,0.06)" strokeWidth="0.2" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#grid)" />
        {/* Potomac river curve */}
        <path d="M0 78 C 20 70, 30 60, 18 48 C 8 38, 12 22, 0 14 L 0 100 Z" fill="url(#river)" />
        {/* Anacostia */}
        <path d="M58 100 C 62 86, 78 78, 100 76 L 100 100 Z" fill="url(#river)" opacity="0.85" />
        {/* Parks / green */}
        <ellipse cx="46" cy="60" rx="6" ry="3.5" fill="#bcd6a5" opacity="0.55" />
        <ellipse cx="70" cy="36" rx="9" ry="4" fill="#bcd6a5" opacity="0.45" />
        {/* Avenues */}
        <g stroke="rgba(26,20,16,0.18)" strokeWidth="0.35" fill="none">
          <line x1="0" y1="50" x2="100" y2="50" />
          <line x1="50" y1="0" x2="50" y2="100" />
          <line x1="0" y1="0" x2="100" y2="100" />
          <line x1="100" y1="0" x2="0" y2="100" />
          <circle cx="50" cy="50" r="3" />
        </g>
      </svg>

      {/* Aurora glow */}
      <div className="pointer-events-none absolute -left-10 top-10 h-48 w-48 rounded-full bg-coral/25 blur-3xl" />
      <div className="pointer-events-none absolute right-0 bottom-0 h-56 w-56 rounded-full bg-violet-400/25 blur-3xl" />

      {/* Compass / legend */}
      <div className="absolute left-3 top-3 z-20 rounded-full border border-white/50 bg-white/70 px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-widest text-ink/70 shadow-card backdrop-blur">
        Washington · DC
      </div>
      <div className="absolute right-3 top-3 z-20 grid h-9 w-9 place-items-center rounded-full border border-white/50 bg-white/70 font-mono text-[9px] font-bold text-ink shadow-card backdrop-blur">
        N↑
      </div>

      {/* Pins */}
      {pinned.map(({ row, x, y }) => {
        const active = selected?.id === row.id;
        return (
          <button
            key={row.id}
            type="button"
            onClick={() => {
              if (selected?.id === row.id) {
                navigate({ to: "/venue/$id", params: { id: row.id } });
              } else {
                onSelect(row);
              }
            }}
            className="group absolute z-10 -translate-x-1/2 -translate-y-full focus:outline-none"
            style={{ left: `${x}%`, top: `${y}%` }}
            aria-label={active ? `Open ${row.name}` : `Show ${row.name}`}
          >
            <span className="relative block">
              {(row.aiPick || active) && (
                <span className="absolute inset-0 -m-1 animate-ping rounded-full bg-coral/40" />
              )}
              <span
                className={`relative grid h-8 w-8 place-items-center rounded-full border-2 shadow-card transition ${
                  active
                    ? "scale-110 border-ink bg-ink text-cream"
                    : row.aiPick
                      ? "border-white bg-gradient-to-br from-coral to-rose-500 text-white"
                      : "border-white bg-white/90 text-ink"
                }`}
              >
                {row.aiPick ? (
                  <Sparkles className="h-3.5 w-3.5" />
                ) : (
                  <MapPin className="h-3.5 w-3.5" />
                )}
              </span>
              <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/60 bg-white/85 px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest text-ink/80 shadow-card backdrop-blur opacity-0 transition group-hover:opacity-100">
                {row.name}
              </span>
            </span>
          </button>
        );
      })}

      {selected ? <SelectedCard row={selected} onClose={() => onSelect(null)} /> : null}
    </div>
  );
}

function SelectedCard({ row, onClose }: { row: VenueRow; onClose: () => void }) {
  return (
    <div className="absolute bottom-4 left-4 right-4 z-30 rounded-2xl border-2 border-ink bg-cream p-3 shadow-brut">
      <button
        onClick={onClose}
        className="absolute -top-2 -right-2 z-10 grid h-7 w-7 place-items-center rounded-full border-2 border-ink bg-cream font-bold shadow-brut"
        aria-label="Close"
      >
        ×
      </button>
      <Link
        to="/venue/$id"
        params={{ id: row.id }}
        className="flex items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-coral"
      >
        {row.photo ? (
          <img
            src={row.photo}
            alt={row.name}
            className="h-16 w-16 shrink-0 rounded-xl border-2 border-ink object-cover"
          />
        ) : (
          <div className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 border-ink bg-gradient-to-br ${row.gradient ?? "from-slate-500 via-slate-700 to-slate-900"}`}>
            <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.4),transparent_55%)]" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-base font-bold leading-tight">{row.name}</div>
          <div className="truncate text-xs text-muted-foreground">
            {row.neighborhood ?? row.address ?? "Nearby"}
          </div>
          <div className="mt-1 flex items-center gap-2">
            {row.rating != null && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold">
                <Star className="h-3 w-3 fill-gold text-gold" /> {row.rating.toFixed(1)}
              </span>
            )}
            {row.price && (
              <span className="font-mono text-[10px] font-bold text-emerald-700">{row.price}</span>
            )}
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border-2 border-ink bg-gradient-to-r from-coral to-violet-500 px-3.5 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-white shadow-brut">
          Reserve <ArrowRight className="h-3 w-3" />
        </span>
      </Link>
    </div>
  );
}

