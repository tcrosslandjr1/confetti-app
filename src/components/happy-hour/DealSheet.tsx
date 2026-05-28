// Confetti — Happy Hour Deal Detail Sheet
//
// Full-screen drawer showing deal details when a deal card is tapped.
// Displays venue info, drink/food specials, vibe tags, metro info,
// savings estimate, and a "Start Crawl" CTA.

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  X,
  Clock,
  MapPin,
  Train,
  Wine,
  Beer,
  Utensils,
  Users,
  Volume2,
  DollarSign,
  TrendingUp,
  ChevronRight,
  Armchair,
  Star,
  AlertCircle,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────

type DrinkSpecial = { name: string; price: string; type?: string };
type FoodSpecial = { name: string; price: string; type?: string };

export type DealData = {
  id: string;
  venue_id: string;
  deal_name: string;
  deal_summary: string;
  drink_specials: DrinkSpecial[];
  food_specials: FoodSpecial[];
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

type HappyHourDealSheetProps = {
  deal: DealData | null;
  onClose: () => void;
};

// ── Helpers ──────────────────────────────────────────────────────

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return m === 0 ? `${h12}${ampm}` : `${h12}:${String(m).padStart(2, "0")}${ampm}`;
}

function isActiveNow(deal: DealData): boolean {
  const now = new Date();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = dayNames[now.getDay()];
  if (!deal.days_active.includes(today)) return false;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const [sH, sM] = deal.start_time.split(":").map(Number);
  const [eH, eM] = deal.end_time.split(":").map(Number);
  return nowMin >= sH * 60 + sM && nowMin <= eH * 60 + eM;
}

function levelIndicator(level: number | null, max = 5): string {
  if (level == null) return "—";
  const filled = Math.min(Math.round(level), max);
  return "●".repeat(filled) + "○".repeat(max - filled);
}

// ── Component ───────────────────────────────────────────────────

