/**
 * ReviewForm — submit a review with star rating, sub-ratings,
 * occasion tag, text body, and photo upload.
 */

import { useState } from "react";
import { Camera, Send, X } from "lucide-react";
import { StarRating } from "@/components/StarRating";
import { toast } from "sonner";

const OCCASION_TAGS = [
  "Date Night",
  "Birthday",
  "Business",
  "Friends",
  "Family",
  "Solo",
  "Anniversary",
  "Celebration",
];

export function ReviewForm({
  venueId,
  venueName,
  onSubmit,
  onCancel,
}: {
  venueId: string;
  venueName: string;
  onSubmit: (review: {
    venueId: string;
    rating: number;
    foodRating?: number;
    ambianceRating?: number;
    serviceRating?: number;
    occasionTag?: string;
    body: string;
    photoUrls: string[];
  }) => void;
  onCancel?: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [foodRating, setFoodRating] = useState(0);
  const [ambianceRating, setAmbianceRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [occasion, setOccasion] = useState("");
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select an overall rating");
      return;
    }
    if (body.trim().length < 10) {
      toast.error("Please write at least a short review (10+ characters)");
      return;
    }
    setSubmitting(true);
    onSubmit({
      venueId,
      rating,
      foodRating: foodRating || undefined,
      ambianceRating: ambianceRating || undefined,
      serviceRating: serviceRating || undefined,
      occasionTag: occasion || undefined,
      body: body.trim(),
      photoUrls: photos,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl border-2 border-ink bg-white p-5 shadow-brut"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-ink">
          Review {venueName}
        </h3>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full p-1 text-ink/50 hover:bg-ink/5"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Overall rating */}
      <div>
        <label className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">
          Overall rating *
        </label>
        <StarRating value={rating} onChange={setRating} size="lg" showLabel={false} />
      </div>

      {/* Sub-ratings */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-widest text-ink/50">
            Food
          </label>
          <StarRating value={foodRating} onChange={setFoodRating} size="sm" showLabel={false} />
        </div>
        <div>
          <label className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-widest text-ink/50">
            Vibe
          </label>
          <StarRating value={ambianceRating} onChange={setAmbianceRating} size="sm" showLabel={false} />
        </div>
        <div>
          <label className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-widest text-ink/50">
            Service
          </label>
          <StarRating value={serviceRating} onChange={setServiceRating} size="sm" showLabel={false} />
        </div>
      </div>

      {/* Occasion tag */}
      <div>
        <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">
          Occasion
        </label>
        <div className="flex flex-wrap gap-1.5">
          {OCCASION_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setOccasion(occasion === tag ? "" : tag)}
              className={`rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest transition ${
                occasion === tag
                  ? "border-coral bg-coral/10 text-coral"
                  : "border-ink/15 text-ink/60 hover:border-ink/30"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Review body */}
      <div>
        <label className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">
          Your review *
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          placeholder="How was your experience? What would you tell a friend?"
          className="w-full rounded-xl border border-ink/15 bg-cream/50 px-3 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral/50"
        />
        <div className="mt-1 text-right font-mono text-[10px] text-ink/40">
          {body.length} characters
        </div>
      </div>

      {/* Photo previews */}
      {photos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {photos.map((url, i) => (
            <div key={i} className="relative shrink-0">
              <img
                src={url}
                alt=""
                className="h-16 w-16 rounded-lg border border-ink/10 object-cover"
              />
              <button
                type="button"
                onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
                className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-ink text-cream"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => toast("Photo upload coming soon!")}
          className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60 hover:border-ink/30"
        >
          <Camera className="h-3.5 w-3.5" /> Add photos
        </button>
        <button
          type="submit"
          disabled={submitting || rating === 0}
          className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-coral px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-widest text-cream shadow-brut transition hover:-translate-y-0.5 disabled:opacity-50"
        >
          <Send className="h-3.5 w-3.5" /> Post review
        </button>
      </div>
    </form>
  );
}
