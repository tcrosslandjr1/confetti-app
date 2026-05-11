import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { GatedAction } from "@/components/GatedAction";
import { Reveal } from "@/components/Reveal";
import { Sparkles, Calendar, MapPin, Heart, Compass, Users, Wand2, Car, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — Loop" },
      { name: "description", content: "AI-planned outings, multi-stop routing, saved reservations, and a taste profile that learns what you love." },
      { property: "og:title", content: "Features — Loop" },
      { property: "og:description", content: "Everything Loop does to plan outings worth showing up for." },
    ],
  }),
  component: FeaturesPage,
});

const features = [
  { icon: Wand2, title: "AI-planned itineraries", body: "Pick a vibe — date night, kids day out, guys' night — and get a full schedule in seconds.", color: "bg-coral", tag: "01 / vibe-in" },
  { icon: Car, title: "Door-to-door routing", body: "Car, transit, walking, Uber or Lyft. Loop picks the best mode and gives you one-tap directions.", color: "bg-purple", tag: "02 / move" },
  { icon: Calendar, title: "Saved reservations", body: "Store confirmations, party size, contact info and times for every stop in one place.", color: "bg-gold", tag: "03 / locked-in" },
  { icon: Heart, title: "Taste profile", body: "Tell us what you love. We learn from your social vibe and tune every suggestion to match.", color: "bg-mint", tag: "04 / you-shaped" },
  { icon: MapPin, title: "Local discoveries", body: "Jump parks, paint nights, Home Depot kids days, hidden patios — not the same five chain restaurants.", color: "bg-coral", tag: "05 / off-menu" },
  { icon: Users, title: "For every crew", body: "Couples, families, elders, friend groups. Different ages, different energies, perfect plans.", color: "bg-purple", tag: "06 / crew-aware" },
];

function FeaturesPage() {
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

        <div className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 lg:px-8 lg:pb-28 lg:pt-20">
          <span className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-cream/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-coral" />
            / features
          </span>

          <h1 className="mt-6 font-display text-[12vw] font-extrabold leading-[0.85] tracking-[-0.04em] sm:text-[96px] lg:text-[128px]">
            Everything you'd
            <br />
            hire an EA <span className="font-serif italic font-normal text-coral">to do.</span>
          </h1>

          <p className="mt-8 max-w-2xl text-lg leading-snug">
            Loop turns "what should we do?" into a full plan — stops, timing, transit, reservations.
            <span className="font-serif italic"> The whole night, handled.</span>
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <GatedAction
              to="/plan"
              feature="planning"
              className="inline-flex h-14 items-center gap-2 rounded-full border-2 border-ink bg-ink px-7 text-base font-bold text-cream shadow-brut transition-pop hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brut-lg"
            >
              Build my night <ArrowUpRight className="h-5 w-5" />
            </GatedAction>
            <Link
              to="/how-it-works"
              className="inline-flex h-14 items-center rounded-full border-2 border-ink bg-cream px-7 text-base font-bold transition-pop hover:-translate-y-1 hover:bg-gold hover:shadow-brut"
            >
              How it works
            </Link>
          </div>
        </div>
      </section>

      {/* ============================ FEATURES GRID ============================ */}
      <section className="border-b-2 border-ink">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-12 flex items-end justify-between gap-6">
            <h2 className="font-display text-4xl font-extrabold leading-[0.95] tracking-tight sm:text-5xl">
              Six tools.<br />
              <span className="font-serif italic font-normal">One whole night.</span>
            </h2>
            <span className="hidden font-mono text-xs uppercase tracking-widest text-ink/60 sm:inline">/ what's in the box</span>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => {
              const Icon = f.icon;
              const rot = i % 2 === 0 ? "hover:-rotate-1" : "hover:rotate-1";
              return (
                <Reveal key={f.title} delay={i * 60}>
                  <div className={`group relative h-full rounded-2xl border-2 border-ink bg-cream p-6 shadow-brut transition-pop hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brut-lg ${rot}`}>
                    <div className="flex items-start justify-between">
                      <div className={`grid h-14 w-14 place-items-center rounded-xl border-2 border-ink ${f.color}`}>
                        <Icon className="h-7 w-7 text-ink" />
                      </div>
                      <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">{f.tag}</span>
                    </div>
                    <h3 className="mt-5 font-display text-2xl font-extrabold leading-tight">{f.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink/70">{f.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================ CTA ============================ */}
      <section className="relative overflow-hidden border-b-2 border-ink bg-ink text-cream">
        <div className="absolute -right-24 -top-24 h-72 w-72 animate-blob bg-gradient-warm opacity-30" />
        <div className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6">
          <Compass className="mx-auto h-10 w-10 text-coral" />
          <h2 className="mt-6 font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl">
            Ready to try it?<br />
            <span className="font-serif italic font-normal text-gold">Plan in under a minute.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-cream/80">No signup to try. Three full plans free, every month.</p>
          <GatedAction
            to="/plan"
            feature="planning"
            className="mt-8 inline-flex h-14 items-center gap-2 rounded-full border-2 border-cream bg-coral px-7 text-base font-bold text-ink shadow-brut transition-pop hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brut-lg"
          >
            Launch the app <ArrowUpRight className="h-5 w-5" />
          </GatedAction>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
