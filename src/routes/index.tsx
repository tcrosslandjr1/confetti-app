import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useRef, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowUpRight, Sparkles, Star, MapPin, Clock, Car } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { TypingCounter } from "@/components/TypingCounter";
import { StepsShowcase } from "@/components/StepsShowcase";
import { OCCASIONS, SEED_IDEAS } from "@/lib/occasions";
import { Reveal } from "@/components/Reveal";
import { WizardButton } from "@/components/wizard/WizardButton";
import { QuickPicks } from "@/components/QuickPicks";
import { GatedAction } from "@/components/GatedAction";
import { logAdViewImpression, logAdClick } from "@/lib/ad-tracking";
import { useViewportImpression } from "@/hooks/useViewportImpression";

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
  { text: "kids day-out → museum + ice cream", sponsored: { brand: "MoMA Kids", cta: "Book tickets", href: "/wizard?occasion=kids-day-out&utm_source=marquee&utm_campaign=moma_kids" } },
  { text: "rooftop o'clock → sunset + spritz", sponsored: { brand: "Aperol", cta: "Find a rooftop", href: "/wizard?occasion=rooftop&utm_source=marquee&utm_campaign=aperol_spritz" } },
  { text: "noodle crawl → 3 bowls, 1 night" },
  { text: "first date energy → low-key, high spark" },
  { text: "anniversary → the spot you'll remember" },
  { text: "guys' afternoon → wings + a game" },
  { text: "birthday night → dinner, drinks, dance floor" },
  { text: "bachelorette → glam + late-night karaoke", sponsored: { brand: "Resy", cta: "Reserve the table", href: "/wizard?occasion=bachelorette&utm_source=marquee&utm_campaign=resy" } },
  { text: "proposal night → quiet view, big yes" },
  { text: "solo recharge → bookshop + a great meal" },
  { text: "double date → shared plates + a show" },
  { text: "rainy day → cozy cafés + a matinée" },
  { text: "happy hour → 2 stops, 1 hour" },
  { text: "live music → small venue, big night", sponsored: { brand: "DICE", cta: "Grab tickets", href: "/wizard?occasion=live-music&utm_source=marquee&utm_campaign=dice" } },
  { text: "art crawl → galleries + a wine bar" },
  { text: "morning hike → trail + breakfast burritos" },
  { text: "beach day → towels, tacos, sunset" },
  { text: "speakeasy night → low-lit, slow burn" },
  { text: "tasting menu → all-in, no menu peeking", sponsored: { brand: "OpenTable", cta: "Book tonight", href: "/wizard?occasion=tasting-menu&utm_source=marquee&utm_campaign=opentable" } },
  { text: "dog-friendly day → patio + park loop" },
  { text: "out-of-towner → the 4-hour highlight reel" },
];


