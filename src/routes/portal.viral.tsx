import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Flame, MapPin, ExternalLink, Star, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ViralTagChip, ALL_VIRAL_TAGS, tagLabel, type ViralTag } from "@/components/ViralTagChip";

export const Route = createFileRoute("/portal/viral")({
  head: () => ({
    meta: [
      { title: "Viral Now — My Portal | Loop" },
      { name: "description", content: "Top trending venues in your city, ranked by trend score and filterable by vibe." },
    ],
  }),
  component: PortalViralPage,
});

type Row = {
  id: string;
  city: string;
  venue_name: string;
  neighborhood: string | null;
  address: string | null;
  photo_url: string | null;
  rating: number | null;
  trend_score: number;
  tags: ViralTag[];
  summary: string | null;
  google_place_id: string | null;
  source_urls: { url: string; query?: string; authority?: number }[] | null;
  last_mentioned_at: string;
  mention_count: number;
};

type SortKey = "score_desc" | "score_asc" | "recent" | "mentions";

const CITIES = ["Washington DC", "New York", "Los Angeles", "Austin", "Miami", "Chicago"];

function PortalViralPage() {
  const [city, setCity] = useState("Washington DC");
  const [cities, setCities] = useState<string[]>(CITIES);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [activeTags, setActiveTags] = useState<ViralTag[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>("score_desc");
  const [minScore, setMinScore] = useState(0);
  const [query, setQuery] = useState("");

  // Discover available cities so the filter reflects what's actually in the table
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("viral_venues")
        .select("city")
        .eq("verified", true)
        .limit(500);
      const found = Array.from(new Set((data ?? []).map((r) => r.city as string).filter(Boolean)));
      const merged = Array.from(new Set([...CITIES, ...found]));
      setCities(merged);
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    (async () => {
      const orderCol =
        sortBy === "score_desc" || sortBy === "score_asc"
          ? "trend_score"
          : sortBy === "mentions"
          ? "mention_count"
          : "last_mentioned_at";
      const ascending = sortBy === "score_asc";
      const { data } = await supabase
        .from("viral_venues")
        .select(
          "id,city,venue_name,neighborhood,address,photo_url,rating,trend_score,tags,summary,google_place_id,source_urls,last_mentioned_at,mention_count"
        )
        .eq("city", city)
        .order(orderCol, { ascending })
        .limit(60);
      if (!cancelled) setRows((data as Row[]) ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [city, sortBy]);

  const filtered = useMemo(() => {
    if (!rows) return null;
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (r.trend_score < minScore) return false;
      if (activeTags.length && !activeTags.some((t) => r.tags?.includes(t))) return false;
      if (q && !`${r.venue_name} ${r.neighborhood ?? ""} ${r.summary ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, activeTags, minScore, query]);

  const toggleTag = (t: ViralTag) =>
    setActiveTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const topScore = rows?.[0]?.trend_score ?? 0;

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">My portal · What's hot</p>
        <h1 className="font-display text-3xl font-bold leading-tight flex items-center gap-2">
          <Flame className="h-6 w-6 text-rose-500" /> Viral Now in {city}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          The top venues trending across TikTok, Instagram, creators, and the press — ranked by Loop's trend score.
        </p>
      </header>

      {/* Filter bar */}
      <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">City</label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold"
          >
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <label className="ml-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Sort</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold"
          >
            <option value="score_desc">Trend score · high → low</option>
            <option value="score_asc">Trend score · low → high</option>
            <option value="recent">Most recently mentioned</option>
            <option value="mentions">Most mentions</option>
          </select>

          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search venue, neighborhood…"
            className="ml-auto w-full max-w-xs rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <label className="text-xs font-semibold text-muted-foreground">
              Min score: <span className="text-foreground">{minScore.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min={0}
              max={Math.max(1, Math.ceil(topScore * 100) / 100)}
              step={0.05}
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="h-1 w-40 accent-rose-500"
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {filtered?.length ?? 0} of {rows?.length ?? 0} shown
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {ALL_VIRAL_TAGS.map((t) => {
            const active = activeTags.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleTag(t)}
                className={`transition ${active ? "scale-105" : "opacity-70 hover:opacity-100"}`}
                aria-pressed={active}
              >
                <ViralTagChip tag={t} size="md" />
              </button>
            );
          })}
          {activeTags.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTags([])}
              className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
            >
              Clear tags
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {filtered === null && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      )}

      {filtered !== null && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
          <Flame className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-display text-lg font-bold">Nothing matches those filters</p>
          <p className="text-sm text-muted-foreground">
            {activeTags.length || query || minScore > 0
              ? "Try clearing filters or lowering the minimum score."
              : `We haven't discovered ${city} venues yet — admins can refresh from /admin/integrations.`}
          </p>
        </div>
      )}

      {filtered && filtered.length > 0 && (
        <ol className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((v, i) => (
            <ViralCard key={v.id} v={v} rank={sortBy === "score_desc" ? i + 1 : undefined} />
          ))}
        </ol>
      )}
    </section>
  );
}

function ViralCard({ v, rank }: { v: Row; rank?: number }) {
  const heat = Math.min(5, Math.max(1, Math.round(v.trend_score * 3)));
  const mapHref = v.google_place_id
    ? `https://www.google.com/maps/place/?q=place_id:${v.google_place_id}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${v.venue_name} ${v.address ?? v.city}`)}`;
  return (
    <li className="overflow-hidden rounded-2xl border border-border bg-card shadow-card transition hover:shadow-pop">
      <div className="relative aspect-[5/3] w-full overflow-hidden bg-muted">
        {v.photo_url ? (
          <img src={v.photo_url} alt={v.venue_name} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-4xl">🍽️</div>
        )}
        {rank && (
          <div className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-foreground text-xs font-black text-background shadow-pop">
            #{rank}
          </div>
        )}
        <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-background/85 px-2 py-1 text-[10px] font-bold backdrop-blur">
          {[...Array(heat)].map((_, i) => (
            <Flame key={i} className="h-3 w-3 text-rose-500" />
          ))}
          <span className="ml-1 text-foreground">{v.trend_score.toFixed(2)}</span>
        </div>
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg font-bold leading-tight">{v.venue_name}</h3>
          {typeof v.rating === "number" && (
            <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-amber-600">
              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
              {v.rating.toFixed(1)}
            </span>
          )}
        </div>
        {v.neighborhood && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" /> {v.neighborhood}
          </p>
        )}
        {v.summary && <p className="text-sm text-muted-foreground line-clamp-3">{v.summary}</p>}
        <div className="flex flex-wrap gap-1">
          {(v.tags ?? []).slice(0, 4).map((t) => (
            <ViralTagChip key={t} tag={t} />
          ))}
        </div>
        <div className="flex items-center justify-between pt-1">
          <a
            href={mapHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            Open in Maps <ExternalLink className="h-3 w-3" />
          </a>
          <span className="text-[10px] text-muted-foreground">
            {v.mention_count ?? v.source_urls?.length ?? 0} mentions
          </span>
        </div>
      </div>
    </li>
  );
}
