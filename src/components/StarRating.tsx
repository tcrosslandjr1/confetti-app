/**
 * StarRating — reusable star display + interactive rating input.
 *
 * Usage:
 *   <StarRating value={4.2} />                    — read-only display
 *   <StarRating value={selected} onChange={set} /> — interactive picker
 */

import { useState } from "react";
import { Star } from "lucide-react";

export function StarRating({
  value = 0,
  onChange,
  size = "md",
  showLabel = true,
  count,
}: {
  value?: number;
  onChange?: (rating: number) => void;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  count?: number;
}) {
  const [hover, setHover] = useState(0);
  const interactive = !!onChange;

  const px = size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-6 w-6" : "h-4.5 w-4.5";
  const textSize =
    size === "sm" ? "text-[11px]" : size === "lg" ? "text-base" : "text-xs";

  return (
    <div className="inline-flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = interactive ? (hover || value) >= star : value >= star;
          const half =
            !interactive && !filled && value >= star - 0.5;
          return (
            <button
              key={star}
              type="button"
              disabled={!interactive}
              onClick={() => onChange?.(star)}
              onMouseEnter={() => interactive && setHover(star)}
              onMouseLeave={() => interactive && setHover(0)}
              className={`${interactive ? "cursor-pointer hover:scale-110" : "cursor-default"} transition`}
              aria-label={`${star} star${star > 1 ? "s" : ""}`}
            >
              <Star
                className={`${px} ${
                  filled
                    ? "fill-amber-400 text-amber-400"
                    : half
                      ? "fill-amber-400/50 text-amber-400"
                      : "fill-transparent text-ink/25"
                }`}
              />
            </button>
          );
        })}
      </div>
      {showLabel && (
        <span className={`${textSize} font-bold text-ink/70`}>
          {value > 0 ? value.toFixed(1) : "—"}
          {count != null && (
            <span className="ml-1 font-normal text-ink/50">
              ({count.toLocaleString()})
            </span>
          )}
        </span>
      )}
    </div>
  );
}
