import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, MapPin, Flame, Zap, ArrowRight, Users, ChevronRight } from "lucide-react";
import { VenueFlipCard } from "@/components/VenueFlipCard";
import type { FlipVenue } from "@/components/VenueFlipCard";
import { supabase } from "@/integrations/supabase/client";
import { MobileHeader } from "@/components/AppShell";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/lib/auth-context";
import { usePageview, trackEngagement } from "@/lib/analytics";
import { useEffect } from "react";
import { toast } from "sonner";
import { Reveal } from "@/components/Reveal";
import { fetchFeedRecommendations, getUserLocation } from "@/lib/agents/feed-recommendations";
import { getSelectedCity, DEFAULT_CITY } from "@/lib/cities";
import type { FeedVenue } from "@/lib/agents/feed-recommendations";
import { WhyThisPick } from "@/components/WhyThisPick";
import type { PickSignal } from "@/components/WhyThisPick";

export const Route = createFileRoute("/app/")({
  component: TonightFeedPage,
  validateSearch: (s: Record<string, unknown>) => ({
    message: typeof s.message === "string" ? s.message : undefined,
  }),
});

function TonightFeedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { message } = Route.useSearch();
  const selectedCity = getSelectedCity() ?? DEFAULT_CITY;

  useEffect(() => {
    if (message) toast.info(message);
  }, [message]);

  const { data: trendingVenues } = useQuery({
    queryKey: ["app", "tonight", "trending", selectedCity.slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("viral_venues")
        .select("id,venue_name,neighborhood,city,photo_url,rating,tags,trend_score,summary")
        .eq("verified", true)
        .ilike("city", `%${selectedCity.name}%`)
        .order("trend_score", { ascending: false })
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

  // AI-powered personalized picks from Claude
  const { data: aiPicks, isLoading: aiLoading } = useQuery({
    queryKey: ["app", "tonight", "ai-picks", user?.id, selectedCity.slug],
    queryFn: async () => {
      const loc = await getUserLocation();
      const city = getSelectedCity() ?? DEFAULT_CITY;
      const feed = await fetchFeedRecommendations({
        lat: loc?.lat ?? city.lat,
        lng: loc?.lng ?? city.lng,
        city: city.name,
        sections: ["picks", "surprise"],
        limit: 4,
      });
      return [...(feed.picks ?? []), ...(feed.surprise ?? [])].slice(0, 6);
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });

  usePageview("app_tonight", "/app");

  return (
    <div className="pb-6">
      <MobileHeader
        eyebrow="Tonight in your city"
        title="Looking good."
        right={<NotificationBell userId={user?.id} />}
      />

      {/* ── AI Planner Card ─────────────────────────────────── */}
      <Reveal delay={80}>
      <section className="px-5 pt-1 space-y-3">
        <div className="relative overflow-hidden rounded-2xl border-2 border-ink bg-gold p-5 shadow-brut">
          <div className="relative">
            <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-ink/70">
              <Sparkles className="size-3.5" /> AI Planner
            </div>
            <h2 className="mt-2.5 font-display text-xl font-extrabold tracking-tight text-ink">Want me to plan your night?</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-ink/60">Two-tap itinerary, perfectly your vibe.</p>
            <Link
              to="/app/plan"
              className="mt-4 inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-ink px-5 py-2.5 font-display text-sm font-bold text-cream shadow-brut transition-all active:scale-[0.97] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Plan my night <ArrowRight className="size-4" strokeWidth={2.5} />
            </Link>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border-2 border-ink bg-coral p-5 shadow-brut">
          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-cream/80">
                <Sparkles className="size-3.5" /> Stay In · Host · Outdoor
              </div>
              <h2 className="mt-2.5 font-display text-xl font-extrabold tracking-tight text-cream">Plan a hangout.</h2>
              <p className="mt-1 text-[13px] leading-relaxed text-cream/70">
                Crabs, game night, cookout — sorted.
              </p>
            </div>
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-cream/20">
              <Users className="size-6 text-cream" strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </section>
      </Reveal>

      {/* ── Trending Venues ─────────────────────────────────── */}
      <Reveal delay={200}>
      <section className="mt-8">
        <SectionHeading icon={Flame} title="Trending venues" />
        <div className="mt-3.5 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-pl-5 px-5 pb-2 scrollbar-none">
          {(trendingVenues ?? []).map((v) => (
            <VenueFlipCard
              key={v.id}
              venue={{
                id: v.id,
                name: v.venue_name,
                category: (v.tags?.[0] ?? "hotspot"),
                neighborhood: v.neighborhood,
                photo: v.photo_url,
                rating: v.rating,
                vibe: v.summary?.slice(0, 60) ?? "Trending now",
                reason: `Trend score: ${v.trend_score}`,
              }}
              widthClass="w-44"
              source="tonight_trending"
              accent="coral"
            />
          ))}
          {!trendingVenues?.length && <Placeholder text="Trending venues will appear here" />}
        </div>
      </section>
      </Reveal>

      {/* ── For You (AI picks) ──────────────────────────────── */}
      <Reveal delay={280}>
      <section className="mt-8">
        <SectionHeading icon={Zap} title="For you" />
        <div className="mt-3.5 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-pl-5 px-5 pb-2 scrollbar-none">
          {aiLoading && (
            <div className="grid h-52 w-full place-items-center rounded-2xl border-2 border-dashed border-purple/30 bg-purple/5">
              <div className="flex flex-col items-center gap-2">
                <Sparkles className="size-5 animate-pulse text-purple" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-purple/60">Finding your vibe…</span>
              </div>
            </div>
          )}
          {!aiLoading && (aiPicks ?? []).map((v: FeedVenue) => (
            <VenueFlipCard
              key={v.id}
              venue={{
                id: v.id,
                name: v.venue,
                category: v.category,
                neighborhood: v.neighborhood,
                photo: v.photo,
                rating: v.rating,
                priceLevel: v.priceLevel,
                vibe: v.vibe,
                reason: v.reason,
                address: v.address,
                sponsored: v.sponsored,
                partnerLabel: v.partnerLabel,
                boostCampaignId: v.boostCampaignId,
                verified: v.verified,
              }}
              widthClass="w-44"
              source="tonight_for_you"
              accent="purple"
            />
          ))}
          {!aiLoading && !aiPicks?.length && (
            <div className="grid h-52 w-full place-items-center rounded-2xl border-2 border-dashed border-purple/20 bg-purple/5">
              <div className="flex flex-col items-center gap-2 px-6 text-center">
                <Sparkles className="size-5 text-purple/40" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-ink/30">Personalized picks coming soon</span>
              </div>
            </div>
          )}
        </div>
      </section>
      </Reveal>

      {/* ── Surprise Me ─────────────────────────────────────── */}
      <Reveal delay={340}>
        <section className="mt-8 px-5">
          <div
            className="relative cursor-pointer overflow-hidden rounded-2xl border-2 border-ink bg-ink p-5 shadow-brut transition-all active:scale-[0.98] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            onClick={() => {
              trackEngagement("surprise_me_tap", { source: "tonight_feed" });
              navigate({ to: "/app/plan", search: { mode: "surprise" } });
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-gold">
                  <Sparkles className="size-3.5" /> Surprise Me
                </div>
                <h2 className="mt-2 font-display text-lg font-extrabold tracking-tight text-cream">
                  Feeling adventurous?
                </h2>
                <p className="mt-1 text-[13px] leading-relaxed text-cream/60">
                  Spots you'd never find on your own.
                </p>
              </div>
              <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-coral">
                <Zap className="size-7 text-cream" strokeWidth={2.5} />
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── Reels ───────────────────────────────────────────── */}
      <Reveal delay={400}>
      <section className="mt-8">
        <SectionHeading title="Reels you should see" />
        <div className="mt-3.5 flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-none">
          {(reels ?? []).map((r) => (
            <Link
              key={r.id}
              to="/app/reels"
              className="relative h-56 w-36 shrink-0 overflow-hidden rounded-2xl border-2 border-ink bg-cream shadow-brut transition-all duration-200 active:scale-[0.97]"
              onClick={() => trackEngagement("reel_tap", { reelId: r.id, reelTitle: r.title, source: "tonight_reels" })}
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
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-3 pb-3 pt-8">
                <div className="font-display text-[12px] font-bold leading-snug text-cream">
                  {r.title ?? "Untitled"}
                </div>
              </div>
            </Link>
          ))}
          {!reels?.length && <Placeholder text="No reels yet" />}
        </div>
      </section>
      </Reveal>

      {/* ── Starting Soon ───────────────────────────────────── */}
      <Reveal delay={520}>
      <section className="mt-8 px-5">
        <SectionHeading title="Starting soon" />
        <div className="mt-3.5 space-y-2.5">
          {(events ?? []).map((e) => (
            <Link key={e.id} to="/events/$eventId" params={{ eventId: e.id }} onClick={() => trackEngagement("event_tap", { eventId: e.id, eventTitle: e.title, source: "tonight_starting_soon" })}>
              <div className="flex items-center gap-3.5 rounded-2xl border-2 border-ink bg-white p-3.5 shadow-brut">
                <div className="grid size-11 shrink-0 place-items-center rounded-xl border-2 border-ink bg-coral/10 text-coral">
                  <MapPin className="size-[18px]" strokeWidth={2.25} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-1 font-display text-[14px] font-bold tracking-tight text-ink">{e.title}</div>
                  <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-ink/45">
                    {new Date(e.starts_at).toLocaleString(undefined, {
                      weekday: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    })}{" "}
                    · {e.venue_name ?? e.city}
                  </div>
                </div>
                <ChevronRight className="size-5 text-ink/30" />
              </div>
            </Link>
          ))}
          {!events?.length && (
            <div className="rounded-2xl border-2 border-dashed border-ink/20 bg-white p-5 text-center">
              <p className="font-mono text-[11px] uppercase tracking-widest text-ink/35">Nothing on the calendar yet</p>
            </div>
          )}
        </div>
      </section>
      </Reveal>
    </div>
  );
}

function SectionHeading({
  title,
  icon: Icon,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}) {
  return (
    <div className="flex items-center gap-2 px-5">
      {Icon && <Icon className="size-4 text-coral" strokeWidth={2.5} />}
      <h3 className="font-display text-[15px] font-extrabold tracking-tight text-ink">{title}</h3>
    </div>
  );
}

function Placeholder({ text }: { text: string }) {
  return (
    <div className="grid h-44 w-full place-items-center rounded-2xl border-2 border-dashed border-ink/15 bg-white">
      <span className="font-mono text-[10px] uppercase tracking-widest text-ink/30">{text}</span>
    </div>
  );
}
