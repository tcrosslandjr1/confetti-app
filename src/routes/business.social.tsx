import { createFileRoute, redirect } from "@tanstack/react-router";
import { Instagram, Music2, Plus, Settings as SettingsIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BusinessPageShell } from "@/components/business/BusinessTabNav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/business/social")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/business/login" });
  },
  head: () => ({ meta: [{ title: "Social Accounts — Confetti for Business" }] }),
  component: BusinessSocialPage,
});

function BusinessSocialPage() {
  return (
    <BusinessPageShell
      eyebrow="Social Accounts"
      title="Connect your channels"
      description="We pull recent posts and trending hashtags to fill out your venue page."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <PlatformCard
          icon={<Music2 className="h-5 w-5" />}
          name="TikTok"
          connected
          handle="@rooftop.dc"
          lastSync="2h ago"
          hashtags={["#RooftopDC", "#AfrobeatsDC", "#LateNightVibes"]}
          locationTag="Washington, DC"
        />
        <PlatformCard
          icon={<Instagram className="h-5 w-5" />}
          name="Instagram"
          connected={false}
          hashtags={[]}
        />
      </div>
    </BusinessPageShell>
  );
}

function PlatformCard({
  icon,
  name,
  connected,
  handle,
  lastSync,
  hashtags,
  locationTag,
}: {
  icon: React.ReactNode;
  name: string;
  connected: boolean;
  handle?: string;
  lastSync?: string;
  hashtags: string[];
  locationTag?: string;
}) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
          <div>
            <div className="font-display text-lg font-bold">{name}</div>
            <div className="text-xs text-muted-foreground">
              {connected ? `${handle} · synced ${lastSync}` : "Not connected"}
            </div>
          </div>
        </div>
        <Button size="sm" variant={connected ? "outline" : "default"}>
          {connected ? (
            <>
              <SettingsIcon className="mr-1 h-3 w-3" /> Edit
            </>
          ) : (
            <>
              <Plus className="mr-1 h-3 w-3" /> Connect
            </>
          )}
        </Button>
      </div>

      {connected && (
        <div className="space-y-3">
          <Field label="Location tag" value={locationTag ?? "—"} />
          <div>
            <div className="mb-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Hashtags
            </div>
            <div className="flex flex-wrap gap-1">
              {hashtags.map((h) => (
                <span
                  key={h}
                  className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium"
                >
                  {h}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background/50 px-3 py-2">
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}
