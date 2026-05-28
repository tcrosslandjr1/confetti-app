import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Heart,
  Share2,
  Bookmark,
  MapPin,
  Play,
  Plus,
  Star,
  Sparkles,
  Plane,
  ArrowRight,
  ChevronRight,
  Music,
  TrendingUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePageview, trackEngagement } from "@/lib/analytics";
import { getActiveLoop, type ActiveLoop, type LoopStop } from "@/lib/loop-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/reels")({
  component: ReelsPage,
});

/* ─── Types ───────────────────────────────────────────────────────── */

type ReelData = {
  id: string;
  handle: string;
  followers: string;
  venue: string;
  caption: string;
  views: string;
  gradient: string;
  avatar: string;
};

type ReviewData = {
  id: string;
  author: string;
  venue: string;
  text: string;
  rating: number;
  source: string;
  timeAgo: string;
};

type DiscoveryVenue = {
  id: string;
  name: string;
  type: string;
  area: string;
  rating: number;
  reviews: string;
  distance: string;
  vibe: string;
  gradient: string;
};

/* ─── Static seed data (replaced by DB queries once populated) ──── */

const SEED_REELS: ReelData[] = [
  {
    id: "r1",
    handle: "@queenofdc1",
    followers: "47.2K",
    venue: "Dauphine's",
    caption: "This Michelin Bib Gourmand spot is UNREAL — the lamb neck had me speechless 🤤",
    views: "124K",
    gradient: "from-coral via-pink to-purple",
    avatar: "Q",
  },
  {
    id: "r2",
    handle: "@dc_foodie",
    followers: "31.5K",
    venue: "Flash",
    caption: "Green Room rooftop at sunset → dance floor at midnight. This is the move 🌃",
    views: "89K",
    gradient: "from-purple via-indigo-800 to-teal",
    avatar: "D",
  },
  {
    id: "r3",
    handle: "@dc.nightlife",
    followers: "18.4K",
    venue: "Decades",
    caption: "6 floors, 8 bars, 1 legendary night. Every level hits different 🔥",
    views: "67K",
    gradient: "from-teal via-cyan to-coral",
    avatar: "N",
  },
  {
    id: "r4",
    handle: "@blackgirlsexploredc",
    followers: "22.8K",
    venue: "All Souls Bar",
    caption: "Best cocktails in Shaw? All Souls said hold my drink 🍸",
    views: "41K",
    gradient: "from-gold via-coral to-pink",
    avatar: "B",
  },
];

const SEED_REVIEWS: ReviewData[] = [
  {
    id: "rv1",
    author: "Marcus T.",
    venue: "Dauphine's",
    text: "Genuinely one of the best dining experiences in DC. The lamb neck is transcendent.",
    rating: 5,
    source: "Google",
    timeAgo: "2 weeks ago",
  },
  {
    id: "rv2",
    author: "Sarah L.",
    venue: "Flash",
    text: "The Green Room rooftop is everything. Best electronic music venue in the city, hands down.",
    rating: 5,
    source: "Yelp",
    timeAgo: "1 week ago",
  },
];

const SEED_DISCOVERY: DiscoveryVenue[] = [
  {
    id: "d1",
    name: "All Souls Bar",
    type: "Cocktail bar",
    area: "Shaw",
    rating: 4.6,
    reviews: "1.2K",
    distance: "0.3 mi",
    vibe: "Craft cocktails · intimate",
    gradient: "from-purple to-coral",
  },
  {
    id: "d2",
    name: "The Alchemist",
    type: "Speakeasy",
    area: "U Street",
    rating: 4.5,
    reviews: "890",
    distance: "0.5 mi",
    vibe: "Hidden gems · creative drinks",
    gradient: "from-teal to-gold",
  },
  {
    id: "d3",
    name: "Service Bar",
    type: "Wine bar",
    area: "U Street",
    rating: 4.7,
    reviews: "650",
    distance: "0.4 mi",
    vibe: "Natural wine · chill vibes",
    gradient: "from-coral to-pink",
  },
  {
    id: "d4",
    name: "Doyle",
    type: "Cocktail lounge",
    area: "Dupont",
    rating: 4.4,
    reviews: "420",
    distance: "0.7 mi",
    vibe: "Art deco · craft spirits",
    gradient: "from-gold to-purple",
  },
  {
    id: "d5",
    name: "Nero",
    type: "Rooftop",
    area: "Downtown",
    rating: 4.3,
    reviews: "380",
    distance: "0.8 mi",
    vibe: "City views · late night",
    gradient: "from-pink to-purple",
  },
  {
    id: "d6",
    name: "The Mirror",
    type: "Dance club",
    area: "Adams Morgan",
    rating: 4.2,
    reviews: "510",
    distance: "0.6 mi",
    vibe: "Dance floor · DJ sets",
    gradient: "from-cyan to-teal",
  },
];

