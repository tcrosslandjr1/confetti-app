// Confetti — Happy Hour Crawl Template Detail
//
// Displays a 3-stop itinerary for a selected crawl template.
// Fetches template + matching deals from Supabase based on
// vibe_arc/occasion, then assigns best-fit deals to each slot.

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Clock,
  MapPin,
  Train,
  Wine,
  Beer,
  Utensils,
  Star,
  ChevronRight,
  Sparkles,
  Zap,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MobileHeader } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { usePageview, trackEngagement } from "@/lib/analytics";
import { Reveal } from "@/components/Reveal";
import { setActiveLoop, makeDemoLoop } from "@/lib/loop-store";

// ── Route definition ────────────────────────────────────────────

export const Route = createFileRoute("/app/happy-hour/crawl")({
  validateSearch: (search: Record<string, unknown>) => ({
    template: (search.template as string) ?? "",
  }),
  component: CrawlTemplatePage,
});

// ── Types ───────────────────────────────────────────────────────

type TemplateRow = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  metro_area: string;
  occasion: string;
  mood: string | null;
  duration_hours: number;
  stop_count: number;
  budget_range: string | null;
  pro_tip: string | null;
  best_days: string[];
  vibe_arc: string[];
};

type DealRow = {
  id: string;
  venue_id: string;
  deal_name: string;
  deal_summary: string;
  drink_specials: Array<{ name: string; price: string; type?: string }>;
  food_specials: Array<{ name: string; price: string; type?: string }>;
  days_active: string[];
  start_time: string;
  end_time: string;
  vibe_tags: string[];
  crowd_level: number | null;
  noise_level: number | null;
  best_for: string[];
  seating_type: string[];
  avg_savings_pct: number | null;
  price_floor: number | null;
  price_ceiling: number | null;
  two_person_est: number | null;
  is_verified: boolean;
  popularity_score: number;
  restrictions: string | null;
  venues: {
    id: string;
    name: string;
    neighborhood: string | null;
    city: string | null;
    photo_url: string | null;
    price_level: number | null;
    metro_accessible: boolean | null;
  } | null;
  dmv_neighborhoods: {
    id: string;
    name: string;
    metro_area: string;
    metro_lines: string[];
    metro_access: boolean;
  } | null;
};

// ── Helpers ─────────────────────────────────────────────────────

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return m === 0 ? `${h12}${ampm}` : `${h12}:${String(m).padStart(2, "0")}${ampm}`;
}

const SLOT_META: {
  label: string;
  sublabel: string;
  icon: typeof Wine;
  color: string;
  bg: string;
}[] = [
  {
    label: "Pre-Game",
    sublabel: "Kick things off",
    icon: Beer,
    color: "text-teal-400",
    bg: "bg-teal-400/10 border-teal-400/20",
  },
  {
    label: "Main Event",
    sublabel: "The centerpiece",
    icon: Sparkles,
    color: "text-coral",
    bg: "bg-coral/10 border-coral/20",
  },
  {
    label: "Nightcap",
    sublabel: "Wind it down",
    icon: Wine,
    color: "text-purple-400",
    bg: "bg-purple-400/10 border-purple-400/20",
  },
];

const TEMPLATE_EMOJI: Record<string, string> = {
  happy_hour_classic: "🍻",
  culture_night: "🎭",
  sports_bar_hop: "🏈",
  girls_night_out: "🥂",
  guys_night_out: "🥃",
  trending_hotspots: "🔥",
};

/**
 * Assign deals to crawl slots based on vibe_arc alignment and energy.
 * Slot 0 = lowest energy, Slot 1 = highest, Slot 2 = mid.
 */
