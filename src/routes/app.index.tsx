import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, MapPin, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MobileHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/lib/auth-context";
import { usePageview, trackEngagement } from "@/lib/analytics";

export const Route = createFileRoute("/app/")({
  component: TonightFeedPage,
});

function TonightFeedPage() {
  const navigate = useNavigate();
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
    <div className="pb-6">
      <MobileHeader
        eyebrow="Tonight in your city"
        title="Looking good."
        right={<NotificationBell userId={user?.id} />}
      />

      <section className="px-5">
        <Card className="overflow-hidden border-none bg-gradient-to-br from-primary to-primary/70 p-5 text-primary-foreground shadow-lg">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest opacity-90">
            <Sparkles className="size-3.5" /> AI Planner
          </div>
          <h2 className="mt-2 text-xl font-bold">Want me to plan your night?</h2>
          <p className="mt-1 text-sm opacity-90">Two-tap itinerary, perfectly your vibe.</p>
          <Button asChild variant="secondary" className="mt-4 rounded-full">
            <Link to="/app/plan">Plan my night</Link>
          </Button>
        </Card>
      </section>

      <section className="mt-7">
        <SectionHeading icon={Flame} title="Trending venues" />
        <div className="-mx-1 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2">
          {(venues ?? []).map((v) => (
            <Link key={v.id} to="/venue/$id" params={{ id: v.id }} className="snap-start" onClick={() => trackEngagement("venue_tap", { venueId: v.id, venueName: v.name, source: "tonight_trending" })}>
              <div className="h-44 w-40 overflow-hidden rounded-2xl border border-border bg-muted">
                {(v.hero_image_url || v.image_url) && (
                  <img
                    src={v.hero_image_url || v.image_url || ""}
                    alt={v.name}
                    className="h-28 w-full object-cover"
                    loading="lazy"
                   decoding="async"/>
                )}
                <div className="p-3">
                  <div className="line-clamp-1 text-sm font-semibold">{v.name}</div>
                  <div className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                    {v.category}
                    {v.neighborhood ? ` · ${v.neighborhood}` : ""}
                  </div>
                </div>
              </div>
            </Link>
          ))}
          {!venues?.length && <Placeholder text="Trending venues will appear here" />}
        </div>
      </section>

      <section className="mt-6">
        <SectionHeading title="Reels you should see" />
        <div className="mt-3 flex gap-3 overflow-x-auto px-5 pb-2">
          {(reels ?? []).map((r) => (
            <div
              key={r.id}
              className="relative h-56 w-36 shrink-0 overflow-hidden rounded-2xl bg-muted"
            >
              {r.thumbnail_url && (
                <img
                  src={r.thumbnail_url}
                  alt={r.title ?? "Reel"}
                  className="size-full object-cover"
                  loading="lazy"
                 decoding="async"/>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-[11px] font-medium text-white">
                {r.title ?? "Untitled"}
              </div>
            </div>
          ))}
          {!reels?.length && <Placeholder text="No reels yet" />}
        </div>
      </section>

      <section className="mt-6 px-5">
        <SectionHeading title="Starting soon" />
        <div className="mt-3 space-y-3">
          {(events ?? []).map((e) => (
            <Card key={e.id} className="flex items-center gap-3 p-3">
              <div className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
                <MapPin className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="line-clamp-1 text-sm font-semibold">{e.title}</div>
                <div className="text-[11px] text-muted-foreground">
                  {new Date(e.starts_at).toLocaleString(undefined, {
                    weekday: "short",
                    hour: "numeric",
                    minute: "2-digit",
                  })}{" "}
                  · {e.venue_name ?? e.city}
                </div>
              </div>
            </Card>
          ))}
          {!events?.length && (
            <Card className="p-4 text-center text-sm text-muted-foreground">
              Nothing on the calendar yet.
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}

function SectionHeading({
  title,
  icon: Icon,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center gap-2 px-5">
      {Icon && <Icon className="size-4 text-primary" />}
      <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
    </div>
  );
}

function Placeholder({ text }: { text: string }) {
  return (
    <div className="grid h-44 w-full place-items-center rounded-2xl border border-dashed border-border text-xs text-muted-foreground">
      {text}
    </div>
  );
}
