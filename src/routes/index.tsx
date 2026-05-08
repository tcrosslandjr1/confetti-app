import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Concierge — Your AI guide to the DMV" },
      { name: "description", content: "Personalized dining, nightlife, and curated experiences across DC, Maryland, and Virginia." },
    ],
  }),
  component: Gate,
});

function Gate() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      void navigate({ to: "/auth" });
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_complete")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (!data?.onboarding_complete) {
        void navigate({ to: "/onboarding" });
      } else {
        void navigate({ to: "/concierge" });
      }
    })().catch(() => {
      if (!cancelled) setChecking(false);
    });
    return () => { cancelled = true; };
  }, [user, loading, navigate]);

  return (
    <div className="grid min-h-screen place-items-center bg-background px-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-vibe shadow-pop">
          <Sparkles className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="font-display text-2xl font-bold">
          <span className="text-gradient">Concierge</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          {checking ? "Setting things up..." : "Loading..."}
        </p>
      </div>
    </div>
  );
}