/* ─── Boarding Pass Timeline Strip ────────────────────────────────── */

function PassTimelineStrip({ loop }: { loop: ActiveLoop | null }) {
  if (!loop || !loop.stops?.length) return null;

  return (
    <div className="rounded-3xl border-2 border-cream/20 bg-gradient-to-r from-indigo-950 via-purple-900 to-fuchsia-900 px-4 py-3 shadow-pop">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-fuchsia-400 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-fuchsia-950">
            Tonight
          </span>
          <span className="font-display text-sm font-bold text-cream">
            {loop.experienceName || loop.to || "Your Night"}
          </span>
        </div>
        <Link
          to="/boarding-pass"
          className="rounded-full bg-cream/15 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-cream/80 backdrop-blur transition-colors hover:bg-cream/25"
        >
          Full pass →
        </Link>
      </div>

      {/* Route bar */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-cream/60">
          {shortCity(loop.from)}
        </span>

        {/* Stop dots */}
        <div className="flex flex-1 items-center">
          <div className="h-px flex-1 bg-cream/25" />
          {loop.stops.map((stop, i) => (
            <div key={stop.id} className="group relative mx-1 flex flex-col items-center">
              <div
                className={cn(
                  "size-3 rounded-full border-2 border-cream/40 transition-all",
                  stop.done ? "bg-fuchsia-400" : "bg-cream/20",
                )}
              />
              <span className="mt-1 max-w-[60px] truncate text-center font-mono text-[8px] font-bold uppercase tracking-wider text-cream/50">
                {stop.time}
              </span>
            </div>
          ))}
          <div className="h-px flex-1 bg-cream/25" />
        </div>

        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-cream/60">
          {shortCity(loop.to)}
        </span>
      </div>

      {/* Stop names below */}
      <div className="mt-1 flex justify-around">
        {loop.stops.slice(0, 4).map((stop) => (
          <span
            key={stop.id}
            className="max-w-[80px] truncate text-center font-mono text-[9px] font-medium text-cream/45"
          >
            {stop.name}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Vibe Check Divider ──────────────────────────────────────────── */

function VibeCheckDivider() {
  return (
    <div className="relative my-4 flex items-center justify-center">
      <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-coral/40 to-transparent" />
      <span className="relative z-10 rounded-full bg-cream px-4 py-1.5 font-display text-xs font-bold tracking-wide text-coral shadow-sm">
        <Sparkles className="mr-1 inline size-3" />
        the vibe check
      </span>
    </div>
  );
}

/* ─── Reel Card ───────────────────────────────────────────────────── */

function ReelCard({ reel, onPlay }: { reel: ReelData; onPlay: () => void }) {
  const [liked, setLiked] = useState(false);

  return (
    <div className="group relative aspect-[9/16] w-full overflow-hidden rounded-3xl border-2 border-cream-muted shadow-lg">
      {/* Gradient placeholder */}
      <div className={cn("absolute inset-0 bg-gradient-to-br", reel.gradient)} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

      {/* Play button */}
      <button
        onClick={onPlay}
        className="absolute inset-0 z-10 grid place-items-center"
        aria-label="Play reel"
      >
        <span className="grid size-16 place-items-center rounded-full bg-cream/90 shadow-lg transition-transform group-hover:scale-110 active:scale-95">
          <Play className="ml-1 size-7 text-mocha-dark" fill="currentColor" />
        </span>
      </button>

      {/* Creator info */}
      <div className="absolute right-3 top-3 z-10 flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur">
        <span className="grid size-6 place-items-center rounded-full bg-cream/20 font-mono text-[10px] font-bold text-cream">
          {reel.avatar}
        </span>
        <span className="font-mono text-[10px] font-bold text-cream">{reel.handle}</span>
      </div>

      {/* Bottom info */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-4">
        <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-coral/90 px-2.5 py-1">
          <MapPin className="size-3 text-cream" />
          <span className="font-mono text-[10px] font-bold text-cream">{reel.venue}</span>
        </div>
        <p className="line-clamp-2 text-sm font-medium leading-tight text-cream">{reel.caption}</p>
        <div className="mt-2 flex items-center gap-3 text-cream/60">
          <span className="font-mono text-[10px]">{reel.views} views</span>
          <span className="font-mono text-[10px]">{reel.followers} followers</span>
        </div>
      </div>

      {/* Side actions */}
      <div className="absolute right-3 bottom-24 z-10 flex flex-col items-center gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setLiked(!liked);
            trackEngagement("reel_like", { reelId: reel.id });
            toast.success(liked ? "Removed like" : "Liked!");
          }}
          className="flex flex-col items-center gap-0.5"
          aria-label={liked ? "Unlike" : "Like"}
        >
          <span
            className={cn(
              "grid size-10 place-items-center rounded-full backdrop-blur transition-colors",
              liked ? "bg-coral text-cream" : "bg-cream/15 text-cream hover:bg-cream/25",
            )}
          >
            <Heart className="size-4" fill={liked ? "currentColor" : "none"} />
          </span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toast.success("Saved to your list");
            trackEngagement("reel_save", { reelId: reel.id });
          }}
          className="grid size-10 place-items-center rounded-full bg-cream/15 text-cream backdrop-blur transition-colors hover:bg-cream/25"
          aria-label="Save"
        >
          <Bookmark className="size-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toast.info("Share link copied");
            trackEngagement("reel_share", { reelId: reel.id });
          }}
          className="grid size-10 place-items-center rounded-full bg-cream/15 text-cream backdrop-blur transition-colors hover:bg-cream/25"
          aria-label="Share"
        >
          <Share2 className="size-4" />
        </button>
      </div>
    </div>
  );
}

/* ─── Review Card ─────────────────────────────────────────────────── */

function ReviewCard({ review }: { review: ReviewData }) {
  return (
    <div className="rounded-2xl border-2 border-cream-muted bg-cream-light p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-full bg-purple font-mono text-xs font-bold text-cream">
            {review.author[0]}
          </span>
          <div>
            <span className="text-sm font-bold text-mocha-dark">{review.author}</span>
            <span className="ml-2 font-mono text-[10px] text-mocha-dark/50">{review.timeAgo}</span>
          </div>
        </div>
        <span className="rounded-full bg-cream-muted px-2 py-0.5 font-mono text-[10px] font-bold text-mocha-dark/60">
          {review.source}
        </span>
      </div>
      <div className="mb-1.5 flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={cn("size-3.5", i < review.rating ? "text-gold" : "text-cream-muted")}
            fill={i < review.rating ? "currentColor" : "none"}
          />
        ))}
      </div>
      <p className="text-sm leading-relaxed text-mocha-dark/80">{review.text}</p>
      <div className="mt-2 flex items-center gap-1 text-coral">
        <MapPin className="size-3" />
        <span className="font-mono text-[10px] font-bold">{review.venue}</span>
      </div>
    </div>
  );
}

