import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { ArrowUpRight, Sparkles, Star, MapPin, Clock, Car } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { TypingCounter } from "@/components/TypingCounter";
import { StepsShowcase } from "@/components/StepsShowcase";
import { OCCASIONS } from "@/lib/occasions";
import { Reveal } from "@/components/Reveal";
import { WizardButton } from "@/components/wizard/WizardButton";
import { QuickPicks } from "@/components/QuickPicks";

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

const MARQUEE = [
  "date night ✦",
  "girls trip ✦",
  "Sunday slow ✦",
  "in-laws weekend ✦",
  "kids day-out ✦",
  "rooftop o'clock ✦",
  "noodle crawl ✦",
  "first date energy ✦",
  "anniversary ✦",
  "guys' afternoon ✦",
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
              <Link
                to="/plan"
                className="inline-flex h-14 items-center gap-2 rounded-full border-2 border-ink bg-ink px-7 text-base font-bold text-cream shadow-brut transition-pop hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brut-lg"
              >
                Build my night <ArrowUpRight className="h-5 w-5" />
              </Link>
              <Link
                to="/how-it-works"
                className="inline-flex h-14 items-center rounded-full border-2 border-ink bg-cream px-7 text-base font-bold transition-pop hover:bg-gold"
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
          <div className="flex shrink-0 animate-marquee gap-10 whitespace-nowrap pr-10 font-display text-3xl font-extrabold uppercase tracking-tight">
            {[...MARQUEE, ...MARQUEE].map((m, i) => (
              <span key={i} className={i % 3 === 1 ? "font-serif italic font-normal text-gold" : i % 3 === 2 ? "text-coral" : ""}>
                {m}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ MANIFESTO / WHY ============================ */}
      <section className="border-b-2 border-ink">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-12 lg:px-8">
          <div className="lg:col-span-5">
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-ink/60">/ the manifesto</span>
            <h2 className="mt-3 font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl">
              We are <span className="font-serif italic font-normal">tired</span> of the group chat.
            </h2>
          </div>
          <div className="space-y-6 text-lg leading-relaxed lg:col-span-7">
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
                <span key={t} className="rounded-full border-2 border-ink bg-cream px-3 py-1 text-sm font-semibold">
                  {t}
                </span>
              ))}
            </div>
          </div>
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

      {/* ============================ OCCASIONS GRID ============================ */}
      <section className="border-b-2 border-ink bg-ink text-cream">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-cream/60">/ pick a vibe</span>
              <h2 className="mt-2 font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl">
                What's the <span className="font-serif italic font-normal text-gold">occasion?</span>
              </h2>
            </div>
            <Link to="/plan" className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-cream px-5 font-mono text-xs font-bold uppercase tracking-widest transition-pop hover:bg-cream hover:text-ink">
              skip — just plan something <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-12 -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 xl:grid-cols-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {OCCASIONS.map((o, i) => {
              const Icon = o.icon;
              const glows = ["glow-coral", "glow-gold", "glow-purple", "glow-teal", "glow-pink"];
              const glow = glows[i % glows.length];
              const rot = (i % 4 - 1.5) * 0.4;
              return (
                <div
                  key={o.slug}
                  className="w-[78%] shrink-0 snap-center sm:w-auto sm:shrink"
                  style={{ transform: `rotate(${rot}deg)` }}
                >
                  <Link
                    to="/ideas/$slug"
                    params={{ slug: o.slug }}
                    className={`group tilt-3d grain ${glow} relative flex h-44 flex-col justify-between overflow-hidden rounded-2xl border-2 border-cream/15 bg-cream/[0.03] p-5 hover:border-cream hover:bg-cream hover:text-ink`}
                  >
                    <div className="flex items-start justify-between">
                      <Icon className="h-6 w-6" />
                      <span className="text-3xl">{o.emoji}</span>
                    </div>
                    <div>
                      <div className="font-display text-2xl font-extrabold leading-tight">{o.title}</div>
                      <div className="mt-1 font-mono text-[11px] uppercase tracking-wider opacity-70">{o.tagline}</div>
                    </div>
                    <ArrowUpRight className="absolute right-4 top-4 h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-widest text-cream/50 sm:hidden">
            ← swipe vibes →
          </p>
        </div>
      </section>

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
                { name: "Free", price: "$0", note: "first taste", items: ["3 plans / month", "Multi-stop routing", "Save trips"], cls: "bg-cream" },
                { name: "Plus", price: "$8", note: "the upgrade", items: ["Unlimited plans", "Reservations vault", "Full taste profile"], cls: "bg-gold" },
              ].map((t) => (
                <div key={t.name} className="flex flex-col rounded-3xl border-2 border-ink p-6 shadow-brut transition-pop hover:-translate-y-1 hover:shadow-brut-lg" style={{ background: `var(--${t.cls === "bg-gold" ? "gold" : "cream"})` }}>
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
            {FAQS.map((f) => (
              <details key={f.q} className="group rounded-2xl border-2 border-ink bg-cream p-5 shadow-brut transition-pop open:bg-gold [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between gap-4 font-display text-xl font-extrabold">
                  {f.q}
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-ink bg-cream font-mono text-lg transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 text-base leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ BIG CTA ============================ */}
      <section className="relative overflow-hidden border-b-2 border-ink bg-coral text-cream">
        <div className="absolute -right-20 -top-20 h-72 w-72 animate-blob bg-purple/40" />
        <div className="absolute -bottom-16 -left-16 h-64 w-64 animate-blob bg-gold/60" style={{ animationDelay: "-4s" }} />
        <div className="relative mx-auto max-w-5xl px-4 py-28 text-center sm:px-6">
          <Sparkles className="mx-auto h-10 w-10" />
          <h2 className="mt-6 font-display text-7xl font-extrabold leading-[0.85] tracking-tight sm:text-[140px]">
            Stop scrolling.<br />
            <span className="font-serif italic font-normal">Start showing up.</span>
          </h2>
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <Link to="/plan" className="inline-flex h-14 items-center gap-2 rounded-full border-2 border-cream bg-cream px-8 font-bold text-ink shadow-brut transition-pop hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brut-lg">
              Build my night <ArrowUpRight className="h-5 w-5" />
            </Link>
            <Link to="/features" className="inline-flex h-14 items-center rounded-full border-2 border-cream px-8 font-bold transition-pop hover:bg-cream hover:text-ink">
              Tour the features
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
