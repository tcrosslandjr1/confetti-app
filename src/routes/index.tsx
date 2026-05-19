import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useRef, useMemo, useState, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getPartnerStats } from "@/lib/partner-stats.functions";
import { ArrowUpRight, Sparkles, Star, MapPin, Clock, Car } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { RecapBanner } from "@/components/RecapBanner";
import { TasteConfirmPrompt } from "@/components/TasteConfirmPrompt";
import { TypingCounter } from "@/components/TypingCounter";
import { OCCASIONS, SEED_IDEAS } from "@/lib/occasions";
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
const PartnerFaqAccordion = lazy(() =>
  import("@/components/PartnerFaqAccordion").then((m) => ({ default: m.PartnerFaqAccordion })),
);
import { TapToGoBookingModal } from "@/components/TapToGoBookingModal";

const SAMPLE_ITINERARY_STOPS: TapToGoStop[] = [
  {
    id: "lilas",
    time: "6:30p",
    title: "Lila's Patio",
    type: "Small plates · Mission",
    source: "RESY",
    cost: "~$38/pp",
    emoji: "🍽️",
  },
  {
    id: "mason",
    time: "8:15p",
    title: "Mason St. Record Bar",
    type: "Vinyl + nat wine",
    source: "WALK-IN",
    cost: "~$22/pp",
    emoji: "🎧",
  },
  {
    id: "saratoga",
    time: "9:30p",
    title: "The Saratoga",
    type: "Cocktail bar · Tenderloin",
    source: "OPENTABLE",
    cost: "~$28/pp",
    emoji: "🍸",
  },
  {
    id: "aera",
    time: "11:00p",
    title: "Aera Rooftop",
    type: "Nightcap · Nob Hill",
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
      { title: "Confetti — Plans with a pulse. Outings worth showing up for." },
      {
        name: "description",
        content:
          "Confetti is the loud, opinionated planner that turns 'I'm bored' into a whole night. AI itineraries, door-to-door routing, reservations on lock.",
      },
      { property: "og:title", content: "Confetti — Plans with a pulse." },
      { property: "og:description", content: "From vibe to door-to-door plan in under a minute." },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
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
      "It planned a Friday night that ended in a dive bar I’d driven past 100 times. New favorite.",
    name: "Mara K.",
    role: "Brooklyn",
    rating: 5,
    avatarBg: "bg-coral",
    initials: "MK",
    // desktop scatter
    pos: "lg:col-start-1 lg:row-start-1 lg:translate-y-2",
    rot: "-rotate-3",
    z: "z-20",
  },
  {
    quote: "Killed our 47-message group chat dead. Sent everyone the trip link, voted, done.",
    name: "Devin R.",
    role: "Atlanta",
    rating: 5,
    avatarBg: "bg-purple",
    initials: "DR",
    pos: "lg:col-start-2 lg:row-start-1 lg:-translate-y-6 lg:translate-x-[-12%]",
    rot: "rotate-2",
    z: "z-30",
  },
  {
    quote: "I’m the planner friend. This is the first thing that out-planned me.",
    name: "Priya S.",
    role: "Chicago",
    rating: 4,
    avatarBg: "bg-gold",
    initials: "PS",
    pos: "lg:col-start-3 lg:row-start-1 lg:translate-y-10 lg:translate-x-[-18%]",
    rot: "-rotate-1",
    z: "z-10",
  },
];

const FAQS = [
  {
    q: "What does “free, no signup to try” actually include?",
    a: "Build a full plan end-to-end without making an account: pick your vibe, get a timed itinerary with real venues open tonight, walking + Lyft routes between stops, and one-tap booking links. You can preview everything before you ever hand over an email.",
  },
  {
    q: "What happens after the free trial?",
    a: "Nothing breaks. You keep three full plans every month on the free tier — forever. To save plans, unlock the reservations vault, earn Confetti rewards faster, and get unlimited plans, upgrade to Plus for $8/mo. No auto-charge, no surprise paywall mid-night.",
  },
  {
    q: "Is this just a list of restaurants?",
    a: "Nope. It’s a full timed plan — first stop, second stop, how you get between them, what to wear, what to book. The list-of-restaurants era is over.",
  },
  {
    q: "Does it actually book stuff?",
    a: "It hands you straight-to-checkout links for OpenTable, Resy, Eventbrite, and rideshare deep links. One-tap, no copy/paste.",
  },
  {
    q: "How does it know what we like?",
    a: "Tell the concierge in plain English, or paste in a Spotify playlist link, IG handle, anything. The taste profile gets sharper every plan.",
  },
];

