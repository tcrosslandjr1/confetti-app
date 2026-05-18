import { createFileRoute, redirect } from "@tanstack/react-router";
import { Clock, RefreshCw, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BusinessPageShell } from "@/components/business/BusinessTabNav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/business/ai-refresh")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/business/login" });
  },
  head: () => ({ meta: [{ title: "AI Refresh — Confetti for Business" }] }),
  component: BusinessAIRefreshPage,
});

function BusinessAIRefreshPage() {
  return (
    <BusinessPageShell
      eyebrow="AI Refresh"
      title="Monthly content refresh"
      description="Confetti's AI rescans Google, TikTok, and Instagram every 30 days to keep your venue page current."
      actions={
        <Button>
          <RefreshCw className="mr-1.5 h-4 w-4" /> Run manual refresh
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Last refresh
          </div>
          <div className="mt-1 font-display text-2xl font-bold">3 days ago</div>
          <div className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" /> Sat 11:24 PM
          </div>
        </Card>
        <Card className="p-5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Next scheduled
          </div>
          <div className="mt-1 font-display text-2xl font-bold">in 27 days</div>
          <div className="mt-1 text-xs text-muted-foreground">Auto-runs on the 1st</div>
        </Card>
        <Card className="p-5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Success rate
          </div>
          <div className="mt-1 font-display text-2xl font-bold">98%</div>
          <div className="mt-1 text-xs text-emerald-600">Last 12 cycles</div>
        </Card>
      </div>

      <Card className="mt-6 p-5">
        <div className="mb-3 inline-flex items-center gap-2 font-display text-lg font-bold">
          <Sparkles className="h-4 w-4 text-primary" /> Updated last cycle
        </div>
        <ul className="grid gap-2 text-sm sm:grid-cols-2">
          {[
            "12 new Google images",
            "8 fresh TikTok clips",
            "6 Instagram posts",
            "15 trending hashtags",
            "2 menu price refreshes",
            "Operating hours verified",
          ].map((item) => (
            <li
              key={item}
              className="flex items-center gap-2 rounded-lg border bg-background/50 px-3 py-2"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {item}
            </li>
          ))}
        </ul>
      </Card>
    </BusinessPageShell>
  );
}
