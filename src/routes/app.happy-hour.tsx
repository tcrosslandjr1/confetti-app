import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Clock,
  MapPin,
  Train,
  Zap,
  ChevronRight,
  Wine,
  Beer,
  Utensils,
  Star,
  Flame,
  Filter,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MobileHeader } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/lib/auth-context";
import { usePageview } from "@/lib/analytics";
import { Reveal } from "@/components/Reveal";
import { HappyHourDealSheet } from "@/components/happy-hour/DealSheet";
import { HH_TEMPLATES } from "@/lib/agents/happy-hour-contracts";
import { isHappyHourActive, type HHVenue } from "@/lib/agents/happy-hour-engine";

export const Route = createFileRoute("/app/happy-hour")({
  component: HappyHourPage,
});

// ── Filter Config ────────────────────────────────────────────────

const REGIONS = [
  { key: "all", label: "All DMV" },
  { key: "DC", label: "DC" },
  { key: "MD", label: "MD" },
  { key: "VA", label: "VA" },
] as const;

const VIBE_FILTERS = [
  { key: "happy_hour", label: "Happy Hour", icon: Beer },
  { key: "rooftop", label: "Rooftop", icon: Star },
  { key: "patio", label: "Patio", icon: Utensils },
  { key: "sports", label: "Sports", icon: Zap },
  { key: "culture", label: "Culture", icon: Wine },
  { key: "trending", label: "Trending", icon: Flame },
] as const;

// ── Types for Supabase result ────────────────────────────────────

type HHDealRow = {
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

// ── Helpers ──────────────────────────────────────────────────────

function isActiveNow(deal: HHDealRow): boolean {
  const now = new Date();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = dayNames[now.getDay()];
  if (!deal.days_active.includes(today)) return false;

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const [sH, sM] = deal.start_time.split(":").map(Number);
  const [eH, eM] = deal.end_time.split(":").map(Number);
  return nowMin >= sH * 60 + sM && nowMin <= eH * 60 + eM;
}

function formatTimeWindow(start: string, end: string): string {
  const fmt = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return m === 0 ? `${h12}${ampm}` : `${h12}:${String(m).padStart(2, "0")}${ampm}`;
  };
  return `${fmt(start)} – ${fmt(end)}`;
}

function priceIndicator(floor: number | null, ceiling: number | null): string {
  if (!floor && !ceiling) return "$$";
  const avg = ((floor ?? 0) + (ceiling ?? 0)) / 2;
  if (avg <= 6) return "$";
  if (avg <= 12) return "$$";
  if (avg <= 20) return "$$$";
  return "$$$$";
}

const TEMPLATE_EMOJI: Record<string, string> = {
  happy_hour_classic: "🍻",
  culture_night: "🎭",
  sports_bar_hop: "🏈",
  girls_night_out: "🥂",
  guys_night_out: "🥃",
  trending_hotspots: "🔥",
};

// ── Page Component ───────────────────────────────────────────────

function HappyHourPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  usePageview("app_happy_hour", "/app/happy-hour");

  // State
  const [q, setQ] = useState("");
  const [region, setRegion] = useState<string>("all");
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [activeOnly, setActiveOnly] = useState(false);
  const [metroOnly, setMetroOnly] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<HHDealRow | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // ── Query: Deals joined with venues + neighborhoods ──────────
  const {
    data: deals,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["happy-hour-deals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("happy_hour_deals")
        .select(
          `
          *,
          venues!inner(id, name, neighborhood, city, photo_url, price_level, metro_accessible),
          dmv_neighborhoods(id, name, metro_area, metro_lines, metro_access)
        `,
        )
        .order("popularity_score", { ascending: false });
      if (error) throw error;
      return (data ?? []) as HHDealRow[];
    },
    staleTime: 120_000,
  });

  // ── Query: Itinerary templates ───────────────────────────────
  const { data: templates } = useQuery({
    queryKey: ["happy-hour-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("happy_hour_itinerary_templates")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return (data ?? []) as TemplateRow[];
    },
    staleTime: 300_000,
  });

  // ── Filtered deals ───────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!deals) return [];
    let list = [...deals];

    // Region
    if (region !== "all") {
      list = list.filter((d) => d.dmv_neighborhoods?.metro_area === region);
    }

    // Vibe tags
    if (selectedVibes.length) {
      list = list.filter((d) =>
        selectedVibes.some((v) => d.vibe_tags.includes(v)),
      );
    }

    // Active now
    if (activeOnly) {
      list = list.filter(isActiveNow);
    }

    // Metro only
    if (metroOnly) {
      list = list.filter(
        (d) => d.dmv_neighborhoods?.metro_access === true,
      );
    }

    // Search
    const qLower = q.toLowerCase().trim();
    if (qLower) {
      list = list.filter(
        (d) =>
          d.deal_name.toLowerCase().includes(qLower) ||
          d.deal_summary.toLowerCase().includes(qLower) ||
          (d.venues?.name ?? "").toLowerCase().includes(qLower) ||
          (d.venues?.neighborhood ?? "").toLowerCase().includes(qLower) ||
          (d.dmv_neighborhoods?.name ?? "").toLowerCase().includes(qLower),
      );
    }

    return list;
  }, [deals, region, selectedVibes, activeOnly, metroOnly, q]);

  // Count active now for the indicator
  const activeCount = useMemo(
    () => (deals ?? []).filter(isActiveNow).length,
    [deals],
  );

  const toggleVibe = (vibe: string) =>
    setSelectedVibes((prev) =>
      prev.includes(vibe) ? prev.filter((v) => v !== vibe) : [...prev, vibe],
    );

  const hasActiveFilters = region !== "all" || selectedVibes.length > 0 || activeOnly || metroOnly;

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="pb-6">
      <MobileHeader
        eyebrow="DMV Happy Hours"
        title="Deals & Crawls"
        right={<NotificationBell userId={user?.id} />}
      />

      <div className="px-5">
        {/* ── Active Now Banner ────────────────────────── */}
        {activeCount > 0 && (
          <Reveal>
            <button
              onClick={() => {
                setActiveOnly(true);
                setShowFilters(false);
              }}
              className="mb-4 flex w-full items-center gap-3 rounded-2xl border border-coral/20 bg-coral/10 p-3.5 text-left transition-all active:scale-[0.98]"
            >
              <div className="relative grid size-10 shrink-0 place-items-center rounded-xl bg-coral/20">
                <Zap className="size-5 text-coral" />
                <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-coral text-[10px] font-bold text-cream">
                  {activeCount}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display text-[14px] font-bold text-cream">
                  {activeCount} Happy Hour{activeCount > 1 ? "s" : ""} Live Now
                </div>
                <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-cream/50">
                  Tap to see what's pouring right now
                </div>
              </div>
              <ChevronRight className="size-4 text-cream/30" />
            </button>
          </Reveal>
        )}

        {/* ── Search + Filter Toggle ──────────────────── */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-cream/35" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search deals, venues, neighborhoods"
            className="h-12 rounded-xl border border-cream/20 bg-cream/5 pl-10 pr-12 text-cream placeholder:text-cream/30 focus:border-coral"
          />
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              "absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg transition-colors",
              hasActiveFilters
                ? "bg-coral text-cream"
                : "bg-cream/10 text-cream/60 hover:bg-cream/15 hover:text-cream",
            )}
            aria-label="Toggle filters"
          >
            <Filter className="size-4" />
          </button>
        </div>

        {/* ── Region Pills ────────────────────────────── */}
        <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-2 scrollbar-none">
          {REGIONS.map((r) => (
            <button
              key={r.key}
              onClick={() => setRegion(r.key)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-all duration-200 active:scale-[0.97]",
                region === r.key
                  ? "border-coral bg-coral text-cream shadow-sm"
                  : "border-cream/15 bg-cream/5 text-cream/60 hover:border-cream/25 hover:text-cream",
              )}
            >
              {r.label}
            </button>
          ))}

          {/* Divider */}
          <div className="mx-1 w-px shrink-0 bg-cream/10" />

          {/* Active Now toggle */}
          <button
            onClick={() => setActiveOnly((v) => !v)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-all duration-200 active:scale-[0.97]",
              activeOnly
                ? "border-coral bg-coral text-cream shadow-sm"
                : "border-cream/15 bg-cream/5 text-cream/60 hover:border-cream/25 hover:text-cream",
            )}
          >
            {activeOnly ? "⚡ Live" : "Active Now"}
          </button>

          {/* Metro toggle */}
          <button
            onClick={() => setMetroOnly((v) => !v)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-all duration-200 active:scale-[0.97]",
              metroOnly
                ? "border-coral bg-coral text-cream shadow-sm"
                : "border-cream/15 bg-cream/5 text-cream/60 hover:border-cream/25 hover:text-cream",
            )}
          >
            <span className="flex items-center gap-1">
              <Train className="size-3" /> Metro
            </span>
          </button>
        </div>

        {/* ── Vibe Filter Pills (collapsible) ─────────── */}
        {showFilters && (
          <Reveal>
            <div className="mt-3 rounded-xl border border-cream/10 bg-cream/[0.03] p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-cream/40">
                  Filter by vibe
                </span>
                {selectedVibes.length > 0 && (
                  <button
                    onClick={() => setSelectedVibes([])}
                    className="font-mono text-[10px] uppercase tracking-widest text-coral"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {VIBE_FILTERS.map((v) => {
                  const Icon = v.icon;
                  const active = selectedVibes.includes(v.key);
                  return (
                    <button
                      key={v.key}
                      onClick={() => toggleVibe(v.key)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-all duration-200 active:scale-[0.97]",
                        active
                          ? "border-coral bg-coral text-cream shadow-sm"
                          : "border-cream/15 bg-cream/5 text-cream/60 hover:border-cream/25 hover:text-cream",
                      )}
                    >
                      <Icon className="size-3" />
                      {v.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </Reveal>
        )}

        {/* ── Active Filters Summary ──────────────────── */}
        {hasActiveFilters && (
          <div className="mt-3 flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-cream/30">
              {filtered.length} deal{filtered.length !== 1 ? "s" : ""}
            </span>
            <button
              onClick={() => {
                setRegion("all");
                setSelectedVibes([]);
                setActiveOnly(false);
                setMetroOnly(false);
              }}
              className="ml-auto flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-coral"
            >
              <X className="size-3" /> Clear all
            </button>
          </div>
        )}
      </div>

      {/* ── Crawl Templates Section ──────────────────── */}
      {!q && !hasActiveFilters && templates && templates.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between px-5">
            <h2 className="font-display text-[16px] font-bold text-cream">
              Happy Hour Crawls
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-widest text-cream/30">
              3-stop itineraries
            </span>
          </div>
          <div className="-mx-0 mt-3 flex gap-3 overflow-x-auto px-5 pb-3 scrollbar-none">
            {templates.map((t, i) => (
              <Reveal key={t.id} delay={i * 80}>
                <button
                  onClick={() => navigate({ to: "/app/happy-hour/crawl", search: { template: t.id } })}
                  className="flex w-[200px] shrink-0 flex-col rounded-2xl border border-cream/10 bg-cream/5 p-4 text-left shadow-card transition-all duration-200 active:scale-[0.97] hover:shadow-card-hover"
                >
                  <span className="text-2xl">{TEMPLATE_EMOJI[t.id] ?? "🍸"}</span>
                  <span className="mt-2 font-display text-[14px] font-bold leading-tight text-cream">
                    {t.name}
                  </span>
                  <span className="mt-1 line-clamp-2 font-mono text-[10px] leading-relaxed text-cream/45">
                    {t.tagline}
                  </span>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="outline" className="text-[8px]">
                      {t.stop_count} stops
                    </Badge>
                    <Badge variant="outline" className="text-[8px]">
                      {t.duration_hours}h
                    </Badge>
                    {t.budget_range && (
                      <Badge variant="outline" className="text-[8px]">
                        {t.budget_range}
                      </Badge>
                    )}
                  </div>
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      )}

      {/* ── Deal Cards ────────────────────────────────── */}
      <div className="mt-4 px-5">
        {!q && !hasActiveFilters && (
          <h2 className="mb-3 font-display text-[16px] font-bold text-cream">
            All Deals
          </h2>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3.5 rounded-2xl border border-cream/10 bg-cream/5 p-3">
                <Skeleton className="size-16 shrink-0 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-3 w-full rounded" />
                  <Skeleton className="h-3 w-1/2 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border-2 border-dashed border-cream/10 bg-cream/[0.03] p-6 text-center">
            <span className="font-mono text-[10px] uppercase tracking-widest text-cream/30">
              Failed to load deals — pull to retry
            </span>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {filtered.map((deal, i) => {
              const active = isActiveNow(deal);
              return (
                <Reveal key={deal.id} as="li" delay={i * 50}>
                  <button
                    onClick={() => setSelectedDeal(deal)}
                    className="flex w-full gap-3.5 rounded-2xl border border-cream/10 bg-cream/5 p-3 text-left shadow-card transition-all duration-200 active:scale-[0.97] hover:shadow-card-hover"
                  >
                    {/* Venue thumbnail */}
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-cream/[0.04]">
                      {deal.venues?.photo_url ? (
                        <img
                          src={deal.venues.photo_url}
                          alt={deal.venues.name}
                          className="size-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="grid size-full place-items-center">
                          <Beer className="size-6 text-cream/20" />
                        </div>
                      )}
                      {active && (
                        <div className="absolute left-1 top-1 flex items-center gap-0.5 rounded-full bg-coral px-1.5 py-0.5">
                          <span className="relative flex size-1.5">
                            <span className="absolute inline-flex size-full animate-ping rounded-full bg-cream opacity-75" />
                            <span className="relative inline-flex size-1.5 rounded-full bg-cream" />
                          </span>
                          <span className="font-mono text-[7px] font-bold uppercase text-cream">
                            Live
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Deal info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="line-clamp-1 font-display text-[14px] font-bold tracking-tight text-cream">
                          {deal.venues?.name ?? "Unknown Venue"}
                        </div>
                        <span className="shrink-0 font-mono text-[11px] font-bold tracking-wider text-coral">
                          {priceIndicator(deal.price_floor, deal.price_ceiling)}
                        </span>
                      </div>

                      <div className="mt-0.5 line-clamp-1 font-mono text-[10px] uppercase tracking-wide text-cream/50">
                        {deal.deal_name}
                      </div>

                      <div className="mt-1 flex items-center gap-2 font-mono text-[10px] tracking-wide text-cream/40">
                        <span className="flex items-center gap-0.5">
                          <Clock className="size-3" />
                          {formatTimeWindow(deal.start_time, deal.end_time)}
                        </span>
                        {deal.dmv_neighborhoods && (
                          <span className="flex items-center gap-0.5">
                            <MapPin className="size-3" />
                            {deal.dmv_neighborhoods.name}
                          </span>
                        )}
                      </div>

                      {/* Vibe tags */}
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {deal.vibe_tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-[8px] py-0 px-1.5"
                          >
                            {tag.replace(/_/g, " ")}
                          </Badge>
                        ))}
                        {deal.dmv_neighborhoods?.metro_access && (
                          <Badge variant="teal" className="text-[8px] py-0 px-1.5">
                            <Train className="mr-0.5 size-2.5" /> Metro
                          </Badge>
                        )}
                        {deal.is_verified && (
                          <Badge variant="gold" className="text-[8px] py-0 px-1.5">
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                </Reveal>
              );
            })}

            {filtered.length === 0 && !isLoading && (
              <li className="rounded-2xl border-2 border-dashed border-cream/10 bg-cream/[0.03] p-6 text-center">
                <span className="font-mono text-[10px] uppercase tracking-widest text-cream/30">
                  {hasActiveFilters ? "No deals match your filters" : "No happy hour deals yet"}
                </span>
              </li>
            )}
          </ul>
        )}
      </div>

      {/* ── Deal Detail Sheet ─────────────────────────── */}
      <HappyHourDealSheet
        deal={selectedDeal}
        onClose={() => setSelectedDeal(null)}
      />
    </div>
  );
}
