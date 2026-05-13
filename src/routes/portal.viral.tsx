import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Flame,
  MapPin,
  ExternalLink,
  Star,
  TrendingUp,
  Sparkles,
  Search,
  X,
  Trophy,
  Crown,
  Medal,
  Loader2,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ViralTagChip, ALL_VIRAL_TAGS, tagLabel, type ViralTag } from "@/components/ViralTagChip";

export const Route = createFileRoute("/portal/viral")({
  head: () => ({
    meta: [
      { title: "Viral Now — My Portal | Confetti" },
      {
        name: "description",
        content: "Top trending venues in your city, ranked by trend score and filterable by vibe.",
      },
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
  const [scoreInfoOpen, setScoreInfoOpen] = useState(false);
  const [discovering, setDiscovering] = useState(false);

  const refetch = async () => {
    setRows(null);
    const orderCol =
      sortBy === "score_desc" || sortBy === "score_asc"
        ? "trend_score"
        : sortBy === "mentions"
          ? "mention_count"
          : "last_mentioned_at";
    const { data } = await supabase
      .from("viral_venues")
      .select(
        "id,city,venue_name,neighborhood,address,photo_url,rating,trend_score,tags,summary,google_place_id,source_urls,last_mentioned_at,mention_count",
      )
      .eq("city", city)
      .order(orderCol, { ascending: sortBy === "score_asc" })
      .limit(60);
    setRows((data as Row[]) ?? []);
  };

  const discoverNow = async () => {
    setDiscovering(true);
    try {
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
      const res = await fetch("/api/public/hooks/discover-viral", {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: anonKey },
        body: JSON.stringify({ city }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      toast.success(`Found ${json.venuesUpserted ?? 0} viral spots in ${city}`);
      await refetch();
    } catch (e) {
      toast.error("Couldn't refresh viral feed", { description: (e as Error).message });
    } finally {
      setDiscovering(false);
    }
  };

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
          "id,city,venue_name,neighborhood,address,photo_url,rating,trend_score,tags,summary,google_place_id,source_urls,last_mentioned_at,mention_count",
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
      if (
        q &&
        !`${r.venue_name} ${r.neighborhood ?? ""} ${r.summary ?? ""}`.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [rows, activeTags, minScore, query]);

  const toggleTag = (t: ViralTag) =>
    setActiveTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const topScore = rows?.[0]?.trend_score ?? 0;
  const totalMentions = useMemo(
    () => (rows ?? []).reduce((sum, r) => sum + (r.mention_count ?? 0), 0),
    [rows],
  );
  const trendingTag = useMemo<{ tag: ViralTag; n: number } | null>(() => {
    const counts = new Map<ViralTag, number>();
    (rows ?? []).forEach((r) =>
      (r.tags ?? []).forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)),
    );
    let best: { tag: ViralTag; n: number } | null = null;
    counts.forEach((n, tag) => {
      if (!best || n > best.n) best = { tag, n };
    });
    return best;
  }, [rows]);

  const hasFilters = activeTags.length > 0 || !!query || minScore > 0;
  const top3 = useMemo(() => {
    if (!rows) return [];
    return [...rows].sort((a, b) => b.trend_score - a.trend_score).slice(0, 3);
  }, [rows]);

  return (
    <section className="space-y-6">
      {/* HERO */}
      <header className="relative overflow-hidden rounded-2xl border-2 border-ink bg-gradient-to-br from-rose-500/10 via-orange-500/10 to-amber-400/10 p-6 shadow-brut sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-rose-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="relative space-y-3">
          <p className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-background/60 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-widest text-rose-600 backdrop-blur">
            <Flame className="h-3 w-3 animate-pulse" /> What's hot · live
          </p>
          <h1 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl">
            Viral Now in{" "}
            <span className="bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 bg-clip-text text-transparent">
              {city}
            </span>
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            The top venues trending across TikTok, Instagram, creators, and the press — ranked by
            Confetti's trend score.
          </p>

          {/* How to use */}
          <div className="flex flex-wrap items-start gap-2 rounded-2xl border-2 border-ink/60 bg-background/60 p-3 text-xs text-muted-foreground backdrop-blur">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500" />
            <div className="space-y-1">
              <p className="font-semibold text-foreground">How to use this page</p>
              <ol className="ml-4 list-decimal space-y-0.5">
                <li>Pick a <strong>city</strong> below to switch the feed.</li>
                <li>Filter by <strong>vibe</strong> (TikTok Viral, Date Night…) or drag the <strong>Min score</strong> slider for only the hottest spots.</li>
                <li>Tap any card to see the venue, photos, and the posts driving the buzz.</li>
              </ol>
            </div>
          </div>

          {/* Quick city pills */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {cities.slice(0, 8).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCity(c)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  c === city
                    ? "bg-foreground text-background shadow-brut"
                    : "border-2 border-ink bg-background/60 text-foreground hover:bg-background"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* KPIs */}
          <div className="grid gap-2 pt-3 sm:grid-cols-3">
            <Kpi
              icon={Flame}
              label="Top score"
              value={rows ? topScore.toFixed(2) : "—"}
              accent="text-rose-500"
            />
            <Kpi
              icon={TrendingUp}
              label="Total mentions"
              value={rows ? totalMentions.toLocaleString() : "—"}
              accent="text-orange-500"
            />
            <Kpi
              icon={Sparkles}
              label="Trending vibe"
              value={trendingTag ? tagLabel(trendingTag.tag) : "—"}
              accent="text-amber-500"
            />
          </div>
        </div>
      </header>

      {/* TOP 3 SPOTLIGHT */}
      {top3.length >= 3 && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <h2 className="font-display text-sm font-bold uppercase tracking-wider">
              Top 3 right now
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {top3.map((v, i) => (
              <SpotlightCard key={v.id} v={v} rank={i + 1} />
            ))}
          </div>
        </div>
      )}

      {/* Sticky filter bar */}
      <div className="sticky top-2 z-10 space-y-3 rounded-2xl border-2 border-ink bg-cream/95 p-4 shadow-brut backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
            City
          </label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="rounded-xl border-2 border-ink bg-background px-3 py-2 text-sm font-semibold"
          >
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <label className="ml-2 text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
            Sort
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="rounded-xl border-2 border-ink bg-background px-3 py-2 text-sm font-semibold"
          >
            <option value="score_desc">Trend score · high → low</option>
            <option value="score_asc">Trend score · low → high</option>
            <option value="recent">Most recently mentioned</option>
            <option value="mentions">Most mentions</option>
          </select>

          <div className="relative ml-auto w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search venue, neighborhood…"
              className="w-full rounded-xl border-2 border-ink bg-background py-2 pl-9 pr-3 text-sm"
            />
          </div>
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
            <button
              type="button"
              onClick={() => setScoreInfoOpen((v) => !v)}
              aria-expanded={scoreInfoOpen}
              aria-controls="trend-score-info"
              title="How is trend score calculated?"
              className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-ink text-muted-foreground transition hover:border-rose-500 hover:text-rose-500"
            >
              <Info className="h-3.5 w-3.5" />
            </button>
          </div>
          <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
            {filtered?.length ?? 0} of {rows?.length ?? 0} shown
          </span>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setActiveTags([]);
                setMinScore(0);
                setQuery("");
              }}
              className="ml-auto inline-flex items-center gap-1 rounded-full border-2 border-ink px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" /> Reset filters
            </button>
          )}
        </div>

        {scoreInfoOpen && (
          <div
            id="trend-score-info"
            className="space-y-3 rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 text-xs text-foreground"
          >
            <div>
              <p className="font-display text-sm font-bold">How the trend score works</p>
              <p className="mt-1 text-muted-foreground">
                Each venue gets a single number (typically <strong>0–3</strong>) based on how much
                heat it's getting right now. Higher = more buzz. We blend six signals:
              </p>
            </div>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-rose-500" />
                <span><strong>TikTok mentions</strong> · 30% — log-dampened so 1 post still counts.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-fuchsia-500" />
                <span><strong>Instagram mentions</strong> · 25% — same dampening.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-orange-500" />
                <span><strong>Recency</strong> · 20% — full credit if mentioned in the last 7 days, decays to 30 days.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
                <span><strong>Source authority</strong> · 10% — Eater, Washingtonian, Infatuation, etc. weigh more than random blogs.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span><strong>Google rating</strong> · 10% — normalized around 3.5–5.0 stars.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-sky-500" />
                <span><strong>App engagement</strong> · 5% — saves, taps, and bookings inside Confetti.</span>
              </li>
            </ul>
            <div className="rounded-lg border border-dashed border-border bg-background/60 p-2.5">
              <p className="font-semibold">Min score filter</p>
              <p className="mt-0.5 text-muted-foreground">
                Hides any venue scoring below the slider value. Keep it at <strong>0.00</strong> to
                see everything; nudge it up to surface only the loudest hype. The slider's max
                tracks the top-ranked venue in {city}.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {ALL_VIRAL_TAGS.map((t) => {
            const active = activeTags.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleTag(t)}
                className={`transition ${active ? "scale-105" : "opacity-60 hover:opacity-100"}`}
                aria-pressed={active}
              >
                <ViralTagChip tag={t} size="md" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Results */}
      {filtered === null && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border-2 border-ink bg-cream">
              <div className="aspect-[5/3] w-full animate-pulse bg-muted" />
              <div className="space-y-2 p-4">
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                <div className="h-3 w-full animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      )}

      {filtered !== null && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-cream/50 p-10 text-center">
          <Flame className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-display text-lg font-bold">
            {hasFilters ? "Nothing matches those filters" : `No viral spots loaded for ${city} yet`}
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            {hasFilters
              ? "Try clearing filters or lowering the minimum score."
              : `Run a discovery pass to scan TikTok, Instagram, and the press for what's trending in ${city} right now. Takes ~30–60 seconds.`}
          </p>
          {hasFilters ? (
            <button
              type="button"
              onClick={() => {
                setActiveTags([]);
                setMinScore(0);
                setQuery("");
              }}
              className="mt-4 rounded-full bg-foreground px-4 py-2 text-xs font-bold uppercase tracking-widest text-background"
            >
              Reset filters
            </button>
          ) : (
            <button
              type="button"
              onClick={discoverNow}
              disabled={discovering}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white shadow-brut transition hover:scale-105 disabled:opacity-60"
            >
              {discovering ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Discovering…
                </>
              ) : (
                <>
                  <Flame className="h-3.5 w-3.5" /> Discover viral spots in {city}
                </>
              )}
            </button>
          )}
        </div>
      )}

      {filtered && filtered.length > 0 && (
        <ol className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((v, i) => (
            <ViralCard
              key={v.id}
              v={v}
              rank={sortBy === "score_desc" ? i + 1 : undefined}
              topScore={topScore}
            />
          ))}
        </ol>
      )}
    </section>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Flame;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border-2 border-ink bg-background/70 p-3 backdrop-blur">
      <span className={`grid h-9 w-9 place-items-center rounded-xl bg-background ${accent}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          {label}
        </div>
        <div className="truncate font-display text-base font-extrabold leading-tight">{value}</div>
      </div>
    </div>
  );
}

function rankBadge(rank: number) {
  if (rank === 1) return { Icon: Crown, color: "bg-amber-400 text-amber-950" };
  if (rank === 2) return { Icon: Medal, color: "bg-zinc-300 text-zinc-900" };
  return { Icon: Medal, color: "bg-orange-300 text-orange-950" };
}

function SpotlightCard({ v, rank }: { v: Row; rank: number }) {
  const { Icon, color } = rankBadge(rank);
  return (
    <article className="group relative overflow-hidden rounded-2xl border-2 border-ink bg-cream shadow-brut transition hover:shadow-brut">
      <div className="relative aspect-[5/3] w-full overflow-hidden bg-muted">
        {v.photo_url ? (
          <img
            src={v.photo_url}
            alt={v.venue_name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-4xl">🔥</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0" />
        <div
          className={`absolute left-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-widest shadow-brut ${color}`}
        >
          <Icon className="h-3 w-3" /> #{rank}
        </div>
        <div className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-[10px] font-bold backdrop-blur">
          <Flame className="h-3 w-3 text-rose-500" /> {v.trend_score.toFixed(2)}
        </div>
        <div className="absolute inset-x-3 bottom-2 text-white">
          <h3 className="font-display text-base font-extrabold leading-tight drop-shadow">
            {v.venue_name}
          </h3>
          {v.neighborhood && <p className="text-[11px] opacity-90">{v.neighborhood}</p>}
        </div>
      </div>
    </article>
  );
}

function ViralCard({ v, rank, topScore }: { v: Row; rank?: number; topScore: number }) {
  const heat = Math.min(5, Math.max(1, Math.round(v.trend_score * 3)));
  const pct = topScore > 0 ? Math.min(100, Math.round((v.trend_score / topScore) * 100)) : 0;
  const mapHref = v.google_place_id
    ? `https://www.google.com/maps/place/?q=place_id:${v.google_place_id}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${v.venue_name} ${v.address ?? v.city}`)}`;
  const daysAgo = (() => {
    const d = new Date(v.last_mentioned_at);
    if (isNaN(+d)) return null;
    const days = Math.max(0, Math.round((Date.now() - +d) / 86_400_000));
    if (days === 0) return "today";
    if (days === 1) return "yesterday";
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.round(days / 7)}w ago`;
    return `${Math.round(days / 30)}mo ago`;
  })();
  return (
    <li className="group overflow-hidden rounded-2xl border-2 border-ink bg-cream shadow-brut transition hover:-translate-y-0.5 hover:shadow-brut">
      <div className="relative aspect-[5/3] w-full overflow-hidden bg-muted">
        {v.photo_url ? (
          <img
            src={v.photo_url}
            alt={v.venue_name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="grid h-full place-items-center text-4xl">🍽️</div>
        )}
        {rank && (
          <div className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-foreground text-xs font-black text-background shadow-brut">
            #{rank}
          </div>
        )}
        <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-[10px] font-bold backdrop-blur">
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

        {/* Heat bar relative to top score */}
        <div className="pt-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

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
            {v.mention_count ?? v.source_urls?.length ?? 0} mentions{daysAgo ? ` · ${daysAgo}` : ""}
          </span>
        </div>
      </div>
    </li>
  );
}
