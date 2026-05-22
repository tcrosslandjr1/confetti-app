import { Sparkles, Users, Utensils, Trophy, Pizza } from "lucide-react";

/**
 * Guys Night — 4-step planning framework. Mirrors the agent prompt in
 * src/lib/agents/guys-night-presets.ts → buildGuysNightCulturalPrompt()
 * and docs/agents/confetti-guys-night-cultural-framework.md.
 */
export function GuysNightCulturalFlow() {
  return (
    <section className="border-b border-border bg-muted/30">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-display text-sm font-bold">The best guys' night out plan</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Step
            n={1}
            title="Know the group"
            icon={<Users className="h-4 w-4" />}
            rows={[
              ["Shared culture", "Build around that culture's food and social style."],
              ["Mixed culture", "Each guy contributes one stop, song, or challenge."],
            ]}
          />
          <Step
            n={2}
            title="Pick the anchor"
            icon={<Utensils className="h-4 w-4" />}
            rows={[
              ["Food", "BBQ, tacos, wings, KBBQ, Caribbean, Indian, soul food, seafood boil"],
              ["Activity", "Sports bar, dominoes, karaoke, cigar lounge, comedy, gaming"],
              ["Competition", "Bowling, pool, darts, go-karts, golf sim, trivia, arcade"],
            ]}
          />
          <Step
            n={3}
            title="Universal formula"
            icon={<Trophy className="h-4 w-4" />}
            rows={[
              ["Food", "Shareable, hands-on"],
              ["Competition", "Something to win"],
              ["Music / sports / comedy", "Reaction-worthy moment"],
              ["Late-night food", "The post-game wrap"],
            ]}
          />
          <Step
            n={4}
            title="Choose the final plan"
            icon={<Pizza className="h-4 w-4" />}
            rows={[
              ["Shared", "Cultural food + competitive activity + music/sports + late-night food"],
              ["Mixed", "Food crawl + competition + playlist rotation + late-night bite"],
            ]}
          />
        </div>

        <div className="mt-4 rounded-xl bg-card p-4 text-xs">
          <p className="font-display text-sm font-bold text-foreground">Example timeline</p>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            <li>
              <strong className="text-foreground">7:00 PM</strong> — Wings, tacos, BBQ, KBBQ, or
              Caribbean
            </li>
            <li>
              <strong className="text-foreground">8:30 PM</strong> — Bowling, pool, darts, arcade,
              or go-karts
            </li>
            <li>
              <strong className="text-foreground">10:00 PM</strong> — Sports bar, comedy show,
              karaoke, or lounge
            </li>
            <li>
              <strong className="text-foreground">11:30 PM</strong> — Late-night pizza, diner,
              tacos, halal cart, or dessert
            </li>
          </ul>
          <p className="mt-3 rounded-md bg-primary/10 px-3 py-2 font-bold text-primary">
            Mixed group? Everyone picks one stop, one song, or one challenge.
          </p>
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