function Landing() {
  // Signed-in customers get the personalized portal instead of the marketing landing.
  const { user, viewAs, loading } = useAuth();
  const navigate = useNavigate();
  usePageview("landing", "/");
  useScrollDepth("/");
  useTimeToInteraction("/");
  useEffect(() => {
    if (loading) return;
    if (user && viewAs === "customer") navigate({ to: "/portal" });
    else if (user && viewAs === "admin") navigate({ to: "/admin" });
  }, [user, viewAs, loading, navigate]);

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

  // Subtle hero parallax
  const heroBgRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = heroBgRef.current;
    if (!el) return;
    // Respect prefers-reduced-motion — skip parallax entirely.
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

  // Impressions are now logged per rendered slot when it enters the viewport.
  // See <SponsoredTopSlot /> and <SponsoredBottomSlot /> below.

  return (
    <div className="min-h-screen bg-cream text-ink">
      <SiteHeader />
      <RecapBanner />
      <TasteConfirmPrompt />

      {/* ============================ HERO ============================ */}
      <section className="relative overflow-hidden border-b-2 border-ink">
        <div ref={heroBgRef} className="absolute inset-0 -z-20 will-change-transform">
          <div className="hero-gradient absolute inset-0" />
          <div className="grid-paper absolute inset-0 opacity-50" />
          <div className="absolute -right-24 -top-24 h-96 w-96 animate-blob bg-gradient-warm opacity-70" />
          <div
            className="absolute -bottom-32 -left-24 h-96 w-96 animate-blob bg-gradient-cool opacity-50"
            style={{ animationDelay: "-7s" }}
          />
        </div>

        <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-12 lg:px-8 lg:pb-32 lg:pt-20">
          {/* left — type */}
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-cream/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-coral text-coral animate-dot-pulse" />
              <TypingCounter target={2847} suffix=" plans built today" className="text-[11px]" />
            </span>

            <h1 className="mt-5 font-display text-[12vw] font-extrabold leading-[0.9] tracking-[-0.04em] sm:text-[68px] lg:text-[96px]">
              Your whole night out,
              <br />
              <span className="font-serif italic font-normal text-coral">planned for you.</span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-snug sm:text-lg">
              Tell us the vibe — date night, rooftop drinks, dive bar crawl. Confetti picks the
              venues, books the table, lines up the walking + Lyft route between stops, and hands
              you a tap-to-go itinerary.{" "}
              <span className="font-serif italic">Free, no signup to try.</span>
            </p>

            <ul className="mt-5 grid max-w-xl gap-2 text-sm sm:grid-cols-2">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-coral" />
                Real venues open right now, not a generic list
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-coral" />
                Reservations booked in one tap
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-coral" />
                Walking + Lyft routes between every stop
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-coral" />
                Earn Confetti rewards every time you go out
              </li>
            </ul>

            <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <span onClick={() => trackCta("plan_my_night_hero", { location: "hero_primary" })}>
                <WizardButton
                  ariaLabel="Plan my night"
                  className="inline-flex h-14 w-full min-h-11 items-center justify-center gap-2 rounded-full border-2 border-ink bg-ink px-7 text-base font-bold text-cream shadow-brut transition-pop hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brut-lg sm:w-auto"
                >
                  Plan my night — 60 sec <ArrowUpRight className="h-5 w-5" />
                </WizardButton>
              </span>
              <a
                href="#sample-plan"
                onClick={() => trackCta("see_sample_plan", { location: "hero_secondary" })}
                className="text-sm font-bold text-ink/70 underline-offset-4 hover:text-ink hover:underline"
              >
                or peek at a sample plan ↓
              </a>
            </div>
          </div>

          {/* right — receipt-style mock plan (now obviously a sample) */}
          <div id="sample-plan" className="relative mt-4 lg:col-span-5 lg:mt-0">
            <div className="absolute -top-3 left-3 z-20 -rotate-6 rounded-md border-2 border-ink bg-gold px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-widest shadow-brut sm:-left-4 sm:-top-4">
              ★ Sample plan
            </div>

            <div className="animate-float-card rounded-2xl border-2 border-ink bg-cream p-5 shadow-brut-lg">
              <div className="flex items-center justify-between border-b-2 border-dashed border-ink pb-3">
                <span className="font-mono text-[11px] uppercase tracking-widest">
                  YOUR CITY // YOUR WAY · plan #A7K2
                </span>
                <span className="font-mono text-[11px]">SAT · 6:00p</span>
              </div>

              <h3 className="mt-4 font-serif text-2xl italic leading-tight sm:text-3xl">
                "cute, walkable, ends with a slow drink"
              </h3>

              <div className="mt-5 space-y-3">
                {[
                  {
                    t: "6:30",
                    title: "Lila’s Patio",
                    sub: "small plates · 12 min walk",
                    chip: "RESY",
                    color: "bg-coral",
                    dot: "text-coral",
                  },
                  {
                    t: "8:15",
                    title: "Mason St. record bar",
                    sub: "vinyl + nat wine · 6 min walk",
                    chip: "WALK-IN",
                    color: "bg-purple",
                    dot: "text-purple",
                  },
                  {
                    t: "10:00",
                    title: "Aera rooftop",
                    sub: "nightcap · 9 min Lyft",
                    chip: "LYFT",
                    color: "bg-gold",
                    dot: "text-gold",
                  },
                ].map((s, i) => (
                  <div
                    key={s.t}
                    className="flex items-center gap-3 rounded-xl border-2 border-ink bg-background p-3"
                  >
                    <div
                      className={`relative grid h-14 w-14 shrink-0 place-items-center rounded-lg border-2 border-ink ${s.color} font-display text-base font-extrabold text-ink`}
                    >
                      {s.t}
                      <span
                        className={`absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-current animate-dot-pulse ${s.dot}`}
                        style={{ animationDelay: `${i * 0.4}s` }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-display text-base font-bold">{s.title}</div>
                      <div className="truncate text-xs text-ink/60">{s.sub}</div>
                    </div>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest">
                      {s.chip}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between border-t-2 border-dashed border-ink pt-3 font-mono text-[11px] uppercase tracking-widest">
                <span>3 stops · 4h · ~$92</span>
                <span className="rounded-full bg-ink px-2 py-1 text-cream">booked ✓</span>
              </div>

              <WizardButton
                ariaLabel="Try this sample plan"
                preset={{
                  title: "cute, walkable, ends with a slow drink",
                  vibeKeys: ["bougie", "speakeasy"],
                  vibeLabel: "cute, walkable, ends with a slow drink",
                }}
                className="mt-5 inline-flex h-12 w-full min-h-11 items-center justify-center gap-2 rounded-full border-2 border-ink bg-coral px-5 text-sm font-bold text-cream shadow-brut transition-pop hover:-translate-y-0.5"
              >
                Try this plan <ArrowUpRight className="h-4 w-4" />
              </WizardButton>
            </div>
          </div>
        </div>
      </section>

      {/* ============================ HOW IT WORKS — 3 STEPS ============================ */}
      <section
        aria-labelledby="how-it-works-heading"
        className="border-b-2 border-ink bg-background"
      >
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2
              id="how-it-works-heading"
              className="font-display text-2xl font-extrabold leading-tight sm:text-3xl"
            >
              How it works
              <span className="font-serif italic font-normal text-coral"> in 4 steps.</span>
            </h2>
            <span className="hidden font-mono text-[11px] uppercase tracking-widest text-ink/60 sm:inline">
              under 60 seconds
            </span>
          </div>

          <ol className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-4">
            {[
              {
                n: "1",
                emoji: "🎯",
                title: "Choose your vibe",
                body: "Rooftop, dive bar, date night, brunch crawl. Plain English works.",
                bg: "bg-coral",
              },
              {
                n: "2",
                emoji: "📍",
                title: "Pick your venues",
                body: "Swipe through real spots open tonight. Keep what you love, swap the rest.",
                bg: "bg-gold",
              },
              {
                n: "3",
                emoji: "🛣️",
                title: "Get your route",
                body: "Timed stops with walking + Lyft directions stitched between them.",
                bg: "bg-purple",
              },
              {
                n: "4",
                emoji: "🎟️",
                title: "Tap-to-go booking",
                body: "Resy, OpenTable, Eventbrite, rideshare — one tap, straight to checkout.",
                bg: "bg-teal",
              },
            ].map((s) => (
              <li
                key={s.n}
                className={`relative w-[78%] shrink-0 snap-center rounded-2xl border-2 border-ink ${s.bg} p-5 shadow-brut sm:w-auto`}
              >
                <span className="absolute -top-3 left-4 grid h-7 w-7 place-items-center rounded-full border-2 border-ink bg-cream font-mono text-xs font-extrabold">
                  {s.n}
                </span>
                <div className="text-3xl">{s.emoji}</div>
                <div className="mt-3 font-display text-lg font-extrabold leading-tight">
                  {s.title}
                </div>
                <p className="mt-1 text-sm leading-snug text-ink/80">{s.body}</p>
              </li>
            ))}
          </ol>

          <div className="mt-6 flex justify-center sm:hidden">
            <WizardButton
              ariaLabel="Plan my night"
              className="inline-flex h-12 min-h-11 w-full items-center justify-center gap-2 rounded-full border-2 border-ink bg-ink px-7 text-sm font-bold text-cream shadow-brut transition-pop"
            >
              Start — Plan my night <ArrowUpRight className="h-4 w-4" />
            </WizardButton>
          </div>
        </div>
      </section>

      {/* ============================ SAMPLE ITINERARY ============================ */}
      <section
        id="sample-itinerary"
        aria-labelledby="sample-itinerary-heading"
        className="border-b-2 border-ink bg-cream"
      >
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-ink/60">
                / a real Saturday in San Francisco
              </span>
              <h2
                id="sample-itinerary-heading"
                className="mt-2 font-display text-3xl font-extrabold leading-tight sm:text-4xl"
              >
                A sample night,
                <span className="font-serif italic font-normal text-coral"> start to finish.</span>
              </h2>
              <p className="mt-3 max-w-xl text-sm text-ink/70 sm:text-base">
                This is exactly what Confetti hands you after you pick a vibe — timed stops, real
                venues, walking + Lyft routes between them, and one-tap booking links.
              </p>
            </div>
            <div className="rounded-2xl border-2 border-ink bg-background px-4 py-3 font-mono text-[11px] uppercase tracking-widest shadow-brut">
              <div>SAT · 6:00p → 12:30a</div>
              <div className="mt-1 text-ink/60">Mission → Hayes Valley → Nob Hill</div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-12">
            {/* TIMELINE */}
            <ol className="relative lg:col-span-8">
              <span
                aria-hidden
                className="absolute left-[27px] top-3 bottom-3 w-0.5 bg-ink/20 sm:left-[31px]"
              />
              {(
                [
                  {
                    t: "6:30p",
                    title: "Lila’s Patio",
                    type: "Small plates · Mission",
                    desc: "Start with shared plates on the heated back patio. Reservation held for 90 min.",
                    chip: "RESY",
                    chipBg: "bg-coral",
                    emoji: "🍽️",
                    cost: "~$38/pp",
                  },
                  { leg: "12 min walk · 0.5 mi · down Valencia", legIcon: "🚶" },
                  {
                    t: "8:15p",
                    title: "Mason St. Record Bar",
                    type: "Vinyl + nat wine · Mission",
                    desc: "Walk-in friendly. DJ set starts 8:30. Two glasses, then move on.",
                    chip: "WALK-IN",
                    chipBg: "bg-purple text-cream",
                    emoji: "🎧",
                    cost: "~$22/pp",
                  },
                  { leg: "9 min Lyft · ~$14 · pre-booked", legIcon: "🚗" },
                  {
                    t: "9:30p",
                    title: "The Saratoga",
                    type: "Cocktail bar · Tenderloin",
                    desc: "Reserved bar seats. Order the Improved Whiskey Cocktail — house signature.",
                    chip: "OPENTABLE",
                    chipBg: "bg-gold",
                    emoji: "🍸",
                    cost: "~$28/pp",
                  },
                  { leg: "6 min walk · 0.3 mi · uphill, worth it", legIcon: "🚶" },
                  {
                    t: "11:00p",
                    title: "Aera Rooftop",
                    type: "Nightcap · Nob Hill",
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
                    className="relative ml-12 flex items-center gap-2 py-2 pl-2 text-xs text-ink/60 sm:ml-14"
                  >
                    <span aria-hidden className="text-base">
                      {row.legIcon}
                    </span>
                    <span className="font-mono uppercase tracking-widest">{row.leg}</span>
                  </li>
                ) : (
                  <li key={`stop-${i}`} className="relative pl-12 sm:pl-14 pb-3">
                    <div
                      className={`absolute left-0 top-1 grid h-14 w-14 place-items-center rounded-full border-2 border-ink ${row.chipBg} font-mono text-[11px] font-extrabold shadow-brut`}
                    >
                      {row.t}
                    </div>
                    <div className="rounded-2xl border-2 border-ink bg-background p-4 shadow-brut">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span aria-hidden className="text-xl">
                              {row.emoji}
                            </span>
                            <h3 className="font-display text-lg font-extrabold leading-tight">
                              {row.title}
                            </h3>
                          </div>
                          <div className="mt-0.5 text-xs text-ink/60">{row.type}</div>
                        </div>
                        <span
                          className={`shrink-0 rounded-full border-2 border-ink px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest ${row.chipBg}`}
                        >
                          {row.chip}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-snug text-ink/80">{row.desc}</p>
                      <div className="mt-2 font-mono text-[11px] uppercase tracking-widest text-ink/60">
                        {row.cost}
                      </div>
                    </div>
                  </li>
                ),
              )}
            </ol>

            {/* SUMMARY CARD */}
            <aside className="lg:col-span-4">
              <div className="sticky top-24 rounded-2xl border-2 border-ink bg-background p-5 shadow-brut-lg">
                <div className="border-b-2 border-dashed border-ink pb-3 font-mono text-[11px] uppercase tracking-widest">
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
                      className="flex items-baseline justify-between gap-3 border-b border-dashed border-ink/30 pb-2 last:border-0"
                    >
                      <dt className="font-mono text-[11px] uppercase tracking-widest text-ink/60">
                        {k}
                      </dt>
                      <dd className="font-display text-base font-bold">{v}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-5 rounded-xl border-2 border-ink bg-gold/40 p-3 text-xs leading-snug">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-ink/70">
                    Earned
                  </div>
                  <div className="mt-1 font-display text-base font-extrabold">+120 Confetti</div>
                  <div className="text-ink/70">Auto-credited after the last booking.</div>
                </div>

                <button
                  type="button"
                  onClick={() => setBookingOpen(true)}
                  className="mt-5 inline-flex h-12 w-full min-h-11 items-center justify-center gap-2 rounded-full border-2 border-ink bg-coral px-5 text-sm font-bold text-cream shadow-brut transition-pop hover:-translate-y-0.5"
                >
                  Tap to go — book this plan <ArrowUpRight className="h-4 w-4" />
                </button>
                <WizardButton
                  ariaLabel="Build my own night"
                  className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border-2 border-ink bg-background px-5 text-xs font-bold text-ink transition-pop hover:-translate-y-0.5"
                >
                  Or build my own night
                </WizardButton>
                <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-widest text-ink/50">
                  Free · no signup to try
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ============================ MARQUEE ============================ */}
      <section className="border-b-2 border-ink bg-ink py-4 text-cream">
        <div className="flex overflow-hidden">
          <div className="flex shrink-0 animate-marquee items-center gap-10 whitespace-nowrap pr-10 font-display text-3xl font-extrabold uppercase tracking-tight">
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

      {/* ============================ MANIFESTO / WHY ============================ */}
      <section className="border-b-2 border-ink">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-12 lg:px-8">
          <Reveal className="lg:col-span-5">
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-ink/60">
              / the manifesto
            </span>
            <h2 className="mt-3 font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl">
              We are <span className="font-serif italic font-normal">tired</span> of the group chat.
            </h2>
          </Reveal>
          <Reveal className="space-y-6 text-lg leading-relaxed lg:col-span-7" delay={120}>
            <p>
              You know the loop. Someone says "we should do something." Three days pass. Yelp gets
              opened, then closed. Someone screenshots a TikTok. Friday becomes pizza on the couch.{" "}
              <span className="font-serif italic">Again.</span>
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
                  className="rounded-full border-2 border-ink bg-cream px-3 py-1 text-sm font-semibold transition-pop hover:-translate-y-0.5 hover:bg-gold"
                >
                  {t}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================ HOW IT WORKS — color blocks ============================ */}
      <section className="border-b-2 border-ink">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-6">
            <h2 className="font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl">
              Three steps.
              <br />
              <span className="font-serif italic font-normal">Zero spirals.</span>
            </h2>
            <Link
              to="/how-it-works"
              className="hidden items-center gap-1 font-mono text-xs uppercase tracking-widest underline underline-offset-4 sm:inline-flex"
            >
              full walkthrough <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <Suspense fallback={<div className="mt-12 h-72" aria-hidden />}>
            <StepsShowcase />
          </Suspense>
        </div>
      </section>

      {/* ============================ OCCASIONS BENTO ============================ */}
      <section className="relative overflow-hidden border-b-2 border-ink bg-cream text-ink">
        {/* warm ambient washes */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-coral/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 bottom-10 h-96 w-96 rounded-full bg-gold/40 blur-3xl"
        />
        {/* subtle grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--ink, #1a1a1a) 1px, transparent 1px), linear-gradient(to bottom, var(--ink, #1a1a1a) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-white px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-ink shadow-brut">
                <Sparkles className="h-3 w-3 text-coral" /> / pick a vibe
              </span>
              <h2 className="mt-4 font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl">
                What's the{" "}
                <span className="font-serif italic font-normal text-coral">occasion?</span>
              </h2>
              <p className="mt-3 max-w-md font-mono text-sm text-ink/70">
                Tap any vibe — we generate a full night around it in seconds.
              </p>
            </div>
            <GatedAction
              to="/create"
              feature="planning"
              className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-ink bg-ink px-5 font-mono text-xs font-bold uppercase tracking-widest text-cream shadow-brut transition-pop hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brut-lg"
            >
              skip — just plan something <ArrowUpRight className="h-4 w-4" />
            </GatedAction>
          </div>

          {/* mobile snap rail */}
          <div className="mt-12 -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 sm:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {OCCASIONS.map((o) => {
              const Icon = o.icon;
              const ideaCount = SEED_IDEAS[o.slug]?.length ?? 0;
              return (
                <Link
                  key={o.slug}
                  to="/ideas/$slug"
                  params={{ slug: o.slug }}
                  className={`group relative flex h-48 w-[78%] shrink-0 snap-center flex-col justify-between overflow-hidden rounded-2xl border-2 border-ink bg-gradient-to-br ${o.gradient} p-5 text-cream shadow-brut`}
                >
                  <div className="flex items-start justify-between">
                    <Icon className="h-6 w-6 drop-shadow" />
                    <span className="text-4xl drop-shadow-md">{o.emoji}</span>
                  </div>
                  <div>
                    <div className="font-display text-2xl font-extrabold leading-tight drop-shadow">
                      {o.title}
                    </div>
                    <div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-cream/90">
                      {o.tagline}
                    </div>
                    {ideaCount > 0 && (
                      <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-ink/50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest backdrop-blur">
                        {ideaCount} idea{ideaCount === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
          <p className="text-center font-mono text-[10px] uppercase tracking-widest text-ink/50 sm:hidden">
            ← swipe vibes →
          </p>

          {/* desktop bento grid */}
          <div className="mt-12 hidden gap-3 sm:grid sm:grid-cols-4 lg:grid-cols-6 lg:auto-rows-[150px]">
            {OCCASIONS.map((o, i) => {
              const Icon = o.icon;
              const ideaCount = SEED_IDEAS[o.slug]?.length ?? 0;
              // bento sizing: feature a few tiles
              const featured = i === 0 || i === 4 || i === 7;
              const wide = i === 2 || i === 9;
              const span = featured
                ? "lg:col-span-2 lg:row-span-2"
                : wide
                  ? "lg:col-span-2"
                  : "lg:col-span-1";
              const isPopular = i === 0;
              const tilt = ((i % 3) - 1) * 0.25;

              return (
                <Reveal key={o.slug} delay={i * 50} className={`${span} sm:col-span-2 lg:col-auto`}>
                  <Link
                    to="/ideas/$slug"
                    params={{ slug: o.slug }}
                    style={{ transform: `rotate(${tilt}deg)` }}
                    className={`group relative flex h-full min-h-[150px] flex-col justify-between overflow-hidden rounded-2xl border-2 border-ink bg-gradient-to-br ${o.gradient} p-5 text-cream shadow-brut transition-pop hover:-translate-x-0.5 hover:-translate-y-1 hover:rotate-0 hover:scale-[1.02] hover:shadow-brut-lg`}
                  >
                    {/* shimmer sweep on hover */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-cream/25 to-transparent transition-transform duration-[1100ms] ease-out group-hover:translate-x-full"
                    />
                    {/* grain */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay"
                      style={{
                        backgroundImage:
                          "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
                        backgroundSize: "3px 3px",
                      }}
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
                      <span className="absolute left-4 top-12 inline-flex items-center gap-1 rounded-full border border-ink/40 bg-ink/60 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-cream backdrop-blur">
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
                        className={`mt-1 font-mono uppercase tracking-wider text-cream/85 ${featured ? "text-xs" : "text-[10px]"}`}
                      >
                        {o.tagline}
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        {ideaCount > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-ink/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest backdrop-blur">
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

      {/* ============================ QUICK PICKS — Steal a night ============================ */}
      <QuickPicks />

      {/* ============================ FEATURE STRIP — three big claims ============================ */}
      <section className="border-b-2 border-ink">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="grid gap-px bg-ink lg:grid-cols-3">
            {[
              {
                icon: Clock,
                k: "timing",
                t: "Down to the minute.",
                b: "Reservations, sunset, last call — Confetti backs into the schedule so you’re never early or stranded.",
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
              <div key={f.k} className="bg-cream p-8">
                <f.icon className="h-8 w-8" />
                <span className="mt-4 block font-mono text-[11px] uppercase tracking-[0.25em] text-ink/60">
                  / {f.k}
                </span>
                <h3 className="mt-2 font-display text-3xl font-extrabold leading-tight">{f.t}</h3>
                <p className="mt-3 text-base leading-snug">{f.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ TESTIMONIALS — sticky notes ============================ */}
      <section className="border-b-2 border-ink bg-gradient-warm/40">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <h2 className="font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl">
            People are <span className="font-serif italic font-normal">leaving the house</span>{" "}
            again.
          </h2>

          <div className="mt-16 flex flex-col gap-8 md:gap-10 lg:grid lg:grid-cols-3 lg:gap-0">
            {PROOF.map((p, i) => (
              <figure
                key={p.name}
                className={`${p.rot} ${p.pos ?? ""} ${p.z ?? ""} relative rounded-2xl border-2 border-ink bg-cream p-7 shadow-brut transition-pop hover:z-40 hover:scale-[1.03] hover:rotate-0`}
              >
                {/* tape strip */}
                <span
                  aria-hidden
                  className={`absolute -top-3 ${i % 2 === 0 ? "left-6" : "right-6"} h-5 w-16 -rotate-6 rounded-sm bg-gold/70 shadow-soft`}
                />

                <div className="flex items-center gap-3">
                  <div
                    className={`grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 border-ink ${p.avatarBg} font-display text-base font-extrabold text-ink shadow-brut`}
                  >
                    {p.initials}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-display text-base font-extrabold leading-tight">
                      {p.name}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-ink/60">
                      {p.role}
                    </span>
                  </div>
                  <div className="ml-auto flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        className={`h-4 w-4 stroke-ink ${idx < p.rating ? "fill-gold" : "fill-cream"}`}
                      />
                    ))}
                  </div>
                </div>

                <blockquote className="mt-5 font-serif text-2xl italic leading-snug">
                  "{p.quote}"
                </blockquote>

                <figcaption className="mt-5 flex items-center justify-between border-t-2 border-dashed border-ink/30 pt-3 font-mono text-[10px] uppercase tracking-widest text-ink/60">
                  <span>verified planner</span>
                  <span>{p.rating}.0 / 5</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ PRICING TEASER ============================ */}
      <section className="border-b-2 border-ink">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-24 sm:px-6 lg:grid-cols-12 lg:px-8">
          <div className="lg:col-span-5">
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-ink/60">
              / pricing
            </span>
            <h2 className="mt-3 font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl">
              Free to start.
              <br />
              <span className="font-serif italic font-normal text-coral">
                Plus when you're hooked.
              </span>
            </h2>
            <p className="mt-5 max-w-md text-lg">
              Three full plans a month, on the house. Upgrade for unlimited, the reservations vault,
              and a taste profile that gets sharper every week.
            </p>
            <Link
              to="/pricing"
              className="mt-7 inline-flex h-12 items-center gap-2 rounded-full border-2 border-ink bg-ink px-6 font-bold text-cream shadow-brut transition-pop hover:-translate-y-1 hover:shadow-brut-lg"
            >
              See the tiers <ArrowUpRight className="h-4 w-4" />
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
                  cls: "bg-cream",
                  glow: false,
                },
                {
                  name: "Plus",
                  price: "$8",
                  note: "the upgrade",
                  items: ["Unlimited plans", "Reservations vault", "Full taste profile"],
                  cls: "bg-gold",
                  glow: true,
                },
              ].map((t) => (
                <div
                  key={t.name}
                  className={`flex flex-col rounded-3xl border-2 border-ink p-6 shadow-brut transition-pop hover:-translate-y-1 hover:shadow-brut-lg ${t.glow ? "animate-pulse-glow relative" : ""}`}
                  style={{ background: `var(--${t.cls === "bg-gold" ? "gold" : "cream"})` }}
                >
                  {t.glow && (
                    <span className="absolute -top-3 right-5 rounded-full border-2 border-ink bg-coral px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-cream shadow-brut">
                      most popular
                    </span>
                  )}
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-display text-3xl font-extrabold">{t.name}</h3>
                    <span className="font-mono text-[10px] uppercase tracking-widest opacity-70">
                      / {t.note}
                    </span>
                  </div>
                  <div className="mt-2 font-display text-5xl font-extrabold">
                    {t.price}
                    <span className="font-mono text-sm font-normal">/mo</span>
                  </div>
                  <ul className="mt-6 space-y-2 text-sm">
                    {t.items.map((i) => (
                      <li key={i} className="flex gap-2">
                        <span className="font-bold">✦</span>
                        {i}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================ FAQ ============================ */}
      <section className="border-b-2 border-ink">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-24 sm:px-6 lg:grid-cols-12 lg:px-8">
          <div className="lg:col-span-4">
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-ink/60">/ FAQ</span>
            <h2 className="mt-3 font-display text-5xl font-extrabold leading-[0.95] tracking-tight">
              Quick
              <br />
              questions.
            </h2>
          </div>
          <div className="space-y-3 lg:col-span-8">
            {FAQS.map((f, i) => (
              <div key={f.q} className="rise-in" style={{ ["--d" as string]: `${i * 70}ms` }}>
                <details className="faq-item group rounded-2xl border-2 border-ink bg-cream p-5 shadow-brut transition-pop open:bg-gold open:-translate-y-0.5 open:shadow-brut-lg [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 font-display text-xl font-extrabold">
                    {f.q}
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-ink bg-cream font-mono text-lg transition-transform duration-300 group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p
                    className="mt-4 text-base leading-relaxed"
                    style={{ animation: "faq-open 0.32s cubic-bezier(0.22,1,0.36,1) both" }}
                  >
                    {f.a}
                  </p>
                </details>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ BIG CTA ============================ */}
      <section className="relative overflow-hidden border-b-2 border-ink bg-coral text-cream">
        {/* Animated background blobs */}
        <div className="absolute -right-20 -top-20 h-72 w-72 animate-blob bg-purple/40" />
        <div
          className="absolute -bottom-16 -left-16 h-64 w-64 animate-blob bg-gold/60"
          style={{ animationDelay: "-4s" }}
        />
        <div
          className="absolute right-1/4 bottom-10 h-40 w-40 animate-blob bg-cream/15 blur-2xl"
          style={{ animationDelay: "-2s" }}
        />

        {/* Dot grid texture */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: "radial-gradient(currentColor 1.2px, transparent 1.2px)",
            backgroundSize: "22px 22px",
          }}
        />

        {/* Floating confetti chips */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute left-[8%] top-[18%] h-3 w-3 rotate-12 bg-gold animate-float-slow" />
          <div className="absolute left-[14%] bottom-[22%] h-2 w-6 -rotate-6 bg-purple animate-float-slower" />
          <div className="absolute right-[12%] top-[26%] h-4 w-4 rotate-45 border-2 border-cream animate-float-slower" />
          <div className="absolute right-[20%] bottom-[18%] h-2.5 w-2.5 rounded-full bg-cream animate-float-slow" />
          <div className="absolute left-[42%] top-[10%] h-2 w-8 rotate-12 bg-cream/70 animate-float-slow" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-32 text-center sm:px-6">
          <Reveal>
            {/* Eyebrow pill */}
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border-2 border-cream/80 bg-ink/20 px-4 py-1.5 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
              </span>
              <span className="font-mono text-xs font-bold uppercase tracking-[0.2em]">
                Tonight in your city
              </span>
            </div>

            <Sparkles className="mx-auto mt-6 h-10 w-10 animate-pulse" />

            <h2 className="mt-6 font-display text-7xl font-extrabold leading-[0.85] tracking-tight sm:text-[140px]">
              <span className="relative inline-block">
                Stop scrolling.
                <span
                  aria-hidden
                  className="absolute -bottom-2 left-0 right-0 h-2 bg-gold/80"
                  style={{ clipPath: "polygon(0 0,100% 0,98% 100%,2% 100%)" }}
                />
              </span>
              <br />
              <span className="font-serif italic font-normal text-gold drop-shadow-[3px_3px_0_var(--ink)]">
                Start showing up.
              </span>
            </h2>

            <p className="mx-auto mt-8 max-w-2xl text-lg font-medium text-cream/90 sm:text-xl">
              One tap. A full night planned — vibes, venues, route, and reservations. No group chat
              chaos. No FOMO.
            </p>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
              <WizardButton
                ariaLabel="Build my night"
                className="group inline-flex h-16 items-center gap-2 rounded-full border-2 border-ink bg-cream px-10 font-bold text-ink shadow-brut-lg transition-pop hover:-translate-x-1 hover:-translate-y-1 hover:bg-gold hover:shadow-brut-xl"
              >
                Build my night
                <ArrowUpRight className="h-5 w-5 transition-transform group-hover:rotate-45" />
              </WizardButton>
              <Link
                to="/features"
                className="inline-flex h-16 items-center rounded-full border-2 border-cream px-10 font-bold transition-pop hover:-translate-y-0.5 hover:bg-cream hover:text-ink"
              >
                Tour the features
              </Link>
            </div>

            {/* Trust strip */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-xs font-bold uppercase tracking-widest text-cream/80">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                Free to start
              </span>
              <span className="hidden sm:inline opacity-40">•</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                No card required
              </span>
              <span className="hidden sm:inline opacity-40">•</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                Plans in 8 seconds
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================ TICKER (hover speeds up) ============================ */}
      <section className="marquee-hover border-b-2 border-ink bg-gold py-3 text-ink">
        <div className="flex overflow-hidden">
          <div
            className="flex shrink-0 animate-marquee gap-8 whitespace-nowrap pr-8 font-mono text-xs font-bold uppercase tracking-widest"
            style={{ transition: "animation-duration 0.4s ease" }}
          >
            {[...bottomItems, ...bottomItems, ...bottomItems].map((m, i) =>
              m.sponsored ? (
                <SponsoredMarqueeSlot
                  key={i}
                  slot={`bottom-${i}`}
                  surface="marquee_bottom"
                  text={m.text}
                  sponsored={m.sponsored}
                  variant="ticker"
                />
              ) : (
                <span key={i} className="inline-flex items-center gap-3">
                  {m.text}
                  <span className="opacity-40">/</span>
                </span>
              ),
            )}
          </div>
        </div>
        <p className="mt-1 text-center font-mono text-[9px] uppercase tracking-[0.3em] text-ink/50">
          hover to speed it up ↗
        </p>
      </section>

      <section className="relative overflow-hidden border-t-2 border-ink bg-gradient-to-br from-ink via-ink to-[#1a0f0a] text-cream">
        {/* Decorative glow blobs */}
        <div className="pointer-events-none absolute -left-32 top-10 h-72 w-72 rounded-full bg-coral/30 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-gold/20 blur-3xl" aria-hidden />
        {/* Confetti specks */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <span className="absolute left-[6%] top-10 h-2 w-2 rotate-12 bg-coral motion-reduce:rotate-0" />
          <span className="absolute left-[18%] top-24 h-2.5 w-2.5 -rotate-12 rounded-sm bg-cream/70 motion-reduce:rotate-0" />
          <span className="absolute left-[38%] top-6 h-1.5 w-1.5 bg-gold motion-reduce:rotate-0" />
          <span className="absolute right-[12%] top-16 h-2 w-2 rotate-45 bg-purple motion-reduce:rotate-0" />
          <span className="absolute right-[30%] bottom-12 h-2 w-2 -rotate-45 rounded-full bg-coral motion-reduce:rotate-0" />
          <span className="absolute left-[10%] bottom-10 h-2.5 w-2.5 rotate-12 bg-cream/50 motion-reduce:rotate-0" />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.4fr_1fr] lg:px-8 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-cream/40 bg-cream/5 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-cream/80 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-coral opacity-75 motion-reduce:animate-none" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-coral" />
              </span>
              For businesses
            </span>
            <h2 className="mt-5 font-display text-4xl font-extrabold leading-[0.95] tracking-tight sm:text-5xl lg:text-6xl">
              Be the plan,{" "}
              <span className="font-serif italic font-normal bg-gradient-to-r from-coral via-orange-400 to-gold bg-clip-text text-transparent">
                not an afterthought.
              </span>
            </h2>
            <p className="mt-4 max-w-xl text-base text-cream/80 sm:text-lg">
              Get your venue in front of people the second they're choosing what to do tonight.
              Promoted itinerary slots, home-page spotlights, and verified analytics.
            </p>
            <ul className="mt-6 grid max-w-xl gap-2.5 text-sm text-cream/85 sm:grid-cols-2">
              {[
                "Promoted in real itineraries",
                "Claim & verify your venue free",
                "Impressions, clicks, CTR dashboard",
                "Pause anytime — no contracts",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 rounded-lg border border-cream/10 bg-cream/[0.03] px-3 py-2 transition hover:border-coral/40 hover:bg-cream/[0.06]"
                >
                  <span className="mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-coral text-[10px] font-bold text-ink">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                to="/advertise"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-full border-2 border-cream bg-coral px-6 text-sm font-bold uppercase tracking-wider text-ink shadow-brut transition-pop hover:-translate-x-0.5 hover:-translate-y-0.5"
              >
                See packages{" "}
                <ArrowUpRight className="h-4 w-4 transition group-hover:rotate-45" />
              </Link>
              <Link
                to="/advertise/portal"
                className="inline-flex h-12 items-center justify-center rounded-full border-2 border-cream/60 px-6 text-sm font-bold text-cream transition-pop hover:bg-cream/10"
              >
                Already a partner? Sign in
              </Link>
            </div>
          </div>

          <div className="relative">
            {(() => {
              const fmtNum = (n: number) =>
                n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `${n}`;
              const fmtDeltaPct = (n: number) =>
                `${n >= 0 ? "+" : ""}${n.toFixed(n >= 10 || n <= -10 ? 0 : 1)}%`;
              const fmtDeltaPts = (n: number) =>
                `${n >= 0 ? "+" : ""}${n.toFixed(1)}pt`;

              const imp = partnerStats?.impressions.value ?? 0;
              const clk = partnerStats?.clicks.value ?? 0;
              const ctr = partnerStats?.ctr.value ?? 0;
              const impDelta = partnerStats?.impressions.deltaPct ?? 0;
              const clkDelta = partnerStats?.clicks.deltaPct ?? 0;
              const ctrDelta = partnerStats?.ctr.deltaPts ?? 0;

              const stats = [
                { k: "Impressions", v: fmtNum(imp), d: fmtDeltaPct(impDelta), up: impDelta >= 0 },
                { k: "Clicks", v: fmtNum(clk), d: fmtDeltaPct(clkDelta), up: clkDelta >= 0 },
                { k: "CTR", v: `${ctr.toFixed(1)}%`, d: fmtDeltaPts(ctrDelta), up: ctrDelta >= 0 },
              ];

              const placements = partnerStats?.placements30d ?? new Array(30).fill(0);
              const maxP = Math.max(1, ...placements);

              return (
                <>
                  <div className="absolute -left-3 -top-3 z-10 -rotate-6 rounded-full border-2 border-ink bg-gold px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-ink shadow-brut">
                    {impDelta >= 0 ? "↑" : "↓"} {fmtDeltaPct(impDelta)} MoM
                  </div>
                  <div className="rounded-2xl border-2 border-cream/30 bg-cream/[0.04] p-5 shadow-brut-lg backdrop-blur-xl">
                    <div className="flex items-center justify-between border-b-2 border-dashed border-cream/30 pb-3">
                      <span className="font-mono text-[11px] uppercase tracking-widest text-cream/70">
                        PARTNER · last 30d
                      </span>
                      <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold text-coral">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-coral motion-reduce:animate-none" />
                        LIVE
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      {stats.map((s) => {
                        const tooltipText =
                          s.k === "Impressions"
                            ? "Times your venue appeared in an itinerary or home-page recommendation."
                            : s.k === "Clicks"
                              ? "Users who tapped through to view your venue details or booking link."
                              : "Click-through rate = clicks ÷ impressions. Industry avg is ~2.5%.";
                        return (
                          <Tooltip key={s.k} delayDuration={200}>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="rounded-xl border-2 border-cream/20 bg-ink/60 p-3 text-left transition hover:border-coral/50 focus:border-coral focus:outline-none"
                              >
                                <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-cream/60">
                                  {s.k}
                                  <svg
                                    className="h-3 w-3 opacity-40"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden
                                  >
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 16v-4" />
                                    <path d="M12 8h.01" />
                                  </svg>
                                </div>
                                <div className="mt-1 font-display text-2xl font-extrabold leading-none">
                                  {s.v}
                                </div>
                                <div
                                  className={`mt-1 font-mono text-[9px] font-bold ${
                                    s.up ? "text-coral" : "text-cream/50"
                                  }`}
                                >
                                  {s.d}
                                </div>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              sideOffset={8}
                              className="max-w-[220px] border-2 border-cream/30 bg-ink px-3 py-2 text-xs text-cream shadow-brut"
                            >
                              {tooltipText}
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                    <div className="mt-4 rounded-xl border-2 border-cream/15 bg-ink/40 p-3">
                      <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-cream/60">
                        <span>Itinerary placements</span>
                        <span className="text-cream/40">30d</span>
                      </div>
                      <div className="flex h-12 items-end gap-1">
                        {placements.map((p, i) => {
                          const h = Math.max(4, Math.round((p / maxP) * 100));
                          return (
                            <div
                              key={i}
                              className={`flex-1 rounded-sm ${
                                p > 0
                                  ? "bg-gradient-to-t from-coral/40 via-coral to-gold"
                                  : "bg-cream/10"
                              }`}
                              style={{ height: `${h}%` }}
                              title={`${p} placements`}
                            />
                          );
                        })}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-cream/50">
                      <span>Verified by Confetti</span>
                      <span>◐ realtime</span>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Partner testimonials carousel + logo strip */}
        <div className="relative px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
          <Suspense fallback={null}>
            <PartnerTestimonials />
          </Suspense>
        </div>

        {/* FAQ accordion */}
        <div className="relative px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
          <Suspense fallback={null}>
            <PartnerFaqAccordion />
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
        subtitle="San Francisco · Mission → Hayes Valley → Nob Hill"
        date="Sat, 6:00p"
        guests={2}
        stops={SAMPLE_ITINERARY_STOPS}
        summary={SAMPLE_ITINERARY_SUMMARY}
      />

      {/* Scroll-triggered sticky CTA — appears after the hero is offscreen */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink bg-cream/95 backdrop-blur transition-transform duration-300 ${
          showStickyCta ? "translate-y-0" : "translate-y-full"
        }`}
        aria-hidden={!showStickyCta}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-extrabold leading-tight">
              Your whole night, planned in 60 sec.
            </p>
            <p className="truncate text-[11px] text-ink/60">Free · No signup to try</p>
          </div>
          <span onClick={() => trackCta("plan_my_night_sticky", { location: "sticky_bar" })}>
            <WizardButton
              ariaLabel="Plan my night"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border-2 border-ink bg-ink px-5 text-sm font-bold text-cream shadow-brut transition-pop hover:-translate-y-0.5"
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
        className={`relative inline-flex items-center gap-2 rounded-full border border-ink bg-ink px-3 py-1 text-gold hover:bg-cream hover:text-ink ${debugRing}`}
        data-ad-slot={slot}
      >
        <span className="rounded-sm bg-gold px-1.5 py-0.5 text-[9px] text-ink">
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
      className={`group relative inline-flex items-center gap-3 rounded-full border-2 border-gold bg-ink px-4 py-1.5 transition hover:bg-gold hover:text-ink ${debugRing}`}
      data-ad-slot={slot}
    >
      <span className="rounded-full bg-gold px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink group-hover:bg-ink group-hover:text-gold">
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
      className={`pointer-events-none absolute -top-2 -right-2 rounded-md border border-ink px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider shadow-sm transition-colors ${
        flash ? "bg-coral text-cream" : "bg-cream text-ink"
      }`}
    >
      {slot}
    </span>
  );
}