export function HappyHourDealSheet({ deal, onClose }: HappyHourDealSheetProps) {
  if (!deal) return null;

  const active = isActiveNow(deal);
  const venue = deal.venues;
  const hood = deal.dmv_neighborhoods;

  return (
    <Drawer open={!!deal} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[92vh] border-cream/10 bg-mocha text-cream">
        {/* Scrollable body */}
        <div className="overflow-y-auto overscroll-contain px-5 pb-8">
          {/* ── Header with close ─────────────────────── */}
          <DrawerHeader className="relative px-0 pt-4 pb-0 text-left">
            <DrawerClose asChild>
              <button
                className="absolute -top-1 right-0 grid size-8 place-items-center rounded-full bg-cream/10 text-cream/60 transition-colors hover:bg-cream/15 hover:text-cream"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </DrawerClose>

            {/* Active badge */}
            {active && (
              <div className="mb-2 flex items-center gap-1.5">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-coral opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-coral" />
                </span>
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-coral">
                  Live Now
                </span>
              </div>
            )}

            <DrawerTitle className="pr-10 font-display text-[22px] font-extrabold tracking-tight text-cream leading-tight">
              {venue?.name ?? "Unknown Venue"}
            </DrawerTitle>
            <DrawerDescription className="mt-1 font-mono text-[11px] uppercase tracking-wide text-cream/50">
              {deal.deal_name}
            </DrawerDescription>
          </DrawerHeader>

          {/* ── Hero image ────────────────────────────── */}
          {venue?.photo_url && (
            <div className="mt-4 overflow-hidden rounded-2xl">
              <img
                src={venue.photo_url}
                alt={venue.name}
                className="h-44 w-full object-cover"
              />
            </div>
          )}

          {/* ── Quick stats row ───────────────────────── */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {/* Time */}
            <div className="flex flex-col items-center gap-1 rounded-xl border border-cream/10 bg-cream/5 p-2.5">
              <Clock className="size-4 text-cream/40" />
              <span className="font-mono text-[10px] font-bold text-cream/80">
                {formatTime(deal.start_time)}–{formatTime(deal.end_time)}
              </span>
              <span className="font-mono text-[8px] uppercase tracking-widest text-cream/30">
                {deal.days_active.join(" · ")}
              </span>
            </div>

            {/* Savings */}
            <div className="flex flex-col items-center gap-1 rounded-xl border border-cream/10 bg-cream/5 p-2.5">
              <TrendingUp className="size-4 text-coral/80" />
              <span className="font-mono text-[10px] font-bold text-coral">
                {deal.avg_savings_pct ? `${deal.avg_savings_pct}% off` : "—"}
              </span>
              <span className="font-mono text-[8px] uppercase tracking-widest text-cream/30">
                Avg savings
              </span>
            </div>

            {/* 2-person est */}
            <div className="flex flex-col items-center gap-1 rounded-xl border border-cream/10 bg-cream/5 p-2.5">
              <DollarSign className="size-4 text-cream/40" />
              <span className="font-mono text-[10px] font-bold text-cream/80">
                {deal.two_person_est ? `$${deal.two_person_est}` : "—"}
              </span>
              <span className="font-mono text-[8px] uppercase tracking-widest text-cream/30">
                For two
              </span>
            </div>
          </div>

          {/* ── Deal summary ──────────────────────────── */}
          <div className="mt-5">
            <p className="text-[13px] leading-relaxed text-cream/70">
              {deal.deal_summary}
            </p>
          </div>

          {/* ── Drink Specials ────────────────────────── */}
          {deal.drink_specials?.length > 0 && (
            <section className="mt-5">
              <h3 className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-cream/40">
                <Wine className="size-3.5" /> Drink Specials
              </h3>
              <ul className="mt-2 space-y-1.5">
                {deal.drink_specials.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-cream/8 bg-cream/[0.03] px-3 py-2"
                  >
                    <span className="text-[13px] text-cream/80">{s.name}</span>
                    <span className="font-mono text-[12px] font-bold text-coral">
                      {s.price}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ── Food Specials ─────────────────────────── */}
          {deal.food_specials?.length > 0 && (
            <section className="mt-5">
              <h3 className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-cream/40">
                <Utensils className="size-3.5" /> Food Specials
              </h3>
              <ul className="mt-2 space-y-1.5">
                {deal.food_specials.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-cream/8 bg-cream/[0.03] px-3 py-2"
                  >
                    <span className="text-[13px] text-cream/80">{s.name}</span>
                    <span className="font-mono text-[12px] font-bold text-coral">
                      {s.price}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ── Vibe & Atmosphere ─────────────────────── */}
          <section className="mt-5">
            <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-cream/40">
              Vibe & Atmosphere
            </h3>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {deal.vibe_tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-[9px]">
                  {tag.replace(/_/g, " ")}
                </Badge>
              ))}
              {deal.is_verified && (
                <Badge variant="gold" className="text-[9px]">
                  <Star className="mr-0.5 size-2.5" /> Verified
                </Badge>
              )}
            </div>

            {/* Levels */}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <Users className="size-3.5 text-cream/30" />
                <span className="font-mono text-[10px] text-cream/50">Crowd</span>
                <span className="ml-auto font-mono text-[10px] tracking-widest text-cream/60">
                  {levelIndicator(deal.crowd_level)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Volume2 className="size-3.5 text-cream/30" />
                <span className="font-mono text-[10px] text-cream/50">Noise</span>
                <span className="ml-auto font-mono text-[10px] tracking-widest text-cream/60">
                  {levelIndicator(deal.noise_level)}
                </span>
              </div>
            </div>

            {/* Seating */}
            {deal.seating_type?.length > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <Armchair className="size-3.5 text-cream/30" />
                <span className="font-mono text-[10px] text-cream/50">Seating</span>
                <span className="ml-2 font-mono text-[10px] text-cream/60">
                  {deal.seating_type.join(", ")}
                </span>
              </div>
            )}

            {/* Best for */}
            {deal.best_for?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {deal.best_for.map((b) => (
                  <Badge key={b} variant="secondary" className="text-[8px]">
                    {b}
                  </Badge>
                ))}
              </div>
            )}
          </section>

          {/* ── Location & Metro ──────────────────────── */}
          <section className="mt-5">
            <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-cream/40">
              Location
            </h3>
            <div className="mt-2 rounded-xl border border-cream/10 bg-cream/5 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-cream/40" />
                <span className="text-[13px] text-cream/80">
                  {hood?.name ?? venue?.neighborhood ?? "—"}
                  {hood ? ` · ${hood.metro_area}` : ""}
                </span>
              </div>
              {hood?.metro_access && hood.metro_lines?.length > 0 && (
                <div className="flex items-center gap-2">
                  <Train className="size-4 text-teal-400" />
                  <span className="text-[13px] text-cream/80">
                    {hood.metro_lines.join(", ")} Line{hood.metro_lines.length > 1 ? "s" : ""}
                  </span>
                  <Badge variant="teal" className="ml-auto text-[8px]">
                    Metro Accessible
                  </Badge>
                </div>
              )}
            </div>
          </section>

          {/* ── Restrictions ──────────────────────────── */}
          {deal.restrictions && (
            <section className="mt-4">
              <div className="flex items-start gap-2 rounded-xl border border-cream/10 bg-cream/[0.03] p-3">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-cream/30" />
                <span className="font-mono text-[10px] leading-relaxed text-cream/40">
                  {deal.restrictions}
                </span>
              </div>
            </section>
          )}

          {/* ── CTA ──────────────────────────────────── */}
          <div className="mt-6">
            <button
              onClick={onClose}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-coral px-6 py-4 font-display text-[15px] font-bold text-cream shadow-lg transition-all active:scale-[0.97] hover:bg-coral/90"
            >
              Add to Tonight's Crawl
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
