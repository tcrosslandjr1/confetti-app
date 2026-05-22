import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Bookmark,
  CalendarPlus,
  Clock,
  DollarSign,
  Heart,
  Loader2,
  RotateCw,
  Sparkles,
  X,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { GirlsNightCulturalFlow } from "@/components/GirlsNightCulturalFlow";
import { GuysNightCulturalFlow } from "@/components/GuysNightCulturalFlow";
import { DateNightCulturalFlow } from "@/components/DateNightCulturalFlow";
import { supabase } from "@/integrations/supabase/client";
import { buildAndSaveItinerary } from "@/lib/itineraries";
import { getOccasion, getSeedIdeas, type Idea, type IdeaFormat } from "@/lib/occasions";

export const Route = createFileRoute("/ideas/$slug")({
  head: ({ params }) => {
    const o = getOccasion(params.slug);
    const title = o ? `${o.title} ideas — Confetti` : "Ideas — Confetti";
    const desc = o
      ? `Swipeable outing ideas for ${o.title.toLowerCase()}. ${o.tagline}.`
      : "Personalized outing ideas.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
      ],
    };
  },
  component: IdeasPage,
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center p-6 text-center">
      <div>
        <h1 className="font-display text-3xl font-bold">Occasion not found</h1>
        <Link to="/" className="mt-4 inline-block text-primary underline">
          Back home
        </Link>
      </div>
    </div>
  ),
});

const FORMAT_LABELS: Record<IdeaFormat, { name: string; sub: string }> = {
  quick: { name: "Quick", sub: "One thing per card" },
  bundle: { name: "Bundle", sub: "Dinner + activity + nightcap" },
  full: { name: "Full", sub: "Plan, cost, what to wear" },
};

const FALLBACK_TEMPLATES = [
  {
    title: "Neighborhood tasting crawl",
    hook: "Pick three walkable spots and turn tiny bites into the whole outing.",
    description:
      "Choose one compact neighborhood, then sample a signature bite, a drink, and something sweet across three stops. Keep it loose, local, and easy to bail or extend.",
    vibeTags: ["walkable", "foodie", "low-pressure"],
    estCost: "$$",
    timeOfDay: "Evening",
    duration: "3 hours",
  },
  {
    title: "Free calendar surprise",
    hook: "Let the town calendar pick the weird little thing you’d usually miss.",
    description:
      "Check the local parks, library, museum, or downtown calendar and choose the most oddly specific free event happening soon. Add coffee or dessert nearby to make it feel intentional.",
    vibeTags: ["budget-friendly", "spontaneous", "local"],
    estCost: "$",
    timeOfDay: "Afternoon",
    duration: "2 hours",
  },
  {
    title: "Hands-on workshop date",
    hook: "Make something imperfect together, then toast the attempt.",
    description:
      "Book a pottery, candle, cooking, floral, or paint class that matches the group’s energy. Finish with one nearby stop where everyone can compare results.",
    vibeTags: ["creative", "hands-on", "memorable"],
    estCost: "$$",
    timeOfDay: "Evening",
    duration: "2-4 hours",
  },
  {
    title: "Scenic snack mission",
    hook: "Grab the best portable snack in town and eat it somewhere with a view.",
    description:
      "Pick up pastries, tacos, sandwiches, or milkshakes from a beloved local counter, then head to a riverwalk, overlook, garden, or quiet park bench.",
    vibeTags: ["easy", "outdoors", "charming"],
    estCost: "$",
    timeOfDay: "All day",
    duration: "90 minutes",
  },
] as const;

function fallbackIdeas(slug: string, format: IdeaFormat, excludeTitles: string[]): Idea[] {
  const excluded = new Set(excludeTitles.map((title) => title.toLowerCase()));
  return FALLBACK_TEMPLATES.filter((template) => !excluded.has(template.title.toLowerCase()))
    .slice(0, 3)
    .map((template, n) => ({
      ...template,
      vibeTags: [...template.vibeTags],
      id: `${slug}-fallback-${Date.now()}-${n}`,
      source: "ai" as const,
      steps:
        format === "quick"
          ? []
          : [
              { label: "Start", detail: template.hook },
              { label: "Main move", detail: template.description },
              {
                label: "Close",
                detail: "Add one nearby low-effort stop if the group wants to keep going.",
              },
            ],
      whatToWear:
        format === "full" ? "Comfortable but photo-ready; choose shoes you can walk in." : "",
      conversationStarter:
        format === "full" ? "What’s the most underrated place within 20 minutes of here?" : "",
      imagePrompt: `${template.title} for ${slug.replaceAll("-", " ")}`,
    }));
}

