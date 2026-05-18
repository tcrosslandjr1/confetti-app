import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EyeOff, Eye, Loader2, Star, Trash2, Upload } from "lucide-react";
import { useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BusinessPageShell } from "@/components/business/BusinessTabNav";
import {
  NoVenueClaim,
  VenueSwitcher,
  useManagedVenues,
} from "@/components/business/useManagedVenue";
import {
  getManagedVenue,
  removeOfficialPhoto,
  setHeroImage,
  toggleMediaHidden,
  uploadOfficialPhoto,
} from "@/lib/business-portal.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/business/media")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/business/login" });
  },
  head: () => ({ meta: [{ title: "Media Manager — Confetti for Business" }] }),
  component: BusinessMediaPage,
});

type MediaItem = { url: string; source: "Official" | "Google" | "TikTok" | "Instagram" };

function BusinessMediaPage() {
  const { venues, activeId, setActiveId, isLoading: venuesLoading } = useManagedVenues();
  const fetchVenue = useServerFn(getManagedVenue);
  const upload = useServerFn(uploadOfficialPhoto);
  const remove = useServerFn(removeOfficialPhoto);
  const setHero = useServerFn(setHeroImage);
  const toggleHide = useServerFn(toggleMediaHidden);
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const venueQuery = useQuery({
    queryKey: ["managed-venue", activeId],
    queryFn: () => fetchVenue({ data: { venueId: activeId! } }),
    enabled: Boolean(activeId),
  });
  const venue = venueQuery.data;

  const invalidate = () => qc.invalidateQueries({ queryKey: ["managed-venue", activeId] });

  const uploadMut = useMutation({
    mutationFn: async (file: File) => {
      const buf = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
      return upload({
        data: {
          venueId: activeId!,
          filename: file.name,
          contentType: file.type || "image/jpeg",
          base64,
          setAsHero: !venue?.hero_image_url,
        },
      });
    },
    onSuccess: () => {
      toast.success("Photo uploaded");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMut = useMutation({
    mutationFn: (url: string) => remove({ data: { venueId: activeId!, url } }),
    onSuccess: () => {
      toast.success("Removed");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const heroMut = useMutation({
    mutationFn: (url: string) => setHero({ data: { venueId: activeId!, url } }),
    onSuccess: () => {
      toast.success("Hero updated");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const hideMut = useMutation({
    mutationFn: (url: string) => toggleHide({ data: { venueId: activeId!, url } }),
    onSuccess: (r) => {
      toast.success(r.hidden ? "Hidden from page" : "Visible again");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const media: MediaItem[] = [];
  if (venue) {
    const officials = (venue.official_photos as string[] | null) ?? [];
    const google = ((venue.google_images as unknown as string[] | null) ?? []).slice(0, 12);
    const tt = (venue.tiktok_thumbnails as string[] | null) ?? [];
    const ig = (venue.instagram_thumbnails as string[] | null) ?? [];
    officials.forEach((url) => media.push({ url, source: "Official" }));
    google.forEach((url) => media.push({ url, source: "Google" }));
    tt.forEach((url) => media.push({ url, source: "TikTok" }));
    ig.forEach((url) => media.push({ url, source: "Instagram" }));
  }

  const hidden = new Set<string>((venue?.hidden_media_urls as string[] | null) ?? []);
  const heroUrl = venue?.hero_image_url ?? null;

  return (
    <BusinessPageShell
      eyebrow="Media Manager"
      title="Photos & videos"
      description="Curate your hero image, official uploads, and the social content we pull in."
      actions={
        <div className="flex items-center gap-2">
          <VenueSwitcher venues={venues} activeId={activeId} onChange={setActiveId} />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f && activeId) uploadMut.mutate(f);
              e.target.value = "";
            }}
          />
          <Button
            onClick={() => fileRef.current?.click()}
            disabled={!activeId || uploadMut.isPending}
          >
            {uploadMut.isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-1.5 h-4 w-4" />
            )}
            Upload photo
          </Button>
        </div>
      }
    >
      {venuesLoading ? (
        <Loading />
      ) : !venues.length ? (
        <NoVenueClaim />
      ) : venueQuery.isLoading ? (
        <Loading />
      ) : (
        <Card className="p-4">
          {media.length === 0 ? (
            <div className="grid place-items-center py-16 text-sm text-muted-foreground">
              No media yet. Upload your first photo to set the hero.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {media.map((m) => {
                const isHero = m.url === heroUrl;
                const isHidden = hidden.has(m.url);
                return (
                  <div
                    key={m.url}
                    className={`group relative aspect-square overflow-hidden rounded-xl border bg-muted ${
                      isHidden ? "opacity-50" : ""
                    }`}
                  >
                    <img src={m.url} alt="" className="h-full w-full object-cover" />
                    <div className="absolute inset-x-0 top-0 flex items-center justify-between p-2">
                      <span className="rounded-full bg-black/55 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-white backdrop-blur">
                        {m.source}
                      </span>
                      {isHero && (
                        <span className="grid h-5 w-5 place-items-center rounded-full bg-amber-400 text-white">
                          <Star className="h-3 w-3 fill-current" />
                        </span>
                      )}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 p-2 opacity-0 transition group-hover:opacity-100">
                      <button
                        onClick={() => heroMut.mutate(m.url)}
                        disabled={isHero || heroMut.isPending}
                        className="rounded-full bg-white/95 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ink hover:bg-white disabled:opacity-50"
                      >
                        {isHero ? "Hero" : "Set hero"}
                      </button>
                      <div className="flex gap-1">
                        <button
                          onClick={() => hideMut.mutate(m.url)}
                          className="grid h-6 w-6 place-items-center rounded-full bg-white/95 text-ink hover:bg-white"
                          title={isHidden ? "Unhide" : "Hide"}
                        >
                          {isHidden ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        </button>
                        {m.source === "Official" && (
                          <button
                            onClick={() => {
                              if (confirm("Delete this photo?")) removeMut.mutate(m.url);
                            }}
                            className="grid h-6 w-6 place-items-center rounded-full bg-white/95 text-destructive hover:bg-white"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </BusinessPageShell>
  );
}

function Loading() {
  return (
    <div className="grid place-items-center py-16 text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}
