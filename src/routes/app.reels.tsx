import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Heart,
  Share2,
  Bookmark,
  MapPin,
  Play,
  Star,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Flame,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { usePageview, trackEngagement } from "@/lib/analytics";
import { getActiveLoop, addStop, type ActiveLoop, type LoopStop } from "@/lib/loop-store";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/reels")({
  component: ReelsPage,
});

/* ─── Types ───────────────────────────────────────────────────────── */

type Signal = {
  venue_name: string;
  venue_slug: string;
  signal_type: "trending" | "popular" | "new" | "lowkey" | "unique";
  platform: "tiktok" | "instagram" | "multi";
  engagement_score: number;
  sentiment: string;
  hashtags: string; // stored as JSON string "[]"
  snippet: string | null;
  neighborhood: string | null;
  category: string | null;
  city_slug: string;
};

/* ─── Gradient map by category ───────────────────────────────────── */

const CATEGORY_GRADIENTS: Record<string, string> = {
  "Rooftops":     "from-purple via-indigo-800 to-fuchsia-900",
  "Fine Dining":  "from-coral via-pink to-rose-900",
  "Live Music":   "from-teal via-cyan-700 to-indigo-900",
  "Jazz":         "from-indigo-900 via-purple to-fuchsia-800",
  "Bars":         "from-gold via-amber-600 to-coral",
  "Cocktail Bar": "from-teal via-emerald-700 to-cyan-900",
  "Nightlife":    "from-fuchsia-700 via-purple to-indigo-900",
  "Brunch":       "from-coral via-amber-500 to-pink",
  "Speakeasy":    "from-slate-800 via-purple to-indigo-900",
  "Sports Bar":   "from-teal via-cyan to-indigo-800",
  default:        "from-coral via-pink to-purple",
};

function gradientFor(cat: string | null) {
  if (!cat) return CATEGORY_GRADIENTS.default;
  return CATEGORY_GRADIENTS[cat] ?? CATEGORY_GRADIENTS.default;
}

function parseHashtags(raw: string): string[] {
  try {
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p.slice(0, 4) : [];
  } catch {
    return [];
  }
}

function shortCity(s?: string | null) {
  if (!s) return "TBD";
  return s.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase() || "TBD";
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

async function fetchSignals(citySlug = "dc", limit = 30): Promise<Signal[]> {
  const url = new URL(`${SUPABASE_URL}/rest/v1/social_venue_signals`);
  url.searchParams.set(
    "select",
    "venue_name,venue_slug,signal_type,platform,engagement_score,sentiment,hashtags,snippet,neighborhood,category,city_slug",
  );
  url.searchParams.set("city_slug", `eq.${citySlug}`);
  url.searchParams.set("is_active", "eq.true");
  url.searchParams.set("order", "engagement_score.desc");
  url.searchParams.set("limit", String(limit));
  const res = await fetch(url.toString(), {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) return [];
  return res.json();
}

/* ─── Sub-components ──────────────────────────────────────────────── */

function PlatformBadge({ platform }: { platform: string }) {
  const label = platform === "tiktok" ? "TikTok" : platform === "instagram" ? "IG" : "Social";
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest backdrop-blur",
        platform === "tiktok"
          ? "bg-black/70 text-white"
          : platform === "instagram"
          ? "bg-gradient-to-r from-pink/80 to-purple/80 text-white"
          : "bg-cream/20 text-cream",
      )}
    >
      {label}
    </span>
  );
}

function SignalBadge({ type }: { type: string }) {
  const map: Record<string, { icon: React.ElementType; color: string; label: string }> = {
    trending: { icon: Flame,      color: "text-coral",  label: "Trending" },
    popular:  { icon: TrendingUp, color: "text-gold",   label: "Popular"  },
    new:      { icon: Zap,        color: "text-teal",   label: "New"      },
    lowkey:   { icon: Star,       color: "text-purple", label: "Lowkey"   },
    unique:   { icon: Sparkles,   color: "text-pink",   label: "Unique"   },
  };
  const m = map[type] ?? map.trending;
  const Icon = m.icon;
  return (
    <span className={cn("flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-widest", m.color)}>
      <Icon className="size-2.5" />
      {m.label}
    </span>
  );
}

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
      <div className={cn("grid size-7 place-items-center rounded-full bg-cream/10", accent)}>
        <Icon className="size-3.5" />
      </div>
      <h3 className="font-display text-sm font-bold tracking-tight text-cream">{label}</h3>
    </div>
  );
}

