import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, MapPin, ArrowRight, Star, Bookmark, CalendarCheck, MessageCircle, Trophy, Users, Gift, Lock, Crown, Flame, Medal, Calendar as CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMyReferralStats, getOrCreateMyReferralCode, buildReferralLink, type MyReferralStats } from "@/lib/referrals";
import { useAuth } from "@/lib/auth-context";
import { NearbyVenues } from "@/components/NearbyVenues";
import { PromotedSlot } from "@/components/PromotedSlot";

export const Route = createFileRoute("/portal/")({
  head: () => ({
    meta: [
      { title: "Your Portal — Confetti" },
      { name: "description", content: "Your bookings, referrals, achievements and curated picks — all in one dashboard." },
      { property: "og:title", content: "Your Portal — Confetti" },
      { property: "og:description", content: "Your bookings, referrals, achievements and curated picks — all in one dashboard." },
    ],
  }),
  component: PortalDiscoverPage,
});

type Venue = { id: string; name: string; category: string; neighborhood: string | null; price_level: number; image_url: string | null; description: string | null };
type Featured = { id: string; venue_id: string | null; title: string | null; subtitle: string | null; collection_slug: string | null; venues: Venue | null };
type Booking = { id: string; venue_name: string; party_size: number; status: string; total_cents: number; starts_at: string };
type Achievement = { id: string; code: string; title: string; description: string; icon: string; xp_reward: number; unlocked: boolean; unlocked_at: string | null };
type Profile = { display_name: string | null; xp: number; level: number };

