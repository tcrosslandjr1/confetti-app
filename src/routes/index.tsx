import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useMemo, useState, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getPartnerStats } from "@/lib/partner-stats.functions";
import { ArrowUpRight, Sparkles, Star, MapPin, Clock, Car, Zap, Users, Globe } from "lucide-react";
import { CityPickerTrigger } from "@/components/CitySearch";
import { SiteHeader } from "@/components/SiteHeader";
import { RecapBanner } from "@/components/RecapBanner";
import { TasteConfirmPrompt } from "@/components/TasteConfirmPrompt";
import { TypingCounter } from "@/components/TypingCounter";
import { OCCASIONS } from "@/lib/occasions";
import { getIdeaCount, prefetchIdeas } from "@/lib/unified-ideas";
import { Reveal } from "@/components/Reveal";
import { WizardButton } from "@/components/wizard/WizardButton";
import { QuickPicks } from "@/components/QuickPicks";
import { GatedAction } from "@/components/GatedAction";
import { logAdViewImpression, logAdClick } from "@/lib/ad-tracking";
import { withUtm } from "@/lib/utm";
import { isAdDebugEnabled, recordAdDebug } from "@/lib/ad-debug";
import { useViewportImpression } from "@/hooks/useViewportImpression";
import { getAdImpressionConfig } from "@/lib/ad-impression-config";
import type { TapToGoStop } from "@/components/TapToGoBookingModal";
import { usePageview, useScrollDepth, useTimeToInteraction, trackCta } from "@/lib/analytics";

// Below-the-fold / on-demand chunks — keep the initial bundle small so the hero paints fast.
const StepsShowcase = lazy(() =>
  import("@/components/StepsShowcase").then((m) => ({ default: m.StepsShowcase })),
);
const SiteFooter = lazy(() =>
  import("@/components/SiteFooter").then((m) => ({ default: m.SiteFooter })),
);
const AdDebugPanel = lazy(() =>
  import("@/components/AdDebugPanel").then((m) => ({ default: m.AdDebugPanel })),
);
const PartnerTestimonials = lazy(() =>
  import("@/components/PartnerTestimonials").then((m) => ({ default: m.PartnerTestimonials })),
);
import { TapToGoBookingModal } from "@/components/TapToGoBookingModal";

const SAMPLE_ITINERARY_STOPS: TapToGoStop[] = [
  {
    id: "dauphines",
    time: "6:30p",
    title: "Dauphine's",
    type: "Small plates · 14th Street",
    source: "RESY",
    cost: "~$42/pp",
    emoji: "🍽️",
  },
  {
    id: "decades",
    time: "8:15p",
    title: "Decades DC",
    type: "Vinyl + nat wine · U Street",
    source: "WALK-IN",
    cost: "~$24/pp",
    emoji: "🎧",
  },
  {
    id: "gibson",
    time: "9:30p",
    title: "The Gibson",
    type: "Speakeasy · U Street Corridor",
    source: "OPENTABLE",
    cost: "~$30/pp",
    emoji: "🍸",
  },
  {
    id: "perrys",
    time: "11:00p",
    title: "Perry's Rooftop",
    type: "Nightcap · Adams Morgan",
    source: "RESY",
    cost: "~$24/pp",
    emoji: "🌃",
  },
];

const SAMPLE_ITINERARY_SUMMARY = {
  stops: "4 venues",
  totalTime: "6 hours",
  walking: "0.8 mi · ~18 min",
  lyft: "1 ride · ~$14",
  estTotal: "~$112/pp",
  reward: "+120 Confetti",
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Confetti — Plans with a pulse." },
      {
        name: "description",
        content:
          "Plan a night. Or a day. Or whatever. Confetti is the AI concierge that turns vibes into full itineraries with real venues, routes, and reservations.",
      },
      { property: "og:title", content: "Confetti — Plans with a pulse." },
      { property: "og:description", content: "From vibe to door-to-door plan in under a minute." },
    ],
  }),
  component: Landing,
});

type MarqueeItem = {
  text: string;
  sponsored?: { brand: string; cta: string; href: string };
};

const MARQUEE: MarqueeItem[] = [
  { text: "date night → dinner + drinks" },
  { text: "girls trip → brunch + boutiques" },
  { text: "Sunday slow → coffee + a long walk" },
  { text: "in-laws weekend → easy wins, no awkward" },
  {
    text: "kids day-out → museum + ice cream",
    sponsored: {
      brand: "MoMA Kids",
      cta: "Book tickets",
      href: "/wizard?occasion=kids-day-out&utm_source=marquee&utm_campaign=moma_kids",
    },
  },
  {
    text: "rooftop o'clock → sunset + spritz",
    sponsored: {
      brand: "Aperol",
      cta: "Find a rooftop",
      href: "/wizard?occasion=rooftop&utm_source=marquee&utm_campaign=aperol_spritz",
    },
  },
  { text: "noodle crawl → 3 bowls, 1 night" },
  { text: "first date energy → low-key, high spark" },
  { text: "anniversary → the spot you'll remember" },
  { text: "guys' afternoon → wings + a game" },
  { text: "birthday night → dinner, drinks, dance floor" },
  {
    text: "bachelorette → glam + late-night karaoke",
    sponsored: {
      brand: "Resy",
      cta: "Reserve the table",
      href: "/wizard?occasion=bachelorette&utm_source=marquee&utm_campaign=resy",
    },
  },
  { text: "proposal night → quiet view, big yes" },
  { text: "solo recharge → bookshop + a great meal" },
  { text: "double date → shared plates + a show" },
  { text: "rainy day → cozy cafés + a matinée" },
  { text: "happy hour → 2 stops, 1 hour" },
  {
    text: "live music → small venue, big night",
    sponsored: {
      brand: "DICE",
      cta: "Grab tickets",
      href: "/wizard?occasion=live-music&utm_source=marquee&utm_campaign=dice",
    },
  },
  { text: "art crawl → galleries + a wine bar" },
  { text: "morning hike → trail + breakfast burritos" },
  { text: "beach day → towels, tacos, sunset" },
  { text: "speakeasy night → low-lit, slow burn" },
  {
    text: "tasting menu → all-in, no menu peeking",
    sponsored: {
      brand: "OpenTable",
      cta: "Book tonight",
      href: "/wizard?occasion=tasting-menu&utm_source=marquee&utm_campaign=opentable",
    },
  },
  { text: "dog-friendly day → patio + park loop" },
  { text: "out-of-towner → the 4-hour highlight reel" },
];