function assignDealsToSlots(
  deals: DealRow[],
  vibeArc: string[],
): [DealRow | null, DealRow | null, DealRow | null] {
  if (deals.length === 0) return [null, null, null];

  // Score each deal for each slot position
  const scored = deals.map((d) => {
    const vibeOverlap = d.vibe_tags.filter((v) => vibeArc.includes(v)).length;
    const energy = d.crowd_level ?? 5;
    return { deal: d, vibeOverlap, energy };
  });

  // Sort by vibe overlap desc, then popularity
  scored.sort((a, b) => b.vibeOverlap - a.vibeOverlap || b.deal.popularity_score - a.deal.popularity_score);

  // Slot 0 (Pre-Game): lower energy, good vibes
  // Slot 1 (Main Event): highest energy + vibe overlap
  // Slot 2 (Nightcap): moderate energy
  const used = new Set<string>();

  function pick(
    preference: (s: typeof scored[0]) => number,
  ): DealRow | null {
    const sorted = [...scored]
      .filter((s) => !used.has(s.deal.id))
      .sort((a, b) => preference(b) - preference(a));
    const choice = sorted[0];
    if (!choice) return null;
    used.add(choice.deal.id);
    return choice.deal;
  }

  const preGame = pick((s) => s.vibeOverlap * 10 - s.energy * 2);
  const mainEvent = pick((s) => s.vibeOverlap * 10 + s.energy * 3 + s.deal.popularity_score);
  const nightcap = pick((s) => s.vibeOverlap * 10 + Math.abs(5 - s.energy) * -1);

  return [preGame, mainEvent, nightcap];
}

// ── Component ───────────────────────────────────────────────────

