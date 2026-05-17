import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export type GalleryItem = { url: string; source?: string; attribution?: string | null };

type Props = {
  items: GalleryItem[];
  fallback?: React.ReactNode;
};

export function VenueGallery({ items, fallback }: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  if (!items.length) return <>{fallback}</>;

  return (
    <>
      <div className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 pl-1">
        {items.map((it, i) => (
          <button
            key={`${it.url}-${i}`}
            type="button"
            onClick={() => setOpenIdx(i)}
            className="group relative h-24 w-32 shrink-0 snap-start overflow-hidden rounded-xl border-2 border-ink bg-cream shadow-brut transition-pop hover:-translate-y-0.5"
            aria-label={`Photo ${i + 1} of ${items.length}`}
          >
            <img
              src={it.url}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      {openIdx !== null && (
        <Lightbox
          items={items}
          index={openIdx}
          onClose={() => setOpenIdx(null)}
          onIndex={setOpenIdx}
        />
      )}
    </>
  );
}

function Lightbox({
  items,
  index,
  onClose,
  onIndex,
}: {
  items: GalleryItem[];
  index: number;
  onClose: () => void;
  onIndex: (i: number) => void;
}) {
  const prev = () => onIndex((index - 1 + items.length) % items.length);
  const next = () => onIndex((index + 1) % items.length);
  const it = items[index];
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-ink/90 p-4"
      onClick={onClose}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full border-2 border-cream bg-ink text-cream"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          prev();
        }}
        className="absolute left-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border-2 border-cream bg-ink text-cream"
        aria-label="Previous photo"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <img
        src={it.url}
        alt={it.attribution ?? ""}
        className="max-h-[85vh] max-w-full rounded-xl border-2 border-cream object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        onClick={(e) => {
          e.stopPropagation();
          next();
        }}
        className="absolute right-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border-2 border-cream bg-ink text-cream"
        aria-label="Next photo"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
      {it.attribution && (
        <p className="absolute bottom-4 left-1/2 max-w-[90vw] -translate-x-1/2 truncate rounded-full bg-ink/70 px-3 py-1 text-center font-mono text-[10px] uppercase tracking-widest text-cream/80">
          {it.attribution}
        </p>
      )}
    </div>
  );
}
