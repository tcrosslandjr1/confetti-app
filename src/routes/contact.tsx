import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/Reveal";
import {
  Mail,
  MessageCircle,
  Sparkles,
  Send,
  Instagram,
  Twitter,
  MapPin,
  Clock,
  ArrowUpRight,
  PartyPopper,
} from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Confetti" },
      {
        name: "description",
        content:
          "Get in touch with the Confetti team. Feedback, partnerships, press — we read every message.",
      },
      { property: "og:title", content: "Contact — Confetti" },
      { property: "og:description", content: "Send us a note. We read every message." },
    ],
  }),
  component: ContactPage,
});

const TOPICS = [
  { label: "Feedback", color: "bg-coral" },
  { label: "Partnership", color: "bg-purple" },
  { label: "Press", color: "bg-gold" },
  { label: "A vibe to plan", color: "bg-mint" },
];

const CHANNELS = [
  {
    icon: Mail,
    label: "Email",
    value: "hello@confetti.app",
    href: "mailto:hello@confetti.app",
    color: "bg-coral",
    rot: "-rotate-1",
  },
  {
    icon: Instagram,
    label: "Instagram",
    value: "@confetti.app",
    href: "https://instagram.com",
    color: "bg-purple",
    rot: "rotate-1",
  },
  {
    icon: Twitter,
    label: "Twitter / X",
    value: "@confettiapp",
    href: "https://twitter.com",
    color: "bg-gold",
    rot: "-rotate-1",
  },
];