function PortalDiscoverPage() {
  const { user } = useAuth();
  const [featured, setFeatured] = useState<Featured[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);

  // Dashboard state
  const [profile, setProfile] = useState<Profile | null>(null);
  const [upcoming, setUpcoming] = useState<Booking[]>([]);
  const [bookingTotals, setBookingTotals] = useState({ upcoming: 0, past: 0 });
  const [refStats, setRefStats] = useState<MyReferralStats>({ invited: 0, signedUp: 0, completed: 0, earnedCents: 0 });
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    supabase
      .from("featured_content")
      .select("id,venue_id,title,subtitle,collection_slug,venues(id,name,category,neighborhood,price_level,image_url,description)")
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
        supabase.from("user_achievements").select("achievement_id,unlocked_at").eq("user_id", user.id),
      ]);

      if (cancelled) return;
      setProfile((profRes.data as Profile) ?? null);
      setUpcoming((upRes.data as Booking[]) ?? []);
      setBookingTotals({ upcoming: upRes.data?.length ?? 0, past: pastRes.count ?? 0 });
      setRefStats(stats);
      setReferralCode(code);

      const unlockedMap = new Map((ua.data ?? []).map((r) => [r.achievement_id, r.unlocked_at]));
      const merged: Achievement[] = ((achDefs.data as Omit<Achievement, "unlocked" | "unlocked_at">[]) ?? [])
        .map((d) => ({
          ...d,
          unlocked: unlockedMap.has(d.id),
          unlocked_at: unlockedMap.get(d.id) ?? null,
        }))
        .sort((a, b) => Number(b.unlocked) - Number(a.unlocked) || a.xp_reward - b.xp_reward);
      setAchievements(merged);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const greeting = profile?.display_name ? `Hey, ${profile.display_name.split(" ")[0]}` : "Hey";
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const referralLink = referralCode ? buildReferralLink(referralCode) : null;

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">My Portal</p>
          <h1 className="mt-1 font-display text-4xl font-bold leading-tight">{greeting} — here's your night out, all in one place.</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Upcoming bookings, referral rewards, badges you've earned, and fresh picks from the city.
          </p>
        </div>
        <Link
          to="/plan"
          className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-vibe px-6 py-3 font-display text-sm font-bold uppercase tracking-wide text-primary-foreground shadow-pop transition-pop hover:scale-[1.03]"
        >
          <Sparkles className="h-4 w-4" />
          Create plan now
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </header>

      {/* Top stats strip */}
      {user && (
        <section aria-label="Your stats" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            tone="bg-gradient-vibe text-primary-foreground"
            icon={Sparkles}
            label="XP"
            value={(profile?.xp ?? 0).toLocaleString()}
            hint={`Level ${profile?.level ?? 1}`}
          />
          <StatTile
            icon={CalendarCheck}
            label="Upcoming bookings"
            value={bookingTotals.upcoming.toString()}
            hint={`${bookingTotals.past} completed`}
            to="/portal/bookings"
          />
          <StatTile
            icon={Users}
            label="Referrals signed up"
            value={refStats.signedUp.toString()}
            hint={`${refStats.invited} invited · ${refStats.completed} completed`}
            to="/portal/refer"
          />
          <StatTile
            icon={Trophy}
            label="Achievements"
            value={`${unlockedCount}/${achievements.length || "—"}`}
            hint={achievements.length ? `${achievements.reduce((s, a) => s + (a.unlocked ? a.xp_reward : 0), 0)} XP earned` : "Unlock by exploring"}
          />
        </section>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <QuickAction to="/concierge/chat" icon={MessageCircle} label="Ask Concierge" hint="AI-powered planning" />
        <QuickAction to="/portal/bookings" icon={CalendarCheck} label="My Bookings" hint="Upcoming & past" />
        <QuickAction to="/portal/saved" icon={Bookmark} label="Saved Spots" hint="Your wishlist" />
      </div>

      {/* Dashboard grid */}
      {user && (
        <section className="grid gap-6 lg:grid-cols-3">
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
                  <li key={b.id} className="flex items-start justify-between gap-3 rounded-xl border border-border bg-background/50 p-3">
                    <div className="min-w-0">
                      <div className="truncate font-display font-bold">{b.venue_name}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {formatDateTime(b.starts_at)} · party of {b.party_size}
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${statusTone(b.status)}`}>
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
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Earned</div>
                  <div className="font-display text-lg font-bold">${(refStats.earnedCents / 100).toFixed(0)}</div>
                </div>
                <Gift className="h-5 w-5 text-primary" />
              </div>
              {referralLink && (
                <div className="mt-2 truncate font-mono text-[11px] text-muted-foreground" title={referralLink}>
                  {referralCode ? `Code: ${referralCode}` : referralLink}
                </div>
              )}
            </div>
          </DashCard>

          {/* Achievements */}
          <DashCard
            title="Achievements"
            actionLabel={achievements.length > 4 ? "View all" : undefined}
            actionTo="/portal/refer"
            icon={Trophy}
          >
            {achievements.length === 0 ? (
              <EmptyState icon={Trophy} text="Achievements unlock as you explore." />
            ) : (
              <ul className="space-y-2">
                {achievements.slice(0, 4).map((a) => (
                  <li key={a.id} className={`flex items-start gap-3 rounded-xl border p-2.5 ${a.unlocked ? "border-primary/40 bg-primary/5" : "border-border bg-background/40 opacity-70"}`}>
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${a.unlocked ? "bg-gradient-vibe text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {a.unlocked ? <AchIcon name={a.icon} /> : <Lock className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate font-display text-sm font-bold">{a.title}</div>
                        <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">+{a.xp_reward} XP</span>
                      </div>
                      <div className="line-clamp-2 text-xs text-muted-foreground">{a.description}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </DashCard>
        </section>
      )}

      <PromotedSlot placement="home_spotlight" surface="portal_home" variant="spotlight" />

      <NearbyVenues />

      <PromotedSlot placement="featured_card" surface="portal_promoted_rail" variant="rail" title="Promoted picks near you" />

      {featured.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-2xl font-bold">Editor's picks</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.filter((f) => f.venues).map((f) => (
              <FeaturedCard key={f.id} venue={f.venues!} title={f.title} subtitle={f.subtitle} />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-bold">Fresh on Concierge</h2>
          <Link to="/portal/bookings" className="text-sm font-semibold text-primary hover:underline">Book a spot →</Link>
        </div>
        {venues.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
            No venues yet. Check back soon.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {venues.map((v) => <VenueCard key={v.id} v={v} />)}
          </div>
        )}
      </section>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, hint, to, tone }: { icon: typeof Sparkles; label: string; value: string; hint?: string; to?: string; tone?: string }) {
  const inner = (
    <div className={`flex h-full items-center gap-3 rounded-2xl border border-border p-4 shadow-card transition-pop ${tone ?? "bg-card"} ${to ? "hover:scale-[1.02] hover:shadow-pop" : ""}`}>
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone ? "bg-white/15" : "bg-gradient-vibe text-primary-foreground"}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <div className={`text-[10px] font-mono uppercase tracking-widest ${tone ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{label}</div>
        <div className="font-display text-2xl font-extrabold leading-tight">{value}</div>
        {hint && <div className={`truncate text-xs ${tone ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{hint}</div>}
      </div>
    </div>
  );
  return to ? <Link to={to as "/"}>{inner}</Link> : inner;
}

function DashCard({ title, icon: Icon, actionLabel, actionTo, children }: { title: string; icon: typeof Sparkles; actionLabel?: string; actionTo?: string; children: React.ReactNode }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <header className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg font-bold">{title}</h2>
        </div>
        {actionLabel && actionTo && (
          <Link to={actionTo as "/"} className="text-xs font-semibold text-primary hover:underline">{actionLabel} →</Link>
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
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}

function EmptyState({ icon: Icon, text, cta }: { icon: typeof Sparkles; text: string; cta?: { to: string; label: string } }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-background/40 p-5 text-center">
      <Icon className="mx-auto h-6 w-6 text-muted-foreground" />
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
      {cta && (
        <Link to={cta.to as "/"} className="mt-3 inline-block text-xs font-semibold text-primary hover:underline">
          {cta.label} →
        </Link>
      )}
    </div>
  );
}

function AchIcon({ name }: { name: string }) {
  const cls = "h-4 w-4";
  switch (name) {
    case "crown": return <Crown className={cls} />;
    case "flame": return <Flame className={cls} />;
    case "star": return <Star className={cls} />;
    case "medal": return <Medal className={cls} />;
    case "sparkles": return <Sparkles className={cls} />;
    default: return <Trophy className={cls} />;
  }
}

function statusTone(status: string) {
  switch (status) {
    case "confirmed": return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
    case "pending": return "bg-amber-500/15 text-amber-700 dark:text-amber-300";
    case "cancelled": return "bg-destructive/15 text-destructive";
    default: return "bg-muted text-muted-foreground";
  }
}

function formatDateTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  } catch {
    return iso;
  }
}

function QuickAction({ to, icon: Icon, label, hint }: { to: string; icon: typeof Sparkles; label: string; hint: string }) {
  return (
    <Link to={to as "/"} className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card transition-pop hover:scale-[1.02] hover:shadow-pop">
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-vibe text-primary-foreground"><Icon className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1">
        <div className="font-display font-bold">{label}</div>
        <div className="truncate text-xs text-muted-foreground">{hint}</div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

function FeaturedCard({ venue, title, subtitle }: { venue: Venue; title: string | null; subtitle: string | null }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      {venue.image_url && <img src={venue.image_url} alt={venue.name} className="h-40 w-full object-cover" />}
      <div className="p-4">
        <div className="text-[10px] font-mono uppercase tracking-wider text-primary">{title ?? "Featured"}</div>
        <h3 className="mt-1 font-display text-lg font-bold">{venue.name}</h3>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{subtitle ?? venue.description}</p>
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          {venue.neighborhood && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{venue.neighborhood}</span>}
          <span>{"$".repeat(venue.price_level)}</span>
        </div>
      </div>
    </article>
  );
}

function VenueCard({ v }: { v: Venue }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      {v.image_url ? (
        <img src={v.image_url} alt={v.name} className="h-36 w-full object-cover" />
      ) : (
        <div className="grid h-36 place-items-center bg-muted text-muted-foreground"><Star className="h-6 w-6" /></div>
      )}
      <div className="p-4">
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{v.category}</div>
        <h3 className="mt-1 font-display text-lg font-bold">{v.name}</h3>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{v.description}</p>
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          {v.neighborhood && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{v.neighborhood}</span>}
          <span>{"$".repeat(v.price_level)}</span>
        </div>
      </div>
    </article>
  );
}
