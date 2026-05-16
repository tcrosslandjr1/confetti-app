import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { unsplashFor } from "@/lib/venue-images";

type Props = {
  venue: string;
  address?: string | null;
  neighborhood?: string | null;
  /** Used to pick a category-appropriate Unsplash fallback when Google has nothing. */
  category?: string | null;
  className?: string;
  /** Render mode: a single hero image or a small strip of up to 3 thumbs */
  variant?: "hero" | "strip";
  /** Hide entirely if Google has nothing — caller handles fallback */
  hideEmpty?: boolean;
};

const cache = new Map<string, string[]>();

export function GooglePhotos({
  venue,
  address,
  neighborhood,
  category,
  className = "",
  variant = "hero",
  hideEmpty = false,
}: Props) {
  const key = `gph::${venue}::${neighborhood ?? ""}`;
  const [photos, setPhotos] = useState<string[]>(() => cache.get(key) ?? []);
  const [loading, setLoading] = useState(!cache.has(key));

  useEffect(() => {
    if (cache.has(key)) {
      setPhotos(cache.get(key)!);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    supabase.functions
      .invoke("google-places", {
        body: {
          queries: [
            { venue, address: address ?? undefined, neighborhood: neighborhood ?? undefined },
          ],
        },
      })
      .then(({ data }) => {
        if (cancelled) return;
        const first = (data as { results?: { photos?: string[] }[] } | null)?.results?.[0];
        const list = first?.photos ?? [];
        cache.set(key, list);
        setPhotos(list);
      })
      .catch(() => {
        if (!cancelled) cache.set(key, []);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [key, venue, address, neighborhood]);

  // While Google photos are loading — and whenever Google has nothing — we
  // render the category-appropriate Unsplash fallback. It's already warm in
  // the HTTP cache (see preloadFallbackImages) so it paints instantly with
  // no flicker or layout shift.
  if (loading || photos.length === 0) {
    if (!loading && photos.length === 0 && hideEmpty) return null;
    const fallback = unsplashFor(category, venue);
    if (variant === "hero") {
      return (
        <div className={`relative ${className}`}>
          <img
            src={fallback}
            alt={venue}
            width={1200}
            height={432}
            className="h-36 w-full object-cover"
            loading="eager"
            decoding="async"
          />
        </div>
      );
    }
    return (
      <div className={`flex gap-1.5 ${className}`}>
        <img
          src={fallback}
          alt={venue}
          width={400}
          height={64}
          className="h-16 w-full rounded-lg object-cover"
          loading="eager"
          decoding="async"
        />
      </div>
    );
  }

  if (variant === "hero") {
    return (
      <div className={`relative ${className}`}>
        <img
          src={photos[0]}
          alt={`${venue} — photo via Google`}
          className="h-36 w-full object-cover"
          loading="lazy"
        />
        <span className="absolute bottom-1 right-1 rounded-full bg-background/85 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground backdrop-blur">
          via Google
        </span>
      </div>
    );
  }

  // strip
  return (
    <div className={`flex gap-1.5 ${className}`}>
      {photos.slice(0, 3).map((src, i) => (
        <img
          key={i}
          src={src}
          alt={`${venue} photo ${i + 1}`}
          className="h-16 w-1/3 rounded-lg object-cover"
          loading="lazy"
        />
      ))}
    </div>
  );
}
