import { Sparkles, Users, Heart, Wand2, MapPin, Share2 } from "lucide-react";

/**
 * Universal Confetti planning flow — shown across every occasion.
 * Mirrors the master flow in docs/agents/confetti-universal-flow.md.
 *
 * User opens app → Choose occasion → Choose group type → Pick vibe
 *   → App generates plan (food + activity + music + dessert/late-night)
 *   → Save, customize, invite, or post.
 */
export function UniversalPlanFlow() {
  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-display text-sm font-bold">How Confetti builds your plan</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Step
            n={1}
            title="Choose occasion"
            icon={<Heart className="h-4 w-4" />}
            rows={[
              ["Options", "Girls Night / Guys Night / Date Night / Group Hangout"],
            ]}
          />
          <Step
            n={2}
            title="Choose group type"
            icon={<Users className="h-4 w-4" />}
            rows={[
              ["Shared culture", "Lean into one cultural anchor"],
              ["Multiracial", "Two-culture swap"],
              ["Open mix", "Vibe-first, culture-light"],
            ]}
          />
          <Step
            n={3}
            title="Pick a vibe"
            icon={<Wand2 className="h-4 w-4" />}
            rows={[
              ["Choose one", "Chill · Romantic · Turn-up · Foodie · Competitive · Artsy · Budget"],
            ]}
          />
          <Step
            n={4}
            title="Plan generates"
            icon={<MapPin className="h-4 w-4" />}
            rows={[
              ["Shape", "Food + activity + music + dessert/late-night"],
            ]}
          />
          <Step
            n={5}
            title="Save or share"
            icon={<Share2 className="h-4 w-4" />}
            rows={[
              ["Actions", "Save · Customize · Invite · Post"],
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