const PROOF = [
  {
    quote:
      "It planned a Friday night that ended in a dive bar I'd driven past 100 times. New favorite.",
    name: "Mara K.",
    role: "Brooklyn",
    rating: 5,
    avatarBg: "bg-coral",
    initials: "MK",
  },
  {
    quote: "Killed our 47-message group chat dead. Sent everyone the trip link, voted, done.",
    name: "Devin R.",
    role: "Atlanta",
    rating: 5,
    avatarBg: "bg-purple",
    initials: "DR",
  },
  {
    quote: "I'm the planner friend. This is the first thing that out-planned me.",
    name: "Priya S.",
    role: "Chicago",
    rating: 4,
    avatarBg: "bg-gold",
    initials: "PS",
  },
];

// Vibe chips for the hero mood discovery section
const VIBE_CHIPS = [
  { label: "Date night", slug: "date-night", emoji: "🌹" },
  { label: "Rooftop vibes", slug: "rooftop", emoji: "🌇" },
  { label: "Dive bars", slug: "dive-bar-crawl", emoji: "🍻" },
  { label: "Girls night", slug: "girls-night", emoji: "💃" },
  { label: "Chill & cozy", slug: "cozy", emoji: "☕" },
  { label: "Birthday", slug: "birthday", emoji: "🎂" },
  { label: "Foodie crawl", slug: "foodie", emoji: "🍜" },
  { label: "Live music", slug: "live-music", emoji: "🎵" },
  { label: "Speakeasy", slug: "speakeasy", emoji: "🥃" },
  { label: "Brunch", slug: "brunch", emoji: "🥂" },
];


