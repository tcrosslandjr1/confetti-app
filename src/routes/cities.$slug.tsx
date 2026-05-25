import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MapPin, Sparkles, ArrowRight, Star, TrendingUp } from "lucide-react";
import { CITIES, setSelectedCity, type City } from "@/lib/cities";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/cities/$slug")({
  beforeLoad: ({ params }) => {
    const city = CITIES.find((c) => c.slug === params.slug);
    if (!city) throw notFound();
    return { city };
  },
  component: CityLandingPage,
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center bg-background p-6 text-center">
      <div>
        <h1 className="text-2xl font-bold">City not found</h1>
        <p className="mt-2 text-muted-foreground">We don’t have a guide for that city yet.</p>
        <Link to="/cities" className="mt-4 inline-block text-primary underline">Browse all cities</Link>
      </div>
    </div>
  ),
  errorComponent: () => (
    <div className="grid min-h-screen place-items-center bg-background p-6 text-center">
      <p className="text-muted-foreground">Something went wrong loading this city.</p>
    </div>
  ),
  head: ({ params }) => {
    const city = CITIES.find((c) => c.slug === params.slug);
    const name = city?.name ?? "City";
    const title = `Things to do in ${name} — Confetti`;
    const desc = `Discover the best ideas, venues and nightlife in ${name}. Curated by Confetti — plan your perfect day or night out.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
      ],
    };
  },
});

type Idea = {
  id: string;
  title: string;
  description: string;
  category: string;
  neighborhood: string | null;
  best_time: string | null;
  price_tier: number | null;
  vibe_tags: string[] | null;
  venue_hint: string | null;
  trending_score: number | null;
};

type Venue = {
  id: string;
  name: string;
  category: string | null;
  neighborhood: string | null;
  description: string | null;
  hero_image_url: string | null;
  image_url: string | null;
  price_band: string | null;
  rating: number | null;
  tags: string[] | null;
};

function CityLandingPage() {
  const { city } = Route.useRouteContext() as { city: City };

  const { data: ideas = [] } = useQuery({
    queryKey: ["city-ideas", city.name],
    queryFn: async (): Promise<Idea[]> => {
      const { data, error } = await supabase
        .from("city_ideas")
        .select("id,title,description,category,neighborhood,best_time,price_tier,vibe_tags,venue_hint,trending_score")
        .eq("city", city.name)
        .eq("published", true)
        .order("trending_score", { ascending: false, nullsFirst: false })
        .limit(12);
      if (error) throw error;
      return (data ?? []) as Idea[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: venues = [] } = useQuery({
    queryKey: ["city-venues", city.name],
    queryFn: async (): Promise<Venue[]> => {
      const { data } = await supabase
        .from("venues")
        .select("id,name,category,neighborhood,description,hero_image_url,image_url,price_band,rating,tags")
        .ilike("city", `%${city.name.replace(/,.*/, "")}%`)
        .eq("active", true)
        .order("trending_score", { ascending: false, nullsFirst: false })
        .limit(8);
      return (data ?? []) as Venue[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const handlePlanNight = () => {
    setSelectedCity(city.slug);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/40 via-background to-background">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-orange-100/30 to-transparent" />
        <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-primary">
              <MapPin className="h-3.5 w-3.5" /> {city.region}
            </div>
            <h1 className="text-balance text-5xl font-bold tracking-tight md:text-7xl">
              <span className="mr-3 inline-block">{city.emoji}</span>
              {city.name}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Your AI-curated guide to the best of {city.name}. Hand-picked venues, trending ideas,
              and perfect plans for any night out.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="min-w-48" onClick={handlePlanNight}>
                <Link to="/app/plan">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Plan my night in {city.name.split(/[,\s]/)[0]}
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="min-w-48">
                <Link to="/app/explore">Explore venues</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Top Ideas */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Top ideas in {city.name}</h2>
            <p className="mt-2 text-muted-foreground">Trending experiences our AI loves right now.</p>
          </div>
          <TrendingUp className="h-6 w-6 text-primary" />
        </div>

        {ideas.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">
            Fresh ideas for {city.name} are being curated. Check back soon.
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ideas.map((idea, i) => (
              <motion.div
                key={idea.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(i * 0.04, 0.4), duration: 0.4 }}
              >
                <Card className="group h-full p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                      {idea.category}
                    </span>
                    {idea.price_tier ? (
                      <span className="text-xs text-muted-foreground">{"$".repeat(idea.price_tier)}</span>
                    ) : null}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold leading-snug">{idea.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{idea.description}</p>
                  {(idea.neighborhood || idea.best_time) && (
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                      {idea.neighborhood && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {idea.neighborhood}
                        </span>
                      )}
                      {idea.best_time && <span>· {idea.best_time}</span>}
                    </div>
                  )}
                  {idea.vibe_tags && idea.vibe_tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {idea.vibe_tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[10px]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Curated Venues */}
      {venues.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight">Curated venues</h2>
            <p className="mt-2 text-muted-foreground">Verified spots loved by Confetti members.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {venues.map((v) => (
              <Link key={v.id} to="/venue/$id" params={{ id: v.id }} className="group">
                <Card className="h-full overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div className="aspect-[4/3] overflow-hidden bg-muted">
                    {v.hero_image_url || v.image_url ? (
                      <img
                        src={v.hero_image_url ?? v.image_url ?? ""}
                        alt={v.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-4xl">{city.emoji}</div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold leading-snug">{v.name}</h3>
                      {v.rating ? (
                        <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                          <Star className="h-3 w-3 fill-current text-amber-500" />
                          {v.rating.toFixed(1)}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {v.category}
                      {v.neighborhood ? ` · ${v.neighborhood}` : ""}
                      {v.price_band ? ` · ${v.price_band}` : ""}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <Card className="overflow-hidden bg-gradient-to-br from-primary/10 via-orange-100/40 to-background p-10">
          <h2 className="text-3xl font-bold tracking-tight">Ready to plan your {city.name} night?</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Confetti builds a personal itinerary in seconds — 2–4 stops, picked just for you.
          </p>
          <Button asChild size="lg" className="mt-6" onClick={handlePlanNight}>
            <Link to="/app/plan">
              Start planning <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </Card>

        <div className="mt-10">
          <Link to="/cities" className="text-sm text-muted-foreground hover:text-foreground">
            ← All cities
          </Link>
        </div>
      </section>
    </div>
  );
}
