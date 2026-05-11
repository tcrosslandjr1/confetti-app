import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { User, LogOut, Settings, Sparkles, Mail, MapPin, Loader2, Shield, Compass, Coffee, Sparkle, Eye, SlidersHorizontal, CalendarCheck, Users, Trophy } from "lucide-react";
import { getMyReferralStats, type MyReferralStats } from "@/lib/referrals";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getStoredLocation, requestUserLocation, clearStoredLocation, type UserLocation } from "@/lib/location";

export const Route = createFileRoute("/portal/profile")({
  component: ProfilePage,
});

type Profile = { id: string; display_name: string | null; xp: number; level: number };

function ProfilePage() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [bookingTotals, setBookingTotals] = useState({ upcoming: 0, past: 0 });
  const [refStats, setRefStats] = useState<MyReferralStats>({ invited: 0, signedUp: 0, completed: 0, earnedCents: 0 });
  const [achTotals, setAchTotals] = useState({ unlocked: 0, total: 0, xpEarned: 0 });

  useEffect(() => { setLocation(getStoredLocation()); }, []);

  const refreshLocation = async () => {
    setLocLoading(true);
    const loc = await requestUserLocation({ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
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
    supabase.from("profiles").select("id,display_name,xp,level").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) { setProfile(data as Profile); setName(data.display_name ?? ""); }
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const nowIso = new Date().toISOString();
      const [upRes, pastRes, refs, achRows, userAch] = await Promise.all([
        supabase.from("bookings").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("starts_at", nowIso),
        supabase.from("bookings").select("id", { count: "exact", head: true }).eq("user_id", user.id).lt("starts_at", nowIso),
        getMyReferralStats(),
        supabase.from("achievements").select("id, xp_reward"),
        supabase.from("user_achievements").select("achievement_id").eq("user_id", user.id),
      ]);
      if (cancelled) return;
      const unlockedIds = new Set(((userAch.data ?? []) as { achievement_id: string }[]).map((r) => r.achievement_id));
      const allAch = (achRows.data ?? []) as { id: string; xp_reward: number }[];
      const xpEarned = allAch.reduce((s, a) => s + (unlockedIds.has(a.id) ? a.xp_reward : 0), 0);
      setBookingTotals({ upcoming: upRes.count ?? 0, past: pastRes.count ?? 0 });
      setRefStats(refs);
      setAchTotals({ unlocked: unlockedIds.size, total: allAch.length, xpEarned });
    })();
    return () => { cancelled = true; };
  }, [user]);

  const save = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ display_name: name }).eq("id", user.id);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
  };

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">My Portal</p>
        <h1 className="mt-1 flex items-center gap-2 font-display text-4xl font-bold"><User className="h-8 w-8" /> Profile</h1>
      </header>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-vibe text-2xl font-bold text-primary-foreground">
            {(name || user?.email || "?")[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-2xl font-bold">{name || "Anonymous"}</h2>
            <div className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground"><Mail className="h-3.5 w-3.5" />{user?.email}</div>
          </div>
        </div>

        {profile && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-muted/50 px-4 py-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Level</div>
              <div className="mt-0.5 font-display text-2xl font-bold">{profile.level}</div>
            </div>
            <div className="rounded-2xl bg-muted/50 px-4 py-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">XP</div>
              <div className="mt-0.5 font-display text-2xl font-bold">{profile.xp}</div>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-card">
        <h2 className="mb-4 font-display text-xl font-bold">Display name</h2>
        <div className="flex flex-wrap gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="What should we call you?" className="max-w-sm" />
          <Button onClick={save}>Save</Button>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-card">
        <h2 className="mb-4 font-display text-xl font-bold">Connected Socials</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { key: "ig", label: "Instagram", icon: "📸", color: "#E1306C", connected: true },
            { key: "tt", label: "TikTok", icon: "🎵", color: "#000000", connected: false },
            { key: "yelp", label: "Yelp", icon: "⭐", color: "#D32323", connected: false },
            { key: "google", label: "Google", icon: "🔍", color: "#4285F4", connected: true },
            { key: "spotify", label: "Spotify", icon: "🎧", color: "#1DB954", connected: false },
            { key: "x", label: "X / Twitter", icon: "𝕏", color: "#000000", connected: false },
          ].map((s) => (
            <button
              key={s.key}
              className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3 text-left hover:bg-muted"
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
        <Link to="/taste-tuner" className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-gradient-to-r from-primary/10 to-accent/10 p-4 hover:bg-muted">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-vibe text-primary-foreground">
            <SlidersHorizontal className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="font-display font-bold">Tune My Taste</div>
            <div className="text-xs text-muted-foreground">Swipe through experiences to refine your vibe</div>
          </div>
        </Link>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-card">
        <h2 className="mb-4 font-display text-xl font-bold">Quick links</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <Link to="/concierge/profile" className="flex items-center gap-3 rounded-2xl border border-border p-3 hover:bg-muted">
            <Settings className="h-4 w-4" /> <span className="font-semibold">Preferences & taste</span>
          </Link>
          <Link to="/concierge/passport" className="flex items-center gap-3 rounded-2xl border border-border p-3 hover:bg-muted">
            <Sparkles className="h-4 w-4" /> <span className="font-semibold">View Passport</span>
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold">
            <MapPin className="h-5 w-5" /> Location
          </h2>
          <span className={`text-xs font-mono uppercase tracking-wider ${location ? "text-primary" : "text-muted-foreground"}`}>
            {location ? "Enabled" : "Not set"}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Used to recommend nearby venues and tailor your concierge picks.
        </p>

        {location ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-muted/50 px-4 py-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Latitude</div>
              <div className="mt-0.5 font-mono text-sm">{location.lat.toFixed(6)}</div>
            </div>
            <div className="rounded-2xl bg-muted/50 px-4 py-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Longitude</div>
              <div className="mt-0.5 font-mono text-sm">{location.lng.toFixed(6)}</div>
            </div>
            <div className="rounded-2xl bg-muted/50 px-4 py-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Accuracy</div>
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
            {locLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
            {location ? "Update location" : "Enable location"}
          </Button>
          {location && (
            <Button variant="outline" onClick={forgetLocation}>Clear saved location</Button>
          )}
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-muted/30 p-4">
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
                Stored only on this device (browser local storage). Never shared with third parties or
                tied to your public profile.
              </span>
            </li>
          </ul>
        </div>

        <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
            <Shield className="h-4 w-4" /> Privacy controls
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Clear the saved coordinates from this device at any time. Recommendations will fall back to
            your default city until you re-enable location.
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

      <Button variant="outline" onClick={signOut} className="gap-2"><LogOut className="h-4 w-4" /> Sign out</Button>
    </div>
  );
}