function Landing() {
  usePageview("landing", "/");
  useScrollDepth("/");
  useTimeToInteraction("/");

  const [bookingOpen, setBookingOpen] = useState(false);

  // Live partner stats for the "For businesses" CTA section.
  const fetchPartnerStats = useServerFn(getPartnerStats);
  const { data: partnerStats } = useQuery({
    queryKey: ["partner-stats-30d"],
    queryFn: () => fetchPartnerStats(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Show the bottom sticky CTA once the hero is offscreen so the primary action
  // is always one tap away while scrolling the long landing page.
  const [showStickyCta, setShowStickyCta] = useState(false);
  useEffect(() => {
    function onScroll() {
      setShowStickyCta(window.scrollY > 600);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Warm the AI idea cache for all occasions on mount
  useEffect(() => {
    prefetchIdeas(OCCASIONS.map((o) => o.slug));
  }, []);

  // Subtle hero parallax
  const heroBgRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = heroBgRef.current;
    if (!el) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      el.style.transform = "none";
      return;
    }
    let raf = 0;
    function update() {
      const y = window.scrollY;
      if (el) el.style.transform = `translate3d(0, ${y * 0.18}px, 0)`;
      raf = 0;
    }
    function onScroll() {
      if (!raf) raf = requestAnimationFrame(update);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    const onMqChange = () => {
      if (mq.matches) {
        window.removeEventListener("scroll", onScroll);
        if (raf) cancelAnimationFrame(raf);
        if (el) el.style.transform = "none";
      }
    };
    mq.addEventListener("change", onMqChange);
    return () => {
      window.removeEventListener("scroll", onScroll);
      mq.removeEventListener("change", onMqChange);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Load admin-managed sponsored marquee items.
  type DbSponsorship = {
    id: string;
    brand: string;
    occasion: string;
    cta_label: string;
    cta_url: string;
    surface: "top" | "bottom" | "both";
    position: number;
  };
  const [dbSponsors, setDbSponsors] = useState<DbSponsorship[]>([]);
  useEffect(() => {
    let cancelled = false;
    supabase
      .from("marquee_sponsorships")
      .select("id,brand,occasion,cta_label,cta_url,surface,position")
      .order("position", { ascending: true })
      .then(({ data }) => {
        if (!cancelled && data) setDbSponsors(data as DbSponsorship[]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Build per-surface marquee lists by inserting DB sponsors into the static list.
  const { topItems, bottomItems } = useMemo(() => {
    function inject(surface: "top" | "bottom") {
      const items: MarqueeItem[] = [...MARQUEE];
      const insertable = dbSponsors.filter((s) => s.surface === surface || s.surface === "both");
      insertable.forEach((s, idx) => {
        const pos = Math.min(items.length, Math.max(0, s.position || (idx + 1) * 3));
        items.splice(pos, 0, {
          text: s.occasion,
          sponsored: { brand: s.brand, cta: s.cta_label, href: s.cta_url },
        });
      });
      return items;
    }
    return { topItems: inject("top"), bottomItems: inject("bottom") };
  }, [dbSponsors]);

  return (
    <div className="min-h-screen bg-mocha text-cream">
      <SiteHeader />
      <RecapBanner />
      <TasteConfirmPrompt />

      {/* ============================ HERO ============================ */}
      <section className="relative overflow-hidden">
        <div ref={heroBgRef} className="absolute inset-0 -z-20 will-change-transform">
          {/* Dark mocha ambient glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-mocha-dark via-mocha to-mocha-light" />
          <div className="absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-coral/10 blur-[120px]" />
          <div
            className="absolute -bottom-40 -left-32 h-[400px] w-[400px] rounded-full bg-purple/10 blur-[100px]"
          />
          <div className="absolute right-1/4 top-1/3 h-64 w-64 rounded-full bg-gold/5 blur-[80px]" />
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 lg:px-8 lg:pb-32 lg:pt-24">
          {/* Stats bar */}
          <div className="mb-10 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-chip border border-cream/20 bg-cream/5 px-4 py-2 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-teal animate-pulse" />
              <TypingCounter target={2847} suffix=" plans built today" className="text-sm font-medium text-cream/90" />
            </span>
            <span className="hidden sm:inline-flex items-center gap-2 rounded-chip border border-cream/20 bg-cream/5 px-4 py-2 backdrop-blur-sm text-sm text-cream/70">
              <Globe className="h-3.5 w-3.5" /> 48 cities
            </span>
            <span className="hidden sm:inline-flex items-center gap-2 rounded-chip border border-cream/20 bg-cream/5 px-4 py-2 backdrop-blur-sm text-sm text-cream/70">
              <Users className="h-3.5 w-3.5" /> 12k+ planners
            </span>
          </div>

          {/* Main hero content */}
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left — headline + vibe chips */}
            <div className="lg:col-span-7">
              <h1 className="font-display text-[11vw] font-extrabold leading-[0.92] tracking-[-0.03em] sm:text-[64px] lg:text-[88px]">
                Plan a night.
                <br />
                <span className="text-cream/60">Or a day.</span>
                <br />
                <span className="font-serif italic font-normal text-coral">Or whatever.</span>
              </h1>

              <p className="mt-6 max-w-lg text-lg leading-relaxed text-cream/80">
                Tell us the vibe — we'll pick the venues, book the table, map the route between stops,
                and hand you a tap-to-go boarding pass.{" "}
                <span className="text-cream font-medium">Free, no signup to try.</span>
              </p>

              {/* Vibe chip bar */}
              <div className="mt-8">
                <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-cream/50">
                  Pick a vibe to start
                </p>
                <div className="flex flex-wrap gap-2">
                  {VIBE_CHIPS.map((chip) => (
                    <Link
                      key={chip.slug}
                      to="/app/plan"
                      search={{ vibe: chip.slug }}
                      onClick={() => trackCta("vibe_chip", { vibe: chip.slug, location: "hero" })}
                      className="group inline-flex items-center gap-2 rounded-chip border border-cream/20 bg-cream/5 px-4 py-2.5 text-sm font-medium text-cream/90 backdrop-blur-sm transition-all hover:border-coral/50 hover:bg-coral/10 hover:text-cream hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/50"
                    >
                      <span className="text-base">{chip.emoji}</span>
                      {chip.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Primary CTAs */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <span onClick={() => trackCta("plan_something_hero", { location: "hero_primary" })}>
                  <WizardButton
                    ariaLabel="Plan something"
                    className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-chip bg-coral px-8 text-base font-bold text-cream shadow-lg shadow-coral/25 transition-all hover:bg-coral/90 hover:shadow-xl hover:shadow-coral/30 hover:-translate-y-0.5 sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/50 focus-visible:ring-offset-2 focus-visible:ring-offset-mocha"
                  >
                    Plan something <ArrowUpRight className="h-5 w-5" />
                  </WizardButton>
                </span>
                <Link
                  to="/auth"
                  onClick={() => trackCta("sign_in_hero", { location: "hero_secondary" })}
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-chip border border-cream/30 px-6 text-sm font-medium text-cream/80 transition-all hover:border-cream/50 hover:text-cream hover:bg-cream/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/30"
                >
                  Sign in
                </Link>
                <CityPickerTrigger />
              </div>
            </div>

            {/* Right — boarding pass hero card */}
            <div className="relative lg:col-span-5">
              <div className="relative mx-auto max-w-sm">
                {/* Glow behind card */}
                <div className="absolute -inset-6 rounded-[32px] bg-gradient-to-br from-coral/20 via-purple/10 to-gold/15 blur-2xl" />

                <div className="relative rounded-card border border-cream/15 bg-mocha-light/80 p-6 backdrop-blur-xl shadow-2xl">
                  {/* Boarding pass header */}
                  <div className="flex items-center justify-between border-b border-dashed border-cream/20 pb-4">
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-cream/50">
                        Boarding Pass
                      </span>
                      <div className="mt-1 font-display text-sm font-bold text-cream">
                        SAT · 6:00p → 12:30a
                      </div>
                    </div>
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-coral/20 text-coral">
                      <Sparkles className="h-5 w-5" />
                    </div>
                  </div>

                  {/* Vibe quote */}
                  <h3 className="mt-4 font-serif text-xl italic leading-tight text-cream/90">
                    "cute, walkable, ends with a slow drink"
                  </h3>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-cream/40">
                    14th St → U Street → Adams Morgan
                  </p>

                  {/* Stops */}
                  <div className="mt-5 space-y-2.5">
                    {[
                      { t: "6:30", title: "Dauphine's", chip: "RESY", color: "bg-coral" },
                      { t: "8:15", title: "Decades DC", chip: "WALK-IN", color: "bg-purple" },
                      { t: "10:00", title: "Perry's Rooftop", chip: "RESY", color: "bg-gold" },
                    ].map((s) => (
                      <div
                        key={s.t}
                        className="flex items-center gap-3 rounded-xl border border-cream/10 bg-cream/5 p-3"
                      >
                        <div
                          className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${s.color} font-mono text-xs font-bold text-mocha-dark`}
                        >
                          {s.t}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-cream">{s.title}</div>
                        </div>
                        <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-cream/50">
                          {s.chip}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Summary */}
                  <div className="mt-4 flex items-center justify-between border-t border-dashed border-cream/20 pt-3">
                    <span className="font-mono text-[11px] uppercase tracking-widest text-cream/50">
                      3 stops · 4h · ~$92
                    </span>
                    <span className="rounded-chip bg-teal/20 px-2.5 py-1 font-mono text-[10px] font-bold text-teal">
                      booked ✓
                    </span>
                  </div>

                  {/* CTA */}
                  <WizardButton
                    ariaLabel="Try this plan"
                    preset={{
                      title: "cute, walkable, ends with a slow drink",
                      vibeKeys: ["bougie", "speakeasy"],
                      vibeLabel: "cute, walkable, ends with a slow drink",
                    }}
                    className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-chip bg-cream/10 border border-cream/20 text-sm font-semibold text-cream transition-all hover:bg-cream/15 hover:border-cream/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/30"
                  >
                    Try this plan <ArrowUpRight className="h-4 w-4" />
                  </WizardButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================ MARQUEE ============================ */}
      <section className="border-y border-cream/10 bg-mocha-dark py-4">
        <div className="flex overflow-hidden">
          <div className="flex shrink-0 animate-marquee items-center gap-10 whitespace-nowrap pr-10 font-display text-2xl font-extrabold uppercase tracking-tight text-cream/70">
            {[...topItems, ...topItems].map((m, i) => {
              const tone =
                i % 3 === 1
                  ? "font-serif italic font-normal text-gold"
                  : i % 3 === 2
                    ? "text-coral"
                    : "";
              if (m.sponsored) {
                return (
                  <SponsoredMarqueeSlot
                    key={i}
                    slot={`top-${i}`}
                    surface="marquee_top"
                    text={m.text}
                    sponsored={m.sponsored}
                    tone={tone}
                    variant="hero"
                  />
                );
              }
              return (
                <span key={i} className={tone}>
                  {m.text} ✦
                </span>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================ HOW IT WORKS ============================ */}
      <section aria-labelledby="how-it-works-heading" className="bg-mocha">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-10">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-cream/40">
              / how it works
            </span>
            <h2
              id="how-it-works-heading"
              className="mt-3 font-display text-4xl font-extrabold leading-tight sm:text-5xl"
            >
              Three steps.{" "}
              <span className="font-serif italic font-normal text-coral">Zero spirals.</span>
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                n: "1",
                emoji: "🎯",
                title: "Choose your vibe",
                body: "Rooftop, dive bar, date night, brunch crawl. Plain English works.",
                accent: "border-coral/30 hover:border-coral/60",
              },
              {
                n: "2",
                emoji: "📍",
                title: "Pick your venues",
                body: "Swipe through real spots open tonight. Keep what you love, swap the rest.",
                accent: "border-gold/30 hover:border-gold/60",
              },
              {
                n: "3",
                emoji: "🛣️",
                title: "Get your route",
                body: "Timed stops with walking + Lyft directions stitched between them.",
                accent: "border-purple/30 hover:border-purple/60",
              },
              {
                n: "4",
                emoji: "🎟️",
                title: "Tap-to-go booking",
                body: "Resy, OpenTable, Eventbrite, rideshare — one tap, straight to checkout.",
                accent: "border-teal/30 hover:border-teal/60",
              },
            ].map((s) => (
              <div
                key={s.n}
                className={`relative rounded-card border ${s.accent} bg-cream/5 p-6 backdrop-blur-sm transition-all hover:bg-cream/[0.07]`}
              >
                <span className="absolute -top-3 left-5 grid h-7 w-7 place-items-center rounded-full bg-mocha border border-cream/30 font-mono text-xs font-bold text-cream">
                  {s.n}
                </span>
                <div className="text-3xl">{s.emoji}</div>
                <div className="mt-4 font-display text-lg font-bold text-cream">{s.title}</div>
                <p className="mt-2 text-sm leading-relaxed text-cream/60">{s.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-center sm:hidden">
            <WizardButton
              ariaLabel="Plan my night"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-chip bg-coral px-7 text-sm font-bold text-cream shadow-lg shadow-coral/20 transition-all hover:shadow-xl hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/50"
            >
              Start planning <ArrowUpRight className="h-4 w-4" />
            </WizardButton>
          </div>
        </div>
      </section>

      {/* ============================ SAMPLE ITINERARY ============================ */}
      <section
        id="sample-itinerary"
        aria-labelledby="sample-itinerary-heading"
        className="border-t border-cream/10 bg-mocha-dark"
      >
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-10">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-cream/40">
              / a real Saturday in Washington, DC
            </span>
            <h2
              id="sample-itinerary-heading"
              className="mt-3 font-display text-4xl font-extrabold leading-tight sm:text-5xl"
            >
              A sample night,{" "}
              <span className="font-serif italic font-normal text-coral">start to finish.</span>
            </h2>
            <p className="mt-4 max-w-xl text-base text-cream/60">
              This is exactly what Confetti hands you — timed stops, real venues, walking + Lyft
              routes, and one-tap booking links.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-12">
            {/* TIMELINE */}
            <ol className="relative lg:col-span-8">
              <span
                aria-hidden
                className="absolute left-[27px] top-3 bottom-3 w-px bg-cream/15 sm:left-[31px]"
              />
              {(
                [
                  {
                    t: "6:30p",
                    title: "Dauphine's",
                    type: "Small plates · 14th Street",
                    desc: "Start with shared plates and craft cocktails on the patio. Reservation held for 90 min.",
                    chip: "RESY",
                    chipBg: "bg-coral",
                    emoji: "🍽️",
                    cost: "~$42/pp",
                  },
                  { leg: "8 min walk · 0.4 mi · down U Street", legIcon: "🚶" },
                  {
                    t: "8:15p",
                    title: "Decades DC",
                    type: "Vinyl + nat wine · U Street",
                    desc: "Walk-in friendly. DJ set starts 8:30. Two glasses, then move on.",
                    chip: "WALK-IN",
                    chipBg: "bg-purple",
                    emoji: "🎧",
                    cost: "~$24/pp",
                  },
                  { leg: "7 min Lyft · ~$12 · pre-booked", legIcon: "🚗" },
                  {
                    t: "9:30p",
                    title: "The Gibson",
                    type: "Speakeasy · U Street Corridor",
                    desc: "Ring the bell. Reserved bar seats. Order the house Old Fashioned — legendary.",
                    chip: "OPENTABLE",
                    chipBg: "bg-gold",
                    emoji: "🍸",
                    cost: "~$30/pp",
                  },
                  { leg: "6 min walk · 0.3 mi · toward Adams Morgan", legIcon: "🚶" },
                  {
                    t: "11:00p",
                    title: "Perry's Rooftop",
                    type: "Nightcap · Adams Morgan",
                    desc: "Skyline view, slow drink to close the night. Last call 12:30.",
                    chip: "RESY",
                    chipBg: "bg-coral",
                    emoji: "🌃",
                    cost: "~$24/pp",
                  },
                ] as Array<any>
              ).map((row, i) =>
                row.leg ? (
                  <li
                    key={`leg-${i}`}
                    className="relative ml-12 flex items-center gap-2 py-2 pl-2 text-xs text-cream/40 sm:ml-14"
                  >
                    <span aria-hidden className="text-base">
                      {row.legIcon}
                    </span>
                    <span className="font-mono uppercase tracking-widest">{row.leg}</span>
                  </li>
                ) : (
                  <li key={`stop-${i}`} className="relative pl-12 sm:pl-14 pb-3">
                    <div
                      className={`absolute left-0 top-1 grid h-14 w-14 place-items-center rounded-full ${row.chipBg} font-mono text-[11px] font-extrabold text-mocha-dark shadow-lg`}
                    >
                      {row.t}
                    </div>
                    <div className="rounded-card border border-cream/10 bg-cream/5 p-4 backdrop-blur-sm">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span aria-hidden className="text-xl">
                              {row.emoji}
                            </span>
                            <h3 className="font-display text-lg font-bold text-cream">
                              {row.title}
                            </h3>
                          </div>
                          <div className="mt-0.5 text-xs text-cream/50">{row.type}</div>
                        </div>
                        <span
                          className={`shrink-0 rounded-chip px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest ${row.chipBg} text-mocha-dark`}
                        >
                          {row.chip}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-cream/60">{row.desc}</p>
                      <div className="mt-2 font-mono text-[11px] uppercase tracking-widest text-cream/40">
                        {row.cost}
                      </div>
                    </div>
                  </li>
                ),
              )}
            </ol>

            {/* SUMMARY CARD */}
            <aside className="lg:col-span-4">
              <div className="sticky top-24 rounded-card border border-cream/15 bg-cream/5 p-6 backdrop-blur-sm">
                <div className="border-b border-dashed border-cream/15 pb-3 font-mono text-[11px] uppercase tracking-widest text-cream/50">
                  Route summary
                </div>
                <dl className="mt-4 space-y-3 text-sm">
                  {[
                    ["Stops", "4 venues"],
                    ["Total time", "6 hours"],
                    ["Walking", "0.8 mi · ~18 min"],
                    ["Lyft", "1 ride · ~$14"],
                    ["Bookings", "3 reservations"],
                    ["Est. total", "~$112/pp"],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      className="flex items-baseline justify-between gap-3 border-b border-dashed border-cream/10 pb-2 last:border-0"
                    >
                      <dt className="font-mono text-[11px] uppercase tracking-widest text-cream/40">
                        {k}
                      </dt>
                      <dd className="font-display text-base font-bold text-cream">{v}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-5 rounded-xl border border-teal/20 bg-teal/5 p-3 text-xs leading-snug">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-teal/70">
                    Earned
                  </div>
                  <div className="mt-1 font-display text-base font-extrabold text-teal">+120 Confetti</div>
                  <div className="text-cream/50">Auto-credited after the last booking.</div>
                </div>

                <button
                  type="button"
                  onClick={() => setBookingOpen(true)}
                  className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-chip bg-coral px-5 text-sm font-bold text-cream shadow-lg shadow-coral/20 transition-all hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/50"
                >
                  Tap to go — book this plan <ArrowUpRight className="h-4 w-4" />
                </button>
                <WizardButton
                  ariaLabel="Build my own night"
                  className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-chip border border-cream/20 bg-cream/5 px-5 text-xs font-semibold text-cream transition-all hover:bg-cream/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/30"
                >
                  Or build my own night
                </WizardButton>
                <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-widest text-cream/40">
                  Free · no signup to try
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ============================ MANIFESTO ============================ */}
      <section className="border-t border-cream/10 bg-mocha">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-12 lg:px-8">
          <Reveal className="lg:col-span-5">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-cream/40">
              / the manifesto
            </span>
            <h2 className="mt-3 font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl text-cream">
              We are <span className="font-serif italic font-normal text-coral">tired</span> of the group chat.
            </h2>
          </Reveal>
          <Reveal className="space-y-6 text-lg leading-relaxed text-cream/70 lg:col-span-7" delay={120}>
            <p>
              You know the loop. Someone says "we should do something." Three days pass. Yelp gets
              opened, then closed. Someone screenshots a TikTok. Friday becomes pizza on the couch.{" "}
              <span className="font-serif italic text-cream">Again.</span>
            </p>
            <p>
              Confetti kills that loop. One vibe in — one full evening out. Stops, times, routes,
              reservations, the dress code, the cost, the conversation starter. The whole damn
              night, in under a minute.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {[
                "less scrolling",
                "more showing up",
                "chef's-kiss timing",
                "real reservations",
                "made for the way you actually go out",
              ].map((t) => (
                <span
                  key={t}
                  className="rounded-chip border border-cream/20 bg-cream/5 px-3 py-1.5 text-sm font-medium text-cream/80 transition-all hover:bg-coral/10 hover:border-coral/30 hover:text-cream"
                >
                  {t}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================ STEPS SHOWCASE ============================ */}
      <section className="border-t border-cream/10 bg-mocha-dark">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <Suspense fallback={<div className="h-72" aria-hidden />}>
            <StepsShowcase />
          </Suspense>
        </div>
      </section>

      {/* ============================ OCCASIONS BENTO ============================ */}
      <section className="relative overflow-hidden border-t border-cream/10 bg-mocha">
        {/* Ambient washes */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-coral/8 blur-[100px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 bottom-10 h-96 w-96 rounded-full bg-gold/8 blur-[120px]"
        />

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-2 rounded-chip border border-cream/20 bg-cream/5 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-cream/70 backdrop-blur-sm">
                <Sparkles className="h-3 w-3 text-coral" /> pick a vibe
              </span>
              <h2 className="mt-4 font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl text-cream">
                What's the{" "}
                <span className="font-serif italic font-normal text-coral">occasion?</span>
              </h2>
              <p className="mt-3 max-w-md text-sm text-cream/50">
                Tap any vibe — we generate a full night around it in seconds.
              </p>
            </div>
            <GatedAction
              to="/chat"
              feature="planning"
              className="inline-flex h-12 items-center gap-2 rounded-chip border border-cream/20 bg-cream/5 px-5 font-mono text-xs font-bold uppercase tracking-widest text-cream/80 backdrop-blur-sm transition-all hover:bg-cream/10 hover:border-cream/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/30"
            >
              skip — just plan something <ArrowUpRight className="h-4 w-4" />
            </GatedAction>
          </div>

          {/* Mobile snap rail */}
          <div className="mt-12 -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 sm:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {OCCASIONS.map((o) => {
              const Icon = o.icon;
              const ideaCount = getIdeaCount(o.slug);
              return (
                <Link
                  key={o.slug}
                  to="/app/explore"
                  params={{ slug: o.slug }}
                  className={`group relative flex h-48 w-[78%] shrink-0 snap-center flex-col justify-between overflow-hidden rounded-card border border-cream/15 bg-gradient-to-br ${o.gradient} p-5 text-cream shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/40`}
                >
                  <div className="flex items-start justify-between">
                    <Icon className="h-6 w-6 drop-shadow" />
                    <span className="text-4xl drop-shadow-md">{o.emoji}</span>
                  </div>
                  <div>
                    <div className="font-display text-2xl font-extrabold leading-tight drop-shadow">
                      {o.title}
                    </div>
                    <div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-cream/80">
                      {o.tagline}
                    </div>
                    {ideaCount > 0 && (
                      <span className="mt-2 inline-flex items-center gap-1 rounded-chip bg-mocha/50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest backdrop-blur">
                        {ideaCount} idea{ideaCount === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
          <p className="text-center font-mono text-[10px] uppercase tracking-widest text-cream/30 sm:hidden">
            ← swipe vibes →
          </p>

          {/* Desktop bento grid */}
          <div className="mt-12 hidden gap-3 sm:grid sm:grid-cols-4 lg:grid-cols-6 lg:auto-rows-[150px]">
            {OCCASIONS.map((o, i) => {
              const Icon = o.icon;
              const ideaCount = getIdeaCount(o.slug);
              const featured = i === 0 || i === 4 || i === 7;
              const wide = i === 2 || i === 9;
              const span = featured
                ? "lg:col-span-2 lg:row-span-2"
                : wide
                  ? "lg:col-span-2"
                  : "lg:col-span-1";
              const isPopular = i === 0;

              return (
                <Reveal key={o.slug} delay={i * 50} className={`${span} sm:col-span-2 lg:col-auto`}>
                  <Link
                    to="/app/explore"
                    params={{ slug: o.slug }}
                    className={`group relative flex h-full min-h-[150px] flex-col justify-between overflow-hidden rounded-card border border-cream/10 bg-gradient-to-br ${o.gradient} p-5 text-cream shadow-lg transition-all hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/40`}
                  >
                    {/* shimmer */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-cream/15 to-transparent transition-transform duration-[1100ms] ease-out group-hover:translate-x-full"
                    />

                    <div className="relative flex items-start justify-between">
                      <Icon className={`drop-shadow ${featured ? "h-7 w-7" : "h-5 w-5"}`} />
                      <span
                        className={`drop-shadow-md transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110 ${featured ? "text-6xl" : "text-3xl"}`}
                      >
                        {o.emoji}
                      </span>
                    </div>

                    {isPopular && (
                      <span className="absolute left-4 top-12 inline-flex items-center gap-1 rounded-chip border border-cream/20 bg-mocha/60 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-cream backdrop-blur">
                        <Sparkles className="h-2.5 w-2.5 text-gold" /> popular
                      </span>
                    )}

                    <div className="relative">
                      <div
                        className={`font-display font-extrabold leading-tight drop-shadow ${featured ? "text-3xl" : "text-xl"}`}
                      >
                        {o.title}
                      </div>
                      <div
                        className={`mt-1 font-mono uppercase tracking-wider text-cream/75 ${featured ? "text-xs" : "text-[10px]"}`}
                      >
                        {o.tagline}
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        {ideaCount > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-chip bg-mocha/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest backdrop-blur">
                            <Star className="h-2.5 w-2.5 text-gold" /> {ideaCount} idea
                            {ideaCount === 1 ? "" : "s"}
                          </span>
                        ) : (
                          <span />
                        )}
                        <ArrowUpRight className="h-4 w-4 -translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                      </div>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================ QUICK PICKS ============================ */}
      <QuickPicks />

      {/* ============================ FEATURE STRIP ============================ */}
      <section className="border-t border-cream/10 bg-mocha-dark">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {[
              {
                icon: Clock,
                k: "timing",
                t: "Down to the minute.",
                b: "Reservations, sunset, last call — Confetti backs into the schedule so you're never early or stranded.",
              },
              {
                icon: Car,
                k: "routing",
                t: "Door to door.",
                b: "Walk, drive, transit, Uber, Lyft — chosen per leg. One tap launches the right app.",
              },
              {
                icon: MapPin,
                k: "taste",
                t: "Knows your taste.",
                b: "A live taste profile that learns from chats, playlists, even pasted social posts. Skips the basics.",
              },
            ].map((f) => (
              <div key={f.k} className="rounded-card border border-cream/10 bg-cream/5 p-8 backdrop-blur-sm transition-all hover:border-cream/20 hover:bg-cream/[0.07]">
                <f.icon className="h-8 w-8 text-coral" />
                <span className="mt-4 block font-mono text-[11px] uppercase tracking-[0.2em] text-cream/40">
                  / {f.k}
                </span>
                <h3 className="mt-2 font-display text-2xl font-bold text-cream">{f.t}</h3>
                <p className="mt-3 text-sm leading-relaxed text-cream/60">{f.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ TESTIMONIALS ============================ */}
      <section className="border-t border-cream/10 bg-mocha">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <h2 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl text-cream">
            People are{" "}
            <span className="font-serif italic font-normal text-coral">leaving the house</span>{" "}
            again.
          </h2>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {PROOF.map((p) => (
              <figure
                key={p.name}
                className="rounded-card border border-cream/10 bg-cream/5 p-6 backdrop-blur-sm transition-all hover:border-cream/20 hover:bg-cream/[0.07]"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${p.avatarBg} font-display text-sm font-bold text-mocha-dark`}
                  >
                    {p.initials}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-display text-sm font-bold text-cream">
                      {p.name}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-cream/40">
                      {p.role}
                    </span>
                  </div>
                  <div className="ml-auto flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        className={`h-3.5 w-3.5 ${idx < p.rating ? "fill-gold text-gold" : "fill-transparent text-cream/20"}`}
                      />
                    ))}
                  </div>
                </div>

                <blockquote className="mt-4 font-serif text-lg italic leading-snug text-cream/80">
                  "{p.quote}"
                </blockquote>

                <div className="mt-4 flex items-center justify-between border-t border-dashed border-cream/10 pt-3 font-mono text-[10px] uppercase tracking-widest text-cream/30">
                  <span>verified planner</span>
                  <span>{p.rating}.0 / 5</span>
                </div>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ PRICING ============================ */}
      <section className="border-t border-cream/10 bg-mocha-dark">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-12 lg:px-8">
          <div className="lg:col-span-5">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-cream/40">
              / pricing
            </span>
            <h2 className="mt-3 font-display text-4xl font-extrabold leading-tight sm:text-5xl text-cream">
              Free to start.
              <br />
              <span className="font-serif italic font-normal text-coral">
                Plus when you're hooked.
              </span>
            </h2>
            <p className="mt-5 max-w-md text-base text-cream/60">
              Three full plans a month, on the house. Upgrade for unlimited, the reservations vault,
              and a taste profile that gets sharper every week.
            </p>
            <Link
              to="/auth"
              className="mt-7 inline-flex h-12 items-center gap-2 rounded-chip bg-coral px-6 font-bold text-cream shadow-lg shadow-coral/20 transition-all hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/50 focus-visible:ring-offset-2 focus-visible:ring-offset-mocha-dark"
            >
              Get started free <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="lg:col-span-7">
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  name: "Free",
                  price: "$0",
                  note: "first taste",
                  items: ["3 plans / month", "Multi-stop routing", "Save trips"],
                  accent: "border-cream/15",
                  glow: false,
                },
                {
                  name: "Plus",
                  price: "$8",
                  note: "the upgrade",
                  items: ["Unlimited plans", "Reservations vault", "Full taste profile"],
                  accent: "border-coral/40",
                  glow: true,
                },
              ].map((t) => (
                <div
                  key={t.name}
                  className={`flex flex-col rounded-card border ${t.accent} bg-cream/5 p-6 backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-xl ${t.glow ? "relative shadow-lg shadow-coral/10" : ""}`}
                >
                  {t.glow && (
                    <span className="absolute -top-3 right-5 rounded-chip bg-coral px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-cream shadow-lg">
                      most popular
                    </span>
                  )}
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-display text-2xl font-bold text-cream">{t.name}</h3>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-cream/40">
                      / {t.note}
                    </span>
                  </div>
                  <div className="mt-2 font-display text-5xl font-extrabold text-cream">
                    {t.price}
                    <span className="font-mono text-sm font-normal text-cream/50">/mo</span>
                  </div>
                  <ul className="mt-6 space-y-2 text-sm text-cream/70">
                    {t.items.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="text-coral font-bold">✦</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================ BIG CTA ============================ */}
      <section className="relative overflow-hidden bg-coral">
        {/* Texture */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle, #000 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-4xl font-extrabold leading-tight sm:text-6xl text-cream">
            Stop scrolling.
            <br />
            <span className="font-serif italic font-normal">Start showing up.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-lg text-cream/80">
            Your next great night is 60 seconds away. No signup. No credit card. Just tell us the
            vibe.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
            <span onClick={() => trackCta("plan_my_night_big_cta", { location: "big_cta" })}>
              <WizardButton
                ariaLabel="Plan my night"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-chip bg-mocha px-8 text-base font-bold text-cream shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mocha/50 focus-visible:ring-offset-2 focus-visible:ring-offset-coral"
              >
                Plan my night <ArrowUpRight className="h-5 w-5" />
              </WizardButton>
            </span>
            <Link
              to="/auth"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-chip border-2 border-cream/40 px-6 text-sm font-bold text-cream transition-all hover:bg-cream/10 hover:border-cream/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/40"
            >
              Sign up free
            </Link>
          </div>
        </div>
      </section>

      {/* ============================ BOTTOM TICKER ============================ */}
      <section className="bg-gold py-3 overflow-hidden">
        <div className="flex">
          <div className="flex shrink-0 animate-marquee items-center gap-6 whitespace-nowrap pr-6 font-display text-lg font-bold uppercase tracking-tight text-mocha-dark">
            {[...bottomItems, ...bottomItems].map((m, i) => {
              if (m.sponsored) {
                return (
                  <SponsoredMarqueeSlot
                    key={i}
                    slot={`bottom-${i}`}
                    surface="marquee_bottom"
                    text={m.text}
                    sponsored={m.sponsored}
                    variant="ticker"
                  />
                );
              }
              return (
                <span key={i}>
                  {m.text} ✦
                </span>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================ FOR BUSINESSES ============================ */}
      <section className="bg-mocha-dark">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-cream/40">
                / for venues & brands
              </span>
              <h2 className="mt-3 font-display text-4xl font-extrabold leading-tight sm:text-5xl text-cream">
                Get discovered by{" "}
                <span className="font-serif italic font-normal text-coral">people who go out.</span>
              </h2>
              <p className="mt-5 max-w-lg text-base text-cream/60">
                Confetti sends real guests to your door. We're building the nightlife layer of the
                internet — and your venue can be in every plan.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/for-businesses"
                  onClick={() => trackCta("partner_learn_more", { location: "business_section" })}
                  className="inline-flex h-12 items-center gap-2 rounded-chip bg-coral px-6 text-sm font-bold text-cream shadow-lg shadow-coral/20 transition-all hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/50"
                >
                  Partner with us <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/for-businesses"
                  className="inline-flex h-12 items-center gap-2 rounded-chip border border-cream/20 px-6 text-sm font-medium text-cream/80 transition-all hover:bg-cream/5 hover:border-cream/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/30"
                >
                  See the data
                </Link>
              </div>
            </div>

            {/* Partner stats */}
            {partnerStats && (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Ad impressions", value: partnerStats.impressions.value.toLocaleString() },
                  { label: "Clicks driven", value: partnerStats.clicks.value.toLocaleString() },
                  { label: "Click-through rate", value: `${partnerStats.ctr.value.toFixed(1)}%` },
                  { label: "30-day placements", value: partnerStats.placements30d.reduce((a, b) => a + b, 0).toLocaleString() },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-card border border-cream/10 bg-cream/5 p-5 backdrop-blur-sm"
                  >
                    <div className="font-display text-3xl font-extrabold text-cream">
                      {stat.value}
                    </div>
                    <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-cream/40">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Partner testimonials (lazy) */}
          <Suspense fallback={null}>
            <PartnerTestimonials />
          </Suspense>
        </div>
      </section>

      <Suspense fallback={null}>
        <SiteFooter />
      </Suspense>
      <Suspense fallback={null}>
        <AdDebugPanel />
      </Suspense>

      <TapToGoBookingModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        title="cute, walkable, ends with a slow drink"
        subtitle="Washington, DC · 14th St → U Street → Adams Morgan"
        date="Sat, 6:00p"
        guests={2}
        stops={SAMPLE_ITINERARY_STOPS}
        summary={SAMPLE_ITINERARY_SUMMARY}
      />

      {/* Scroll-triggered sticky CTA */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-cream/15 bg-mocha-dark/95 backdrop-blur-lg shadow-[0_-6px_24px_-8px_rgba(0,0,0,0.5)] transition-transform duration-300 ${
          showStickyCta ? "translate-y-0" : "translate-y-full"
        }`}
        aria-hidden={!showStickyCta}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-bold leading-tight text-cream sm:text-base">
              Your whole night, planned in 60 sec.
            </p>
            <p className="truncate text-xs text-cream/50">Free · No signup to try</p>
          </div>
          <span onClick={() => trackCta("plan_my_night_sticky", { location: "sticky_bar" })}>
            <WizardButton
              ariaLabel="Plan my night"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-chip bg-coral px-5 text-sm font-bold text-cream shadow-lg shadow-coral/20 transition-all hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/50"
            >
              Plan my night <ArrowUpRight className="h-4 w-4" />
            </WizardButton>
          </span>
        </div>
      </div>
    </div>
  );
}

type SponsoredSlotProps = {
  slot: string;
  surface: "marquee_top" | "marquee_bottom";
  text: string;
  sponsored: { brand: string; cta: string; href: string };
  tone?: string;
  variant: "hero" | "ticker";
};

function SponsoredMarqueeSlot({
  slot,
  surface,
  text,
  sponsored,
  tone,
  variant,
}: SponsoredSlotProps) {
  const href = withUtm(sponsored.href, { surface, brand: sponsored.brand, occasion: text });
  const debug = useMemo(() => isAdDebugEnabled(), []);
  const [flash, setFlash] = useState(0);
  const impressionConfig = useMemo(() => getAdImpressionConfig(), []);
  const ref = useViewportImpression<HTMLAnchorElement>(() => {
    logAdViewImpression({ surface, brand: sponsored.brand, occasion: text, href }, slot);
    if (debug) {
      recordAdDebug({ slot, surface, brand: sponsored.brand, occasion: text });
      setFlash((n) => n + 1);
      window.setTimeout(() => setFlash((n) => Math.max(0, n - 1)), 900);
    }
  }, impressionConfig);

  const debugRing = debug
    ? `outline outline-2 outline-offset-2 ${flash > 0 ? "outline-coral" : "outline-coral/40"} transition-all`
    : "";

  if (variant === "ticker") {
    return (
      <Link
        ref={ref}
        to={href}
        onClick={() => logAdClick({ surface, brand: sponsored.brand, occasion: text, href })}
        className={`relative inline-flex items-center gap-2 rounded-chip border border-mocha-dark bg-mocha-dark px-3 py-1 text-gold hover:bg-cream hover:text-mocha-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/60 ${debugRing}`}
        data-ad-slot={slot}
      >
        <span className="rounded-sm bg-gold px-1.5 py-0.5 text-[9px] text-mocha-dark font-bold">
          AD · {sponsored.brand}
        </span>
        <span>{text}</span>
        <span className="underline">{sponsored.cta} ↗</span>
        {debug && <DebugBadge slot={slot} flash={flash > 0} />}
      </Link>
    );
  }

  return (
    <Link
      ref={ref}
      to={href}
      onClick={() => logAdClick({ surface, brand: sponsored.brand, occasion: text, href })}
      className={`group relative inline-flex items-center gap-3 rounded-chip border border-gold/40 bg-mocha-dark px-4 py-1.5 transition hover:bg-gold hover:text-mocha-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/60 ${debugRing}`}
      data-ad-slot={slot}
    >
      <span className="rounded-chip bg-gold px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-mocha-dark group-hover:bg-mocha-dark group-hover:text-gold">
        Sponsored · {sponsored.brand}
      </span>
      <span className={tone}>{text}</span>
      <span className="font-mono text-xs uppercase tracking-widest underline underline-offset-4">
        {sponsored.cta} ↗
      </span>
      <span aria-hidden>✦</span>
      {debug && <DebugBadge slot={slot} flash={flash > 0} />}
    </Link>
  );
}

function DebugBadge({ slot, flash }: { slot: string; flash: boolean }) {
  return (
    <span
      className={`pointer-events-none absolute -top-2 -right-2 rounded-md border border-cream/20 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider shadow-sm transition-colors ${
        flash ? "bg-coral text-cream" : "bg-mocha text-cream/70"
      }`}
    >
      {slot}
    </span>
  );
}
