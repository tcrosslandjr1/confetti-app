import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  Heart,
  Bookmark,
  Trophy,
  Sparkles,
  Settings,
  LogOut,
  Calendar,
  MapPin,
  Share2,
  Copy,
  Clock,
  Gift,
  CreditCard,
  Star,
  Users,
  Check,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { xpToNextLevel, levelTitle, levelForXP } from "@/lib/gamification";
import {
  getOrCreateMyReferralCode,
  getMyReferralStats,
  buildReferralLink,
} from "@/lib/referrals";
import { MobileHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { NotificationBell } from "@/components/NotificationBell";
import { usePageview, trackEngagement, trackCta } from "@/lib/analytics";
import { toast } from "sonner";

/* Shared TabsTrigger className — single source of truth for all 6 profile tabs */
const tabTriggerClass =
  "rounded-lg font-mono text-[9px] font-bold uppercase tracking-widest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/50 focus-visible:ring-offset-1 data-[state=active]:bg-ink data-[state=active]:text-cream data-[state=active]:shadow-sm";

export const Route = createFileRoute("/app/profile")({
  component: ProfilePage,
});

/* ─── Main Page ───────────────────────────────────────────────────────────── */

function ProfilePage() {
  usePageview("app_profile", "/app/profile");
  const { user } = useAuth();
  const userId = user?.id;

  const { data: profile } = useQuery({
    enabled: !!userId,
    queryKey: ["app", "profile", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name,level,xp")
        .eq("id", userId!)
        .maybeSingle();
      return data;
    },
  });

  const { data: counts } = useQuery({
    enabled: !!userId,
    queryKey: ["app", "profile", "counts", userId],
    queryFn: async () => {
      const [trips, faves, bookings] = await Promise.all([
        supabase
          .from("itineraries")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId!),
        supabase
          .from("favorite_stops")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId!),
        supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId!),
      ]);
      return {
        trips: trips.count ?? 0,
        faves: faves.count ?? 0,
        bookings: bookings.count ?? 0,
      };
    },
  });

  if (!user) {
    return (
      <div className="px-5 pt-16 text-center">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">Sign in to Confetti</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-ink/50">
          Save plans, earn Confetti, and unlock perks.
        </p>
        <Button asChild className="mt-6 w-full" variant="ink">
          <Link to="/auth">Sign in</Link>
        </Button>
      </div>
    );
  }

  const xp = profile?.xp ?? 0;
  const level = profile?.level ?? levelForXP(xp);
  const progress = xpToNextLevel(xp);

  return (
    <div className="pb-24">
      <MobileHeader
        eyebrow="Profile"
        title="You"
        right={<NotificationBell userId={user?.id} />}
      />

      {/* ─── Hero Card ──────────────────────────────────────────────────── */}
      <section className="px-5">
        <div className="relative overflow-hidden rounded-2xl border-2 border-ink bg-ink p-5 shadow-brut-lg">
          <div className="pointer-events-none absolute -right-8 -top-8 size-36 rounded-full bg-gold/15 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-8 size-36 rounded-full bg-coral/10 blur-2xl" />

          <div className="relative flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="grid size-[72px] place-items-center rounded-2xl bg-gold/90 font-display text-2xl font-extrabold text-ink shadow-sm">
                {(profile?.display_name ?? user.email ?? "?")
                  .slice(0, 1)
                  .toUpperCase()}
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 grid size-7 place-items-center rounded-lg bg-cream font-mono text-[10px] font-bold text-ink shadow-md ring-2 ring-ink/20">
                {level}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-xl font-extrabold tracking-tight text-cream">
                {profile?.display_name ?? user.email?.split("@")[0]}
              </div>
              <div className="mt-0.5 flex items-center gap-1.5">
                <Sparkles className="size-3 text-gold" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-gold">
                  {levelTitle(level)}
                </span>
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-cream/15">
                  <div
                    className="h-full rounded-full bg-gold transition-all duration-700"
                    style={{ width: `${Math.min(100, progress.progress * 100)}%` }}
                  />
                </div>
                <span className="shrink-0 font-mono text-[10px] font-bold text-cream/50">
                  {xp} XP
                </span>
              </div>
              <div className="mt-1 font-mono text-[10px] text-cream/40">
                Lv {level + 1} unlocks soon
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <StatCard label="Plans" value={counts?.trips ?? 0} icon={MapPin} />
          <StatCard label="Saved" value={counts?.faves ?? 0} icon={Heart} />
          <StatCard label="Bookings" value={counts?.bookings ?? 0} icon={Calendar} />
        </div>
      </section>

      {/* ─── Tabs ───────────────────────────────────────────────────────── */}
      <section className="mt-6 px-5">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6 gap-1 rounded-xl bg-surface-2 p-1">
            <TabsTrigger value="overview" className={tabTriggerClass} onClick={() => trackEngagement("profile_tab", { tab: "overview" })}>Overview</TabsTrigger>
            <TabsTrigger value="bookings" className={tabTriggerClass} onClick={() => trackEngagement("profile_tab", { tab: "bookings" })}>Bookings</TabsTrigger>
            <TabsTrigger value="saved" className={tabTriggerClass} onClick={() => trackEngagement("profile_tab", { tab: "saved" })}>Saved</TabsTrigger>
            <TabsTrigger value="passport" className={tabTriggerClass} onClick={() => trackEngagement("profile_tab", { tab: "passport" })}>Passport</TabsTrigger>
            <TabsTrigger value="wallet" className={tabTriggerClass} onClick={() => trackEngagement("profile_tab", { tab: "wallet" })}>Wallet</TabsTrigger>
            <TabsTrigger value="settings" className={tabTriggerClass} onClick={() => trackEngagement("profile_tab", { tab: "settings" })}>Settings</TabsTrigger>
          </TabsList>


          <TabsContent value="overview">
            <OverviewTab userId={userId!} level={level} xp={xp} />
          </TabsContent>

          <TabsContent value="bookings">
            <BookingsTab userId={userId!} />
          </TabsContent>

          <TabsContent value="saved">
            <SavedTab userId={userId!} />
          </TabsContent>

          <TabsContent value="passport">
            <PassportTab userId={userId!} level={level} xp={xp} />
          </TabsContent>

          <TabsContent value="wallet">
            <WalletTab userId={userId!} />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab user={user} displayName={profile?.display_name} />
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}

