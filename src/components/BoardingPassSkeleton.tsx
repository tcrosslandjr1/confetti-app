import { Plane } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton loader that mirrors the BoardingPass layout.
 * Shown while the itinerary is still being built so the user
 * sees an instant "page loaded" signal instead of a blank spinner.
 */
export function BoardingPassSkeleton() {
  return (
    <article
      className="relative overflow-hidden rounded-3xl border-2 border-cream/20 bg-gradient-to-br from-stone-900 via-stone-800 to-zinc-900 text-cream shadow-pop"
      aria-label="Loading itinerary"
    >
      {/* perforated edge */}
      <div className="pointer-events-none absolute left-0 right-0 top-1/2 hidden h-px -translate-y-1/2 border-t-2 border-dashed border-cream/30 sm:block" />
      <div className="pointer-events-none absolute -left-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 rounded-full bg-background sm:block" />
      <div className="pointer-events-none absolute -right-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 rounded-full bg-background sm:block" />

      <div className="grid gap-0 sm:grid-cols-[minmax(0,1fr)_220px]">
        {/* Main panel */}
        <div className="min-w-0 p-5 sm:p-8">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-20 rounded-full bg-cream/10" />
              <Skeleton className="h-4 w-32 rounded bg-cream/10" />
            </div>
            <div className="flex gap-1">
              <Skeleton className="h-8 w-16 rounded-md bg-cream/10" />
              <Skeleton className="h-8 w-20 rounded-md bg-cream/10" />
            </div>
          </header>

          {/* Title */}
          <Skeleton className="mt-4 h-9 w-3/4 rounded bg-cream/10 sm:h-10" />

          {/* Route: FROM → TO */}
          <div className="mt-6 flex items-end gap-3">
            <div className="min-w-0">
              <Skeleton className="h-3 w-10 rounded bg-cream/10" />
              <Skeleton className="mt-1 h-8 w-16 rounded bg-cream/10" />
              <Skeleton className="mt-1 h-3 w-14 rounded bg-cream/10" />
            </div>
            <div className="flex-1 px-2">
              <div className="relative h-px bg-cream/20">
                <Plane className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-cream/40" />
              </div>
            </div>
            <div className="min-w-0 text-right">
              <Skeleton className="ml-auto h-3 w-10 rounded bg-cream/10" />
              <Skeleton className="ml-auto mt-1 h-8 w-16 rounded bg-cream/10" />
              <Skeleton className="ml-auto mt-1 h-3 w-20 rounded bg-cream/10" />
            </div>
          </div>

          {/* Detail grid */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {["Date", "Boarding", "City", "Stops"].map((label) => (
              <div key={label}>
                <div className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-cream/40">
                  {label}
                </div>
                <Skeleton className="mt-1 h-5 w-20 rounded bg-cream/10" />
              </div>
            ))}
          </div>

          {/* Confirmed + cost row */}
          <div className="mt-5 flex items-center gap-5">
            <Skeleton className="h-4 w-28 rounded bg-cream/10" />
            <Skeleton className="h-4 w-16 rounded bg-cream/10" />
          </div>
        </div>

        {/* Tear-off stub */}
        <div className="relative flex flex-col justify-between border-t-2 border-dashed border-cream/30 bg-gradient-to-br from-amber-400 to-yellow-500 p-6 text-cream sm:border-l-2 sm:border-t-0">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest opacity-80">Gate</div>
            <Skeleton className="mt-1 h-12 w-16 rounded bg-cream/10" />
          </div>
          <div className="mt-6">
            <div className="font-mono text-[10px] uppercase tracking-widest opacity-80">Flight</div>
            <Skeleton className="mt-1 h-7 w-20 rounded bg-cream/10" />
          </div>
          <div className="mt-6">
            <div className="font-mono text-[10px] uppercase tracking-widest opacity-80">Seat</div>
            <Skeleton className="mt-1 h-7 w-12 rounded bg-cream/10" />
          </div>

          {/* faux barcode */}
          <div className="mt-6 flex h-10 items-end gap-[2px]" aria-hidden>
            {Array.from({ length: 32 }).map((_, i) => (
              <span
                key={i}
                className="block w-[3px] animate-pulse bg-ink/20"
                style={{ height: `${30 + ((i * 53) % 70)}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

/**
 * Skeleton for a single stop card, shown below the boarding pass
 * while the edge function is still verifying venues.
 */
export function StopCardSkeleton({ index }: { index: number }) {
  return (
    <div
      className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm"
      style={{ animationDelay: `${index * 120}ms` }}
    >
      <div className="flex items-start gap-3">
        <Skeleton className="h-10 w-10 flex-shrink-0 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-2/3 rounded" />
          <Skeleton className="h-4 w-1/2 rounded" />
          <Skeleton className="h-3 w-full rounded" />
        </div>
      </div>
    </div>
  );
}

/**
 * Full page skeleton: boarding pass + 4 stop cards + progress message.
 * Used when navigating to a trip that's still being built.
 */
export function TripBuildingSkeleton({ message }: { message?: string }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <BoardingPassSkeleton />
      {message && (
        <p className="text-center text-sm text-muted-foreground animate-pulse">{message}</p>
      )}
      <div className="space-y-4">
        {[0, 1, 2, 3].map((i) => (
          <StopCardSkeleton key={i} index={i} />
        ))}
      </div>
    </div>
  );
}
