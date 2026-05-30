import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowLeft, Upload, Trash2, Star, EyeOff, Eye, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  useManagedVenues,
  VenueSwitcher,
  NoVenueClaim,
} from "@/components/business/useManagedVenue";
import {
  getManagedVenue,
  uploadOfficialPhoto,
  removeOfficialPhoto,
  setHeroImage,
  toggleMediaHidden,
} from "@/lib/business-api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/business/media")({
  beforeLoad: async () => {
    const { requireBusinessAccess } = await import("@/lib/business-guards");
    await requireBusinessAccess();
  },
  component: BusinessMediaPage,
  head: () => ({
    meta: [
      { title: "Media — Confetti for Business" },
      { name: "description", content: "Upload and manage venue photos." },
    ],
  }),
});

function BusinessMediaPage() {
  useAuth();
  const qc = useQueryClient();
  const {
    venues,
    activeId,
    activeVenue,
    setActiveId,
    isLoading: venuesLoading,
  } = useManagedVenues();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: venue, isLoading } = useQuery({
    queryKey: ["managed-venue-detail", activeId],
    queryFn: () => getManagedVenue(activeId!),
    enabled: !!activeId,
  });

  const photos: string[] = venue?.official_photos ?? [];
  const heroUrl = venue?.hero_image_url ?? null;
  const hiddenUrls: string[] = venue?.hidden_media_urls ?? [];

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !activeId) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are supported");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5 MB");
      return;
    }
    setUploading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      await uploadOfficialPhoto({
        venueId: activeId,
        filename: file.name,
        contentType: file.type,
        base64,
        setAsHero: photos.length === 0,
      });
      toast.success("Photo uploaded!");
      qc.invalidateQueries({ queryKey: ["managed-venue-detail", activeId] });
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const removeMut = useMutation({
    mutationFn: (url: string) => removeOfficialPhoto({ venueId: activeId!, url }),
    onSuccess: () => {
      toast.success("Photo removed");
      qc.invalidateQueries({ queryKey: ["managed-venue-detail", activeId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const heroMut = useMutation({
    mutationFn: (url: string) => setHeroImage({ venueId: activeId!, url }),
    onSuccess: () => {
      toast.success("Hero image updated");
      qc.invalidateQueries({ queryKey: ["managed-venue-detail", activeId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMut = useMutation({
    mutationFn: (url: string) => toggleMediaHidden({ venueId: activeId!, url }),
    onSuccess: (_data, url) => {
      toast.success(hiddenUrls.includes(url) ? "Photo visible" : "Photo hidden");
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
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/business/dashboard" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Media</h1>
          <VenueSwitcher venues={venues} activeId={activeId} onChange={setActiveId} />
        </div>
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
          <Button onClick={() => fileRef.current?.click()} size="sm" disabled={uploading}>
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? "Uploading..." : "Upload Photo"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">Loading media...</p>
      ) : photos.length === 0 ? (
        <div className="mt-8 grid place-items-center rounded-2xl border border-dashed p-10 text-center">
          <ImageIcon className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            No photos yet. Upload your first photo to showcase your venue.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {photos.map((url, i) => {
            const isHero = url === heroUrl;
            const isHidden = hiddenUrls.includes(url);
            return (
              <motion.div
                key={url}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="group relative overflow-hidden">
                  <div className="aspect-square">
                    <img
                      src={url}
                      alt={`Venue photo ${i + 1}`}
                      className={`h-full w-full object-cover transition-opacity ${isHidden ? "opacity-40" : ""}`}
                    />
                  </div>
                  {isHero && (
                    <div className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                      HERO
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                    {!isHero && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white hover:bg-white/20"
                        onClick={() => heroMut.mutate(url)}
                        title="Set as hero"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-white hover:bg-white/20"
                      onClick={() => toggleMut.mutate(url)}
                      title={isHidden ? "Show" : "Hide"}
                    >
                      {isHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-white hover:bg-white/20"
                      onClick={() => {
                        if (confirm("Remove this photo?")) removeMut.mutate(url);
                      }}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 md:px-6">{children}</div>
    </div>
  );
}
