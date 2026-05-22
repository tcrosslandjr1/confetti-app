import { useState } from "react";
import { Plus, Minus } from "lucide-react";

export type FAQItem = {
  q: string;
  a: string;
  tag?: string;
};

export const FAQS: FAQItem[] = [
  {
    q: "What does 'free, no signup to try' actually include?",
    a: "Build a full plan end-to-end without making an account: pick your vibe, get a timed itinerary with real venues open tonight, walking + Lyft routes between stops, and one-tap booking links. You can preview everything before you ever hand over an email.",
  },
  {
    q: "What happens after the free trial?",
    a: "Nothing breaks. You keep three full plans every month on the free tier — forever. To save plans, unlock the reservations vault, earn Confetti rewards faster, and get unlimited plans, upgrade to Plus for $8/mo. No auto-charge, no surprise paywall mid-night.",
  },
  {
    q: "Is this just a list of restaurants?",
    a: "Nope. It's a full timed plan — first stop, second stop, how you get between them, what to wear, what to book. The list-of-restaurants era is over.",
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

type PartnerFaqAccordionProps = {
  items?: FAQItem[];
  title?: string;
  subtitle?: string;
};

export function PartnerFaqAccordion({
  items = FAQS,
  title = "Straight answers. No hidden fees.",
  subtitle = "Questions",
}: PartnerFaqAccordionProps) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-coral">
            {subtitle}
          </span>
          <h3 className="mt-1 font-display text-2xl font-extrabold leading-tight text-ink sm:text-3xl">
            {title}
          </h3>
        </div>
        <span className="hidden font-mono text-[11px] uppercase tracking-widest text-ink/40 sm:block">
          {items.length} topics
        </span>
      </div>

      <div className="space-y-3">
        {items.map((item, i) => {
          const isOpen = open === i;
          return (
            <div
              key={i}
              className={`rounded-xl border-2 transition ${
                isOpen
                  ? "border-coral/40 bg-coral/[0.04]"
                  : "border-ink/10 bg-white hover:border-coral/30"
              }`}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
                aria-expanded={isOpen}
              >
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 font-mono text-[11px] font-bold transition ${
                    isOpen
                      ? "border-coral bg-coral text-white"
                      : "border-ink/20 text-ink/60"
                  }`}
                  aria-hidden
                >
                  {isOpen ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                </span>
                <span className="flex-1 font-display text-base font-bold text-ink sm:text-lg">
                  {item.q}
                </span>
                {item.tag && (
                  <span className="hidden rounded-full border border-ink/10 bg-cream px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-ink/50 sm:inline-block">
                    {item.tag}
                  </span>
                )}
              </button>
              {isOpen && (
                <div className="px-5 pb-5 sm:px-6 sm:pb-6">
                  <p className="text-sm leading-relaxed text-ink/80 sm:text-base">
                    {item.a}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PartnerFaqAccordion;
