import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Flame, MapPin, ExternalLink, Star, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ViralTagChip, ALL_VIRAL_TAGS, tagLabel, type ViralTag } from "@/components/ViralTagChip";

export const Route = createFileRoute("/viral")({
  head: () => ({
    meta: [
      { title: "Viral Now — Trending Spots | Confetti" },
      {
        name: "description",
        content:
          "Where everyone's going right now — viral restaurants, hidden gems, and Instagrammable spots trending across TikTok, Instagram, and the press.",
      },
      { property: "og:title", content: "Viral Now — Trending Spots" },
      {
        property: "og:description",
        content: "Trending venues from TikTok, Instagram, and creators — refreshed daily.",
      },
    ],
  }),
  component: ViralPage,
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
};

const CITIES = ["Washington DC", "New York", "Los Angeles", "Austin", "Miami", "Chicago"];

function ViralPage() {
  const [city, setCity] = useState("Washington DC");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [activeTags, setActiveTags] = useState<ViralTag[]>([]);
  const [sortBy, setSortBy] = useState<"score" | "recent">("score");

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    (async () => {
      const orderCol = sortBy === "score" ? "trend_score" : "last_mentioned_at";
      const { data } = await supabase
        .from("viral_venues")
        .select(
          "id,city,venue_name,neighborhood,address,photo_url,rating,trend_score,tags,summary,google_place_id,source_urls,last_mentioned_at",
        )
        .eq("city", city)
        .order(orderCol, { ascending: false })
        .limit(60);
      if (!cancelled) setRows((data as Row[]) ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [city, sortBy]);

  const filtered = useMemo(() => {
    if (!rows) return null;
    if (!activeTags.length) return rows;
    return rows.filter((r) => activeTags.some((t) => r.tags?.includes(t)));
  }, [rows, activeTags]);

  const toggleTag = (t: ViralTag) =>
    setActiveTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <Link
        to="/portal"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> Back to portal
      </Link>

      <header className="space-y-2">
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          What's hot
        </p>
        <h1 className="font-display text-4xl font-bold leading-tight flex items-center gap-2">
          <Flame className="h-7 w-7 text-rose-500" /> Viral Now
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Trending venues surfaced from TikTok, Instagram, creators, and the press — verified
          against Google and refreshed daily.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3">
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold"
        >
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <div className="flex gap-1 rounded-xl border border-border bg-background p-1 text-xs">
          <button
            type="button"
            onClick={() => setSortBy("score")}
            className={`rounded-lg px-3 py-1.5 font-semibold ${sortBy === "score" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            Top trending
          </button>
          <button
            type="button"
            onClick={() => setSortBy("recent")}
            className={`rounded-lg px-3 py-1.5 font-semibold ${sortBy === "recent" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            Most recent
          </button>
        </div>
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
            Clear
          </button>
        )}
      </div>

      {filtered === null && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      )}

      {filtered !== null && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
          <Flame className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-display text-lg font-bold">Nothing trending here yet</p>
          <p className="text-sm text-muted-foreground">
            {activeTags.length
              ? `No ${activeTags.map(tagLabel).join(" · ")} spots in ${city}. Try clearing filters.`
              : `We haven't discovered ${city} venues yet — admins can refresh from /admin/integrations.`}
          </p>
        </div>
      )}

      {filtered && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((v) => (
            <ViralBigCard key={v.id} v={v} />
          ))}
        </div>
      )}
    </div>
  );
}

function ViralBigCard({ v }: { v: Row }) {
  const heat = Math.min(5, Math.max(1, Math.round(v.trend_score * 3)));
  const mapHref = v.google_place_id
    ? `https://www.google.com/maps/place/?q=place_id:${v.google_place_id}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${v.venue_name} ${v.address ?? v.city}`)}`;
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="relative aspect-[5/3] w-full overflow-hidden bg-muted">
        {v.photo_url ? (
          <img
            src={v.photo_url}
            alt={v.venue_name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full place-items-center text-4xl">🍽️</div>
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
          {(v.tags ?? []).map((t) => (
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
            {v.source_urls?.length ?? 0} mentions
          </span>
        </div>
      </div>
    </article>
  );
}
