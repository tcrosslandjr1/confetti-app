import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, MapPin, Flame, ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHero, BrandCard, SectionTitle, BrutButton } from "@/components/PageHero";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/lib/auth-context";
import { usePageview, trackEngagement } from "@/lib/analytics";

export const Route = createFileRoute("/app/")({
  component: TonightFeedPage,
});

function TonightFeedPage() {
  const { user } = useAuth();
  const { data: venues } = useQuery({
    queryKey: ["app", "tonight", "venues"],
    queryFn: async () => {
      const { data } = await supabase
        .from("venues")
        .select("id,name,category,neighborhood,city,hero_image_url,image_url")
        .order("featured", { ascending: false })
        .limit(8);
      return data ?? [];
    },
  });

  const { data: reels } = useQuery({
    queryKey: ["app", "tonight", "reels"],
    queryFn: async () => {
      const { data } = await supabase
        .from("reels")
        .select("id,title,thumbnail_url,city,view_count")
        .eq("status", "published")
        .order("trending_score", { ascending: false })
        .limit(6);
      return data ?? [];
    },
  });

  const { data: events } = useQuery({
    queryKey: ["app", "tonight", "events"],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("id,title,starts_at,venue_name,city,image_url")
        .eq("status", "published")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at")
        .limit(4);
      return data ?? [];
    },
  });

  usePageview("app_tonight", "/app");

  return (
    <div className="pb-8">
      <PageHero
        eyebrow="Tonight // your city"
        badge="Live"
        title={
          <>
            Looking <span className="font-serif italic font-normal text-coral">good.</span>
          </>
        }
        subtitle="Hand-picked venues, fresh reels, and AI-built nights — all queued up."
        right={<NotificationBell userId={user?.id} />}
      >
        <BrandCard tone="coral" interactive className="relative">
          <div className="relative p-5">
            <div className="pointer-events-none absolute -right-6 -top-6 size-28 rounded-full bg-gold/40 blur-2xl" />
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] opacity-90">
              ✦ AI Planner
            </div>
            <h2 className="mt-2 font-display text-xl font-extrabold leading-tight">
              Want me to plan your night?
            </h2>
            <p className="mt-1 text-sm opacity-90">Two taps. Perfectly your vibe.</p>
            <BrutButton as={Link} to="/app/plan" tone="cream" className="mt-4">
              Plan my night <ArrowUpRight className="size-3.5" />
            </BrutButton>
          </div>
        </BrandCard>
      </PageHero>

      <section className="mt-6">
        <SectionTitle title="Trending venues" icon={Flame} action="See all ↗" />
        <div className="-mx-1 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-3">
          {(venues ?? []).map((v) => (
            <Link
              key={v.id}
              to="/venue/$id"
              params={{ id: v.id }}
              className="snap-start"
              onClick={() =>
                trackEngagement("venue_tap", {
                  venueId: v.id,
                  venueName: v.name,
                  source: "tonight_trending",
                })
              }
            >
              <BrandCard interactive className="h-44 w-40">
                <div className="h-24 w-full overflow-hidden border-b-2 border-ink bg-muted">
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
                <div className="p-3">
                  <div className="line-clamp-1 font-display text-sm font-bold">{v.name}</div>
                  <div className="mt-0.5 line-clamp-1 font-mono text-[10px] uppercase tracking-wider text-ink/60">
                    {v.category}
                    {v.neighborhood ? ` · ${v.neighborhood}` : ""}
                  </div>
                </div>
              </BrandCard>
            </Link>
          ))}
          {!venues?.length && <Placeholder text="Trending venues will appear here" />}
        </div>
      </section>

      <section className="mt-6">
        <SectionTitle title="Reels you should see" />
        <div className="mt-3 flex gap-3 overflow-x-auto px-5 pb-3">
          {(reels ?? []).map((r) => (
            <div
              key={r.id}
              className="relative h-56 w-36 shrink-0 overflow-hidden rounded-2xl border-2 border-ink bg-muted shadow-brut"
            >
              {r.thumbnail_url && (
                <img
                  src={r.thumbnail_url}
                  alt={r.title ?? "Reel"}
                  className="size-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-[11px] font-bold text-white">
                {r.title ?? "Untitled"}
              </div>
            </div>
          ))}
          {!reels?.length && <Placeholder text="No reels yet" />}
        </div>
      </section>

      <section className="mt-6 px-5">
        <SectionTitle title="Starting soon" />
        <div className="mt-3 space-y-3">
          {(events ?? []).map((e) => (
            <BrandCard key={e.id} interactive className="flex items-center gap-3 p-3">
              <div className="grid size-12 shrink-0 place-items-center rounded-xl border-2 border-ink bg-gold text-ink shadow-brut">
                <MapPin className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="line-clamp-1 font-display text-sm font-bold">{e.title}</div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-ink/60">
                  {new Date(e.starts_at).toLocaleString(undefined, {
                    weekday: "short",
                    hour: "numeric",
                    minute: "2-digit",
                  })}{" "}
                  · {e.venue_name ?? e.city}
                </div>
              </div>
            </BrandCard>
          ))}
          {!events?.length && (
            <BrandCard className="p-5 text-center text-sm text-ink/60">
              Nothing on the calendar yet.
            </BrandCard>
          )}
        </div>
      </section>
    </div>
  );
}

function Placeholder({ text }: { text: string }) {
  return (
    <div className="grid h-44 w-full place-items-center rounded-2xl border-2 border-dashed border-ink/30 font-mono text-[11px] uppercase tracking-widest text-ink/40">
      {text}
    </div>
  );
}
