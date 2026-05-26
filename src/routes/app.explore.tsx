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

  // Best-effort default city for discovery — falls back to Washington if
  // we can't read one from the active loop / user prefs.
  const cityHint = "Washington";

  // Explore reads through the venue-discovery-agent edge function so it
  // (a) uses service-role internally (anon RLS on venues is restrictive)
  // and (b) lazily ingests fresh venues via Claude when the city is sparse.
  const { data: venues } = useQuery({
    queryKey: ["app", "explore", q, cat, cityHint],
    queryFn: async () => {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      if (!url || !key) return [];
      const res = await fetch(`${url}/functions/v1/venue-discovery-agent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({ city: cityHint, minThreshold: 20, requestCount: 25 }),
      });
      if (!res.ok) return [];
      const data = (await res.json()) as {
        venues?: Array<{
          id: string;
          name: string;
          cuisine: string | null;
          neighborhood: string | null;
          city: string;
          photo_url: string | null;
          price_level: number | null;
          price: string | null;
          vibe_tags: string[] | null;
        }>;
      };
      let list = data.venues ?? [];
      // Hide partial-seed placeholder rows.
      list = list.filter((v) => v.name && !v.name.startsWith("(") && !v.name.includes("Pinned"));
      // Client-side filter for search + category since the agent doesn't
      // know about them yet — keeps the query stable while sparse.
      const qLower = q.toLowerCase();
      if (qLower) {
        list = list.filter(
          (v) =>
            v.name.toLowerCase().includes(qLower) ||
            (v.cuisine ?? "").toLowerCase().includes(qLower) ||
            (v.neighborhood ?? "").toLowerCase().includes(qLower),
        );
      }
      if (cat) {
        const c = cat.toLowerCase();
        list = list.filter((v) =>
          (v.vibe_tags ?? []).some((t) => t.toLowerCase().includes(c)) ||
          (v.cuisine ?? "").toLowerCase().includes(c),
        );
      }
      return list.slice(0, 60);
    },
    staleTime: 60_000,
  });


  return (
    <div className="pb-6">
      <MobileHeader eyebrow="Explore" title="Find your spot" right={<NotificationBell userId={user?.id} />} />

      <div className="px-5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-cream/35" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search venues, vibes, neighborhoods"
            className="h-12 rounded-xl border border-cream/20 bg-cream/5 pl-10 pr-12 text-cream placeholder:text-cream/30 focus:border-coral"
          />
          <button
            onClick={() => setMapView((v) => !v)}
            className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg bg-cream/10 text-cream/60 transition-colors hover:bg-cream/15 hover:text-cream"
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
                "shrink-0 rounded-full border px-3.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-all duration-200 active:scale-[0.97]",
                cat === c.key
                  ? "border-coral bg-coral text-cream shadow-sm"
                  : "border-cream/15 bg-cream/5 text-cream/60 hover:border-cream/25 hover:text-cream",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-1 rounded-lg bg-cream/5 p-1">
          <button
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-all duration-200",
              !mapView ? "bg-coral text-cream shadow-sm" : "text-cream/40 hover:text-cream/60",
            )}
            onClick={() => setMapView(false)}
          >
            List
          </button>
          <button
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-all duration-200",
              mapView ? "bg-coral text-cream shadow-sm" : "text-cream/40 hover:text-cream/60",
            )}
            onClick={() => setMapView(true)}
          >
            Map
          </button>
        </div>
      </div>

      {mapView ? (
        <div className="mx-5 mt-4 grid h-[60vh] place-items-center rounded-2xl border-2 border-dashed border-cream/10 bg-cream/[0.03]">
          <div className="flex flex-col items-center gap-2.5">
            <div className="grid size-11 place-items-center rounded-xl bg-cream/[0.06]">
              <MapPin className="size-5 text-cream/30" />
            </div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-cream/30">Map view coming online</span>
          </div>
        </div>
      ) : (
        <ul className="mt-4 space-y-2.5 px-5">
          {(venues ?? []).map((v, i) => (
            <Reveal key={v.id} as="li" delay={i * 60}>
              <Link
                to="/venue/$id"
                params={{ id: v.id }}
                className="flex gap-3.5 rounded-2xl border border-cream/10 bg-cream/5 p-3 shadow-card transition-all duration-200 active:scale-[0.97] hover:shadow-card-hover"
              >
                <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-cream/[0.04]">
                  {v.photo_url && (
                    <img
                      src={v.photo_url}
                      alt={v.name}
                      className="size-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-1 font-display text-[14px] font-bold tracking-tight text-cream">{v.name}</div>
                  <div className="mt-0.5 line-clamp-1 font-mono text-[10px] uppercase tracking-wide text-cream/45">
                    {v.cuisine}
                    {v.neighborhood ? ` · ${v.neighborhood}` : ""}
                    {v.city ? ` · ${v.city}` : ""}
                  </div>
                  <div className="mt-1 font-mono text-[11px] font-bold tracking-wider text-cream/35">
                    {v.price ?? "$".repeat(Math.max(1, Math.min(4, v.price_level ?? 2)))}
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
          {!venues?.length && (
            <li className="rounded-2xl border-2 border-dashed border-cream/10 bg-cream/[0.03] p-6 text-center">
              <span className="font-mono text-[10px] uppercase tracking-widest text-cream/30">No venues match yet</span>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
