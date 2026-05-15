import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { MOODS, TRENDING_PICKS, rankName, levelFromXp } from "@/lib/concierge-data";
import { getSelectedCity, DEFAULT_CITY, subscribeSelectedCity, type City } from "@/lib/cities";
import { Compass, MapPin, MessageCircle, Sparkles, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/concierge/")({
  head: () => ({ meta: [{ title: "Concierge — Home" }] }),
  component: ConciergeHome,
});

function ConciergeHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ display_name: string | null; xp: number } | null>(null);
  const [city, setCity] = useState<City>(() => getSelectedCity() ?? DEFAULT_CITY);

  useEffect(() => {
    const sync = () => setCity(getSelectedCity() ?? DEFAULT_CITY);
    sync();
    return subscribeSelectedCity(sync);
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name,xp")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setProfile(data as any));
  }, [user]);

  const startMoodChat = async (moodId: string, label: string) => {
    if (!user) return;
    const { data: thread } = await supabase
      .from("threads")
      .insert({ user_id: user.id, title: label })
      .select()
      .single();
    if (thread) {
      const seed = `I'm in the mood for ${label.toLowerCase()}. Give me 3 spots in ${city.name} that fit and tell me why.`;
      navigate({
        to: "/concierge/chat/$threadId",
        params: { threadId: thread.id },
        search: { seed } as any,
      });
    }
  };

  const xp = profile?.xp ?? 0;
  const level = levelFromXp(xp);

  return (
    <div className="px-5 pt-10">
      {/* greeting */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Tonight in {city.name}
          </div>
          <h1 className="mt-1 font-display text-3xl font-bold leading-tight">
            Hey {profile?.display_name?.trim().split(" ")[0] || "friend"}{" "}
            <span className="text-gradient">👋</span>
          </h1>
        </div>
        <div className="rounded-2xl border border-border bg-card px-3 py-2 text-right">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Lvl {level}
          </div>
          <div className="text-xs font-semibold">{rankName(level)}</div>
        </div>
      </div>

      {/* Mood picker */}
      <div className="mt-7">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Pick a vibe</h2>
          <span className="text-xs text-muted-foreground">Tap to start</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {MOODS.map((m) => (
            <button
              key={m.id}
              onClick={() => startMoodChat(m.id, m.label)}
              className={`group relative aspect-[5/6] overflow-hidden rounded-3xl p-4 text-left text-primary-foreground shadow-card transition-pop active:scale-95 ${m.gradient}`}
            >
              <div className="text-3xl">{m.emoji}</div>
              <div className="absolute inset-x-4 bottom-4">
                <div className="font-display text-xl font-bold leading-tight">{m.label}</div>
                <div className="mt-1 text-[11px] opacity-90">{m.blurb}</div>
              </div>
              <div className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-black/20 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-8 grid grid-cols-2 gap-3">
        <QuickCard
          icon={<MessageCircle className="h-4 w-4" />}
          title="Ask me anything"
          sub="Like a friend who knows every spot"
          onClick={() => navigate({ to: "/concierge/chat" })}
        />
        <QuickCard
          icon={<MapPin className="h-4 w-4" />}
          title="Near me"
          sub="What's open right now"
          onClick={async () => {
            if (!user) return;
            const { data } = await supabase
              .from("threads")
              .insert({ user_id: user.id, title: "Near me" })
              .select()
              .single();
            if (data)
              navigate({
                to: "/concierge/chat/$threadId",
                params: { threadId: data.id },
                search: {
                  seed: `Find me 3 great spots open right now within 10 minutes of downtown ${city.name}.`,
                } as any,
              });
          }}
        />
        <QuickCard
          icon={<Compass className="h-4 w-4" />}
          title="Surprise me"
          sub="Something you've never tried"
          onClick={async () => {
            if (!user) return;
            const { data } = await supabase
              .from("threads")
              .insert({ user_id: user.id, title: "Surprise me" })
              .select()
              .single();
            if (data)
              navigate({
                to: "/concierge/chat/$threadId",
                params: { threadId: data.id },
                search: {
                  seed: `Surprise me with a hidden-gem night in ${city.name} I probably haven't tried.`,
                } as any,
              });
          }}
        />
        <QuickCard
          icon={<TrendingUp className="h-4 w-4" />}
          title="Book tonight"
          sub="Walk-in & last-minute spots"
          onClick={async () => {
            if (!user) return;
            const { data } = await supabase
              .from("threads")
              .insert({ user_id: user.id, title: "Book tonight" })
              .select()
              .single();
            if (data)
              navigate({
                to: "/concierge/chat/$threadId",
                params: { threadId: data.id },
                search: {
                  seed: "Book me something for tonight — what walk-in friendly spots should I try?",
                } as any,
              });
          }}
        />
      </div>

      {/* Trending */}
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Trending tonight</h2>
        </div>
        <div className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto -mx-5 px-5 pb-2">
          {TRENDING_PICKS.map((p) => (
            <div
              key={p.name}
              className="snap-start min-w-[70%] rounded-3xl border border-border bg-card p-4 shadow-card"
            >
              <div className="text-3xl">{p.emoji}</div>
              <div className="mt-3 font-display text-lg font-bold leading-tight">{p.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {p.category} · {p.neighborhood}
              </div>
              <button
                onClick={async () => {
                  if (!user) return;
                  const { data } = await supabase
                    .from("threads")
                    .insert({ user_id: user.id, title: p.name })
                    .select()
                    .single();
                  if (data)
                    navigate({
                      to: "/concierge/chat/$threadId",
                      params: { threadId: data.id },
                      search: {
                        seed: `Tell me about ${p.name} in ${p.neighborhood} and give me 2 similar spots.`,
                      } as any,
                    });
                }}
                className="mt-3 inline-flex rounded-full bg-gradient-vibe px-3 py-1.5 text-xs font-semibold text-primary-foreground"
              >
                Ask the concierge →
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuickCard({
  icon,
  title,
  sub,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-start gap-2 rounded-2xl border border-border bg-card p-4 text-left shadow-card transition-pop active:scale-95"
    >
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-cool text-primary-foreground">
        {icon}
      </span>
      <div className="font-semibold">{title}</div>
      <div className="text-[11px] text-muted-foreground">{sub}</div>
    </button>
  );
}
