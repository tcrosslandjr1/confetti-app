import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  Heart,
  Bookmark,
  Trophy,
  Sparkles,
  Settings,
  LogOut,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { MobileHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/profile")({
  component: ProfilePage,
});

function ProfilePage() {
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
        supabase.from("itineraries").select("id", { count: "exact", head: true }).eq("user_id", userId!),
        supabase.from("favorite_stops").select("id", { count: "exact", head: true }).eq("user_id", userId!),
        supabase.from("bookings").select("id", { count: "exact", head: true }).eq("user_id", userId!),
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

  return (
    <div className="pb-6">
      <MobileHeader eyebrow="Profile" title="You" />

      <section className="px-5">
        <Card className="flex items-center gap-4 p-5">
          <div className="size-16 shrink-0 overflow-hidden rounded-full bg-muted">
            {profile?.avatar_url && (
              <img
                src={profile.avatar_url}
                alt=""
                className="size-full object-cover"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-lg font-semibold">
              {profile?.display_name ?? user.email?.split("@")[0]}
            </div>
            <div className="text-xs text-muted-foreground">
              Level {profile?.level ?? 1} · {profile?.xp ?? 0} Confetti
            </div>
          </div>
        </Card>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <Stat label="Plans" value={counts?.trips ?? 0} />
          <Stat label="Saved" value={counts?.faves ?? 0} />
          <Stat label="Bookings" value={counts?.bookings ?? 0} />
        </div>
      </section>

      <section className="mt-6 px-5">
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <Row to="/portal/saved" icon={Bookmark} label="Saved plans" />
          <Row to="/portal/achievements" icon={Trophy} label="Rewards & perks" />
          <Row to="/favorites" icon={Heart} label="Favorite venues" />
          <Row to="/taste-tuner" icon={Sparkles} label="Tune your vibes" />
          <Row to="/portal/profile" icon={Settings} label="Preferences" />
        </div>
        <Button
          variant="ghost"
          className="mt-4 w-full text-muted-foreground"
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = "/";
          }}
        >
          <LogOut className="mr-2 size-4" /> Sign out
        </Button>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-3 text-center">
      <div className="text-xl font-bold">{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
    </Card>
  );
}

function Row({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 hover:bg-muted/40"
    >
      <Icon className="size-4 text-primary" />
      <span className="flex-1 text-sm font-medium">{label}</span>
      <ChevronRight className="size-4 text-muted-foreground" />
    </Link>
  );
}
