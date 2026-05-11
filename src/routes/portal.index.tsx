import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Sparkles,
  MapPin,
  ArrowRight,
  Star,
  Bookmark,
  CalendarCheck,
  MessageCircle,
  Trophy,
  Users,
  Gift,
  Crown,
  Flame,
  Medal,
  Calendar as CalendarIcon,
  Target,
  Zap,
  TrendingUp,
  CheckCircle2,
  Wand2,
  Loader2,
  Sliders,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  getMyReferralStats,
  getOrCreateMyReferralCode,
  buildReferralLink,
  type MyReferralStats,
} from "@/lib/referrals";
import { useAuth } from "@/lib/auth-context";
import { NearbyVenues } from "@/components/NearbyVenues";
import { GooglePhotos } from "@/components/GooglePhotos";
import { ViralNow } from "@/components/ViralNow";
import { PromotedSlot } from "@/components/PromotedSlot";
import { buildAndSaveItinerary } from "@/lib/itineraries";
import { loadPrefs } from "@/lib/taste";
import { toast } from "sonner";
import {
  TonightAtAGlance,
  NextBookingCountdown,
  ConciergeQuickAsk,
  SpendBudgetTracker,
  SavedSpotsWidget,
  XpProgressWidget,
  TrendingNearYouWidget,
} from "@/components/widgets/AppWidgets";
import { ActivityFeed } from "@/components/activity/ActivityFeed";

export const Route = createFileRoute("/portal/")({
  head: () => ({
    meta: [
      { title: "Your Portal — Confetti" },
      {
        name: "description",
        content: "Your bookings, referrals, achievements and curated picks — all in one dashboard.",
      },
      { property: "og:title", content: "Your Portal — Confetti" },
      {
        property: "og:description",
        content: "Your bookings, referrals, achievements and curated picks — all in one dashboard.",
      },
    ],
  }),
  component: PortalDiscoverPage,
});

type Venue = {
  id: string;
  name: string;
  category: string;
  neighborhood: string | null;
  price_level: number;
  image_url: string | null;
  description: string | null;
};
type Featured = {
  id: string;
  venue_id: string | null;
  title: string | null;
  subtitle: string | null;
  collection_slug: string | null;
  venues: Venue | null;
};
type Booking = {
  id: string;
  venue_name: string;
  party_size: number;
  status: string;
  total_cents: number;
  starts_at: string;
};
type Achievement = {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  xp_reward: number;
  unlocked: boolean;
  unlocked_at: string | null;
};
type Profile = { display_name: string | null; xp: number; level: number };

