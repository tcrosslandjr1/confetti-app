import { useState } from "react";
import { Plus, Minus } from "lucide-react";

type FAQItem = {
  q: string;
  a: string;
  tag?: string;
};

const FAQS: FAQItem[] = [
  {
    q: "How much does it cost to get my venue on Confetti?",
    a:
      "Claiming and verifying your listing is free — always. If you want promoted placement in our AI-generated itineraries, you can boost individual stops with Confetti credits (our reward currency) or purchase a monthly Boost Pass. You only pay when you choose to promote; there are no contracts, setup fees, or minimum spends.",
    tag: "Pricing",
  },
  {
    q: "What does 'verified' actually mean?",
    a:
      "Verified means our team confirms your business name, address, hours, and a real photo or video walkthrough. It usually takes 1-2 business days once you submit your claim. Verified venues get a badge on their listing and are prioritized by the itinerary planner.",
    tag: "Verification",
  },
  {
    q: "How fast will I see results after boosting a stop?",
    a:
      "Boosted stops enter the planner's rotation within minutes. Most partners see their first Confetti-driven table within 24-48 hours. The dashboard updates in real time so you can watch impressions turn into seated guests.",
    tag: "Turnaround",
  },
  {
    q: "Can I pause or cancel anytime?",
    a:
      "Yes. There are no contracts. Pause a boost with one tap; cancel a Boost Pass at any time and keep your verified listing. If you cancel mid-month, we prorate any unused days to your next billing cycle or back to your card.",
    tag: "Pricing",
  },
  {
    q: "Do I need to change my menu or offer discounts?",
    a:
      "Nope. Confetti plans around what you already do. If you want to run a special (e.g. a Confetti-exclusive cocktail), you can add it as a Partner Deal — but it's completely optional.",
    tag: "Verification",
  },
  {
    q: "What cities does Confetti operate in?",
    a:
      "We're live in San Francisco, Los Angeles, New York, and Chicago. We're actively expanding — if your city isn't on the list yet, claim your listing anyway and we'll notify you the moment we flip the switch.",
    tag: "Turnaround",
  },
];

export function PartnerFaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-cream/60">
            Questions
          </span>
          <h3 className="mt-1 font-display text-2xl font-extrabold leading-tight text-cream sm:text-3xl">
            Straight answers. No hidden fees.
          </h3>
        </div>
        <span className="hidden font-mono text-[11px] uppercase tracking-widest text-cream/40 sm:block">
          {FAQS.length} topics
        </span>
      </div>

      <div className="space-y-3">
        {FAQS.map((item, i) => {
          const isOpen = open === i;
          return (
            <div
              key={i}
              className={`rounded-xl border-2 transition ${
                isOpen
                  ? "border-coral/50 bg-cream/[0.06]"
                  : "border-cream/15 bg-cream/[0.03] hover:border-cream/40"
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
                      ? "border-coral bg-coral text-ink"
                      : "border-cream/30 text-cream/70"
                  }`}
                  aria-hidden
                >
                  {isOpen ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                </span>
                <span className="flex-1 font-display text-base font-bold text-cream sm:text-lg">
                  {item.q}
                </span>
                {item.tag && (
                  <span className="hidden rounded-full border-2 border-cream/20 bg-ink/40 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-cream/60 sm:inline-block">
                    {item.tag}
                  </span>
                )}
              </button>
              {isOpen && (
                <div className="px-5 pb-5 sm:px-6 sm:pb-6">
                  <p className="text-sm leading-relaxed text-cream/80 sm:text-base">
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
