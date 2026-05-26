/**
 * VenueReviews — full review section for a venue detail page.
 * Shows aggregate rating, sub-ratings breakdown, filters, and review list.
 */

import { useState } from "react";
import { Star, Filter, PenLine } from "lucide-react";
import { StarRating } from "@/components/StarRating";
import { ReviewCard, type ReviewData } from "@/components/ReviewCard";
import { ReviewForm } from "@/components/ReviewForm";

type SortOption = "recent" | "highest" | "lowest" | "helpful";

export function VenueReviews({
  venueId,
  venueName,
  averageRating,
  reviewCount,
  reviews,
  onSubmitReview,
  onHelpful,
}: {
  venueId: string;
  venueName: string;
  averageRating: number;
  reviewCount: number;
  reviews: ReviewData[];
  onSubmitReview?: (review: Parameters<typeof ReviewForm>[0] extends { onSubmit: infer F } ? (F extends (r: infer R) => void ? R : never) : never) => void;
  onHelpful?: (reviewId: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [sort, setSort] = useState<SortOption>("recent");

  const sorted = [...reviews].sort((a, b) => {
    if (sort === "highest") return b.rating - a.rating;
    if (sort === "lowest") return a.rating - b.rating;
    if (sort === "helpful") return b.helpfulCount - a.helpfulCount;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Rating distribution
  const dist = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => r.rating === stars).length,
    pct: reviews.length ? (reviews.filter((r) => r.rating === stars).length / reviews.length) * 100 : 0,
  }));

  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-cream">
          Reviews
        </h2>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-cream px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-cream shadow-brut transition hover:-translate-y-0.5"
        >
          <PenLine className="h-3.5 w-3.5" /> Write review
        </button>
      </div>

      {/* Aggregate stats */}
      <div className="flex gap-6 rounded-2xl border border-cream/10 bg-white/60 p-5 backdrop-blur">
        <div className="flex flex-col items-center gap-1">
          <span className="font-display text-4xl font-bold text-cream">
            {averageRating.toFixed(1)}
          </span>
          <StarRating value={averageRating} size="sm" showLabel={false} />
          <span className="font-mono text-[10px] text-cream/50">
            {reviewCount.toLocaleString()} review{reviewCount !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex flex-1 flex-col justify-center gap-1">
          {dist.map((d) => (
            <div key={d.stars} className="flex items-center gap-2">
              <span className="w-4 text-right font-mono text-[10px] font-bold text-cream/60">
                {d.stars}
              </span>
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-cream/10">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all"
                  style={{ width: `${d.pct}%` }}
                />
              </div>
              <span className="w-6 font-mono text-[10px] text-cream/50">
                {d.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Review form */}
      {showForm && onSubmitReview && (
        <ReviewForm
          venueId={venueId}
          venueName={venueName}
          onSubmit={(r) => {
            onSubmitReview(r);
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Sort controls */}
      {reviews.length > 1 && (
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-cream/40" />
          {(["recent", "highest", "lowest", "helpful"] as SortOption[]).map(
            (opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setSort(opt)}
                className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest transition ${
                  sort === opt
                    ? "bg-ink text-cream"
                    : "text-cream/50 hover:bg-cream/5"
                }`}
              >
                {opt}
              </button>
            ),
          )}
        </div>
      )}

      {/* Review list */}
      <div className="flex flex-col gap-3">
        {sorted.length === 0 ? (
          <div className="py-8 text-center">
            <p className="font-display text-lg font-bold text-cream/40">
              No reviews yet
            </p>
            <p className="mt-1 text-sm text-cream/40">
              Be the first to review {venueName}!
            </p>
          </div>
        ) : (
          sorted.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onHelpful={onHelpful}
            />
          ))
        )}
      </div>
    </section>
  );
}
