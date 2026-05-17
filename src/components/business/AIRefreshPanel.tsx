import { useState } from "react";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requestVenueRefresh } from "@/lib/business-portal.functions";

function fmt(d: string | null | undefined) {
  if (!d) return "Never";
  return new Date(d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function nextRefreshFrom(d: string | null | undefined) {
  const base = d ? new Date(d) : new Date();
  const next = new Date(base);
  next.setMonth(next.getMonth() + 1);
  return next.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function AIRefreshPanel({
  venueId,
  galleryRefreshedAt,
  socialsRefreshedAt,
  onRefreshed,
}: {
  venueId: string;
  galleryRefreshedAt: string | null | undefined;
  socialsRefreshedAt: string | null | undefined;
  onRefreshed: () => void;
}) {
  const refresh = useServerFn(requestVenueRefresh);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      const res = await refresh({ data: { venueId } });
      toast.success(
        `Refreshed · ${res.photos_added ?? 0} photos, ${res.socials_found ?? 0} social links`,
      );
      onRefreshed();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Refresh failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          AI monthly refresh
        </CardTitle>
        <Button size="sm" variant="outline" onClick={run} disabled={busy}>
          {busy ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Run now
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          <Stat label="Last photo refresh" value={fmt(galleryRefreshedAt)} />
          <Stat label="Last social refresh" value={fmt(socialsRefreshedAt)} />
          <Stat label="Next scheduled" value={nextRefreshFrom(galleryRefreshedAt)} />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          The AI agent pulls fresh Google Photos, TikTok and Instagram previews on the 1st of every
          month. You can trigger an on-demand refresh anytime.
        </p>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-medium">{value}</div>
    </div>
  );
}
