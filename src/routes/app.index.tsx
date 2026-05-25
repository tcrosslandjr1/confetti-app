import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, MapPin, Flame, Zap } from "lucide-react";
import { VenueFlipCard } from "@/components/VenueFlipCard";
import type { FlipVenue } from "@/components/VenueFlipCard";
import { supabase } from "@/integrations/supabase/client";
import { MobileHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/lib/auth-context";
import { usePageview, trackEngagement } from "@/lib/analytics";
import { Reveal } from "@/components/Reveal";
import { fetchFeedRecommendations, getUserLocation } from "@/lib/agents/feed-recommendations";
import type { FeedVenue } from "@/lib/agents/feed-recommendations";
import { WhyThisPick } from "@/components/WhyThisPick";
import type { PickSignal } from "@/components/WhyThisPick";

export const Route = createFileRoute("/app/")({
  component: TonightFeedPage,
});

function TonightFeedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: trendingVenues } = useQuery({
    queryKey: ["app", "tonight", "trending"],
    queryFn: async () => {
      const { data } = await supabase
        .from("viral_venues")
        .select("id,venue_name,neighborhood,city,photo_url,rating,tags,trend_score,summary")
        .eq("verified", true)
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
    queryKey: ["app", "tonight", "ai-picks", user?.id],
    queryFn: async () => {
      const loc = await getUserLocation();
      const feed = await fetchFeedRecommendations({
        lat: loc?.lat,
        lng: loc?.lng,
        city: "Washington DC",
        sections: ["picks", "surprise"],
        limit: 4,
      });
      return [...(feed.picks ?? []), ...(feed.surprise ?? [])].slice(0, 6);
    },
    staleTime: 5 * 60_000, // cache for 5 min
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

      <Reveal delay={80}>
      <section className="px-5 pt-1 space-y-3">
        <Card className="relative overflow-hidden border-2 border-ink bg-ink p-5 text-cream shadow-brut-lg">
          <div className="absolute -right-6 -top-6 size-28 rounded-full bg-gold/15 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-gold">
              <Sparkles className="size-3.5" /> AI Planner
            </div>
            <h2 className="mt-2.5 font-display text-xl font-extrabold tracking-tight text-cream">Want me to plan your night?</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-cream/70">Two-tap itinerary, perfectly your vibe.</p>
            <Button asChild variant="gold" size="sm" className="mt-4">
              <Link to="/app/plan">Plan my night</Link>
            </Button>
          </div>
        </Card>

        <Card className="relative overflow-hidden border-2 border-ink bg-cream p-5 shadow-brut">
          <div className="absolute -right-10 -bottom-10 size-32 rounded-full bg-coral/20 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-coral">
              <Sparkles className="size-3.5" /> Stay In · Host · Outdoor
            </div>
            <h2 className="mt-2.5 font-display text-xl font-extrabold tracking-tight text-ink">Plan a hangout.</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-ink/70">
              Crabs in the backyard, game night, cookout, picnic — menu, supplies, timeline, all sorted.
            </p>
            <Button asChild variant="default" size="sm" className="mt-4">
              <Link to="/app/plan">Plan a hangout</Link>
            </Button>
          </div>
        </Card>
      </section>
      </Reveal>

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

      <Reveal delay={280}>
      <section className="mt-8">
        <SectionHeading icon={Zap} title="For you" />
        <div className="mt-3.5 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-pl-5 px-5 pb-2 scrollbar-none">
          {aiLoading && (
            <div className="grid h-52 w-full place-items-center rounded-2xl border-2 border-dashed border-purple/20 bg-purple/[0.03]">
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
            <div className="grid h-52 w-full place-items-center rounded-2xl border-2 border-dashed border-purple/15 bg-surface-1">
              <div className="flex flex-col items-center gap-2 px-6 text-center">
                <Sparkles className="size-5 text-purple/40" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-ink/30">Personalized picks coming soon</span>
              </div>
            </div>
          )}
        </div>
      </section>
      </Reveal>

      <Reveal delay={340}>
        <section className="mt-8 px-5">
          <Card
            className="relative cursor-pointer overflow-hidden border-2 border-coral bg-gradient-to-br from-coral/10 via-cream to-gold/10 p-5 shadow-brut-lg transition-all active:scale-[0.98]"
            onClick={() => {
              trackEngagement("surprise_me_tap", { source: "tonight_feed" });
              navigate({ to: "/app/plan", search: { mode: "surprise" } });
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-coral">
                  <Sparkles className="size-3.5" /> Surprise Me
                </div>
                <h2 className="mt-2 font-display text-lg font-extrabold tracking-tight text-ink">
                  Feeling adventurous?
                </h2>
                <p className="mt-1 text-[13px] leading-relaxed text-ink/60">
                  We'll pick trending spots you'd never find on your own.
                </p>
              </div>
              <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-coral/15">
                <Zap className="size-7 text-coral" strokeWidth={2} />
              </div>
            </div>
          </Card>
        </section>
      </Reveal>

      <Reveal delay={400}>
      <section className="mt-8">
        <SectionHeading title="Reels you should see" />
        <div className="mt-3.5 flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-none">
          {(reels ?? []).map((r) => (
            <Link
              key={r.id}
              to="/app/reels"
              className="relative h-56 w-36 shrink-0 overflow-hidden rounded-2xl border-2 border-ink/8 bg-ink/[0.04] shadow-card transition-all duration-200 active:scale-[0.97] hover:shadow-card-hover"
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
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-3 pt-8">
                <div className="font-display text-[12px] font-bold leading-snug text-white">
                  {r.title ?? "Untitled"}
                </div>
              </div>
            </Link>
          ))}
          {!reels?.length && <Placeholder text="No reels yet" />}
        </div>
      </section>
      </Reveal>

      <Reveal delay={520}>
      <section className="mt-8 px-5">
        <SectionHeading title="Starting soon" />
        <div className="mt-3.5 space-y-2.5">
          {(events ?? []).map((e) => (
            <Link key={e.id} to="/events/$eventId" params={{ eventId: e.id }} onClick={() => trackEngagement("event_tap", { eventId: e.id, eventTitle: e.title, source: "tonight_starting_soon" })}>
              <Card className="flex items-center gap-3.5 p-3.5">
                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-coral/10 text-coral">
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
              </Card>
            </Link>
          ))}
          {!events?.length && (
            <Card className="p-5 text-center">
              <p className="font-mono text-[11px] uppercase tracking-widest text-ink/35">Nothing on the calendar yet</p>
            </Card>
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
    <div className="grid h-44 w-full place-items-center rounded-2xl border-2 border-dashed border-ink/10 bg-surface-1">
      <span className="font-mono text-[10px] uppercase tracking-widest text-ink/30">{text}</span>
    </div>
  );
}