function VibeCheckDivider() {
  return (
    <div className="relative my-4 flex items-center justify-center">
      <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-coral/40 to-transparent" />
      <span className="relative z-10 rounded-full bg-mocha-dark px-4 py-1.5 font-display text-xs font-bold tracking-wide text-coral shadow-sm">
        <Sparkles className="mr-1 inline size-3" />
        the vibe check
      </span>
    </div>
  );
}

function PassTimelineStrip({ loop }: { loop: ActiveLoop | null }) {
  if (!loop?.stops?.length) return null;
  return (
    <div className="rounded-3xl border-2 border-cream/20 bg-gradient-to-r from-indigo-950 via-purple-900 to-fuchsia-900 px-4 py-3 shadow-pop">
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
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-cream/60">
          {shortCity(loop.from)}
        </span>
        <div className="flex flex-1 items-center">
          <div className="h-px flex-1 bg-cream/25" />
          {loop.stops.map((stop: LoopStop) => (
            <div key={stop.id} className="relative mx-1 flex flex-col items-center">
              <div
                className={cn(
                  "size-3 rounded-full border-2 border-cream/40",
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
      <div className="mt-1 flex justify-around">
        {loop.stops.slice(0, 4).map((stop: LoopStop) => (
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

/* ─── Reel Card ───────────────────────────────────────────────────── */

function ReelCard({ signal, onPlay }: { signal: Signal; onPlay: () => void }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const tags = parseHashtags(signal.hashtags);

  return (
    <div className="group relative aspect-[9/16] w-full overflow-hidden rounded-3xl border-2 border-cream/15 shadow-lg">
      <div className={cn("absolute inset-0 bg-gradient-to-br", gradientFor(signal.category))} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/25" />

      {/* Play */}
      <button
        onClick={onPlay}
        className="absolute inset-0 z-10 grid place-items-center"
        aria-label="Play reel"
      >
        <span className="grid size-16 place-items-center rounded-full bg-cream/90 shadow-lg transition-transform group-hover:scale-110 active:scale-95">
          <Play className="ml-1 size-7 text-mocha-dark" fill="currentColor" />
        </span>
      </button>

      {/* Top bar */}
      <div className="absolute left-3 right-3 top-3 z-10 flex items-center justify-between">
        <PlatformBadge platform={signal.platform} />
        <div className="rounded-full bg-black/40 px-2.5 py-1 backdrop-blur">
          <SignalBadge type={signal.signal_type} />
        </div>
      </div>

      {/* Bottom */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-4">
        <Link
          to="/venue/$id"
          params={{ id: signal.venue_slug }}
          onClick={(e) => e.stopPropagation()}
          className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-coral/90 px-2.5 py-1"
        >
          <MapPin className="size-3 text-cream" />
          <span className="font-mono text-[10px] font-bold text-cream">{signal.venue_name}</span>
          {signal.neighborhood && (
            <span className="font-mono text-[9px] text-cream/70">· {signal.neighborhood}</span>
          )}
        </Link>
        <p className="line-clamp-3 text-sm font-medium leading-snug text-cream">
          {signal.snippet ?? `${signal.venue_name} — a must-visit in DC.`}
        </p>
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span key={t} className="font-mono text-[9px] font-bold text-cream/50">{t}</span>
            ))}
          </div>
        )}
        <div className="mt-2 font-mono text-[10px] text-cream/40">
          {Math.round(signal.engagement_score * 100)}% buzz score
        </div>
      </div>

      {/* Side actions */}
      <div className="absolute bottom-28 right-3 z-10 flex flex-col items-center gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setLiked((v) => !v);
            trackEngagement("reel_like", { venue: signal.venue_name });
            toast.success(liked ? "Removed" : "Liked!");
          }}
          className={cn(
            "grid size-10 place-items-center rounded-full backdrop-blur transition-colors",
            liked ? "bg-coral text-cream" : "bg-cream/15 text-cream hover:bg-cream/25",
          )}
          aria-label="Like"
        >
          <Heart className="size-4" fill={liked ? "currentColor" : "none"} />
        </button>
        <button
          onClick={async (e) => {
            e.stopPropagation();
            const next = !saved;
            setSaved(next);
            trackEngagement("reel_save", { venue: signal.venue_name });
            if (next) {
              // Write to favorite_stops by venue slug (venue_id field maps to slug for signal-sourced saves)
              supabase
                .from("favorite_stops")
                .upsert(
                  { venue_id: signal.venue_slug, venue_name: signal.venue_name } as any,
                  { onConflict: "venue_id,user_id", ignoreDuplicates: true },
                )
                .then(({ error }) => {
                  if (error) { setSaved(false); toast.error("Couldn't save"); }
                  else { toast.success(`${signal.venue_name} saved`); }
                });
            } else {
              toast.success("Removed from saved");
            }
          }}
          className={cn(
            "grid size-10 place-items-center rounded-full backdrop-blur transition-colors",
            saved ? "bg-teal/80 text-cream" : "bg-cream/15 text-cream hover:bg-cream/25",
          )}
          aria-label="Save"
        >
          <Bookmark className="size-4" fill={saved ? "currentColor" : "none"} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard
              ?.writeText(`${window.location.origin}/venue/${signal.venue_slug}`)
              .catch(() => {});
            trackEngagement("reel_share", { venue: signal.venue_name });
            toast.info("Link copied");
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

/* ─── Quote Card ──────────────────────────────────────────────────── */

function QuoteCard({ signal }: { signal: Signal }) {
  const tags = parseHashtags(signal.hashtags);
  return (
    <div className="rounded-2xl border-2 border-cream/12 bg-mocha-dark/60 p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br font-mono text-xs font-bold text-cream",
              gradientFor(signal.category),
            )}
          >
            {signal.venue_name[0]}
          </div>
          <div>
            <span className="text-sm font-bold text-cream">{signal.venue_name}</span>
            {signal.neighborhood && (
              <span className="ml-2 font-mono text-[10px] text-cream/50">{signal.neighborhood}</span>
            )}
          </div>
        </div>
        <PlatformBadge platform={signal.platform} />
      </div>
      {tags.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span key={t} className="rounded-full bg-cream/8 px-2 py-0.5 font-mono text-[9px] font-bold text-cream/50">
              {t}
            </span>
          ))}
        </div>
      )}
      <p className="text-sm leading-relaxed text-cream/80">
        {signal.snippet ?? `Worth a visit at ${signal.venue_name}.`}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <MapPin className="size-3 text-coral" />
        <span className="font-mono text-[10px] font-bold text-coral">{signal.category ?? "Venue"}</span>
        <span className="ml-auto">
          <SignalBadge type={signal.signal_type} />
        </span>
      </div>
    </div>
  );
}

