import { Sparkles, Heart, Utensils, Music, Cake } from "lucide-react";

/**
 * Date Night — 4-step planning framework. Mirrors the agent prompt in
 * src/lib/agents/date-night-presets.ts → buildDateNightCulturalPrompt()
 * and docs/agents/confetti-date-night-cultural-framework.md.
 */
export function DateNightCulturalFlow() {
  return (
    <section className="border-b border-border bg-muted/30">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-display text-sm font-bold">The best date night plan</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Step
            n={1}
            title="What kind of couple?"
            icon={<Heart className="h-4 w-4" />}
            rows={[
              ["Shared culture", "Build around a familiar cultural anchor."],
              ["Mixed / multiracial", "Do a shared-exchange date."],
            ]}
          />
          <Step
            n={2}
            title="Shared-culture anchor"
            icon={<Utensils className="h-4 w-4" />}
            rows={[
              ["Food", "From that culture"],
              ["Activity", "Music, dancing, comedy, art, or lounge"],
              ["Close", "Dessert, tea, drinks, or walk"],
            ]}
          />
          <Step
            n={3}
            title="Mixed: shared exchange"
            icon={<Music className="h-4 w-4" />}
            rows={[
              ["Person A", "Picks dinner"],
              ["Person B", "Picks the activity"],
              ["Both", "Add songs for the ride/walk"],
              ["Close", "Dessert or late-night drinks"],
            ]}
          />
          <Step
            n={4}
            title="Choose the final plan"
            icon={<Cake className="h-4 w-4" />}
            rows={[
              ["Shared", "Cultural dinner + romantic activity + dessert"],
              ["Mixed", "Two-culture dinner/activity swap + dessert"],
            ]}
          />
        </div>
      </div>
    </section>
  );
}

function Step({
  n,
  title,
  icon,
  rows,
}: {
  n: number;
  title: string;
  icon: React.ReactNode;
  rows: [string, string][];
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
          {n}
        </span>
        <div className="flex items-center gap-1.5 text-foreground">
          {icon}
          <span className="font-display text-sm font-bold">{title}</span>
        </div>
      </div>
      <ul className="mt-3 space-y-2">
        {rows.map(([k, v]) => (
          <li key={k} className="text-xs">
            <p className="font-semibold text-foreground">{k}</p>
            <p className="text-muted-foreground">{v}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