function ContactPage() {
  const [sent, setSent] = useState(false);
  const [topic, setTopic] = useState<string>("Feedback");
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
    function onScroll() {
      if (!raf) raf = requestAnimationFrame(update);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="min-h-screen bg-cream text-ink">
      <SiteHeader />

      {/* HERO */}
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

        <div className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 lg:px-8 lg:pb-28 lg:pt-20">
          <span className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-cream/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-coral" /> SAY HI
          </span>
          <h1 className="mt-6 font-display text-[12vw] font-extrabold leading-[0.85] tracking-[-0.04em] sm:text-[96px] lg:text-[128px]">
            Drop us a
            <br />
            <span className="font-serif italic font-normal text-coral">line.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-snug">
            Feedback, partnership ideas, press, or a vibe we should plan for.
            <span className="font-serif italic"> We read every message.</span>
          </p>
        </div>
      </section>

      {/* CONTACT GRID */}
      <section className="border-b-2 border-ink">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-12 lg:px-8">
          {/* LEFT: channels + info */}
          <div className="space-y-6 lg:col-span-5">
            <Reveal>
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-ink/60">
                / channels
              </span>
              <h2 className="mt-3 font-display text-4xl font-extrabold leading-[0.95] tracking-tight sm:text-5xl">
                Pick your <span className="font-serif italic font-normal">channel.</span>
              </h2>
            </Reveal>

            <div className="space-y-4">
              {CHANNELS.map((c, i) => {
                const Icon = c.icon;
                return (
                  <Reveal key={c.label} delay={i * 80}>
                    <a
                      href={c.href}
                      className={`group flex items-center gap-4 rounded-2xl border-2 border-ink bg-cream p-4 shadow-brut transition-pop hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brut-lg ${c.rot} hover:rotate-0`}
                    >
                      <div
                        className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl border-2 border-ink ${c.color}`}
                      >
                        <Icon className="h-5 w-5 text-ink" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-[10px] uppercase tracking-widest text-ink/60">
                          {c.label}
                        </p>
                        <p className="truncate font-display text-lg font-extrabold">{c.value}</p>
                      </div>
                      <ArrowUpRight className="h-5 w-5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </a>
                  </Reveal>
                );
              })}
            </div>

            <Reveal delay={240}>
              <div className="rounded-2xl border-2 border-ink bg-cream p-5 shadow-brut">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border-2 border-ink bg-mint">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-display text-base font-extrabold">Replies within 24h</p>
                    <p className="text-sm text-ink/70">
                      Faster on weekdays. We're a small team and we actually read it.
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border-2 border-ink bg-gold">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-display text-base font-extrabold">Built remote</p>
                    <p className="text-sm text-ink/70">
                      Brooklyn · Lisbon · Mexico City — and wherever there's a good patio.
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          {/* RIGHT: form */}
          <div className="lg:col-span-7">
            <Reveal delay={120}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSent(true);
                }}
                className="relative rounded-3xl border-2 border-ink bg-cream p-6 shadow-brut-lg sm:p-8"
              >
                <div className="absolute -right-3 -top-3 hidden rounded-full border-2 border-ink bg-coral px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest sm:block">
                  / write us
                </div>

                {sent ? (
                  <div className="py-16 text-center">
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border-2 border-ink bg-coral shadow-brut">
                      <PartyPopper className="h-7 w-7" />
                    </div>
                    <h3 className="mt-6 font-display text-4xl font-extrabold tracking-tight">
                      Got it — <span className="font-serif italic font-normal">thanks.</span>
                    </h3>
                    <p className="mx-auto mt-3 max-w-sm text-base text-ink/70">
                      We'll be in touch within 24 hours. In the meantime, go plan something.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSent(false)}
                      className="mt-8 inline-flex h-11 items-center gap-2 rounded-full border-2 border-ink bg-cream px-5 text-sm font-bold shadow-brut transition-pop hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brut-lg"
                    >
                      Send another
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* topic chips */}
                    <div>
                      <label className="font-mono text-[10px] uppercase tracking-widest text-ink/60">
                        / topic
                      </label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {TOPICS.map((t) => {
                          const active = topic === t.label;
                          return (
                            <button
                              key={t.label}
                              type="button"
                              onClick={() => setTopic(t.label)}
                              className={`rounded-full border-2 border-ink px-3 py-1.5 text-xs font-bold transition-pop ${
                                active
                                  ? `${t.color} shadow-brut -translate-y-0.5`
                                  : "bg-cream hover:-translate-y-0.5 hover:shadow-brut"
                              }`}
                            >
                              {t.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="font-mono text-[10px] uppercase tracking-widest text-ink/60">
                          / name
                        </label>
                        <input
                          required
                          maxLength={100}
                          placeholder="Your name"
                          className="mt-1 h-12 w-full rounded-xl border-2 border-ink bg-cream px-3 text-sm font-medium placeholder:text-ink/40 focus:outline-none focus:ring-0 focus:shadow-brut focus:-translate-y-0.5 transition-pop"
                        />
                      </div>
                      <div>
                        <label className="font-mono text-[10px] uppercase tracking-widest text-ink/60">
                          / email
                        </label>
                        <input
                          required
                          type="email"
                          maxLength={255}
                          placeholder="you@somewhere.com"
                          className="mt-1 h-12 w-full rounded-xl border-2 border-ink bg-cream px-3 text-sm font-medium placeholder:text-ink/40 focus:outline-none focus:ring-0 focus:shadow-brut focus:-translate-y-0.5 transition-pop"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-mono text-[10px] uppercase tracking-widest text-ink/60">
                        / message
                      </label>
                      <textarea
                        required
                        rows={6}
                        maxLength={1000}
                        placeholder="Tell us what's on your mind…"
                        className="mt-1 w-full rounded-xl border-2 border-ink bg-cream p-3 text-sm font-medium placeholder:text-ink/40 focus:outline-none focus:ring-0 focus:shadow-brut focus:-translate-y-0.5 transition-pop"
                      />
                    </div>

                    <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="flex items-center gap-2 text-xs text-ink/60">
                        <MessageCircle className="h-3.5 w-3.5" />
                        We reply within 24 hours.
                      </p>
                      <button
                        type="submit"
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-full border-2 border-ink bg-coral px-6 text-sm font-bold text-ink shadow-brut transition-pop hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brut-lg"
                      >
                        Send message <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </Reveal>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
