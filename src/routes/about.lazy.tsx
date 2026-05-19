import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/Reveal";
import { ArrowUpRight, Sparkles, Heart, Users, Compass, Coffee } from "lucide-react";

export const Route = createLazyFileRoute("/about")({
  component: AboutPage,
});

const VALUES = [
    {
        icon: Heart,
        title: "Show up.",
        body: "The best memories happen IRL. Our job is to remove every reason to bail.",
        color: "bg-coral",
    },
    {
        icon: Compass,
        title: "Off the same five.",
        body: "We surface the patio, the paint night, the dive — not the same chain restaurant.",
        color: "bg-purple",
    },
    {
        icon: Users,
        title: "Match the crew.",
        body: "Different ages, different energies. The plan bends to the people.",
        color: "bg-gold",
    },
    {
        icon: Coffee,
        title: "Built in the open.",
        body: "Small team, loud opinions, fast iterations. Tell us what to plan next.",
        color: "bg-mint",
    },
];

const TEAM = [
    {
        name: "Mara Lin",
        role: "Co-founder · Product",
        bio: "Ex-design lead. Believes a good Friday saves a bad week.",
        initials: "ML",
        color: "bg-coral",
        rot: "-rotate-2",
    },
    {
        name: "Devin Ortiz",
        role: "Co-founder · Engineering",
        bio: "Built routing for two delivery apps. Now routes humans to dinner.",
        initials: "DO",
        color: "bg-purple",
        rot: "rotate-1",
    },
    {
        name: "Priya Shah",
        role: "Head of Taste",
        bio: "Restaurant critic turned curator. Knows where the regulars actually sit.",
        initials: "PS",
        color: "bg-gold",
        rot: "-rotate-1",
    },
    {
        name: "Theo Walker",
        role: "Engineering",
        bio: "Maps nerd. Has opinions about transfers, transit, and the perfect 9-min walk.",
        initials: "TW",
        color: "bg-mint",
        rot: "rotate-2",
    },
];

