/**
 * VenueDiscoveryCard — Enhanced venue card for Confetti Discover page
 *
 * Layout:
 *   1. Hero image with overlay chips (rating, price, AI pick, sponsored)
 *   2. Core info (name, neighborhood, description, tags)
 *   3. Action row — horizontal scroll of social link buttons
 *   4. Community drawer — TikTok + Instagram reels grid
 *   5. Sponsored strip (conditional) — ad CTA for paying venues
 *   6. Reserve button
 *
 * Data model lives in ./venue-discovery-types.ts
 */

import { useState, useCallback } from "react";
import {
  Star,
  MapPin,
  Sparkles,
  ChevronDown,
  ExternalLink,
  Search,
  CalendarPlus,
  Users,
  Megaphone,
} from "lucide-react";
import type { VenueCard, SocialReel } from "@/lib/venue-discovery-types";

/* ------------------------------------------------------------------ */
/*  Social platform icons (simple inline SVGs for TikTok / Instagram) */
/* ------------------------------------------------------------------ */

const TikTokIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.51a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.73a8.18 8.18 0 004.76 1.52V6.83a4.84 4.84 0 01-1-.14z" />
  </svg>
);

const InstagramIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function HeroChips({ venue }: { venue: VenueCard }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
      <div className="flex gap-1.5 flex-wrap">
        {venue.isSponsored && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-600/90 text-white backdrop-blur-sm">
            <Megaphone size={11} /> Sponsored
          </span>
        )}
        {venue.rating && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/90 text-gray-900 backdrop-blur-sm">
            <Star size={11} fill="currentColor" /> {venue.rating.toFixed(1)}
          </span>
        )}
        {venue.priceBand && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/20 text-white backdrop-blur-sm">
            {venue.priceBand}
          </span>
        )}
        {venue.aiPick && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-pink-500/85 text-white backdrop-blur-sm">
            <Sparkles size={11} /> AI pick
          </span>
        )}
      </div>
    </div>
  );
}

function SocialActionRow({ venue }: { venue: VenueCard }) {
  const links = [
    {
      label: "Google",
      icon: <Search size={14} />,
      href: venue.googleMapsUrl ?? `https://www.google.com/search?q=${encodeURIComponent(venue.name)}`,
    },
    venue.websiteUrl && {
      label: "Website",
      icon: <ExternalLink size={14} />,
      href: venue.websiteUrl,
    },
    {
      label: "TikTok",
      icon: <TikTokIcon />,
      href: venue.tiktokUrl ?? `https://www.tiktok.com/search?q=${encodeURIComponent(venue.name)}`,
    },
    {
      label: "Instagram",
      icon: <InstagramIcon />,
      href: venue.instagramUrl ?? `https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(venue.name)}`,
    },
  ].filter(Boolean) as { label: string; icon: JSX.Element; href: string }[];

  return (
    <div className="flex gap-2 px-3.5 pb-3 overflow-x-auto scrollbar-hide">
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs whitespace-nowrap hover:bg-muted transition-colors"
        >
          {link.icon} {link.label}
        </a>
      ))}
    </div>
  );
}

function CommunityDrawer({ reels }: { reels: SocialReel[] }) {
  const [open, setOpen] = useState(false);

  if (!reels.length) return null;

  return (
    <>
      <div className="h-px bg-border mx-3.5" />
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-3.5 py-2.5 text-left"
      >
        <span className="text-[13px] font-medium text-muted-foreground flex items-center gap-1.5">
          <Users size={14} /> From the community
        </span>
        <ChevronDown
          size={16}
          className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? "max-h-[600px]" : "max-h-0"
        }`}
      >
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider px-3.5 pb-2">
          Recent reels & posts
        </p>
        <div className="grid grid-cols-2 gap-2 px-3.5 pb-3.5">
          {reels.slice(0, 4).map((reel, i) => (
            <a
              key={i}
              href={reel.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`relative rounded-lg overflow-hidden aspect-[9/14] bg-gray-900 ${
                reel.isPromoted ? "ring-[1.5px] ring-amber-500" : ""
              }`}
            >
              <img
                src={reel.thumbnailUrl}
                alt={reel.caption ?? "community reel"}
                className="w-full h-full object-cover"
              />
              <span
                className={`absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-white ${
                  reel.isPromoted ? "bg-amber-600/85" : "bg-black/60"
                }`}
              >
                {reel.platform === "tiktok" ? <TikTokIcon size={10} /> : <InstagramIcon size={10} />}
                {reel.isPromoted ? "Promoted" : reel.viewCount ?? ""}
              </span>
            </a>
          ))}
        </div>
      </div>
    </>
  );
}

function SponsoredStrip({ venue }: { venue: VenueCard }) {
  if (!venue.isSponsored || !venue.sponsoredCta) return null;

  return (
    <>
      <div className="h-px bg-border mx-3.5" />
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-muted/50">
        <img
          src={venue.heroImageUrl}
          alt=""
          className="w-9 h-9 rounded-lg object-cover"
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">{venue.name}</p>
          <p className="text-[11px] text-muted-foreground truncate">
            {venue.sponsoredCta.headline}
          </p>
        </div>
        <a
          href={venue.sponsoredCta.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 px-3.5 py-1.5 rounded-lg bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity"
        >
          {venue.sponsoredCta.label}
        </a>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function VenueDiscoveryCard({
  venue,
  onReserve,
}: {
  venue: VenueCard;
  onReserve?: (venueId: string) => void;
}) {
  const handleReserve = useCallback(() => {
    onReserve?.(venue.id);
  }, [venue.id, onReserve]);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Hero image */}
      <div className="relative h-[200px] overflow-hidden bg-gray-900">
        <img
          src={venue.heroImageUrl}
          alt={venue.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <HeroChips venue={venue} />
      </div>

      {/* Core info */}
      <div className="px-3.5 pt-3 pb-2.5">
        <h3 className="text-[17px] font-medium">{venue.name}</h3>
        <p className="text-[13px] text-muted-foreground flex items-center gap-1 mb-1.5">
          <MapPin size={13} /> {venue.neighborhood}
        </p>
        {venue.description && (
          <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-2 mb-2.5">
            {venue.description}
          </p>
        )}
        {venue.tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-3">
            {venue.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="text-[11px] px-2.5 py-0.5 rounded-md bg-muted text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Social action row */}
      <SocialActionRow venue={venue} />

      {/* Sponsored strip (only for paying venues) */}
      <SponsoredStrip venue={venue} />

      {/* Community drawer */}
      <CommunityDrawer reels={venue.communityReels ?? []} />

      {/* Reserve button */}
      <button
        onClick={handleReserve}
        className="flex items-center justify-center gap-1.5 w-[calc(100%-28px)] mx-3.5 mb-3.5 py-2.5 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
      >
        <CalendarPlus size={16} /> Reserve a spot
      </button>
    </div>
  );
}

export default VenueDiscoveryCard;
