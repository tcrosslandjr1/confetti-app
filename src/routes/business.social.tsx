import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ArrowLeft, Save, Unlink } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  useManagedVenues,
  VenueSwitcher,
  NoVenueClaim,
} from "@/components/business/useManagedVenue";
import { getManagedVenue, updateVenueSocial, disconnectSocial } from "@/lib/business-api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/business/social")({
  beforeLoad: async () => {
    const { requireBusinessAccess } = await import("@/lib/business-guards");
    await requireBusinessAccess();
  },
  component: BusinessSocialPage,
  head: () => ({
    meta: [
      { title: "Social Links — Confetti for Business" },
      { name: "description", content: "Connect your social media profiles." },
    ],
  }),
});

function BusinessSocialPage() {
  useAuth();
  const qc = useQueryClient();
  const { venues, activeId, setActiveId, isLoading: venuesLoading } = useManagedVenues();

  const { data: venue, isLoading } = useQuery({
    queryKey: ["managed-venue-detail", activeId],
    queryFn: () => getManagedVenue(activeId!),
    enabled: !!activeId,
  });

  const [ig, setIg] = useState({ url: "", handle: "", hashtags: "", locationTag: "" });
  const [tk, setTk] = useState({ url: "", handle: "", hashtags: "", locationTag: "" });

  useEffect(() => {
    if (venue) {
      setIg({
        url: venue.instagram_url ?? "",
        handle: venue.instagram_handle ?? "",
        hashtags: (venue.instagram_hashtags ?? []).join(", "),
        locationTag: venue.instagram_location_tag ?? "",
      });
      setTk({
        url: venue.tiktok_url ?? "",
        handle: venue.tiktok_handle ?? "",
        hashtags: (venue.tiktok_hashtags ?? []).join(", "),
        locationTag: venue.tiktok_location_tag ?? "",
      });
    }
  }, [venue]);

  const saveMut = useMutation({
    mutationFn: () =>
      updateVenueSocial({
        venueId: activeId!,
        instagramOfficial: ig.url,
        instagramHandle: ig.handle,
        instagramHashtags: ig.hashtags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        instagramLocationTag: ig.locationTag,
        tiktokOfficial: tk.url,
        tiktokHandle: tk.handle,
        tiktokHashtags: tk.hashtags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        tiktokLocationTag: tk.locationTag,
      }),
    onSuccess: () => {
      toast.success("Social links saved!");
      qc.invalidateQueries({ queryKey: ["managed-venue-detail", activeId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const disconnectMut = useMutation({
    mutationFn: (platform: "tiktok" | "instagram") =>
      disconnectSocial({ venueId: activeId!, platform }),
    onSuccess: (_d, platform) => {
      toast.success(`${platform === "instagram" ? "Instagram" : "TikTok"} disconnected`);
      qc.invalidateQueries({ queryKey: ["managed-venue-detail", activeId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (venuesLoading) return <PageShell>Loading venues...</PageShell>;
  if (!venues.length)
    return (
      <PageShell>
        <NoVenueClaim />
      </PageShell>
    );

  return (
    <PageShell>
      <div className="flex items-center gap-3">
        <Link to="/business/dashboard" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Social Links</h1>
        <VenueSwitcher venues={venues} activeId={activeId} onChange={setActiveId} />
      </div>

      {isLoading ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">Loading...</p>
      ) : (
        <div className="mt-6 space-y-6">
          {/* Instagram */}
          <Card className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Instagram</h2>
              {(ig.url || ig.handle) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => {
                    if (confirm("Disconnect Instagram?")) disconnectMut.mutate("instagram");
                  }}
                >
                  <Unlink className="mr-1 h-3 w-3" /> Disconnect
                </Button>
              )}
            </div>
            <SocialField
              label="Profile URL"
              value={ig.url}
              onChange={(v) => setIg((p) => ({ ...p, url: v }))}
              placeholder="https://instagram.com/yourvenue"
            />
            <SocialField
              label="Handle"
              value={ig.handle}
              onChange={(v) => setIg((p) => ({ ...p, handle: v }))}
              placeholder="@yourvenue"
            />
            <SocialField
              label="Hashtags"
              value={ig.hashtags}
              onChange={(v) => setIg((p) => ({ ...p, hashtags: v }))}
              placeholder="nightlife, dc, rooftop"
            />
            <SocialField
              label="Location Tag"
              value={ig.locationTag}
              onChange={(v) => setIg((p) => ({ ...p, locationTag: v }))}
              placeholder="Your Venue, Washington DC"
            />
          </Card>

          {/* TikTok */}
          <Card className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">TikTok</h2>
              {(tk.url || tk.handle) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => {
                    if (confirm("Disconnect TikTok?")) disconnectMut.mutate("tiktok");
                  }}
                >
                  <Unlink className="mr-1 h-3 w-3" /> Disconnect
                </Button>
              )}
            </div>
            <SocialField
              label="Profile URL"
              value={tk.url}
              onChange={(v) => setTk((p) => ({ ...p, url: v }))}
              placeholder="https://tiktok.com/@yourvenue"
            />
            <SocialField
              label="Handle"
              value={tk.handle}
              onChange={(v) => setTk((p) => ({ ...p, handle: v }))}
              placeholder="@yourvenue"
            />
            <SocialField
              label="Hashtags"
              value={tk.hashtags}
              onChange={(v) => setTk((p) => ({ ...p, hashtags: v }))}
              placeholder="nightlife, dc, vibes"
            />
            <SocialField
              label="Location Tag"
              value={tk.locationTag}
              onChange={(v) => setTk((p) => ({ ...p, locationTag: v }))}
              placeholder="Your Venue, Washington DC"
            />
          </Card>

          <div className="flex justify-end">
            <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {saveMut.isPending ? "Saving..." : "Save All"}
            </Button>
          </div>
        </div>
      )}
    </PageShell>
  );
}

function SocialField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      <input
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 md:px-6">{children}</div>
    </div>
  );
}
