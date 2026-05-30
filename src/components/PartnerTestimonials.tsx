import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

type Testimonial = {
  quote: string;
  name: string;
  role: string;
  venue: string;
  city: string;
  metric: string;
  initials: string;
  accent: "coral" | "gold" | "purple";
};

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Confetti put us in front of the exact crowd we'd been begging Instagram to find. Friday placements paid for the whole month in three weeks.",
    name: "Maya Ortiz",
    role: "GM",
    venue: "Lila's Patio",
    city: "Mission, SF",
    metric: "+38% Friday covers",
    initials: "MO",
    accent: "coral",
  },
  {
    quote:
      "We claimed the listing in five minutes. By the next weekend we were on three itineraries with people already walking through the door asking for the cocktail menu by name.",
    name: "Devon Reyes",
    role: "Owner",
    venue: "Mason St. Record Bar",
    city: "Hayes Valley, SF",
    metric: "3.1× ROAS in week 1",
    initials: "DR",
    accent: "gold",
  },
  {
    quote:
      "The dashboard is the first time I've actually trusted ad numbers. Impressions tie to seated guests — not vanity clicks.",
    name: "Priya Anand",
    role: "Marketing Lead",
    venue: "The Saratoga",
    city: "Tenderloin, SF",
    metric: "7.4% CTR, verified",
    initials: "PA",
    accent: "purple",
  },
  {
    quote:
      "We paused for a slow week, turned it back on Thursday. No contracts, no rep calls, no nonsense. Just bookings.",
    name: "Jules Tanaka",
    role: "Beverage Director",
    venue: "Noon Coffee Bar",
    city: "Nob Hill, SF",
    metric: "+22% weekday traffic",
    initials: "JT",
    accent: "coral",
  },
];

const LOGOS: { name: string; font: string; weight: string; italic?: boolean }[] = [
  { name: "Lila's Patio", font: "serif", weight: "700", italic: true },
  { name: "MASON ST.", font: "ui-monospace, monospace", weight: "700" },
  { name: "Saratoga", font: "serif", weight: "600", italic: true },
  { name: "noon", font: "system-ui, sans-serif", weight: "800" },
  { name: "GROVE & VINE", font: "ui-monospace, monospace", weight: "600" },
  { name: "Hana Omakase", font: "serif", weight: "500", italic: true },
  { name: "TIDELINE", font: "system-ui, sans-serif", weight: "900" },
  { name: "Casa Lupita", font: "serif", weight: "700" },
];

const ACCENT_CLASSES: Record<Testimonial["accent"], string> = {
  coral: "bg-coral text-cream",
  gold: "bg-gold text-cream",
  purple: "bg-purple text-cream",
};

export function PartnerTestimonials() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = TESTIMONIALS.length;
  const trackRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);
  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    if (paused) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, 6500);
    return () => window.clearInterval(id);
  }, [paused, count]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      next();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      prev();
    }
  };

  const touchX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current == null) return;
    const dx = (e.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
    if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
    touchX.current = null;
  };

  return (
    <section
      aria-label="What partners say about Confetti"
      className="relative mx-auto mt-14 max-w-5xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="mb-4 flex items-end justify-between gap-4 px-1">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-cream/60">
            Partners say
          </span>
          <h3 className="mt-1 font-display text-2xl font-extrabold leading-tight text-cream sm:text-3xl">
            From the people running the rooms.
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prev}
            aria-label="Previous testimonial"
            className="grid h-10 w-10 place-items-center rounded-full border-2 border-cream/40 bg-cream/5 text-cream transition hover:-translate-y-0.5 hover:border-coral hover:bg-coral hover:text-cream"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next testimonial"
            className="grid h-10 w-10 place-items-center rounded-full border-2 border-cream/40 bg-cream/5 text-cream transition hover:-translate-y-0.5 hover:border-coral hover:bg-coral hover:text-cream"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        className="relative overflow-hidden rounded-2xl border-2 border-cream/25 bg-cream/[0.04] shadow-brut-lg backdrop-blur-xl focus-within:border-coral/60"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        role="region"
        aria-roledescription="carousel"
        aria-live="polite"
      >
        <div
          ref={trackRef}
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {TESTIMONIALS.map((t, i) => (
            <article
              key={t.name}
              className="w-full shrink-0 grow-0 basis-full p-6 sm:p-10"
              aria-hidden={i !== index}
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
            >
              <Quote className="h-8 w-8 text-coral" aria-hidden />
              <blockquote className="mt-4 font-display text-xl font-extrabold leading-snug text-cream sm:text-2xl lg:text-3xl">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span
                    className={`grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 border-ink font-mono text-xs font-bold shadow-brut ${ACCENT_CLASSES[t.accent]}`}
                    aria-hidden
                  >
                    {t.initials}
                  </span>
                  <div className="min-w-0">
                    <div className="font-display text-sm font-extrabold text-cream">
                      {t.name}
                      <span className="text-cream/60"> · {t.role}</span>
                    </div>
                    <div className="font-mono text-[11px] uppercase tracking-widest text-cream/60">
                      {t.venue} — {t.city}
                    </div>
                  </div>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border-2 border-cream/30 bg-ink/40 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest text-coral">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-coral motion-reduce:animate-none" />
                  {t.metric}
                </span>
              </div>
            </article>
          ))}
        </div>

        <div className="absolute inset-x-0 bottom-0 h-1 bg-cream/10">
          <div
            key={`${index}-${paused}`}
            className="confetti-progress-bar h-full bg-gradient-to-r from-coral to-gold"
            style={{
              width: "100%",
              transformOrigin: "left center",
              animation: paused ? "none" : "confetti-progress 6.5s linear forwards",
            }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2" role="tablist">
        {TESTIMONIALS.map((t, i) => (
          <button
            key={t.name}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Go to testimonial ${i + 1}`}
            onClick={() => goTo(i)}
            className={`h-2 rounded-full transition-all ${
              i === index ? "w-8 bg-coral" : "w-2 bg-cream/30 hover:bg-cream/60"
            }`}
          />
        ))}
      </div>

      <div className="mt-10 rounded-2xl border-2 border-dashed border-cream/20 bg-cream/[0.02] px-4 py-5">
        <div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.3em] text-cream/50">
          <span>Now featured in itineraries</span>
          <span>+ 240 more</span>
        </div>
        <div
          className="group/marquee relative overflow-hidden"
          style={{
            maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
          }}
        >
          <div className="flex w-max animate-confetti-marquee items-center gap-12 whitespace-nowrap pr-12 group-hover/marquee:[animation-play-state:paused]">
            {[...LOGOS, ...LOGOS].map((logo, i) => (
              <span
                key={`${logo.name}-${i}`}
                className="select-none text-2xl leading-none text-cream/70 transition hover:text-cream"
                style={{
                  fontFamily: logo.font,
                  fontWeight: logo.weight,
                  fontStyle: logo.italic ? "italic" : "normal",
                  letterSpacing: logo.font.includes("monospace") ? "0.12em" : "-0.01em",
                }}
              >
                {logo.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes confetti-progress {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes confetti-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .animate-confetti-marquee {
          animation: confetti-marquee 38s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-confetti-marquee,
          .confetti-progress-bar {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </section>
  );
}

export default PartnerTestimonials;
