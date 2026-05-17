import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  User,
  LogOut,
  Settings,
  Sparkles,
  Mail,
  MapPin,
  Loader2,
  Shield,
  Compass,
  Coffee,
  Sparkle,
  Eye,
  SlidersHorizontal,
  CalendarCheck,
  Users,
  Trophy,
  Flame,
  GripVertical,
  RotateCcw,
  Lock,
  Crown,
  Star,
  Medal,
  Share2,
} from "lucide-react";
import { getMyReferralStats, type MyReferralStats } from "@/lib/referrals";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  getStoredLocation,
  requestUserLocation,
  clearStoredLocation,
  type UserLocation,
} from "@/lib/location";
import {
  TonightAtAGlance,
  NextBookingCountdown,
  ConciergeQuickAsk,
  SpendBudgetTracker,
} from "@/components/widgets/AppWidgets";

export const Route = createFileRoute("/portal/profile")({
  component: ProfilePage,
});

type Profile = { id: string; display_name: string | null; xp: number; level: number };
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

function ProfilePage() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>({ xp: 560, level: 4 } as Profile);
  const [name, setName] = useState("");
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [bookingTotals, setBookingTotals] = useState({ upcoming: 2, past: 0 });
  const [refStats, setRefStats] = useState<MyReferralStats>({
    invited: 5,
    signedUp: 3,
    completed: 1,
    earnedCents: 2500,
  });
  const [achTotals, setAchTotals] = useState({ unlocked: 5, total: 9, xpEarned: 240 });
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    setLocation(getStoredLocation());
  }, []);

  const refreshLocation = async () => {
    setLocLoading(true);
    const loc = await requestUserLocation({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
    setLocLoading(false);
    if (loc) {
      setLocation(loc);
      toast.success("Location updated");
    } else {
      toast.error("Couldn't get your location. Check browser permissions.");
    }
  };

  const forgetLocation = () => {
    clearStoredLocation();
    setLocation(null);
    toast.success("Saved location cleared");
  };

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("id,display_name,xp,level")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfile(data as Profile);
          setName(data.display_name ?? "");
        }
      });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const nowIso = new Date().toISOString();
      const [upRes, pastRes, refs, achRows, userAch] = await Promise.all([
        supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("starts_at", nowIso),
        supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .lt("starts_at", nowIso),
        getMyReferralStats(),
        supabase.from("achievements").select("id, code, title, description, icon, xp_reward"),
        supabase
          .from("user_achievements")
          .select("achievement_id, unlocked_at")
          .eq("user_id", user.id),
      ]);
      if (cancelled) return;
      const unlockedMap = new Map(
        ((userAch.data ?? []) as { achievement_id: string; unlocked_at: string | null }[]).map(
          (r) => [r.achievement_id, r.unlocked_at],
        ),
      );
      const allAch = (achRows.data ?? []) as Omit<Achievement, "unlocked" | "unlocked_at">[];
      const xpEarned = allAch.reduce((s, a) => s + (unlockedMap.has(a.id) ? a.xp_reward : 0), 0);
      const merged: Achievement[] = allAch
        .map((d) => ({
          ...d,
          unlocked: unlockedMap.has(d.id),
          unlocked_at: unlockedMap.get(d.id) ?? null,
        }))
        .sort((a, b) => Number(b.unlocked) - Number(a.unlocked) || a.xp_reward - b.xp_reward);
      setBookingTotals({ upcoming: upRes.count ?? 0, past: pastRes.count ?? 0 });
      setRefStats(refs);
      setAchTotals({ unlocked: unlockedMap.size, total: allAch.length, xpEarned });
      setAchievements(merged);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const save = async () => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: name })
      .eq("id", user.id);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
  };

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          My Portal
        </p>
        <h1 className="mt-1 flex items-center gap-2 font-display text-4xl font-bold">
          <User className="h-8 w-8" /> Profile
        </h1>
      </header>

      <section className="rounded-2xl border-2 border-ink bg-cream p-6 shadow-brut">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-vibe text-2xl font-bold text-primary-foreground">
            {(name || user?.email || "?")[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-2xl font-bold">{name || "Anonymous"}</h2>
            <div className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              {user?.email}
            </div>
          </div>
        </div>

        {profile && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-muted/50 px-4 py-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Level
              </div>
              <div className="mt-0.5 font-display text-2xl font-bold">{profile.level}</div>
            </div>
            <div className="rounded-2xl bg-muted/50 px-4 py-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                XP
              </div>
              <div className="mt-0.5 font-display text-2xl font-bold">{profile.xp}</div>
            </div>
          </div>
        )}
      </section>

      {(
        <ReorderableSections
          sections={[
            {
              id: "stats",
              title: "Your stats",
              node: (
                <section
                  aria-label="Your stats"
                  className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
                >
                  <StatTile
                    tone="bg-ink text-cream border-2 border-ink"
                    icon={Sparkles}
                    label="XP"
                    value={(profile?.xp ?? 0).toLocaleString()}
                    hint={`Level ${profile?.level ?? 1}`}
                    onClick={() =>
                      toast.success(`${(profile?.xp ?? 0).toLocaleString()} XP banked`, {
                        description: `You're Level ${profile?.level ?? 1}. Keep going to unlock the next tier.`,
                      })
                    }
                  />
                  <StatTile
                    icon={CalendarCheck}
                    label="Upcoming bookings"
                    value={bookingTotals.upcoming.toString()}
                    hint={`${bookingTotals.past} completed`}
                    to="/portal/bookings"
                    onClick={() =>
                      toast(
                        `${bookingTotals.upcoming} upcoming booking${bookingTotals.upcoming === 1 ? "" : "s"}`,
                        {
                          description: `${bookingTotals.past} completed so far. Opening your bookings…`,
                        },
                      )
                    }
                  />
                  <StatTile
                    icon={Users}
                    label="Referrals signed up"
                    value={refStats.signedUp.toString()}
                    hint={`${refStats.invited} invited · ${refStats.completed} completed`}
                    onClick={() =>
                      toast(
                        `${refStats.signedUp} friend${refStats.signedUp === 1 ? "" : "s"} on board`,
                        {
                          description: `${refStats.invited} invited · ${refStats.completed} completed. Earn more by sharing your link.`,
                        },
                      )
                    }
                    cta={{ label: "Share", to: "/portal/refer", icon: Share2 }}
                  />
                  <StatTile
                    icon={Trophy}
                    label="Achievements"
                    value={`${achTotals.unlocked}/${achTotals.total || "—"}`}
                    hint={
                      achTotals.total ? `${achTotals.xpEarned} XP earned` : "Unlock by exploring"
                    }
                    to="/portal/achievements"
                    onClick={() =>
                      toast.success(
                        `${achTotals.unlocked}/${achTotals.total || "—"} achievements unlocked`,
                        {
                          description: achTotals.total
                            ? `${achTotals.xpEarned} XP earned. Opening your badge book…`
                            : "Start exploring to unlock your first badge.",
                        },
                      )
                    }
                  />
                </section>
              ),
            },
            {
              id: "widgets",
              title: "Widgets",
              node: (
                <section aria-label="Widgets" className="grid gap-3 sm:grid-cols-2">
                  <TonightAtAGlance />
                  <NextBookingCountdown />
                  <ConciergeQuickAsk />
                  <SpendBudgetTracker />
                </section>
              ),
            },
            {
              id: "achievements",
              title: "Achievements",
              node: (
                <section
                  aria-label="Achievements"
                  className="rounded-2xl border-2 border-ink bg-cream p-6 shadow-brut"
                >
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <h2 className="flex items-center gap-2 font-display text-xl font-bold">
                      <Trophy className="h-5 w-5 text-primary" /> Achievements
                    </h2>
                    <Link
                      to="/portal/achievements"
                      className="font-mono text-[10px] uppercase tracking-widest text-primary hover:underline"
                    >
                      {achTotals.unlocked}/{achTotals.total || "—"} unlocked · View all →
                    </Link>
                  </div>
                  {achievements.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-border bg-background/40 p-5 text-center text-sm text-muted-foreground">
                      Achievements unlock as you explore.
                    </p>
                  ) : (
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {achievements.map((a) => (
                        <li
                          key={a.id}
                          className={`flex items-start gap-3 rounded-xl border p-2.5 ${a.unlocked ? "border-primary/40 bg-primary/5" : "border-border bg-background/40 opacity-70"}`}
                        >
                          <span
                            className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${a.unlocked ? "bg-ink text-cream border-2 border-ink" : "bg-muted text-muted-foreground"}`}
                          >
                            {a.unlocked ? <AchIcon name={a.icon} /> : <Lock className="h-4 w-4" />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <div className="truncate font-display text-sm font-bold">
                                {a.title}
                              </div>
                              <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                                +{a.xp_reward} XP
                              </span>
                            </div>
                            <div className="line-clamp-2 text-xs text-muted-foreground">
                              {a.description}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ),
            },
            {
              id: "progress",
              title: "Level, XP & streak",
              node: (
                <section aria-label="Your progress" className="grid gap-3 md:grid-cols-2">
                  <LevelProgress xp={profile?.xp ?? 0} level={profile?.level ?? 1} />
                  <StreakCard pastBookings={bookingTotals.past} unlocked={achTotals.unlocked} />
                </section>
              ),
            },
            {
              id: "name",
              title: "Display name",
              node: (
                <section className="rounded-2xl border-2 border-ink bg-cream p-6 shadow-brut">
                  <h2 className="mb-4 font-display text-xl font-bold">Display name</h2>
                  <div className="flex flex-wrap gap-2">
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="What should we call you?"
                      className="max-w-sm"
                    />
                    <Button onClick={save}>Save</Button>
                  </div>
                </section>
              ),
            },
            {
              id: "socials",
              title: "Connected socials",
              node: (
                <section className="rounded-2xl border-2 border-ink bg-cream p-6 shadow-brut">
                  <h2 className="mb-4 font-display text-xl font-bold">Connected Socials</h2>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {[
                      {
                        key: "ig",
                        label: "Instagram",
                        icon: "📸",
                        color: "#E1306C",
                        connected: true,
                      },
                      {
                        key: "tt",
                        label: "TikTok",
                        icon: "🎵",
                        color: "#000000",
                        connected: false,
                      },
                      {
                        key: "yelp",
                        label: "Yelp",
                        icon: "⭐",
                        color: "#D32323",
                        connected: false,
                      },
                      {
                        key: "google",
                        label: "Google",
                        icon: "🔍",
                        color: "#4285F4",
                        connected: true,
                      },
                      {
                        key: "spotify",
                        label: "Spotify",
                        icon: "🎧",
                        color: "#1DB954",
                        connected: false,
                      },
                      {
                        key: "x",
                        label: "X / Twitter",
                        icon: "𝕏",
                        color: "#000000",
                        connected: false,
                      },
                    ].map((s) => (
                      <button
                        key={s.key}
                        className="flex items-center gap-3 rounded-2xl border-2 border-ink bg-background p-3 text-left hover:bg-muted"
                        style={{ borderLeft: `4px solid ${s.color}` }}
                      >
                        <span className="text-2xl">{s.icon}</span>
                        <span className="flex-1 font-semibold">{s.label}</span>
                        {s.connected ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-600">
                            <span className="h-2 w-2 rounded-full bg-green-500" /> Connected
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-primary">Connect</span>
                        )}
                      </button>
                    ))}
                  </div>
                  <Link
                    to="/taste-tuner"
                    className="mt-4 flex items-center gap-3 rounded-2xl border-2 border-ink bg-gradient-to-r from-primary/10 to-accent/10 p-4 hover:bg-muted"
                  >
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-ink text-cream border-2 border-ink">
                      <SlidersHorizontal className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-display font-bold">Tune My Taste</div>
                      <div className="text-xs text-muted-foreground">
                        Swipe through experiences to refine your vibe
                      </div>
                    </div>
                  </Link>
                </section>
              ),
            },
            {
              id: "links",
              title: "Quick links",
              node: (
                <section className="rounded-2xl border-2 border-ink bg-cream p-6 shadow-brut">
                  <h2 className="mb-4 font-display text-xl font-bold">Quick links</h2>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Link
                      to="/concierge/profile"
                      className="flex items-center gap-3 rounded-2xl border-2 border-ink p-3 hover:bg-muted"
                    >
                      <Settings className="h-4 w-4" />{" "}
                      <span className="font-semibold">Preferences & taste</span>
                    </Link>
                    <Link
                      to="/passport"
                      className="flex items-center gap-3 rounded-2xl border-2 border-ink p-3 hover:bg-muted"
                    >
                      <Sparkles className="h-4 w-4" />{" "}
                      <span className="font-semibold">View Passport</span>
                    </Link>
                  </div>
                </section>
              ),
            },
            {
              id: "location",
              title: "Location",
              node: (
                <section className="rounded-2xl border-2 border-ink bg-cream p-6 shadow-brut">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="flex items-center gap-2 font-display text-xl font-bold">
                      <MapPin className="h-5 w-5" /> Location
                    </h2>
                    <span
                      className={`text-xs font-mono uppercase tracking-wider ${location ? "text-primary" : "text-muted-foreground"}`}
                    >
                      {location ? "Enabled" : "Not set"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Used to recommend nearby venues and tailor your concierge picks.
                  </p>

                  {location ? (
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl bg-muted/50 px-4 py-3">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                          Latitude
                        </div>
                        <div className="mt-0.5 font-mono text-sm">{location.lat.toFixed(6)}</div>
                      </div>
                      <div className="rounded-2xl bg-muted/50 px-4 py-3">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                          Longitude
                        </div>
                        <div className="mt-0.5 font-mono text-sm">{location.lng.toFixed(6)}</div>
                      </div>
                      <div className="rounded-2xl bg-muted/50 px-4 py-3">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                          Accuracy
                        </div>
                        <div className="mt-0.5 font-mono text-sm">
                          {location.accuracy ? `±${Math.round(location.accuracy)} m` : "—"}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground sm:col-span-3">
                        Last updated {new Date(location.capturedAt).toLocaleString()}
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-muted-foreground">
                      No saved coordinates yet. Tap below to share your location.
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button onClick={refreshLocation} disabled={locLoading} className="gap-2">
                      {locLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MapPin className="h-4 w-4" />
                      )}
                      {location ? "Update location" : "Enable location"}
                    </Button>
                    {location && (
                      <Button variant="outline" onClick={forgetLocation}>
                        Clear saved location
                      </Button>
                    )}
                  </div>

                  <div className="mt-6 rounded-2xl border-2 border-ink bg-muted/30 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Shield className="h-4 w-4 text-primary" /> How your location is used
                    </div>
                    <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                      <li className="flex gap-2">
                        <Compass className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        <span>Sort venues and events by distance from your current spot.</span>
                      </li>
                      <li className="flex gap-2">
                        <Coffee className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        <span>Bias concierge picks toward neighborhoods near you right now.</span>
                      </li>
                      <li className="flex gap-2">
                        <Sparkle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        <span>Estimate travel times between stops on your itineraries.</span>
                      </li>
                      <li className="flex gap-2">
                        <Eye className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        <span>
                          Stored only on this device (browser local storage). Never shared with
                          third parties or tied to your public profile.
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
                      <Shield className="h-4 w-4" /> Privacy controls
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Clear the saved coordinates from this device at any time. Recommendations will
                      fall back to your default city until you re-enable location.
                    </p>
                    <Button
                      variant="outline"
                      onClick={forgetLocation}
                      disabled={!location}
                      className="mt-3 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      Clear stored location data
                    </Button>
                  </div>
                </section>
              ),
            },
          ]}
        />
      )}
      <Button variant="outline" onClick={signOut} className="gap-2">
        <LogOut className="h-4 w-4" /> Sign out
      </Button>
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
  onClick,
  cta,
}: {
  icon: typeof Sparkles;
  label: string;
  value: string;
  hint?: string;
  to?: string;
  tone?: string;
  onClick?: () => void;
  cta?: { label: string; to: string; icon?: typeof Sparkles };
}) {
  const CtaIcon = cta?.icon;
  const body = (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone ? "bg-white/15" : "bg-ink text-cream border-2 border-ink"}`}
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
  const wrapperClass = `flex h-full items-center gap-3 rounded-2xl border-2 border-ink p-4 shadow-brut transition-pop ${tone ?? "bg-cream"}`;

  if (cta) {
    const ctaClass = tone
      ? "shrink-0 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-primary shadow-brut hover:scale-105 transition-pop"
      : "shrink-0 inline-flex items-center gap-1 rounded-full bg-ink text-cream border-2 border-ink px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest shadow-brut hover:scale-105 transition-pop";
    const triggerClass = `${onClick ? "cursor-pointer text-left" : "text-left"} flex min-w-0 flex-1 items-center gap-3`;
    return (
      <div className={wrapperClass}>
        {onClick ? (
          <button type="button" onClick={onClick} className={triggerClass}>
            {body}
          </button>
        ) : (
          body
        )}
        <Link to={cta.to as "/"} className={ctaClass} aria-label={cta.label}>
          {CtaIcon && <CtaIcon className="h-3.5 w-3.5" />}
          {cta.label}
        </Link>
      </div>
    );
  }

  const inner = (
    <div
      className={`${wrapperClass} ${to || onClick ? "cursor-pointer hover:scale-[1.02] hover:shadow-brut" : ""}`}
    >
      {body}
    </div>
  );
  if (to) {
    return (
      <Link to={to as "/"} onClick={onClick}>
        {inner}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="w-full text-left">
        {inner}
      </button>
    );
  }
  return inner;
}

function LevelProgress({ xp, level }: { xp: number; level: number }) {
  const xpForNext = level * 500;
  const xpThisLevel = xp % xpForNext;
  const pct = Math.min(100, Math.round((xpThisLevel / xpForNext) * 100));
  const remaining = xpForNext - xpThisLevel;
  return (
    <article className="rounded-2xl border-2 border-ink bg-cream p-5 shadow-brut">
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-display text-sm font-bold uppercase tracking-wider">Level {level}</h3>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {xp.toLocaleString()} XP
        </span>
      </header>
      <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-vibe transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {pct}% to Level {level + 1}
        </span>
        <span className="font-semibold text-primary">{remaining} XP to go</span>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Book a stop (+50), complete it (+100), refer a friend (+250).
      </p>
    </article>
  );
}

function StreakCard({ pastBookings, unlocked }: { pastBookings: number; unlocked: number }) {
  const streak = Math.min(pastBookings, 7);
  return (
    <article className="rounded-2xl border-2 border-ink bg-gradient-to-br from-orange-500/10 via-amber-400/5 to-transparent p-5 shadow-brut">
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          <h3 className="font-display text-sm font-bold uppercase tracking-wider">
            Going-out streak
          </h3>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {unlocked} badges
        </span>
      </header>
      <div className="flex items-baseline gap-2">
        <span className="font-display text-4xl font-extrabold leading-none">{streak}</span>
        <span className="text-xs text-muted-foreground">night{streak === 1 ? "" : "s"} out</span>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full ${i < streak ? "bg-gradient-to-r from-orange-500 to-amber-400" : "bg-muted"}`}
            aria-hidden
          />
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {streak === 0
          ? "Plan your first night to start the streak."
          : streak < 3
            ? "Keep it rolling — 3 nights unlocks a badge."
            : "You're on fire. Don't let it cool."}
      </p>
    </article>
  );
}

const ORDER_KEY = "portal-profile-order-v1";

type SectionDef = { id: string; title: string; node: ReactNode };

function loadOrder(defaultOrder: string[]): string[] {
  if (typeof window === "undefined") return defaultOrder;
  try {
    const raw = window.localStorage.getItem(ORDER_KEY);
    if (!raw) return defaultOrder;
    const parsed = JSON.parse(raw) as string[];
    if (!Array.isArray(parsed)) return defaultOrder;
    // Keep saved order, append any new sections at the end, drop unknown ids
    const known = new Set(defaultOrder);
    const filtered = parsed.filter((id) => known.has(id));
    const missing = defaultOrder.filter((id) => !filtered.includes(id));
    return [...filtered, ...missing];
  } catch {
    return defaultOrder;
  }
}

function ReorderableSections({ sections }: { sections: SectionDef[] }) {
  const defaultOrder = sections.map((s) => s.id);
  const [order, setOrder] = useState<string[]>(() => loadOrder(defaultOrder));
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  // Reconcile order when section list shape changes (e.g., new section added later)
  useEffect(() => {
    setOrder((prev) => {
      const known = new Set(defaultOrder);
      const filtered = prev.filter((id) => known.has(id));
      const missing = defaultOrder.filter((id) => !filtered.includes(id));
      return [...filtered, ...missing];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultOrder.join("|")]);

  const persist = (next: string[]) => {
    setOrder(next);
    try {
      window.localStorage.setItem(ORDER_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const move = (from: string, to: string) => {
    if (from === to) return;
    const next = [...order];
    const fromIdx = next.indexOf(from);
    const toIdx = next.indexOf(to);
    if (fromIdx < 0 || toIdx < 0) return;
    next.splice(fromIdx, 1);
    next.splice(toIdx, 0, from);
    persist(next);
  };

  const moveBy = (id: string, delta: number) => {
    const idx = order.indexOf(id);
    const target = idx + delta;
    if (idx < 0 || target < 0 || target >= order.length) return;
    const next = [...order];
    const [removed] = next.splice(idx, 1);
    next.splice(target, 0, removed);
    persist(next);
  };

  const reset = () => persist(defaultOrder);

  const byId = new Map(sections.map((s) => [s.id, s]));
  const isCustom = order.join("|") !== defaultOrder.join("|");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 px-1">
        <p className="text-xs text-muted-foreground">
          <GripVertical className="mr-1 inline h-3.5 w-3.5 align-text-bottom" />
          Drag the handle to rearrange. Saved on this device.
        </p>
        {isCustom && (
          <button
            onClick={reset}
            className="inline-flex items-center gap-1 rounded-full border-2 border-ink px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" /> Reset order
          </button>
        )}
      </div>
      <div className="space-y-8">
        {order.map((id, idx) => {
          const sec = byId.get(id);
          if (!sec) return null;
          const isDragging = dragId === id;
          const isOver = overId === id && dragId && overId !== dragId;
          return (
            <div
              key={id}
              draggable
              onDragStart={(e) => {
                setDragId(id);
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", id);
              }}
              onDragEnter={() => setOverId(id)}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (overId !== id) setOverId(id);
              }}
              onDragLeave={(e) => {
                // Only clear if leaving the section entirely
                if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                if (overId === id) setOverId(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const from = e.dataTransfer.getData("text/plain") || dragId;
                if (from) move(from, id);
                setDragId(null);
                setOverId(null);
              }}
              onDragEnd={() => {
                setDragId(null);
                setOverId(null);
              }}
              className={`group relative rounded-3xl transition-all ${
                isOver ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
              } ${isDragging ? "opacity-50" : ""}`}
            >
              <div className="absolute -left-1 top-3 z-10 flex translate-x-[-100%] flex-col items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 sm:-left-2">
                <button
                  type="button"
                  onClick={() => moveBy(id, -1)}
                  disabled={idx === 0}
                  aria-label="Move up"
                  className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                >
                  ▲
                </button>
                <span
                  aria-hidden
                  className="grid h-7 w-7 cursor-grab place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
                  title="Drag to reorder"
                >
                  <GripVertical className="h-4 w-4" />
                </span>
                <button
                  type="button"
                  onClick={() => moveBy(id, 1)}
                  disabled={idx === order.length - 1}
                  aria-label="Move down"
                  className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                >
                  ▼
                </button>
              </div>
              {/* Mobile/touch handle: visible inline above section */}
              <div className="mb-1 flex items-center justify-end gap-1 px-1 sm:hidden">
                <button
                  type="button"
                  onClick={() => moveBy(id, -1)}
                  disabled={idx === 0}
                  aria-label="Move up"
                  className="rounded-md px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted disabled:opacity-30"
                >
                  ▲ Up
                </button>
                <button
                  type="button"
                  onClick={() => moveBy(id, 1)}
                  disabled={idx === order.length - 1}
                  aria-label="Move down"
                  className="rounded-md px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted disabled:opacity-30"
                >
                  Down ▼
                </button>
              </div>
              {sec.node}
            </div>
          );
        })}
      </div>
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
