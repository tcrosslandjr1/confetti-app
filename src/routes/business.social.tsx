import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Instagram, Loader2, Music2, Save, Unlink } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BusinessPageShell } from "@/components/business/BusinessTabNav";
import {
  NoVenueClaim,
  VenueSwitcher,
  useManagedVenues,
} from "@/components/business/useManagedVenue";
import {
  disconnectSocial,
  getManagedVenue,
  updateVenueSocial,
} from "@/lib/business-portal.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/business/social")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/business/login" });
  },
  head: () => ({ meta: [{ title: "Social Accounts — Confetti for Business" }] }),
  component: BusinessSocialPage,
});

function BusinessSocialPage() {
  const { venues, activeId, setActiveId, isLoading } = useManagedVenues();
  const fetchVenue = useServerFn(getManagedVenue);

  const venueQuery = useQuery({
    queryKey: ["managed-venue", activeId],
    queryFn: () => fetchVenue({ data: { venueId: activeId! } }),
    enabled: Boolean(activeId),
  });

  return (
    <BusinessPageShell
      eyebrow="Social Accounts"
      title="Connect your channels"
      description="We pull recent posts and trending hashtags to fill out your venue page."
      actions={<VenueSwitcher venues={venues} activeId={activeId} onChange={setActiveId} />}
    >
      {isLoading || venueQuery.isLoading ? (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : !venues.length ? (
        <NoVenueClaim />
      ) : venueQuery.data ? (
        <div className="grid gap-4 md:grid-cols-2">
          <PlatformCard
            venueId={activeId!}
            platform="tiktok"
            icon={<Music2 className="h-5 w-5" />}
            name="TikTok"
            url={venueQuery.data.tiktok_url}
            handle={venueQuery.data.tiktok_handle}
            hashtags={(venueQuery.data.tiktok_hashtags as string[] | null) ?? []}
            locationTag={venueQuery.data.tiktok_location_tag}
            lastSync={venueQuery.data.socials_refreshed_at}
          />
          <PlatformCard
            venueId={activeId!}
            platform="instagram"
            icon={<Instagram className="h-5 w-5" />}
            name="Instagram"
            url={venueQuery.data.instagram_url}
            handle={venueQuery.data.instagram_handle}
            hashtags={(venueQuery.data.instagram_hashtags as string[] | null) ?? []}
            locationTag={venueQuery.data.instagram_location_tag}
            lastSync={venueQuery.data.socials_refreshed_at}
          />
        </div>
      ) : null}
    </BusinessPageShell>
  );
}

function PlatformCard({
  venueId,
  platform,
  icon,
  name,
  url,
  handle,
  hashtags,
  locationTag,
  lastSync,
}: {
  venueId: string;
  platform: "tiktok" | "instagram";
  icon: React.ReactNode;
  name: string;
  url: string | null;
  handle: string | null;
  hashtags: string[];
  locationTag: string | null;
  lastSync: string | null;
}) {
  const save = useServerFn(updateVenueSocial);
  const disc = useServerFn(disconnectSocial);
  const qc = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [urlVal, setUrl] = useState(url ?? "");
  const [handleVal, setHandle] = useState(handle ?? "");
  const [tagsStr, setTagsStr] = useState(hashtags.join(", "));
  const [loc, setLoc] = useState(locationTag ?? "");

  useEffect(() => {
    setUrl(url ?? "");
    setHandle(handle ?? "");
    setTagsStr(hashtags.join(", "));
    setLoc(locationTag ?? "");
  }, [url, handle, hashtags, locationTag]);

  const connected = Boolean(url || handle);

  const saveMut = useMutation({
    mutationFn: () =>
      save({
        data: {
          venueId,
          [platform === "tiktok" ? "tiktokOfficial" : "instagramOfficial"]: urlVal,
          [platform === "tiktok" ? "tiktokHandle" : "instagramHandle"]: handleVal,
          [platform === "tiktok" ? "tiktokHashtags" : "instagramHashtags"]: tagsStr
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          [platform === "tiktok" ? "tiktokLocationTag" : "instagramLocationTag"]: loc,
        } as any,
      }),
    onSuccess: () => {
      toast.success(`${name} updated`);
      setEditing(false);
      qc.invalidateQueries({ queryKey: ["managed-venue", venueId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const discMut = useMutation({
    mutationFn: () => disc({ data: { venueId, platform } }),
    onSuccess: () => {
      toast.success(`${name} disconnected`);
      qc.invalidateQueries({ queryKey: ["managed-venue", venueId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

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
              {connected
                ? `${handle ?? url} · ${lastSync ? `synced ${new Date(lastSync).toLocaleDateString()}` : "not yet synced"}`
                : "Not connected"}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {connected && !editing && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => discMut.mutate()}
              disabled={discMut.isPending}
            >
              <Unlink className="mr-1 h-3 w-3" /> Disconnect
            </Button>
          )}
          <Button
            size="sm"
            variant={editing ? "default" : "outline"}
            onClick={() => (editing ? saveMut.mutate() : setEditing(true))}
            disabled={saveMut.isPending}
          >
            {editing ? (
              <>
                <Save className="mr-1 h-3 w-3" /> {saveMut.isPending ? "Saving…" : "Save"}
              </>
            ) : connected ? (
              "Edit"
            ) : (
              "Connect"
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <Field
          label="Profile URL"
          value={urlVal}
          editing={editing}
          placeholder={`https://${platform}.com/@yourvenue`}
          onChange={setUrl}
        />
        <Field
          label="Handle"
          value={handleVal}
          editing={editing}
          placeholder="@yourvenue"
          onChange={setHandle}
        />
        <Field
          label="Location tag"
          value={loc}
          editing={editing}
          placeholder="Washington, DC"
          onChange={setLoc}
        />
        <Field
          label="Hashtags (comma-separated)"
          value={tagsStr}
          editing={editing}
          placeholder="rooftopdc, afrobeats"
          onChange={setTagsStr}
        />
      </div>
    </Card>
  );
}

function Field({
  label,
  value,
  editing,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  editing: boolean;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      {editing ? (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-sm outline-none focus:border-ink"
        />
      ) : (
        <div className="rounded-lg border bg-background/50 px-3 py-2 text-sm font-medium">
          {value || <span className="text-muted-foreground">—</span>}
        </div>
      )}
    </div>
  );
}
