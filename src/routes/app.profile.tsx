import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { NotificationBell } from "@/components/NotificationBell";
import { usePageview, trackEngagement, trackCta } from "@/lib/analytics";
import { toast } from "sonner";

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
        .select("display_name,level,xp,avatar_url")
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
      <div className="px-5 pt-10 text-center">
        <h1 className="text-2xl font-bold">Sign in to Confetti</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Save plans, earn Confetti, and unlock perks.
        </p>
        <Button asChild className="mt-6 w-full">
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
        <Card className="flex items-center gap-4 p-5">
          <div className="grid size-16 shrink-0 place-items-center rounded-full bg-primary/10 text-lg font-bold text-primary">
            {(profile?.display_name ?? user.email ?? "?")
              .slice(0, 1)
              .toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-lg font-semibold">
              {profile?.display_name ?? user.email?.split("@")[0]}
            </div>
            <div className="text-xs font-medium text-primary">
              {levelTitle(level)}
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.min(100, progress.progress * 100)}%` }}
                />
              </div>
              <span className="shrink-0 text-[10px] text-muted-foreground">
                Lv {level} · {xp} XP
              </span>
            </div>
          </div>
        </Card>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <StatCard label="Plans" value={counts?.trips ?? 0} />
          <StatCard label="Saved" value={counts?.faves ?? 0} />
          <StatCard label="Bookings" value={counts?.bookings ?? 0} />
        </div>
      </section>

      {/* ─── Tabs ───────────────────────────────────────────────────────── */}
      <section className="mt-6 px-5">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger
              value="overview"
              onClick={() => trackEngagement("profile_tab", { tab: "overview" })}
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="bookings"
              onClick={() => trackEngagement("profile_tab", { tab: "bookings" })}
            >
              Bookings
            </TabsTrigger>
            <TabsTrigger
              value="saved"
              onClick={() => trackEngagement("profile_tab", { tab: "saved" })}
            >
              Saved
            </TabsTrigger>
          </TabsList>

          <TabsList className="mt-2 grid w-full grid-cols-3">
            <TabsTrigger
              value="passport"
              onClick={() =>
                trackEngagement("profile_tab", { tab: "passport" })
              }
            >
              Passport
            </TabsTrigger>
            <TabsTrigger
              value="wallet"
              onClick={() => trackEngagement("profile_tab", { tab: "wallet" })}
            >
              Wallet
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              onClick={() =>
                trackEngagement("profile_tab", { tab: "settings" })
              }
            >
              Settings
            </TabsTrigger>
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
      <Card className="divide-y divide-border">
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
          <h3 className="mb-2 text-sm font-semibold">Recent Plans</h3>
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
                <Card className="flex items-center gap-3 p-3 hover:bg-muted/40">
                  <MapPin className="size-4 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {trip.title || "Untitled plan"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {trip.city || "—"}{" "}
                      {trip.date &&
                        `· ${new Date(trip.date).toLocaleDateString()}`}
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" />
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
        .select("id,venue_name,date,status,total_cents,created_at")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(20);
      return data ?? [];
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
        <Card key={b.id} className="flex items-center gap-3 p-3">
          <Calendar className="size-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">
              {b.venue_name || "Venue"}
            </div>
            <div className="text-xs text-muted-foreground">
              {b.date ? new Date(b.date).toLocaleDateString() : "—"}
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
          <h3 className="mb-2 text-sm font-semibold">Saved Plans</h3>
          <div className="space-y-2">
            {savedPlans.map((p) => (
              <Link key={p.id} to="/trips/$id" params={{ id: p.id }}>
                <Card className="flex items-center gap-3 p-3 hover:bg-muted/40">
                  <MapPin className="size-4 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {p.title || "Untitled plan"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {p.city || "—"}
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {savedVenues && savedVenues.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold">Favorite Venues</h3>
          <div className="space-y-2">
            {savedVenues.map((v) => (
              <Card key={v.id} className="flex items-center gap-3 p-3">
                <Heart className="size-4 shrink-0 text-red-500" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
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
        .select("id,achievement_code,unlocked_at")
        .eq("user_id", userId)
        .order("unlocked_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="space-y-4 pt-2">
      {/* XP Progress */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold">{xp} XP</div>
            <div className="text-xs text-muted-foreground">
              {levelTitle(level)} · Level {level}
            </div>
          </div>
          <div className="grid size-14 place-items-center rounded-full bg-primary/10">
            <Trophy className="size-6 text-primary" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>
              {progress.current} / {progress.required} XP
            </span>
            <span>Next: {levelTitle(level + 1)}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(100, progress.progress * 100)}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Achievements */}
      <div>
        <h3 className="mb-2 text-sm font-semibold">Achievements</h3>
        {achievements && achievements.length > 0 ? (
          <div className="space-y-2">
            {achievements.map((a) => (
              <Card key={a.id} className="flex items-center gap-3 p-3">
                <Star className="size-4 shrink-0 text-amber-500" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium capitalize">
                    {(a.achievement_code ?? "").replace(/_/g, " ")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {a.unlocked_at
                      ? new Date(a.unlocked_at).toLocaleDateString()
                      : ""}
                  </div>
                </div>
                <Check className="size-4 text-green-600" />
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-4 text-center text-sm text-muted-foreground">
            Complete actions to unlock achievements
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
        <div className="flex items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10">
            <Gift className="size-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">Invite friends</div>
            <div className="text-xs text-muted-foreground">
              Earn rewards when friends join
            </div>
          </div>
        </div>
        {refCode && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 truncate rounded-lg bg-muted px-3 py-2 text-xs font-mono">
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
          <Card className="p-3 text-center">
            <div className="text-xl font-bold">{stats.invited}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Invited
            </div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-xl font-bold">{stats.signedUp}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Signed Up
            </div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-xl font-bold">{stats.completed}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Completed
            </div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-xl font-bold">
              ${(stats.earnedCents / 100).toFixed(0)}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
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
      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">Display Name</h3>
        <input
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button
          size="sm"
          className="w-full"
          disabled={saving}
          onClick={handleSave}
        >
          {saving ? "Saving…" : "Save"}
        </Button>
      </Card>

      {/* Account Info */}
      <Card className="p-4">
        <h3 className="mb-2 text-sm font-semibold">Account</h3>
        <div className="text-xs text-muted-foreground">{user.email}</div>
      </Card>

      {/* Legal Links */}
      <Card className="divide-y divide-border">
        <Link
          to="/privacy"
          className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40"
        >
          <span className="flex-1 text-sm font-medium">Privacy & Terms</span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>
        <Link
          to="/accessibility"
          className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40"
        >
          <span className="flex-1 text-sm font-medium">Accessibility</span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>
        <Link
          to="/about"
          className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40"
        >
          <span className="flex-1 text-sm font-medium">About Confetti</span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>
      </Card>

      {/* Sign Out */}
      <Button
        variant="ghost"
        className="w-full text-muted-foreground"
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

/* ─── Shared Components ───────────────────────────────────────────────────── */

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-3 text-center">
      <div className="text-xl font-bold">{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
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
      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/40"
    >
      <Icon className="size-4 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <span className="text-sm font-medium">{label}</span>
        {sub && (
          <div className="text-xs text-muted-foreground">{sub}</div>
        )}
      </div>
      <ChevronRight className="size-4 text-muted-foreground" />
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
      <Icon className="mx-auto size-10 text-muted-foreground/50" />
      <h3 className="mt-3 text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
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
          className="h-16 animate-pulse rounded-xl bg-muted"
        />
      ))}
    </div>
  );
}
