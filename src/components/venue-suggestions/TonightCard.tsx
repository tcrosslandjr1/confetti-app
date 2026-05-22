/**
 * TonightCard — A single suggestion card in the Tonight feed.
 * Cream/coral Confetti design with a glassy overlay on the image.
 */
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  Sparkles,
  Star,
  Users,
  Ticket,
} from "lucide-react";
import type { TonightSuggestion, SuggestionType } from "@/types/venue-suggestion";

const TYPE_STYLE: Record<SuggestionType, { label: string; icon: typeof Calendar; bg: string }> = {
  event: { label: "Event", icon: Calendar, bg: "bg-violet-500/90" },
  experience: { label: "Experience", icon: Sparkles, bg: "bg-amber-500/90" },
  promo: { label: "Deal", icon: Ticket, bg: "bg-emerald-500/90" },
};

function formatTime(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" });
}

export function TonightCard({ suggestion: s }: { suggestion: TonightSuggestion }) {
  const style = TYPE_STYLE[s.type];
  const Icon = style.icon;
  const heroImg = s.imageUrl || s.venueImage;

  return (
    <div className="group rounded-2xl overflow-hidden border border-stone-100 bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Hero image */}
      <div className="relative h-44 overflow-hidden">
        {heroImg ? (
          <img
            src={heroImg}
            alt={s.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#FFF8F0] to-[#E85D4A]/10 flex items-center justify-center">
            <Icon className="w-10 h-10 text-[#E85D4A]/40" />
          </div>
        )}

        {/* Type badge */}
        <div className={`absolute top-3 left-3 ${style.bg} text-white px-2.5 py-1 rounded-full text-[10px] font-medium flex items-center gap-1`}>
          <Icon className="w-3 h-3" />
          {style.label}
        </div>

        {/* Boost indicator */}
        {s.boostLevel > 0 && (
          <div className="absolute top-3 right-3 bg-[#E85D4A] text-white px-2 py-0.5 rounded-full text-[10px] font-medium">
            Featured
          </div>
        )}

        {/* Discount badge */}
        {s.discountPct && s.discountPct > 0 && (
          <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm text-[#E85D4A] px-2.5 py-1 rounded-full text-xs font-bold shadow-sm">
            {s.discountPct}% off
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-stone-800 text-base leading-tight line-clamp-1">{s.title}</h3>

        {/* Venue info */}
        <div className="flex items-center gap-2 mt-1.5 text-xs text-stone-500">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{s.venueName}</span>
          {s.venueRating > 0 && (
            <>
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>{s.venueRating.toFixed(1)}</span>
            </>
          )}
        </div>

        {s.subtitle && <p className="text-xs text-stone-400 mt-1">{s.subtitle}</p>}
        <p className="text-sm text-stone-600 mt-2 line-clamp-2">{s.description}</p>

        {/* Meta row */}
        <div className="flex items-center flex-wrap gap-3 mt-3 text-xs text-stone-400">
          {s.startsAt && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(s.startsAt)}
            </span>
          )}
          {s.capacity && (
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {s.capacity - s.rsvpCount} spots left
            </span>
          )}
          {s.offerPrice != null && s.originalPrice != null && (
            <span className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              <span className="line-through">${s.originalPrice}</span>
              <span className="text-[#E85D4A] font-medium">${s.offerPrice}</span>
            </span>
          )}
          {s.promoCode && (
            <Badge variant="secondary" className="text-[10px] bg-stone-100">
              Code: {s.promoCode}
            </Badge>
          )}
        </div>

        {/* Mood tags */}
        {s.targetMoods.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {s.targetMoods.slice(0, 4).map(m => (
              <Badge key={m} variant="outline" className="text-[10px] capitalize border-stone-200 text-stone-500">
                {m}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