function IdeasPage() {
  const { slug } = Route.useParams();
  const occasion = getOccasion(slug);
  if (!occasion) throw notFound();

  const [format, setFormat] = useState<IdeaFormat>("quick");
  const [ideas, setIdeas] = useState<Idea[]>(() => getSeedIdeas(slug));
  const [index, setIndex] = useState(0);
  const [saved, setSaved] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(false);
  const [planning, setPlanning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function buildDay(idea: Idea) {
    setError(null);
    setPlanning(idea.id);
    try {
      const { id } = await buildAndSaveItinerary({
        occasion: occasion!.title,
        vibe: occasion!.tagline,
        occasionSlug: occasion!.slug,
        seedIdea: {
          title: idea.title,
          hook: idea.hook,
          description: idea.description,
          vibeTags: idea.vibeTags,
        },
      });
      void navigate({ to: "/trips/$id", params: { id } });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPlanning(null);
    }
  }

  // Load saved from localStorage
  useEffect(() => {
    const raw = localStorage.getItem(`confetti:saved:${slug}`);
    if (raw)
      try {
        setSaved(JSON.parse(raw));
      } catch {
        /* ignore */
      }
  }, [slug]);

  useEffect(() => {
    localStorage.setItem(`confetti:saved:${slug}`, JSON.stringify(saved));
  }, [saved, slug]);

  // Reset deck when format or slug changes
  useEffect(() => {
    setIdeas(getSeedIdeas(slug));
    setIndex(0);
    setError(null);
  }, [slug, format]);

  const current = ideas[index];
  const remaining = ideas.length - index;

  async function generateMore({ showNew = false }: { showNew?: boolean } = {}) {
    const firstNewIndex = ideas.length;
    setLoading(true);
    setError(null);
    try {
      const { loadPrefs, tasteSummary } = await import("@/lib/taste");
      const prefs = await loadPrefs();
      const { data, error } = await supabase.functions.invoke("generate-ideas", {
        body: {
          occasion: occasion!.title,
          vibe: occasion!.tagline,
          format,
          count: 6,
          excludeTitles: ideas.map((i) => i.title),
          tasteSummary: tasteSummary(prefs),
        },
      });
      if (error) throw error;
      const newOnes: Idea[] = (data?.ideas ?? []).map(
        (i: Omit<Idea, "id" | "source">, n: number) => ({
          ...i,
          id: `${slug}-ai-${Date.now()}-${n}`,
          source: "ai" as const,
        }),
      );
      if (newOnes.length === 0) throw new Error("No ideas returned. Try again.");
      setIdeas((prev) => [...prev, ...newOnes]);
      if (showNew) setIndex(firstNewIndex);
    } catch (e) {
      const fallback = fallbackIdeas(
        slug,
        format,
        ideas.map((i) => i.title),
      );
      if (fallback.length) {
        setIdeas((prev) => [...prev, ...fallback]);
        if (showNew) setIndex(firstNewIndex);
        setError(null);
      } else {
        setError((e as Error).message);
      }
    } finally {
      setLoading(false);
    }
  }

  function skip() {
    if (current) setIndex((i) => i + 1);
  }
  function save() {
    if (!current) return;
    setSaved((s) => (s.find((x) => x.id === current.id) ? s : [...s, current]));
    setIndex((i) => i + 1);
  }
  function reset() {
    setIndex(0);
  }

  // Auto-generate when running low
  useEffect(() => {
    if (remaining === 1 && !loading && ideas.length < 24) void generateMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Occasion banner */}
      <section className={`bg-gradient-to-br ${occasion.gradient} text-white`}>
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-8 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="grid h-10 w-10 place-items-center rounded-full bg-white/20 backdrop-blur transition-colors hover:bg-white/30"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Occasion</p>
            <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">
              {occasion.title} <span className="opacity-80">{occasion.emoji}</span>
            </h1>
            <p className="text-sm opacity-90">{occasion.tagline}</p>
          </div>
        </div>
      </section>

      {/* Format toggle */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex gap-2">
            {(Object.keys(FORMAT_LABELS) as IdeaFormat[]).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  format === f
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
                title={FORMAT_LABELS[f].sub}
              >
                {FORMAT_LABELS[f].name}
              </button>
            ))}
            <span className="hidden self-center pl-2 text-xs text-muted-foreground sm:inline">
              {FORMAT_LABELS[format].sub}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Bookmark className="h-4 w-4" /> {saved.length} saved
          </div>
        </div>
      </section>

      {slug === "girls-night" && <GirlsNightCulturalFlow />}
      {slug === "guys-night" && <GuysNightCulturalFlow />}
      {slug === "date-night" && <DateNightCulturalFlow />}



      {/* Stack */}
      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
        <div className="relative mx-auto flex w-full max-w-xl flex-col items-center">
          {current ? (
            <FlashCard idea={current} format={format} occasionGradient={occasion.gradient} />
          ) : (
            <EmptyDeck
              onReset={reset}
              onGenerate={() => generateMore({ showNew: true })}
              loading={loading}
            />
          )}

          {current && (
            <div className="mt-6 flex items-center gap-4">
              <button
                onClick={skip}
                className="grid h-16 w-16 place-items-center rounded-full border border-border bg-card text-muted-foreground shadow-card transition-pop hover:scale-110 hover:text-destructive"
                aria-label="Skip"
              >
                <X className="h-7 w-7" />
              </button>
              <button
                onClick={() => generateMore({ showNew: true })}
                disabled={loading}
                className="grid h-12 w-12 place-items-center rounded-full bg-muted text-foreground transition-pop hover:scale-110 disabled:opacity-50"
                aria-label="Generate more"
                title="Generate more with AI"
              >
                {loading ? (
                  <Sparkles className="h-5 w-5 animate-pulse" />
                ) : (
                  <Sparkles className="h-5 w-5" />
                )}
              </button>
              <button
                onClick={save}
                className="grid h-16 w-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-pop transition-pop hover:scale-110"
                aria-label="Save"
              >
                <Heart className="h-7 w-7" />
              </button>
            </div>
          )}

          {current && (
            <button
              onClick={() => buildDay(current)}
              disabled={planning === current.id}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background shadow-card transition-pop hover:scale-105 disabled:opacity-60"
            >
              {planning === current.id ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Building your day...
                </>
              ) : (
                <>
                  <CalendarPlus className="h-4 w-4" /> Build full day from this
                </>
              )}
            </button>
          )}

          {error && (
            <p className="mt-4 rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            {remaining > 0 ? `${remaining} card${remaining === 1 ? "" : "s"} left` : "Deck empty"}
            {current?.source === "ai" && " · ✨ AI"}
          </p>
        </div>

        {/* Saved sidebar */}
        <aside className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-display text-lg font-bold">Saved ideas</h3>
          {saved.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Swipe right on a card or tap the heart to save it here.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {saved.map((s) => (
                <li key={s.id} className="rounded-lg bg-background p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">{s.title}</p>
                    <button
                      onClick={() => setSaved((arr) => arr.filter((x) => x.id !== s.id))}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Remove"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {s.estCost} · {s.timeOfDay}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </section>
    </div>
  );
}

function FlashCard({
  idea,
  format,
  occasionGradient,
}: {
  idea: Idea;
  format: IdeaFormat;
  occasionGradient: string;
}) {
  return (
    <article className="w-full overflow-hidden rounded-3xl bg-card shadow-pop">
      <div className={`relative h-48 bg-gradient-to-br ${occasionGradient} p-6 text-white`}>
        <div className="absolute right-4 top-4 flex gap-1">
          {idea.vibeTags.slice(0, 3).map((t) => (
            <span
              key={t}
              className="rounded-full bg-white/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur"
            >
              {t}
            </span>
          ))}
        </div>
        <div className="absolute bottom-6 left-6 right-6">
          <h2 className="font-display text-2xl font-bold leading-tight sm:text-3xl">
            {idea.title}
          </h2>
          <p className="mt-2 text-sm opacity-90">{idea.hook}</p>
        </div>
      </div>

      <div className="space-y-4 p-6">
        <div className="flex flex-wrap gap-3 text-xs font-medium text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5" /> {idea.estCost}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {idea.timeOfDay} · {idea.duration}
          </span>
        </div>

        <p className="text-sm text-foreground">{idea.description}</p>

        {format !== "quick" && idea.steps.length > 0 && (
          <div className="rounded-xl bg-muted p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Timeline
            </p>
            <ol className="space-y-2">
              {idea.steps.map((s, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="font-semibold text-primary">{i + 1}.</span>
                  <span>
                    <span className="font-semibold">{s.label}</span> —{" "}
                    <span className="text-muted-foreground">{s.detail}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {format === "full" && (idea.whatToWear || idea.conversationStarter) && (
          <div className="grid gap-3 sm:grid-cols-2">
            {idea.whatToWear && (
              <div className="rounded-xl border border-border p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  What to wear
                </p>
                <p className="mt-1 text-sm">{idea.whatToWear}</p>
              </div>
            )}
            {idea.conversationStarter && (
              <div className="rounded-xl border border-border p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Conversation starter
                </p>
                <p className="mt-1 text-sm italic">"{idea.conversationStarter}"</p>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function EmptyDeck({
  onReset,
  onGenerate,
  loading,
}: {
  onReset: () => void;
  onGenerate: () => void;
  loading: boolean;
}) {
  return (
    <div className="grid w-full place-items-center rounded-3xl border-2 border-dashed border-border bg-card p-10 text-center">
      <Sparkles className="h-10 w-10 text-primary" />
      <h3 className="mt-4 font-display text-xl font-bold">You've seen 'em all</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Generate a fresh batch with AI, or restart the deck.
      </p>
      <div className="mt-5 flex gap-3">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold"
        >
          <RotateCw className="h-4 w-4" /> Restart
        </button>
        <button
          onClick={onGenerate}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-pop disabled:opacity-60"
        >
          <Sparkles className="h-4 w-4" /> {loading ? "Generating..." : "Generate more"}
        </button>
      </div>
    </div>
  );
}
