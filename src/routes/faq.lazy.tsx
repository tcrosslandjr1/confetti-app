import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, MessageCircle } from "lucide-react";

export const Route = createLazyFileRoute("/faq")({
  component: FaqPage,
});

const SECTIONS: { title: string; items: { q: string; a: string }[] }[] = [
  {
    title: "Getting Started",
    items: [
      {
        q: "What is Confetti?",
        a: "Confetti is an AI-powered dining and nightlife concierge that helps you discover perfect venues based on your mood, vibe, and preferences — then books everything for you.",
      },
      {
        q: "How does mood-based discovery work?",
        a: "Instead of scrolling through endless lists, you tell Confetti what vibe you're after — romantic, energetic, chill, celebratory — and our AI recommends curated venues and experiences that match.",
      },
      {
        q: "Is Confetti free to use?",
        a: "Yes! Discovering venues, getting recommendations, and browsing is completely free. You only pay when you book a reservation or order through a venue.",
      },
      {
        q: "What cities does Confetti cover?",
        a: "We're launching in Washington DC, with expansion to other major cities coming soon. Our AI already has data on venues worldwide.",
      },
    ],
  },
  {
    title: "Bookings & Reservations",
    items: [
      {
        q: "How do I make a reservation?",
        a: "Once you find a venue you love, tap 'Book' and select your party size, date, and time. Confetti handles the rest — you'll get a confirmation with your boarding pass.",
      },
      {
        q: "What is a Boarding Pass?",
        a: "Your Boarding Pass is a digital itinerary card for your night out. It shows your reservation details, venue info, and any pre-orders — all in one shareable card.",
      },
      {
        q: "Can I cancel or modify a booking?",
        a: "Yes — go to your bookings in the portal and you can modify or cancel. Cancellation policies vary by venue.",
      },
    ],
  },
  {
    title: "Groups & Events",
    items: [
      {
        q: "Can I plan a group outing?",
        a: "Absolutely! Create a Party Room, invite friends, and let everyone vote on vibes and venues. Confetti merges everyone's tastes to find the perfect spot.",
      },
      {
        q: "How does Vibe Vote work?",
        a: "Each group member swipes on mood cards and venue suggestions. Confetti's AI finds the sweet spot where everyone's preferences overlap.",
      },
    ],
  },
  {
    title: "For Businesses",
    items: [
      {
        q: "How do I list my venue on Confetti?",
        a: "Visit our Business portal and claim your venue. Once verified, you can manage your listing, menu, and pre-orders from the dashboard.",
      },
      {
        q: "What does it cost for venues?",
        a: "Basic listings are free. Premium features like promoted placement, AI-powered content refresh, and pre-order management are available on paid plans.",
      },
    ],
  },
];

function FaqPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="mb-12 text-center">
          <h1 className="font-display text-4xl font-bold tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="mt-3 text-muted-foreground">
            Everything you need to know about Confetti
          </p>
        </div>

        <div className="space-y-10">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h2 className="mb-4 font-display text-lg font-bold">{section.title}</h2>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <FaqItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border border-border bg-muted/30 p-8 text-center">
          <MessageCircle className="mx-auto h-8 w-8 text-primary" />
          <h3 className="mt-3 font-display text-lg font-bold">Still have questions?</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Our AI concierge is always ready to help
          </p>
          <Link
            to="/concierge"
            className="mt-4 inline-flex items-center rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-cream transition hover:opacity-90"
          >
            Chat with Confetti
          </Link>
        </div>
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen(!open)}
      className="w-full rounded-xl border border-border bg-background p-4 text-left transition hover:border-ink/30"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold">{q}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition ${open ? "rotate-180" : ""}`}
        />
      </div>
      {open && (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{a}</p>
      )}
    </button>
  );
}
