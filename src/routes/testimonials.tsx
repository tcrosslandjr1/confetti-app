import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Marquee } from "@/components/ui/3d-testimonails";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/testimonials")({
  head: () => ({
    meta: [
      { title: "Testimonials — Loop" },
      {
        name: "description",
        content:
          "Real plans, real nights, real reviews from people who use Loop to actually go out.",
      },
      { property: "og:title", content: "Testimonials — Loop" },
      { property: "og:description", content: "What people say after Loop plans their night." },
    ],
  }),
  component: TestimonialsPage,
});

type Testimonial = {
  name: string;
  username: string;
  body: string;
  img: string;
  country: string;
};

const fallbackTestimonials: Testimonial[] = [
  {
    name: "Ava Green",
    username: "@ava",
    body: "Loop killed our group-chat purgatory. Friday plans in 30 seconds.",
    img: "https://randomuser.me/api/portraits/women/32.jpg",
    country: "🇦🇺 Sydney",
  },
  {
    name: "Ana Miller",
    username: "@ana",
    body: "I'm the planner friend. This out-planned me.",
    img: "https://randomuser.me/api/portraits/women/68.jpg",
    country: "🇩🇪 Berlin",
  },
  {
    name: "Mateo Rossi",
    username: "@mat",
    body: "Booked a date night dive bar I'd driven past 100 times. Chef's kiss.",
    img: "https://randomuser.me/api/portraits/men/51.jpg",
    country: "🇮🇹 Milan",
  },
  {
    name: "Maya Patel",
    username: "@maya",
    body: "Kids day-out: museum + ice cream + a nap. Saved my Saturday.",
    img: "https://randomuser.me/api/portraits/women/53.jpg",
    country: "🇮🇳 Mumbai",
  },
  {
    name: "Noah Smith",
    username: "@noah",
    body: "The routing alone is worth it. One-tap directions between every stop.",
    img: "https://randomuser.me/api/portraits/men/33.jpg",
    country: "🇺🇸 Brooklyn",
  },
  {
    name: "Lucas Stone",
    username: "@luc",
    body: "Used it for a bachelorette. Glam dinner → karaoke → 2am pizza. Perfect.",
    img: "https://randomuser.me/api/portraits/men/22.jpg",
    country: "🇫🇷 Paris",
  },
  {
    name: "Haruto Sato",
    username: "@haru",
    body: "Out-of-towner mode: 4 hours, 3 stops, every single one a banger.",
    img: "https://randomuser.me/api/portraits/men/85.jpg",
    country: "🇯🇵 Tokyo",
  },
  {
    name: "Emma Lee",
    username: "@emma",
    body: "It feels like a friend planned it. The good friend.",
    img: "https://randomuser.me/api/portraits/women/45.jpg",
    country: "🇨🇦 Toronto",
  },
  {
    name: "Carlos Ray",
    username: "@carl",
    body: "First date energy: low-key, high spark. Loop nailed the vibe.",
    img: "https://randomuser.me/api/portraits/men/61.jpg",
    country: "🇪🇸 Madrid",
  },
];

function TestimonialCard({ img, name, username, body, country }: (typeof testimonials)[number]) {
  return (
    <Card className="w-72 border-2 border-ink bg-cream shadow-brut">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-ink">
            <AvatarImage src={img} alt={name} />
            <AvatarFallback>{name[0]}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 truncate font-display text-sm font-bold text-ink">
              {name} <span className="text-xs">{country}</span>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-ink/60">
              {username}
            </div>
          </div>
        </div>
        <p className="mt-3 text-sm leading-snug text-ink/80">{body}</p>
      </CardContent>
    </Card>
  );
}

function TestimonialsPage() {
  return (
    <div className="min-h-screen bg-cream text-ink">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden border-b-2 border-ink">
        <div className="hero-gradient absolute inset-0 -z-20" />
        <div className="grid-paper absolute inset-0 -z-20 opacity-50" />
        <div className="absolute -right-24 -top-24 -z-20 h-96 w-96 animate-blob bg-gradient-warm opacity-70" />

        <div className="mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 lg:px-8 lg:pb-20 lg:pt-20">
          <span className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-cream/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-coral" /> / receipts
          </span>
          <h1 className="mt-6 font-display text-[12vw] font-extrabold leading-[0.85] tracking-[-0.04em] sm:text-[88px] lg:text-[120px]">
            Plans worth
            <br />
            <span className="font-serif italic font-normal text-coral">talking about.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-snug">
            Real nights, real reviews. Here's what people say after Loop plans their evening.
          </p>
        </div>
      </section>

      {/* 3D MARQUEE */}
      <section className="relative overflow-hidden border-b-2 border-ink bg-ink py-20">
        <div
          className="relative mx-auto flex h-[640px] max-w-7xl items-center justify-center gap-4 overflow-hidden"
          style={{ perspective: "300px" }}
        >
          <div
            className="flex flex-row gap-4"
            style={{
              transform:
                "translateX(0) translateY(0) translateZ(-50px) rotateX(15deg) rotateY(-10deg) rotateZ(15deg)",
            }}
          >
            <Marquee vertical pauseOnHover className="[--duration:40s]">
              {testimonials.map((t) => (
                <TestimonialCard key={`a-${t.username}`} {...t} />
              ))}
            </Marquee>
            <Marquee vertical reverse pauseOnHover className="[--duration:50s]">
              {testimonials.map((t) => (
                <TestimonialCard key={`b-${t.username}`} {...t} />
              ))}
            </Marquee>
            <Marquee vertical pauseOnHover className="[--duration:45s]">
              {testimonials.map((t) => (
                <TestimonialCard key={`c-${t.username}`} {...t} />
              ))}
            </Marquee>
            <Marquee vertical reverse pauseOnHover className="[--duration:55s]">
              {testimonials.map((t) => (
                <TestimonialCard key={`d-${t.username}`} {...t} />
              ))}
            </Marquee>
          </div>

          {/* Gradient overlays */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-ink to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-ink to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-ink to-transparent" />
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