function CrawlTemplatePage() {
  const { template: templateId } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  usePageview("app_happy_hour_crawl", "/app/happy-hour/crawl");

  // ── Fetch template ─────────────────────────────────────────
  const { data: template, isLoading: loadingTemplate } = useQuery({
    queryKey: ["happy-hour-template", templateId],
    queryFn: async () => {
      if (!templateId) return null;
      const { data, error } = await supabase
        .from("happy_hour_itinerary_templates")
        .select("*")
        .eq("id", templateId)
        .single();
      if (error) throw error;
      return data as TemplateRow;
    },
    enabled: !!templateId,
    staleTime: 300_000,
  });

  // ── Fetch deals that match template vibes ──────────────────
  const { data: deals, isLoading: loadingDeals } = useQuery({
    queryKey: ["happy-hour-crawl-deals", templateId, template?.vibe_arc],
    queryFn: async () => {
      if (!template) return [];
      const { data, error } = await supabase
        .from("happy_hour_deals")
        .select(
          `
          *,
          venues!inner(id, name, neighborhood, city, photo_url, price_level, metro_accessible),
          dmv_neighborhoods(id, name, metro_area, metro_lines, metro_access)
        `,
        )
        .overlaps("vibe_tags", template.vibe_arc)
        .order("popularity_score", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as DealRow[];
    },
    enabled: !!template,
    staleTime: 120_000,
  });

  // ── Assign deals to 3 slots ────────────────────────────────
  const slots = deals
    ? assignDealsToSlots(deals, template?.vibe_arc ?? [])
    : [null, null, null];

  const isLoading = loadingTemplate || loadingDeals;

  // ── No template found ──────────────────────────────────────
  if (!templateId) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-5">
        <p className="font-mono text-[11px] uppercase tracking-widest text-cream/40">
          No template selected
        </p>
        <Link
          to="/app/happy-hour"
          className="rounded-xl bg-coral px-5 py-2.5 font-display text-[13px] font-bold text-cream"
        >
          Browse Crawls
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <MobileHeader
        eyebrow="Happy Hour Crawl"
        title={isLoading ? "Loading…" : (template?.name ?? "Crawl")}
        left={
          <button
            onClick={() => navigate({ to: "/app/happy-hour" })}
            className="grid size-9 place-items-center rounded-xl bg-cream/10 text-cream/60 transition-colors hover:bg-cream/15 hover:text-cream"
            aria-label="Back"
          >
            <ArrowLeft className="size-4" />
          </button>
        }
      />

      <div className="px-5">
        {/* ── Template Hero ────────────────────────────────── */}
        {isLoading ? (
          <div className="mt-4 space-y-3">
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-5 w-2/3" />
          </div>
        ) : template ? (
          <Reveal>
            <div className="mt-4 rounded-2xl border border-cream/10 bg-gradient-to-br from-cream/[0.06] to-cream/[0.02] p-5">
              <div className="flex items-start gap-3">
                <span className="text-3xl">{TEMPLATE_EMOJI[template.id] ?? "🍸"}</span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-[18px] font-extrabold tracking-tight text-cream leading-tight">
                    {template.name}
                  </h2>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-coral">
                    {template.tagline}
                  </p>
                </div>
              </div>

              <p className="mt-3 text-[13px] leading-relaxed text-cream/60">
                {template.description}
              </p>

              {/* Quick stats */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center gap-0.5 rounded-xl border border-cream/10 bg-cream/5 p-2">
                  <Clock className="size-3.5 text-cream/40" />
                  <span className="font-mono text-[10px] font-bold text-cream/80">
                    {template.duration_hours}h
                  </span>
                  <span className="font-mono text-[7px] uppercase tracking-widest text-cream/30">
                    Duration
                  </span>
                </div>
                <div className="flex flex-col items-center gap-0.5 rounded-xl border border-cream/10 bg-cream/5 p-2">
                  <MapPin className="size-3.5 text-cream/40" />
                  <span className="font-mono text-[10px] font-bold text-cream/80">
                    {template.stop_count} stops
                  </span>
                  <span className="font-mono text-[7px] uppercase tracking-widest text-cream/30">
                    Crawl
                  </span>
                </div>
                <div className="flex flex-col items-center gap-0.5 rounded-xl border border-cream/10 bg-cream/5 p-2">
                  <Users className="size-3.5 text-cream/40" />
                  <span className="font-mono text-[10px] font-bold text-cream/80">
                    {template.budget_range ?? "$$"}
                  </span>
                  <span className="font-mono text-[7px] uppercase tracking-widest text-cream/30">
                    Budget
                  </span>
                </div>
              </div>

              {/* Vibe arc */}
              {template.vibe_arc?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {template.vibe_arc.map((v) => (
                    <Badge key={v} variant="outline" className="text-[8px]">
                      {v.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Best days */}
              {template.best_days?.length > 0 && (
                <p className="mt-2 font-mono text-[9px] uppercase tracking-widest text-cream/30">
                  Best on {template.best_days.join(" · ")}
                </p>
              )}
            </div>
          </Reveal>
        ) : null}

        {/* ── Itinerary Timeline ──────────────────────────── */}
        <div className="mt-6">
          <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-cream/40">
            Your 3-Stop Itinerary
          </h3>

          <div className="relative mt-4 space-y-0">
            {/* Vertical connector line */}
            <div className="absolute left-[19px] top-10 bottom-10 w-px bg-gradient-to-b from-teal-400/40 via-coral/40 to-purple-400/40" />

            {SLOT_META.map((slot, idx) => {
              const deal = slots[idx];
              const Icon = slot.icon;

              return (
                <Reveal key={idx} delay={idx * 120}>
                  <div className="relative flex gap-4 pb-6">
                    {/* Timeline dot */}
                    <div
                      className={cn(
                        "relative z-10 grid size-10 shrink-0 place-items-center rounded-2xl border",
                        slot.bg,
                      )}
                    >
                      <Icon className={cn("size-4", slot.color)} />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={cn("font-mono text-[10px] font-bold uppercase tracking-widest", slot.color)}>
                          Stop {idx + 1}
                        </span>
                        <span className="font-mono text-[9px] uppercase tracking-widest text-cream/30">
                          {slot.label}
                        </span>
                      </div>

                      {isLoading ? (
                        <div className="mt-2 space-y-2">
                          <Skeleton className="h-20 w-full rounded-xl" />
                        </div>
                      ) : deal ? (
                        <div className="mt-2 rounded-xl border border-cream/10 bg-cream/[0.04] p-3.5">
                          {/* Venue header */}
                          <div className="flex gap-3">
                            {deal.venues?.photo_url && (
                              <div className="size-14 shrink-0 overflow-hidden rounded-lg">
                                <img
                                  src={deal.venues.photo_url}
                                  alt={deal.venues.name}
                                  className="size-full object-cover"
                                  loading="lazy"
                                />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <h4 className="font-display text-[14px] font-bold tracking-tight text-cream leading-tight">
                                {deal.venues?.name ?? "TBD"}
                              </h4>
                              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-cream/40">
                                {deal.deal_name}
                              </p>
                            </div>
                          </div>

                          {/* Time + Location */}
                          <div className="mt-2.5 flex flex-wrap gap-3">
                            <div className="flex items-center gap-1.5">
                              <Clock className="size-3 text-cream/30" />
                              <span className="font-mono text-[10px] text-cream/60">
                                {formatTime(deal.start_time)}–{formatTime(deal.end_time)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="size-3 text-cream/30" />
                              <span className="font-mono text-[10px] text-cream/60">
                                {deal.dmv_neighborhoods?.name ?? deal.venues?.neighborhood ?? "—"}
                              </span>
                            </div>
                            {deal.dmv_neighborhoods?.metro_access && (
                              <div className="flex items-center gap-1.5">
                                <Train className="size-3 text-teal-400" />
                                <span className="font-mono text-[10px] text-teal-400/80">Metro</span>
                              </div>
                            )}
                          </div>

                          {/* Highlights */}
                          {deal.drink_specials?.length > 0 && (
                            <div className="mt-2.5 flex flex-wrap gap-1">
                              {deal.drink_specials.slice(0, 3).map((s, i) => (
                                <span
                                  key={i}
                                  className="rounded-md bg-cream/[0.06] px-2 py-0.5 font-mono text-[9px] text-cream/60"
                                >
                                  {s.name} <span className="font-bold text-coral">{s.price}</span>
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Savings badge */}
                          <div className="mt-2.5 flex items-center justify-between">
                            <div className="flex gap-1.5">
                              {deal.is_verified && (
                                <Badge variant="gold" className="text-[8px]">
                                  <Star className="mr-0.5 size-2.5" /> Verified
                                </Badge>
                              )}
                              {deal.avg_savings_pct && (
                                <Badge variant="coral" className="text-[8px]">
                                  Save {deal.avg_savings_pct}%
                                </Badge>
                              )}
                            </div>
                            {deal.two_person_est && (
                              <span className="font-mono text-[10px] text-cream/40">
                                ~${deal.two_person_est} for two
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 flex items-center gap-2 rounded-xl border-2 border-dashed border-cream/10 bg-cream/[0.02] p-4">
                          <Zap className="size-4 text-cream/20" />
                          <span className="font-mono text-[10px] uppercase tracking-widest text-cream/25">
                            AI matching venues…
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>

        {/* ── Pro Tip ─────────────────────────────────────── */}
        {template?.pro_tip && (
          <Reveal delay={400}>
            <div className="mt-2 rounded-xl border border-coral/20 bg-coral/5 p-3.5">
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-coral/80">
                Pro Tip
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-cream/60">
                {template.pro_tip}
              </p>
            </div>
          </Reveal>
        )}

        {/* ── CTA ─────────────────────────────────────────── */}
        <Reveal delay={500}>
          <div className="mt-6 space-y-3">
            <button
              onClick={() => {
                const SLOT_TIMES = ["5:30 PM", "7:00 PM", "9:00 PM"];
                const loopStops = slots
                  .flatMap((deal, idx) => {
                    if (!deal) return [];
                    const d = deal as any;
                    return [{
                      id: `crawl-${d.id ?? idx}-${Date.now()}`,
                      name: d.venue_name ?? d.bar_name ?? d.name ?? `Stop ${idx + 1}`,
                      type: "drinks" as const,
                      time: SLOT_TIMES[idx] ?? "TBD",
                      area: (d.neighborhood ?? d.region ?? undefined) as string | undefined,
                      category: "drinks" as const,
                      priceLevel: (d.price_tag ?? d.price_level ?? "$$") as string,
                      slot: (["Pre-Game", "Main Event", "Nightcap"][idx]) as string,
                    }];
                  });

                const loop = makeDemoLoop({
                  to: template?.name ?? "Happy Hour Crawl",
                  occasion: "Happy Hour",
                  vibe: template?.vibe_arc?.[0] ?? "Good vibes",
                  stops: loopStops,
                  confettiPoints: 150,
                });
                setActiveLoop(loop);
                trackEngagement("crawl_started", {
                  templateId: template?.id,
                  templateName: template?.name,
                  stopCount: loopStops.length,
                });
                navigate({ to: "/boarding-pass" });
              }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-coral px-6 py-4 font-display text-[15px] font-bold text-cream shadow-lg transition-all active:scale-[0.97] hover:bg-coral/90"
            >
              Start This Crawl
              <ChevronRight className="size-4" />
            </button>

            <Link
              to="/app/happy-hour"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-cream/15 bg-cream/5 px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-cream/60 transition-all active:scale-[0.97] hover:bg-cream/10 hover:text-cream"
            >
              Browse More Deals
            </Link>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
