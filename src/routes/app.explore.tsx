import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHero, BrandCard } from "@/components/PageHero";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/lib/auth-context";
import { usePageview } from "@/lib/analytics";

export const Route = createFileRoute("/app/explore")({
  component: ExplorePage,
});

const CATEGORIES = [
  { key: "rooftop", label: "Rooftops" },
  { key: "lounge", label: "Lounges" },
  { key: "bar", label: "Bars" },
  { key: "club", label: "Clubs" },
  { key: "restaurant", label: "Dining" },
  { key: "live-music", label: "Live music" },
];

function ExplorePage() {
  const { user } = useAuth();
  usePageview("app_explore", "/app/explore");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [mapView, setMapView] = useState(false);

  const { data: venues } = useQuery({
    queryKey: ["app", "explore", q, cat],
    queryFn: async () => {
      let query = supabase
        .from("venues")
        .select("id,name,category,neighborhood,city,hero_image_url,image_url,price_level")
        .limit(30);
      if (q) query = query.ilike("name", `%${q}%`);
      if (cat) query = query.ilike("category", `%${cat}%`);
      const { data } = await query;
      return data ?? [];
    },
  });

  return (
    <div className="pb-8">
      <PageHero
        eyebrow="Explore // discover"
        title={
          <>
            Find your <span className="font-serif italic font-normal text-coral">spot.</span>
          </>
        }
        subtitle="Search by vibe, neighborhood, or name."
        right={<NotificationBell userId={user?.id} />}
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink/60" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rooftops, jazz, Logan Circle…"
            className="h-12 rounded-full border-2 border-ink bg-white pl-11 pr-14 font-mono text-xs uppercase tracking-wider text-ink shadow-brut placeholder:normal-case placeholder:tracking-normal placeholder:text-ink/40 focus-visible:ring-0"
          />
          <button
            onClick={() => setMapView((v) => !v)}
            className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full border-2 border-ink bg-coral text-cream shadow-brut transition-pop hover:-translate-y-[calc(50%+2px)] hover:-translate-x-0.5"
            aria-label="Toggle filters"
          >
            <SlidersHorizontal className="size-4" />
          </button>
        </div>
      </PageHero>

      <div className="px-5 pt-4">
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-3">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setCat(cat === c.key ? null : c.key)}
              className={cn(
                "shrink-0 rounded-full border-2 border-ink px-3.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-pop",
                cat === c.key
                  ? "bg-ink text-cream shadow-brut"
                  : "bg-white text-ink hover:-translate-y-0.5 hover:shadow-brut",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="mt-2 inline-flex rounded-full border-2 border-ink bg-white p-0.5 shadow-brut">
          <button
            className={cn(
              "rounded-full px-4 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors",
              !mapView ? "bg-ink text-cream" : "text-ink/60",
            )}
            onClick={() => setMapView(false)}
          >
            List
          </button>
          <button
            className={cn(
              "rounded-full px-4 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors",
              mapView ? "bg-ink text-cream" : "text-ink/60",
            )}
            onClick={() => setMapView(true)}
          >
            Map
          </button>
        </div>
      </div>

      {mapView ? (
        <div className="mx-5 mt-4 grid h-[60vh] place-items-center rounded-2xl border-2 border-dashed border-ink/40 bg-white/40 font-mono text-[11px] uppercase tracking-widest text-ink/50">
          <div className="flex flex-col items-center gap-2">
            <MapPin className="size-5" />
            Map view coming online
          </div>
        </div>
      ) : (
        <ul className="mt-4 space-y-3 px-5">
          {(venues ?? []).map((v) => (
            <li key={v.id}>
              <Link to="/venue/$id" params={{ id: v.id }} className="group block">
                <BrandCard interactive className="flex gap-3 p-3">
                  <div className="size-16 shrink-0 overflow-hidden rounded-xl border-2 border-ink bg-muted">
                    {(v.hero_image_url || v.image_url) && (
                      <img
                        src={v.hero_image_url || v.image_url || ""}
                        alt={v.name}
                        className="size-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-1 font-display text-base font-bold">{v.name}</div>
                    <div className="line-clamp-1 font-mono text-[10px] uppercase tracking-wider text-ink/60">
                      {v.category}
                      {v.neighborhood ? ` · ${v.neighborhood}` : ""}
                      {v.city ? ` · ${v.city}` : ""}
                    </div>
                    <div className="mt-1 font-mono text-[10px] font-bold uppercase tracking-widest text-coral">
                      {"$".repeat(Math.max(1, Math.min(4, v.price_level ?? 2)))}
                    </div>
                  </div>
                </BrandCard>
              </Link>
            </li>
          ))}
          {!venues?.length && (
            <li className="rounded-2xl border-2 border-dashed border-ink/30 p-6 text-center font-mono text-[11px] uppercase tracking-widest text-ink/50">
              No venues match yet.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
