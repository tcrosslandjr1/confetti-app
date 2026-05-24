import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MobileHeader } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/lib/auth-context";
import { usePageview, trackEngagement } from "@/lib/analytics";
import { Reveal } from "@/components/Reveal";

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
    <div className="pb-6">
      <MobileHeader eyebrow="Explore" title="Find your spot" right={<NotificationBell userId={user?.id} />} />

      <div className="px-5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink/35" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search venues, vibes, neighborhoods"
            className="h-12 rounded-xl pl-10 pr-12"
          />
          <button
            onClick={() => setMapView((v) => !v)}
            className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg bg-surface-2 text-ink/60 transition-colors hover:bg-surface-3 hover:text-ink"
            aria-label="Toggle filters"
          >
            <SlidersHorizontal className="size-4" />
          </button>
        </div>

        <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-2 scrollbar-none">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setCat(cat === c.key ? null : c.key)}
              className={cn(
                "shrink-0 rounded-full border-2 px-3.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-all duration-200 active:scale-[0.97]",
                cat === c.key
                  ? "border-ink bg-ink text-cream shadow-sm"
                  : "border-ink/12 bg-surface-1 text-ink/60 hover:border-ink/25 hover:text-ink",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-1 rounded-lg bg-surface-2 p-1">
          <button
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-all duration-200",
              !mapView ? "bg-ink text-cream shadow-sm" : "text-ink/40 hover:text-ink/60",
            )}
            onClick={() => setMapView(false)}
          >
            List
          </button>
          <button
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-all duration-200",
              mapView ? "bg-ink text-cream shadow-sm" : "text-ink/40 hover:text-ink/60",
            )}
            onClick={() => setMapView(true)}
          >
            Map
          </button>
        </div>
      </div>

      {mapView ? (
        <div className="mx-5 mt-4 grid h-[60vh] place-items-center rounded-2xl border-2 border-dashed border-ink/10 bg-surface-1">
          <div className="flex flex-col items-center gap-2.5">
            <div className="grid size-11 place-items-center rounded-xl bg-ink/[0.06]">
              <MapPin className="size-5 text-ink/30" />
            </div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink/30">Map view coming online</span>
          </div>
        </div>
      ) : (
        <ul className="mt-4 space-y-2.5 px-5">
          {(venues ?? []).map((v, i) => (
            <Reveal key={v.id} as="li" delay={i * 60}>
              <Link
                to="/venue/$id"
                params={{ id: v.id }}
                className="flex gap-3.5 rounded-2xl border-2 border-ink/8 bg-surface-1 p-3 shadow-card transition-all duration-200 active:scale-[0.97] hover:shadow-card-hover"
              >
                <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-ink/[0.04]">
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
                  <div className="line-clamp-1 font-display text-[14px] font-bold tracking-tight text-ink">{v.name}</div>
                  <div className="mt-0.5 line-clamp-1 font-mono text-[10px] uppercase tracking-wide text-ink/45">
                    {v.category}
                    {v.neighborhood ? ` · ${v.neighborhood}` : ""}
                    {v.city ? ` · ${v.city}` : ""}
                  </div>
                  <div className="mt-1 font-mono text-[11px] font-bold tracking-wider text-ink/35">
                    {"$".repeat(Math.max(1, Math.min(4, v.price_level ?? 2)))}
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
          {!venues?.length && (
            <li className="rounded-2xl border-2 border-dashed border-ink/10 bg-surface-1 p-6 text-center">
              <span className="font-mono text-[10px] uppercase tracking-widest text-ink/30">No venues match yet</span>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
