import { createFileRoute } from "@tanstack/react-router";
import { Download, MapPin } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";

const cityGuides = [
  {
    city: "Washington DC",
    file: "DC_CheapEats_Food_Guide.xlsx",
    description: "76 restaurants — cheap eats & mid-range spots across the DMV",
    venues: 76,
    emoji: "🏛️",
  },
  {
    city: "New York City",
    file: "NYC_SexyDatesNYC_Guide.xlsx",
    description: "38 curated date night, group, and nightlife venues",
    venues: 38,
    emoji: "🗽",
  },
  {
    city: "Los Angeles",
    file: "LA_LaLaGuide_Spots.xlsx",
    description: "27 dining & nightlife spots across LA",
    venues: 27,
    emoji: "🌴",
  },
  {
    city: "Cincinnati",
    file: "Cincinnati_DateNight_Guide.xlsx",
    description: "41 date night, group, and nightlife venues",
    venues: 41,
    emoji: "🎵",
  },
];

function getDownloadUrl(filename: string) {
  const { data } = supabase.storage.from("venue-guides").getPublicUrl(filename);
  return data.publicUrl;
}

export const Route = createFileRoute("/guides")({
  head: () => ({
    meta: [
      { title: "City Guides — Confetti" },
      {
        name: "description",
        content:
          "Download curated venue guides for Washington DC, New York City, Los Angeles, and Cincinnati.",
      },
      { property: "og:title", content: "City Guides — Confetti" },
      {
        property: "og:description",
        content:
          "Curated venue collections by city — organized by occasion.",
      },
    ],
  }),
  component: CityGuidesPage,
});

function CityGuidesPage() {
  return (
    <div className="min-h-screen bg-cream text-ink">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-white px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink/70">
            <MapPin className="h-3 w-3 text-coral" />
            Downloadable
          </span>
          <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            City Guides
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-base text-ink/70">
            Curated venue collections by city — organized by occasion.
          </p>
        </div>

        {/* Grid */}
        <div className="grid gap-6 sm:grid-cols-2">
          {cityGuides.map((guide) => (
            <div
              key={guide.city}
              className="group relative flex flex-col rounded-2xl border-2 border-ink bg-white p-6 shadow-brut transition-pop hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brut-lg"
            >
              {/* Top row: emoji + city */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-ink bg-cream text-xl">
                    {guide.emoji}
                  </span>
                  <div>
                    <h2 className="font-display text-lg font-bold tracking-tight">
                      {guide.city}
                    </h2>
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-widest text-coral">
                      <MapPin className="h-3 w-3" />
                      {guide.venues} venues
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="mt-4 flex-1 text-sm leading-relaxed text-ink/70">
                {guide.description}
              </p>

              {/* Download button */}
              <a
                href={getDownloadUrl(guide.file)}
                download={guide.file}
                className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-full border-2 border-ink bg-ink px-5 font-mono text-xs font-bold uppercase tracking-widest text-cream shadow-brut transition-pop hover:bg-ink/90 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              >
                <Download className="h-4 w-4" />
                Download guide
              </a>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <p className="mt-10 text-center text-xs text-ink/50">
          Guides are updated monthly. Want your city added?{" "}
          <a href="mailto:hello@confettiplan.com" className="underline hover:text-coral">
            Reach out
          </a>
          .
        </p>
      </main>

      <div className="mt-auto">
        <SiteFooter />
      </div>
    </div>
  );
}
