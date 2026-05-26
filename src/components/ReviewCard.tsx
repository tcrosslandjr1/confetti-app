/**
 * ReviewCard — displays a single user review with sub-ratings,
 * owner response, and helpful button.
 */

import { useState } from "react";
import { ThumbsUp, MessageSquare, Camera } from "lucide-react";
import { StarRating } from "@/components/StarRating";

export type ReviewData = {
  id: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  foodRating?: number;
  ambianceRating?: number;
  serviceRating?: number;
  occasionTag?: string;
  body: string;
  photoUrls?: string[];
  createdAt: string;
  helpfulCount: number;
  ownerResponse?: string;
  ownerResponseAt?: string;
};

export function ReviewCard({
  review,
  onHelpful,
}: {
  review: ReviewData;
  onHelpful?: (reviewId: string) => void;
}) {
  const [liked, setLiked] = useState(false);

  const ago = formatTimeAgo(review.createdAt);

  function handleHelpful() {
    if (liked) return;
    setLiked(true);
    onHelpful?.(review.id);
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-cream/10 bg-white/60 p-4 backdrop-blur">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          {review.userAvatar ? (
            <img
              src={review.userAvatar}
              alt=""
              className="h-9 w-9 rounded-full border border-cream/10 object-cover"
            />
          ) : (
            <div className="grid h-9 w-9 place-items-center rounded-full border border-cream/10 bg-cream font-bold text-cream/50 text-sm">
              {review.userName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="font-display text-sm font-bold text-cream">
              {review.userName}
            </div>
            <div className="flex items-center gap-2">
              <StarRating value={review.rating} size="sm" showLabel={false} />
              <span className="text-[10px] text-cream/50">{ago}</span>
            </div>
          </div>
        </div>
        {review.occasionTag && (
          <span className="rounded-full bg-violet-100 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-violet-700">
            {review.occasionTag}
          </span>
        )}
      </div>

      {/* Sub-ratings */}
      {(review.foodRating || review.ambianceRating || review.serviceRating) && (
        <div className="flex gap-4">
          {review.foodRating && (
            <SubRating label="Food" value={review.foodRating} />
          )}
          {review.ambianceRating && (
            <SubRating label="Vibe" value={review.ambianceRating} />
          )}
          {review.serviceRating && (
            <SubRating label="Service" value={review.serviceRating} />
          )}
        </div>
      )}

      {/* Body */}
      <p className="text-[13px] leading-relaxed text-cream/80">{review.body}</p>

      {/* Photos */}
      {review.photoUrls && review.photoUrls.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {review.photoUrls.map((url, i) => (
            <img
              key={i}
              src={url}
              alt={`Review photo ${i + 1}`}
              className="h-20 w-20 shrink-0 rounded-xl border border-cream/10 object-cover"
              loading="lazy"
            />
          ))}
        </div>
      )}

      {/* Owner response */}
      {review.ownerResponse && (
        <div className="ml-4 rounded-xl border-l-4 border-coral/50 bg-coral/5 p-3">
          <div className="mb-1 flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-widest text-coral">
            <MessageSquare className="h-3 w-3" /> Owner response
          </div>
          <p className="text-[12px] leading-relaxed text-cream/70">
            {review.ownerResponse}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={handleHelpful}
          disabled={liked}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest transition ${
            liked
              ? "bg-coral/10 text-coral"
              : "text-cream/50 hover:bg-cream/5 hover:text-cream"
          }`}
        >
          <ThumbsUp className="h-3 w-3" />
          Helpful {review.helpfulCount + (liked ? 1 : 0) > 0
            ? `(${review.helpfulCount + (liked ? 1 : 0)})`
            : ""}
        </button>
      </div>
    </div>
  );
}

function SubRating({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-1">
      <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-cream/50">
        {label}
      </span>
      <StarRating value={value} size="sm" showLabel={false} />
    </div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}
