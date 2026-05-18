import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BusinessPageShell } from "@/components/business/BusinessTabNav";
import {
  NoVenueClaim,
  VenueSwitcher,
  useManagedVenues,
} from "@/components/business/useManagedVenue";
import {
  getManagedVenue,
  requestVenueRefresh,
} from "@/lib/business-portal.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/business/ai-refresh")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/business/login" });
  },
  head: () => ({ meta: [{ title: "AI Refresh — Confetti for Business" }] }),
  component: BusinessAIRefreshPage,
});

function relative(date: string | null | undefined) {
  if (!date) return "Never";
  const ms = Date.now() - new Date(date).getTime();
  const days = Math.floor(ms / 86400000);
  if (days < 1) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

function nextRefresh(last: string | null | undefined) {
  if (!last) return "Pending";
  const next = new Date(last).getTime() + 30 * 86400000;
  const days = Math.max(0, Math.ceil((next - Date.now()) / 86400000));
  return days === 0 ? "Due now" : `in ${days} days`;
}

function BusinessAIRefreshPage() {
  const { venues, activeId, setActiveId, isLoading } = useManagedVenues();
  const fetchVenue = useServerFn(getManagedVenue);
  const refresh = useServerFn(requestVenueRefresh);
  const qc = useQueryClient();

  const venueQuery = useQuery({
    queryKey: ["managed-venue", activeId],
    queryFn: () => fetchVenue({ data: { venueId: activeId! } }),
    enabled: Boolean(activeId),
  });

  const refreshMut = useMutation({
    mutationFn: () => refresh({ data: { venueId: activeId! } }),
    onSuccess: () => {
      toast.success("Refresh job started");
      qc.invalidateQueries({ queryKey: ["managed-venue", activeId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const v = venueQuery.data;
  const galleryAt = v?.gallery_refreshed_at ?? null;
  const socialAt = v?.socials_refreshed_at ?? null;
  const latest =
    galleryAt && socialAt
      ? new Date(galleryAt) > new Date(socialAt)
        ? galleryAt
        : socialAt
      : (galleryAt ?? socialAt);

  return (
    <BusinessPageShell
      eyebrow="AI Refresh"
      title="Monthly content refresh"
      description="Confetti's AI rescans Google, TikTok, and Instagram every 30 days to keep your venue page current."
      actions={
        <div className="flex items-center gap-2">
          <VenueSwitcher venues={venues} activeId={activeId} onChange={setActiveId} />
          <Button onClick={() => refreshMut.mutate()} disabled={!activeId || refreshMut.isPending}>
            {refreshMut.isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-1.5 h-4 w-4" />
            )}
            Run manual refresh
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <Loading />
      ) : !venues.length ? (
        <NoVenueClaim />
      ) : venueQuery.isLoading ? (
        <Loading />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-5">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Last refresh
              </div>
              <div className="mt-1 font-display text-2xl font-bold">{relative(latest)}</div>
              <div className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {latest ? new Date(latest).toLocaleString() : "Awaiting first sync"}
              </div>
            </Card>
            <Card className="p-5">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Next scheduled
              </div>
              <div className="mt-1 font-display text-2xl font-bold">{nextRefresh(latest)}</div>
              <div className="mt-1 text-xs text-muted-foreground">Auto-runs every 30 days</div>
            </Card>
            <Card className="p-5">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Promotion status
              </div>
              <div className="mt-1 font-display text-2xl font-bold">
                {v?.promotion_approved ? "Approved" : "Pending"}
              </div>
              <div
                className={`mt-1 text-xs ${v?.promotion_approved ? "text-emerald-600" : "text-muted-foreground"}`}
              >
                {v?.boost_tier ? `Boost: ${v.boost_tier}` : "No active boost"}
              </div>
            </Card>
          </div>

          <Card className="mt-6 p-5">
            <div className="mb-3 inline-flex items-center gap-2 font-display text-lg font-bold">
              <Sparkles className="h-4 w-4 text-primary" /> Last sync summary
            </div>
            <ul className="grid gap-2 text-sm sm:grid-cols-2">
              <SyncRow
                label="Google images"
                count={((v?.google_images as unknown as unknown[] | null) ?? []).length}
                at={galleryAt}
              />
              <SyncRow
                label="Official photos"
                count={((v?.official_photos as string[] | null) ?? []).length}
                at={galleryAt}
              />
              <SyncRow
                label="TikTok thumbnails"
                count={((v?.tiktok_thumbnails as string[] | null) ?? []).length}
                at={socialAt}
              />
              <SyncRow
                label="Instagram thumbnails"
                count={((v?.instagram_thumbnails as string[] | null) ?? []).length}
                at={socialAt}
              />
              <SyncRow
                label="TikTok hashtags"
                count={((v?.tiktok_hashtags as string[] | null) ?? []).length}
                at={socialAt}
              />
              <SyncRow
                label="Instagram hashtags"
                count={((v?.instagram_hashtags as string[] | null) ?? []).length}
                at={socialAt}
              />
            </ul>
          </Card>
        </>
      )}
    </BusinessPageShell>
  );
}

function SyncRow({ label, count, at }: { label: string; count: number; at: string | null }) {
  return (
    <li className="flex items-center justify-between rounded-lg border bg-background/50 px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        <span className="font-medium">{label}</span>
      </div>
      <div className="text-xs text-muted-foreground">
        <span className="font-mono font-bold text-foreground">{count}</span> · {relative(at)}
      </div>
    </li>
  );
}

function Loading() {
  return (
    <div className="grid place-items-center py-16 text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}