/* ─── Discovery Card ──────────────────────────────────────────────── */

function DiscoveryCard({
  venue,
  onAdd,
  added,
}: {
  venue: DiscoveryVenue;
  onAdd: () => void;
  added: boolean;
}) {
  return (
    <div className="flex-none w-[220px] snap-start">
      <div
        className={cn(
          "relative aspect-[4/3] overflow-hidden rounded-2xl border-2 border-cream-muted shadow-sm",
        )}
      >
        <div className={cn("absolute inset-0 bg-gradient-to-br", venue.gradient)} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-3">
          <h4 className="font-display text-sm font-bold text-cream">{venue.name}</h4>
          <span className="font-mono text-[10px] text-cream/70">{venue.type} · {venue.area}</span>
        </div>
        <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 backdrop-blur">
          <Star className="size-2.5 text-gold" fill="currentColor" />
          <span className="font-mono text-[10px] font-bold text-cream">{venue.rating}</span>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between px-1">
        <div>
          <span className="font-mono text-[10px] text-mocha-dark/50">{venue.distance} · {venue.reviews} reviews</span>
          <p className="text-xs text-mocha-dark/60">{venue.vibe}</p>
        </div>
        <button
          onClick={onAdd}
          disabled={added}
          className={cn(
            "rounded-full px-3 py-1.5 font-mono text-[10px] font-bold transition-all",
            added
              ? "bg-teal/20 text-teal"
              : "bg-coral text-cream shadow-sm hover:scale-105 active:scale-95",
          )}
        >
          {added ? "✓ Added" : "+ Add"}
        </button>
      </div>
    </div>
  );
}

/* ─── Section Header ──────────────────────────────────────────────── */