/* ─── Discovery Card ──────────────────────────────────────────────── */

function DiscoveryCard({
  signal,
  onAdd,
  added,
}: {
  signal: Signal;
  onAdd: () => void;
  added: boolean;
}) {
  const tags = parseHashtags(signal.hashtags);
  return (
    <div className="w-[220px] flex-none snap-start">
      <Link to="/venue/$id" params={{ id: signal.venue_slug }}>
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border-2 border-cream/15 shadow-sm">
          <div className={cn("absolute inset-0 bg-gradient-to-br", gradientFor(signal.category))} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-3">
            <h4 className="font-display text-sm font-bold text-cream">{signal.venue_name}</h4>
            <span className="font-mono text-[10px] text-cream/70">
              {signal.category ?? "Venue"}
              {signal.neighborhood ? ` · ${signal.neighborhood}` : ""}
            </span>
          </div>
          <div className="absolute right-2 top-2 rounded-full bg-black/40 px-2 py-0.5 backdrop-blur">
            <SignalBadge type={signal.signal_type} />
          </div>
        </div>
      </Link>
      <div className="mt-2 flex items-center justify-between px-1">
        <p className="line-clamp-1 min-w-0 flex-1 text-xs text-cream/55">
          {tags[0] ?? signal.category ?? ""}
        </p>
        <button
          onClick={onAdd}
          disabled={added}
          className={cn(
            "ml-2 shrink-0 rounded-full px-3 py-1.5 font-mono text-[10px] font-bold transition-all",
            added ? "bg-teal/20 text-teal" : "bg-coral text-cream shadow-sm hover:scale-105 active:scale-95",
          )}
        >
          {added ? "✓ Added" : "+ Add"}
        </button>
      </div>
    </div>
  );
}

/* ─── Skeleton ────────────────────────────────────────────────────── */

function ReelSkeleton() {
  return <div className="aspect-[9/16] w-full animate-pulse rounded-3xl bg-cream/8" />;
}

/* ─── Main Page ───────────────────────────────────────────────────── */

