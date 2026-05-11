import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Flame, ArrowRight, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ViralTagChip, type ViralTag } from "./ViralTagChip";

type ViralVenue = {
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
};

export function ViralNow({ city = "Washington DC", limit = 8 }: { city?: string; limit?: number }) {
  const [venues, setVenues] = useState<ViralVenue[] | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Slow down horizontal wheel scroll for a more deliberate feel
  const SCROLL_SPEED = 0.25;
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (delta === 0) return;
    e.preventDefault();
    el.scrollBy({ left: delta * SCROLL_SPEED, behavior: "auto" });
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("viral_venues")
        .select("id,city,venue_name,neighborhood,address,photo_url,rating,trend_score,tags,summary,google_place_id")
        .eq("city", city)
        .order("trend_score", { ascending: false })
        .limit(limit);
      if (!cancelled) setVenues((data as ViralVenue[]) ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [city, limit]);

  return (
    <section aria-label="Viral now" className="space-y-3">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Trending in {city}</p>
          <h2 className="font-display text-2xl font-bold leading-tight flex items-center gap-2">
            <Flame className="h-5 w-5 text-rose-500" /> Viral Now
          </h2>
        </div>
        <Link to="/viral" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
          See all <ArrowRight className="h-3 w-3" />
        </Link>
      </header>

      {venues === null && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-44 w-64 shrink-0 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      )}

      {venues !== null && venues.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-5 text-sm text-muted-foreground">
          Spinning up the trend radar for {city}… check back shortly.
        </div>
      )}

      {venues && venues.length > 0 && (
        <div ref={scrollRef} onWheel={handleWheel} className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 snap-x scroll-smooth">
          {venues.map((v) => (
            <ViralCard key={v.id} v={v} />
          ))}
        </div>
      )}
    </section>
  );
}

function ViralCard({ v }: { v: ViralVenue }) {
  const topTag = v.tags?.[0];
  const heat = Math.min(5, Math.max(1, Math.round(v.trend_score * 3)));
  return (
    <article className="group relative w-64 shrink-0 snap-start overflow-hidden rounded-2xl border border-border bg-card shadow-card transition hover:shadow-pop">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {v.photo_url ? (
          <img src={v.photo_url} alt={v.venue_name} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
        ) : (
          <div className="grid h-full place-items-center text-3xl">🍽️</div>
        )}
        <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-background/85 px-2 py-1 text-[10px] font-bold backdrop-blur">
          {[...Array(heat)].map((_, i) => (
            <Flame key={i} className="h-3 w-3 text-rose-500" />
          ))}
        </div>
        {topTag && (
          <div className="absolute bottom-2 left-2">
            <ViralTagChip tag={topTag} />
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-display text-sm font-bold leading-tight line-clamp-1">{v.venue_name}</h3>
        {v.neighborhood && (
          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3" /> {v.neighborhood}
          </p>
        )}
        {v.summary && <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{v.summary}</p>}
      </div>
    </article>
  );
}
