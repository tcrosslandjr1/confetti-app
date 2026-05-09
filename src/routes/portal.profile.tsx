import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { User, LogOut, Settings, Sparkles, Mail, MapPin, Loader2 } from "lucide-react";
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

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("id,display_name,xp,level").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) { setProfile(data as Profile); setName(data.display_name ?? ""); }
    });
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

      <Button variant="outline" onClick={signOut} className="gap-2"><LogOut className="h-4 w-4" /> Sign out</Button>
    </div>
  );
}
