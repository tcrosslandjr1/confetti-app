import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  Bookmark,
  CalendarCheck,
  Compass,
  Flame,
  Gift,
  MapPin,
  Sparkles,
  Sun,
  Trophy,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/portal/brief")({
  head: () => ({
    meta: [
      { title: "Your Daily Brief — Confetti" },
      {
        name: "description",
        content:
          "Your personal Confetti briefing: today's plan, points balance, nearby boosted venues, and what's worth booking next.",
      },
    ],
  }),
  component: PortalBriefPage,
});

function PortalBriefPage() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const today = new Date();
  const greeting =
    today.getHours() < 12 ? "Good morning" : today.getHours() < 18 ? "Good afternoon" : "Good evening";

  const { data: profile } = useQuery({
    enabled: !!userId,
    queryKey: ["portal", "brief", "profile", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles" as any)
        .select("display_name, confetti_pts, level, xp")
        .eq("id", userId!)
        .maybeSingle();
      return data as any;
    },
  });

  const { data: upcoming } = useQuery({
    enabled: !!userId,
    queryKey: ["portal", "brief", "upcoming", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("bookings" as any)
        .select("id, venue_name, party_size, starts_at")
        .eq("user_id", userId!)
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(3);
      return (data ?? []) as any[];
    },
  });

  const { data: boosted } = useQuery({
    queryKey: ["portal", "brief", "boosted"],
    queryFn: async () => {
      try {
        const { data } = await supabase
          .from("venues" as any)
          .select("id, name, neighborhood, city, cover_image_url, boost_tier")
          .gt("boost_until", new Date().toISOString())
          .eq("published", true)
          .limit(4);
        return (data ?? []) as any[];
      } catch {
        return [];
      }
    },
  });

  const { data: ledgerToday } = useQuery({
    enabled: !!userId,
    queryKey: ["portal", "brief", "ledger-today", userId],
    queryFn: async () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      try {
        const { data } = await supabase
          .from("confetti_ledger" as any)
          .select("amount, reason")
          .eq("user_id", userId!)
          .gte("created_at", start.toISOString());
        const total = (data ?? []).reduce((s: number, r: any) => s + (r.amount ?? 0), 0);
        return { total, count: data?.length ?? 0 };
      } catch {
        return { total: 0, count: 0 };
      }
    },
  });

  const stats = useMemo(
    () => [
      {
        label: "Confetti pts",
        value: profile?.confetti_pts ?? 0,
        icon: Sparkles,
        tone: "from-coral/25 to-coral/5",
      },
      {
        label: "Earned today",
        value: ledgerToday?.total ?? 0,
        icon: Gift,
        tone: "from-purple/25 to-purple/5",
      },
      {
        label: "Level",
        value: profile?.level ?? 1,
        icon: Trophy,
        tone: "from-gold/25 to-gold/5",
      },
      {
        label: "Upcoming",
        value: upcoming?.length ?? 0,
        icon: CalendarCheck,
        tone: "from-emerald-400/25 to-emerald-100/5",
      },
    ],
    [profile, ledgerToday, upcoming],
  );

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 pb-32">
      <header className="relative overflow-hidden rounded-3xl border-2 border-ink bg-gradient-to-br from-coral via-orange-400 to-gold p-6 shadow-brut">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute right-6 top-4 h-3 w-3 rotate-12 bg-cream/70" aria-hidden />
          <div className="absolute right-16 bottom-4 h-2 w-2 rotate-45 bg-ink/40" aria-hidden />
        </div>
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink/70">
          Daily Brief · {today.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
        </p>
        <h1 className="mt-1 font-display text-3xl font-extrabold leading-tight text-ink">
          {greeting}{profile?.display_name ? `, ${profile.display_name.split(" ")[0]}` : ""}.
        </h1>
        <p className="mt-1 text-sm text-ink/80">
          Here's your night at a glance — what's planned, what's hot, and what to book next.
        </p>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`rounded-2xl border-2 border-ink bg-gradient-to-br ${s.tone} p-3 shadow-brut`}
          >
            <s.icon className="h-4 w-4 text-ink" />
            <div className="mt-2 font-display text-2xl font-extrabold tabular-nums text-ink">
              {s.value.toLocaleString()}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink/70">
              {s.label}
            </div>
          </div>
        ))}
      </section>

      <section className="mt-6 rounded-2xl border-2 border-ink bg-cream p-5 shadow-brut">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-extrabold">Up next</h2>
          <Link to="/portal/bookings" className="text-xs font-bold text-coral hover:underline">
            All bookings →
          </Link>
        </div>
        {!upcoming || upcoming.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-ink/30 p-6 text-center text-sm text-muted-foreground">
            Nothing on the calendar.{" "}
            <Link to="/app/plan" className="font-bold text-coral hover:underline">
              Plan tonight →
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between rounded-xl border border-ink/15 bg-background p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{b.venue_name}</p>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                    Party of {b.party_size} ·{" "}
                    {new Date(b.starts_at).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <CalendarCheck className="h-4 w-4 text-coral" />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-2xl border-2 border-ink bg-cream p-5 shadow-brut">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-extrabold inline-flex items-center gap-2">
            <Flame className="h-4 w-4 text-coral" /> Hot tonight
          </h2>
          <Link to="/portal/viral" className="text-xs font-bold text-coral hover:underline">
            Viral now →
          </Link>
        </div>
        {!boosted || boosted.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No boosted venues right now. Check{" "}
            <Link to="/portal" className="font-bold text-coral hover:underline">
              Discover
            </Link>{" "}
            for picks.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {boosted.map((v) => (
              <Link
                key={v.id}
                to={"/venue/$id" as any}
                params={{ id: v.id } as never}
                className="group flex items-center gap-3 rounded-xl border border-ink/15 bg-background p-3 transition hover:-translate-y-0.5 hover:border-ink hover:shadow-brut"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-coral/15 text-coral">
                  <MapPin className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{v.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {v.neighborhood ?? v.city ?? "Featured"} · {v.boost_tier ?? "boosted"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { to: "/app/plan", label: "Plan a night", icon: Compass },
          { to: "/portal/saved", label: "Saved", icon: Bookmark },
          { to: "/passport", label: "Passport", icon: Sun },
          { to: "/portal/refer", label: "Refer & earn", icon: Gift },
        ].map((a) => (
          <Link
            key={a.to}
            to={a.to as any}
            className="flex items-center gap-2 rounded-xl border-2 border-ink bg-cream p-3 text-xs font-bold uppercase tracking-wider text-ink shadow-brut hover:-translate-y-0.5"
          >
            <a.icon className="h-3.5 w-3.5 text-coral" />
            {a.label}
          </Link>
        ))}
      </section>
    </div>
  );
}
