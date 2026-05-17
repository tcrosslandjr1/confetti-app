/**
 * VenueDiscoveryCard — Enhanced venue card for the Confetti Discover page.
 *
 * Layout:
 *   1. Hero image with overlay chips (rating, price, AI pick, sponsored)
 *   2. Core info (name, neighborhood, description, tags)
 *   3. Action row — horizontal scroll of social link buttons
 *   4. Community drawer — TikTok + Instagram reels grid
 *   5. Sponsored strip (conditional) — ad CTA for paying venues
 *   6. Reserve button
 */

import { useCallback, useState, type ReactNode } from "react";
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
/*  Social platform icons                                              */
/* ------------------------------------------------------------------ */

const TikTokIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M19.6 6.3a5.6 5.6 0 0 1-3.3-1.1V15a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v2.7a2.9 2.9 0 1 0 2 2.8V2h2.7a5.6 5.6 0 0 0 3.3 4.3v0z" />
  </svg>
);

const InstagramIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function HeroChips({ venue }: { venue: VenueCard }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-start justify-between p-2.5">
      <div className="flex flex-col gap-1.5">
        {venue.isSponsored && (
          <span className="inline-flex items-center gap-1 rounded-full border border-white/40 bg-amber-500/90 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-white backdrop-blur">
            <Megaphone className="h-2.5 w-2.5" /> Sponsored
          </span>
        )}
        {venue.aiPick && (
          <span className="inline-flex items-center gap-1 rounded-full border border-white/40 bg-black/55 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-amber-200 backdrop-blur">
            <Sparkles className="h-2.5 w-2.5" /> AI pick
          </span>
        )}
      </div>
      <div className="flex flex-col items-end gap-1.5">
        {venue.rating != null && (
          <span className="inline-flex items-center gap-1 rounded-full border border-white/40 bg-black/50 px-2 py-0.5 font-mono text-[10px] font-bold text-white backdrop-blur">
            <Star className="h-2.5 w-2.5 fill-amber-300 text-amber-300" /> {venue.rating.toFixed(1)}
          </span>
        )}
        {venue.priceBand && (
          <span className="rounded-full border border-white/40 bg-black/40 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-200 backdrop-blur">
            {venue.priceBand}
          </span>
        )}
      </div>
    </div>
  );
}

function SocialActionRow({ venue }: { venue: VenueCard }) {
  const links: Array<{ label: string; icon: ReactNode; href: string } | null | undefined | false | ""> = [
    {
      label: "Google",
      icon: <Search className="h-3.5 w-3.5" />,
      href: venue.googleMapsUrl ?? `https://www.google.com/search?q=${encodeURIComponent(venue.name)}`,
    },
    venue.websiteUrl
      ? {
          label: "Website",
          icon: <ExternalLink className="h-3.5 w-3.5" />,
          href: venue.websiteUrl,
        }
      : null,
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
  ];
  const visible = links.filter(Boolean) as Array<{ label: string; icon: ReactNode; href: string }>;

  return (
    <div className="-mx-3.5 overflow-x-auto px-3.5">
      <div className="flex gap-1.5 pb-1">
        {visible.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-ink/15 bg-cream/70 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-ink/75 transition hover:border-ink hover:bg-cream"
          >
            {link.icon} {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}

function CommunityDrawer({ reels }: { reels: SocialReel[] }) {
  const [open, setOpen] = useState(false);
  if (!reels.length) return null;

  return (
    <div className="rounded-2xl border border-ink/10 bg-cream/60">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="flex w-full items-center justify-between px-3.5 py-2.5 text-left"
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink/70">
          <Users className="h-3.5 w-3.5" /> From the community
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-ink/60 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="border-t border-ink/10 px-3.5 pb-3 pt-2.5">
          <div className="mb-2 font-mono text-[9px] font-bold uppercase tracking-widest text-ink/50">
            Recent reels & posts
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {reels.slice(0, 4).map((reel) => (
              <a
                key={reel.id}
                href={reel.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="group relative aspect-[3/4] overflow-hidden rounded-lg border border-ink/10 bg-ink/5"
              >
                <img
                  src={reel.thumbnailUrl}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
                <span className="absolute bottom-1 left-1 right-1 flex items-center gap-1 rounded-full bg-black/55 px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wider text-white backdrop-blur">
                  {reel.platform === "tiktok" ? <TikTokIcon size={9} /> : <InstagramIcon size={9} />}
                  <span className="truncate">{reel.isPromoted ? "Promoted" : reel.viewCount ?? ""}</span>
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SponsoredStrip({ venue }: { venue: VenueCard }) {
  if (!venue.isSponsored || !venue.sponsoredCta) return null;

  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-amber-300/60 bg-gradient-to-r from-amber-50 to-orange-50 p-2.5">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-amber-400/70 bg-white text-amber-600">
        <Megaphone className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-display text-sm font-bold text-ink">{venue.name}</div>
        <div className="truncate font-mono text-[10px] uppercase tracking-widest text-amber-700">
          {venue.sponsoredCta.headline}
        </div>
      </div>
      <a
        href={venue.sponsoredCta.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="inline-flex shrink-0 items-center gap-1 rounded-full border-2 border-ink bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-white shadow-brut"
      >
        {venue.sponsoredCta.label}
      </a>
    </div>
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
    <article className="group relative flex flex-col gap-3 overflow-hidden rounded-3xl border border-white/40 bg-white/70 p-3.5 shadow-card backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-brut">
      {/* Hero image */}
      <div className="relative -mx-3.5 -mt-3.5 h-44 overflow-hidden">
        <img
          src={venue.imageUrl}
          alt={venue.name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/15" />
        <HeroChips venue={venue} />
      </div>

      {/* Core info */}
      <div>
        <h3 className="font-display text-lg font-bold leading-tight text-ink">{venue.name}</h3>
        <div className="mt-0.5 inline-flex items-center gap-1 text-xs text-ink/60">
          <MapPin className="h-3 w-3" /> {venue.neighborhood}
        </div>
        {venue.description && (
          <p className="mt-1.5 line-clamp-2 text-[12px] leading-snug text-ink/70">
            {venue.description}
          </p>
        )}
        {venue.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {venue.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-ink/15 bg-cream/70 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-ink/70"
              >
                #{tag}
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
      <CommunityDrawer reels={venue.reels ?? []} />

      {/* Reserve button */}
      <button
        type="button"
        onClick={handleReserve}
        className="inline-flex items-center justify-center gap-1.5 rounded-full border-2 border-ink bg-gradient-to-r from-coral to-violet-500 px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-widest text-white shadow-brut transition hover:-translate-y-0.5"
      >
        <CalendarPlus className="h-3.5 w-3.5" /> Reserve a spot
      </button>
    </article>
  );
}

export default VenueDiscoveryCard;
