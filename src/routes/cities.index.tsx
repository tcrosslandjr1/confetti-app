import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { CitySearch } from "@/components/CitySearch";

export const Route = createFileRoute("/cities/")({
  component: CitiesIndex,
  head: () => {
    const title = "Explore cities — Confetti";
    const desc = `Confetti curates the best ideas, venues and nightlife in 50+ cities worldwide. Find your next night out.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
});

function CitiesIndex() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/40 via-background to-background">
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <MapPin className="h-3.5 w-3.5" /> 50+ cities
          </div>
          <h1 className="text-balance text-5xl font-bold tracking-tight md:text-6xl">
            Explore Confetti cities
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Search, filter, and jump straight into curated ideas, trending venues, and ready-to-go plans.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="mt-10"
        >
          <CitySearch />
        </motion.div>
      </section>
    </div>
  );
}