function AboutPage() {
    const heroBgRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        const el = heroBgRef.current;
        if (!el)
            return;
        let raf = 0;
        function update() {
            const y = window.scrollY;
            if (el)
                el.style.transform = `translate3d(0, ${y * 0.18}px, 0)`;
            raf = 0;
        }
        function onScroll() {
            if (!raf)
                raf = requestAnimationFrame(update);
        }
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => {
            window.removeEventListener("scroll", onScroll);
            if (raf)
                cancelAnimationFrame(raf);
        };
    }, []);
    return (<div className="min-h-screen bg-cream text-ink">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden border-b-2 border-ink">
        <div ref={heroBgRef} className="absolute inset-0 -z-20 will-change-transform">
          <div className="hero-gradient absolute inset-0"/>
          <div className="grid-paper absolute inset-0 opacity-50"/>
          <div className="absolute -right-24 -top-24 h-96 w-96 animate-blob bg-gradient-warm opacity-70"/>
          <div className="absolute -bottom-32 -left-24 h-96 w-96 animate-blob bg-gradient-cool opacity-50" style={{ animationDelay: "-7s" }}/>
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 lg:px-8 lg:pb-28 lg:pt-20">
          <span className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-cream/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-coral"/> ABOUT CONFETTI
          </span>
          <h1 className="mt-6 font-display text-[12vw] font-extrabold leading-[0.85] tracking-[-0.04em] sm:text-[96px] lg:text-[128px]">
            We believe in
            <br />
            <span className="font-serif italic font-normal text-coral">going out.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-snug">
            Confetti started with one frustration: it's harder to decide what to do than to actually
            do it.
            <span className="font-serif italic"> We built the fix.</span>
          </p>
        </div>
      </section>

      {/* STORY */}
      <section className="border-b-2 border-ink">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-12 lg:px-8">
          <Reveal className="lg:col-span-5">
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-ink/60">
              / the story
            </span>
            <h2 className="mt-3 font-display text-4xl font-extrabold leading-[0.95] tracking-tight sm:text-5xl">
              The couch was <span className="font-serif italic font-normal">winning.</span>
            </h2>
          </Reveal>
          <Reveal className="space-y-5 text-lg leading-relaxed lg:col-span-7" delay={120}>
            <p>Group chats stall. Tabs pile up. Saturday becomes another night on the couch.</p>
            <p>
              So we built a planner that does the messy part — picking the spots, timing the day,
              sorting the route, holding the reservations — and leaves you with the fun part:{" "}
              <span className="font-serif italic">showing up.</span>
            </p>
            <p>
              We design for every kind of outing. Date night. Kids' day out. Meeting the in-laws. A
              guys' afternoon at the range. Sunday with the elders. The plan should match the
              people.
            </p>
          </Reveal>
        </div>
      </section>

      {/* VALUES */}
      <section className="border-b-2 border-ink bg-cream/60">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-end justify-between gap-6">
            <h2 className="font-display text-4xl font-extrabold leading-[0.95] tracking-tight sm:text-5xl">
              What we <span className="font-serif italic font-normal">stand for.</span>
            </h2>
            <span className="hidden font-mono text-xs uppercase tracking-widest text-ink/60 sm:inline">
              / four rules
            </span>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v, i) => {
            const Icon = v.icon;
            const rot = i % 2 === 0 ? "hover:-rotate-1" : "hover:rotate-1";
            return (<Reveal key={v.title} delay={i * 60}>
                  <div className={`h-full rounded-2xl border-2 border-ink bg-cream p-6 shadow-brut transition-pop hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brut-lg ${rot}`}>
                    <div className={`grid h-12 w-12 place-items-center rounded-xl border-2 border-ink ${v.color}`}>
                      <Icon className="h-6 w-6 text-ink"/>
                    </div>
                    <h3 className="mt-5 font-display text-2xl font-extrabold leading-tight">
                      {v.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink/70">{v.body}</p>
                  </div>
                </Reveal>);
        })}
          </div>
        </div>
      </section>

      {/* MEET THE TEAM */}
      <section className="border-b-2 border-ink">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-end justify-between gap-6">
            <h2 className="font-display text-4xl font-extrabold leading-[0.95] tracking-tight sm:text-5xl">
              Meet the <span className="font-serif italic font-normal text-coral">team.</span>
            </h2>
            <span className="hidden font-mono text-xs uppercase tracking-widest text-ink/60 sm:inline">
              / small + loud
            </span>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TEAM.map((t, i) => (<Reveal key={t.name} delay={i * 60}>
                <div className={`group h-full rounded-2xl border-2 border-ink bg-cream p-6 shadow-brut transition-pop hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brut-lg ${t.rot} hover:rotate-0`}>
                  <div className={`grid h-20 w-20 place-items-center rounded-2xl border-2 border-ink ${t.color} font-display text-2xl font-extrabold`}>
                    {t.initials}
                  </div>
                  <h3 className="mt-5 font-display text-xl font-extrabold leading-tight">
                    {t.name}
                  </h3>
                  <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-ink/60">
                    {t.role}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-ink/70">{t.bio}</p>
                </div>
              </Reveal>))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-b-2 border-ink bg-ink text-cream">
        <div className="absolute -right-24 -top-24 h-72 w-72 animate-blob bg-gradient-warm opacity-30"/>
        <div className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6">
          <h2 className="font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl">
            Got a vibe we should plan for?
            <br />
            <span className="font-serif italic font-normal text-gold">Tell us.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-cream/80">
            We're building this in the open and we read everything.
          </p>
          <Link to="/contact" className="mt-8 inline-flex h-14 items-center gap-2 rounded-full border-2 border-cream bg-coral px-7 text-base font-bold text-ink shadow-brut transition-pop hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brut-lg">
            Say hi <ArrowUpRight className="h-5 w-5"/>
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>);
}
