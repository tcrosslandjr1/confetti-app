import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Sparkles,
  Car,
  Star,
  MapPin,
  Shirt,
  Volume2,
  Clock,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trackEngagement } from "@/lib/analytics";
import { PartnerPickBadge } from "@/components/PartnerPickBadge";
import { trackPartnerClick } from "@/lib/partner-attribution";

/* ------------------------------------------------------------------ */
/*  Flip-card venue tile for the Tonight feed.                        */
/*  Front: photo + name + category.                                   */
/*  Back:  parking, vibe, rating, dress code, quick-detail bullets,   */
/*         plus a "View full details" link to /venue/$id.             */
/* ------------------------------------------------------------------ */

export interface FlipVenue {
  id: string;
  /** Display name — can come from `name` (DB) or `venue` (AI picks) */
  name: string;
  category?: string | null;
  neighborhood?: string | null;
  photo?: string | null;
  rating?: number | null;
  priceLevel?: number | null;
  vibe?: string | null;
  reason?: string | null;
  address?: string | null;
  /** AI-pick tone class, e.g. "bg-purple" */
  tone?: string | null;
  /** Whether this card is a paid Partner Pick (shown with badge). */
  sponsored?: boolean;
  /** Optional override label — defaults to "Partner Pick · Matches your vibe". */
  partnerLabel?: string;
  /** Boost campaign id — used for click attribution on tap. */
  boostCampaignId?: string;
}

interface VenueFlipCardProps {
  venue: FlipVenue;
  /** Width class — default w-44 */
  widthClass?: string;
  /** Analytics source tag */
  source?: string;
  /** Use AI-pick purple accent vs. default coral */
  accent?: "coral" | "purple";
}

export function VenueFlipCard({
  venue,
  widthClass = "w-44",
  source = "tonight",
  accent = "coral",
}: VenueFlipCardProps) {
  const [flipped, setFlipped] = useState(false);

  const accentBorder = accent === "purple" ? "border-purple/20" : "border-ink/8";
  const accentBg = accent === "purple" ? "bg-purple/8" : "bg-coral/8";
  const accentText = accent === "purple" ? "text-purple" : "text-coral";

  function handleFlip(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    e.stopPropagation();
    const willFlip = !flipped;
    setFlipped((f) => !f);
    trackEngagement("venue_card_flip", {
      venueId: venue.id,
      venueName: venue.name,
      flipped: willFlip,
      source,
      sponsored: venue.sponsored ?? false,
    });
    if (willFlip && venue.sponsored && venue.boostCampaignId) {
      void trackPartnerClick(venue.boostCampaignId);
    }
  }

  const priceDollars = venue.priceLevel
    ? "$".repeat(Math.min(venue.priceLevel, 4))
    : null;

  return (
    <div
      className={cn(
        "shrink-0 snap-start [perspective:800px]",
        widthClass,
      )}
    >
      <div
        className={cn(
          "relative h-[220px] cursor-pointer transition-transform duration-500 [transform-style:preserve-3d]",
          flipped && "[transform:rotateY(180deg)]",
        )}
        onClick={handleFlip}
        role="button"
        tabIndex={0}
        aria-label={flipped ? `Flip back to ${venue.name} photo` : `Flip to see ${venue.name} details`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setFlipped((f) => !f);
          }
        }}
      >
        {/* ── FRONT ── */}
        <div
          className={cn(
            "absolute inset-0 overflow-hidden rounded-2xl border-2 bg-surface-1 shadow-card [backface-visibility:hidden]",
            accentBorder,
          )}
        >
          {venue.photo ? (
            <img
              src={venue.photo}
              alt={venue.name}
              className="h-[130px] w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className={cn("h-[130px] w-full", accent === "purple" ? "bg-gradient-to-br from-purple/10 to-coral/10" : "bg-ink/[0.04]")} />
          )}
          <div className="p-3">
            <div className="line-clamp-1 font-display text-[13px] font-bold tracking-tight text-ink">
              {venue.name}
            </div>
            <div className="mt-0.5 line-clamp-1 font-mono text-[10px] uppercase tracking-wide text-ink/45">
              {venue.category}
              {venue.neighborhood ? ` · ${venue.neighborhood}` : ""}
            </div>
            {venue.vibe && (
              <span className={cn(
                "mt-1.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold",
                accent === "purple"
                  ? "border-purple/20 bg-purple/8 text-purple"
                  : "border-coral/20 bg-coral/8 text-coral",
              )}>
                <Sparkles className="size-2.5" /> {venue.vibe}
              </span>
            )}
          </div>
          {/* Flip hint */}
          <div className="absolute bottom-2 right-2 rounded-full bg-ink/60 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-cream backdrop-blur">
            Tap for details
          </div>
          {venue.sponsored && (
            <PartnerPickBadge variant="corner" label={venue.partnerLabel} />
          )}
        </div>

        {/* ── BACK ── */}
        <div
          className={cn(
            "absolute inset-0 overflow-hidden rounded-2xl border-2 bg-surface-1 shadow-card [backface-visibility:hidden] [transform:rotateY(180deg)]",
            accentBorder,
          )}
        >
          <div className={cn("px-3 pt-3 pb-1", accentBg)}>
            <div className="line-clamp-1 font-display text-[13px] font-bold tracking-tight text-ink">
              {venue.name}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {venue.rating && (
                <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-ink/70">
                  <Star className="size-3 fill-gold text-gold" /> {venue.rating.toFixed(1)}
                </span>
              )}
              {priceDollars && (
                <span className="text-[11px] font-semibold text-ink/50">{priceDollars}</span>
              )}
              {venue.category && (
                <span className="font-mono text-[9px] uppercase tracking-wide text-ink/40">{venue.category}</span>
              )}
            </div>
          </div>

          <div className="space-y-1.5 px-3 pt-2">
            {/* Parking */}
            <DetailRow icon={Car} label="Parking" value="Street & garage nearby" accent={accentText} />

            {/* Dress code */}
            <DetailRow icon={Shirt} label="Dress" value="Smart casual" accent={accentText} />

            {/* Noise */}
            <DetailRow icon={Volume2} label="Noise" value="Lively" accent={accentText} />

            {/* Vibe peak */}
            <DetailRow icon={Clock} label="Peak" value="9 PM–12 AM" accent={accentText} />

            {/* Address */}
            {venue.address && (
              <DetailRow icon={MapPin} label="Location" value={venue.address} accent={accentText} />
            )}

            {/* AI reason */}
            {venue.reason && (
              <p className="line-clamp-2 text-[10px] italic leading-snug text-ink/60">{venue.reason}</p>
            )}
          </div>

          {/* CTA */}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-3 pb-2.5 pt-1">
            <span className="rounded-full bg-ink/60 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-cream backdrop-blur">
              Tap to flip
            </span>
            <Link
              to="/venue/$id"
              params={{ id: venue.id }}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-cream transition-pop hover:-translate-y-0.5",
                accent === "purple" ? "bg-purple" : "bg-coral",
              )}
              onClick={(e) => {
                e.stopPropagation(); // don't flip, navigate instead
                trackEngagement("venue_card_details", {
                  venueId: venue.id,
                  venueName: venue.name,
                  source,
                });
              }}
            >
              Full details <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Small detail row for the back of the card */
function DetailRow({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className={cn("size-3 shrink-0", accent)} />
      <span className="text-[10px] font-semibold text-ink/70">{label}:</span>
      <span className="line-clamp-1 text-[10px] text-ink/55">{value}</span>
    </div>
  );
}
