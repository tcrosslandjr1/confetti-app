import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MobileHeader } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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
      <MobileHeader eyebrow="Explore" title="Find your spot" />

      <div className="px-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search venues, vibes, neighborhoods"
            className="h-11 rounded-full pl-10 pr-12"
          />
          <button
            onClick={() => setMapView((v) => !v)}
            className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-muted text-foreground"
            aria-label="Toggle filters"
          >
            <SlidersHorizontal className="size-4" />
          </button>
        </div>

        <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setCat(cat === c.key ? null : c.key)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                cat === c.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-muted",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between text-xs">
          <button
            className={cn(
              "rounded-full px-3 py-1 font-medium",
              !mapView ? "bg-foreground text-background" : "text-muted-foreground",
            )}
            onClick={() => setMapView(false)}
          >
            List
          </button>
          <button
            className={cn(
              "rounded-full px-3 py-1 font-medium",
              mapView ? "bg-foreground text-background" : "text-muted-foreground",
            )}
            onClick={() => setMapView(true)}
          >
            Map
          </button>
        </div>
      </div>

      {mapView ? (
        <div className="mx-5 mt-4 grid h-[60vh] place-items-center rounded-3xl border border-dashed border-border bg-muted/40 text-sm text-muted-foreground">
          <div className="flex flex-col items-center gap-2">
            <MapPin className="size-5" />
            Map view coming online
          </div>
        </div>
      ) : (
        <ul className="mt-4 space-y-3 px-5">
          {(venues ?? []).map((v) => (
            <li key={v.id}>
              <Link
                to="/venue/$id"
                params={{ id: v.id }}
                className="flex gap-3 rounded-2xl border border-border bg-card p-3"
              >
                <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {(v.hero_image_url || v.image_url) && (
                    <img
                      src={v.hero_image_url || v.image_url || ""}
                      alt={v.name}
                      className="size-full object-cover"
                      loading="lazy"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-1 font-semibold">{v.name}</div>
                  <div className="line-clamp-1 text-xs text-muted-foreground">
                    {v.category}
                    {v.neighborhood ? ` · ${v.neighborhood}` : ""}
                    {v.city ? ` · ${v.city}` : ""}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {"$".repeat(Math.max(1, Math.min(4, v.price_level ?? 2)))}
                  </div>
                </div>
              </Link>
            </li>
          ))}
          {!venues?.length && (
            <li className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No venues match yet.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
