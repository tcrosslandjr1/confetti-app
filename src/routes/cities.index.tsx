import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { CITIES } from "@/lib/cities";

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
  const us = CITIES.filter((c) =>
    /^(DC|Manhattan|LA|Cook|Miami|Bay|Metro ATL|Puget|Music|Clark|Harris|Shelby|East TN|Hamilton|Great Smokies|Maricopa|Travis|Mile|Suffolk|Delaware|Orleans|SoCal|Multnomah|Lowcountry)/.test(
      c.region,
    ),
  );
  const intl = CITIES.filter((c) => !us.includes(c));

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
            Pick a city to see curated ideas, trending venues, and ready-to-go plans.
          </p>
        </motion.div>

        <CityGroup title="United States" cities={us} />
        <CityGroup title="International" cities={intl} />
      </section>
    </div>
  );
}

function CityGroup({ title, cities }: { title: string; cities: typeof CITIES }) {
  return (
    <div className="mt-14">
      <h2 className="mb-5 text-2xl font-bold tracking-tight">{title}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {cities.map((c, i) => (
          <motion.div
            key={c.slug}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: Math.min(i * 0.02, 0.3), duration: 0.3 }}
          >
            <Link
              to="/cities/$slug"
              params={{ slug: c.slug }}
              className="flex h-full flex-col rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <span className="text-3xl">{c.emoji}</span>
              <span className="mt-2 font-semibold leading-tight">{c.name}</span>
              <span className="mt-0.5 text-xs text-muted-foreground">{c.region}</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
