import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { PartnerFaqAccordion, FAQS } from "@/components/PartnerFaqAccordion";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Confetti" },
      {
        name: "description",
        content:
          "Straight answers about Confetti. How it works, pricing, bookings, and more.",
      },
      { property: "og:title", content: "FAQ — Confetti" },
      {
        property: "og:description",
        content: "Straight answers about Confetti. How it works, pricing, bookings, and more.",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: FAQPage,
});

function FAQPage() {
  return (
    <div className="min-h-screen bg-cream text-ink">
      <div className="mx-auto max-w-5xl px-6 py-16 sm:px-8 lg:py-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-1.5 text-sm font-semibold text-ink/60 transition hover:text-coral"
          >
            <ArrowLeft className="h-4 w-4" />
            Back home
          </Link>

          <div className="mb-12">
            <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
              Frequently asked
              <span className="text-coral"> questions</span>
            </h1>
            <p className="mt-3 max-w-xl text-lg text-ink/60">
              Everything you need to know about planning with Confetti.
            </p>
          </div>

          <PartnerFaqAccordion />
        </motion.div>
      </div>
    </div>
  );
}