/* ─── Tab: Overview ───────────────────────────────────────────────────────── */

function OverviewTab({
  userId,
  level,
  xp,
}: {
  userId: string;
  level: number;
  xp: number;
}) {
  const navigate = useNavigate();

  const { data: recentTrips } = useQuery({
    queryKey: ["profile", "recent-trips", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("itineraries")
        .select("id,title,city,date,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(3);
      return data ?? [];
    },
  });

  return (
    <div className="space-y-4 pt-2">
      {/* Quick Actions */}
      <Card className="divide-y divide-ink/8">
        <QuickRow
          icon={Sparkles}
          label="Tune your vibes"
          onClick={() => {
            trackCta("tune_vibes");
            navigate({ to: "/chat" });
          }}
        />
        <QuickRow
          icon={Heart}
          label="Favorite venues"
          onClick={() => {
            trackCta("favorite_venues");
            navigate({ to: "/app/explore" });
          }}
        />
        <QuickRow
          icon={Trophy}
          label="Achievements"
          sub={`Level ${level} · ${xp} XP`}
          onClick={() => {
            trackCta("achievements");
            /* scroll to passport tab */
            const el = document.querySelector('[data-value="passport"]');
            if (el instanceof HTMLElement) el.click();
          }}
        />
      </Card>

      {/* Recent Plans */}
      {recentTrips && recentTrips.length > 0 && (
        <div>
          <h3 className="mb-2.5 font-display text-[14px] font-extrabold tracking-tight text-ink">Recent Plans</h3>
          <div className="space-y-2">
            {recentTrips.map((trip) => (
              <Link
                key={trip.id}
                to="/trips/$id"
                params={{ id: trip.id }}
                onClick={() =>
                  trackEngagement("profile_recent_trip", { id: trip.id })
                }
              >
                <Card className="flex items-center gap-3 p-3 transition-all duration-200 hover:shadow-card-hover active:scale-[0.98]">
                  <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-coral/10">
                    <MapPin className="size-4 text-coral" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display text-[13px] font-bold tracking-tight text-ink">
                      {trip.title || "Untitled plan"}
                    </div>
                    <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-ink/45">
                      {trip.city || "—"}{" "}
                      {trip.date &&
                        `· ${new Date(trip.date).toLocaleDateString()}`}
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-ink/25" />
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Tab: Bookings ───────────────────────────────────────────────────────── */

function BookingsTab({ userId }: { userId: string }) {
  const { data: bookings, isLoading } = useQuery({
    queryKey: ["profile", "bookings", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("bookings")
        .select("id,venue_name,starts_at,status,total_cents,created_at")
        .eq("user_id", userId)
        .order("starts_at", { ascending: false })
        .limit(20);
      return (data ?? []) as Array<{
        id: string;
        venue_name: string | null;
        starts_at: string | null;
        status: string | null;
        total_cents: number | null;
      }>;
    },
  });

  if (isLoading) return <LoadingPlaceholder />;

  if (!bookings?.length) {
    return (
      <EmptyState
        icon={Calendar}
        title="No bookings yet"
        description="Book a spot at your next favorite place"
        cta="Explore venues"
        to="/app/explore"
      />
    );
  }

  return (
    <div className="space-y-2 pt-2">
      {bookings.map((b) => (
        <Card key={b.id} className="flex items-center gap-3.5 p-3.5">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-coral/10">
            <Calendar className="size-4 text-coral" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-[13px] font-bold tracking-tight text-ink">
              {b.venue_name || "Venue"}
            </div>
            <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-ink/45">
              {b.starts_at ? new Date(b.starts_at).toLocaleDateString() : "—"}
              {b.total_cents != null && ` · $${(b.total_cents / 100).toFixed(2)}`}
            </div>
          </div>
          <Badge
            variant={b.status === "confirmed" ? "default" : "secondary"}
            className="shrink-0 text-[10px]"
          >
            {b.status ?? "pending"}
          </Badge>
        </Card>
      ))}
    </div>
  );
}

/* ─── Tab: Saved ──────────────────────────────────────────────────────────── */

function SavedTab({ userId }: { userId: string }) {
  const { data: savedPlans, isLoading: plansLoading } = useQuery({
    queryKey: ["profile", "saved-plans", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("itineraries")
        .select("id,title,city,date,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  const { data: savedVenues, isLoading: venuesLoading } = useQuery({
    queryKey: ["profile", "saved-venues", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("favorite_stops")
        .select("id,venue_name,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  if (plansLoading || venuesLoading) return <LoadingPlaceholder />;

  const hasNothing = !savedPlans?.length && !savedVenues?.length;

  if (hasNothing) {
    return (
      <EmptyState
        icon={Bookmark}
        title="Nothing saved yet"
        description="Heart venues or save plans to see them here"
        cta="Start exploring"
        to="/app/explore"
      />
    );
  }

  return (
    <div className="space-y-4 pt-2">
      {savedPlans && savedPlans.length > 0 && (
        <div>
          <h3 className="mb-2.5 font-display text-[14px] font-extrabold tracking-tight text-ink">Saved Plans</h3>
          <div className="space-y-2">
            {savedPlans.map((p) => (
              <Link key={p.id} to="/trips/$id" params={{ id: p.id }}>
                <Card className="flex items-center gap-3.5 p-3.5 transition-all duration-200 hover:shadow-card-hover active:scale-[0.98]">
                  <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-coral/10">
                    <MapPin className="size-4 text-coral" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display text-[13px] font-bold tracking-tight text-ink">
                      {p.title || "Untitled plan"}
                    </div>
                    <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-ink/45">
                      {p.city || "—"}
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-ink/25" />
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {savedVenues && savedVenues.length > 0 && (
        <div>
          <h3 className="mb-2.5 font-display text-[14px] font-extrabold tracking-tight text-ink">Favorite Venues</h3>
          <div className="space-y-2">
            {savedVenues.map((v) => (
              <Card key={v.id} className="flex items-center gap-3.5 p-3.5">
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-coral/10">
                  <Heart className="size-4 text-coral" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display text-[13px] font-bold tracking-tight text-ink">
                    {v.venue_name || "Venue"}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Tab: Passport (Achievements & XP) ───────────────────────────────────── */

function PassportTab({
  userId,
  level,
  xp,
}: {
  userId: string;
  level: number;
  xp: number;
}) {
  const progress = xpToNextLevel(xp);

  const { data: achievements } = useQuery({
    queryKey: ["profile", "achievements", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_achievements")
        .select("id,achievement_id,unlocked_at,achievements(code,title)")
        .eq("user_id", userId)
        .order("unlocked_at", { ascending: false });
      return (data ?? []) as Array<{
        id: string;
        achievement_id: string;
        unlocked_at: string | null;
        achievements: { code: string; title: string } | null;
      }>;
    },
  });

  return (
    <div className="space-y-4 pt-2">
      {/* XP Progress */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-display text-2xl font-extrabold tracking-tight text-ink">{xp} XP</div>
            <div className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-ink/45">
              {levelTitle(level)} · Level {level}
            </div>
          </div>
          <div className="grid size-12 place-items-center rounded-xl bg-gold/15">
            <Trophy className="size-5 text-gold" />
          </div>
        </div>
        <div className="mt-3.5">
          <div className="flex justify-between font-mono text-[10px] uppercase tracking-wide text-ink/40">
            <span>
              {progress.current} / {progress.required} XP
            </span>
            <span>Next: {levelTitle(level + 1)}</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink/[0.06]">
            <div
              className="h-full rounded-full bg-gold transition-all duration-700"
              style={{ width: `${Math.min(100, progress.progress * 100)}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Achievements */}
      <div>
        <h3 className="mb-2.5 font-display text-[14px] font-extrabold tracking-tight text-ink">Achievements</h3>
        {achievements && achievements.length > 0 ? (
          <div className="space-y-2">
            {achievements.map((a) => (
              <Card key={a.id} className="flex items-center gap-3.5 p-3.5">
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-gold/15">
                  <Star className="size-4 text-gold" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display text-[13px] font-bold capitalize tracking-tight text-ink">
                    {(a.achievements?.title ?? a.achievements?.code ?? "").replace(/_/g, " ")}
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-ink/45">
                    {a.unlocked_at
                      ? new Date(a.unlocked_at).toLocaleDateString()
                      : ""}
                  </div>
                </div>
                <div className="grid size-6 place-items-center rounded-full bg-teal/15">
                  <Check className="size-3.5 text-teal" />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-5 text-center">
            <span className="font-mono text-[11px] uppercase tracking-widest text-ink/35">Complete actions to unlock achievements</span>
          </Card>
        )}
      </div>
    </div>
  );
}

/* ─── Tab: Wallet (Referrals & Rewards) ───────────────────────────────────── */

function WalletTab({ userId }: { userId: string }) {
  const [copied, setCopied] = useState(false);

  const { data: refCode } = useQuery({
    queryKey: ["profile", "referral-code", userId],
    queryFn: getOrCreateMyReferralCode,
  });

  const { data: stats } = useQuery({
    queryKey: ["profile", "referral-stats", userId],
    queryFn: getMyReferralStats,
  });

  const handleCopy = async () => {
    if (!refCode) return;
    const link = buildReferralLink(refCode);
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast("Link copied!");
    trackCta("copy_referral_link");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 pt-2">
      {/* Referral Card */}
      <Card className="p-4">
        <div className="flex items-center gap-3.5">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-coral/10">
            <Gift className="size-5 text-coral" />
          </div>
          <div className="flex-1">
            <div className="font-display text-[14px] font-bold tracking-tight text-ink">Invite friends</div>
            <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-ink/45">
              Earn rewards when friends join
            </div>
          </div>
        </div>
        {refCode && (
          <div className="mt-3.5 flex items-center gap-2">
            <div className="flex-1 truncate rounded-xl border-2 border-ink/8 bg-surface-2 px-3 py-2.5 font-mono text-[11px] text-ink/70">
              {refCode}
            </div>
            <Button size="sm" variant="outline" onClick={handleCopy}>
              {copied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                if (!refCode) return;
                const link = buildReferralLink(refCode);
                if (navigator.share) {
                  await navigator.share({ title: "Join Confetti", url: link });
                  trackCta("share_referral");
                } else {
                  handleCopy();
                }
              }}
            >
              <Share2 className="size-4" />
            </Button>
          </div>
        )}
      </Card>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3.5 text-center">
            <div className="font-display text-xl font-extrabold tracking-tight text-ink">{stats.invited}</div>
            <div className="mt-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-ink/40">
              Invited
            </div>
          </Card>
          <Card className="p-3.5 text-center">
            <div className="font-display text-xl font-extrabold tracking-tight text-ink">{stats.signedUp}</div>
            <div className="mt-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-ink/40">
              Signed Up
            </div>
          </Card>
          <Card className="p-3.5 text-center">
            <div className="font-display text-xl font-extrabold tracking-tight text-ink">{stats.completed}</div>
            <div className="mt-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-ink/40">
              Completed
            </div>
          </Card>
          <Card className="p-3.5 text-center">
            <div className="font-display text-xl font-extrabold tracking-tight text-ink">
              ${(stats.earnedCents / 100).toFixed(0)}
            </div>
            <div className="mt-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-ink/40">
              Earned
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

/* ─── Tab: Settings ───────────────────────────────────────────────────────── */

function SettingsTab({
  user,
  displayName,
}: {
  user: { id: string; email?: string };
  displayName?: string | null;
}) {
  const [name, setName] = useState(displayName ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    trackCta("save_profile");
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: name.trim() || null })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Couldn't save");
    } else {
      toast.success("Profile updated");
    }
  };

  return (
    <div className="space-y-4 pt-2">
      {/* Display Name */}
      <Card className="space-y-3.5 p-4">
        <h3 className="font-display text-[14px] font-bold tracking-tight text-ink">Display Name</h3>
        <Input
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button
          size="sm"
          variant="ink"
          className="w-full"
          disabled={saving}
          onClick={handleSave}
        >
          {saving ? "Saving…" : "Save"}
        </Button>
      </Card>

      {/* Account Info */}
      <Card className="p-4">
        <h3 className="mb-1.5 font-display text-[14px] font-bold tracking-tight text-ink">Account</h3>
        <div className="font-mono text-[11px] text-ink/45">{user.email}</div>
      </Card>

      {/* Connected accounts */}
      <ConnectedAccountsCard />

      {/* Legal Links */}
      <Card className="divide-y divide-ink/8">
        <Link
          to="/privacy"
          className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-1 rounded-xl"
        >
          <span className="flex-1 text-[13px] font-semibold text-ink">Privacy & Terms</span>
          <ChevronRight className="size-4 text-ink/25" />
        </Link>
        <Link
          to="/accessibility"
          className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-1 rounded-xl"
        >
          <span className="flex-1 text-[13px] font-semibold text-ink">Accessibility</span>
          <ChevronRight className="size-4 text-ink/25" />
        </Link>
        <Link
          to="/about"
          className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-1 rounded-xl"
        >
          <span className="flex-1 text-[13px] font-semibold text-ink">About Confetti</span>
          <ChevronRight className="size-4 text-ink/25" />
        </Link>
      </Card>

      {/* Sign Out */}
      <Button
        variant="ghost"
        className="w-full text-ink/40 hover:text-ink/60"
        onClick={async () => {
          trackCta("sign_out");
          await supabase.auth.signOut();
          window.location.href = "/";
        }}
      >
        <LogOut className="mr-2 size-4" /> Sign out
      </Button>
    </div>
  );
}

/* ─── Connected Accounts ──────────────────────────────────────────────────── */

function ConnectedAccountsCard() {
  const [identities, setIdentities] = useState<Array<{ id: string; provider: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.getUserIdentities();
    setLoading(false);
    if (!error && data?.identities) {
      setIdentities(data.identities.map((i) => ({ id: i.identity_id ?? i.id, provider: i.provider })));
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const hasGoogle = identities.some((i) => i.provider === "google");

  const handleLinkGoogle = async () => {
    setLinking(true);
    trackCta("link_google");
    const { error } = await supabase.auth.linkIdentity({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/app/profile` },
    });
    setLinking(false);
    if (error) {
      toast.error(error.message || "Couldn't link Google account");
    }
  };

  const handleUnlink = async (identity: { id: string; provider: string }) => {
    if (identities.length <= 1) {
      toast.error("You need at least one sign-in method");
      return;
    }
    const full = (await supabase.auth.getUserIdentities()).data?.identities?.find(
      (i) => (i.identity_id ?? i.id) === identity.id,
    );
    if (!full) return;
    const { error } = await supabase.auth.unlinkIdentity(full);
    if (error) {
      toast.error(error.message || "Couldn't unlink");
    } else {
      toast.success(`${identity.provider} disconnected`);
      refresh();
    }
  };

  return (
    <Card className="space-y-3 p-4">
      <h3 className="font-display text-[14px] font-bold tracking-tight text-ink">Sign-in methods</h3>
      {loading ? (
        <div className="font-mono text-[11px] text-ink/45">Loading…</div>
      ) : (
        <div className="space-y-2">
          {identities.map((i) => (
            <div key={i.id} className="flex items-center justify-between rounded-xl border-2 border-ink/8 bg-surface-1 px-3.5 py-2.5">
              <span className="font-display text-[13px] font-bold capitalize tracking-tight text-ink">{i.provider}</span>
              {identities.length > 1 && i.provider !== "email" && (
                <Button size="sm" variant="ghost" onClick={() => handleUnlink(i)}>
                  Disconnect
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
      {!hasGoogle && (
        <Button size="sm" variant="outline" className="w-full" disabled={linking} onClick={handleLinkGoogle}>
          {linking ? "Connecting…" : "Connect Google account"}
        </Button>
      )}
      <p className="font-mono text-[10px] uppercase tracking-wide text-ink/40">
        Link Google to sign in faster. Both methods will access this same account.
      </p>
    </Card>
  );
}


function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="group relative overflow-hidden p-3 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
      {Icon && (
        <div className="mx-auto mb-1.5 grid size-8 place-items-center rounded-lg bg-coral/10">
          <Icon className="size-3.5 text-coral" />
        </div>
      )}
      <div className="font-display text-xl font-extrabold tracking-tight text-ink">{value}</div>
      <div className="font-mono text-[9px] font-bold uppercase tracking-widest text-ink/40">
        {label}
      </div>
    </Card>
  );
}

function QuickRow({
  icon: Icon,
  label,
  sub,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  sub?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-1 rounded-xl"
    >
      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-coral/10 text-coral transition-transform duration-200 group-hover:scale-105">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <span className="font-display text-[13px] font-bold tracking-tight text-ink">{label}</span>
        {sub && (
          <div className="font-mono text-[10px] uppercase tracking-wide text-ink/45">{sub}</div>
        )}
      </div>
      <ChevronRight className="size-4 text-ink/25 transition-transform duration-200 group-hover:translate-x-0.5" />
    </button>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  cta,
  to,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  cta: string;
  to: string;
}) {
  return (
    <div className="py-8 text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-ink/[0.04]">
        <Icon className="size-6 text-ink/25" />
      </div>
      <h3 className="mt-3 font-display text-[14px] font-bold tracking-tight text-ink">{title}</h3>
      <p className="mt-1 font-mono text-[11px] text-ink/45">{description}</p>
      <Button asChild size="sm" className="mt-4">
        <Link to={to}>{cta}</Link>
      </Button>
    </div>
  );
}

function LoadingPlaceholder() {
  return (
    <div className="space-y-3 pt-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-16 rounded-xl bg-ink/[0.06] relative isolate overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-ink/[0.06] before:to-transparent before:animate-[skeleton-shimmer_1.8s_ease-in-out_infinite] before:bg-[length:200%_100%]"
        />
      ))}
    </div>
  );
}