const PROOF = [
  {
    quote: "It planned a Friday night that ended in a dive bar I’d driven past 100 times. New favorite.",
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
  { q: "Is this just a list of restaurants?", a: "Nope. It’s a full timed plan — first stop, second stop, how you get between them, what to wear, what to book. The list-of-restaurants era is over." },
  { q: "Free?", a: "Yes — three full plans a month, on the house. Plus is $8 for unlimited and the reservations vault." },
  { q: "Does it actually book stuff?", a: "It hands you straight-to-checkout links for OpenTable, Resy, Eventbrite, and rideshare deep links. One-tap, no copy/paste." },
  { q: "How does it know what we like?", a: "Tell the concierge in plain English, or paste in a Spotify playlist link, IG handle, anything. The taste profile gets sharper every plan." },
];

function Landing() {
  // Signed-in customers get the personalized portal instead of the marketing landing.
  const { user, viewAs, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (loading) return;
    if (user && viewAs === "customer") navigate({ to: "/portal" });
    else if (user && viewAs === "admin") navigate({ to: "/admin" });
  }, [user, viewAs, loading, navigate]);

  // Subtle hero parallax
  const heroBgRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = heroBgRef.current;
    if (!el) return;
    let raf = 0;
    function update() {
      const y = window.scrollY;
      if (el) el.style.transform = `translate3d(0, ${y * 0.18}px, 0)`;
      raf = 0;
    }
    function onScroll() { if (!raf) raf = requestAnimationFrame(update); }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); if (raf) cancelAnimationFrame(raf); };
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

      {/* ============================ HERO ============================ */}
      <section className="relative overflow-hidden border-b-2 border-ink">
        <div ref={heroBgRef} className="absolute inset-0 -z-20 will-change-transform">
          <div className="hero-gradient absolute inset-0" />
          <div className="grid-paper absolute inset-0 opacity-50" />
          <div className="absolute -right-24 -top-24 h-96 w-96 animate-blob bg-gradient-warm opacity-70" />
          <div className="absolute -bottom-32 -left-24 h-96 w-96 animate-blob bg-gradient-cool opacity-50" style={{ animationDelay: "-7s" }} />
        </div>

        <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-24 pt-16 sm:px-6 lg:grid-cols-12 lg:px-8 lg:pb-32 lg:pt-20">
          {/* left — type */}
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-cream/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-coral text-coral animate-dot-pulse" />
              <TypingCounter target={2847} suffix=" plans built today" className="text-[11px]" />
            </span>

            <h1 className="mt-6 font-display text-[14vw] font-extrabold leading-[0.85] tracking-[-0.04em] sm:text-[120px] lg:text-[148px]">
              Plans
              <br />
              with a <span className="font-serif italic font-normal text-coral">pulse.</span>
            </h1>

            <p className="mt-8 max-w-xl text-lg leading-snug">
              Confetti is the loud, opinionated planner. Tell it the vibe — it builds the night.
              Real stops, real timings, real reservations. <span className="font-serif italic">No more group-chat purgatory.</span>
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <WizardButton
                ariaLabel="Build my night"
                className="inline-flex h-14 items-center gap-2 rounded-full border-2 border-ink bg-ink px-7 text-base font-bold text-cream shadow-brut transition-pop hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brut-lg"
              >
                Build my night <ArrowUpRight className="h-5 w-5" />
              </WizardButton>
              <Link
                to="/how-it-works"
                className="inline-flex h-14 items-center rounded-full border-2 border-ink bg-cream px-7 text-base font-bold transition-pop hover:-translate-y-1 hover:bg-gold hover:shadow-brut"
              >
                How it works
              </Link>
              <span className="font-mono text-xs uppercase tracking-widest text-ink/60">
                no signup to try ↗
              </span>
            </div>
          </div>

          {/* right — receipt-style mock plan */}
          <div className="relative lg:col-span-5">
            <div className="absolute -left-6 -top-6 z-20 grid h-20 w-20 -rotate-12 animate-wiggle place-items-center rounded-full border-2 border-ink bg-gold text-center font-display text-xs font-extrabold uppercase leading-tight">
              vibe<br/>locked<br/>in
            </div>

            <div className="animate-float-card rounded-2xl border-2 border-ink bg-cream p-5 shadow-brut-lg">
              <div className="flex items-center justify-between border-b-2 border-dashed border-ink pb-3">
                <span className="font-mono text-[11px] uppercase tracking-widest">CONFETTI · plan #A7K2</span>
                <span className="font-mono text-[11px]">SAT · 6:00p</span>
              </div>

              <h3 className="mt-4 font-serif text-3xl italic leading-tight">
                "cute, walkable, ends with a slow drink"
              </h3>

              <div className="mt-5 space-y-3">
                {[
                  { t: "6:30", title: "Lila’s Patio", sub: "small plates · 12 min walk", chip: "RESY", color: "bg-coral", dot: "text-coral" },
                  { t: "8:15", title: "Mason St. record bar", sub: "vinyl + nat wine · 6 min walk", chip: "WALK-IN", color: "bg-purple", dot: "text-purple" },
                  { t: "10:00", title: "Aera rooftop", sub: "nightcap · 9 min Lyft", chip: "LYFT", color: "bg-gold", dot: "text-gold" },
                ].map((s, i) => (
                  <div key={s.t} className="flex items-center gap-3 rounded-xl border-2 border-ink bg-background p-3">
                    <div className={`relative grid h-14 w-14 shrink-0 place-items-center rounded-lg border-2 border-ink ${s.color} font-display text-base font-extrabold text-ink`}>
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
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest">{s.chip}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between border-t-2 border-dashed border-ink pt-3 font-mono text-[11px] uppercase tracking-widest">
                <span>3 stops · 4h · ~$92</span>
                <span className="rounded-full bg-ink px-2 py-1 text-cream">booked ✓</span>
              </div>
            </div>

            <div className="absolute -bottom-5 -right-2 z-20 -rotate-6 rounded-md border-2 border-ink bg-coral px-3 py-1 font-mono text-[11px] font-bold uppercase text-cream shadow-brut">
              feels like a friend planned it
            </div>
          </div>
        </div>
      </section>

      {/* ============================ MARQUEE ============================ */}
      <section className="border-b-2 border-ink bg-ink py-4 text-cream">
        <div className="flex overflow-hidden">
          <div className="flex shrink-0 animate-marquee items-center gap-10 whitespace-nowrap pr-10 font-display text-3xl font-extrabold uppercase tracking-tight">
            {[...topItems, ...topItems].map((m, i) => {
              const tone = i % 3 === 1 ? "font-serif italic font-normal text-gold" : i % 3 === 2 ? "text-coral" : "";
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
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-ink/60">/ the manifesto</span>
            <h2 className="mt-3 font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl">
              We are <span className="font-serif italic font-normal">tired</span> of the group chat.
            </h2>
          </Reveal>
          <Reveal className="space-y-6 text-lg leading-relaxed lg:col-span-7" delay={120}>
            <p>
              You know the loop. Someone says "we should do something." Three days pass. Yelp gets opened, then closed.
              Someone screenshots a TikTok. Friday becomes pizza on the couch. <span className="font-serif italic">Again.</span>
            </p>
            <p>
              Confetti kills that loop. One vibe in — one full evening out. Stops, times, routes, reservations,
              the dress code, the cost, the conversation starter. The whole damn night, in under a minute.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {["less scrolling", "more showing up", "chef's-kiss timing", "real reservations", "made for the way you actually go out"].map((t) => (
                <span key={t} className="rounded-full border-2 border-ink bg-cream px-3 py-1 text-sm font-semibold transition-pop hover:-translate-y-0.5 hover:bg-gold">
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
              Three steps.<br />
              <span className="font-serif italic font-normal">Zero spirals.</span>
            </h2>
            <Link to="/how-it-works" className="hidden items-center gap-1 font-mono text-xs uppercase tracking-widest underline underline-offset-4 sm:inline-flex">
              full walkthrough <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <StepsShowcase />
        </div>
      </section>

      {/* ============================ OCCASIONS BENTO ============================ */}
      <section className="relative overflow-hidden border-b-2 border-ink bg-ink text-cream">
        {/* ambient glow */}
        <div aria-hidden className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-coral/30 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-32 bottom-10 h-96 w-96 rounded-full bg-purple/30 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-cream/60">
                <Sparkles className="h-3 w-3 text-gold" /> / pick a vibe
              </span>
              <h2 className="mt-2 font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl">
                What's the <span className="font-serif italic font-normal text-gold">occasion?</span>
              </h2>
              <p className="mt-3 max-w-md font-mono text-sm text-cream/60">
                Tap any vibe — we generate a full night around it in seconds.
              </p>
            </div>
            <GatedAction to="/plan" feature="planning" className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-cream px-5 font-mono text-xs font-bold uppercase tracking-widest transition-pop hover:-translate-y-0.5 hover:bg-cream hover:text-ink">
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
                  className={`group relative flex h-48 w-[78%] shrink-0 snap-center flex-col justify-between overflow-hidden rounded-2xl border-2 border-cream/15 bg-gradient-to-br ${o.gradient} p-5 shadow-brut`}
                >
                  <div className="flex items-start justify-between">
                    <Icon className="h-6 w-6 drop-shadow" />
                    <span className="text-4xl drop-shadow-md">{o.emoji}</span>
                  </div>
                  <div>
                    <div className="font-display text-2xl font-extrabold leading-tight drop-shadow">{o.title}</div>
                    <div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-cream/85">{o.tagline}</div>
                    {ideaCount > 0 && (
                      <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-ink/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest backdrop-blur">
                        {ideaCount} idea{ideaCount === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
          <p className="text-center font-mono text-[10px] uppercase tracking-widest text-cream/50 sm:hidden">
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
                    className={`group relative flex h-full min-h-[150px] flex-col justify-between overflow-hidden rounded-2xl border-2 border-cream/15 bg-gradient-to-br ${o.gradient} p-5 shadow-brut transition-pop hover:-translate-y-1 hover:rotate-0 hover:scale-[1.02] hover:border-cream hover:shadow-brut-lg`}
                  >
                    {/* shimmer sweep on hover */}
                    <span aria-hidden className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-cream/25 to-transparent transition-transform duration-[1100ms] ease-out group-hover:translate-x-full" />
                    {/* grain */}
                    <span aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)", backgroundSize: "3px 3px" }} />

                    <div className="relative flex items-start justify-between">
                      <Icon className={`drop-shadow ${featured ? "h-7 w-7" : "h-5 w-5"}`} />
                      <span className={`drop-shadow-md transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110 ${featured ? "text-6xl" : "text-3xl"}`}>
                        {o.emoji}
                      </span>
                    </div>

                    {isPopular && (
                      <span className="absolute left-4 top-12 inline-flex items-center gap-1 rounded-full border border-ink/40 bg-ink/60 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-cream backdrop-blur">
                        <Sparkles className="h-2.5 w-2.5 text-gold" /> popular
                      </span>
                    )}

                    <div className="relative">
                      <div className={`font-display font-extrabold leading-tight drop-shadow ${featured ? "text-3xl" : "text-xl"}`}>
                        {o.title}
                      </div>
                      <div className={`mt-1 font-mono uppercase tracking-wider text-cream/85 ${featured ? "text-xs" : "text-[10px]"}`}>
                        {o.tagline}
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        {ideaCount > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-ink/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest backdrop-blur">
                            <Star className="h-2.5 w-2.5 text-gold" /> {ideaCount} idea{ideaCount === 1 ? "" : "s"}
                          </span>
                        ) : <span />}
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
              { icon: Clock, k: "timing", t: "Down to the minute.", b: "Reservations, sunset, last call — Confetti backs into the schedule so you’re never early or stranded." },
              { icon: Car, k: "routing", t: "Door to door.", b: "Walk, drive, transit, Uber, Lyft — chosen per leg. One tap launches the right app." },
              { icon: MapPin, k: "taste", t: "Knows your taste.", b: "A live taste profile that learns from chats, playlists, even pasted social posts. Skips the basics." },
            ].map((f) => (
              <div key={f.k} className="bg-cream p-8">
                <f.icon className="h-8 w-8" />
                <span className="mt-4 block font-mono text-[11px] uppercase tracking-[0.25em] text-ink/60">/ {f.k}</span>
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
            People are <span className="font-serif italic font-normal">leaving the house</span> again.
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
                    <span className="font-display text-base font-extrabold leading-tight">{p.name}</span>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-ink/60">{p.role}</span>
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

                <blockquote className="mt-5 font-serif text-2xl italic leading-snug">"{p.quote}"</blockquote>

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
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-ink/60">/ pricing</span>
            <h2 className="mt-3 font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl">
              Free to start.<br />
              <span className="font-serif italic font-normal text-coral">Plus when you're hooked.</span>
            </h2>
            <p className="mt-5 max-w-md text-lg">
              Three full plans a month, on the house. Upgrade for unlimited, the reservations vault, and a taste profile that gets sharper every week.
            </p>
            <Link to="/pricing" className="mt-7 inline-flex h-12 items-center gap-2 rounded-full border-2 border-ink bg-ink px-6 font-bold text-cream shadow-brut transition-pop hover:-translate-y-1 hover:shadow-brut-lg">
              See the tiers <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="lg:col-span-7">
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { name: "Free", price: "$0", note: "first taste", items: ["3 plans / month", "Multi-stop routing", "Save trips"], cls: "bg-cream", glow: false },
                { name: "Plus", price: "$8", note: "the upgrade", items: ["Unlimited plans", "Reservations vault", "Full taste profile"], cls: "bg-gold", glow: true },
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
                    <span className="font-mono text-[10px] uppercase tracking-widest opacity-70">/ {t.note}</span>
                  </div>
                  <div className="mt-2 font-display text-5xl font-extrabold">{t.price}<span className="font-mono text-sm font-normal">/mo</span></div>
                  <ul className="mt-6 space-y-2 text-sm">
                    {t.items.map((i) => (
                      <li key={i} className="flex gap-2"><span className="font-bold">✦</span>{i}</li>
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
              Quick<br />questions.
            </h2>
          </div>
          <div className="space-y-3 lg:col-span-8">
            {FAQS.map((f, i) => (
              <Reveal key={f.q} delay={i * 70}>
                <details className="faq-item group rounded-2xl border-2 border-ink bg-cream p-5 shadow-brut transition-pop open:bg-gold open:-translate-y-0.5 open:shadow-brut-lg [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 font-display text-xl font-extrabold">
                    {f.q}
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-ink bg-cream font-mono text-lg transition-transform duration-300 group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-4 text-base leading-relaxed" style={{ animation: "faq-open 0.32s cubic-bezier(0.22,1,0.36,1) both" }}>{f.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ BIG CTA ============================ */}
      <section className="relative overflow-hidden border-b-2 border-ink bg-coral text-cream">
        <div className="absolute -right-20 -top-20 h-72 w-72 animate-blob bg-purple/40" />
        <div className="absolute -bottom-16 -left-16 h-64 w-64 animate-blob bg-gold/60" style={{ animationDelay: "-4s" }} />
        <div className="relative mx-auto max-w-5xl px-4 py-28 text-center sm:px-6">
          <Reveal>
            <Sparkles className="mx-auto h-10 w-10" />
            <h2 className="mt-6 font-display text-7xl font-extrabold leading-[0.85] tracking-tight sm:text-[140px]">
              Stop scrolling.<br />
              <span className="font-serif italic font-normal">Start showing up.</span>
            </h2>
            <div className="mt-12 flex flex-wrap justify-center gap-4">
              <WizardButton
                ariaLabel="Build my night"
                className="inline-flex h-14 items-center gap-2 rounded-full border-2 border-cream bg-cream px-8 font-bold text-ink shadow-brut transition-pop hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brut-lg"
              >
                Build my night <ArrowUpRight className="h-5 w-5" />
              </WizardButton>
              <Link to="/features" className="inline-flex h-14 items-center rounded-full border-2 border-cream px-8 font-bold transition-pop hover:-translate-y-0.5 hover:bg-cream hover:text-ink">
                Tour the features
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================ TICKER (hover speeds up) ============================ */}
      <section className="marquee-hover border-b-2 border-ink bg-gold py-3 text-ink">
        <div className="flex overflow-hidden">
          <div className="flex shrink-0 animate-marquee gap-8 whitespace-nowrap pr-8 font-mono text-xs font-bold uppercase tracking-widest" style={{ transition: "animation-duration 0.4s ease" }}>
            {[...bottomItems, ...bottomItems, ...bottomItems].map((m, i) =>
              m.sponsored ? (
                <Link
                  key={i}
                  to={m.sponsored.href}
                  onClick={() => logAdClick({ surface: "marquee_bottom", brand: m.sponsored!.brand, occasion: m.text, href: m.sponsored!.href })}
                  className="inline-flex items-center gap-2 rounded-full border border-ink bg-ink px-3 py-1 text-gold hover:bg-cream hover:text-ink"
                >
                  <span className="rounded-sm bg-gold px-1.5 py-0.5 text-[9px] text-ink">AD · {m.sponsored.brand}</span>
                  <span>{m.text}</span>
                  <span className="underline">{m.sponsored.cta} ↗</span>
                </Link>
              ) : (
                <span key={i} className="inline-flex items-center gap-3">
                  {m.text}
                  <span className="opacity-40">/</span>
                </span>
              )
            )}
          </div>
        </div>
        <p className="mt-1 text-center font-mono text-[9px] uppercase tracking-[0.3em] text-ink/50">hover to speed it up ↗</p>
      </section>

      <SiteFooter />
    </div>
  );
}
