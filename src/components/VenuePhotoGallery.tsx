/**
 * VenuePhotoGallery — grid of venue photos with expandable lightbox.
 * Shows primary photo large, remaining in a grid, with a "See all" overlay.
 */

import { useState } from "react";
import { Camera, ChevronLeft, ChevronRight, X } from "lucide-react";

export type VenuePhoto = {
  id: string;
  url: string;
  caption?: string;
  isPrimary?: boolean;
};

export function VenuePhotoGallery({ photos }: { photos: VenuePhoto[] }) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (photos.length === 0) {
    return (
      <div className="grid h-48 place-items-center rounded-2xl border border-dashed border-ink/15 bg-cream/50">
        <div className="flex flex-col items-center gap-1 text-ink/30">
          <Camera className="h-8 w-8" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest">
            No photos yet
          </span>
        </div>
      </div>
    );
  }

  const sorted = [...photos].sort((a, b) =>
    a.isPrimary ? -1 : b.isPrimary ? 1 : 0,
  );

  return (
    <>
      {/* Grid */}
      <div className="grid grid-cols-4 gap-1.5 overflow-hidden rounded-2xl">
        {sorted.slice(0, 5).map((photo, i) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setLightbox(i)}
            className={`group relative overflow-hidden ${
              i === 0 ? "col-span-2 row-span-2" : ""
            }`}
          >
            <img
              src={photo.url}
              alt={photo.caption || "Venue photo"}
              className="h-full w-full object-cover transition group-hover:scale-105"
              loading="lazy"
              style={{ aspectRatio: i === 0 ? "1" : "1" }}
            />
            {/* "See all" overlay on last visible photo */}
            {i === 4 && photos.length > 5 && (
              <div className="absolute inset-0 grid place-items-center bg-ink/50">
                <span className="font-mono text-sm font-bold text-cream">
                  +{photos.length - 5} more
                </span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-4">
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-cream hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>

          {lightbox > 0 && (
            <button
              type="button"
              onClick={() => setLightbox(lightbox - 1)}
              className="absolute left-4 rounded-full bg-white/10 p-2 text-cream hover:bg-white/20"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          <div className="flex max-h-[80vh] max-w-[80vw] flex-col items-center gap-3">
            <img
              src={sorted[lightbox].url}
              alt={sorted[lightbox].caption || "Venue photo"}
              className="max-h-[75vh] rounded-xl object-contain"
            />
            {sorted[lightbox].caption && (
              <p className="font-mono text-[11px] text-cream/70">
                {sorted[lightbox].caption}
              </p>
            )}
            <span className="font-mono text-[10px] text-cream/40">
              {lightbox + 1} / {sorted.length}
            </span>
          </div>

          {lightbox < sorted.length - 1 && (
            <button
              type="button"
              onClick={() => setLightbox(lightbox + 1)}
              className="absolute right-4 rounded-full bg-white/10 p-2 text-cream hover:bg-white/20"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </div>
      )}
    </>
  );
}
