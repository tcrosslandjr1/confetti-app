import { Link } from "@tanstack/react-router";
import { Instagram, Twitter, Youtube, Music2, Github, ChevronDown } from "lucide-react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import * as React from "react";
import { openCookieSettings } from "@/components/CookieConsent";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const navCols = [
  {
    title: "Plan",
    items: [
      { to: "/plan", label: "Build my night" },
      { to: "/discover", label: "Discover venues" },
      { to: "/events", label: "What's on" },
      { to: "/portal/bookings", label: "My bookings" },
    ],
  },
  {
    title: "Product",
    items: [
      { to: "/features", label: "Features" },
      { to: "/how-it-works", label: "How it works" },
      { to: "/pricing", label: "Pricing" },
      { to: "/auth", label: "Sign in" },
    ],
  },
  {
    title: "Company",
    items: [
      { to: "/about", label: "About" },
      { to: "/contact", label: "Contact" },
      { to: "/advertise", label: "For venues" },
    ],
  },
] as const;

const legalLinks = [
  { to: "/privacy", label: "Privacy" },
  { to: "/terms", label: "Terms" },
  { to: "/data-terms", label: "Data terms" },
] as const;

const socials = [
  {
    Icon: Instagram,
    label: "Instagram",
    href: "https://instagram.com",
    hover: "hover:bg-coral  hover:text-cream hover:border-coral",
  },
  {
    Icon: Twitter,
    label: "Twitter",
    href: "https://twitter.com",
    hover: "hover:bg-teal   hover:text-ink   hover:border-teal",
  },
  {
    Icon: Music2,
    label: "TikTok",
    href: "https://tiktok.com",
    hover: "hover:bg-pink   hover:text-cream hover:border-pink",
  },
  {
    Icon: Youtube,
    label: "YouTube",
    href: "https://youtube.com",
    hover: "hover:bg-gold   hover:text-ink   hover:border-gold",
  },
  {
    Icon: Github,
    label: "GitHub",
    href: "https://github.com",
    hover: "hover:bg-purple hover:text-cream hover:border-purple",
  },
];

function FooterAccordionItem({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AccordionPrimitive.Item value={title} className="border-b border-cream/15">
      <AccordionPrimitive.Header className="flex">
        <AccordionPrimitive.Trigger
          className={cn(
            "flex flex-1 items-center justify-between py-4 text-left",
            "font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-cream/50",
            "hover:text-coral transition-colors"
          )}
        >
          <span>/ {title}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-cream/50 transition-transform duration-200 [&[data-state=open]]:rotate-180" />
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Header>
      <AccordionPrimitive.Content
        className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
      >
        <div className="pb-4 pt-0">{children}</div>
      </AccordionPrimitive.Content>
    </AccordionPrimitive.Item>
  );
}

function LinkList({ items }: { items: readonly { to: string; label: string }[] }) {
  return (
    <ul className="space-y-3 font-display text-lg font-bold">
      {items.map((i) => (
        <li key={i.label}>
          <Link to={i.to} className="hover:text-coral">
            {i.label} <span className="text-cream/30">↗</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function SiteFooter() {
  const isMobile = useIsMobile();

  return (
    <footer className="relative bg-ink text-cream">
      {/* wavy divider — cream → ink */}
      <div aria-hidden className="block leading-[0]">
        <svg
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          className="block h-16 w-full sm:h-24 md:h-28"
        >
          <path
            d="M0,64 C160,112 320,16 540,40 C760,64 880,128 1080,96 C1240,72 1360,32 1440,56 L1440,120 L0,120 Z"
            fill="var(--ink)"
          />
          <path
            d="M0,64 C160,112 320,16 540,40 C760,64 880,128 1080,96 C1240,72 1360,32 1440,56"
            fill="none"
            stroke="var(--ink)"
            strokeWidth="2"
          />
          <path
            d="M0,80 C200,40 360,120 600,80 C820,44 980,8 1200,48 C1320,72 1400,56 1440,72"
            fill="none"
            stroke="var(--coral)"
            strokeWidth="2"
            opacity="0.7"
            strokeDasharray="2 8"
          />
        </svg>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        {/* desktop grid */}
        <div className="hidden gap-12 md:grid md:grid-cols-4">
          <div>
            <Link to="/" className="flex items-baseline gap-1">
              <span className="font-display text-3xl font-extrabold tracking-tight">confetti</span>
              <span className="font-serif text-3xl italic text-coral">.</span>
            </Link>
            <p className="mt-4 max-w-xs font-serif text-lg italic leading-snug">
              The loud, opinionated planner for outings worth showing up for.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {socials.map(({ Icon, label, href, hover }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className={`inline-grid h-11 w-11 place-items-center rounded-full border-2 border-cream/30 text-cream transition-pop hover:-translate-y-0.5 ${hover}`}
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
          {navCols.map((col) => (
            <div key={col.title}>
              <h5 className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-cream/50">
                / {col.title}
              </h5>
              <div className="mt-4">
                <LinkList items={col.items} />
              </div>
            </div>
          ))}
        </div>

        {/* mobile accordion */}
        <div className="md:hidden">
          <Link to="/" className="flex items-baseline gap-1">
            <span className="font-display text-3xl font-extrabold tracking-tight">confetti</span>
            <span className="font-serif text-3xl italic text-coral">.</span>
          </Link>
          <p className="mt-4 max-w-xs font-serif text-lg italic leading-snug">
            The loud, opinionated planner for outings worth showing up for.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {socials.map(({ Icon, label, href, hover }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className={`inline-grid h-11 w-11 place-items-center rounded-full border-2 border-cream/30 text-cream transition-pop hover:-translate-y-0.5 ${hover}`}
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>

          <AccordionPrimitive.Root type="multiple" className="mt-8">
            {navCols.map((col) => (
              <FooterAccordionItem key={col.title} title={col.title}>
                <LinkList items={col.items} />
              </FooterAccordionItem>
            ))}
          </AccordionPrimitive.Root>

          {/* legal links always visible on mobile */}
          <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 border-t border-cream/15 pt-4 font-mono text-[11px] font-bold uppercase tracking-widest text-cream/50">
            {legalLinks.map((l) => (
              <Link key={l.label} to={l.to} className="hover:text-coral">
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-16 border-t-2 border-cream/15 pt-6">
          <h2 className="font-display text-[18vw] font-extrabold leading-none tracking-tighter sm:text-[160px]">
            confetti<span className="text-coral">.</span>
          </h2>
        </div>

        <div className="mt-6 flex flex-col items-start justify-between gap-3 font-mono text-[11px] uppercase tracking-widest text-cream/50 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Confetti — plans with a pulse.</p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={openCookieSettings}
              className="uppercase tracking-widest hover:text-coral"
            >
              Cookie settings
            </button>
            <p>made loud, on purpose.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