function PortalDiscoverPage() {
  const { user } = useAuth();
  const [featured, setFeatured] = useState<Featured[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);

  // Dashboard state
  const [profile, setProfile] = useState<Profile | null>(null);
  const [upcoming, setUpcoming] = useState<Booking[]>([]);
  const [bookingTotals, setBookingTotals] = useState({ upcoming: 0, past: 0 });
  const [refStats, setRefStats] = useState<MyReferralStats>({
    invited: 0,
    signedUp: 0,
    completed: 0,
    earnedCents: 0,
  });
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  const nav = useNavigate();
  const [quickBusy, setQuickBusy] = useState(false);

  const quickGenerate = async () => {
    if (!user) {
      nav({ to: "/auth" });
      return;
    }
    setQuickBusy(true);
    try {
      const prefs = await loadPrefs();
      const tp = prefs.taste_profile ?? {};
      const loves = (tp.loves ?? []).slice(0, 4).join(", ");
      const scenes = (tp.scene_keywords ?? []).slice(0, 3).join(", ");
      const vibeBits = [scenes, loves].filter(Boolean).join(" · ");
      const occasion =
        tp.life_stage === "with_kids"
          ? "Family night"
          : tp.energy === "high_energy"
            ? "Night out"
            : tp.energy === "chill"
              ? "Chill evening"
              : "Surprise me";
      const today = new Date();
      const dateIso = today.toISOString().slice(0, 10);
      const startTime = today.getHours() < 16 ? "17:00" : "19:00";
      const budget =
        prefs.budget_max >= 200
          ? "$$$"
          : prefs.budget_max >= 100
            ? "$$"
            : prefs.budget_min > 0 || prefs.budget_max > 0
              ? "$"
              : "$$";
      const toastId = toast.loading("Generating your plan from your taste profile…");
      try {
        const { id } = await buildAndSaveItinerary({
          occasion,
          vibe: vibeBits || "Personalized for you",
          occasionSlug: "spontaneous",
          city: tp.cities?.[0],
          date: dateIso,
          startTime,
          durationHours: 4,
          budget,
          notes: prefs.about_me || prefs.social_signals || undefined,
          transportMode: "auto",
        });
        toast.success("Your plan is ready", { id: toastId });
        nav({ to: "/trips/$id", params: { id } });
      } catch (e) {
        toast.error((e as Error).message, { id: toastId });
      }
    } finally {
      setQuickBusy(false);
    }
  };

  useEffect(() => {
    supabase
      .from("featured_content")
      .select(
        "id,venue_id,title,subtitle,collection_slug,venues(id,name,category,neighborhood,price_level,image_url,description)",
      )
      .eq("active", true)
      .order("position")
      .then(({ data }) => setFeatured((data as unknown as Featured[]) ?? []));
    supabase
      .from("venues")
      .select("id,name,category,neighborhood,price_level,image_url,description")
      .order("created_at", { ascending: false })
      .limit(12)
      .then(({ data }) => setVenues((data as Venue[]) ?? []));
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const nowIso = new Date().toISOString();

      const [profRes, upRes, pastRes, stats, code, achDefs, ua] = await Promise.all([
        supabase.from("profiles").select("display_name,xp,level").eq("id", user.id).maybeSingle(),
        supabase
          .from("bookings")
          .select("id,venue_name,party_size,status,total_cents,starts_at")
          .eq("user_id", user.id)
          .gte("starts_at", nowIso)
          .neq("status", "cancelled")
          .order("starts_at", { ascending: true })
          .limit(3),
        supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .lt("starts_at", nowIso),
        getMyReferralStats(),
        getOrCreateMyReferralCode(),
        supabase.from("achievements").select("id,code,title,description,icon,xp_reward"),
        supabase
          .from("user_achievements")
          .select("achievement_id,unlocked_at")
          .eq("user_id", user.id),
      ]);

      if (cancelled) return;
      setProfile((profRes.data as Profile) ?? null);
      setUpcoming((upRes.data as Booking[]) ?? []);
      setBookingTotals({ upcoming: upRes.data?.length ?? 0, past: pastRes.count ?? 0 });
      setRefStats(stats);
      setReferralCode(code);

      const unlockedMap = new Map((ua.data ?? []).map((r) => [r.achievement_id, r.unlocked_at]));
      const merged: Achievement[] = (
        (achDefs.data as Omit<Achievement, "unlocked" | "unlocked_at">[]) ?? []
      )
        .map((d) => ({
          ...d,
          unlocked: unlockedMap.has(d.id),
          unlocked_at: unlockedMap.get(d.id) ?? null,
        }))
        .sort((a, b) => Number(b.unlocked) - Number(a.unlocked) || a.xp_reward - b.xp_reward);
      setAchievements(merged);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const greeting = profile?.display_name ? `Hey, ${profile.display_name.split(" ")[0]}` : "Hey";
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const referralLink = referralCode ? buildReferralLink(referralCode) : null;

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            My Portal
          </p>
          <h1 className="mt-1 font-display text-4xl font-bold leading-tight">
            {greeting} — here's your night out, all in one place.
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Upcoming bookings, referral rewards, badges you've earned, and fresh picks from the
            city.
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={quickGenerate}
              disabled={quickBusy}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-vibe px-6 py-3 font-display text-sm font-bold uppercase tracking-wide text-primary-foreground shadow-pop transition-pop hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-70"
              title="Auto-build a plan from your taste profile and social signals"
            >
              {quickBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              {quickBusy ? "Generating…" : "Quick generate"}
            </button>
            <Link
              to="/plan"
              className="group inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-5 py-3 font-display text-sm font-bold uppercase tracking-wide text-foreground transition-pop hover:scale-[1.02]"
            >
              <Sparkles className="h-4 w-4" />
              Customize
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <Link
            to="/onboarding"
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <Sliders className="h-3 w-3" /> Tune what you like
          </Link>
        </div>
      </header>

      {/* (Top stats moved to /portal/profile) */}

      {/* In-app widgets */}
      {user && (
        <section aria-labelledby="widgets-heading" className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Your dashboard
              </p>
              <h2 id="widgets-heading" className="font-display text-2xl font-bold">
                Widgets
              </h2>
            </div>
            <Link
              to="/portal/profile"
              className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
            >
              Customize →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <TonightAtAGlance />
            <NextBookingCountdown />
            <ConciergeQuickAsk />
            <SpendBudgetTracker />
            <XpProgressWidget />
            <SavedSpotsWidget />
            <TrendingNearYouWidget />
          </div>
        </section>
      )}

      {/* Personalized next-best-actions */}
      {user && (
        <NextSteps
          hasUpcoming={bookingTotals.upcoming > 0}
          hasReferred={refStats.signedUp > 0}
          unlocked={unlockedCount}
          totalAch={achievements.length}
        />
      )}

      {user && <ActivityFeed title="Recent group activity" className="bg-card" limit={8} />}

      <ViralNow city="Washington DC" />

      <div className="grid gap-3 sm:grid-cols-3">
        <QuickAction
          to="/concierge/chat"
          icon={MessageCircle}
          label="Ask Concierge"
          hint="AI-powered planning"
        />
        <QuickAction
          to="/portal/bookings"
          icon={CalendarCheck}
          label="My Bookings"
          hint="Upcoming & past"
        />
        <QuickAction to="/portal/saved" icon={Bookmark} label="Saved Spots" hint="Your wishlist" />
      </div>

      {/* Dashboard grid + progress sidebar */}
      {user && (
        <div className="grid gap-6 lg:grid-cols-4 lg:items-start">
          <section className="grid gap-6 sm:grid-cols-2 lg:col-span-3 lg:order-1">
            {/* Bookings */}
            <DashCard
              title="Upcoming bookings"
              actionLabel="See all"
              actionTo="/portal/bookings"
              icon={CalendarCheck}
            >
              {upcoming.length === 0 ? (
                <EmptyState
                  icon={CalendarIcon}
                  text="No bookings yet — plan a night with the Concierge."
                  cta={{ to: "/concierge/chat", label: "Start planning" }}
                />
              ) : (
                <ul className="space-y-2">
                  {upcoming.map((b) => (
                    <li
                      key={b.id}
                      className="flex items-start justify-between gap-3 rounded-xl border border-border bg-background/50 p-3"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-display font-bold">{b.venue_name}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {formatDateTime(b.starts_at)} · party of {b.party_size}
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${statusTone(b.status)}`}
                      >
                        {b.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </DashCard>

            {/* Referrals */}
            <DashCard
              title="Your referrals"
              actionLabel="Invite & leaderboard"
              actionTo="/portal/refer"
              icon={Users}
            >
              <div className="grid grid-cols-3 gap-2 text-center">
                <MiniStat label="Invited" value={refStats.invited} />
                <MiniStat label="Joined" value={refStats.signedUp} />
                <MiniStat label="Completed" value={refStats.completed} />
              </div>
              <div className="mt-3 rounded-xl border border-dashed border-border bg-background/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                      Earned
                    </div>
                    <div className="font-display text-lg font-bold">
                      ${(refStats.earnedCents / 100).toFixed(0)}
                    </div>
                  </div>
                  <Gift className="h-5 w-5 text-primary" />
                </div>
                {referralLink && (
                  <div
                    className="mt-2 truncate font-mono text-[11px] text-muted-foreground"
                    title={referralLink}
                  >
                    {referralCode ? `Code: ${referralCode}` : referralLink}
                  </div>
                )}
              </div>
            </DashCard>
          </section>

          {/* Right sidebar: weekly challenge — stats moved to /portal/profile */}
          <aside
            aria-label="Your progress"
            className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:order-2 lg:col-span-1 lg:grid-cols-1 lg:sticky lg:top-24 lg:self-start"
          >
            <WeeklyChallenge bookings={bookingTotals.upcoming} referrals={refStats.signedUp} />
          </aside>
        </div>
      )}

      <PromotedSlot placement="home_spotlight" surface="portal_home" variant="spotlight" />

      <NearbyVenues />

      <PromotedSlot
        placement="featured_card"
        surface="portal_promoted_rail"
        variant="rail"
        title="Promoted picks near you"
      />

      {featured.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-2xl font-bold">Editor's picks</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured
              .filter((f) => f.venues)
              .map((f) => (
                <FeaturedCard key={f.id} venue={f.venues!} title={f.title} subtitle={f.subtitle} />
              ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-bold">Fresh on Concierge</h2>
          <Link
            to="/portal/bookings"
            className="text-sm font-semibold text-primary hover:underline"
          >
            Book a spot →
          </Link>
        </div>
        {venues.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
            No venues yet. Check back soon.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {venues.map((v) => (
              <VenueCard key={v.id} v={v} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  hint,
  to,
  tone,
}: {
  icon: typeof Sparkles;
  label: string;
  value: string;
  hint?: string;
  to?: string;
  tone?: string;
}) {
  const inner = (
    <div
      className={`flex h-full items-center gap-3 rounded-2xl border border-border p-4 shadow-card transition-pop ${tone ?? "bg-card"} ${to ? "hover:scale-[1.02] hover:shadow-pop" : ""}`}
    >
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone ? "bg-white/15" : "bg-gradient-vibe text-primary-foreground"}`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <div
          className={`text-[10px] font-mono uppercase tracking-widest ${tone ? "text-primary-foreground/80" : "text-muted-foreground"}`}
        >
          {label}
        </div>
        <div className="font-display text-2xl font-extrabold leading-tight">{value}</div>
        {hint && (
          <div
            className={`truncate text-xs ${tone ? "text-primary-foreground/80" : "text-muted-foreground"}`}
          >
            {hint}
          </div>
        )}
      </div>
    </div>
  );
  return to ? <Link to={to as "/"}>{inner}</Link> : inner;
}

function DashCard({
  title,
  icon: Icon,
  actionLabel,
  actionTo,
  children,
}: {
  title: string;
  icon: typeof Sparkles;
  actionLabel?: string;
  actionTo?: string;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <header className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg font-bold">{title}</h2>
        </div>
        {actionLabel && actionTo && (
          <Link to={actionTo as "/"} className="text-xs font-semibold text-primary hover:underline">
            {actionLabel} →
          </Link>
        )}
      </header>
      {children}
    </article>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-background/50 p-2">
      <div className="font-display text-xl font-extrabold leading-tight">{value}</div>
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  text,
  cta,
}: {
  icon: typeof Sparkles;
  text: string;
  cta?: { to: string; label: string };
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-background/40 p-5 text-center">
      <Icon className="mx-auto h-6 w-6 text-muted-foreground" />
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
      {cta && (
        <Link
          to={cta.to as "/"}
          className="mt-3 inline-block text-xs font-semibold text-primary hover:underline"
        >
          {cta.label} →
        </Link>
      )}
    </div>
  );
}

function AchIcon({ name }: { name: string }) {
  const cls = "h-4 w-4";
  switch (name) {
    case "crown":
      return <Crown className={cls} />;
    case "flame":
      return <Flame className={cls} />;
    case "star":
      return <Star className={cls} />;
    case "medal":
      return <Medal className={cls} />;
    case "sparkles":
      return <Sparkles className={cls} />;
    default:
      return <Trophy className={cls} />;
  }
}

function statusTone(status: string) {
  switch (status) {
    case "confirmed":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
    case "pending":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-300";
    case "cancelled":
      return "bg-destructive/15 text-destructive";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function formatDateTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function QuickAction({
  to,
  icon: Icon,
  label,
  hint,
}: {
  to: string;
  icon: typeof Sparkles;
  label: string;
  hint: string;
}) {
  return (
    <Link
      to={to as "/"}
      className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card transition-pop hover:scale-[1.02] hover:shadow-pop"
    >
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-vibe text-primary-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-display font-bold">{label}</div>
        <div className="truncate text-xs text-muted-foreground">{hint}</div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

function FeaturedCard({
  venue,
  title,
  subtitle,
}: {
  venue: Venue;
  title: string | null;
  subtitle: string | null;
}) {
  return (
    <Link
      to="/venue/$id"
      params={{ id: venue.id }}
      className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-pop hover:-translate-y-0.5 hover:shadow-pop"
    >
      {venue.image_url ? (
        <img src={venue.image_url} alt={venue.name} className="h-40 w-full object-cover" />
      ) : (
        <GooglePhotos
          venue={venue.name}
          neighborhood={venue.neighborhood}
          variant="hero"
          className="h-40 w-full"
        />
      )}
      <div className="p-4">
        <div className="text-[10px] font-mono uppercase tracking-wider text-primary">
          {title ?? "Featured"}
        </div>
        <h3 className="mt-1 font-display text-lg font-bold">{venue.name}</h3>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {subtitle ?? venue.description}
        </p>
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          {venue.neighborhood && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {venue.neighborhood}
            </span>
          )}
          <span>{"$".repeat(venue.price_level)}</span>
        </div>
      </div>
    </Link>
  );
}

function VenueCard({ v }: { v: Venue }) {
  return (
    <Link
      to="/venue/$id"
      params={{ id: v.id }}
      className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-pop hover:-translate-y-0.5 hover:shadow-pop"
    >
      {v.image_url ? (
        <img src={v.image_url} alt={v.name} className="h-36 w-full object-cover" />
      ) : (
        <GooglePhotos
          venue={v.name}
          neighborhood={v.neighborhood}
          variant="hero"
          className="h-36 w-full"
        />
      )}
      <div className="p-4">
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          {v.category}
        </div>
        <h3 className="mt-1 font-display text-lg font-bold">{v.name}</h3>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{v.description}</p>
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          {v.neighborhood && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {v.neighborhood}
            </span>
          )}
          <span>{"$".repeat(v.price_level)}</span>
        </div>
      </div>
    </Link>
  );
}

function WeeklyChallenge({ bookings, referrals }: { bookings: number; referrals: number }) {
  const goals = [
    { label: "Book 1 night this week", done: bookings >= 1, reward: "+100 XP" },
    { label: "Invite a friend", done: referrals >= 1, reward: "+250 XP" },
    { label: "Try a new neighborhood", done: false, reward: "Badge" },
  ];
  const completed = goals.filter((g) => g.done).length;
  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <h3 className="font-display text-sm font-bold uppercase tracking-wider">This week</h3>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {completed}/{goals.length}
        </span>
      </header>
      <ul className="space-y-2">
        {goals.map((g) => (
          <li key={g.label} className="flex items-center justify-between gap-2 text-xs">
            <span
              className={`flex items-center gap-2 ${g.done ? "text-foreground line-through" : "text-foreground"}`}
            >
              {g.done ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <span className="h-4 w-4 rounded-full border-2 border-muted-foreground/40" />
              )}
              {g.label}
            </span>
            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-primary">
              {g.reward}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function NextSteps({
  hasUpcoming,
  hasReferred,
  unlocked,
  totalAch,
}: {
  hasUpcoming: boolean;
  hasReferred: boolean;
  unlocked: number;
  totalAch: number;
}) {
  const steps: { to: string; icon: typeof Sparkles; title: string; desc: string; tone: string }[] =
    [];
  if (!hasUpcoming)
    steps.push({
      to: "/plan",
      icon: Zap,
      title: "Plan your next night",
      desc: "Tell us the vibe — we'll build the route in 60 seconds.",
      tone: "from-primary/15 to-primary/5",
    });
  if (!hasReferred)
    steps.push({
      to: "/portal/refer",
      icon: Gift,
      title: "Invite a friend, earn $10",
      desc: "They get a free plan, you get credit on the next booking.",
      tone: "from-rose-500/15 to-rose-500/5",
    });
  if (totalAch > 0 && unlocked < totalAch)
    steps.push({
      to: "/portal/refer",
      icon: Trophy,
      title: `${totalAch - unlocked} badges left to unlock`,
      desc: "Each one is worth XP and bragging rights.",
      tone: "from-amber-500/15 to-amber-500/5",
    });
  steps.push({
    to: "/concierge/chat",
    icon: MessageCircle,
    title: "Ask the Concierge",
    desc: "Spitball ideas, swap a stop, or get a backup plan.",
    tone: "from-violet-500/15 to-violet-500/5",
  });

  return (
    <section aria-label="What to do next">
      <header className="mb-3 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h2 className="font-display text-lg font-bold">What to do next</h2>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.slice(0, 4).map((s) => (
          <Link
            key={s.title}
            to={s.to as "/"}
            className={`group rounded-2xl border border-border bg-gradient-to-br ${s.tone} p-4 shadow-card transition-pop hover:scale-[1.02] hover:shadow-pop`}
          >
            <s.icon className="h-5 w-5 text-primary" />
            <div className="mt-2 font-display text-sm font-bold leading-tight">{s.title}</div>
            <div className="mt-1 text-xs text-muted-foreground">{s.desc}</div>
            <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
              Go <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