function SectionHeader({
  icon: Icon,
  label,
  accent = "text-coral",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  accent?: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <div className={cn("grid size-7 place-items-center rounded-full bg-cream-muted", accent)}>
        <Icon className="size-3.5" />
      </div>
      <h3 className="font-display text-sm font-bold tracking-tight text-mocha-dark">{label}</h3>
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────────────────────────── */

function shortCity(s?: string | null) {
  if (!s) return "TBD";
  return s.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase() || "TBD";
}

/* ─── Main Page ───────────────────────────────────────────────────── */

function ReelsPage() {
  usePageview("app_reels", "/app/reels");

  const [loop, setLoop] = useState<ActiveLoop | null>(() => getActiveLoop());
  const [addedVenues, setAddedVenues] = useState<Set<string>>(new Set());
  const [playingReel, setPlayingReel] = useState<string | null>(null);

  // Subscribe to loop changes
  useEffect(() => {
    setLoop(getActiveLoop());
    const handler = () => setLoop(getActiveLoop());
    window.addEventListener("loop:active:changed", handler);
    window.addEventListener("storage", (e: StorageEvent) => {
      if (e.key === "loop:active") handler();
    });
    return () => {
      window.removeEventListener("loop:active:changed", handler);
    };
  }, []);

  const handleAddVenue = useCallback(
    (venue: DiscoveryVenue) => {
      setAddedVenues((prev) => {
        const next = new Set(prev);
        next.add(venue.id);
        return next;
      });
      trackEngagement("reel_add_to_pass", { venueId: venue.id, venueName: venue.name });
      toast.success(`${venue.name} added to your pass!`, {
        description: "Check your boarding pass for the updated route",
      });
    },
    [],
  );

  const handlePlayReel = useCallback((reelId: string) => {
    setPlayingReel(reelId);
    trackEngagement("reel_play", { reelId });
    toast("Playing reel...", { duration: 1500 });
    // Reset after "preview"
    setTimeout(() => setPlayingReel(null), 2000);
  }, []);

  return (
    <div className="min-h-screen bg-cream pb-28">
      <div className="mx-auto max-w-md px-4 pt-4">
        {/* ── Boarding Pass Timeline ────────────────────────────── */}
        <PassTimelineStrip loop={loop} />

        {/* ── Vibe Check Divider ────────────────────────────────── */}
        <VibeCheckDivider />

        {/* ── Trending Reels ────────────────────────────────────── */}
        <SectionHeader icon={TrendingUp} label="Trending near your route" />
        <div className="mb-6 space-y-4">
          <ReelCard reel={SEED_REELS[0]} onPlay={() => handlePlayReel(SEED_REELS[0].id)} />
        </div>

        {/* ── Reviews ───────────────────────────────────────────── */}
        <SectionHeader icon={Star} label="What people are saying" accent="text-gold" />
        <div className="mb-6 space-y-3">
          {SEED_REVIEWS.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>

        {/* ── More Reels ────────────────────────────────────────── */}
        <div className="mb-6 space-y-4">
          {SEED_REELS.slice(1, 3).map((reel) => (
            <ReelCard key={reel.id} reel={reel} onPlay={() => handlePlayReel(reel.id)} />
          ))}
        </div>

        {/* ── Discovery Feed ────────────────────────────────────── */}
        <SectionHeader icon={MapPin} label="Discover along the route" accent="text-purple" />
        <div className="-mx-4 mb-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 scrollbar-none">
          {SEED_DISCOVERY.map((venue) => (
            <DiscoveryCard
              key={venue.id}
              venue={venue}
              onAdd={() => handleAddVenue(venue)}
              added={addedVenues.has(venue.id)}
            />
          ))}
        </div>

        {/* ── Final Reel ────────────────────────────────────────── */}
        <div className="mb-6">
          <ReelCard reel={SEED_REELS[3]} onPlay={() => handlePlayReel(SEED_REELS[3].id)} />
        </div>

        {/* ── CTA ───────────────────────────────────────────────── */}
        {!loop && (
          <div className="mb-6 rounded-3xl border-2 border-coral/20 bg-gradient-to-br from-coral/10 to-pink/10 p-6 text-center">
            <Sparkles className="mx-auto mb-2 size-8 text-coral" />
            <h3 className="mb-1 font-display text-lg font-bold text-mocha-dark">
              Build your night
            </h3>
            <p className="mb-4 text-sm text-mocha-dark/60">
              Get a personalized boarding pass with AI-curated stops
            </p>
            <Link
              to="/app/plan"
              className="inline-flex items-center gap-2 rounded-full bg-coral px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest text-cream shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              Plan my night <ArrowRight className="size-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