function ReelsPage() {
  usePageview("app_reels", "/app/reels");

  const [loop, setLoop] = useState<ActiveLoop | null>(() => getActiveLoop());
  const [addedVenues, setAddedVenues] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handler = () => setLoop(getActiveLoop());
    handler();
    window.addEventListener("loop:active:changed", handler);
    const storageHandler = (e: StorageEvent) => {
      if (e.key === "loop:active") handler();
    };
    window.addEventListener("storage", storageHandler);
    return () => {
      window.removeEventListener("loop:active:changed", handler);
      window.removeEventListener("storage", storageHandler);
    };
  }, []);

  const { data: signals, isLoading } = useQuery({
    queryKey: ["reels", "signals", "dc"],
    queryFn: () => fetchSignals("dc", 30),
    staleTime: 5 * 60_000,
  });

  const handleAdd = useCallback((signal: Signal) => {
    const stop: LoopStop = {
      id: `reel-${signal.venue_slug}-${Date.now()}`,
      name: signal.venue_name,
      type: signal.category ?? "venue",
      time: "TBD",
      area: signal.neighborhood ?? undefined,
      category: "activity",
    };
    const updated = addStop(stop);
    if (!updated) {
      toast.error("No active plan — build one first", {
        action: { label: "Plan my night", onClick: () => { window.location.href = "/app/plan"; } },
      });
      return;
    }
    setLoop(updated);
    setAddedVenues((prev) => new Set(prev).add(signal.venue_slug));
    trackEngagement("reel_add_to_pass", { venue: signal.venue_name });
    toast.success(`${signal.venue_name} added to your pass!`, {
      description: "Check your boarding pass for the updated route",
    });
  }, []);

  const handlePlay = useCallback((signal: Signal) => {
    trackEngagement("reel_play", { venue: signal.venue_name });
    toast(
      `Opening ${signal.venue_name} on ${signal.platform === "multi" ? "social" : signal.platform}…`,
      { duration: 1500 },
    );
  }, []);

  const reelCards    = signals?.slice(0, 4) ?? [];
  const quoteCards   = signals?.filter((s) => (s.snippet?.length ?? 0) > 60).slice(4, 7) ?? [];
  const discoveryCards = signals?.slice(7, 19) ?? [];

  return (
    <div className="min-h-screen pb-28">
      <div className="mx-auto max-w-md px-4 pt-4">

        <PassTimelineStrip loop={loop} />
        <VibeCheckDivider />

        {/* ── Trending reels ──────────────────────────────────────── */}
        <SectionHeader icon={Flame} label="Trending in DC right now" accent="text-coral" />
        <div className="mb-6 space-y-4">
          {isLoading ? (
            <><ReelSkeleton /><ReelSkeleton /></>
          ) : reelCards.length > 0 ? (
            reelCards.slice(0, 2).map((s) => (
              <ReelCard key={`${s.venue_slug}-${s.platform}`} signal={s} onPlay={() => handlePlay(s)} />
            ))
          ) : (
            <div className="flex aspect-[9/16] w-full items-center justify-center rounded-3xl border-2 border-dashed border-cream/10 bg-cream/[0.03]">
              <span className="font-mono text-[10px] uppercase tracking-widest text-cream/30">
                No signals yet
              </span>
            </div>
          )}
        </div>

        {/* ── What people are saying ──────────────────────────────── */}
        {quoteCards.length > 0 && (
          <>
            <SectionHeader icon={TrendingUp} label="What people are saying" accent="text-gold" />
            <div className="mb-6 space-y-3">
              {quoteCards.map((s) => (
                <QuoteCard key={`${s.venue_slug}-quote`} signal={s} />
              ))}
            </div>
          </>
        )}

        {/* ── More reels ──────────────────────────────────────────── */}
        {reelCards.length > 2 && (
          <div className="mb-6 space-y-4">
            {reelCards.slice(2).map((s) => (
              <ReelCard
                key={`${s.venue_slug}-${s.platform}-b`}
                signal={s}
                onPlay={() => handlePlay(s)}
              />
            ))}
          </div>
        )}

        {/* ── Discover ────────────────────────────────────────────── */}
        {discoveryCards.length > 0 && (
          <>
            <SectionHeader icon={MapPin} label="Discover more in DC" accent="text-purple" />
            <div className="-mx-4 mb-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 scrollbar-none">
              {discoveryCards.map((s) => (
                <DiscoveryCard
                  key={`${s.venue_slug}-disc`}
                  signal={s}
                  onAdd={() => handleAdd(s)}
                  added={addedVenues.has(s.venue_slug)}
                />
              ))}
            </div>
          </>
        )}

        {/* ── CTA ─────────────────────────────────────────────────── */}
        {!loop && (
          <div className="mb-6 rounded-3xl border-2 border-coral/20 bg-gradient-to-br from-coral/10 to-pink/10 p-6 text-center">
            <Sparkles className="mx-auto mb-2 size-8 text-coral" />
            <h3 className="mb-1 font-display text-lg font-bold text-cream">Build your night</h3>
            <p className="mb-4 text-sm text-cream/60">
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
